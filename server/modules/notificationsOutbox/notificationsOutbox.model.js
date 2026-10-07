import { prismaContext } from "../../utils/prismaContext.js";

export const notificationsOutboxModel = {
  create: (data) => {
    return prismaContext.get().notifications_outbox.create({ data });
  },

  createMany: (data) => {
    return prismaContext.get().notifications_outbox.createMany({
      data,
      skipDuplicates: true,
    });
  },

  findMany: ({ filter = {}, orderBy = { created_at: "asc" }, take } = {}) => {
    return prismaContext.get().notifications_outbox.findMany({
      where: filter,
      orderBy,
      take,
    });
  },

  update: (id, data) => {
    return prismaContext.get().notifications_outbox.update({
      where: { id },
      data,
    });
  },

  updateMany: (filter, data) => {
    return prismaContext.get().notifications_outbox.updateMany({
      where: filter,
      data,
    });
  },
};
