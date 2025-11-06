import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

export class AuthService {
  /**
   * Créer un profil utilisateur via API route
   * Utilisé lors de l'inscription via Google OAuth ou email/password
   */
  static async createProfile(userData: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }): Promise<Profile> {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur création profil')
      }

      const data = await response.json()
      console.log('Profil créé avec succès:', data.id)
      return data
    } catch (error) {
      console.error('Erreur AuthService.createProfile:', error)
      throw error
    }
  }

  /**
   * Récupérer le profil d'un utilisateur via API route
   * Utilisé pour charger les données utilisateur après connexion
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const response = await fetch('/api/auth/profile')
      
      if (response.status === 404) {
        // Profil non trouvé
        console.log('Profil non trouvé pour utilisateur:', userId)
        return null
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Erreur récupération profil:', errorData.error)
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erreur AuthService.getProfile:', error)
      return null
    }
  }

  /**
   * Mettre à jour le profil utilisateur via API route
   * Utilisé pour modifier les informations personnelles
   */
  static async updateProfile(
    userId: string, 
    updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Profile> {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur mise à jour profil')
      }

      const data = await response.json()
      console.log('Profil mis à jour:', userId)
      return data
    } catch (error) {
      console.error('Erreur AuthService.updateProfile:', error)
      throw error
    }
  }

  /**
   * Incrémenter le compteur d'analyses via RLS Supabase
   * Utilisé à chaque nouvelle analyse effectuée
   */
  static async incrementAnalysisCount(userId: string): Promise<void> {
    try {
      // Utiliser RLS avec le client normal (pas admin)
      const { error } = await supabase
        .from('profiles')
        .update({
          analyses_count: supabase.raw('analyses_count + 1'),
          last_analysis_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('Erreur incrémentation compteur:', error)
        throw new Error(`Erreur incrémentation: ${error.message}`)
      }

      console.log('Compteur analyses incrémenté pour:', userId)
    } catch (error) {
      console.error('Erreur AuthService.incrementAnalysisCount:', error)
      throw error
    }
  }

  /**
   * Supprimer un profil utilisateur (soft delete)
   * Utilisé pour la suppression de compte (RGPD)
   */
  static async deleteProfile(userId: string): Promise<void> {
    try {
      // Marquer comme supprimé plutôt que supprimer définitivement
      const { error } = await supabase
        .from('profiles')
        .update({
          email: `deleted_${userId}@deleted.com`,
          full_name: null,
          avatar_url: null,
          subscription_status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('Erreur suppression profil:', error)
        throw new Error(`Erreur suppression profil: ${error.message}`)
      }

      console.log('Profil marqué comme supprimé:', userId)
    } catch (error) {
      console.error('Erreur AuthService.deleteProfile:', error)
      throw error
    }
  }

  /**
   * Vérifier si un utilisateur existe
   * Utilisé pour éviter les doublons lors de l'inscription
   */
  static async userExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur vérification utilisateur:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Erreur AuthService.userExists:', error)
      return false
    }
  }

  /**
   * Obtenir les statistiques utilisateur
   * Utilisé pour le dashboard
   */
  static async getUserStats(userId: string): Promise<{
    analysesCount: number
    lastAnalysisAt: string | null
    subscriptionStatus: string
    memberSince: string
  } | null> {
    try {
      const profile = await this.getProfile(userId)
      if (!profile) return null

      return {
        analysesCount: profile.analyses_count,
        lastAnalysisAt: profile.last_analysis_at,
        subscriptionStatus: profile.subscription_status,
        memberSince: profile.created_at,
      }
    } catch (error) {
      console.error('Erreur AuthService.getUserStats:', error)
      return null
    }
  }
}
