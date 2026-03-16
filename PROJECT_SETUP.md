# Configuration du Projet AfriMobilis

## 🚀 Démarrage rapide

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Husky s'installe automatiquement via postinstall
```

### Lancer le projet

```bash
# Frontend (Next.js)
cd apps/web
npm run dev

# Backend API (Express)
cd apps/api
npm run dev
```

---

## 🛡️ Husky - Linting automatique

Husky est configuré pour exécuter le **linter avant chaque commit**.

### Ce qui est vérifié

- ✅ Pas d'apostrophes `'` dans JSX (utiliser `&apos;`)
- ✅ Pas de `console.log/error/warn`
- ✅ Pas de types `any` sauf exception
- ✅ Variables `const` préférées à `let`
- ✅ Code formaté avec Prettier

### Si le commit est bloqué

```bash
# Voir les erreurs
cd apps/web
npm run lint

# Corriger automatiquement ce qui est possible
npm run lint -- --fix
```

### Contourner Husky (urgence uniquement)

```bash
git commit -m "message" --no-verify
```

---

## 📁 Structure des dossiers

```
AfriMobilis/
├── apps/
│   ├── web/                 # Frontend Next.js
│   │   ├── .husky/         # Hooks Git (Husky)
│   │   ├── src/
│   │   ├── GUIDE_DES_ERREURS.md
│   │   └── HUSKY_SETUP.md
│   └── api/                # Backend Express
├── packages/
│   └── database/           # Migrations SQL
└── PROJECT_SETUP.md        # Ce fichier
```

---

## 📚 Documentation

- [Guide des erreurs à éviter](./apps/web/GUIDE_DES_ERREURS.md)
- [Configuration Husky](./apps/web/HUSKY_SETUP.md)
- [Rapport de nettoyage](./CODE_CLEANUP_FINAL_REPORT.md)

---

## 🧪 Tests

```bash
# Linter
cd apps/web
npm run lint

# Build
cd apps/web
npm run build
```

---

## 📝 Règles de développement

1. **Avant chaque commit**, Husky vérifie automatiquement le code
2. **Pas de `console.log`** - Utiliser `logger.ts`
3. **Apostrophes en JSX** - Toujours utiliser `&apos;`
4. **Types explicites** - Éviter `any`
5. **Variables** - Préférer `const` à `let`

---

*Documentation mise à jour le 12 Mars 2026*
