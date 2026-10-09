// Сверка события камеры с AI ПОСЛЕ сохранения проезда.
//
// Камера получает ответ, и проезд сохраняется по данным камеры — AI путь события не замедляет.
// Затем в фоне кадр уходит в ai-service, камера и AI голосуют (utils/plateConsensus.js, utils/passDirection.js),
// и по результату исправляется уже сохранённая запись:
//   • номер — см. plateConsensus (исходный номер камеры хранится в plate_original);
//   • направление (въезд/выезд) — если AI уверен и спорит с камерой, направление переворачивается
//     (исходное в direction_original, источник direction_source = ai). Выключается AI_DIRECTION_FLIP=false;
//   • после переворота проезд может оказаться дублем записи другой камеры ворот — тогда он удаляется,
//     а уцелевшая запись получает подтверждение (gate_confirmed, бонус к рейтингу);
//   • история номера: выезд без въезда или повторный въезд помечаются history_conflict (проезд не теряется).
// Любой сбой здесь только пишется в консоль: проезд уже сохранён.
//
// Telegram-уведомление уходит при создании проезда и уже отправленное исправлено не будет.

import PQueue from "p-queue";
import { recognizeFrame, isAiEnabled } from "../../utils/aiPlate.js";
import { decidePlate, AI_MIN_PLATE_CONFIDENCE } from "../../utils/plateConsensus.js";
import { decidePassDirection } from "../../utils/passDirection.js";
import { calcPassScore } from "../../utils/passScore.js";
import { VehiclePassesModel } from "../vehiclePasses/vehiclePasses.model.js";
import { CameraLogsModel } from "../cameraLogs/cameraLogs.model.js";
import { GateConfirmationService } from "../gates/gateConfirmation.service.js";

const KNOWN_DAYS = 90; // «известный» номер: проезжал за последние N дней или в белом списке
const CONCURRENCY = 2; // одновременных запросов к AI; CPU-инференс, больше смысла нет
const MAX_PENDING = 100; // при заторе лишнее отбрасываем: сверка — бонус, а не обязанность
const DIRECTION_BY_SIDE = { front: "forward", rear: "reverse" };

// Переворот направления по AI включён по умолчанию; AI_DIRECTION_FLIP=false — только записывать мнение в лог
const flipEnabledDefault = () => process.env.AI_DIRECTION_FLIP !== "false";

/**
 * @param {object} deps  зависимости (для тестов подменяются заглушками)
 */
export function createVerifier({
  recognize = recognizeFrame,
  isEnabled = isAiEnabled,
  passes = VehiclePassesModel,
  logs = CameraLogsModel,
  gate = GateConfirmationService,
  flipEnabled = flipEnabledDefault,
  now = () => new Date(),
} = {}) {
  const queue = new PQueue({ concurrency: CONCURRENCY });

  /**
   * @param {{
   *   passId: number, logPromise: Promise<{id:number}|null>, camera: object,
   *   cameraPlate: string, cameraConfidence: number, cameraMovement: "forward"|"reverse"|null,
   *   imageBuffer: Buffer
   * }} job
   */
  async function verify(job) {
    const ai = await recognize(job.imageBuffer);
    const log = await job.logPromise;
    const pass = await passes.findById(job.passId);
    const aiFound = ai?.found ? ai : null;

    // Судья «известный номер» нужен, только когда номера разошлись и AI не молчит
    let known = new Set();
    if (aiFound?.plate && aiFound.plate !== job.cameraPlate && aiFound.confidence >= AI_MIN_PLATE_CONFIDENCE) {
      const since = new Date(now().getTime() - KNOWN_DAYS * 86_400_000);
      known = await passes.findKnownPlates([job.cameraPlate, aiFound.plate], job.passId, since);
    }

    const plate = decidePlate({ plate: job.cameraPlate, confidence: job.cameraConfidence }, aiFound, known);
    const dir = decidePassDirection(job.camera, job.cameraMovement, aiFound);
    // Для статистики пишем сторону AI как есть, даже если она слабее порога доверия
    const aiMovement = aiFound ? (DIRECTION_BY_SIDE[aiFound.side] ?? null) : null;

    const logData = {
      ai_plate: aiFound?.plate || null,
      ai_confidence: aiFound ? aiFound.confidence : null,
      ai_direction: aiMovement,
      plate_consensus: ai === null ? "ai_unavailable" : plate.decision,
      direction_consensus: dir.vote,
    };

    let outcome = "kept"; // kept | flipped | merged
    const data = {};

    if (pass) {
      // 1) номер
      const plateChanged = plate.plate !== job.cameraPlate;
      if (plateChanged || plate.conflict || plate.confidence !== job.cameraConfidence) {
        data.confidence = plate.confidence;
        data.score = calcPassScore(plate.confidence, pass.gate_confirmed);
        if (plateChanged) Object.assign(data, { plate_number: plate.plate, plate_original: job.cameraPlate });
        if (plate.conflict) data.plate_conflict = true;
      }

      // 2) направление: переворачиваем, только если решил AI (камера и AI разошлись, AI уверен)
      let finalDirection = pass.direction;
      if (dir.source === "ai" && dir.direction && dir.direction !== pass.direction && flipEnabled()) {
        const duplicate = await gate.findDuplicateAtGate(job.camera, plate.plate, dir.direction, pass.date, pass.id);
        if (duplicate) {
          // После переворота это тот же проезд, что уже записала другая камера ворот — оставляем одну запись
          await gate.confirmSurvivor(duplicate, job.camera);
          await passes.deleteById(pass.id);
          outcome = "merged";
          Object.keys(data).forEach((k) => delete data[k]);
        } else {
          Object.assign(data, {
            direction: dir.direction,
            direction_original: pass.direction,
            direction_source: "ai",
            inferred: Boolean(job.camera.direction && dir.direction !== job.camera.direction),
          });
          finalDirection = dir.direction;
          outcome = "flipped";
        }
      }

      // 3) история номера: выезд без въезда или повторный въезд — помечаем, но проезд не теряем
      if (outcome !== "merged" && finalDirection) {
        const previous = await passes.findPreviousByPlate(pass.location_id, plate.plate, pass.date, pass.id);
        const inside = previous?.direction === "entry";
        const conflict = finalDirection === "exit" ? !inside : inside;
        if (conflict !== Boolean(pass.history_conflict)) data.history_conflict = conflict;
      }

      if (Object.keys(data).length > 0) await passes.updateById(job.passId, data);
    }

    if (log) {
      await logs.update(
        log.id,
        outcome === "merged" ? { ...logData, was_processed: false, skip_reason: "duplicate" } : logData,
      );
    }

    if (outcome !== "kept" || data.plate_number || data.plate_conflict) {
      console.log(
        `🤖 AI check pass#${job.passId}: plate ${job.cameraPlate}→${plate.plate} (${plate.decision}),` +
          ` direction ${pass?.direction ?? "-"}→${data.direction ?? (outcome === "merged" ? "merged" : "-")} (${dir.vote})`,
      );
    }
    return { plate, direction: dir, outcome, ai };
  }

  return {
    verify,
    // Ставит сверку в очередь и сразу возвращает управление. Никогда не бросает.
    enqueue(job) {
      if (!isEnabled() || !job.imageBuffer) return;
      if (queue.size >= MAX_PENDING) {
        console.warn("AI verification: очередь переполнена, сверка пропущена для pass#" + job.passId);
        return;
      }
      queue.add(() => verify(job)).catch((err) => console.error("AI verification error:", err.message));
    },
    onIdle: () => queue.onIdle(),
  };
}

export const AnprVerificationService = createVerifier();
