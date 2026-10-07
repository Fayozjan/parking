import { prismaContext } from "../../utils/prismaContext.js";
import { FinanceModel } from "../finance/finance.model.js";
import {
  buildHiddenPlateExclusion,
  buildNoTariffPlateExclusion,
  getNoTariffEntries,
} from "../vehicleWhitelist/vehicleWhitelist.service.js";

export const DashboardModel = {
  getSummary: async () => {
    const prisma = prismaContext.get();
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const todayStart = new Date(todayStr);
    const todayEnd = new Date(todayStr);
    todayEnd.setHours(23, 59, 59, 999);

    const [hiddenExclusion, noTariffExclusion, noTariffEntries] = await Promise.all([
      buildHiddenPlateExclusion(),
      buildNoTariffPlateExclusion(),
      getNoTariffEntries(),
    ]);

    const dateFilter = { gte: todayStart, lte: todayEnd };

    const [totalLocations, locationsWithTariff, todayByDirection, todayExitsByLocation, revenueEligibleByLocation] =
      await Promise.all([
        prisma.locations.count(),
        prisma.locations.findMany({
          select: {
            id: true,
            total_spots: true,
            free_period: true,
            locationTariffHistory: {
              where: { assigned_at: { lte: todayEnd } },
              orderBy: { assigned_at: "desc" },
              take: 1,
              select: { tariff: { select: { base_price: true } } },
            },
          },
        }),
        prisma.vehicle_passes.groupBy({
          by: ["direction"],
          where: { date: dateFilter, ...hiddenExclusion },
          _count: { id: true },
        }),
        prisma.vehicle_passes.groupBy({
          by: ["location_id"],
          where: { direction: "exit", date: dateFilter, ...hiddenExclusion },
          _count: { id: true },
        }),
        prisma.vehicle_passes.groupBy({
          by: ["location_id"],
          where: {
            direction: "exit",
            date: dateFilter,
            AND: [
              ...(hiddenExclusion.AND || []),
              ...(noTariffExclusion.AND || []),
            ],
          },
          _count: { id: true },
        }),
      ]);

    const totalSpots = locationsWithTariff.reduce((s, p) => s + (p.total_spots ?? 0), 0);
    const todayEntries = todayByDirection.find((r) => r.direction === "entry")?._count.id ?? 0;
    const todayExits = todayByDirection.find((r) => r.direction === "exit")?._count.id ?? 0;
    const openParkings = Math.max(0, todayEntries - todayExits);
    const todayParkings = todayExits;
    const occupancyPct = totalSpots > 0 ? Math.round((openParkings / totalSpots) * 100) : 0;

    const locationsWithFreePeriod = locationsWithTariff
      .filter((l) => l.free_period != null)
      .map((l) => ({ id: l.id, free_period: l.free_period }));

    const freePeriodCounts = await FinanceModel.getFreePeriodCounts({
      locationsWithFreePeriod,
      from: todayStr,
      to: todayStr,
      hiddenExclusion,
      noTariffEntries,
    });

    const revenueEligibleMap = Object.fromEntries(
      revenueEligibleByLocation.map((r) => [r.location_id, r._count.id])
    );
    const todayRevenue = locationsWithTariff.reduce((sum, p) => {
      const price = p.locationTariffHistory[0]?.tariff?.base_price;
      const eligible = revenueEligibleMap[p.id] ?? 0;
      const freeCount = freePeriodCounts[p.id] ?? 0;
      return sum + Math.max(0, eligible - freeCount) * (price ? Number(price) : 0);
    }, 0);

    return { totalLocations, totalSpots, openParkings, occupancyPct, todayParkings, todayRevenue };
  },

  getAnalytics: async ({ period = "week" } = {}) => {
    const prisma = prismaContext.get();
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");

    if (period === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const rows = await prisma.$queryRaw`
        SELECT
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC') AS hour,
          COUNT(*) FILTER (WHERE direction = 'exit') AS parkings
        FROM vehicle_passes
        WHERE date >= ${todayStart}
        GROUP BY hour
        ORDER BY hour ASC
      `;
      const hourMap = Object.fromEntries(rows.map((r) => [Number(r.hour), Number(r.parkings)]));
      return Array.from({ length: 24 }, (_, h) => ({
        label: pad(h) + ":00",
        parkings: hourMap[h] ?? 0,
      }));
    }

    if (period === "yesterday") {
      const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      const rows = await prisma.$queryRaw`
        SELECT
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC') AS hour,
          COUNT(*) FILTER (WHERE direction = 'exit') AS parkings
        FROM vehicle_passes
        WHERE date >= ${yStart} AND date <= ${yEnd}
        GROUP BY hour
        ORDER BY hour ASC
      `;
      const hourMap = Object.fromEntries(rows.map((r) => [Number(r.hour), Number(r.parkings)]));
      return Array.from({ length: 24 }, (_, h) => ({
        label: pad(h) + ":00",
        parkings: hourMap[h] ?? 0,
      }));
    }

    if (period === "lastMonth") {
      const fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const rows = await prisma.$queryRaw`
        SELECT
          (date AT TIME ZONE 'UTC')::date AS day,
          COUNT(*) FILTER (WHERE direction = 'exit') AS parkings
        FROM vehicle_passes
        WHERE date >= ${fromDate} AND date <= ${toDate}
        GROUP BY (date AT TIME ZONE 'UTC')::date
        ORDER BY day ASC
      `;
      const dayMap = Object.fromEntries(
        rows.map((r) => [
          r.day instanceof Date ? r.day.toISOString().split("T")[0] : String(r.day).split("T")[0],
          Number(r.parkings),
        ])
      );
      const daysInLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      return Array.from({ length: daysInLastMonth }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 1, i + 1);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        return { label: key, parkings: dayMap[key] ?? 0 };
      });
    }

    let fromDate, totalDays;
    if (period === "month") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      totalDays = now.getDate();
    } else {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      totalDays = diffToMonday + 1;
    }

    const rows = await prisma.$queryRaw`
      SELECT
        (date AT TIME ZONE 'UTC')::date AS day,
        COUNT(*) FILTER (WHERE direction = 'exit') AS parkings
      FROM vehicle_passes
      WHERE date >= ${fromDate}
      GROUP BY (date AT TIME ZONE 'UTC')::date
      ORDER BY day ASC
    `;

    const dayMap = Object.fromEntries(
      rows.map((r) => [
        r.day instanceof Date ? r.day.toISOString().split("T")[0] : String(r.day).split("T")[0],
        Number(r.parkings),
      ])
    );

    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return { label: key, parkings: dayMap[key] ?? 0 };
    });
  },

  getParkingsByLocation: async ({ period = "week" } = {}) => {
    const prisma = prismaContext.get();
    const now = new Date();
    let fromDate, toDate;

    if (period === "today") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      toDate = null;
    } else if (period === "yesterday") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (period === "month") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      toDate = null;
    } else if (period === "lastMonth") {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      toDate = null;
    }

    const dateFilter = toDate
      ? { gte: fromDate, lte: toDate }
      : { gte: fromDate };

    const [parkingsByLocation, locations] = await Promise.all([
      prisma.vehicle_passes.groupBy({
        by: ["location_id"],
        where: { direction: "exit", date: dateFilter },
        _count: { id: true },
      }),
      prisma.locations.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const parkingsMap = Object.fromEntries(
      parkingsByLocation.map((r) => [r.location_id, r._count.id])
    );
    return locations.map((p) => ({ name: p.name, parkings: parkingsMap[p.id] ?? 0 }));
  },

  getFinancialReport: async ({ period = "month" } = {}) => {
    const prisma = prismaContext.get();
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    let fromDate, toDate;
    if (period === "today") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === "yesterday") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (period === "week") {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === "lastMonth") {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    const fromStr = `${fromDate.getFullYear()}-${pad(fromDate.getMonth() + 1)}-${pad(fromDate.getDate())}`;
    const toStr = `${toDate.getFullYear()}-${pad(toDate.getMonth() + 1)}-${pad(toDate.getDate())}`;

    const [hiddenExclusion, noTariffExclusion, noTariffEntries] = await Promise.all([
      buildHiddenPlateExclusion(),
      buildNoTariffPlateExclusion(),
      getNoTariffEntries(),
    ]);

    const dateFilter = { gte: fromDate, lte: toDate };

    const [parkingsByLocation, revenueEligibleByLocation, entriesByLocation, locations] = await Promise.all([
      prisma.vehicle_passes.groupBy({
        by: ["location_id"],
        where: { direction: "exit", date: dateFilter, ...hiddenExclusion },
        _count: { id: true },
      }),
      prisma.vehicle_passes.groupBy({
        by: ["location_id"],
        where: {
          direction: "exit",
          date: dateFilter,
          AND: [
            ...(hiddenExclusion.AND || []),
            ...(noTariffExclusion.AND || []),
          ],
        },
        _count: { id: true },
      }),
      prisma.vehicle_passes.groupBy({
        by: ["location_id"],
        where: { direction: "entry", date: dateFilter, ...hiddenExclusion },
        _count: { id: true },
      }),
      prisma.locations.findMany({
        orderBy: { name: "asc" },
        include: {
          locationTariffHistory: {
            where: { assigned_at: { lte: toDate } },
            orderBy: { assigned_at: "desc" },
            take: 1,
            include: { tariff: true },
          },
        },
      }),
    ]);

    const locationsWithFreePeriod = locations
      .filter((l) => l.free_period != null)
      .map((l) => ({ id: l.id, free_period: l.free_period }));

    const freePeriodCounts = await FinanceModel.getFreePeriodCounts({
      locationsWithFreePeriod,
      from: fromStr,
      to: toStr,
      hiddenExclusion,
      noTariffEntries,
    });

    const parkingsMap = Object.fromEntries(
      parkingsByLocation.map((r) => [r.location_id, r._count.id])
    );
    const revenueEligibleMap = Object.fromEntries(
      revenueEligibleByLocation.map((r) => [r.location_id, r._count.id])
    );
    const entriesMapFin = Object.fromEntries(
      entriesByLocation.map((r) => [r.location_id, r._count.id])
    );

    const locationStats = locations.map((p) => {
      const tariff = p.locationTariffHistory[0]?.tariff ?? null;
      const parkings = parkingsMap[p.id] ?? 0;
      const revenueEligible = revenueEligibleMap[p.id] ?? 0;
      const entries = entriesMapFin[p.id] ?? 0;
      const freeCount = freePeriodCounts[p.id] ?? 0;
      const openParkings = Math.max(0, entries - parkings);
      const paidParkings = Math.max(0, revenueEligible - freeCount);
      const basePrice = tariff ? Number(tariff.base_price) : 0;
      return {
        id: p.id,
        name: p.name,
        parkings,
        openParkings,
        basePrice,
        revenue: paidParkings * basePrice,
        tariffName: tariff?.name ?? null,
      };
    });

    const priceMap = Object.fromEntries(
      locations.map((p) => [p.id, p.locationTariffHistory[0]?.tariff ? Number(p.locationTariffHistory[0].tariff.base_price) : 0])
    );

    let dailyStats = [];
    try {
      if (period === "today" || period === "yesterday") {
        const rows = await prisma.$queryRaw`
          SELECT EXTRACT(HOUR FROM date AT TIME ZONE 'UTC') AS hour, location_id,
                 COUNT(*) FILTER (WHERE direction = 'exit') AS exits
          FROM vehicle_passes
          WHERE date >= ${fromDate} AND date <= ${toDate} AND location_id IS NOT NULL
          GROUP BY EXTRACT(HOUR FROM date AT TIME ZONE 'UTC'), location_id
          ORDER BY hour ASC
        `;
        const hourMap = {};
        for (const r of rows) {
          const h = Number(r.hour);
          hourMap[h] = (hourMap[h] ?? 0) + Number(r.exits) * (priceMap[Number(r.location_id)] ?? 0);
        }
        dailyStats = Array.from({ length: 24 }, (_, h) => ({ label: pad(h) + ":00", revenue: hourMap[h] ?? 0 }));
      } else {
        const rows = await prisma.$queryRaw`
          SELECT (date AT TIME ZONE 'UTC')::date AS day, location_id,
                 COUNT(*) FILTER (WHERE direction = 'exit') AS exits
          FROM vehicle_passes
          WHERE date >= ${fromDate} AND date <= ${toDate} AND location_id IS NOT NULL
          GROUP BY (date AT TIME ZONE 'UTC')::date, location_id
          ORDER BY day ASC
        `;
        const dayMap = {};
        for (const r of rows) {
          const key = r.day instanceof Date ? r.day.toISOString().split("T")[0] : String(r.day).split("T")[0];
          dayMap[key] = (dayMap[key] ?? 0) + Number(r.exits) * (priceMap[Number(r.location_id)] ?? 0);
        }
        const days = [];
        const cursor = new Date(fromDate);
        const endStr = `${toDate.getFullYear()}-${pad(toDate.getMonth() + 1)}-${pad(toDate.getDate())}`;
        while (true) {
          const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`;
          days.push({ label: key, revenue: dayMap[key] ?? 0 });
          if (key === endStr) break;
          cursor.setDate(cursor.getDate() + 1);
          if (days.length > 60) break;
        }
        dailyStats = days;
      }
    } catch (e) {
      console.error("dailyStats error:", e);
    }

    return {
      locationStats,
      totalRevenue: locationStats.reduce((s, p) => s + p.revenue, 0),
      totalParkings: locationStats.reduce((s, p) => s + p.parkings, 0),
      dailyStats,
    };
  },

  getOccupancyByLocation: async () => {
    const prisma = prismaContext.get();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [locations, passesByDirection] = await Promise.all([
      prisma.locations.findMany({
        select: { id: true, name: true, total_spots: true },
        orderBy: { name: "asc" },
      }),
      prisma.vehicle_passes.groupBy({
        by: ["location_id", "direction"],
        where: { date: { gte: todayStart } },
        _count: { id: true },
      }),
    ]);

    const entriesMap = {};
    const exitsMap = {};
    for (const r of passesByDirection) {
      if (r.direction === "entry") entriesMap[r.location_id] = r._count.id;
      else if (r.direction === "exit") exitsMap[r.location_id] = r._count.id;
    }

    return locations.map((p) => {
      const openParkings = Math.max(0, (entriesMap[p.id] ?? 0) - (exitsMap[p.id] ?? 0));
      const totalSpots = p.total_spots ?? 0;
      const occupancyPct = totalSpots > 0 ? Math.min(100, Math.round((openParkings / totalSpots) * 100)) : 0;
      return { id: p.id, name: p.name, openParkings, totalSpots, occupancyPct };
    });
  },

  getFeeds: async () => {
    const prisma = prismaContext.get();
    return prisma.vehicle_passes.findMany({
      take: 5,
      orderBy: { date: "desc" },
      select: {
        id: true,
        plate_number: true,
        direction: true,
        date: true,
        photo: true,
        location: { select: { name: true } },
      },
    });
  },

  getLocationCoordinates: async () => {
    const prisma = prismaContext.get();
    const locations = await prisma.locations.findMany({
      where: { status: true },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        total_spots: true,
      },
      orderBy: { name: "asc" },
    });
    return locations.filter((p) => p.latitude != null && p.longitude != null);
  },
};
