# 🚀 Guide de Déploiement - AfriMobilis

> **Version** : 1.0.0 MVP  
> **Date** : Mars 2026

---

## 📋 Prérequis

### Environnement
- Node.js 18+
- npm 9.8.1+
- Git

### Services Externes
- Compte Supabase (Base de données + Auth)
- Compte Vercel (Hébergement web)
- (Optionnel) Compte Expo (Application mobile)

---

## 🔧 Configuration

### 1. Variables d'Environnement

Créer les fichiers `.env` :

**apps/web/.env.local** :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

**apps/api/.env** :
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_KEY=votre-cle-service-role
REDIS_URL=redis://localhost:6379
PORT=4000
```

### 2. Base de Données

Exécuter les migrations dans l'ordre :
```bash
# Via Supabase SQL Editor ou psql
\i packages/database/migrations/001_initial_schema.sql
\i packages/database/migrations/002_functions_triggers.sql
\i packages/database/migrations/003_rls_policies.sql
# ... etc
```

### 3. Installation

```bash
# Installation des dépendances
npm install

# Build du projet
npm run build
```

---

## 🌐 Déploiement Web (Vercel)

### Étape 1 : Connexion
```bash
npm i -g vercel
vercel login
```

### Étape 2 : Déploiement
```bash
# Depuis la racine du projet
vercel --prod
```

### Étape 3 : Variables d'environnement Vercel
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 📱 Déploiement Mobile (Expo)

### Prérequis
```bash
cd apps/mobile
npm install
```

### Build iOS/Android
```bash
# Démarrer le serveur de développement
npx expo start

# Build pour iOS
npx expo build:ios

# Build pour Android
npx expo build:android
```

### Publication sur les stores
```bash
# iOS - App Store
npx expo upload:ios

# Android - Play Store
npx expo upload:android
```

---

## ✅ Vérification Post-Déploiement

### 1. Page de Test
Accéder à : `https://votre-app.vercel.app/admin/test`

Vérifier que tous les tests passent :
- ✅ Connexion Supabase
- ✅ Tables accessibles
- ✅ Authentification

### 2. Fonctionnalités Critiques

Testez manuellement :
- [ ] Connexion/Inscription
- [ ] Création de chauffeur par propriétaire
- [ ] Upload document avec OCR
- [ ] Paiement Mobile Money (mode test)
- [ ] Validation par lot (Chef de Ligne)

### 3. Responsive

Vérifier sur :
- [ ] Desktop (Chrome, Firefox)
- [ ] Tablette (iPad)
- [ ] Mobile (iPhone, Android)

---

## 🔒 Sécurité

### À vérifier avant production :

1. **RLS Policies** : Toutes les tables ont des policies
2. **CORS** : Configuration correcte
3. **HTTPS** : Forcé sur toutes les pages
4. **Env vars** : Aucune clé sensible en clair

### Commande de vérification :
```bash
# Vérifier les variables d'environnement
npm run check-env

# Linter
npm run lint

# Tests (si configurés)
npm run test
```

---

## 📊 Monitoring

### Logs
- Vercel Dashboard : https://vercel.com/dashboard
- Supabase Logs : https://app.supabase.io/project/_/logs

### Métriques
- Performance Web Vitals
- Erreurs Sentry (si configuré)
- Analytics Vercel

---

## 🔄 Mises à Jour

### Procédure
```bash
# 1. Backup
npm run backup

# 2. Pull des changements
git pull origin main

# 3. Installation
npm install

# 4. Build
npm run build

# 5. Déploiement
vercel --prod
```

### Rollback
```bash
# Revenir à la version précédente
vercel rollback
```

---

## 🆘 Support

En cas de problème :
1. Vérifier les logs Vercel
2. Consulter la page `/admin/test`
3. Vérifier le statut Supabase
4. Contacter l'équipe technique

---

## 📞 Contacts

- **Équipe technique** : tech@afrimobilis.com
- **Support** : support@afrimobilis.com

---

**Dernière mise à jour** : Mars 2026
