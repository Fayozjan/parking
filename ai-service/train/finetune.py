"""Дообучение детектора от текущей модели + сравнение с ней на том же val. Запускается из pipeline.py (venv с ultralytics).

    python train/finetune.py --epochs 15

Боевую models/plate_side.onnx НЕ трогает: каждая версия кладётся в models/versions/plate_side_vN.onnx (существующие файлы
не перезаписываются), решение принимает `pipeline.py promote`. История запусков — dataset/pipeline.json → history.
"""
import argparse
import json
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "dataset" / "pipeline.json"
DATA = ROOT / "dataset" / "yolo" / "data.yaml"
# Кандидат принимается, если mAP50-95 не просел больше чем на это (шум оценки на небольшом val)
TOLERANCE = 0.003


def load_state() -> dict:
    return json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}


def next_name() -> str:
    # Номер больше любого уже занятого: в runs/ (обучения), models/ и models/versions/ (файлы моделей)
    taken = [p.stem if p.suffix else p.name for p in (ROOT / "runs").glob("plate_side_v*")]
    taken += [p.stem for p in (ROOT / "models").rglob("plate_side_v*.onnx")]
    nums = [int(m.group(1)) for n in taken if (m := re.fullmatch(r"plate_side_v(\d+)", n))]
    return f"plate_side_v{max(nums, default=1) + 1}"


def count_images(split: str) -> int:
    return sum(1 for _ in (ROOT / "dataset" / "yolo" / "images" / split).glob("*.jpg"))


def evaluate(weights: Path, device: str) -> dict:
    m = YOLO(str(weights)).val(data=str(DATA), device=device, imgsz=640, plots=False, verbose=False)
    return {"map50": float(m.box.map50), "map": float(m.box.map), "per_class": [float(x) for x in m.box.maps]}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--device", default="cpu", help="cpu | 0 (GPU)")
    ap.add_argument("--imgsz", type=int, default=640)
    args = ap.parse_args()

    state = load_state()
    current = state.get("current", "plate_side_v2")
    base = ROOT / "runs" / current / "weights" / "best.pt"
    if not base.is_file():
        sys.exit(f"Нет базовых весов {base}. Укажите текущую модель в dataset/pipeline.json: {{\"current\": \"<имя запуска в runs/>\"}}")
    if not DATA.is_file():
        sys.exit("Нет dataset/yolo — сначала `pipeline.py build`.")

    name = next_name()
    print(f"Дообучение {current} -> {name}, {args.epochs} эпох, device={args.device}")
    YOLO(str(base)).train(
        data=str(DATA), epochs=args.epochs, imgsz=args.imgsz, device=args.device,
        project=str(ROOT / "runs"), name=name, exist_ok=True,
        patience=8,
        flipud=0.0, fliplr=0.5,  # зеркало сторону не меняет, вертикальный флип бессмыслен
    )
    best = ROOT / "runs" / name / "weights" / "best.pt"

    # Обе модели — на одном и том же val (он сохраняется между сборками датасета)
    old, new = evaluate(base, args.device), evaluate(best, args.device)
    ok = new["map"] >= old["map"] - TOLERANCE
    print(f"\n{'':10}{'mAP50':>8}{'mAP50-95':>10}  по классам (front, rear)")
    for label, r in (("текущая", old), ("новая", new)):
        print(f"{label:10}{r['map50']:8.3f}{r['map']:10.3f}  {[round(x, 3) for x in r['per_class']]}")
    print("РЕЗУЛЬТАТ:", "новая не хуже — можно promote" if ok else "новая ХУЖЕ текущей — не выкатывать")

    onnx = Path(YOLO(str(best)).export(format="onnx", imgsz=args.imgsz, simplify=True, opset=12))
    target = ROOT / "models" / "versions" / f"{name}.onnx"
    if target.exists():
        sys.exit(f"{target} уже есть — версии не перезаписываются.")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(onnx, target)

    state = load_state()
    entry = {
        "name": name, "trained_at": datetime.now().isoformat(timespec="seconds"), "base": current,
        "epochs": args.epochs, "device": args.device,
        "train_images": count_images("train"), "val_images": count_images("val"),
        "old_map": old["map"], "new_map": new["map"], "old_map50": old["map50"], "new_map50": new["map50"],
        "ok": ok,
    }
    state.setdefault("history", []).append(entry)
    state["candidate"] = {"name": name, "onnx": target.relative_to(ROOT).as_posix(), "ok": ok, "old": old, "new": new}
    STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Версия {name}: {target}")
    print(f"Выкатить: ft promote   (список версий: ft models, откат: ft promote {current})")


if __name__ == "__main__":
    main()
