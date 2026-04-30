@echo off
setlocal
cd /d "%~dp0"
echo.
echo  ============================================
echo    SAAD. Portfolio - Local Dev Server
echo  ============================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  echo  Using Python on http://localhost:5173
  start "" "http://localhost:5173"
  python -m http.server 5173
  goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo  Using Python launcher on http://localhost:5173
  start "" "http://localhost:5173"
  py -m http.server 5173
  goto :end
)

where node >nul 2>nul
if %errorlevel%==0 (
  echo  Using Node serve on http://localhost:5173
  start "" "http://localhost:5173"
  npx --yes serve . -l 5173
  goto :end
)

echo.
echo  Neither Python nor Node was found on PATH.
echo.
echo    Install one of:
echo      - Python: https://python.org/downloads
echo      - Node  : https://nodejs.org
echo.
echo  Or open this folder in VS Code and use the
echo  "Live Server" extension - right click index.html
echo  then "Open with Live Server".
echo.
pause
:end
endlocal
