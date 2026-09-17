@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo       ECODRIVE AI - FIRST TIME SETUP
echo ===============================================
echo.
python -m pip install -r requirements.txt
if errorlevel 1 goto :error

echo.
echo Installing frontend packages...
cd /d "%~dp0frontend\ecodrive-ui"
npm install
if errorlevel 1 goto :error

cd /d "%~dp0"
echo.
echo ===============================================
echo Setup completed successfully.
echo Now double-click START_ECODRIVE.bat
echo ===============================================
endlocal
pause
exit /b 0
:error
cd /d "%~dp0"
echo.
echo SETUP FAILED. Read the error above and send it to ChatGPT.
endlocal
pause
exit /b 1
