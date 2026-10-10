import crypto from "crypto";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

// Доступ к выгрузке двумя способами:
//   • страница админки — обычный вход пользователя (cookie/JWT), так можно качать zip прямо из браузера;
//   • скрипт ai-service (ft pull) — токен AI_TRAINING_TOKEN в Authorization: Bearer, у скрипта нет сессии.
// Токен не задан — работает только вход пользователя.
const digest = (value) => crypto.createHash("sha256").update(String(value)).digest();

const hasValidToken = (req) => {
  const expected = process.env.AI_TRAINING_TOKEN;
  const given = req.headers.authorization?.split(" ")[1];
  return Boolean(expected && given) && crypto.timingSafeEqual(digest(given), digest(expected));
};

export const trainingAccessMiddleware = (req, res, next) => {
  if (hasValidToken(req)) return next();
  return authMiddleware(req, res, next);
};
