import express from "express";
import * as locationTariffsController from "./locationTariffs.controller.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", locationTariffsController.getTariffs);
router.get("/:id", locationTariffsController.getTariff);
router.post("/", locationTariffsController.addTariff);
router.put("/:id", locationTariffsController.updateTariff);
router.delete("/:id", locationTariffsController.removeTariff);

export default router;
