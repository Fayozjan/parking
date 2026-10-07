import express from "express";
import * as dashboardController from "./dashboard.controller.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/summary", dashboardController.getSummary);
router.get("/analytics", dashboardController.getAnalytics);
router.get("/parkings-by-location", dashboardController.getParkingsByLocation);
router.get("/financial-report", dashboardController.getFinancialReport);
router.get("/occupancy-by-location", dashboardController.getOccupancyByLocation);
router.get("/feeds", dashboardController.getFeeds);
router.get("/location-coordinates", dashboardController.getLocationCoordinates);

export default router;
