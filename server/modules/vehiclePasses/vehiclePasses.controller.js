import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import { VehiclePassesService } from "./vehiclePasses.service.js";

export const VehiclePassesController = {
  get: async (req, res) => {
    const userId = req.user.id;

    try {
      const { page, pageSize, filters } = req.query;

      const result = await VehiclePassesService.get({
        userId,
        page,
        pageSize,
        filters,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      console.error("Ошибка при получении FacePass:", err);
      res.status(500).json({ error: "Ошибка при получении FacePass" });
    }
  },

  create: async (req, res) => {
    try {
      const created = await VehiclePassesService.createManual(
        req.body,
        req.user?.id,
        req.file?.buffer ?? null,
      );

      res.status(201).json({ success: true, data: created });
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ error: err.message });
      }
      console.error("Ошибка при создании фиксации:", err);
      res.status(500).json({ error: "Ошибка при создании фиксации" });
    }
  },

  createBulk: async (req, res) => {
    try {
      const result = await VehiclePassesService.createBulk(
        req.body,
        req.user?.id,
      );

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ error: err.message });
      }
      console.error("Ошибка при массовом создании фиксаций:", err);
      res.status(500).json({ error: "Ошибка при массовом создании фиксаций" });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const record = await VehiclePassesService.getById(id);

      if (!record) return res.status(404).json({ error: "FacePass не найден" });

      res.json({ success: true, data: record });
    } catch (err) {
      console.error("Ошибка при получении FacePass:", err);
      res.status(500).json({ error: "Ошибка при получении FacePass" });
    }
  },

  updateById: async (req, res) => {
    try {
      const { id } = req.params;

      const updated = await VehiclePassesService.updateById(
        id,
        req.body,
        req.user?.id,
        req.file?.buffer ?? null,
      );

      res.json({ success: true, data: updated });
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ error: err.message });
      }
      console.error("Ошибка при обновлении фиксации:", err);
      res.status(500).json({ error: "Ошибка при обновлении фиксации" });
    }
  },

  deleteById: async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await VehiclePassesService.deleteById(id, req.user?.id);

      res.json({ success: true, data: deleted });
    } catch (err) {
      console.error("Ошибка при удалении FacePass:", err);
      res.status(500).json({ error: "Ошибка при удалении FacePass" });
    }
  },

  exportToExcel: async (req, res) => {
    const userId = req.user.id;
    try {
      const { filters } = req.query;
      const records = await VehiclePassesService.getAll({ userId, filters });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Vehicle Passes");

      sheet.columns = [
        { header: "#", key: "index", width: 6 },
        { header: "Дата", key: "date", width: 22 },
        { header: "Номер", key: "plate_number", width: 16 },
        { header: "Направление", key: "direction", width: 14 },
        { header: "Парковка", key: "location_name", width: 20 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E7FF" },
      };

      records.forEach((r, i) => {
        sheet.addRow({
          index: i + 1,
          date: r.date,
          plate_number: r.plate_number,
          direction:
            r.direction === "entry"
              ? "Въезд"
              : r.direction === "exit"
                ? "Выезд"
                : r.direction ?? "",
          location_name: r.location_name ?? "",
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="vehicle-passes.xlsx"',
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error("Ошибка при экспорте vehicle passes:", err);
      res.status(500).json({ error: "Ошибка при экспорте" });
    }
  },

  getImage: async (req, res) => {
    try {
      const rawFilename = req.params[0];
      if (!rawFilename)
        return res.status(400).json({ error: "Не указан файл" });

      const safeName = path
        .normalize(rawFilename)
        .replace(/^(\.\.(\/|\\|$))+/, "")
        .replace(/^\/+/, "");

      const filePath = path.join(
        process.cwd(),
        "uploads",
        "vehicle-passes",
        safeName.split("/").join(path.sep),
      );

      // Защита: файл должен быть внутри uploads/vehicle-passes
      const uploadsRoot = path.join(process.cwd(), "uploads", "vehicle-passes");
      if (!filePath.startsWith(uploadsRoot + path.sep)) {
        return res.status(403).json({ error: "Доступ запрещён" });
      }

      // Проверяем существование файла
      await fs.promises.access(filePath, fs.constants.R_OK).catch(() => {
        const err = new Error("Файл не найден");
        err.status = 404;
        throw err;
      });

      if (process.env.NODE_ENV === "production") {
        // X-Accel-Redirect для Nginx
        res.setHeader(
          "X-Accel-Redirect",
          `/internal/vehicle-passes/${safeName}`,
        );
        res.setHeader("Cache-Control", "private, max-age=86400");
        return res.status(200).end();
      }

      // Dev: отправляем файл напрямую
      res.sendFile(filePath);
    } catch (err) {
      console.error("Ошибка при получении фото:", err.message);
      res.status(err.status ?? 400).json({ error: err.message });
    }
  },
};
