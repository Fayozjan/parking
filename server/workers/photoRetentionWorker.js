import cron from "node-cron";
import fs from "fs";
import path from "path";
import { prismaContext } from "../utils/prismaContext.js";

// Чистка старых снимков. Отключена, пока PHOTO_RETENTION_DAYS не задан.
const RETENTION_DAYS = Number(process.env.PHOTO_RETENTION_DAYS) || 0;
const BATCH = 500;

const VEHICLE_PASSES_ROOT = path.join(process.cwd(), "uploads", "vehicle-passes");
const CAMERA_LOGS_ROOT = path.join(process.cwd(), "uploads", "camera-logs");

// удаляем файл, только если он внутри одной из папок uploads.
// seen — один файл может быть указан у нескольких строк, размер считаем раз.
async function unlinkInside(roots, relativePath, dryRun, seen) {
  if (!relativePath) return 0;

  let freed = 0;

  for (const root of roots) {
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root + path.sep)) continue;
    if (seen.has(filePath)) continue;

    const size = await fs.promises
      .stat(filePath)
      .then((s) => s.size)
      .catch(() => 0);
    if (!size) continue;

    seen.add(filePath);
    if (!dryRun) await fs.promises.unlink(filePath).catch(() => {});
    freed += size;
  }

  return freed;
}

// Записи не удаляем — обнуляем только photo, история фиксаций остаётся.
async function purge({ table, dateField, roots, days, dryRun }) {
  const prisma = prismaContext.get();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  let cleared = 0;
  let freed = 0;
  let cursor = 0;
  let files = 0;
  const seen = new Set();

  for (;;) {
    const rows = await prisma[table].findMany({
      where: { [dateField]: { lt: cutoff }, photo: { not: null }, id: { gt: cursor } },
      select: { id: true, photo: true },
      orderBy: { id: "asc" },
      take: BATCH,
    });
    if (!rows.length) break;

    for (const row of rows) {
      const before = seen.size;
      freed += await unlinkInside(roots, row.photo, dryRun, seen);
      files += seen.size - before;
    }

    if (!dryRun) {
      await prisma[table].updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { photo: null },
      });
    }

    cleared += rows.length;
    // в dry-run строки остаются с photo, поэтому идём по курсору, а не по take
    cursor = rows[rows.length - 1].id;
  }

  return { cleared, files, freed };
}

// после удаления файлов остаются пустые папки год/месяц
async function removeEmptyDirs(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (entry.isDirectory()) await removeEmptyDirs(path.join(dir, entry.name));
  }

  const rest = await fs.promises.readdir(dir).catch(() => ["keep"]);
  if (!rest.length) await fs.promises.rmdir(dir).catch(() => {});
}

// days/dryRun переопределяются разовым запуском из scripts/purgePhotos.js
export async function runPhotoRetention({ days = RETENTION_DAYS, dryRun = false } = {}) {
  const passes = await purge({
    table: "vehicle_passes",
    dateField: "date",
    roots: [VEHICLE_PASSES_ROOT],
    days,
    dryRun,
  });
  // Журнал камер ссылается либо на свою миниатюру, либо на кадр фиксации —
  // после дедупа снимок один, поэтому ищем в обеих папках.
  const logs = await purge({
    table: "camera_logs",
    dateField: "event_date",
    roots: [CAMERA_LOGS_ROOT, VEHICLE_PASSES_ROOT],
    days,
    dryRun,
  });

  if (!dryRun) {
    await removeEmptyDirs(VEHICLE_PASSES_ROOT);
    await removeEmptyDirs(CAMERA_LOGS_ROOT);
  }

  return { passes, logs, days, dryRun };
}

async function run() {
  try {
    const { passes, logs } = await runPhotoRetention();

    console.log(
      `[PhotoRetention] Удалено снимков: фиксации ${passes.cleared}, журнал камер ${logs.cleared} (старше ${RETENTION_DAYS} дн.)`,
    );
  } catch (err) {
    console.error("[PhotoRetention] Error:", err);
  }
}

export function startPhotoRetentionWorker() {
  if (RETENTION_DAYS <= 0) return;

  cron.schedule("30 3 * * *", run);
  console.log(`⏰ Photo retention worker started (хранение ${RETENTION_DAYS} дн.)`);
}
