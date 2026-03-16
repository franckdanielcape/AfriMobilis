# Script PowerShell pour mettre à jour la clé Service Role
# Usage: .\update-service-key.ps1

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║  Mise à jour de la clé Supabase Service Role               ║
╚════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "1. Va sur https://supabase.com/dashboard" -ForegroundColor Yellow
Write-Host "2. Connecte-toi et sélectionne le projet AfriMobilis" -ForegroundColor Yellow
Write-Host "3. Clique sur 'Project Settings' (engrenage) > 'API'" -ForegroundColor Yellow
Write-Host "4. Copie la clé 'service_role' (PAS 'anon')" -ForegroundColor Yellow
Write-Host ""

$serviceKey = Read-Host -Prompt "Colle ta clé SERVICE_ROLE_KEY ici"

if ([string]::IsNullOrWhiteSpace($serviceKey)) {
    Write-Host "❌ Clé vide. Annulé." -ForegroundColor Red
    exit 1
}

if (-not $serviceKey.StartsWith("eyJ")) {
    Write-Host "⚠️  La clé ne semble pas être un JWT valide. Continue quand même ?" -ForegroundColor Yellow
    $continue = Read-Host "Tape 'oui' pour continuer"
    if ($continue -ne "oui") {
        exit 1
    }
}

$envContent = @"
SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co
SUPABASE_SERVICE_KEY=$serviceKey
REDIS_URL=redis://localhost:6379
PORT=4000
"@

$envPath = "apps/api/.env"

try {
    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
    Write-Host ""
    Write-Host "✅ Clé mise à jour dans $envPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vérification..." -ForegroundColor Cyan
    
    # Vérification
    cd apps/api
    npm run check-env
    
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
