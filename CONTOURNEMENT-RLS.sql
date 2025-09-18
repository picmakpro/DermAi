-- 🚨 CONTOURNEMENT TEMPORAIRE RLS
-- Exécuter dans Supabase SQL Editor EN DERNIER RECOURS

-- Désactiver temporairement RLS sur la table profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Réactiver après que l'inscription fonctionne
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
