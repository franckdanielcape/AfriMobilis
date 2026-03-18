# Guide de Migration Next.js → Vite + React

## 🎯 Approche Recommandée

Le projet contient **165 fichiers** à migrer. Voici la stratégie efficace :

---

## Option 1 : Migration Progressive (Recommandée)

### Étape 1 : Déployer immédiatement avec la structure actuelle

Le dossier `apps/web-vite` est prêt avec :
- ✅ Configuration Vite complète
- ✅ React Router configuré
- ✅ Tailwind CSS
- ✅ 3 pages fonctionnelles (Login, Dashboard, Admin)

**Déployez maintenant** → Le site sera en ligne en 2 minutes

### Étape 2 : Migrer les pages une par une

Pour chaque page Next.js, créer l'équivalent Vite :

| Next.js | Vite + React |
|---------|--------------|
| `app/login/page.tsx` | `pages/Login.tsx` |
| `app/dashboard/page.tsx` | `pages/Dashboard.tsx` |
| `app/admin/page.tsx` | `pages/Admin.tsx` |

**Changements à faire :**

1. **Remplacer les imports Next.js :**
   ```tsx
   // Avant (Next.js)
   import { useRouter } from 'next/navigation'
   import Image from 'next/image'
   
   // Après (Vite)
   import { useNavigate } from 'react-router-dom'
   // Image standard HTML
   ```

2. **Remplacer les routes API :**
   ```tsx
   // Avant (Next.js)
   // app/api/users/route.ts
   export async function GET() { ... }
   
   // Après (Vite)
   // Appeler l'API externe (apps/api)
   const response = await fetch('http://localhost:4000/api/users')
   ```

3. **Remplacer les métadonnées :**
   ```tsx
   // Avant (Next.js)
   export const metadata = { title: '...' }
   
   // Après (Vite)
   // Dans index.html ou useEffect + document.title
   ```

---

## Option 2 : Script de Migration Automatique

Je peux créer un script Node.js qui :
1. Lit tous les fichiers `.tsx` dans `app/`
2. Convertit automatiquement les imports
3. Génère les fichiers dans `pages/`

**Temps estimé :** 30 minutes de développement du script

---

## Option 3 : Refonte Complète

Repartir de zéro avec une architecture propre :
- Garder la logique métier (hooks, stores)
- Réécrire les composants UI
- Séparer clairement frontend (Vite) et backend (API)

**Temps estimé :** 1-2 jours

---

## 🚀 Recommandation Immédiate

**Déployez la version actuelle de `apps/web-vite`** qui contient :
- Une landing page fonctionnelle
- Un système de routing
- La configuration Vite optimale

Puis migrez les pages progressivement en parallèle.

---

## 📋 Checklist Migration

### Pages prioritaires à migrer :
- [ ] Login (`app/login/page.tsx`)
- [ ] Dashboard (`app/dashboard/page.tsx`)
- [ ] Admin (`app/admin/page.tsx`)
- [ ] Register (`app/register/page.tsx`)

### Composants partagés :
- [ ] Layout principal
- [ ] Navigation
- [ ] Formulaires
- [ ] Tableaux de données

### Hooks et utilitaires :
- [ ] useAuth (authentification)
- [ ] useSupabase (client Supabase)
- [ ] useStore (Zustand)

---

## 💡 Astuces

1. **Copier-coller intelligent :** Le JSX fonctionne tel quel, seuls les imports changent

2. **Routes API :** Toutes les routes API (`app/api/*`) doivent pointer vers `apps/api` (Express)

3. **Images :** Remplacer `<Image />` de Next.js par `<img />` standard

4. **CSS :** Les fichiers `.module.css` fonctionnent identiquement

---

## ❓ Questions Fréquentes

**Q : Puis-je garder Next.js et juste fixer le déploiement ?**
R : Oui, mais vous aurez toujours les problèmes de complexité. Vite est plus simple.

**Q : Combien de temps prend la migration complète ?**
R : 4-8 heures pour 165 fichiers si fait manuellement.

**Q : Les tests fonctionnent-ils encore ?**
R : Les tests Playwright/e2e devront être adaptés pour React Router.

---

## 🎯 Prochaines Étapes

1. **Déployer maintenant** la version Vite basique
2. **Choisir** : migration progressive ou script automatisé
3. **Migrer** les pages une par une
4. **Tester** chaque page après migration

---

*Guide créé le 18 Mars 2026*
