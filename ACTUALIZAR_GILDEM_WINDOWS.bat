@echo off
setlocal
chcp 65001 >nul
set "REPO=%~1"
echo.
echo === GILDEM CRAFT PRO - MOTOR POR ACTIVIDAD ===
echo.
if "%REPO%"=="" (
 echo Abre GitHub Desktop - Repository - Show in Explorer.
 echo Copia la ruta de la carpeta que contiene app.js.
 echo.
 set /p "REPO=Ruta de la carpeta gildem-craft-pro-live: "
)
if not exist "%REPO%\app.js" (
 echo ERROR: la carpeta indicada no contiene app.js.
 pause
 exit /b 1
)
where py >nul 2>nul
if not errorlevel 1 (
 py -3 "%~dp0INSTALAR_DEMANDA.py" "%REPO%"
) else (
 where python >nul 2>nul
 if errorlevel 1 (
  echo ERROR: instala Python 3 o ejecuta el script desde un entorno con Python.
  pause
  exit /b 1
 )
 python "%~dp0INSTALAR_DEMANDA.py" "%REPO%"
)
if errorlevel 1 (
 echo.
 echo No se ha completado el cambio. Revisa el mensaje de error.
 pause
 exit /b 1
)
echo.
echo Si tienes Node.js, abre la carpeta del repositorio y ejecuta:
echo   npm test
echo   npm run build
echo.
echo Luego en GitHub Desktop: Commit to main y Push origin.
echo Netlify solo actualizara la web cuando publiques el nuevo codigo.
pause
