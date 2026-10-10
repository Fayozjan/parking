import { Router } from "express";

import vehiclePassesRouter from "../modules/vehiclePasses/vehiclePasses.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import locationsRoutes from "../modules/locations/locations.routes.js";
import anprCamerasRoutes from "../modules/anprCameras/anprCameras.routes.js";
import menusRoutes from "../modules/menus/menus.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import auditLogsRoutes from "../modules/auditLogs/auditLogs.routes.js";
import locationTariffsRoutes from "../modules/locationTariffs/locationTariffs.routes.js";
import financeRoutes from "../modules/finance/finance.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import vehicleWhitelistRoutes from "../modules/vehicleWhitelist/vehicleWhitelist.routes.js";
import cameraLogsRoutes from "../modules/cameraLogs/cameraLogs.routes.js";
import gatesRoutes from "../modules/gates/gates.routes.js";
import aiTrainingRoutes from "../modules/aiTraining/aiTraining.routes.js";

const router = Router();

// Auth
router.use("/auth", authRoutes);

// Modules
router.use("/vehicle-passes", vehiclePassesRouter);
router.use("/users", usersRoutes);
router.use("/locations", locationsRoutes);
router.use("/anpr-cameras", anprCamerasRoutes);
router.use("/menus", menusRoutes);

router.use("/audit-logs", auditLogsRoutes);
router.use("/location-tariffs", locationTariffsRoutes);
router.use("/finance", financeRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/vehicle-whitelist", vehicleWhitelistRoutes);
router.use("/camera-logs", cameraLogsRoutes);
router.use("/gates", gatesRoutes);
router.use("/ai-training", aiTrainingRoutes);

export default router;
