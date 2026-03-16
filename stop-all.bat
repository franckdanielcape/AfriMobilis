@echo off
echo 🛑 Arrêt des serveurs AfriMobilis...

:: Arrêter les processus Node.js
taskkill /F /IM node.exe >nul 2>&1

:: Arrêter Docker
cd /d "%~dp0"
docker-compose down >nul 2>&1

echo ✅ Tous les serveurs sont arrêtés.
pause
