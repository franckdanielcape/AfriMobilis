# Cahier des charges – AfriMobilis (Taxi informel / Grand-Bassam)

## 1) Contexte & objectifs

### 1.1 Contexte
Le secteur du taxi informel fonctionne avec des procédures souvent manuelles : enregistrements papier, contrôle terrain difficile, manque de traçabilité des versements au niveau des propriétaires, conformité mal suivie, absence de canal fiable pour les passagers (réclamations/objets perdus).

### 1.2 Objectifs
AfriMobilis doit :
* Structurer la gestion syndicale (parc, contrôle, sanctions, conformité).
* Donner aux propriétaires un pilotage réel (rentabilité, performance, versements, pannes).
* Donner aux chauffeurs un suivi clair (versements, incidents/pannes, notifications).
* Offrir aux passagers un canal officiel (réclamations, objets perdus/retrouvés).
* Permettre une montée en charge : d’abord Grand-Bassam, puis extension.

### 1.3 Indicateurs de réussite (KPI)
* % de véhicules enregistrés/actifs dans la zone
* % de conformité à jour (docs non expirés)
* taux de versements à l’heure
* temps moyen de résolution des réclamations
* nombre d’objets perdus retrouvés via plateforme
* adoption agents terrain / syndicats (activité hebdo)

---

## 2) Périmètre fonctionnel

### 2.1 Inclus
* Gestion multi-rôles et multi-organisations (syndicats, propriétaires, chauffeurs, super admin)
* Gestion véhicules / propriétaires / chauffeurs
* Versements et suivi (uniquement propriétaires,
et chauffeurs statuts, retards)
* Pannes & maintenance
* Conformité documentaire et alertes
* Sanctions, avertissements, contrôles terrain
* Réclamations passagers + objets perdus/retrouvés
* Dashboards (syndicat, propriétaire, chauffeur, super admin)
* Notifications (in-app, email optionnel)

### 2.2 Exclu (pour l’instant)
* Paiements intégrés (Mobile Money) (possible V2)
* Géolocalisation temps réel / tracking (possible V2)
* Marketplace de pièces/gaz (hors scope MVP, mais cohérent pour V2/V3)
* Application chauffeur type VTC (course, estimation, GPS) (hors scope)

---

## 3) Parties prenantes & rôles

### 3.1 Rôles
1. **Super Admin** (global) - Crée les pays, les villes/lignes, et nomme le Super Chef de Ligne
2. **Super Chef de Ligne** - Gère les Chefs de Ligne (ajout/suppression), voit toutes les lignes, mais ne gère pas la config système
3. **Chef de Ligne** (Admin syndicat) - Gestion d'une ville entière (une ville = une ligne). Le terme "ligne" désigne la zone géographique de la ville
4. **Agent terrain syndicat** - Contrôleurs sur le terrain
5. **Propriétaire** - Propriétaire de véhicule(s)
6. **Gérant** - Gérant mandaté par un propriétaire
7. **Chauffeur** - Conducteur de taxi
8. **Passager** - Usager du service

### 3.2 Matrice des permissions (résumé)
* **Super Admin** : tout
* **Super Chef de Ligne** : gère les Chefs de Ligne de sa ville uniquement, voit les stats de sa ville
* **Admin syndicat** : tout sur sa zone (ligne = ville) - véhicules/chauffeurs/sanctions/contrôles/gestion des agents
* **Agent terrain** : contrôles + création d’incidents + avertissements (selon règles)
* **Propriétaire** : flotte + chauffeurs liés + versements + pannes (lecture/édition selon règles)
* **Gérant** : mêmes droits que le propriétaire qui l'a choisir mais limité aux véhicules gérés et interdictions de proceder la vente d'un vehicules
* **Chauffeur** : ses versements, ses pannes, ses notifications, tickets liés
* **Passager** : créer/suivre tickets (réclamation/objet perdu)

### 3.3 Structure Hiérarchique Détaillée

#### Hiérarchie Administrative

```
SUPER ADMIN (Global - Toutes les villes)
    └── SUPER CHEF DE LIGNE - Ville A (ex: Grand-Bassam)
    │       └── Gère TOUTE la ville de Grand-Bassam
    │       └── Peut créer d'autres Chefs de Ligne (collègues)
    │
    │       ├── CHEF DE LIGNE - Grand-Bassam (collègue 1)
    │       │       └── Gère TOUTE Grand-Bassam (même ville que Super Chef)
    │       │       └── Mêmes droits que Super Chef sauf création d'équipe
    │       │
    │       ├── CHEF DE LIGNE - Grand-Bassam (collègue 2)
    │       │       └── Gère TOUTE Grand-Bassam
    │       │       └── Mêmes droits que Super Chef sauf création d'équipe
    │       │
    │       └── CHEF DE LIGNE - Grand-Bassam (collègue 3)
    │               └── Gère TOUTE Grand-Bassam
    │               └── Mêmes droits que Super Chef sauf création d'équipe
    │
    └── SUPER CHEF DE LIGNE - Ville B (ex: Abidjan)
            └── Gère TOUTE la ville d'Abidjan
            └── Crée ses propres Chefs de Ligne collègues
```

#### Définitions et Portée

**1. Super Admin**
- **Portée** : Toutes les villes (monde entier)
- **Fonction** : Crée les pays, les villes, et nomme un Super Chef de Ligne par ville
- **Accès** : Configuration système, création de structure géographique
- **Ne gère pas** : Les Chefs de Ligne (délégué aux Super Chefs)

**2. Super Chef de Ligne (1 par ville)**
- **Portée** : **La ville entière** assignée (ex: Grand-Bassam complet)
- **Fonction** : Gère la ville, peut créer/supprimer des Chefs de Ligne (collègues)
- **Accès** : Tous les véhicules, chauffeurs, propriétaires de la ville
- **Données** : Mêmes données que les Chefs de Ligne de sa ville
- **Spécificité** : Seul peut créer/supprimer des membres de l'équipe

**3. Chef de Ligne (plusieurs par ville)**
- **Portée** : **La ville entière** (MÊME ville que le Super Chef)
- **Fonction** : Gère la ville avec les mêmes droits que le Super Chef
- **Accès** : Les mêmes véhicules, chauffeurs, propriétaires que le Super Chef
- **Créé par** : Le Super Chef de Ligne de la ville
- **Restriction** : Ne peut PAS créer/supprimer d'autres Chefs de Ligne

#### Exemple Concret - Grand-Bassam

**Hiérarchie complète à Grand-Bassam :**
- **Super Admin** (Franck) crée la ville "Grand-Bassam"
- **Super Admin** nomme "M. Kouamé" comme **Super Chef de Ligne de Grand-Bassam**
- **M. Kouamé** (Super Chef) crée des collègues :
  - "Chef Yao" - Chef de Ligne collègue
  - "Chef Bamba" - Chef de Ligne collègue
  - "Chef Koné" - Chef de Ligne collègue

**Tous les 4 (Kouamé, Yao, Bamba, Koné) :**
- Gèrent les mêmes 150 véhicules de Grand-Bassam
- Gèrent les mêmes 50 propriétaires de Grand-Bassam
- Gèrent les mêmes 200 chauffeurs de Grand-Bassam
- Peuvent valider des recensements
- Peuvent gérer les agents terrain

**Seul Kouamé (Super Chef) peut :**
- Créer un nouveau Chef de Ligne
- Supprimer un Chef de Ligne existant

**Hiérarchie à Abidjan (autre ville) :**
- **Super Admin** crée la ville "Abidjan"
- **Super Admin** nomme "M. Diallo" comme **Super Chef de Ligne d'Abidjan**
- **M. Diallo** crée ses propres Chefs de Ligne collègues à Abidjan
- **M. Kouamé** (Grand-Bassam) ne voit pas Abidjan

#### Règles Importantes

1. **Un Super Chef de Ligne = Une ville** : Un Super Chef ne gère qu'une seule ville
2. **Plusieurs Super Chefs possibles** : Il y a un Super Chef par ville (Grand-Bassam, Abidjan...)
3. **Plusieurs Chefs par ville** : Chaque Super Chef nomme plusieurs Chefs de Ligne collègues
4. **Collègues = Mêmes droits** : Super Chef et Chefs de Ligne ont les mêmes droits sur les données
5. **Seule différence** : Seul le Super Chef peut créer/supprimer des membres de l'équipe
6. **Isolement géographique** : Les villes sont isolées (Grand-Bassam ne voit pas Abidjan)

---

## 4) Authentification & gestion des comptes

### 4.1 Mode de connexion
* Connexion “à la Facebook” : Email + mot de passe ou Téléphone + mot de passe (sans OTP SMS si tu veux éviter le coût ; possibilité d’ajouter plus tard)
* Récupération mot de passe (email)
* Profil utilisateur : nom, prénom, contact, photo, rôle(s)

### 4.2 Onboarding (flux)
* **Passager** : inscription libre
* **Chauffeur/Propriétaire/Gérant** : inscription possible mais validation par syndicat/admin (recommandé)
* **Agents / admins** : créés par Super Admin ou Admin syndicat

---

## 5) Modules détaillés

### Module A — Administration (Super Admin)
**Objectif :** paramétrer le système global.
**Fonctions :**
* Gestion des syndicats (création, zones géographiques)
* Gestion des rôles & permissions (templates)
* Paramètres : types de documents, règles sanctions, délais, statuts
* Gestion des utilisateurs (activation/désactivation)
* Logs d’audit (qui a fait quoi, quand)
* Export données (CSV/Excel)

**Écrans :**
* Dashboard global
* Liste syndicats
* Paramétrage conformité (documents & expirations)
* Paramétrage sanctions (niveaux, motifs)
* Utilisateurs & rôles (possibilité de modifier les permissions par rôle)
* Logs / audits

### Module B — Syndicat ( Chef de ligne / Agent)
**Objectif :** gérer le réseau local de sa zone (ligne = ville).
**Fonctions principales :**
1. **Gestion véhicules** : Ajouter, modifier, suspendre, réactiver. Historique.(uniquement chef de ligne mais les agents pourrons effectuer des recensement afin de faciliter la tache aux chefs de ligne
et ceux-ci devrons valider les recensement des agents pour la mise a jour de la base de données)
2. **Recherche véhicule par plaque** : Permettre aux Chefs de Ligne de rechercher un véhicule par son numéro d'immatriculation pour obtenir instantanément les informations du propriétaire et du titulaire (chauffeur). **Critique pour la gestion des incidents** : lorsqu'un chauffeur commet une infraction ou est impliqué dans un incident, le syndicat doit pouvoir identifier rapidement le propriétaire pour le contacter.
3. **Gestion chauffeurs** : suspension, fin de suspension, historique.
4. **Contrôles terrain** : Créer un contrôle, statut conformité.
5. **Sanctions & avertissements** : Avertissement, sanction, workflow de validation.
6. **Conformité documentaire avancée** : 
   *Documents obligatoires et fréquences :*
   - **Visite technique** : renouvellement tous les 6 mois (document prioritaire - souvent délaissé par les propriétaires)
   - **Patente** : renouvellement annuel (à partir de fin février)
   - **Carte de stationnement** : renouvellement annuel avec possibilité de paiement en deux tranches
   - **Assurance** : renouvellement mensuel (contrôlée par les policiers)
   
   *Système de validation intelligent (Visite Technique uniquement) :*
   - **OCR automatisé** : Lecture automatique de la date d'expiration sur la carte via IA lors de l'upload par le propriétaire
   - **Validation par lot** : Le Chef de Ligne peut valider plusieurs visites en une seule action (cases à cocher + bouton "Valider la sélection")
   - Les autres documents (patente, stationnement, assurance) sont enregistrés automatiquement sans validation manuelle
   
   *Paiement intégré Mobile Money :*
   - Paiement des frais de visite technique directement via l'application (Orange Money, MTN Money, Wave)
   - Deux options : acompte (avance partielle) ou paiement total
   - Le syndicat dispose d'un numéro de versement dédié
   - Statut visible en temps réel lors des contrôles terrain : "Acompte versé : X FCFA" ou "Payé intégralement"
   - Traçabilité complète avec reçus électroniques
   
   *Déclaration par le propriétaire :*
   - Upload de photo des documents renouvelés directement via l'application
   - Pour la visite technique : validation à distance par le Chef de Ligne après upload
   - Pour les autres documents : enregistrement automatique
   - Archives numériques sécurisées
   
   *Tableau de bord prédictif :*
   - Prédiction des véhicules bientôt en infraction
   - Alertes proactives : "15 véhicules expirent cette semaine"
   - Liste de contrôle prioritaire auto-générée selon l'urgence
   - Taux de conformité par zone en temps réel
   
   *Système de rappels automatiques (WhatsApp) :*
   - J-30 : Alerte préventive au propriétaire
   - J-7 : Alerte urgente propriétaire + Chef de Ligne
   - J-1 : Dernière alerte propriétaire + Chef de Ligne
   - J+1 (expiré) : Notification Chef de Ligne avec liste des véhicules à suspendre
   - Confirmation après paiement reçu
   - SMS prévu pour implémentation future

**Écrans :**
* Dashboard syndicat (KPI, alertes, retards, conformité) avec **tableau de bord prédictif**
* **🔍 Recherche véhicule** (recherche par plaque + affichage propriétaire/titulaire)
* Parc véhicules (liste + filtre)
* Fiche véhicule (docs, affectations, sanctions, contrôles)
* Chauffeurs (liste + fiche)
* **👮 Gestion des agents syndicat de terrain** (création, affectation, suivi)
* Contrôles (création + historique)
* Sanctions/Avertissements (liste + création)
* **Conformité avancée** :
  - Liste des documents à traiter / expirés / bientôt expirés
  - **Validation par lot** des visites techniques (OCR pré-rempli)
  - Historique des paiements Mobile Money
  - Suivi des acomptes et paiements complets
* **Notifications et rappels** WhatsApp (configuration des alertes)

### Module C — Propriétaire / Gérant
**Objectif :** piloter la rentabilité et l’exploitation.
**Fonctions :**
* Gestion flotte (lecture/édition)
* Tableau de bord (rentabilité, retards, performance, pannes) par voiture + chauffeur

* Versements (attendu, reçu, retard, litige)
* Pannes & maintenance (déclaration, suivi)

**Écrans :**
* Dashboard propriétaire
* Mes véhicules
* Fiche véhicule (versements, pannes, conformité, performance)
* Versements (liste + saisie)
* Pannes & maintenance (liste + saisie)
* Chauffeurs liés (liste)
* possibilité de voir les infos d'un seul vehicule ou de tous les véhicules à la fois.

### Module D — Chauffeur
**Objectif :** visibilité sur ses obligations & événements.
**Fonctions :**
* Voir versements attendus + historique
* Déclarer une panne / incident
* Voir avertissements / sanctions (lecture)
* Notifications (conformité, retards, convocations)

**Écrans :**
* Accueil chauffeur (résumé)
* Mes versements
* Déclarer panne/incident
* Mes notifications
* Mes sanctions (lecture)
* Mes documents (ajout de permis de conduire et autres documents pertinents)


### Module E — Passagers (Réclamations + objets perdus)
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

## 6) Données & structure (modèle logique)

**Entités principales :**
* User (id, identité, contact)
* Role (super_admin, admin_syndicat, agent, propriétaire, chauffeur, passager…)
* Syndicat (id, nom)
* Ligne (id, syndicat_id, nom)
* Vehicule (id, immatriculation, ligne_id, owner_id, status)
* ChauffeurProfile (user_id, permis?, affectation)
* OwnerProfile (user_id)
* Affectation (vehicule_id, chauffeur_id, date_debut, date_fin)
* Versement (vehicule_id, chauffeur_id, montant, date, statut, commentaire)
* Panne (vehicule_id, déclaré_par, type, date, coût, statut)
* DocumentConformite (vehicule_id, type, numero, expiration, statut, image_url, valide_par, date_validation)
* TypesDocuments (id, nom, duree_validite_mois, obligatoire, description) -- configuration des types de documents
* PaiementsVisites (id, proprietaire_id, vehicule_id, montant, type_paiement [acompte/total], moyen_paiement, reference_transaction, statut, date_paiement, valide_par)
* ValidationsVisites (id, document_id, valide_par, date_validation, statut_validation, commentaire)
* OCRExtractions (id, document_id, date_extraite, confiance_ocr, texte_extrait) -- données OCR pour validation auto
* RappelsNotifications (id, destinataire_id, type_rappel, canal [whatsapp/sms], date_envoi, statut, contenu)
* Controle (vehicule_id, agent_id, date, résultat, note, preuves)
* Sanction (vehicule_id/chauffeur_id, type, niveau, date, statut)
* Ticket (passager_id, type, description, statut, preuves)
* ObjetPerdu / ObjetRetrouve

---

## 7) Règles de gestion (business rules)

### Conformité documentaire
* **Documents obligatoires** : Visite technique (6 mois), Patente (1 an), Carte stationnement (1 an), Assurance (1 mois)
* **Document expiré** → véhicule "non conforme". Alertes J-30, J-7, J+1.
* **Visite technique** : Document prioritaire nécessitant validation manuelle du Chef de Ligne après upload (autres documents auto-enregistrés)
* **OCR** : Lecture automatique de la date d'expiration sur la carte visite technique lors de l'upload
* **Validation par lot** : Le Chef de Ligne peut valider plusieurs visites techniques simultanément

### Paiement des visites techniques
* **Responsable** : Le propriétaire paie les frais de visite technique (pas le chauffeur)
* **Options** : Acompte (avance partielle) ou paiement total
* **Moyen** : Mobile Money intégré (Orange Money, MTN Money, Wave) vers numéro dédié du syndicat
* **Traçabilité** : Reçu électronique généré automatiquement, statut visible lors des contrôles terrain
* **Validation** : Le statut "payé" n'active la validité qu'après upload de la carte et validation du syndicat

### Versements
* **Statuts** : "attendu", "reçu", "en retard", "litige". Les retards déclenchent des notifications.

### Sanctions
* **Niveaux** : Avertissement → légère → lourde → suspension. Validation par un admin syndicat requise.

### Tickets passagers
* **Statuts** : soumis → en cours → résolu / rejeté. SLA paramétrable.

---

## 8) Notifications

### Canaux
* **In-app** (obligatoire)
* **WhatsApp** (Phase 1 - immédiat)
* **SMS** (Phase 2 - implémentation future)
* **Email** (optionnel)

### Types de notifications
* **Conformité** : 
  - J-30 : Alerte préventive au propriétaire
  - J-7 : Alerte urgente propriétaire + Chef de Ligne
  - J-1 : Dernière alerte propriétaire + Chef de Ligne
  - Expiration (J+1) : Notification Chef de Ligne avec liste des véhicules à suspendre
  - Paiement reçu : Confirmation au propriétaire
  - Nouvelle visite à valider : Notification Chef de Ligne
* **Retard versement** : Notification automatique
* **Sanctions/Avertissements** : Notification au concerné
* **Tickets** : Mis à jour du statut
* **Pannes** : Déclarée/résolue

---

## 9) Exigences non fonctionnelles
* **Sécurité** : RBAC, isolation par syndicat, logs d’audit, protection des données.
* **Performance** : Chargement < 2s sur mobile, pagination/filtres.
* **Compatibilité** : Mobile first + desktop. PWA possible (V2).

---

## 10) MVP (Version 1) vs V2

**MVP – Priorités :**
1. Auth + rôles
2. Syndicat : véhicules, chauffeurs, conformité + alertes, contrôles
3. Propriétaire : dashboard, versements, pannes
4. Chauffeur : versements (lecture), déclarer panne
5. Passager : tickets + objets perdus/retrouvés (matching manuel)
6. Notifications in-app

**V2 – Extensions :**
* Paiement Mobile Money
* Géolocalisation / check-in terrain
* Matching automatique objets perdus
* Analytics avancée
* Marketplace pièces/gaz

---

## 11) Critères d’acceptation (exemples)
* Un admin syndicat peut ajouter un véhicule, l'associer à un propriétaire et un chauffeur, ajouter des documents de conformité.
* Un propriétaire peut voir son dashboard, inscrire un versement reçu.
* Un chauffeur peut voir ses versements et déclarer une panne.
* Un passager peut créer une réclamation et la suivre.
* Un agent de terrain peut enregistrer un contrôle et un avertissement.
* Les utilisateurs ne voient que les données qui leur sont autorisées.

---

## 12) Livrables attendus

1. **Spécifications techniques & Maquettes** : Diagrammes de la base de données (MCD/MLD) et maquettes UI/UX validées.
2. **Code source** : Dépôt Git (versionning) documenté et structuré.
3. **Application déployée** : Environnement de test (staging/recette) pour validation, puis environnement de production.
4. **Documentation utilisateur** : Guides ou tutoriels simplifiés (format PDF ou vidéo) pour les admins syndicat, les agents terrain, les propriétaires et chauffeurs.
5. **Documentation technique** : Procédure de déploiement, paramétrage des serveurs, et guide de maintenance.

---

## 13) Macro-planning (Proposition pour le MVP)

* **Phase 1 : Conception & Design** (2 - 3 semaines)
  * Parcours utilisateurs (User flows), maquettes (UI/UX), architecture de la base de données.
* **Phase 2 : Développement Base de données & Back-office** (3 - 4 semaines)
  * Mise en place de l'infrastructure, authentification, rôles (Super Admin, Syndicat).
* **Phase 3 : Développement Front-end des modules acteurs** (3 - 4 semaines)
  * Tableaux de bord Propriétaires, interfaces Chauffeurs & Passagers, gestion des versements, conformité et tickets.
* **Phase 4 : Tests & Recette (QA)** (2 semaines)
  * Déploiement en pré-production, tests d'acceptation, corrections de bugs.
* **Phase 5 : Déploiement Pilote (Grand-Bassam)**
  * Mise en production, onboarding des premiers syndicats et formation des agents sur le terrain.

---

## 14) Conclusion et prochaines étapes

Ce cahier des charges constitue la feuille de route fondatrice du projet AfriMobilis (phase MVP). L’objectif est de structurer et digitaliser efficacement l'écosystème du taxi informel à Grand-Bassam en offrant de la transparence aux syndicats et aux propriétaires, un outil de suivi aux chauffeurs, et une plateforme sécurisée pour les passagers.

**Prochaines étapes :**
1. Validation de la portée fonctionnelle (Périmètre MVP).
2. Choix de la stack technique définitive (exemples : Next.js, React Native/Expo, Supabase/Firebase, PostgreSQL).
3. Lancement de la Phase 1 (Conception et Maquettes).
