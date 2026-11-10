@echo off
setlocal
chcp 65001 >nul
set /p REPO=Ruta del repositorio gildem-craft-pro-live (carpeta con app.js): 
if "%REPO%"=="" (
 echo ERROR: Indica la ruta local del repositorio.
 pause
 exit /b 1
)
py -3 "%~dp0INSTALAR_REVISION.py" "%REPO%"
if errorlevel 1 (
 echo.
 echo ERROR: La revision NO fue aplicada. No hagas commit; revisa el mensaje.
 pause
 exit /b 1
)
echo.
echo OK: Revision instalada y probada. Ahora revisa y sube TODOS los cambios desde GitHub Desktop.
pause
