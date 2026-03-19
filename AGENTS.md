# AGENTS.md - AfriMobilis

> Fichier de référence pour les agents AI travaillant sur le projet AfriMobilis
> Ce fichier doit être lu en priorité avant toute action sur le projet

---

## 🎯 Vue d'ensemble du projet

**AfriMobilis** est une plateforme de gestion centralisée pour les taxis communaux de Grand-Bassam, Côte d'Ivoire.

### Objectifs
- Structurer la gestion syndicale (parc, contrôle, sanctions, conformité)
- Donner aux propriétaires un pilotage réel (rentabilité, versements, pannes)
- Offrir aux chauffeurs un suivi clair (versements, incidents, notifications)
- Permettre une montée en charge : d'abord Grand-Bassam, puis expansion Afrique

---

## 🏗️ Architecture technique

### Stack actuel (MIGRÉ vers Vite)
```
Frontend: Vite + React 18 + TypeScript + Tailwind CSS
Backend: Express.js + TypeScript
Database: Supabase (PostgreSQL)
Auth: Supabase Auth
Mobile: React Native + Expo (prévu)
Deployment: GitHub Pages / Netlify
```

### Structure des dossiers
```
AfriMobilis/
├── apps/
│   ├── web/                    # ← DÉPLOIEMENT (fichiers statiques)
│   │   ├── marketing/          # Landing page (SEO)
│   │   └── app/                # Application buildée (Vite)
│   ├── web-vite/               # ← DÉVELOPPEMENT (source)
│   │   ├── src/
│   │   │   ├── components/     # UI + OCR
│   │   │   ├── hooks/          # useAuth, useVehicules
│   │   │   ├── lib/            # Supabase client
│   │   │   ├── pages/          # Login, Dashboard, Vehicules
│   │   │   └── types/          # TypeScript types
│   │   └── package.json
│   ├── api/                    # Backend Express
│   └── mobile/                 # React Native (futur)
├── .github/workflows/          # CI/CD GitHub Actions
└── docs/                       # Documentation
```

---

## ⚠️ RÈGLES IMPORTANTES

### 1. Context Window Management
```
COMPACT_THRESHOLD = 80%
Quand le contexte atteint 80%, faites:
- Résumé des actions réalisées
- Points clés à retenir
- Prochaines étapes prioritaires
```

### 2. Déploiement
- **NE PAS utiliser Vercel** (problèmes avec Turborepo)
- **Utiliser GitHub Pages** (si dépôt public) ou **Netlify**
- Root directory pour déploiement: `apps/web/`
- Pas de build command (fichiers statiques)

### 3. Variables d'environnement
```
VITE_SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**IMPORTANT**: Utiliser `VITE_` prefix, pas `NEXT_PUBLIC_`

### 4. Workflow de développement
```bash
# 1. Modifier dans apps/web-vite/src/

# 2. Build
cd apps/web-vite
npm run build

# 3. Copier vers apps/web/app/
# (les fichiers dist/ → app/)

# 4. Commit + Push
git add -A
git commit -m "feat: ..."
git push origin main

# 5. Déploiement automatique
```

---

## 🎨 Composants clés migrés

### UI Components (apps/web-vite/src/components/ui/)
- **Button.tsx** - Bouton avec variants (primary, secondary, danger, ghost, success)
- **Input.tsx** - Input avec label, error, helperText

### Hooks (apps/web-vite/src/hooks/)
- **useAuth.ts** - Authentification Supabase complète
- **useVehicules.ts** - Gestion des véhicules

### Lib (apps/web-vite/src/lib/)
- **supabase.ts** - Client Supabase + helpers CRUD

### Types (apps/web-vite/src/types/)
- Vehicule, Chauffeur, Affectation, Versement, Panne, Document, UserProfile

### OCR
- **VisiteTechniqueOCR.tsx** - Lecture carte visite technique avec Tesseract.js

---

## 👥 Hiérarchie des rôles (CDC)

```
1. Super Admin (global)
2. Super Chef de Ligne (par ville)
3. Chef de Ligne (admin syndicat)
4. Agent terrain
5. Propriétaire
6. Gérant
7. Chauffeur
8. Passager
```

---

## 📋 Fonctionnalités MVP

### ✅ Déjà implémentées
- [x] Landing page (marketing)
- [x] Structure authentification
- [x] Dashboard basique
- [x] Page Véhicules (interface)
- [x] Composants UI (Button, Input)
- [x] OCR Visite Technique
- [x] Hooks useAuth, useVehicules

### 🔄 À compléter
- [ ] Connexion Supabase (véritable auth)
- [ ] CRUD Véhicules (connecté à la DB)
- [ ] Gestion Chauffeurs
- [ ] Suivi Versements
- [ ] Conformité documentaire
- [ ] Notifications

---

## 🔧 Commandes utiles

```bash
# Développement
cd apps/web-vite
npm run dev          # http://localhost:5173

# Build
cd apps/web-vite
npm run build        # Génère dist/

# Copier vers déploiement
Copy-Item -Path apps/web-vite/dist/* -Destination apps/web/app/ -Recurse -Force
```

---

## 📚 Documentation importante

- `PLAN_DEVELOPPEMENT_WEB.md` - Plan complet
- `ANALYSE_PROJET_COMPARATIF.md` - Analyse attentes vs réalisation
- `GUIDE_DEPLOIEMENT_GITHUB_PAGES.md` - Déploiement
- `cahier_des_charges.md` - Spécifications fonctionnelles

---

## ⚡ Points critiques à retenir

1. **Toujours builder avant de commit** (apps/web-vite → apps/web/app)
2. **Utiliser VITE_ prefix** pour les variables d'env
3. **Pas de Vercel** (utiliser GitHub Pages ou Netlify)
4. **Contexte à 80%** = faire un résumé compact
5. **Commit 4167234** contient la version Next.js complète (référence)

---

## 🎯 Prochaines étapes prioritaires

1. Connecter authentification Supabase
2. Finaliser CRUD Véhicules avec données réelles
3. Ajouter page Chauffeurs
4. Configurer GitHub Pages (si dépôt public)

---

*Dernière mise à jour: 18 Mars 2026*
*Version: Migration Vite complète*
