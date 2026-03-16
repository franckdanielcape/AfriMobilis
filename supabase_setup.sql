-- =====================================================
-- CONFIGURATION BASE DE DONNÉES AFRIMOBILIS
-- Projet: fqtzxijhqxnpwchgoshm
-- =====================================================

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles (Utilisateurs)
-- =====================================================
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

-- Commentaire sur la table
COMMENT ON TABLE public.profiles IS 'Profils des utilisateurs (Super Admin, Chefs de Ligne, Propriétaires, Chauffeurs, Passagers)';

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

COMMENT ON TABLE public.syndicats IS 'Syndicats de taxi par ville';

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

COMMENT ON TABLE public.vehicules IS 'Véhicules enregistrés';

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

COMMENT ON TABLE public.documents_conformite IS 'Documents des véhicules (assurance, vignette, etc.)';

-- =====================================================
-- ACTIVER ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndicats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_conformite ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES RLS - profiles
-- =====================================================

-- Politique: Lecture pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
CREATE POLICY "Enable read access for authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Politique: Insertion (l'utilisateur peut créer son propre profil)
DROP POLICY IF EXISTS "Enable insert for users" ON public.profiles;
CREATE POLICY "Enable insert for users"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Politique: Modification (soi-même ou Super Admin)
DROP POLICY IF EXISTS "Enable update for users or admins" ON public.profiles;
CREATE POLICY "Enable update for users or admins"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id 
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Politique: Suppression (Super Admin uniquement)
DROP POLICY IF EXISTS "Enable delete for super admins" ON public.profiles;
CREATE POLICY "Enable delete for super admins"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- =====================================================
-- POLITIQUES RLS - syndicats
-- =====================================================

-- Politique: Lecture pour tous les authentifiés
DROP POLICY IF EXISTS "Enable read access for syndicats" ON public.syndicats;
CREATE POLICY "Enable read access for syndicats"
    ON public.syndicats FOR SELECT
    TO authenticated
    USING (true);

-- Politique: Écriture (Super Admin uniquement)
DROP POLICY IF EXISTS "Enable write for super admins" ON public.syndicats;
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

-- =====================================================
-- POLITIQUES RLS - vehicules
-- =====================================================

-- Politique: Lecture pour tous les authentifiés
DROP POLICY IF EXISTS "Enable read access for vehicules" ON public.vehicules;
CREATE POLICY "Enable read access for vehicules"
    ON public.vehicules FOR SELECT
    TO authenticated
    USING (true);

-- Politique: Écriture (Super Admin et Chef de Ligne)
DROP POLICY IF EXISTS "Enable write for admins" ON public.vehicules;
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

-- =====================================================
-- POLITIQUES RLS - documents_conformite
-- =====================================================

DROP POLICY IF EXISTS "Enable read access for documents" ON public.documents_conformite;
CREATE POLICY "Enable read access for documents"
    ON public.documents_conformite FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable write for documents" ON public.documents_conformite;
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

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_syndicats_updated_at ON public.syndicats;
CREATE TRIGGER update_syndicats_updated_at
    BEFORE UPDATE ON public.syndicats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicules_updated_at ON public.vehicules;
CREATE TRIGGER update_vehicules_updated_at
    BEFORE UPDATE ON public.vehicules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Insérer le syndicat de Grand-Bassam (s'il n'existe pas déjà)
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
-- FIN DU SCRIPT
-- =====================================================
