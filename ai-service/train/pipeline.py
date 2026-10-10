"""Единая точка входа дообучения (на своём компе, сервер не нагружаем). Только stdlib — каждый шаг сам берёт нужный venv.

    ft status               что есть: кадры, разметка, датасет, текущая модель, кандидат
    ft pull [--url U --token T]   скачать новые кадры с сервера (HTTPS, по курсору) и сразу разобрать; URL/токен запоминаются
    ft import файл.zip ...  то же из zip, который у вас уже есть (кадры → inbox, подсказки → dataset/meta, затем предразметка)
    ft prep                 предразметка НОВЫХ кадров из inbox
    ft label                разметчик стороны в браузере (Ctrl+C — выход, прогресс сохранён)
    ft build                собрать dataset/yolo из разметки (старое разбиение train/val сохраняется)
    ft train                дообучить от текущей модели → НОВАЯ версия models/versions/plate_side_vN.onnx (старые не трогаются)
    ft models               все версии с метриками
    ft promote [имя]        сделать версию боевой (по умолчанию — последняя обученная); откат: ft promote plate_side_v2
    ft studio               веб-кабинет с кнопками вместо этих команд (то же, что studio.bat)
    ft all                  pull → prep → (есть неразмеченные? стоп: ft label) → build → train
"""
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
import zipfile
from datetime import datetime
from pathlib import Path

import subprocess

ROOT = Path(__file__).resolve().parent.parent
DS = ROOT / "dataset"
INBOX, PRE, YOLO, META, IMPORTS = DS / "inbox", DS / "prelabeled", DS / "yolo", DS / "meta", DS / "imports"
LABELS, STATE = DS / "labels.json", DS / "pipeline.json"
MODELS = ROOT / "models"
MODEL = MODELS / "plate_side.onnx"          # боевая модель, её читает сервис
VERSIONS = MODELS / "versions"              # все версии; файлы здесь никогда не перезаписываются
PY_SERVE = ROOT / ".venv" / "Scripts" / "python.exe"        # open_image_models (предразметка)
PY_TRAIN = ROOT / ".venv-train" / "Scripts" / "python.exe"  # ultralytics + torch (обучение)
MIN_PER_CLASS = 100
FRAME_RE = re.compile(r"^frames/(\d+_p\d+)\.(jpg|json)$")  # формат архива сервера (modules/aiTraining)


def load_state() -> dict:
    return json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}


def save_state(state: dict) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def py(venv_python: Path, script: str, *args: str) -> None:
    if not venv_python.is_file():
        sys.exit(f"Нет {venv_python}. См. ai-service/README.md → «Обучение модели».")
    r = subprocess.run([str(venv_python), str(ROOT / "train" / script), *args], cwd=ROOT)
    if r.returncode:
        sys.exit(r.returncode)


def count(path: Path, pattern: str) -> int:
    return sum(1 for _ in path.glob(pattern)) if path.is_dir() else 0


def labeled() -> dict:
    return json.loads(LABELS.read_text(encoding="utf-8")) if LABELS.exists() else {}


def unlabeled() -> int:
    stems = {p.stem for p in (PRE / "images").glob("*.jpg")} if (PRE / "images").is_dir() else set()
    return len(stems - set(labeled()))


# ───────────────────────── статус ─────────────────────────

def info() -> dict:
    """Те же числа, что печатает status(), в виде словаря (для веб-кабинета studio.py)."""
    state, lab = load_state(), labeled()
    front, rear, skip = (sum(1 for v in lab.values() if v == k) for k in ("front", "rear", "skip"))
    cand = state.get("candidate")
    return {
        "current": state.get("current", "plate_side_v2"),
        "model_exists": MODEL.is_file(),
        "inbox": sum(1 for p in INBOX.rglob("*") if p.is_file()) if INBOX.is_dir() else 0,
        "with_hints": count(META, "*.json"),
        "prelabeled": count(PRE / "images", "*.jpg"),
        "front": front, "rear": rear, "skip": skip,
        "unlabeled": unlabeled(),
        "train_images": count(YOLO / "images" / "train", "*.jpg"),
        "val_images": count(YOLO / "images" / "val", "*.jpg"),
        "min_per_class": MIN_PER_CLASS,
        "candidate": cand and {"name": cand["name"], "ok": cand["ok"], "old_map": cand["old"]["map"], "new_map": cand["new"]["map"]},
    }


def model_rows() -> list[dict]:
    """Версии моделей для таблицы: имя, метрики, боевая ли, есть ли файл, хуже ли предыдущей."""
    state = load_state()
    current = state.get("current", "plate_side_v2")
    hist = {h["name"]: h for h in state.get("history", [])}
    files = version_files()
    rows = []
    for name in sorted(set(files) | set(hist) | {current}, key=lambda n: (len(n), n)):
        h = hist.get(name, {})
        rows.append({
            "name": name, "current": name == current, "has_file": name in files,
            "map": h.get("new_map"), "train_images": h.get("train_images"), "val_images": h.get("val_images"),
            "trained_at": h.get("trained_at"), "worse": bool(h) and not h.get("ok", True),
        })
    return rows


def status() -> None:
    state, lab = load_state(), labeled()
    inbox = sum(1 for p in INBOX.rglob("*") if p.is_file()) if INBOX.is_dir() else 0
    current = state.get("current", "plate_side_v2")
    print(f"Боевая модель  : {current}" + (f"  ({MODEL.stat().st_size // 1024} КБ)" if MODEL.is_file() else "  — НЕТ models/plate_side.onnx"))
    pull_cfg = state.get("pull") or {}
    print(f"сервер         : {pull_cfg.get('url', 'не настроен (ft pull --url ... --token ...)')}"
          + (f", курсор {pull_cfg['cursor']}" if pull_cfg.get("cursor") else ""))
    print(f"inbox          : {inbox} кадров (с подсказками сервера: {count(META, '*.json')})")
    print(f"предразмечено  : {count(PRE / 'images', '*.jpg')}")
    front, rear, skip = (sum(1 for v in lab.values() if v == k) for k in ("front", "rear", "skip"))
    print(f"размечено      : front {front}, rear {rear}, пропущено {skip};  ждут разметки: {unlabeled()}")
    tr, va = count(YOLO / "images" / "train", "*.jpg"), count(YOLO / "images" / "val", "*.jpg")
    print(f"датасет yolo   : train {tr}, val {va}" + ("" if tr + va == front + rear else "   (устарел — ft build)"))
    if min(front, rear) < MIN_PER_CLASS:
        print(f"ВНИМАНИЕ: меньше {MIN_PER_CLASS} кадров одного класса — модель выучит его плохо.")
    cand = state.get("candidate")
    if cand:
        print(f"кандидат       : {cand['name']}  mAP50-95 {cand['old']['map']:.3f} -> {cand['new']['map']:.3f}  "
              f"{'OK, можно ft promote' if cand['ok'] else 'ХУЖЕ текущей'}")


# ───────────────────────── кадры с сервера ─────────────────────────

def import_zip(path: Path) -> int:
    """Раскладывает архив сервера: кадры → inbox, подсказки (мнения камеры/AI) → dataset/meta. Возвращает число новых кадров."""
    INBOX.mkdir(parents=True, exist_ok=True)
    META.mkdir(parents=True, exist_ok=True)
    new = 0
    with zipfile.ZipFile(path) as z:
        for info in z.infolist():
            m = FRAME_RE.match(info.filename)
            if not m:
                continue
            frame_id, ext = m.groups()
            target = (INBOX / f"{frame_id}.jpg") if ext == "jpg" else (META / f"{frame_id}.json")
            if target.exists():
                continue
            target.write_bytes(z.read(info))
            new += ext == "jpg"
    return new


def pull(url: str | None, token: str | None) -> int:
    state = load_state()
    cfg = state.setdefault("pull", {})
    url = (url or cfg.get("url") or "").rstrip("/")
    token = token or cfg.get("token")
    if not url or not token:
        print("pull пропущен: не задан сервер. Один раз: ft pull --url https://сервер --token <AI_TRAINING_TOKEN из server/.env>")
        return 0
    cfg.update(url=url, token=token)
    save_state(state)

    IMPORTS.mkdir(parents=True, exist_ok=True)
    total = 0
    while True:
        req = urllib.request.Request(
            f"{url}/api/ai-training/export?limit=200&after={cfg.get('cursor', '')}",
            headers={"Authorization": f"Bearer {token}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                if resp.status == 204:
                    break
                last_id, more = resp.headers["X-Last-Id"], resp.headers["X-Has-More"] == "1"
                zip_path = IMPORTS / f"{datetime.now():%Y%m%d_%H%M%S}_{last_id}.zip"
                zip_path.write_bytes(resp.read())
        except urllib.error.HTTPError as e:
            hint = {401: "неверный токен", 404: "на сервере не задан AI_TRAINING_TOKEN"}.get(e.code, "")
            sys.exit(f"Сервер ответил {e.code} {hint}".strip())
        except urllib.error.URLError as e:
            sys.exit(f"Сервер недоступен: {e.reason}")

        n = import_zip(zip_path)
        total += n
        cfg["cursor"] = last_id  # курсор двигаем только после успешной распаковки
        save_state(state)
        print(f"  {zip_path.name}: новых кадров {n}")
        if not more:
            break
    print(f"С сервера получено новых кадров: {total}")
    return total


# ───────────────────────── версии моделей ─────────────────────────

def version_files() -> dict[str, Path]:
    found = {p.stem: p for p in sorted(VERSIONS.glob("*.onnx"))} if VERSIONS.is_dir() else {}
    legacy = MODELS / "plate_side_v1.onnx"  # v1 лежал рядом с боевой моделью до появления versions/
    if legacy.is_file():
        found.setdefault("plate_side_v1", legacy)
    return found


def models() -> None:
    state = load_state()
    current = state.get("current", "plate_side_v2")
    hist = {h["name"]: h for h in state.get("history", [])}
    files = version_files()
    print(f"{'версия':18}{'mAP50-95':>10}{'кадров train/val':>20}   статус")
    for name in sorted(set(files) | set(hist) | {current}, key=lambda n: (len(n), n)):
        h = hist.get(name, {})
        score = f"{h['new_map']:.3f}" if "new_map" in h else "-"
        data = f"{h['train_images']}/{h['val_images']}" if "train_images" in h else "-"
        mark = "БОЕВАЯ" if name == current else ("есть файл" if name in files else "нет файла")
        if h and not h.get("ok", True):
            mark += ", была хуже предыдущей"
        print(f"{name:18}{score:>10}{data:>20}   {mark}")


def promote(name: str | None, force: bool) -> None:
    state = load_state()
    cand = state.get("candidate")
    current = state.get("current", "plate_side_v2")
    name = name or (cand or {}).get("name")
    if not name:
        sys.exit("Нет кандидата. Сначала ft train или укажите версию: ft promote plate_side_v2 (список: ft models).")
    files = version_files()
    if name not in files:
        sys.exit(f"Нет файла версии {name}. Доступны: {', '.join(files) or 'нет'}")
    entry = next((h for h in state.get("history", []) if h["name"] == name), None)
    if entry and not entry.get("ok", True) and not force:
        sys.exit(f"{name} хуже предыдущей на val. Если всё равно нужно: ft promote {name} --force")

    VERSIONS.mkdir(parents=True, exist_ok=True)
    backup = VERSIONS / f"{current}.onnx"
    if MODEL.is_file() and not backup.exists():  # боевая модель, которую сейчас заменим, остаётся навсегда
        backup.write_bytes(MODEL.read_bytes())
    MODEL.write_bytes(files[name].read_bytes())
    state["current"] = name
    if cand and cand["name"] == name:
        state.pop("candidate")
    if entry:
        entry["promoted_at"] = datetime.now().isoformat(timespec="seconds")
    save_state(state)
    print(f"Боевая модель: {current} -> {name}  (прежняя сохранена: versions/{backup.name})")
    print("Дальше: git add ai-service/models/plate_side.onnx && git commit && git push; на сервере: git pull && pm2 restart onbase-ai")


# ───────────────────────── запуск ─────────────────────────

def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["status", "pull", "import", "prep", "label", "build", "train", "models", "promote", "studio", "all"],
                    nargs="?", default="status")
    ap.add_argument("args", nargs="*", help="import: пути к zip; promote: имя версии")
    ap.add_argument("--url", help="pull: адрес сервера, https://host (запоминается)")
    ap.add_argument("--token", help="pull: AI_TRAINING_TOKEN сервера (запоминается в dataset/pipeline.json)")
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--device", default="cpu", help="cpu | 0 (GPU)")
    ap.add_argument("--force", action="store_true", help="promote: выкатить, даже если версия хуже предыдущей")
    a = ap.parse_args()

    if a.cmd == "status":
        status()
    elif a.cmd == "pull":
        if pull(a.url, a.token):
            py(PY_SERVE, "prelabel.py")
            print(f"Дальше: ft label  (ждут разметки: {unlabeled()})")
    elif a.cmd == "import":
        if not a.args:
            sys.exit("Укажите zip: ft import C:\\путь\\ai-training_....zip")
        new = sum(import_zip(Path(p)) for p in a.args)
        print(f"Новых кадров: {new}")
        py(PY_SERVE, "prelabel.py")
        print(f"Дальше: ft label  (ждут разметки: {unlabeled()})")
    elif a.cmd == "prep":
        py(PY_SERVE, "prelabel.py")
    elif a.cmd == "label":
        py(PY_SERVE, "labeler.py")
    elif a.cmd == "build":
        py(PY_SERVE, "labeler.py", "--build")
    elif a.cmd == "train":
        py(PY_TRAIN, "finetune.py", "--epochs", str(a.epochs), "--device", a.device)
    elif a.cmd == "models":
        models()
    elif a.cmd == "promote":
        promote(a.args[0] if a.args else None, a.force)
    elif a.cmd == "studio":
        import studio

        studio.main()
    elif a.cmd == "all":
        pull(a.url, a.token)
        py(PY_SERVE, "prelabel.py")
        if unlabeled():
            status()
            sys.exit(f"\nЖдут разметки: {unlabeled()}. Запустите `ft label`, затем снова `ft all`.")
        py(PY_SERVE, "labeler.py", "--build")
        py(PY_TRAIN, "finetune.py", "--epochs", str(a.epochs), "--device", a.device)
        status()


if __name__ == "__main__":
    main()
