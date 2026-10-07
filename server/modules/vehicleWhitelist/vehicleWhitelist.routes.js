import express from "express";
import multer from "multer";
import * as vehicleWhitelistController from "./vehicleWhitelist.controller.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isExcel =
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      /\.(xlsx|xls)$/i.test(file.originalname);
    if (!isExcel) return cb(new Error("Only Excel files allowed"));
    cb(null, true);
  },
});

router.use(authMiddleware);

router.get("/", vehicleWhitelistController.getAll);

// Папки — до "/:id", иначе перехватывается динамическим маршрутом
router.get("/folders", vehicleWhitelistController.getFolders);
router.post("/folders", vehicleWhitelistController.addFolder);
router.put("/folders/:id", vehicleWhitelistController.updateFolder);
router.delete("/folders/:id", vehicleWhitelistController.removeFolder);

router.get("/hik-devices", vehicleWhitelistController.getHikDevices);
router.post("/sync-cameras", vehicleWhitelistController.syncCameras);
router.post("/test-camera/:cameraId", vehicleWhitelistController.testCameraConnection);
router.post("/import", uploadExcel.single("file"), vehicleWhitelistController.importFromExcel);

router.get("/:id", vehicleWhitelistController.getOne);
router.post("/", vehicleWhitelistController.addOne);
router.put("/:id", vehicleWhitelistController.updateOne);
router.delete("/:id", vehicleWhitelistController.removeOne);

export default router;
