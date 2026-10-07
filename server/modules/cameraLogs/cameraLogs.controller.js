import { CameraLogsService } from "./cameraLogs.service.js";
import fs from "fs";
import path from "path";

// Фото события хранится в одном экземпляре: обработанные события — в
// uploads/vehicle-passes (кадр фиксации), пропущенные — миниатюрой в
// uploads/camera-logs. Ищем файл в обоих каталогах.
const PHOTO_DIRS = ["camera-logs", "vehicle-passes"];

async function resolvePhoto(safeName) {
  const relative = safeName.split("/").join(path.sep);

  for (const dir of PHOTO_DIRS) {
    const root = path.join(process.cwd(), "uploads", dir);
    const filePath = path.join(root, relative);

    if (!filePath.startsWith(root + path.sep)) continue;

    const readable = await fs.promises
      .access(filePath, fs.constants.R_OK)
      .then(() => true)
      .catch(() => false);

    if (readable) return { filePath, internal: `/internal/${dir}/${safeName}` };
  }

  return null;
}

export const CameraLogsController = {
  getImage: async (req, res) => {
    try {
      const rawFilename = req.params[0];
      if (!rawFilename) return res.status(400).json({ error: "Не указан файл" });

      const safeName = path
        .normalize(rawFilename)
        .replace(/^(\.\.(\/|\\|$))+/, "")
        .replace(/^\/+/, "");

      const found = await resolvePhoto(safeName);
      if (!found) {
        const err = new Error("Файл не найден");
        err.status = 404;
        throw err;
      }

      if (process.env.NODE_ENV === "production") {
        res.setHeader("X-Accel-Redirect", found.internal);
        res.setHeader("Cache-Control", "private, max-age=86400");
        return res.status(200).end();
      }

      res.sendFile(found.filePath);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const filters =
        typeof req.query.filters === "string"
          ? JSON.parse(req.query.filters)
          : req.query.filters || {};

      const result = await CameraLogsService.list({
        page: req.query.page,
        pageSize: req.query.pageSize,
        filters,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      console.error("cameraLogs error:", err);
      res.status(500).json({ error: "Ошибка при получении логов камер" });
    }
  },
};
