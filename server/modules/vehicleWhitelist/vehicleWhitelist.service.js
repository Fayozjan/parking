import * as VehicleWhitelistModel from "./vehicleWhitelist.model.js";
import { AnprCamerasModel } from "../anprCameras/anprCameras.model.js";
import {
  syncPlateToAllCameras,
  removePlateFromAllCameras,
  syncAllToCamera,
} from "../../utils/hikvisionIsapi.js";
import { normalizePlate } from "../../utils/normalizePlate.js";
import { createAuditLog } from "../../utils/auditLog.js";

const VALID_MODES = ["no_tariff", "hidden"];

async function getCamerasForSync(locationIds = []) {
  try {
    const cameras = await AnprCamerasModel.findExitWithSerialNumber();
    if (!locationIds.length) return cameras;
    return cameras.filter((c) => locationIds.includes(c.location_id));
  } catch (err) {
    console.error("[CameraSync] Failed to get cameras:", err.message);
    return [];
  }
}

function syncToCamera(fn) {
  fn().catch((err) => console.error("[CameraSync]", err.message));
}

export async function getService({ page, pageSize, filters = {} } = {}) {
  const where = {};
  if (filters.status !== undefined && filters.status !== "") {
    where.status = filters.status === "true" || filters.status === true;
  }
  if (filters.folder_id !== undefined && filters.folder_id !== "") {
    where.folder_id = filters.folder_id === "null" ? null : Number(filters.folder_id);
  }

  // pageSize=all — режим группировки по папкам отдаёт весь список без пагинации
  const noPaging = String(pageSize) === "all";
  const currentPage = Math.max(parseInt(page) || 1, 1);
  const size = Math.max(parseInt(pageSize) || 50, 1);

  let records = await VehicleWhitelistModel.getAll({ where });

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    records = records.filter((r) => r.pattern.toLowerCase().includes(q));
  }

  const total = records.length;
  const paginated = noPaging ? records : records.slice((currentPage - 1) * size, currentPage * size);

  return {
    data: paginated,
    pagination: {
      totalItems: total,
      currentPage: noPaging ? 1 : currentPage,
      pageSize: noPaging ? total : size,
      totalPages: noPaging ? 1 : Math.ceil(total / size),
    },
  };
}

export async function getByIdService(id) {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error("Некорректный ID");
  return VehicleWhitelistModel.getById(numId);
}

export async function createService({ pattern, mode, description, location_ids, folder_id, added_by }) {
  if (!pattern?.trim()) throw new Error("Шаблон номера обязателен");
  if (!VALID_MODES.includes(mode)) throw new Error("Некорректный режим");

  const parsedLocationIds = Array.isArray(location_ids) ? location_ids.map(Number).filter(Boolean) : [];

  const record = await VehicleWhitelistModel.create({
    pattern: normalizePlate(pattern),
    mode,
    description: description?.trim() || null,
    location_ids: parsedLocationIds,
    folder_id: folder_id ? Number(folder_id) : null,
    added_by: Number(added_by),
  });

  syncToCamera(async () => {
    const cameras = await getCamerasForSync(parsedLocationIds);
    if (cameras.length) await syncPlateToAllCameras(cameras, record.id, record.pattern);
  });

  await createAuditLog({ userId: added_by, action: "create", entity: "vehicle_whitelist", recordId: record.id, newData: record });
  return record;
}

export async function updateService(id, { pattern, mode, description, location_ids, folder_id, status }, userId) {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error("Некорректный ID");

  const oldRecord = await VehicleWhitelistModel.getById(numId);

  const data = {};
  if (pattern !== undefined) data.pattern = normalizePlate(pattern);
  if (mode !== undefined) {
    if (!VALID_MODES.includes(mode)) throw new Error("Некорректный режим");
    data.mode = mode;
  }
  if (description !== undefined) data.description = description?.trim() || null;
  if (location_ids !== undefined) data.location_ids = Array.isArray(location_ids) ? location_ids.map(Number).filter(Boolean) : [];
  if (folder_id !== undefined) data.folder_id = folder_id ? Number(folder_id) : null;
  if (status !== undefined) data.status = Boolean(status);

  const updated = await VehicleWhitelistModel.updateById(numId, data);

  syncToCamera(async () => {
    const oldLocationIds = oldRecord?.location_ids || [];
    const newLocationIds = updated.location_ids || [];
    const allLocationIds = [...new Set([...oldLocationIds, ...newLocationIds])];

    const cameras = await getCamerasForSync(allLocationIds);
    if (!cameras.length) return;

    const patternChanged = oldRecord && updated.pattern !== oldRecord.pattern;

    if (patternChanged && oldRecord.status) {
      const oldCameras = await getCamerasForSync(oldLocationIds);
      await removePlateFromAllCameras(oldCameras, oldRecord.id, oldRecord.pattern);
    }

    if (updated.status) {
      const newCameras = await getCamerasForSync(newLocationIds);
      await syncPlateToAllCameras(newCameras, updated.id, updated.pattern);
    } else if (!updated.status && oldRecord.status) {
      if (!patternChanged) {
        const oldCameras = await getCamerasForSync(oldLocationIds);
        await removePlateFromAllCameras(oldCameras, oldRecord.id, oldRecord.pattern);
      }
    }
  });

  await createAuditLog({ userId, action: "update", entity: "vehicle_whitelist", recordId: numId, oldData: oldRecord, newData: updated });
  return updated;
}

export async function removeService(id, userId) {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error("Некорректный ID");

  const record = await VehicleWhitelistModel.getById(numId);
  const deleted = await VehicleWhitelistModel.deleteById(numId);
  await createAuditLog({ userId, action: "delete", entity: "vehicle_whitelist", recordId: numId, oldData: deleted });

  if (record) {
    syncToCamera(async () => {
      const cameras = await getCamerasForSync(record.location_ids || []);
      if (cameras.length) await removePlateFromAllCameras(cameras, record.id, record.pattern);
    });
  }
}

export async function importManyService(rows, addedBy, folderId) {
  const results = { imported: 0, errors: [] };
  const created = [];

  for (const row of rows) {
    try {
      const record = await VehicleWhitelistModel.create({
        pattern: normalizePlate(row.pattern),
        mode: row.mode || "no_tariff",
        description: row.description?.trim() || null,
        folder_id: folderId ? Number(folderId) : null,
        added_by: Number(addedBy),
      });
      results.imported++;
      created.push(record);
    } catch (e) {
      results.errors.push({ row: row.pattern, error: e.message });
    }
  }

  if (created.length) {
    syncToCamera(async () => {
      const cameras = await getCamerasForSync();
      for (const camera of cameras) {
        await syncAllToCamera(camera, created).catch((err) =>
          console.error(`[CameraSync] Batch sync → ${camera.camera_ip} failed:`, err.message),
        );
      }
    });
  }

  return results;
}

export async function syncAllToCamerasService() {
  const cameras = await getCamerasForSync();
  if (!cameras.length) return { cameras: 0, message: "No cameras with credentials found" };

  const allEntries = await VehicleWhitelistModel.getActive();

  if (!allEntries.length) return { cameras: cameras.length, synced: 0, message: "No entries to sync" };

  const cameraResults = [];
  for (const camera of cameras) {
    try {
      const result = await syncAllToCamera(camera, allEntries);
      cameraResults.push({ ip: camera.camera_ip, name: camera.name, ...result });
    } catch (err) {
      cameraResults.push({ ip: camera.camera_ip, name: camera.name, error: err.message });
    }
  }

  return { cameras: cameras.length, entries: allEntries.length, results: cameraResults };
}

export async function findMatchingEntry(licensePlate, locationId) {
  try {
    const all = await VehicleWhitelistModel.getActive();
    const filtered = locationId
      ? all.filter((e) => !e.location_ids.length || e.location_ids.includes(locationId))
      : all;
    const normalizedPlate = normalizePlate(licensePlate);
    return filtered.find((e) =>
      normalizedPlate.includes(normalizePlate(e.pattern))
    ) ?? null;
  } catch {
    return null;
  }
}

function buildExclusionFromEntries(entries) {
  if (!entries.length) return {};
  const conditions = entries.map((e) => ({
    plate_number: { contains: normalizePlate(e.pattern), mode: "insensitive" },
  }));
  return { AND: conditions.map((c) => ({ NOT: c })) };
}

function filterByLocation(entries, locationId) {
  if (!locationId) return entries;
  return entries.filter((e) => !e.location_ids.length || e.location_ids.includes(locationId));
}

export async function buildHiddenPlateExclusion(locationId) {
  try {
    const all = await VehicleWhitelistModel.getActive();
    return buildExclusionFromEntries(filterByLocation(all.filter((e) => e.mode === "hidden"), locationId));
  } catch {
    return {};
  }
}

export async function buildNoTariffPlateExclusion(locationId) {
  try {
    const all = await VehicleWhitelistModel.getActive();
    return buildExclusionFromEntries(filterByLocation(all.filter((e) => e.mode === "no_tariff"), locationId));
  } catch {
    return {};
  }
}

export async function getNoTariffEntries(locationId) {
  try {
    const all = await VehicleWhitelistModel.getActive();
    return filterByLocation(all.filter((e) => e.mode === "no_tariff"), locationId);
  } catch {
    return [];
  }
}

export async function getHiddenEntries(locationId) {
  try {
    const all = await VehicleWhitelistModel.getActive();
    return filterByLocation(all.filter((e) => e.mode === "hidden"), locationId);
  } catch {
    return [];
  }
}

/* ---------- Папки ---------- */

export async function getFoldersService() {
  const [folders, uncategorized, total] = await Promise.all([
    VehicleWhitelistModel.getFolders(),
    VehicleWhitelistModel.countEntries({ folder_id: null }),
    VehicleWhitelistModel.countEntries(),
  ]);

  return {
    folders: folders.map(({ _count, ...f }) => ({ ...f, count: _count?.entries ?? 0 })),
    uncategorized,
    total,
  };
}

export async function createFolderService({ name, sort_order }, userId) {
  if (!name?.trim()) throw new Error("Название папки обязательно");

  const folder = await VehicleWhitelistModel.createFolder({
    name: name.trim(),
    sort_order: Number(sort_order) || 0,
  });

  await createAuditLog({ userId, action: "create", entity: "whitelist_folders", recordId: folder.id, newData: folder });
  return folder;
}

export async function updateFolderService(id, { name, sort_order }, userId) {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error("Некорректный ID");

  const oldFolder = await VehicleWhitelistModel.getFolderById(numId);

  const data = {};
  if (name !== undefined) {
    if (!name?.trim()) throw new Error("Название папки обязательно");
    data.name = name.trim();
  }
  if (sort_order !== undefined) data.sort_order = Number(sort_order) || 0;

  const updated = await VehicleWhitelistModel.updateFolderById(numId, data);
  await createAuditLog({ userId, action: "update", entity: "whitelist_folders", recordId: numId, oldData: oldFolder, newData: updated });
  return updated;
}

export async function removeFolderService(id, userId) {
  const numId = Number(id);
  if (Number.isNaN(numId)) throw new Error("Некорректный ID");

  const deleted = await VehicleWhitelistModel.deleteFolderById(numId);
  await createAuditLog({ userId, action: "delete", entity: "whitelist_folders", recordId: numId, oldData: deleted });
}
