@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║           DÉMARRAGE STABLE - AFRIMOBILIS                  ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM ========================================
REM 1. VÉRIFICATION PRÉALABLE
REM ========================================
echo 🔍 Vérification des prérequis...

if not exist "package.json" (
    echo ❌ ERREUR: package.json non trouvé. Lancer depuis le dossier racine.
    pause
    exit /b 1
)

echo    ✅ Dossier racine OK

REM ========================================
REM 2. ARRÊT DES PROCESSUS EXISTANTS
REM ========================================
echo.
echo 🛑 Arrêt des processus existants...

REM Utiliser PowerShell pour arrêter proprement les processus Node
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"
powershell -Command "Get-Process npm -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"

timeout /t 2 /nobreak >nul
echo    ✅ Processus arrêtés

REM ========================================
REM 3. NETTOYAGE CACHE .NEXT
REM ========================================
echo.
echo 🧹 Nettoyage des caches...

if exist "apps\web\.next" (
    rmdir /s /q "apps\web\.next" 2>nul
    echo    ✅ Cache apps/web/.next supprimé
)

if exist "apps\api\dist" (
    rmdir /s /q "apps\api\dist" 2>nul
    echo    ✅ Dossier apps/api/dist supprimé
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache" 2>nul
    echo    ✅ Cache node_modules/.cache supprimé
)

REM Supprimer tous les fichiers .next de tous les apps
for /d %%d in (apps\*) do (
    if exist "%%d\.next" (
        rmdir /s /q "%%d\.next" 2>nul
        echo    ✅ Cache %%d/.next supprimé
    )
)

echo    ✅ Nettoyage terminé

REM ========================================
REM 4. VÉRIFICATION DES FICHIERS CRITIQUES
REM ========================================
echo.
echo 📋 Vérification des fichiers critiques...

set CRITICAL_ERROR=0

if not exist "apps\web\src\app\dashboard\page.tsx" (
    echo ❌ CRITIQUE: dashboard/page.tsx manquant
    set CRITICAL_ERROR=1
)

if not exist "apps\web\src\app\dashboard\layout.tsx" (
    echo ❌ CRITIQUE: dashboard/layout.tsx manquant
    set CRITICAL_ERROR=1
)

if not exist "apps\web\src\app\dashboard\chef-ligne\page.tsx" (
    echo ⚠️ AVERTISSEMENT: chef-ligne/page.tsx manquant
)

if %CRITICAL_ERROR% == 1 (
    echo.
    echo ❌ Fichiers critiques manquants. Arrêt.
    pause
    exit /b 1
)

echo    ✅ Fichiers critiques présents

REM ========================================
REM 5. INSTALLATION DÉPENDANCES (SI NÉCESSAIRE)
REM ========================================
if not exist "node_modules" (
    echo.
    echo 📦 Installation des dépendances...
    npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de npm install
        pause
        exit /b 1
    )
)

REM ========================================
REM 6. DÉMARRAGE
REM ========================================
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  🚀 DÉMARRAGE DU SERVEUR...                               ║
echo ║                                                           ║
echo ║  URL: http://localhost:3000                               ║
echo ║                                                           ║
echo ║  Navigateur recommandé: Chrome/Edge en navigation         ║
echo ║  privée (Ctrl+Maj+N) pour éviter les caches.              ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

npm run dev
