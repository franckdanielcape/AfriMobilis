-- =====================================================
-- NETTOYAGE : Supprimer les chefs sans syndicat (orphelins)
-- =====================================================

-- Voir les chefs qui n'ont pas de syndicat (à supprimer)
SELECT id, nom, prenom, telephone, email, syndicat_id, role, created_at
FROM profiles
WHERE role = 'chef_ligne' 
AND syndicat_id IS NULL;

-- Pour les supprimer définitivement :
-- DELETE FROM profiles
-- WHERE role = 'chef_ligne' 
-- AND syndicat_id IS NULL;
