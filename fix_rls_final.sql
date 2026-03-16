-- FIX RLS POUR RECENSEMENT - À exécuter dans Supabase SQL Editor

-- 1. Désactiver temporairement RLS sur profiles (solution rapide)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Politique permissive pour permettre l'insert (solution propre)
-- D'abord supprimer les politiques existantes qui bloquent
DROP POLICY IF EXISTS "Allow authenticated insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all inserts for recensement" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Créer une politique qui permet à tout utilisateur authentifié d'insérer
CREATE POLICY "Allow authenticated insert profiles" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Même chose pour vehicules
DROP POLICY IF EXISTS "Allow authenticated insert vehicules" ON vehicules;
CREATE POLICY "Allow authenticated insert vehicules" 
ON vehicules 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Vérification
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'vehicules');
