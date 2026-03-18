# Guide Complet : Vite vs Next.js pour Vercel

> Basé sur des recherches approfondies et l'analyse du projet AfriMobilis

---

## 📊 Comparaison Rapide

| Critère | Vite + React | Next.js |
|---------|-------------|---------|
| **Vitesse de build** | ⚡ Ultra rapide | 🐌 Plus lent |
| **Complexité** | ✅ Simple | ❌ Complexe |
| **Déploiement Vercel** | ✅ Zero-config | ⚠️ Config requise |
| **SEO** | ❌ Manuel | ✅ Automatique |
| **API Routes** | ❌ Séparé | ✅ Intégré |
| **SSR/SSG** | ❌ Non natif | ✅ Natif |
| **Taille bundle** | ✅ Petit | 🟡 Plus grand |
| **Hot Reload** | ⚡ Instantané | 🟡 Rapide |

---

## 🎯 Recommandation pour AfriMobilis

### ✅ Convertir en Vite + React

**Pourquoi c'est l'idéal pour votre cas :**

1. **Déploiement simplifié** - Vite génère des fichiers statiques (HTML/CSS/JS) que Vercel sert directement
2. **Pas de `vercel.json` complexe** - Plus d'erreurs "fichier invalide"
3. **Build rapide** - Quelques secondes vs plusieurs minutes pour Next.js
4. **Pas de SSR inutile** - Votre app est un dashboard (derrière auth), pas besoin de SEO
5. **Compatible avec votre API** - L'API est déjà séparée (apps/api)

---

## 🔧 Plan de Migration Next.js → Vite

### Étape 1 : Créer la structure Vite

```
AfriMobilis/
├── apps/
│   ├── api/           # Gardé tel quel (Express)
│   └── web-vite/      # NOUVEAU - Vite + React
│       ├── src/
│       ├── index.html
│       └── vite.config.ts
└── ...
```

### Étape 2 : Configuration Vite minimale

**vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  },
})
```

**package.json**
```json
{
  "name": "afrimobilis-web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.98.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.79",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
```

### Étape 3 : Migration du code

**Changements principaux :**

| Next.js | Vite + React |
|---------|--------------|
| `app/page.tsx` | `src/pages/Home.tsx` |
| `app/layout.tsx` | `src/App.tsx` |
| `app/api/*` | Supprimé (utilise apps/api) |
| `next/link` | `react-router-dom Link` |
| `next/image` | Balise `<img>` standard |
| `use server` | Fetch API standard |

### Étape 4 : Router React

**src/App.tsx**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Admin } from './pages/Admin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Étape 5 : Déploiement Vercel

**Configuration Vercel :**

| Setting | Valeur |
|---------|--------|
| Framework Preset | `Vite` |
| Root Directory | `apps/web-vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

**Pas besoin de `vercel.json` !**

---

## ⚡ Alternative Rapide : Garder Next.js mais simplifier

Si vous voulez garder Next.js, voici la config minimale qui fonctionne :

### Structure requise

```
repo/
├── src/app/           # Code source
├── package.json       # Avec "next" en dep
├── next.config.js     # Config simple
└── public/            # Assets statiques
```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',     // Export statique
  distDir: 'dist',      // Output dans dist/
  images: {
    unoptimized: true,  // Pas d'optimisation d'images
  },
}
module.exports = nextConfig
```

### Limitations

- ❌ Pas de routes API (déjà dans apps/api)
- ❌ Pas de SSR dynamique
- ✅ Que des pages statiques

---

## 🎯 Décision Finale

### Recommandation : **Migrer vers Vite**

**Arguments :**
1. Vos problèmes de déploiement disparaissent immédiatement
2. Build 10x plus rapide
3. Plus simple à maintenir
4. Pas de vendor lock-in Vercel
5. Votre architecture (API séparée) est parfaite pour Vite

**Temps estimé de migration :** 2-4 heures

---

## 📚 Références

- [Vite vs Next.js 2026 - DesignRevision](https://designrevision.com/blog/vite-vs-nextjs)
- [Vite vs Next.js - Strapi](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)

---

*Dernière mise à jour : Mars 2026*
