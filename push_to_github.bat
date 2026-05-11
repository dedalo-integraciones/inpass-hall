@echo off
chcp 65001 > nul
echo 🚀 Iniciando proceso de subida a GitHub...

set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=Actualización de la aplicación (mejoras y correcciones)"
    echo ℹ️  No se proporcionó un mensaje de commit. Usando mensaje por defecto.
)

echo 📦 Paso 1: Añadiendo archivos modificados...
git add .

echo 💾 Paso 2: Creando commit con el mensaje: "%COMMIT_MSG%"...
git commit -m "%COMMIT_MSG%"

echo ☁️ Paso 3: Subiendo los cambios al repositorio remoto (GitHub)...
git push

if %errorlevel% equ 0 (
    echo ✅ ¡Subida completada con éxito!
) else (
    echo ❌ Hubo un error al subir los cambios. Por favor, revisa la consola.
)

echo.
pause
