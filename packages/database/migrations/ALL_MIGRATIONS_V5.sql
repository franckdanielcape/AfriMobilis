-- =====================================================
-- MIGRATIONS V5 - CORRECTION DÉFINITIVE
-- =====================================================

-- =====================================================
-- 0. TABLE PROFILES (CRITIQUE - DOIT EXISTER)
-- =====================================================

-- Créer profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    prenom VARCHAR(100),
    nom VARCHAR(100),
    telephone VARCHAR(20),
    role VARCHAR(50),
    ville_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 1. RÉPARER TICKETS
-- =====================================================

-- Vérifier/ajouter created_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'created_at')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'date_creation') THEN
        ALTER TABLE tickets ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'date_creation')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'created_at') THEN
        ALTER TABLE tickets RENAME COLUMN date_creation TO created_at;
    END IF;
END $$;

-- S'assurer que created_at existe
DO $$
BEGIN
    ALTER TABLE tickets ALTER COLUMN created_at SET DEFAULT NOW();
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Ajouter les colonnes nécessaires
DO $$
BEGIN
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_statut_check;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'passager_id') THEN
        ALTER TABLE tickets ADD COLUMN passager_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'type') THEN
        ALTER TABLE tickets ADD COLUMN type VARCHAR(50) DEFAULT 'reclamation';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'description') THEN
        ALTER TABLE tickets ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'statut') THEN
        ALTER TABLE tickets ADD COLUMN statut VARCHAR(50) DEFAULT 'soumis';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'priorite') THEN
        ALTER TABLE tickets ADD COLUMN priorite VARCHAR(20) DEFAULT 'normale';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'traite_par') THEN
        ALTER TABLE tickets ADD COLUMN traite_par UUID;
    END IF;
    
    UPDATE tickets SET statut = 'soumis' WHERE statut IS NULL OR statut = '';
    
    ALTER TABLE tickets ADD CONSTRAINT tickets_statut_check CHECK (statut IN ('soumis', 'en_cours', 'resolu', 'rejete'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur tickets: %', SQLERRM;
END $$;

-- =====================================================
-- 2. TABLES DE BASE
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID REFERENCES profiles(id),
    immatriculation VARCHAR(50),
    marque VARCHAR(100),
    modele VARCHAR(100),
    statut VARCHAR(50) DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id UUID REFERENCES vehicules(id),
    type_document VARCHAR(100),
    date_expiration DATE,
    statut VARCHAR(50) DEFAULT 'valide',
    date_notification DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS versements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id UUID REFERENCES vehicules(id),
    montant_attendu NUMERIC DEFAULT 0,
    montant_recu NUMERIC DEFAULT 0,
    date_attendue DATE,
    statut VARCHAR(50) DEFAULT 'attendu',
    date_notification DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pannes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id UUID REFERENCES vehicules(id),
    type_panne VARCHAR(100),
    description TEXT,
    cout_reparation NUMERIC DEFAULT 0,
    date_declaration DATE,
    statut VARCHAR(50) DEFAULT 'en_cours',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. NOTIFICATIONS
-- =====================================================
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('conformite', 'versement', 'sanction', 'ticket', 'panne', 'controle', 'system')),
    niveau VARCHAR(20) DEFAULT 'info' CHECK (niveau IN ('info', 'warning', 'urgent')),
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lien VARCHAR(500),
    reference_type VARCHAR(50),
    reference_id UUID,
    lue BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);

CREATE OR REPLACE FUNCTION creer_notification(
    p_user_id UUID, p_type VARCHAR, p_niveau VARCHAR, p_titre VARCHAR, p_message TEXT,
    p_lien VARCHAR DEFAULT NULL, p_reference_type VARCHAR DEFAULT NULL, p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, niveau, titre, message, lien, reference_type, reference_id)
    VALUES (p_user_id, p_type, p_niveau, p_titre, p_message, p_lien, p_reference_type, p_reference_id)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- =====================================================
-- 4. TICKETS ET COMMENTAIRES
-- =====================================================
DROP TABLE IF EXISTS ticket_comments CASCADE;

CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    auteur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'commentaire',
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    supprime BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);

-- Vue tickets SANS référence externe problématique
DROP VIEW IF EXISTS vue_tickets_complets CASCADE;

CREATE VIEW vue_tickets_complets AS
SELECT 
    t.*,
    (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id AND tc.supprime = FALSE) as nb_commentaires
FROM tickets t
ORDER BY t.created_at DESC;

-- Fonctions
CREATE OR REPLACE FUNCTION changer_statut_ticket(
    p_ticket_id UUID, p_nouveau_statut VARCHAR, p_agent_id UUID, p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_passager_id UUID;
BEGIN
    SELECT passager_id INTO v_passager_id FROM tickets WHERE id = p_ticket_id;
    IF v_passager_id IS NULL THEN RETURN FALSE; END IF;
    
    UPDATE tickets SET statut = p_nouveau_statut WHERE id = p_ticket_id;
    
    INSERT INTO ticket_comments (ticket_id, auteur_id, message, type, nouveau_statut)
    VALUES (p_ticket_id, p_agent_id, COALESCE(p_notes, 'Statut mis à jour'), 'changement_statut', p_nouveau_statut);
    
    PERFORM creer_notification(v_passager_id, 'ticket', 'info',
        format('Ticket %s', p_nouveau_statut), COALESCE(p_notes, 'Mise à jour'), 
        '/dashboard/tickets', 'ticket', p_ticket_id);
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION get_stats_tickets()
RETURNS TABLE(total BIGINT, soumis BIGINT, en_cours BIGINT, resolus BIGINT, rejetés BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE statut = 'soumis')::BIGINT,
        COUNT(*) FILTER (WHERE statut = 'en_cours')::BIGINT,
        COUNT(*) FILTER (WHERE statut = 'resolu')::BIGINT,
        COUNT(*) FILTER (WHERE statut = 'rejete')::BIGINT
    FROM tickets;
END;
$$;

-- =====================================================
-- 5. OBJETS PERDUS
-- =====================================================
DROP TABLE IF EXISTS objets_trouves CASCADE;
DROP TABLE IF EXISTS objets_perdus CASCADE;

CREATE TABLE objets_trouves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trouve_par_id UUID REFERENCES profiles(id),
    trouve_par_nom VARCHAR(255),
    trouve_par_telephone VARCHAR(20),
    categorie VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    couleur VARCHAR(50),
    lieu_trouve VARCHAR(255) NOT NULL,
    date_trouve DATE NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_attente',
    date_rendu TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objets_trouves_statut ON objets_trouves(statut);

CREATE TABLE objets_perdus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    categorie VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    couleur VARCHAR(50),
    lieu_perte VARCHAR(255) NOT NULL,
    date_perte DATE NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_attente',
    date_rendu TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objets_perdus_statut ON objets_perdus(statut);

-- Vue simple sans jointure complexe
DROP VIEW IF EXISTS vue_correspondances_potentielles CASCADE;

CREATE VIEW vue_correspondances_potentielles AS
SELECT 
    op.id as objet_perdu_id, op.description as objet_perdu_description, op.categorie as objet_perdu_categorie,
    op.couleur as objet_perdu_couleur, op.lieu_perte, op.date_perte, op.passager_id,
    ot.id as objet_trouve_id, ot.description as objet_trouve_description, ot.categorie as objet_trouve_categorie,
    ot.couleur as objet_trouve_couleur, ot.lieu_trouve, ot.date_trouve,
    CASE WHEN op.categorie = ot.categorie THEN 30 ELSE 0 END +
    CASE WHEN op.couleur = ot.couleur THEN 20 ELSE 0 END +
    CASE WHEN op.lieu_perte ILIKE '%' || ot.lieu_trouve || '%' THEN 20 ELSE 0 END +
    CASE WHEN ABS(op.date_perte - ot.date_trouve) <= 1 THEN 20 ELSE 0 END as score_correspondance
FROM objets_perdus op
CROSS JOIN objets_trouves ot
WHERE op.statut = 'en_attente' AND ot.statut = 'en_attente' AND op.categorie = ot.categorie
ORDER BY score_correspondance DESC;

CREATE OR REPLACE FUNCTION matcher_objets(p_objet_perdu_id UUID, p_objet_trouve_id UUID, p_matched_by UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_passager_id UUID;
BEGIN
    SELECT passager_id INTO v_passager_id FROM objets_perdus WHERE id = p_objet_perdu_id;
    UPDATE objets_perdus SET statut = 'matched' WHERE id = p_objet_perdu_id;
    UPDATE objets_trouves SET statut = 'matched' WHERE id = p_objet_trouve_id;
    PERFORM creer_notification(v_passager_id, 'system', 'info', 'Objet retrouvé !', 
        'Un objet correspondant a été trouvé.', '/dashboard/tickets', 'objet_perdu', p_objet_perdu_id);
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION get_stats_objets()
RETURNS TABLE(perdus_total BIGINT, perdus_en_attente BIGINT, trouves_total BIGINT, trouves_en_attente BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM objets_perdus)::BIGINT,
        (SELECT COUNT(*) FROM objets_perdus WHERE statut = 'en_attente')::BIGINT,
        (SELECT COUNT(*) FROM objets_trouves)::BIGINT,
        (SELECT COUNT(*) FROM objets_trouves WHERE statut = 'en_attente')::BIGINT;
END;
$$;

-- =====================================================
-- 6. RENTABILITÉ
-- =====================================================

CREATE OR REPLACE FUNCTION get_rentabilite_proprietaire(
    p_proprietaire_id UUID, p_date_debut DATE DEFAULT NULL, p_date_fin DATE DEFAULT NULL
)
RETURNS TABLE(
    total_vehicules BIGINT, vehicules_actifs BIGINT,
    total_versements_attendus NUMERIC, total_versements_recus NUMERIC, taux_recouvrement NUMERIC,
    nombre_versements_en_retard BIGINT, montant_retard NUMERIC,
    total_pannes BIGINT, pannes_en_cours BIGINT, cout_total_pannes NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_date_debut IS NULL THEN p_date_debut := DATE_TRUNC('year', CURRENT_DATE)::DATE; END IF;
    IF p_date_fin IS NULL THEN p_date_fin := CURRENT_DATE; END IF;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM vehicules WHERE proprietaire_id = p_proprietaire_id)::BIGINT,
        (SELECT COUNT(*) FROM vehicules WHERE proprietaire_id = p_proprietaire_id AND statut = 'actif')::BIGINT,
        COALESCE(SUM(v.montant_attendu), 0),
        COALESCE(SUM(v.montant_recu), 0),
        CASE WHEN COALESCE(SUM(v.montant_attendu), 0) > 0 THEN ROUND((COALESCE(SUM(v.montant_recu), 0) / SUM(v.montant_attendu)) * 100, 2) ELSE 0 END,
        COUNT(*) FILTER (WHERE v.statut = 'en_retard')::BIGINT,
        COALESCE(SUM(v.montant_attendu) FILTER (WHERE v.statut = 'en_retard'), 0),
        (SELECT COUNT(*) FROM pannes pa JOIN vehicules ve ON ve.id = pa.vehicule_id WHERE ve.proprietaire_id = p_proprietaire_id AND pa.date_declaration BETWEEN p_date_debut AND p_date_fin)::BIGINT,
        (SELECT COUNT(*) FROM pannes pa JOIN vehicules ve ON ve.id = pa.vehicule_id WHERE ve.proprietaire_id = p_proprietaire_id AND pa.statut = 'en_cours')::BIGINT,
        COALESCE((SELECT SUM(cout_reparation) FROM pannes pa JOIN vehicules ve ON ve.id = pa.vehicule_id WHERE ve.proprietaire_id = p_proprietaire_id AND pa.date_declaration BETWEEN p_date_debut AND p_date_fin), 0)
    FROM versements v
    JOIN vehicules ve ON ve.id = v.vehicule_id
    WHERE ve.proprietaire_id = p_proprietaire_id AND v.date_attendue BETWEEN p_date_debut AND p_date_fin;
END;
$$;

CREATE OR REPLACE FUNCTION get_versements_par_mois(p_proprietaire_id UUID, p_nombre_mois INTEGER DEFAULT 6)
RETURNS TABLE(mois DATE, mois_label TEXT, attendus NUMERIC, recus NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH mois_series AS (
        SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - (p_nombre_mois - 1 || ' months')::INTERVAL)::DATE,
            DATE_TRUNC('month', CURRENT_DATE)::DATE, '1 month'::INTERVAL
        )::DATE as mois_date
    )
    SELECT 
        ms.mois_date, TO_CHAR(ms.mois_date, 'MM/YYYY'),
        COALESCE(SUM(v.montant_attendu), 0), COALESCE(SUM(v.montant_recu), 0)
    FROM mois_series ms
    LEFT JOIN versements v ON DATE_TRUNC('month', v.date_attendue)::DATE = ms.mois_date
    LEFT JOIN vehicules ve ON ve.id = v.vehicule_id AND ve.proprietaire_id = p_proprietaire_id
    GROUP BY ms.mois_date ORDER BY ms.mois_date;
END;
$$;

CREATE OR REPLACE FUNCTION get_performance_vehicules(p_proprietaire_id UUID)
RETURNS TABLE(
    vehicule_id UUID, immatriculation VARCHAR, marque VARCHAR, modele VARCHAR, statut VARCHAR,
    total_versements_attendus NUMERIC, total_versements_recus NUMERIC, taux_recouvrement NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ve.id, ve.immatriculation, ve.marque, ve.modele, ve.statut,
        COALESCE(SUM(v.montant_attendu), 0), COALESCE(SUM(v.montant_recu), 0),
        CASE WHEN COALESCE(SUM(v.montant_attendu), 0) > 0 
            THEN ROUND((COALESCE(SUM(v.montant_recu), 0) / SUM(v.montant_attendu)) * 100, 2)
            ELSE 0 END
    FROM vehicules ve
    LEFT JOIN versements v ON v.vehicule_id = ve.id
    WHERE ve.proprietaire_id = p_proprietaire_id
    GROUP BY ve.id, ve.immatriculation, ve.marque, ve.modele, ve.statut
    ORDER BY 7 DESC NULLS LAST;
END;
$$;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT '=== MIGRATIONS V5 TERMINÉES ===' as status;

SELECT 'Tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'notifications', 'ticket_comments', 'objets_perdus', 'objets_trouves')
ORDER BY table_name;

SELECT '✅ Succès !' as message;
