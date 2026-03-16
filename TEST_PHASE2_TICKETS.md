# 🎫 TEST PHASE 2 - Workflow Tickets Passagers

## 1. Exécuter la Migration SQL

Dans Supabase SQL Editor :

```sql
\i packages/database/migrations/011_workflow_tickets.sql
```

## 2. Vérifier les Fonctions

```sql
-- Vérifier les fonctions créées
\df changer_statut_ticket
\df ajouter_commentaire_ticket
\df get_stats_tickets

-- Vérifier la vue
\dv vue_tickets_complets

-- Vérifier la table
\d ticket_comments
```

## 3. Tests du Workflow

### Test 1 : Créer un ticket (en tant que passager)

1. Se connecter comme passager
2. Aller sur `/dashboard/tickets`
3. Créer une réclamation
4. Vérifier que le statut est "soumis"

### Test 2 : Traiter le ticket (en tant qu'admin)

1. Se connecter comme Chef de Ligne
2. Aller sur `/dashboard/tickets/admin`
3. Voir le ticket dans "Nouveaux"
4. Cliquer "Voir" puis "Prendre en charge"
5. Vérifier que le statut passe à "en_cours"

### Test 3 : Ajouter un commentaire

1. Dans le modal du ticket
2. Ajouter un commentaire
3. Vérifier qu'il apparaît dans l'historique

### Test 4 : Résoudre le ticket

1. Cliquer "Marquer comme résolu"
2. Ajouter des notes de résolution
3. Vérifier que le statut passe à "resolu"

### Test 5 : Notification automatique

1. Vérifier que le passager a reçu une notification
2. Aller sur `/dashboard/notifications`
3. Voir la notification "Votre ticket est en cours de traitement"

## 4. URLs à Tester

| URL | Rôle | Fonction |
|-----|------|----------|
| `/dashboard/tickets` | Passager | Créer/voir ses tickets |
| `/dashboard/tickets/admin` | Chef de Ligne | Gérer tous les tickets |
| `/api/tickets/admin` | API | Liste/maj tickets |
| `/api/tickets/stats` | API | Stats dashboard |
| `/api/tickets/:id/commentaires` | API | Commentaires |

## 5. Résultats Attendus

- [ ] Workflow complet : soumis → en_cours → resolu/rejete
- [ ] Commentaires fonctionnels
- [ ] Stats dashboard à jour
- [ ] Notifications automatiques
- [ ] Permissions respectées

---

**Phase 2 prête !** 🚀
