-- Migration 007 : Structure Géographique Hiérarchique
-- Date : Mars 2026
-- 
-- Cette migration crée la structure hiérarchique :
-- SUPER ADMIN > SUPER CHEF DE LIGNE (par ville) > CHEFS DE LIGNE (collègues, même ville)

-- ============================================
-- ÉTAPE 1 : Suppression des anciens triggers conflictuels
-- ============================================

-- Supprimer la fonction trigger si elle existe (elle cause les erreurs)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- ÉTAPE 2 : Création de la table des pays
-- ============================================

CREATE TABLE IF NOT EXISTS pays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    indicatif_telephone VARCHAR(5),
    devise VARCHAR(3) DEFAULT 'XOF',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE pays IS 'Liste des pays où AfriMobilis opère';

-- ============================================
-- ÉTAPE 3 : Création de la table des villes
-- ============================================

CREATE TABLE IF NOT EXISTS villes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pays_id UUID REFERENCES pays(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    code_postal VARCHAR(10),
    coordonnees_geo POINT,
    super_chef_ligne_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    statut VARCHAR(20) DEFAULT 'actif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pays_id, nom)
);

COMMENT ON TABLE villes IS 'Villes où AfriMobilis opère. Chaque ville a un Super Chef de Ligne';

-- ============================================
-- ÉTAPE 4 : Suppression de l'ancienne table secteurs (plus nécessaire)
-- ============================================

DROP TABLE IF EXISTS secteurs CASCADE;

-- ============================================
-- ÉTAPE 5 : Ajout des colonnes géographiques à la table profiles
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pays_id') THEN
        ALTER TABLE profiles ADD COLUMN pays_id UUID REFERENCES pays(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'ville_id') THEN
        ALTER TABLE profiles ADD COLUMN ville_id UUID REFERENCES villes(id) ON DELETE SET NULL;
    END IF;
    
    -- Supprimer secteur_id si elle existe (plus nécessaire)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'secteur_id') THEN
        ALTER TABLE profiles DROP COLUMN secteur_id;
    END IF;
END $$;

-- ============================================
-- ÉTAPE 6 : Ajout des colonnes géographiques à la table vehicules
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicules' AND column_name = 'pays_id') THEN
        ALTER TABLE vehicules ADD COLUMN pays_id UUID REFERENCES pays(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicules' AND column_name = 'ville_id') THEN
        ALTER TABLE vehicules ADD COLUMN ville_id UUID REFERENCES villes(id) ON DELETE SET NULL;
    END IF;
    
    -- Supprimer secteur_id si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicules' AND column_name = 'secteur_id') THEN
        ALTER TABLE vehicules DROP COLUMN secteur_id;
    END IF;
END $$;

-- ============================================
-- ÉTAPE 7 : Insertion des données initiales
-- ============================================

-- Insérer la Côte d'Ivoire
INSERT INTO pays (code, nom, indicatif_telephone, devise)
VALUES ('CI', 'Côte d''Ivoire', '+225', 'XOF')
ON CONFLICT (code) DO NOTHING;

-- Insérer Grand-Bassam
INSERT INTO villes (pays_id, nom)
SELECT p.id, 'Grand-Bassam'
FROM pays p
WHERE p.code = 'CI'
ON CONFLICT (pays_id, nom) DO NOTHING;

-- ============================================
-- ÉTAPE 8 : Mise à jour des données existantes
-- ============================================

-- Associer les profils existants à Grand-Bassam par défaut
-- Note : On ne filtre pas par rôle pour éviter les problèmes avec l'enum
UPDATE profiles
SET 
    pays_id = (SELECT id FROM pays WHERE code = 'CI'),
    ville_id = (SELECT id FROM villes WHERE nom = 'Grand-Bassam')
WHERE pays_id IS NULL;

-- Associer les véhicules existants à Grand-Bassam par défaut
UPDATE vehicules
SET 
    pays_id = (SELECT id FROM pays WHERE code = 'CI'),
    ville_id = (SELECT id FROM villes WHERE nom = 'Grand-Bassam')
WHERE pays_id IS NULL;

-- ============================================
-- ÉTAPE 9 : Activation des RLS (Row Level Security)
-- ============================================

ALTER TABLE pays ENABLE ROW LEVEL SECURITY;
ALTER TABLE villes ENABLE ROW LEVEL SECURITY;

-- Politique pour pays (tous les utilisateurs authentifiés peuvent voir)
DROP POLICY IF EXISTS "Tous voient les pays" ON pays;
CREATE POLICY "Tous voient les pays" ON pays
    FOR SELECT TO authenticated USING (true);

-- Politique pour villes : Utilisateurs avec une ville_id assignée voient leur ville
-- Cela fonctionne pour tous les rôles (super_admin, super_chef_de_ligne, chef_de_ligne, etc.)
DROP POLICY IF EXISTS "Utilisateurs voient leur ville" ON villes;
CREATE POLICY "Utilisateurs voient leur ville" ON villes
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND ville_id = villes.id)
    );

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
