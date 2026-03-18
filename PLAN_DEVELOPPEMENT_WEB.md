# Plan de Développement Web - AfriMobilis

> Document complémentaire au Cahier des Charges  
> Date : Mars 2026

---

## 🗺️ Architecture du Site Web

```
apps/web/                    ← SEUL dossier déployé sur Vercel
├── marketing/               ← Site public (SEO, acquisition clients)
│   ├── index.html          ✅ Landing page (FAIT)
│   ├── contact.html        🆕 Page contact détaillée
│   ├── a-propos.html       🆕 Qui sommes-nous
│   ├── tarifs.html         🆕 Page tarifs complète
│   ├── temoignages.html    🆕 Témoignages clients
│   ├── blog/
│   │   ├── index.html      🆕 Liste des articles
│   │   └── articles/       🆕 Articles de blog (SEO)
│   └── pays/
│       ├── ci.html         🆕 Page Côte d'Ivoire
│       ├── ghana.html      🆕 Page Ghana
│       └── senegal.html    🆕 Page Sénégal
│
├── app/                     ← Application métier (connexion requise)
│   ├── index.html          ✅ Login (FAIT)
│   ├── dashboard.html      🆕 Dashboard principal
│   ├── vehicules.html      🆕 Gestion véhicules
│   ├── chauffeurs.html     🆕 Gestion chauffeurs
│   ├── versements.html     🆕 Suivi versements
│   ├── pannes.html         🆕 Déclaration pannes
│   ├── documents.html      🆕 Conformité documentaire
│   ├── sanctions.html      🆕 Gestion sanctions
│   ├── profil.html         🆕 Profil utilisateur
│   └── admin/              🆕 Section administration
│       ├── syndicats.html
│       ├── utilisateurs.html
│       └── parametres.html
│
└── vercel.json             ✅ Configuration des routes
```

---

## 📅 Phases de Développement

### PHASE 1 : Fondations (Semaines 1-2) ✅ EN COURS

| Semaine | Tâche | Priorité | Statut |
|---------|-------|----------|--------|
| S1 | Landing page + Déploiement Vercel | Haute | ✅ FAIT |
| S1 | Intégration Supabase Auth | Haute | 🔄 À FAIRE |
| S2 | Dashboard basique | Haute | 🔄 À FAIRE |
| S2 | CRUD Véhicules | Haute | 🔄 À FAIRE |

**Livrable :** Site en ligne avec connexion fonctionnelle

---

### PHASE 2 : Core Features (Semaines 3-6)

| Module | Fonctionnalités | Rôles | Priorité |
|--------|-----------------|-------|----------|
| **Véhicules** | Ajout, édition, suppression, recherche par plaque | Admin, Propriétaire | Haute |
| **Chauffeurs** | CRUD, affectation véhicule | Admin, Propriétaire | Haute |
| **Versements** | Saisie, suivi, alertes retard | Tous | Haute |
| **Documents** | Upload, validation, alertes expiration | Tous | Haute |
| **Pannes** | Déclaration, suivi, historique | Tous | Moyenne |
| **Sanctions** | Création, validation, niveaux | Admin | Moyenne |

**Livrable :** Application métier complète pour syndicats

---

### PHASE 3 : Marketing & SEO (Semaines 7-8)

| Page | Objectif SEO | Mots-clés |
|------|--------------|-----------|
| Blog (3 articles) | Authority | "digitalisation taxi afrique" |
| Page Côte d'Ivoire | Local SEO | "gestion taxi côte d'ivoire" |
| Témoignages | Preuve sociale | - |
| Contact détaillé | Conversion | - |

**Livrable :** Visibilité Google + Acquisition clients

---

### PHASE 4 : Expansion (Semaines 9-12)

| Pays | Adaptations | Priorité |
|------|-------------|----------|
| Ghana | Anglais, Cedi, documents locaux | Haute |
| Sénégal | Français, CFA Ouest | Moyenne |
| Bénin | Français, réseaux locaux | Moyenne |

**Livrable :** Multi-pays opérationnel

---

## 📋 Tableau des Pages

### Marketing (Public - Pas de connexion)

| Page | URL | Objectif | Statut |
|------|-----|----------|--------|
| Accueil | `/` | Conversion visiteurs | ✅ |
| Contact | `/contact.html` | Capturer leads | 🆕 |
| À propos | `/a-propos.html` | Crédibilité | 🆕 |
| Tarifs | `/tarifs.html` | Conversion | 🆕 |
| Témoignages | `/temoignages.html` | Preuve sociale | 🆕 |
| Blog liste | `/blog/index.html` | SEO | 🆕 |
| Blog article | `/blog/article-X.html` | SEO | 🆕 |
| Pays CI | `/pays/ci.html` | SEO local | 🆕 |

### Application (Privée - Connexion requise)

| Page | URL | Rôles | Statut |
|------|-----|-------|--------|
| Login | `/app/` | Tous | ✅ |
| Dashboard | `/app/dashboard.html` | Tous | 🆕 |
| Véhicules | `/app/vehicules.html` | Admin, Propriétaire | 🆕 |
| Chauffeurs | `/app/chauffeurs.html` | Admin, Propriétaire | 🆕 |
| Versements | `/app/versements.html` | Tous | 🆕 |
| Pannes | `/app/pannes.html` | Tous | 🆕 |
| Documents | `/app/documents.html` | Tous | 🆕 |
| Sanctions | `/app/sanctions.html` | Admin | 🆕 |
| Profil | `/app/profil.html` | Tous | 🆕 |
| Admin | `/app/admin/*.html` | Super Admin | 🆕 |

---

## 🔧 Workflow de Développement

### Pour le Marketing (HTML simple)

```bash
# 1. Créer/modifier dans apps/web/marketing/
# 2. Commit + Push
git add -A
git commit -m "feat: ajout page X"
git push origin main
# 3. Vercel déploie auto (10 secondes)
```

### Pour l'Application (Vite + React)

```bash
# 1. Modifier dans apps/web-vite/src/
# 2. Build
cd apps/web-vite
npm run build
# 3. Copier les fichiers générés (dist/) vers apps/web/app/
# 4. Commit + Push
git add -A
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
# 5. Vercel déploie auto
```

---

## 🌐 URLs de Déploiement

| Environnement | Marketing | Application |
|---------------|-----------|-------------|
| **Production** | `https://afrimobilis.vercel.app/` | `https://afrimobilis.vercel.app/app/` |
| **Local** | `http://localhost:3000/` | `http://localhost:5173/` |

---

## ✅ Checklist Prochaines Tâches

### Immédiat (Cette semaine)
- [ ] Configurer Supabase Auth
- [ ] Créer page Dashboard
- [ ] Créer page Véhicules (liste)

### Court terme (Semaines 2-4)
- [ ] CRUD complet Véhicules
- [ ] Gestion Chauffeurs
- [ ] Module Versements

### Moyen terme (Semaines 5-8)
- [ ] Module Documents/Conformité
- [ ] Page Contact marketing
- [ ] 3 articles de blog

---

*Document créé le 18 Mars 2026*
