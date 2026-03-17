# 🐙 Configuration GitHub + Vercel

## Étape 1 : Créer un dépôt GitHub

1. Allez sur https://github.com/new
2. Nom du dépôt : `AfriMobilis`
3. Visibilité : **Private** (recommandé) ou Public
4. Ne PAS initialiser avec README (on a déjà tout)
5. Cliquez **Create repository**

## Étape 2 : Connecter le projet local à GitHub

### Option A : HTTPS (plus simple)
```bash
# Ajouter le remote
git remote add origin https://github.com/VOTRE_USERNAME/AfriMobilis.git

# Pousser tout le projet
git push -u origin master
```

### Option B : SSH (plus sécurisé)
```bash
# Générer une clé SSH (si pas déjà fait)
ssh-keygen -t ed25519 -C "votre@email.com"

# Ajouter la clé à GitHub (Settings > SSH Keys)
# Puis:
git remote add origin git@github.com:VOTRE_USERNAME/AfriMobilis.git
git push -u origin master
```

## Étape 3 : Connecter GitHub à Vercel

1. Allez sur https://vercel.com/new
2. Cliquez **Import Git Repository**
3. Sélectionnez **AfriMobilis**
4. Configurez :
   - **Framework Preset** : Next.js
   - **Root Directory** : `apps/web`
   - **Build Command** : `npm run build`
   - **Output Directory** : `.next`

5. Ajoutez les variables d'environnement :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

6. Cliquez **Deploy**

## ✅ Avantages de cette méthode

- **Déploiement automatique** à chaque push sur master
- **Preview deployments** pour chaque Pull Request
- **Rollback facile** vers n'importe quel commit
- **Collaboration** facilitée avec l'équipe

## 🔧 Configuration API (Railway/Render)

Pour l'API backend, utilisez Railway ou Render :

### Railway
1. https://railway.app/new
2. Connectez votre repo GitHub
3. Sélectionnez le dossier `apps/api`
4. Variables d'environnement :
   ```
   SUPABASE_URL=
   SUPABASE_SERVICE_KEY=
   PORT=4000
   ```

### Render
1. https://dashboard.render.com/new/web-service
2. Connectez GitHub
3. Root Directory : `apps/api`
4. Build Command : `npm install && npm run build`
5. Start Command : `npm start`

## 📋 Récapitulatif Architecture Déployée

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │────▶│   Railway/Render│────▶│   Supabase      │
│   (Frontend)    │     │   (API)         │     │   (Database)    │
│   Next.js       │     │   Express.js    │     │   PostgreSQL    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        └───────────────────────────────────────────────┘
                    GitHub Repository
```

## 🚀 Workflow de développement

1. **Développement local**
   ```bash
   npm run dev
   ```

2. **Commit et push**
   ```bash
   git add .
   git commit -m "feat: nouvelle fonctionnalité"
   git push origin master
   ```

3. **Déploiement automatique**
   - Vercel déploie automatiquement
   - URL de preview générée
   - Production mise à jour si push sur master

## 🔒 Sécurité

- ✅ Ne jamais committer `.env`
- ✅ Utiliser les variables d'environnement Vercel/Railway
- ✅ Clés Supabase stockées côté serveur uniquement
- ✅ Repository privé recommandé

## 📚 Liens utiles

- [GitHub](https://github.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Railway](https://railway.app)
- [Supabase](https://app.supabase.com)
