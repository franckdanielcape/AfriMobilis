# 🚀 Configuration Base de Données Supabase

## ✅ Ce qui a été fait

### 1. Fichiers créés
- **`supabase_setup.sql`** - Script SQL complet pour créer les tables et politiques RLS
- **`apps/web/.env.local`** - Variables d'environnement configurées avec vos clés Supabase
- **`apps/web/src/app/dashboard/admin/database-setup/page.tsx`** - Interface de migration des données
- **`apps/web/src/app/api/migrate-data/route.ts`** - API route pour migrer les données

### 2. Navigation mise à jour
Le menu admin contient maintenant un lien "🔧 Config Base de Données"

---

## 📋 Prochaines étapes

### Étape 1: Exécuter le script SQL dans Supabase

1. Connectez-vous à votre [Dashboard Supabase](https://supabase.com/dashboard/project/fqtzxijhqxnpwchgoshm)
2. Allez dans **SQL Editor** (menu gauche)
3. Créez une **New query**
4. Copiez-collez le contenu de `supabase_setup.sql`
5. Cliquez sur **Run**

### Étape 2: Créer votre compte Super Admin

1. Dans Supabase Dashboard, allez dans **Authentication** > **Users**
2. Cliquez sur **Add user**
3. Entrez votre email: `franckdanielcape@gmail.com`
4. Définissez un mot de passe sécurisé
5. Créez l'utilisateur
6. Retournez dans **SQL Editor** et exécutez:

```sql
INSERT INTO profiles (id, email, role, nom, prenom) 
SELECT id, email, 'super_admin', 'Franck', 'Daniel'
FROM auth.users 
WHERE email = 'franckdanielcape@gmail.com';
```

### Étape 3: Configurer la Service Role Key (Optionnel pour migration)

Pour migrer automatiquement vos données locales vers Supabase, vous devez ajouter la **Service Role Key**:

1. Dans Supabase Dashboard, allez dans **Project Settings** > **API**
2. Copiez la **Service Role Key** (⚠️ Gardez-la secrète!)
3. Ajoutez-la dans `apps/web/.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
```

### Étape 4: Migrer les données locales

1. Redémarrez le serveur: `npm run dev`
2. Connectez-vous en tant que Super Admin
3. Allez dans **🔧 Config Base de Données**
4. Cliquez sur **"Migrer vers Supabase"**
5. Les données locales seront importées dans Supabase

---

## 🔧 Structure des tables créées

### `profiles`
- Stocke tous les utilisateurs (Super Admin, Chefs de Ligne, Propriétaires, Chauffeurs)
- Champs: id, nom, prenom, email, telephone, role, syndicat_id, status

### `syndicats`
- Stocke les syndicats de taxi par ville
- Champs: id, nom, code, zone, zone_geographique, statut

### `vehicules`
- Stocke les véhicules enregistrés
- Champs: plaque, immatriculation, marque, modele, statut, proprietaire_id, chauffeur_id, syndicat_id

### `documents_conformite`
- Documents des véhicules (assurance, vignette, etc.)
- Champs: vehicule_id, type, numero, date_expiration, fichier_url, statut

---

## 🔐 Politiques RLS (Row Level Security)

Les politiques suivantes sont configurées:

- **Super Admin**: Accès complet à toutes les tables
- **Chef de Ligne**: Peut lire/modifier véhicules et documents
- **Propriétaire**: Peut gérer ses véhicules et documents
- **Tous utilisateurs authentifiés**: Peuvent lire les profils et syndicats

---

## 🌐 URLs importantes

- **Dashboard Supabase**: https://supabase.com/dashboard/project/fqtzxijhqxnpwchgoshm
- **SQL Editor**: https://supabase.com/dashboard/project/fqtzxijhqxnpwchgoshm/sql/new
- **Authentication**: https://supabase.com/dashboard/project/fqtzxijhqxnpwchgoshm/auth/users
- **Table Editor**: https://supabase.com/dashboard/project/fqtzxijhqxnpwchgoshm/editor

---

## ⚠️ Notes importantes

1. **Ne jamais exposer la Service Role Key côté client** - Elle permet d'outrepasser toutes les politiques RLS
2. **Les données locales restent en backup** - Même après migration, elles restent dans localStorage jusqu'à suppression manuelle
3. **En cas d'erreur** - Vous pouvez toujours revenir au mode démo en supprimant les variables d'environnement Supabase

---

## 🔄 Workflow de migration des rôles

```
Super Admin (Vous)
    ↓
Crée les Villes/Syndicats
    ↓
Crée les Chefs de Ligne (Niveau 2)
    ↓
Chef de Ligne recense les Propriétaires (Niveau 3)
    ↓
Propriétaires créent leurs Chauffeurs (Niveau 4)
```
