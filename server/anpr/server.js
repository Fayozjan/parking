// server.js
import http from "http";
import { handleMultipartRequest } from "./utils/handleMultipartRequest.js";

const server = http.createServer((req, res) => {
  if (req.method === "POST") {
    handleMultipartRequest(req, res);
  } else {
    res.writeHead(200);
    res.end("Сервер ANPR готов принимать POST");
  }
});

server.listen(3003, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${3003}`);
});

// Ловим необработанные исключения
process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err);
  process.exit(1); // Важно: выход, чтобы PM2 перезапустил процесс
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ unhandledRejection:", reason);
  process.exit(1); // Важно: выход, чтобы PM2 перезапустил процесс
});
