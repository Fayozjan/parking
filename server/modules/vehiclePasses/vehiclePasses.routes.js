import { Router } from "express";
import multer from "multer";
import {
  authMiddleware,
  authPhotoMiddleware,
} from "../../middlewares/authMiddleware.js";
import { VehiclePassesController } from "./vehiclePasses.controller.js";

const router = Router();

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Разрешены только изображения"));
    }
    cb(null, true);
  },
}).single("photo");

// multer-ошибки (тип файла, размер) отдаём как 400, а не 500
const uploadPassPhoto = (req, res, next) => {
  uploadImage(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

router.get("/image/*", authPhotoMiddleware, VehiclePassesController.getImage);

router.use(authMiddleware);

router.get("/export", VehiclePassesController.exportToExcel);
router.get("/", VehiclePassesController.get);
router.post("/", uploadPassPhoto, VehiclePassesController.create);
router.post("/bulk", VehiclePassesController.createBulk);
router.get("/:id", VehiclePassesController.getById);
router.put("/:id", uploadPassPhoto, VehiclePassesController.updateById);
router.delete("/:id", VehiclePassesController.deleteById);

export default router;
