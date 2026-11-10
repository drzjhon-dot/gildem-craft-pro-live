@echo off
setlocal
chcp 65001 >nul
echo ======================================================
echo    GILDEM CRAFT PRO - REPARACION NETLIFY VERIFICADA
echo ======================================================
echo NO copies los tests ni los modulos manualmente.
where git >nul 2>nul
if errorlevel 1 (
 for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
  if exist "%%~fD\resources\app\git\cmd\git.exe" (
   set "PATH=%%~fD\resources\app\git\cmd;%PATH%"
  )
 )
)
echo Este proceso instala, ejecuta tests, compila y solo
echo despues realiza commit y push a GitHub.
echo.
set /p REPO=Ruta de GitHub Desktop, carpeta con app.js: 
if "%REPO%"=="" (
 echo ERROR: Ruta vacia.
 pause
 exit /b 1
)
py -3 "%~dp0PUBLICAR_REPARACION_VERIFICADA.py" "%REPO%"
if errorlevel 1 (
 echo.
 echo PUBLICACION DETENIDA. Revisa el error.
 pause
 exit /b 1
)
echo.
echo GitHub actualizado. Verifica el nuevo deploy de Netlify.
pause
