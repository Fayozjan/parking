import { prismaContext } from "../../utils/prismaContext.js";
import { VehiclePassesModel } from "../vehiclePasses/vehiclePasses.model.js";
import { VehiclePassesService, saveUploadedPhoto, removeStoredPhoto } from "../vehiclePasses/vehiclePasses.service.js";
import { CameraLogsModel } from "../cameraLogs/cameraLogs.model.js";
import { compressEventPhoto } from "../../utils/photoImage.js";
import { correctPlate, isSamePlate } from "../../utils/plateCorrection.js";
import { NORMAL_MOVEMENT } from "../../utils/passDirection.js";

// УСТАРЕЛО: очередь ожидания (queueOppositeEvent) больше не вызывается — события принимаются все, направление
// определяют данные камеры и AI (utils/passDirection.js, anprVerification.service.js). Здесь остаются isManeuver
// и воркер, который дорабатывает события, поставленные в очередь до перехода.
//
// Совместная работа двух камер ворот (прежняя схема).
//
// Камера смотрит в обе стороны, поэтому событие «не в ту сторону» (movement_direction камеры
// ≠ направление события) раньше просто отбрасывалось. Теперь, если у камеры есть ворота с парной
// камерой противоположного направления, такое событие — кандидат на проезд:
//   • камера входа видит машину уезжающей  → кандидат на exit;
//   • камера выхода видит машину подъезжающей → кандидат на entry.
// Кандидат ждёт coop_window_sec: за это время парная камера могла записать проезд сама.
// Не став дублем, он сохраняется как проезд с inferred = true.
//
// Кандидатом НЕ становится:
//   • манёвр — машина только что проехала у этой же камеры в нормальную сторону
//     (maneuver_window_sec) и теперь сдаёт назад на камеру;
//   • событие, противоречащее истории номера: exit без предшествующего entry
//     или entry для машины, которая уже внутри.

const OPPOSITE = { entry: "exit", exit: "entry" };

export const GateCooperationService = {
  // Машина внутри локации, если последняя фиксация номера — въезд
  isInside: async (locationId, plate) => {
    const last = await VehiclePassesModel.findLastByPlate(locationId, plate);
    return last?.direction === "entry";
  },

  // Парные камеры ворот: активные камеры с противоположным направлением
  findPartnerCameras: async (camera) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.findMany({
      where: {
        gate_id: camera.gate_id,
        status: true,
        direction: OPPOSITE[camera.direction],
        id: { not: camera.id },
      },
      select: { id: true },
    });
  },

  // Машина только что проехала у этой камеры в нормальную сторону — значит сейчас она манёврирует
  isManeuver: async (camera, plate, eventDate) => {
    const windowMs = (camera.gate?.maneuver_window_sec ?? 60) * 1000;
    const recent = await CameraLogsModel.findRecentByCamera(
      camera.id,
      new Date(eventDate.getTime() - windowMs),
      eventDate,
    );
    return recent.some(
      (log) =>
        log.movement_direction === NORMAL_MOVEMENT &&
        isSamePlate(correctPlate(log.license_plate).plate, plate),
    );
  },

  // Событие допустимо по истории номера
  matchesHistory: async (locationId, plate, direction) => {
    const inside = await GateCooperationService.isInside(locationId, plate);
    return direction === "exit" ? inside : !inside;
  },

  // Ставит событие в очередь ожидания. Возвращает { queued, reason }.
  // Вызывается для события, у которого направление движения не совпало с камерой.
  queueOppositeEvent: async ({ camera, plate, eventDate, imageBuffer, cameraLogId, confidence }) => {
    const gate = camera.gate;
    if (!gate?.status || !gate.coop_enabled) return { queued: false, reason: "coop_off" };

    const direction = OPPOSITE[camera.direction];
    if (!direction) return { queued: false, reason: "camera_direction_unknown" };

    const partners = await GateCooperationService.findPartnerCameras(camera);
    if (partners.length === 0) return { queued: false, reason: "no_partner" };

    if (await GateCooperationService.isManeuver(camera, plate, eventDate)) {
      return { queued: false, reason: "maneuver" };
    }
    if (!(await GateCooperationService.matchesHistory(camera.location_id, plate, direction))) {
      return { queued: false, reason: "history" };
    }

    const photo = imageBuffer
      ? await saveUploadedPhoto(await compressEventPhoto(imageBuffer), eventDate, "public")
      : null;

    const prisma = prismaContext.get();
    await prisma.gate_pending_events.create({
      data: {
        gate_id: gate.id,
        camera_id: camera.id,
        location_id: camera.location_id,
        camera_log_id: cameraLogId ?? null,
        plate_number: plate,
        direction,
        event_date: eventDate,
        photo,
        confidence: confidence ?? null,
        due_at: new Date(Date.now() + gate.coop_window_sec * 1000),
      },
    });
    return { queued: true };
  },

  // Решение по одному ожидающему событию: сохранить как проезд или отбросить с причиной
  resolve: async (pending) => {
    const prisma = prismaContext.get();

    const gate = await prisma.gates.findUnique({
      where: { id: pending.gate_id },
      include: { cameras: { select: { id: true, direction: true } } },
    });
    if (!gate?.status || !gate.coop_enabled) return { saved: false, reason: "coop_off" };

    // Парная камера успела записать этот проезд сама
    const partnerIds = gate.cameras
      .filter((c) => c.direction === pending.direction)
      .map((c) => c.id);
    const windowMs = gate.coop_window_sec * 1000;
    const recent = await VehiclePassesModel.findRecentByCameras(
      partnerIds,
      new Date(pending.event_date.getTime() - windowMs),
      new Date(),
    );
    if (recent.some((p) => p.direction === pending.direction && isSamePlate(p.plate_number, pending.plate_number))) {
      return { saved: false, reason: "partner_recorded" };
    }

    // История могла измениться, пока ждали
    if (!(await GateCooperationService.matchesHistory(pending.location_id, pending.plate_number, pending.direction))) {
      return { saved: false, reason: "history" };
    }

    const pass = await VehiclePassesService.createInferredPass({
      cameraId: pending.camera_id,
      plate: pending.plate_number,
      date: pending.event_date,
      direction: pending.direction,
      photo: pending.photo,
      confidence: pending.confidence,
    });
    return { saved: true, pass };
  },

  // Обрабатывает созданные раньше срока ожидающие события. Вызывает воркер.
  processDue: async () => {
    const prisma = prismaContext.get();
    const due = await prisma.gate_pending_events.findMany({
      where: { status: "pending", due_at: { lte: new Date() } },
      orderBy: { due_at: "asc" },
      take: 50,
    });

    for (const pending of due) {
      try {
        const result = await GateCooperationService.resolve(pending);

        await prisma.gate_pending_events.update({
          where: { id: pending.id },
          data: result.saved
            ? { status: "saved" }
            : { status: "dropped", drop_reason: result.reason },
        });

        if (!result.saved) await removeStoredPhoto(pending.photo);

        if (pending.camera_log_id) {
          await CameraLogsModel.update(
            pending.camera_log_id,
            result.saved
              ? { was_processed: true, skip_reason: null, photo: result.pass.photo }
              : { skip_reason: "direction_mismatch" },
          ).catch(console.error);
        }
      } catch (err) {
        // Не оставляем событие в pending навсегда: иначе воркер будет падать на нём каждый тик
        console.error("[GateCooperation] resolve error:", pending.id, err.message);
        await prisma.gate_pending_events
          .update({ where: { id: pending.id }, data: { status: "dropped", drop_reason: "error" } })
          .catch(console.error);
      }
    }
  },
};
