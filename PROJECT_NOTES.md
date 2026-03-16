# 📝 NOTES DE PROJET - AfriMobilis

> Ce fichier contient les informations essentielles à ne pas oublier pour avancer efficacement sur le projet.

---

## 🎯 CONTEXTE ACTUEL

**Date de dernière mise à jour :** Mars 2026  
**Projet :** AfriMobilis - Plateforme de gestion des taxis communaux (Grand-Bassam, Côte d'Ivoire)  
**Stack :** Next.js 14, React 18, TypeScript, Supabase Auth/DB

### Rôles utilisateurs (hiérarchie)
1. **super_admin** - Accès complet à la plateforme
2. **chef_ligne** = **admin_syndicat** (même rôle, même menu)
3. **proprietaire** - Sa flotte et ses chauffeurs
4. **chauffeur** - Ses versements, pannes, tickets
5. **passager** - Tickets et objets perdus

### Format des téléphones
- Format : `225` prefix (ex: 2250708124233)
- Auth Email : `{phone}@afrimobilis.local`

---

## ⚠️ STABILITÉ DU CODE - CONSULTER AVANT TOUTE MODIFICATION

### 📁 Fichiers de référence OBLIGATOIRES
Avant de modifier quoi que ce soit, lire :
1. **`DEVELOPMENT_RULES.md`** - Règles de développement
2. **`ERRORS_FIXED.md`** - Erreurs déjà corrigées (ne pas répéter)
3. Ce fichier (`PROJECT_NOTES.md`) - Contexte du projet

### Problème identifié (Mars 2026)
Chaque modification cassait le site car les hooks React étaient mal ordonnés.

### Solution définitive appliquée
- ✅ Réorganisation stricte : `useState` → `useEffect` → fonctions → return
- ✅ Fichier `DEVELOPMENT_RULES.md` créé avec les règles à suivre
- ✅ Checklist avant chaque commit

### Règle d'or React (À NE JAMAIS OUBLIER)
```typescript
function Composant() {
  // 1. TOUS les useState en PREMIER
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  
  // 2. TOUS les useEffect en DEUXIÈME
  useEffect(() => { ... }, []);
  
  // 3. Fonctions internes en TROISIÈME
  const maFonction = () => { ... };
  
  // 4. Return à la fin
  return ( ... );
}
```

## 🚫 RÈGLE D'OR : PAS DE DONNÉES FICTIVES

**Depuis mars 2026 :** Toutes les données affichées doivent venir de la base Supabase.
- ✅ Valeurs réelles uniquement
- ✅ Afficher "0" ou "Chargement..." pendant le fetch
- ✅ Jamais de valeurs hardcodées (42, 5, 10, etc.)
- ✅ Redirection vers /login si pas de session (pas de mode démo)

## ✅ FONCTIONNALITÉS DÉJÀ IMPLÉMENTÉES

### Dashboard & Navigation
- [x] Collapsible Sidebar avec toggle (☰/✕)
- [x] Redirection selon le rôle
- [x] Bouton "C'est mon véhicule" dans le recensement
- [x] Gestion des rôles multiples (Super Admin + Propriétaire)

### RLS & Base de données
- [x] Politique permissive pour INSERT sur `profiles` (recensement)
- [x] Politique permissive pour INSERT sur `vehicules`
- [x] Table `user_roles` pour gérer les rôles multiples
- [x] Trigger pour ajouter automatiquement le rôle propriétaire

### Pages fonctionnelles
- [x] Dashboard Super Admin avec KPIs
- [x] Dashboard Chef de Ligne avec stats
- [x] Page Recensement simplifiée (2 étapes)
- [x] Page Gestion Équipe avec données réelles
- [x] Stats cliquables sur Gestion Équipe (véhicules, chauffeurs, contrôles)

### Documentation créée
- [x] `DEVELOPMENT_RULES.md` - Règles de développement
- [x] `ERRORS_FIXED.md` - Erreurs corrigées
- [x] `CHECKLIST.md` - Checklist pré-développement
- [ ] ~~`GESTION_EQUIPE.md`~~ - Supprimé (menu retiré)

---

## 🔧 PROBLÈMES RÉSOLUS RÉCEMMENT

### Erreur RLS "new row violates row-level security policy"
**Solution :** Exécuter ce SQL dans Supabase :
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```
OU
```sql
CREATE POLICY "Allow authenticated insert profiles" 
ON profiles FOR INSERT TO authenticated WITH CHECK (true);
```

### Erreur "null value in column id"
**Solution :** Créer le propriétaire via `supabase.auth.signUp()` au lieu d'un INSERT direct dans profiles. Cela génère automatiquement l'ID.

### Boucle de chargement infinie
**Causes fréquentes :**
- Cache navigateur (Ctrl+F5 ou navigation privée)
- Dépendances manquantes dans useEffect
- Erreur de syntaxe dans le fichier

---

## 🚧 TÂCHES EN COURS / À FAIRE

### Priorité Haute
- [ ] Tester le recensement complet (proprio + véhicule)
- [ ] Vérifier que les véhicules créés s'affichent dans la liste
- [ ] Confirmer que le rôle propriétaire est bien ajouté

### Priorité Moyenne
- [ ] Ajouter la gestion des syndicats/lignes dans le recensement
- [ ] Implémenter l'ajout de chauffeur au recensement
- [ ] Créer une page de gestion des véhicules pour propriétaire

### Priorité Basse
- [ ] Améliorer le design du recensement
- [ ] Ajouter des validations de formulaire
- [ ] Implémenter la recherche de propriétaire existant

---

## 💡 PRÉFÉRENCES UTILISATEUR

### Design
- Préfère le design **simple et fonctionnel** (pas trop de styles complexes)
- Couleurs : vert (#10b981) pour succès, bleu (#0ea5e9) pour actions, rouge pour erreurs
- Layout : max-width 500px, centré, padding 20px

### Méthode de travail
- Veut avancer **sans répétitions** inutiles
- Préfère les solutions qui **marchent** plutôt que les solutions parfaites
- Veut être informé des erreurs exactes pour déboguer rapidement

### Navigation
- Utilise principalement le **mode Super Admin via localStorage**
- Email Super Admin : franckdanielcape@gmail.com
- Téléphone : 2250708124233

---

## 🔗 URLS IMPORTANTES

- **Dashboard :** http://localhost:3000/dashboard
- **Recensement :** http://localhost:3000/dashboard/admin/recensement
- **Supabase Dashboard :** (à compléter avec l'URL du projet)

---

## 📂 FICHIERS CLÉS

| Fichier | Description |
|---------|-------------|
| `apps/web/src/app/dashboard/admin/recensement/page.tsx` | Page de recensement (simplifiée) |
| `packages/database/migrations/003_rls_policies.sql` | Politiques RLS |
| `fix_rls_definitif.sql` | Script SQL pour corriger RLS |
| `PROJECT_NOTES.md` | Ce fichier - notes importantes |

---

## 🐛 ERREURS CONNUES ET SOLUTIONS

### "Ce site est inaccessible" / ERR_CONNECTION_REFUSED
1. Vérifier que le serveur est démarré : `npm run dev`
2. Tuer les processus node : `taskkill /F /IM node.exe`
3. Vider le cache : Supprimer `apps/web/.next`
4. Redémarrer le serveur

### "new row violates row-level security policy" sur profiles
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### "new row violates row-level security policy" sur vehicules
```sql
ALTER TABLE vehicules DISABLE ROW LEVEL SECURITY;
```

### "user_roles_user_id_fkey" constraint violation (trigger ou contrainte FK)
```sql
-- Option 1: Supprimer la contrainte foreign key
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Option 2: Désactiver le trigger qui ajoute automatiquement
DROP TRIGGER IF EXISTS tr_add_proprietaire_role ON vehicules;
```

### "null value in column id"
Utiliser `supabase.auth.signUp()` pour créer le propriétaire (génère l'ID auto)

---

## ✅ CHECKLIST AVANT TEST

À vérifier avant de dire "c'est bon" :
- [ ] Serveur Next.js démarré (npm run dev)
- [ ] SQL RLS exécuté dans Supabase
- [ ] Cache navigateur vidé (Ctrl+F5)
- [ ] Console DevTools ouverte pour voir les erreurs

---

**Dernière modification :** Génération automatique du fichier de notes
