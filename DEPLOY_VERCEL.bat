@echo off
chcp 65001 >nul
echo ==========================================
echo 🚀 DÉPLOIEMENT VERCEL - AFRIMOBILIS
echo ==========================================
echo.

:: Vérifier si Vercel CLI est installé
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI non installé
    echo 📦 Installation en cours...
    npm install -g vercel
    if errorlevel 1 (
        echo ❌ Échec de l'installation
        pause
        exit /b 1
    )
)

echo ✅ Vercel CLI installé
vercel --version
echo.

:: Vérifier la connexion
echo 🔑 Vérification connexion Vercel...
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ Non connecté à Vercel
    echo 🔐 Connexion requise:
    echo    vercel login
    vercel login
    if errorlevel 1 (
        echo ❌ Échec de la connexion
        pause
        exit /b 1
    )
)

echo ✅ Connecté à Vercel
echo.

:: Déploiement
echo 🚀 Lancement du déploiement...
echo.
echo Choisissez l'environnement:
echo   [1] Development (preview)
echo   [2] Production
echo.
set /p choice="Votre choix (1 ou 2): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Déploiement DEVELOPMENT...
    vercel
) else if "%choice%"=="2" (
    echo.
    echo 🚀 Déploiement PRODUCTION...
    vercel --prod
) else (
    echo ❌ Choix invalide
    pause
    exit /b 1
)

echo.
echo ✅ Déploiement terminé!
echo.
pause
