import { createClient } from '@supabase/supabase-js'

// Client Supabase avec service role - SERVEUR UNIQUEMENT
// Ne jamais importer ce fichier côté client !

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Variables d\'environnement Supabase Admin manquantes')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
