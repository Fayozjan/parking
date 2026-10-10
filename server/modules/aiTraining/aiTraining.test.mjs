// node --test modules/aiTraining/aiTraining.test.mjs
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import express from "express";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-training-"));
process.env.AI_TRAINING_DIR = dir;
process.env.AI_TRAINING_TOKEN = "secret-token";

const { saveTrainingFrame, pickTrainingReasons } = await import("../../utils/trainingFrames.js");
const { default: routes } = await import("./aiTraining.routes.js");

let server;
let base;
before(async () => {
  const app = express();
  app.use("/api/ai-training", routes);
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/ai-training`;
});
after(() => {
  server.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

const get = (url, token = "secret-token") => fetch(base + url, { headers: token ? { authorization: `Bearer ${token}` } : {} });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test("pickTrainingReasons: причины и контрольная выборка", () => {
  const ok = { found: true, confidence: 95, sideConfidence: 0.95 };
  const base = { ai: ok, aiMovement: "forward", cameraMovement: "forward", plate: {} };
  assert.deepEqual(pickTrainingReasons({ ...base, random: 0.9 }), []);
  assert.deepEqual(pickTrainingReasons({ ...base, random: 0.01 }), ["random_control"]);
  assert.deepEqual(pickTrainingReasons({ ...base, aiMovement: "reverse", random: 0.9 }), ["side_conflict"]);
  assert.deepEqual(pickTrainingReasons({ ...base, ai: { ...ok, confidence: 60 }, random: 0.9 }), ["low_confidence"]);
  assert.deepEqual(pickTrainingReasons({ ...base, plate: { conflict: true }, random: 0.9 }), ["plate_conflict"]);
  assert.deepEqual(pickTrainingReasons({ ...base, ai: { found: false }, random: 0.9 }), ["ai_missed"]);
  assert.deepEqual(pickTrainingReasons({ ...base, ai: null, random: 0 }), []); // AI недоступен
});

test("без токена и с чужим токеном — отказ", async () => {
  assert.equal((await get("/summary", null)).status, 401);
  assert.equal((await get("/summary", "wrong")).status, 401);
});

test("пустое хранилище → 204", async () => {
  const res = await get("/export");
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("x-has-more"), "0");
});

test("кадры сохраняются в оригинале, выгрузка идёт по курсору", async () => {
  const original = Buffer.from("ORIGINAL-JPEG-BYTES-" + "x".repeat(2000));
  const ids = [];
  for (let i = 1; i <= 3; i++) {
    ids.push(await saveTrainingFrame(original, { pass_id: i, reasons: ["side_conflict"] }));
    await sleep(3); // id содержит мс — разводим во времени
  }
  assert.equal(new Set(ids).size, 3);
  const day = new Date().toISOString().slice(0, 10);
  assert.deepEqual(fs.readFileSync(path.join(dir, day, `${ids[0]}.jpg`)), original);

  const summary = await (await get("/summary")).json();
  assert.equal(summary.total, 3);
  assert.equal(summary.days.length, 1);
  assert.equal(summary.days[0].count, 3);
  assert.equal(summary.last_id, ids[2]);

  // plan: что скачается, без скачивания; until делает набор детерминированным
  assert.deepEqual(await (await get("/plan?limit=2")).json(), { count: 2, first_id: ids[0], last_id: ids[1], has_more: true });
  const upTo = await (await get(`/plan?after=${ids[0]}&until=${ids[1]}`)).json();
  assert.deepEqual([upTo.count, upTo.first_id, upTo.last_id, upTo.has_more], [1, ids[1], ids[1], false]);
  assert.equal((await (await get("/plan?from=2000-01-01&to=2000-01-02")).json()).count, 0);
  assert.equal((await (await get(`/plan?from=${day}&to=${day}`)).json()).count, 3);

  // страница 1: два кадра, дальше есть ещё
  const r1 = await get("/export?limit=2");
  assert.equal(r1.status, 200);
  assert.equal(r1.headers.get("x-count"), "2");
  assert.equal(r1.headers.get("x-has-more"), "1");
  assert.equal(r1.headers.get("x-last-id"), ids[1]);
  const zip1 = Buffer.from(await r1.arrayBuffer());
  assert.equal(zip1.subarray(0, 2).toString(), "PK");
  assert.ok(zip1.includes(Buffer.from(`frames/${ids[0]}.jpg`)));
  assert.ok(zip1.includes(Buffer.from(`frames/${ids[1]}.json`)));
  assert.ok(zip1.includes(original), "в архиве оригинал без изменений (store)");
  assert.ok(!zip1.includes(Buffer.from(`frames/${ids[2]}.jpg`)));

  // страница 2: после курсора — только третий
  const r2 = await get(`/export?after=${ids[1]}&limit=2`);
  assert.equal(r2.headers.get("x-count"), "1");
  assert.equal(r2.headers.get("x-has-more"), "0");
  assert.ok(Buffer.from(await r2.arrayBuffer()).includes(Buffer.from(`frames/${ids[2]}.jpg`)));

  // дальше пусто
  assert.equal((await get(`/export?after=${ids[2]}`)).status, 204);
});
