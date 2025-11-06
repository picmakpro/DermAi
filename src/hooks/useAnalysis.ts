'use client'

import React, { useState } from 'react'
import { useHybridStorage } from '@/hooks/useHybridStorage'
import { useAuth } from '@/hooks/useAuth'
import type { AnalyzeRequest, SkinAnalysis } from '@/types'

export interface UseAnalysisReturn {
  isAnalyzing: boolean
  analysis: SkinAnalysis | null
  error: string | null
  progress: number
  analyze: (request: AnalyzeRequest) => Promise<void>
  reset: () => void
  // Nouvelles propriétés pour l'authentification
  canAnalyze: boolean
  remainingAnalyses: number
  isAuthenticated: boolean
  requiresAuth: boolean
}

export function useAnalysis(): UseAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [canAnalyze, setCanAnalyze] = useState(true)
  const [remainingAnalyses, setRemainingAnalyses] = useState(1)
  const [requiresAuth, setRequiresAuth] = useState(false)

  // Hooks pour l'authentification et le stockage hybride
  const { isAuthenticated, user, incrementAnalysisCount } = useAuth()
  const { 
    saveAnalysis: saveAnalysisHybrid, 
    checkAnalysisLimit, 
    getRemainingAnalyses 
  } = useHybridStorage()

  // Fonction pour mettre à jour les limites d'analyses
  const updateAnalysisLimits = async () => {
    try {
      const limitCheck = await checkAnalysisLimit()
      const remaining = await getRemainingAnalyses()
      
      setCanAnalyze(limitCheck.canAnalyze)
      setRemainingAnalyses(remaining === Infinity ? 999 : remaining)
      setRequiresAuth(!limitCheck.canAnalyze && !isAuthenticated)
    } catch (error) {
      console.warn('Erreur mise à jour limites:', error)
    }
  }

  // Mettre à jour les limites au chargement et quand l'auth change
  React.useEffect(() => {
    updateAnalysisLimits()
  }, [isAuthenticated, user])

  const analyze = async (request: AnalyzeRequest) => {
    try {
      setIsAnalyzing(true)
      setError(null)
      setProgress(0)

      // Vérifier les limites d'analyses avant de commencer
      const limitCheck = await checkAnalysisLimit()
      if (!limitCheck.canAnalyze) {
        setRequiresAuth(true)
        throw new Error(limitCheck.reason || 'Limite d\'analyses atteinte')
      }

      // Simulation du progress (GPT-4o ne donne pas de feedback temps réel)
      let progressInterval: ReturnType<typeof setInterval> | null = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 85))
      }, 1000)

      // Les photos sont déjà en base64 depuis le sessionStorage
      const requestForAPI = request

      // V2 PURE: Timeout étendu 300s pour architecture IA-First 4 étapes
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

      try {
        // Appel API au lieu du service direct
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestForAPI),
          signal: controller.signal // SPRINT 1: Gestion timeout cohérente
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur de l\'API')
        }

        const result = await response.json()
        
        if (progressInterval) clearInterval(progressInterval)
        setProgress(100)
        setAnalysis(result.data)

        // Sauvegarder l'analyse avec le stockage hybride
        if (result.data) {
          try {
            await saveAnalysisHybrid(result.data, 'current-analysis')
            
            // Incrémenter le compteur d'analyses si l'utilisateur est connecté
            if (isAuthenticated && user && incrementAnalysisCount) {
              await incrementAnalysisCount()
            }
            
            // Mettre à jour les limites
            await updateAnalysisLimits()
          } catch (storageError) {
            console.warn('Erreur sauvegarde analyse:', storageError)
            // Ne pas faire échouer l'analyse si la sauvegarde échoue
          }
        }

      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        // Gestion spécifique des timeouts
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Timeout: L\'analyse a pris trop de temps (>300s). Veuillez réessayer avec des images plus petites.')
        }
        
        throw fetchError
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      if (message === 'Failed to fetch') {
        setError("La page a été interrompue pendant l’analyse (fermeture/rafraîchissement/enregistrement). Relancez l’analyse.")
      } else {
        setError(message)
      }
    } finally {
      try {
        if (progressInterval) clearInterval(progressInterval)
      } catch {}
      setIsAnalyzing(false)
    }
  }

  const reset = () => {
    setAnalysis(null)
    setError(null)
    setProgress(0)
    setIsAnalyzing(false)
    setRequiresAuth(false)
    // Remettre à jour les limites après reset
    updateAnalysisLimits()
  }

  return {
    isAnalyzing,
    analysis,
    error,
    progress,
    analyze,
    reset,
    // Nouvelles propriétés pour l'authentification
    canAnalyze,
    remainingAnalyses,
    isAuthenticated,
    requiresAuth,
  }
}