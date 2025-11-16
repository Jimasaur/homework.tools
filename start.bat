@echo off
echo ============================================
echo   Homework.tools - Quick Start
echo ============================================
echo.

REM Check if .env files exist
if not exist "backend\.env" (
    echo [!] backend\.env not found. Creating from example...
    copy backend\.env.example backend\.env
    echo.
    echo [!] Please edit backend\.env and add your OPENAI_API_KEY
    echo     Then run this script again.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo [*] Creating frontend\.env from example...
    copy frontend\.env.example frontend\.env
)

echo [*] Checking for Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [!] Docker not found. Please install Docker Desktop.
    echo     Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [*] Starting services with Docker Compose...
echo.
docker-compose up

pause
