import { prismaContext } from "../../utils/prismaContext.js";

export async function getTariffs({ where = {} } = {}) {
  const prisma = prismaContext.get();
  return prisma.location_tariffs.findMany({
    where,
    orderBy: { effective_from: "desc" },
  });
}

export async function getTariffById(id) {
  const prisma = prismaContext.get();
  return prisma.location_tariffs.findUnique({ where: { id } });
}

export async function createTariff(data) {
  const prisma = prismaContext.get();
  return prisma.location_tariffs.create({ data });
}

export async function updateTariff(id, data) {
  const prisma = prismaContext.get();
  return prisma.location_tariffs.update({ where: { id }, data });
}

export async function deleteTariff(id) {
  const prisma = prismaContext.get();
  return prisma.location_tariffs.delete({ where: { id } });
}
