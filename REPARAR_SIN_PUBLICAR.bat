@echo off
setlocal
chcp 65001 >nul
set /p REPO=Ruta del repositorio, carpeta con app.js: 
if "%REPO%"=="" exit /b 1
py -3 "%~dp0INSTALAR_REVISION.py" "%REPO%"
if errorlevel 1 (
 echo ERROR: Reparacion cancelada y cambios restaurados.
 pause
 exit /b 1
)
echo Reparacion instalada localmente. Haz commit y push de TODOS los archivos con GitHub Desktop.
pause
