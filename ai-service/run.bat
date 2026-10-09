@echo off
rem Запуск AI-сервиса (порт 8000). Держите окно открытым или запустите как службу/задачу планировщика.
cd /d "%~dp0"
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
