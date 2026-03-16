-- =====================================================
-- MIGRATION 011: Workflow Tickets Passagers
-- =====================================================
-- Ajoute le workflow complet : statuts, commentaires, historique

-- =====================================================
-- 1. MISE À JOUR TABLE TICKETS (ajout statuts)
-- =====================================================

-- Modifier le type enum des statuts si nécessaire
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_statut_check;

-- Mettre à jour les statuts existants vers le nouveau workflow
UPDATE tickets 
SET statut = 'soumis' 
WHERE statut IS NULL OR statut = '';

-- Ajouter la contrainte avec les nouveaux statuts
ALTER TABLE tickets 
ADD CONSTRAINT tickets_statut_check 
CHECK (statut IN ('soumis', 'en_cours', 'resolu', 'rejete'));

-- Mettre à jour la valeur par défaut
ALTER TABLE tickets 
ALTER COLUMN statut SET DEFAULT 'soumis';

-- Ajouter les champs manquants pour le workflow
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
ADD COLUMN IF NOT EXISTS date_ouverture TIMESTAMP,
ADD COLUMN IF NOT EXISTS date_resolution TIMESTAMP,
ADD COLUMN IF NOT EXISTS traite_par UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- =====================================================
-- 2. TABLE DES COMMENTAIRES DE TICKETS
-- =====================================================
DROP TABLE IF EXISTS ticket_comments CASCADE;

CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    auteur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Contenu
    message TEXT NOT NULL,
    
    -- Type de commentaire
    type VARCHAR(20) DEFAULT 'commentaire' CHECK (type IN ('commentaire', 'changement_statut', 'resolution', 'interne')),
    
    -- Ancien et nouveau statut (pour les changements de statut)
    ancien_statut VARCHAR(50),
    nouveau_statut VARCHAR(50),
    
    -- Métadonnées
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    modifie_le TIMESTAMP,
    supprime BOOLEAN DEFAULT FALSE
);

-- Index pour performance
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_date ON ticket_comments(date_creation DESC);

-- =====================================================
-- 3. VUE DES TICKETS AVEC INFOS COMPLÈTES
-- =====================================================
DROP VIEW IF EXISTS vue_tickets_complets CASCADE;

CREATE VIEW vue_tickets_complets AS
SELECT 
    t.*,
    -- Info passager
    p.prenom as passager_prenom,
    p.nom as passager_nom,
    p.email as passager_email,
    p.telephone as passager_telephone,
    -- Info agent traitant
    a.prenom as agent_prenom,
    a.nom as agent_nom,
    -- Nombre de commentaires
    (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id AND tc.supprime = FALSE) as nb_commentaires,
    -- Dernier commentaire
    (SELECT tc.date_creation FROM ticket_comments tc 
     WHERE tc.ticket_id = t.id AND tc.supprime = FALSE 
     ORDER BY tc.date_creation DESC LIMIT 1) as dernier_commentaire_date
FROM tickets t
LEFT JOIN profiles p ON p.id = t.passager_id
LEFT JOIN profiles a ON a.id = t.traite_par
ORDER BY t.date_creation DESC;

-- =====================================================
-- 4. FONCTION : Changer le statut d'un ticket
-- =====================================================
CREATE OR REPLACE FUNCTION changer_statut_ticket(
    p_ticket_id UUID,
    p_nouveau_statut VARCHAR,
    p_agent_id UUID,
    p_notes TEXT DEFAULT NULL
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
    -- Récupérer l'ancien statut
    SELECT statut INTO v_ancien_statut 
    FROM tickets WHERE id = p_ticket_id;
    
    IF v_ancien_statut IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Vérifier le rôle de l'agent
    SELECT role INTO v_user_role 
    FROM profiles WHERE id = p_agent_id;
    
    -- Vérifier les permissions
    -- Seuls admin_syndicat, chef_ligne, super_chef_de_ligne, super_admin peuvent changer les statuts
    IF v_user_role IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin') THEN
        v_est_autorise := TRUE;
    END IF;
    
    -- Le passager peut seulement annuler (mettre rejete) son propre ticket si statut = soumis
    IF NOT v_est_autorise AND v_user_role = 'passager' THEN
        SELECT EXISTS(
            SELECT 1 FROM tickets 
            WHERE id = p_ticket_id 
              AND passager_id = p_agent_id 
              AND statut = 'soumis'
        ) INTO v_est_autorise;
        
        IF v_est_autorise AND p_nouveau_statut != 'rejete' THEN
            v_est_autorise := FALSE;
        END IF;
    END IF;
    
    IF NOT v_est_autorise THEN
        RETURN FALSE;
    END IF;
    
    -- Mise à jour du ticket
    UPDATE tickets 
    SET 
        statut = p_nouveau_statut,
        traite_par = CASE 
            WHEN p_nouveau_statut IN ('en_cours', 'resolu', 'rejete') THEN p_agent_id 
            ELSE traite_par 
        END,
        date_ouverture = CASE 
            WHEN p_nouveau_statut = 'en_cours' AND date_ouverture IS NULL THEN NOW() 
            ELSE date_ouverture 
        END,
        date_resolution = CASE 
            WHEN p_nouveau_statut IN ('resolu', 'rejete') THEN NOW() 
            ELSE date_resolution 
        END,
        resolution_notes = COALESCE(p_notes, resolution_notes)
    WHERE id = p_ticket_id;
    
    -- Créer un commentaire de changement de statut
    INSERT INTO ticket_comments (
        ticket_id,
        auteur_id,
        message,
        type,
        ancien_statut,
        nouveau_statut
    ) VALUES (
        p_ticket_id,
        p_agent_id,
        COALESCE(p_notes, format('Statut changé de %s à %s', v_ancien_statut, p_nouveau_statut)),
        'changement_statut',
        v_ancien_statut,
        p_nouveau_statut
    );
    
    -- Créer une notification pour le passager
    PERFORM creer_notification(
        (SELECT passager_id FROM tickets WHERE id = p_ticket_id),
        'ticket',
        CASE 
            WHEN p_nouveau_statut = 'en_cours' THEN 'info'
            WHEN p_nouveau_statut = 'resolu' THEN 'info'
            WHEN p_nouveau_statut = 'rejete' THEN 'warning'
            ELSE 'info'
        END,
        format('Votre ticket est %s', 
            CASE p_nouveau_statut
                WHEN 'en_cours' THEN 'en cours de traitement'
                WHEN 'resolu' THEN 'résolu'
                WHEN 'rejete' THEN 'rejeté'
                ELSE p_nouveau_statut
            END
        ),
        COALESCE(p_notes, format('Le statut de votre ticket a été mis à jour : %s', p_nouveau_statut)),
        '/dashboard/tickets',
        'ticket',
        p_ticket_id
    );
    
    RETURN TRUE;
END;
$$;

-- =====================================================
-- 5. FONCTION : Ajouter un commentaire
-- =====================================================
CREATE OR REPLACE FUNCTION ajouter_commentaire_ticket(
    p_ticket_id UUID,
    p_auteur_id UUID,
    p_message TEXT,
    p_type VARCHAR DEFAULT 'commentaire'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comment_id UUID;
    v_user_role VARCHAR;
    v_ticket_passager_id UUID;
BEGIN
    -- Récupérer infos
    SELECT role INTO v_user_role FROM profiles WHERE id = p_auteur_id;
    SELECT passager_id INTO v_ticket_passager_id FROM tickets WHERE id = p_ticket_id;
    
    -- Vérifier permissions (passager = uniquement sur ses propres tickets)
    IF v_user_role = 'passager' AND v_ticket_passager_id != p_auteur_id THEN
        RETURN NULL;
    END IF;
    
    -- Si c'est un commentaire interne, vérifier que c'est un admin
    IF p_type = 'interne' AND v_user_role NOT IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin') THEN
        RETURN NULL;
    END IF;
    
    INSERT INTO ticket_comments (
        ticket_id,
        auteur_id,
        message,
        type
    ) VALUES (
        p_ticket_id,
        p_auteur_id,
        p_message,
        p_type
    )
    RETURNING id INTO v_comment_id;
    
    -- Notifier l'autre partie
    IF v_user_role = 'passager' THEN
        -- Notifier les admins
        PERFORM creer_notification(
            (SELECT id FROM profiles 
             WHERE role IN ('chef_ligne', 'super_chef_de_ligne', 'admin_syndicat') 
             LIMIT 1),
            'ticket',
            'info',
            'Nouveau commentaire sur un ticket',
            'Un passager a ajouté un commentaire.',
            '/dashboard/tickets/admin',
            'ticket',
            p_ticket_id,
            p_auteur_id
        );
    ELSE
        -- Notifier le passager
        PERFORM creer_notification(
            v_ticket_passager_id,
            'ticket',
            'info',
            'Nouveau commentaire sur votre ticket',
            'Un agent a répondu à votre ticket.',
            '/dashboard/tickets',
            'ticket',
            p_ticket_id,
            p_auteur_id
        );
    END IF;
    
    RETURN v_comment_id;
END;
$$;

-- =====================================================
-- 6. FONCTION : Stats des tickets (pour dashboard admin)
-- =====================================================
CREATE OR REPLACE FUNCTION get_stats_tickets(
    p_ville_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total BIGINT,
    soumis BIGINT,
    en_cours BIGINT,
    resolus BIGINT,
    rejetés BIGINT,
    urgents BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total,
        COUNT(*) FILTER (WHERE t.statut = 'soumis')::BIGINT as soumis,
        COUNT(*) FILTER (WHERE t.statut = 'en_cours')::BIGINT as en_cours,
        COUNT(*) FILTER (WHERE t.statut = 'resolu')::BIGINT as resolus,
        COUNT(*) FILTER (WHERE t.statut = 'rejete')::BIGINT as rejetés,
        COUNT(*) FILTER (WHERE t.priorite = 'urgente' AND t.statut IN ('soumis', 'en_cours'))::BIGINT as urgents
    FROM tickets t
    LEFT JOIN profiles p ON p.id = t.passager_id
    WHERE (p_ville_id IS NULL OR p.ville_id = p_ville_id);
END;
$$;

-- =====================================================
-- 7. FONCTION : Tickets SLA (délais de traitement)
-- =====================================================
CREATE OR REPLACE FUNCTION verifier_tickets_sla()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket RECORD;
BEGIN
    -- Tickets en retard (plus de 48h en statut 'soumis')
    FOR v_ticket IN 
        SELECT t.id, t.passager_id, t.date_creation
        FROM tickets t
        WHERE t.statut = 'soumis'
          AND t.date_creation < NOW() - INTERVAL '48 hours'
          AND NOT EXISTS (
              SELECT 1 FROM notifications n 
              WHERE n.reference_id = t.id 
                AND n.type = 'ticket'
                AND n.titre LIKE '%retard%'
                AND n.date_creation > NOW() - INTERVAL '24 hours'
          )
    LOOP
        -- Notifier les admins
        PERFORM creer_notification(
            (SELECT id FROM profiles 
             WHERE role IN ('chef_ligne', 'super_chef_de_ligne') 
             LIMIT 1),
            'ticket',
            'warning',
            'Ticket en retard de traitement',
            format('Un ticket soumis le %s n\'a pas encore été pris en charge.', 
                   TO_CHAR(v_ticket.date_creation, 'DD/MM/YYYY')),
            '/dashboard/tickets/admin',
            'ticket',
            v_ticket.id
        );
    END LOOP;
END;
$$;

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- Table ticket_comments
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policy : Voir les commentaires de ses tickets (passager)
CREATE POLICY "Passagers can view comments on their tickets"
ON ticket_comments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tickets t 
        WHERE t.id = ticket_comments.ticket_id 
          AND t.passager_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
          AND p.role IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin')
    )
);

-- Policy : Admins peuvent tout voir (sauf internes si pas admin)
CREATE POLICY "Admins can view all comments"
ON ticket_comments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
          AND p.role IN ('admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin')
    )
    OR type != 'interne'
);

-- Policy : Créer des commentaires
CREATE POLICY "Users can create comments on their tickets"
ON ticket_comments FOR INSERT
TO authenticated
WITH CHECK (
    auteur_id = auth.uid()
);

-- =====================================================
-- 9. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE ticket_comments IS 'Commentaires et historique des tickets';
COMMENT ON COLUMN tickets.statut IS 'Workflow: soumis -> en_cours -> resolu/rejete';
COMMENT ON COLUMN tickets.priorite IS 'Priorité: basse, normale, haute, urgente';
COMMENT ON COLUMN ticket_comments.type IS 'Type: commentaire, changement_statut, resolution, interne';

-- =====================================================
-- FIN MIGRATION 011
-- =====================================================
