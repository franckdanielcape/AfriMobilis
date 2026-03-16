# 💰 TEST PHASE 5 - Rentabilité Propriétaire

## 1. Exécuter la Migration SQL

```sql
\i packages/database/migrations/013_rentabilite_proprietaire.sql
```

## 2. Vérifier les Fonctions

```sql
\df get_rentabilite_proprietaire
\df get_versements_par_mois
\df get_performance_vehicules
\df get_pannes_par_type
```

## 3. Tests Manuelles

### Test 1 : Créer des données de test

```sql
-- Créer des versements pour un propriétaire
INSERT INTO versements (vehicule_id, montant_attendu, montant_recu, date_attendue, statut)
SELECT 
    v.id,
    50000,
    50000,
    CURRENT_DATE - (random() * 30)::INTEGER,
    'recu'
FROM vehicules v
WHERE v.proprietaire_id = 'PROPRIETAIRE_ID'
LIMIT 5;

-- Créer des pannes
INSERT INTO pannes (vehicule_id, type_panne, description, cout_reparation, date_declaration, statut)
SELECT 
    v.id,
    'moteur',
    'Problème de démarrage',
    75000,
    CURRENT_DATE - 10,
    'resolu'
FROM vehicules v
WHERE v.proprietaire_id = 'PROPRIETAIRE_ID'
LIMIT 2;
```

### Test 2 : API Rentabilité

```bash
curl -H "x-user-id: PROPRIETAIRE_ID" \
  "http://localhost:4000/api/proprietaire/rentabilite?periode=annee"
```

### Test 3 : Dashboard

1. Se connecter comme propriétaire
2. Aller sur `/dashboard/proprietaire/rentabilite`
3. Vérifier :
   - [ ] Les KPIs s'affichent (revenus, taux recouvrement, etc.)
   - [ ] Le graphique des versements fonctionne
   - [ ] Le tableau des véhicules s'affiche
   - [ ] Les filtres par période fonctionnent

## 4. KPIs Attendus

| KPI | Description |
|-----|-------------|
| Revenus reçus | Somme des versements reçus |
| Taux de recouvrement | (Reçus / Attendus) × 100 |
| Versements en retard | Nombre et montant |
| Coût des pannes | Total des réparations |
| Bénéfice net | Revenus - Coût pannes |

## 5. URLs

| URL | Rôle | Fonction |
|-----|------|----------|
| `/dashboard/proprietaire/rentabilite` | Propriétaire | Dashboard rentabilité |
| `/api/proprietaire/rentabilite` | API | Stats complètes |

---

**Phase 5 prête ! MVP COMPLET !** 🎉
