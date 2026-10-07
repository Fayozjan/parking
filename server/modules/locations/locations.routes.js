import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { LocationsController } from "./locations.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", LocationsController.getAll);
router.get("/active", LocationsController.getActive);
router.get("/:id/tariff-history", LocationsController.getTariffHistory);
router.post("/:id/tariff-history", LocationsController.addTariffHistory);
router.put("/:locationId/tariff-history/:historyId", LocationsController.updateTariffHistory);
router.delete("/:locationId/tariff-history/:historyId", LocationsController.deleteTariffHistory);
router.get("/:id", LocationsController.getById);
router.post("/", LocationsController.create);
router.put("/:id", LocationsController.update);

export default router;
