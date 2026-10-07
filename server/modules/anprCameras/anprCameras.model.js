import { prismaContext } from "../../utils/prismaContext.js";

export const AnprCamerasModel = {
  findMany: async ({ where, skip, take }) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.findMany({
      where,
      skip,
      take,
      orderBy: { id: "asc" },
      include: {
        location: { select: { id: true, name: true } },
      },
    });
  },

  count: async (where) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.count({ where });
  },

  findById: async (id) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.findUnique({
      where: { id: Number(id) },
      include: { location: { select: { id: true, name: true } } },
    });
  },

  findByIp: async (ip) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.findUnique({
      where: { camera_ip: ip },
      include: { location: { select: { id: true, name: true } } },
    });
  },

  findByMacAddress: async (mac) => {
    if (!mac) throw new Error("mac address is required");
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.findUnique({
      where: { mac_address: mac.toLowerCase() },
      include: {
        location: {
          select: {
            id: true,
            telegram_chat_ids: true,
            name: true,
            shift_start: true,
            shift_end: true,
          },
        },
      },
    });
  },

  create: async (data) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.create({ data });
  },

  update: async (id, data) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.update({
      where: { id: Number(id) },
      data,
    });
  },

  findActive: async () => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.findMany({
      where: { status: true },
      select: {
        location_id: true,
        camera_ip: true,
        direction: true,
        name: true,
        port: true,
      },
    });
  },

  findExitWithSerialNumber: async () => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.findMany({
      where: { status: true, direction: "exit", serial_number: { not: null } },
      select: {
        id: true,
        name: true,
        camera_ip: true,
        serial_number: true,
        location_id: true,
      },
    });
  },

  findOnlineStale: async (thresholdDate) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.findMany({
      where: {
        status: true,
        is_online: true,
        OR: [
          { last_seen_at: { lt: thresholdDate } },
          { last_seen_at: null, added_at: { lt: thresholdDate } },
        ],
      },
      include: {
        location: { select: { id: true, name: true, telegram_chat_ids: true } },
      },
    });
  },

  findOffline: async () => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.findMany({
      where: { status: true, is_online: false },
      include: {
        location: { select: { id: true, name: true, telegram_chat_ids: true } },
      },
    });
  },

  markOnline: async (id) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.update({
      where: { id },
      data: { is_online: true, last_seen_at: new Date() },
    });
  },

  markOffline: async (id) => {
    const prisma = prismaContext.get();
    return prisma.anpr_cameras.update({
      where: { id },
      data: { is_online: false },
    });
  },
};
