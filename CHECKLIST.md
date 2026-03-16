# ✅ CHECKLIST PRÉ-DÉVELOPPEMENT

> **À cocher avant chaque session de développement**

---

## Phase 1 : Préparation (OBLIGATOIRE)

- [ ] Lu le fichier `DEVELOPMENT_RULES.md`
- [ ] Lu le fichier `ERRORS_FIXED.md`
- [ ] Vérifié dans `PROJECT_NOTES.md` si le contexte n'a pas changé

---

## Phase 2 : Avant modification

- [ ] Identifier tous les hooks dans le fichier cible
- [ ] Planifier l'ordre : useState → useEffect → fonctions → return
- [ ] S'assurer qu'aucun hook ne sera ajouté après une fonction

---

## Phase 3 : Après modification

- [ ] Vérifier visuellement l'ordre des hooks
- [ ] Tous les `useState` sont-ils au début ?
- [ ] Tous les `useEffect` sont-ils après les useState ?
- [ ] Les fonctions internes sont-elles après tous les hooks ?
- [ ] Aucun `return` prématuré avant les hooks ?

---

## Phase 4 : Test

- [ ] Nettoyer le cache : `Remove-Item -Path 'apps/web/.next' -Recurse -Force`
- [ ] Redémarrer le serveur
- [ ] Tester en navigation privée (Ctrl + Maj + N)
- [ ] URL avec anti-cache : `http://localhost:3000/...?v=2`
- [ ] Vérifier que la page charge
- [ ] Vérifier que tous les boutons fonctionnent
- [ ] Vérifier qu'il n'y a pas de données fictives (42, 5, 10, etc.)

---

## Phase 5 : Validation

- [ ] Pas d'erreur dans la console DevTools
- [ ] Pas de warning React sur les hooks
- [ ] Les données affichées sont réelles (depuis Supabase)

---

**Si une case n'est pas cochée, ne pas continuer !**

---

## 🆘 En cas de problème

1. Arrêter immédiatement
2. Vérifier l'ordre des hooks dans le fichier modifié
3. Consulter `ERRORS_FIXED.md` pour la solution
4. Appliquer la correction
5. Recommencer la checklist depuis le début

---

**Dernière mise à jour :** Mars 2026
