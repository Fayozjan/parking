// Разовая чистка старых снимков — тот же код, что и у ночного воркера.
//   node scripts/purgePhotos.js --days=60           — отчёт, ничего не трогает
//   node scripts/purgePhotos.js --days=60 --apply   — удаляет файлы и обнуляет photo
//
// Строки в БД остаются, обнуляется только photo — история фиксаций и журнала цела.

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const { runPhotoRetention } = await import("../workers/photoRetentionWorker.js");

const APPLY = process.argv.includes("--apply");
const daysArg = process.argv.find((a) => a.startsWith("--days="));
const days = Number(daysArg?.split("=")[1] ?? process.env.PHOTO_RETENTION_DAYS ?? 0);

if (!Number.isFinite(days) || days <= 0) {
  console.error("Укажи срок хранения: --days=60");
  process.exit(1);
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);

const { passes, logs } = await runPhotoRetention({ days, dryRun: !APPLY });

console.log(APPLY ? "Режим: удаление" : "Режим: отчёт (--apply чтобы удалить)");
console.log(`Порог: старше ${days} дн.`);
console.log(`Фиксации:     ${passes.cleared} строк, ${passes.files} файлов, ${mb(passes.freed)} МБ`);
console.log(`Журнал камер: ${logs.cleared} строк, ${logs.files} файлов, ${mb(logs.freed)} МБ`);
console.log(`ИТОГО освободится: ${mb(passes.freed + logs.freed)} МБ`);

process.exit(0);
