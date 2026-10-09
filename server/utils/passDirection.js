// Въезд или выезд: переводим движение транспорта (forward — на камеру, reverse — от камеры) в направление проезда.
// Чистые функции без БД и сети.
//
// У камеры есть направление (entry/exit). Машина, едущая на камеру (видна передом, forward), — проезд в направлении
// камеры; машина, едущая от камеры (видна задом, reverse), — проезд в обратную сторону:
// камера въезда видит уезжающую машину → выезд, камера выезда видит въезжающую (спиной) → въезд.
// События не фильтруются: камеры ворот работают командой, принимается всё, а въезд/выезд определяют данные камеры и AI.

import { decideDirection } from "./plateConsensus.js";

export const OPPOSITE = { entry: "exit", exit: "entry" };

// Движение, которое соответствует направлению самой камеры
export const NORMAL_MOVEMENT = "forward";

/**
 * @param {{direction: string|null}} camera
 * @param {"forward"|"reverse"|null} movement  null — движение неизвестно
 * @returns {"entry"|"exit"|null} null — у камеры нет направления, определить нечем
 */
export function directionFromMovement(camera, movement) {
  if (!OPPOSITE[camera.direction]) return null;
  if (!movement) return camera.direction; // не знаем движение — считаем проезд «своим» для камеры
  return movement === NORMAL_MOVEMENT ? camera.direction : OPPOSITE[camera.direction];
}

// Событие в обратную сторону относительно камеры (кандидат на манёвр или проезд, пойманный «чужой» камерой ворот)
export const isOppositeMovement = (movement) => Boolean(movement) && movement !== NORMAL_MOVEMENT;

/**
 * Итоговое направление проезда по голосованию камеры и AI.
 * @param {object} camera
 * @param {"forward"|"reverse"|null} cameraMovement  что сообщила камера
 * @param {{movementDirection: string|null, sideConfidence: number}|null} ai
 * @returns {{direction: "entry"|"exit"|null, source: "camera"|"ai"|"default", vote: string}}
 *   source: ai — решил AI, camera — камера (или совпали), default — движение никто не сообщил
 */
export function decidePassDirection(camera, cameraMovement, ai) {
  const vote = decideDirection(cameraMovement ?? null, ai);
  const direction = directionFromMovement(camera, vote.direction);
  const source = vote.decision === "ai" ? "ai" : vote.decision === "none" ? "default" : "camera";
  return { direction, source, vote: vote.decision };
}
