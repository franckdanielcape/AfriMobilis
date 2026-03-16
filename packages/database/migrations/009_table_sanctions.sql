-- =====================================================
-- MIGRATION 009: Table des Sanctions et Avertissements
-- =====================================================

-- =====================================================
-- 1. SUPPRIMER LA TABLE SI ELLE EXISTE (pour recréation propre)
-- =====================================================

DROP TABLE IF EXISTS sanctions CASCADE;

-- =====================================================
-- 2. TABLE DES SANCTIONS
-- =====================================================

CREATE TABLE sanctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Références
    vehicule_id UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
    chauffeur_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Informations de la sanction
    type_sanction VARCHAR(50) NOT NULL CHECK (type_sanction IN ('avertissement', 'legere', 'lourde', 'suspension')),
    motif TEXT NOT NULL,
    description TEXT,
    
    -- Workflow de validation
    statut VARCHAR(50) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'annule')),
    
    -- Qui crée et qui valide
    cree_par UUID NOT NULL REFERENCES profiles(id),
    valide_par UUID REFERENCES profiles(id),
    
    -- Dates
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_validation TIMESTAMP WITH TIME ZONE,
    date_incident TIMESTAMP WITH TIME ZONE,
    
    -- Preuves (photos, documents)
    preuves JSONB DEFAULT '[]'::jsonb,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_sanctions_vehicule ON sanctions(vehicule_id);
CREATE INDEX idx_sanctions_chauffeur ON sanctions(chauffeur_id);
CREATE INDEX idx_sanctions_statut ON sanctions(statut);
CREATE INDEX idx_sanctions_type ON sanctions(type_sanction);
CREATE INDEX idx_sanctions_cree_par ON sanctions(cree_par);
CREATE INDEX idx_sanctions_date_creation ON sanctions(date_creation DESC);

-- =====================================================
-- 3. FONCTION POUR METTRE À JOUR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_sanctions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sanctions_updated_at ON sanctions;
CREATE TRIGGER trigger_update_sanctions_updated_at
    BEFORE UPDATE ON sanctions
    FOR EACH ROW
    EXECUTE FUNCTION update_sanctions_updated_at();

-- =====================================================
-- 4. VUE POUR FACILITER LES REQUÊTES
-- =====================================================

DROP VIEW IF EXISTS vue_sanctions_complets;

CREATE VIEW vue_sanctions_complets AS
SELECT 
    s.*,
    v.immatriculation,
    v.statut as vehicule_statut,
    prop.nom as proprietaire_nom,
    prop.prenom as proprietaire_prenom,
    prop.telephone as proprietaire_telephone,
    c.nom as chauffeur_nom,
    c.prenom as chauffeur_prenom,
    c.telephone as chauffeur_telephone,
    creator.nom as createur_nom,
    creator.prenom as createur_prenom,
    validator.nom as validateur_nom,
    validator.prenom as validateur_prenom,
    prof.ville_id,
    vil.nom as ville_nom
FROM sanctions s
JOIN vehicules v ON s.vehicule_id = v.id
LEFT JOIN profiles prop ON v.proprietaire_id = prop.id
LEFT JOIN profiles c ON s.chauffeur_id = c.id
JOIN profiles creator ON s.cree_par = creator.id
LEFT JOIN profiles validator ON s.valide_par = validator.id
LEFT JOIN profiles prof ON prof.id = v.proprietaire_id
LEFT JOIN villes vil ON prof.ville_id = vil.id;

-- =====================================================
-- 5. POLITIQUES RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Super admin voit toutes les sanctions" ON sanctions;
DROP POLICY IF EXISTS "Chef de ligne voit sanctions de sa ville" ON sanctions;
DROP POLICY IF EXISTS "Proprietaire voit sanctions de ses vehicules" ON sanctions;
DROP POLICY IF EXISTS "Chauffeur voit ses sanctions" ON sanctions;
DROP POLICY IF EXISTS "Agent peut creer des sanctions" ON sanctions;
DROP POLICY IF EXISTS "Createur peut modifier sa sanction" ON sanctions;
DROP POLICY IF EXISTS "Createur ou admin peut supprimer sanction" ON sanctions;

-- Politique: Les super admins voient tout
CREATE POLICY "Super admin voit toutes les sanctions"
ON sanctions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role::text = 'super_admin'
    )
);

-- Politique: Les Chefs de Ligne voient les sanctions de leur ville
CREATE POLICY "Chef de ligne voit sanctions de sa ville"
ON sanctions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN vehicules v ON v.id = sanctions.vehicule_id
        JOIN profiles prop ON prop.id = v.proprietaire_id
        WHERE p.id = auth.uid()
        AND (p.role::text = 'chef_ligne' OR p.role::text = 'admin_syndicat' OR p.role::text = 'super_chef_de_ligne')
        AND prop.ville_id = p.ville_id
    )
);

-- Politique: Les propriétaires voient les sanctions de leurs véhicules
CREATE POLICY "Proprietaire voit sanctions de ses vehicules"
ON sanctions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM vehicules v
        JOIN profiles p ON p.id = v.proprietaire_id
        WHERE v.id = sanctions.vehicule_id
        AND p.id = auth.uid()
    )
);

-- Politique: Les chauffeurs voient leurs propres sanctions
CREATE POLICY "Chauffeur voit ses sanctions"
ON sanctions FOR SELECT
TO authenticated
USING (
    chauffeur_id = auth.uid()
);

-- Politique: Les agents terrain et Chefs peuvent créer des sanctions
CREATE POLICY "Agent peut creer des sanctions"
ON sanctions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role::text = 'agent_terrain' OR profiles.role::text = 'chef_ligne' OR profiles.role::text = 'admin_syndicat' OR profiles.role::text = 'super_chef_de_ligne')
    )
);

-- Politique: Le créateur peut modifier sa sanction (tant qu'elle est en attente)
CREATE POLICY "Createur peut modifier sa sanction"
ON sanctions FOR UPDATE
TO authenticated
USING (
    (cree_par = auth.uid() AND statut = 'en_attente') OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role::text = 'chef_ligne' OR profiles.role::text = 'admin_syndicat' OR profiles.role::text = 'super_chef_de_ligne' OR profiles.role::text = 'super_admin')
    )
);

-- Politique: Le créateur ou admin peut supprimer
CREATE POLICY "Createur ou admin peut supprimer sanction"
ON sanctions FOR DELETE
TO authenticated
USING (
    cree_par = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role::text = 'super_admin' OR profiles.role::text = 'chef_ligne' OR profiles.role::text = 'admin_syndicat' OR profiles.role::text = 'super_chef_de_ligne')
    )
);

-- =====================================================
-- 6. FONCTION POUR STATISTIQUES DES SANCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS get_stats_sanctions(UUID);

CREATE OR REPLACE FUNCTION get_stats_sanctions(p_ville_id UUID)
RETURNS TABLE (
    total_sanctions BIGINT,
    en_attente BIGINT,
    validees BIGINT,
    annulees BIGINT,
    avertissements BIGINT,
    legeres BIGINT,
    lourdes BIGINT,
    suspensions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_sanctions,
        COUNT(*) FILTER (WHERE s.statut = 'en_attente')::BIGINT as en_attente,
        COUNT(*) FILTER (WHERE s.statut = 'valide')::BIGINT as validees,
        COUNT(*) FILTER (WHERE s.statut = 'annule')::BIGINT as annulees,
        COUNT(*) FILTER (WHERE s.type_sanction = 'avertissement')::BIGINT as avertissements,
        COUNT(*) FILTER (WHERE s.type_sanction = 'legere')::BIGINT as legeres,
        COUNT(*) FILTER (WHERE s.type_sanction = 'lourde')::BIGINT as lourdes,
        COUNT(*) FILTER (WHERE s.type_sanction = 'suspension')::BIGINT as suspensions
    FROM sanctions s
    JOIN vehicules v ON s.vehicule_id = v.id
    JOIN profiles p ON v.proprietaire_id = p.id
    WHERE p.ville_id = p_ville_id
    AND s.date_creation >= NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUCCESS
-- =====================================================

SELECT 'Migration 009 (Table sanctions) appliquée avec succès!' as status;
