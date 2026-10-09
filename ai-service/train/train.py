"""Обучение детектора plate_front / plate_rear и экспорт в ONNX для сервиса.

    pip install -r requirements-train.txt
    python train/train.py --data train/data.yaml --epochs 80

Результат копируется в models/plate_side.onnx.
"""
import argparse
import shutil
from pathlib import Path

from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(ROOT / "dataset" / "yolo" / "data.yaml"))
    ap.add_argument("--base", default="yolov8n.pt", help="Базовые веса (скачаются автоматически)")
    ap.add_argument("--epochs", type=int, default=80)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--device", default="cpu", help="cpu | 0 (GPU)")
    ap.add_argument("--name", default="plate_side", help="Имя запуска в runs/")
    ap.add_argument("--fraction", type=float, default=1.0, help="Доля датасета (для быстрого теста)")
    ap.add_argument("--out", default=str(ROOT / "models" / "plate_side.onnx"), help="Куда положить ONNX")
    args = ap.parse_args()

    model = YOLO(args.base)
    model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        device=args.device,
        project=str(ROOT / "runs"),
        name=args.name,
        fraction=args.fraction,
        patience=8,  # ранняя остановка: 8 эпох без улучшения
        exist_ok=True,
        # Зеркало сторону (front/rear) не меняет — горизонтальный флип безопасен,
        # вертикальный бессмысленен для камер на воротах
        flipud=0.0,
        fliplr=0.5,
    )

    best = ROOT / "runs" / args.name / "weights" / "best.pt"
    onnx_path = Path(YOLO(str(best)).export(format="onnx", imgsz=args.imgsz, simplify=True, opset=12))
    target = Path(args.out)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(onnx_path, target)
    print(f"Готово: {target}")


if __name__ == "__main__":
    main()
