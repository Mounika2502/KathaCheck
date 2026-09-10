@echo off
title KathaCheck Launcher
echo ========================================================
echo         Launching KathaCheck Multi-Partner Finance System
echo ========================================================
echo.
echo Starting Backend in separate window...
start "KathaCheck Backend (FastAPI)" cmd /c "cd /d "%~dp0backend" && start_backend.bat"
timeout /t 2 /nobreak >nul
echo Starting Frontend in separate window...
start "KathaCheck Frontend (React)" cmd /c "cd /d "%~dp0frontend" && start_frontend.bat"
echo.
echo KathaCheck is booting up!
echo Backend: http://127.0.0.1:8000 (Swagger docs at /docs)
echo Frontend: http://localhost:5173
echo.
pause
