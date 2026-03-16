@echo off
chcp 65001 >nul
echo 🧹 NETTOYAGE COMPLET AVANT TEST
echo ====================================
echo.

REM Arrêter tous les processus Node/npm
echo 1️⃣ Arrêt des processus Node.js...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
taskkill /F /IM next.exe 2>nul
timeout /t 2 /nobreak >nul

REM Nettoyer les caches Next.js
echo 2️⃣ Nettoyage cache .next...
if exist "apps\web\.next" (
    rmdir /s /q "apps\web\.next"
    echo    ✅ Cache .next supprimé
) else (
    echo    ℹ️ Pas de cache .next trouvé
)

if exist "apps\api\dist" (
    rmdir /s /q "apps\api\dist"
    echo    ✅ Dossier dist API supprimé
)

REM Nettoyer cache npm
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo    ✅ Cache npm supprimé
)

echo.
echo 3️⃣ Vérification des fichiers critiques...

REM Vérifier que les fichiers essentiels existent
if not exist "apps\web\src\app\dashboard\page.tsx" (
    echo ❌ ERREUR: dashboard/page.tsx manquant !
    pause
    exit /b 1
)

if not exist "apps\web\src\app\dashboard\layout.tsx" (
    echo ❌ ERREUR: dashboard/layout.tsx manquant !
    pause
    exit /b 1
)

echo    ✅ Fichiers critiques présents

echo.
echo 4️⃣ Installation dépendances (si nécessaire)...
if not exist "node_modules" (
    echo    📦 Installation node_modules...
    npm install
)

echo.
echo ====================================
echo 🚀 Démarrage du serveur...
echo ====================================
echo.
echo 📝 Instructions:
echo    1. Attendre que le serveur démarre
echo    2. Ouvrir http://localhost:3000/dashboard?v=clean
echo    3. Tester en navigation privée (Ctrl+Maj+N)
echo.
echo ====================================

npm run dev
