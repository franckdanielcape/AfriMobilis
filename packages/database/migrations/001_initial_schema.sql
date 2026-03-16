-- Migration 001: Initial Schema for AfriMobilis

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types (Enums)
CREATE TYPE user_role AS ENUM ('super_admin', 'admin_syndicat', 'sous_admin', 'chef_ligne', 'agent_terrain', 'proprietaire', 'gerant', 'chauffeur', 'passager');
CREATE TYPE conformite_status AS ENUM ('conforme', 'bientot_expire', 'non_conforme');
CREATE TYPE transaction_type AS ENUM ('depot', 'retrait', 'transfert', 'paiement_course', 'versement', 'taxe', 'amende');
CREATE TYPE transaction_status AS ENUM ('en_attente', 'complete', 'echoue', 'annule');

-- 1. syndicats
CREATE TABLE syndicats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    zone_geographique JSONB,
    statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. lignes
CREATE TABLE lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    syndicat_id UUID REFERENCES syndicats(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    tarif_base DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. profiles (users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- References auth.users(id) via trigger/foreign key in Supabase
    syndicat_id UUID REFERENCES syndicats(id),
    role user_role DEFAULT 'passager',
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    photo_url TEXT,
    piece_identite JSONB,
    adresse JSONB,
    kyc_verifie BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. profil_lignes
CREATE TABLE profil_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profil_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    ligne_id UUID REFERENCES lignes(id) ON DELETE CASCADE,
    role_specifique VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. vehicules
CREATE TABLE vehicules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    syndicat_id UUID REFERENCES syndicats(id),
    ligne_id UUID REFERENCES lignes(id),
    proprietaire_id UUID REFERENCES profiles(id),
    gerant_id UUID REFERENCES profiles(id),
    immatriculation VARCHAR(50) UNIQUE NOT NULL,
    marque VARCHAR(100),
    modele VARCHAR(100),
    annee INTEGER,
    couleur VARCHAR(50),
    carte_grise JSONB,
    assurance JSONB,
    visite_technique JSONB,
    licence_transport JSONB,
    statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'en_panne', 'inactif', 'suspendu')),
    -- Generated column managed via trigger in 002 (since logic is complex for standard generated columns in Postgres)
    conformite_status conformite_status DEFAULT 'conforme',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. affectations
CREATE TABLE affectations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicule_id UUID REFERENCES vehicules(id) ON DELETE CASCADE,
    chauffeur_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date_debut DATE NOT NULL,
    date_fin DATE,
    type_contrat VARCHAR(100),
    montant_versement DECIMAL(10, 2),
    frequence_versement VARCHAR(50) CHECK (frequence_versement IN ('journalier', 'hebdomadaire', 'mensuel')),
    statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'termine', 'suspendu')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profil_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    solde DECIMAL(15, 2) DEFAULT 0,
    solde_bloque DECIMAL(15, 2) DEFAULT 0,
    devise VARCHAR(10) DEFAULT 'XOF',
    statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'bloque', 'ferme')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id),
    reference VARCHAR(100) UNIQUE NOT NULL,
    type transaction_type NOT NULL,
    montant DECIMAL(15, 2) NOT NULL,
    frais DECIMAL(15, 2) DEFAULT 0,
    montant_net DECIMAL(15, 2) GENERATED ALWAYS AS (montant - frais) STORED,
    expediteur_id UUID REFERENCES profiles(id),
    destinataire_id UUID REFERENCES profiles(id),
    vehicule_id UUID REFERENCES vehicules(id),
    external_payment JSONB,
    description TEXT,
    statut transaction_status DEFAULT 'en_attente',
    mode_paiement VARCHAR(50) CHECK (mode_paiement IN ('wallet', 'mobile_money', 'especes', 'carte')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. versements
CREATE TABLE versements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    affectation_id UUID REFERENCES affectations(id),
    montant_attendu DECIMAL(15, 2) NOT NULL,
    montant_verse DECIMAL(15, 2) DEFAULT 0,
    retard BOOLEAN GENERATED ALWAYS AS (montant_verse < montant_attendu AND NOW() > date_echeance) STORED,
    date_echeance DATE NOT NULL,
    date_paiement TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'complet', 'partiel', 'en_retard')),
    commentaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. pannes
CREATE TABLE pannes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicule_id UUID REFERENCES vehicules(id) ON DELETE CASCADE,
    chauffeur_id UUID REFERENCES profiles(id),
    declare_par UUID REFERENCES profiles(id),
    type_panne VARCHAR(100) NOT NULL,
    description TEXT,
    gravite VARCHAR(50) CHECK (gravite IN ('mineure', 'majeure', 'critique')),
    localisation JSONB,
    statut VARCHAR(50) DEFAULT 'declaree' CHECK (statut IN ('declaree', 'en_reparation', 'resolue')),
    cout_reparation DECIMAL(15, 2),
    garage_nom VARCHAR(255),
    dates JSONB, -- { "declaree_le": "...", "reparee_le": "..." }
    perte_revenus_estimee DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. controles
CREATE TABLE controles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES profiles(id),
    vehicule_id UUID REFERENCES vehicules(id) ON DELETE CASCADE,
    chauffeur_id UUID REFERENCES profiles(id),
    date_controle TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lieu TEXT,
    conforme BOOLEAN NOT NULL,
    anomalies JSONB,
    documents_verifies JSONB,
    photos JSONB,
    signature_chauffeur TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. sanctions
CREATE TABLE sanctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    syndicat_id UUID REFERENCES syndicats(id),
    cible_type VARCHAR(50) CHECK (cible_type IN ('chauffeur', 'vehicule', 'proprietaire', 'gerant')),
    cible_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    motif TEXT NOT NULL,
    montant_amende DECIMAL(15, 2),
    duree_suspension INTEGER, -- en jours
    propose_par UUID REFERENCES profiles(id),
    valide_par UUID REFERENCES profiles(id),
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'active', 'levee', 'contestee')),
    dates JSONB, -- { "debut": "...", "fin": "..." }
    recours TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passager_id UUID REFERENCES profiles(id),
    type VARCHAR(50) CHECK (type IN ('reclamation', 'assistance', 'information')),
    categorie VARCHAR(100),
    description TEXT NOT NULL,
    date_incident TIMESTAMP WITH TIME ZONE,
    lieu TEXT,
    vehicule_immatriculation VARCHAR(50),
    chauffeur_nom VARCHAR(255),
    preuves JSONB,
    statut VARCHAR(50) DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'attente_client', 'resolu', 'ferme')),
    priorite VARCHAR(50) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    assigne_a UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. objets
CREATE TABLE objets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id),
    type VARCHAR(50) CHECK (type IN ('perdu', 'retrouve')),
    description TEXT NOT NULL,
    categorie VARCHAR(100),
    date_evenement TIMESTAMP WITH TIME ZONE,
    lieu TEXT,
    vehicule_id UUID REFERENCES vehicules(id),
    contact_nom VARCHAR(255),
    contact_phone VARCHAR(50),
    objet_match_id UUID, -- self reference to another objet if matching perdu/retrouve
    statut VARCHAR(50) DEFAULT 'signale' CHECK (statut IN ('signale', 'au_bureau', 'restitue', 'archive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_concernee VARCHAR(100) NOT NULL,
    enregistrement_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    anciennes_valeurs JSONB,
    nouvelles_valeurs JSONB,
    execute_par UUID REFERENCES profiles(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
