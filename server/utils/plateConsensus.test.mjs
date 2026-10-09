// node --test utils/plateConsensus.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { decidePlate, decideDirection } from "./plateConsensus.js";

const cam = (plate, confidence) => ({ plate, confidence });
const ai = (plate, confidence) => ({ plate, confidence });

test("совпали → берём, уверенность растёт на бонус", () => {
  const r = decidePlate(cam("50A123BC", 80), ai("50A123BC", 90));
  assert.deepEqual(r, { plate: "50A123BC", confidence: 100, decision: "agree", conflict: false });
  assert.equal(decidePlate(cam("50A123BC", 60), ai("50A123BC", 55)).confidence, 70);
});

test("AI недоступен или не нашёл номер → камера без изменений", () => {
  assert.equal(decidePlate(cam("50A123BC", 80), null).decision, "ai_no_plate");
  assert.equal(decidePlate(cam("50A123BC", 80), ai("", 0)).plate, "50A123BC");
});

test("слабое чтение AI с камерой не спорит", () => {
  const r = decidePlate(cam("50A123BC", 60), ai("50A128BC", 30));
  assert.equal(r.plate, "50A123BC");
  assert.equal(r.decision, "camera");
  assert.equal(r.conflict, false);
});

test("судья 1 — формат: побеждает тот, что по формату", () => {
  const a = decidePlate(cam("A123BC", 90), ai("50A123BC", 70));
  assert.equal(a.plate, "50A123BC");
  assert.equal(a.decision, "ai");
  const b = decidePlate(cam("50A123BC", 70), ai("50A12", 90));
  assert.equal(b.plate, "50A123BC");
  assert.equal(b.decision, "camera");
});

test("судья 2 — известный номер из БД", () => {
  const known = new Set(["50A123BC"]);
  const r1 = decidePlate(cam("50A128BC", 80), ai("50A123BC", 75), known);
  assert.equal(r1.plate, "50A123BC");
  assert.equal(r1.decision, "known");
  const r2 = decidePlate(cam("50A123BC", 70), ai("50A128BC", 75), known);
  assert.equal(r2.plate, "50A123BC");
  assert.equal(r2.decision, "known");
});

test("судья 3 — отрыв по уверенности не меньше 15", () => {
  assert.equal(decidePlate(cam("50A123BC", 60), ai("50A128BC", 90)).plate, "50A128BC");
  assert.equal(decidePlate(cam("50A123BC", 90), ai("50A128BC", 60)).plate, "50A123BC");
});

test("не решить → конфликт: номер камеры, рейтинг минимальный из двух", () => {
  const r = decidePlate(cam("50A123BC", 70), ai("50A128BC", 75));
  assert.deepEqual(r, { plate: "50A123BC", confidence: 70, decision: "conflict", conflict: true });
});

test("зелёный номер (формат C) проходит как валидный", () => {
  const r = decidePlate(cam("01M01791", 90), ai("01M017910", 70));
  assert.equal(r.plate, "01M017910");
  assert.equal(r.decision, "ai");
});

test("направление: совпало / AI уверен / AI неуверен / камера молчит / AI молчит", () => {
  const side = (movementDirection, sideConfidence) => ({ movementDirection, sideConfidence });
  assert.deepEqual(decideDirection("forward", side("forward", 0.9)), { direction: "forward", decision: "agree" });
  assert.deepEqual(decideDirection("forward", side("reverse", 0.85)), { direction: "reverse", decision: "ai" });
  assert.deepEqual(decideDirection("forward", side("reverse", 0.6)), { direction: "forward", decision: "camera" });
  assert.deepEqual(decideDirection(null, side("reverse", 0.6)), { direction: "reverse", decision: "ai" });
  assert.deepEqual(decideDirection("forward", side(null, 0.3)), { direction: "forward", decision: "camera" });
  assert.deepEqual(decideDirection(null, null), { direction: null, decision: "none" });
});
