import { prismaContext } from "../../utils/prismaContext.js";

export const CameraLogsModel = {
  create: async (data) => {
    const prisma = prismaContext.get();
    return prisma.camera_logs.create({ data });
  },

  update: async (id, data) => {
    const prisma = prismaContext.get();
    return prisma.camera_logs.update({ where: { id: Number(id) }, data });
  },

  // События камеры за окно — для отсева манёвров (сдача назад) в совместной работе камер
  findRecentByCamera: async (cameraId, since, until) => {
    const prisma = prismaContext.get();
    return prisma.camera_logs.findMany({
      where: { camera_id: cameraId, event_date: { gte: since, lte: until } },
      select: { license_plate: true, movement_direction: true },
    });
  },

  // События нескольких камер за окно — подтверждение проезда второй камерой ворот
  findRecentByCameras: async (cameraIds, since, until) => {
    const prisma = prismaContext.get();
    return prisma.camera_logs.findMany({
      where: { camera_id: { in: cameraIds }, event_date: { gte: since, lte: until } },
      select: { license_plate: true },
    });
  },

  findMany: async ({ where, skip, take }) => {
    const prisma = prismaContext.get();
    return prisma.camera_logs.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
    });
  },

  count: async (where) => {
    const prisma = prismaContext.get();
    return prisma.camera_logs.count({ where });
  },
};
