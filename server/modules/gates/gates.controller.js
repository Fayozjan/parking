import { GatesService } from "./gates.service.js";

export const GatesController = {
  getAll: async (req, res) => {
    try {
      const filters =
        typeof req.query.filters === "string"
          ? JSON.parse(req.query.filters)
          : req.query.filters || {};

      const result = await GatesService.get({
        page: req.query.page,
        pageSize: req.query.pageSize,
        filters,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("Ошибка при получении списка ворот:", err);
      res.status(500).json({ error: "Ошибка при получении списка ворот" });
    }
  },

  getById: async (req, res) => {
    try {
      const gate = await GatesService.getById(req.params.id);
      if (!gate) return res.status(404).json({ error: "Ворота не найдены" });
      res.json({ success: true, data: gate });
    } catch (err) {
      console.error("Ошибка при получении ворот:", err);
      res.status(500).json({ error: "Ошибка при получении ворот" });
    }
  },

  create: async (req, res) => {
    try {
      if (!req.body.name?.trim() || !req.body.location_id) {
        return res.status(400).json({ error: "Укажите название и локацию" });
      }
      const gate = await GatesService.create(req.body, req.user?.id);
      res.status(201).json({ success: true, result: gate });
    } catch (err) {
      console.error("Ошибка при добавлении ворот:", err);
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Ворота с таким названием уже есть в этой локации!" });
      }
      res.status(500).json({ error: "Ошибка при добавлении ворот" });
    }
  },

  update: async (req, res) => {
    try {
      const gate = await GatesService.update(req.params.id, req.body, req.user?.id);
      res.json({ success: true, result: gate });
    } catch (err) {
      console.error("Ошибка при обновлении ворот:", err);
      if (err.code === "P2025") return res.status(404).json({ error: "Ворота не найдены" });
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Ворота с таким названием уже есть в этой локации!" });
      }
      res.status(500).json({ error: "Ошибка при обновлении ворот" });
    }
  },

  remove: async (req, res) => {
    try {
      await GatesService.deleteById(req.params.id, req.user?.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Ошибка при удалении ворот:", err);
      if (err.code === "P2025") return res.status(404).json({ error: "Ворота не найдены" });
      res.status(500).json({ error: "Ошибка при удалении ворот" });
    }
  },
};
