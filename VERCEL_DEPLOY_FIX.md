# 🔧 Fix Déploiement Vercel - Monorepo

## ❌ Erreur Résolue
> "Aucune version de Next.js détectée"

## ✅ Solution

### Sur Vercel, configurez ainsi :

#### Étape 1 : Framework Preset
- Sélectionnez : **Next.js**

#### Étape 2 : Root Directory
- **IMPORTANT** : Laissez vide ou mettez `./`
- Ne mettez PAS `apps/web` ici

#### Étape 3 : Build Settings (Override)
| Paramètre | Valeur |
|-----------|--------|
| **Build Command** | `cd apps/web && npm install && npm run build` |
| **Output Directory** | `apps/web/.next` |
| **Install Command** | `npm install` |

#### Étape 4 : Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTAyMzYsImV4cCI6MjA4NzcyNjIzNn0.-7JMEiP-iNDQs5U1TyLar7TgDb6HhVZkJwVBAS-qFvo
```

## 📝 Explication

Dans un monorepo Turborepo :
- Le `package.json` racine ne contient pas Next.js
- Next.js est dans `apps/web/package.json`
- Il faut donc configurer le build pour aller dans `apps/web`

## 🚀 Alternative : Deploy depuis la racine

Si ça ne marche toujours pas :

1. **Supprimez le projet Vercel** et recréez-le
2. **Ne changez pas** le Root Directory (laissez `./`)
3. **Override** les Build Settings comme indiqué ci-dessus

## ✅ Vérification

Après déploiement, votre site sera sur :
- `https://afrimobilis.vercel.app`
