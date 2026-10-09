"""Разметчик текста номеров: эталон для оценки и дообучения OCR.

    python train/plate_text_labeler.py          # http://127.0.0.1:8766
    python train/plate_text_labeler.py --stats  # точность текущего OCR по размеченному

Показывает кроп номера (из оригинала в полном разрешении) и поле с прочтением OCR.
Исправьте текст и нажмите Enter. Esc — «не читается» (кадр пропускается).
Результат: dataset/plates.json  {stem: {"text": "50A123BC", "ocr": "50A1Z3BC"}}  (text == "" — пропущен).
"""
import argparse
import json
import random
import re
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "dataset" / "inbox"
PRE = ROOT / "dataset" / "prelabeled"
SIDES = ROOT / "dataset" / "labels.json"
STATE = ROOT / "dataset" / "plates.json"
PORT = 8766
SAMPLE = 250
MIN_WIDTH = 1600  # мелкие кадры (640 px) для эталона не берём — номер на них нечитаем даже глазами
PAD = 0.10

CYR = {"А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H", "О": "O", "Р": "P", "С": "C", "Т": "T", "У": "Y", "Х": "X"}
UZ_FORMATS = (re.compile(r"^\d{2}[A-Z]\d{3}[A-Z]{2}$"), re.compile(r"^\d{5}[A-Z]{3}$"))

lock = threading.Lock()
ocr = None


def clean(text: str) -> str:
    return "".join(CYR.get(c, c) for c in text.upper() if c.isalnum() or c in CYR)


def load_state() -> dict:
    return json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}


def save_state(state: dict) -> None:
    tmp = STATE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
    tmp.replace(STATE)


def read_image(path: Path):
    return cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)


def make_sample() -> list[str]:
    sides = json.loads(SIDES.read_text(encoding="utf-8")) if SIDES.exists() else {}
    pool = []
    for lab in sorted((PRE / "labels").glob("*.txt")):
        stem = lab.stem
        orig = INBOX / f"{stem}.jpg"
        if sides.get(stem) not in ("front", "rear") or not orig.exists():
            continue
        # reduced-декодирование в 1/8 размера — в разы быстрее полного, а ширина нужна только для порога
        small = cv2.imdecode(np.fromfile(str(orig), dtype=np.uint8), cv2.IMREAD_REDUCED_COLOR_8)
        if small is not None and small.shape[1] * 8 >= MIN_WIDTH - 8:
            pool.append(stem)
    random.Random(7).shuffle(pool)
    return pool[:SAMPLE]


def crop(stem: str) -> np.ndarray:
    img = read_image(INBOX / f"{stem}.jpg")
    h, w = img.shape[:2]
    cx, cy, bw, bh = map(float, (PRE / "labels" / f"{stem}.txt").read_text().split()[1:5])
    x1, x2 = (cx - bw / 2 - bw * PAD) * w, (cx + bw / 2 + bw * PAD) * w
    y1, y2 = (cy - bh / 2 - bh * PAD) * h, (cy + bh / 2 + bh * PAD) * h
    return img[max(0, int(y1)):min(h, int(y2)), max(0, int(x1)):min(w, int(x2))]


def predict(stem: str) -> str:
    c = crop(stem)
    gray = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY if ocr.config.image_color_mode == "grayscale" else cv2.COLOR_BGR2RGB)
    return clean(ocr.run(gray)[0].plate or "")


PAGE = """<!doctype html><meta charset=utf-8><title>Текст номеров</title>
<style>
 body{margin:0;background:#16181d;color:#eee;font:16px system-ui;display:flex;flex-direction:column;height:100vh}
 header{padding:10px 16px;display:flex;gap:20px;align-items:center;background:#20232a}
 .bar{flex:1;height:8px;background:#333;border-radius:4px;overflow:hidden}.bar i{display:block;height:100%;background:#4caf50}
 main{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:22px;min-height:0}
 #plate{max-width:92vw;max-height:42vh;border:2px solid #444;image-rendering:auto}
 #txt{font:700 44px ui-monospace,Consolas,monospace;letter-spacing:6px;width:480px;text-align:center;
      text-transform:uppercase;background:#0e1013;color:#fff;border:2px solid #555;border-radius:8px;padding:8px}
 #warn{height:22px;color:#ffb74d} #err{color:#ff8a80}
 footer{padding:12px;text-align:center;background:#20232a;color:#aaa}
 button{font:600 15px system-ui;padding:10px 20px;border:0;border-radius:8px;color:#fff;cursor:pointer;margin:0 6px}
 .ok{background:#2e7d32}.sk{background:#555}.bk{background:#37474f}
</style>
<header><b id=cnt></b><span id=err></span><div class=bar><i id=bar></i></div></header>
<main><img id=plate><input id=txt maxlength=12 autocomplete=off spellcheck=false><div id=warn></div>
<div><button class=bk onclick=back()>⌫ Назад</button><button class=ok onclick=save()>Enter — сохранить</button>
<button class=sk onclick=skip()>Esc — не читается</button></div></main>
<footer>Исправьте текст под картинкой. Пробелы не нужны: 50A123BC. Буква O и цифра 0 — разные символы!</footer>
<script>
let items=[],done={},i=0,busy=false,pred='';
const FM=[/^\\d{2}[A-Z]\\d{3}[A-Z]{2}$/,/^\\d{5}[A-Z]{3}$/];
const CYR={'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','У':'Y','Х':'X'};
const norm=s=>[...s.toUpperCase()].map(c=>CYR[c]||c).filter(c=>/[A-Z0-9]/.test(c)).join('');
txt.addEventListener('input',()=>{const v=norm(txt.value);txt.value=v;warn.textContent=v&&!FM.some(r=>r.test(v))?'нестандартный формат — проверьте':''});
async function init(){const d=await (await fetch('/api/state')).json();items=d.items;done=d.done;
  const k=items.findIndex(s=>!(s in done));i=k<0?items.length-1:k;show();}
function stats(){const n=Object.keys(done).length;cnt.textContent=n+' / '+items.length;bar.style.width=100*n/items.length+'%';}
async function show(){stats();const s=items[i];if(!s)return;
  plate.src='/crop/'+s+'.jpg?'+Date.now();
  const d=await (await fetch('/api/item/'+s)).json();pred=d.ocr;
  txt.value=(s in done)?done[s].text:d.ocr;txt.dispatchEvent(new Event('input'));txt.focus();txt.select();}
async function send(text){if(busy)return;busy=true;const s=items[i];
  try{const r=await fetch('/api/save',{method:'POST',body:JSON.stringify({stem:s,text,ocr:pred})});
    if(!r.ok)throw new Error('HTTP '+r.status);done[s]={text,ocr:pred};if(i<items.length-1)i++;err.textContent='';}
  catch(e){err.textContent='Не сохранилось: '+e.message;}finally{busy=false;}show();}
function save(){const v=norm(txt.value);if(v.length<5){err.textContent='Слишком короткий номер';return;}send(v);}
function skip(){send('');}
function back(){if(i>0){i--;show();}}
addEventListener('keydown',e=>{if(e.key==='Enter'){save();e.preventDefault();}
  else if(e.key==='Escape'){skip();e.preventDefault();}else if(e.key==='ArrowUp'&&e.ctrlKey){back();e.preventDefault();}});
init();
</script>"""


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def send(self, body: bytes, ctype: str, code: int = 200):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = unquote(self.path.split("?")[0])
        if path == "/":
            self.send(PAGE.encode("utf-8"), "text/html; charset=utf-8")
        elif path == "/api/state":
            with lock:
                body = json.dumps({"items": ITEMS, "done": load_state()})
            self.send(body.encode(), "application/json")
        elif path.startswith("/api/item/"):
            stem = Path(path).name
            self.send(json.dumps({"ocr": predict(stem)}).encode() if stem in ITEMS else b"{}", "application/json")
        elif path.startswith("/crop/"):
            stem = Path(path).stem
            if stem not in ITEMS:
                return self.send(b"", "text/plain", 404)
            c = crop(stem)
            scale = max(1.0, 180 / c.shape[0])  # мелкий кроп увеличиваем, чтобы было видно глазами
            c = cv2.resize(c, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            self.send(cv2.imencode(".jpg", c, [cv2.IMWRITE_JPEG_QUALITY, 95])[1].tobytes(), "image/jpeg")
        else:
            self.send(b"", "text/plain", 404)

    def do_POST(self):
        if self.path != "/api/save":
            return self.send(b"", "text/plain", 404)
        data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
        stem, text = data.get("stem"), clean(data.get("text", ""))
        if stem not in ITEMS or len(text) > 12:
            return self.send(b"bad request", "text/plain", 400)
        with lock:
            state = load_state()
            state[stem] = {"text": text, "ocr": clean(data.get("ocr", ""))}
            save_state(state)
        self.send(b"{}", "application/json")


def stats():
    st = {k: v for k, v in load_state().items() if v["text"]}
    if not st:
        sys.exit("Нет размеченных номеров.")
    exact = sum(v["text"] == v["ocr"] for v in st.values())
    chars = sum(sum(a == b for a, b in zip(v["text"], v["ocr"])) for v in st.values())
    total = sum(len(v["text"]) for v in st.values())
    fmt = sum(any(r.match(v["text"]) for r in UZ_FORMATS) for v in st.values())
    print(f"Размечено: {len(st)} (пропущено нечитаемых: {sum(1 for v in load_state().values() if not v['text'])})")
    print(f"OCR целиком верно: {exact}/{len(st)} = {exact / len(st):.1%}")
    print(f"Символов на своих местах: {chars}/{total} = {chars / total:.1%}")
    print(f"Эталонных номеров в стандартном формате: {fmt}/{len(st)}")


def main():
    global ocr, ITEMS
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--stats", action="store_true")
    if ap.parse_args().stats:
        return stats()

    from fast_plate_ocr import LicensePlateRecognizer
    ocr = LicensePlateRecognizer("cct-s-v2-global-model", device="cpu")
    ITEMS = make_sample()
    if not ITEMS:
        sys.exit("Нет подходящих кадров (нужны размеченные кадры шириной от 1600 px в dataset/inbox).")
    url = f"http://127.0.0.1:{PORT}"
    print(f"Кадров для разметки: {len(ITEMS)}. Откройте {url}  (Ctrl+C — выход)")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


ITEMS: list[str] = []

if __name__ == "__main__":
    main()
