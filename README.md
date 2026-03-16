# AfriMobilis Platform

AfriMobilis est la plateforme de gestion centralisée pour les taxis communaux de Grand-Bassam, Côte d'Ivoire.
L'architecture est un monorepo basé sur Turborepo, séparant le Frontend Web, le Backend API, l'Application Mobile et les paquets de base de données.

## Architecture

- `apps/web`: React Next.js + TailwindCSS + Zustand + PWA
- `apps/api`: Node.js Express Backend REST API
- `apps/mobile`: React Native Expo app pour chauffeurs/agents
- `packages/database`: Scripts SQL Supabase de migrations, triggers et RLS

## Prérequis
- Node.js 18+
- Docker & Docker Compose
- Compte Supabase (pour DB/Auth managé)

## Installation Rapide

1. Clonez et installez les dépendances :
   ```bash
   npm install
   ```

2. Créez les fichiers `.env` dans chaque projet en vous basant sur les `.env.example` respectifs avec vos tokens Supabase.

3. Démarrez les services de développement :
   ```bash
   docker-compose up -d
   ```

4. Exécutez le monorepo :
   ```bash
   npm run dev
   ```

## Base de données
Naviguez dans `packages/database/migrations` et appliquez les fichiers SQL dans votre instance Supabase dans l'ordre de `001_` à `003_`.
Puis exécutez `seed.sql` pour les valeurs par défaut.

## Déploiement
La CI/CD est paramétrée dans `.github/workflows/ci-cd.yml` pour le build automatique à chaque push.
L'app `web` est prête pour Vercel.
L'app `api` peut être déployée via Railway/Render grâce aux Dockerfiles.
