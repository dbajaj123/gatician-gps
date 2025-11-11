@echo off
title Gatician GPS - Development Servers

echo ========================================
echo Starting Gatician GPS Development Servers
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop all servers
echo ========================================
echo.

REM Start backend in new window
start "Gatician Backend" cmd /k "npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Gatician Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Check the new terminal windows for logs
echo.
pause
