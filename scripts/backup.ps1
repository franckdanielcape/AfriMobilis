# ========================================
# AFRIMOBILIS - SCRIPT DE SAUVEGARDE (Windows)
# ========================================

param(
    [string]$BackupDir = "..\backups",
    [switch]$CreateZip = $false
)

# Configuration
$ProjectName = "AfriMobilis"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$ErrorActionPreference = "Stop"

# Couleurs
$Green = "Green"
$Blue = "Cyan"
$Yellow = "Yellow"

Write-Host "🔧 AfriMobilis Backup Tool" -ForegroundColor $Blue
Write-Host "================================" 

# Créer le dossier de sauvegarde
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# 1. Sauvegarde Git Bundle
Write-Host "📦 Création du bundle Git..." -ForegroundColor $Yellow
$BundlePath = Join-Path $BackupDir "${ProjectName}_GIT_BUNDLE_${Date}.bundle"
git bundle create $BundlePath --all
Write-Host "✅ Bundle Git créé: $BundlePath" -ForegroundColor $Green

# 2. Sauvegarde des commits récents
Write-Host "📝 Export des commits récents..." -ForegroundColor $Yellow
$LogPath = Join-Path $BackupDir "${ProjectName}_GIT_LOG_${Date}.txt"
git log --oneline --graph --all > $LogPath
Write-Host "✅ Log Git exporté" -ForegroundColor $Green

# 3. Liste des fichiers modifiés
Write-Host "📋 Export de l'état des fichiers..." -ForegroundColor $Yellow
$StatusPath = Join-Path $BackupDir "${ProjectName}_STATUS_${Date}.txt"
git status > $StatusPath
Write-Host "✅ Statut exporté" -ForegroundColor $Green

# 4. Création d'une archive ZIP (optionnel)
if ($CreateZip) {
    Write-Host "📁 Création de l'archive ZIP..." -ForegroundColor $Yellow
    $ZipPath = Join-Path $BackupDir "${ProjectName}_BACKUP_${Date}.zip"
    
    # Exclure les dossiers de build et node_modules
    $Exclude = @('.git', 'node_modules', '.next', 'dist', 'build', '.turbo')
    
    Compress-Archive -Path "." -DestinationPath $ZipPath -Force
    Write-Host "✅ Archive ZIP créée: $ZipPath" -ForegroundColor $Green
}

# Résumé
Write-Host ""
Write-Host "🎉 Sauvegarde terminée avec succès !" -ForegroundColor $Green
Write-Host "================================"
Write-Host "Fichiers créés dans: $(Resolve-Path $BackupDir)"
Get-ChildItem $BackupDir | Where-Object { $_.Name -like "*${Date}*" } | Format-Table Name, @{Label="Size"; Expression={"{0:N2} MB" -f ($_.Length / 1MB)}}, LastWriteTime

Write-Host ""
Write-Host "💡 Pour restaurer depuis le bundle:" -ForegroundColor $Blue
Write-Host "   git clone AfriMobilis_GIT_BUNDLE_${Date}.bundle AfriMobilis_restored"
