-- =====================================================
-- AJOUT COLONNE TELEPHONE A LA TABLE PROFILES
-- =====================================================

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'profiles' 
        AND column_name = 'telephone'
    ) THEN
        -- Ajouter la colonne telephone
        ALTER TABLE public.profiles ADD COLUMN telephone TEXT;
        RAISE NOTICE 'Colonne telephone ajoutée avec succès';
    ELSE
        RAISE NOTICE 'La colonne telephone existe déjà';
    END IF;
END $$;

-- Vérifier la structure de la table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
