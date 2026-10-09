"""AI-сервис парковки: номер + сторона транспорта (передом/задом) по одному кадру.

POST /recognize  multipart: image=<jpeg>  →  {found, plate, plate_confidence, side, side_confidence, bbox}
GET  /health
"""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile

from .detector import PlateSideDetector
from .ocr import PlateOcr

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("ai-service")

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = Path(os.getenv("DETECTOR_MODEL_PATH", BASE_DIR / "models" / "plate_side.onnx"))
OCR_MODEL = os.getenv("OCR_MODEL", "cct-s-v1-global-model")
CLASS_NAMES = os.getenv("CLASS_NAMES", "plate_front,plate_rear").split(",")
CONF_THRESHOLD = float(os.getenv("DETECTOR_CONF", "0.35"))
IOU_THRESHOLD = float(os.getenv("DETECTOR_IOU", "0.5"))
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_MB", "10")) * 1024 * 1024
# Отступ вокруг bbox при кропе под OCR (доля от размера). OCR обучен на тугих кропах: на эталоне
# точность держится 93–94% при отступе от -0.06 до +0.03 и быстро падает после +0.1 (train/ocr_eval.py)
CROP_PADDING = float(os.getenv("CROP_PADDING", "0.0"))

state: dict = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"Модель детектора не найдена: {MODEL_PATH}. Обучите её (train/README.md) и положите в models/."
        )
    state["detector"] = PlateSideDetector(MODEL_PATH, CLASS_NAMES, CONF_THRESHOLD, IOU_THRESHOLD)
    state["ocr"] = PlateOcr(OCR_MODEL)
    yield
    state.clear()


app = FastAPI(title="OnBase Parking AI", lifespan=lifespan)


def _crop(image: np.ndarray, bbox: tuple[int, int, int, int]) -> np.ndarray:
    h, w = image.shape[:2]
    x1, y1, x2, y2 = bbox
    pad_x, pad_y = int((x2 - x1) * CROP_PADDING), int((y2 - y1) * CROP_PADDING)
    return image[max(0, y1 - pad_y):min(h, y2 + pad_y), max(0, x1 - pad_x):min(w, x2 + pad_x)]


@app.get("/health")
def health():
    return {"ok": "detector" in state, "ocr_model": OCR_MODEL, "classes": state["detector"].names if state else []}


# def, а не async def: инференс блокирующий — FastAPI вынесет его в threadpool и не заблокирует event loop
@app.post("/recognize")
def recognize(image: UploadFile = File(...)):
    data = image.file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Image too large")

    frame = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(400, "Not an image")

    detections = state["detector"].detect(frame)
    if not detections:
        return {"found": False}

    # Берём самый уверенный номер в кадре. Если в кадре несколько машин — решает вызывающая сторона по bbox.
    best = detections[0]
    crop = _crop(frame, best.bbox)
    plate, plate_conf, plate_format = state["ocr"].read(crop) if crop.size else ("", 0.0, None)

    return {
        "found": True,
        "plate": plate,
        "plate_confidence": round(plate_conf, 4),
        "plate_format": plate_format,  # "A" (50A123BC) | "B" (50123ABC) | null — не лезет в формат
        "side": best.side,  # "front" | "rear" | null
        "side_confidence": round(best.confidence, 4),
        "bbox": list(best.bbox),
        "detections": len(detections),
    }
