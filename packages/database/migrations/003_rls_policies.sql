-- Migration 003: Row Level Security Policies

-- Enable RLS for all tables
ALTER TABLE syndicats ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profil_lignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE affectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE versements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pannes ENABLE ROW LEVEL SECURITY;
ALTER TABLE controles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE objets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Utility Functions for RLS
CREATE OR REPLACE FUNCTION get_auth_user_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_user_syndicat() RETURNS UUID AS $$
  SELECT syndicat_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles
-- Un utilisateur peut lire son propre profil
CREATE POLICY "Users can view own profile." ON profiles FOR SELECT USING (auth.uid() = id);
-- Un utilisateur peut mettre à jour son propre profil (limitations à gérer côté application)
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
-- Super admins peuvent tout voir et tout modifier
CREATE POLICY "Super admins can view all profiles." ON profiles FOR SELECT USING (get_auth_user_role() = 'super_admin');
CREATE POLICY "Super admins can update all profiles." ON profiles FOR UPDATE USING (get_auth_user_role() = 'super_admin');
CREATE POLICY "Super admins can insert profiles." ON profiles FOR INSERT WITH CHECK (get_auth_user_role() = 'super_admin');
CREATE POLICY "Super admins can delete profiles." ON profiles FOR DELETE USING (get_auth_user_role() = 'super_admin');
-- Admins Syndicat peuvent voir et créer des profils dans leur syndicat
CREATE POLICY "Admins Syndicat can view their syndicat profiles." ON profiles FOR SELECT USING (get_auth_user_role() = 'admin_syndicat' AND syndicat_id = get_auth_user_syndicat());
CREATE POLICY "Admins Syndicat can insert profiles." ON profiles FOR INSERT WITH CHECK (get_auth_user_role() = 'admin_syndicat');

-- 2. Syndicats
-- Tout le monde peut voir les syndicats actifs
CREATE POLICY "Anyone can view active syndicats." ON syndicats FOR SELECT USING (statut = 'actif');
-- Seuls les super admins peuvent modifier
CREATE POLICY "Super admins can manage syndicats." ON syndicats FOR ALL USING (get_auth_user_role() = 'super_admin');

-- 3. Vehicules
CREATE POLICY "Users can view vehicles in their syndicat." ON vehicules FOR SELECT USING (
  get_auth_user_role() = 'super_admin' OR 
  (syndicat_id = get_auth_user_syndicat())
);
-- Proprietaire can view their own vehicles
CREATE POLICY "Proprietaires can view their own vehicles." ON vehicules FOR SELECT USING (proprietaire_id = auth.uid());
-- Super Admins and Admins Syndicat can manage
CREATE POLICY "Admins can manage vehicles." ON vehicules FOR ALL USING (
  get_auth_user_role() = 'super_admin' OR 
  (get_auth_user_role() = 'admin_syndicat' AND syndicat_id = get_auth_user_syndicat())
);

-- 4. Wallets
CREATE POLICY "Users can view own wallet." ON wallets FOR SELECT USING (profil_id = auth.uid());
CREATE POLICY "Super admins can view all wallets." ON wallets FOR SELECT USING (get_auth_user_role() = 'super_admin');

-- 5. Transactions
CREATE POLICY "Users can view own transactions." ON transactions FOR SELECT USING (
  expediteur_id = auth.uid() OR destinataire_id = auth.uid()
);
CREATE POLICY "Super admins view all transactions." ON transactions FOR SELECT USING (get_auth_user_role() = 'super_admin');

-- 6. Affectations (Chauffeurs <-> Véhicules)
CREATE POLICY "Super admins can manage affectations." ON affectations FOR ALL USING (get_auth_user_role() = 'super_admin');
CREATE POLICY "Admins Syndicat can manage affectations." ON affectations FOR ALL USING (get_auth_user_role() = 'admin_syndicat');
CREATE POLICY "Proprietaires can view own affectations." ON affectations FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicules WHERE vehicules.id = affectations.vehicule_id AND vehicules.proprietaire_id = auth.uid())
);
CREATE POLICY "Chauffeurs can view own affectations." ON affectations FOR SELECT USING (chauffeur_id = auth.uid());

-- Default fallback: Allow all for development (Comment out in production)
-- CREATE POLICY "Dev Mode Allow All" ON profiles FOR ALL USING (true);
-- CREATE POLICY "Dev Mode Allow All" ON vehicules FOR ALL USING (true);
