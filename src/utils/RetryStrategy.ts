/**
 * RETRY STRATEGY - SPRINT 2 ROBUSTESSE DERMAI V2
 * Gestion intelligente des tentatives avec backoff exponentiel
 */

import { classifyError, shouldRetry, ErrorType } from '@/schemas'

export interface RetryConfig {
  maxAttempts: number
  timeoutMs: number
  baseDelayMs: number
  maxDelayMs: number
  shouldRetry?: (error: Error, attempt: number) => boolean
  onRetry?: (error: Error, attempt: number, delay: number) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDuration: number
  fallbackUsed: boolean
}

export class RetryStrategy {
  
  /**
   * Exécute une opération avec retry intelligent et backoff exponentiel
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<RetryResult<T>> {
    const startTime = Date.now()
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${config.maxAttempts}`)
        
        // Créer timeout pour cette tentative
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), config.timeoutMs)
        })
        
        // Exécuter l'opération avec timeout
        const result = await Promise.race([
          operation(),
          timeoutPromise
        ])
        
        // Succès
        console.log(`✅ Succès à la tentative ${attempt}`)
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalDuration: Date.now() - startTime,
          fallbackUsed: false
        }
        
      } catch (error) {
        lastError = error as Error
        const errorType = classifyError(lastError)
        
        console.log(`❌ Tentative ${attempt} échouée:`, {
          error: lastError.message,
          type: errorType,
          attempt
        })
        
        // Appeler callback onRetry si fourni
        if (config.onRetry) {
          const delay = this.calculateDelay(attempt, config)
          config.onRetry(lastError, attempt, delay)
        }
        
        // Vérifier si on doit retry
        const shouldRetryError = config.shouldRetry 
          ? config.shouldRetry(lastError, attempt)
          : shouldRetry(lastError, attempt)
        
        // Si c'est la dernière tentative ou si on ne doit pas retry
        if (attempt === config.maxAttempts || !shouldRetryError) {
          console.log(`🚫 Arrêt des tentatives: ${shouldRetryError ? 'max atteint' : 'erreur non-retriable'}`)
          break
        }
        
        // Calculer le délai avant la prochaine tentative
        const delay = this.calculateDelay(attempt, config)
        console.log(`⏳ Attente ${delay}ms avant tentative ${attempt + 1}`)
        
        await this.sleep(delay)
      }
    }
    
    // Toutes les tentatives ont échoué
    return {
      success: false,
      error: lastError || new Error('Unknown retry error'),
      attempts: config.maxAttempts,
      totalDuration: Date.now() - startTime,
      fallbackUsed: false
    }
  }
  
  /**
   * Calcule le délai avec backoff exponentiel et jitter
   */
  private static calculateDelay(attempt: number, config: RetryConfig): number {
    // Backoff exponentiel : baseDelay * 2^(attempt-1)
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1)
    
    // Ajouter jitter (±25% de variation aléatoire)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5)
    const delayWithJitter = exponentialDelay + jitter
    
    // Limiter au délai maximum
    return Math.min(delayWithJitter, config.maxDelayMs)
  }
  
  /**
   * Utilitaire pour attendre un délai
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * Configurations prédéfinies pour différents types d'opérations
   */
  static readonly CONFIGS = {
    // Configuration pour diagnostic IA (opération critique)
    DIAGNOSTIC: {
      maxAttempts: 3,
      timeoutMs: 120000, // 2 minutes
      baseDelayMs: 2000,  // 2 secondes
      maxDelayMs: 10000,  // 10 secondes max
      onRetry: (error: Error, attempt: number, delay: number) => {
        console.log(`🔄 Retry diagnostic IA - Tentative ${attempt}, délai ${delay}ms`)
        console.log(`   Erreur: ${error.message}`)
      }
    } as RetryConfig,
    
    // Configuration pour sélection de produits (moins critique)
    PRODUCT_SELECTION: {
      maxAttempts: 2,
      timeoutMs: 60000,   // 1 minute
      baseDelayMs: 1000,  // 1 seconde
      maxDelayMs: 5000,   // 5 secondes max
      onRetry: (error: Error, attempt: number, delay: number) => {
        console.log(`🔄 Retry sélection produits - Tentative ${attempt}, délai ${delay}ms`)
      }
    } as RetryConfig,
    
    // Configuration pour opérations réseau génériques
    NETWORK: {
      maxAttempts: 3,
      timeoutMs: 60000,   // 60 secondes (cohérent avec client)
      baseDelayMs: 1000,  // 1 seconde
      maxDelayMs: 8000,   // 8 secondes max
    } as RetryConfig
  } as const
  
  /**
   * Métriques de retry pour monitoring
   */
  static getRetryMetrics(results: RetryResult<any>[]): RetryMetrics {
    const totalOperations = results.length
    const successfulOperations = results.filter(r => r.success).length
    const failedOperations = totalOperations - successfulOperations
    
    const totalAttempts = results.reduce((sum, r) => sum + r.attempts, 0)
    const avgAttempts = totalAttempts / totalOperations
    
    const avgDuration = results.reduce((sum, r) => sum + r.totalDuration, 0) / totalOperations
    
    const retriedOperations = results.filter(r => r.attempts > 1).length
    const retryRate = retriedOperations / totalOperations
    
    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      successRate: successfulOperations / totalOperations,
      avgAttempts,
      avgDuration,
      retryRate,
      fallbackUsage: results.filter(r => r.fallbackUsed).length / totalOperations
    }
  }
}

export interface RetryMetrics {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  successRate: number
  avgAttempts: number
  avgDuration: number
  retryRate: number
  fallbackUsage: number
}

/**
 * Décorateur pour ajouter automatiquement retry à une méthode
 */
export function withRetry<T extends any[], R>(
  config: RetryConfig
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const method = descriptor.value!
    
    descriptor.value = async function (...args: T): Promise<R> {
      const result = await RetryStrategy.executeWithRetry(
        () => method.apply(this, args),
        config
      )
      
      if (result.success) {
        return result.data!
      } else {
        throw result.error!
      }
    }
  }
}
