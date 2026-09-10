@echo off
title KathaCheck Backend API
echo Starting KathaCheck Python FastAPI Backend on port 8000...
cd /d "%~dp0"
python -m uvicorn app.main:app --reload --port 8000
pause
