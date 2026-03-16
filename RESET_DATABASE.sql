-- =====================================================
-- RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES
-- Garde uniquement le Super Admin
-- =====================================================

-- 1. SUPPRIMER TOUS LES CHEFS DE LIGNE (sauf s'ils ont des syndicats)
DELETE FROM profiles 
WHERE role = 'chef_ligne';

-- 2. SUPPRIMER TOUS LES PROPRIÉTAIRES
DELETE FROM profiles 
WHERE role = 'proprietaire';

-- 3. SUPPRIMER TOUS LES CHAUFFEURS
DELETE FROM profiles 
WHERE role = 'chauffeur';

-- 4. SUPPRIMER TOUS LES PASSAGERS
DELETE FROM profiles 
WHERE role = 'passager';

-- 5. SUPPRIMER TOUS LES SYNDICATS
DELETE FROM syndicats;

-- 6. SUPPRIMER TOUS LES VÉHICULES
DELETE FROM vehicules;

-- 7. SUPPRIMER TOUS LES DOCUMENTS
DELETE FROM documents_conformite;

-- 8. SUPPRIMER TOUS LES VERSEMENTS
DELETE FROM versements;

-- Vérification : Il ne reste que le Super Admin
SELECT 'Utilisateurs restants:' as info, COUNT(*) as total FROM profiles;
SELECT 'Syndicats restants:' as info, COUNT(*) as total FROM syndicats;
SELECT 'Véhicules restants:' as info, COUNT(*) as total FROM vehicules;

-- Afficher le Super Admin préservé
SELECT id, nom, prenom, email, role, telephone 
FROM profiles 
WHERE role = 'super_admin';
