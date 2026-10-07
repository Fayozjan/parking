import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { AuditLogsController } from "./auditLogs.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", AuditLogsController.list);
router.get("/entities", AuditLogsController.getEntities);
router.post("/:id/restore", AuditLogsController.restore);

export default router;
