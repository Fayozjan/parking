import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { GatesController } from "./gates.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", GatesController.getAll);
router.get("/:id", GatesController.getById);
router.post("/", GatesController.create);
router.put("/:id", GatesController.update);
router.delete("/:id", GatesController.remove);

export default router;
