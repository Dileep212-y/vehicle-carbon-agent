@echo off
setlocal
cd /d "%~dp0"

echo ===============================================
echo          ECODRIVE AI - STARTING
echo ===============================================
echo.

echo [1/2] Starting FastAPI backend on port 8000...
start "EcoDrive Backend" cmd /k "cd /d "%~dp0" && python -m uvicorn eco_drive_agent.api:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React frontend on port 5173...
start "EcoDrive Frontend" cmd /k "cd /d "%~dp0frontend\ecodrive-ui" && npm run dev"

timeout /t 4 /nobreak >nul
start "" http://localhost:5173/

echo.
echo EcoDrive AI is starting.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
 echo.
echo Keep both command windows open while using the application.
endlocal
