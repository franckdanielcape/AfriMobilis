-- =====================================================
-- MIGRATIONS CONSOLIDÉES - VERSION 3 (CORRECTION COMPLÈTE)
-- =====================================================

-- =====================================================
-- 0. VÉRIFICATION STRUCTURE TABLE TICKETS
-- =====================================================
DO $$
BEGIN
    -- Vérifier et ajouter les colonnes manquantes dans tickets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'created_at') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'date_creation') THEN
        ALTER TABLE tickets ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'passager_id') THEN
        ALTER TABLE tickets ADD COLUMN passager_id UUID REFERENCES profiles(id);
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
END $$;

-- Renommer date_creation en created_at si nécessaire
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'date_creation')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'created_at') THEN
        ALTER TABLE tickets RENAME COLUMN date_creation TO created_at;
    END IF;
END $$;

-- =====================================================
-- CRÉATION TABLES MANQUANTES
-- =====================================================

-- Table documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id UUID,
    type_document VARCHAR(100),
    numero_document VARCHAR(255),
    date_emission DATE,
    date_expiration DATE,
    fichier_url TEXT,
    statut VARCHAR(50) DEFAULT 'valide',
    date_notification DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table versements
CREATE TABLE IF NOT EXISTS versements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id UUID,
    chauffeur_id UUID,
    montant_attendu NUMERIC DEFAULT 0,
    montant_recu NUMERIC DEFAULT 0,
    date_attendue DATE,
    date_versement DATE,
    statut VARCHAR(50) DEFAULT 'attendu',
    date_notification DATE,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table pannes (ajouter colonne cout si manquante)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pannes') THEN
        CREATE TABLE pannes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            vehicule_id UUID,
            type_panne VARCHAR(100),
            description TEXT,
            cout_reparation NUMERIC DEFAULT 0,
            date_declaration DATE,
            statut VARCHAR(50) DEFAULT 'en_cours',
            created_at TIMESTAMP DEFAULT NOW()
        );
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pannes' AND column_name = 'cout_reparation') THEN
        ALTER TABLE pannes ADD COLUMN cout_reparation NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Table vehicules si manquante
CREATE TABLE IF NOT EXISTS vehicules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID,
    immatriculation VARCHAR(50),
    marque VARCHAR(100),
    modele VARCHAR(100),
    statut VARCHAR(50) DEFAULT 'actif',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table affectations si manquante
CREATE TABLE IF NOT EXISTS affectations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicule_id UUID,
    chauffeur_id UUID,
    statut VARCHAR(50) DEFAULT 'actif'
);

-- =====================================================
-- MIGRATION 010: NOTIFICATIONS
-- =====================================================
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('conformite', 'versement', 'sanction', 'ticket', 'panne', 'controle', 'system')),
    niveau VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (niveau IN ('info', 'warning', 'urgent')),
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lien VARCHAR(500),
    reference_type VARCHAR(50),
    reference_id UUID,
    lue BOOLEAN NOT NULL DEFAULT FALSE,
    date_lecture TIMESTAMP,
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID,
    metadata JSONB
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_lue ON notifications(user_id, lue);

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

CREATE OR REPLACE FUNCTION compter_notifications_non_lues(p_user_id UUID)
RETURNS TABLE(total BIGINT, info BIGINT, warning BIGINT, urgent BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(*)::BIGINT, 
           COUNT(*) FILTER (WHERE niveau = 'info')::BIGINT,
           COUNT(*) FILTER (WHERE niveau = 'warning')::BIGINT,
           COUNT(*) FILTER (WHERE niveau = 'urgent')::BIGINT
    FROM notifications WHERE user_id = p_user_id AND lue = FALSE;
END;
$$;

-- =====================================================
-- MIGRATION 011: TICKETS
-- =====================================================

-- S'assurer que tickets a toutes les colonnes nécessaires
DO $$
BEGIN
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_statut_check;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'priorite') THEN
        ALTER TABLE tickets ADD COLUMN priorite VARCHAR(20) DEFAULT 'normale';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'date_ouverture') THEN
        ALTER TABLE tickets ADD COLUMN date_ouverture TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'date_resolution') THEN
        ALTER TABLE tickets ADD COLUMN date_resolution TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'traite_par') THEN
        ALTER TABLE tickets ADD COLUMN traite_par UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'resolution_notes') THEN
        ALTER TABLE tickets ADD COLUMN resolution_notes TEXT;
    END IF;
    
    UPDATE tickets SET statut = 'soumis' WHERE statut IS NULL OR statut = '';
    
    ALTER TABLE tickets ADD CONSTRAINT tickets_statut_check CHECK (statut IN ('soumis', 'en_cours', 'resolu', 'rejete'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur tickets: %', SQLERRM;
END $$;

-- Table commentaires
DROP TABLE IF EXISTS ticket_comments CASCADE;

CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,
    auteur_id UUID NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'commentaire',
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    supprime BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);

-- Vue tickets avec created_at
DROP VIEW IF EXISTS vue_tickets_complets CASCADE;

CREATE VIEW vue_tickets_complets AS
SELECT t.*,
    p.prenom as passager_prenom, p.nom as passager_nom,
    a.prenom as agent_prenom, a.nom as agent_nom,
    (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id AND tc.supprime = FALSE) as nb_commentaires
FROM tickets t
LEFT JOIN profiles p ON p.id = t.passager_id
LEFT JOIN profiles a ON a.id = t.traite_par
ORDER BY COALESCE(t.created_at, t.date_creation, NOW()) DESC;

-- Fonction changer statut
CREATE OR REPLACE FUNCTION changer_statut_ticket(
    p_ticket_id UUID, p_nouveau_statut VARCHAR, p_agent_id UUID, p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ancien_statut VARCHAR;
    v_passager_id UUID;
BEGIN
    SELECT statut, passager_id INTO v_ancien_statut, v_passager_id FROM tickets WHERE id = p_ticket_id;
    IF v_ancien_statut IS NULL THEN RETURN FALSE; END IF;
    
    UPDATE tickets SET
        statut = p_nouveau_statut,
        traite_par = CASE WHEN p_nouveau_statut IN ('en_cours', 'resolu', 'rejete') THEN p_agent_id ELSE traite_par END,
        date_ouverture = CASE WHEN p_nouveau_statut = 'en_cours' AND date_ouverture IS NULL THEN NOW() ELSE date_ouverture END,
        date_resolution = CASE WHEN p_nouveau_statut IN ('resolu', 'rejete') THEN NOW() ELSE date_resolution END,
        resolution_notes = COALESCE(p_notes, resolution_notes)
    WHERE id = p_ticket_id;
    
    INSERT INTO ticket_comments (ticket_id, auteur_id, message, type, ancien_statut, nouveau_statut)
    VALUES (p_ticket_id, p_agent_id, COALESCE(p_notes, 'Changement de statut'), 'changement_statut', v_ancien_statut, p_nouveau_statut);
    
    PERFORM creer_notification(v_passager_id, 'ticket', 'info',
        format('Ticket %s', p_nouveau_statut), COALESCE(p_notes, 'Votre ticket a été mis à jour'), 
        '/dashboard/tickets', 'ticket', p_ticket_id);
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION get_stats_tickets(p_ville_id UUID DEFAULT NULL)
RETURNS TABLE(total BIGINT, soumis BIGINT, en_cours BIGINT, resolus BIGINT, rejetés BIGINT, urgents BIGINT)
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
        COUNT(*) FILTER (WHERE statut = 'rejete')::BIGINT,
        COUNT(*) FILTER (WHERE priorite = 'urgente' AND statut IN ('soumis', 'en_cours'))::BIGINT
    FROM tickets;
END;
$$;

-- =====================================================
-- MIGRATION 012: OBJETS PERDUS
-- =====================================================

DROP TABLE IF EXISTS objets_trouves CASCADE;
DROP TABLE IF EXISTS objets_perdus CASCADE;

CREATE TABLE objets_trouves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trouve_par_id UUID,
    trouve_par_nom VARCHAR(255),
    trouve_par_telephone VARCHAR(20),
    categorie VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    couleur VARCHAR(50),
    marque VARCHAR(100),
    lieu_trouve VARCHAR(255) NOT NULL,
    date_trouve DATE NOT NULL,
    heure_trouve TIME,
    vehicule_immatriculation VARCHAR(20),
    lieu_depose VARCHAR(255),
    statut VARCHAR(50) DEFAULT 'en_attente',
    objet_perdu_id UUID,
    date_matching TIMESTAMP,
    matched_by UUID,
    date_rendu TIMESTAMP,
    rendu_au_nom VARCHAR(255),
    notes_rendu TEXT,
    date_creation TIMESTAMP DEFAULT NOW(),
    date_maj TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objets_trouves_statut ON objets_trouves(statut);

CREATE TABLE objets_perdus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passager_id UUID NOT NULL,
    categorie VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    couleur VARCHAR(50),
    marque VARCHAR(100),
    lieu_perte VARCHAR(255) NOT NULL,
    date_perte DATE NOT NULL,
    heure_perte TIME,
    vehicule_immatriculation VARCHAR(20),
    telephone_contact VARCHAR(20),
    email_contact VARCHAR(255),
    statut VARCHAR(50) DEFAULT 'en_attente',
    objet_trouve_id UUID REFERENCES objets_trouves(id) ON DELETE SET NULL,
    date_matching TIMESTAMP,
    matched_by UUID,
    date_rendu TIMESTAMP,
    rendu_a UUID,
    notes_rendu TEXT,
    date_creation TIMESTAMP DEFAULT NOW(),
    date_maj TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objets_perdus_passager ON objets_perdus(passager_id);
CREATE INDEX idx_objets_perdus_statut ON objets_perdus(statut);

-- Vue correspondances
DROP VIEW IF EXISTS vue_correspondances_potentielles CASCADE;

CREATE VIEW vue_correspondances_potentielles AS
SELECT 
    op.id as objet_perdu_id, op.description as objet_perdu_description, op.categorie as objet_perdu_categorie,
    op.couleur as objet_perdu_couleur, op.lieu_perte, op.date_perte, op.passager_id,
    p.prenom as passager_prenom, p.nom as passager_nom,
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
    
    UPDATE objets_perdus SET statut = 'matched', objet_trouve_id = p_objet_trouve_id, date_matching = NOW(), matched_by = p_matched_by
    WHERE id = p_objet_perdu_id;
    
    UPDATE objets_trouves SET statut = 'matched', objet_perdu_id = p_objet_perdu_id, date_matching = NOW(), matched_by = p_matched_by
    WHERE id = p_objet_trouve_id;
    
    PERFORM creer_notification(v_passager_id, 'system', 'info', 'Votre objet a été retrouvé !',
        'Un objet correspondant a été trouvé.', '/dashboard/tickets', 'objet_perdu', p_objet_perdu_id, p_matched_by);
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION marquer_objet_rendu(p_objet_perdu_id UUID, p_rendu_par UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
    v_objet_trouve_id UUID;
    v_passager_id UUID;
BEGIN
    SELECT objet_trouve_id, passager_id INTO v_objet_trouve_id, v_passager_id FROM objets_perdus WHERE id = p_objet_perdu_id;
    
    UPDATE objets_perdus SET statut = 'rendu', date_rendu = NOW(), rendu_a = p_rendu_par, notes_rendu = p_notes WHERE id = p_objet_perdu_id;
    IF v_objet_trouve_id IS NOT NULL THEN
        UPDATE objets_trouves SET statut = 'rendu', date_rendu = NOW(), notes_rendu = p_notes WHERE id = v_objet_trouve_id;
    END IF;
    
    PERFORM creer_notification(v_passager_id, 'system', 'info', 'Objet rendu',
        'Votre objet vous a été rendu.', '/dashboard/tickets', 'objet_perdu', p_objet_perdu_id, p_rendu_par);
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION get_stats_objets()
RETURNS TABLE(perdus_total BIGINT, perdus_en_attente BIGINT, perdus_matched BIGINT, perdus_rendus BIGINT,
              trouves_total BIGINT, trouves_en_attente BIGINT, trouves_matched BIGINT, trouves_rendus BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM objets_perdus)::BIGINT,
        (SELECT COUNT(*) FROM objets_perdus WHERE statut = 'en_attente')::BIGINT,
        (SELECT COUNT(*) FROM objets_perdus WHERE statut = 'matched')::BIGINT,
        (SELECT COUNT(*) FROM objets_perdus WHERE statut = 'rendu')::BIGINT,
        (SELECT COUNT(*) FROM objets_trouves)::BIGINT,
        (SELECT COUNT(*) FROM objets_trouves WHERE statut = 'en_attente')::BIGINT,
        (SELECT COUNT(*) FROM objets_trouves WHERE statut = 'matched')::BIGINT,
        (SELECT COUNT(*) FROM objets_trouves WHERE statut = 'rendu')::BIGINT;
END;
$$;

-- =====================================================
-- MIGRATION 013: RENTABILITÉ
-- =====================================================

CREATE OR REPLACE FUNCTION get_rentabilite_proprietaire(
    p_proprietaire_id UUID, p_date_debut DATE DEFAULT NULL, p_date_fin DATE DEFAULT NULL
)
RETURNS TABLE(
    total_vehicules BIGINT, vehicules_actifs BIGINT,
    total_versements_attendus NUMERIC, total_versements_recus NUMERIC, taux_recouvrement NUMERIC,
    nombre_versements_en_retard BIGINT, montant_retard NUMERIC,
    total_pannes BIGINT, pannes_en_cours BIGINT, cout_total_pannes NUMERIC,
    periode_debut DATE, periode_fin DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_date_debut IS NULL THEN p_date_debut := DATE_TRUNC('year', CURRENT_DATE)::DATE; END IF;
    IF p_date_fin IS NULL THEN p_date_fin := CURRENT_DATE; END IF;
    
    RETURN QUERY
    WITH vehicules_stats AS (
        SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE statut = 'actif') as actifs
        FROM vehicules WHERE proprietaire_id = p_proprietaire_id
    ),
    versements_stats AS (
        SELECT 
            COALESCE(SUM(montant_attendu), 0) as attendus, COALESCE(SUM(montant_recu), 0) as recus,
            COUNT(*) FILTER (WHERE statut = 'en_retard') as nb_retard,
            COALESCE(SUM(montant_attendu) FILTER (WHERE statut = 'en_retard'), 0) as montant_retard
        FROM versements v
        JOIN vehicules ve ON ve.id = v.vehicule_id
        WHERE ve.proprietaire_id = p_proprietaire_id AND v.date_attendue BETWEEN p_date_debut AND p_date_fin
    ),
    pannes_stats AS (
        SELECT 
            COUNT(*) as total, COUNT(*) FILTER (WHERE statut = 'en_cours') as en_cours,
            COALESCE(SUM(cout_reparation), 0) as cout_total
        FROM pannes p
        JOIN vehicules ve ON ve.id = p.vehicule_id
        WHERE ve.proprietaire_id = p_proprietaire_id AND p.date_declaration BETWEEN p_date_debut AND p_date_fin
    )
    SELECT vs.total, vs.actifs, ves.attendus, ves.recus,
        CASE WHEN ves.attendus > 0 THEN ROUND((ves.recus / ves.attendus) * 100, 2) ELSE 0 END,
        ves.nb_retard, ves.montant_retard, ps.total, ps.en_cours, ps.cout_total,
        p_date_debut, p_date_fin
    FROM vehicules_stats vs, versements_stats ves, pannes_stats ps;
END;
$$;

CREATE OR REPLACE FUNCTION get_versements_par_mois(p_proprietaire_id UUID, p_nombre_mois INTEGER DEFAULT 6)
RETURNS TABLE(mois DATE, mois_label TEXT, attendus NUMERIC, recus NUMERIC, retard NUMERIC)
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
        COALESCE(SUM(v.montant_attendu), 0), COALESCE(SUM(v.montant_recu), 0),
        COALESCE(SUM(v.montant_attendu) FILTER (WHERE v.statut = 'en_retard'), 0)
    FROM mois_series ms
    LEFT JOIN versements v ON DATE_TRUNC('month', v.date_attendue)::DATE = ms.mois_date
    LEFT JOIN vehicules ve ON ve.id = v.vehicule_id AND ve.proprietaire_id = p_proprietaire_id
    GROUP BY ms.mois_date ORDER BY ms.mois_date;
END;
$$;

CREATE OR REPLACE FUNCTION get_performance_vehicules(
    p_proprietaire_id UUID, p_date_debut DATE DEFAULT NULL, p_date_fin DATE DEFAULT NULL
)
RETURNS TABLE(
    vehicule_id UUID, immatriculation VARCHAR, marque VARCHAR, modele VARCHAR, statut VARCHAR,
    chauffeur_nom TEXT, total_versements_attendus NUMERIC, total_versements_recus NUMERIC,
    taux_recouvrement NUMERIC, nb_pannes BIGINT, cout_pannes NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_date_debut IS NULL THEN p_date_debut := DATE_TRUNC('year', CURRENT_DATE)::DATE; END IF;
    IF p_date_fin IS NULL THEN p_date_fin := CURRENT_DATE; END IF;
    
    RETURN QUERY
    SELECT 
        ve.id, ve.immatriculation, ve.marque, ve.modele, ve.statut,
        'Non assigné'::TEXT,
        COALESCE(SUM(v.montant_attendu), 0), COALESCE(SUM(v.montant_recu), 0),
        CASE WHEN COALESCE(SUM(v.montant_attendu), 0) > 0 
            THEN ROUND((COALESCE(SUM(v.montant_recu), 0) / SUM(v.montant_attendu)) * 100, 2)
            ELSE 0 END,
        COUNT(DISTINCT pa.id), COALESCE(SUM(pa.cout_reparation), 0)
    FROM vehicules ve
    LEFT JOIN versements v ON v.vehicule_id = ve.id AND v.date_attendue BETWEEN p_date_debut AND p_date_fin
    LEFT JOIN pannes pa ON pa.vehicule_id = ve.id AND pa.date_declaration BETWEEN p_date_debut AND p_date_fin
    WHERE ve.proprietaire_id = p_proprietaire_id
    GROUP BY ve.id, ve.immatriculation, ve.marque, ve.modele, ve.statut
    ORDER BY 8 DESC NULLS LAST;
END;
$$;

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT '=== MIGRATIONS TERMINÉES ===' as status;

SELECT 'Tables créées:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'ticket_comments', 'objets_perdus', 'objets_trouves', 'documents', 'versements', 'pannes', 'vehicules')
ORDER BY table_name;

SELECT '✅ Migrations exécutées avec succès !' as message;
