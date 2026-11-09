@echo off
chcp 65001 >nul
setlocal
if "%~1"=="" (
 echo Arrastra la CARPETA COMPLETA del proyecto Gildem Craft Pro sobre este .bat.
 echo La carpeta debe contener app.js, package.json y core\.
 pause
 exit /b 1
)
set "TARGET=%~1"
where py >nul 2>nul
if not errorlevel 1 (
 py -3 "%~dp0INSTALAR_ACTUALIZACION.py" "%TARGET%"
) else (
 python "%~dp0INSTALAR_ACTUALIZACION.py" "%TARGET%"
)
if errorlevel 1 (
 echo ERROR en la actualizacion. Revisa el mensaje anterior.
 pause
 exit /b 1
)
pushd "%TARGET%"
where npm >nul 2>nul
if errorlevel 1 (
 echo Falta Node.js 22 / npm. Instala Node y ejecuta npm test y npm run build.
 popd
 pause
 exit /b 1
)
call npm test
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error
popd
echo Pruebas y compilacion correctas. Haz Commit y Push con GitHub Desktop para publicar en Netlify.
pause
exit /b 0
:error
echo PRUEBAS O COMPILACION FALLARON: NO PUBLIQUES TODAVIA.
popd
pause
exit /b 1
