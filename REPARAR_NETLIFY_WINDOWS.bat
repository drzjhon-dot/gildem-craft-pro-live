@echo off
chcp 65001 >nul
setlocal
if "%~1"=="" (
 echo Arrastra la carpeta COMPLETA del repositorio de GitHub sobre este archivo.
 echo No arrastres el ZIP: debe ser una carpeta con app.js, package.json y core.
 pause
 exit /b 1
)
where py >nul 2>nul
if not errorlevel 1 (
 py -3 "%~dp0REPARAR_NETLIFY.py" "%~1"
) else (
 python "%~dp0REPARAR_NETLIFY.py" "%~1"
)
if errorlevel 1 (
 echo No se modifico el repositorio si la validacion fallo. Revisa DIAGNOSTICO_EJECUCION.txt.
 pause
 exit /b 1
)
echo Abre GitHub Desktop, revisa y confirma TODOS los cambios. Luego Push origin.
pause
