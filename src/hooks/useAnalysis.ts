'use client'

import { useState } from 'react'
import type { AnalyzeRequest } from '@/types/api'
import type { SkinAnalysis } from '@/types'

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

      // Progress simulation (GPT-4o does not provide real-time feedback)
      let progressInterval: ReturnType<typeof setInterval> | null = null
      
      try {
        progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + Math.random() * 15, 85))
        }, 1000)

        // Photos are already base64-encoded from sessionStorage
        const requestForAPI = request

        // API call instead of direct service
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestForAPI)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'API error')
        }

        const result = await response.json()
        
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
        setProgress(100)
        setAnalysis(result.data)

      } catch (err) {
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
        
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (message === 'Failed to fetch') {
          setError("The page was interrupted during analysis (closing/refreshing/saving). Please relaunch the analysis.")
        } else {
          setError(message)
        }
              } finally {
          setIsAnalyzing(false)
        }
    } catch (outerErr) {
      setError('Unexpected error occurred')
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
