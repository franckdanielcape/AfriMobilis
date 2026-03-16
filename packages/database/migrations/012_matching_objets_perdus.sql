-- =====================================================
-- MIGRATION 012: Matching Objets Perdus/Retrouvés
-- =====================================================
-- Système de matching entre objets perdus et objets trouvés

-- =====================================================
-- 1. TABLE OBJETS PERDUS (amélioration)
-- =====================================================

-- Supprimer et recréer proprement
DROP TABLE IF EXISTS objets_perdus CASCADE;

CREATE TABLE objets_perdus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Référence au passager
    passager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Description de l'objet
    categorie VARCHAR(100) NOT NULL,  -- telephone, portefeuille, sac, bijou, cle, autre
    description TEXT NOT NULL,
    couleur VARCHAR(50),
    marque VARCHAR(100),
    
    -- Où et quand
    lieu_perte VARCHAR(255) NOT NULL,
    date_perte DATE NOT NULL,
    heure_perte TIME,
    
    -- Dans quel véhicule (si connu)
    vehicule_immatriculation VARCHAR(20),
    
    -- Contact
    telephone_contact VARCHAR(20),
    email_contact VARCHAR(255),
    
    -- Workflow
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'matched', 'rendu', 'abandonne')),
    
    -- Matching
    objet_trouve_id UUID REFERENCES objets_trouves(id) ON DELETE SET NULL,
    date_matching TIMESTAMP,
    matched_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Rendu
    date_rendu TIMESTAMP,
    rendu_a UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes_rendu TEXT,
    
    -- Métadonnées
    date_creation TIMESTAMP DEFAULT NOW(),
    date_maj TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objets_perdus_passager ON objets_perdus(passager_id);
CREATE INDEX idx_objets_perdus_statut ON objets_perdus(statut);
CREATE INDEX idx_objets_perdus_categorie ON objets_perdus(categorie);
CREATE INDEX idx_objets_perdus_date ON objets_perdus(date_perte);

-- =====================================================
-- 2. TABLE OBJETS TROUVES
-- =====================================================

DROP TABLE IF EXISTS objets_trouves CASCADE;

CREATE TABLE objets_trouves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Qui a trouvé (peut être anonyme)
    trouve_par_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    trouve_par_nom VARCHAR(255),  -- Si anonyme
    trouve_par_telephone VARCHAR(20),  -- Si anonyme
    
    -- Description
    categorie VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    couleur VARCHAR(50),
    marque VARCHAR(100),
    
    -- Où et quand
    lieu_trouve VARCHAR(255) NOT NULL,
    date_trouve DATE NOT NULL,
    heure_trouve TIME,
    
    -- Dans quel véhicule
    vehicule_immatriculation VARCHAR(20),
    
    -- Où déposé (garage, syndicat...)
    lieu_depose VARCHAR(255),
    
    -- Workflow
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'matched', 'rendu')),
    
    -- Matching
    objet_perdu_id UUID REFERENCES objets_perdus(id) ON DELETE SET NULL,
    date_matching TIMESTAMP,
    matched_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Rendu
    date_rendu TIMESTAMP,
    rendu_au_nom VARCHAR(255),
    notes_rendu TEXT,
    
    -- Métadonnées
    date_creation TIMESTAMP DEFAULT NOW(),
    date_maj TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objets_trouves_statut ON objets_trouves(statut);
CREATE INDEX idx_objets_trouves_categorie ON objets_trouves(categorie);
CREATE INDEX idx_objets_trouves_date ON objets_trouves(date_trouve);

-- =====================================================
-- 3. VUES POUR L'INTERFACE
-- =====================================================

-- Vue objets perdus avec infos passager
CREATE OR REPLACE VIEW vue_objets_perdus AS
SELECT 
    op.*,
    p.prenom as passager_prenom,
    p.nom as passager_nom,
    p.email as passager_email,
    p.telephone as passager_telephone,
    -- Info objet trouvé matché
    ot.description as objet_trouve_description,
    ot.lieu_trouve as objet_trouve_lieu,
    ot.date_trouve as objet_trouve_date
FROM objets_perdus op
LEFT JOIN profiles p ON p.id = op.passager_id
LEFT JOIN objets_trouves ot ON ot.id = op.objet_trouve_id
ORDER BY op.date_creation DESC;

-- Vue objets trouvés
CREATE OR REPLACE VIEW vue_objets_trouves AS
SELECT 
    ot.*,
    p.prenom as trouve_par_prenom,
    p.nom as trouve_par_nom,
    -- Info objet perdu matché
    op.description as objet_perdu_description,
    op.passager_id as objet_perdu_passager_id,
    op2.prenom as objet_perdu_prenom,
    op2.nom as objet_perdu_nom
FROM objets_trouves ot
LEFT JOIN profiles p ON p.id = ot.trouve_par_id
LEFT JOIN objets_perdus op ON op.id = ot.objet_perdu_id
LEFT JOIN profiles op2 ON op2.id = op.passager_id
ORDER BY ot.date_creation DESC;

-- Vue des correspondances potentielles
CREATE OR REPLACE VIEW vue_correspondances_potentielles AS
SELECT 
    op.id as objet_perdu_id,
    op.description as objet_perdu_description,
    op.categorie as objet_perdu_categorie,
    op.couleur as objet_perdu_couleur,
    op.lieu_perte,
    op.date_perte,
    op.passager_id,
    p.prenom as passager_prenom,
    p.nom as passager_nom,
    
    ot.id as objet_trouve_id,
    ot.description as objet_trouve_description,
    ot.categorie as objet_trouve_categorie,
    ot.couleur as objet_trouve_couleur,
    ot.lieu_trouve,
    ot.date_trouve,
    
    -- Score de correspondance simple
    CASE 
        WHEN op.categorie = ot.categorie THEN 30 ELSE 0
    END +
    CASE 
        WHEN op.couleur = ot.couleur THEN 20 ELSE 0
    END +
    CASE 
        WHEN op.lieu_perte ILIKE '%' || ot.lieu_trouve || '%' THEN 20 ELSE 0
    END +
    CASE 
        WHEN ABS(op.date_perte - ot.date_trouve) <= 1 THEN 20 ELSE 0
    END as score_correspondance
    
FROM objets_perdus op
CROSS JOIN objets_trouves ot
WHERE op.statut = 'en_attente'
  AND ot.statut = 'en_attente'
  AND op.categorie = ot.categorie  -- Au moins la même catégorie
ORDER BY score_correspondance DESC, op.date_creation DESC;

-- =====================================================
-- 4. FONCTION : Créer un objet perdu
-- =====================================================
CREATE OR REPLACE FUNCTION creer_objet_perdu(
    p_passager_id UUID,
    p_categorie VARCHAR,
    p_description TEXT,
    p_couleur VARCHAR,
    p_marque VARCHAR,
    p_lieu_perte VARCHAR,
    p_date_perte DATE,
    p_heure_perte TIME,
    p_vehicule_immatriculation VARCHAR,
    p_telephone_contact VARCHAR,
    p_email_contact VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_objet_id UUID;
BEGIN
    INSERT INTO objets_perdus (
        passager_id,
        categorie,
        description,
        couleur,
        marque,
        lieu_perte,
        date_perte,
        heure_perte,
        vehicule_immatriculation,
        telephone_contact,
        email_contact
    ) VALUES (
        p_passager_id,
        p_categorie,
        p_description,
        p_couleur,
        p_marque,
        p_lieu_perte,
        p_date_perte,
        p_heure_perte,
        p_vehicule_immatriculation,
        p_telephone_contact,
        p_email_contact
    )
    RETURNING id INTO v_objet_id;
    
    -- Notifier les admins
    PERFORM creer_notification(
        (SELECT id FROM profiles 
         WHERE role IN ('chef_ligne', 'super_chef_de_ligne', 'admin_syndicat') 
         LIMIT 1),
        'system',
        'info',
        'Nouvel objet perdu signalé',
        format('Un %s a été perdu le %s.', p_categorie, TO_CHAR(p_date_perte, 'DD/MM/YYYY')),
        '/dashboard/objets/admin',
        'objet_perdu',
        v_objet_id
    );
    
    RETURN v_objet_id;
END;
$$;

-- =====================================================
-- 5. FONCTION : Créer un objet trouvé
-- =====================================================
CREATE OR REPLACE FUNCTION creer_objet_trouve(
    p_trouve_par_id UUID,
    p_trouve_par_nom VARCHAR,
    p_trouve_par_telephone VARCHAR,
    p_categorie VARCHAR,
    p_description TEXT,
    p_couleur VARCHAR,
    p_marque VARCHAR,
    p_lieu_trouve VARCHAR,
    p_date_trouve DATE,
    p_heure_trouve TIME,
    p_vehicule_immatriculation VARCHAR,
    p_lieu_depose VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_objet_id UUID;
BEGIN
    INSERT INTO objets_trouves (
        trouve_par_id,
        trouve_par_nom,
        trouve_par_telephone,
        categorie,
        description,
        couleur,
        marque,
        lieu_trouve,
        date_trouve,
        heure_trouve,
        vehicule_immatriculation,
        lieu_depose
    ) VALUES (
        p_trouve_par_id,
        p_trouve_par_nom,
        p_trouve_par_telephone,
        p_categorie,
        p_description,
        p_couleur,
        p_marque,
        p_lieu_trouve,
        p_date_trouve,
        p_heure_trouve,
        p_vehicule_immatriculation,
        p_lieu_depose
    )
    RETURNING id INTO v_objet_id;
    
    -- Notifier les admins
    PERFORM creer_notification(
        (SELECT id FROM profiles 
         WHERE role IN ('chef_ligne', 'super_chef_de_ligne', 'admin_syndicat') 
         LIMIT 1),
        'system',
        'info',
        'Nouvel objet trouvé',
        format('Un %s a été trouvé le %s.', p_categorie, TO_CHAR(p_date_trouve, 'DD/MM/YYYY')),
        '/dashboard/objets/admin',
        'objet_trouve',
        v_objet_id
    );
    
    RETURN v_objet_id;
END;
$$;

-- =====================================================
-- 6. FONCTION : Matcher un objet perdu avec un objet trouvé
-- =====================================================
CREATE OR REPLACE FUNCTION matcher_objets(
    p_objet_perdu_id UUID,
    p_objet_trouve_id UUID,
    p_matched_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_passager_id UUID;
BEGIN
    -- Vérifier que les objets existent et sont en attente
    IF NOT EXISTS (
        SELECT 1 FROM objets_perdus 
        WHERE id = p_objet_perdu_id AND statut = 'en_attente'
    ) OR NOT EXISTS (
        SELECT 1 FROM objets_trouves 
        WHERE id = p_objet_trouve_id AND statut = 'en_attente'
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Récupérer le passager
    SELECT passager_id INTO v_passager_id 
    FROM objets_perdus WHERE id = p_objet_perdu_id;
    
    -- Mettre à jour l'objet perdu
    UPDATE objets_perdus 
    SET 
        statut = 'matched',
        objet_trouve_id = p_objet_trouve_id,
        date_matching = NOW(),
        matched_by = p_matched_by,
        date_maj = NOW()
    WHERE id = p_objet_perdu_id;
    
    -- Mettre à jour l'objet trouvé
    UPDATE objets_trouves 
    SET 
        statut = 'matched',
        objet_perdu_id = p_objet_perdu_id,
        date_matching = NOW(),
        matched_by = p_matched_by,
        date_maj = NOW()
    WHERE id = p_objet_trouve_id;
    
    -- Notifier le passager
    PERFORM creer_notification(
        v_passager_id,
        'system',
        'info',
        'Votre objet a été retrouvé !',
        'Un objet correspondant à votre signalement a été trouvé. Contactez le syndicat.',
        '/dashboard/tickets',
        'objet_perdu',
        p_objet_perdu_id,
        p_matched_by
    );
    
    RETURN TRUE;
END;
$$;

-- =====================================================
-- 7. FONCTION : Marquer comme rendu
-- =====================================================
CREATE OR REPLACE FUNCTION marquer_objet_rendu(
    p_objet_perdu_id UUID,
    p_rendu_par UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_objet_trouve_id UUID;
    v_passager_id UUID;
BEGIN
    -- Récupérer l'objet trouvé associé
    SELECT objet_trouve_id, passager_id 
    INTO v_objet_trouve_id, v_passager_id
    FROM objets_perdus 
    WHERE id = p_objet_perdu_id;
    
    -- Mettre à jour l'objet perdu
    UPDATE objets_perdus 
    SET 
        statut = 'rendu',
        date_rendu = NOW(),
        rendu_a = p_rendu_par,
        notes_rendu = p_notes,
        date_maj = NOW()
    WHERE id = p_objet_perdu_id;
    
    -- Mettre à jour l'objet trouvé
    IF v_objet_trouve_id IS NOT NULL THEN
        UPDATE objets_trouves 
        SET 
            statut = 'rendu',
            date_rendu = NOW(),
            notes_rendu = p_notes,
            date_maj = NOW()
        WHERE id = v_objet_trouve_id;
    END IF;
    
    -- Notifier le passager
    PERFORM creer_notification(
        v_passager_id,
        'system',
        'info',
        'Objet rendu',
        'Votre objet vous a été rendu. Merci pour votre confiance.',
        '/dashboard/tickets',
        'objet_perdu',
        p_objet_perdu_id,
        p_rendu_par
    );
    
    RETURN TRUE;
END;
$$;

-- =====================================================
-- 8. FONCTION : Stats objets
-- =====================================================
CREATE OR REPLACE FUNCTION get_stats_objets()
RETURNS TABLE(
    perdus_total BIGINT,
    perdus_en_attente BIGINT,
    perdus_matched BIGINT,
    perdus_rendus BIGINT,
    trouves_total BIGINT,
    trouves_en_attente BIGINT,
    trouves_matched BIGINT,
    trouves_rendus BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM objets_perdus)::BIGINT as perdus_total,
        (SELECT COUNT(*) FROM objets_perdus WHERE statut = 'en_attente')::BIGINT as perdus_en_attente,
        (SELECT COUNT(*) FROM objets_perdus WHERE statut = 'matched')::BIGINT as perdus_matched,
        (SELECT COUNT(*) FROM objets_perdus WHERE statut = 'rendu')::BIGINT as perdus_rendus,
        (SELECT COUNT(*) FROM objets_trouves)::BIGINT as trouves_total,
        (SELECT COUNT(*) FROM objets_trouves WHERE statut = 'en_attente')::BIGINT as trouves_en_attente,
        (SELECT COUNT(*) FROM objets_trouves WHERE statut = 'matched')::BIGINT as trouves_matched,
        (SELECT COUNT(*) FROM objets_trouves WHERE statut = 'rendu')::BIGINT as trouves_rendus;
END;
$$;

-- =====================================================
-- 9. RLS POLICIES
-- =====================================================

-- Objets perdus
ALTER TABLE objets_perdus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passagers can view their own lost objects"
ON objets_perdus FOR SELECT
TO authenticated
USING (
    passager_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
          AND p.role IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin')
    )
);

CREATE POLICY "Passagers can create lost objects"
ON objets_perdus FOR INSERT
TO authenticated
WITH CHECK (passager_id = auth.uid());

CREATE POLICY "Admins can update lost objects"
ON objets_perdus FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
          AND p.role IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin')
    )
);

-- Objets trouvés
ALTER TABLE objets_trouves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view found objects"
ON objets_trouves FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Authenticated can create found objects"
ON objets_trouves FOR INSERT
TO authenticated
WITH CHECK (TRUE);

CREATE POLICY "Admins can update found objects"
ON objets_trouves FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
          AND p.role IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin')
    )
);

-- =====================================================
-- 10. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE objets_perdus IS 'Objets perdus signalés par les passagers';
COMMENT ON TABLE objets_trouves IS 'Objets trouvés et déposés';
COMMENT ON COLUMN objets_perdus.statut IS 'Workflow: en_attente -> matched -> rendu';
COMMENT ON COLUMN objets_trouves.statut IS 'Workflow: en_attente -> matched -> rendu';

-- =====================================================
-- FIN MIGRATION 012
-- =====================================================
