"""Предразметка: ставит bbox на номера готовым детектором, класс по умолчанию plate_front.

    python train/prelabel.py

Читает фото из dataset/inbox (любые вложенные папки; jpg/jpeg/png/bmp/webp), пишет dataset/prelabeled/{images,labels}.
Кадры уменьшаются до 1280 px по ширине, почти одинаковые кадры (один проезд подряд) отбрасываются.
Дальше: python train/labeler.py — выбрать сторону (спереди/сзади).
"""
import json
import re
import sys
from pathlib import Path

import cv2
import numpy as np
from open_image_models import create_detector

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "dataset" / "inbox"
OUT = ROOT / "dataset" / "prelabeled"
SEEN = ROOT / "dataset" / "prelabel_seen.json"
EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
DEFAULT_CLASS = 0  # plate_front
MIN_CONF = 0.3
MAX_WIDTH = 1280
# Порог «одинаковости» кадров: расстояние Хэмминга между 64-битными dHash. 0 — идентичны.
DUP_HAMMING = 6


def dhash(img: np.ndarray) -> int:
    small = cv2.resize(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (9, 8), interpolation=cv2.INTER_AREA)
    bits = (small[:, 1:] > small[:, :-1]).flatten()
    return int("".join("1" if b else "0" for b in bits), 2)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    all_files = sorted(p for p in INBOX.rglob("*") if p.suffix.lower() in EXTS)
    if not all_files:
        sys.exit(f"В {INBOX} нет фото. Положите туда файлы jpg/png и запустите снова.")

    # Инкрементально: уже разобранные кадры (взяты, дубли, без номера) пропускаем — повторный запуск
    # обрабатывает только новые. Чтобы разобрать всё заново, удалите dataset/prelabel_seen.json.
    seen = set(json.loads(SEEN.read_text(encoding="utf-8"))) if SEEN.exists() else set()
    rel = lambda p: p.relative_to(INBOX).as_posix()  # noqa: E731
    files = [p for p in all_files if rel(p) not in seen]
    if not files:
        print(f"Новых кадров нет (в inbox {len(all_files)}, все уже разобраны).")
        return

    detector = create_detector("yolo-v9-t-640-license-plate-end2end", conf_thresh=MIN_CONF)
    (OUT / "images").mkdir(parents=True, exist_ok=True)
    (OUT / "labels").mkdir(parents=True, exist_ok=True)

    stats = {"total": len(files), "kept": 0, "no_plate": 0, "duplicate": 0, "unreadable": 0}
    # Дубли ищем и среди уже взятых кадров, иначе новый проезд повторит старый
    hashes: list[int] = []
    used: set[str] = set()
    for old in (OUT / "images").glob("*.jpg"):
        used.add(old.stem)
        img = cv2.imdecode(np.fromfile(str(old), dtype=np.uint8), cv2.IMREAD_COLOR)
        if img is not None:
            hashes.append(dhash(img))

    for path in files:
        seen.add(rel(path))
        # imdecode + fromfile — cv2.imread не читает пути с кириллицей на Windows
        frame = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            stats["unreadable"] += 1
            continue

        h = dhash(frame)
        if any(bin(h ^ other).count("1") <= DUP_HAMMING for other in hashes):
            stats["duplicate"] += 1
            continue

        if frame.shape[1] > MAX_WIDTH:
            scale = MAX_WIDTH / frame.shape[1]
            frame = cv2.resize(frame, (MAX_WIDTH, round(frame.shape[0] * scale)), interpolation=cv2.INTER_AREA)

        height, width = frame.shape[:2]
        # Одна рамка на кадр — самая крупная (номер главной машины). Номера машин на фоне и ложные
        # срабатывания на вывесках отбрасываем: сторону мы отмечаем одним нажатием на весь кадр.
        boxes = [d.bounding_box for d in detector.predict(frame) if d.bounding_box.area > 0]
        lines = []
        if boxes:
            x1, y1, x2, y2 = max(boxes, key=lambda b: b.area).xyxy
            bw, bh = x2 - x1, y2 - y1
            lines.append(
                f"{DEFAULT_CLASS} {(x1 + bw / 2) / width:.6f} {(y1 + bh / 2) / height:.6f} "
                f"{bw / width:.6f} {bh / height:.6f}"
            )

        # Кадры без номера в разметку не берём — нечему учиться
        if not lines:
            stats["no_plate"] += 1
            continue

        hashes.append(h)
        # Имя файла: безопасное и уникальное, т.к. по нему же идут метки и сортировка по порядку
        stem = re.sub(r"[^\w.-]", "_", path.stem)
        name, n = stem, 1
        while name in used:
            name, n = f"{stem}_{n}", n + 1
        used.add(name)

        cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 88])[1].tofile(str(OUT / "images" / f"{name}.jpg"))
        (OUT / "labels" / f"{name}.txt").write_text("\n".join(lines) + "\n")
        stats["kept"] += 1

    SEEN.write_text(json.dumps(sorted(seen)), encoding="utf-8")
    print(stats, "->", OUT)


if __name__ == "__main__":
    main()
