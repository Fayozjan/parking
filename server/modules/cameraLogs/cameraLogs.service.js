import { CameraLogsModel } from "./cameraLogs.model.js";

const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

function buildWhere(filters) {
  const where = {};
  const {
    search,
    was_processed,
    camera_id,
    location_id,
    date_from,
    date_to,
    plate_consensus,
    direction_consensus,
  } = filters || {};

  if (search) {
    where.OR = [
      { license_plate: { contains: search, mode: "insensitive" } },
      { mac_address: { contains: search, mode: "insensitive" } },
      { camera_name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (was_processed !== undefined && was_processed !== "") {
    where.was_processed = was_processed === "true";
  }

  if (camera_id) where.camera_id = parseInt(camera_id, 10);
  if (location_id) where.location_id = parseInt(location_id, 10);
  if (plate_consensus) where.plate_consensus = String(plate_consensus);
  if (direction_consensus) where.direction_consensus = String(direction_consensus);

  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) where.created_at.gte = new Date(date_from);
    if (date_to) {
      const to = new Date(date_to);
      to.setHours(23, 59, 59, 999);
      where.created_at.lte = to;
    }
  }

  return where;
}

const toCounts = (rows, field) =>
  Object.fromEntries(rows.filter((r) => r[field] != null).map((r) => [r[field], r._count._all]));

export const CameraLogsService = {
  list: async ({ page, pageSize, filters }) => {
    const limit = pageSize ? parseInt(pageSize, 10) : 50;
    const currentPage = Math.max(parseInt(page || 1, 10), 1);
    const skip = (currentPage - 1) * limit;

    const where = buildWhere(filters);

    const [records, totalItems] = await Promise.all([
      CameraLogsModel.findMany({ where, skip, take: limit }),
      CameraLogsModel.count(where),
    ]);

    return {
      data: records,
      pagination: {
        totalItems,
        currentPage,
        pageSize: limit,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  },

  // Статистика сверки с AI по тем же фильтрам, что и список (consensus-фильтры не применяем:
  // иначе распределение по ним выродится в одну строку)
  stats: async ({ filters }) => {
    const { plate_consensus: _p, direction_consensus: _d, ...base } = filters || {};
    const where = buildWhere(base);

    const [total, plateRows, dirRows, conf] = await Promise.all([
      CameraLogsModel.count(where),
      CameraLogsModel.countBy(where, "plate_consensus"),
      CameraLogsModel.countBy(where, "direction_consensus"),
      CameraLogsModel.avgConfidence(where),
    ]);

    const plate = toCounts(plateRows, "plate_consensus");
    const direction = toCounts(dirRows, "direction_consensus");
    const checked = Object.values(plate).reduce((a, b) => a + b, 0);
    const avgCamera = round1(conf._avg.confidence_level);
    const avgAi = round1(conf._avg.ai_confidence);

    return {
      total,
      checked,
      plate,
      direction,
      confidence: {
        sample: conf._count._all,
        camera: avgCamera,
        ai: avgAi,
        delta: avgCamera != null && avgAi != null ? round1(avgAi - avgCamera) : null,
      },
    };
  },
};
