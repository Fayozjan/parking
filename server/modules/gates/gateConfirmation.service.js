import { prismaContext } from "../../utils/prismaContext.js";
import { VehiclePassesModel } from "../vehiclePasses/vehiclePasses.model.js";
import { CameraLogsModel } from "../cameraLogs/cameraLogs.model.js";
import { isSamePlate } from "../../utils/plateCorrection.js";
import { calcPassScore } from "../../utils/passScore.js";

// Подтверждение фиксации второй камерой ворот.
// Если тот же номер в окне coop_window_sec увидела другая камера этих же ворот — фиксация
// достовернее: рейтинг получает бонус (см. utils/passScore.js).

export const GateConfirmationService = {
  // Другие активные камеры тех же ворот (любого направления)
  findGateCameraIds: async (camera) => {
    if (!camera.gate_id) return [];
    const prisma = prismaContext.get();
    const cameras = await prisma.anpr_cameras.findMany({
      where: { gate_id: camera.gate_id, status: true, id: { not: camera.id } },
      select: { id: true },
    });
    return cameras.map((c) => c.id);
  },

  getWindowMs: (camera) => (camera.gate?.coop_window_sec ?? 15) * 1000,

  // Этот же проезд уже зафиксирован одной из камер ворот (включая эту): тот же номер, то же направление,
  // в окне coop_window_sec. Нужен, чтобы при приёме всех событий не плодить дубли, когда машину видят обе камеры.
  findDuplicateAtGate: async (camera, plate, direction, date, excludeId = null) => {
    if (!direction) return null;
    // coop_enabled = false — камеры ворот работают независимо, дубль ищем только у самой камеры
    const partners = camera.gate?.coop_enabled === false ? [] : await GateConfirmationService.findGateCameraIds(camera);
    const ids = [camera.id, ...partners];
    const ms = GateConfirmationService.getWindowMs(camera);
    const recent = await VehiclePassesModel.findRecentByCameras(
      ids,
      new Date(date.getTime() - ms),
      new Date(date.getTime() + ms),
    );
    return (
      recent.find((p) => p.id !== excludeId && p.direction === direction && isSamePlate(p.plate_number, plate)) ?? null
    );
  },

  // Уцелевшая запись подтверждена другой камерой ворот — рейтинг получает бонус
  confirmSurvivor: async (survivor, camera) => {
    if (survivor.camera_id === camera.id || survivor.gate_confirmed) return;
    await VehiclePassesModel.updateById(survivor.id, {
      gate_confirmed: true,
      inferred: false, // проезд подтверждён собственной камерой направления — это уже не «помощь партнёра»
      score: calcPassScore(survivor.confidence, true),
    });
  },

  // Поля confidence / gate_confirmed / score для новой фиксации. Партнёр смотрится по журналу
  // событий: даже не ставшее фиксацией событие второй камеры подтверждает проезд.
  buildScore: async (camera, plate, eventDate, confidence) => {
    let confirmed = false;
    const partnerIds = await GateConfirmationService.findGateCameraIds(camera);
    if (partnerIds.length > 0) {
      const ms = GateConfirmationService.getWindowMs(camera);
      const logs = await CameraLogsModel.findRecentByCameras(
        partnerIds,
        new Date(eventDate.getTime() - ms),
        new Date(eventDate.getTime() + ms),
      );
      confirmed = logs.some((l) => isSamePlate(l.license_plate, plate));
    }
    return {
      confidence: confidence ?? null,
      gate_confirmed: confirmed,
      score: calcPassScore(confidence, confirmed),
    };
  },

  // Обратный случай: вторая камера записала проезд раньше — повышаем рейтинг её фиксации
  confirmPartnerPasses: async (camera, pass) => {
    try {
      const partnerIds = await GateConfirmationService.findGateCameraIds(camera);
      if (partnerIds.length === 0) return;

      const ms = GateConfirmationService.getWindowMs(camera);
      const date = new Date(pass.date);
      const recent = await VehiclePassesModel.findRecentByCameras(
        partnerIds,
        new Date(date.getTime() - ms),
        new Date(date.getTime() + ms),
      );

      const matches = recent.filter((p) => isSamePlate(p.plate_number, pass.plate_number));
      if (matches.length === 0) return;

      // Свою фиксацию тоже подтверждаем: журнал партнёра мог ещё не записаться
      if (!pass.gate_confirmed) {
        await VehiclePassesModel.updateById(pass.id, {
          gate_confirmed: true,
          score: calcPassScore(pass.confidence, true),
        });
      }
      for (const p of matches) {
        if (p.gate_confirmed) continue;
        await VehiclePassesModel.updateById(p.id, {
          gate_confirmed: true,
          score: calcPassScore(p.confidence, true),
        });
      }
    } catch (err) {
      console.error("[GateConfirmation] confirmPartnerPasses error:", err.message);
    }
  },
};
