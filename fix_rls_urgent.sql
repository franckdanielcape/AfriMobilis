-- SOLUTION URGENTE : Politique permissive pour débloquer le recensement
-- Cette politique permet à tout utilisateur authentifié de créer un profil
-- À utiliser temporairement pour tester si le problème vient des rôles

-- Option 1: Politique pour tout utilisateur authentifié (RECOMMANDÉ POUR TEST)
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
CREATE POLICY "Authenticated users can insert profiles"
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Option 2: Politique pour les admins basée sur le user_metadata (si le rôle est stocké là)
-- Cette politique vérifie aussi dans raw_user_meta_data
DROP POLICY IF EXISTS "Admins can insert profiles via metadata" ON profiles;
CREATE POLICY "Admins can insert profiles via metadata"
ON profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'role' = 'super_admin'
      OR auth.users.raw_user_meta_data->>'role' = 'admin_syndicat'
      OR auth.users.raw_user_meta_data->>'role' = 'chef_ligne'
    )
  )
);

-- Politique similaire pour affectations
DROP POLICY IF EXISTS "Authenticated users can insert affectations" ON affectations;
CREATE POLICY "Authenticated users can insert affectations"
ON affectations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Vérifier les politiques actives
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'affectations')
ORDER BY tablename, cmd;
