# Lancer l'Application AfriMobilis

> Guide rapide pour démarrer et accéder au site

---

## 🚀 Démarrage Rapide

### 1. Prérequis

Vérifiez que tout est installé :

```bash
# Node.js (v18+)
node --version

# npm
npm --version

# Docker (pour la base de données locale)
docker --version
```

### 2. Installation des dépendances

```bash
# À la racine du projet
cd "c:\Users\DELL\OneDrive\Documents\projet informatique\Gestion-Taxi\AfriMobilis"

# Installer toutes les dépendances
npm install
```

### 3. Configuration des variables d'environnement

```bash
# Créer le fichier .env.local dans apps/web/
cd apps/web
copy .env.example .env.local
```

**Remplir `.env.local` avec vos clés Supabase :**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon

# Optionnel - pour le développement local
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service
```

> **Où trouver ces clés ?** 
> - Allez sur https://app.supabase.com
> - Sélectionnez votre projet
> - Settings > API

### 4. Démarrer les services (Docker)

```bash
# À la racine du projet
docker-compose up -d

# Vérifier que tout est démarré
docker-compose ps
```

### 5. Démarrer l'application

```bash
# Option A : Démarrer tout depuis la racine
npm run dev

# Option B : Démarrer uniquement le frontend
cd apps/web
npm run dev

# Option C : Démarrer uniquement l'API
cd apps/api
npm run dev
```

---

## 🌐 Accéder au Site

Une fois démarré, ouvrez votre navigateur :

### Frontend (Next.js)
- **URL :** http://localhost:3000
- **Description :** Interface utilisateur

### API Backend (Express)
- **URL :** http://localhost:4000
- **Description :** API REST

### Base de données (Supabase locale)
- **URL :** http://localhost:54321 (si Docker)
- **Studio :** http://localhost:54323

---

## 🔑 Identifiants de Test

### Super Admin
```
Email : franckdanielcape@gmail.com
Téléphone : 2250708124233
Mot de passe : (celui configuré dans Supabase)
```

### Ou créer un nouveau compte
1. Allez sur http://localhost:3000/register
2. Choisissez le type de compte
3. Remplissez le formulaire

---

## 🛠️ Commandes Utiles

### Développement

```bash
# Lancer le linter
npm run lint

# Corriger automatiquement
npm run lint -- --fix

# Build de production
npm run build

# Mode production
npm start
```

### Docker

```bash
# Démarrer
 docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f
```

### Git avec Husky

```bash
# Husky vérifie automatiquement le code avant chaque commit
git add .
git commit -m "message"

# Si bloqué par Husky, corriger puis :
git add .
git commit -m "correction"

# Contourner Husky (urgence uniquement)
git commit -m "fix" --no-verify
```

---

## 🐛 Dépannage

### Erreur "Port 3000 already in use"

```bash
# Trouver le processus
netstat -ano | findstr :3000

# Tuer le processus
taskkill /PID <PID> /F

# Ou utiliser un autre port
npm run dev -- --port 3001
```

### Erreur "Cannot find module"

```bash
# Réinstaller les node_modules
rm -rf node_modules
rm package-lock.json
npm install
```

### Erreur de connexion Supabase

```bash
# Vérifier les variables d'environnement
cat apps/web/.env.local

# Vérifier la connexion réseau
ping votre-projet.supabase.co
```

### Husky bloque le commit

```bash
# Voir les erreurs
cd apps/web
npm run lint

# Corriger
npm run lint -- --fix

# Puis recommiter
```

---

## 📂 Structure des fichiers importants

```
apps/web/
├── src/
│   ├── app/              # Pages Next.js
│   │   ├── page.tsx      # Page d'accueil
│   │   ├── login/        # Connexion
│   │   ├── register/     # Inscription
│   │   └── dashboard/    # Tableau de bord
│   │
│   ├── components/       # Composants React
│   ├── hooks/           # Hooks personnalisés
│   ├── lib/             # Utilitaires
│   └── utils/           # Fonctions helpers
│
├── .env.local           # Variables d'environnement (non commité)
├── package.json         # Dépendances
└── next.config.js       # Configuration Next.js
```

---

## 🎯 Faire des Modifications

### Exemple : Modifier une page

```bash
# 1. Ouvrir le fichier
apps/web/src/app/dashboard/page.tsx

# 2. Modifier
# ... vos changements ...

# 3. Sauvegarder
# Le serveur se recharge automatiquement (hot reload)

# 4. Vérifier dans le navigateur
# http://localhost:3000/dashboard
```

### Exemple : Créer une nouvelle page

```bash
# 1. Créer le dossier et fichier
mkdir apps/web/src/app/ma-page
notepad apps/web/src/app/ma-page/page.tsx

# 2. Ajouter le code
export default function MaPage() {
  return <div>Ma nouvelle page</div>;
}

# 3. Accéder
# http://localhost:3000/ma-page
```

---

## 📞 Support

En cas de problème :

1. Consulter `GUIDE_DES_ERREURS.md`
2. Vérifier `HUSKY_SETUP.md`
3. Lire les logs d'erreur dans le terminal

---

**Prêt à coder !** 🚀

*Application disponible sur http://localhost:3000*
