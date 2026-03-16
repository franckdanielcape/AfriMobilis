-- SOLUTION: Désactiver le trigger qui bloque ou supprimer la contrainte FK

-- Option 1: Désactiver RLS sur user_roles (si ce n'est pas déjà fait)
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Option 2: Supprimer la contrainte foreign key (solution définitive pour le mode Super Admin)
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Option 3: Si c'est un trigger, le désactiver
DROP TRIGGER IF EXISTS tr_add_proprietaire_role ON vehicules;
DROP TRIGGER IF EXISTS tr_manage_user_roles ON profiles;

-- Vérification
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('profiles', 'vehicules', 'user_roles');
