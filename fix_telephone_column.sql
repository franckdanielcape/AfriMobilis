-- Script pour ajouter la colonne telephone à profiles si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'telephone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN telephone TEXT;
        RAISE NOTICE 'Colonne telephone ajoutée à profiles';
    ELSE
        RAISE NOTICE 'Colonne telephone existe déjà';
    END IF;
END $$;

-- Vérifier les colonnes existantes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
