import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types de base de données
export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_status: 'free' | 'premium'
  analyses_count: number
  last_analysis_at?: string
  created_at: string
  updated_at: string
}

export interface UserAnalysis {
  id: string
  user_id: string
  analysis_data: any
  photos_metadata?: any
  created_at: string
  updated_at: string
  shared_publicly: boolean
  share_token?: string
  deleted_at?: string
  source: string
  version: string
  migrated_from_local: boolean
}

// Types pour la base de données
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      user_analyses: {
        Row: UserAnalysis
        Insert: Omit<UserAnalysis, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserAnalysis, 'id' | 'created_at'>>
      }
    }
  }
}
