"""YOLOv8 ONNX-детектор номерных знаков с классификацией стороны (plate_front / plate_rear).

Модель обучается скриптом train/train.py и кладётся в models/plate_side.onnx.
Инференс идёт через onnxruntime + OpenCV, без torch/ultralytics — образ остаётся лёгким.
"""
import ast
import logging
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

log = logging.getLogger("detector")

# plate_front — номер спереди (машина едет НА камеру), plate_rear — сзади (ОТ камеры)
SIDE_BY_CLASS = {"plate_front": "front", "plate_rear": "rear"}


@dataclass
class Detection:
    label: str
    side: str | None  # "front" | "rear" | None — для одноклассовой модели
    confidence: float
    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2 в координатах исходного кадра


def _read_class_names(session: ort.InferenceSession, fallback: list[str]) -> list[str]:
    # ultralytics кладёт names в metadata ONNX как строку-словарь: "{0: 'plate_front', 1: 'plate_rear'}"
    raw = session.get_modelmeta().custom_metadata_map.get("names")
    if raw:
        try:
            names = ast.literal_eval(raw)
            return [names[i] for i in sorted(names)]
        except (ValueError, SyntaxError, KeyError):
            log.warning("Не удалось разобрать names из metadata ONNX: %s", raw)
    return fallback


class PlateSideDetector:
    def __init__(self, model_path: Path, fallback_names: list[str], conf_threshold: float, iou_threshold: float):
        self.session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
        inp = self.session.get_inputs()[0]
        self.input_name = inp.name
        # shape = [1, 3, H, W]; у dynamic-моделей H/W — строки
        h, w = inp.shape[2], inp.shape[3]
        self.input_h = h if isinstance(h, int) else 640
        self.input_w = w if isinstance(w, int) else 640
        self.names = _read_class_names(self.session, fallback_names)
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        log.info("Detector loaded: %s classes=%s input=%dx%d", model_path.name, self.names, self.input_w, self.input_h)

    def _letterbox(self, image: np.ndarray) -> tuple[np.ndarray, float, int, int]:
        h, w = image.shape[:2]
        scale = min(self.input_w / w, self.input_h / h)
        new_w, new_h = round(w * scale), round(h * scale)
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        pad_x = (self.input_w - new_w) // 2
        pad_y = (self.input_h - new_h) // 2
        canvas = np.full((self.input_h, self.input_w, 3), 114, dtype=np.uint8)
        canvas[pad_y:pad_y + new_h, pad_x:pad_x + new_w] = resized
        return canvas, scale, pad_x, pad_y

    def detect(self, image_bgr: np.ndarray) -> list[Detection]:
        h0, w0 = image_bgr.shape[:2]
        canvas, scale, pad_x, pad_y = self._letterbox(image_bgr)
        blob = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB).transpose(2, 0, 1)[None].astype(np.float32) / 255.0

        out = self.session.run(None, {self.input_name: blob})[0]
        # YOLOv8: (1, 4+nc, N) → (N, 4+nc)
        preds = out[0].T
        scores_all = preds[:, 4:]
        class_ids = scores_all.argmax(axis=1)
        scores = scores_all[np.arange(len(preds)), class_ids]

        keep = scores >= self.conf_threshold
        if not keep.any():
            return []
        preds, class_ids, scores = preds[keep], class_ids[keep], scores[keep]

        cx, cy, bw, bh = preds[:, 0], preds[:, 1], preds[:, 2], preds[:, 3]
        # в xywh в пикселях letterbox-холста → NMSBoxes ждёт x, y, w, h левого верхнего угла
        boxes = np.stack([cx - bw / 2, cy - bh / 2, bw, bh], axis=1)
        idxs = cv2.dnn.NMSBoxes(boxes.tolist(), scores.tolist(), self.conf_threshold, self.iou_threshold)

        result: list[Detection] = []
        for i in np.array(idxs).flatten():
            x, y, w, h = boxes[i]
            x1 = int(np.clip((x - pad_x) / scale, 0, w0))
            y1 = int(np.clip((y - pad_y) / scale, 0, h0))
            x2 = int(np.clip((x + w - pad_x) / scale, 0, w0))
            y2 = int(np.clip((y + h - pad_y) / scale, 0, h0))
            if x2 - x1 < 4 or y2 - y1 < 4:
                continue
            label = self.names[class_ids[i]] if class_ids[i] < len(self.names) else str(class_ids[i])
            result.append(Detection(label, SIDE_BY_CLASS.get(label), float(scores[i]), (x1, y1, x2, y2)))

        result.sort(key=lambda d: d.confidence, reverse=True)
        return result
