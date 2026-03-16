@echo off
chcp 65001 >nul
echo 🚀 Démarrage automatique d'AfriMobilis...
echo.

:: Vérifier si les ports sont déjà utilisés
echo 🔍 Vérification des ports...
netstat -ano | findstr :3000 >nul && (
    echo ⚠️  Port 3000 déjà utilisé. Arrêt du processus...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
)
netstat -ano | findstr :4000 >nul && (
    echo ⚠️  Port 4000 déjà utilisé. Arrêt du processus...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 📦 Vérification des dépendances...
cd /d "%~dp0"

:: Démarrer Docker si disponible
echo 🐳 Démarrage de Docker...
start "Docker AfriMobilis" cmd /k "docker-compose up -d && echo Docker démarré ! && pause"

timeout /t 3 >nul

:: Démarrer le Frontend
echo 🌐 Démarrage du Frontend (Next.js) sur http://localhost:3000...
start "Frontend - AfriMobilis" cmd /k "cd /d %~dp0apps/web && echo Lancement du frontend... && npm run dev"

timeout /t 2 >nul

:: Démarrer l'API (optionnel)
echo 🔧 Démarrage de l'API (Express) sur http://localhost:4000...
start "API - AfriMobilis" cmd /k "cd /d %~dp0apps/api && echo Lancement de l'API... && npm run dev"

timeout /t 2 >nul

echo.
echo ✅ Serveurs démarrés !
echo.
echo 🌐 Accès au site :
echo    Frontend : http://localhost:3000
echo    API      : http://localhost:4000
echo.
echo 📱 Identifiants de test :
echo    Email    : franckdanielcape@gmail.com
echo    Téléphone: 07 08 12 42 33
echo.
echo ⚠️  Les fenêtres de terminaux sont ouvertes. Ne les fermez pas !
echo 🛑 Pour arrêter : fermez les fenêtres de terminaux ou exécutez stop-all.bat
echo.
pause
