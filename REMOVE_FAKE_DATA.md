# 🧹 PLAN DE SUPPRESSION DES DONNÉES FICTIVES

## Objectif
Toutes les données affichées doivent venir de la base de données Supabase, jamais de valeurs hardcodées.

## Fichiers à corriger

### 1. `apps/web/src/app/dashboard/page.tsx`
- [ ] Ligne 222 : `<div className={styles.statValue}>42</div>` → Remplacer par données API
- [ ] Lignes 216-266 : `renderAdminSyndicatKPIs()` avec valeurs en dur (42, 3, 5)
- [ ] Lignes 242-266 : `renderProprietaireKPIs()` avec valeurs en dur (5, 125000, 1)

### 2. `apps/web/src/app/dashboard/layout.tsx`
- [ ] Lignes 210-216 : `DEFAULT_USER` → Doit charger depuis Supabase uniquement
- [ ] Lignes 234, 272, 314 : Utilisation de DEFAULT_USER → Rediriger vers login si pas de session

### 3. `apps/web/src/app/marketplace/page.tsx`
- [ ] Lignes 31-36 : Annonces `dummy-1` et `dummy-2` → Charger depuis table `annonces`

### 4. `apps/web/src/app/dashboard/admin/recensement/page.tsx`
- [ ] Ligne 19 : `setPhone('2250708124233')` → Laisser vide par défaut

### 5. Autres composants avec données fictives
- [ ] Vérifier tous les composants avec des valeurs comme "42", "5", "3" en dur
- [ ] Remplacer par des fetch API ou des props depuis le parent

## Règles dorées
1. **Jamais de valeurs hardcodées** (42, 5, 10, etc.)
2. **Toujours afficher 0 ou "Chargement..."** pendant le fetch
3. **Gérer les erreurs** avec des messages clairs
4. **Sauvegarder les données** dans le state pour éviter les re-fetch inutiles
