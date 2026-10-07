import path from "path";
import fs from "fs";
import { UserService } from "./users.service.js";
import uploadPhoto from "../../middlewares/uploadPhoto.js";

export const { upload: uploadUserPhoto, convertToJpg: convertUserPhoto } =
  uploadPhoto("users");

export const UserController = {
  create: async (req, res) => {
    const userId = req.user.id;
    try {
      const result = await UserService.create({ ...req.body, createdBy: userId });

      res.status(201).json({
        success: true,
        result,
      });
    } catch (err) {
      console.error(err);

      if (err.code === "P2002") {
        return res
          .status(409)
          .json({ success: false, error: "Такое имя логина уже существует!" });
      }

      res
        .status(err.statusCode || 500)
        .json({ success: false, error: err.message });
    }
  },

  get: async (req, res) => {
    try {
      const { page, pageSize, filters } = req.query;

      const result = await UserService.get(page, pageSize, filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Ошибка получения пользователей" });
    }
  },

  getById: async (req, res) => {
    try {
      const user = await UserService.getById(req.params.id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "Пользователь не найден" });
      }

      res.json({ success: true, data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  },

  getMenu: async (req, res) => {
    try {
      const menu = await UserService.getMenu(req.user.id);
      res.json(menu);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Ошибка получения меню" });
    }
  },

  getInfo: async (req, res) => {
    try {
      const info = await UserService.getInfo(req.user.id);
      res.json(info);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  },

  getAccess: async (req, res) => {
    try {
      const access = await UserService.getAccess(req.user.id);
      res.json({ success: true, data: access });
    } catch (err) {
      console.error("getAccess error:", err.message);
      console.error("getAccess stack:", err.stack);
      res
        .status(err.statusCode || 500)
        .json({ success: false, error: err.message });
    }
  },

  updateById: async (req, res) => {
    const userId = req.user.id;
    try {
      const result = await UserService.updateById(req.params.id, { ...req.body, updatedBy: userId });

      res.json({
        success: true,
        result,
      });
    } catch (err) {
      console.error(err);

      res
        .status(err.statusCode || 500)
        .json({ success: false, error: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const result = await UserService.updateProfile(req.user.id, req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error(err);

      res
        .status(err.statusCode || 500)
        .json({ success: false, error: err.message });
    }
  },

  uploadAvatar: async (req, res) => {
    try {
      const result = await UserService.uploadAvatar(req.params.id, req.file);
      res.json({ success: true, result });
    } catch (err) {
      console.error(err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  },

  deleteAvatar: async (req, res) => {
    try {
      await UserService.deleteAvatar(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
  },

  getImage: async (req, res) => {
    try {
      const rawFilename = req.params[0];
      if (!rawFilename) return res.status(400).json({ error: "Не указан файл" });

      const safeName = path
        .normalize(rawFilename)
        .replace(/^(\.\.(\/|\\|$))+/, "")
        .replace(/^\/+/, "");

      const filePath = path.join(
        process.cwd(),
        "uploads",
        "users",
        safeName.split("/").join(path.sep),
      );

      const uploadsRoot = path.join(process.cwd(), "uploads", "users");
      if (!filePath.startsWith(uploadsRoot + path.sep)) {
        return res.status(403).json({ error: "Доступ запрещён" });
      }

      await fs.promises.access(filePath, fs.constants.R_OK).catch(() => {
        const err = new Error("Файл не найден");
        err.status = 404;
        throw err;
      });

      if (process.env.NODE_ENV === "production") {
        res.setHeader("X-Accel-Redirect", `/internal/users/${safeName}`);
        res.setHeader("Cache-Control", "private, max-age=86400");
        return res.status(200).end();
      }

      res.sendFile(filePath);
    } catch (err) {
      console.error("Ошибка при получении фото пользователя:", err.message);
      res.status(err.status ?? 400).json({ error: err.message });
    }
  },
};
