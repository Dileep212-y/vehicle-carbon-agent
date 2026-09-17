@echo off
cd /d "%~dp0"
echo Starting EcoDrive AI backend...
python -m uvicorn eco_drive_agent.api:app --host 127.0.0.1 --port 8000 --reload
pause
