import fs from "fs";
import path from "path";
import { trainingDir, dayOfId } from "../../utils/trainingFrames.js";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

const listDays = async (root) =>
  (await fs.promises.readdir(root).catch(() => [])).filter((d) => DAY_RE.test(d)).sort();

const listIds = async (dayDir) =>
  (await fs.promises.readdir(dayDir).catch(() => []))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();

const validDay = (d) => (DAY_RE.test(String(d || "")) ? String(d) : "");

export const AiTrainingService = {
  /**
   * Кадры строго после `after` (id кадра) и не дальше `until` в порядке времени — по ним ведётся «курсор» и забирается только новое.
   * from/to (YYYY-MM-DD) ограничивают по дням. json пишется после jpg, поэтому кадр с json всегда целый.
   */
  list: async ({ after = "", until = "", from = "", to = "", limit }) => {
    const root = trainingDir();
    const take = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const items = [];
    if (!root) return { items, hasMore: false };

    const fromDay = [validDay(from), dayOfId(after)].filter(Boolean).sort().pop() || "";
    const toDay = validDay(to);
    for (const day of await listDays(root)) {
      if (fromDay && day < fromDay) continue;
      if (toDay && day > toDay) break;
      const dayDir = path.join(root, day);
      for (const id of await listIds(dayDir)) {
        if (after && id <= after) continue;
        if (until && id > until) return { items, hasMore: false };
        if (items.length === take) return { items, hasMore: true };
        items.push({ id, jpg: path.join(dayDir, `${id}.jpg`), json: path.join(dayDir, `${id}.json`) });
      }
    }
    return { items, hasMore: false };
  },

  // Что будет скачано этим запросом (без чтения файлов кадров): число, границы, есть ли ещё
  plan: async (query) => {
    const { items, hasMore } = await AiTrainingService.list(query);
    return {
      count: items.length,
      first_id: items[0]?.id ?? null,
      last_id: items[items.length - 1]?.id ?? null,
      has_more: hasMore,
    };
  },

  // Сколько кадров накоплено по дням (без чтения файлов кадров)
  summary: async () => {
    const root = trainingDir();
    if (!root) return { enabled: false, total: 0, days: [] };
    const days = [];
    let total = 0;
    for (const day of await listDays(root)) {
      const ids = await listIds(path.join(root, day));
      if (ids.length === 0) continue;
      days.push({ day, count: ids.length, first_id: ids[0], last_id: ids[ids.length - 1] });
      total += ids.length;
    }
    return { enabled: true, total, last_id: days.at(-1)?.last_id ?? null, days: days.reverse() };
  },
};
