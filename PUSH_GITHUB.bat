@echo off
chcp 65001 >nul
echo ==========================================
echo 🐙 PUSH SUR GITHUB
echo ==========================================
echo.

:: Vérifier si git est initialisé
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ Pas un dépôt git
    pause
    exit /b 1
)

echo ✅ Dépôt git vérifié
echo.

:: Demander le username GitHub
set /p github_username="Entrez votre username GitHub: "
if "%github_username%"=="" (
    echo ❌ Username requis
    pause
    exit /b 1
)

:: Demander le nom du repo
set /p repo_name="Nom du dépôt [AfriMobilis]: "
if "%repo_name%"=="" set repo_name=AfriMobilis

echo.
echo 🔗 Configuration du remote...
echo.

:: Vérifier si remote existe déjà
git remote get-url origin >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️  Remote 'origin' existe déjà
    git remote -v
    echo.
    set /p change_remote="Voulez-vous le changer? (o/n): "
    if /i "!change_remote!"=="o" (
        git remote remove origin
    ) else (
        goto :push
    )
)

:: Ajouter le remote
echo 🔗 Ajout du remote GitHub...
git remote add origin https://github.com/%github_username%/%repo_name%.git
if errorlevel 1 (
    echo ❌ Erreur lors de l'ajout du remote
    pause
    exit /b 1
)

echo ✅ Remote ajouté: https://github.com/%github_username%/%repo_name%.git
echo.

:push
echo 🚀 Push vers GitHub...
git push -u origin master

if errorlevel 1 (
    echo.
    echo ❌ Échec du push
    echo 💡 Essayez avec token:
    echo    git push https://TOKEN@github.com/%github_username%/%repo_name%.git
    pause
    exit /b 1
)

echo.
echo ✅ Push réussi!
echo.
echo 🌐 Votre projet est sur:
echo    https://github.com/%github_username%/%repo_name%
echo.
echo 📋 Prochaines étapes:
echo    1. Allez sur https://vercel.com/new
echo    2. Importez votre dépôt GitHub
echo    3. Configurez les variables d'environnement
echo    4. Déployez!
echo.
pause
