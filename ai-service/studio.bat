@echo off
rem Веб-кабинет дообучения: кнопки вместо команд ft. Откроется http://127.0.0.1:8770
"%~dp0.venv\Scripts\python.exe" "%~dp0train\studio.py" %*
