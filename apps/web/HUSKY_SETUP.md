# Configuration Husky - AfriMobilis

> **Husky** est configuré pour exécuter automatiquement le linter avant chaque commit.

---

## 🚀 Comment ça marche

Avant chaque `git commit`, Husky va automatiquement :

1. **Vérifier les fichiers modifiés** (staged files)
2. **Exécuter ESLint** avec correction automatique (`eslint --fix`)
3. **Exécuter Prettier** pour formater le code (`prettier --write`)
4. **Ajouter les corrections** au commit

---

## ⚠️ Si le commit est bloqué

Si Husky empêche le commit, c'est qu'il y a des erreurs ESLint qui ne peuvent pas être corrigées automatiquement.

### Voir les erreurs

```bash
cd apps/web
npm run lint
```

### Corriger les erreurs courantes

#### 1. Apostrophes dans JSX
```tsx
// ❌ Erreur
<label>Date d'inscription</label>

// ✅ Correct
<label>Date d&apos;inscription</label>
```

#### 2. Console.log
```tsx
// ❌ Erreur
console.log('debug')

// ✅ Correct
import { logger } from '@/utils/logger'
logger.log('debug')  // Affiché uniquement en dev
```

#### 3. Types any
```tsx
// ❌ Erreur
const [user, setUser] = useState<any>(null)

// ✅ Correct
interface User { id: string; name: string }
const [user, setUser] = useState<User | null>(null)
```

---

## 🔧 Contourner Husky (urgence uniquement)

> **⚠️ Déconseillé** - À utiliser uniquement en cas d'urgence

```bash
# Contourner les hooks git
git commit -m "message" --no-verify
```

---

## 📝 Configuration

### Fichiers modifiés

| Fichier | Description |
|---------|-------------|
| `.husky/pre-commit` | Hook exécuté avant chaque commit |
| `package.json` | Configuration de lint-staged |

### Configuration lint-staged (package.json)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## 🛠️ Dépannage

### Problème : Husky ne s'exécute pas

```bash
# Réinstaller Husky
cd apps/web
npx husky install

# Vérifier que le hook est exécutable (Linux/Mac)
chmod +x .husky/pre-commit
```

### Problème : "husky not found"

```bash
# Réinstaller les dépendances
cd apps/web
npm install
```

### Problème : Lint-staged échoue

```bash
# Exécuter manuellement pour voir l'erreur
cd apps/web
npx lint-staged
```

---

## 📚 Ressources

- [Documentation Husky](https://typicode.github.io/husky/)
- [Documentation lint-staged](https://github.com/okonet/lint-staged)
- [Guide des erreurs AfriMobilis](./GUIDE_DES_ERREURS.md)

---

## ✅ Checklist avant commit

Husky vérifie automatiquement :

- [ ] Pas d'apostrophes `'` dans JSX
- [ ] Pas de `console.log/error/warn`
- [ ] Pas de types `any` sauf exception
- [ ] Variables `const` préférées à `let`
- [ ] Code formaté avec Prettier

**Si Husky bloque le commit → corriger les erreurs → recommitter**

---

*Configuration mise en place le 12 Mars 2026*
