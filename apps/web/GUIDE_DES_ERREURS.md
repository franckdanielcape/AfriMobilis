# Guide des Erreurs à Éviter - AfriMobilis

> **Document de référence pour éviter les erreurs courantes lors du développement**
> 
> Dernière mise à jour : Mars 2026

---

## Table des matières

1. [Erreurs JSX/React](#1-erreurs-jsxreact)
2. [Erreurs TypeScript](#2-erreurs-typescript)
3. [Erreurs de Code](#3-erreurs-de-code)
4. [Bonnes Pratiques](#4-bonnes-pratiques)
5. [Checklist avant commit](#5-checklist-avant-commit)

---

## 1. Erreurs JSX/React

### ❌ Erreur : Apostrophes non échappées dans JSX

**Pourquoi c'est une erreur :** React interprète les apostrophes comme du code, pas du texte.

```tsx
// ❌ MAUVAIS - ESLint: react/no-unescaped-entities
<label>Date d'inscription</label>
<p>Vue d'ensemble</p>
<span>l'équipe</span>

// ✅ CORRECT - Utiliser &apos;
<label>Date d&apos;inscription</label>
<p>Vue d&apos;overview</p>
<span>l&apos;équipe</span>
```

**Cas courants à corriger :**
| Français | Code correct |
|----------|--------------|
| d'inscription | `d&apos;inscription` |
| l'overview | `d&apos;overview` |
| l'équipe | `l&apos;équipe` |
| d'accès | `d&apos;accès` |
| n'ayant | `n&apos;ayant` |
| qu'on | `qu&apos;on` |
| j'ai | `j&apos;ai` |
| s'il | `s&apos;il` |
| d'immatriculation | `d&apos;immatriculation` |
| d'identifiant | `d&apos;identifiant` |

**Raccourci IDE :** Faire une recherche/remplacement regex dans VS Code :
- Rechercher : `([a-zA-Z])'([a-z])`
- Remplacer : `$1&apos;$2`

---

### ❌ Erreur : setState synchrone dans useEffect

**Pourquoi c'est une erreur :** Peut causer des rendus en cascade.

```tsx
// ❌ MAUVAIS
useEffect(() => {
    setLoading(true);  // Déclenche un rendu
    setData([]);       // Déclenche un autre rendu immédiatement
}, []);

// ✅ CORRECT - Un seul setState
useEffect(() => {
    setState({ loading: true, data: [] });
}, []);

// Ou utiliser useLayoutEffect si nécessaire
```

---

### ❌ Erreur : Dépendances manquantes dans useEffect

```tsx
// ❌ MAUVAIS - fetchData manquant dans les dépendances
useEffect(() => {
    fetchData();
}, []); // ESLint: react-hooks/exhaustive-deps

// ✅ CORRECT
useEffect(() => {
    fetchData();
}, [fetchData]);

// Ou désactiver si intentionnel
// eslint-disable-next-line react-hooks/exhaustive-deps
```

---

## 2. Erreurs TypeScript

### ❌ Erreur : Utilisation de `any`

**Pourquoi c'est une erreur :** Perd le typage, source de bugs silencieux.

```tsx
// ❌ MAUVAIS
const [user, setUser] = useState<any>(null);
const handleData = (data: any) => { ... };

// ✅ CORRECT - Définir des interfaces
interface User {
    id: string;
    nom: string;
    email?: string;
    role: string;
}

const [user, setUser] = useState<User | null>(null);
const handleData = (data: User) => { ... };
```

**Types à remplacer :**
```typescript
// ❌ any
function process(data: any): any

// ✅ unknown avec vérification
function process(data: unknown): string {
    if (typeof data === 'string') return data;
    return String(data);
}
```

---

### ❌ Erreur : Variables jamais réassignées avec `let`

```tsx
// ❌ MAUVAIS - 'nom' n'est jamais réassigné
let nom = 'Jean';
console.log(nom);

// ✅ CORRECT - Utiliser const
const nom = 'Jean';
console.log(nom);
```

**Règle :** Toujours utiliser `const` par défaut. Utiliser `let` uniquement si la variable est réassignée.

---

### ❌ Erreur : Paramètres non utilisés

```tsx
// ❌ MAUVAIS - 'event' n'est pas utilisé
function handleClick(event: React.MouseEvent) {
    console.log('clicked');
}

// ✅ CORRECT - Préfixer avec underscore
function handleClick(_event: React.MouseEvent) {
    console.log('clicked');
}
```

---

## 3. Erreurs de Code

### ❌ Erreur : Console.log en production

```tsx
// ❌ MAUVAIS
console.log('Debug:', data);
console.error('Erreur:', err);

// ✅ CORRECT - Utiliser le logger
import { logger } from '@/utils/logger';

logger.log('Debug:', data);      // Affiché uniquement en dev
logger.error('Erreur:', err);    // Affiché uniquement en dev
```

**Règle :** Ne jamais commiter de `console.log/error/warn`.

---

### ❌ Erreur : Gestion d'erreurs avec `any`

```tsx
// ❌ MAUVAIS
try {
    await fetchData();
} catch (error: any) {
    console.error(error.message);
}

// ✅ CORRECT
try {
    await fetchData();
} catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('fetchData', message);
}
```

---

### ❌ Erreur : Imports non utilisés

```tsx
// ❌ MAUVAIS - Button n'est pas utilisé
import { Button, Input } from '@/components/ui';

// ✅ CORRECT - Supprimer l'import inutilisé
import { Input } from '@/components/ui';
```

---

## 4. Bonnes Pratiques

### ✅ Pattern : Gestion des erreurs API

```typescript
// ✅ Pattern recommandé
export async function fetchUsers(): Promise<User[]> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');
        
        if (error) throw error;
        return data || [];
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur serveur';
        logger.error('fetchUsers', message);
        return []; // Retourner valeur par défaut
    }
}
```

---

### ✅ Pattern : Hooks personnalisés

```typescript
// ✅ Pattern recommandé
function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                setUser(data.user);
            } catch (error: unknown) {
                logger.error('useAuth', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    return { user, loading };
}
```

---

### ✅ Pattern : Interfaces explicites

```typescript
// ✅ Toujours définir les interfaces
interface VehicleProps {
    id: string;
    immatriculation: string;
    statut: 'actif' | 'inactif' | 'en_maintenance';
    createdAt: Date;
}

// Utiliser des enum pour les statuts
enum VehicleStatus {
    ACTIF = 'actif',
    INACTIF = 'inactif',
    MAINTENANCE = 'en_maintenance'
}
```

---

## 5. Checklist avant commit

### Commandes à exécuter

```bash
# 1. Linter
npm run lint

# 2. Build
npm run build

# 3. Vérifier les types TypeScript
npx tsc --noEmit
```

### Checklist manuelle

- [ ] Aucun `console.log/error/warn` dans le code
- [ ] Aucune apostrophe `'` dans le JSX (utiliser `&apos;`)
- [ ] Pas de types `any` sauf justification
- [ ] Variables `const` préférées à `let`
- [ ] Paramètres inutilisés préfixés avec `_`
- [ ] Dépendances de useEffect complètes
- [ ] Imports utilisés (pas d'imports morts)
- [ ] Gestion des erreurs avec `unknown` pas `any`

---

## Commandes utiles

### Chercher les erreurs courantes

```bash
# Chercher les console.log
grep -r "console\." src/ --include="*.tsx" --include="*.ts"

# Chercher les apostrophes dans JSX
grep -r "'" src/ --include="*.tsx" | grep -E ">.*'.*<"

# Chercher les types 'any'
grep -r ": any" src/ --include="*.tsx" --include="*.ts"

# Chercher les 'let' qui pourraient être 'const'
grep -r "let " src/ --include="*.tsx" --include="*.ts"
```

---

## Résumé des erreurs corrigées lors du nettoyage

| Erreur | Quantité | Solution |
|--------|----------|----------|
| Apostrophes JSX | ~30 | Remplacer par `&apos;` |
| Console.log | ~45 | Supprimer ou utiliser `logger.ts` |
| Types `any` | ~25 | Créer des interfaces explicites |
| Variables `let` | ~20 | Remplacer par `const` |
| Paramètres non utilisés | ~10 | Préfixer avec `_` |
| Gestion erreurs `any` | ~15 | Utiliser `unknown` |

---

**Rappel important :** 
> Un code propre n'est pas un luxe, c'est une nécessité pour la maintenance et l'évolution du projet.

**En cas de doute :** Consulter ce guide ou exécuter `npm run lint` !
