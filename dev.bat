@echo off
echo ========================================
echo   Evento PROMPERU - Modo Desarrollo
echo ========================================
echo.

REM Verificar si el contenedor de MySQL ya está activo
echo [0/3] Verificando estado de MySQL...
docker ps --filter "name=evento_mysql" --filter "status=running" --format "{{.Names}}" | findstr /i "evento_mysql" >nul
if %errorlevel% equ 0 (
    echo Contenedor MySQL ya está activo.
) else (
    echo [1/3] Iniciando MySQL en Docker...
    docker compose up -d mysql
    if %errorlevel% neq 0 (
        echo ERROR: No se pudo iniciar MySQL. Verifica que Docker Desktop este corriendo.
        pause
        exit /b 1
    )
    echo MySQL iniciado correctamente.
)

REM Esperar a que MySQL este listo
echo [2/3] Esperando a que MySQL este listo...
:wait_mysql
docker compose exec mysql mysqladmin ping -h localhost --silent >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_mysql
)
echo MySQL listo.
echo.

REM Ejecutar migraciones pendientes
echo Ejecutando migraciones pendientes...
call npm run migrate
echo.

REM Iniciar aplicacion con hot reload
echo [3/3] Iniciando aplicacion con hot reload (nodemon)...
echo.
echo ========================================
echo   Servidor corriendo en http://localhost:3000
echo   Landing:    http://localhost:3000/
echo   Registro:   http://localhost:3000/registro
echo   Validacion: http://localhost:3000/validacion
echo   API Health: http://localhost:3000/api/_ok
echo ========================================
echo.
echo Presiona Ctrl+C para detener.
echo.

call npm run dev
