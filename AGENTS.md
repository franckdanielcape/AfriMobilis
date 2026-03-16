# AGENTS.md - AfriMobilis

> Ce fichier est destiné aux agents AI travaillant sur le projet AfriMobilis.
> Il contient les informations essentielles pour comprendre l'architecture, 
> les conventions et les processus de développement.

---

## Vue d'ensemble du projet

AfriMobilis est une plateforme de gestion centralisée pour les taxis communaux de Grand-Bassam, Côte d'Ivoire. Elle vise à structurer la gestion syndicale, donner aux propriétaires un pilotage réel de leur flotte, offrir aux chauffeurs un suivi clair de leurs versements, et fournir aux passagers un canal officiel pour réclamations et objets perdus.

### Architecture globale

Le projet utilise une architecture **monorepo** basée sur **Turborepo** avec npm workspaces :

```
AfriMobilis/
├── apps/
│   ├── web/           # Frontend Next.js (PWA)
│   ├── api/           # Backend Express.js (REST API)
│   └── mobile/        # Application React Native Expo
├── packages/
│   ├── database/      # Migrations SQL Supabase
│   ├── shared-types/  # Types TypeScript partagés (vide actuellement)
│   └── ui/            # Composants UI partagés (vide actuellement)
└── docker-compose.yml # Services locaux (Postgres, Redis)
```

### Stack technologique

| Composant | Technologie |
|-----------|-------------|
| **Frontend Web** | Next.js 14, React 18, TypeScript |
| **Backend API** | Express.js, TypeScript, Node.js 18+ |
| **Mobile** | React Native, Expo SDK 50 |
| **Base de données** | PostgreSQL (Supabase) |
| **Authentification** | Supabase Auth |
| **State Management** | Zustand |
| **Stockage offline** | IndexedDB (via `idb`) |
| **Ordonnancement** | node-cron |
| **Build** | Turborepo |
| **Containerisation** | Docker, Docker Compose |

---

## Prise en main

### Prérequis

- Node.js 18+
- npm 9.8.1+ (défini dans `packageManager`)
- Docker & Docker Compose (pour la base de données locale)
- Compte Supabase (pour l'authentification et la base de données)

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
# Copier .env.example vers .env dans chaque app et remplir les valeurs Supabase
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 3. Démarrer les services locaux (Postgres, Redis)
docker-compose up -d

# 4. Démarrer le monorepo en mode développement
npm run dev
```

### Variables d'environnement requises

**apps/web/.env.local :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

**apps/api/.env :**
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_KEY=votre-cle-service-role  # Attention : bypass RLS!
REDIS_URL=redis://localhost:6379
PORT=4000
```

---

## Structure du code

### API Backend (`apps/api/`)

Architecture **Clean Architecture / Domain-Driven Design** :

```
src/
├── domain/entities/           # Modèles métier (Vehicle, Ticket, etc.)
├── application/useCases/      # Logique métier par domaine
├── infrastructure/
│   ├── repositories/          # Accès données (Supabase)
│   └── config/supabase.ts     # Client Supabase (service role)
├── interface/
│   ├── controllers/           # Gestionnaire de requêtes
│   └── routes/                # Définition des routes API
└── jobs/index.ts              # Tâches planifiées (cron)
```

**Routes API disponibles :**
- `/api/vehicles` - Gestion des véhicules
- `/api/syndicats` - Gestion des syndicats
- `/api/versements` - Suivi des versements
- `/api/pannes` - Déclaration de pannes
- `/api/tickets` - Tickets support passagers
- `/api/objets` - Objets perdus/retrouvés
- `/api/documents` - Conformité documentaire
- `/api/notifications` - Système de notifications
- `/api/admin` - Administration
- `/api/equipe` - Gestion des équipes

### Frontend Web (`apps/web/`)

Architecture **Next.js App Router** avec CSS Modules :

```
src/
├── app/                       # Routes Next.js (App Router)
│   ├── page.tsx              # Page d'accueil
│   ├── login/                # Authentification
│   ├── register/             # Inscription
│   ├── dashboard/            # Tableaux de bord par rôle
│   │   ├── admin/            # Vue Super Admin
│   │   ├── chauffeurs/       # Vue Chauffeur
│   │   └── ...
│   └── layout.tsx            # Layout racine
├── components/
│   ├── ui/                   # Composants réutilisables
│   ├── admin/                # Composants admin
│   └── demo/                 # Composants démo
├── stores/
│   └── useOfflineStore.ts    # Gestion offline (Zustand + IndexedDB)
├── lib/
│   └── geo.ts                # Données géographiques (villes CI)
└── utils/supabase/
    └── client.ts             # Client Supabase (anon key)
```

### Base de données (`packages/database/`)

Migrations SQL numérotées à exécuter dans l'ordre :

1. `001_initial_schema.sql` - Tables principales et types ENUM
2. `002_functions_triggers.sql` - Fonctions et triggers (timestamps, audit)
3. `003_rls_policies.sql` - Row Level Security policies
4. `004_hierarchie_roles.sql` - Gestion de la hiérarchie des rôles
5. `005_marketplace.sql` - Tables marketplace
6. `006_add_annee_vehicules.sql` - Colonne année pour véhicules

**Tables principales :**
- `syndicats` - Syndicats de taxis
- `profiles` - Profils utilisateurs (liés à auth.users)
- `vehicules` - Véhicules avec statut de conformité
- `affectations` - Liaison chauffeurs ↔ véhicules
- `wallets` - Portefeuilles électroniques
- `transactions` - Historique des transactions
- `versements` - Versements des chauffeurs
- `pannes` - Déclarations de pannes
- `tickets` - Tickets support passagers
- `objets` - Objets perdus/retrouvés
- `sanctions` - Sanctions et amendes
- `audit_logs` - Logs d'audit (conformité BCEAO)

### Application Mobile (`apps/mobile/`)

Application React Native avec Expo pour les chauffeurs et agents terrain :

```
mobile/
├── App.tsx                   # Point d'entrée
├── app.json                  # Configuration Expo
└── package.json
```

**Fonctionnalités prévues :**
- Scan QR codes (expo-camera)
- Stockage sécurisé (expo-secure-store)
- Navigation native (@react-navigation)

---

## Commandes disponibles

### Niveau racine (monorepo)

```bash
npm run dev      # Démarrer tous les apps en mode dev
npm run build    # Builder tous les apps
npm run lint     # Linter tous les apps
npm run clean    # Nettoyer les builds
```

### App Web

```bash
cd apps/web
npm run dev      # Next.js dev server (port 3000)
npm run build    # Build de production
npm run start    # Démarrer le build
npm run lint     # ESLint
```

### App API

```bash
cd apps/api
npm run dev      # Nodemon avec hot reload (port 4000)
npm run build    # Compilation TypeScript
npm run start    # Démarrer le build
npm run test     # Tests Jest
npm run lint     # ESLint
```

### App Mobile

```bash
cd apps/mobile
npm run start    # Démarrer Expo
npm run android  # Démarrer sur Android
npm run ios      # Démarrer sur iOS
npm run web      # Démarrer en mode web
```

---

## Conventions de code

### Langue

- **Code** : Anglais (variables, fonctions, classes)
- **Commentaires** : Français
- **Documentation** : Français
- **Interface utilisateur** : Français

### Style TypeScript

- **Strict mode** activé dans tous les projets
- Utiliser des **types explicites** pour les paramètres de fonction
- Préférer les **interfaces** pour les objets métier
- Utiliser **enum** ou **types unions** pour les statuts

### Nommage

```typescript
// Types/Interfaces : PascalCase
interface VehicleProps { }
type UserRole = 'admin' | 'user';

// Variables/Fonctions : camelCase
const vehicleCount = 10;
function getVehicleById() { }

// Constantes : UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Fichiers : camelCase ou PascalCase selon le contenu
// vehicleController.ts, VehicleCard.tsx
```

### Architecture API (Clean Architecture)

```typescript
// 1. Entité (domain/entities/)
export interface Vehicle {
    id: string;
    immatriculation: string;
    // ...
}

// 2. Repository (infrastructure/repositories/)
export class VehicleRepository {
    async findById(id: string): Promise<Vehicle | null> { }
}

// 3. Use Case (application/useCases/)
export class VehicleUseCases {
    constructor(private repo: VehicleRepository) { }
    async registerVehicle(data: VehicleDTO) { }
}

// 4. Controller (interface/controllers/)
export class VehicleController {
    async create(req: Request, res: Response) { }
}
```

---

## Gestion des rôles et permissions

### Hiérarchie des rôles

1. **super_admin** - Accès complet à la plateforme
2. **admin_syndicat** - Gestion complète de son syndicat
3. **sous_admin** - Délégation selon permissions
4. **chef_ligne** - Gestion des véhicules/chauffeurs de sa ligne
5. **agent_terrain** - Contrôles et incidents
6. **proprietaire** - Sa flotte et ses chauffeurs
7. **gerant** - Même droits que propriétaire (véhicules gérés)
8. **chauffeur** - Ses versements, pannes, tickets
9. **passager** - Tickets et objets perdus

### Vérification des permissions

Les permissions sont gérées via :
- **RLS (Row Level Security)** dans Supabase pour la base de données
- **Middlewares** dans l'API pour les routes protégées
- **Composants côté client** dans le web pour l'UI conditionnelle

---

## Tests

### API (Jest)

```bash
cd apps/api
npm run test
```

Configuration dans `package.json` :
- Utilise `ts-jest` pour TypeScript
- Fichiers de test : `*.test.ts`

### Web

Pas de tests configurés actuellement. Pour ajouter :
```bash
npm install -D @testing-library/react @testing-library/jest-dom jest
```

---

## Déploiement

### CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

Déclenchée sur push/PR vers `main` et `develop` :

1. Checkout du code
2. Setup Node.js 18
3. `npm ci` - Installation dépendances
4. `npm run lint` - Linting
5. `npm run build` - Build Turborepo
6. (Optionnel) Déploiement automatique

### Plateformes de déploiement

| App | Plateforme recommandée | Configuration |
|-----|------------------------|---------------|
| **web** | Vercel | `next.config.ts` prêt |
| **api** | Railway / Render | `Dockerfile` fourni |
| **database** | Supabase | Migrations SQL à appliquer |
| **mobile** | Expo EAS | `app.json` configuré |

### Docker

```bash
# Build et démarrer tous les services
docker-compose up -d

# Services démarrés :
# - PostgreSQL : port 5432
# - Redis : port 6379
# - API : port 4000
# - Web : port 3000
```

---

## Considérations de sécurité

### Supabase RLS

- Les politiques RLS sont définies dans `packages/database/migrations/003_rls_policies.sql`
- Chaque table contenant des données utilisateur a des politiques RLS
- Le backend utilise `supabaseAdmin` (service role) pour bypasser RLS quand nécessaire

### Clés API

- **Jamais** commiter les fichiers `.env` contenant les clés
- Utiliser `NEXT_PUBLIC_` uniquement pour les variables exposées au client
- La clé `SUPABASE_SERVICE_KEY` donne un accès complet - protéger absolument

### Validation des données

- Utiliser Zod pour la validation des schémas (déjà dans les dépendances Next.js)
- Valider toutes les entrées utilisateur côté serveur
- Sanitizer les données avant insertion en base

---

## Fonctionnalités clés à connaître

### Offline-First (Web)

Le store `useOfflineStore.ts` implémente :
- File d'attente de synchronisation (IndexedDB)
- Détection online/offline
- Synchronisation automatique au retour online

### Cron Jobs (API)

Planifiés dans `src/jobs/index.ts` :
- **Toutes les heures** : Vérification conformité documents
- **Tous les jours 8h** : Rappels versements
- **Tous les jours 23h** : Rapports journaliers
- **Tous les jours 1h** : Backup données

### Conformité documentaire

Statuts calculés automatiquement :
- `conforme` - Tous les documents valides
- `bientot_expire` - Expiration dans moins de 30 jours
- `non_conforme` - Document expiré ou manquant

---

## Ressources utiles

### Documentation externe

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/)
- [Expo Documentation](https://docs.expo.dev/)
- [Turborepo Documentation](https://turbo.build/repo/docs)

### Fichiers de référence

- `cahier_des_charges.md` - Spécifications fonctionnelles complètes
- `communes_ci.json` - Liste des communes de Côte d'Ivoire
- `fetch_communes.py` - Script de récupération des données géo

---

## Dépannage courant

### Erreur "Missing Supabase environment variables"

Vérifier que les fichiers `.env` sont créés et contiennent les valeurs correctes.

### Problèmes de build TypeScript

```bash
# Nettoyer et rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Migration Supabase échoue

Vérifier l'ordre d'exécution (001 → 002 → 003...). Certaines migrations dépendent des précédentes.

---

*Dernière mise à jour : Mars 2026*
