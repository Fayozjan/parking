// node --test modules/anprCameras/anprVerification.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createVerifier } from "./anprVerification.service.js";

const camera = { id: 1, direction: "entry", movement_direction: "forward", gate_id: 1 };

// Заглушки: фиксируем, что и куда записали
function setup({ ai, known = [], dbPlates = [], pass = {}, previous = null, duplicate = null, flip = true, minStay = 60, random = 1 }) {
  const calls = {
    passUpdates: [],
    logUpdates: [],
    knownQueries: [],
    likeQueries: [],
    deleted: [],
    confirmed: [],
    dupQueries: [],
    hardFrames: [],
  };
  const passRow = {
    id: 7,
    direction: "entry",
    date: new Date("2026-10-09T10:00:00Z"),
    location_id: 1,
    gate_confirmed: false,
    history_conflict: false,
    ...pass,
  };
  const verifier = createVerifier({
    recognize: async () => ai,
    isEnabled: () => true,
    flipEnabled: () => flip,
    flipMinStaySec: () => minStay,
    saveFrame: async (buffer, meta) => calls.hardFrames.push({ buffer, meta }),
    random: () => random,
    passes: {
      findById: async () => passRow,
      updateById: async (id, data) => calls.passUpdates.push({ id, data }),
      deleteById: async (id) => calls.deleted.push(id),
      findPreviousByPlate: async () => previous,
      findKnownPlates: async (plates) => {
        calls.knownQueries.push(plates);
        return new Set(plates.filter((p) => known.includes(p)));
      },
      findKnownPlatesContaining: async (plate) => {
        calls.likeQueries.push(plate);
        return dbPlates.filter((p) => p.includes(plate));
      },
    },
    logs: { update: async (id, data) => calls.logUpdates.push({ id, data }) },
    gate: {
      findDuplicateAtGate: async (...args) => {
        calls.dupQueries.push(args);
        return duplicate;
      },
      confirmSurvivor: async (survivor) => calls.confirmed.push(survivor.id),
    },
  });
  const job = (over = {}) => ({
    passId: 7,
    logPromise: Promise.resolve({ id: 99 }),
    camera,
    cameraPlate: "50A123BC",
    cameraConfidence: 80,
    cameraMovement: "forward",
    imageBuffer: Buffer.from([1]),
    ...over,
  });
  return { verifier, calls, job };
}

const aiOk = (plate, confidence, side = "front", sideConfidence = 0.9) => ({
  found: true,
  plate,
  confidence,
  plateFormat: "A",
  side,
  sideConfidence,
  movementDirection: sideConfidence >= 0.5 ? (side === "front" ? "forward" : "reverse") : null,
});

// ───── номер ─────
test("совпали: рейтинг растёт, номер не меняется", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A123BC", 90) });
  await verifier.verify(job());
  assert.equal(calls.passUpdates.length, 1);
  assert.deepEqual(calls.passUpdates[0].data, { confidence: 100, score: 100 });
  assert.equal(calls.logUpdates[0].data.plate_consensus, "agree");
  assert.equal(calls.knownQueries.length, 0);
});

test("AI уверенно прав: номер исправляется, исходный сохраняется", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A128BC", 95) });
  await verifier.verify(job({ cameraConfidence: 60 }));
  const d = calls.passUpdates[0].data;
  assert.equal(d.plate_number, "50A128BC");
  assert.equal(d.plate_original, "50A123BC");
  assert.equal(d.confidence, 95);
  assert.equal(calls.logUpdates[0].data.plate_consensus, "ai");
});

test("известный номер из БД побеждает даже при меньшей уверенности", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A128BC", 78), known: ["50A123BC"] });
  await verifier.verify(job({ cameraConfidence: 75 }));
  assert.equal(calls.knownQueries.length, 1);
  assert.equal(calls.passUpdates[0]?.data.plate_number, undefined);
  assert.equal(calls.logUpdates[0].data.plate_consensus, "known");
});

test("конфликт: номер камеры остаётся, проезд помечается", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A128BC", 82) });
  await verifier.verify(job({ cameraConfidence: 80 }));
  const d = calls.passUpdates[0].data;
  assert.equal(d.plate_conflict, true);
  assert.equal(d.plate_number, undefined);
  assert.equal(calls.logUpdates[0].data.plate_consensus, "conflict");
});

test("камера выиграла, но номер не по формату: достраиваем до единственного известного", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("S702SS", 60), dbPlates: ["50S702SS"] });
  await verifier.verify(job({ cameraPlate: "S702SS", cameraConfidence: 80 }));
  const d = calls.passUpdates[0].data;
  assert.equal(d.plate_number, "50S702SS");
  assert.equal(d.plate_original, "S702SS");
  assert.equal(calls.logUpdates[0].data.plate_consensus, "known_fix");
});

test("номер не по формату, подходят два известных: не угадываем", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("S702SS", 60), dbPlates: ["50S702SS", "01S702SS"] });
  await verifier.verify(job({ cameraPlate: "S702SS", cameraConfidence: 80 }));
  assert.equal(calls.passUpdates[0]?.data.plate_number, undefined);
});

test("номер по формату: поиск по БД не нужен", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A123BC", 90) });
  await verifier.verify(job());
  assert.equal(calls.likeQueries.length, 0);
});

test("AI недоступен / не нашёл номер: проезд не трогаем", async () => {
  const a = setup({ ai: null });
  await a.verifier.verify(a.job());
  assert.equal(a.calls.passUpdates.length, 0);
  assert.equal(a.calls.logUpdates[0].data.plate_consensus, "ai_unavailable");
  const b = setup({ ai: { found: false } });
  await b.verifier.verify(b.job());
  assert.equal(b.calls.passUpdates.length, 0);
  assert.equal(b.calls.logUpdates[0].data.plate_consensus, "ai_no_plate");
});

test("лог не создался (null): проезд всё равно исправляется", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A128BC", 95) });
  await verifier.verify(job({ logPromise: Promise.resolve(null), cameraConfidence: 60 }));
  assert.equal(calls.logUpdates.length, 0);
  assert.equal(calls.passUpdates[0].data.plate_number, "50A128BC");
});

// ───── направление ─────
test("AI уверен, что машина уезжает, хотя камера въезда сообщила «на камеру» → переворот в выезд", async () => {
  const { verifier, calls, job } = setup({
    ai: aiOk("50A123BC", 90, "rear", 0.95),
    previous: { direction: "entry" }, // машина была внутри — выезд логичен
  });
  const r = await verifier.verify(job({ cameraMovement: "forward" }));
  assert.equal(r.outcome, "flipped");
  const d = calls.passUpdates.find((u) => u.data.direction).data;
  assert.equal(d.direction, "exit");
  assert.equal(d.direction_original, "entry");
  assert.equal(d.direction_source, "ai");
  assert.equal(d.inferred, true); // камера въезда записала выезд — помогла партнёру по воротам
  assert.equal(d.history_conflict, undefined); // выезд после въезда — конфликта нет
  assert.equal(calls.logUpdates[0].data.direction_consensus, "ai");
  assert.equal(calls.logUpdates[0].data.ai_direction, "reverse");
});

test("AI_DIRECTION_FLIP=false: направление не меняется, мнение AI только в логе", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A123BC", 90, "rear", 0.95), flip: false });
  const r = await verifier.verify(job());
  assert.equal(r.outcome, "kept");
  assert.ok(!calls.passUpdates.some((u) => u.data.direction));
  assert.equal(calls.logUpdates[0].data.direction_consensus, "ai");
});

test("AI неуверен (0.6): направление остаётся камеры", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A123BC", 90, "rear", 0.6) });
  const r = await verifier.verify(job());
  assert.equal(r.outcome, "kept");
  assert.ok(!calls.passUpdates.some((u) => u.data.direction));
  assert.equal(calls.logUpdates[0].data.direction_consensus, "camera");
});

test("после переворота это дубль записи другой камеры → проезд удаляется, уцелевший подтверждается", async () => {
  const { verifier, calls, job } = setup({
    ai: aiOk("50A123BC", 90, "rear", 0.95),
    duplicate: { id: 55, camera_id: 2, gate_confirmed: false, confidence: 90 },
  });
  const r = await verifier.verify(job({ cameraConfidence: 80 }));
  assert.equal(r.outcome, "merged");
  assert.deepEqual(calls.deleted, [7]);
  assert.deepEqual(calls.confirmed, [55]);
  assert.equal(calls.passUpdates.length, 0); // удалённую запись не обновляем
  assert.equal(calls.logUpdates[0].data.skip_reason, "duplicate");
  assert.equal(calls.logUpdates[0].data.was_processed, false);
  // дубль искали по итоговому направлению (exit), а не по сохранённому
  assert.equal(calls.dupQueries[0][2], "exit");
  assert.equal(calls.dupQueries[0][4], 7); // сама запись исключена из поиска
});

test("въехала 22 с назад, AI «выпускает» → переворот не делается, направление камеры остаётся", async () => {
  const { verifier, calls, job } = setup({
    ai: aiOk("50A123BC", 90, "rear", 0.95),
    previous: { direction: "entry", date: new Date("2026-10-09T09:59:38Z") }, // pass.date = 10:00:00Z
  });
  const r = await verifier.verify(job());
  assert.equal(r.outcome, "kept");
  assert.ok(!calls.passUpdates.some((u) => u.data.direction));
  assert.equal(calls.dupQueries.length, 0);
  assert.equal(calls.logUpdates[0].data.direction_consensus, "ai_blocked");
  // остаётся въезд при уже въехавшей машине — виден на странице конфликтов истории
  assert.equal(calls.passUpdates.find((u) => "history_conflict" in u.data).data.history_conflict, true);
});

test("въезд был давно (5 мин назад) → переворот в выезд работает как раньше", async () => {
  const { verifier, job } = setup({
    ai: aiOk("50A123BC", 90, "rear", 0.95),
    previous: { direction: "entry", date: new Date("2026-10-09T09:55:00Z") },
  });
  assert.equal((await verifier.verify(job())).outcome, "flipped");
});

test("минимальный интервал 0 — защита выключена", async () => {
  const { verifier, job } = setup({
    ai: aiOk("50A123BC", 90, "rear", 0.95),
    previous: { direction: "entry", date: new Date("2026-10-09T09:59:55Z") },
    minStay: 0,
  });
  assert.equal((await verifier.verify(job())).outcome, "flipped");
});

// ───── спорные кадры → датасет ─────
test("камера и AI назвали разную сторону → кадр уходит в датасет", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A123BC", 90, "rear", 0.6) }); // AI неуверен, но мнение есть
  await verifier.verify(job({ cameraMovement: "forward" }));
  assert.equal(calls.hardFrames.length, 1);
  const { buffer, meta } = calls.hardFrames[0];
  assert.deepEqual(buffer, Buffer.from([1])); // оригинал кадра, не сжатый
  assert.deepEqual(meta.reasons, ["side_conflict", "low_confidence"]);
  assert.equal(meta.pass_id, 7);
  assert.equal(meta.camera.movement, "forward");
  assert.equal(meta.ai.side, "rear");
  assert.equal(meta.ai.side_confidence, 0.6);
  assert.equal(meta.camera.plate, "50A123BC");
});

test("AI неуверен в номере → low_confidence; пропустил номер → ai_missed", async () => {
  const a = setup({ ai: aiOk("50A123BC", 55, "front", 0.9) });
  await a.verifier.verify(a.job());
  assert.deepEqual(a.calls.hardFrames[0].meta.reasons, ["low_confidence"]);
  const b = setup({ ai: { found: false } });
  await b.verifier.verify(b.job());
  assert.deepEqual(b.calls.hardFrames[0].meta.reasons, ["ai_missed"]);
  assert.deepEqual(b.calls.hardFrames[0].meta.ai, { found: false });
});

test("номера разошлись без судьи → plate_conflict, в meta результат сверки", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A128BC", 82) });
  await verifier.verify(job({ cameraConfidence: 80 }));
  const meta = calls.hardFrames[0].meta;
  assert.deepEqual(meta.reasons, ["plate_conflict"]);
  assert.equal(meta.camera.plate, "50A123BC");
  assert.equal(meta.ai.plate, "50A128BC");
  assert.equal(meta.result.plate_decision, "conflict");
});

test("всё согласовано: контрольный кадр попадает по случайной выборке", async () => {
  const hit = setup({ ai: aiOk("50A123BC", 90, "front", 0.9), random: 0.01 });
  await hit.verifier.verify(hit.job());
  assert.deepEqual(hit.calls.hardFrames[0].meta.reasons, ["random_control"]);
  const miss = setup({ ai: aiOk("50A123BC", 90, "front", 0.9), random: 0.9 });
  await miss.verifier.verify(miss.job());
  assert.equal(miss.calls.hardFrames.length, 0);
});

test("AI недоступен → кадр не сохраняем (сравнивать не с чем)", async () => {
  const { verifier, calls, job } = setup({ ai: null, random: 0 });
  await verifier.verify(job());
  assert.equal(calls.hardFrames.length, 0);
});

test("камера и AI согласны или камера молчит → кадр в датасет не кладём", async () => {
  const a = setup({ ai: aiOk("50A123BC", 90, "front", 0.9) });
  await a.verifier.verify(a.job());
  const b = setup({ ai: aiOk("50A123BC", 90, "rear", 0.9) });
  await b.verifier.verify(b.job({ cameraMovement: null }));
  assert.equal(a.calls.hardFrames.length + b.calls.hardFrames.length, 0);
});

test("камера не сообщила движение, AI молчит: ничего не меняем", async () => {
  const { verifier, calls, job } = setup({ ai: null });
  const r = await verifier.verify(job({ cameraMovement: null }));
  assert.equal(r.outcome, "kept");
  assert.equal(calls.deleted.length, 0);
});

// ───── история ─────
test("выезд без въезда в истории → history_conflict", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A123BC", 90, "rear", 0.95), previous: null });
  await verifier.verify(job());
  const d = calls.passUpdates.find((u) => u.data.direction).data;
  assert.equal(d.direction, "exit");
  assert.equal(d.history_conflict, true);
});

test("повторный въезд (машина уже внутри) → history_conflict", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A123BC", 90, "front", 0.9), previous: { direction: "entry" } });
  await verifier.verify(job());
  assert.equal(calls.passUpdates.find((u) => "history_conflict" in u.data).data.history_conflict, true);
});

test("обычный въезд (снаружи) и снятие старой пометки", async () => {
  const a = setup({ ai: aiOk("50A123BC", 90, "front", 0.9), previous: { direction: "exit" } });
  await a.verifier.verify(a.job());
  assert.ok(!a.calls.passUpdates.some((u) => "history_conflict" in u.data));
  const b = setup({
    ai: aiOk("50A123BC", 90, "front", 0.9),
    previous: { direction: "exit" },
    pass: { history_conflict: true },
  });
  await b.verifier.verify(b.job());
  assert.equal(b.calls.passUpdates.find((u) => "history_conflict" in u.data).data.history_conflict, false);
});

test("enqueue не бросает и ничего не делает без кадра", async () => {
  const { verifier, calls, job } = setup({ ai: aiOk("50A123BC", 90) });
  verifier.enqueue(job({ imageBuffer: null }));
  await verifier.onIdle();
  assert.equal(calls.logUpdates.length, 0);
  verifier.enqueue(job());
  await verifier.onIdle();
  assert.equal(calls.logUpdates.length, 1);
});
