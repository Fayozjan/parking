import express from "express";
import { authMiddleware, authPhotoMiddleware } from "../../middlewares/authMiddleware.js";
import { UserController, uploadUserPhoto, convertUserPhoto } from "./users.controller.js";

const router = express.Router();

router.get("/image/*", authPhotoMiddleware, UserController.getImage);

router.use(authMiddleware);

router.get("/", UserController.get);
router.put("/me", UserController.updateProfile);
router.get("/me", UserController.getInfo);
router.get("/me/access", UserController.getAccess);
router.get("/menu", UserController.getMenu);
router.get("/:id", UserController.getById);
router.post("/", UserController.create);
router.put("/:id/avatar", uploadUserPhoto, convertUserPhoto, UserController.uploadAvatar);
router.delete("/:id/avatar", UserController.deleteAvatar);
router.put("/:id", UserController.updateById);

export default router;
