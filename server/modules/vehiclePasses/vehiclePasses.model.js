import { prismaContext } from "../../utils/prismaContext.js";

export const VehiclePassesModel = {
  create: async (data, tx = null) => {
    const prisma = tx || prismaContext.get();

    const {
      date,
      plate_number,
      direction,
      photo,
      location_id,
      camera_id,
      is_whitelisted,
      is_hidden,
      inferred,
      confidence,
      gate_confirmed,
      score,
      direction_source,
    } = data;

    return prisma.vehicle_passes.create({
      data: {
        date,
        plate_number,
        direction,
        photo,
        is_whitelisted: is_whitelisted ?? false,
        is_hidden: is_hidden ?? false,
        inferred: inferred ?? false,
        confidence: confidence ?? null,
        gate_confirmed: gate_confirmed ?? false,
        score: score ?? null,
        direction_source: direction_source ?? null,
        location: location_id ? { connect: { id: location_id } } : undefined,
        camera: camera_id ? { connect: { id: camera_id } } : undefined,
      },
      include: {
        location: true,
        camera: true,
      },
    });
  },

  // Последняя фиксация номера в локации — по ней понимаем, стоит ли машина внутри (entry) или нет
  findLastByPlate: async (locationId, plate) => {
    const prisma = prismaContext.get();
    return prisma.vehicle_passes.findFirst({
      where: { location_id: Number(locationId), plate_number: plate },
      orderBy: { date: "desc" },
      select: { id: true, direction: true, date: true },
    });
  },

  // Предыдущая фиксация номера в локации до указанного момента — «судья» по истории для проезда
  findPreviousByPlate: async (locationId, plate, before, excludeId) => {
    const prisma = prismaContext.get();
    return prisma.vehicle_passes.findFirst({
      where: { location_id: Number(locationId), plate_number: plate, date: { lt: before }, id: { not: Number(excludeId) } },
      orderBy: { date: "desc" },
      select: { id: true, direction: true, date: true },
    });
  },

  findRecentByCameras: async (cameraIds, since, until) => {
    const prisma = prismaContext.get();
    return prisma.vehicle_passes.findMany({
      where: { camera_id: { in: cameraIds }, date: { gte: since, lte: until } },
      select: { id: true, plate_number: true, direction: true, confidence: true, gate_confirmed: true, camera_id: true, date: true },
    });
  },

  // Фиксации камеры за последние секунды — для поиска дублей одного проезда
  findRecentByCamera: async (cameraId, since, until) => {
    const prisma = prismaContext.get();
    return prisma.vehicle_passes.findMany({
      where: { camera_id: cameraId, date: { gte: since, lte: until } },
      select: { plate_number: true },
    });
  },

  createMany: async (rows, tx = null) => {
    const prisma = tx || prismaContext.get();

    return prisma.vehicle_passes.createMany({ data: rows });
  },

  // уникальные номера, которые уже фиксировались на этой локации
  findPlatesByLocation: async (locationId, extraWhere = {}) => {
    const prisma = prismaContext.get();

    const rows = await prisma.vehicle_passes.findMany({
      where: { location_id: Number(locationId), ...extraWhere },
      select: { plate_number: true },
      distinct: ["plate_number"],
      orderBy: { plate_number: "asc" },
    });

    return rows.map((r) => r.plate_number);
  },

  find: async ({ where, skip, take }) => {
    const prisma = prismaContext.get();

    const [records, total] = await Promise.all([
      prisma.vehicle_passes.findMany({
        where,
        skip,
        take,
        // id — тай-брейкер: при одинаковой date порядок стабилен, строки не дублируются между страницами
        orderBy: [{ date: "desc" }, { id: "desc" }],
        include: {
          location: {
            select: {
              name: true,
            },
          },
          camera: {
            select: {
              name: true,
            },
          },
        },
      }),

      prisma.vehicle_passes.count({ where }),
    ]);

    return { records, total };
  },

  findById: async (id) => {
    const prisma = prismaContext.get();

    return prisma.vehicle_passes.findUnique({
      where: { id: Number(id) },
      include: {
        location: {
          select: {
            name: true,
          },
        },
      },
    });
  },

  findVehicleNumbers: async (startTime, endTime) => {
    const prisma = prismaContext.get();

    try {
      const passes = await prisma.vehicle_passes.findMany({
        where: {
          date: {
            gte: new Date(startTime),
            lte: new Date(endTime),
          },
        },
        select: {
          plate_number: true,
        },
      });

      return passes.map((p) => p.plate_number);
    } catch (err) {
      console.error("Ошибка при получении номеров транспорта:", err);
      return [];
    }
  },

  // Какие из номеров уже известны системе: в белом списке или проезжали после since (кроме самой записи).
  // Нужны голосованию камера/AI как «судья» при расхождении номеров.
  findKnownPlates: async (plates, excludeId, since) => {
    const prisma = prismaContext.get();
    const rows = await prisma.vehicle_passes.findMany({
      where: {
        plate_number: { in: plates },
        id: { not: Number(excludeId) },
        OR: [{ is_whitelisted: true }, { date: { gte: since } }],
      },
      select: { plate_number: true },
      distinct: ["plate_number"],
    });
    return new Set(rows.map((r) => r.plate_number));
  },

  // Известные номера (белый список / недавние проезды), в которых содержится обрывок plate
  findKnownPlatesContaining: async (plate, excludeId, since) => {
    const prisma = prismaContext.get();
    const rows = await prisma.vehicle_passes.findMany({
      where: {
        plate_number: { contains: plate },
        id: { not: Number(excludeId) },
        OR: [{ is_whitelisted: true }, { date: { gte: since } }],
      },
      select: { plate_number: true },
      distinct: ["plate_number"],
      take: 20,
    });
    return rows.map((r) => r.plate_number);
  },

  updateById: async (id, data, tx = null) => {
    const prisma = tx || prismaContext.get();

    return prisma.vehicle_passes.update({
      where: { id: Number(id) },
      data,
    });
  },

  deleteById: async (id, tx = null) => {
    const prisma = tx || prismaContext.get();

    return prisma.vehicle_passes.delete({
      where: { id: Number(id) },
    });
  },
};
