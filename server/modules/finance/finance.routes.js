import express from "express";
import * as financeController from "./finance.controller.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/summary", financeController.getSummary);
router.get("/location-parkings", financeController.getParkings);
router.post("/close-parking", financeController.closeParking);
router.delete("/close-parking/:exitId", financeController.cancelParking);

export default router;
