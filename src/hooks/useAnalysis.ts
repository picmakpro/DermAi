'use client'

import { useState } from 'react'
import type { AnalyzeRequest, SkinAnalysis } from '@/types'

export interface UseAnalysisReturn {
  isAnalyzing: boolean
  analysis: SkinAnalysis | null
  error: string | null
  progress: number
  analyze: (request: AnalyzeRequest) => Promise<void>
  reset: () => void
}

export function useAnalysis(): UseAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const analyze = async (request: AnalyzeRequest) => {
    try {
      setIsAnalyzing(true)
      setError(null)
      setProgress(0)

      // Simulation du progress (GPT-4o ne donne pas de feedback temps réel)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 85))
      }, 1000)

      // Les photos sont déjà en base64 depuis le sessionStorage
      const requestForAPI = request

      // Appel API au lieu du service direct
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestForAPI)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur de l\'API')
      }

      const result = await response.json()
      
      clearInterval(progressInterval)
      setProgress(100)
      setAnalysis(result.data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const reset = () => {
    setAnalysis(null)
    setError(null)
    setProgress(0)
    setIsAnalyzing(false)
  }

  return {
    isAnalyzing,
    analysis,
    error,
    progress,
    analyze,
    reset
  }
}