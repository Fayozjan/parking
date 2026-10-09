"""OCR кропа номера: fast-plate-ocr (ONNX, CPU) + декодирование с учётом формата узбекских номеров.

Веса качаются при первом запуске и кэшируются. Подбор модели и отступа кропа — train/ocr_eval.py.
"""
import logging

import cv2
import numpy as np
from fast_plate_ocr import LicensePlateRecognizer
from fast_plate_ocr.core.process import preprocess_image
from fast_plate_ocr.inference.plate_recognizer import _load_image_from_source

from .plate_format import decode_constrained

log = logging.getLogger("ocr")


class PlateOcr:
    def __init__(self, model_name: str):
        self.recognizer = LicensePlateRecognizer(model_name, device="cpu")
        cfg = self.recognizer.config
        self.is_gray = cfg.image_color_mode == "grayscale"
        self.alphabet = cfg.alphabet
        self.pad = cfg.pad_char or "_"
        self.slots = cfg.max_plate_slots
        log.info("OCR loaded: %s (slots=%d)", model_name, self.slots)

    def _probs(self, crop_bgr: np.ndarray) -> np.ndarray:
        img = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY if self.is_gray else cv2.COLOR_BGR2RGB)
        x = preprocess_image(_load_image_from_source(img, self.recognizer.config))
        out = self.recognizer.model.run([self.recognizer.plate_output_name], {"input": x})[0]
        return out.reshape(self.slots, len(self.alphabet))

    def read(self, crop_bgr: np.ndarray) -> tuple[str, float, str | None]:
        """Возвращает (номер, уверенность 0..1, шаблон "A"/"B"/None).

        Если номер не лезет ни в один шаблон — отдаём обычный argmax с нулевой уверенностью:
        такой результат вызывающая сторона должна считать ненадёжным. Иностранные номера
        шаблонное декодирование искажает, но у них низкая уверенность, и порог их отсекает.
        """
        probs = self._probs(crop_bgr)
        decoded = decode_constrained(probs, self.alphabet, self.pad)
        if decoded:
            return decoded
        raw = "".join(self.alphabet[i] for i in probs.argmax(-1)).replace(self.pad, "")
        return raw, 0.0, None
