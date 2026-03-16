-- Migration 006: Add 'annee' column to 'vehicules' table if missing

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vehicules' 
        AND column_name = 'annee'
    ) THEN
        ALTER TABLE vehicules ADD COLUMN annee INTEGER;
    END IF;
END $$;
