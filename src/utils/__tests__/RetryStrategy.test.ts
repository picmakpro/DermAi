/**
 * TESTS RETRY STRATEGY - SPRINT 2 ROBUSTESSE DERMAI V2
 * Tests d'injection d'erreurs réseau et validation retry/fallback
 */

import { RetryStrategy, type RetryConfig } from '../RetryStrategy'
import { classifyError, ErrorType } from '@/schemas'

describe('RetryStrategy - Sprint 2 Robustesse', () => {
  
  describe('🔄 Tests Retry avec Injection d\'Erreurs', () => {
    
    test('Retry réussi après erreur réseau temporaire', async () => {
      let attemptCount = 0
      
      const mockOperation = jest.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount <= 2) {
          throw new Error('Network request failed') // Erreur réseau
        }
        return Promise.resolve('success')
      })
      
      const config: RetryConfig = {
        maxAttempts: 3,
        timeoutMs: 5000,
        baseDelayMs: 100,
        maxDelayMs: 1000
      }
      
      const result = await RetryStrategy.executeWithRetry(mockOperation, config)
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.attempts).toBe(3)
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })
    
    test('Retry échoue après erreur de validation (non-retriable)', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Validation failed: invalid schema'))
      
      const config: RetryConfig = {
        maxAttempts: 3,
        timeoutMs: 5000,
        baseDelayMs: 100,
        maxDelayMs: 1000
      }
      
      const result = await RetryStrategy.executeWithRetry(mockOperation, config)
      
      expect(result.success).toBe(false)
      expect(result.attempts).toBe(1) // Pas de retry pour erreur validation
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
    
    test('Retry avec timeout sur opération lente', async () => {
      const mockOperation = jest.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 2000)) // 2s
      })
      
      const config: RetryConfig = {
        maxAttempts: 2,
        timeoutMs: 500, // 500ms timeout
        baseDelayMs: 100,
        maxDelayMs: 1000
      }
      
      const result = await RetryStrategy.executeWithRetry(mockOperation, config)
      
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('timeout')
      expect(result.attempts).toBe(2) // Retry sur timeout
    })
    
    test('Backoff exponentiel avec jitter', async () => {
      const delays: number[] = []
      let attemptCount = 0
      
      const mockOperation = jest.fn().mockImplementation(() => {
        attemptCount++
        throw new Error('Network timeout') // Erreur retriable
      })
      
      const config: RetryConfig = {
        maxAttempts: 3,
        timeoutMs: 5000,
        baseDelayMs: 1000, // 1s base
        maxDelayMs: 5000,
        onRetry: (error, attempt, delay) => {
          delays.push(delay)
        }
      }
      
      const result = await RetryStrategy.executeWithRetry(mockOperation, config)
      
      expect(result.success).toBe(false)
      expect(delays).toHaveLength(2) // 2 retries
      
      // Vérifier progression exponentielle (avec tolérance pour jitter)
      expect(delays[0]).toBeGreaterThan(800) // ~1000ms ±25%
      expect(delays[0]).toBeLessThan(1300)
      expect(delays[1]).toBeGreaterThan(1500) // ~2000ms ±25%
      expect(delays[1]).toBeLessThan(2500)
    })
  })
  
  describe('📊 Tests Classification d\'Erreurs', () => {
    
    test('Classification erreurs réseau (retriable)', () => {
      const networkErrors = [
        new Error('Network request failed'),
        new Error('fetch error: connection refused'),
        new Error('ECONNRESET: Connection reset by peer')
      ]
      
      networkErrors.forEach(error => {
        const type = classifyError(error)
        expect(type).toBe(ErrorType.NETWORK_ERROR)
      })
    })
    
    test('Classification erreurs validation (non-retriable)', () => {
      const validationErrors = [
        new Error('Validation failed: invalid schema'),
        new Error('Invalid input format'),
        new Error('Schema validation error')
      ]
      
      validationErrors.forEach(error => {
        const type = classifyError(error)
        expect(type).toBe(ErrorType.VALIDATION_ERROR)
      })
    })
    
    test('Classification erreurs timeout (retriable)', () => {
      const timeoutErrors = [
        new Error('Request timeout after 30s'),
        new Error('Operation aborted due to timeout'),
        new Error('Timeout occurred')
      ]
      
      timeoutErrors.forEach(error => {
        const type = classifyError(error)
        expect(type).toBe(ErrorType.TIMEOUT_ERROR)
      })
    })
    
    test('Classification erreurs rate limit (retriable)', () => {
      const rateLimitErrors = [
        new Error('Rate limit exceeded'),
        new Error('Quota exceeded for this request'),
        new Error('Too many requests')
      ]
      
      rateLimitErrors.forEach(error => {
        const type = classifyError(error)
        expect(type).toBe(ErrorType.RATE_LIMIT_ERROR)
      })
    })
  })
  
  describe('⚙️ Tests Configurations Prédéfinies', () => {
    
    test('Configuration DIAGNOSTIC a les bonnes valeurs', () => {
      const config = RetryStrategy.CONFIGS.DIAGNOSTIC
      
      expect(config.maxAttempts).toBe(3)
      expect(config.timeoutMs).toBe(120000) // 2 minutes
      expect(config.baseDelayMs).toBe(2000) // 2 secondes
      expect(config.maxDelayMs).toBe(10000) // 10 secondes
      expect(config.onRetry).toBeDefined()
    })
    
    test('Configuration PRODUCT_SELECTION a les bonnes valeurs', () => {
      const config = RetryStrategy.CONFIGS.PRODUCT_SELECTION
      
      expect(config.maxAttempts).toBe(2)
      expect(config.timeoutMs).toBe(60000) // 1 minute
      expect(config.baseDelayMs).toBe(1000) // 1 seconde
      expect(config.maxDelayMs).toBe(5000) // 5 secondes
    })
  })
  
  describe('📈 Tests Métriques Retry', () => {
    
    test('Calcul métriques de retry correctes', () => {
      const results = [
        { success: true, attempts: 1, totalDuration: 1000, fallbackUsed: false },
        { success: true, attempts: 2, totalDuration: 3000, fallbackUsed: false },
        { success: false, attempts: 3, totalDuration: 8000, fallbackUsed: true },
        { success: true, attempts: 1, totalDuration: 500, fallbackUsed: false }
      ]
      
      const metrics = RetryStrategy.getRetryMetrics(results)
      
      expect(metrics.totalOperations).toBe(4)
      expect(metrics.successfulOperations).toBe(3)
      expect(metrics.failedOperations).toBe(1)
      expect(metrics.successRate).toBe(0.75) // 75%
      expect(metrics.avgAttempts).toBe(1.75) // (1+2+3+1)/4
      expect(metrics.avgDuration).toBe(3125) // (1000+3000+8000+500)/4
      expect(metrics.retryRate).toBe(0.25) // 1 opération avec retry sur 4
      expect(metrics.fallbackUsage).toBe(0.25) // 1 fallback sur 4
    })
  })
  
  describe('🚨 Tests Scénarios d\'Erreur Critique', () => {
    
    test('Simulation coupure API OpenAI', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('API key unauthorized'))
      
      const config: RetryConfig = {
        maxAttempts: 3,
        timeoutMs: 5000,
        baseDelayMs: 100,
        maxDelayMs: 1000
      }
      
      const result = await RetryStrategy.executeWithRetry(mockOperation, config)
      
      expect(result.success).toBe(false)
      expect(result.attempts).toBe(1) // Pas de retry pour erreur auth
      expect(result.error?.message).toContain('unauthorized')
    })
    
    test('Simulation surcharge réseau avec retry progressif', async () => {
      let attemptCount = 0
      const mockOperation = jest.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount <= 2) {
          throw new Error('Network timeout - server overloaded')
        }
        return Promise.resolve('recovered')
      })
      
      const onRetryMock = jest.fn()
      const config: RetryConfig = {
        maxAttempts: 3,
        timeoutMs: 5000,
        baseDelayMs: 500,
        maxDelayMs: 3000,
        onRetry: onRetryMock
      }
      
      const result = await RetryStrategy.executeWithRetry(mockOperation, config)
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('recovered')
      expect(onRetryMock).toHaveBeenCalledTimes(2)
      
      // Vérifier que onRetry a été appelé avec les bons paramètres
      expect(onRetryMock).toHaveBeenCalledWith(
        expect.any(Error),
        1, // Premier retry
        expect.any(Number) // Delay
      )
    })
  })
})
