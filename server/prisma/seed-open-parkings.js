import { PrismaClient } from "../prisma-clients/public/index.js";

const prisma = new PrismaClient();

// Парковки "в ожидании" = заезд (entry) без парного выезда (exit).
// Номера с регионом 99 и суффиксом OP не пересекаются с остальными сидами,
// поэтому стек пар entry/exit в FinanceModel.getParkings их не закроет.

const TEST_PHOTOS = [
  "plate_1774434914452.jpg",
  "plate_1774435382172.jpg",
  "plate_1774435397151.jpg",
  "plate_1774435600773.jpg",
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Сколько открытых парковок на локацию (по умолчанию 5)
const PER_LOCATION = Number(process.env.OPEN_PER_LOCATION ?? 5);
// Ограничить конкретными локациями: LOCATION_IDS=1,2,3
const LOCATION_IDS = (process.env.LOCATION_IDS ?? "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);
// Максимальный возраст заезда в минутах (длительность стоянки)
const MAX_AGE_MINUTES = Number(process.env.OPEN_MAX_AGE_MINUTES ?? 480);

function openPlate(seq) {
  const l1 = LETTERS[seq % LETTERS.length];
  const num = String(seq % 1000).padStart(3, "0");
  return `99${l1}${num}OP`;
}

function minutesAgo(minutes) {
  const d = new Date(Date.now() - minutes * 60000);
  d.setMilliseconds(0);
  return d;
}

async function getEntryCamera(location) {
  const cam = await prisma.anpr_cameras.findFirst({
    where: { location_id: location.id, direction: "entry" },
    select: { id: true, name: true },
  });
  if (cam) return cam;

  const created = await prisma.anpr_cameras.create({
    data: {
      name: `Тест Въезд (${location.name ?? location.id})`,
      location_id: location.id,
      camera_ip: `10.99.${Math.floor(location.id / 256) % 256}.${location.id % 256}`,
      direction: "entry",
      movement_direction: "entry",
      status: true,
    },
  });
  console.log(`    ✓ Entry camera created (id=${created.id})`);
  return created;
}

async function run() {
  const locations = await prisma.locations.findMany({
    where: LOCATION_IDS.length ? { id: { in: LOCATION_IDS } } : { status: true },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  if (!locations.length) throw new Error("Локации не найдены. Сначала запусти seed-test-passes.js");

  console.log(`🌱 Сид открытых парковок: ${locations.length} локаций × ${PER_LOCATION} записей`);

  let seq = 0;
  let total = 0;

  for (const location of locations) {
    const cam = await getEntryCamera(location);

    const passes = [];
    for (let i = 0; i < PER_LOCATION; i++) {
      const plate = openPlate(seq++);
      // 5..MAX_AGE_MINUTES минут назад — разная длительность стоянки
      const date = minutesAgo(5 + Math.floor(Math.random() * Math.max(1, MAX_AGE_MINUTES - 5)));
      passes.push({
        location_id: location.id,
        camera_id: cam.id,
        plate_number: plate,
        direction: "entry",
        photo: TEST_PHOTOS[seq % TEST_PHOTOS.length],
        date,
        created_at: date,
      });
    }

    // Подчистить прежние тестовые открытые записи по этим же номерам,
    // чтобы повторный запуск не плодил дубли
    const plates = passes.map((p) => p.plate_number);
    const deleted = await prisma.vehicle_passes.deleteMany({
      where: { location_id: location.id, plate_number: { in: plates } },
    });

    const result = await prisma.vehicle_passes.createMany({ data: passes });
    total += result.count;
    console.log(
      `  ✓ ${location.name ?? location.id} (id=${location.id}): +${result.count} открытых` +
        (deleted.count ? `, удалено старых ${deleted.count}` : "")
    );
  }

  await prisma.$disconnect();
  console.log(`✅ Готово. Открытых парковок создано: ${total}`);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  prisma.$disconnect();
  process.exit(1);
});
