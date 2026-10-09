// PM2: Node-сервер и AI-сервис (ai-service, Python) одной командой.
//   pm2 start ecosystem.config.cjs                    — оба
//   pm2 start ecosystem.config.cjs --only onbase-ai   — только AI (если Node уже под PM2 с другим именем)
//   pm2 save && pm2 startup                           — запуск после перезагрузки сервера
// Подготовка AI на сервере (один раз): ai-service/setup.sh
const path = require("path");

const isWin = process.platform === "win32";

module.exports = {
  apps: [
    {
      name: "onbase-server",
      cwd: path.join(__dirname, "server"),
      script: "server.js",
      autorestart: true,
      max_restarts: 20,
      min_uptime: "10s",
    },
    {
      name: "onbase-ai",
      cwd: path.join(__dirname, "ai-service"),
      // Запускаем python из venv напрямую, без интерпретатора PM2
      script: isWin ? ".venv/Scripts/python.exe" : ".venv/bin/python",
      args: "-m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      interpreter: "none",
      autorestart: true,
      // Модели грузятся ~10 с; при падении повторы с нарастающей паузой, чтобы не молотить CPU
      exp_backoff_restart_delay: 2000,
      min_uptime: "30s",
      max_restarts: 20,
      // Страховка от утечки памяти: штатно сервис занимает ~300–500 МБ
      max_memory_restart: "1500M",
      kill_timeout: 5000,
      env: { PYTHONUNBUFFERED: "1" },
    },
  ],
};
