-- Migration 004: Hierarchie Roles et Delegation

-- 0. Helper Functions (au cas où elles n'existent pas)
CREATE OR REPLACE FUNCTION get_auth_user_role() RETURNS text AS $$
  SELECT role::text FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_user_syndicat() RETURNS UUID AS $$
  SELECT syndicat_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
-- 1. Modifiation de la table users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS custom_role_id UUID, -- Will reference roles_hierarchy(id)
ADD COLUMN IF NOT EXISTS permissions_custom JSONB DEFAULT '{}'::jsonb;

-- 2. Creation de la table roles_hierarchy
CREATE TABLE IF NOT EXISTS roles_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    niveau INTEGER NOT NULL CHECK (niveau IN (2, 3, 4, 5)), -- 2:Chef, 3:Bureau, 4:Terrain, 5:Utilisateur
    permissions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    syndicat_id UUID REFERENCES syndicats(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter la contrainte foreign key maintenant que la table existe
ALTER TABLE users
ADD CONSTRAINT fk_custom_role
FOREIGN KEY (custom_role_id) REFERENCES roles_hierarchy(id) ON DELETE SET NULL;

-- 3. Creation de la table creation_logs
CREATE TABLE IF NOT EXISTS creation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES users(id) NOT NULL,
    created_user_id UUID REFERENCES users(id) NOT NULL,
    role_given VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS pour roles_hierarchy
ALTER TABLE roles_hierarchy ENABLE ROW LEVEL SECURITY;

-- Les membres du syndicat peuvent voir les rôles de leur syndicat (s'ils ont les droits)
CREATE POLICY "Users can view roles in their syndicat" ON roles_hierarchy
FOR SELECT
USING (
    syndicat_id = get_auth_user_syndicat() OR get_auth_user_role() = 'super_admin'
);

-- Seul le chef syndicat (admin_syndicat) ou le créateur peut modifier les rôles
CREATE POLICY "Chef syndicat can manage roles" ON roles_hierarchy
FOR ALL
USING (
    get_auth_user_role() = 'super_admin' OR 
    (get_auth_user_role() = 'admin_syndicat' AND syndicat_id = get_auth_user_syndicat())
);

-- 5. RLS pour creation_logs
ALTER TABLE creation_logs ENABLE ROW LEVEL SECURITY;

-- On ne peut voir que les logs qu'on a créés, ou ceux de son syndicat si on est admin, ou tout si super_admin
CREATE POLICY "View creation logs" ON creation_logs
FOR SELECT
USING (
    created_by = auth.uid() OR
    get_auth_user_role() = 'super_admin' OR
    (get_auth_user_role() = 'admin_syndicat' AND created_by IN (SELECT id FROM users WHERE syndicat_id = get_auth_user_syndicat()))
);

CREATE POLICY "Insert creation logs" ON creation_logs
FOR INSERT
WITH CHECK (created_by = auth.uid());
