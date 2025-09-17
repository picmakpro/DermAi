# 📅 PLANNING EXÉCUTION PHASE 1 - Authentification & Cloud Storage

> **Version :** 1.0  
> **Date :** 17 septembre 2025  
> **Durée :** 5 jours ouvrés  
> **Statut :** PRÊT À EXÉCUTER

---

## 🎯 **VUE D'ENSEMBLE DU PLANNING**

### **Objectif Global**
Implémenter l'authentification NextAuth.js + Supabase et la migration cloud sans casser le mode invité existant.

### **Métriques de Succès**
- **Inscription** : >30% utilisateurs invités s'inscrivent
- **Migration** : >95% analyses locales transférées sans erreur
- **Performance** : Connexion <2s, migration <5s
- **Rétention** : >70% utilisateurs inscrits reviennent D7

---

## 📊 **PLANNING DÉTAILLÉ PAR JOUR**

### **🚀 JOUR 1 : CONFIGURATION SUPABASE**

#### **Matin : Création Projet & Base de Données**

**🔧 Prompt Configuration Supabase :**
```bash
# 1. Créer projet Supabase
# - Nom: dermai-v2-prod
# - Région: Europe West (eu-west-1)
# - Plan: Free (upgrade si nécessaire)

# 2. Récupérer les clés
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ..." >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=eyJ..." >> .env.local
echo "SUPABASE_JWT_SECRET=your-jwt-secret" >> .env.local

# 3. Tester la connexion
npm install @supabase/supabase-js
```

**🗄️ Prompt Création Tables :**
```sql
-- Exécuter dans Supabase SQL Editor

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles (extend auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free',
  analyses_count INTEGER DEFAULT 0,
  last_analysis_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table user_analyses
CREATE TABLE user_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  photos_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shared_publicly BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  deleted_at TIMESTAMP WITH TIME ZONE NULL,
  source TEXT DEFAULT 'web',
  version TEXT DEFAULT '2.0',
  migrated_from_local BOOLEAN DEFAULT FALSE
);

-- Index pour performance
CREATE INDEX idx_user_analyses_user_id ON user_analyses(user_id);
CREATE INDEX idx_user_analyses_created_at ON user_analyses(created_at DESC);
CREATE INDEX idx_user_analyses_share_token ON user_analyses(share_token) WHERE share_token IS NOT NULL;
```

#### **Après-midi : RLS & Storage**

**🔒 Prompt Configuration RLS :**
```sql
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analyses ENABLE ROW LEVEL SECURITY;

-- Politiques profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques user_analyses
CREATE POLICY "Users can view own analyses" ON user_analyses
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (shared_publicly = true AND deleted_at IS NULL)
  );

CREATE POLICY "Users can insert own analyses" ON user_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON user_analyses
  FOR UPDATE USING (auth.uid() = user_id);
```

**📁 Prompt Configuration Storage :**
```sql
-- Bucket pour photos utilisateurs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-photos', 'user-photos', false);

-- Politique storage
CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**✅ Prompt Vérification Jour 1 :**
```bash
# Tester la configuration
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('profiles').select('*').then(console.log);
"
```

---

### **🔐 JOUR 2 : NEXTAUTH.JS CONFIGURATION**

#### **Matin : Configuration Google OAuth**

**🌐 Prompt Google Cloud Console :**
```bash
# 1. Aller sur Google Cloud Console
# 2. Créer nouveau projet ou utiliser existant
# 3. Activer Google+ API
# 4. Créer credentials OAuth 2.0
# 5. Ajouter domaines autorisés:
#    - http://localhost:3000 (dev)
#    - https://your-app.vercel.app (prod)
# 6. Récupérer Client ID et Secret

echo "GOOGLE_CLIENT_ID=your-google-client-id" >> .env.local
echo "GOOGLE_CLIENT_SECRET=your-google-client-secret" >> .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
```

**⚙️ Prompt Configuration NextAuth :**
```typescript
// Créer src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        // Authentification via Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })
        
        if (error || !data.user) return null
        
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name,
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Créer ou mettre à jour le profil
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.name,
            avatar_url: user.image,
          })
        
        return !error
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 heures
  },
}
```

#### **Après-midi : API Routes & Client Supabase**

**🔌 Prompt API Route NextAuth :**
```typescript
// Créer src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

**📦 Prompt Client Supabase :**
```typescript
// Créer src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client avec service role pour admin
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
```

**✅ Prompt Vérification Jour 2 :**
```bash
# Tester NextAuth
npm run dev
# Aller sur http://localhost:3000/api/auth/signin
# Tester connexion Google
```

---

### **🔄 JOUR 3 : SERVICES & HOOKS**

#### **Matin : Service Authentification**

**🛠️ Prompt Service Auth :**
```typescript
// Créer src/services/auth/authService.ts
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

export class AuthService {
  // Créer profil utilisateur
  static async createProfile(userData: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        analyses_count: 0,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Récupérer profil utilisateur
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) return null
    return data
  }

  // Mettre à jour profil
  static async updateProfile(
    userId: string, 
    updates: Partial<Profile>
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Incrémenter compteur analyses
  static async incrementAnalysisCount(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        analyses_count: supabase.raw('analyses_count + 1'),
        last_analysis_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error
  }
}
```

#### **Après-midi : Hook Authentification**

**🎣 Prompt Hook useAuth :**
```typescript
// Créer src/hooks/useAuth.ts
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { AuthService } from '@/services/auth/authService'
import type { Profile } from '@/lib/supabase'

export interface UseAuthReturn {
  user: Profile | null
  session: any
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (provider?: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUserProfile = async () => {
      if (session?.user?.id) {
        try {
          const profile = await AuthService.getProfile(session.user.id)
          setUser(profile)
        } catch (error) {
          console.error('Erreur chargement profil:', error)
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }

    if (status !== 'loading') {
      loadUserProfile()
    }
  }, [session, status])

  const handleSignIn = async (provider = 'google') => {
    await signIn(provider)
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.user?.id) throw new Error('Non authentifié')
    
    const updatedProfile = await AuthService.updateProfile(
      session.user.id, 
      updates
    )
    setUser(updatedProfile)
  }

  return {
    user,
    session,
    isLoading: status === 'loading' || isLoading,
    isAuthenticated: !!session?.user,
    signIn: handleSignIn,
    signOut: handleSignOut,
    updateProfile,
  }
}
```

**✅ Prompt Vérification Jour 3 :**
```typescript
// Test du hook
import { useAuth } from '@/hooks/useAuth'

function TestAuth() {
  const { user, isAuthenticated, signIn } = useAuth()
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Connecté: {user?.email}</p>
      ) : (
        <button onClick={() => signIn()}>Se connecter</button>
      )}
    </div>
  )
}
```

---

### **☁️ JOUR 4 : STOCKAGE CLOUD & MIGRATION**

#### **Matin : Service Stockage Cloud**

**📦 Prompt Service Cloud Storage :**
```typescript
// Créer src/services/storage/cloudStorage.ts
import { supabase } from '@/lib/supabase'
import type { UserAnalysis } from '@/lib/supabase'
import type { SkinAnalysis } from '@/types'

export class CloudStorageService {
  // Sauvegarder analyse en cloud
  static async saveAnalysis(
    userId: string, 
    analysis: SkinAnalysis,
    options: {
      migrated_from_local?: boolean
      source?: string
    } = {}
  ): Promise<UserAnalysis> {
    const { data, error } = await supabase
      .from('user_analyses')
      .insert({
        user_id: userId,
        analysis_data: analysis,
        photos_metadata: analysis.photos || [],
        source: options.source || 'web',
        version: '2.0',
        migrated_from_local: options.migrated_from_local || false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Récupérer analyses utilisateur
  static async getUserAnalyses(
    userId: string,
    options: {
      limit?: number
      offset?: number
      includeDeleted?: boolean
    } = {}
  ): Promise<UserAnalysis[]> {
    let query = supabase
      .from('user_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  // Supprimer analyse (soft delete)
  static async deleteAnalysis(
    userId: string, 
    analysisId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_analyses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', analysisId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Upload photo vers Supabase Storage
  static async uploadPhoto(
    userId: string, 
    photoBlob: Blob, 
    filename: string
  ): Promise<string> {
    const filePath = `${userId}/${Date.now()}-${filename}`
    
    const { data, error } = await supabase.storage
      .from('user-photos')
      .upload(filePath, photoBlob)

    if (error) throw error

    // Récupérer URL publique
    const { data: urlData } = supabase.storage
      .from('user-photos')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }

  // Générer token de partage
  static async generateShareToken(
    userId: string, 
    analysisId: string
  ): Promise<string> {
    const shareToken = crypto.randomUUID()
    
    const { error } = await supabase
      .from('user_analyses')
      .update({ 
        share_token: shareToken,
        shared_publicly: true 
      })
      .eq('id', analysisId)
      .eq('user_id', userId)

    if (error) throw error
    return shareToken
  }
}
```

#### **Après-midi : Service Migration**

**🔄 Prompt Service Migration :**
```typescript
// Créer src/services/migration/migrationService.ts
import { CloudStorageService } from '@/services/storage/cloudStorage'
import { getAnalysis, clearAllAnalysis } from '@/utils/storage/analysisStore'
import { AuthService } from '@/services/auth/authService'
import type { SkinAnalysis } from '@/types'

export interface MigrationResult {
  success: boolean
  migratedCount: number
  errors: string[]
  duration: number
}

export class MigrationService {
  // Migrer toutes les analyses locales vers le cloud
  static async migrateLocalAnalyses(userId: string): Promise<MigrationResult> {
    const startTime = Date.now()
    let migratedCount = 0
    const errors: string[] = []

    try {
      // Récupérer toutes les analyses locales
      const localAnalyses = await this.getAllLocalAnalyses()
      
      console.log(`Migration: ${localAnalyses.length} analyses trouvées localement`)

      for (const [id, analysis] of localAnalyses) {
        try {
          await CloudStorageService.saveAnalysis(userId, analysis, {
            migrated_from_local: true,
            source: 'migration'
          })
          
          migratedCount++
          console.log(`Migration: Analyse ${id} migrée avec succès`)
          
        } catch (error) {
          const errorMsg = `Erreur migration analyse ${id}: ${error}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      // Mettre à jour le compteur utilisateur
      if (migratedCount > 0) {
        await AuthService.updateProfile(userId, {
          analyses_count: migratedCount
        })
      }

      const duration = Date.now() - startTime
      
      return {
        success: errors.length === 0,
        migratedCount,
        errors,
        duration
      }

    } catch (error) {
      return {
        success: false,
        migratedCount,
        errors: [`Erreur générale migration: ${error}`],
        duration: Date.now() - startTime
      }
    }
  }

  // Nettoyer analyses locales après migration réussie
  static async clearLocalAnalysesAfterMigration(
    confirmationCallback?: () => Promise<boolean>
  ): Promise<boolean> {
    if (confirmationCallback) {
      const confirmed = await confirmationCallback()
      if (!confirmed) return false
    }

    try {
      await clearAllAnalysis()
      console.log('Migration: Analyses locales nettoyées')
      return true
    } catch (error) {
      console.error('Erreur nettoyage analyses locales:', error)
      return false
    }
  }

  // Récupérer toutes les analyses locales
  private static async getAllLocalAnalyses(): Promise<[string, SkinAnalysis][]> {
    const analyses: [string, SkinAnalysis][] = []
    
    // Parcourir IndexedDB pour récupérer toutes les analyses
    try {
      // Simuler récupération depuis IndexedDB
      // En réalité, il faudrait parcourir toutes les clés
      const keys = await this.getLocalAnalysisKeys()
      
      for (const key of keys) {
        const analysis = await getAnalysis(key)
        if (analysis) {
          analyses.push([key, analysis])
        }
      }
    } catch (error) {
      console.error('Erreur récupération analyses locales:', error)
    }

    return analyses
  }

  // Récupérer les clés des analyses locales
  private static async getLocalAnalysisKeys(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('dermai-db', 2)
      
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['analysis'], 'readonly')
        const store = transaction.objectStore('analysis')
        const keysRequest = store.getAllKeys()
        
        keysRequest.onsuccess = () => {
          resolve(keysRequest.result as string[])
        }
        
        keysRequest.onerror = () => {
          reject(keysRequest.error)
        }
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }
}
```

**✅ Prompt Vérification Jour 4 :**
```typescript
// Test migration
const testMigration = async () => {
  const { user } = useAuth()
  if (!user) return
  
  const result = await MigrationService.migrateLocalAnalyses(user.id)
  console.log('Résultat migration:', result)
}
```

---

### **🎨 JOUR 5 : PAGES AUTH & INTÉGRATION**

#### **Matin : Pages d'Authentification**

**📄 Prompt Page Connexion :**
```typescript
// Créer src/app/auth/signin/page.tsx
'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MigrationService } from '@/services/migration/migrationService'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/dashboard' 
      })
      
      if (result?.ok) {
        // Récupérer la session pour obtenir l'ID utilisateur
        const session = await getSession()
        
        if (session?.user?.id) {
          // Migrer les analyses locales
          const migrationResult = await MigrationService.migrateLocalAnalyses(
            session.user.id
          )
          
          if (migrationResult.success) {
            console.log(`${migrationResult.migratedCount} analyses migrées`)
          }
        }
        
        router.push('/dashboard')
      } else {
        setError('Erreur de connexion')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connectez-vous à DermAI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accédez à votre historique d'analyses
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Connexion...' : 'Continuer avec Google'}
          </button>
          
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Continuer en mode invité
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### **Après-midi : Intégration Mode Hybride**

**🔄 Prompt Hook Stockage Hybride :**
```typescript
// Créer src/hooks/useHybridStorage.ts
'use client'

import { useAuth } from '@/hooks/useAuth'
import { CloudStorageService } from '@/services/storage/cloudStorage'
import { saveAnalysis, getAnalysis } from '@/utils/storage/analysisStore'
import type { SkinAnalysis } from '@/types'

export function useHybridStorage() {
  const { user, isAuthenticated } = useAuth()

  const saveAnalysisHybrid = async (
    analysis: SkinAnalysis,
    analysisId?: string
  ): Promise<void> => {
    if (isAuthenticated && user) {
      // Utilisateur connecté : sauvegarder en cloud
      try {
        await CloudStorageService.saveAnalysis(user.id, analysis)
        console.log('Analyse sauvegardée en cloud')
      } catch (error) {
        console.error('Erreur sauvegarde cloud, fallback local:', error)
        // Fallback local en cas d'erreur cloud
        await saveAnalysis(analysisId || 'fallback', analysis)
      }
    } else {
      // Mode invité : sauvegarder localement
      await saveAnalysis(analysisId || 'guest', analysis)
      console.log('Analyse sauvegardée localement (mode invité)')
    }
  }

  const getAnalysisHybrid = async (analysisId: string): Promise<SkinAnalysis | null> => {
    if (isAuthenticated && user) {
      // Utilisateur connecté : récupérer depuis cloud
      try {
        const analyses = await CloudStorageService.getUserAnalyses(user.id, { limit: 1 })
        return analyses[0]?.analysis_data || null
      } catch (error) {
        console.error('Erreur récupération cloud, fallback local:', error)
        // Fallback local
        return await getAnalysis(analysisId)
      }
    } else {
      // Mode invité : récupérer localement
      return await getAnalysis(analysisId)
    }
  }

  const checkAnalysisLimit = async (): Promise<boolean> => {
    if (isAuthenticated) {
      // Utilisateur connecté : pas de limite
      return true
    } else {
      // Mode invité : limité à 1 analyse
      try {
        const localAnalysis = await getAnalysis('guest')
        return !localAnalysis // Autorisé si pas d'analyse existante
      } catch {
        return true // Autorisé en cas d'erreur
      }
    }
  }

  return {
    saveAnalysis: saveAnalysisHybrid,
    getAnalysis: getAnalysisHybrid,
    checkAnalysisLimit,
    isCloudStorage: isAuthenticated,
  }
}
```

**🔧 Prompt Modification useAnalysis :**
```typescript
// Modifier src/hooks/useAnalysis.ts
import { useHybridStorage } from '@/hooks/useHybridStorage'

export function useAnalysis(): UseAnalysisReturn {
  // ... code existant ...
  const { saveAnalysis: saveAnalysisHybrid, checkAnalysisLimit } = useHybridStorage()

  const analyze = async (request: AnalyzeRequest) => {
    try {
      // Vérifier limite analyses en mode invité
      const canAnalyze = await checkAnalysisLimit()
      if (!canAnalyze) {
        throw new Error('Inscription requise pour plus d\'analyses')
      }

      // ... code analyse existant ...

      // Sauvegarder avec stockage hybride
      if (result.data) {
        await saveAnalysisHybrid(result.data, 'current-analysis')
      }

      // ... reste du code ...
    } catch (err) {
      // ... gestion erreurs ...
    }
  }

  // ... reste du hook ...
}
```

**✅ Prompt Vérification Finale :**
```bash
# Tests complets
npm run test
npm run build
npm run dev

# Tester parcours complet :
# 1. Mode invité → analyse → limite atteinte
# 2. Inscription Google → migration automatique
# 3. Nouvelle analyse en mode connecté
# 4. Vérification données en cloud
```

---

## 🧪 **PROMPTS DE VÉRIFICATION**

### **🔍 Vérification Configuration**
```bash
# Vérifier variables d'environnement
node -e "
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌');
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅' : '❌');
console.log('NextAuth Secret:', process.env.NEXTAUTH_SECRET ? '✅' : '❌');
"
```

### **🔍 Vérification Base de Données**
```sql
-- Tester RLS
SELECT * FROM profiles; -- Doit être vide si pas connecté
SELECT * FROM user_analyses; -- Doit être vide si pas connecté

-- Tester avec utilisateur connecté
INSERT INTO profiles (id, email) VALUES ('test-id', 'test@example.com');
SELECT * FROM profiles WHERE id = 'test-id'; -- Doit fonctionner
```

### **🔍 Vérification Authentification**
```typescript
// Test NextAuth
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function TestPage() {
  const session = await getServerSession(authOptions)
  
  return (
    <div>
      <p>Session: {session ? '✅ Connecté' : '❌ Non connecté'}</p>
      <p>User ID: {session?.user?.id}</p>
      <p>Email: {session?.user?.email}</p>
    </div>
  )
}
```

### **🔍 Vérification Migration**
```typescript
// Test migration complète
const testCompleteMigration = async () => {
  // 1. Créer analyse locale
  await saveAnalysis('test', mockAnalysis)
  
  // 2. Se connecter
  await signIn('google')
  
  // 3. Vérifier migration automatique
  const session = await getSession()
  if (session?.user?.id) {
    const cloudAnalyses = await CloudStorageService.getUserAnalyses(session.user.id)
    console.log('Analyses en cloud:', cloudAnalyses.length)
  }
}
```

---

## 🐛 **PROMPTS DE DEBUG**

### **🔧 Debug Authentification**
```typescript
// Debug NextAuth
export default function DebugAuth() {
  const { data: session, status } = useSession()
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Debug Authentification</h3>
      <p>Status: {status}</p>
      <p>Session: {JSON.stringify(session, null, 2)}</p>
      <p>User ID: {session?.user?.id}</p>
      <p>Email: {session?.user?.email}</p>
    </div>
  )
}
```

### **🔧 Debug Supabase**
```typescript
// Debug connexion Supabase
const debugSupabase = async () => {
  try {
    // Test connexion
    const { data, error } = await supabase.from('profiles').select('count')
    console.log('Supabase connexion:', error ? '❌' : '✅')
    
    // Test RLS
    const { data: user } = await supabase.auth.getUser()
    console.log('Utilisateur Supabase:', user?.user?.id || 'Non connecté')
    
    // Test requête
    const { data: profiles } = await supabase.from('profiles').select('*')
    console.log('Profils accessibles:', profiles?.length || 0)
    
  } catch (error) {
    console.error('Erreur Supabase:', error)
  }
}
```

### **🔧 Debug Migration**
```typescript
// Debug migration détaillée
const debugMigration = async (userId: string) => {
  console.log('🔍 Debug Migration - Début')
  
  // 1. Vérifier analyses locales
  const localKeys = await MigrationService.getLocalAnalysisKeys()
  console.log('📱 Analyses locales:', localKeys.length)
  
  // 2. Tester sauvegarde cloud
  try {
    await CloudStorageService.saveAnalysis(userId, mockAnalysis)
    console.log('☁️ Sauvegarde cloud: ✅')
  } catch (error) {
    console.log('☁️ Sauvegarde cloud: ❌', error)
  }
  
  // 3. Vérifier RLS
  const analyses = await CloudStorageService.getUserAnalyses(userId)
  console.log('🔒 Analyses accessibles:', analyses.length)
  
  console.log('🔍 Debug Migration - Fin')
}
```

---

## 📊 **MÉTRIQUES DE VALIDATION**

### **KPIs à Surveiller**
```typescript
interface Phase1Metrics {
  // Authentification
  signups_total: number
  signin_success_rate: number
  oauth_vs_email_ratio: number
  
  // Migration
  migration_success_rate: number
  avg_migration_time: number
  analyses_migrated_total: number
  
  // Usage
  guest_vs_authenticated_ratio: number
  guest_conversion_rate: number
  retention_d1: number
  
  // Technique
  api_response_time: number
  error_rate: number
  storage_usage: number
}
```

### **Seuils de Validation**
- ✅ **Inscription Google** : <3s temps de réponse
- ✅ **Migration analyses** : >95% succès, <10s durée
- ✅ **Conversion invité** : >30% s'inscrivent après 1 analyse
- ✅ **Performance** : <2s chargement pages auth
- ✅ **Erreurs** : <1% taux d'erreur global

---

## 🎯 **CRITÈRES DE SUCCÈS PHASE 1**

### **✅ Fonctionnels**
- [ ] Inscription Google en 1 clic fonctionnelle
- [ ] Migration automatique 100% analyses locales
- [ ] Mode invité limité à 1 analyse puis inscription
- [ ] Fallback local si cloud indisponible
- [ ] RLS : utilisateurs voient uniquement leurs données

### **✅ Techniques**
- [ ] Performance : connexion <2s, migration <5s
- [ ] Sécurité : audit sécurité sans faille critique
- [ ] Tests : 95%+ couverture code critique
- [ ] Monitoring : métriques temps réel opérationnelles
- [ ] Documentation : procédures admin complètes

### **✅ Business**
- [ ] Taux inscription : >30% utilisateurs invités
- [ ] Rétention : >70% utilisateurs inscrits reviennent D7
- [ ] Migration : >95% analyses migrées sans perte
- [ ] Support : <5% tickets liés authentification
- [ ] Coûts : budget Supabase <50€/mois

---

**🔄 Statut :** Planning Phase 1 PRÊT À EXÉCUTER ✅  
**📅 Durée :** 5 jours ouvrés  
**🎯 Objectif :** Auth + Cloud sans casser l'existant  
**🚀 Prochaine étape :** Exécution Jour 1 - Configuration Supabase
