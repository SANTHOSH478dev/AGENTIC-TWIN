@echo off
echo ======================================================================
echo    Agentic Personal Digital Twin (PDT-PDRO) Full Application Launcher
echo ======================================================================
echo.

echo [1/2] Starting FastAPI Backend Engine on http://localhost:8000 ...
start "PDT Backend API" cmd /k "cd /d %~dp0 && "c:\Users\santh\OneDrive\Desktop\Cashflow _dev\venv\Scripts\python.exe" -m uvicorn backend.app.main:app --reload --port 8000"

echo [2/2] Starting React Vite Frontend Dashboard on http://localhost:5173 ...
start "PDT Frontend Web App" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Application started successfully!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Interface: http://localhost:5173
echo.
