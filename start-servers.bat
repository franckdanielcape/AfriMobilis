@echo off
chcp 65001 >nul
echo 🚀 Démarrage d'AfriMobilis...
echo.

:: Variables d'environnement
set "SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co"
set "SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE1MDIzNiwiZXhwIjoyMDg3NzI2MjM2fQ.9i3Q0Ke5xJTZz8M7uQiu4PjXLpn8U24QB_ac0B2jl3E"
set "PORT=4000"
set "NEXT_PUBLIC_SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co"
set "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTAyMzYsImV4cCI6MjA4NzcyNjIzNn0.-7JMEiP-iNDQs5U1TyLar7TgDb6HhVZkJwVBAS-qFvo"

:: Démarrer l'API
echo 🔧 Démarrage API (Port 4000)...
start "AfriMobilis API" cmd /k "cd apps\api && set SUPABASE_URL=%SUPABASE_URL% && set SUPABASE_SERVICE_KEY=%SUPABASE_SERVICE_KEY% && set PORT=%PORT% && node dist\index.js"

echo ⏳ Attente démarrage API (5s)...
timeout /t 5 /nobreak >nul

:: Démarrer le Web
echo 🌐 Démarrage Web (Port 3000)...
start "AfriMobilis Web" cmd /k "cd apps\web && set NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL% && set NEXT_PUBLIC_SUPABASE_ANON_KEY=%NEXT_PUBLIC_SUPABASE_ANON_KEY% && npm run dev"

echo.
echo ✅ Serveurs démarrés!
echo 📱 Frontend: http://localhost:3000
echo 🔌 API: http://localhost:4000
echo.
echo 📝 Les fenêtres des serveurs sont ouvertes
echo 🛑 Pour arrêter: fermer les fenêtres
echo.
pause
