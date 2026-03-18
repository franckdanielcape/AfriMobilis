# Guide Déploiement GitHub Pages - AfriMobilis

> Alternative simple à Vercel - Gratuit et intégré à GitHub

---

## 🚀 Pourquoi GitHub Pages ?

| Avantage | Description |
|----------|-------------|
| ✅ **Gratuit** | Aucun coût |
| ✅ **Simple** | Pas de configuration complexe |
| ✅ **Intégré** | Déjà dans GitHub |
| ✅ **Automatique** | Déploie sur chaque push |
| ✅ **Pas de Turbo** | Pas de détection automatique |

---

## 📋 Étapes de Déploiement

### Étape 1 : Activer GitHub Pages

1. Allez sur https://github.com/franckdanielcape/AfriMobilis
2. Cliquez sur **"Settings"** (onglet en haut)
3. Dans le menu de gauche, cliquez **"Pages"**
4. Dans "Source", sélectionnez **"GitHub Actions"**
5. C'est tout ! Le workflow est déjà configuré

### Étape 2 : Vérifier le déploiement

1. Allez sur l'onglet **"Actions"** dans GitHub
2. Vous verrez le workflow "Deploy to GitHub Pages"
3. Attendez qu'il soit vert (2-3 minutes)
4. L'URL sera : `https://franckdanielcape.github.io/AfriMobilis`

---

## 🌐 URLs après déploiement

| URL | Contenu |
|-----|---------|
| `https://franckdanielcape.github.io/AfriMobilis/` | Landing page |
| `https://franckdanielcape.github.io/AfriMobilis/app/` | Application |

---

## 🔄 Mises à jour

Chaque `git push` déclenche automatiquement un nouveau déploiement !

```bash
git add -A
git commit -m "update: ..."
git push origin main
# GitHub Pages se met à jour automatiquement (2-3 min)
```

---

## 🔧 Alternative : Netlify (Si GitHub Pages ne convient pas)

### Netlify - Très simple aussi

1. Allez sur https://app.netlify.com/drop
2. Glissez-déposez le dossier `apps/web/`
3. C'est déployé !

### Avantages Netlify :
- Pas besoin de GitHub
- URL personnalisée gratuite
- Drag & drop simple

---

*Guide créé le 18 Mars 2026*
