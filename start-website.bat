@echo off
REM HYT website - double-click to preview locally (no Python needed)
set PORT=%1
if "%PORT%"=="" set PORT=8080
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1" -Port %PORT%
pause
