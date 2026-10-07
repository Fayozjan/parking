// Разовое пережатие уже сохранённых снимков.
//   node scripts/recompressPhotos.js           — только отчёт, файлы не трогает
//   node scripts/recompressPhotos.js --apply   — перезаписывает файлы
//
// Снимки фиксаций жмём до 1600px, журнал камер — до миниатюр 640px.
// Файл перезаписывается, только если результат реально меньше оригинала.

import fs from "fs";
import path from "path";
import { compressEventPhoto, makeThumbnail } from "../utils/photoImage.js";

const APPLY = process.argv.includes("--apply");

const TARGETS = [
  {
    name: "vehicle-passes",
    root: path.join(process.cwd(), "uploads", "vehicle-passes"),
    compress: compressEventPhoto,
  },
  {
    name: "camera-logs",
    root: path.join(process.cwd(), "uploads", "camera-logs"),
    compress: makeThumbnail,
  },
];

async function* walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.jpe?g$/i.test(entry.name)) yield full;
  }
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);

async function processTarget({ name, root, compress }) {
  let before = 0;
  let after = 0;
  let files = 0;
  let rewritten = 0;

  for await (const filePath of walk(root)) {
    const original = await fs.promises.readFile(filePath);
    files += 1;
    before += original.length;

    const compressed = await compress(original);

    if (compressed.length >= original.length) {
      after += original.length;
      continue;
    }

    after += compressed.length;
    rewritten += 1;

    // пишем во временный файл и переименовываем, чтобы не потерять снимок при сбое
    if (APPLY) {
      const tmp = `${filePath}.tmp`;
      await fs.promises.writeFile(tmp, compressed);
      await fs.promises.rename(tmp, filePath);
    }
  }

  console.log(
    `${name}: ${files} файлов, ${mb(before)} МБ → ${mb(after)} МБ ` +
      `(экономия ${mb(before - after)} МБ, пережато ${rewritten})`,
  );

  return { before, after };
}

async function main() {
  console.log(APPLY ? "Режим: перезапись файлов" : "Режим: отчёт (--apply чтобы применить)");

  let before = 0;
  let after = 0;

  for (const target of TARGETS) {
    const result = await processTarget(target);
    before += result.before;
    after += result.after;
  }

  console.log(`ИТОГО: ${mb(before)} МБ → ${mb(after)} МБ (экономия ${mb(before - after)} МБ)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
