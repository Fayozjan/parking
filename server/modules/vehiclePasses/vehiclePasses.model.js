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
    } = data;

    return prisma.vehicle_passes.create({
      data: {
        date,
        plate_number,
        direction,
        photo,
        is_whitelisted: is_whitelisted ?? false,
        is_hidden: is_hidden ?? false,
        location: location_id ? { connect: { id: location_id } } : undefined,
        camera: camera_id ? { connect: { id: camera_id } } : undefined,
      },
      include: {
        location: true,
        camera: true,
      },
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
        orderBy: { date: "desc" },
        include: {
          location: {
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
