# Cahier des charges – AfriMobilis (Taxi informel / Grand-Bassam)

## 1) Contexte & objectifs

### 1.1 Contexte
Le secteur du taxi informel fonctionne avec des procédures souvent manuelles : enregistrements papier, contrôle terrain difficile, manque de traçabilité des versements, conformité mal suivie, absence de canal fiable pour les passagers (réclamations/objets perdus).

### 1.2 Objectifs
AfriMobilis doit :
* Structurer la gestion syndicale (parc, contrôle, sanctions, conformité).
* Donner aux propriétaires un pilotage réel (rentabilité, performance, versements, pannes).
* Donner aux chauffeurs un suivi clair (versements, incidents/pannes, notifications).
* Offrir aux passagers un canal officiel (réclamations, objets perdus/retrouvés).
* Permettre une montée en charge : d'abord Grand-Bassam, puis extension.

### 1.3 Indicateur de réussite (KPI)
* % de véhicules enregistrés/actifs dans la zone
* % de conformité à jour (docs non expirés)
* taux de versements à l'heure
* temps moyen de résolution des réclamations
* nombre d'objets perdus retrouvés via plateforme
* adoption agents terrain / syndicats (activité hebdo)

---

## 2) Périmètre fonctionnel

### 2.1 Inclus
* Gestion multi-rôles et multi-organisations (syndicats, lignes)
* Gestion véhicules / propriétaires / chauffeurs
* Versements et suivi (statuts, retards)
* Pannes & maintenance
* Conformité documentaire et alertes
* Sanctions, avertissements, contrôles terrain
* Réclamations passagers + objets perdus/retrouvés
* Dashboards (syndicat, propriétaire, chauffeur, super admin)
* Notifications (in-app, email optionnel)

### 2.2 Exclu (pour l'instant)
* Paiements intégrés (Mobile Money) (possible V2)
* Géolocalisation temps réel / tracking (possible V2)
* Marketplace de pièces/gaz (hors scope MVP, mais cohérent pour V2/V3)
* Application chauffeur type VTC (course, estimation, GPS) (hors scope)

---

## 3) Parties prenantes & rôles

### 3.1 Rôles Hiérarchiques
**Niveau 1 - Super Admin** : Gestion globale, création des syndicats, nomination des Chefs de Ligne

**Niveau 2 - Chef de Ligne / Chef Syndicat** : 
- Unique par ville (un seul syndicat pour Grand-Bassam)
- Gestion du parc, recensement, validation documents, conformité, sanctions
- 6 Chefs de Ligne à Grand-Bassam (4 titulaires + 2 députés) mais un seul dans le système

**Niveau 3 - Propriétaire / Gérant** :
- Gestion de sa flotte
- Peut créer des profils chauffeurs et leur donner les identifiants de connexion
- Suivi des versements et pannes

**Niveau 4 - Chauffeur** :
- Ses versements, ses pannes, ses notifications
- Peut confirmer son affectation

**Niveau 5 - Passager** : créer/suivre tickets (réclamation/objet perdu)

### 3.2 Matrice des permissions (résumé)
* **Super Admin** : tout, création des syndicats et nomination des Chefs de Ligne
* **Chef de Ligne** : gestion du parc véhicules, recensement (création propriétaires/véhicules), validation documents, conformité, sanctions
* **Propriétaire** : sa flotte, ses chauffeurs (création possible), versements, pannes
* **Gérant** : mêmes droits qu'un propriétaire mais limité aux véhicules gérés
* **Chauffeur** : ses versements, ses pannes, ses notifications
* **Passager** : créer/suivre tickets (réclamation/objet perdu)

### 3.3 Création des comptes
| Rôle | Créé par | Comment |
|------|----------|---------|
| Super Admin | - | Compte initial |
| Chef de Ligne | Super Admin | Nommé dans "Villes & Syndicats" |
| Propriétaire | Chef de Ligne | Via recensement ou s'inscrit librement |
| Gérant | Propriétaire | Délégué par le propriétaire |
| Chauffeur | Chef de Ligne OU Propriétaire | Créé avec identifiants transmis |
| Passager | Lui-même | Inscription libre |

---

## 4) Authentification & gestion des comptes

### 4.1 Mode de connexion
* Connexion par Téléphone + mot de passe (sans OTP SMS pour éviter les coûts)
* Pour le Super Admin : connexion par email possible
* Récupération mot de passe (email)
* Profil utilisateur : nom, prénom, contact, photo, rôle(s)

### 4.2 Onboarding (flux)
* **Passager** : inscription libre
* **Chauffeur** : créé par Chef de Ligne (recensement) ou par Propriétaire, reçoit identifiants par WhatsApp/SMS
* **Propriétaire** : créé par Chef de Ligne (recensement) ou s'inscrit librement
* **Chef de Ligne** : créé par Super Admin uniquement

---

## 5) Module B — Syndicat (Super Admin / Chef de Ligne)

**Objectif :** gérer le réseau local.

**Structure Grand-Bassam** :
- Un seul syndicat pour toute la ville
- 6 Chefs de Ligne terrain (4 titulaires + 2 députés) mais un seul dans le système
- Pas de subdivision en syndicats Centre/Nord/Sud

**Fonctions principales :**
1. **Gestion ville & syndicat** : Créer le syndicat unique, nommer le Chef de Ligne
2. **Gestion véhicules** : Ajouter, modifier, suspendre, réactiver. Historique.
3. **Recherche véhicule par plaque** : Permettre aux Chefs de Ligne de rechercher un véhicule par son numéro d'immatriculation pour obtenir instantanément les informations du propriétaire et du titulaire.
4. **Gestion chauffeurs** : Enregistrer, affectation, historique.
5. **Contrôles terrain** : Créer un contrôle, statut conformité.
6. **Sanctions & avertissements** : Avertissement, sanction, workflow de validation.
7. **Conformité** : Enregistrer documents, alertes d'expiration.

**Écrans :**
* Dashboard syndicat (KPI, alertes, retards, conformité)
* 🔍 Recherche véhicule (recherche par plaque + affichage propriétaire/titulaire)
* Parc véhicules (liste + filtre)
* Fiche véhicule (docs, affectations, sanctions, contrôles)
* Chauffeurs (liste + fiche)
* Contrôles (création + historique)
* Sanctions/Avertissements (liste + création)
* Conformité (à traiter / expirés / bientôt expirés)

---

## 6) Module C — Propriétaire / Gérant

**Objectif :** piloter la rentabilité et l'exploitation.

**Fonctions :**
* Gestion flotte (lecture/édition limitée)
* Tableau de bord (rentabilité, retards, performance, pannes)
* Versements (attendu, reçu, retard, litige)
* **Création de profils chauffeurs** : Le propriétaire peut créer des comptes chauffeurs pour ses véhicules et leur transmettre les identifiants
* Pannes & maintenance (déclaration, suivi)

**Écrans :**
* Dashboard propriétaire
* Mes véhicules
* Fiche véhicule (versements, pannes, conformité)
* Versements (liste + saisie)
* Pannes & maintenance (liste + saisie)
* Chauffeurs liés (liste + création)

---

## 7) Module D — Chauffeur

**Objectif :** visibilité sur ses obligations & événements.

**Fonctions :**
* Voir versements attendus + historique
* Déclarer une panne / incident
* Voir avertissements / sanctions (lecture)
* Notifications (conformité, retards, convocations)
* **Confirmation d'affectation** : Confirmer qu'il est bien le chauffeur assigné au véhicule

**Écrans :**
* Accueil chauffeur (résumé)
* Mes versements
* Déclarer panne/incident
* Mes notifications
* Mes sanctions (lecture)

---

## 8) Module E — Passagers (Réclamations + objets perdus)

**Objectif :** canal officiel de confiance.

**Fonctions :**
1. **Réclamation** : Créer ticket, suivi (soumis → en cours → résolu / rejeté)
2. **Objets perdus / retrouvés** : Déclarer perdu/retrouvé, matching manuel (MVP)

**Écrans :**
* Créer réclamation
* Mes tickets (liste + statut)
* Objet perdu (déclaration)
* Objets retrouvés (liste)
* Détail ticket

---

## 9) Règles de gestion (business rules)

* **Conformité** : Un document expiré → véhicule "non conforme". Alertes J-30, J-7, J+1.
* **Versements** : Statuts "attendu", "reçu", "en retard", "litige". Les retards déclenchent des notifications.
* **Sanctions** : Avertissement → légère → lourde → suspension. Validation par un admin syndicat requise.
* **Tickets passagers** : Statuts : soumis → en cours → résolu / rejeté. SLA paramétrable.
* **Création Chauffeur** : Peut être faite par Chef de Ligne (recensement) ou par Propriétaire (affectation à son véhicule)
* **Syndicat Grand-Bassam** : Un seul syndicat couvre toute la ville. Les 6 Chefs de Ligne sont des délégués terrain.

---

## 10) Notifications
* In-app (obligatoire) / Email (optionnel)
* Types : conformité à échéance, retard versement, sanction/avertissement, ticket mis à jour, panne déclarée/résolue.

---

## 11) Exigences non fonctionnelles
* **Sécurité** : RBAC, isolation par syndicat, logs d'audit, protection des données.
* **Performance** : Chargement < 2s sur mobile, pagination/filtres.
* **Compatibilité** : Mobile first + desktop. PWA possible (V2).

---

## 12) MVP (Version 1) vs V2

**MVP – Priorités :**
1. Auth + rôles hiérarchiques (Super Admin → Chef de Ligne → Propriétaire → Chauffeur)
2. Syndicat unique Grand-Bassam + Chef de Ligne
3. Gestion véhicules/propriétaires/chauffeurs (création par Chef de Ligne ET Propriétaire)
4. Versements et suivi
5. Conformité + alertes
6. Réclamations passagers + objets perdus
7. Recherche véhicule par plaque (pour Chefs de Ligne)

**V2 – Extensions :**
* Paiement Mobile Money
* Géolocalisation / check-in terrain
* Matching automatique objets perdus
* Analytics avancée
* Marketplace pièces/gaz

---

## 13) Livrables attendus

1. **Spécifications techniques & Maquettes** : Diagrammes de la base de données (MCD/MLD) et maquettes UI/UX validées.
2. **Code source** : Dépôt Git (versionning) documenté et structuré.
3. **Application déployée** : Environnement de test (staging/recette) pour validation, puis environnement de production.
4. **Documentation utilisateur** : Guides ou tutoriels simplifiés (format PDF ou vidéo) pour les admins syndicat, les agents terrain, les propriétaires et chauffeurs.
5. **Documentation technique** : Procédure de déploiement, paramétrage des serveurs, et guide de maintenance.
