-- =====================================================
-- MIGRATION 010: Système de Notifications
-- =====================================================
-- Crée la table des notifications avec génération automatique

-- =====================================================
-- 0. AJOUTER COLONNES MANQUANTES AUX TABLES EXISTANTES
-- =====================================================

-- Colonne date_notification pour documents (dernière notification envoyée)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS date_notification DATE;

-- Colonne date_notification pour versements (dernière relance)
ALTER TABLE versements 
ADD COLUMN IF NOT EXISTS date_notification DATE;

-- =====================================================
-- 1. SUPPRIMER SI EXISTE (pour recréation propre)
-- =====================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP FUNCTION IF EXISTS creer_notification CASCADE;
DROP FUNCTION IF EXISTS verifier_conformite_notifications CASCADE;
DROP FUNCTION IF EXISTS verifier_versements_notifications CASCADE;

-- =====================================================
-- 2. TABLE DES NOTIFICATIONS
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Destinataire
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Type de notification
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'conformite',      -- Document à renouveler, expiré...
        'versement',       -- Retard, rappel, reçu...
        'sanction',        -- Nouvelle sanction, validation...
        'ticket',          -- Nouveau ticket, mise à jour...
        'panne',           -- Panne déclarée, résolue...
        'controle',        -- Résultat contrôle...
        'system'           -- Messages système...
    )),
    
    -- Niveau d'importance
    niveau VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (niveau IN ('info', 'warning', 'urgent')),
    
    -- Contenu
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Lien optionnel (vers une page spécifique)
    lien VARCHAR(500),
    
    -- Référence à l'entité concernée (pour lien direct)
    reference_type VARCHAR(50),  -- 'vehicule', 'sanction', 'ticket', 'panne'...
    reference_id UUID,           -- ID de l'entité
    
    -- Statut de lecture
    lue BOOLEAN NOT NULL DEFAULT FALSE,
    date_lecture TIMESTAMP,
    
    -- Dates
    date_creation TIMESTAMP NOT NULL DEFAULT NOW(),
    date_expiration TIMESTAMP,   -- Optionnel : expiration auto
    
    -- Métadonnées
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL = système
    metadata JSONB               -- Données additionnelles flexibles
);

-- Index pour performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_lue ON notifications(user_id, lue);
CREATE INDEX idx_notifications_date ON notifications(date_creation DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_reference ON notifications(reference_type, reference_id);

-- =====================================================
-- 3. FONCTION : Créer une notification
-- =====================================================
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
    INSERT INTO notifications (
        user_id,
        type,
        niveau,
        titre,
        message,
        lien,
        reference_type,
        reference_id,
        created_by,
        metadata
    ) VALUES (
        p_user_id,
        p_type,
        p_niveau,
        p_titre,
        p_message,
        p_lien,
        p_reference_type,
        p_reference_id,
        p_created_by,
        p_metadata
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- =====================================================
-- 4. FONCTION : Notifications conformité (J-30, J-7, J+1)
-- =====================================================
CREATE OR REPLACE FUNCTION verifier_conformite_notifications()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_doc RECORD;
    v_jours INTEGER;
    v_user_id UUID;
    v_vehicule RECORD;
BEGIN
    -- Parcourir tous les documents avec date d'expiration
    FOR v_doc IN 
        SELECT 
            d.id,
            d.vehicule_id,
            d.type_document,
            d.date_expiration,
            d.date_notification,
            v.proprietaire_id,
            v.immatriculation,
            DATE_PART('day', d.date_expiration - CURRENT_DATE)::INTEGER as jours_restants
        FROM documents d
        JOIN vehicules v ON v.id = d.vehicule_id
        WHERE d.date_expiration IS NOT NULL
          AND d.statut IN ('valide', 'bientot_expire')
          AND (d.date_notification IS NULL OR d.date_notification < CURRENT_DATE)
    LOOP
        v_jours := v_doc.jours_restants;
        
        -- Notification J-30
        IF v_jours = 30 THEN
            -- Notifier le propriétaire
            IF v_doc.proprietaire_id IS NOT NULL THEN
                PERFORM creer_notification(
                    v_doc.proprietaire_id,
                    'conformite',
                    'info',
                    'Document à renouveler dans 30 jours',
                    format('Le %s du véhicule %s expire le %s. Pensez à le renouveler.',
                           v_doc.type_document, 
                           v_doc.immatriculation,
                           TO_CHAR(v_doc.date_expiration, 'DD/MM/YYYY')),
                    '/dashboard/conformite',
                    'vehicule',
                    v_doc.vehicule_id
                );
            END IF;
            
            -- Mettre à jour la date de notification
            UPDATE documents 
            SET date_notification = CURRENT_DATE,
                statut = 'bientot_expire'
            WHERE id = v_doc.id;
            
        -- Notification J-7
        ELSIF v_jours = 7 THEN
            IF v_doc.proprietaire_id IS NOT NULL THEN
                PERFORM creer_notification(
                    v_doc.proprietaire_id,
                    'conformite',
                    'warning',
                    'URGENT : Document expire dans 7 jours',
                    format('Le %s du véhicule %s expire le %s. Renouvellement urgent!',
                           v_doc.type_document,
                           v_doc.immatriculation,
                           TO_CHAR(v_doc.date_expiration, 'DD/MM/YYYY')),
                    '/dashboard/conformite',
                    'vehicule',
                    v_doc.vehicule_id
                );
            END IF;
            
            UPDATE documents 
            SET date_notification = CURRENT_DATE
            WHERE id = v_doc.id;
            
        -- Notification J+1 (expiré)
        ELSIF v_jours = -1 THEN
            IF v_doc.proprietaire_id IS NOT NULL THEN
                PERFORM creer_notification(
                    v_doc.proprietaire_id,
                    'conformite',
                    'urgent',
                    'Document EXPIRÉ',
                    format('Le %s du véhicule %s a expiré depuis hier. Le véhicule n\'est plus conforme.',
                           v_doc.type_document,
                           v_doc.immatriculation),
                    '/dashboard/conformite',
                    'vehicule',
                    v_doc.vehicule_id
                );
            END IF;
            
            -- Notifier aussi les Chefs de Ligne de la ville
            FOR v_user_id IN 
                SELECT p.id 
                FROM profiles p
                JOIN vehicules v ON v.ville_id = p.ville_id
                WHERE v.id = v_doc.vehicule_id
                  AND p.role IN ('chef_ligne', 'super_chef_de_ligne')
            LOOP
                PERFORM creer_notification(
                    v_user_id,
                    'conformite',
                    'urgent',
                    'Véhicule non conforme',
                    format('Le véhicule %s a un document expiré (%s).',
                           v_doc.immatriculation,
                           v_doc.type_document),
                    '/dashboard/conformite',
                    'vehicule',
                    v_doc.vehicule_id
                );
            END LOOP;
            
            UPDATE documents 
            SET date_notification = CURRENT_DATE,
                statut = 'expire'
            WHERE id = v_doc.id;
        END IF;
    END LOOP;
END;
$$;

-- =====================================================
-- 5. FONCTION : Notifications versements (retards)
-- =====================================================
CREATE OR REPLACE FUNCTION verifier_versements_notifications()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_versement RECORD;
    v_proprietaire_id UUID;
    v_chauffeur_id UUID;
BEGIN
    -- Versements en retard non notifiés récemment
    FOR v_versement IN 
        SELECT 
            v.id,
            v.vehicule_id,
            v.montant_attendu,
            v.date_attendue,
            v.date_notification,
            ve.immatriculation,
            ve.proprietaire_id,
            a.chauffeur_id
        FROM versements v
        JOIN vehicules ve ON ve.id = v.vehicule_id
        LEFT JOIN affectations a ON a.vehicule_id = v.vehicule_id AND a.statut = 'actif'
        WHERE v.statut = 'en_retard'
          AND (v.date_notification IS NULL OR v.date_notification < CURRENT_DATE - INTERVAL '3 days')
    LOOP
        -- Notifier le propriétaire
        IF v_versement.proprietaire_id IS NOT NULL THEN
            PERFORM creer_notification(
                v_versement.proprietaire_id,
                'versement',
                'warning',
                'Versement en retard',
                format('Le versement de %s FCFA pour le véhicule %s est en retard depuis le %s.',
                       v_versement.montant_attendu,
                       v_versement.immatriculation,
                       TO_CHAR(v_versement.date_attendue, 'DD/MM/YYYY')),
                '/dashboard/versements',
                'vehicule',
                v_versement.vehicule_id
            );
        END IF;
        
        -- Notifier le chauffeur si assigné
        IF v_versement.chauffeur_id IS NOT NULL THEN
            PERFORM creer_notification(
                v_versement.chauffeur_id,
                'versement',
                'warning',
                'Rappel : Versement à effectuer',
                format('Pensez à effectuer votre versement de %s FCFA pour le véhicule %s.',
                       v_versement.montant_attendu,
                       v_versement.immatriculation),
                '/dashboard/versements',
                'vehicule',
                v_versement.vehicule_id
            );
        END IF;
        
        -- Mettre à jour la date de notification
        UPDATE versements 
        SET date_notification = CURRENT_DATE
        WHERE id = v_versement.id;
    END LOOP;
END;
$$;

-- =====================================================
-- 6. VUE : Notifications avec infos utilisateur
-- =====================================================
CREATE OR REPLACE VIEW vue_notifications_complets AS
SELECT 
    n.*,
    p.prenom as destinataire_prenom,
    p.nom as destinataire_nom,
    p.email as destinataire_email,
    c.prenom as createur_prenom,
    c.nom as createur_nom
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
LEFT JOIN profiles c ON c.id = n.created_by
ORDER BY n.date_creation DESC;

-- =====================================================
-- 7. FONCTION : Marquer comme lue
-- =====================================================
CREATE OR REPLACE FUNCTION marquer_notification_lue(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications 
    SET lue = TRUE,
        date_lecture = NOW()
    WHERE id = p_notification_id 
      AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- =====================================================
-- 8. FONCTION : Compter notifications non lues
-- =====================================================
CREATE OR REPLACE FUNCTION compter_notifications_non_lues(
    p_user_id UUID
)
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
    WHERE user_id = p_user_id 
      AND lue = FALSE
      AND (date_expiration IS NULL OR date_expiration > NOW());
END;
$$;

-- =====================================================
-- 9. RLS POLICIES
-- =====================================================

-- Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy : Voir ses propres notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy : Marquer comme lue (ses propres notifications)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy : Supprimer ses propres notifications (archiver)
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy : Système peut créer des notifications
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (created_by IS NULL OR created_by = auth.uid());

-- =====================================================
-- 10. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE notifications IS 'Système de notifications centralisé';
COMMENT ON COLUMN notifications.type IS 'Type: conformite, versement, sanction, ticket, panne, controle, system';
COMMENT ON COLUMN notifications.niveau IS 'Importance: info, warning, urgent';
COMMENT ON COLUMN notifications.reference_type IS 'Type d entité liée pour lien direct';

-- =====================================================
-- FIN MIGRATION 010
-- =====================================================
