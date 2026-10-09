import { VehiclePassesService } from "../vehiclePasses/vehiclePasses.service.js";
import { AnprCamerasService, DEFAULT_MIN_CONFIDENCE } from "./anprCameras.service.js";
import { CameraLogsModel } from "../cameraLogs/cameraLogs.model.js";
import { parseHikvisionXml } from "../../utils/parseHikvisionEvent.js";
import { isWithinShift } from "../../utils/shift.js";
import { compressEventPhoto, makeThumbnail } from "../../utils/photoImage.js";
import { correctPlate, isSamePlate, DUPLICATE_WINDOW_SEC } from "../../utils/plateCorrection.js";
import { GateCooperationService } from "../gates/gateCooperation.service.js";
import { GateConfirmationService } from "../gates/gateConfirmation.service.js";
import { directionFromMovement, isOppositeMovement } from "../../utils/passDirection.js";
import { isAiEnabled, recognizeFrame } from "../../utils/aiPlate.js";
import { AnprVerificationService } from "./anprVerification.service.js";
import fs from "fs";
import path from "path";

async function saveCameraLogPhoto(imageBuffer, dateTime) {
  if (!imageBuffer) return null;
  const eventDate = dateTime ? new Date(dateTime) : new Date();
  const year = eventDate.getFullYear();
  const month = String(eventDate.getMonth() + 1).padStart(2, "0");
  const uploadsFolder = path.join(process.cwd(), "uploads", "camera-logs", String(year), month);
  await fs.promises.mkdir(uploadsFolder, { recursive: true });
  const fileName = `plate_${Date.now()}.jpg`;
  await fs.promises.writeFile(path.join(uploadsFolder, fileName), imageBuffer);
  return `${year}/${month}/${fileName}`;
}

export const AnprCamerasController = {
  // Получение списка камер с фильтрацией и пагинацией
  getAll: async (req, res) => {
    try {
      const filters =
        typeof req.query.filters === "string"
          ? JSON.parse(req.query.filters)
          : req.query.filters || {};

      const result = await AnprCamerasService.get({
        page: req.query.page,
        pageSize: req.query.pageSize,
        filters,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      console.error("Ошибка при получении камер ворот:", err);
      res.status(500).json({ error: "Ошибка при получении камер ворот" });
    }
  },

  // Получение камеры по ID
  getById: async (req, res) => {
    try {
      const device = await AnprCamerasService.getById(req.params.id);
      if (!device) return res.status(404).json({ error: "Камера не найдена" });
      res.json({ success: true, data: device });
    } catch (err) {
      console.error("Ошибка при получении камеры:", err);
      res.status(500).json({ error: "Ошибка при получении камеры" });
    }
  },

  // Создание новой камеры
  create: async (req, res) => {
    try {
      const device = await AnprCamerasService.create(req.body, req.user?.id);
      res.status(201).json({ success: true, result: device });
    } catch (err) {
      console.error("Ошибка при добавлении камеры:", err);
      if (err.code === "P2002")
        return res
          .status(409)
          .json({ error: "Такое имя или IP уже существует!" });
      res.status(500).json({ error: "Ошибка при добавлении камеры" });
    }
  },

  // Обновление камеры
  update: async (req, res) => {
    const userId = req.user?.id;
    try {
      const device = await AnprCamerasService.update(
        req.params.id,
        req.body,
        userId,
      );
      res.json({ success: true, result: device });
    } catch (err) {
      console.error("Ошибка при обновлении камеры:", err);
      if (err.code === "P2025")
        return res.status(404).json({ error: "Камера не найдена" });
      res.status(500).json({ error: "Ошибка при обновлении камеры" });
    }
  },

  list: async (req, res) => {
    try {
      const prisma = (await import("../../utils/prismaContext.js")).prismaContext.get();
      const cameras = await prisma.anpr_cameras.findMany({
        select: { id: true, name: true, location_id: true },
        orderBy: { name: "asc" },
      });
      res.json({ success: true, data: cameras });
    } catch (err) {
      res.status(500).json({ error: "Ошибка при получении камер" });
    }
  },

  vehicleDetection: async (req, res) => {
    const xmlFile = req.files?.find((f) => f.fieldname === "anpr.xml");
    const imageFile = req.files?.find((f) => f.fieldname === "detectionPicture.jpg");
    const cleanup = async () => {
      for (const f of req.files || []) {
        await fs.promises.unlink(f.path).catch(() => {});
      }
    };

    if (!xmlFile) {
      await cleanup();
      return res.status(400).json({ error: "anpr.xml not found in request" });
    }

    try {
      const xmlContent = await fs.promises.readFile(xmlFile.path, "utf-8");
      const parsed = parseHikvisionXml(xmlContent);
      const { macAddress, dateTime } = parsed;
      let { licensePlate, confidenceLevel, movementDirection } = parsed;
      const cameraMovement = movementDirection; // движение, которое сообщила именно камера, — для сверки с AI после сохранения
      let plateFromAi = false;

      if (!macAddress) {
        await cleanup();
        return res.status(400).json({ error: "Missing macAddress in XML" });
      }

      // Read image before any early returns so we can log the photo for all events
      const imageBuffer = imageFile
        ? await fs.promises.readFile(imageFile.path)
        : null;

      // Камера не прислала номер — достраиваем из AI-сервиса по кадру (иначе нечего сохранять).
      // Направление при этом не ждём: проезд сохраняется по данным камеры, AI уточняет его позже, в фоне.
      let directionFromAi = false;
      if (isAiEnabled() && imageBuffer && !licensePlate) {
        const ai = await recognizeFrame(imageBuffer);
        if (ai?.found && ai.plate) {
          licensePlate = ai.plate;
          confidenceLevel = ai.confidence;
          plateFromAi = true;
          console.log("🤖 AI plate:", licensePlate, "| Confidence:", confidenceLevel);
          if (!movementDirection && ai.movementDirection) {
            movementDirection = ai.movementDirection;
            directionFromAi = true;
          }
        }
      }

      console.log("🚗", licensePlate, "| MAC:", macAddress, "| Time:", dateTime, "| Confidence:", confidenceLevel, "| Move:", movementDirection ?? "unknown");

      if (!licensePlate) {
        await cleanup();
        return res.status(400).json({ error: "Missing licensePlate in XML" });
      }

      const camera = await AnprCamerasService.getByMacAddress(macAddress);
      if (camera) {
        AnprCamerasService.registerActivity(camera).catch(console.error);
      }
      const logBase = {
        mac_address: macAddress,
        license_plate: licensePlate,
        confidence_level: confidenceLevel,
        movement_direction: movementDirection ?? null,
        event_date: dateTime ? new Date(dateTime) : new Date(),
        camera_id: camera?.id ?? null,
        camera_name: camera?.name ?? null,
        location_id: camera?.location_id ?? null,
      };

      // Одно фото на событие. Пропущенное событие фиксации не создаёт,
      // поэтому кладём миниатюру в uploads/camera-logs — журналу её хватает.
      const logSkipped = async (skip_reason) => {
        const photo = await saveCameraLogPhoto(
          await makeThumbnail(imageBuffer),
          dateTime,
        ).catch((err) => {
          console.error("saveCameraLogPhoto error:", err.message);
          return null;
        });
        return CameraLogsModel.create({
          ...logBase,
          photo,
          was_processed: false,
          skip_reason,
        }).catch((err) => {
          console.error(err);
          return null;
        });
      };

      if (!camera) {
        await cleanup();
        console.log("⚠️ Camera not found for MAC:", macAddress, "— skipped");
        await logSkipped("camera_not_found");
        return res.status(200).json({ ok: true, skipped: true, reason: "camera_not_found" });
      }

      // Слой 1: исправляем типичные ошибки OCR и отсекаем дубли одного проезда.
      // В camera_logs остаётся сырой номер камеры, в фиксации — исправленный.
      const fixed = correctPlate(licensePlate);
      if (fixed.corrected) {
        console.log("🔧 Plate corrected:", licensePlate, "→", fixed.plate);
      }

      // Порог задаётся на камере — угол/освещение у каждой свои
      const minConfidence = camera.min_confidence ?? DEFAULT_MIN_CONFIDENCE;

      // События не фильтруются по направлению: принимаем всё. Въезд или выезд определяем по движению транспорта
      // (данные камеры), а после сохранения уточняем по анализу AI (AnprVerificationService).
      const passDirection = directionFromMovement(camera, movementDirection);
      const directionSource = movementDirection ? (directionFromAi ? "ai" : "camera") : "default";

      if (confidenceLevel < minConfidence) {
        await cleanup();
        console.log("⚠️ Low confidence:", confidenceLevel, "<", minConfidence, "| Plate:", licensePlate, "— skipped");
        await logSkipped("low_confidence");
        return res.status(200).json({ ok: true, skipped: true, reason: "low_confidence" });
      }

      // Вне рабочей смены локации фиксации не сохраняем — только лог события
      if (!isWithinShift(camera.location, logBase.event_date)) {
        await cleanup();
        console.log("⚠️ Outside shift:", camera.location?.name, "| Plate:", licensePlate, "— skipped");
        await logSkipped("outside_shift");
        return res.status(200).json({ ok: true, skipped: true, reason: "outside_shift" });
      }

      if (
        await VehiclePassesService.isDuplicateEvent(
          camera.id,
          fixed.plate,
          logBase.event_date,
          DUPLICATE_WINDOW_SEC,
          isSamePlate,
        )
      ) {
        await cleanup();
        console.log("⚠️ Duplicate:", fixed.plate, "— skipped");
        await logSkipped("duplicate");
        return res.status(200).json({ ok: true, skipped: true, reason: "duplicate" });
      }

      // Манёвр: машина только что проехала у этой камеры и теперь сдаёт назад — это не новый проезд
      if (
        isOppositeMovement(movementDirection) &&
        (await GateCooperationService.isManeuver(camera, fixed.plate, logBase.event_date).catch(() => false))
      ) {
        await cleanup();
        console.log("⚠️ Maneuver:", fixed.plate, "| Camera:", camera.name, "— skipped");
        await logSkipped("maneuver");
        return res.status(200).json({ ok: true, skipped: true, reason: "maneuver" });
      }

      // Тот же проезд уже записала другая камера этих ворот (обе видят машину) — не плодим дубль, а подтверждаем им старый
      const gateDuplicate = await GateConfirmationService.findDuplicateAtGate(
        camera,
        fixed.plate,
        passDirection,
        logBase.event_date,
      ).catch(() => null);
      if (gateDuplicate) {
        await GateConfirmationService.confirmSurvivor(gateDuplicate, camera).catch(console.error);
        await cleanup();
        console.log("⚠️ Gate duplicate:", fixed.plate, "— skipped, confirmed pass#" + gateDuplicate.id);
        await logSkipped("duplicate");
        return res.status(200).json({ ok: true, skipped: true, reason: "duplicate" });
      }

      const pass = await VehiclePassesService.createFromDeviceEvent(
        {
          licensePlate: fixed.plate,
          dateTime,
          macAddress,
          tenant: "public",
          confidence: confidenceLevel,
          direction: passDirection,
          directionSource,
        },
        await compressEventPhoto(imageBuffer),
      );

      // Обработанное событие: журнал ссылается на кадр фиксации,
      // второй копии на диске нет.
      const logPromise = CameraLogsModel.create({
        ...logBase,
        photo: pass.photo,
        was_processed: true,
      }).catch((err) => {
        console.error(err);
        return null;
      });

      await cleanup();
      res.status(200).json({ ok: true });

      // После ответа камере: сверка с AI в фоне (номер взят у самой AI — сверять не с чем)
      if (!plateFromAi) {
        AnprVerificationService.enqueue({
          passId: pass.id,
          logPromise,
          camera,
          cameraPlate: fixed.plate,
          cameraConfidence: confidenceLevel,
          cameraMovement,
          imageBuffer,
        });
      }
    } catch (err) {
      await cleanup();
      console.error("vehicleDetection error:", err.message);
      res.status(500).json({ error: err.message });
    }
  },
};
