# Script de démarrage des serveurs AfriMobilis

Write-Host "🚀 Démarrage d'AfriMobilis..." -ForegroundColor Green

# Variables d'environnement
$env:SUPABASE_URL = "https://fqtzxijhqxnpwchgoshm.supabase.co"
$env:SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE1MDIzNiwiZXhwIjoyMDg3NzI2MjM2fQ.9i3Q0Ke5xJTZz8M7uQiu4PjXLpn8U24QB_ac0B2jl3E"
$env:PORT = "4000"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://fqtzxijhqxnpwchgoshm.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTAyMzYsImV4cCI6MjA4NzcyNjIzNn0.-7JMEiP-iNDQs5U1TyLar7TgDb6HhVZkJwVBAS-qFvo"

# Démarrer l'API
Write-Host "`n🔧 Démarrage API (Port 4000)..." -ForegroundColor Cyan
$apiProcess = Start-Process -FilePath "node" -ArgumentList "dist/index.js" -WorkingDirectory "apps/api" -PassThru -WindowStyle Normal

Write-Host "⏳ Attente démarrage API..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Démarrer le Web
Write-Host "`n🌐 Démarrage Web (Port 3000)..." -ForegroundColor Cyan
$webProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "apps/web" -PassThru -WindowStyle Normal

Write-Host "`n✅ Serveurs démarrés!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "🔌 API: http://localhost:4000" -ForegroundColor White
Write-Host "`n📝 Les fenêtres des serveurs sont ouvertes" -ForegroundColor Gray
Write-Host "🛑 Pour arrêter: fermer les fenêtres ou Ctrl+C" -ForegroundColor Gray

# Garder le script ouvert
Read-Host "`nAppuyez sur Entrée pour fermer ce terminal (les serveurs continueront de tourner)"
