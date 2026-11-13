@echo off
chcp 65001 >nul 2>&1
title Carbon Trace
cd /d "%~dp0"
echo.
echo   Starting Carbon Trace ...
echo.
if not exist "%~dp0node.exe" (
  echo   [ERROR] node.exe not found in this folder.
  echo   Please extract the whole ZIP before running.
  echo.
  pause
  exit /b 1
)
if not exist "%~dp0dist\index.html" (
  echo   [ERROR] dist\index.html not found.
  echo   Please extract the whole ZIP before running.
  echo.
  pause
  exit /b 1
)
"%~dp0node.exe" "%~dp0server.js"
set EXITCODE=%errorlevel%
echo.
if not "%EXITCODE%"=="0" (
  echo   [ERROR] Server exited with code %EXITCODE%.
  echo   If node.exe was blocked by antivirus, add this folder to the whitelist.
) else (
  echo   Server stopped.
)
echo.
pause
