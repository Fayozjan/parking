import { prismaContext } from "../../utils/prismaContext.js";
import { Prisma } from "../../prisma-clients/public/index.js";
import { normalizePlate } from "../../utils/normalizePlate.js";

function buildNoTariffRawCondition(noTariffEntries) {
  if (!noTariffEntries.length) return Prisma.sql``;
  const parts = noTariffEntries.map((e) =>
    Prisma.sql`plate_number ILIKE ${"%" + normalizePlate(e.pattern) + "%"}`
  );
  return Prisma.sql`AND NOT (${Prisma.join(parts, " OR ")})`;
}

function buildHiddenRawCondition(hiddenEntries) {
  if (!hiddenEntries.length) return Prisma.sql``;
  const parts = hiddenEntries.map((e) =>
    Prisma.sql`plate_number ILIKE ${"%" + normalizePlate(e.pattern) + "%"}`
  );
  return Prisma.sql`AND NOT (${Prisma.join(parts, " OR ")})`;
}

export const FinanceModel = {
  getParkings: async ({ locationId, from, to, skip = 0, take = 50, hiddenExclusion = {}, noTariffEntries = [], hiddenEntries = [] }) => {
    const prisma = prismaContext.get();
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const location = await prisma.locations.findUnique({
      where: { id: Number(locationId) },
      select: { free_period: true },
    });
    const freePeriod = location?.free_period;

    const passes = await prisma.vehicle_passes.findMany({
      where: {
        location_id: Number(locationId),
        date: { gte: fromDate, lte: toDate },
        ...hiddenExclusion,
      },
      orderBy: { date: "asc" },
      select: { id: true, date: true, plate_number: true, direction: true, camera_id: true, photo: true },
    });

    const byPlate = {};
    for (const p of passes) {
      const key = p.plate_number || "__unknown__";
      if (!byPlate[key]) byPlate[key] = [];
      byPlate[key].push(p);
    }

    const allParkings = [];

    for (const [plate, records] of Object.entries(byPlate)) {
      const stack = [];
      for (const r of records) {
        if (r.direction === "entry") {
          stack.push(r);
        } else if (r.direction === "exit") {
          const entry = stack.length > 0 ? stack.pop() : null;
          const durationMs = entry ? r.date.getTime() - entry.date.getTime() : null;
          allParkings.push({
            plate_number: plate === "__unknown__" ? null : plate,
            entry_time: entry?.date ?? null,
            entry_id: entry?.id ?? null,
            entry_photo: entry?.photo ?? null,
            exit_time: r.date,
            exit_id: r.id,
            exit_photo: r.photo ?? null,
            duration_minutes: durationMs != null ? Math.round(durationMs / 60000) : null,
            is_open: false,
            is_manual: r.camera_id == null,
          });
        }
      }
      const now = new Date();
      for (const r of stack) {
        const durationMs = now.getTime() - r.date.getTime();
        allParkings.push({
          plate_number: plate === "__unknown__" ? null : plate,
          entry_time: r.date,
          entry_id: r.id,
          entry_photo: r.photo ?? null,
          exit_time: null,
          exit_id: null,
          exit_photo: null,
          duration_minutes: Math.round(durationMs / 60000),
          is_open: true,
          is_manual: false,
        });
      }
    }

    const isHiddenPlate = (plate) => {
      if (!plate || !hiddenEntries.length) return false;
      const normalizedPlate = normalizePlate(plate);
      return hiddenEntries.some((e) =>
        normalizedPlate.includes(normalizePlate(e.pattern))
      );
    };

    const visibleParkings = hiddenEntries.length
      ? allParkings.filter((p) => !isHiddenPlate(p.plate_number))
      : allParkings;

    visibleParkings.sort((a, b) => {
      if (!a.is_open && !b.is_open) return b.exit_time.getTime() - a.exit_time.getTime();
      if (!a.is_open && b.is_open) return -1;
      if (a.is_open && !b.is_open) return 1;
      return (b.entry_time?.getTime() ?? 0) - (a.entry_time?.getTime() ?? 0);
    });

    const isNoTariffPlate = (plate) => {
      if (!plate || !noTariffEntries.length) return false;
      const normalizedPlate = normalizePlate(plate);
      return noTariffEntries.some((e) =>
        normalizedPlate.includes(normalizePlate(e.pattern))
      );
    };

    for (const p of visibleParkings) {
      p.is_no_tariff = isNoTariffPlate(p.plate_number);
      p.is_free_period = !p.is_open && freePeriod != null && p.duration_minutes != null && p.duration_minutes <= freePeriod;
    }

    const totalClosed = visibleParkings.filter((s) => !s.is_open).length;
    const totalOpen = visibleParkings.length - totalClosed;
    const totalRevenueClosed = visibleParkings.filter((s) => !s.is_open && !s.is_no_tariff && !s.is_free_period).length;

    return {
      records: visibleParkings.slice(skip, skip + take),
      total: visibleParkings.length,
      totalClosed,
      totalOpen,
      totalRevenueClosed,
    };
  },

  closeParking: async ({ locationId, plateNumber, date }) => {
    const prisma = prismaContext.get();
    return prisma.vehicle_passes.create({
      data: {
        date: date ? new Date(date) : new Date(),
        plate_number: plateNumber,
        direction: "exit",
        location: { connect: { id: Number(locationId) } },
      },
    });
  },

  cancelParking: async ({ exitId }) => {
    const prisma = prismaContext.get();
    const pass = await prisma.vehicle_passes.findUnique({
      where: { id: Number(exitId) },
      select: { id: true, camera_id: true, direction: true },
    });
    if (!pass) throw new Error("Запись не найдена");
    if (pass.direction !== "exit") throw new Error("Не выезд");
    if (pass.camera_id !== null) throw new Error("Нельзя отменить автоматический выезд");
    return prisma.vehicle_passes.delete({ where: { id: Number(exitId) } });
  },

  // Возвращает { totals: { [locId]: count }, byDay: { [locId]: { [YYYY-MM-DD]: count } } }
  // День определяется по дате выезда в UTC — так же, как в getSummary
  computeFreePeriod: async ({ locationsWithFreePeriod, from, to, hiddenExclusion = {}, noTariffEntries = [] }) => {
    if (!locationsWithFreePeriod.length) return { totals: {}, byDay: {} };

    const prisma = prismaContext.get();
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const locationIds = locationsWithFreePeriod.map((l) => l.id);

    const passes = await prisma.vehicle_passes.findMany({
      where: {
        location_id: { in: locationIds },
        date: { gte: fromDate, lte: toDate },
        ...hiddenExclusion,
      },
      orderBy: [{ location_id: "asc" }, { date: "asc" }],
      select: { date: true, plate_number: true, direction: true, location_id: true },
    });

    const freePeriodMap = Object.fromEntries(
      locationsWithFreePeriod.map((l) => [l.id, l.free_period])
    );

    const isNoTariffPlate = (plate) => {
      if (!plate || !noTariffEntries.length) return false;
      const normalizedPlate = normalizePlate(plate);
      return noTariffEntries.some((e) =>
        normalizedPlate.includes(normalizePlate(e.pattern))
      );
    };

    const byLocation = {};
    for (const p of passes) {
      if (!byLocation[p.location_id]) byLocation[p.location_id] = [];
      byLocation[p.location_id].push(p);
    }

    const totals = {};
    const byDay = {};

    for (const [locId, locPasses] of Object.entries(byLocation)) {
      const fp = freePeriodMap[locId];
      if (fp == null) continue;

      const byPlate = {};
      for (const p of locPasses) {
        const key = p.plate_number || "__unknown__";
        if (!byPlate[key]) byPlate[key] = [];
        byPlate[key].push(p);
      }

      let count = 0;
      const days = {};
      for (const [plate, records] of Object.entries(byPlate)) {
        const realPlate = plate === "__unknown__" ? null : plate;
        if (isNoTariffPlate(realPlate)) continue;

        const stack = [];
        for (const r of records) {
          if (r.direction === "entry") {
            stack.push(r);
          } else if (r.direction === "exit") {
            const entry = stack.length > 0 ? stack.pop() : null;
            if (entry) {
              const durationMinutes = Math.round(
                (r.date.getTime() - entry.date.getTime()) / 60000
              );
              if (durationMinutes <= fp) {
                count++;
                const day = r.date.toISOString().slice(0, 10);
                days[day] = (days[day] ?? 0) + 1;
              }
            }
          }
        }
      }

      totals[locId] = count;
      byDay[locId] = days;
    }

    return { totals, byDay };
  },

  getFreePeriodCounts: async (args) => {
    const { totals } = await FinanceModel.computeFreePeriod(args);
    return totals;
  },

  getSummary: async ({ from, to, hiddenExclusion = {}, noTariffExclusion = {}, noTariffEntries = [], hiddenEntries = [] }) => {
    const prisma = prismaContext.get();
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const isSingleDay = from === to;
    const noTariffRawCond = buildNoTariffRawCondition(noTariffEntries);
    const hiddenRawCond = buildHiddenRawCondition(hiddenEntries);

    const [parkingsByLocation, revenueEligibleByLocation, totalPassesByLocation, locations, rawStats] =
      await Promise.all([
        // All exits (for display count)
        prisma.vehicle_passes.groupBy({
          by: ["location_id"],
          where: {
            direction: "exit",
            date: { gte: fromDate, lte: toDate },
            ...hiddenExclusion,
          },
          _count: { id: true },
        }),

        // Revenue-eligible exits only (both hidden and no_tariff excluded)
        prisma.vehicle_passes.groupBy({
          by: ["location_id"],
          where: {
            direction: "exit",
            date: { gte: fromDate, lte: toDate },
            AND: [
              ...(hiddenExclusion.AND || []),
              ...(noTariffExclusion.AND || []),
            ],
          },
          _count: { id: true },
        }),

        prisma.vehicle_passes.groupBy({
          by: ["location_id"],
          where: {
            date: { gte: fromDate, lte: toDate },
            ...hiddenExclusion,
          },
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
            cameras: { select: { status: true, is_online: true } },
          },
        }),

        isSingleDay
          ? prisma.$queryRaw(Prisma.sql`
              SELECT
                EXTRACT(HOUR FROM (date AT TIME ZONE 'UTC')) AS hour,
                location_id,
                COUNT(*) FILTER (WHERE direction = 'exit') AS exits,
                COUNT(*) FILTER (WHERE direction = 'exit' ${noTariffRawCond}) AS revenue_exits,
                COUNT(*) AS total
              FROM vehicle_passes
              WHERE date >= ${fromDate}
                AND date <= ${toDate}
                AND location_id IS NOT NULL
                ${hiddenRawCond}
              GROUP BY EXTRACT(HOUR FROM (date AT TIME ZONE 'UTC')), location_id
              ORDER BY hour ASC
            `)
          : prisma.$queryRaw(Prisma.sql`
              SELECT
                (date AT TIME ZONE 'UTC')::date AS day,
                location_id,
                COUNT(*) FILTER (WHERE direction = 'exit') AS exits,
                COUNT(*) FILTER (WHERE direction = 'exit' ${noTariffRawCond}) AS revenue_exits,
                COUNT(*) AS total
              FROM vehicle_passes
              WHERE date >= ${fromDate}
                AND date <= ${toDate}
                AND location_id IS NOT NULL
                ${hiddenRawCond}
              GROUP BY (date AT TIME ZONE 'UTC')::date, location_id
              ORDER BY day ASC
            `),
      ]);

    if (isSingleDay) {
      return {
        parkingsByLocation,
        revenueEligibleByLocation,
        totalPassesByLocation,
        locations,
        dailyRaw: [],
        hourlyRaw: rawStats.map((r) => ({
          hour: Number(r.hour),
          location_id: Number(r.location_id),
          exits: Number(r.exits),
          revenue_exits: Number(r.revenue_exits),
          total: Number(r.total),
        })),
        isSingleDay: true,
      };
    }

    return {
      parkingsByLocation,
      revenueEligibleByLocation,
      totalPassesByLocation,
      locations,
      dailyRaw: rawStats.map((r) => ({
        day: r.day instanceof Date
          ? r.day.toISOString().split("T")[0]
          : String(r.day).split("T")[0],
        location_id: Number(r.location_id),
        exits: Number(r.exits),
        revenue_exits: Number(r.revenue_exits),
        total: Number(r.total),
      })),
      hourlyRaw: [],
      isSingleDay: false,
    };
  },
};
