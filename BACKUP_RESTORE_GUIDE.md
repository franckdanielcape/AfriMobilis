# 📦 Guide de Sauvegarde et Restauration - AfriMobilis

Ce document explique comment sauvegarder et restaurer le projet AfriMobilis.

---

## 🔄 Sauvegarde

### Méthode 1: Script PowerShell (Windows)

```powershell
# Exécuter depuis le dossier du projet
.\scripts\backup.ps1

# Avec création d'archive ZIP
.\scripts\backup.ps1 -CreateZip
```

### Méthode 2: Script Bash (Linux/Mac)

```bash
# Exécuter depuis le dossier du projet
bash scripts/backup.sh
```

### Méthode 3: Manuelle avec Git

```bash
# Créer un bundle Git (contient tout l'historique)
git bundle create AfriMobilis_BACKUP_$(date +%Y%m%d_%H%M%S).bundle --all

# Créer un tag pour marquer la version
git tag -a v1.0.0 -m "Version stable"
```

---

## 🔄 Restauration

### Restaurer depuis un Bundle Git

```bash
# 1. Cloner depuis le bundle
git clone AfriMobilis_GIT_BUNDLE_xxxxxxxxx.bundle AfriMobilis_restored

# 2. Entrer dans le dossier
cd AfriMobilis_restored

# 3. Réinstaller les dépendances
npm install

# 4. Configurer les variables d'environnement
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 5. Démarrer le projet
npm run dev
```

### Restaurer depuis Git (si repository distant existe)

```bash
# Cloner le repository
git clone <url-du-repository> AfriMobilis

# Ou si vous avez déjà le repo local
git fetch --all
git reset --hard origin/main  # Attention: écrase les modifications locales
```

---

## 📋 Points de Sauvegarde Importants

| Version | Tag | Description |
|---------|-----|-------------|
| v1.0.0-mvp | ✅ | MVP complet avec 5 phases |

---

## 🏷️ Gestion des Tags

```bash
# Lister les tags
git tag

# Créer un tag
git tag -a v1.1.0 -m "Nouvelle fonctionnalité X"

# Pousser les tags vers le remote
git push origin --tags

# Supprimer un tag local
git tag -d v1.1.0
```

---

## 💾 Ce qui est Sauvegardé

✅ **Inclus dans la sauvegarde:**
- Tout le code source
- Historique Git complet
- Migrations SQL
- Documentation
- Scripts de build

❌ **Exclus (fichiers générés):**
- `node_modules/` (dépendances)
- `.next/` (build Next.js)
- `dist/` / `build/` (builds)
- Fichiers `.env` (variables sensibles)
- Logs

---

## 🆘 En Cas de Problème

### Récupérer un fichier supprimé

```bash
# Voir l'historique d'un fichier
git log --follow -- nom-du-fichier

# Récupérer une version spécifique
git checkout <commit-hash> -- nom-du-fichier
```

### Annuler des modifications locales

```bash
# Annuler les modifications non commitées
git checkout -- .

# Ou plus radicalement
git reset --hard HEAD
```

### Revenir à un commit précédent

```bash
# Créer une branche de sauvegarde d'abord
git branch backup-avant-retour

# Revenir au commit précédent
git reset --hard HEAD~1

# Ou revenir à un commit spécifique
git reset --hard <commit-hash>
```

---

## 📞 Support

En cas de problème avec la sauvegarde ou la restauration :
1. Vérifier que Git est installé : `git --version`
2. Vérifier l'état du repo : `git status`
3. Consulter les logs : `git log --oneline -10`
