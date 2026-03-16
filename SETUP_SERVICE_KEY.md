# 🔑 Guide - Récupérer la clé Service Role Supabase

## Étape 1: Accéder au Dashboard Supabase

1. Va sur https://supabase.com/dashboard
2. Connecte-toi avec ton compte
3. Sélectionne ton projet **AfriMobilis** (fqtzxijhqxnpwchgoshm)

## Étape 2: Récupérer la clé

1. Dans le menu latéral, clique sur **Project Settings** (icône engrenage en bas)
2. Clique sur **API** dans le sous-menu
3. Descends jusqu'à la section **Project API keys**
4. Tu verras deux clés :
   - `anon` (public) - CELLE-CI NE FONCTIONNE PAS POUR LE BACKEND
   - `service_role` (secret) - C'EST CELLE QU'IL FAUT ✅

5. Clique sur **Reveal** à côté de `service_role`
6. Copie la clé (elle commence par `eyJhbGciOiJIUzI1NiIs...`)

## Étape 3: Mettre à jour le fichier .env

Remplace le contenu de `apps/api/.env` par :

```env
SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... [TA_CLE_SERVICE_ROLE_COPIEE_ICI]
REDIS_URL=redis://localhost:6379
PORT=4000
```

## Étape 4: Vérifier

Dans ton terminal PowerShell :

```powershell
cd apps/api
npm run check-env
```

Tu devrais voir :
```
✅ SUPABASE_URL: https://fqtzxijhqxnpwchgoshm.supabase.co
✅ SUPABASE_SERVICE_KEY: eyJhbGciOiJIUzI1NiIs...xxx
✅ Clé Service Role détectée (correct pour backend)
```

## ⚠️ IMPORTANT

- **NE COMMITTE JAMAIS** cette clé sur Git
- Elle est déjà dans `.gitignore` normalement
- Si tu la perds/exposes, régénère-la immédiatement dans le dashboard

---

## Besoin d'aide ?

Si tu as un problème, envoie-moi :
1. Le résultat de `npm run check-env`
2. Une capture d'écran du dashboard Supabase (masque la clé !)
