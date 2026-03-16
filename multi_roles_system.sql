-- =============================================================================
-- SYSTÈME DE RÔLES MULTIPLES - Permettre à un utilisateur d'avoir plusieurs rôles
-- =============================================================================
-- Ex: Super Admin + Propriétaire, Chef de Ligne + Propriétaire, etc.

-- 1. TABLE DES RÔLES MULTIPLES (un utilisateur peut avoir plusieurs rôles)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    syndicat_id UUID REFERENCES syndicats(id),
    zone_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(user_id, role) -- Un même rôle ne peut être assigné qu'une fois par utilisateur
);

-- Activer RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 2. POLITIQUES RLS POUR user_roles
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON user_roles FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

CREATE POLICY "Admins can manage roles in their syndicat"
ON user_roles FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin_syndicat', 'chef_ligne'))
);

-- 3. FONCTION POUR VÉRIFIER SI UN UTILISATEUR A UN RÔLE SPÉCIFIQUE
CREATE OR REPLACE FUNCTION user_has_role(p_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier dans user_roles
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FONCTION POUR RÉCUPÉRER TOUS LES RÔLES D'UN UTILISATEUR
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS TABLE(role user_role) AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role FROM user_roles ur WHERE ur.user_id = auth.uid()
  UNION
  SELECT p.role FROM profiles p WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CORRIGER LES POLITIQUES profiles POUR PERMETTRE LA CRÉATION
-- Politique permissive : tout utilisateur authentifié peut créer un profil
DROP POLICY IF EXISTS "Allow insert for authenticated" ON profiles;
CREATE POLICY "Allow insert for authenticated"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique : les admins peuvent tout modifier
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin_syndicat', 'chef_ligne'))
);

-- 6. AJOUTER LE RÔLE PROPRIÉTAIRE À VOTRE COMPTE SUPER ADMIN
-- (À exécuter après avoir créé le profil super_admin dans auth.users)
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    p.id,
    'proprietaire'::user_role,
    NOW()
FROM profiles p
WHERE p.role = 'super_admin'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = p.id AND ur.role = 'proprietaire'
);

-- 7. VÉRIFICATION
SELECT 'Rôles multiples configurés !' as status;
SELECT * FROM user_roles LIMIT 5;
