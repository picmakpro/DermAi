'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import { AuthService } from '@/services/auth/authService'
import type { Profile } from '@/lib/supabase'

export interface UseAuthReturn {
  // État utilisateur
  user: Profile | null
  session: any
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  // Actions d'authentification
  signIn: (provider?: string) => Promise<void>
  signOut: () => Promise<void>
  
  // Actions profil
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
  incrementAnalysisCount: () => Promise<void>
  
  // Statistiques
  getUserStats: () => Promise<{
    analysesCount: number
    lastAnalysisAt: string | null
    subscriptionStatus: string
    memberSince: string
  } | null>
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger le profil utilisateur
  const loadUserProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const profile = await AuthService.getProfile(session.user.id)
      
      if (!profile) {
        // Profil n'existe pas, le créer
        console.log('Profil non trouvé, création automatique...')
        const newProfile = await AuthService.createProfile({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.name,
          avatar_url: session.user.image,
        })
        setUser(newProfile)
      } else {
        setUser(profile)
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err)
      setError(err instanceof Error ? err.message : 'Erreur chargement profil')
    } finally {
      setIsLoading(false)
    }
  }, [session])

  // Charger le profil quand la session change
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    loadUserProfile()
  }, [status, session, loadUserProfile])

  // Connexion
  const handleSignIn = async (provider = 'google') => {
    try {
      setError(null)
      setIsLoading(true)
      
      const result = await signIn(provider, { 
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      if (result?.error) {
        setError('Erreur de connexion')
        console.error('Erreur signIn:', result.error)
      }
    } catch (err) {
      setError('Erreur de connexion')
      console.error('Erreur handleSignIn:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Déconnexion
  const handleSignOut = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      await signOut({ redirect: false })
      setUser(null)
      
      console.log('Déconnexion réussie')
    } catch (err) {
      setError('Erreur de déconnexion')
      console.error('Erreur handleSignOut:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Mettre à jour le profil
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.user?.id) {
      throw new Error('Non authentifié')
    }

    try {
      setError(null)
      const updatedProfile = await AuthService.updateProfile(
        session.user.id, 
        updates
      )
      setUser(updatedProfile)
      console.log('Profil mis à jour avec succès')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur mise à jour profil'
      setError(errorMessage)
      console.error('Erreur updateProfile:', err)
      throw err
    }
  }

  // Rafraîchir le profil
  const refreshProfile = async () => {
    if (!session?.user?.id) return

    try {
      setError(null)
      const profile = await AuthService.getProfile(session.user.id)
      setUser(profile)
    } catch (err) {
      console.error('Erreur refreshProfile:', err)
      setError(err instanceof Error ? err.message : 'Erreur rafraîchissement profil')
    }
  }

  // Incrémenter le compteur d'analyses
  const incrementAnalysisCount = async () => {
    if (!session?.user?.id) return

    try {
      setError(null)
      await AuthService.incrementAnalysisCount(session.user.id)
      
      // Mettre à jour le profil local
      if (user) {
        setUser({
          ...user,
          analyses_count: user.analyses_count + 1,
          last_analysis_at: new Date().toISOString(),
        })
      }
      
      console.log('Compteur analyses incrémenté')
    } catch (err) {
      console.error('Erreur incrementAnalysisCount:', err)
      setError(err instanceof Error ? err.message : 'Erreur incrémentation compteur')
    }
  }

  // Obtenir les statistiques utilisateur
  const getUserStats = async () => {
    if (!session?.user?.id) return null

    try {
      setError(null)
      return await AuthService.getUserStats(session.user.id)
    } catch (err) {
      console.error('Erreur getUserStats:', err)
      setError(err instanceof Error ? err.message : 'Erreur récupération statistiques')
      return null
    }
  }

  return {
    // État
    user,
    session,
    isLoading: status === 'loading' || isLoading,
    isAuthenticated: !!session?.user && !!user,
    error,

    // Actions auth
    signIn: handleSignIn,
    signOut: handleSignOut,

    // Actions profil
    updateProfile,
    refreshProfile,
    incrementAnalysisCount,

    // Statistiques
    getUserStats,
  }
}
