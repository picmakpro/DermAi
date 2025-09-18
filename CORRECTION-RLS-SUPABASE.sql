-- 🔧 CORRECTION URGENTE RLS SUPABASE
-- Exécuter dans Supabase SQL Editor

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Créer nouvelles politiques corrigées
CREATE POLICY "Enable insert for service role and authenticated users" ON profiles
  FOR INSERT WITH CHECK (
    -- Permettre au service role (pour l'inscription)
    auth.role() = 'service_role' OR
    -- Permettre aux utilisateurs authentifiés de créer leur propre profil
    auth.uid() = id
  );

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    -- Permettre au service role
    auth.role() = 'service_role' OR
    -- Permettre aux utilisateurs de voir leur propre profil
    auth.uid() = id
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    -- Permettre au service role
    auth.role() = 'service_role' OR
    -- Permettre aux utilisateurs de modifier leur propre profil
    auth.uid() = id
  );

-- 3. Vérifier que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Test de la politique (optionnel)
-- Cette requête devrait fonctionner maintenant
SELECT 'Politiques RLS mises à jour avec succès' as status;
