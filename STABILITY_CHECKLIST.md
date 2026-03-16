# ✅ CHECKLIST DE STABILITÉ

## Règles d'or pour éviter les problèmes de chargement

### 1. ORDRE DES HOOKS (règle React la plus importante)
- ✅ TOUJOURS mettre tous les `useState` au DÉBUT du composant
- ✅ TOUJOURS mettre tous les `useEffect` APRÈS les useState
- ✅ JAMAIS de useState/useEffect après des fonctions internes
- ✅ JAMAIS de useState/useEffect dans des conditions ou boucles

### 2. GESTION DES ERREURS
- ✅ Toujours wrapper les appels API dans try/catch
- ✅ Toujours initialiser les states avec des valeurs par défaut (0, '', [], null)
- ✅ Toujours vérifier si les données existent avant d'y accéder

### 3. NETTOYEMENT AVANT DÉMARRAGE
```bash
taskkill /F /IM node.exe
Remove-Item -Path 'apps/web/.next' -Recurse -Force
npm run dev
```

### 4. PATTERNS À ÉVITER
```typescript
// ❌ MAUVAIS - Hooks mélangés avec des fonctions
function Composant() {
  const [a, setA] = useState(0);
  
  const maFonction = () => { ... }  // Fonction interne
  
  const [b, setB] = useState(0);   // ❌ Hook après fonction = ERREUR
  
  useEffect(() => { ... }, []);
}

// ✅ CORRECT - Tous les hooks d'abord
function Composant() {
  const [a, setA] = useState(0);   // 1. useState
  const [b, setB] = useState(0);   // 2. useState
  
  useEffect(() => { ... }, []);    // 3. useEffect
  useEffect(() => { ... }, []);    // 4. useEffect
  
  const maFonction = () => { ... } // 5. Fonctions internes
  
  return ( ... );
}
```

## Fichiers critiques à vérifier après chaque modification

1. `apps/web/src/app/dashboard/page.tsx` - Dashboard principal
2. `apps/web/src/app/dashboard/layout.tsx` - Layout avec sidebar
3. `apps/web/src/app/dashboard/admin/recensement/page.tsx` - Recensement

## Signes d'alerte
- ⚠️ Page qui charge sans s'ouvrir = probablement une erreur de syntaxe ou ordre des hooks
- ⚠️ Erreur "Rendered fewer/more hooks than expected" = hooks dans des conditions
- ⚠️ Boucle infinie = useEffect sans dépendances correctes

## Procédure de correction rapide
1. Vérifier l'ordre des hooks
2. Vérifier les imports manquants
3. Vérifier les accolades/paranthèses fermantes
4. Nettoyer le cache `.next`
5. Redémarrer le serveur
