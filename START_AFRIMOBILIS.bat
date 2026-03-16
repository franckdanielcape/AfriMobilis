@echo off
chcp 65001 >nul
echo =====================================================
echo  🚀 DEMARRAGE AFRIMOBILIS - PROCESS COMPLET
echo =====================================================
echo.

:: Vérifier si node_modules existe
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    call npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation
        pause
        exit /b 1
    )
)

echo ✅ Dépendances OK
echo.

:: Vérifier la configuration
echo 🔍 Vérification de la configuration Supabase...
if exist "apps\web\.env.local" (
    echo ✅ Fichier .env.local trouvé
    findstr /C:"NEXT_PUBLIC_SUPABASE_URL" "apps\web\.env.local" >nul
    if errorlevel 1 (
        echo ⚠️  SUPABASE_URL non trouvé
    ) else (
        echo ✅ Configuration Supabase OK
    )
) else (
    echo ❌ Fichier .env.local manquant
    pause
    exit /b 1
)

echo.
echo =====================================================
echo  🌐 CONNEXION SUPABASE CONFIGUREE:
echo     URL: https://fqtzxijhqxnpwchgoshm.supabase.co
echo =====================================================
echo.

:: Démarrer le serveur
echo 🚀 Démarrage du serveur Next.js...
echo ⏳ Cela peut prendre quelques secondes...
echo.
echo 📱 Une fois démarré, ouvrez : http://localhost:3000
echo 🔑 Identifiants de connexion:
echo    Email: franckdanielcape@gmail.com
echo    Mot de passe: (celui que vous avez défini dans Supabase)
echo.
echo =====================================================

npm run dev

pause
