# 🚀 Déploiement Vercel - AfriMobilis

## ✅ Étape 1 : GitHub (FAIT)
- Repo créé : https://github.com/franckdanielcape/AfriMobilis
- Code poussé : ✅

## 🔧 Étape 2 : Configurer Vercel

### 2.1 Créer compte Vercel (si pas déjà fait)
1. Allez sur https://vercel.com/signup
2. Choisissez **Continue with GitHub**
3. Autorisez Vercel à accéder à vos repos

### 2.2 Importer le projet
1. Allez sur https://vercel.com/new
2. Cliquez sur **Import Git Repository**
3. Recherchez **AfriMobilis**
4. Cliquez **Import**

### 2.3 Configuration du projet

| Paramètre | Valeur |
|-----------|--------|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

### 2.4 Variables d'Environnement

Cliquez sur **Environment Variables** et ajoutez :

```
NEXT_PUBLIC_SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTAyMzYsImV4cCI6MjA4NzcyNjIzNn0.-7JMEiP-iNDQs5U1TyLar7TgDb6HhVZkJwVBAS-qFvo
```

⚠️ **Important** : Ces variables doivent être ajoutées dans l'interface Vercel, pas dans le code !

### 2.5 Déployer
Cliquez sur **Deploy** et attendez ~2-3 minutes.

## 🎉 Résultat

Votre site sera disponible sur :
- `https://afrimobilis.vercel.app` (ou nom similaire)
- Un domaine personnalisé peut être configuré

## 🔄 Déploiements Futurs

À chaque `git push` sur master :
```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin master
```

Vercel déploie automatiquement !

## 🔧 Configuration API (Backend)

Pour l'API, utilisez Railway :

1. https://railway.app/new
2. Connectez GitHub
3. Sélectionnez le dossier `apps/api`
4. Variables d'environnement :
   ```
   SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   PORT=4000
   ```

## 📋 Récapitulatif URLs

| Service | URL Locale | URL Production |
|---------|-----------|----------------|
| Frontend | http://localhost:3000 | https://afrimobilis.vercel.app |
| API | http://localhost:4000 | https://afrimobilis-api.railway.app |
| GitHub | - | https://github.com/franckdanielcape/AfriMobilis |

## 🆘 Support

En cas de problème :
1. Vérifier les logs sur Vercel Dashboard
2. Vérifier les variables d'environnement
3. Vérifier que le build fonctionne en local : `npm run build`
