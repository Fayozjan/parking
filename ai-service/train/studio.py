"""Локальный веб-кабинет дообучения: всё, что делает `ft`, но кнопками. Слушает только 127.0.0.1.

    studio.bat            (или: ft studio)  → http://127.0.0.1:8770

1. Данные    — перетащите zip со страницы «Дообучение AI» админки (или кнопка «Импортировать» у найденного в Загрузках):
               кадры раскладываются сами и сразу идёт предразметка.
2. Разметка  — кнопка открывает разметчик стороны (с подсказками камеры и AI).
3. Обучение  — сборка датасета + дообучение → новая версия модели (старые не перезаписываются), лог на странице.
4. Модели    — таблица версий, «Сделать боевой» / откат одной кнопкой.
Только stdlib; тяжёлые шаги запускаются в нужном venv, как в pipeline.py.
"""
import atexit
import contextlib
import io
import json
import os
import re
import socket
import subprocess
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pipeline as P  # noqa: E402

PORT = 8770
LABELER_PORT = 8765
DOWNLOADS = Path.home() / "Downloads"
LOG_LINES = 400
lock = threading.Lock()


# ───────────────────────── фоновая задача (одна за раз) ─────────────────────────

class Job:
    def __init__(self):
        self.name = ""
        self.running = False
        self.rc: int | None = None
        self.lines: list[str] = []
        self.proc: subprocess.Popen | None = None
        self.cancelled = False

    def start(self, name: str, steps: list[list[str]]) -> bool:
        with lock:
            if self.running:
                return False
            self.name, self.running, self.rc, self.lines, self.cancelled = name, True, None, [], False
        threading.Thread(target=self._run, args=(steps,), daemon=True).start()
        return True

    def _log(self, line: str) -> None:
        with lock:
            self.lines.append(line.rstrip())
            del self.lines[:-LOG_LINES]

    def _run(self, steps: list[list[str]]) -> None:
        env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUNBUFFERED": "1"}
        rc = 0
        for cmd in steps:
            if self.cancelled:
                break
            self._log(f"$ {Path(cmd[1]).name} {' '.join(cmd[2:])}")
            try:
                self.proc = subprocess.Popen(cmd, cwd=P.ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                             text=True, encoding="utf-8", errors="replace", bufsize=1)
                for line in self.proc.stdout:
                    if line.strip():
                        self._log(line)
                rc = self.proc.wait()
            except OSError as e:
                self._log(f"Не удалось запустить: {e}")
                rc = 1
            if rc:
                break
        with lock:
            self.rc, self.running, self.proc = (-1 if self.cancelled else rc), False, None
        self._log("— отменено —" if self.cancelled else ("— готово —" if rc == 0 else f"— ошибка (код {rc}) —"))

    def cancel(self) -> None:
        self.cancelled = True
        if self.proc:
            self.proc.terminate()


job = Job()
labeler_proc: subprocess.Popen | None = None


def py_cmd(venv_python: Path, script: str, *args: str) -> list[str]:
    if not venv_python.is_file():
        raise RuntimeError(f"Нет {venv_python}. См. README → «Обучение модели».")
    return [str(venv_python), str(P.ROOT / "train" / script), *args]


def port_open(port: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) == 0


def stop_labeler() -> None:
    if labeler_proc and labeler_proc.poll() is None:
        labeler_proc.terminate()


atexit.register(stop_labeler)


# ───────────────────────── состояние ─────────────────────────

def found_downloads() -> list[dict]:
    done = set(P.load_state().get("imported_zips", []))
    if not DOWNLOADS.is_dir():
        return []
    zips = sorted(DOWNLOADS.glob("ai-training_*.zip"), key=lambda p: p.stat().st_mtime, reverse=True)
    return [{"name": p.name, "size_mb": round(p.stat().st_size / 1e6, 1)} for p in zips if p.name not in done]


def mark_imported(name: str) -> None:
    state = P.load_state()
    state.setdefault("imported_zips", []).append(name)
    P.save_state(state)


def full_state() -> dict:
    with lock:
        j = {"name": job.name, "running": job.running, "rc": job.rc, "log": job.lines[-120:]}
    return {
        "info": P.info(), "models": P.model_rows(), "job": j, "downloads": found_downloads(),
        "downloads_dir": str(DOWNLOADS), "labeler": port_open(LABELER_PORT),
    }


# ───────────────────────── действия ─────────────────────────

def do_import(zip_path: Path, remember: str | None = None) -> dict:
    new = P.import_zip(zip_path)
    if remember:
        mark_imported(remember)
    started = job.start("Предразметка", [py_cmd(P.PY_SERVE, "prelabel.py")])
    return {"ok": True, "new_frames": new, "prep_started": started}


def do_label() -> dict:
    global labeler_proc
    if not (P.PRE / "images").is_dir():
        return {"ok": False, "error": "Нет предразмеченных кадров. Сначала импортируйте zip."}
    if not port_open(LABELER_PORT):
        labeler_proc = subprocess.Popen(py_cmd(P.PY_SERVE, "labeler.py"), cwd=P.ROOT,
                                        env={**os.environ, "PYTHONIOENCODING": "utf-8"})
        for _ in range(30):
            if port_open(LABELER_PORT):
                break
            threading.Event().wait(0.2)
    return {"ok": True, "url": f"http://127.0.0.1:{LABELER_PORT}"}


def do_train(epochs: int, device: str) -> dict:
    if job.running:
        return {"ok": False, "error": "Уже идёт другая задача."}
    stop_labeler()  # разметчик держит labels.json открытым для записи; обучение читает готовое
    steps = [py_cmd(P.PY_SERVE, "labeler.py", "--build"),
             py_cmd(P.PY_TRAIN, "finetune.py", "--epochs", str(epochs), "--device", device)]
    return {"ok": job.start("Обучение", steps)}


def do_promote(name: str, force: bool) -> dict:
    out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out):
            P.promote(name, force)
    except SystemExit as e:
        return {"ok": False, "error": str(e.code)}
    return {"ok": True, "message": out.getvalue().strip()}


# ───────────────────────── HTTP ─────────────────────────

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def send(self, body: bytes, ctype="application/json", code=200):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def reply(self, data: dict, code=200):
        self.send(json.dumps(data, ensure_ascii=False).encode("utf-8"), code=code)

    def body_json(self) -> dict:
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or b"{}") if n else {}

    def do_GET(self):
        if urlparse(self.path).path == "/":
            self.send(PAGE.encode("utf-8"), "text/html; charset=utf-8")
        elif urlparse(self.path).path == "/api/state":
            self.reply(full_state())
        else:
            self.send(b"", "text/plain", 404)

    def do_POST(self):
        url = urlparse(self.path)
        try:
            if url.path == "/api/upload":  # сырое тело = zip
                name = re.sub(r"[^\w.-]", "_", parse_qs(url.query).get("name", ["upload.zip"])[0])
                P.IMPORTS.mkdir(parents=True, exist_ok=True)
                target = P.IMPORTS / name
                left = int(self.headers.get("Content-Length", 0))
                with target.open("wb") as f:
                    while left > 0:
                        chunk = self.rfile.read(min(1 << 20, left))
                        if not chunk:
                            break
                        f.write(chunk)
                        left -= len(chunk)
                return self.reply(do_import(target))
            data = self.body_json()
            if url.path == "/api/import-local":
                src = DOWNLOADS / Path(str(data.get("name", ""))).name  # только из Загрузок, без путей
                if not src.is_file() or not src.name.startswith("ai-training_"):
                    return self.reply({"ok": False, "error": "Файл не найден в Загрузках"})
                return self.reply(do_import(src, remember=src.name))
            if url.path == "/api/label":
                return self.reply(do_label())
            if url.path == "/api/train":
                return self.reply(do_train(max(1, int(data.get("epochs", 15))), str(data.get("device", "cpu"))))
            if url.path == "/api/promote":
                return self.reply(do_promote(str(data.get("name", "")) or None, bool(data.get("force"))))
            if url.path == "/api/cancel":
                job.cancel()
                return self.reply({"ok": True})
            self.send(b"", "text/plain", 404)
        except (RuntimeError, ValueError, OSError, json.JSONDecodeError) as e:
            self.reply({"ok": False, "error": str(e)})


PAGE = """<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Дообучение AI</title>
<style>
 :root{color-scheme:dark}
 body{margin:0;background:#16181d;color:#e8e8e8;font:15px/1.45 system-ui}
 header{padding:14px 24px;background:#20232a;display:flex;align-items:center;gap:16px}
 header h1{margin:0;font-size:19px} header span{color:#9aa}
 main{max-width:980px;margin:0 auto;padding:18px 24px 60px;display:grid;gap:16px}
 section{background:#20232a;border-radius:10px;padding:16px 18px}
 h2{margin:0 0 10px;font-size:16px;display:flex;gap:10px;align-items:center}
 h2 i{font-style:normal;background:#37474f;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:13px}
 h2 i.ok{background:#2e7d32}
 .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
 .muted{color:#9aa} .warn{color:#ffb74d} .err{color:#ff8a80}
 button{font:600 14px system-ui;padding:9px 16px;border:0;border-radius:8px;color:#fff;background:#3f51b5;cursor:pointer}
 button:disabled{opacity:.4;cursor:default} button.sec{background:#455a64} button.go{background:#2e7d32} button.stop{background:#c62828}
 input,select{font:inherit;padding:7px 10px;border-radius:8px;border:1px solid #455a64;background:#16181d;color:#eee}
 #drop{border:2px dashed #455a64;border-radius:10px;padding:22px;text-align:center;color:#9aa;margin-bottom:10px}
 #drop.over{border-color:#4caf50;color:#4caf50}
 table{width:100%;border-collapse:collapse} th,td{padding:7px 8px;border-bottom:1px solid #2f343d;text-align:left}
 th{color:#9aa;font-size:12px;text-transform:uppercase}
 .tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;background:#37474f}
 .tag.cur{background:#2e7d32} .tag.bad{background:#8d6e00}
 pre{margin:10px 0 0;background:#101216;border-radius:8px;padding:10px;max-height:300px;overflow:auto;font:12.5px/1.4 Consolas,monospace;white-space:pre-wrap}
 .kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:8px}
 .kv div{background:#16181d;border-radius:8px;padding:8px 10px} .kv b{display:block;font-size:20px}
</style>
<header><h1>Дообучение AI</h1><span id=cur></span></header>
<main>
 <section><h2><i id=n1>1</i>Данные</h2>
  <div id=drop>Перетащите сюда zip, скачанный со страницы «Дообучение AI» в админке</div>
  <div id=found></div>
  <div class=kv id=kv1></div>
  <div class=muted id=hint1></div>
 </section>
 <section><h2><i id=n2>2</i>Разметка стороны</h2>
  <div class=row><button id=bLabel onclick=openLabel()>Открыть разметку</button><span class=muted id=lab></span></div>
  <div class=muted style=margin-top:8px>← спереди · → сзади · ↓ пропустить. Внизу кадра подсказка: что сказали камера и AI. Закрывать окно можно в любой момент — прогресс сохраняется.</div>
 </section>
 <section><h2><i id=n3>3</i>Обучение</h2>
  <div class=row>
   <label>Эпох <input id=epochs type=number min=1 max=200 value=15 style=width:70px></label>
   <label>Устройство <select id=device><option value=cpu>CPU</option><option value=0>GPU (0)</option></select></label>
   <button class=go id=bTrain onclick=train()>Обучить новую версию</button>
   <button class=stop id=bStop onclick=cancel() style=display:none>Остановить</button>
  </div>
  <div class=muted id=hint3 style=margin-top:8px></div>
  <pre id=log style=display:none></pre>
 </section>
 <section><h2><i id=n4>4</i>Модели</h2>
  <table><thead><tr><th>Версия</th><th>mAP50-95</th><th>Кадров train/val</th><th>Обучена</th><th></th></tr></thead><tbody id=models></tbody></table>
  <div class=muted id=msg style=margin-top:8px></div>
 </section>
</main>
<script>
const $=id=>document.getElementById(id); let S=null, wasRunning=false;
const post=(u,b)=>fetch(u,{method:'POST',body:b===undefined?'{}':(b instanceof Blob?b:JSON.stringify(b))}).then(r=>r.json());
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function refresh(){
  S=await (await fetch('/api/state')).json(); render();
  setTimeout(refresh, S.job.running?1200:4000);
}
function render(){
  const i=S.info, j=S.job, busy=j.running;
  $('cur').textContent='боевая модель: '+i.current;
  $('kv1').innerHTML=[['В inbox',i.inbox],['С подсказками сервера',i.with_hints],['Предразмечено',i.prelabeled],['Ждут разметки',i.unlabeled]]
    .map(([k,v])=>`<div>${k}<b>${v}</b></div>`).join('');
  $('found').innerHTML=S.downloads.map(d=>`<div class=row style=margin-bottom:8px><span>📦 ${esc(d.name)} (${d.size_mb} МБ) — найден в Загрузках</span><button class=sec ${busy?'disabled':''} onclick="importLocal('${esc(d.name)}')">Импортировать</button></div>`).join('');
  $('hint1').textContent=busy&&j.name==='Предразметка'?'Идёт предразметка (первый раз около минуты)…':(i.inbox? '':'Пока пусто: скачайте zip в админке, он появится здесь сам.');
  const labeled=i.front+i.rear+i.skip;
  $('lab').textContent=`размечено: спереди ${i.front}, сзади ${i.rear}, пропущено ${i.skip}`+(S.labeler?' · разметчик открыт':'');
  $('bLabel').disabled=!i.prelabeled||(busy&&j.name==='Предразметка');
  $('n1').className=i.prelabeled?'ok':''; $('n2').className=i.prelabeled&&!i.unlabeled?'ok':'';
  const small=Math.min(i.front,i.rear)<i.min_per_class;
  $('hint3').innerHTML=(i.unlabeled?`<span class=warn>Не размечено кадров: ${i.unlabeled} — они в обучение не попадут.</span> `:'')
    +(small?`<span class=warn>Меньше ${i.min_per_class} кадров одного класса — модель выучит его плохо.</span> `:'')
    +(i.candidate?`Последняя версия: ${esc(i.candidate.name)}, mAP50-95 ${i.candidate.old_map.toFixed(3)} → ${i.candidate.new_map.toFixed(3)} ${i.candidate.ok?'(можно выкатить)':'<span class=warn>(хуже предыдущей)</span>'}`:'');
  $('bTrain').disabled=busy||!labeled; $('bStop').style.display=busy?'':'none';
  const log=$('log'); log.style.display=j.log.length?'':'none';
  if(j.log.length){const atEnd=log.scrollTop+log.clientHeight>=log.scrollHeight-30; log.textContent=j.log.join('\\n'); if(atEnd||busy) log.scrollTop=log.scrollHeight;}
  if(wasRunning&&!busy) $('msg').textContent=(j.rc===0?'Готово: ':'Завершено с ошибкой: ')+j.name;
  wasRunning=busy;
  $('n3').className=i.candidate?'ok':'';
  $('models').innerHTML=S.models.map(m=>`<tr><td>${esc(m.name)} ${m.current?'<span class="tag cur">боевая</span>':''}${m.worse?' <span class="tag bad">хуже предыдущей</span>':''}</td>`
    +`<td>${m.map==null?'—':m.map.toFixed(3)}</td><td>${m.train_images==null?'—':m.train_images+' / '+m.val_images}</td><td>${m.trained_at?m.trained_at.replace('T',' '):'—'}</td>`
    +`<td>${m.current||!m.has_file?'':`<button class=sec onclick="promote('${esc(m.name)}',${m.worse})">Сделать боевой</button>`}</td></tr>`).join('');
}
async function upload(file){
  $('drop').textContent='Загружаю '+file.name+'…';
  const r=await post('/api/upload?name='+encodeURIComponent(file.name), file);
  $('drop').textContent=r.ok?`Готово: новых кадров ${r.new_frames}. Идёт предразметка…`:('Ошибка: '+r.error);
  refresh();
}
const drop=$('drop');
['dragenter','dragover'].forEach(e=>document.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('over');}));
['dragleave','drop'].forEach(e=>document.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('over');}));
document.addEventListener('drop',async ev=>{for(const f of ev.dataTransfer.files){if(f.name.toLowerCase().endsWith('.zip')) await upload(f);}});
async function importLocal(name){const r=await post('/api/import-local',{name}); $('msg').textContent=r.ok?`Импортировано, новых кадров: ${r.new_frames}`:r.error; refresh();}
async function openLabel(){const r=await post('/api/label'); if(r.ok) window.open(r.url,'_blank'); else $('msg').textContent=r.error; refresh();}
async function train(){
  if(S.info.unlabeled&&!confirm(`Не размечено кадров: ${S.info.unlabeled}. Обучить без них?`)) return;
  const r=await post('/api/train',{epochs:+$('epochs').value||15,device:$('device').value});
  $('msg').textContent=r.ok?'':(r.error||'Не удалось запустить'); refresh();
}
async function cancel(){await post('/api/cancel'); refresh();}
async function promote(name,worse){
  if(worse&&!confirm(name+' на проверочной выборке хуже предыдущей. Всё равно сделать боевой?')) return;
  const r=await post('/api/promote',{name,force:worse});
  $('msg').textContent=r.ok?r.message:r.error; refresh();
}
refresh();
</script>"""


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    if port_open(PORT):
        sys.exit(f"Порт {PORT} занят — кабинет уже запущен? Откройте http://127.0.0.1:{PORT}")
    url = f"http://127.0.0.1:{PORT}"
    print(f"Кабинет дообучения: {url}  (Ctrl+C — выход)")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
