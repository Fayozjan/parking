// Клиент AI-сервиса (ai-service/): номер и сторона транспорта по кадру.
// Выключен, пока не задан AI_SERVICE_URL. Любая ошибка → null: событие камеры обрабатывается как раньше.
// Защита от «зависшего» сервиса: после серии сбоев вызовы приостанавливаются (circuit breaker),
// чтобы события камер не копили таймауты.

// env читаем лениво: dotenv может отработать позже, чем загрузится этот модуль
const serviceUrl = () => (process.env.AI_SERVICE_URL || "").replace(/\/+$/, "");
const timeoutMs = () => Number(process.env.AI_SERVICE_TIMEOUT_MS) || 3000;
// Ниже порога сторону от модели не используем — лучше «неизвестно», чем неверно
const minSideConfidence = () => Number(process.env.AI_MIN_SIDE_CONFIDENCE) || 0.5;

// front — машина видна передом, едет на камеру (forward); rear — задом, от камеры (reverse)
const MOVEMENT_BY_SIDE = { front: "forward", rear: "reverse" };

const BREAKER_FAILS = 5; // подряд сбоев до паузы
const BREAKER_PAUSE_MS = 60_000;
let failStreak = 0;
let pausedUntil = 0;

export const isAiEnabled = () => Boolean(serviceUrl());

/**
 * @returns {Promise<null | { found: false } | {
 *   found: true, plate: string, confidence: number, plateFormat: string|null,
 *   side: "front"|"rear"|null, sideConfidence: number,
 *   movementDirection: "forward"|"reverse"|null
 * }>} null — сервис недоступен/ошибка; { found: false } — сервис ответил, что номера нет.
 * confidence — уверенность OCR номера, целое 0–100 (как confidenceLevel камеры);
 * movementDirection — только если sideConfidence не ниже AI_MIN_SIDE_CONFIDENCE
 */
export async function recognizeFrame(imageBuffer) {
  const url = serviceUrl();
  if (!url || !imageBuffer) return null;
  if (Date.now() < pausedUntil) return null;

  try {
    const form = new FormData();
    form.append("image", new Blob([imageBuffer], { type: "image/jpeg" }), "frame.jpg");

    const res = await fetch(`${url}/recognize`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(timeoutMs()),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    failStreak = 0;
    const data = await res.json();
    if (!data.found) return { found: false };

    const sideConfidence = data.side_confidence ?? 0;
    return {
      found: true,
      plate: data.plate || "",
      confidence: Math.round((data.plate_confidence ?? 0) * 100),
      plateFormat: data.plate_format ?? null,
      side: data.side ?? null,
      sideConfidence,
      movementDirection:
        sideConfidence >= minSideConfidence() ? (MOVEMENT_BY_SIDE[data.side] ?? null) : null,
    };
  } catch (err) {
    console.error("aiPlate error:", err.message);
    if (++failStreak >= BREAKER_FAILS) {
      pausedUntil = Date.now() + BREAKER_PAUSE_MS;
      failStreak = 0;
      console.error(`aiPlate: ${BREAKER_FAILS} сбоев подряд — пауза ${BREAKER_PAUSE_MS / 1000} с`);
    }
    return null;
  }
}
