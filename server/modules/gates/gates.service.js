import { GatesModel } from "./gates.model.js";
import { createAuditLog } from "../../utils/auditLog.js";

export const DEFAULT_COOP_WINDOW_SEC = 15;
export const DEFAULT_MANEUVER_WINDOW_SEC = 60;

const toSeconds = (value, fallback, max) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(1, Math.round(num)));
};

const toBool = (value, fallback) =>
  value === undefined ? fallback : value === true || value === "true";

const format = (gate) => ({
  id: gate.id,
  name: gate.name,
  location_id: gate.location_id,
  location_name: gate.location?.name || null,
  status: gate.status,
  coop_enabled: gate.coop_enabled,
  coop_window_sec: gate.coop_window_sec,
  maneuver_window_sec: gate.maneuver_window_sec,
  cameras: gate.cameras || [],
  added_at: gate.added_at,
  updated_at: gate.updated_at,
});

export const GatesService = {
  get: async ({ page, pageSize, filters = {} }) => {
    const currentPage = Math.max(parseInt(page || 1), 1);
    const limit = Math.max(parseInt(pageSize || 50), 1);
    const skip = (currentPage - 1) * limit;

    const where = {};
    if (filters.search?.trim()) {
      where.name = { contains: filters.search.trim(), mode: "insensitive" };
    }
    if (filters.location_id) where.location_id = Number(filters.location_id);
    if (filters.status !== undefined && filters.status !== "") {
      where.status = filters.status === "true";
    }

    const [data, total] = await Promise.all([
      GatesModel.findMany({ where, skip, take: limit }),
      GatesModel.count(where),
    ]);

    return {
      data: data.map(format),
      pagination: {
        totalItems: total,
        currentPage,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getById: async (id) => {
    const gate = await GatesModel.findById(id);
    return gate ? format(gate) : null;
  },

  create: async (data, userId) => {
    const result = await GatesModel.create({
      name: String(data.name ?? "").trim(),
      location: { connect: { id: Number(data.location_id) } },
      status: toBool(data.status, true),
      coop_enabled: toBool(data.coop_enabled, true),
      coop_window_sec: toSeconds(data.coop_window_sec, DEFAULT_COOP_WINDOW_SEC, 300),
      maneuver_window_sec: toSeconds(data.maneuver_window_sec, DEFAULT_MANEUVER_WINDOW_SEC, 3600),
    });
    await createAuditLog({ userId, action: "create", entity: "gates", recordId: result.id, newData: result });
    return format(result);
  },

  update: async (id, data, userId) => {
    const old = await GatesModel.findById(id);
    const result = await GatesModel.update(id, {
      name: String(data.name ?? old.name).trim(),
      ...(data.location_id ? { location: { connect: { id: Number(data.location_id) } } } : {}),
      status: toBool(data.status, old.status),
      coop_enabled: toBool(data.coop_enabled, old.coop_enabled),
      coop_window_sec: toSeconds(data.coop_window_sec, old.coop_window_sec, 300),
      maneuver_window_sec: toSeconds(data.maneuver_window_sec, old.maneuver_window_sec, 3600),
    });
    await createAuditLog({ userId, action: "update", entity: "gates", recordId: id, oldData: old, newData: result });
    return format(result);
  },

  deleteById: async (id, userId) => {
    const old = await GatesModel.findById(id);
    const result = await GatesModel.deleteById(id);
    await createAuditLog({ userId, action: "delete", entity: "gates", recordId: id, oldData: old });
    return result;
  },
};
