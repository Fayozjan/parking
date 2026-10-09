#!/usr/bin/env bash
# Подготовка AI-сервиса на Linux-сервере (один раз, повторный запуск безопасен):
#   bash ai-service/setup.sh              # python3 по умолчанию
#   PYTHON=python3.12 bash ai-service/setup.sh
# Нужны: Python 3.10–3.13 с модулем venv (Debian/Ubuntu: apt install python3-venv),
# доступ в интернет для скачивания пакетов и OCR-модели (~5 МБ с GitHub).
set -euo pipefail
cd "$(dirname "$0")"

PY="${PYTHON:-python3}"
"$PY" - <<'PYEOF'
import sys
if not ((3, 10) <= sys.version_info[:2] <= (3, 13)):
    sys.exit(f"Нужен Python 3.10–3.13, найден {sys.version.split()[0]}. Задайте PYTHON=python3.12")
PYEOF

[ -d .venv ] || "$PY" -m venv .venv
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -r requirements.txt

[ -f models/plate_side.onnx ] || { echo "Нет models/plate_side.onnx (должен лежать в git)"; exit 1; }

# Скачиваем OCR-модель заранее, чтобы первый старт под PM2 не упал по таймауту/сети
.venv/bin/python - <<'PYEOF'
from fast_plate_ocr import LicensePlateRecognizer
LicensePlateRecognizer("cct-s-v1-global-model", device="cpu")
print("OCR-модель на месте")
PYEOF

echo "Готово. Запуск: pm2 start ecosystem.config.cjs --only onbase-ai"
