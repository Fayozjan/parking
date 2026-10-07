import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { authPhotoMiddleware } from "../../middlewares/authMiddleware.js";
import { CameraLogsController } from "./cameraLogs.controller.js";

const router = Router();

router.get("/image/*", authPhotoMiddleware, CameraLogsController.getImage);

router.use(authMiddleware);
router.get("/", CameraLogsController.getAll);

export default router;
