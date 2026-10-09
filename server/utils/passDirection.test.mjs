// node --test utils/passDirection.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { directionFromMovement, isOppositeMovement, decidePassDirection } from "./passDirection.js";

const entryCam = { direction: "entry" };
const exitCam = { direction: "exit" };
const ai = (movementDirection, sideConfidence) => ({ movementDirection, sideConfidence });

test("своё движение → направление камеры, встречное → обратное", () => {
  assert.equal(directionFromMovement(entryCam, "forward"), "entry");
  assert.equal(directionFromMovement(entryCam, "reverse"), "exit");
  assert.equal(directionFromMovement(exitCam, "forward"), "exit");
  assert.equal(directionFromMovement(exitCam, "reverse"), "entry");
});

test("движение неизвестно → направление камеры; у камеры нет направления → null", () => {
  assert.equal(directionFromMovement(entryCam, null), "entry");
  assert.equal(directionFromMovement({ direction: null }, "forward"), null);
});

test("isOppositeMovement", () => {
  assert.equal(isOppositeMovement("reverse"), true);
  assert.equal(isOppositeMovement("forward"), false);
  assert.equal(isOppositeMovement(null), false);
});

test("голосование: AI уверен и спорит с камерой → решает AI", () => {
  // камера выезда сообщила forward (= выезд), но AI видит зад машины с уверенностью 0.95 → машина въезжает
  const r = decidePassDirection(exitCam, "forward", ai("reverse", 0.95));
  assert.deepEqual(r, { direction: "entry", source: "ai", vote: "ai" });
});

test("голосование: AI неуверен → камера; совпали → camera; никто не знает → default", () => {
  assert.deepEqual(decidePassDirection(exitCam, "forward", ai("reverse", 0.6)), { direction: "exit", source: "camera", vote: "camera" });
  assert.deepEqual(decidePassDirection(entryCam, "forward", ai("forward", 0.9)), { direction: "entry", source: "camera", vote: "agree" });
  assert.deepEqual(decidePassDirection(entryCam, null, null), { direction: "entry", source: "default", vote: "none" });
});

test("камера молчит, AI уверен → AI решает", () => {
  assert.deepEqual(decidePassDirection(entryCam, null, ai("reverse", 0.9)), { direction: "exit", source: "ai", vote: "ai" });
});
