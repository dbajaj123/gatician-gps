@echo off
echo ========================================
echo Gatician GPS - Quick Start Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if MongoDB is running
echo Checking MongoDB connection...
timeout /t 2 /nobreak >nul
echo.

REM Install backend dependencies
echo [1/4] Installing backend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

REM Install frontend dependencies
echo [2/4] Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..
echo Frontend dependencies installed successfully!
echo.

REM Check for .env file
if not exist .env (
    echo [3/4] Creating .env file...
    (
        echo # Server Configuration
        echo PORT=3001
        echo NODE_ENV=development
        echo.
        echo # Database
        echo MONGODB_URI=mongodb://localhost:27017/gatician-gps
        echo.
        echo # JWT Secrets
        echo JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
        echo JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
        echo JWT_ACCESS_EXPIRY=15m
        echo JWT_REFRESH_EXPIRY=7d
        echo.
        echo # CORS
        echo CORS_ORIGIN=http://localhost:3000
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
    ) > .env
    echo .env file created!
) else (
    echo [3/4] .env file already exists, skipping...
)
echo.

REM Seed test data
echo [4/4] Do you want to seed test data? (y/n)
set /p seed="Enter choice: "
if /i "%seed%"=="y" (
    echo Seeding test data...
    node scripts\seedTestData.js
    echo.
    echo Test accounts created:
    echo   Admin: admin@example.com / admin123
    echo   User:  user@example.com / user123
    echo.
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo.
echo 1. Start MongoDB if not running
echo 2. Open a terminal and run: npm run dev
echo 3. Open another terminal, cd to frontend, and run: npm run dev
echo 4. Open browser at http://localhost:3000
echo.
echo Or run: start-dev.bat to start both servers
echo.
pause
