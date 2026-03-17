@echo off
chcp 65001 >nul
echo ==========================================
echo 🚀 DÉMARRAGE AFRIMOBILIS
echo ==========================================
echo.

:: Tuer les processus existants sur les ports 3000 et 4000
echo 🔍 Nettoyage des ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do taskkill /F /PID %%a 2>nul
timeout /t 2 /nobreak >nul

echo ✅ Ports libérés!
echo.

:: Démarrer l'API
echo 🔧 Démarrage API (Port 4000)...
start "🟢 AFRIMOBILIS API" cmd /k "cd /d %~dp0apps\api && set SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co && set SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE1MDIzNiwiZXhwIjoyMDg3NzI2MjM2fQ.9i3Q0Ke5xJTZz8M7uQiu4PjXLpn8U24QB_ac0B2jl3E && set PORT=4000 && echo Démarrage API... && node dist\index.js"

echo ⏳ Attente API (5 secondes)...
timeout /t 5 /nobreak >nul

:: Démarrer le Web
echo 🌐 Démarrage Web (Port 3000)...
start "🔵 AFRIMOBILIS WEB" cmd /k "cd /d %~dp0apps\web && set NEXT_PUBLIC_SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co && set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTAyMzYsImV4cCI6MjA4NzcyNjIzNn0.-7JMEiP-iNDQs5U1TyLar7TgDb6HhVZkJwVBAS-qFvo && echo Démarrage Web... && npm run dev"

echo.
echo ==========================================
echo ✅ SERVEURS DÉMARRÉS!
echo ==========================================
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔌 API:      http://localhost:4000
echo.
echo 📝 Deux fenêtres sont ouvertes:
echo    - 🟢 AFRIMOBILIS API (ne pas fermer)
echo    - 🔵 AFRIMOBILIS WEB (ne pas fermer)
echo.
echo 🛑 Pour arrêter: fermer les deux fenêtres
echo.
echo ⏳ Attente de 10 secondes avant ouverture navigateur...
timeout /t 10 /nobreak >nul

:: Ouvrir le navigateur
start http://localhost:3000

echo 🌐 Navigateur ouvert!
echo.
pause
