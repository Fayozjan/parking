import { AuditLogsModel } from "./auditLogs.model.js";
import { prismaContext } from "../../utils/prismaContext.js";
import { createAuditLog } from "../../utils/auditLog.js";

const RESTORABLE_ENTITIES = ["vehicle_passes", "vehicle_whitelist", "location_tariffs", "location_tariff_history"];

export const AuditLogsService = {
  list: async ({ page, pageSize, filters }) => {
    const limit = pageSize ? parseInt(pageSize, 10) : 50;
    const currentPage = Math.max(parseInt(page || 1, 10), 1);
    const skip = (currentPage - 1) * limit;

    const where = {};
    const { entity, action, user_id, date_from, date_to } = filters || {};

    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (user_id) where.user_id = parseInt(user_id, 10);
    if (date_from || date_to) {
      where.added_at = {};
      if (date_from) where.added_at.gte = new Date(date_from);
      if (date_to) {
        const to = new Date(date_to);
        to.setHours(23, 59, 59, 999);
        where.added_at.lte = to;
      }
    }

    const [records, totalItems] = await Promise.all([
      AuditLogsModel.findMany({ where, skip, take: limit }),
      AuditLogsModel.count(where),
    ]);

    const data = records.map((r) => ({
      id: r.id,
      entity: r.entity,
      record_id: r.record_id,
      action: r.action,
      old_data: r.old_data,
      new_data: r.new_data,
      added_at: r.added_at,
      user_id: r.user_id,
      user_name: r.user
        ? (r.user.last_name || r.user.first_name)
          ? `${r.user.last_name || ""} ${r.user.first_name || ""}`.trim()
          : r.user.username
        : null,
    }));

    return {
      data,
      pagination: {
        totalItems,
        currentPage,
        pageSize: limit,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  },

  getEntities: async () => AuditLogsModel.findDistinctEntities(),

  getUsers: async () => {
    const users = await AuditLogsModel.findDistinctUsers();
    return users
      .map((u) => ({
        id: u.id,
        name:
          u.last_name || u.first_name
            ? `${u.last_name || ""} ${u.first_name || ""}`.trim()
            : u.username,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  restore: async (id, userId) => {
    const log = await AuditLogsModel.findById(id);
    if (!log) throw new Error("Запись истории не найдена");
    if (log.action !== "delete") throw new Error("Восстановить можно только удалённую запись");
    if (!log.old_data) throw new Error("Нет данных для восстановления");
    if (!RESTORABLE_ENTITIES.includes(log.entity)) throw new Error(`Восстановление для "${log.entity}" не поддерживается`);

    const prisma = prismaContext.get();
    const restored = await prisma[log.entity].create({ data: log.old_data });

    await createAuditLog({ userId, action: "restore", entity: log.entity, recordId: restored.id, newData: restored });
    return restored;
  },

  // Массовое восстановление: каждая запись отдельно, ошибки не прерывают остальные
  restoreMany: async (ids, userId) => {
    const list = [...new Set((ids || []).map((x) => parseInt(x, 10)).filter(Number.isInteger))];
    if (!list.length) throw new Error("Не выбрано ни одной записи");
    if (list.length > 500) throw new Error("За раз можно восстановить не более 500 записей");

    let restored = 0;
    const failed = [];
    for (const id of list) {
      try {
        await AuditLogsService.restore(id, userId);
        restored += 1;
      } catch (err) {
        failed.push({ id, error: err.message || "Ошибка" });
      }
    }
    return { restored, failed };
  },
};
