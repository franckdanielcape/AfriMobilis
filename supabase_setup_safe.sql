-- =====================================================
-- CONFIGURATION AFRIMOBILIS - VERSION SÉCURISÉE
-- Gère les tables existantes
-- =====================================================

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles (Utilisateurs)
-- =====================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT,
    prenom TEXT,
    telephone TEXT,
    email TEXT,
    role TEXT DEFAULT 'passager',
    syndicat_id UUID,
    status TEXT DEFAULT 'actif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Ajouter les colonnes manquantes si la table existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'actif';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'syndicat_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN syndicat_id UUID;
    END IF;
END $$;

-- =====================================================
-- TABLE: syndicats
-- =====================================================

CREATE TABLE IF NOT EXISTS public.syndicats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    code TEXT,
    zone TEXT,
    zone_geographique JSONB,
    statut TEXT DEFAULT 'actif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Ajouter les colonnes manquantes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'syndicats' AND column_name = 'statut'
    ) THEN
        ALTER TABLE public.syndicats ADD COLUMN statut TEXT DEFAULT 'actif';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'syndicats' AND column_name = 'zone_geographique'
    ) THEN
        ALTER TABLE public.syndicats ADD COLUMN zone_geographique JSONB;
    END IF;
END $$;

-- =====================================================
-- TABLE: vehicules
-- =====================================================

CREATE TABLE IF NOT EXISTS public.vehicules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plaque TEXT NOT NULL,
    immatriculation TEXT,
    marque TEXT,
    modele TEXT,
    annee INTEGER,
    couleur TEXT,
    statut TEXT DEFAULT 'en_attente_documents',
    proprietaire_id UUID REFERENCES public.profiles(id),
    chauffeur_id UUID REFERENCES public.profiles(id),
    syndicat_id UUID REFERENCES public.syndicats(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Ajouter les colonnes manquantes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicules' AND column_name = 'statut'
    ) THEN
        ALTER TABLE public.vehicules ADD COLUMN statut TEXT DEFAULT 'en_attente_documents';
    END IF;
END $$;

-- =====================================================
-- TABLE: documents_conformite
-- =====================================================

CREATE TABLE IF NOT EXISTS public.documents_conformite (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicule_id UUID REFERENCES public.vehicules(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    numero TEXT,
    date_emission DATE,
    date_expiration DATE,
    fichier_url TEXT,
    statut TEXT DEFAULT 'en_attente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- =====================================================
-- ACTIVER RLS
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndicats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_conformite ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES RLS
-- =====================================================

-- Supprimer les anciennes politiques pour éviter les doublons
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users or admins" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for super admins" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for syndicats" ON public.syndicats;
DROP POLICY IF EXISTS "Enable write for super admins" ON public.syndicats;
DROP POLICY IF EXISTS "Enable read access for vehicules" ON public.vehicules;
DROP POLICY IF EXISTS "Enable write for admins" ON public.vehicules;
DROP POLICY IF EXISTS "Enable read access for documents" ON public.documents_conformite;
DROP POLICY IF EXISTS "Enable write for documents" ON public.documents_conformite;

-- Politiques profiles
CREATE POLICY "Enable read access for authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for users"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users or admins"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id 
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Enable delete for super admins"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Politiques syndicats
CREATE POLICY "Enable read access for syndicats"
    ON public.syndicats FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable write for super admins"
    ON public.syndicats FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Politiques vehicules
CREATE POLICY "Enable read access for vehicules"
    ON public.vehicules FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable write for admins"
    ON public.vehicules FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'chef_ligne')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'chef_ligne')
        )
    );

-- Politiques documents
CREATE POLICY "Enable read access for documents"
    ON public.documents_conformite FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable write for documents"
    ON public.documents_conformite FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'chef_ligne', 'proprietaire')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'chef_ligne', 'proprietaire')
        )
    );

-- =====================================================
-- FONCTIONS TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers (supprimer d'abord pour éviter les doublons)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_syndicats_updated_at ON public.syndicats;
DROP TRIGGER IF EXISTS update_vehicules_updated_at ON public.vehicules;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_syndicats_updated_at
    BEFORE UPDATE ON public.syndicats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicules_updated_at
    BEFORE UPDATE ON public.vehicules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Insérer le syndicat de Grand-Bassam
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
-- VÉRIFICATION
-- =====================================================

SELECT 'Tables créées avec succès!' as status;
SELECT table_name, COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'syndicats', 'vehicules', 'documents_conformite')
GROUP BY table_name;
