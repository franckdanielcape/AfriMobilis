-- =====================================================
-- NETTOYAGE : Supprimer les emails factices des chefs
-- =====================================================

-- Voir tous les profils avec leurs emails
SELECT id, nom, prenom, email, telephone, role, syndicat_id
FROM profiles
ORDER BY role, nom;

-- Supprimer les emails qui contiennent @afrimobilis.local des chefs
-- (pour qu'ils puissent ajouter leur vrai email plus tard)
UPDATE profiles
SET email = NULL
WHERE role = 'chef_ligne'
AND email LIKE '%@afrimobilis.local';

-- Vérifier le Super Admin
SELECT id, nom, prenom, email, telephone, role
FROM profiles
WHERE role = 'super_admin';

-- Mettre à jour le Super Admin avec les bonnes infos si nécessaire
UPDATE profiles
SET 
    nom = 'CAPÉ',
    prenom = 'Franck Daniel',
    telephone = '2250708124233'
WHERE role = 'super_admin'
AND email = 'franckdanielcape@gmail.com';

-- Vérifier les résultats
SELECT id, nom, prenom, email, telephone, role
FROM profiles
ORDER BY role, nom;
