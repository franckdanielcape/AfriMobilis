-- =====================================================
-- MIGRATION 013: Rentabilité Propriétaire
-- =====================================================
-- Fonctions pour calculer les KPIs de rentabilité

-- =====================================================
-- 1. FONCTION : Stats rentabilité globale
-- =====================================================
CREATE OR REPLACE FUNCTION get_rentabilite_proprietaire(
    p_proprietaire_id UUID,
    p_date_debut DATE DEFAULT NULL,
    p_date_fin DATE DEFAULT NULL
)
RETURNS TABLE(
    -- Véhicules
    total_vehicules BIGINT,
    vehicules_actifs BIGINT,
    
    -- Versements
    total_versements_attendus NUMERIC,
    total_versements_recus NUMERIC,
    taux_recouvrement NUMERIC,
    nombre_versements_en_retard BIGINT,
    montant_retard NUMERIC,
    
    -- Pannes
    total_pannes BIGINT,
    pannes_en_cours BIGINT,
    cout_total_pannes NUMERIC,
    
    -- Période
    periode_debut DATE,
    periode_fin DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Dates par défaut : année en cours
    IF p_date_debut IS NULL THEN
        p_date_debut := DATE_TRUNC('year', CURRENT_DATE)::DATE;
    END IF;
    IF p_date_fin IS NULL THEN
        p_date_fin := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    WITH vehicules_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE statut = 'actif') as actifs
        FROM vehicules
        WHERE proprietaire_id = p_proprietaire_id
    ),
    versements_stats AS (
        SELECT 
            COALESCE(SUM(montant_attendu), 0) as attendus,
            COALESCE(SUM(montant_recu), 0) as recus,
            COUNT(*) FILTER (WHERE statut = 'en_retard') as nb_retard,
            COALESCE(SUM(montant_attendu) FILTER (WHERE statut = 'en_retard'), 0) as montant_retard
        FROM versements v
        JOIN vehicules ve ON ve.id = v.vehicule_id
        WHERE ve.proprietaire_id = p_proprietaire_id
          AND v.date_attendue BETWEEN p_date_debut AND p_date_fin
    ),
    pannes_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE statut = 'en_cours') as en_cours,
            COALESCE(SUM(cout_reparation), 0) as cout_total
        FROM pannes p
        JOIN vehicules ve ON ve.id = p.vehicule_id
        WHERE ve.proprietaire_id = p_proprietaire_id
          AND p.date_declaration BETWEEN p_date_debut AND p_date_fin
    )
    SELECT 
        vs.total as total_vehicules,
        vs.actifs as vehicules_actifs,
        ves.attendus as total_versements_attendus,
        ves.recus as total_versements_recus,
        CASE 
            WHEN ves.attendus > 0 THEN ROUND((ves.recus / ves.attendus) * 100, 2)
            ELSE 0
        END as taux_recouvrement,
        ves.nb_retard as nombre_versements_en_retard,
        ves.montant_retard as montant_retard,
        ps.total as total_pannes,
        ps.en_cours as pannes_en_cours,
        ps.cout_total as cout_total_pannes,
        p_date_debut as periode_debut,
        p_date_fin as periode_fin
    FROM vehicules_stats vs, versements_stats ves, pannes_stats ps;
END;
$$;

-- =====================================================
-- 2. FONCTION : Versements par mois (pour graphique)
-- =====================================================
CREATE OR REPLACE FUNCTION get_versements_par_mois(
    p_proprietaire_id UUID,
    p_nombre_mois INTEGER DEFAULT 6
)
RETURNS TABLE(
    mois DATE,
    mois_label TEXT,
    attendus NUMERIC,
    recus NUMERIC,
    retard NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH mois_series AS (
        SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - (p_nombre_mois - 1 || ' months')::INTERVAL)::DATE,
            DATE_TRUNC('month', CURRENT_DATE)::DATE,
            '1 month'::INTERVAL
        )::DATE as mois_date
    )
    SELECT 
        ms.mois_date as mois,
        TO_CHAR(ms.mois_date, 'MM/YYYY') as mois_label,
        COALESCE(SUM(v.montant_attendu), 0) as attendus,
        COALESCE(SUM(v.montant_recu), 0) as recus,
        COALESCE(SUM(v.montant_attendu) FILTER (WHERE v.statut = 'en_retard'), 0) as retard
    FROM mois_series ms
    LEFT JOIN versements v ON DATE_TRUNC('month', v.date_attendue)::DATE = ms.mois_date
    LEFT JOIN vehicules ve ON ve.id = v.vehicule_id AND ve.proprietaire_id = p_proprietaire_id
    GROUP BY ms.mois_date
    ORDER BY ms.mois_date;
END;
$$;

-- =====================================================
-- 3. FONCTION : Performance par véhicule
-- =====================================================
CREATE OR REPLACE FUNCTION get_performance_vehicules(
    p_proprietaire_id UUID,
    p_date_debut DATE DEFAULT NULL,
    p_date_fin DATE DEFAULT NULL
)
RETURNS TABLE(
    vehicule_id UUID,
    immatriculation VARCHAR,
    marque VARCHAR,
    modele VARCHAR,
    statut VARCHAR,
    chauffeur_nom TEXT,
    total_versements_attendus NUMERIC,
    total_versements_recus NUMERIC,
    taux_recouvrement NUMERIC,
    nb_pannes BIGINT,
    cout_pannes NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_date_debut IS NULL THEN
        p_date_debut := DATE_TRUNC('year', CURRENT_DATE)::DATE;
    END IF;
    IF p_date_fin IS NULL THEN
        p_date_fin := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    SELECT 
        ve.id as vehicule_id,
        ve.immatriculation,
        ve.marque,
        ve.modele,
        ve.statut,
        COALESCE(p.prenom || ' ' || p.nom, 'Non assigné') as chauffeur_nom,
        COALESCE(SUM(v.montant_attendu), 0) as total_versements_attendus,
        COALESCE(SUM(v.montant_recu), 0) as total_versements_recus,
        CASE 
            WHEN COALESCE(SUM(v.montant_attendu), 0) > 0 
            THEN ROUND((COALESCE(SUM(v.montant_recu), 0) / SUM(v.montant_attendu)) * 100, 2)
            ELSE 0
        END as taux_recouvrement,
        COUNT(DISTINCT pa.id) as nb_pannes,
        COALESCE(SUM(pa.cout_reparation), 0) as cout_pannes
    FROM vehicules ve
    LEFT JOIN affectations a ON a.vehicule_id = ve.id AND a.statut = 'actif'
    LEFT JOIN profiles p ON p.id = a.chauffeur_id
    LEFT JOIN versements v ON v.vehicule_id = ve.id 
        AND v.date_attendue BETWEEN p_date_debut AND p_date_fin
    LEFT JOIN pannes pa ON pa.vehicule_id = ve.id 
        AND pa.date_declaration BETWEEN p_date_debut AND p_date_fin
    WHERE ve.proprietaire_id = p_proprietaire_id
    GROUP BY ve.id, ve.immatriculation, ve.marque, ve.modele, ve.statut, p.prenom, p.nom
    ORDER BY taux_recouvrement DESC NULLS LAST;
END;
$$;

-- =====================================================
-- 4. FONCTION : Pannes par type
-- =====================================================
CREATE OR REPLACE FUNCTION get_pannes_par_type(
    p_proprietaire_id UUID,
    p_date_debut DATE DEFAULT NULL,
    p_date_fin DATE DEFAULT NULL
)
RETURNS TABLE(
    type_panne VARCHAR,
    nombre BIGINT,
    cout_total NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_date_debut IS NULL THEN
        p_date_debut := DATE_TRUNC('year', CURRENT_DATE)::DATE;
    END IF;
    IF p_date_fin IS NULL THEN
        p_date_fin := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    SELECT 
        pa.type_panne,
        COUNT(*) as nombre,
        COALESCE(SUM(pa.cout_reparation), 0) as cout_total
    FROM pannes pa
    JOIN vehicules ve ON ve.id = pa.vehicule_id
    WHERE ve.proprietaire_id = p_proprietaire_id
      AND pa.date_declaration BETWEEN p_date_debut AND p_date_fin
    GROUP BY pa.type_panne
    ORDER BY nombre DESC;
END;
$$;

-- =====================================================
-- 5. VUE : Résumé activité récente
-- =====================================================
CREATE OR REPLACE VIEW vue_activite_proprietaire AS
SELECT 
    ve.proprietaire_id,
    ve.id as vehicule_id,
    ve.immatriculation,
    'versement' as type_activite,
    v.date_versement as date_activite,
    v.montant_recu as montant,
    v.statut,
    NULL as description
FROM versements v
JOIN vehicules ve ON ve.id = v.vehicule_id
WHERE v.date_versement >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
    ve.proprietaire_id,
    ve.id as vehicule_id,
    ve.immatriculation,
    'panne' as type_activite,
    pa.date_declaration as date_activite,
    pa.cout_reparation as montant,
    pa.statut,
    pa.description
FROM pannes pa
JOIN vehicules ve ON ve.id = pa.vehicule_id
WHERE pa.date_declaration >= CURRENT_DATE - INTERVAL '30 days'

ORDER BY date_activite DESC;

-- =====================================================
-- 6. COMMENTAIRES
-- =====================================================
COMMENT ON FUNCTION get_rentabilite_proprietaire IS 'Calcul les KPIs de rentabilité pour un propriétaire';
COMMENT ON FUNCTION get_versements_par_mois IS 'Retourne les versements mensuels pour graphique';
COMMENT ON FUNCTION get_performance_vehicules IS 'Performance détaillée par véhicule';
COMMENT ON FUNCTION get_pannes_par_type IS 'Répartition des pannes par type';

-- =====================================================
-- FIN MIGRATION 013
-- =====================================================
