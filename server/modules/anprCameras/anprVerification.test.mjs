// node --test modules/anprCameras/anprVerification.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createVerifier } from "./anprVerification.service.js";

const camera = { id: 1, direction: "entry", movement_direction: "forward", gate_id: 1 };

// Заглушки: фиксируем, что и куда записали
function setup({ ai, known = [], pass = {}, previous = null, duplicate = null, flip = true }) {
  const calls = { passUpdates: [], logUpdates: [], knownQueries: [], deleted: [], confirmed: [], dupQueries: [] };
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
    passes: {
      findById: async () => passRow,
      updateById: async (id, data) => calls.passUpdates.push({ id, data }),
      deleteById: async (id) => calls.deleted.push(id),
      findPreviousByPlate: async () => previous,
      findKnownPlates: async (plates) => {
        calls.knownQueries.push(plates);
        return new Set(plates.filter((p) => known.includes(p)));
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
