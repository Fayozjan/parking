// Демо-данные: ворота, камеры-партнёры и проезды всех типов (командная работа камер, сверка с AI).
//   node prisma/seed-gates-demo.js           — создать (повторный запуск пересоздаёт демо)
//   node prisma/seed-gates-demo.js --clean   — удалить всё демо
//
// Ничего существующего не трогаем: создаются только свои камеры и ворота с пометкой «(демо)» и проезды
// с номерами из DEMO_PLATES. Фото берутся из ai-service/dataset (если есть) и кладутся в uploads/vehicle-passes/demo/.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "../prisma-clients/public/index.js";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, "..");
const PHOTO_DIR = path.join(SERVER_ROOT, "uploads", "vehicle-passes", "demo");
const TAG = "(демо)";
const LOCATION_NAME = "Паркинг Бобур майдони";

// Номера, по которым демо находится и удаляется. Без «01»: в тестовом белом списке есть скрытая запись «01»
// (поиск по вхождению), и такие номера не показываются в списке проездов.
const DEMO_PLATES = [
  "30D111AA", "30D222BB", "30D333CC", "30D444DD", "30D555EE", "30D666FF", "30D688FF", "30D777GG",
  "30D888HH", "30D999II", "50A777XY", "50A771XY", "30D1L0CF",
];

// Номера первой версии скрипта (с «01») — удаляются при пересоздании
const LEGACY_PLATES = ["01D101AA", "01D102BB", "01D103CC", "01D104DD", "01D105EE", "01D106FF", "01D108FF", "01D107GG", "01D108HH", "01D109II", "01D1L0CF"];

const ago = (min) => new Date(Date.now() - min * 60_000);

async function clean() {
  const demoCams = await prisma.anpr_cameras.findMany({ where: { name: { contains: TAG } }, select: { id: true } });
  const camIds = demoCams.map((c) => c.id);
  const logs = await prisma.camera_logs.deleteMany({
    where: { OR: [{ license_plate: { in: [...DEMO_PLATES, ...LEGACY_PLATES] } }, { camera_id: { in: camIds } }] },
  });
  const passes = await prisma.vehicle_passes.deleteMany({
    where: { OR: [{ plate_number: { in: [...DEMO_PLATES, ...LEGACY_PLATES] } }, { camera_id: { in: camIds } }] },
  });
  const cams = await prisma.anpr_cameras.deleteMany({ where: { id: { in: camIds } } });
  const gates = await prisma.gates.deleteMany({ where: { name: { contains: TAG } } });
  await fs.promises.rm(PHOTO_DIR, { recursive: true, force: true });
  console.log(`🧹 Удалено: проездов ${passes.count}, логов ${logs.count}, камер ${cams.count}, ворот ${gates.count}`);
}

// Фото из вашего датасета: спереди и сзади. Нет датасета — проезды без фото.
async function preparePhotos() {
  const dataset = path.resolve(SERVER_ROOT, "..", "ai-service", "dataset");
  const imgDir = path.join(dataset, "prelabeled", "images");
  const sidesFile = path.join(dataset, "labels.json");
  if (!fs.existsSync(imgDir) || !fs.existsSync(sidesFile)) return { front: [], rear: [] };

  const sides = JSON.parse(await fs.promises.readFile(sidesFile, "utf8"));
  const pick = (side, n) =>
    Object.entries(sides)
      .filter(([stem, s]) => s === side && fs.existsSync(path.join(imgDir, `${stem}.jpg`)))
      .slice(0, n)
      .map(([stem]) => stem);

  await fs.promises.mkdir(PHOTO_DIR, { recursive: true });
  const out = { front: [], rear: [] };
  for (const side of ["front", "rear"]) {
    for (const stem of pick(side, 8)) {
      const name = `demo_${side}_${stem}.jpg`;
      await fs.promises.copyFile(path.join(imgDir, `${stem}.jpg`), path.join(PHOTO_DIR, name));
      out[side].push(`demo/${name}`);
    }
  }
  return out;
}

async function seed() {
  const location =
    (await prisma.locations.findFirst({ where: { name: LOCATION_NAME } })) ?? (await prisma.locations.findFirst());
  if (!location) throw new Error("Нет ни одной локации. Сначала node prisma/seed.js");

  await clean();
  const photos = await preparePhotos();
  let photoCounter = { front: 0, rear: 0 };
  const photo = (side) => {
    const list = photos[side];
    return list.length ? list[photoCounter[side]++ % list.length] : null;
  };

  // Территория: две ворот, у каждых камера въезда и выезда
  const mkGate = (name) =>
    prisma.gates.create({ data: { location_id: location.id, name: `${name} ${TAG}`, coop_enabled: true, coop_window_sec: 15, maneuver_window_sec: 60 } });
  const gateA = await mkGate("Главные ворота");
  const gateB = await mkGate("Задние ворота");

  const mkCam = (gate, name, direction, n) =>
    prisma.anpr_cameras.create({
      data: {
        name: `${name} ${TAG}`,
        location_id: location.id,
        gate_id: gate.id,
        camera_ip: `192.168.199.${n}`,
        mac_address: `aa:bb:cc:de:00:0${n % 10}`,
        direction,
        status: true,
      },
    });
  const cam = {
    aIn: await mkCam(gateA, "Въезд А", "entry", 11),
    aOut: await mkCam(gateA, "Выезд А", "exit", 12),
    bIn: await mkCam(gateB, "Въезд Б", "entry", 13),
    bOut: await mkCam(gateB, "Выезд Б", "exit", 14),
  };
  console.log(`✓ Локация «${location.name}»: ворота ${gateA.name}, ${gateB.name}; 4 камеры`);

  // ── сценарии ──
  // Одно событие = проезд (pass) + запись журнала (log). side — какой стороной машина видна на фото.
  const events = [];
  const ev = (e) => events.push(e);

  // 1. «Топ»: въезжающую машину видят обе камеры ворот → одна запись, подтверждена, рейтинг +15
  ev({ plate: "30D111AA", cam: cam.aOut, dir: "entry", min: 300, conf: 80, score: 95, confirmed: true, move: "reverse", side: "rear", ai: { plate: "30D111AA", conf: 94, dirMove: "reverse", cons: "agree", dcons: "agree" } });
  ev({ plate: "30D111AA", cam: cam.aIn, dir: null, min: 300 - 0.03, conf: 91, move: "forward", side: "front", skip: "duplicate" }); // второе событие того же проезда — не дублируем
  ev({ plate: "30D111AA", cam: cam.aOut, dir: "exit", min: 120, conf: 92, score: 92, move: "forward", side: "front", ai: { plate: "30D111AA", conf: 96, dirMove: "forward", cons: "agree", dcons: "agree" } });

  // 2. Камера входа пропустила, въезд записала только камера выхода → «помощь камеры» (inferred)
  ev({ plate: "30D222BB", cam: cam.aOut, dir: "entry", min: 270, conf: 85, score: 85, inferred: true, move: "reverse", side: "rear", ai: { plate: "30D222BB", conf: 90, dirMove: "reverse", cons: "agree", dcons: "agree" } });
  ev({ plate: "30D222BB", cam: cam.aOut, dir: "exit", min: 100, conf: 89, score: 89, move: "forward", side: "front", ai: { plate: "30D222BB", conf: 93, dirMove: "forward", cons: "agree", dcons: "agree" } });

  // 3. Обычный въезд, подтверждённый второй камерой; выезд записала только камера входа (помогла камере выхода)
  ev({ plate: "30D333CC", cam: cam.aIn, dir: "entry", min: 250, conf: 82, score: 97, confirmed: true, move: "forward", side: "front", ai: { plate: "30D333CC", conf: 97, dirMove: "forward", cons: "agree", dcons: "agree" } });
  ev({ plate: "30D333CC", cam: cam.aIn, dir: "exit", min: 90, conf: 84, score: 84, inferred: true, move: "reverse", side: "rear", ai: { plate: "30D333CC", conf: 88, dirMove: "reverse", cons: "agree", dcons: "agree" } });

  // 4. AI исправил направление: камера сообщила «на камеру» (въезд), на кадре машина уезжает (выезд)
  ev({ plate: "30D444DD", cam: cam.aIn, dir: "entry", min: 240, conf: 86, score: 86, move: "forward", side: "front", ai: { plate: "30D444DD", conf: 91, dirMove: "forward", cons: "agree", dcons: "agree" } });
  ev({ plate: "30D444DD", cam: cam.aIn, dir: "exit", min: 80, conf: 90, score: 100, inferred: true, flipped: "entry", move: "forward", side: "rear", ai: { plate: "30D444DD", conf: 95, dirMove: "reverse", cons: "agree", dcons: "ai" } });

  // 5. AI исправил направление, а в истории номера въезда нет → пометка «история: проверить»
  ev({ plate: "30D555EE", cam: cam.aIn, dir: "exit", min: 70, conf: 83, score: 93, inferred: true, flipped: "entry", historyConflict: true, move: "forward", side: "rear", ai: { plate: "30D555EE", conf: 92, dirMove: "reverse", cons: "agree", dcons: "ai" } });

  // 6. AI исправил номер: камера прочитала 50A771XY, AI уверенно прочитал 50A777XY
  ev({ plate: "50A777XY", plateOriginal: "50A771XY", cam: cam.aIn, dir: "entry", min: 60, conf: 95, score: 95, move: "forward", side: "front", ai: { plate: "50A777XY", conf: 95, dirMove: "forward", cons: "ai", dcons: "agree" } });

  // 7. Конфликт номеров: камера и AI прочитали разное, решить не удалось → «номер: проверить»
  ev({ plate: "30D666FF", cam: cam.aIn, dir: "entry", min: 50, conf: 70, score: 70, plateConflict: true, move: "forward", side: "front", ai: { plate: "30D688FF", conf: 75, dirMove: "forward", cons: "conflict", dcons: "agree" } });

  // 8. Повторный въезд (машина уже внутри) → «история: проверить»; сдача назад после проезда — манёвр, не проезд
  ev({ plate: "30D777GG", cam: cam.aIn, dir: "entry", min: 220, conf: 87, score: 87, move: "forward", side: "front", ai: { plate: "30D777GG", conf: 90, dirMove: "forward", cons: "agree", dcons: "agree" } });
  ev({ plate: "30D777GG", cam: cam.aIn, dir: "entry", min: 55, conf: 86, score: 86, historyConflict: true, move: "forward", side: "front", ai: { plate: "30D777GG", conf: 89, dirMove: "forward", cons: "agree", dcons: "agree" } });
  ev({ plate: "30D777GG", cam: cam.aIn, dir: null, min: 54.5, conf: 80, move: "reverse", side: "rear", skip: "maneuver" });

  // 9. Вторые ворота: тот же «топ» — въезд подтверждён обеими камерами, обычный выезд
  ev({ plate: "30D888HH", cam: cam.bIn, dir: "entry", min: 200, conf: 85, score: 100, confirmed: true, move: "forward", side: "front", ai: { plate: "30D888HH", conf: 96, dirMove: "forward", cons: "agree", dcons: "agree" } });
  ev({ plate: "30D888HH", cam: cam.bOut, dir: null, min: 200 - 0.05, conf: 83, move: "reverse", side: "rear", skip: "duplicate" });
  ev({ plate: "30D888HH", cam: cam.bOut, dir: "exit", min: 40, conf: 90, score: 90, move: "forward", side: "front", ai: { plate: "30D888HH", conf: 95, dirMove: "forward", cons: "agree", dcons: "agree" } });

  // 10. Только данные камеры (AI недоступен) и событие с низкой уверенностью
  ev({ plate: "30D999II", cam: cam.aIn, dir: "entry", min: 30, conf: 88, score: 88, move: "forward", side: "front", ai: null });
  ev({ plate: "30D1L0CF", cam: cam.aIn, dir: null, min: 25, conf: 32, move: "forward", side: "front", skip: "low_confidence" });

  let passes = 0;
  let logs = 0;
  for (const e of events.sort((a, b) => b.min - a.min)) {
    const date = ago(e.min);
    const ph = photo(e.side);
    const rawPlate = e.plateOriginal ?? e.plate; // журнал хранит то, что прочитала камера
    let passId = null;

    if (e.dir) {
      const pass = await prisma.vehicle_passes.create({
        data: {
          location_id: location.id,
          camera_id: e.cam.id,
          plate_number: e.plate,
          direction: e.dir,
          date,
          created_at: date,
          photo: ph,
          confidence: e.conf,
          score: e.score ?? e.conf,
          gate_confirmed: Boolean(e.confirmed),
          inferred: Boolean(e.inferred),
          direction_source: e.flipped ? "ai" : "camera",
          direction_original: e.flipped ?? null,
          plate_original: e.plateOriginal ?? null,
          plate_conflict: Boolean(e.plateConflict),
          history_conflict: Boolean(e.historyConflict),
        },
      });
      passId = pass.id;
      passes++;
    }

    await prisma.camera_logs.create({
      data: {
        mac_address: e.cam.mac_address,
        license_plate: rawPlate,
        confidence_level: e.conf,
        movement_direction: e.move,
        event_date: date,
        camera_id: e.cam.id,
        camera_name: e.cam.name,
        location_id: location.id,
        photo: ph,
        was_processed: Boolean(passId),
        skip_reason: e.skip ?? null,
        created_at: date,
        ai_plate: e.ai?.plate ?? null,
        ai_confidence: e.ai?.conf ?? null,
        ai_direction: e.ai?.dirMove ?? null,
        plate_consensus: e.skip ? null : e.ai ? e.ai.cons : "ai_unavailable",
        direction_consensus: e.skip ? null : e.ai ? e.ai.dcons : "none",
      },
    });
    logs++;
  }

  console.log(`✓ Создано: проездов ${passes}, записей журнала ${logs}, фото ${photos.front.length + photos.rear.length}`);
  console.log("\nГде смотреть:");
  console.log("  • Фиксации (проезды) — фильтр по локации «" + location.name + "», метки под номером и значок ✓✓ у рейтинга");
  console.log("  • Журнал камер — столбец «AI»");
  console.log("  • Ворота — две демо-ворот с камерами въезда и выезда");
  console.log("\nУдалить демо: node prisma/seed-gates-demo.js --clean");
}

try {
  if (process.argv.includes("--clean")) await clean();
  else await seed();
} finally {
  await prisma.$disconnect();
}
