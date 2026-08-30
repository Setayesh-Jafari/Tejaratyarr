@echo off
setlocal
cd /d "%~dp0"
title Tejaratyarr Launcher

echo ==============================================
echo   Tejaratyarr - FREE launcher
echo ==============================================
echo.

rem --- 1) check node ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found.
  echo Install the LTS version from https://nodejs.org then run this again.
  pause
  exit /b 1
)
echo [OK] Node.js found: 
node -v

rem --- 2) check dist ---
if not exist "dist\server.cjs" (
  echo [INFO] dist not found - building now (a few minutes)...
  call npm install --no-audit --no-fund
  call npm run build
)
if not exist "dist\server.cjs" (
  echo [ERROR] build failed. dist\server.cjs is missing.
  pause
  exit /b 1
)
echo [OK] dist ready.

rem --- 3) start server in a new window ---
echo [INFO] Starting server...
start "Tejaratyarr server" /D "%~dp0" cmd /k "node dist\server.cjs"

rem --- 4) wait ---
echo [INFO] Waiting 5 seconds...
timeout /t 5 /nobreak >nul

rem --- 5) download cloudflared if missing ---
if not exist "cloudflared.exe" (
  echo [INFO] Downloading cloudflared...
  curl.exe -L -o cloudflared.exe "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
)
if not exist "cloudflared.exe" (
  echo [WARN] cloudflared download failed (GitHub may be slow).
  echo You can still use the app locally at http://localhost:3000
  echo and share your screen with the professor.
  pause
  exit /b 0
)
echo [OK] cloudflared ready.

rem --- 6) start tunnel in a new window ---
echo [INFO] Starting public tunnel...
start "Tejaratyarr public link" /D "%~dp0" cmd /k "cloudflared.exe tunnel --url http://localhost:3000 --no-autoupdate"

echo.
echo ==============================================
echo   Done!
echo   Local app   : http://localhost:3000
echo   Public link : see the window titled
echo                 "Tejaratyarr public link"
echo   KEEP BOTH WINDOWS OPEN.
echo ==============================================
pause
