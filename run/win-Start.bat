@echo off
:a
node ../src/index.js
if errorlevel 1 (
if not errorlevel 3 (
GOTO END;
))
goto a
:END
echo.
echo Press any key to exit...
pause >nul
