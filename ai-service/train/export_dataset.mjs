// Выгружает кадры фиксаций из БД в ai-service/dataset/raw для ручной разметки (CVAT / Roboflow / LabelImg).
// Запускать из server/ (нужен .env с доступом к БД):
//   cd server && node ../ai-service/train/export_dataset.mjs 1000
import fs from "fs";
import path from "path";
import pool from "../../server/db.js";

const limit = Number(process.argv[2]) || 1000;
const outDir = path.resolve("../ai-service/dataset/raw");
fs.mkdirSync(outDir, { recursive: true });

const { rows } = await pool.query(
  `SELECT id, photo FROM vehicle_passes
   WHERE photo IS NOT NULL AND is_hidden = false
   ORDER BY id DESC LIMIT $1`,
  [limit],
);

let copied = 0;
for (const row of rows) {
  const src = path.resolve("uploads", "vehicle-passes", row.photo);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(outDir, `${row.id}.jpg`));
  copied++;
}
console.log(`Выгружено ${copied} из ${rows.length} → ${outDir}`);
await pool.end();
