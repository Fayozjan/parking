import bcrypt from "bcryptjs";
import { UserModel } from "./users.model.js";
import { MenuModel } from "../menus/menus.model.js";
import { createAuditLog } from "../../utils/auditLog.js";

const omitPassword = (u) => u ? (({ password, ...rest }) => rest)(u) : null;

// "HH:MM" -> Date c часом дня в UTC-полях (Prisma db.Time хранит буквально, без зоны)
const toTimeOrNull = (value) => {
  if (!value) return null;
  const [h, m] = value.split(":");
  return new Date(Date.UTC(1970, 0, 1, Number(h) || 0, Number(m) || 0, 0));
};

export const UserService = {
  create: async (data) => {
    const {
      username,
      password,
      first_name,
      last_name,
      telegramId,
      menu,
      can_view_open_parkings,
      access_from,
      access_until,
    } = data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const menuAccess = menu
      ? Object.entries(menu).map(([menu_id, perms]) => ({
          menu_id: Number(menu_id),
          can_view: perms.view,
          can_add: perms.add,
          can_update: perms.update,
          can_delete: perms.delete,
        }))
      : [];

    const result = await UserModel.create({
      username,
      password: hashedPassword,
      first_name: first_name || null,
      last_name: last_name || null,
      telegram_id: telegramId || null,
      status: true,
      can_view_open_parkings: !!can_view_open_parkings,
      access_from: toTimeOrNull(access_from),
      access_until: toTimeOrNull(access_until),
      menuAccess: {
        create: menuAccess,
      },
    });

    await createAuditLog({ userId: data.createdBy, action: "create", entity: "users", recordId: result.id, newData: omitPassword(result) });
    return result;
  },

  get: async (page, limit, filters = {}) => {
    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const limitNumber = Math.max(parseInt(limit) || 50, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const { search, status } = filters || {};

    const where = {
      NOT: { username: "root" },
    };

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status !== undefined && status !== "") {
      where.status = status === "true";
    }

    const [data, total] = await Promise.all([
      UserModel.getList({ skip, take: limitNumber, where }),
      UserModel.count(where),
    ]);

    return {
      data,
      pagination: {
        totalItems: total,
        currentPage: pageNumber,
        pageSize: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  },

  getById: async (id) => {
    return UserModel.getById(Number(id));
  },

  getInfo: async (id) => {
    return UserModel.getInfo(Number(id));
  },

  getAccess: async (userId) => {
    const access = await UserModel.getAccess(userId);

    if (!access) {
      const err = new Error("Пользователь не найден");
      err.statusCode = 404;
      throw err;
    }

    return access;
  },

  updateById: async (id, data) => {
    const {
      username,
      password,
      first_name,
      last_name,
      telegramId,
      status,
      menu,
      can_view_open_parkings,
      access_from,
      access_until,
    } = data;

    const updateData = {
      username,
      first_name: first_name || null,
      last_name: last_name || null,
      telegram_id: telegramId || null,
      status,
    };

    if (can_view_open_parkings !== undefined) {
      updateData.can_view_open_parkings = !!can_view_open_parkings;
    }

    if (access_from !== undefined) {
      updateData.access_from = toTimeOrNull(access_from);
    }

    if (access_until !== undefined) {
      updateData.access_until = toTimeOrNull(access_until);
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const menuAccessOperations =
      menu && Object.keys(menu).length
        ? Object.entries(menu).map(([menu_id, m]) => ({
            user_id: Number(id),
            menu_id: Number(menu_id),
            can_view: !!m.view,
            can_add: !!m.add,
            can_update: !!m.update,
            can_delete: !!m.delete,
          }))
        : [];

    const old = await UserModel.getById(Number(id));
    const result = await UserModel.updateById(id, updateData, menuAccessOperations);
    await createAuditLog({ userId: data.updatedBy, action: "update", entity: "users", recordId: id, oldData: omitPassword(old), newData: omitPassword(result) });
    return result;
  },

  getMenu: async (userId) => {
    const [accesses, menus] = await Promise.all([
      UserModel.getMenuAccess(userId),
      MenuModel.getAllMenus(),
    ]);

    const accessMap = new Map();
    accesses.forEach((a) => accessMap.set(a.menu_id, a));

    const buildTree = (parentId = null) => {
      return menus
        .filter((m) => m.parent_id === parentId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((menu) => {
          const children = buildTree(menu.id);
          const perms = accessMap.get(menu.id);

          const canView = (perms && perms.can_view) || children.length > 0;

          if (!canView) return null;

          return {
            id: menu.id,
            name: menu.name,
            path: menu.path,
            sort_order: menu.sort_order,
            permissions: {
              view: canView,
              add: !!perms?.can_add,
              update: !!perms?.can_update,
              delete: !!perms?.can_delete,
            },
            children,
          };
        })
        .filter(Boolean);
    };

    return buildTree();
  },

  updateProfile: async (userId, data) => {
    const {
      currentPassword,
      newPassword,
      theme,
      language,
      settings,
      first_name,
      last_name,
    } = data;

    const user = await UserModel.getWithPassword(userId);

    if (!user) {
      const err = new Error("Пользователь не найден");
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};

    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        const err = new Error("Текущий пароль неверный");
        err.statusCode = 400;
        throw err;
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (theme !== undefined) updateData.theme = theme;
    if (language !== undefined) updateData.language = language;
    if (settings !== undefined) updateData.settings = settings;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;

    return UserModel.updateProfile(userId, updateData);
  },

  uploadAvatar: async (id, file) => {
    if (!file) {
      const err = new Error("No file uploaded");
      err.statusCode = 400;
      throw err;
    }
    return UserModel.updateAvatar(Number(id), file.filename);
  },

  deleteAvatar: async (id) => {
    return UserModel.updateAvatar(Number(id), null);
  },
};
