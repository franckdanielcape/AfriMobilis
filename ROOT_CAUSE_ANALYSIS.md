# 🔬 Analyse Racine - Problème de Crash du Site

## Date : Mars 2026

---

## 🚨 Problème constaté

Après suppression du menu "Gestion Équipe", le site ne se charge plus (chargement infini).

---

## 🔍 Diagnostic final

### Cause principale identifiée

**RÉFÉRENCE À UNE PAGE SUPPRIMÉE NON RETIRÉE**

Dans `apps/web/src/app/dashboard/chef-ligne/page.tsx`, ligne 316-318 :

```typescript
<Button variant="secondary" onClick={() => router.push('/dashboard/equipe')}>
    👥 Gestion Équipe
</Button>
```

Cette page `/dashboard/equipe` a été supprimée, mais le bouton y faisait encore référence.

### Pourquoi cela cause un chargement infini

1. Next.js charge le composant `chef-ligne/page.tsx`
2. Le composant compile sans erreur apparente
3. Quand l'utilisateur clique sur le bouton, ou quand Next.js précharge la route...
4. Next.js essaie de résoudre `/dashboard/equipe` qui n'existe plus
5. Cela peut causer :
   - Une boucle de redirection
   - Une erreur de routage silencieuse
   - Un blocage du rendu

### Facteurs aggravants

1. **Cache agressif de Next.js** : Le fichier compilé gardait l'ancienne référence
2. **Hot Module Replacement** : Le HMR n'a pas correctement patché le changement
3. **Structure de hooks** : L'ordre des hooks rendait le composant fragile

---

## ✅ Solutions appliquées

### 1. Correction immédiate

Remplacé la référence à `/dashboard/equipe` par des liens valides :

```typescript
<Button variant="secondary" onClick={() => router.push('/dashboard/chef-ligne?tab=agents')}>
    👮 Agents Terrain
</Button>
<Button onClick={() => router.push('/dashboard/vehicules')}>
    🚗 Véhicules
</Button>
```

### 2. Configuration webpack

Modifié `next.config.js` pour désactiver le cache en dev :

```javascript
webpack: (config, { dev }) => {
  if (dev) {
    config.cache = false;
  }
  return config;
}
```

### 3. Script de démarrage fiable

Créé `start-safe.bat` qui nettoie tous les caches avant démarrage.

---

## 🛡️ Prévention des régressions

### Checklist avant suppression d'une page

- [ ] Rechercher toutes les références à cette page dans le code
- [ ] Mettre à jour tous les `router.push('/ancienne-page')`
- [ ] Mettre à jour tous les `<Link href="/ancienne-page">`
- [ ] Mettre à jour les menus de navigation
- [ ] Tester avec nettoyage de cache complet
- [ ] Vérifier les redirections automatiques

### Commande de recherche

```powershell
# Rechercher toutes les références à une page avant suppression
grep -r "/dashboard/equipe" apps/web/src/
```

---

## 📝 Leçons apprises

1. **Next.js est sensible aux références manquantes** - même si ça compile, ça peut casser au runtime
2. **Le cache HMR est traître** - il faut souvent tout nettoyer pour être sûr
3. **Les boutons router.push() sont aussi importants que les liens** - ne pas oublier de les mettre à jour
4. **Toujours tester après suppression** - même une "simple" suppression peut casser

---

## 🔧 Procédure standard de modification

```powershell
# 1. Faire la modification
# ...

# 2. Nettoyer le cache
Remove-Item -Path 'apps/web/.next' -Recurse -Force

# 3. Redémarrer
npm run dev

# 4. Tester en navigation privée (Ctrl+Maj+N)
```

---

*Document créé par : Développement AfriMobilis*  
*Date : Mars 2026*
