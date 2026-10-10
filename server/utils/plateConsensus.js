// Согласование показаний камеры и AI. Чистые функции — без БД и сети, поэтому легко тестируются.
//
// Номер: голосуют двое (камера, AI), при расхождении решают «судьи» по порядку:
//   1) формат номера; 2) известный номер из БД; 3) отрыв по уверенности; иначе — конфликт.
// Если номер камеры победил, но не по формату (потеряла «50» → S702SS), его правит repairPlateByKnown по известным номерам.
// Направление: камера и AI; при расхождении AI верим, если он уверен.

import { isValidPlate } from "./plateCorrection.js";

export const AGREE_BONUS = 10; // добавка к уверенности, когда камера и AI совпали
export const CONFIDENCE_MARGIN = 15; // насколько один должен быть увереннее другого, чтобы победить
export const AI_MIN_PLATE_CONFIDENCE = 50; // слабее — AI «не спорит», остаётся номер камеры
export const AI_DIRECTION_TRUST = 0.7; // с какой уверенностью сторона AI перевешивает направление камеры

const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)));

/**
 * @param {{plate: string, confidence: number}} camera  номер камеры (уже исправленный correctPlate)
 * @param {{plate: string, confidence: number}|null} ai  null — AI недоступен или не нашёл номер
 * @param {Set<string>} [known]  номера из БД (белый список / недавние проезды) среди кандидатов
 * @returns {{plate: string, confidence: number, decision: string, conflict: boolean}}
 *   decision: agree | camera | ai | known | conflict | ai_no_plate
 */
export function decidePlate(camera, ai, known = new Set()) {
  const camPlate = camera.plate;
  const camConf = camera.confidence ?? 0;
  const keep = (decision, extra = {}) => ({
    plate: camPlate,
    confidence: camConf,
    decision,
    conflict: false,
    ...extra,
  });

  if (!ai || !ai.plate) return keep("ai_no_plate");
  if (ai.plate === camPlate) {
    return keep("agree", { confidence: clamp(Math.max(camConf, ai.confidence) + AGREE_BONUS) });
  }

  // Слабое чтение AI с камерой не спорит. Исключение — камера дала номер не по формату, а AI по формату.
  const aiUsable = ai.confidence >= AI_MIN_PLATE_CONFIDENCE;
  const camValid = isValidPlate(camPlate);
  const aiValid = isValidPlate(ai.plate);
  if (!aiUsable) return keep("camera");

  const takeAi = (decision) => ({ plate: ai.plate, confidence: clamp(ai.confidence), decision, conflict: false });

  // 1) формат
  if (camValid !== aiValid) return aiValid ? takeAi("ai") : keep("camera");

  // 2) известный номер
  const camKnown = known.has(camPlate);
  const aiKnown = known.has(ai.plate);
  if (camKnown !== aiKnown) return aiKnown ? takeAi("known") : keep("known");

  // 3) отрыв по уверенности
  if (Math.abs(camConf - ai.confidence) >= CONFIDENCE_MARGIN) {
    return ai.confidence > camConf ? takeAi("ai") : keep("camera");
  }

  // Не решить: оставляем номер камеры (как было до AI), снижаем рейтинг и просим проверить вручную
  return keep("conflict", { confidence: clamp(Math.min(camConf, ai.confidence)), conflict: true });
}

export const REPAIR_MIN_LENGTH = 5; // короче — под обрывок подойдёт слишком много номеров
export const REPAIR_MAX_MISSING = 3; // сколько символов камера могла потерять

/**
 * Номер не по формату (камера потеряла символы) достраиваем до известного номера из БД.
 * Исправляем только когда подходит ровно один известный номер, иначе угадывать нельзя.
 * @param {string} plate  номер камеры не по формату
 * @param {Iterable<string>} candidates  известные номера, содержащие plate
 * @returns {string|null}  исправленный номер или null — оставить как есть
 */
export function repairPlateByKnown(plate, candidates) {
  if (!plate || plate.length < REPAIR_MIN_LENGTH || isValidPlate(plate)) return null;
  const fits = new Set(
    [...candidates].filter(
      (c) =>
        c !== plate &&
        isValidPlate(c) &&
        c.includes(plate) &&
        c.length - plate.length <= REPAIR_MAX_MISSING,
    ),
  );
  return fits.size === 1 ? [...fits][0] : null;
}

/**
 * @param {"forward"|"reverse"|null} camera
 * @param {{side: string|null, sideConfidence: number, movementDirection: string|null}|null} ai
 * @returns {{direction: "forward"|"reverse"|null, decision: "agree"|"camera"|"ai"|"none"}}
 */
export function decideDirection(camera, ai) {
  const aiDir = ai?.movementDirection ?? null; // уже отфильтровано порогом AI_MIN_SIDE_CONFIDENCE
  if (!aiDir) return { direction: camera ?? null, decision: camera ? "camera" : "none" };
  if (!camera) return { direction: aiDir, decision: "ai" };
  if (camera === aiDir) return { direction: camera, decision: "agree" };
  return ai.sideConfidence >= AI_DIRECTION_TRUST
    ? { direction: aiDir, decision: "ai" }
    : { direction: camera, decision: "camera" };
}
