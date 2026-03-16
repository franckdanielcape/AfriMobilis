# 🔍 TEST PHASE 3 - Matching Objets Perdus

## 1. Exécuter la Migration SQL

```sql
\i packages/database/migrations/012_matching_objets_perdus.sql
```

## 2. Vérifier les Tables

```sql
\d objets_perdus
\d objets_trouves
\dv vue_correspondances_potentielles
```

## 3. Tests

### Test 1 : Déclarer un objet perdu (Passager)
```bash
curl -X POST http://localhost:4000/api/objets/perdus \
  -H "Content-Type: application/json" \
  -d '{
    "categorie": "telephone",
    "description": "iPhone 13 noir avec coque bleue",
    "couleur": "noir",
    "lieu_perte": "Taxi Grand-Bassam centre",
    "date_perte": "2026-03-15"
  }'
```

### Test 2 : Déclarer un objet trouvé
```bash
curl -X POST http://localhost:4000/api/objets/trouves \
  -H "Content-Type: application/json" \
  -d '{
    "categorie": "telephone",
    "description": "iPhone noir trouvé sur la banquette arrière",
    "couleur": "noir",
    "lieu_trouve": "Taxi Grand-Bassam",
    "date_trouve": "2026-03-15",
    "lieu_depose": "Syndicat Grand-Bassam"
  }'
```

### Test 3 : Voir les correspondances (Admin)
```bash
curl http://localhost:4000/api/objets/matching \
  -H "x-user-id: ADMIN_ID"
```

### Test 4 : Confirmer un match
```bash
curl -X POST http://localhost:4000/api/objets/matching \
  -H "Content-Type: application/json" \
  -H "x-user-id: ADMIN_ID" \
  -d '{
    "objet_perdu_id": "ID_PERDU",
    "objet_trouve_id": "ID_TROUVE"
  }'
```

## 4. URLs Frontend

| URL | Rôle | Fonction |
|-----|------|----------|
| `/objets` | Public | Liste objets trouvés |
| `/dashboard/objets/admin` | Admin | Matching et gestion |

## 5. Workflow

```
Objet Perdu → Système calcule correspondances → Admin confirme match
                                                   ↓
                                          Notification passager
                                                   ↓
                                          Rendu physiquement
                                                   ↓
                                          Admin marque "rendu"
```

---

**Phase 3 prête !** 🚀
