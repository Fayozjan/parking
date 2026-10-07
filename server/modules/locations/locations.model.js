import { prismaContext } from "../../utils/prismaContext.js";

export const LocationModel = {
  findMany: async ({ where, skip, take }) => {
    const prisma = prismaContext.get();

    return prisma.locations.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include: {
        cameras: {
          where: { status: true },
          select: { name: true },
        },
        _count: {
          select: { cameras: true },
        },
        locationTariffHistory: {
          orderBy: { assigned_at: "desc" },
          take: 1,
          include: {
            tariff: {
              select: { id: true, name: true, price_type: true, base_price: true },
            },
          },
        },
      },
    });
  },

  count: async (where) => {
    const prisma = prismaContext.get();
    return prisma.locations.count({ where });
  },

  findActive: async () => {
    const prisma = prismaContext.get();

    return prisma.locations.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      include: {
        cameras: {
          where: { status: true },
          select: { id: true, name: true },
        },
      },
    });
  },

  findUnique: async (id) => {
    const prisma = prismaContext.get();

    return prisma.locations.findUnique({
      where: { id: Number(id) },
      include: {
        cameras: true,
        locationTariffHistory: {
          orderBy: { assigned_at: "desc" },
          take: 1,
          include: {
            tariff: {
              select: { id: true, name: true, price_type: true, base_price: true },
            },
          },
        },
      },
    });
  },

  create: async (data) => {
    const prisma = prismaContext.get();
    return prisma.locations.create({ data });
  },

  update: async (id, data) => {
    const prisma = prismaContext.get();

    return prisma.locations.update({
      where: { id: Number(id) },
      data,
    });
  },

  createTariffHistory: async ({ location_id, tariff_id, assigned_at, added_by }) => {
    const prisma = prismaContext.get();

    return prisma.location_tariff_history.create({
      data: {
        location_id: Number(location_id),
        tariff_id: Number(tariff_id),
        assigned_at: assigned_at ? new Date(assigned_at) : new Date(),
        added_by: Number(added_by),
      },
    });
  },

  getCurrentTariff: async (location_id, asOfDate) => {
    const prisma = prismaContext.get();
    const date = asOfDate ? new Date(asOfDate) : new Date();

    return prisma.location_tariff_history.findFirst({
      where: {
        location_id: Number(location_id),
        assigned_at: { lte: date },
      },
      orderBy: { assigned_at: "desc" },
      include: {
        tariff: {
          select: { id: true, name: true, price_type: true, base_price: true },
        },
      },
    });
  },

  findTariffHistoryById: async (historyId) => {
    const prisma = prismaContext.get();
    return prisma.location_tariff_history.findUnique({
      where: { id: Number(historyId) },
      include: { location: { select: { name: true } } },
    });
  },

  findAllTariffHistory: async (location_id) => {
    const prisma = prismaContext.get();
    return prisma.location_tariff_history.findMany({
      where: { location_id: Number(location_id) },
      orderBy: { assigned_at: "desc" },
      include: {
        tariff: {
          select: { id: true, name: true, price_type: true, base_price: true },
        },
      },
    });
  },

  updateTariffHistoryEntry: async (historyId, { tariff_id, assigned_at }) => {
    const prisma = prismaContext.get();
    return prisma.location_tariff_history.update({
      where: { id: Number(historyId) },
      data: {
        tariff_id: Number(tariff_id),
        assigned_at: new Date(assigned_at),
      },
      include: {
        tariff: {
          select: { id: true, name: true, price_type: true, base_price: true },
        },
      },
    });
  },

  deleteTariffHistoryEntry: async (historyId) => {
    const prisma = prismaContext.get();
    return prisma.location_tariff_history.delete({
      where: { id: Number(historyId) },
    });
  },
};
