/**
 * LOGGER - SPRINT 2 ROBUSTESSE DERMAI V2
 * Logging JSON structuré avec requestId unique et métriques temps réel
 */

import { v4 as uuidv4 } from 'uuid'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogContext {
  requestId: string
  userId?: string
  operation: string
  stage?: string
  metadata?: Record<string, any>
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context: LogContext
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  performance?: {
    tokensUsed?: number
    apiLatency?: number
    memoryUsage?: number
  }
  metrics?: Record<string, number>
}

export interface AnalysisMetrics {
  requestId: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  stage: 'input' | 'diagnostic' | 'products' | 'output' | 'error'
  photosCount: number
  userAge?: number
  skinType?: string
  concerns?: string[]
  retryAttempt?: number
  fallbackUsed?: boolean
  errorType?: string
  tokensUsed?: number
  apiLatency?: number
  // SPRINT 3: Métriques de cohérence
  coherenceScore?: number
  zonesMatch?: boolean
  intensityMatch?: boolean
  budgetRespected?: boolean
  correctionsCount?: number
}

export class Logger {
  private static instance: Logger
  private context: Partial<LogContext> = {}
  private metrics: Map<string, AnalysisMetrics> = new Map()
  
  private constructor() {}
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  
  /**
   * Génère un requestId unique pour tracer une opération
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${uuidv4().slice(0, 8)}`
  }
  
  /**
   * Définit le contexte global pour les logs suivants
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context }
  }
  
  /**
   * Nettoie le contexte
   */
  clearContext(): void {
    this.context = {}
  }
  
  /**
   * Log structuré avec niveau
   */
  private log(
    level: LogLevel,
    message: string,
    additionalContext?: Partial<LogContext>,
    error?: Error,
    performance?: LogEntry['performance'],
    duration?: number
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        requestId: this.context.requestId || 'unknown',
        operation: this.context.operation || 'unknown',
        ...this.context,
        ...additionalContext
      },
      ...(duration && { duration }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        }
      }),
      ...(performance && { performance })
    }
    
    // Output selon l'environnement
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(entry)
    } else {
      this.logToProduction(entry)
    }
  }
  
  /**
   * Logging pour développement (console formatée)
   */
  private logToConsole(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m',    // Cyan
      info: '\x1b[32m',     // Vert
      warn: '\x1b[33m',     // Jaune
      error: '\x1b[31m',    // Rouge
      critical: '\x1b[35m'  // Magenta
    }
    
    const reset = '\x1b[0m'
    const color = colors[entry.level] || ''
    
    const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`
    const timestamp = entry.timestamp.split('T')[1].split('.')[0]
    const requestId = entry.context.requestId.slice(-8)
    
    console.log(
      `${prefix} ${timestamp} [${requestId}] ${entry.context.operation}:${entry.context.stage || ''} - ${entry.message}`
    )
    
    if (entry.error) {
      console.error(`  ❌ ${entry.error.name}: ${entry.error.message}`)
    }
    
    if (entry.duration) {
      console.log(`  ⏱️  Durée: ${entry.duration}ms`)
    }
    
    if (entry.performance) {
      console.log(`  📊 Performance:`, entry.performance)
    }
    
    if (entry.context.metadata) {
      console.log(`  📋 Métadonnées:`, entry.context.metadata)
    }
  }
  
  /**
   * Logging pour production (JSON structuré)
   */
  private logToProduction(entry: LogEntry): void {
    // En production, output JSON pour ingestion par services de monitoring
    console.log(JSON.stringify(entry))
  }
  
  /**
   * Méthodes de logging par niveau
   */
  debug(message: string, context?: Partial<LogContext>, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, { ...context, metadata })
  }
  
  info(message: string, context?: Partial<LogContext>, metadata?: any): void {
    this.log(LogLevel.INFO, message, { ...context, metadata })
  }
  
  warn(message: string, context?: Partial<LogContext>, metadata?: any): void {
    this.log(LogLevel.WARN, message, { ...context, metadata })
  }
  
  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.log(LogLevel.ERROR, message, context, error)
  }
  
  critical(message: string, error?: Error, context?: Partial<LogContext>): void {
    this.log(LogLevel.CRITICAL, message, context, error)
  }
  
  /**
   * Logging avec métriques de performance
   */
  performance(
    message: string,
    duration: number,
    performance?: LogEntry['performance'],
    context?: Partial<LogContext>
  ): void {
    this.log(LogLevel.INFO, message, context, undefined, performance, duration)
  }
  
  /**
   * Démarrer le tracking d'une analyse
   */
  startAnalysis(requestId: string, photosCount: number, userProfile?: any): void {
    const metrics: AnalysisMetrics = {
      requestId,
      startTime: Date.now(),
      success: false,
      stage: 'input',
      photosCount,
      userAge: userProfile?.age,
      skinType: userProfile?.skinType,
      concerns: userProfile?.concerns
    }
    
    this.metrics.set(requestId, metrics)
    
    this.info('Analyse démarrée', {
      requestId,
      stage: 'input'
    }, {
      photosCount,
      userAge: userProfile?.age,
      skinType: userProfile?.skinType
    })
  }
  
  /**
   * Logger une étape de l'analyse
   */
  logAnalysisStage(
    requestId: string,
    stage: AnalysisMetrics['stage'],
    duration?: number,
    metadata?: any
  ): void {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.stage = stage
      if (duration) {
        metrics.duration = (metrics.duration || 0) + duration
      }
    }
    
    this.info(`Étape ${stage} terminée`, {
      requestId,
      stage
    }, {
      duration,
      ...metadata
    })
  }
  
  /**
   * Logger un retry
   */
  logRetry(
    requestId: string,
    attempt: number,
    error: Error,
    delay: number
  ): void {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.retryAttempt = attempt
    }
    
    this.warn(`Retry tentative ${attempt}`, {
      requestId,
      stage: 'retry'
    }, {
      attempt,
      delay,
      errorType: error.name,
      errorMessage: error.message
    })
  }
  
  /**
   * Logger l'utilisation du fallback
   */
  logFallback(
    requestId: string,
    reason: string,
    confidence: number
  ): void {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.fallbackUsed = true
    }
    
    this.warn('Fallback activé', {
      requestId,
      stage: 'fallback'
    }, {
      reason,
      confidence
    })
  }

  /**
   * SPRINT 3: Logger les métriques de cohérence
   */
  logCoherence(
    requestId: string,
    coherenceScore: number,
    zonesMatch: boolean,
    intensityMatch: boolean,
    budgetRespected: boolean,
    correctionsCount: number
  ): void {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.coherenceScore = coherenceScore
      metrics.zonesMatch = zonesMatch
      metrics.intensityMatch = intensityMatch
      metrics.budgetRespected = budgetRespected
      metrics.correctionsCount = correctionsCount
    }
    
    this.info('🔍 Métriques cohérence enregistrées', {
      requestId,
      stage: 'coherence'
    }, {
      coherenceScore,
      zonesMatch,
      intensityMatch,
      budgetRespected,
      correctionsCount
    })
  }
  
  /**
   * Terminer le tracking d'une analyse
   */
  endAnalysis(
    requestId: string,
    success: boolean,
    error?: Error,
    performance?: {
      tokensUsed?: number
      apiLatency?: number
    }
  ): void {
    const metrics = this.metrics.get(requestId)
    if (metrics) {
      metrics.endTime = Date.now()
      metrics.duration = metrics.endTime - metrics.startTime
      metrics.success = success
      metrics.stage = success ? 'output' : 'error'
      
      if (performance) {
        metrics.tokensUsed = performance.tokensUsed
        metrics.apiLatency = performance.apiLatency
      }
      
      if (error) {
        metrics.errorType = error.name
      }
    }
    
    if (success) {
      this.info('Analyse terminée avec succès', {
        requestId,
        stage: 'output'
      }, {
        duration: metrics?.duration,
        tokensUsed: performance?.tokensUsed,
        apiLatency: performance?.apiLatency
      })
    } else {
      this.error('Analyse échouée', error, {
        requestId,
        stage: 'error'
      })
    }
  }
  
  /**
   * Obtenir les métriques d'une analyse
   */
  getAnalysisMetrics(requestId: string): AnalysisMetrics | undefined {
    return this.metrics.get(requestId)
  }
  
  /**
   * Obtenir toutes les métriques pour monitoring
   */
  getAllMetrics(): AnalysisMetrics[] {
    return Array.from(this.metrics.values())
  }
  
  /**
   * Nettoyer les métriques anciennes (>1h)
   */
  cleanupMetrics(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    
    for (const [requestId, metrics] of this.metrics.entries()) {
      if (metrics.startTime < oneHourAgo) {
        this.metrics.delete(requestId)
      }
    }
  }
  
  /**
   * Calculer les métriques agrégées
   */
  getAggregatedMetrics(timeWindowMs: number = 60 * 60 * 1000): AggregatedMetrics {
    const cutoff = Date.now() - timeWindowMs
    const recentMetrics = Array.from(this.metrics.values())
      .filter(m => m.startTime >= cutoff)
    
    const totalOperations = recentMetrics.length
    const successfulOperations = recentMetrics.filter(m => m.success).length
    const failedOperations = totalOperations - successfulOperations
    
    const avgDuration = totalOperations > 0 
      ? recentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalOperations
      : 0
    
    const fallbackUsage = recentMetrics.filter(m => m.fallbackUsed).length / totalOperations
    const retryUsage = recentMetrics.filter(m => m.retryAttempt && m.retryAttempt > 1).length / totalOperations
    
    const errorTypes = recentMetrics
      .filter(m => m.errorType)
      .reduce((acc, m) => {
        acc[m.errorType!] = (acc[m.errorType!] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    // SPRINT 3: Métriques de cohérence
    const coherenceMetrics = recentMetrics.filter(m => m.coherenceScore !== undefined)
    const avgCoherenceScore = coherenceMetrics.length > 0
      ? coherenceMetrics.reduce((sum, m) => sum + (m.coherenceScore || 0), 0) / coherenceMetrics.length
      : 0
    
    const zonesCoherenceRate = coherenceMetrics.length > 0
      ? coherenceMetrics.filter(m => m.zonesMatch).length / coherenceMetrics.length
      : 0
    
    const intensityCoherenceRate = coherenceMetrics.length > 0
      ? coherenceMetrics.filter(m => m.intensityMatch).length / coherenceMetrics.length
      : 0
    
    const budgetCoherenceRate = coherenceMetrics.length > 0
      ? coherenceMetrics.filter(m => m.budgetRespected).length / coherenceMetrics.length
      : 0
    
    const avgCorrections = coherenceMetrics.length > 0
      ? coherenceMetrics.reduce((sum, m) => sum + (m.correctionsCount || 0), 0) / coherenceMetrics.length
      : 0
    
    return {
      timeWindow: timeWindowMs,
      totalOperations,
      successfulOperations,
      failedOperations,
      successRate: successfulOperations / totalOperations,
      avgDuration,
      fallbackUsage,
      retryUsage,
      errorTypes,
      // SPRINT 3: Métriques de cohérence
      coherence: {
        totalValidations: coherenceMetrics.length,
        avgCoherenceScore,
        zonesCoherenceRate,
        intensityCoherenceRate,
        budgetCoherenceRate,
        avgCorrections
      }
    }
  }
}

export interface AggregatedMetrics {
  timeWindow: number
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  successRate: number
  avgDuration: number
  fallbackUsage: number
  retryUsage: number
  errorTypes: Record<string, number>
  // SPRINT 3: Métriques de cohérence
  coherence: {
    totalValidations: number
    avgCoherenceScore: number
    zonesCoherenceRate: number
    intensityCoherenceRate: number
    budgetCoherenceRate: number
    avgCorrections: number
  }
}

// Instance singleton
export const logger = Logger.getInstance()

// Utilitaires pour décorateurs
export function withLogging(operation: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const requestId = Logger.generateRequestId()
      const startTime = Date.now()
      
      logger.setContext({ requestId, operation })
      logger.info(`${operation} démarré`, { stage: 'start' })
      
      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime
        
        logger.performance(`${operation} terminé`, duration, undefined, { stage: 'success' })
        return result
        
      } catch (error) {
        const duration = Date.now() - startTime
        logger.error(`${operation} échoué`, error as Error, { stage: 'error' })
        throw error
        
      } finally {
        logger.clearContext()
      }
    }
  }
}
