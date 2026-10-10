// Хранилище кадров для дообучения AI: оригинал кадра камеры (без сжатия) + json с мнениями камеры и AI.
//
// Кладём только полезное для обучения:
//   • side_conflict   — камера и AI назвали разную сторону (спереди/сзади);
//   • plate_conflict  — номера разошлись и судьи не смогли решить;
//   • low_confidence  — AI прочитал, но неуверенно (номер или сторона);
//   • ai_missed       — камера номер увидела, AI — нет;
//   • random_control  — случайные согласованные кадры, чтобы выборка не состояла из одних трудных.
// Забирает кадры локальный компьютер: modules/aiTraining (GET /api/ai-training/export) → ai-service/ft.
//
// Раскладка: <AI_TRAINING_DIR>/<YYYY-MM-DD>/<id>.jpg + <id>.json, id = "<мс>_p<id проезда>" (сортируется по времени).
// AI_TRAINING_DIR=off — не сохранять. Файлы автоматически не удаляются.

import fs from "fs";
import path from "path";

export const TRAINING_REASONS = ["side_conflict", "plate_conflict", "low_confidence", "ai_missed", "random_control"];

const num = (raw, fallback) => {
  const n = raw === undefined || raw === "" ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

// env читаем лениво: dotenv может отработать позже, чем загрузится этот модуль
export const trainingDir = () => {
  const dir = process.env.AI_TRAINING_DIR || path.join(process.cwd(), "uploads", "ai-training");
  return dir === "off" ? null : dir;
};
const lowPlateConfidence = () => num(process.env.AI_TRAINING_LOW_CONF, 70); // 0–100, как confidence камеры
const lowSideConfidence = () => num(process.env.AI_TRAINING_LOW_SIDE, 0.7); // 0–1
const randomRate = () => Math.min(num(process.env.AI_TRAINING_RANDOM_RATE, 0.05), 1);
const maxPerDay = () => num(process.env.AI_TRAINING_MAX_PER_DAY, 1000);

/**
 * Почему кадр стоит сохранить (пусто — не сохранять).
 * @param {{ ai: object|null, aiMovement: string|null, cameraMovement: string|null, plate: {conflict?: boolean}, random?: number }} p
 *   ai — ответ recognizeFrame (null — сервис недоступен); random — число 0–1 для отбора контрольных кадров
 */
export function pickTrainingReasons({ ai, aiMovement, cameraMovement, plate, random = Math.random() }) {
  if (ai === null) return []; // AI недоступен — сравнивать не с чем
  const reasons = [];
  if (!ai.found) {
    reasons.push("ai_missed");
  } else {
    if (aiMovement && cameraMovement && aiMovement !== cameraMovement) reasons.push("side_conflict");
    if (ai.confidence < lowPlateConfidence() || ai.sideConfidence < lowSideConfidence()) reasons.push("low_confidence");
  }
  if (plate?.conflict) reasons.push("plate_conflict");
  if (reasons.length === 0 && random < randomRate()) reasons.push("random_control");
  return reasons;
}

// Счётчик за сутки в памяти: защита диска от всплеска (после перезапуска начинается заново)
const perDay = { day: "", count: 0 };

/**
 * @param {Buffer} buffer оригинал кадра камеры
 * @param {object} meta   что сохранить рядом (id и captured_at добавляются)
 * @returns {Promise<string|null>} id кадра или null, если не сохраняли
 */
export async function saveTrainingFrame(buffer, meta) {
  const root = trainingDir();
  if (!root || !buffer) return null;

  const ms = Date.now();
  const day = new Date(ms).toISOString().slice(0, 10);
  if (perDay.day !== day) Object.assign(perDay, { day, count: 0 });
  if (perDay.count >= maxPerDay()) return null;
  perDay.count++;

  const id = `${ms}_p${meta.pass_id ?? 0}`;
  const dir = path.join(root, day);
  await fs.promises.mkdir(dir, { recursive: true });
  // json пишем последним: кадр без json в выгрузку не попадает (см. aiTraining.service), поэтому он не бывает «полуготовым»
  await fs.promises.writeFile(path.join(dir, `${id}.jpg`), buffer);
  await fs.promises.writeFile(
    path.join(dir, `${id}.json`),
    JSON.stringify({ id, captured_at: new Date(ms).toISOString(), ...meta }),
  );
  return id;
}

export const dayOfId = (id) => {
  const ms = Number(String(id).split("_")[0]);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString().slice(0, 10) : "";
};
