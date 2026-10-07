import { LocationsService } from "./locations.service.js";

export const LocationsController = {
  getAll: async (req, res) => {
    try {
      const filters =
        typeof req.query.filters === "string"
          ? JSON.parse(req.query.filters)
          : req.query.filters || {};

      const result = await LocationsService.getLocations({
        page: req.query.page,
        pageSize: req.query.pageSize,
        filters,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      console.error("Ошибка при получении списка локаций:", err);
      res.status(500).json({ error: "Ошибка при получении данных о локациях" });
    }
  },

  getActive: async (req, res) => {
    try {
      const result = await LocationsService.getActiveLocations();
      res.json({ success: true, data: result });
    } catch (err) {
      console.error("Ошибка при получении активных локаций:", err);
      res.status(500).json({ error: "Ошибка при получении локаций" });
    }
  },

  getById: async (req, res) => {
    try {
      const location = await LocationsService.getLocationById(req.params.id);
      if (!location) return res.status(404).json({ error: "Локация не найдена" });

      res.status(200).json({ success: true, data: location });
    } catch (err) {
      console.error("Ошибка при получении локации по id:", err);
      res.status(500).json({ error: "Ошибка при получении данных о локации" });
    }
  },

  create: async (req, res) => {
    try {
      const location = await LocationsService.createLocation(req.body, req.user?.id);
      res.status(201).json({ success: true, result: location });
    } catch (err) {
      console.error("Ошибка при добавлении локации:", err);
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Такое имя уже существует!" });
      }
      res.status(500).json({ error: "Ошибка при добавлении локации" });
    }
  },

  update: async (req, res) => {
    const userId = req.user?.id;
    try {
      const location = await LocationsService.updateLocation(req.params.id, req.body, userId);
      res.status(200).json({ success: true, result: location });
    } catch (err) {
      console.error("Ошибка при обновлении локации:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Локация не найдена" });
      }
      res.status(500).json({ error: "Ошибка при обновлении локации" });
    }
  },

  getTariffHistory: async (req, res) => {
    try {
      const data = await LocationsService.getTariffHistory(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      console.error("Ошибка при получении истории тарифов:", err);
      res.status(500).json({ error: "Ошибка при получении истории тарифов" });
    }
  },

  addTariffHistory: async (req, res) => {
    try {
      const entry = await LocationsService.addTariffHistoryEntry(req.params.id, req.body, req.user?.id);
      res.status(201).json({ success: true, data: entry });
    } catch (err) {
      console.error("Ошибка при добавлении записи истории:", err);
      res.status(500).json({ error: "Ошибка при добавлении записи истории" });
    }
  },

  updateTariffHistory: async (req, res) => {
    try {
      const entry = await LocationsService.updateTariffHistoryEntry(req.params.historyId, req.body, req.user?.id);
      res.json({ success: true, data: entry });
    } catch (err) {
      console.error("Ошибка при обновлении записи истории:", err);
      res.status(500).json({ error: "Ошибка при обновлении записи истории" });
    }
  },

  deleteTariffHistory: async (req, res) => {
    try {
      await LocationsService.deleteTariffHistoryEntry(req.params.historyId, req.user?.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Ошибка при удалении записи истории:", err);
      res.status(500).json({ error: "Ошибка при удалении записи истории" });
    }
  },
};
