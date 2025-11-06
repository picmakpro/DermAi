/**
 * 🔥 SPRINT 3 - FORMATS PROMPTS STABLES
 * Schémas Zod complets pour validation runtime stricte des outputs IA
 * 
 * OBJECTIFS:
 * 1. Formats JSON documentés et stables (100%)
 * 2. Validation Zod fonctionnelle sur tous outputs
 * 3. Prêt pour A/B testing prompts sans casser parsing
 * 4. Fallback algorithmique robuste
 */

import { z } from 'zod'

// ===== INTERFACES STABLES POUR A/B TESTING =====

/**
 * Format JSON stable : structure fixe, contenu variable
 * Permet A/B testing des prompts sans casser le parsing
 */
export interface StableRoutineFormat {
  structure: RoutineStructure // Fixe pour parsing
  content: RoutineContent     // Variable pour A/B testing
  metadata: RoutineMetadata   // Tracking et validation
}

export interface RoutineStructure {
  version: string
  format: 'routine_personnalisee_v3'
  phases: ('immediate' | 'adaptation' | 'maintenance')[]
  requiredFields: string[]
}

export interface RoutineContent {
  personalizationSummary: string
  phases: Record<string, any>
  globalAdvice: string[]
  educationalContent?: Record<string, string>
}

export interface RoutineMetadata {
  generatedAt: string
  promptVersion: string
  modelUsed: string
  validationStatus: 'valid' | 'invalid' | 'fallback'
  coherenceScore?: number
}

// ===== SCHÉMAS ZOD COMPLETS POUR ROUTINE IA =====

/**
 * Schéma pour une étape de routine personnalisée - VERSION STABLE
 */
export const RoutineStepCompleteSchema = z.object({
  // Structure fixe (ne change jamais)
  stepNumber: z.number().min(1).max(20),
  category: z.enum(['cleansing', 'treatment', 'hydration', 'protection', 'exfoliation']),
  phase: z.enum(['immediate', 'adaptation', 'maintenance']),
  timing: z.enum(['morning', 'evening', 'both']),
  
  // Contenu variable (A/B testable)
  title: z.string().min(10).max(200),
  description: z.string().min(20).max(800),
  personalizedAdvice: z.string().min(10).max(400),
  
  // Métadonnées techniques
  frequency: z.string().min(5).max(100),
  visualCriteria: z.string().optional(),
  targetZones: z.array(z.string()).optional(),
  duration: z.string().optional(),
  
  // Validation cohérence
  dermatologicalReason: z.string().min(20).max(300),
  expectedResults: z.string().min(15).max(200),
  
  // Intégration produits
  catalogId: z.string().min(3).max(50).optional(),
  productRequirements: z.object({
    category: z.string(),
    potency: z.enum(['low', 'medium', 'high']).optional(),
    ingredients: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional()
  }).optional()
})

/**
 * Schéma pour une phase de routine - VERSION STABLE
 */
export const RoutinePhaseCompleteSchema = z.object({
  // Structure fixe
  phase: z.enum(['immediate', 'adaptation', 'maintenance']),
  duration: z.string().min(5).max(100),
  
  // Contenu variable
  description: z.string().min(30).max(500),
  objectives: z.array(z.string()).min(1).max(5),
  
  // Étapes de la phase
  steps: z.array(RoutineStepCompleteSchema).min(1).max(15),
  
  // Métadonnées éducatives
  educationalContent: z.object({
    phaseExplanation: z.string().min(50).max(400),
    expectedTimeline: z.string().min(10).max(100),
    successIndicators: z.array(z.string()).min(1).max(5),
    commonMistakes: z.array(z.string()).optional()
  }).optional(),
  
  // Validation temporelle
  startAfterDays: z.number().min(0).max(365).optional(),
  minimumDuration: z.number().min(1).max(180).optional()
})

/**
 * SCHÉMA PRINCIPAL - ROUTINE PERSONNALISÉE COMPLÈTE
 * Format stable pour A/B testing et validation runtime
 */
export const RoutinePersonnaliseeCompleteSchema = z.object({
  // === STRUCTURE FIXE (ne change jamais) ===
  version: z.literal('3.0'),
  format: z.literal('routine_personnalisee_complete'),
  
  // === CONTENU VARIABLE (A/B testable) ===
  personalizationSummary: z.string().min(50).max(800),
  
  // Phases de routine
  phases: z.object({
    immediate: RoutinePhaseCompleteSchema,
    adaptation: RoutinePhaseCompleteSchema,
    maintenance: RoutinePhaseCompleteSchema
  }),
  
  // Conseils globaux
  globalAdvice: z.array(z.string()).min(2).max(8),
  
  // Contenu éducatif personnalisé
  educationalContent: z.object({
    skinTypeExplanation: z.string().min(30).max(300),
    routineRationale: z.string().min(50).max(400),
    progressExpectations: z.string().min(30).max(300),
    maintenanceAdvice: z.string().min(30).max(300)
  }).optional(),
  
  // === MÉTADONNÉES VALIDATION ===
  metadata: z.object({
    generatedAt: z.string(),
    promptVersion: z.string(),
    modelUsed: z.string(),
    validationStatus: z.enum(['valid', 'invalid', 'fallback']),
    coherenceScore: z.number().min(0).max(100).optional(),
    totalSteps: z.number().min(3).max(45),
    estimatedDuration: z.string().optional()
  }),
  
  // === VALIDATION COHÉRENCE ===
  coherenceValidation: z.object({
    phasesCoherent: z.boolean(),
    stepsProgressive: z.boolean(),
    timingLogical: z.boolean(),
    categoriesBalanced: z.boolean(),
    issuesFound: z.array(z.string()).optional()
  }).optional()
})

// ===== SCHÉMAS ZOD COMPLETS POUR SÉLECTION PRODUITS =====

/**
 * Schéma pour un produit sélectionné - VERSION STABLE
 */
export const SelectedProductCompleteSchema = z.object({
  // Structure fixe
  routineStepId: z.number().min(1),
  catalogId: z.string().min(3).max(50),
  phase: z.enum(['immediate', 'adaptation', 'maintenance']),
  category: z.string().min(3).max(50),
  
  // Informations produit
  productName: z.string().min(5).max(200),
  brand: z.string().min(2).max(100),
  price: z.number().min(0),
  
  // Contenu variable (A/B testable)
  justification: z.string().min(30).max(600),
  applicationAdvice: z.string().min(20).max(400),
  dermatologicalReason: z.string().min(20).max(300),
  
  // Métadonnées techniques
  timing: z.enum(['morning', 'evening', 'both']),
  frequency: z.string().min(5).max(100),
  targetZones: z.array(z.string()).optional(),
  
  // Alternatives et compatibilité
  alternatives: z.array(z.string()).optional(),
  compatibilityNotes: z.string().optional(),
  
  // Validation qualité
  selectionConfidence: z.number().min(0).max(1).optional(),
  expectedResults: z.string().min(15).max(200).optional()
})

/**
 * Schéma pour justification détaillée - VERSION STABLE
 */
export const ProductJustificationCompleteSchema = z.object({
  catalogId: z.string().min(3).max(50),
  
  // Contenu variable (A/B testable)
  mainReason: z.string().min(20).max(300),
  dermatologicalBasis: z.string().min(30).max(400),
  userSpecificBenefit: z.string().min(20).max(300),
  expectedResults: z.string().min(20).max(300),
  usageInstructions: z.string().min(30).max(400),
  
  // Validation scientifique
  scientificEvidence: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  
  // Métadonnées
  confidenceLevel: z.enum(['low', 'medium', 'high']).optional(),
  alternativeOptions: z.array(z.string()).optional()
})

/**
 * SCHÉMA PRINCIPAL - SÉLECTION PRODUITS COMPLÈTE
 * Format stable pour A/B testing et validation runtime
 */
export const ProductSelectionCompleteSchema = z.object({
  // === STRUCTURE FIXE ===
  version: z.literal('3.0'),
  format: z.literal('product_selection_complete'),
  
  // === CONTENU VARIABLE ===
  selectionSummary: z.string().min(50).max(800),
  
  // Produits sélectionnés
  selectedProducts: z.array(SelectedProductCompleteSchema).min(1).max(20),
  
  // Justifications détaillées
  justifications: z.array(ProductJustificationCompleteSchema).min(1).max(20),
  
  // Conseils d'usage globaux
  globalUsageAdvice: z.array(z.string()).min(2).max(10),
  
  // Répartition budgétaire
  budgetBreakdown: z.object({
    totalCost: z.number().min(0),
    budgetRespected: z.boolean(),
    costOptimizations: z.array(z.string()).optional(),
    alternativesForBudget: z.array(z.object({
      originalCatalogId: z.string(),
      alternativeCatalogId: z.string(),
      savings: z.number(),
      reason: z.string()
    })).optional()
  }),
  
  // Facteurs de sélection
  selectionFactors: z.object({
    primaryCriteria: z.array(z.string()).min(1).max(8),
    budgetConstraints: z.string().min(10).max(200),
    dermatologicalPriorities: z.array(z.string()).min(1).max(8),
    userPreferences: z.array(z.string()).optional()
  }),
  
  // === MÉTADONNÉES VALIDATION ===
  metadata: z.object({
    generatedAt: z.string(),
    promptVersion: z.string(),
    modelUsed: z.string(),
    validationStatus: z.enum(['valid', 'invalid', 'fallback']),
    totalProducts: z.number().min(1).max(20),
    averagePrice: z.number().min(0).optional()
  }),
  
  // === MÉTRIQUES QUALITÉ ===
  qualityMetrics: z.object({
    routineCompleteness: z.number().min(0).max(100),
    budgetEfficiency: z.number().min(0).max(100),
    dermatologicalSoundness: z.number().min(0).max(100),
    userPersonalization: z.number().min(0).max(100),
    overallCoherenceScore: z.number().min(0).max(100)
  }),
  
  // === VALIDATION COHÉRENCE ===
  coherenceValidation: z.object({
    routineProductsMatch: z.boolean(),
    budgetRespected: z.boolean(),
    zonesCoherent: z.boolean(),
    timingLogical: z.boolean(),
    issuesFound: z.array(z.string()).optional()
  }).optional()
})

// ===== TYPES TYPESCRIPT POUR DÉVELOPPEMENT =====

export type RoutineStepComplete = z.infer<typeof RoutineStepCompleteSchema>
export type RoutinePhaseComplete = z.infer<typeof RoutinePhaseCompleteSchema>
export type RoutinePersonnaliseeComplete = z.infer<typeof RoutinePersonnaliseeCompleteSchema>

export type SelectedProductComplete = z.infer<typeof SelectedProductCompleteSchema>
export type ProductJustificationComplete = z.infer<typeof ProductJustificationCompleteSchema>
export type ProductSelectionComplete = z.infer<typeof ProductSelectionCompleteSchema>

// ===== VALIDATION HELPERS =====

/**
 * Valide une routine personnalisée avec gestion d'erreurs détaillée
 */
export function validateRoutineOutput(output: any): {
  isValid: boolean
  data?: RoutinePersonnaliseeComplete
  errors?: string[]
} {
  try {
    const validated = RoutinePersonnaliseeCompleteSchema.parse(output)
    return { isValid: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      return { isValid: false, errors }
    }
    return { isValid: false, errors: ['Erreur de validation inconnue'] }
  }
}

/**
 * Valide une sélection de produits avec gestion d'erreurs détaillée
 */
export function validateProductOutput(output: any): {
  isValid: boolean
  data?: ProductSelectionComplete
  errors?: string[]
} {
  try {
    const validated = ProductSelectionCompleteSchema.parse(output)
    return { isValid: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      return { isValid: false, errors }
    }
    return { isValid: false, errors: ['Erreur de validation inconnue'] }
  }
}

/**
 * Génère un template de routine vide pour fallback
 */
export function generateRoutineFallbackTemplate(): RoutinePersonnaliseeComplete {
  return {
    version: '3.0',
    format: 'routine_personnalisee_complete',
    personalizationSummary: 'Routine de base générée automatiquement en mode fallback.',
    phases: {
      immediate: {
        phase: 'immediate',
        duration: '1-2 semaines',
        description: 'Phase de stabilisation et nettoyage de base.',
        objectives: ['Nettoyer en douceur', 'Hydrater quotidiennement'],
        steps: [{
          stepNumber: 1,
          category: 'cleansing',
          phase: 'immediate',
          timing: 'both',
          title: 'Nettoyage doux quotidien',
          description: 'Nettoyage matin et soir avec un produit doux.',
          personalizedAdvice: 'Utilisez un gel nettoyant doux adapté à votre type de peau.',
          frequency: 'Matin et soir',
          dermatologicalReason: 'Le nettoyage quotidien élimine les impuretés sans agresser la barrière cutanée.',
          expectedResults: 'Peau propre et préparée pour les soins suivants.'
        }]
      },
      adaptation: {
        phase: 'adaptation',
        duration: '3-6 semaines',
        description: 'Introduction progressive des actifs.',
        objectives: ['Introduire des actifs ciblés'],
        steps: [{
          stepNumber: 2,
          category: 'treatment',
          phase: 'adaptation',
          timing: 'evening',
          title: 'Soin ciblé progressif',
          description: 'Introduction d\'un actif adapté aux besoins identifiés.',
          personalizedAdvice: 'Commencez par 2-3 applications par semaine.',
          frequency: '2-3 fois par semaine le soir',
          dermatologicalReason: 'Introduction progressive pour éviter les irritations.',
          expectedResults: 'Amélioration progressive des préoccupations ciblées.'
        }]
      },
      maintenance: {
        phase: 'maintenance',
        duration: 'En continu',
        description: 'Maintien des acquis et prévention.',
        objectives: ['Maintenir les résultats obtenus'],
        steps: [{
          stepNumber: 3,
          category: 'protection',
          phase: 'maintenance',
          timing: 'morning',
          title: 'Protection solaire quotidienne',
          description: 'Protection UV quotidienne pour préserver les résultats.',
          personalizedAdvice: 'Appliquez généreusement chaque matin.',
          frequency: 'Quotidien le matin',
          dermatologicalReason: 'La protection solaire prévient le vieillissement prématuré.',
          expectedResults: 'Maintien des améliorations et prévention du vieillissement.'
        }]
      }
    },
    globalAdvice: [
      'Respectez l\'ordre d\'application des produits.',
      'Soyez patient, les résultats apparaissent progressivement.'
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      promptVersion: 'fallback-v1.0',
      modelUsed: 'algorithmic-fallback',
      validationStatus: 'fallback',
      totalSteps: 3
    }
  }
}

/**
 * Génère un template de sélection produits vide pour fallback
 */
export function generateProductsFallbackTemplate(): ProductSelectionComplete {
  return {
    version: '3.0',
    format: 'product_selection_complete',
    selectionSummary: 'Sélection de produits de base générée automatiquement en mode fallback.',
    selectedProducts: [{
      routineStepId: 1,
      catalogId: 'cerave_gel_moussant',
      phase: 'immediate',
      category: 'cleansing',
      productName: 'Gel Moussant Nettoyant',
      brand: 'CeraVe',
      price: 12.99,
      justification: 'Nettoyant doux adapté à tous types de peau, formulé avec des céramides.',
      applicationAdvice: 'Appliquez sur peau humide, massez délicatement et rincez.',
      dermatologicalReason: 'Les céramides aident à restaurer la barrière cutanée.',
      timing: 'both',
      frequency: 'Matin et soir',
      expectedResults: 'Peau propre sans sensation de tiraillement.'
    }],
    justifications: [{
      catalogId: 'cerave_gel_moussant',
      mainReason: 'Produit de référence pour le nettoyage quotidien.',
      dermatologicalBasis: 'Formulé avec des céramides essentiels et de l\'acide hyaluronique.',
      userSpecificBenefit: 'Convient à tous types de peau, même sensibles.',
      expectedResults: 'Nettoyage efficace sans dessèchement.',
      usageInstructions: 'Utilisez matin et soir sur peau humide, rincez abondamment.'
    }],
    globalUsageAdvice: [
      'Commencez toujours par le nettoyage.',
      'Respectez les temps de pause entre les produits.'
    ],
    budgetBreakdown: {
      totalCost: 12.99,
      budgetRespected: true
    },
    selectionFactors: {
      primaryCriteria: ['Efficacité', 'Tolérance', 'Rapport qualité-prix'],
      budgetConstraints: 'Budget respecté avec produits essentiels.',
      dermatologicalPriorities: ['Nettoyage doux', 'Respect barrière cutanée']
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      promptVersion: 'fallback-v1.0',
      modelUsed: 'algorithmic-fallback',
      validationStatus: 'fallback',
      totalProducts: 1
    },
    qualityMetrics: {
      routineCompleteness: 60,
      budgetEfficiency: 90,
      dermatologicalSoundness: 85,
      userPersonalization: 50,
      overallCoherenceScore: 70
    }
  }
}

