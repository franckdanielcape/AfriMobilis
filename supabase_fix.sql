-- =====================================================
-- SCRIPT DE CORRECTION - Ajout des colonnes manquantes
-- =====================================================

-- Vérifier et ajouter la colonne 'statut' à la table syndicats si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'syndicats' 
        AND column_name = 'statut'
    ) THEN
        ALTER TABLE public.syndicats ADD COLUMN statut TEXT DEFAULT 'actif';
        RAISE NOTICE 'Colonne statut ajoutée à syndicats';
    ELSE
        RAISE NOTICE 'Colonne statut existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne 'status' à la table profiles si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'actif';
        RAISE NOTICE 'Colonne status ajoutée à profiles';
    ELSE
        RAISE NOTICE 'Colonne status existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter les colonnes manquantes à vehicules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vehicules' 
        AND column_name = 'statut'
    ) THEN
        ALTER TABLE public.vehicules ADD COLUMN statut TEXT DEFAULT 'en_attente_documents';
        RAISE NOTICE 'Colonne statut ajoutée à vehicules';
    END IF;
END $$;

-- =====================================================
-- INSERTION DU SYNDICAT GRAND-BASSAM (corrigée)
-- =====================================================

-- Insérer le syndicat de Grand-Bassam s'il n'existe pas
INSERT INTO public.syndicats (nom, code, zone, zone_geographique, statut)
SELECT 
    'Syndicat Unique des Taxis de Grand-Bassam',
    'GRA',
    'Grand-Bassam',
    '{"region": "Sud-Comoé", "ville": "Grand-Bassam"}'::jsonb,
    'actif'
WHERE NOT EXISTS (
    SELECT 1 FROM public.syndicats WHERE code = 'GRA'
);

-- =====================================================
-- VÉRIFICATION DES TABLES
-- =====================================================

-- Afficher la structure des tables créées
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'syndicats', 'vehicules', 'documents_conformite')
ORDER BY table_name, ordinal_position;
