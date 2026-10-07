import { prismaContext } from "../../utils/prismaContext.js";

export const CameraLogsModel = {
  create: async (data) => {
    const prisma = prismaContext.get();
    return prisma.camera_logs.create({ data });
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
