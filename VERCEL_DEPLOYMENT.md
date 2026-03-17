# 🔧 Solution Erreur 254 Vercel

## Problème
L'erreur 254 survient souvent avec les monorepos sur Vercel.

## Solution Alternative : Déployer uniquement le dossier web

### Étape 1 : Créer un repo séparé pour le frontend

```bash
# Créer un nouveau dossier
cd ..
mkdir AfriMobilis-Web
cd AfriMobilis-Web

# Copier uniquement le frontend
cp -r ../AfriMobilis/apps/web/* .
cp ../AfriMobilis/apps/web/.env.local .

# Initialiser git
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/franckdanielcape/AfriMobilis-Web.git
git push -u origin master
```

### Étape 2 : Déployer sur Vercel

1. Allez sur https://vercel.com/new
2. Importez **AfriMobilis-Web**
3. Configuration simple :
   - Framework : Next.js
   - Root Directory : `./` (défaut)
   - Build Command : `npm run build` (défaut)
   - Variables d'environnement : comme avant

---

## Solution 2 : Utiliser Turborepo sur Vercel

### Modifiez vercel.json à la racine :

```json
{
  "version": 2,
  "buildCommand": "turbo run build --filter=web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install"
}
```

### Sur Vercel :
- Framework Preset : **Other**
- Build Command : `turbo run build --filter=web`
- Output Directory : `apps/web/.next`

---

## Solution 3 : Railway (Alternative à Vercel)

Si Vercel ne fonctionne pas, utilisez Railway :

1. https://railway.app/new
2. Connectez GitHub
3. Sélectionnez **AfriMobilis**
4. Variables d'environnement :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Deploy

---

## Recommandation

Je recommande **la Solution 1** (repo séparé) car c'est la plus simple et fiable pour Vercel.

Voulez-vous que je prépare le repo séparé pour vous ?
