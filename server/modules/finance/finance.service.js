import { FinanceModel } from "./finance.model.js";
import {
  buildHiddenPlateExclusion,
  buildNoTariffPlateExclusion,
  getNoTariffEntries,
  getHiddenEntries,
} from "../vehicleWhitelist/vehicleWhitelist.service.js";
import { createAuditLog } from "../../utils/auditLog.js";

export async function getParkings({ locationId, from, to }) {
  if (!locationId || !from || !to) throw new Error("Укажите locationId и период");
  const [hiddenExclusion, noTariffEntries, hiddenEntries] = await Promise.all([
    buildHiddenPlateExclusion(),
    getNoTariffEntries(),
    getHiddenEntries(),
  ]);
  return FinanceModel.getParkings({ locationId, from, to, skip: 0, take: 2000, hiddenExclusion, noTariffEntries, hiddenEntries });
}

export async function closeParking({ locationId, plateNumber, date }, userId) {
  if (!locationId || !plateNumber) throw new Error("Укажите locationId и plateNumber");
  const result = await FinanceModel.closeParking({ locationId, plateNumber, date });
  await createAuditLog({ userId, action: "create", entity: "vehicle_passes", recordId: result.id, newData: result });
  return result;
}

export async function cancelParking({ exitId }, userId) {
  if (!exitId) throw new Error("Укажите exitId");
  const deleted = await FinanceModel.cancelParking({ exitId });
  await createAuditLog({ userId, action: "delete", entity: "vehicle_passes", recordId: exitId, oldData: deleted });
  return deleted;
}

export async function getFinanceSummary({ from, to }) {
  if (!from || !to) throw new Error("Укажите период (from, to)");

  const [hiddenExclusion, noTariffExclusion, noTariffEntries, hiddenEntries] = await Promise.all([
    buildHiddenPlateExclusion(),
    buildNoTariffPlateExclusion(),
    getNoTariffEntries(),
    getHiddenEntries(),
  ]);

  const {
    parkingsByLocation,
    revenueEligibleByLocation,
    totalPassesByLocation,
    locations,
    dailyRaw,
    hourlyRaw,
    isSingleDay,
  } = await FinanceModel.getSummary({ from, to, hiddenExclusion, noTariffExclusion, noTariffEntries, hiddenEntries });

  const parkingsMap = Object.fromEntries(
    parkingsByLocation.map((r) => [r.location_id, r._count.id])
  );
  const revenueMap = Object.fromEntries(
    revenueEligibleByLocation.map((r) => [r.location_id, r._count.id])
  );
  const passesMap = Object.fromEntries(
    totalPassesByLocation.map((r) => [r.location_id, r._count.id])
  );

  const locationsWithFreePeriod = locations
    .filter((l) => l.free_period != null)
    .map((l) => ({ id: l.id, free_period: l.free_period }));

  const { totals: freePeriodCounts, byDay: freePeriodByDay } =
    await FinanceModel.computeFreePeriod({
      locationsWithFreePeriod,
      from,
      to,
      hiddenExclusion,
      noTariffEntries,
    });

  const days = Math.max(
    1,
    Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1
  );

  const locationStats = locations.map((p) => {
    const tariff = p.locationTariffHistory[0]?.tariff ?? null;
    const parkings = parkingsMap[p.id] ?? 0;
    const revenueEligible = (revenueMap[p.id] ?? 0) - (freePeriodCounts[p.id] ?? 0);
    const totalPasses = passesMap[p.id] ?? 0;
    const basePrice = tariff ? Number(tariff.base_price) : 0;
    const revenue = revenueEligible * basePrice;

    const enabledCameras = (p.cameras || []).filter((c) => c.status);
    const camerasOnline = enabledCameras.length === 0
      ? null
      : enabledCameras.every((c) => c.is_online !== false);

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      camerasOnline,
      totalSpots: p.total_spots,
      free_period: p.free_period ?? null,
      parkings,
      totalPasses,
      revenue,
      avgPerDay: Math.round(revenue / days),
      tariff: tariff
        ? {
            id: tariff.id,
            name: tariff.name,
            price_type: tariff.price_type,
            base_price: basePrice,
          }
        : null,
    };
  });

  const totalRevenue = locationStats.reduce((s, p) => s + p.revenue, 0);
  const totalParkings = locationStats.reduce((s, p) => s + p.parkings, 0);
  const activeLocations = locations.filter((p) => p.status).length;

  let dailyStats = [];
  let hourlyStats = [];

  if (isSingleDay) {
    const hourlyMap = {};
    for (let h = 0; h < 24; h++) {
      hourlyMap[h] = { hour: h, label: `${String(h).padStart(2, "0")}:00`, parkings: 0, revenue: 0 };
    }
    for (const row of hourlyRaw) {
      const h = row.hour;
      if (hourlyMap[h] === undefined) continue;
      hourlyMap[h].parkings += row.exits;
      const lStat = locationStats.find((p) => p.id === row.location_id);
      if (lStat?.tariff) {
        hourlyMap[h].revenue += row.revenue_exits * lStat.tariff.base_price;
      }
    }
    hourlyStats = Object.values(hourlyMap);
  } else {
    const dailyMap = {};
    for (const row of dailyRaw) {
      if (!dailyMap[row.day]) {
        dailyMap[row.day] = { date: row.day, parkings: 0, total: 0, revenue: 0, locations: [] };
      }
      dailyMap[row.day].parkings += row.exits;
      dailyMap[row.day].total += row.total;

      const lStat = locationStats.find((p) => p.id === row.location_id);
      // Бесплатный период вычитается из платных выездов этого дня —
      // иначе сумма по дням не сойдётся с выручкой локации
      const freeCount = freePeriodByDay[row.location_id]?.[row.day] ?? 0;
      const revenueExits = Math.max(0, row.revenue_exits - freeCount);
      const revenue = lStat?.tariff ? revenueExits * lStat.tariff.base_price : 0;
      dailyMap[row.day].revenue += revenue;

      if (lStat) {
        dailyMap[row.day].locations.push({
          id: lStat.id,
          name: lStat.name,
          parkings: row.exits,
          revenue,
        });
      }
    }
    dailyStats = Object.values(dailyMap)
      .map((d) => ({
        ...d,
        locations: d.locations.sort((a, b) => b.revenue - a.revenue || b.parkings - a.parkings),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  return {
    totals: {
      totalRevenue,
      totalParkings,
      activeLocations,
      avgRevenuePerLocation:
        activeLocations > 0 ? Math.round(totalRevenue / activeLocations) : 0,
    },
    locations: locationStats,
    dailyStats,
    hourlyStats,
  };
}
