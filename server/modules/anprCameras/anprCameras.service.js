import { AnprCamerasModel } from "./anprCameras.model.js";
import { createAuditLog } from "../../utils/auditLog.js";
import { notificationsOutboxService } from "../notificationsOutbox/notificationsOutbox.service.js";
import { isCameraReachable, fetchCloudStatusMap } from "../../utils/cameraLiveness.js";

// Порог confidence распознавания номера: целое 0–100. Пусто/мусор → DEFAULT_MIN_CONFIDENCE
export const DEFAULT_MIN_CONFIDENCE = 50;

const normalizeConfidence = (value) => {
  if (value === undefined || value === null || value === "") return DEFAULT_MIN_CONFIDENCE;
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_MIN_CONFIDENCE;
  return Math.min(100, Math.max(0, Math.round(num)));
};

// Фильтр по направлению движения транспорта: "forward" (на камеру) / "reverse" (от камеры).
// null = фильтр выключен, в фиксации попадают события в обе стороны.
export const MOVEMENT_DIRECTIONS = ["forward", "reverse"];

const normalizeMovementFilter = (value) =>
  MOVEMENT_DIRECTIONS.includes(value) ? value : null;

export const AnprCamerasService = {
  get: async ({ page, pageSize, filters = {} }) => {
    const currentPage = Math.max(parseInt(page || 1), 1);
    const limit = Math.max(parseInt(pageSize || 50), 1);
    const skip = (currentPage - 1) * limit;

    const { location_id, search, direction, movement_direction, status } = filters;

    let AND = [];
    let OR = [];

    // Поиск по строке
    if (search && search.trim() !== "") {
      const s = search.trim();
      const idNum = Number(s);
      const portNum = Number(s);

      OR.push(
        { name: { contains: s, mode: "insensitive" } },
        { camera_ip: { contains: s, mode: "insensitive" } },
        Number.isInteger(idNum) ? { id: { equals: idNum } } : null,
        Number.isInteger(portNum) ? { port: { equals: portNum } } : null,
      );

      OR = OR.filter(Boolean);
    }

    if (location_id) AND.push({ location_id: Number(location_id) });
    if (direction === "entry" || direction === "exit") AND.push({ direction });
    if (normalizeMovementFilter(movement_direction))
      AND.push({ movement_direction });
    if (status !== undefined && status !== "")
      AND.push({ status: status === "true" });

    const where = {};
    if (AND.length > 0) where.AND = AND;
    if (OR.length > 0) where.OR = OR;

    const [data, total] = await Promise.all([
      AnprCamerasModel.findMany({ where, skip, take: limit }),
      AnprCamerasModel.count(where),
    ]);

    const formattedData = data.map((item) => ({
      id: item.id,
      name: item.name,
      location_id: item.location_id,
      parking_name: item.location?.name || null,
      camera_ip: item.camera_ip,
      mac_address: item.mac_address,
      port: item.port,
      direction: item.direction,
      status: item.status,
      is_local: item.is_local,
      min_confidence: item.min_confidence,
      movement_direction: item.movement_direction,
      is_online: item.is_online,
      added_at: item.added_at,
      updated_at: item.updated_at,
    }));

    return {
      data: formattedData,
      pagination: {
        totalItems: total,
        currentPage,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getActiveCameras: async () => {
    return AnprCamerasModel.findActive();
  },

  getById: async (id) => {
    return AnprCamerasModel.findById(id);
  },

  getByMacAddress: async (mac) => {
    return AnprCamerasModel.findByMacAddress(mac);
  },

  create: async (data, userId) => {
    const { id: _newId, location, location_id, ...rest } = data;

    const result = await AnprCamerasModel.create({
      ...rest,
      port: rest.port ? Number(rest.port) : null,
      // Связь пишем через connect, а не скалярным location_id: скалярная форма есть только
      // в unchecked-варианте input-типа Prisma и отваливается, если клиент его не отдаёт
      location: { connect: { id: Number(location_id) } },
      min_confidence: normalizeConfidence(rest.min_confidence),
      movement_direction: normalizeMovementFilter(rest.movement_direction),
      status: rest.status !== undefined ? (rest.status === true || rest.status === "true") : true,
    });
    await createAuditLog({ userId, action: "create", entity: "anpr_cameras", recordId: result.id, newData: result });
    return result;
  },

  update: async (id, data, userId) => {
    const old = await AnprCamerasModel.findById(id);
    const { id: _removedId, location, port, location_id, status, min_confidence, movement_direction, ...rest } = data;

    const result = await AnprCamerasModel.update(id, {
      ...rest,
      port: port ? Number(port) : null,
      ...(location_id ? { location: { connect: { id: Number(location_id) } } } : {}),
      min_confidence: normalizeConfidence(min_confidence),
      movement_direction: normalizeMovementFilter(movement_direction),
      status: status === true || status === "true",
    });
    await createAuditLog({ userId, action: "update", entity: "anpr_cameras", recordId: id, oldData: old, newData: result });
    return result;
  },

  // Отмечает камеру как активную по входящему событию; если она была офлайн — шлёт уведомление о восстановлении связи
  registerActivity: async (camera) => {
    const wasOffline = camera.is_online === false;
    await AnprCamerasModel.markOnline(camera.id);
    if (wasOffline) {
      await AnprCamerasService.notifyCameraStatus(camera, true);
    }
  },

  // Один проход активной проверки в обе стороны: кандидаты на офлайн (молчат дольше порога) и уже
  // офлайн-камеры (которые без реального проезда авто иначе никогда не подтвердят возврат в сеть).
  // Статус Hik-Connect берётся одним снимком на всю пачку — иначе параллельные запросы по каждой
  // камере бьются в общий accessToken клиента и рейт-лимит API.
  runLivenessCheck: async (thresholdDate) => {
    const [staleCameras, offlineCameras] = await Promise.all([
      AnprCamerasModel.findOnlineStale(thresholdDate),
      AnprCamerasModel.findOffline(),
    ]);

    const needsCloud = [...staleCameras, ...offlineCameras].some((c) => c.serial_number);
    const cloudStatusMap = needsCloud ? await fetchCloudStatusMap() : new Map();

    let offlineCount = 0;
    let recoveredCount = 0;

    await Promise.allSettled(
      staleCameras.map(async (camera) => {
        const reachable = await isCameraReachable(camera, cloudStatusMap);

        if (reachable === true) {
          await AnprCamerasModel.markOnline(camera.id);
        } else if (reachable === false) {
          await AnprCamerasModel.markOffline(camera.id);
          await AnprCamerasService.notifyCameraStatus(camera, false);
          offlineCount++;
        }
        // reachable === null — статус не определён, оставляем как есть до следующей проверки
      }),
    );

    await Promise.allSettled(
      offlineCameras.map(async (camera) => {
        const reachable = await isCameraReachable(camera, cloudStatusMap);

        if (reachable === true) {
          await AnprCamerasModel.markOnline(camera.id);
          await AnprCamerasService.notifyCameraStatus(camera, true);
          recoveredCount++;
        }
        // false или null — камера остаётся офлайн до следующей проверки
      }),
    );

    return { offlineCount, recoveredCount };
  },

  notifyCameraStatus: async (camera, isOnline) => {
    const chats = camera.location?.telegram_chat_ids || [];
    if (chats.length === 0) return;
    const sourceType = isOnline ? "anpr_camera_online" : "anpr_camera_offline";
    await notificationsOutboxService.create(
      sourceType,
      { camera, location: camera.location, date: new Date() },
      chats,
    );
  },
};
