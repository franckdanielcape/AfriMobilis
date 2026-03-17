# Guide Complet de Déploiement Vercel

> Ce fichier contient toutes les solutions aux problèmes courants de déploiement sur Vercel, basé sur des recherches approfondies et des cas réels résolus.

---

## Table des matières

1. [Déploiement HTML Statique (Sans Build)](#1-déploiement-html-statique-sans-build)
2. [Problème "No Next.js version detected"](#2-problème-no-nextjs-version-detected)
3. [Configuration vercel.json](#3-configuration-verceljson)
4. [Monorepo / Turborepo](#4-monorepo--turborepo)
5. [Erreurs Courantes et Solutions](#5-erreurs-courantes-et-solutions)
6. [Configuration Dashboard Vercel](#6-configuration-dashboard-vercel)

---

## 1. Déploiement HTML Statique (Sans Build)

### Structure minimale requise

```
project/
├── index.html          # Fichier HTML principal
├── (optionnel) vercel.json
└── (optionnel) package.json vide
```

### IMPORTANT : Pas de vercel.json pour HTML pur

Pour un site HTML statique simple, **NE METTEZ PAS de vercel.json** ou utilisez une configuration minimale. Le fichier `vercel.json` avec `builds` est souvent rejeté comme "invalide" pour les projets simples.

### Solution recommandée (HTML pur)

**index.html** :
```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AfriMobilis</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            color: white; 
            text-align: center; 
            padding: 50px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        h1 { font-size: 3rem; }
    </style>
</head>
<body>
    <div>
        <h1>🚕 AfriMobilis</h1>
        <p>Plateforme de gestion de taxis pour Grand-Bassam</p>
        <p>Site en construction</p>
    </div>
</body>
</html>
```

**package.json** (optionnel mais recommandé) :
```json
{
  "name": "afrimobilis-static",
  "version": "1.0.0",
  "private": true
}
```

### Configuration Dashboard Vercel

| Setting | Valeur |
|---------|--------|
| Framework Preset | **Other** (PAS Next.js) |
| Build Command | (laisser vide) |
| Output Directory | (laisser vide) |
| Install Command | (laisser vide) |

---

## 2. Problème "No Next.js version detected"

### Causes identifiées

1. **Conflit package-lock.json / pnpm-lock.yaml / yarn.lock**
   - Solution : N'utiliser qu'un seul type de lockfile
   - Supprimer les lockfiles en conflit

2. **Root Directory mal configuré**
   - Dans monorepo : doit pointer vers le dossier contenant le package.json de l'app
   - Exemple : `apps/web` ou `client/apps/web`

3. **Package manager non détecté**
   - Ajouter dans package.json racine :
   ```json
   {
     "packageManager": "npm@9.8.1"
   }
   ```

4. **Cache Vercel corrompu**
   - Redéployer sans cache : `vercel --force`

### Solutions par scénario

#### Scénario A : Projet simple avec Next.js

```json
// package.json
{
  "dependencies": {
    "next": "14.2.15",
    "react": "^18",
    "react-dom": "^18"
  },
  "scripts": {
    "build": "next build"
  }
}
```

#### Scénario B : Monorepo avec npm workspaces

```json
// package.json racine
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "packageManager": "npm@9.8.1"
}
```

Settings Vercel :
- Root Directory : `apps/web`
- Build Command : `npm install --prefix=../.. && npm run build`

#### Scénario C : Monorepo avec pnpm

```json
// package.json racine
{
  "private": true,
  "packageManager": "pnpm@8.15.0"
}
```

Settings Vercel :
- Root Directory : `apps/web`
- Build Command : `pnpm i -r && pnpm run build`

---

## 3. Configuration vercel.json

### Quand utiliser vercel.json ?

| Cas d'usage | Nécessaire ? |
|-------------|--------------|
| HTML statique simple | ❌ Non |
| Next.js standard | ❌ Non (zero-config) |
| Rewrites/Redirects | ✅ Oui |
| Headers personnalisés | ✅ Oui |
| Multi-builds (API + Frontend) | ✅ Oui |

### Exemples valides

#### Rewrites simples
```json
{
  "rewrites": [
    { "source": "/about", "destination": "/about.html" }
  ]
}
```

#### Headers sécurité
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

#### Build statique avec output personnalisé
```json
{
  "version": 2,
  "outputDirectory": "dist"
}
```

### ⚠️ ERREURS À ÉVITER

```json
// ❌ INVALIDE - builds avec @vercel/static causent souvent des erreurs
{
  "builds": [
    { "src": "index.html", "use": "@vercel/static" }
  ]
}

// ✅ CORRECT - Pour HTML statique, ne pas utiliser builds
// Laissez Vercel détecter automatiquement ou utilisez "framework": null
{
  "version": 2,
  "public": true
}
```

---

## 4. Monorepo / Turborepo

### Structure typique

```
monorepo/
├── apps/
│   ├── web/           # Next.js app
│   └── api/           # Express API
├── packages/
│   ├── ui/            # Shared UI
│   └── utils/         # Shared utils
├── package.json       # Racine
└── turbo.json
```

### Configuration Vercel pour Turborepo

1. **Root Directory** : `apps/web` (ou votre app Next.js)

2. **Build Command** selon package manager :
   - npm : `npm install --prefix=../.. && npm run build`
   - pnpm : `pnpm i -r && pnpm run build`
   - yarn : `yarn install && yarn build`

3. **Environment Variables** :
   ```
   ENABLE_EXPERIMENTAL_COREPACK=1
   ```

### package.json racine recommandé

```json
{
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "npm@9.8.1"
}
```

---

## 5. Erreurs Courantes et Solutions

### Erreur : "Fichier vercel.json invalide fourni"

**Causes** :
- Syntaxe JSON invalide
- Propriété `builds` avec `@vercel/static` (déprécié pour HTML simple)
- Propriété `functions` (non supportée dans vercel.json)

**Solutions** :
1. Valider le JSON : https://jsonlint.com/
2. Pour HTML simple : supprimer vercel.json
3. Pour config avancée : utiliser uniquement `rewrites`, `redirects`, `headers`

### Erreur : "No Output Directory named 'build' found"

**Solution** :
- Next.js : Output Directory = `.next`
- CRA : Output Directory = `build`
- Vite : Output Directory = `dist`
- HTML statique : Output Directory = (vide) ou `public`

### Erreur : Build qui tourne indéfiniment

**Causes possibles** :
- Memory limit atteinte (ajouter `NODE_OPTIONS=--max-old-space-size=4096`)
- Dépendances circulaires
- TypeScript errors en mode strict

**Solutions** :
```json
// next.config.js
module.exports = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true }
}
```

---

## 6. Configuration Dashboard Vercel

### Checklist avant déploiement

- [ ] Framework Preset correct (Next.js / Other / etc.)
- [ ] Root Directory pointe vers le bon dossier
- [ ] Variables d'environnement configurées
- [ ] Pas de conflit de lockfiles
- [ ] package.json valide avec "name" et "version"

### Variables d'environnement utiles

```bash
# Pour debug
VERCEL_BUILD_SYSTEM_REPORT=1

# Pour mémoire
NODE_OPTIONS=--max-old-space-size=4096

# Pour corepack
ENABLE_EXPERIMENTAL_COREPACK=1
```

---

## Références

- Documentation officielle : https://vercel.com/docs
- Configuration builds : https://vercel.com/docs/builds/configure-a-build
- Troubleshooting : https://vercel.com/docs/deployments/troubleshoot-a-build
- Zero Config : https://vercel.com/blog/zero-config

---

*Dernière mise à jour : Mars 2026*
