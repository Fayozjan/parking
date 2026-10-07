import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { loginLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

router.post("/login", loginLimiter, AuthController.login);
router.post("/telegram", loginLimiter, AuthController.telegramLogin);
router.post("/logout", AuthController.logout);
router.post("/refresh", loginLimiter, AuthController.refresh);
router.get("/me", authMiddleware, AuthController.me);

export default router;
