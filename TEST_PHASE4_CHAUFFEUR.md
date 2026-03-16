# 👨‍✈️ TEST PHASE 4 - Module Chauffeur

## 1. Tests Manuelles

### Test 1 : Voir ses sanctions (Chauffeur)

1. Se connecter comme chauffeur
2. Aller sur `/dashboard/chauffeur/sanctions`
3. Vérifier :
   - [ ] La liste des sanctions s'affiche
   - [ ] Les filtres fonctionnent
   - [ ] Les détails sont visibles (type, motif, date)
   - [ ] Le statut est affiché (en attente/validée)

### Test 2 : Créer une sanction (depuis un autre compte)

1. Se connecter comme Chef de Ligne
2. Créer une sanction pour un chauffeur
3. Se reconnecter comme chauffeur
4. Vérifier que la sanction apparaît dans la liste
5. Vérifier que la notification est reçue

### Test 3 : Validation d'une sanction

1. Chef de Ligne valide la sanction
2. Chauffeur voit le statut changer en "Validée"
3. Vérifier la notification de validation

## 2. API Endpoints

```bash
# Récupérer ses sanctions (chauffeur)
curl -H "x-user-id: CHAUFFEUR_ID" \
  http://localhost:4000/api/chauffeur/sanctions
```

## 3. URLs Frontend

| URL | Rôle | Fonction |
|-----|------|----------|
| `/dashboard/chauffeur/sanctions` | Chauffeur | Voir ses sanctions |

## 4. Vérifications

- [ ] Le chauffeur ne voit que SES sanctions
- [ ] Lecture seule (pas de modification possible)
- [ ] Alertes visuelles pour les sanctions en attente
- [ ] Stats disponibles (total, en attente, validées)

---

**Phase 4 prête !** 🚀
