import { Router } from "express";
import { trainingAccessMiddleware } from "./aiTraining.middleware.js";
import { AiTrainingController } from "./aiTraining.controller.js";

const router = Router();

router.use(trainingAccessMiddleware);
router.get("/summary", AiTrainingController.summary);
router.get("/plan", AiTrainingController.plan);
router.get("/export", AiTrainingController.export);

export default router;
