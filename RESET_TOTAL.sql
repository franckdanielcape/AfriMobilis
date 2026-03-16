-- =====================================================
-- RÉINITIALISATION TOTALE - ALTERNATIVE SÛRE
-- =====================================================

-- 1. Afficher l'état actuel
SELECT '=== ÉTAT ACTUEL ===' as info;

-- Compter par rôle
SELECT role, COUNT(*) as total 
FROM profiles 
GROUP BY role;

-- Voir tous les profils
SELECT id, nom, prenom, email, telephone, role, syndicat_id 
FROM profiles 
ORDER BY role, nom;

-- 2. SUPPRIMER TOUS LES COMPTES AUTH DES CHEFS (pour libérer les numéros)
-- Note: Ceci doit être fait via l'API Supabase Auth, pas en SQL

-- 3. SUPPRIMER TOUS LES PROFILES (sauf Super Admin)
-- DELETE FROM profiles 
-- WHERE role != 'super_admin';

-- 4. SUPPRIMER TOUS LES SYNDICATS
-- DELETE FROM syndicats;

-- 5. Vérifier l'état après nettoyage
-- SELECT role, COUNT(*) as total FROM profiles GROUP BY role;
-- SELECT COUNT(*) as syndicats FROM syndicats;
