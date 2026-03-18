# Guide Déploiement Vercel - AfriMobilis

> Date : 18 Mars 2026

---

## 🚀 Étapes de Déploiement

### Étape 1 : Supprimer l'ancien projet (si existe)

1. Allez sur https://vercel.com/dashboard
2. Trouvez l'ancien projet "AfriMobilis" ou "afrimobilis"
3. Cliquez sur les 3 points → **"Delete Project"**
4. Confirmez la suppression

---

### Étape 2 : Créer le nouveau projet

1. Cliquez **"Add New Project"**
2. Importez depuis GitHub : **franckdanielcape/AfriMobilis**
3. Configurez :

| Paramètre | Valeur |
|-----------|--------|
| **Project Name** | afrimobilis (ou autre) |
| **Framework Preset** | Other |
| **Root Directory** | `apps/web` |
| **Build Command** | *(laissez vide)* |
| **Output Directory** | `.` |

---

### Étape 3 : Variables d'Environnement

Cliquez sur **"Environment Variables"** et ajoutez :

```
VITE_SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTAyMzYsImV4cCI6MjA4NzcyNjIzNn0.-7JMEiP-iNDQs5U1TyLar7TgDb6HhVZkJwVBAS-qFvo
```

**Important :** Utilisez `VITE_` et non `NEXT_PUBLIC_`

---

### Étape 4 : Déployer

1. Cliquez **"Deploy"**
2. Attendez 30-60 secondes
3. Cliquez sur le lien fourni (ex: `https://afrimobilis-xxx.vercel.app`)

---

## ✅ Vérification Post-Déploiement

### Testez ces URLs :

| URL | Contenu attendu |
|-----|-----------------|
| `https://votre-app.vercel.app/` | Landing page AfriMobilis |
| `https://votre-app.vercel.app/app/` | Page de login |

### Testez le login :
1. Allez sur `/app/`
2. Essayez de vous connecter
3. Vérifiez les erreurs dans la console (F12)

---

## 🔧 Dépannage

### Problème : "404 Not Found" sur /app/

**Solution :** Vérifiez que `vercel.json` existe dans `apps/web/` :

```json
{
  "routes": [
    { "src": "/app/(.*)", "dest": "/app/$1" },
    { "src": "/(.*)", "dest": "/marketing/$1" }
  ]
}
```

### Problème : "Supabase URL not provided"

**Solution :** Vérifiez les variables d'environnement :
- Doivent commencer par `VITE_`
- Pas de guillemets autour des valeurs
- Redéployez après modification

### Problème : Styles cassés

**Solution :** 
1. Vérifiez que le build a été copié : `apps/web/app/assets/`
2. Vérifiez les chemins dans `index.html` (doivent être `/app/assets/`)

---

## 🔄 Mises à Jour Futures

### Pour modifier le site :

```bash
# 1. Modifiez dans apps/web-vite/src/

# 2. Build
cd apps/web-vite
npm run build

# 3. Copiez vers apps/web/app/
# (fichiers de dist/ vers app/)

# 4. Commit + Push
git add -A
git commit -m "update: ..."
git push origin main

# 5. Vercel déploie automatiquement !
```

---

## 📞 URLs Importantes

| Environnement | URL |
|---------------|-----|
| **Production** | `https://afrimobilis-xxx.vercel.app` |
| **Dashboard Vercel** | https://vercel.com/dashboard |
| **GitHub** | https://github.com/franckdanielcape/AfriMobilis |

---

*Guide créé le 18 Mars 2026*
