import { CameraLogsModel } from "./cameraLogs.model.js";

export const CameraLogsService = {
  list: async ({ page, pageSize, filters }) => {
    const limit = pageSize ? parseInt(pageSize, 10) : 50;
    const currentPage = Math.max(parseInt(page || 1, 10), 1);
    const skip = (currentPage - 1) * limit;

    const where = {};
    const { search, was_processed, camera_id, location_id, date_from, date_to } = filters || {};

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

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) {
        const to = new Date(date_to);
        to.setHours(23, 59, 59, 999);
        where.created_at.lte = to;
      }
    }

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
};
