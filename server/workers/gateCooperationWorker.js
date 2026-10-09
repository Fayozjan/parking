import cron from "node-cron";
import { GateCooperationService } from "../modules/gates/gateCooperation.service.js";

let isRunning = false;

export function startGateCooperationWorker() {
  cron.schedule("*/5 * * * * *", async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await GateCooperationService.processDue();
    } catch (err) {
      console.error("[GateCooperation] Error:", err);
    } finally {
      isRunning = false;
    }
  });
  console.log("⏰ Gate cooperation worker started (checks every 5 seconds)");
}
