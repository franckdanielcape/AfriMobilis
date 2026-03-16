# 🎯 PLAN DE COMPLÉTION MVP - AfriMobilis

> **Objectif** : Atteindre 100% du MVP de manière structurée et sans régression
> **Date** : Mars 2026

---

## 📋 ORDRE D'IMPLÉMENTATION (Logique de dépendances)

```
PHASE 1: Infrastructure (Notifications)
    ↓
PHASE 2: Flux Métier (Tickets)
    ↓
PHASE 3: Passagers (Objets Perdus)
    ↓
PHASE 4: Chauffeur (Vue Sanctions)
    ↓
PHASE 5: Propriétaire (Rentabilité)
```

---

## PHASE 1 : Système de Notifications (Infrastructure) ⚙️

**Pourquoi d'abord ?** Tous les autres modules en dépendent (alertes conformité, nouveaux tickets, sanctions...)

### 1.1 Base de données
```sql
-- Table notifications
-- Types: conformite, versement, sanction, ticket, panne, system
-- Statuts: non_lue, lue, archivee
-- Lien vers: user_id (destinataire)
```

### 1.2 Génération automatique des alertes
| Déclencheur | Action |
|-------------|--------|
| Document J-30, J-7, J+1 | Créer notification conformité |
| Versement en retard | Notification propriétaire + chauffeur |
| Nouveau ticket créé | Notification Chefs de Ligne |
| Sanction validée | Notification chauffeur |
| Panne déclarée | Notification propriétaire |

### 1.3 API & Frontend
- `GET /api/notifications` - Liste avec pagination
- `PATCH /api/notifications/:id/lue` - Marquer comme lue
- `DELETE /api/notifications/:id` - Archiver
- Badge dans le header (nombre de non lues)

**Durée estimée** : 3-4h
**Fichiers à créer/modifier** :
- `packages/database/migrations/010_table_notifications.sql`
- `apps/web/src/app/api/notifications/route.ts`
- `apps/web/src/app/dashboard/notifications/page.tsx`
- `apps/web/src/components/NotificationBell.tsx`

---

## PHASE 2 : Workflow Tickets Passagers (Flux métier) 🎫

**Pourquoi deuxième ?** Nécessite les notifications (alertes nouveaux tickets) mais peut être fait en parallèle de la Phase 1 si on ne met les notifs qu'à la fin.

### 2.1 Workflow complet des statuts
```
soumis → en_cours → resolu
              ↘
                rejete
```

### 2.2 Interfaces à créer
| Interface | Acteur | Fonction |
|-----------|--------|----------|
| Liste tickets admin | Chef de Ligne | Voir tous les tickets, filtrer par statut |
| Traiter ticket | Chef de Ligne | Prendre en charge, résoudre, rejeter |
| Détail ticket | Passager | Voir statut, historique, répondre |

### 2.3 Système de commentaires
- Table `ticket_comments`
- Historique des échanges entre passager et admin

**Durée estimée** : 2-3h
**Fichiers** :
- Migration `011_workflow_tickets.sql`
- `apps/web/src/app/dashboard/tickets/admin/page.tsx` (gestion)
- Update `apps/web/src/app/dashboard/tickets/page.tsx` (passager)

---

## PHASE 3 : Matching Objets Perdus (Passagers) 🔍

**Pourquoi troisième ?** Dépend du système de tickets (même logique de déclaration)

### 3.1 Tables existantes
- Déjà créées : `objets_perdus`, `objets_trouves`

### 3.2 Interface de matching
- Liste des objets trouvés (public)
- Formulaire déclaration objet perdu (existe déjà)
- Formulaire déclaration objet trouvé
- **Matching manuel** : Admin peut lier un objet perdu à un objet trouvé

### 3.3 Workflow
1. Passager déclare objet perdu
2. Quelqu'un déclare objet trouvé
3. Admin voit les correspondances potentielles
4. Admin contacte les deux parties
5. Statut : `en_attente` → `matched` → `rendu`

**Durée estimée** : 2h
**Fichiers** :
- `apps/web/src/app/objets/page.tsx` (liste publique)
- `apps/web/src/app/dashboard/objets/admin/page.tsx` (matching)

---

## PHASE 4 : Module Chauffeur - Sanctions & Notifications 👨‍✈️

**Pourquoi quatrième ?** Utilise les notifications (Phase 1) et dépend des sanctions déjà créées.

### 4.1 Vue sanctions du chauffeur
- Page `/dashboard/chauffeur/sanctions`
- Voir UNIQUEMENT ses propres sanctions (lecture seule)
- Statut : en attente / validée / annulée
- Détails : motif, type, date

### 4.2 Notifications chauffeur
- Nouvelle sanction reçue
- Sanction validée
- Rappel versement
- Alertes conformité véhicule

### 4.3 Dashboard chauffeur amélioré
- Widget "Mes sanctions" (alerte si nouvelle)
- Widget "Prochains versements"
- Accès rapide "Déclarer une panne"

**Durée estimée** : 2h
**Fichiers** :
- `apps/web/src/app/dashboard/chauffeur/sanctions/page.tsx`
- Update `apps/web/src/app/dashboard/chauffeur/page.tsx`

---

## PHASE 5 : Dashboard Propriétaire - Rentabilité 💰

**Pourquoi dernier ?** Le plus complexe, nécessite tous les autres modules fonctionnels pour avoir des données réalistes.

### 5.1 KPIs à afficher
| KPI | Calcul |
|-----|--------|
| Revenus du mois | Somme des versements reçus |
| Revenus attendus | Somme des versements attendus |
| Taux de recouvrement | (reçus / attendus) × 100 |
| Pannes du mois | Nombre de pannes déclarées |
| Véhicules actifs | Véhicules avec chauffeur assigné |
| Retards de versement | Nombre de versements en retard |

### 5.2 Graphiques
- Courbe des versements (6 derniers mois)
- Répartition des pannes par type
- Comparatif véhicules (performance)

### 5.3 Filtres
- Par véhicule
- Par période (mois, trimestre, année)
- Par chauffeur

**Durée estimée** : 3-4h
**Fichiers** :
- `apps/web/src/app/dashboard/proprietaire/rentabilite/page.tsx`
- `apps/web/src/app/api/proprietaire/stats/route.ts`
- Composants graphiques (Recharts ou Chart.js)

---

## 📊 RÉCAPITULATIF

| Phase | Module | Durée | Dépend de |
|-------|--------|-------|-----------|
| 1 | Notifications | 3-4h | - |
| 2 | Tickets Workflow | 2-3h | Phase 1 (optionnel) |
| 3 | Objets Perdus | 2h | Phase 2 |
| 4 | Chauffeur | 2h | Phase 1 |
| 5 | Rentabilité | 3-4h | Toutes |
| **TOTAL** | | **12-15h** | |

---

## 🚀 CHECKLIST AVANT CHAQUE PHASE

### Avant Phase 1
- [ ] Migrations 007, 008, 009 exécutées
- [ ] Données de test disponibles

### Avant Phase 2
- [ ] Phase 1 terminée OU notifications désactivées temporairement

### Avant Phase 3
- [ ] Phase 2 fonctionnelle

### Avant Phase 4
- [ ] Phase 1 fonctionnelle
- [ ] Sanctions créées et testées

### Avant Phase 5
- [ ] Versements réels en base
- [ ] Pannes déclarées
- [ ] Au moins 2-3 mois de données

---

## ✅ CRITÈRES DE VALIDATION MVP

- [ ] Super Admin peut gérer villes et Super Chefs
- [ ] Super Chef peut créer des Chefs de Ligne
- [ ] Chef de Ligne peut recenser, contrôler, sanctionner
- [ ] Propriétaire voit sa rentabilité
- [ ] Chauffeur voit ses versements et sanctions
- [ ] Passager peut créer un ticket et suivre son traitement
- [ ] Passager peut déclarer/retrouver des objets
- [ ] Notifications automatiques fonctionnent
- [ ] Tous les utilisateurs reçoivent les alertes pertinentes

---

**Prochaine action** : Commencer la Phase 1 (Notifications) ?
