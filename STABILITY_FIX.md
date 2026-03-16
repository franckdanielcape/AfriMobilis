# 🔧 PLAN DE STABILISATION - AfriMobilis

## 🚨 Problème racine identifié

Le problème n'est pas dans la suppression du menu "Gestion Équipe" en soi, mais dans **le cache agressif de Next.js combiné à des dépendances de hooks manquantes**.

---

## 🎯 Analyse détaillée

### 1. Dépendances useEffect incorrectes

Dans `chef-ligne/page.tsx` ligne 148 :
```typescript
useEffect(() => {
    init();
}, []);  // eslint-disable-line react-hooks/exhaustive-deps
```

Le commentaire ESLint indique que des dépendances sont ignorées. Cela peut causer :
- Des valeurs obsolètes dans les callbacks
- Des comportements imprévisibles lors des hot reloads

### 2. Fonction définie après utilisation

Ligne 131 : `await fetchDashboardData(...)`  
Ligne 150 : `const fetchDashboardData = async ...`

Bien que JavaScript permette cela (hoisting), React hooks sont sensibles à l'ordre d'exécution.

### 3. Cache Next.js

Next.js 14 garde en cache :
- Les composants compilés (`.next/`)
- Les modules Hot Module Replacement (HMR)
- Les chunks de route

Quand un fichier est modifié, le HMR essaie de patcher, mais peut échouer silencieusement.

---

## ✅ SOLUTIONS DÉFINITIVES

### Solution A : Nettoyage automatique avec script (IMMÉDIAT)

Créer un script qui nettoie AVANT chaque démarrage.

### Solution B : Structure React standardisée (LONG TERME)

Refactoriser tous les composants pour suivre un pattern strict.

### Solution C : Désactiver le cache en dev (WORKAROUND)

Modifier `next.config.js` pour désactiver le cache en développement.

---

## 🚀 MISE EN ŒUVRE IMMÉDIATE

### Étape 1 : Créer un next.config.js safe
