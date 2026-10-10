import archiver from "archiver";
import { AiTrainingService } from "./aiTraining.service.js";

const queryOf = (req) => ({
  after: String(req.query.after || ""),
  until: String(req.query.until || ""),
  from: String(req.query.from || ""),
  to: String(req.query.to || ""),
  limit: req.query.limit,
});

export const AiTrainingController = {
  summary: async (req, res) => {
    try {
      res.json(await AiTrainingService.summary());
    } catch (err) {
      console.error("aiTraining summary error:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  },

  // GET /api/ai-training/plan?after=&until=&from=&to=&limit= → { count, first_id, last_id, has_more } без скачивания
  plan: async (req, res) => {
    try {
      res.json(await AiTrainingService.plan(queryOf(req)));
    } catch (err) {
      console.error("aiTraining plan error:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  },

  // GET /api/ai-training/export?after=<id>&limit=200 → zip: frames/<id>.jpg (оригинал) + frames/<id>.json.
  // Заголовки X-Last-Id / X-Has-More / X-Count нужны скрипту ft pull: следующий запрос идёт с after=<X-Last-Id>.
  export: async (req, res) => {
    try {
      const query = queryOf(req);
      const after = query.after;
      const { items, hasMore } = await AiTrainingService.list(query);
      if (items.length === 0) {
        res.set({ "X-Has-More": "0", "X-Count": "0", "X-Last-Id": after });
        return res.status(204).end();
      }

      const lastId = items[items.length - 1].id;
      res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="ai-training_${items[0].id}_${lastId}.zip"`,
        "X-Last-Id": lastId,
        "X-Has-More": hasMore ? "1" : "0",
        "X-Count": String(items.length),
        "Access-Control-Expose-Headers": "X-Last-Id, X-Has-More, X-Count",
      });

      // JPEG уже сжат — архив без сжатия (store): быстрее и без нагрузки на CPU сервера
      const zip = archiver("zip", { store: true });
      zip.on("error", (err) => {
        console.error("aiTraining zip error:", err.message);
        res.destroy(err);
      });
      res.on("close", () => zip.abort());
      zip.pipe(res);
      for (const item of items) {
        zip.file(item.jpg, { name: `frames/${item.id}.jpg` });
        zip.file(item.json, { name: `frames/${item.id}.json` });
      }
      await zip.finalize();
    } catch (err) {
      console.error("aiTraining export error:", err.message);
      if (!res.headersSent) res.status(500).json({ message: "Server error" });
    }
  },
};
