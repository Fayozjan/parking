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
//   • история номера: выезд без въезда или повторный въезд помечаются history_conflict (проезд не теряется);
//   • переворот в «выезд» не делается, если машина въехала меньше AI_FLIP_MIN_STAY_SEC секунд назад (по умолчанию 60):
//     так камера выезда, заснявшая только что въехавшую машину сзади, не закрывает проезд (direction_consensus = ai_blocked);
//   • трудные кадры (спор по стороне или номеру, неуверенный AI, пропуск AI + случайная контрольная выборка) сохраняются
//     в оригинале вместе с мнениями камеры и AI — utils/trainingFrames.js, дальше их забирает ai-service/ft (modules/aiTraining).
// Любой сбой здесь только пишется в консоль: проезд уже сохранён.
//
// Telegram-уведомление уходит при создании проезда и уже отправленное исправлено не будет.

import PQueue from "p-queue";
import { recognizeFrame, isAiEnabled } from "../../utils/aiPlate.js";
import { decidePlate, repairPlateByKnown, AI_MIN_PLATE_CONFIDENCE } from "../../utils/plateConsensus.js";
import { isValidPlate } from "../../utils/plateCorrection.js";
import { decidePassDirection } from "../../utils/passDirection.js";
import { pickTrainingReasons, saveTrainingFrame } from "../../utils/trainingFrames.js";
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

// Минимум секунд между въездом и выездом, чтобы AI мог перевернуть проезд в «выезд»; 0 — без ограничения
const flipMinStaySecDefault = () => {
  const raw = process.env.AI_FLIP_MIN_STAY_SEC;
  const n = raw === undefined || raw === "" ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 60;
};

// Машина въехала только что, а её уже «выпускают» — это не выезд, а чужая сторона кадра
const isTooQuickExit = (direction, previous, date, minStaySec) =>
  direction === "exit" &&
  previous?.direction === "entry" &&
  minStaySec > 0 &&
  (new Date(date).getTime() - new Date(previous.date).getTime()) / 1000 < minStaySec;

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
  flipMinStaySec = flipMinStaySecDefault,
  saveFrame = saveTrainingFrame,
  random = Math.random,
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

    let plate = decidePlate({ plate: job.cameraPlate, confidence: job.cameraConfidence }, aiFound, known);

    // Победил номер камеры, но не по формату (потеряла символы): достраиваем до известного номера из БД
    if (plate.plate === job.cameraPlate && !isValidPlate(plate.plate)) {
      const since = new Date(now().getTime() - KNOWN_DAYS * 86_400_000);
      const candidates = await passes.findKnownPlatesContaining(plate.plate, job.passId, since);
      const fixed = repairPlateByKnown(plate.plate, candidates);
      if (fixed) plate = { ...plate, plate: fixed, decision: "known_fix", conflict: false };
    }
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

      // Предыдущая фиксация номера нужна и для защиты от мгновенного «выезда», и для истории — ищем один раз
      let previousLoaded = false;
      let previous = null;
      const getPrevious = async () => {
        if (!previousLoaded) {
          previous = await passes.findPreviousByPlate(pass.location_id, plate.plate, pass.date, pass.id);
          previousLoaded = true;
        }
        return previous;
      };

      // 2) направление: переворачиваем, только если решил AI (камера и AI разошлись, AI уверен)
      let finalDirection = pass.direction;
      if (dir.source === "ai" && dir.direction && dir.direction !== pass.direction && flipEnabled()) {
        if (isTooQuickExit(dir.direction, await getPrevious(), pass.date, flipMinStaySec())) {
          // Въехала секунды назад — «выезд» от AI скорее ошибка стороны кадра: оставляем направление камеры
          logData.direction_consensus = "ai_blocked";
        } else {
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
      }

      // 3) история номера: выезд без въезда или повторный въезд — помечаем, но проезд не теряем
      if (outcome !== "merged" && finalDirection) {
        const inside = (await getPrevious())?.direction === "entry";
        const conflict = finalDirection === "exit" ? !inside : inside;
        if (conflict !== Boolean(pass.history_conflict)) data.history_conflict = conflict;
      }

      if (Object.keys(data).length > 0) await passes.updateById(job.passId, data);
    }

    // Трудный кадр (спор, неуверенный/пропустивший AI) или контрольный — сохраняем оригинал для дообучения
    const reasons = job.imageBuffer
      ? pickTrainingReasons({ ai, aiMovement, cameraMovement: job.cameraMovement, plate, random: random() })
      : [];
    if (reasons.length > 0) {
      await saveFrame(job.imageBuffer, {
        pass_id: job.passId,
        log_id: log?.id ?? null,
        camera_id: job.camera?.id ?? null,
        camera_name: job.camera?.name ?? null,
        location_id: pass?.location_id ?? job.camera?.location_id ?? null,
        reasons,
        camera: {
          plate: job.cameraPlate,
          confidence: job.cameraConfidence,
          movement: job.cameraMovement,
          direction: job.camera?.direction ?? null,
        },
        ai: aiFound
          ? {
              found: true,
              plate: aiFound.plate,
              confidence: aiFound.confidence,
              side: aiFound.side,
              side_confidence: aiFound.sideConfidence,
              plate_format: aiFound.plateFormat,
            }
          : { found: false },
        result: {
          plate: plate.plate,
          plate_decision: plate.decision,
          plate_conflict: Boolean(plate.conflict),
          direction_vote: logData.direction_consensus,
          outcome,
        },
      }).catch((err) => console.error("AI training frame save error:", err.message));
    }

    if (log) {
      await logs.update(
        log.id,
        outcome === "merged" ? { ...logData, was_processed: false, skip_reason: "duplicate" } : logData,
      );
    }

    if (outcome !== "kept" || data.plate_number || data.plate_conflict || logData.direction_consensus === "ai_blocked") {
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
