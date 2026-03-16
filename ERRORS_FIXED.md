# 🐛 ERREURS CORRIGÉES - NE PAS RÉPÉTER

> **Consulter ce fichier avant chaque développement**

---

## Erreur #1 : Plantage à chaque modification

### Symptômes
- Page blanche qui charge indéfiniment
- "Ce site est inaccessible" / ERR_CONNECTION_REFUSED
- Chaque modification casse le site

### Cause racine (Mars 2026)
**Les hooks React étaient mélangés avec des fonctions internes**

### Solution appliquée
Réorganisation stricte des hooks :
1. Tous les `useState` au début
2. Tous les `useEffect` ensuite
3. Les fonctions internes après
4. Le `return` à la fin

### Exemple dans `apps/web/src/app/dashboard/equipe/page.tsx`
```typescript
export default function EquipePage() {
  // 1. TOUS LES USESTATE
  const [activeTab, setActiveTab] = useState('vehicules');
  const [stats, setStats] = useState({ ... });
  
  // 2. TOUS LES USEEFFECT
  useEffect(() => { ... }, []);
  
  // 3. FONCTIONS INTERNES
  const fetchData = async () => { ... };
  
  // 4. RETURN
  return ( ... );
}
```

---

## Erreur #2 : Cache navigateur persistant

### Symptômes
- Modifications non visibles
- Site qui plante malgré le redémarrage du serveur

### Solution
**URL anti-cache :** `http://localhost:3000/dashboard/equipe?v=2`

**Nettoyage complet :**
```powershell
taskkill /F /IM node.exe
Remove-Item -Path 'apps/web/.next' -Recurse -Force
# Puis navigation privée : Ctrl + Maj + N
```

---

## Erreur #3 : Données fictives hardcodées

### Symptômes
- Stats différentes selon les utilisateurs
- Valeurs comme 42, 5, 125000 affichées partout

### Solution
Toutes les données doivent venir de Supabase avec fallback à 0 :
```typescript
const [count, setCount] = useState(0);

useEffect(() => {
  const load = async () => {
    const { count } = await supabase
      .from('table')
      .select('*', { count: 'exact', head: true });
    setCount(count || 0);  // Jamais de valeur hardcodée
  };
  load();
}, []);
```

---

## Erreur #4 : Fuites mémoire avec useEffect

### Symptômes
- Ralentissements
- Comportements imprévisibles

### Solution
Utiliser `isMounted` :
```typescript
useEffect(() => {
  let isMounted = true;
  
  const load = async () => {
    const data = await fetch();
    if (isMounted) setData(data);
  };
  
  load();
  return () => { isMounted = false; };
}, []);
```

---

## Erreur #5 : Données utilisateur hardcodées (CRITIQUE)

### Symptômes
- **Incohérence d'affichage** : Le sidebar affiche "edmond capé" mais le dashboard affiche "Franck"
- **Rôle incorrect** : Un Chef de Ligne voit des menus Super Admin
- **Confusion totale** : Impossible de savoir qui est connecté

### Cause racine (Mars 2026)
**Des valeurs utilisateur étaient écrites en dur dans le code** au lieu d'être récupérées depuis Supabase.

### Fichiers concernés (corrigés)
- `apps/web/src/app/dashboard/page.tsx` - Avait `prenom: 'Franck'` hardcodé
- `apps/web/src/app/dashboard/vehicules/page.tsx` - Avait un mode "superAdminSession" avec Franck hardcodé
- `apps/web/src/app/dashboard/admin/recensement/page.tsx` - Avait `useMe()` avec Franck Daniel hardcodé

### ❌ Code INCORRECT (à ne JAMAIS refaire)
```typescript
// ❌ INTERDIT - Même pour les tests !
if (localStorage.getItem('superAdminSession') === 'true') {
    setUser({
        prenom: 'Franck',        // ← HARDCODÉ !
        nom: 'Daniel',           // ← HARDCODÉ !
        role: 'super_admin'      // ← HARDCODÉ !
    });
    return;
}

// ❌ INTERDIT - Valeurs par défaut hardcodées
setUser({
    prenom: 'Franck',           // ← HARDCODÉ !
    role: 'super_admin'         // ← HARDCODÉ !
});

// ❌ INTERDIT - Données de démo avec vrais noms
const useMe = () => {
    setNom('CAPÉ');
    setPrenom('Franck Daniel');  // ← HARDCODÉ !
    setPhone('2250708124233');   // ← HARDCODÉ !
};
```

### ✅ Code CORRECT (à toujours utiliser)
```typescript
// ✅ OBLIGATOIRE - Récupération depuis Supabase
useEffect(() => {
    const fetchUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            router.push('/login');
            return;
        }

        // Récupérer le profil complet depuis la BDD
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            setUser({
                id: session.user.id,
                email: session.user.email,
                role: profile.role,           // ← Depuis la BDD
                prenom: profile.prenom,       // ← Depuis la BDD
                nom: profile.nom              // ← Depuis la BDD
            });
        } else {
            // Fallback sur métadonnées auth si pas de profil
            setUser({
                id: session.user.id,
                email: session.user.email,
                role: session.user.user_metadata?.role || 'passager',
                prenom: session.user.user_metadata?.prenom || 'Utilisateur',
                nom: session.user.user_metadata?.nom || ''
            });
        }
    };

    fetchUser();
}, []);

// ✅ OBLIGATOIRE - useMe() utilise l'utilisateur connecté
const useMe = () => {
    if (currentUser) {
        setNom(currentUser.nom || '');
        setPrenom(currentUser.prenom || '');
        setPhone(currentUser.phone || '');
    }
};
```

### Pourquoi c'est critique
1. **Sécurité** : N'importe qui pouvait modifier son localStorage pour devenir "Super Admin"
2. **Incohérence** : Le layout affichait un utilisateur, le contenu en affichait un autre
3. **Confusion** : Impossible de tester correctement avec des utilisateurs réels
4. **Maintenance** : Chaque nouvel utilisateur devait modifier le code source

### Checklist de vérification
Avant chaque commit, exécuter :
```bash
# Rechercher les valeurs hardcodées problématiques
grep -r "prenom: 'Franck'\|prenom: 'Super'\|role: 'super_admin'" apps/web/src/app/dashboard/

# Rechercher les références au superAdminSession dans les pages dashboard
grep -r "superAdminSession" apps/web/src/app/dashboard/
```

Si des résultats apparaissent dans les pages (hors login/page.tsx), les corriger immédiatement.

### Règle d'or
> **"JAMAIS de nom, prénom, email ou rôle hardcodé dans les pages dashboard. TOUJOURS récupérer depuis Supabase."**

---

## Procédure de test obligatoire

Avant de dire "c'est bon" :
1. Vérifier l'ordre des hooks
2. Nettoyer le cache
3. Tester en navigation privée
4. Vérifier que tous les boutons cliquables fonctionnent
5. Vérifier que les données sont réelles (pas de 42, 5, etc.)
6. **Vérifier que le nom affiché correspond à l'utilisateur connecté**
7. **Vérifier qu'il n'y a pas d'incohérence entre sidebar et contenu**

---

**Date de création :** Mars 2026  
**Dernière mise à jour :** Mars 2026 (Ajout Erreur #5)
