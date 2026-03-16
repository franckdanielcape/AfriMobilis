-- Migration 005: Marketplace Véhicules & Confirmations

-- 1. Table des annonces de véhicules
CREATE TABLE IF NOT EXISTS public.vehicules_annonces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicule_id UUID REFERENCES public.vehicules(id) ON DELETE SET NULL, -- Null if someone is looking to buy without specifying a specific car yet
    type_annonce VARCHAR(50) NOT NULL CHECK (type_annonce IN ('vente', 'recherche')),
    auteur_id UUID REFERENCES public.profiles(id) NOT NULL,
    prix DECIMAL(15, 2) NOT NULL,
    description TEXT,
    statut VARCHAR(50) DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'en_cours', 'conclue', 'annulee')),
    acheteur_id UUID REFERENCES public.profiles(id), -- Qui achète finalement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des confirmations (Vendeur, Acheteur, Témoins)
CREATE TABLE IF NOT EXISTS public.vehicule_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    annonce_id UUID REFERENCES public.vehicules_annonces(id) ON DELETE CASCADE,
    profil_id UUID REFERENCES public.profiles(id) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('vendeur', 'acheteur', 'temoin')),
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirme', 'rejete')),
    commentaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(annonce_id, profil_id, role) -- Empêcher la multi-confirmation pour le même rôle
);

-- 3. Fonction PL/pgSQL pour finaliser la vente
CREATE OR REPLACE FUNCTION check_and_finalize_sale()
RETURNS TRIGGER AS $$
DECLARE
    seller_confirmed BOOLEAN;
    buyer_confirmed BOOLEAN;
    witness_confirmed_count INTEGER;
    ann_vehicule_id UUID;
    ann_acheteur_id UUID;
BEGIN
    -- Only check if this is an update that sets a confirmation
    IF NEW.statut = 'confirme' THEN

        -- Check if we have all necessary confirmations for THIS ad
        SELECT 
            EXISTS(SELECT 1 FROM vehicule_confirmations WHERE annonce_id = NEW.annonce_id AND role = 'vendeur' AND statut = 'confirme'),
            EXISTS(SELECT 1 FROM vehicule_confirmations WHERE annonce_id = NEW.annonce_id AND role = 'acheteur' AND statut = 'confirme'),
            (SELECT count(*) FROM vehicule_confirmations WHERE annonce_id = NEW.annonce_id AND role = 'temoin' AND statut = 'confirme')
        INTO seller_confirmed, buyer_confirmed, witness_confirmed_count;

        -- If all strict conditions are met (1 seller, 1 buyer, at least 1 witness)
        IF seller_confirmed AND buyer_confirmed AND witness_confirmed_count > 0 THEN
            
            -- Get the vehicle ID and the buyer ID from the ad
            SELECT vehicule_id, acheteur_id INTO ann_vehicule_id, ann_acheteur_id 
            FROM public.vehicules_annonces 
            WHERE id = NEW.annonce_id AND type_annonce = 'vente';

            -- If it's a valid sale with a vehicle attached and an intended buyer
            IF ann_vehicule_id IS NOT NULL AND ann_acheteur_id IS NOT NULL THEN
                
                -- Update the owner in the main vehicles table
                UPDATE public.vehicules 
                SET proprietaire_id = ann_acheteur_id, updated_at = NOW()
                WHERE id = ann_vehicule_id;

                -- Mark the ad as concluded
                UPDATE public.vehicules_annonces
                SET statut = 'conclue', updated_at = NOW()
                WHERE id = NEW.annonce_id;
                
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger
DROP TRIGGER IF EXISTS trigger_finalize_sale ON public.vehicule_confirmations;
CREATE TRIGGER trigger_finalize_sale
AFTER UPDATE ON public.vehicule_confirmations
FOR EACH ROW
EXECUTE FUNCTION check_and_finalize_sale();

-- 5. Row Level Security
ALTER TABLE public.vehicules_annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicule_confirmations ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les annonces publiques ('ouverte' ou 'conclue' pour l'historique)
CREATE POLICY "Public can view annonces" ON public.vehicules_annonces
FOR SELECT
USING (statut IN ('ouverte', 'conclue', 'en_cours'));

-- Seuls les utilisateurs authentifiés peuvent créer des annonces
CREATE POLICY "Auth users can insert annonces" ON public.vehicules_annonces
FOR INSERT
WITH CHECK (auth.uid() = auteur_id);

-- L'auteur peut modifier son annonce (tant qu'elle n'est pas conclue)
CREATE POLICY "Auteur can update annonce" ON public.vehicules_annonces
FOR UPDATE
USING (auth.uid() = auteur_id AND statut != 'conclue');

-- RLS pour les confirmations
-- Les personnes impliquées dans une annonce (comme acheteur, vendeur ou témoin)
-- peuvent voir les confirmations de l'annonce.
CREATE POLICY "Users can view relevant confirmations" ON public.vehicule_confirmations
FOR SELECT
USING (
    auth.uid() IN (SELECT auteur_id FROM public.vehicules_annonces WHERE id = annonce_id) OR
    auth.uid() IN (SELECT acheteur_id FROM public.vehicules_annonces WHERE id = annonce_id) OR
    auth.uid() = profil_id OR
    (SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'super_admin'
);

-- Tout utilisateur authentifié peut être ajouté comme témoin ou acheteur
CREATE POLICY "Users can insert confirmations" ON vehicule_confirmations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Un utilisateur ne peut mettre à jour que SA PROPRE confirmation
CREATE POLICY "Users can update their own confirmation" ON vehicule_confirmations
FOR UPDATE
USING (auth.uid() = profil_id);
