/**
 * 🚨 SERVICE DE GESTION D'ERREURS ROBUSTE
 * 
 * Service centralisé pour la gestion d'erreurs et fallbacks
 * dans le système de synchronisation produits-routine
 * 
 * Sprint 3 - Intégration, Tests & Optimisation
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { EnrichedProduct } from '@/types/productSync'
import { UnifiedRoutineStep, RecommendedProduct } from '@/types'

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CATALOG_UNAVAILABLE = 'CATALOG_UNAVAILABLE',
  INVALID_DATA = 'INVALID_DATA',
  SYNC_FAILURE = 'SYNC_FAILURE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',           // Erreur mineure, fallback disponible
  MEDIUM = 'MEDIUM',     // Erreur modérée, fonctionnalité dégradée
  HIGH = 'HIGH',         // Erreur critique, intervention nécessaire
  CRITICAL = 'CRITICAL'  // Erreur bloquante, arrêt du processus
}

export interface ErrorContext {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  originalError?: Error
  context?: Record<string, any>
  timestamp: Date
  userFriendlyMessage: string
  suggestedActions: string[]
  fallbackAvailable: boolean
}

export interface FallbackStrategy {
  type: 'retry' | 'fallback_data' | 'graceful_degradation' | 'user_intervention'
  maxRetries?: number
  retryDelay?: number
  fallbackData?: any
  userMessage?: string
}

export class ErrorHandlingService {
  
  private static errorLog: ErrorContext[] = []
  private static maxLogSize = 100
  
  /**
   * 🔍 CLASSIFICATION AUTOMATIQUE DES ERREURS
   */
  static classifyError(error: Error, context?: Record<string, any>): ErrorContext {
    let type = ErrorType.UNKNOWN_ERROR
    let severity = ErrorSeverity.MEDIUM
    let userFriendlyMessage = 'Une erreur inattendue s\'est produite'
    let suggestedActions: string[] = ['Réessayer dans quelques instants']
    let fallbackAvailable = false
    
    const errorMessage = error.message.toLowerCase()
    
    // Classification par type d'erreur
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      type = ErrorType.NETWORK_ERROR
      severity = ErrorSeverity.MEDIUM
      userFriendlyMessage = 'Problème de connexion réseau'
      suggestedActions = [
        'Vérifier votre connexion internet',
        'Réessayer dans quelques secondes'
      ]
      fallbackAvailable = true
      
    } else if (errorMessage.includes('timeout')) {
      type = ErrorType.TIMEOUT_ERROR
      severity = ErrorSeverity.MEDIUM
      userFriendlyMessage = 'Le chargement prend plus de temps que prévu'
      suggestedActions = [
        'Patientez quelques instants',
        'Rafraîchir la page si le problème persiste'
      ]
      fallbackAvailable = true
      
    } else if (errorMessage.includes('catalog') || errorMessage.includes('unavailable')) {
      type = ErrorType.CATALOG_UNAVAILABLE
      severity = ErrorSeverity.HIGH
      userFriendlyMessage = 'Catalogue de produits temporairement indisponible'
      suggestedActions = [
        'Les produits seront affichés dès que possible',
        'Vous pouvez continuer à consulter votre routine'
      ]
      fallbackAvailable = true
      
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      type = ErrorType.VALIDATION_ERROR
      severity = ErrorSeverity.LOW
      userFriendlyMessage = 'Données incohérentes détectées'
      suggestedActions = [
        'Correction automatique en cours',
        'Aucune action requise'
      ]
      fallbackAvailable = true
      
    } else if (errorMessage.includes('sync')) {
      type = ErrorType.SYNC_FAILURE
      severity = ErrorSeverity.MEDIUM
      userFriendlyMessage = 'Problème de synchronisation des produits'
      suggestedActions = [
        'Tentative de resynchronisation automatique',
        'Cliquer sur "Réessayer" si nécessaire'
      ]
      fallbackAvailable = true
    }
    
    const errorContext: ErrorContext = {
      type,
      severity,
      message: error.message,
      originalError: error,
      context,
      timestamp: new Date(),
      userFriendlyMessage,
      suggestedActions,
      fallbackAvailable
    }
    
    // Enregistrer l'erreur
    this.logError(errorContext)
    
    return errorContext
  }
  
  /**
   * 🔄 STRATÉGIES DE FALLBACK INTELLIGENTES
   */
  static getFallbackStrategy(errorContext: ErrorContext): FallbackStrategy {
    switch (errorContext.type) {
      case ErrorType.NETWORK_ERROR:
        return {
          type: 'retry',
          maxRetries: 3,
          retryDelay: 1000, // 1s, puis 2s, puis 4s (backoff exponentiel)
          userMessage: 'Nouvelle tentative de connexion...'
        }
        
      case ErrorType.TIMEOUT_ERROR:
        return {
          type: 'retry',
          maxRetries: 2,
          retryDelay: 2000,
          userMessage: 'Nouvelle tentative avec délai étendu...'
        }
        
      case ErrorType.CATALOG_UNAVAILABLE:
        return {
          type: 'fallback_data',
          fallbackData: this.generateFallbackProducts(),
          userMessage: 'Utilisation de données de secours'
        }
        
      case ErrorType.VALIDATION_ERROR:
        return {
          type: 'graceful_degradation',
          userMessage: 'Correction automatique appliquée'
        }
        
      case ErrorType.SYNC_FAILURE:
        return {
          type: 'retry',
          maxRetries: 2,
          retryDelay: 500,
          userMessage: 'Resynchronisation en cours...'
        }
        
      default:
        return {
          type: 'user_intervention',
          userMessage: 'Intervention manuelle requise'
        }
    }
  }
  
  /**
   * 🛡️ GÉNÉRATION DE PRODUITS DE SECOURS
   */
  private static generateFallbackProducts(): EnrichedProduct[] {
    const fallbackProducts: EnrichedProduct[] = [
      {
        id: 'fallback-cleanser',
        name: 'Nettoyant Doux Universel',
        brand: 'Sélection DermAI',
        category: 'cleanser',
        price: 15.99,
        catalogId: 'fallback-cleanser',
        affiliateLink: '#',
        applicationAdvice: 'Appliquer matin et soir sur peau humide',
        restrictions: [],
        
        // Données enrichies
        imageUrl: '/fallback-images/cleanser.jpg',
        description: 'Nettoyant doux adapté à tous types de peau',
        keywordBenefits: ['Nettoyage efficace', 'Respecte la barrière cutanée'],
        problemCategory: 'Nettoyage' as any,
        
        usageInstructions: {
          application: 'Masser délicatement sur peau humide puis rincer',
          frequency: 'Matin et soir',
          timing: 'Quotidien'
        },
        
        aiJustification: {
          whySelected: 'Produit de base essentiel pour tous les types de peau',
          skinBenefits: ['Élimine les impuretés', 'Prépare la peau aux soins'],
          routineIntegration: 'Première étape indispensable de votre routine'
        },
        
        isFallback: true
      },
      {
        id: 'fallback-moisturizer',
        name: 'Crème Hydratante Équilibrante',
        brand: 'Sélection DermAI',
        category: 'moisturizer',
        price: 22.99,
        catalogId: 'fallback-moisturizer',
        affiliateLink: '#',
        applicationAdvice: 'Appliquer uniformément sur visage propre',
        restrictions: [],
        
        // Données enrichies
        imageUrl: '/fallback-images/moisturizer.jpg',
        description: 'Hydratation optimale pour tous types de peau',
        keywordBenefits: ['Hydratation 24h', 'Texture non grasse'],
        problemCategory: 'Hydratation' as any,
        
        usageInstructions: {
          application: 'Étaler uniformément en mouvements circulaires',
          frequency: 'Matin et soir',
          timing: 'Après nettoyage'
        },
        
        aiJustification: {
          whySelected: 'Hydratation équilibrée adaptée à votre type de peau',
          skinBenefits: ['Maintient l\'hydratation', 'Renforce la barrière cutanée'],
          routineIntegration: 'Étape finale pour sceller les bienfaits'
        },
        
        isFallback: true
      }
    ]
    
    return fallbackProducts
  }
  
  /**
   * 🔧 CORRECTION AUTOMATIQUE DES DONNÉES
   */
  static sanitizeRoutineData(routine: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    if (!Array.isArray(routine)) {
      console.warn('⚠️ Routine invalide, utilisation de routine par défaut')
      return this.getDefaultRoutine()
    }
    
    return routine.map((step, index) => ({
      stepNumber: step.stepNumber || index + 1,
      title: step.title || `Étape ${index + 1}`,
      description: step.description || 'Description non disponible',
      category: step.category || 'treatment',
      phase: step.phase || 'immediate',
      zones: Array.isArray(step.zones) ? step.zones : ['visage'],
      frequency: step.frequency || 'daily',
      timeOfDay: step.timeOfDay || 'morning',
      applicationDuration: step.applicationDuration || 'En continu',
      recommendedProducts: Array.isArray(step.recommendedProducts) 
        ? step.recommendedProducts.map(this.sanitizeProductData)
        : []
    }))
  }
  
  /**
   * 🧹 NETTOYAGE DES DONNÉES PRODUIT
   */
  private static sanitizeProductData(product: RecommendedProduct): RecommendedProduct {
    return {
      id: product.id || `product-${Date.now()}`,
      name: product.name || 'Produit non spécifié',
      brand: product.brand || 'Marque inconnue',
      category: product.category || 'treatment',
      price: typeof product.price === 'number' ? product.price : 0,
      catalogId: product.catalogId || product.id,
      affiliateLink: product.affiliateLink || '#',
      applicationAdvice: product.applicationAdvice || 'Suivre les instructions du fabricant',
      restrictions: Array.isArray(product.restrictions) ? product.restrictions : []
    }
  }
  
  /**
   * 📝 ROUTINE PAR DÉFAUT
   */
  private static getDefaultRoutine(): UnifiedRoutineStep[] {
    return [
      {
        stepNumber: 1,
        title: 'Nettoyage quotidien',
        description: 'Nettoyage doux pour éliminer les impuretés',
        category: 'cleansing',
        phase: 'immediate',
        zones: ['visage'],
        frequency: 'daily',
        timeOfDay: 'morning',
        applicationDuration: 'En continu',
        recommendedProducts: []
      },
      {
        stepNumber: 2,
        title: 'Hydratation',
        description: 'Maintenir l\'équilibre hydrique de la peau',
        category: 'moisturizing',
        phase: 'immediate',
        zones: ['visage'],
        frequency: 'daily',
        timeOfDay: 'morning',
        applicationDuration: 'En continu',
        recommendedProducts: []
      }
    ]
  }
  
  /**
   * 📊 GESTION DES LOGS D'ERREURS
   */
  private static logError(errorContext: ErrorContext): void {
    // Ajouter au log
    this.errorLog.unshift(errorContext)
    
    // Maintenir la taille du log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }
    
    // Log console pour développement
    console.error('🚨 ErrorHandlingService:', {
      type: errorContext.type,
      severity: errorContext.severity,
      message: errorContext.message,
      context: errorContext.context,
      timestamp: errorContext.timestamp
    })
    
    // Envoyer à un service de monitoring en production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorContext)
    }
  }
  
  /**
   * 📡 ENVOI VERS SERVICE DE MONITORING
   */
  private static async sendToMonitoring(errorContext: ErrorContext): Promise<void> {
    try {
      // En production, envoyer vers Sentry, LogRocket, etc.
      await fetch('/api/monitoring/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            type: errorContext.type,
            severity: errorContext.severity,
            message: errorContext.message,
            timestamp: errorContext.timestamp,
            context: errorContext.context
          },
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      })
    } catch (monitoringError) {
      console.warn('⚠️ Impossible d\'envoyer l\'erreur au monitoring:', monitoringError)
    }
  }
  
  /**
   * 📈 STATISTIQUES D'ERREURS
   */
  static getErrorStats(): {
    totalErrors: number
    errorsByType: Record<ErrorType, number>
    errorsBySeverity: Record<ErrorSeverity, number>
    recentErrors: ErrorContext[]
  } {
    const errorsByType = {} as Record<ErrorType, number>
    const errorsBySeverity = {} as Record<ErrorSeverity, number>
    
    // Initialiser les compteurs
    Object.values(ErrorType).forEach(type => {
      errorsByType[type] = 0
    })
    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0
    })
    
    // Compter les erreurs
    this.errorLog.forEach(error => {
      errorsByType[error.type]++
      errorsBySeverity[error.severity]++
    })
    
    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorLog.slice(0, 10) // 10 erreurs les plus récentes
    }
  }
  
  /**
   * 🧹 NETTOYAGE DU LOG
   */
  static clearErrorLog(): void {
    this.errorLog = []
  }
  
  /**
   * 🔍 RECHERCHE D'ERREURS
   */
  static findErrors(criteria: {
    type?: ErrorType
    severity?: ErrorSeverity
    since?: Date
    limit?: number
  }): ErrorContext[] {
    let filtered = this.errorLog
    
    if (criteria.type) {
      filtered = filtered.filter(error => error.type === criteria.type)
    }
    
    if (criteria.severity) {
      filtered = filtered.filter(error => error.severity === criteria.severity)
    }
    
    if (criteria.since) {
      filtered = filtered.filter(error => error.timestamp >= criteria.since!)
    }
    
    if (criteria.limit) {
      filtered = filtered.slice(0, criteria.limit)
    }
    
    return filtered
  }
}
