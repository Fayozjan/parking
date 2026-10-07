import { LocationModel } from "./locations.model.js";
import { createTariff } from "../locationTariffs/locationTariffs.model.js";
import { createAuditLog } from "../../utils/auditLog.js";

const formatTariff = (locationTariffHistory) => {
  if (!locationTariffHistory?.length) return null;
  const h = locationTariffHistory[0];
  return h.tariff
    ? { ...h.tariff, assignedAt: h.assigned_at }
    : null;
};

async function createAutoTariff(locationName, price, assigned_at, userId) {
  return createTariff({
    name: locationName ?? "Тариф",
    price_type: "fixed",
    base_price: Number(price),
    effective_from: new Date(assigned_at || new Date()),
    is_active: true,
    added_by: Number(userId),
  });
}

export const LocationsService = {
  getLocations: async ({ page, pageSize, filters = {} }) => {
    const currentPage = Math.max(parseInt(page || 1), 1);
    const limit = Math.max(parseInt(pageSize || 50), 1);
    const skip = (currentPage - 1) * limit;

    const where = {};
    if (filters.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }

    if (filters.status !== undefined && filters.status !== "") {
      where.status = filters.status === "true";
    }

    const [locations, total] = await Promise.all([
      LocationModel.findMany({ where, skip, take: limit }),
      LocationModel.count(where),
    ]);

    const formatted = locations.map((g) => ({
      id: g.id,
      name: g.name,
      status: g.status,
      totalSpots: g.total_spots,
      freePeriod: g.free_period,
      shiftStart: g.shift_start,
      shiftEnd: g.shift_end,
      camerasCount: g._count?.cameras || 0,
      cameras: g.cameras.map((c) => c.name),
      tariff: formatTariff(g.locationTariffHistory),
      addedAt: g.added_at,
      updatedAt: g.updated_at,
    }));

    return {
      data: formatted,
      pagination: {
        totalItems: total,
        currentPage,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getActiveLocations: async () => {
    return LocationModel.findActive();
  },

  getLocationById: async (id) => {
    const location = await LocationModel.findUnique(id);
    if (!location) return null;
    return {
      ...location,
      tariff: formatTariff(location.locationTariffHistory),
    };
  },

  createLocation: async ({ name, price, assigned_at, latitude, longitude, total_spots, free_period, shift_start, shift_end, telegram_chat_ids }, userId) => {
    const locationName = name?.trim();
    const result = await LocationModel.create({
      name: locationName,
      status: true,
      total_spots: total_spots != null && total_spots !== "" ? Number(total_spots) : null,
      free_period: free_period != null && free_period !== "" ? Number(free_period) : null,
      shift_start: shift_start || null,
      shift_end: shift_end || null,
      latitude: latitude != null && latitude !== "" ? Number(latitude) : null,
      longitude: longitude != null && longitude !== "" ? Number(longitude) : null,
      telegram_chat_ids: Array.isArray(telegram_chat_ids) ? telegram_chat_ids : [],
    });

    if (price !== undefined && price !== null && price !== "") {
      const tariff = await createAutoTariff(
        locationName,
        price,
        assigned_at,
        userId
      );
      await LocationModel.createTariffHistory({
        location_id: result.id,
        tariff_id: tariff.id,
        assigned_at,
        added_by: userId,
      });
    }

    await createAuditLog({ userId, action: "create", entity: "locations", recordId: result.id, newData: result });
    return result;
  },

  getTariffHistory: async (location_id) => {
    return LocationModel.findAllTariffHistory(location_id);
  },

  addTariffHistoryEntry: async (location_id, { price, assigned_at }, userId) => {
    const location = await LocationModel.findUnique(location_id);
    const tariff = await createAutoTariff(location?.name, price, assigned_at, userId);
    return LocationModel.createTariffHistory({
      location_id,
      tariff_id: tariff.id,
      assigned_at,
      added_by: userId,
    });
  },

  updateTariffHistoryEntry: async (historyId, { price, assigned_at }, userId) => {
    const historyEntry = await LocationModel.findTariffHistoryById(historyId);
    const tariff = await createAutoTariff(
      historyEntry?.location?.name,
      price,
      assigned_at,
      userId
    );
    return LocationModel.updateTariffHistoryEntry(historyId, {
      tariff_id: tariff.id,
      assigned_at,
    });
  },

  deleteTariffHistoryEntry: async (historyId, userId) => {
    const deleted = await LocationModel.deleteTariffHistoryEntry(historyId);
    await createAuditLog({ userId, action: "delete", entity: "location_tariff_history", recordId: historyId, oldData: deleted });
    return deleted;
  },

  updateLocation: async (id, { name, status, latitude, longitude, total_spots, free_period, shift_start, shift_end, telegram_chat_ids }, userId) => {
    const old = await LocationModel.findUnique(id);

    const result = await LocationModel.update(id, {
      name: name?.trim(),
      status: status === "true" || status === true,
      total_spots: total_spots != null && total_spots !== "" ? Number(total_spots) : null,
      free_period: free_period != null && free_period !== "" ? Number(free_period) : null,
      shift_start: shift_start || null,
      shift_end: shift_end || null,
      latitude: latitude != null && latitude !== "" ? Number(latitude) : null,
      longitude: longitude != null && longitude !== "" ? Number(longitude) : null,
      ...(Array.isArray(telegram_chat_ids) ? { telegram_chat_ids } : {}),
    });

    await createAuditLog({ userId, action: "update", entity: "locations", recordId: id, oldData: old, newData: result });
    return result;
  },
};
