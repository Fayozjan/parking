import { prismaContext } from "../../utils/prismaContext.js";

const include = {
  location: { select: { id: true, name: true } },
  cameras: {
    select: { id: true, name: true, direction: true, status: true },
    orderBy: { id: "asc" },
  },
};

export const GatesModel = {
  findMany: async ({ where, skip, take }) => {
    const prisma = prismaContext.get();
    return prisma.gates.findMany({
      where,
      skip,
      take,
      orderBy: [{ location_id: "asc" }, { name: "asc" }],
      include,
    });
  },

  count: async (where) => {
    const prisma = prismaContext.get();
    return prisma.gates.count({ where });
  },

  findById: async (id) => {
    const prisma = prismaContext.get();
    return prisma.gates.findUnique({ where: { id: Number(id) }, include });
  },

  create: async (data) => {
    const prisma = prismaContext.get();
    return prisma.gates.create({ data, include });
  },

  update: async (id, data) => {
    const prisma = prismaContext.get();
    return prisma.gates.update({ where: { id: Number(id) }, data, include });
  },

  // Камеры не удаляются: gate_id у них обнуляется (onDelete: SetNull)
  deleteById: async (id) => {
    const prisma = prismaContext.get();
    return prisma.gates.delete({ where: { id: Number(id) } });
  },
};
