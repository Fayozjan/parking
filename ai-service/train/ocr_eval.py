"""Оценка вариантов чтения номера на эталоне dataset/plates.json (размечается plate_text_labeler.py).

    python train/ocr_eval.py            # все модели x все стратегии
    python train/ocr_eval.py --pad 0.2  # другой отступ кропа
"""
import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "train"))

import plate_text_labeler as L  # noqa: E402  (crop, read_image, INBOX/PRE)
from app.plate_format import decode_constrained  # noqa: E402
from fast_plate_ocr import LicensePlateRecognizer  # noqa: E402
from fast_plate_ocr.core.process import preprocess_image  # noqa: E402
from fast_plate_ocr.inference.plate_recognizer import _load_image_from_source  # noqa: E402

MODELS = [
    "cct-s-v2-global-model",
    "cct-xs-v2-global-model",
    "cct-s-v1-global-model",
    "cct-xs-v1-global-model",
    "global-plates-mobile-vit-v2-model",
    "european-plates-mobile-vit-v2-model",
]


def raw_probs(rec: LicensePlateRecognizer, crop_bgr: np.ndarray) -> np.ndarray:
    gray = rec.config.image_color_mode == "grayscale"
    img = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY if gray else cv2.COLOR_BGR2RGB)
    x = preprocess_image(_load_image_from_source(img, rec.config))
    out = rec.model.run([rec.plate_output_name], {"input": x})[0]
    return out.reshape(rec.config.max_plate_slots, len(rec.config.alphabet))


def argmax_plate(probs, alphabet, pad):
    return "".join(alphabet[i] for i in probs.argmax(-1)).replace(pad, "")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pad", type=float, default=L.PAD)
    ap.add_argument("--models", nargs="*", default=MODELS)
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    L.PAD = args.pad

    truth = {k: v["text"] for k, v in json.loads(L.STATE.read_text(encoding="utf-8")).items() if v["text"]}
    crops = {k: L.crop(k) for k in truth}
    print(f"эталон: {len(truth)} номеров, отступ кропа {args.pad}")
    print(f"{'модель':38} {'стратегия':14} {'целиком':>8} {'символы':>8} {'ср.мс':>6}")

    import time
    for name in args.models:
        rec = LicensePlateRecognizer(name, device="cpu")
        alpha, pad = rec.config.alphabet, rec.config.pad_char or "_"
        t0 = time.time()
        probs = {k: raw_probs(rec, c) for k, c in crops.items()}
        ms = (time.time() - t0) / len(crops) * 1000
        for strat in ("argmax", "constrained"):
            exact = chars = total = 0
            for k, t in truth.items():
                if strat == "argmax":
                    p = argmax_plate(probs[k], alpha, pad)
                else:
                    r = decode_constrained(probs[k], alpha, pad)
                    p = r[0] if r else argmax_plate(probs[k], alpha, pad)
                exact += p == t
                chars += sum(a == b for a, b in zip(t, p))
                total += len(t)
            print(f"{name:38} {strat:14} {exact / len(truth):8.1%} {chars / total:8.1%} {ms:6.0f}")


if __name__ == "__main__":
    main()
