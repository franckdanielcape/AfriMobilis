-- =====================================================
-- MIGRATIONS CONSOLIDÉES - AfriMobilis MVP
-- =====================================================
-- Exécutez ce fichier dans l'éditeur SQL Supabase
-- Ordre : 010 → 011 → 012 → 013

-- =====================================================
-- MIGRATION 010: Système de Notifications
-- =====================================================

-- Colonnes manquantes pour les notifications
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS date_notification DATE;

ALTER TABLE versements 
ADD COLUMN IF NOT EXISTS date_notification DATE;

-- Supprimer si existent
DROP TABLE IF EXISTS notifications CASCADE;
DROP FUNCTION IF EXISTS creer_notification CASCADE;
DROP FUNCTION IF EXISTS verifier_conformite_notifications CASCADE;
DROP FUNCTION IF EXISTS verifier_versements_notifications CASCADE;

-- Table des notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
    date_expiration TIMESTAMP,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_lue ON notifications(user_id, lue);
CREATE INDEX idx_notifications_date ON notifications(date_creation DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Fonction créer notification
CREATE OR REPLACE FUNCTION creer_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_niveau VARCHAR,
    p_titre VARCHAR,
    p_message TEXT,
    p_lien VARCHAR DEFAULT NULL,
    p_reference_type VARCHAR DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, niveau, titre, message, lien, reference_type, reference_id, created_by, metadata)
    VALUES (p_user_id, p_type, p_niveau, p_titre, p_message, p_lien, p_reference_type, p_reference_id, p_created_by, p_metadata)
    RETURNING id INTO v_notification_id;
    RETURN v_notification_id;
END;
$$;

-- Fonction notifications conformité
CREATE OR REPLACE FUNCTION verifier_conformite_notifications()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_doc RECORD;
    v_jours INTEGER;
    v_user_id UUID;
BEGIN
    FOR v_doc IN 
        SELECT d.id, d.vehicule_id, d.type_document, d.date_expiration, d.date_notification,
               v.proprietaire_id, v.immatriculation,
               DATE_PART('day', d.date_expiration - CURRENT_DATE)::INTEGER as jours_restants
        FROM documents d
        JOIN vehicules v ON v.id = d.vehicule_id
        WHERE d.date_expiration IS NOT NULL
          AND d.statut IN ('valide', 'bientot_expire')
          AND (d.date_notification IS NULL OR d.date_notification < CURRENT_DATE)
    LOOP
        v_jours := v_doc.jours_restants;
        
        IF v_jours = 30 THEN
            IF v_doc.proprietaire_id IS NOT NULL THEN
                PERFORM creer_notification(v_doc.proprietaire_id, 'conformite', 'info',
                    'Document à renouveler dans 30 jours',
                    format('Le %s du véhicule %s expire le %s.', v_doc.type_document, v_doc.immatriculation, TO_CHAR(v_doc.date_expiration, 'DD/MM/YYYY')),
                    '/dashboard/conformite', 'vehicule', v_doc.vehicule_id);
            END IF;
            UPDATE documents SET date_notification = CURRENT_DATE, statut = 'bientot_expire' WHERE id = v_doc.id;
            
        ELSIF v_jours = 7 THEN
            IF v_doc.proprietaire_id IS NOT NULL THEN
                PERFORM creer_notification(v_doc.proprietaire_id, 'conformite', 'warning',
                    'URGENT : Document expire dans 7 jours',
                    format('Le %s du véhicule %s expire le %s.', v_doc.type_document, v_doc.immatriculation, TO_CHAR(v_doc.date_expiration, 'DD/MM/YYYY')),
                    '/dashboard/conformite', 'vehicule', v_doc.vehicule_id);
            END IF;
            UPDATE documents SET date_notification = CURRENT_DATE WHERE id = v_doc.id;
            
        ELSIF v_jours = -1 THEN
            IF v_doc.proprietaire_id IS NOT NULL THEN
                PERFORM creer_notification(v_doc.proprietaire_id, 'conformite', 'urgent',
                    'Document EXPIRÉ',
                    format('Le %s du véhicule %s a expiré.', v_doc.type_document, v_doc.immatriculation),
                    '/dashboard/conformite', 'vehicule', v_doc.vehicule_id);
            END IF;
            
            FOR v_user_id IN 
                SELECT p.id FROM profiles p
                JOIN vehicules v ON v.ville_id = p.ville_id
                WHERE v.id = v_doc.vehicule_id AND p.role IN ('chef_ligne', 'super_chef_de_ligne')
            LOOP
                PERFORM creer_notification(v_user_id, 'conformite', 'urgent',
                    'Véhicule non conforme',
                    format('Le véhicule %s a un document expiré (%s).', v_doc.immatriculation, v_doc.type_document),
                    '/dashboard/conformite', 'vehicule', v_doc.vehicule_id);
            END LOOP;
            
            UPDATE documents SET date_notification = CURRENT_DATE, statut = 'expire' WHERE id = v_doc.id;
        END IF;
    END LOOP;
END;
$$;

-- Fonction compter notifications non lues
CREATE OR REPLACE FUNCTION compter_notifications_non_lues(p_user_id UUID)
RETURNS TABLE(total BIGINT, info BIGINT, warning BIGINT, urgent BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total,
        COUNT(*) FILTER (WHERE niveau = 'info')::BIGINT as info,
        COUNT(*) FILTER (WHERE niveau = 'warning')::BIGINT as warning,
        COUNT(*) FILTER (WHERE niveau = 'urgent')::BIGINT as urgent
    FROM notifications
    WHERE user_id = p_user_id AND lue = FALSE
      AND (date_expiration IS NULL OR date_expiration > NOW());
END;
$$;

-- RLS notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================
-- MIGRATION 011: Workflow Tickets
-- =====================================================

-- Mise à jour table tickets
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_statut_check;
UPDATE tickets SET statut = 'soumis' WHERE statut IS NULL OR statut = '';
ALTER TABLE tickets ADD CONSTRAINT tickets_statut_check CHECK (statut IN ('soumis', 'en_cours', 'resolu', 'rejete'));
ALTER TABLE tickets ALTER COLUMN statut SET DEFAULT 'soumis';

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
ADD COLUMN IF NOT EXISTS date_ouverture TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_resolution TIMESTAMP,
ADD COLUMN IF NOT EXISTS traite_par UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Table commentaires tickets
DROP TABLE IF EXISTS ticket_comments CASCADE;

CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    auteur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'commentaire' CHECK (type IN ('commentaire', 'changement_statut', 'resolution', 'interne')),
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    modifie_le TIMESTAMP,
    supprime BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);

-- Vue tickets complets
DROP VIEW IF EXISTS vue_tickets_complets CASCADE;

CREATE VIEW vue_tickets_complets AS
SELECT t.*,
    p.prenom as passager_prenom, p.nom as passager_nom, p.email as passager_email, p.telephone as passager_telephone,
    a.prenom as agent_prenom, a.nom as agent_nom,
    (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id AND tc.supprime = FALSE) as nb_commentaires
FROM tickets t
LEFT JOIN profiles p ON p.id = t.passager_id
LEFT JOIN profiles a ON a.id = t.traite_par
ORDER BY t.date_creation DESC;

-- Fonction changer statut ticket
CREATE OR REPLACE FUNCTION changer_statut_ticket(
    p_ticket_id UUID, p_nouveau_statut VARCHAR, p_agent_id UUID, p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ancien_statut VARCHAR;
    v_est_autorise BOOLEAN := FALSE;
    v_user_role VARCHAR;
BEGIN
    SELECT statut INTO v_ancien_statut FROM tickets WHERE id = p_ticket_id;
    IF v_ancien_statut IS NULL THEN RETURN FALSE; END IF;
    
    SELECT role INTO v_user_role FROM profiles WHERE id = p_agent_id;
    
    IF v_user_role IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin') THEN
        v_est_autorise := TRUE;
    END IF;
    
    IF NOT v_est_autorise THEN RETURN FALSE; END IF;
    
    UPDATE tickets SET
        statut = p_nouveau_statut,
        traite_par = CASE WHEN p_nouveau_statut IN ('en_cours', 'resolu', 'rejete') THEN p_agent_id ELSE traite_par END,
        date_ouverture = CASE WHEN p_nouveau_statut = 'en_cours' AND date_ouverture IS NULL THEN NOW() ELSE date_ouverture END,
        date_resolution = CASE WHEN p_nouveau_statut IN ('resolu', 'rejete') THEN NOW() ELSE date_resolution END,
        resolution_notes = COALESCE(p_notes, resolution_notes)
    WHERE id = p_ticket_id;
    
    INSERT INTO ticket_comments (ticket_id, auteur_id, message, type, ancien_statut, nouveau_statut)
    VALUES (p_ticket_id, p_agent_id, COALESCE(p_notes, format('Statut changé de %s à %s', v_ancien_statut, p_nouveau_statut)),
            'changement_statut', v_ancien_statut, p_nouveau_statut);
    
    PERFORM creer_notification(
        (SELECT passager_id FROM tickets WHERE id = p_ticket_id), 'ticket',
        CASE WHEN p_nouveau_statut = 'rejete' THEN 'warning' ELSE 'info' END,
        format('Votre ticket est %s', CASE p_nouveau_statut WHEN 'en_cours' THEN 'en cours de traitement' WHEN 'resolu' THEN 'résolu' WHEN 'rejete' THEN 'rejeté' ELSE p_nouveau_statut END),
        COALESCE(p_notes, format('Statut mis à jour : %s', p_nouveau_statut)), '/dashboard/tickets', 'ticket', p_ticket_id);
    
    RETURN TRUE;
END;
$$;

-- RLS ticket_comments
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments"
ON ticket_comments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM tickets t WHERE t.id = ticket_comments.ticket_id AND t.passager_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin')));

-- =====================================================
-- MIGRATION 012: Matching Objets Perdus
-- =====================================================

DROP TABLE IF EXISTS objets_perdus CASCADE;
DROP TABLE IF EXISTS objets_trouves CASCADE;

CREATE TABLE objets_perdus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'matched', 'rendu', 'abandonne')),
    objet_trouve_id UUID REFERENCES objets_trouves(id) ON DELETE SET NULL,
    date_matching TIMESTAMP,
    matched_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    date_rendu TIMESTAMP,
    rendu_a UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes_rendu TEXT,
    date_creation TIMESTAMP DEFAULT NOW(),
    date_maj TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objets_perdus_passager ON objets_perdus(passager_id);
CREATE INDEX idx_objets_perdus_statut ON objets_perdus(statut);

CREATE TABLE objets_trouves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trouve_par_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'matched', 'rendu')),
    objet_perdu_id UUID REFERENCES objets_perdus(id) ON DELETE SET NULL,
    date_matching TIMESTAMP,
    matched_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    date_rendu TIMESTAMP,
    rendu_au_nom VARCHAR(255),
    notes_rendu TEXT,
    date_creation TIMESTAMP DEFAULT NOW(),
    date_maj TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objets_trouves_statut ON objets_trouves(statut);

-- Vue correspondances potentielles
CREATE OR REPLACE VIEW vue_correspondances_potentielles AS
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
ORDER BY score_correspondance DESC, op.date_creation DESC;

-- Fonction matcher objets
CREATE OR REPLACE FUNCTION matcher_objets(p_objet_perdu_id UUID, p_objet_trouve_id UUID, p_matched_by UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_passager_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM objets_perdus WHERE id = p_objet_perdu_id AND statut = 'en_attente')
       OR NOT EXISTS (SELECT 1 FROM objets_trouves WHERE id = p_objet_trouve_id AND statut = 'en_attente') THEN
        RETURN FALSE;
    END IF;
    
    SELECT passager_id INTO v_passager_id FROM objets_perdus WHERE id = p_objet_perdu_id;
    
    UPDATE objets_perdus SET statut = 'matched', objet_trouve_id = p_objet_trouve_id, date_matching = NOW(), matched_by = p_matched_by
    WHERE id = p_objet_perdu_id;
    
    UPDATE objets_trouves SET statut = 'matched', objet_perdu_id = p_objet_perdu_id, date_matching = NOW(), matched_by = p_matched_by
    WHERE id = p_objet_trouve_id;
    
    PERFORM creer_notification(v_passager_id, 'system', 'info', 'Votre objet a été retrouvé !',
        'Un objet correspondant a été trouvé. Contactez le syndicat.', '/dashboard/tickets', 'objet_perdu', p_objet_perdu_id, p_matched_by);
    
    RETURN TRUE;
END;
$$;

-- RLS
ALTER TABLE objets_perdus ENABLE ROW LEVEL SECURITY;
ALTER TABLE objets_trouves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passagers can view their own lost objects"
ON objets_perdus FOR SELECT TO authenticated
USING (passager_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin')));

CREATE POLICY "Anyone can view found objects"
ON objets_trouves FOR SELECT TO authenticated USING (TRUE);

-- =====================================================
-- MIGRATION 013: Rentabilité Propriétaire
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
    SELECT 
        vs.total, vs.actifs, ves.attendus, ves.recus,
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
        COALESCE(p.prenom || ' ' || p.nom, 'Non assigné'),
        COALESCE(SUM(v.montant_attendu), 0), COALESCE(SUM(v.montant_recu), 0),
        CASE WHEN COALESCE(SUM(v.montant_attendu), 0) > 0 
            THEN ROUND((COALESCE(SUM(v.montant_recu), 0) / SUM(v.montant_attendu)) * 100, 2)
            ELSE 0 END,
        COUNT(DISTINCT pa.id), COALESCE(SUM(pa.cout_reparation), 0)
    FROM vehicules ve
    LEFT JOIN affectations a ON a.vehicule_id = ve.id AND a.statut = 'actif'
    LEFT JOIN profiles p ON p.id = a.chauffeur_id
    LEFT JOIN versements v ON v.vehicule_id = ve.id AND v.date_attendue BETWEEN p_date_debut AND p_date_fin
    LEFT JOIN pannes pa ON pa.vehicule_id = ve.id AND pa.date_declaration BETWEEN p_date_debut AND p_date_fin
    WHERE ve.proprietaire_id = p_proprietaire_id
    GROUP BY ve.id, ve.immatriculation, ve.marque, ve.modele, ve.statut, p.prenom, p.nom
    ORDER BY 8 DESC NULLS LAST;
END;
$$;

-- =====================================================
-- FIN DES MIGRATIONS
-- =====================================================

-- Vérification
SELECT 'Migration 010: Notifications - OK' as status;
SELECT 'Migration 011: Tickets - OK' as status;
SELECT 'Migration 012: Objets Perdus - OK' as status;
SELECT 'Migration 013: Rentabilité - OK' as status;
SELECT 'Toutes les migrations ont été exécutées avec succès !' as message;
