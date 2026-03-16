# 🔔 Test du Système de Notifications

## 1. Exécuter la Migration SQL

Dans l'interface Supabase (SQL Editor), exécutez :

```sql
-- Migration 010
\i packages/database/migrations/010_table_notifications.sql
```

Ou copiez-collez le contenu du fichier.

---

## 2. Vérifier les Tables Créées

```sql
-- Vérifier la structure
\d notifications

-- Vérifier les fonctions
\df creer_notification
\df verifier_conformite_notifications
\df verifier_versements_notifications
\df compter_notifications_non_lues
```

---

## 3. Tests Manuelles

### Test 1 : Créer une notification manuellement

```sql
-- Récupérer un user_id existant
SELECT id, prenom, nom FROM profiles LIMIT 5;

-- Créer une notification test
SELECT creer_notification(
    'USER_ID_ICI',           -- p_user_id
    'system',                -- p_type
    'info',                  -- p_niveau
    'Bienvenue sur AfriMobilis',  -- p_titre
    'Votre compte a été créé avec succès.',  -- p_message
    '/dashboard',            -- p_lien
    NULL,                    -- p_reference_type
    NULL,                    -- p_reference_id
    NULL,                    -- p_created_by
    NULL                     -- p_metadata
);
```

### Test 2 : Vérifier les notifications

```sql
-- Voir les notifications
SELECT * FROM notifications ORDER BY date_creation DESC;

-- Compter les non lues
SELECT * FROM compter_notifications_non_lues('USER_ID_ICI');
```

### Test 3 : Marquer comme lue

```sql
-- Marquer une notification comme lue
SELECT marquer_notification_lue('NOTIFICATION_ID', 'USER_ID_ICI');
```

---

## 4. Tests de Notifications Automatiques

### Test Conformité (J-30)

```sql
-- Créer un document qui expire dans 30 jours
INSERT INTO documents (vehicule_id, type_document, numero_document, date_expiration, statut)
SELECT 
    v.id,
    'assurance',
    'ASSUR-TEST-001',
    CURRENT_DATE + INTERVAL '30 days',
    'valide'
FROM vehicules v
LIMIT 1;

-- Exécuter la vérification
SELECT verifier_conformite_notifications();

-- Vérifier que la notification a été créée
SELECT * FROM notifications WHERE type = 'conformite';
```

### Test Versement en Retard

```sql
-- Créer un versement en retard
INSERT INTO versements (vehicule_id, montant_attendu, montant_recu, date_attendue, statut)
SELECT 
    v.id,
    50000,
    0,
    CURRENT_DATE - INTERVAL '5 days',
    'en_retard'
FROM vehicules v
WHERE v.proprietaire_id IS NOT NULL
LIMIT 1;

-- Exécuter la vérification
SELECT verifier_versements_notifications();

-- Vérifier
SELECT * FROM notifications WHERE type = 'versement';
```

---

## 5. Tests Frontend

### Page Notifications
1. Se connecter à l'application
2. Aller sur `/dashboard/notifications`
3. Vérifier :
   - [ ] La liste s'affiche
   - [ ] Les filtres fonctionnent
   - [ ] Le bouton "Marquer comme lu" fonctionne
   - [ ] Le bouton "Tout marquer comme lu" fonctionne

### Cloche de Notification
1. Vérifier que la cloche s'affiche dans le header
2. Cliquer sur la cloche :
   - [ ] Le dropdown s'ouvre
   - [ ] Les notifications s'affichent
   - [ ] Le compteur est correct
   - [ ] Marquer comme lu fonctionne
   - [ ] Le lien "Voir toutes" fonctionne

### Badge de Compteur
1. Avoir des notifications non lues
2. Vérifier que le badge rouge s'affiche
3. Vérifier que le nombre est correct

---

## 6. API Endpoints à Tester

```bash
# Récupérer les notifications
curl -H "x-user-id: USER_ID" http://localhost:4000/api/notifications

# Compteur
curl -H "x-user-id: USER_ID" http://localhost:4000/api/notifications/compteur

# Marquer comme lue
curl -X PATCH -H "x-user-id: USER_ID" http://localhost:4000/api/notifications/ID/lue
```

---

## 7. Résultats Attendus

| Test | Résultat Attendu |
|------|------------------|
| Migration | Succès, tables créées |
| Création notification | Notification en base |
| Compteur | Nombre correct de non lues |
| Marquage lu | Statut mis à jour |
| Conformité auto | Notification créée selon échéance |
| Frontend liste | Affichage correct |
| Cloche | Dropdown + badge fonctionnels |

---

## 8. Dépannage

### Erreur "relation notifications does not exist"
→ La migration n'a pas été exécutée. Relancer la migration 010.

### Erreur "function creer_notification does not exist"
→ Les fonctions n'ont pas été créées. Vérifier la migration.

### Badge ne s'affiche pas
→ Vérifier que l'API `/api/notifications/compteur` retourne des données

### Notifications ne s'affichent pas
→ Vérifier les headers `x-user-id` dans les requêtes API

---

**Date création** : Mars 2026
