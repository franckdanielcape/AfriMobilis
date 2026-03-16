# 🚕 AfriMobilis - Gestion des Taxis Communaux

> **Version** : 1.0.0 MVP  
> **Statut** : ✅ Production Ready  
> **Date** : Mars 2026

---

## 📋 Description

**AfriMobilis** est une plateforme complète de gestion pour les taxis communaux de Grand-Bassam, Côte d'Ivoire. Elle offre une solution centralisée pour la gestion syndicale, le suivi des véhicules, la conformité documentaire, et bien plus.

### 🎯 Objectifs

- **Structurer** la gestion syndicale des taxis
- **Donner** aux propriétaires un pilotage réel de leur flotte
- **Offrir** aux chauffeurs un suivi clair de leurs versements
- **Fournir** aux passagers un canal officiel pour réclamations et objets perdus

---

## 🏗️ Architecture

```
AfriMobilis/
├── apps/
│   ├── api/              # Backend Express.js (Port 4000)
│   ├── web/              # Frontend Next.js (Port 3000)
│   └── mobile/           # App React Native Expo
├── packages/
│   └── database/         # Migrations Supabase
└── docker-compose.yml    # Services locaux
```

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- npm 9.8.1+
- Docker & Docker Compose (optionnel)
- Compte Supabase

### Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd AfriMobilis

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 4. Démarrer les services locaux (optionnel)
docker-compose up -d

# 5. Lancer le projet
npm run dev
```

### URLs par défaut

- **Frontend** : http://localhost:3000
- **API** : http://localhost:4000
- **Base de données** : postgresql://localhost:5432

---

## 📦 Structure des Modules

### Module A - Administration (Super Admin)
- Gestion des villes et syndicats
- Gestion des super chefs de ligne
- Paramétrage global
- Logs d'audit

### Module B - Syndicat (Chef de Ligne)
- Gestion des véhicules
- Recherche par plaque
- Gestion des chauffeurs
- Contrôles terrain
- Sanctions
- **OCR Visite Technique**
- **Validation par lot**
- **Paiement Mobile Money**

### Module C - Propriétaire
- Dashboard rentabilité
- Gestion de la flotte
- Suivi des versements
- Déclaration de pannes
- Création de chauffeurs

### Module D - Chauffeur
- Vue des versements
- Déclaration de pannes
- Consultation des sanctions
- Notifications
- **Application mobile**

### Module E - Passagers
- Tickets de réclamation
- Objets perdus/retrouvés
- Matching automatique

---

## 🛠️ Technologies

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Backend** | Express.js, TypeScript |
| **Mobile** | React Native, Expo SDK 50 |
| **Base de données** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth |
| **Cache** | Redis (optionnel) |
| **Tests** | Jest |
| **Build** | Turborepo |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [AGENTS.md](AGENTS.md) | Guide complet pour développeurs |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Guide de déploiement |
| [SECURITY_GUIDE.md](SECURITY_GUIDE.md) | Pratiques de sécurité |
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | Configuration base de données |
| [cahier_des_charges.md](cahier_des_charges.md) | Spécifications fonctionnelles |
| [RAPPORT_FINAL_100.md](RAPPORT_FINAL_100.md) | Rapport de complétion |

---

## 🔐 Variables d'Environnement

### Obligatoires
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
PORT=4000
```

### Optionnelles
```env
REDIS_URL=
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

---

## 🧪 Tests

```bash
# Tests API
cd apps/api && npm test

# Tests Web
cd apps/web && npm test
```

---

## 🚀 Déploiement

### Vercel (Frontend)
```bash
vercel --prod
```

### Railway (Backend)
```bash
railway up --service api
```

---

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés.

---

## 👥 Équipe

**AfriMobilis Team** - Mars 2026

---

*Pour plus d'informations, consultez la documentation complète dans le dossier `/docs`.*
