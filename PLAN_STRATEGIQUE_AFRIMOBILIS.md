# 🌍 Plan Stratégique AfriMobilis - Nouvelle Ligne de Conduite

> Basé sur le Cahier des Charges v1.0  
> Date : Mars 2026  
> Objectif : Expansion Afrique + Architecture SEO/Marketing

---

## 📊 Résumé Exécutif

**Problème identifié :** Vite + React fonctionne pour le dashboard, mais AfriMobilis a besoin de visibilité pour conquérir l'Afrique.

**Solution :** Architecture hybride avec site marketing SEO + application métier sécurisée.

---

## 🎯 Vision Stratégique

### Mission
> Digitaliser la gestion des taxis communaux en Afrique, en commençant par Grand-Bassam (Côte d'Ivoire).

### Objectifs 2026-2027
| Période | Objectif | Cible |
|---------|----------|-------|
| **T1 2026** | MVP opérationnel | Grand-Bassam (150 véhicules) |
| **T2 2026** | Expansion Côte d'Ivoire | Abidjan, Bouaké, San-Pédro |
| **T3 2026** | Expansion Afrique de l'Ouest | Ghana, Sénégal, Bénin |
| **2027** | Panafrique | 10 pays, 10 000+ véhicules |

---

## 🏗️ Architecture Technique Recommandée

### Structure Finale

```
AfriMobilis/
│
├── 🌐 SITE MARKETING (Astro + React)
│   ├── Domaine : afrimobilis.com
│   ├── Objectif : SEO + Acquisition clients
│   ├── Hébergement : Vercel (gratuit)
│   └── Contenu :
│       ├── Landing page (conversion)
│       ├── Blog (SEO Afrique)
│       ├── Pages pays (CI, Ghana, Sénégal...)
│       ├── Tarifs
│       ├── Contact/Demo
│       └── Témoignages
│
├── 🔒 APPLICATION MÉTIER (Vite + React)
│   ├── Domaine : app.afrimobilis.com
│   ├── Objectif : Gestion quotidienne
│   ├── Hébergement : Vercel (déjà déployé)
│   └── Modules :
│       ├── Dashboard Admin/Syndicat
│       ├── Espace Propriétaire
│       ├── Espace Chauffeur
│       └── Espace Passager
│
├── 📱 APPLICATION MOBILE (React Native + Expo)
│   ├── Stores : Play Store + App Store
│   └── Objectif : Agents terrain + Chauffeurs
│
└── ⚙️ API BACKEND (Express.js)
    ├── Domaine : api.afrimobilis.com
    └── Hébergement : Railway/Render
```

---

## 📋 Phases de Développement

### PHASE 1 : Fondations (Mars-Avril 2026)
**Objectif : MVP fonctionnel à Grand-Bassam**

| Semaine | Tâche | Livrable |
|---------|-------|----------|
| S1-S2 | Finaliser dashboard Vite | App web opérationnelle |
| S3 | Connecter API Express | Backend + Frontend liés |
| S4 | Intégrer Supabase Auth | Login/register fonctionnel |
| S5-S6 | Modules syndicat | Gestion véhicules, chauffeurs |
| S7-S8 | Modules propriétaire/chauffeur | Versements, pannes, conformité |

**KPI Phase 1 :**
- [ ] 100% des fonctionnalités MVP opérationnelles
- [ ] 10 syndicats testeurs à Grand-Bassam
- [ ] Temps de chargement < 2s

---

### PHASE 2 : Marketing & SEO (Mai-Juin 2026)
**Objectif : Présence en ligne pour acquisition**

| Tâche | Détails | Framework |
|-------|---------|-----------|
| **Site marketing** | Landing page + Blog | Astro |
| **SEO Local** | "Gestion taxi Côte d'Ivoire" | Astro + Contenu |
| **Blog stratégique** | 10 articles sur la digitalisation | Astro + MDX |
| **Pages pays** | /ci /gh /sn /bj | Astro (i18n) |
| **Analytics** | Google Analytics + Hotjar | Intégration |

**Contenu Blog (SEO) :**
1. "Comment digitaliser la gestion de votre flotte de taxis"
2. "Les défis de la conformité documentaire des taxis en Afrique"
3. "Guide : Optimiser les versements de vos chauffeurs"
4. "Success story : Syndicat de Grand-Bassam"
5. "Réglementation taxi Côte d'Ivoire 2026"
6. "Comparatif : Logiciels de gestion taxi"
7. "L'impact du digital sur les syndicats de taxis"
8. "Comment réduire les fraudes dans votre flotte"
9. "Témoignage : Propriétaire de taxi à Abidjan"
10. "AfriMobilis s'exporte au Ghana"

**KPI Phase 2 :**
- [ ] 1000 visiteurs/mois sur le site
- [ ] 50 leads qualifiés (demande de démo)
- [ ] Top 10 Google "logiciel gestion taxi Côte d'Ivoire"

---

### PHASE 3 : Expansion Côte d'Ivoire (Juillet-Sept 2026)
**Objectif : Couvrir les grandes villes de CI**

| Ville | Cible Véhicules | Stratégie |
|-------|-----------------|-----------|
| **Grand-Bassam** | 500 | Référence, témoignages |
| **Abidjan** | 2000 | Partenariats syndicats majeurs |
| **Bouaké** | 800 | Approche communautaire |
| **San-Pédro** | 400 | Réseau propriétaires |
| **Yamoussoukro** | 300 | Administration + taxis |

**Actions :**
- [ ] Recrutement Super Chefs de Ligne par ville
- [ ] Campagnes WhatsApp Business localisées
- [ ] Partenariats avec mairies et préfectures
- [ ] Événements terrain (présentations syndicats)

**KPI Phase 3 :**
- [ ] 4000+ véhicules enregistrés
- [ ] 15 syndicats actifs
- [ ] 85% taux de rétention

---

### PHASE 4 : Expansion Internationale (Oct 2026 - Mars 2027)
**Objectif : Afrique de l'Ouest**

| Pays | Ville Pilote | Adaptations |
|------|--------------|-------------|
| **Ghana** | Accra | Francais/Anglais, Cedi |
| **Sénégal** | Dakar | Francais, CFA Ouest |
| **Bénin** | Cotonou | Francais, adaptations locales |
| **Togo** | Lomé | Francais, réseaux locaux |
| **Burkina** | Ouagadougou | Francais, contexte sécurité |

**Adaptations par pays :**
- Langue (FR/EN/Local)
- Devise (CFA, Cedi, etc.)
- Documents réglementaires locaux
- Intégrations Mobile Money locales
- Partenariats locaux

**KPI Phase 4 :**
- [ ] 5 pays opérationnels
- [ ] 8000+ véhicules
- [ ] 50+ syndicats partenaires

---

## 🎨 Architecture Détaillée

### 1. Site Marketing (Astro)

```
marketing-site/
├── src/
│   ├── pages/
│   │   ├── index.astro           # Landing principale
│   │   ├── blog/
│   │   │   ├── index.astro       # Liste articles
│   │   │   └── [slug].astro      # Article individuel
│   │   ├── pays/
│   │   │   ├── ci.astro          # Côte d'Ivoire
│   │   │   ├── gh.astro          # Ghana
│   │   │   └── sn.astro          # Sénégal
│   │   ├── tarifs.astro
│   │   ├── demo.astro            # Formulaire contact
│   │   └── a-propos.astro
│   │
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Hero.astro            # Section principale
│   │   ├── Features.astro        # Fonctionnalités
│   │   ├── Testimonials.astro    # Témoignages
│   │   ├── Pricing.astro         # Tarifs
│   │   ├── CTA.astro             # Call-to-action
│   │   └── Footer.astro
│   │
│   ├── content/
│   │   └── blog/                 # Articles MDX
│   │       ├── digitaliser-flotte-taxi.mdx
│   │       ├── conformite-documentaire-afrique.mdx
│   │       └── ...
│   │
│   └── layouts/
│       └── Layout.astro
│
├── astro.config.mjs
└── package.json
```

**Technologies :**
- **Astro** : Framework static site (ultra rapide)
- **React** : Composants interactifs (formulaires)
- **Tailwind** : Styling
- **MDX** : Articles de blog

---

### 2. Application Métier (Vite + React)

Déjà déployée sur `apps/web-vite/`

**Améliorations à prévoir :**

| Module | Amélioration | Priorité |
|--------|--------------|----------|
| **Auth** | Supabase Auth complet | Haute |
| **Dashboard** | KPIs en temps réel | Haute |
| **Notifications** | WhatsApp + Push | Haute |
| **Mobile** | PWA + Responsive | Moyenne |
| **Offline** | Mode déconnecté | Moyenne |
| **Analytics** | Mixpanel/Amplitude | Basse |

---

### 3. API Backend (Express.js)

```
apps/api/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── vehicles.ts
│   │   ├── drivers.ts
│   │   ├── payments.ts
│   │   ├── documents.ts
│   │   ├── sanctions.ts
│   │   ├── tickets.ts
│   │   └── notifications.ts
│   ├── services/
│   │   ├── whatsapp.ts       # Twilio/WhatsApp Business
│   │   ├── mobileMoney.ts    # Orange/MTN/Wave
│   │   └── ocr.ts            # OCR documents
│   └── index.ts
```

---

## 📱 Stratégie Mobile

### Application React Native (Expo)

**Priorité des fonctionnalités :**

| Rôle | Fonctionnalités | Priorité |
|------|-----------------|----------|
| **Chauffeur** | Versements, Pannes, Notifications | Haute |
| **Agent Terrain** | Contrôles, Scan QR, Recensement | Haute |
| **Propriétaire** | Dashboard, Versements, Documents | Moyenne |
| **Chef de Ligne** | Validation docs, Sanctions | Moyenne |

**Calendrier :**
- **Mai 2026** : Beta chauffeurs (Grand-Bassam)
- **Juin 2026** : Beta agents terrain
- **Juillet 2026** : Release v1.0 stores

---

## 💰 Modèle Économique

### Revenus

| Source | Description | Prix |
|--------|-------------|------|
| **Abonnement Syndicat** | Par véhicule/mois | 500 FCFA/véhicule |
| **Frais de service** | % sur paiements Mobile Money | 2% |
| **Premium** | Features avancées (analytics) | 10 000 FCFA/mois |

### Estimation Revenus (Année 1)

| Période | Véhicules | Revenus Mensuels |
|---------|-----------|------------------|
| T1 2026 | 150 | 75 000 FCFA |
| T2 2026 | 1000 | 500 000 FCFA |
| T3 2026 | 2500 | 1 250 000 FCFA |
| T4 2026 | 4000 | 2 000 000 FCFA |

---

## 🚀 Plan d'Action Immédiat (Prochaines 2 semaines)

### Semaine 1 : Stabilisation
- [ ] Finaliser connexion Supabase Auth
- [ ] Tester tous les flux d'authentification
- [ ] Corriger bugs dashboard
- [ ] Préparer données de démo

### Semaine 2 : Préparation Marketing
- [ ] Créer repo `marketing-site` (Astro)
- [ ] Développer landing page v1
- [ ] Rédiger 3 premiers articles blog
- [ ] Configurer Google Analytics

---

## 📊 KPIs Globaux

### Techniques
- [ ] Uptime > 99.5%
- [ ] Temps de chargement < 2s
- [ ] Score Lighthouse > 90

### Business
- [ ] 10 000+ véhicules (fin 2027)
- [ ] 50+ syndicats partenaires
- [ ] 85% taux de rétention
- [ ] NPS > 50

### Marketing
- [ ] 10 000+ visiteurs/mois (site)
- [ ] 500+ leads qualifiés/mois
- [ ] Top 3 Google "gestion taxi Afrique"

---

## 🎯 Conclusion

**Ce plan permet à AfriMobilis de :**
1. ✅ **Fonctionner immédiatement** avec Vite + React (dashboard)
2. ✅ **Attirer des clients** via le site marketing SEO (Astro)
3. ✅ **S'expansion en Afrique** avec une stratégie par pays
4. ✅ **Générer des revenus** dès les premiers syndicats

**Prochaine étape immédiate :** Voulez-vous que je crée le site marketing Astro maintenant ?

---

*Document créé le 18 Mars 2026*  
*Basé sur le Cahier des Charges AfriMobilis v1.0*
