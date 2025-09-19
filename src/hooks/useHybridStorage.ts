'use client'

import { useAuth } from '@/hooks/useAuth'
import { saveAnalysis, getAnalysis, clearAllAnalysis } from '@/utils/storage/analysisStore'
import type { SkinAnalysis } from '@/types'
import { useState, useCallback } from 'react'

export interface UseHybridStorageReturn {
  // Actions de stockage
  saveAnalysis: (analysis: SkinAnalysis, analysisId?: string) => Promise<void>
  getAnalysis: (analysisId: string) => Promise<SkinAnalysis | null>
  getAllAnalyses: () => Promise<SkinAnalysis[]>
  deleteAnalysis: (analysisId: string) => Promise<void>
  
  // Gestion des limites
  checkAnalysisLimit: () => Promise<{ canAnalyze: boolean; reason?: string }>
  getRemainingAnalyses: () => Promise<number>
  
  // Migration
  migrateToCloud: () => Promise<{ success: boolean; migratedCount: number; errors: string[] }>
  clearLocalStorage: () => Promise<void>
  
  // État
  isCloudStorage: boolean
  isLoading: boolean
  error: string | null
  
  // Statistiques
  getStorageStats: () => Promise<{
    localCount: number
    cloudCount: number
    totalSize: number
  }>
}

export function useHybridStorage(): UseHybridStorageReturn {
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sauvegarder une analyse (cloud ou local selon l'état d'authentification)
  const saveAnalysisHybrid = useCallback(async (
    analysis: SkinAnalysis,
    analysisId?: string
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // Utilisateur connecté : sauvegarder en cloud via API
        try {
          const response = await fetch('/api/analyses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analysis_data: analysis,
              source: 'web'
            })
          })
          
          if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`)
          }
          
          console.log('✅ Analyse sauvegardée en cloud via API')
        } catch (cloudError) {
          console.error('❌ Erreur sauvegarde cloud, fallback local:', cloudError)
          // Fallback local en cas d'erreur cloud
          await saveAnalysis(analysisId || `fallback-${Date.now()}`, analysis)
          setError('Sauvegarde locale utilisée (problème de connexion)')
        }
      } else {
        // Mode invité : sauvegarder localement
        await saveAnalysis(analysisId || `guest-${Date.now()}`, analysis)
        console.log('💾 Analyse sauvegardée localement (mode invité)')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de sauvegarde'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  // Récupérer une analyse spécifique
  const getAnalysisHybrid = useCallback(async (analysisId: string): Promise<SkinAnalysis | null> => {
    setIsLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // Utilisateur connecté : récupérer depuis cloud via API
        try {
          const response = await fetch(`/api/analyses/${analysisId}`)
          if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`)
          }
          
          const data = await response.json()
          return data.success ? data.data?.analysis_data : null
        } catch (cloudError) {
          console.error('❌ Erreur récupération cloud, fallback local:', cloudError)
          // Fallback local
          return await getAnalysis(analysisId)
        }
      } else {
        // Mode invité : récupérer localement
        return await getAnalysis(analysisId)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de récupération'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  // Récupérer toutes les analyses
  const getAllAnalysesHybrid = useCallback(async (): Promise<SkinAnalysis[]> => {
    setIsLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // Utilisateur connecté : récupérer depuis cloud via API
        try {
          const response = await fetch('/api/analyses')
          if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`)
          }
          
          const data = await response.json()
          return data.success ? data.data.map((a: any) => a.analysis_data) : []
        } catch (cloudError) {
          console.error('❌ Erreur récupération cloud:', cloudError)
          return []
        }
      } else {
        // Mode invité : récupérer localement
        // Pour le moment, on retourne juste la dernière analyse guest
        const guestAnalysis = await getAnalysis('guest')
        return guestAnalysis ? [guestAnalysis] : []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de récupération'
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  // Supprimer une analyse
  const deleteAnalysisHybrid = useCallback(async (analysisId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        // Utilisateur connecté : supprimer du cloud via API
        const response = await fetch(`/api/analyses/${analysisId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`)
        }
      } else {
        // Mode invité : supprimer localement
        // Pour le stockage local, on peut implémenter une fonction de suppression
        console.log('Suppression locale non implémentée pour:', analysisId)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de suppression'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  // Vérifier les limites d'analyses
  const checkAnalysisLimit = useCallback(async (): Promise<{ canAnalyze: boolean; reason?: string }> => {
    if (isAuthenticated && user) {
      // Utilisateur connecté : pas de limite
      return { canAnalyze: true }
    } else {
      // Mode invité : limité à 1 analyse
      try {
        const guestAnalysis = await getAnalysis('guest')
        if (guestAnalysis) {
          return { 
            canAnalyze: false, 
            reason: 'Limite atteinte en mode invité. Inscrivez-vous pour plus d\'analyses.' 
          }
        }
        return { canAnalyze: true }
      } catch {
        return { canAnalyze: true } // En cas d'erreur, on autorise
      }
    }
  }, [isAuthenticated, user])

  // Obtenir le nombre d'analyses restantes
  const getRemainingAnalyses = useCallback(async (): Promise<number> => {
    if (isAuthenticated && user) {
      // Utilisateur connecté : illimité
      return Infinity
    } else {
      // Mode invité : 1 analyse max
      try {
        const guestAnalysis = await getAnalysis('guest')
        return guestAnalysis ? 0 : 1
      } catch {
        return 1
      }
    }
  }, [isAuthenticated, user])

  // Migrer vers le cloud (appelé automatiquement à l'inscription)
  const migrateToCloud = useCallback(async (): Promise<{ success: boolean; migratedCount: number; errors: string[] }> => {
    if (!isAuthenticated || !user) {
      return { success: false, migratedCount: 0, errors: ['Utilisateur non authentifié'] }
    }

    setIsLoading(true)
    setError(null)

    try {
      // Utiliser le service de migration existant
      const { MigrationService } = await import('@/services/migration/migrationService')
      const result = await MigrationService.migrateLocalAnalyses(user.id)
      
      if (!result.success) {
        setError(`Migration échouée: ${result.errors.join(', ')}`)
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de migration'
      setError(errorMessage)
      return { success: false, migratedCount: 0, errors: [errorMessage] }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  // Nettoyer le stockage local
  const clearLocalStorage = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      await clearAllAnalysis()
      console.log('🧹 Stockage local nettoyé')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de nettoyage'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Obtenir les statistiques de stockage
  const getStorageStats = useCallback(async (): Promise<{
    localCount: number
    cloudCount: number
    totalSize: number
  }> => {
    setIsLoading(true)
    setError(null)

    try {
      let localCount = 0
      let cloudCount = 0
      let totalSize = 0

      // Compter les analyses locales
      try {
        const guestAnalysis = await getAnalysis('guest')
        if (guestAnalysis) {
          localCount = 1
          totalSize += JSON.stringify(guestAnalysis).length
        }
      } catch {
        // Ignore les erreurs de stockage local
      }

      // Compter les analyses cloud
      if (isAuthenticated && user) {
        try {
          const response = await fetch('/api/analyses')
          if (response.ok) {
            const data = await response.json()
            cloudCount = data.success ? data.data.length : 0
          }
        } catch {
          // Ignore les erreurs cloud
        }
      }

      return { localCount, cloudCount, totalSize }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de statistiques'
      setError(errorMessage)
      return { localCount: 0, cloudCount: 0, totalSize: 0 }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  return {
    // Actions de stockage
    saveAnalysis: saveAnalysisHybrid,
    getAnalysis: getAnalysisHybrid,
    getAllAnalyses: getAllAnalysesHybrid,
    deleteAnalysis: deleteAnalysisHybrid,
    
    // Gestion des limites
    checkAnalysisLimit,
    getRemainingAnalyses,
    
    // Migration
    migrateToCloud,
    clearLocalStorage,
    
    // État
    isCloudStorage: isAuthenticated && !!user,
    isLoading,
    error,
    
    // Statistiques
    getStorageStats,
  }
}
