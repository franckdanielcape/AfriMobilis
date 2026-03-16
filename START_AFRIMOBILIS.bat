@echo off
chcp 65001 >nul
echo 🚀 Démarrage d'AfriMobilis...
echo.

:: Vérifier si les ports sont libres
echo 📡 Vérification des ports...
netstat -ano | findstr :3000 >nul && (
    echo ⚠️  Port 3000 déjà utilisé. Arrêt du processus...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a 2>nul
)
netstat -ano | findstr :4000 >nul && (
    echo ⚠️  Port 4000 déjà utilisé. Arrêt du processus...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do taskkill /F /PID %%a 2>nul
)

echo.
echo ✅ Ports libérés!
echo.

:: Démarrer l'API
echo 🔧 Démarrage de l'API (Port 4000)...
start "AfriMobilis API" cmd /k "cd apps\api && npm run dev"

:: Attendre que l'API démarre
timeout /t 3 /nobreak >nul

:: Démarrer le Web
echo 🌐 Démarrage du Frontend (Port 3000)...
start "AfriMobilis Web" cmd /k "cd apps\web && npm run dev"

echo.
echo ✅ Serveurs démarrés!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔌 API: http://localhost:4000
echo.
echo 📝 Logs disponibles dans les fenêtres ouvertes
echo 🛑 Pour arrêter: fermer les fenêtres ou exécuter stop-all.bat
echo.
pause
