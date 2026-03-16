# Guide de Configuration Base de Données - AfriMobilis

## État Actuel : Mode Démo
Actuellement, l'application fonctionne en **mode démonstration** avec localStorage (stockage dans le navigateur).

## Pour passer en mode Production (Base de données réelle)

### 1. Configurer Supabase

#### 1.1 Créer un projet Supabase
1. Aller sur https://supabase.com
2. Créer un nouveau projet
3. Noter l'URL et la clé API (anon key)

#### 1.2 Configurer les variables d'environnement
Dans `apps/web/.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

Dans `apps/api/.env` :
```env
SUPABASE_SERVICE_KEY=votre-cle-service-role
```

### 2. Structure des Tables Requises

#### 2.1 Table `profiles`
```sql
create table profiles (
  id uuid references auth.users on delete cascade,
  nom text,
  prenom text,
  telephone text,
  email text,
  role text default 'passager',
  syndicat_id uuid,
  status text default 'actif',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Activer RLS
alter table profiles enable row level security;
```

#### 2.2 Table `syndicats`
```sql
create table syndicats (
  id uuid default uuid_generate_v4(),
  nom text not null,
  code text,
  zone text,
  zone_geographique jsonb,
  statut text default 'actif',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Activer RLS
alter table syndicats enable row level security;
```

#### 2.3 Table `vehicules`
```sql
create table vehicules (
  id uuid default uuid_generate_v4(),
  immatriculation text not null,
  statut text default 'actif',
  proprietaire_id uuid references profiles(id),
  syndicat_id uuid references syndicats(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Activer RLS
alter table vehicules enable row level security;
```

### 3. Politiques RLS (Row Level Security)

#### 3.1 Pour `profiles`
```sql
-- Permettre la lecture à tous les utilisateurs authentifiés
create policy "Enable read access for authenticated users"
  on profiles for select
  to authenticated
  using (true);

-- Permettre la modification à l'utilisateur lui-même ou aux admins
create policy "Enable update for users or admins"
  on profiles for update
  to authenticated
  using (
    auth.uid() = id 
    or exists (
      select 1 from profiles where id = auth.uid() and role = 'super_admin'
    )
  );
```

#### 3.2 Pour `syndicats`
```sql
-- Lecture pour tous les authentifiés
create policy "Enable read access for authenticated users"
  on syndicats for select
  to authenticated
  using (true);

-- Écriture uniquement pour Super Admin
create policy "Enable insert for super admins"
  on syndicats for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'super_admin'
    )
  );
```

### 4. Créer le Super Admin

Dans Supabase Dashboard > SQL Editor :
```sql
-- Créer l'utilisateur dans auth.users (via l'interface Supabase Auth)
-- Puis ajouter son profil
insert into profiles (id, nom, prenom, email, role, telephone)
values (
  'uuid-de-franckdanielcape',
  'Daniel',
  'Franck',
  'franckdanielcape@gmail.com',
  'super_admin',
  '0708124233'
);
```

### 5. Migrations de Données (localStorage → Supabase)

Pour migrer les données créées en mode démo :

```javascript
// Dans la console navigateur (F12), exécuter :
const syndicats = JSON.parse(localStorage.getItem('mockSyndicats') || '[]');
const chefs = JSON.parse(localStorage.getItem('mockChefs') || '[]');

console.log('Syndicats à migrer:', syndicats);
console.log('Chefs à migrer:', chefs);

// Copier ces données et les insérer manuellement dans Supabase
```

### 6. Vérification

Après configuration, tester :
1. Connexion avec `franckdanielcape@gmail.com`
2. Création d'un syndicat
3. Création d'un chef de ligne
4. Vérifier que les données persistent après refresh

### 7. Support

En cas de problème, vérifier :
- Les logs dans Supabase (Logs > API)
- Les politiques RLS sont bien actives
- Les clés API sont correctement configurées
- Le service role key est utilisé côté API (backend)
