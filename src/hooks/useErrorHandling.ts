/**
 * 🚨 HOOK DE GESTION D'ERREURS
 * 
 * Hook React personnalisé pour la gestion centralisée des erreurs
 * avec fallbacks automatiques et retry intelligent
 * 
 * Sprint 3 - Intégration, Tests & Optimisation
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { useState, useCallback, useRef } from 'react'
import { 
  ErrorHandlingService, 
  ErrorContext, 
  FallbackStrategy,
  ErrorType,
  ErrorSeverity 
} from '@/utils/ErrorHandlingService'

interface UseErrorHandlingReturn {
  // État des erreurs
  currentError: ErrorContext | null
  isRetrying: boolean
  retryCount: number
  fallbackActive: boolean
  
  // Actions
  handleError: (error: Error, context?: Record<string, any>) => ErrorContext
  retry: () => Promise<void>
  clearError: () => void
  applyFallback: (fallbackData?: any) => void
  
  // Utilitaires
  withErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    context?: Record<string, any>
  ) => Promise<T | null>
  
  // Statistiques
  errorStats: {
    totalErrors: number
    recentErrors: ErrorContext[]
  }
}

interface UseErrorHandlingOptions {
  maxRetries?: number
  retryDelay?: number
  autoRetry?: boolean
  fallbackData?: any
  onError?: (error: ErrorContext) => void
  onRetry?: (attempt: number) => void
  onFallback?: (fallbackData: any) => void
}

export const useErrorHandling = (
  options: UseErrorHandlingOptions = {}
): UseErrorHandlingReturn => {
  
  const {
    maxRetries = 3,
    retryDelay = 1000,
    autoRetry = true,
    fallbackData,
    onError,
    onRetry,
    onFallback
  } = options
  
  // État local
  const [currentError, setCurrentError] = useState<ErrorContext | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [fallbackActive, setFallbackActive] = useState(false)
  
  // Références pour éviter les re-renders
  const lastRetryFunctionRef = useRef<(() => Promise<void>) | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  /**
   * 🚨 GESTION PRINCIPALE DES ERREURS
   */
  const handleError = useCallback((
    error: Error, 
    context?: Record<string, any>
  ): ErrorContext => {
    console.log('🚨 Hook: Gestion d\'erreur', error.message)
    
    // Classifier l'erreur
    const errorContext = ErrorHandlingService.classifyError(error, context)
    setCurrentError(errorContext)
    
    // Callback externe
    if (onError) {
      onError(errorContext)
    }
    
    // Décider de la stratégie de récupération
    const strategy = ErrorHandlingService.getFallbackStrategy(errorContext)
    
    // Auto-retry si configuré et approprié
    if (autoRetry && strategy.type === 'retry' && retryCount < maxRetries) {
      scheduleRetry(strategy)
    } 
    // Auto-fallback si disponible
    else if (strategy.type === 'fallback_data' && (strategy.fallbackData || fallbackData)) {
      applyFallback(strategy.fallbackData || fallbackData)
    }
    
    return errorContext
  }, [autoRetry, retryCount, maxRetries, fallbackData, onError])
  
  /**
   * 🔄 PLANIFICATION DU RETRY
   */
  const scheduleRetry = useCallback((strategy: FallbackStrategy) => {
    if (!lastRetryFunctionRef.current) {
      console.warn('⚠️ Aucune fonction de retry définie')
      return
    }
    
    const delay = strategy.retryDelay || retryDelay
    const backoffDelay = delay * Math.pow(2, retryCount) // Backoff exponentiel
    
    console.log(`🔄 Planification retry dans ${backoffDelay}ms (tentative ${retryCount + 1}/${maxRetries})`)
    
    retryTimeoutRef.current = setTimeout(() => {
      retry()
    }, backoffDelay)
  }, [retryCount, maxRetries, retryDelay])
  
  /**
   * 🔄 EXÉCUTION DU RETRY
   */
  const retry = useCallback(async () => {
    if (!lastRetryFunctionRef.current) {
      console.warn('⚠️ Aucune fonction de retry définie')
      return
    }
    
    if (retryCount >= maxRetries) {
      console.warn('⚠️ Nombre maximum de tentatives atteint')
      return
    }
    
    console.log(`🔄 Tentative de retry ${retryCount + 1}/${maxRetries}`)
    
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    // Callback externe
    if (onRetry) {
      onRetry(retryCount + 1)
    }
    
    try {
      await lastRetryFunctionRef.current()
      
      // Succès: nettoyer l'état d'erreur
      setCurrentError(null)
      setRetryCount(0)
      setFallbackActive(false)
      
      console.log('✅ Retry réussi')
      
    } catch (error) {
      console.error('❌ Retry échoué:', error)
      
      // Gérer l'erreur du retry
      handleError(error as Error, { isRetry: true, attempt: retryCount + 1 })
    } finally {
      setIsRetrying(false)
    }
  }, [retryCount, maxRetries, onRetry, handleError])
  
  /**
   * 🛡️ APPLICATION DU FALLBACK
   */
  const applyFallback = useCallback((fallbackDataToUse?: any) => {
    console.log('🛡️ Application du fallback')
    
    setFallbackActive(true)
    setCurrentError(null) // Masquer l'erreur car fallback actif
    
    // Callback externe
    if (onFallback) {
      onFallback(fallbackDataToUse || fallbackData)
    }
  }, [fallbackData, onFallback])
  
  /**
   * 🧹 NETTOYAGE DE L'ERREUR
   */
  const clearError = useCallback(() => {
    console.log('🧹 Nettoyage de l\'erreur')
    
    setCurrentError(null)
    setRetryCount(0)
    setIsRetrying(false)
    setFallbackActive(false)
    
    // Annuler les retry en attente
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    lastRetryFunctionRef.current = null
  }, [])
  
  /**
   * 🛡️ WRAPPER AVEC GESTION D'ERREURS AUTOMATIQUE
   */
  const withErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    
    // Stocker la fonction pour retry éventuel
    lastRetryFunctionRef.current = async () => {
      const result = await asyncFn()
      return result
    }
    
    try {
      const result = await asyncFn()
      
      // Succès: nettoyer l'état d'erreur si nécessaire
      if (currentError) {
        clearError()
      }
      
      return result
      
    } catch (error) {
      console.error('❌ Erreur dans withErrorHandling:', error)
      
      // Gérer l'erreur
      handleError(error as Error, context)
      
      return null
    }
  }, [currentError, clearError, handleError])
  
  // Statistiques d'erreurs
  const errorStats = {
    totalErrors: ErrorHandlingService.getErrorStats().totalErrors,
    recentErrors: ErrorHandlingService.getErrorStats().recentErrors
  }
  
  return {
    // État des erreurs
    currentError,
    isRetrying,
    retryCount,
    fallbackActive,
    
    // Actions
    handleError,
    retry,
    clearError,
    applyFallback,
    
    // Utilitaires
    withErrorHandling,
    
    // Statistiques
    errorStats
  }
}

/**
 * 🎯 HOOK SPÉCIALISÉ POUR LA SYNCHRONISATION PRODUITS
 */
export const useProductSyncErrorHandling = () => {
  return useErrorHandling({
    maxRetries: 3,
    retryDelay: 1000,
    autoRetry: true,
    fallbackData: ErrorHandlingService['generateFallbackProducts']?.() || [],
    onError: (error) => {
      console.log('🚨 Erreur synchronisation produits:', error.userFriendlyMessage)
    },
    onRetry: (attempt) => {
      console.log(`🔄 Nouvelle tentative de synchronisation (${attempt}/3)`)
    },
    onFallback: (fallbackData) => {
      console.log('🛡️ Utilisation de produits de secours:', fallbackData.length)
    }
  })
}

/**
 * 🔍 HOOK SPÉCIALISÉ POUR LES ALTERNATIVES
 */
export const useAlternativesErrorHandling = () => {
  return useErrorHandling({
    maxRetries: 2,
    retryDelay: 500,
    autoRetry: true,
    fallbackData: [],
    onError: (error) => {
      console.log('🚨 Erreur chargement alternatives:', error.userFriendlyMessage)
    },
    onRetry: (attempt) => {
      console.log(`🔄 Nouvelle tentative alternatives (${attempt}/2)`)
    }
  })
}
