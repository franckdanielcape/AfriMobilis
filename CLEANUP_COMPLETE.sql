-- =====================================================
-- NETTOYAGE COMPLET - CORRECTION DES PROBLÈMES
-- =====================================================

-- 1. Voir tous les profils actuels
SELECT '=== PROFILS ACTUELS ===' as section;
SELECT id, nom, prenom, email, telephone, role, syndicat_id, created_at
FROM profiles
ORDER BY role, nom;

-- 2. Supprimer tous les chefs de ligne (pour repartir à zéro)
-- DELETE FROM profiles WHERE role = 'chef_ligne';

-- 3. Vérifier le Super Admin
SELECT '=== SUPER ADMIN ===' as section;
SELECT id, nom, prenom, email, telephone, role
FROM profiles
WHERE role = 'super_admin';

-- 4. Corriger le Super Admin si nécessaire
UPDATE profiles
SET 
    nom = 'CAPÉ',
    prenom = 'Franck Daniel',
    telephone = '2250708124233',
    email = 'franckdanielcape@gmail.com'
WHERE role = 'super_admin'
AND email = 'franckdanielcape@gmail.com';

-- 5. Supprimer les emails factices des chefs restants
UPDATE profiles
SET email = NULL
WHERE role = 'chef_ligne'
AND email LIKE '%@afrimobilis.local';

-- 6. Compter par rôle
SELECT '=== STATISTIQUES ===' as section;
SELECT role, COUNT(*) as total
FROM profiles
GROUP BY role;

-- 7. Compter les syndicats
SELECT '=== SYNDICATS ===' as section;
SELECT COUNT(*) as total_syndicats FROM syndicats;
SELECT * FROM syndicats;
