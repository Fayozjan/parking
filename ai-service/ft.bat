@echo off
rem Дообучение на своём компе: ft status | pull | prep | label | build | train | promote | all
"%~dp0.venv\Scripts\python.exe" "%~dp0train\pipeline.py" %*
