import { z } from 'zod'

/**
 * SCHÉMAS DE VALIDATION ZOD - SPRINT 1 FIABILITÉ
 * Validation stricte pour tous les outputs IA selon fiche technique
 */

// Schéma pour les détails de score
const ScoreDetailSchema = z.object({
  value: z.number().min(0).max(100),
  justification: z.string().min(10).max(200),
  confidence: z.number().min(0).max(1),
  basedOn: z.array(z.string()).min(1).max(5)
})

// ÉTAPE 1: Diagnostic Brut - Schéma strict selon fiche technique
export const DiagnosticBrutSchema = z.object({
  scores: z.object({
    hydration: ScoreDetailSchema,
    wrinkles: ScoreDetailSchema,
    firmness: ScoreDetailSchema,
    radiance: ScoreDetailSchema,
    pores: ScoreDetailSchema,
    spots: ScoreDetailSchema,
    darkCircles: ScoreDetailSchema,
    skinAge: ScoreDetailSchema,
    overall: z.number().min(0).max(100).optional() // Calculé côté serveur
  }),
  beautyAssessment: z.object({
    skinType: z.string().min(5).max(100),
    mainConcern: z.string().min(10).max(200),
    intensity: z.enum(['légère', 'modérée', 'modérée à sévère', 'intense', 'sévère']),
    concernedZones: z.array(z.string()).min(1).max(10),
    specificities: z.array(z.object({
      name: z.string().min(5).max(100),
      intensity: z.enum(['légère', 'modérée', 'modérée à sévère', 'intense', 'sévère']),
      zones: z.array(z.string()).min(1).max(5)
    })).min(1).max(10),
    visualFindings: z.array(z.string()).min(3).max(10),
    overview: z.array(z.string()).min(1).max(5),
    zoneSpecific: z.array(z.object({
      zone: z.string().min(3).max(50),
      problems: z.array(z.object({
        name: z.string().min(5).max(100),
        intensity: z.enum(['légère', 'modérée', 'sévère'])
      })).min(1).max(5),
      description: z.string().min(10).max(200)
    })).min(1).max(10),
    expectedImprovement: z.string().min(20).max(200),
    improvementTimeEstimate: z.enum(['4-6 semaines', '2-3 mois', '3-4 mois', '4-6 mois', '6-8 mois'])
  })
})

// ÉTAPE 2: Routine Personnalisée - Schéma strict selon fiche technique
export const RoutinePersonnaliseeSchema = z.object({
  immediate: z.array(z.string()).min(1).max(5).optional(),
  routine: z.object({
    immediate: z.array(z.object({
      name: z.string().min(5).max(100),
      frequency: z.enum(['quotidien', 'hebdomadaire', 'ponctuel']),
      timing: z.enum(['matin', 'soir', 'matin_et_soir']),
      catalogId: z.string().regex(/^[A-Z0-9]{8,12}$/),
      application: z.string().min(10).max(300),
      startDate: z.enum(['maintenant', 'après_1_semaine', 'après_2_semaines'])
    })).min(1).max(10),
    adaptation: z.array(z.object({
      name: z.string().min(5).max(100),
      frequency: z.enum(['quotidien', 'hebdomadaire', 'ponctuel']),
      timing: z.enum(['matin', 'soir', 'matin_et_soir']),
      catalogId: z.string().regex(/^[A-Z0-9]{8,12}$/),
      application: z.string().min(10).max(300),
      startDate: z.enum(['maintenant', 'après_1_semaine', 'après_2_semaines', 'après_3_semaines'])
    })).min(0).max(10),
    maintenance: z.array(z.object({
      name: z.string().min(5).max(100),
      frequency: z.enum(['quotidien', 'hebdomadaire', 'ponctuel']),
      timing: z.enum(['matin', 'soir', 'matin_et_soir']),
      catalogId: z.string().regex(/^[A-Z0-9]{8,12}$/),
      application: z.string().min(10).max(300),
      startDate: z.enum(['maintenant', 'après_1_semaine', 'après_2_semaines', 'après_4_semaines'])
    })).min(0).max(10)
  }),
  localizedRoutine: z.array(z.object({
    zone: z.string().min(3).max(50),
    priority: z.enum(['haute', 'moyenne', 'basse']),
    steps: z.array(z.object({
      name: z.string().min(5).max(100),
      frequency: z.enum(['quotidien', 'hebdomadaire', 'ponctuel']),
      timing: z.enum(['matin', 'soir', 'matin_et_soir']),
      catalogId: z.string().regex(/^[A-Z0-9]{8,12}$/),
      application: z.string().min(10).max(300),
      duration: z.string().min(5).max(100),
      resume: z.string().min(5).max(100)
    })).min(1).max(5)
  })).min(0).max(10),
  overview: z.string().min(20).max(300),
  zoneSpecificCare: z.string().min(20).max(300),
  restrictions: z.string().min(10).max(300).optional()
})

// Configuration de retry pour validation
export interface RetryConfig {
  maxAttempts: number
  timeoutMs: number
  baseDelayMs: number
  maxDelayMs: number
  validator?: (result: any) => boolean
}

export const RETRY_CONFIGS = {
  diagnostic: {
    maxAttempts: 3,
    timeoutMs: 35000, // Cohérent avec timeout serveur
    baseDelayMs: 2000,
    maxDelayMs: 10000,
    validator: (result) => result?.scores?.overall !== undefined
  },
  productSelection: {
    maxAttempts: 2,
    timeoutMs: 35000, // Cohérent avec timeout serveur
    baseDelayMs: 1000,
    maxDelayMs: 5000,
    validator: (result) => result?.routine?.immediate?.length > 0
  }
} as const

// Types d'erreur pour classification intelligente
export enum ErrorType {
  VALIDATION_ERROR = 'validation',
  NETWORK_ERROR = 'network',
  TIMEOUT_ERROR = 'timeout',
  RATE_LIMIT_ERROR = 'rate_limit',
  AUTHENTICATION_ERROR = 'auth',
  PARSING_ERROR = 'parsing',
  OPENAI_REFUSAL = 'openai_refusal'
}

// Fonction de classification d'erreurs
export function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase()
  
  if (message.includes('openai_refusal') || message.includes('refusé d\'analyser')) {
    return ErrorType.OPENAI_REFUSAL
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION_ERROR
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return ErrorType.NETWORK_ERROR
  }
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return ErrorType.TIMEOUT_ERROR
  }
  
  if (message.includes('rate limit') || message.includes('quota') || message.includes('too many requests')) {
    return ErrorType.RATE_LIMIT_ERROR
  }
  
  if (message.includes('unauthorized') || message.includes('api key')) {
    return ErrorType.AUTHENTICATION_ERROR
  }
  
  if (message.includes('json') || message.includes('parse')) {
    return ErrorType.PARSING_ERROR
  }
  
  return ErrorType.NETWORK_ERROR // Fallback
}

// Fonction pour déterminer si retry est approprié
export function shouldRetry(error: Error, attempt: number): boolean {
  const errorType = classifyError(error)
  
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
    case ErrorType.AUTHENTICATION_ERROR:
      return false // Ne pas retry
      
    case ErrorType.OPENAI_REFUSAL:
      return attempt <= 3 // Retry les refus OpenAI (prompt amélioré)
      
    case ErrorType.NETWORK_ERROR:
    case ErrorType.TIMEOUT_ERROR:
    case ErrorType.RATE_LIMIT_ERROR:
    case ErrorType.PARSING_ERROR:
      return attempt <= 3 // Retry jusqu'à 3 fois (tentative 1, 2, 3)
      
    default:
      return false
  }
}

// Fonction de génération de seed déterministe
export function generateSeed(imageHashes: string[]): number {
  // Créer un hash stable basé sur les images
  const combined = imageHashes.sort().join('')
  let hash = 0
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Retourner un seed positif entre 1 et 2147483647
  return Math.abs(hash) || 1
}

// Fonction de hash d'image simple
export function hashImage(base64Data: string): string {
  // Prendre un échantillon de la donnée base64 pour créer un hash stable
  const sample = base64Data.slice(0, 100) + base64Data.slice(-100)
  let hash = 0
  
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return Math.abs(hash).toString(36)
}
