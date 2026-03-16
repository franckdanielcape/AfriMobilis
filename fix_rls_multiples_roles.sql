-- =============================================================================
-- SOLUTION COMPLETE : Rôles multiples + Recensement fonctionnel
-- =============================================================================

-- 1. TABLE POUR LES RÔLES MULTIPLES (un utilisateur peut avoir plusieurs rôles)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    syndicat_id UUID REFERENCES syndicats(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    UNIQUE(user_id, role)
);

-- Activer RLS sur user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can manage all roles" ON user_roles;
CREATE POLICY "Super admins can manage all roles"
ON user_roles FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- 2. AJOUTER LA COLONNE created_by DANS profiles (pour tracer qui crée les profils)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 3. POLITIQUES RLS POUR PERMETTRE LE RECENSEMENT

-- Politique permissive pour INSERT (recensement) - les admins peuvent créer des profils
DROP POLICY IF EXISTS "Allow authenticated insert profiles" ON profiles;
CREATE POLICY "Allow authenticated insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique pour permettre à l'admin de mettre à jour les profils qu'il a créés
DROP POLICY IF EXISTS "Creators can update profiles" ON profiles;
CREATE POLICY "Creators can update profiles"
ON profiles FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin_syndicat', 'chef_ligne'))
);

-- 4. POLITIQUES POUR AFFECTATIONS
DROP POLICY IF EXISTS "Allow authenticated insert affectations" ON affectations;
CREATE POLICY "Allow authenticated insert affectations"
ON affectations FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. TRIGGER POUR AJOUTER AUTOMATIQUEMENT LE RÔLE PROPRIÉTAIRE QUAND UN VÉHICULE EST CRÉÉ
CREATE OR REPLACE FUNCTION add_proprietaire_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier si le propriétaire a déjà le rôle proprietaire
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = NEW.proprietaire_id AND role = 'proprietaire'
    ) THEN
        -- Ajouter le rôle propriétaire
        INSERT INTO user_roles (user_id, role, created_at)
        VALUES (NEW.proprietaire_id, 'proprietaire', NOW())
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur vehicules
DROP TRIGGER IF EXISTS tr_add_proprietaire_role ON vehicules;
CREATE TRIGGER tr_add_proprietaire_role
    AFTER INSERT ON vehicules
    FOR EACH ROW
    EXECUTE FUNCTION add_proprietaire_role();

-- 6. MIGRATION : Ajouter le rôle propriétaire aux utilisateurs qui ont déjà des véhicules
INSERT INTO user_roles (user_id, role, created_at)
SELECT DISTINCT v.proprietaire_id, 'proprietaire'::user_role, NOW()
FROM vehicules v
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = v.proprietaire_id AND ur.role = 'proprietaire'
)
ON CONFLICT DO NOTHING;

-- Vérification
SELECT 'Configuration terminée!' as status;
