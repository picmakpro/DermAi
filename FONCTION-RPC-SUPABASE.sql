-- 🔧 FONCTION RPC POUR CRÉER PROFILS
-- Exécuter dans Supabase SQL Editor

-- Créer une fonction RPC qui contourne RLS
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute avec les privilèges du propriétaire (contourne RLS)
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, analyses_count, created_at, updated_at)
  VALUES (
    user_id,
    user_email,
    COALESCE(user_full_name, split_part(user_email, '@', 1)),
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION create_user_profile TO service_role;

SELECT 'Fonction RPC create_user_profile créée avec succès' as status;
