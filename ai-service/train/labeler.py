"""Локальный разметчик: для каждого кадра с готовой рамкой выбираем сторону — спереди / сзади.

    python train/labeler.py            # открыть http://127.0.0.1:8765
    python train/labeler.py --build    # собрать датасет dataset/yolo из разметки

Клавиши: ← спереди (plate_front), → сзади (plate_rear), ↓ пропустить (плохой кадр), Backspace — назад.
Прогресс пишется в dataset/labels.json после каждого нажатия — можно закрывать и продолжать позже.
"""
import argparse
import json
import mimetypes
import random
import shutil
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
PRE = ROOT / "dataset" / "prelabeled"
STATE = ROOT / "dataset" / "labels.json"
META = ROOT / "dataset" / "meta"  # подсказки сервера: что сказали камера и AI (ft pull / ft import)
YOLO = ROOT / "dataset" / "yolo"
CLASS_ID = {"front": 0, "rear": 1}
PORT = 8765

lock = threading.Lock()


def load_state() -> dict:
    return json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}


def save_state(state: dict) -> None:
    tmp = STATE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state), encoding="utf-8")
    tmp.replace(STATE)


def stems() -> list[str]:
    return sorted(p.stem for p in (PRE / "images").glob("*.jpg"))


def read_boxes(stem: str) -> list[list[float]]:
    txt = PRE / "labels" / f"{stem}.txt"
    if not txt.exists():
        return []
    return [[float(v) for v in line.split()[1:]] for line in txt.read_text().splitlines() if line.strip()]


PAGE = """<!doctype html><meta charset=utf-8><title>Разметка</title>
<style>
 body{margin:0;background:#16181d;color:#eee;font:16px system-ui;display:flex;flex-direction:column;height:100vh}
 header{padding:10px 16px;display:flex;gap:24px;align-items:center;background:#20232a}
 header b{font-size:18px} .bar{flex:1;height:8px;background:#333;border-radius:4px;overflow:hidden}
 .bar i{display:block;height:100%;background:#4caf50}
 main{flex:1;display:flex;justify-content:center;align-items:center;min-height:0;position:relative}
 canvas{max-width:100%;max-height:100%}
 footer{display:flex;gap:12px;padding:12px;justify-content:center;background:#20232a}
 button{font:600 17px system-ui;padding:14px 26px;border:0;border-radius:8px;color:#fff;cursor:pointer}
 .f{background:#2e7d32}.r{background:#c62828}.s{background:#555}.b{background:#37474f}
 #tag{position:absolute;top:12px;left:12px;padding:6px 12px;border-radius:6px;font-weight:700;display:none}
 #hint{position:absolute;bottom:10px;left:12px;right:12px;padding:8px 12px;border-radius:6px;background:#000b;font-size:15px;line-height:1.5;display:none}
 #hint b{color:#ffeb3b}
</style>
<header><b id=cnt></b><span id=err style=color:#ff8a80></span><div class=bar><i id=bar></i></div><span id=st></span></header>
<main><canvas id=cv></canvas><div id=tag></div><div id=hint></div></main>
<footer>
 <button class=b onclick=back()>⌫ Назад</button>
 <button class=f onclick=mark('front')>← Спереди</button>
 <button class=r onclick=mark('rear')>Сзади →</button>
 <button class=s onclick=mark('skip')>↓ Пропустить</button>
</footer>
<script>
let items=[],done={},i=0,busy=false;
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const COL={front:'#4caf50',rear:'#ef5350',skip:'#999'},NAME={front:'СПЕРЕДИ',rear:'СЗАДИ',skip:'ПРОПУЩЕН'};
async function init(){
  const d=await (await fetch('/api/state')).json(); items=d.items; done=d.done;
  const k=items.findIndex(s=>!done[s]); i=k<0?items.length-1:k; show();
}
function stats(){
  const c={front:0,rear:0,skip:0}; for(const v of Object.values(done)) c[v]++;
  cnt.textContent=`${Object.keys(done).length} / ${items.length}`;
  bar.style.width=100*Object.keys(done).length/items.length+'%';
  st.textContent=`спереди ${c.front} · сзади ${c.rear} · пропущено ${c.skip}`;
}
async function show(){
  stats(); const s=items[i]; if(!s) return;
  const [img,boxes,meta]=await Promise.all([
    new Promise(r=>{const m=new Image(); m.onload=()=>r(m); m.onerror=()=>r(m); m.src='/img/'+s+'.jpg';}),
    fetch('/api/box/'+s).then(r=>r.json()),
    fetch('/api/meta/'+s).then(r=>r.json())]);
  showHint(meta);
  cv.width=img.width; cv.height=img.height; ctx.drawImage(img,0,0);
  const lab=done[s]; ctx.lineWidth=Math.max(3,img.width/300); ctx.strokeStyle=COL[lab]||'#ffeb3b';
  for(const [cx,cy,w,h] of boxes) ctx.strokeRect((cx-w/2)*img.width,(cy-h/2)*img.height,w*img.width,h*img.height);
  tag.style.display=lab?'block':'none'; if(lab){tag.textContent=NAME[lab]; tag.style.background=COL[lab];}
  new Image().src='/img/'+(items[i+1]||s)+'.jpg';
}
const SIDE={forward:'спереди',reverse:'сзади',front:'спереди',rear:'сзади'};
function showHint(m){
  if(!m||!m.camera){hint.style.display='none';return;}
  const ai=m.ai&&m.ai.found?`AI: <b>${SIDE[m.ai.side]||'?'}</b> (${Math.round((m.ai.side_confidence||0)*100)}%), номер ${m.ai.plate||'-'} (${m.ai.confidence}%)`:'AI: номер не найден';
  hint.innerHTML=`Камера: <b>${SIDE[m.camera.movement]||'не сообщила'}</b>, номер ${m.camera.plate||'-'} (${m.camera.confidence}%) &nbsp;·&nbsp; ${ai}`
    +`<br>Причины: ${(m.reasons||[]).join(', ')}${m.camera_name?' &nbsp;·&nbsp; '+m.camera_name:''}${m.captured_at?' &nbsp;·&nbsp; '+m.captured_at.slice(0,16).replace('T',' '):''}`;
  hint.style.display='block';
}
async function mark(label){
  if(busy) return; busy=true; const s=items[i];
  try{
    const r=await fetch('/api/label',{method:'POST',body:JSON.stringify({stem:s,label})});
    if(!r.ok) throw new Error('HTTP '+r.status);
    done[s]=label; if(i<items.length-1) i++; err.textContent='';
  }catch(e){ err.textContent='Не сохранилось: '+e.message+' — нажмите ещё раз'; }
  finally{ busy=false; }
  show();
}
function back(){ if(i>0){i--; show();} }
addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft')mark('front'); else if(e.key==='ArrowRight')mark('rear');
  else if(e.key==='ArrowDown'||e.key===' ')mark('skip'); else if(e.key==='Backspace')back();
  else return; e.preventDefault();
});
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
        path = unquote(self.path)
        if path == "/":
            self.send(PAGE.encode("utf-8"), "text/html; charset=utf-8")
        elif path == "/api/state":
            with lock:
                body = json.dumps({"items": stems(), "done": load_state()})
            self.send(body.encode(), "application/json")
        elif path.startswith("/api/box/"):
            self.send(json.dumps(read_boxes(Path(path).name)).encode(), "application/json")
        elif path.startswith("/api/meta/"):
            f = META / f"{Path(path).name}.json"
            self.send(f.read_bytes() if f.is_file() else b"{}", "application/json")
        elif path.startswith("/img/"):
            f = PRE / "images" / Path(path).name  # Path(...).name — защита от выхода за каталог
            if f.is_file():
                self.send(f.read_bytes(), mimetypes.guess_type(f.name)[0] or "image/jpeg")
            else:
                self.send(b"", "text/plain", 404)
        else:
            self.send(b"", "text/plain", 404)

    def do_POST(self):
        if self.path != "/api/label":
            return self.send(b"", "text/plain", 404)
        data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
        if data.get("label") not in ("front", "rear", "skip") or not (PRE / "images" / f"{data.get('stem')}.jpg").is_file():
            return self.send(b"bad request", "text/plain", 400)
        with lock:
            state = load_state()
            state[data["stem"]] = data["label"]
            save_state(state)
        self.send(b"{}", "application/json")


def build():
    state = {s: lab for s, lab in load_state().items() if lab in CLASS_ID}
    if not state:
        sys.exit("Нет размеченных кадров (front/rear). Сначала запустите разметчик.")

    # Уже распределённые кадры остаются в своей выборке: иначе при дообучении модель увидит
    # в train то, что раньше было в val, и метрики станут завышенными.
    prev = {}
    for sp in ("train", "val"):
        for img in (YOLO / "images" / sp).glob("*.jpg"):
            prev[img.stem] = sp
    split = {s: prev[s] for s in state if s in prev}

    # Кадры одного проезда идут подряд и почти одинаковы. Если раскидать их по train/val случайно,
    # val «подсмотрит» train и точность будет завышена. Режем на блоки подряд идущих кадров
    # и целыми блоками отправляем в val.
    new = sorted((s for s in state if s not in prev), key=lambda s: (0, int(s), "") if s.isdigit() else (1, 0, s))
    chunks = [new[i:i + 10] for i in range(0, len(new), 10)]
    random.Random(42).shuffle(chunks)
    val_n = len(chunks) // 5 if prev else max(1, len(chunks) // 5)
    split.update({s: ("val" if ci < val_n else "train") for ci, ch in enumerate(chunks) for s in ch})

    if YOLO.exists():
        shutil.rmtree(YOLO)
    counts = {(sp, lab): 0 for sp in ("train", "val") for lab in CLASS_ID}
    for stem, lab in state.items():
        sp = split[stem]
        (YOLO / "images" / sp).mkdir(parents=True, exist_ok=True)
        (YOLO / "labels" / sp).mkdir(parents=True, exist_ok=True)
        shutil.copy(PRE / "images" / f"{stem}.jpg", YOLO / "images" / sp / f"{stem}.jpg")
        lines = [f"{CLASS_ID[lab]} {' '.join(f'{v:.6f}' for v in box)}" for box in read_boxes(stem)]
        (YOLO / "labels" / sp / f"{stem}.txt").write_text("\n".join(lines) + "\n")
        counts[(sp, lab)] += 1

    # Абсолютный path — ultralytics иначе ищет датасет относительно своего каталога настроек
    (YOLO / "data.yaml").write_text(
        f"path: {YOLO.as_posix()}\ntrain: images/train\nval: images/val\n"
        "names:\n  0: plate_front\n  1: plate_rear\n",
        encoding="utf-8",
    )
    print(f"Датасет: {YOLO}")
    for (sp, lab), n in counts.items():
        print(f"  {sp:5} {lab:5} {n}")
    if min(counts[("train", "front")], counts[("train", "rear")]) < 100:
        print("ВНИМАНИЕ: одного из классов в train меньше 100 — модель его выучит плохо.")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", action="store_true")
    args = ap.parse_args()
    if args.build:
        return build()
    if not (PRE / "images").is_dir():
        sys.exit("Нет dataset/prelabeled — сначала запустите train/prelabel.py")
    url = f"http://127.0.0.1:{PORT}"
    print(f"Разметчик: {url}  (Ctrl+C — выход)")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
