@echo off
setlocal
chcp 65001 >nul
title Tejaratyarr Launcher
cd /d "%~dp0"

echo ==================================================
echo   Tejaratyarr - one-click start (FREE)
echo ==================================================
echo.

rem --- 1) check node ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Download and install the LTS version from: https://nodejs.org
  pause
  exit /b 1
)

rem --- 2) build if needed (only once) ---
if not exist "dist\server.cjs" (
  echo Building the app (one time only, takes a few minutes)...
  call npm install --no-audit --no-fund
  call npm run build
)

rem --- 3) start the server ---
echo Starting server on http://localhost:3000 ...
start "Tejaratyarr - server" /D "%~dp0" cmd /k "node dist\server.cjs"

rem --- 4) wait a moment ---
timeout /t 4 /nobreak >nul

rem --- 5) download cloudflared (one time only) ---
if not exist "cloudflared.exe" (
  echo Downloading cloudflared (one time only)...
  curl.exe -L -o cloudflared.exe "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
)
if not exist "cloudflared.exe" (
  powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
)
if not exist "cloudflared.exe" (
  echo.
  echo [WARNING] Could not download cloudflared.
  echo You can still use the app locally at http://localhost:3000
  echo and share your screen with the professor.
  pause
  exit /b 0
)

rem --- 6) start the public-link tunnel ---
echo.
echo Opening the public-link tunnel...
echo A new window will open. Your public link looks like:
echo    https://xxxxxxxxxxxx.trycloudflare.com
start "Tejaratyarr - public link" /D "%~dp0" cmd /k "cloudflared.exe tunnel --url http://localhost:3000 --no-autoupdate"

echo.
echo ==================================================
echo Done!
echo   Local app : http://localhost:3000
echo   Public link: see the new window (trycloudflare)
echo.
echo Keep BOTH windows open while sharing the link.
echo If Windows Firewall asks, allow "Node.js" on private networks.
echo ==================================================
pause
