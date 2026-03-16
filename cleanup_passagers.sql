-- =====================================================
-- NETTOYAGE : Supprimer les anciens chefs devenus passagers
-- =====================================================

-- Voir les profils avec numéro de téléphone qui sont des passagers
-- (anciens chefs qui n'ont pas été vraiment supprimés)
SELECT id, nom, prenom, telephone, email, role, syndicat_id, created_at
FROM profiles
WHERE role = 'passager' 
AND telephone IS NOT NULL
ORDER BY created_at DESC;

-- Pour supprimer DÉFINITIVEMENT ces anciens profils et libérer les numéros :
-- DELETE FROM profiles 
-- WHERE role = 'passager' 
-- AND telephone IS NOT NULL;

-- Ou plus sécurisé - supprimer uniquement ceux sans syndicat :
-- DELETE FROM profiles 
-- WHERE role = 'passager' 
-- AND syndicat_id IS NULL
-- AND telephone IS NOT NULL;
