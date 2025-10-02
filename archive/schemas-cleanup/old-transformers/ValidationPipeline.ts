/**
 * 🔥 SPRINT 3 - VALIDATION RUNTIME STRICTE
 * Pipeline de validation avec retry automatique et fallback algorithmique
 * 
 * OBJECTIFS:
 * 1. Validation Zod sur tous outputs IA (routine + produits)
 * 2. Retry automatique si JSON malformé ou invalide
 * 3. Fallback algorithmique si échec IA après 3 tentatives
 * 4. Tests validation avec JSON corrompus
 */

import { 
  validateRoutineOutput, 
  validateProductOutput,
  generateRoutineFallbackTemplate,
  generateProductsFallbackTemplate,
  type RoutinePersonnaliseeComplete,
  type ProductSelectionComplete
} from '@/schemas/routineFormats'
import { logger } from '@/utils/Logger'
import { RetryStrategy } from '@/utils/RetryStrategy'

// ===== INTERFACES VALIDATION PIPELINE =====

export interface ValidationResult<T> {
  isValid: boolean
  data?: T
  errors?: string[]
  source: 'ai' | 'fallback'
  attempts: number
  validationTime: number
}

export interface ValidationPipeline {
  validateRoutineOutput(output: any): ValidationResult<RoutinePersonnaliseeComplete>
  validateProductOutput(output: any): ValidationResult<ProductSelectionComplete>
  retryOnValidationError(prompt: string, attempt: number): Promise<any>
}

export interface RetryableAIFunction {
  (prompt: string, attempt: number): Promise<any>
}

// ===== CONFIGURATION VALIDATION =====

const VALIDATION_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 5000,
  timeoutMs: 30000,
  enableFallback: true,
  logValidationErrors: true
}

// ===== PIPELINE DE VALIDATION PRINCIPAL =====

export class AIValidationPipeline implements ValidationPipeline {
  
  /**
   * Valide une routine personnalisée avec retry et fallback
   */
  validateRoutineOutput(output: any): ValidationResult<RoutinePersonnaliseeComplete> {
    const startTime = Date.now()
    
    try {
      logger.info('🔍 Validation routine IA - Début')
      
      // Tentative de validation directe
      const validation = validateRoutineOutput(output)
      const validationTime = Date.now() - startTime
      
      if (validation.isValid && validation.data) {
        logger.info('✅ Validation routine IA - Succès direct', {
          validationTime,
          stepsCount: this.countRoutineSteps(validation.data)
        })
        
        return {
          isValid: true,
          data: validation.data,
          source: 'ai',
          attempts: 1,
          validationTime
        }
      }
      
      // Validation échouée - log des erreurs
      if (VALIDATION_CONFIG.logValidationErrors) {
        logger.warn('❌ Validation routine IA - Échec', {
          errors: validation.errors,
          outputPreview: this.getOutputPreview(output)
        })
      }
      
      return {
        isValid: false,
        errors: validation.errors,
        source: 'ai',
        attempts: 1,
        validationTime
      }
      
    } catch (error) {
      const validationTime = Date.now() - startTime
      logger.error('💥 Erreur validation routine IA', { error, validationTime })
      
      return {
        isValid: false,
        errors: [`Erreur validation: ${error instanceof Error ? error.message : 'Inconnue'}`],
        source: 'ai',
        attempts: 1,
        validationTime
      }
    }
  }
  
  /**
   * Valide une sélection de produits avec retry et fallback
   */
  validateProductOutput(output: any): ValidationResult<ProductSelectionComplete> {
    const startTime = Date.now()
    
    try {
      logger.info('🔍 Validation produits IA - Début')
      
      // Tentative de validation directe
      const validation = validateProductOutput(output)
      const validationTime = Date.now() - startTime
      
      if (validation.isValid && validation.data) {
        logger.info('✅ Validation produits IA - Succès direct', {
          validationTime,
          productsCount: validation.data.selectedProducts.length
        })
        
        return {
          isValid: true,
          data: validation.data,
          source: 'ai',
          attempts: 1,
          validationTime
        }
      }
      
      // Validation échouée - log des erreurs
      if (VALIDATION_CONFIG.logValidationErrors) {
        logger.warn('❌ Validation produits IA - Échec', {
          errors: validation.errors,
          outputPreview: this.getOutputPreview(output)
        })
      }
      
      return {
        isValid: false,
        errors: validation.errors,
        source: 'ai',
        attempts: 1,
        validationTime
      }
      
    } catch (error) {
      const validationTime = Date.now() - startTime
      logger.error('💥 Erreur validation produits IA', { error, validationTime })
      
      return {
        isValid: false,
        errors: [`Erreur validation: ${error instanceof Error ? error.message : 'Inconnue'}`],
        source: 'ai',
        attempts: 1,
        validationTime
      }
    }
  }
  
  /**
   * Retry automatique avec backoff exponentiel
   */
  async retryOnValidationError(
    aiFunction: RetryableAIFunction, 
    prompt: string,
    validationType: 'routine' | 'products'
  ): Promise<ValidationResult<any>> {
    
    logger.info(`🔄 Début retry validation ${validationType}`, {
      maxRetries: VALIDATION_CONFIG.maxRetries
    })
    
    let lastError: string[] = []
    
    for (let attempt = 1; attempt <= VALIDATION_CONFIG.maxRetries; attempt++) {
      try {
        logger.info(`🎯 Tentative ${attempt}/${VALIDATION_CONFIG.maxRetries}`)
        
        // Appel IA avec retry
        const aiOutput = await aiFunction(prompt, attempt)
        
        // Validation selon le type
        const validation = validationType === 'routine' 
          ? this.validateRoutineOutput(aiOutput)
          : this.validateProductOutput(aiOutput)
        
        if (validation.isValid) {
          logger.info(`✅ Retry validation ${validationType} - Succès tentative ${attempt}`)
          return {
            ...validation,
            attempts: attempt
          }
        }
        
        // Validation échouée - préparer retry
        lastError = validation.errors || []
        logger.warn(`❌ Tentative ${attempt} échouée`, { errors: lastError })
        
        // Délai avant retry (sauf dernière tentative)
        if (attempt < VALIDATION_CONFIG.maxRetries) {
          const delay = Math.min(
            VALIDATION_CONFIG.retryDelayMs * Math.pow(2, attempt - 1),
            VALIDATION_CONFIG.maxRetryDelayMs
          )
          logger.info(`⏳ Attente ${delay}ms avant retry`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
      } catch (error) {
        logger.error(`💥 Erreur tentative ${attempt}`, { error })
        lastError = [`Erreur tentative ${attempt}: ${error instanceof Error ? error.message : 'Inconnue'}`]
      }
    }
    
    // Toutes les tentatives ont échoué - fallback si activé
    if (VALIDATION_CONFIG.enableFallback) {
      logger.warn(`🚨 Toutes tentatives échouées - Activation fallback ${validationType}`)
      return this.activateFallback(validationType, lastError)
    }
    
    // Pas de fallback - échec final
    logger.error(`💀 Échec final validation ${validationType} - Pas de fallback`)
    return {
      isValid: false,
      errors: lastError,
      source: 'ai',
      attempts: VALIDATION_CONFIG.maxRetries,
      validationTime: 0
    }
  }
  
  /**
   * Active le fallback algorithmique
   */
  private activateFallback(
    validationType: 'routine' | 'products',
    lastError: string[]
  ): ValidationResult<any> {
    const startTime = Date.now()
    
    try {
      logger.info(`🔄 Activation fallback algorithmique ${validationType}`)
      
      const fallbackData = validationType === 'routine'
        ? generateRoutineFallbackTemplate()
        : generateProductsFallbackTemplate()
      
      const validationTime = Date.now() - startTime
      
      logger.info(`✅ Fallback ${validationType} généré avec succès`, {
        validationTime,
        fallbackType: validationType
      })
      
      return {
        isValid: true,
        data: fallbackData,
        source: 'fallback',
        attempts: VALIDATION_CONFIG.maxRetries + 1,
        validationTime,
        errors: [`Fallback activé après échecs IA: ${lastError.join(', ')}`]
      }
      
    } catch (error) {
      const validationTime = Date.now() - startTime
      logger.error(`💥 Erreur fallback ${validationType}`, { error, validationTime })
      
      return {
        isValid: false,
        errors: [
          ...lastError,
          `Erreur fallback: ${error instanceof Error ? error.message : 'Inconnue'}`
        ],
        source: 'fallback',
        attempts: VALIDATION_CONFIG.maxRetries + 1,
        validationTime
      }
    }
  }
  
  // ===== HELPERS PRIVÉS =====
  
  /**
   * Compte le nombre d'étapes dans une routine
   */
  private countRoutineSteps(routine: RoutinePersonnaliseeComplete): number {
    return routine.phases.immediate.steps.length +
           routine.phases.adaptation.steps.length +
           routine.phases.maintenance.steps.length
  }
  
  /**
   * Génère un aperçu de l'output pour le logging
   */
  private getOutputPreview(output: any): string {
    try {
      const str = typeof output === 'string' ? output : JSON.stringify(output)
      return str.substring(0, 200) + (str.length > 200 ? '...' : '')
    } catch {
      return 'Non sérialisable'
    }
  }
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Valide et nettoie un JSON potentiellement malformé
 */
export function sanitizeAndParseJSON(jsonString: string): any {
  try {
    // Nettoyer le JSON (enlever markdown, espaces, etc.)
    const cleaned = jsonString
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^\s+|\s+$/g, '')
      .trim()
    
    // Tentative de parsing direct
    return JSON.parse(cleaned)
    
  } catch (error) {
    logger.warn('⚠️ JSON malformé détecté - Tentative de réparation', {
      error: error instanceof Error ? error.message : 'Inconnue',
      preview: jsonString.substring(0, 100)
    })
    
    // Tentatives de réparation communes
    const repairs = [
      // Réparer les virgules manquantes
      (str: string) => str.replace(/}(\s*){/g, '}, {'),
      // Réparer les guillemets manquants
      (str: string) => str.replace(/(\w+):/g, '"$1":'),
      // Réparer les virgules en trop
      (str: string) => str.replace(/,(\s*[}\]])/g, '$1')
    ]
    
    for (const repair of repairs) {
      try {
        const repaired = repair(jsonString)
        return JSON.parse(repaired)
      } catch {
        continue
      }
    }
    
    throw new Error('JSON irréparable')
  }
}

/**
 * Valide la cohérence entre routine et produits
 */
export function validateRoutineProductCoherence(
  routine: RoutinePersonnaliseeComplete,
  products: ProductSelectionComplete
): {
  isCoherent: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Vérifier que chaque étape de routine a un produit correspondant
  const allSteps = [
    ...routine.phases.immediate.steps,
    ...routine.phases.adaptation.steps,
    ...routine.phases.maintenance.steps
  ]
  
  const productStepIds = new Set(products.selectedProducts.map(p => p.routineStepId))
  
  for (const step of allSteps) {
    if (!productStepIds.has(step.stepNumber)) {
      issues.push(`Étape ${step.stepNumber} (${step.title}) sans produit correspondant`)
    }
  }
  
  // Vérifier que chaque produit correspond à une étape
  for (const product of products.selectedProducts) {
    const correspondingStep = allSteps.find(s => s.stepNumber === product.routineStepId)
    if (!correspondingStep) {
      issues.push(`Produit ${product.productName} sans étape correspondante`)
    }
  }
  
  // Vérifier cohérence des phases
  const routinePhases = new Set(['immediate', 'adaptation', 'maintenance'])
  const productPhases = new Set(products.selectedProducts.map(p => p.phase))
  
  for (const phase of productPhases) {
    if (!routinePhases.has(phase)) {
      issues.push(`Phase produit "${phase}" non présente dans routine`)
    }
  }
  
  return {
    isCoherent: issues.length === 0,
    issues
  }
}

/**
 * Génère des métriques de qualité pour une validation
 */
export function generateValidationMetrics(
  routineResult: ValidationResult<RoutinePersonnaliseeComplete>,
  productsResult: ValidationResult<ProductSelectionComplete>
): {
  overallScore: number
  routineQuality: number
  productsQuality: number
  coherenceScore: number
  reliability: 'high' | 'medium' | 'low'
} {
  let overallScore = 0
  let routineQuality = 0
  let productsQuality = 0
  let coherenceScore = 0
  
  // Score routine
  if (routineResult.isValid && routineResult.data) {
    routineQuality = routineResult.source === 'ai' ? 90 : 70
    if (routineResult.attempts === 1) routineQuality += 10
  } else {
    routineQuality = 0
  }
  
  // Score produits
  if (productsResult.isValid && productsResult.data) {
    productsQuality = productsResult.source === 'ai' ? 90 : 70
    if (productsResult.attempts === 1) productsQuality += 10
  } else {
    productsQuality = 0
  }
  
  // Score cohérence
  if (routineResult.isValid && productsResult.isValid && 
      routineResult.data && productsResult.data) {
    const coherence = validateRoutineProductCoherence(routineResult.data, productsResult.data)
    coherenceScore = coherence.isCoherent ? 100 : Math.max(0, 100 - coherence.issues.length * 20)
  }
  
  // Score global
  overallScore = Math.round((routineQuality + productsQuality + coherenceScore) / 3)
  
  // Fiabilité
  let reliability: 'high' | 'medium' | 'low' = 'low'
  if (overallScore >= 85) reliability = 'high'
  else if (overallScore >= 70) reliability = 'medium'
  
  return {
    overallScore,
    routineQuality,
    productsQuality,
    coherenceScore,
    reliability
  }
}

// ===== INSTANCE SINGLETON =====

export const validationPipeline = new AIValidationPipeline()

// ===== CONFIGURATION AVANCÉE =====

/**
 * Configure le pipeline de validation
 */
export function configureValidationPipeline(config: Partial<typeof VALIDATION_CONFIG>) {
  Object.assign(VALIDATION_CONFIG, config)
  logger.info('🔧 Configuration validation pipeline mise à jour', config)
}

/**
 * Réinitialise la configuration par défaut
 */
export function resetValidationConfig() {
  Object.assign(VALIDATION_CONFIG, {
    maxRetries: 3,
    retryDelayMs: 1000,
    maxRetryDelayMs: 5000,
    timeoutMs: 30000,
    enableFallback: true,
    logValidationErrors: true
  })
  logger.info('🔄 Configuration validation pipeline réinitialisée')
}

