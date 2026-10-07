import { prismaContext } from "../../utils/prismaContext.js";

export async function getAll({ where = {} } = {}) {
  const prisma = prismaContext.get();
  return prisma.vehicle_whitelist.findMany({
    where,
    orderBy: { added_at: "desc" },
    include: {
      addedBy: { select: { id: true, username: true, first_name: true, last_name: true } },
      folder: { select: { id: true, name: true } },
    },
  });
}

export async function getActive() {
  const prisma = prismaContext.get();
  return prisma.vehicle_whitelist.findMany({ where: { status: true } });
}

export async function getById(id) {
  const prisma = prismaContext.get();
  return prisma.vehicle_whitelist.findUnique({ where: { id } });
}

export async function create(data) {
  const prisma = prismaContext.get();
  return prisma.vehicle_whitelist.create({ data });
}

export async function updateById(id, data) {
  const prisma = prismaContext.get();
  return prisma.vehicle_whitelist.update({ where: { id }, data });
}

export async function deleteById(id) {
  const prisma = prismaContext.get();
  return prisma.vehicle_whitelist.delete({ where: { id } });
}

/* ---------- Папки (whitelist_folders) ---------- */

export async function getFolders() {
  const prisma = prismaContext.get();
  return prisma.whitelist_folders.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    include: { _count: { select: { entries: true } } },
  });
}

export async function getFolderById(id) {
  const prisma = prismaContext.get();
  return prisma.whitelist_folders.findUnique({ where: { id } });
}

export async function createFolder(data) {
  const prisma = prismaContext.get();
  return prisma.whitelist_folders.create({ data });
}

export async function updateFolderById(id, data) {
  const prisma = prismaContext.get();
  return prisma.whitelist_folders.update({ where: { id }, data });
}

export async function deleteFolderById(id) {
  const prisma = prismaContext.get();
  return prisma.whitelist_folders.delete({ where: { id } });
}

export async function countEntries(where = {}) {
  const prisma = prismaContext.get();
  return prisma.vehicle_whitelist.count({ where });
}
