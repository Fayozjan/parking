import app from "./app.js";
import { config } from "./config.js";
import { disconnectAll } from "./utils/prismaForTenant.js";
import pool from "./db.js";

import { startNotificationsWorker } from "./workers/notificationsWorker.js";
import { startAnprCameraLivenessWorker } from "./workers/anprCameraLivenessWorker.js";
import { startPhotoRetentionWorker } from "./workers/photoRetentionWorker.js";
import { startTelegramBot } from "./services/telegram-bot/bot.js";
import { initDatabase } from "./utils/initDatabase.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

async function shutdown() {
  await disconnectAll();
  await pool.end();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Server running on port ${config.port}`);
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ Ошибка: Переменная окружения DATABASE_URL не задана!");
  }

  initDatabase(databaseUrl);

  startNotificationsWorker();
  startAnprCameraLivenessWorker();
  startPhotoRetentionWorker();
});

if (process.env.BOT_TOKEN) {
  startTelegramBot().catch((err) =>
    console.error("❌ Бот не запустился:", err),
  );
}
