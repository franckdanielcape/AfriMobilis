# 🚀 Lancer AfriMobilis

## Démarrage Rapide

### Option 1: Script Batch (Recommandé)
```bash
START_AFRIMOBILIS.bat
```

### Option 2: Manuellement

#### Terminal 1 - API
```bash
cd apps/api
npm run dev
```
**URL**: http://localhost:4000

#### Terminal 2 - Web
```bash
cd apps/web
npm run dev
```
**URL**: http://localhost:3000

---

## Vérification du Démarrage

### Health Check API
```bash
curl http://localhost:4000/health
```

Réponse attendue :
```json
{
  "status": "OK",
  "message": "AfriMobilis API is running.",
  "timestamp": "2026-03-16T...",
  "services": {
    "redis": "connected"
  }
}
```

### Page Login Web
Ouvrir : http://localhost:3000/login

---

## Arrêt des Serveurs

### Option 1: Script
```bash
stop-all.bat
```

### Option 2: Manuel
Appuyer sur `Ctrl+C` dans chaque terminal

---

## Dépannage

### Port déjà utilisé
```bash
# Trouver et tuer le processus sur le port 3000
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### Erreur de connexion Supabase
Vérifier les variables d'environnement :
- `apps/web/.env.local`
- `apps/api/.env`

### Redis non disponible
L'application fonctionne sans Redis (mode dégradé)

---

## URLs Importantes

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Interface utilisateur |
| API | http://localhost:4000 | Backend REST |
| Health | http://localhost:4000/health | Vérification santé |
| Login | http://localhost:3000/login | Page de connexion |

---

## Comptes de Test

Créez des comptes via l'interface ou utilisez Supabase Auth.

Rôles disponibles :
- `super_admin`
- `super_chef_de_ligne`
- `chef_de_ligne`
- `proprietaire`
- `gerant`
- `chauffeur`
- `agent_terrain`
- `passager`
