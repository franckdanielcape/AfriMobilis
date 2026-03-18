# 📋 État Actuel du Projet AfriMobilis

> Date : 18 Mars 2026

---

## 🗂️ Structure du Repository Git

### Branches Importantes
- `main` - Branche actuelle (Vite simplifié)
- `4167234` (tag v1.0.0 MVP) - Version Next.js complète

---

## ✅ Ce qui existe sur Git (Historique)

### Version Complète Next.js (Commit 4167234)
**Cette version contient TOUT le projet original :**

```
apps/
├── web/ (Next.js 14)          ← VERSION COMPLÈTE
│   ├── src/
│   │   ├── app/               # App Router Next.js
│   │   │   ├── dashboard/
│   │   │   │   ├── admin/     # Module Super Admin
│   │   │   │   ├── syndicat/  # Module Chef de Ligne
│   │   │   │   ├── proprietaire/  # Module Propriétaire
│   │   │   │   ├── chauffeur/     # Module Chauffeur
│   │   │   │   └── super-chef/    # Module Super Chef
│   │   │   ├── api/           # API Routes Next.js
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── components/
│   │   │   ├── OCR/
│   │   │   │   └── VisiteTechniqueOCR.tsx  # OCR complet
│   │   │   └── ui/
│   │   └── lib/
│   ├── e2e/                   # Tests Playwright
│   └── next.config.js
│
├── api/ (Express)             ← BACKEND COMPLET
│   ├── src/
│   │   ├── application/       # Use Cases
│   │   ├── domain/            # Entités
│   │   ├── infrastructure/
│   │   │   ├── services/
│   │   │   │   ├── EmailService.ts
│   │   │   │   ├── WhatsAppService.ts
│   │   │   │   ├── MobileMoneyService.ts
│   │   │   │   └── cache/RedisCache.ts
│   │   │   └── repositories/
│   │   ├── interface/         # Routes API
│   │   └── jobs/              # Tâches cron
│   └── __tests__/             # Tests Jest
│
└── mobile/ (React Native)     ← APP MOBILE
    └── src/
        ├── hooks/
        └── services/
```

### Fonctionnalités dans la version 4167234

| Module | Fonctionnalités | Statut |
|--------|-----------------|--------|
| **Auth** | Login, Register, 8 rôles | ✅ Complet |
| **Admin** | Gestion pays, villes, syndicats | ✅ Complet |
| **Syndicat** | Véhicules, chauffeurs, conformité | ✅ Complet |
| **OCR** | Lecture visite technique | ✅ Complet |
| **Mobile Money** | Orange, MTN, Wave, Moov | ✅ Complet |
| **WhatsApp** | Notifications automatiques | ✅ Complet |
| **Propriétaire** | Dashboard, versements, pannes | ✅ Complet |
| **Chauffeur** | Vue versements, déclaration pannes | ✅ Complet |
| **Passager** | Tickets, objets perdus | ✅ Complet |
| **Tests** | 15 tests unitaires | ✅ Passent |

---

## 🔧 Ce qui existe sur main (Actuel)

### Version Simplifiée Vite

```
apps/
├── web/                       ← FUSIONNÉ (Marketing + App)
│   ├── marketing/
│   │   └── index.html         # Landing page simple
│   └── app/
│       └── index.html         # Dashboard basique
│
├── web-vite/                  ← APP VITE (en développement)
│   ├── src/
│   │   └── pages/
│   │       ├── Login.tsx      # Interface seule
│   │       ├── Register.tsx   # Interface seule
│   │       └── Dashboard.tsx  # Interface seule
│   └── dist/                  # Build statique
│
├── api/                       ← BACKEND (structure)
│   └── src/
│       └── index.ts           # Serveur Express basique
│
└── marketing/                 ← ASTRO (abandonné)
    └── src/
```

---

## ⚠️ Problème Identifié

### Situation Actuelle
1. **Version complète existe** dans l'historique Git (4167234)
2. **Version actuelle (main)** est une simplification Vite
3. **Les deux versions sont incompatibles** (Next.js vs Vite)

### Pourquoi la simplification ?
- Build Next.js bloquait sur Vercel
- Migration vers Vite pour déploiement rapide
- Mais perte des fonctionnalités avancées

---

## 💡 Options pour Continuer

### Option 1 : Restaurer la Version Complète Next.js
```bash
# Revenir au commit complet
git checkout 4167234

# Ou créer une branche
git checkout -b version-complete 4167234

# Puis résoudre les problèmes de build Vercel
```
**Avantages :** Tout est déjà développé
**Inconvénients :** Build Vercel à réparer

### Option 2 : Migrer Fonctionnalités vers Vite
```bash
# Rester sur main
# Copier les composants Next.js vers Vite
# Adapter le code (Next.js → React standard)
```
**Avantages :** Build rapide et stable
**Inconvénients :** Travail de migration manuel

### Option 3 : Hybride - API Next.js + Frontend Vite
```bash
# Garder les API Routes Next.js
# Utiliser Vite pour le frontend
# Les deux communiquent via HTTP
```
**Avantages :** Meilleur des deux mondes
**Inconvénients :** Architecture complexe

---

## 🎯 Ma Recommandation

**Option 2 - Migrer vers Vite progressivement**

Pourquoi :
1. Build Vercel fonctionne immédiatement
2. Code plus simple et maintenable
3. On garde le contrôle sur ce qu'on migre
4. Pas de dépendance à Next.js

### Plan de Migration

```
Étape 1 : Récupérer les composants clés de 4167234
Étape 2 : Les adapter pour Vite (React Router)
Étape 3 : Connecter au backend Express existant
Étape 4 : Tester et déployer
```

---

## 📁 Fichiers Clés à Récupérer du Commit 4167234

### Composants UI (apps/web/src/components/)
- `OCR/VisiteTechniqueOCR.tsx` - OCR complet
- `ui/Button/Button.tsx` - Design system
- `ui/Input/Input.tsx` - Design system

### Pages Dashboard (apps/web/src/app/dashboard/)
- `admin/*.tsx` - Module admin
- `syndicat/*.tsx` - Module syndicat
- `proprietaire/*.tsx` - Module propriétaire

### Services Backend (apps/api/src/infrastructure/services/)
- `EmailService.ts`
- `WhatsAppService.ts`
- `MobileMoneyService.ts`

### Tests (apps/api/src/__tests__/)
- `unit/*.test.ts` - Tests métier

---

## 🚀 Prochaine Action

**Quelle option choisissez-vous ?**

1. **Restaurer Next.js complet** (commit 4167234) et réparer le build
2. **Migrer progressivement** vers Vite (recommandé)
3. **Architecture hybride** (Next.js API + Vite frontend)

Répondez par le numéro (1, 2 ou 3) et je procède immédiatement.
