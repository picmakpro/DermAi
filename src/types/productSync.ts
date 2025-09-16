/**
 * 🔄 TYPES SYNCHRONISATION PRODUITS ↔ ROUTINE
 * 
 * Interfaces TypeScript pour la synchronisation bidirectionnelle
 * entre la routine personnalisée et la section produits recommandés
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { RecommendedProduct, UnifiedRoutineStep } from './index'

/**
 * ÉNUMÉRATION DES CATÉGORIES PAR PROBLÈME DE PEAU
 */
export enum ProductProblemCategory {
  ACNE = "Anti-acné",
  HYDRATION = "Hydratation", 
  ANTI_AGING = "Anti-rides",
  PIGMENTATION = "Taches & Éclat",
  SENSITIVITY = "Peaux sensibles",
  CLEANSING = "Nettoyage",
  PROTECTION = "Protection solaire",
  EXFOLIATION = "Exfoliation",
  AUTRES = "Autres"
}

/**
 * INTERFACE PRODUIT ENRICHI
 * Extension de RecommendedProduct avec données catalogue et IA
 */
export interface EnrichedProduct extends RecommendedProduct {
  // Données catalogue JSON
  imageUrl: string
  description: string
  keywordBenefits: string[]
  problemCategory: ProductProblemCategory
  
  // Instructions enrichies depuis routine
  usageInstructions: {
    application: string
    frequency: string
    timing: string
    routineStep?: string
  }
  
  // Justification IA personnalisée
  aiJustification: {
    whySelected: string
    skinBenefits: string[]
    routineIntegration: string
  }
  
  // Métadonnées alternatives
  alternatives?: AlternativeProduct[]
  isAlternative?: boolean
  originalProductId?: string
  replacementHistory?: ProductReplacement[]
}

/**
 * INTERFACE PRODUIT ALTERNATIF
 * Extension d'EnrichedProduct avec données de comparaison
 */
export interface AlternativeProduct extends EnrichedProduct {
  comparisonTags: string[]
  differenceHighlights: string[]
  priceComparison: string
  potencyComparison: string
  switchingImpact: {
    routineChanges: string[]
    expectedResults: string
    precautions?: string[]
    compatibilityWarnings?: string[]
  }
}

/**
 * INTERFACE CRITÈRES D'ALTERNATIVES
 */
export interface AlternativeCriteria {
  priceRange?: 'cheaper' | 'similar' | 'premium'
  naturalness?: 'more_natural' | 'similar' | 'conventional'
  potency?: 'gentler' | 'similar' | 'stronger'
  speed?: 'faster' | 'similar' | 'gradual'
}

/**
 * INTERFACE RÉSULTAT DE SYNCHRONISATION
 */
export interface SyncResult {
  success: boolean
  updatedRoutine: UnifiedRoutineStep[]
  updatedProducts: EnrichedProduct[]
  warnings?: string[]
  errors?: string[]
}

/**
 * INTERFACE HISTORIQUE DE REMPLACEMENT
 */
export interface ProductReplacement {
  id: string
  timestamp: Date
  oldProductId: string
  newProductId: string
  reason: string
  userConfirmed: boolean
}

/**
 * INTERFACE MATRICE DE COMPARAISON
 */
export interface ComparisonMatrix {
  currentProduct: EnrichedProduct
  alternatives: AlternativeProduct[]
  comparisonCriteria: {
    price: ComparisonCriterion
    naturalness: ComparisonCriterion
    potency: ComparisonCriterion
    speed: ComparisonCriterion
  }
}

/**
 * INTERFACE CRITÈRE DE COMPARAISON
 */
export interface ComparisonCriterion {
  label: string
  currentValue: string
  alternatives: {
    productId: string
    value: string
    difference: 'better' | 'similar' | 'worse'
  }[]
}

/**
 * INTERFACE CONTEXTE ROUTINE POUR PRODUIT
 */
export interface ProductRoutineContext {
  stepTitle: string
  stepNumber: number
  phase: string
  category: string
  targetZones?: string[]
  frequency?: string
  timing?: string
}
