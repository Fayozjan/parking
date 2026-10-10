import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { logger } from "./middlewares/logger.js";
import { authPhotoMiddleware } from "./middlewares/authMiddleware.js";
import routes from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        // Тест по http://IP: иначе браузер переписывает запросы на https и страница пустая
        upgradeInsecureRequests: null,
      },
    },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Static uploads — auth required
app.use("/uploads", authPhotoMiddleware, express.static(path.resolve(__dirname, "uploads/vehicle-passes")));

// API routes
app.use("/api", routes);

// Serve admin panel for admin subdomain (production)
const adminDist = path.resolve(__dirname, "../admin/dist");
app.use((req, res, next) => {
  const host = req.headers.host || "";
  const subdomain = host.split(":")[0].split(".")[0];
  if (subdomain === "admin") {
    return express.static(adminDist)(req, res, () => {
      res.sendFile(path.join(adminDist, "index.html"));
    });
  }
  next();
});

// Serve client SPA (client/dist) — SPA fallback for everything except /api and /uploads
const clientDist = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(path.join(clientDist, "index.html"))) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

export default app;
