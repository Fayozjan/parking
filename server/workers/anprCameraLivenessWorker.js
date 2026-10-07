import cron from "node-cron";
import { AnprCamerasService } from "../modules/anprCameras/anprCameras.service.js";

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // камера без событий 5 минут считается кандидатом на офлайн

let isRunning = false;

export function startAnprCameraLivenessWorker() {
  cron.schedule("* * * * *", async () => {
    if (isRunning) return; // предыдущая проверка (активные сетевые запросы) ещё не завершилась
    isRunning = true;
    try {
      const thresholdDate = new Date(Date.now() - OFFLINE_THRESHOLD_MS);
      await AnprCamerasService.runLivenessCheck(thresholdDate);
    } catch (err) {
      console.error("[AnprCameraLiveness] Error:", err);
    } finally {
      isRunning = false;
    }
  });
  console.log("⏰ ANPR camera liveness worker started (checks every minute)");
}
