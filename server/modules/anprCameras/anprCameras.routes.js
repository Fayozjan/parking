import express from "express";
import multer from "multer";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { AnprCamerasController } from "./anprCameras.controller.js";

const upload = multer({ dest: "tmp/" });

const router = express.Router();

router.post(
  "/vehicleDetection",
  upload.any(),
  AnprCamerasController.vehicleDetection,
);

router.use(authMiddleware);

router.get("/", AnprCamerasController.getAll);
router.get("/list", AnprCamerasController.list);
router.get("/:id", AnprCamerasController.getById);
router.post("/", AnprCamerasController.create);
router.put("/:id", AnprCamerasController.update);

export default router;
