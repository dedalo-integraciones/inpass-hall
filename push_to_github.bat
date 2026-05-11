@echo off
echo Iniciando proceso de subida a GitHub...
echo.

echo Paso 1: Anadiendo archivos...
git add .

echo Paso 2: Creando commit...
git commit -m "Actualizacion de la app"

echo Paso 3: Subiendo a GitHub...
git push

echo.
echo Proceso finalizado. 
pause
