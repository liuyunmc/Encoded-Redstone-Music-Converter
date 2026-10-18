@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22 or newer, then reopen this file.
  pause
  exit /b 1
)
if /i "%~1"=="--no-open" (
  node scripts/serve.mjs
) else (
  node scripts/serve.mjs --open
)
if errorlevel 1 (
  pause
  exit /b 1
)
endlocal
