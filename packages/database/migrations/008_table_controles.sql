-- =====================================================
-- MIGRATION 008: Table des Contrôles Terrain
-- =====================================================

-- =====================================================
-- 0. AJOUTER LE ROLE MANQUANT A L'ENUM (dans une transaction séparée)
-- =====================================================

-- Note: Cette opération doit être faite avant d'utiliser la valeur dans les politiques
-- Si vous avez une erreur, exécutez d'abord:
-- ALTER TYPE user_role ADD VALUE 'super_chef_de_ligne';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'super_chef_de_ligne' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'super_chef_de_ligne';
    END IF;
END $$;

-- =====================================================
-- 1. TABLE DES CONTRÔLES
-- =====================================================

CREATE TABLE IF NOT EXISTS controles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Références
    vehicule_id UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Informations du contrôle
    date_controle TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    lieu VARCHAR(255),
    
    -- Résultat du contrôle
    resultat VARCHAR(50) NOT NULL CHECK (resultat IN ('conforme', 'non_conforme', 'avertissement')),
    
    -- Détails
    note TEXT,
    
    -- Documents/scans si applicable
    preuves JSONB DEFAULT '[]'::jsonb,
    
    -- Conformité vérifiée (checkboxes)
    conformite_documents BOOLEAN DEFAULT false,
    conformite_plaque BOOLEAN DEFAULT false,
    conformite_assurance BOOLEAN DEFAULT false,
    conformite_carte_stationnement BOOLEAN DEFAULT false,
    conformite_visite_technique BOOLEAN DEFAULT false,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_controles_vehicule ON controles(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_controles_agent ON controles(agent_id);
CREATE INDEX IF NOT EXISTS idx_controles_date ON controles(date_controle DESC);
CREATE INDEX IF NOT EXISTS idx_controles_resultat ON controles(resultat);
CREATE INDEX IF NOT EXISTS idx_controles_date_resultat ON controles(date_controle DESC, resultat);
CREATE INDEX IF NOT EXISTS idx_controles_vehicule_agent_date ON controles(vehicule_id, agent_id, date_controle);

-- =====================================================
-- 2. FONCTION POUR METTRE À JOUR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_controles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_controles_updated_at ON controles;
CREATE TRIGGER trigger_update_controles_updated_at
    BEFORE UPDATE ON controles
    FOR EACH ROW
    EXECUTE FUNCTION update_controles_updated_at();

-- =====================================================
-- 3. VUE POUR FACILITER LES REQUÊTES
-- =====================================================

DROP VIEW IF EXISTS vue_controles_complets;

CREATE VIEW vue_controles_complets AS
SELECT 
    c.*,
    v.immatriculation,
    v.statut as vehicule_statut,
    p.nom as proprietaire_nom,
    p.prenom as proprietaire_prenom,
    p.telephone as proprietaire_telephone,
    a.nom as agent_nom,
    a.prenom as agent_prenom,
    a.telephone as agent_telephone,
    prof.ville_id,
    vil.nom as ville_nom
FROM controles c
JOIN vehicules v ON c.vehicule_id = v.id
LEFT JOIN profiles p ON v.proprietaire_id = p.id
JOIN profiles a ON c.agent_id = a.id
LEFT JOIN profiles prof ON prof.id = v.proprietaire_id
LEFT JOIN villes vil ON prof.ville_id = vil.id;

-- =====================================================
-- 4. POLITIQUES RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE controles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Super admin voit tous les controles" ON controles;
DROP POLICY IF EXISTS "Chef de ligne voit controles de sa ville" ON controles;
DROP POLICY IF EXISTS "Agent voit ses propres controles" ON controles;
DROP POLICY IF EXISTS "Proprietaire voit controles de ses vehicules" ON controles;
DROP POLICY IF EXISTS "Agent peut créer des controles" ON controles;
DROP POLICY IF EXISTS "Chef de ligne peut créer des controles" ON controles;
DROP POLICY IF EXISTS "Seul créateur ou admin modifie controle" ON controles;
DROP POLICY IF EXISTS "Seul créateur ou admin supprime controle" ON controles;

-- Politique: Les super admins voient tout
CREATE POLICY "Super admin voit tous les controles"
ON controles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'super_admin'
    )
);

-- Politique: Les Chefs de Ligne et Super Chefs voient les contrôles de leur ville
-- Utilisation de texte pour éviter le problème d'enum
CREATE POLICY "Chef de ligne voit controles de sa ville"
ON controles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN vehicules v ON v.id = controles.vehicule_id
        JOIN profiles prop ON prop.id = v.proprietaire_id
        WHERE p.id = auth.uid()
        AND (p.role::text = 'chef_ligne' OR p.role::text = 'admin_syndicat' OR p.role::text = 'super_chef_de_ligne')
        AND prop.ville_id = p.ville_id
    )
);

-- Politique: Les agents terrain voient leurs propres contrôles
CREATE POLICY "Agent voit ses propres controles"
ON controles FOR SELECT
TO authenticated
USING (
    agent_id = auth.uid()
);

-- Politique: Les propriétaires voient les contrôles de leurs véhicules
CREATE POLICY "Proprietaire voit controles de ses vehicules"
ON controles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM vehicules v
        JOIN profiles p ON p.id = v.proprietaire_id
        WHERE v.id = controles.vehicule_id
        AND p.id = auth.uid()
    )
);

-- Politique: Les agents terrain peuvent créer des contrôles
CREATE POLICY "Agent peut créer des controles"
ON controles FOR INSERT
TO authenticated
WITH CHECK (
    agent_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role::text = 'agent_terrain'
    )
);

-- Politique: Les Chefs de Ligne et Super Chefs peuvent créer des contrôles
CREATE POLICY "Chef de ligne peut créer des controles"
ON controles FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role::text = 'chef_ligne' OR profiles.role::text = 'admin_syndicat' OR profiles.role::text = 'super_chef_de_ligne')
    )
);

-- Politique: Seul le créateur ou un admin peut modifier/supprimer
CREATE POLICY "Seul créateur ou admin modifie controle"
ON controles FOR UPDATE
TO authenticated
USING (
    agent_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role::text = 'super_admin' OR profiles.role::text = 'chef_ligne' OR profiles.role::text = 'admin_syndicat' OR profiles.role::text = 'super_chef_de_ligne')
    )
);

CREATE POLICY "Seul créateur ou admin supprime controle"
ON controles FOR DELETE
TO authenticated
USING (
    agent_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role::text = 'super_admin' OR profiles.role::text = 'chef_ligne' OR profiles.role::text = 'admin_syndicat' OR profiles.role::text = 'super_chef_de_ligne')
    )
);

-- =====================================================
-- 5. FONCTION POUR STATISTIQUES DES CONTRÔLES
-- =====================================================

DROP FUNCTION IF EXISTS get_stats_controles(UUID);

CREATE OR REPLACE FUNCTION get_stats_controles(p_ville_id UUID)
RETURNS TABLE (
    total_controles BIGINT,
    conformes BIGINT,
    non_conformes BIGINT,
    avertissements BIGINT,
    taux_conformite NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_controles,
        COUNT(*) FILTER (WHERE c.resultat = 'conforme')::BIGINT as conformes,
        COUNT(*) FILTER (WHERE c.resultat = 'non_conforme')::BIGINT as non_conformes,
        COUNT(*) FILTER (WHERE c.resultat = 'avertissement')::BIGINT as avertissements,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE c.resultat = 'conforme')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as taux_conformite
    FROM controles c
    JOIN vehicules v ON c.vehicule_id = v.id
    JOIN profiles p ON v.proprietaire_id = p.id
    WHERE p.ville_id = p_ville_id
    AND c.date_controle >= NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUCCESS
-- =====================================================

SELECT 'Migration 008 (Table controles) appliquée avec succès!' as status;
