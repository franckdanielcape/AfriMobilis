-- =============================================================================
-- CORRECTION RLS POUR RECENSEMENT - À exécuter dans Supabase Dashboard SQL
-- =============================================================================

-- =============================================================================
-- 1. FONCTIONS UTILITAIRES (CREATE OR REPLACE pour garder les dépendances)
-- =============================================================================

-- Recréer la fonction sans la supprimer (elle a des dépendances)
CREATE OR REPLACE FUNCTION get_auth_user_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Recréer la fonction pour le syndicat
CREATE OR REPLACE FUNCTION get_auth_user_syndicat() RETURNS UUID AS $$
  SELECT syndicat_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================================================
-- 2. POLITIQUES PROFILES (Création de propriétaires/chauffeurs)
-- =============================================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins Syndicat can insert profiles" ON profiles;

-- Super Admin peut créer des profils
CREATE POLICY "Super admins can insert profiles"
ON profiles
FOR INSERT
WITH CHECK (get_auth_user_role() = 'super_admin');

-- Admin Syndicat peut créer des profils
CREATE POLICY "Admins Syndicat can insert profiles"
ON profiles
FOR INSERT
WITH CHECK (get_auth_user_role() = 'admin_syndicat');

-- Super Admin peut supprimer des profils
CREATE POLICY "Super admins can delete profiles"
ON profiles
FOR DELETE
USING (get_auth_user_role() = 'super_admin');

-- =============================================================================
-- 3. POLITIQUES AFFECTATIONS (Liaison chauffeur-véhicule)
-- =============================================================================

DROP POLICY IF EXISTS "Super admins can manage affectations" ON affectations;
DROP POLICY IF EXISTS "Admins Syndicat can manage affectations" ON affectations;
DROP POLICY IF EXISTS "Proprietaires can view own affectations" ON affectations;
DROP POLICY IF EXISTS "Chauffeurs can view own affectations" ON affectations;

-- Super Admin peut tout faire sur les affectations
CREATE POLICY "Super admins can manage affectations"
ON affectations
FOR ALL
USING (get_auth_user_role() = 'super_admin');

-- Admin Syndicat peut tout faire sur les affectations
CREATE POLICY "Admins Syndicat can manage affectations"
ON affectations
FOR ALL
USING (get_auth_user_role() = 'admin_syndicat');

-- Propriétaires peuvent voir les affectations de leurs véhicules
CREATE POLICY "Proprietaires can view own affectations"
ON affectations
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM vehicules WHERE vehicules.id = affectations.vehicule_id AND vehicules.proprietaire_id = auth.uid())
);

-- Chauffeurs peuvent voir leurs propres affectations
CREATE POLICY "Chauffeurs can view own affectations"
ON affectations
FOR SELECT
USING (chauffeur_id = auth.uid());

-- =============================================================================
-- 4. VÉRIFICATION
-- =============================================================================

-- Afficher toutes les politiques sur les tables concernées
SELECT 
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename IN ('profiles', 'affectations', 'vehicules')
ORDER BY tablename, cmd;
