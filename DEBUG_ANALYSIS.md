# 🔍 ANALYSE COMPLÈTE DES PROBLÈMES

## Date d'analyse : Mars 2026

---

## 🎯 PROBLÈME CONSTSTANT

Chaque modification du code provoque un plantage du site (chargement infini).

---

## 🔍 CAUSES IDENTIFIÉES

### 1. PROBLÈME MAJEUR : Ordre des Hooks React

**Fichiers concernés :**
- `apps/web/src/app/dashboard/page.tsx` ✅ (corrigé - version simplifiée)
- `apps/web/src/app/dashboard/chef-ligne/page.tsx` ⚠️ (à vérifier)
- `apps/web/src/app/dashboard/layout.tsx` ✅ (corrigé - version simplifiée)

**Anomalie détectée :**
Dans `chef-ligne/page.tsx` :
```typescript
// Ligne 150 - Fonction définie APRÈS useEffect
const fetchDashboardData = async (zoneId?: string) => {
    // ...
};
```

Cette fonction est utilisée dans le useEffect (ligne 131) mais définie après.
Ce n'est pas un problème en soi car les fonctions peuvent être définies après,
mais c'est un pattern risqué.

### 2. PROBLÈME : Suppression de fichiers sans nettoyage des références

**Action problématique :**
- Suppression du dossier `apps/web/src/app/dashboard/equipe/`
- Mais le menu dans `layout.tsx` faisait référence à `/dashboard/equipe`

**Conséquence :**
Next.js essaie de précharger la route `/dashboard/equipe` qui n'existe plus,
ce qui peut causer des erreurs 404 silencieuses ou des boucles de redirection.

### 3. PROBLÈME : Cache navigateur persistant

**Symptômes :**
- Firefox et Chrome gardent les anciennes versions
- Même après Ctrl+F5, le problème persiste
- Le site fonctionne uniquement en navigation privée parfois

**Cause :**
Next.js utilise un système de cache agressif avec Service Workers.
Les fichiers `.next` cache peuvent persister même après redémarrage.

### 4. PROBLÈME : Dépendances circulaires ou manquantes

**Fichier :** `apps/web/src/lib/stats.ts`
- Appelle Supabase avec des requêtes complexes
- Si les tables n'existent pas, les erreurs sont silencieuses (try/catch)
- Mais cela peut causer des retards ou des comportements imprévisibles

---

## ✅ SOLUTIONS DÉFINITIVES

### Solution 1 : Nettoyage complet systématique

```powershell
# Script à exécuter AVANT chaque test
taskkill /F /IM node.exe
taskkill /F /IM npm.exe
Remove-Item -Path 'apps/web/.next' -Recurse -Force
Remove-Item -Path 'apps/web/node_modules/.cache' -Recurse -Force
# Vider le cache localStorage du navigateur aussi
```

### Solution 2 : Structure React rigide

Tous les composants doivent suivre ce pattern EXACT :

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function Component() {
  // 1. useState (tous en premier)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 2. useEffect (tous ensuite)
  useEffect(() => {
    loadData();
  }, []);
  
  // 3. Fonctions (après useEffect)
  const loadData = async () => {
    // ...
  };
  
  // 4. Return (dernier)
  return ( ... );
}
```

### Solution 3 : Gestion des erreurs robuste

Chaque appel API doit avoir :
- Un try/catch
- Un état de chargement
- Une valeur par défaut en cas d'erreur
- Un timeout pour éviter les blocages

---

## 🧪 TEST DE VALIDATION

Pour vérifier que tout fonctionne :

1. Exécuter le script de nettoyage complet
2. Démarrer le serveur
3. Ouvrir http://localhost:3000/dashboard?v=1 (paramètre anti-cache)
4. Vérifier dans la console DevTools qu'il n'y a pas d'erreurs React
5. Tester chaque lien du menu

---

## 📋 CONCLUSION

Le problème principal est une combinaison de :
1. Hooks React mal ordonnés (règle fondamentale de React violée)
2. Cache persistant (navigateur + Next.js)
3. Suppression de fichiers sans mise à jour des références

**Recommandation :**
- Revenir à une version MINIMALE qui fonctionne
- Reconstruire progressivement en testant à chaque étape
- Ne jamais modifier plusieurs fichiers sans tester entre chaque

---

**Analyste :** Développement AfriMobilis  
**Date :** Mars 2026
