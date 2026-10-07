import sharp from "sharp";

// Сырые кадры с камер весят 330-450 КБ. Пережимаем перед сохранением на диск.
// Если sharp не смог обработать кадр — отдаём оригинал, чтобы не потерять фото.

const FULL = { width: 1600, height: 1600, quality: 80 };
const THUMB = { width: 640, height: 640, quality: 70 };

async function toJpeg(imageBuffer, { width, height, quality }) {
  if (!imageBuffer) return null;

  try {
    return await sharp(imageBuffer)
      .rotate()
      .resize({ width, height, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    console.error("photoImage: не удалось пережать кадр:", err.message);
    return imageBuffer;
  }
}

// Снимок фиксации (vehicle_passes) — ~80-120 КБ
export function compressEventPhoto(imageBuffer) {
  return toJpeg(imageBuffer, FULL);
}

// Миниатюра для журнала камер (camera_logs) — ~20-35 КБ.
// В журнале фото нужно только для беглой проверки распознавания.
export function makeThumbnail(imageBuffer) {
  return toJpeg(imageBuffer, THUMB);
}
