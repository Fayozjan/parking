import { AnprCamerasModel } from "../anprCameras/anprCameras.model.js";
import { UserModel } from "../users/users.model.js";
import { VehiclePassesModel } from "./vehiclePasses.model.js";
import { buildHiddenPlateExclusion, findMatchingEntry } from "../vehicleWhitelist/vehicleWhitelist.service.js";
import { prismaContext } from "../../utils/prismaContext.js";
import path from "path";
import fs from "fs";
import { compressEventPhoto } from "../../utils/photoImage.js";
import { fileURLToPath } from "url";
import { notificationsOutboxService } from "../notificationsOutbox/notificationsOutbox.service.js";
import { createAuditLog } from "../../utils/auditLog.js";
import { parseTashkentDateTime } from "../../utils/date.js";
import { GateConfirmationService } from "../gates/gateConfirmation.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatDates(records) {
  return records.map((r) => ({
    ...r,
    date: new Date(r.date).toLocaleString("ru-RU", {
      timeZone: "Asia/Tashkent",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  }));
}

function mapVehiclePass(record) {
  return {
    id: record.id,
    branch_id: record.branch_id,
    branch_name: record.branch?.name || null,

    location_id: record.location_id,
    location_name: record.location?.name || null,

    camera_id: record.camera_id,
    camera_name: record.camera?.name || null,

    plate_number: record.plate_number,
    direction: record.direction,
    photo: record.photo,
    date: record.date,
    created_at: record.created_at,

    confidence: record.confidence ?? null,
    gate_confirmed: record.gate_confirmed ?? false,
    score: record.score ?? null,

    // Командная работа камер ворот и сверка с AI (см. ai-service/README.md)
    inferred: record.inferred ?? false, // камера записала проезд против своего направления — помогла партнёру
    direction_source: record.direction_source ?? null, // camera | ai | default
    direction_original: record.direction_original ?? null, // направление до исправления по AI
    plate_original: record.plate_original ?? null, // номер камеры до исправления по AI
    plate_conflict: record.plate_conflict ?? false, // камера и AI прочитали разные номера
    history_conflict: record.history_conflict ?? false, // выезд без въезда / повторный въезд
  };
}

export async function saveUploadedPhoto(imageBuffer, dateTime, tenant) {
  if (!imageBuffer) return null;

  const eventDate = dateTime ? new Date(dateTime) : new Date();
  const year = eventDate.getFullYear();
  const month = String(eventDate.getMonth() + 1).padStart(2, "0");

  const serverRoot = path.resolve(__dirname, "../..");
  const uploadsFolder = path.join(
    serverRoot,
    "uploads",
    "vehicle-passes",
    tenant,
    String(year),
    month,
  );
  await fs.promises.mkdir(uploadsFolder, { recursive: true });

  const fileName = `plate_${Date.now()}.jpg`;
  const finalPath = path.join(uploadsFolder, fileName);

  await fs.promises.writeFile(finalPath, imageBuffer);

  // Возвращаем относительный путь для хранения в БД
  return path.join(tenant, String(year), month, fileName).replace(/\\/g, "/");
}

const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

const MAX_BULK_COUNT = 5000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

async function assertLocationExists(location_id) {
  const prisma = prismaContext.get();
  const location = await prisma.locations.findUnique({
    where: { id: location_id },
  });
  if (!location) throw badRequest("Локация не найдена");
}

// jpg, как и снимки с камер
async function storePhoto(imageBuffer, date) {
  return saveUploadedPhoto(await compressEventPhoto(imageBuffer), date, "public");
}

// удаляем файл только внутри uploads/vehicle-passes
export async function removeStoredPhoto(relativePath) {
  if (!relativePath) return;

  const uploadsRoot = path.resolve(__dirname, "../..", "uploads", "vehicle-passes");
  const filePath = path.resolve(uploadsRoot, relativePath);

  if (!filePath.startsWith(uploadsRoot + path.sep)) return;

  // на этот же файл ссылается журнал камер — второй копии нет, файл оставляем
  const prisma = prismaContext.get();
  const usedByLog = await prisma.camera_logs.count({
    where: { photo: relativePath },
  });
  if (usedByLog > 0) return;

  await fs.promises.unlink(filePath).catch(() => {});
}

// Уведомление в Telegram о новой фиксации (пропускаем номера из белого списка)
async function notifyAnprPass(camera, pass, licensePlate) {
  const chats = camera.location?.telegram_chat_ids || [];
  if (chats.length === 0) return;

  const whitelistMatch = await findMatchingEntry(licensePlate, camera.location_id);
  if (!whitelistMatch) {
    await notificationsOutboxService.create("anpr_pass", pass, chats);
  }
}

export const VehiclePassesService = {
  createManual: async (payload, userId, imageBuffer = null) => {
    const plate_number = String(payload.plate_number ?? "").trim().toUpperCase();
    if (!plate_number) throw badRequest("Не указан номер транспорта");

    const location_id = Number(payload.location_id);
    if (!location_id) throw badRequest("Не указана локация");

    const direction = payload.direction || null;
    if (direction && !["entry", "exit"].includes(direction)) {
      throw badRequest("Неверное направление");
    }

    const date = payload.date ? parseTashkentDateTime(payload.date) : new Date();
    if (Number.isNaN(date.getTime())) throw badRequest("Неверная дата");

    await assertLocationExists(location_id);

    const photo = imageBuffer ? await storePhoto(imageBuffer, date) : null;

    const created = await VehiclePassesModel.create({
      date,
      plate_number,
      direction,
      photo,
      location_id,
      camera_id: null,
    });

    await createAuditLog({
      userId,
      action: "create",
      entity: "vehicle_passes",
      recordId: created.id,
      newData: created,
    });

    return created;
  },

  // Массовое добавление: номера берём из истории локации, время — случайно
  // внутри выбранного диапазона часов, направление всегда exit, фото нет.
  createBulk: async (payload, userId) => {
    const location_id = Number(payload.location_id);
    if (!location_id) throw badRequest("Не указана локация");

    const count = Number(payload.count);
    if (!Number.isInteger(count) || count < 1) {
      throw badRequest("Некорректное количество фиксаций");
    }
    if (count > MAX_BULK_COUNT) {
      throw badRequest(`Максимум ${MAX_BULK_COUNT} фиксаций за раз`);
    }

    const day = String(payload.date ?? "").trim();
    if (!DATE_RE.test(day)) throw badRequest("Неверная дата");

    const timeFrom = String(payload.time_from ?? "00:00").trim();
    const timeTo = String(payload.time_to ?? "23:59").trim();
    if (!TIME_RE.test(timeFrom) || !TIME_RE.test(timeTo)) {
      throw badRequest("Неверное время");
    }

    const from = parseTashkentDateTime(`${day}T${timeFrom}`);
    const to = parseTashkentDateTime(`${day}T${timeTo}`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw badRequest("Неверная дата");
    }
    if (to.getTime() <= from.getTime()) {
      throw badRequest("Время окончания должно быть позже начала");
    }

    await assertLocationExists(location_id);

    // скрытые номера из белого списка в выборку не берём
    const hiddenExclusion = await buildHiddenPlateExclusion(location_id);
    const plates = await VehiclePassesModel.findPlatesByLocation(
      location_id,
      hiddenExclusion,
    );
    if (!plates.length) {
      throw badRequest("У локации нет истории номеров — нечего добавлять");
    }

    const spanMs = to.getTime() - from.getTime();

    const rows = Array.from({ length: count }, () => ({
      location_id,
      camera_id: null,
      plate_number: plates[Math.floor(Math.random() * plates.length)],
      direction: "exit",
      photo: null,
      date: new Date(from.getTime() + Math.floor(Math.random() * (spanMs + 1))),
    })).sort((a, b) => a.date - b.date);

    await VehiclePassesModel.createMany(rows);

    await createAuditLog({
      userId,
      action: "create",
      entity: "vehicle_passes",
      newData: {
        bulk: true,
        count,
        location_id,
        direction: "exit",
        date_from: from,
        date_to: to,
        plates_pool: plates.length,
      },
    });

    return { created: count, plates: plates.length };
  },

  get: async ({ userId, page, pageSize, filters = {} }) => {
    const {
      start_date,
      end_date,
      branch_id,
      direction,
      selectedLocationIds,
      search,
      history_conflict,
    } = filters;

    // --- пользователь и скрытые номера белого списка — независимые запросы ---
    const [user, hiddenExclusion] = await Promise.all([
      UserModel.getById(Number(userId)),
      buildHiddenPlateExclusion(),
    ]);
    if (!user) throw new Error("Пользователь не найден");

    // --- access фильтр ---
    const accessWhere = {};
    if (user.access_level === "branch" && user.branch_access?.length) {
      accessWhere.branch_id = { in: user.branch_access };
    } else if (
      user.access_level === "department" &&
      user.department_access?.length
    ) {
      accessWhere.branch_id = { in: user.department_access };
    }

    // --- формируем условия запроса ---
    const where = { ...accessWhere, ...hiddenExclusion };

    // Дата
    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date.gte = new Date(start_date);
      if (end_date) where.date.lte = new Date(end_date);
    }

    // Фильтр по филиалу
    if (branch_id) where.branch_id = Number(branch_id);

    // Фильтр по направлению
    if (direction) where.direction = direction;

    // Фильтр по воротам
    if (selectedLocationIds?.length) {
      where.location_id = {
        in: selectedLocationIds.map(Number),
      };
    }

    // Только проезды с конфликтом истории номера (страница «Конфликты истории»)
    if (history_conflict === true || history_conflict === "true") {
      where.history_conflict = true;
    }

    // Поиск по номеру транспорта
    if (search) {
      where.plate_number = { contains: search, mode: "insensitive" };
    }

    // --- пагинация ---
    const currentPage = Math.max(parseInt(page) || 1, 1);
    // потолок = максимум в селекторе «на стр.» на клиенте
    const size = Math.min(Math.max(parseInt(pageSize) || 50, 1), 500);
    const skip = (currentPage - 1) * size;

    const prisma = prismaContext.get();
    const { direction: _dir, ...whereForStats } = where;

    // въезды/выезды одним запросом вместо двух count
    const [{ records, total }, byDirection] = await Promise.all([
      VehiclePassesModel.find({ where, skip, take: size }),
      prisma.vehicle_passes.groupBy({
        by: ["direction"],
        where: whereForStats,
        _count: { _all: true },
      }),
    ]);
    const countOf = (dir) =>
      byDirection.find((r) => r.direction === dir)?._count._all ?? 0;
    const totalEntries = countOf("entry");
    const totalExits = countOf("exit");

    return {
      data: formatDates(records.map(mapVehiclePass)),
      pagination: {
        totalItems: total,
        totalEntries,
        totalExits,
        currentPage,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
    };
  },

  getAll: async ({ userId, filters = {} }) => {
    const {
      start_date,
      end_date,
      branch_id,
      direction,
      selectedLocationIds,
      search,
    } = filters;

    // --- получаем пользователя ---
    const user = await UserModel.getById(Number(userId));
    if (!user) throw new Error("Пользователь не найден");

    // --- access фильтр ---
    const accessWhere = {};
    if (user.access_level === "branch" && user.branch_access?.length) {
      accessWhere.branch_id = { in: user.branch_access };
    } else if (
      user.access_level === "department" &&
      user.department_access?.length
    ) {
      accessWhere.branch_id = { in: user.department_access };
    }

    // --- исключить скрытые номера из белого списка ---
    const hiddenExclusion = await buildHiddenPlateExclusion();

    const where = { ...accessWhere, ...hiddenExclusion };

    // Дата
    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date.gte = new Date(start_date);
      if (end_date) where.date.lte = new Date(end_date);
    }

    // Фильтр по филиалу
    if (branch_id) where.branch_id = Number(branch_id);

    // Фильтр по направлению
    if (direction) where.direction = direction;

    // Фильтр по локациям
    if (selectedLocationIds?.length) {
      where.location_id = { in: selectedLocationIds.map(Number) };
    }

    // Поиск по номеру транспорта
    if (search) {
      where.plate_number = { contains: search, mode: "insensitive" };
    }

    const { records } = await VehiclePassesModel.find({ where });

    return formatDates(records.map(mapVehiclePass));
  },

  getById: async (id) => {
    const record = await VehiclePassesModel.findById(id);
    if (!record) return null;

    return {
      id: record.id,
      plate_number: record.plate_number,
      direction: record.direction,
      location_id: record.location_id,
      location_name: record.location?.name ?? null,
      camera_id: record.camera_id,
      photo: record.photo,
      date: record.date,
      created_at: record.created_at,
    };
  },

  // Частичное обновление: меняем только переданные поля
  updateById: async (id, payload, userId, imageBuffer = null) => {
    const prisma = prismaContext.get();
    const old = await prisma.vehicle_passes.findUnique({
      where: { id: Number(id) },
    });
    if (!old) throw badRequest("Фиксация не найдена");

    const data = {};

    if (payload.plate_number !== undefined) {
      const plate_number = String(payload.plate_number).trim().toUpperCase();
      if (!plate_number) throw badRequest("Не указан номер транспорта");
      data.plate_number = plate_number;
    }

    if (payload.location_id !== undefined) {
      const location_id = Number(payload.location_id);
      if (!location_id) throw badRequest("Не указана локация");
      await assertLocationExists(location_id);
      data.location_id = location_id;
    }

    if (payload.direction !== undefined) {
      const direction = payload.direction || null;
      if (direction && !["entry", "exit"].includes(direction)) {
        throw badRequest("Неверное направление");
      }
      data.direction = direction;
    }

    if (payload.date !== undefined) {
      const date = parseTashkentDateTime(payload.date);
      if (Number.isNaN(date.getTime())) throw badRequest("Неверная дата");
      data.date = date;
    }

    // Фото: новый файл заменяет старый, remove_photo — убирает
    const removePhoto =
      payload.remove_photo === true || payload.remove_photo === "true";

    if (imageBuffer) {
      data.photo = await storePhoto(imageBuffer, data.date ?? old.date);
    } else if (removePhoto) {
      data.photo = null;
    }

    const result = await VehiclePassesModel.updateById(Number(id), data);

    // старый файл удаляем только после успешного апдейта
    if (
      old.photo &&
      data.photo !== undefined &&
      data.photo !== old.photo
    ) {
      await removeStoredPhoto(old.photo);
    }

    await createAuditLog({
      userId,
      action: "update",
      entity: "vehicle_passes",
      recordId: id,
      oldData: old,
      newData: result,
    });

    return result;
  },

  deleteById: async (id, userId) => {
    const deleted = await VehiclePassesModel.deleteById(Number(id));
    await createAuditLog({ userId, action: "delete", entity: "vehicle_passes", recordId: id, oldData: deleted });
    return deleted;
  },

  // true — такой же номер (±1 символ) уже зафиксирован этой камерой в окне windowSec
  isDuplicateEvent: async (cameraId, plate, eventDate, windowSec, isSamePlate) => {
    const ms = windowSec * 1000;
    const recent = await VehiclePassesModel.findRecentByCamera(
      cameraId,
      new Date(eventDate.getTime() - ms),
      new Date(eventDate.getTime() + ms),
    );
    return recent.some((p) => isSamePlate(p.plate_number, plate));
  },

  createFromDeviceEvent: async (
    { licensePlate, dateTime, macAddress, tenant, confidence, direction, directionSource },
    imageBuffer,
  ) => {
    const camera = await AnprCamerasModel.findByMacAddress(macAddress);
    if (!camera) throw new Error(`Камера с MAC ${macAddress} не найдена`);

    if (!licensePlate) throw new Error("licensePlate отсутствует");

    const photoPath = imageBuffer
      ? await saveUploadedPhoto(imageBuffer, dateTime, tenant)
      : null;

    // Направление проезда определяет вызывающий (по движению транспорта); иначе — направление камеры
    const resolvedDirection = direction ?? camera.direction ?? null;

    const date = new Date(dateTime);
    const data = {
      date,
      plate_number: licensePlate,
      camera_id: camera.id,
      location_id: camera.location_id ?? null,
      direction: resolvedDirection,
      direction_source: directionSource ?? null,
      // Камера записала проезд в направлении, противоположном своему, — помогла партнёру по воротам.
      // Когда партнёр подтвердит его своим событием, пометка снимается (GateConfirmationService.confirmSurvivor)
      inferred: Boolean(camera.direction && resolvedDirection && resolvedDirection !== camera.direction),
      photo: photoPath,
      ...(await GateConfirmationService.buildScore(camera, licensePlate, date, confidence)),
    };

    const newPass = await VehiclePassesModel.create(data);
    await GateConfirmationService.confirmPartnerPasses(camera, newPass);

    await notifyAnprPass(camera, newPass, licensePlate);

    return newPass;
  },

  // Проезд, подтверждённый совместной работой камер ворот: событие пришло с камеры, которая
  // видела машину в обратную сторону, а «своя» камера проезд не зафиксировала
  createInferredPass: async ({ cameraId, plate, date, direction, photo, confidence }) => {
    const camera = await AnprCamerasModel.findById(cameraId);
    if (!camera) throw new Error(`Камера ${cameraId} не найдена`);

    const newPass = await VehiclePassesModel.create({
      date,
      plate_number: plate,
      camera_id: camera.id,
      location_id: camera.location_id ?? null,
      direction,
      photo,
      inferred: true,
      ...(await GateConfirmationService.buildScore(camera, plate, date, confidence)),
    });
    await GateConfirmationService.confirmPartnerPasses(camera, newPass);

    const location = await prismaContext
      .get()
      .locations.findUnique({ where: { id: camera.location_id }, select: { telegram_chat_ids: true } });
    await notifyAnprPass({ ...camera, location }, newPass, plate);

    return newPass;
  },
};
