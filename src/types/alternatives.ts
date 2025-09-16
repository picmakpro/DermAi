/**
 * 🔍 TYPES ALTERNATIVES INTELLIGENTES
 * 
 * Interfaces TypeScript pour le système d'alternatives de produits
 * avec critères de comparaison et logique de remplacement
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { EnrichedProduct } from './productSync'

/**
 * INTERFACE SERVICE D'ALTERNATIVES
 */
export interface AlternativeServiceConfig {
  maxAlternatives: number
  enablePriceFiltering: boolean
  enableNaturalnessFiltering: boolean
  enablePotencyFiltering: boolean
  fallbackToGeneric: boolean
}

/**
 * INTERFACE RÉSULTAT DE RECHERCHE D'ALTERNATIVES
 */
export interface AlternativeSearchResult {
  success: boolean
  alternatives: AlternativeProduct[]
  totalFound: number
  searchCriteria: AlternativeCriteria
  processingTime: number
  errors?: string[]
}

/**
 * INTERFACE PRODUIT ALTERNATIF AVEC MÉTADONNÉES
 */
export interface AlternativeProduct extends EnrichedProduct {
  // Tags de comparaison
  comparisonTags: string[]
  differenceHighlights: string[]
  
  // Comparaisons spécifiques
  priceComparison: string
  potencyComparison: string
  naturalnessComparison?: string
  speedComparison?: string
  
  // Impact du changement
  switchingImpact: {
    routineChanges: string[]
    expectedResults: string
    precautions?: string[]
    compatibilityWarnings?: string[]
    transitionPeriod?: string
  }
  
  // Métadonnées de scoring
  relevanceScore: number
  compatibilityScore: number
  priceScore: number
  
  // Marquage alternatif
  isAlternative: true
  originalProductId: string
  alternativeReason: string
}

/**
 * INTERFACE CRITÈRES D'ALTERNATIVES ÉTENDUS
 */
export interface AlternativeCriteria {
  // Critères de base
  priceRange?: 'cheaper' | 'similar' | 'premium'
  naturalness?: 'more_natural' | 'similar' | 'conventional'
  potency?: 'gentler' | 'similar' | 'stronger'
  speed?: 'faster' | 'similar' | 'gradual'
  
  // Critères avancés
  skinType?: string[]
  concerns?: string[]
  ingredients?: {
    include?: string[]
    exclude?: string[]
  }
  
  // Préférences utilisateur
  brandPreference?: string[]
  budgetMax?: number
  organicOnly?: boolean
  dermatologicallyTested?: boolean
}

/**
 * INTERFACE FILTRE DE PRIX
 */
export interface PriceFilter {
  type: 'cheaper' | 'similar' | 'premium'
  minPrice?: number
  maxPrice?: number
  tolerance: number // Pourcentage de tolérance
}

/**
 * INTERFACE FILTRE DE NATURALITÉ
 */
export interface NaturalnessFilter {
  type: 'more_natural' | 'similar' | 'conventional'
  keywords: {
    natural: string[]
    conventional: string[]
  }
  strictMode: boolean
}

/**
 * INTERFACE FILTRE DE PUISSANCE
 */
export interface PotencyFilter {
  type: 'gentler' | 'similar' | 'stronger'
  activeIngredients: string[]
  concentrationLevels: {
    gentle: string[]
    moderate: string[]
    strong: string[]
  }
}

/**
 * INTERFACE SCORING D'ALTERNATIVE
 */
export interface AlternativeScoring {
  relevance: number // 0-100
  compatibility: number // 0-100
  price: number // 0-100
  availability: number // 0-100
  userPreference: number // 0-100
  overall: number // Moyenne pondérée
}

/**
 * INTERFACE MÉTADONNÉES DE COMPARAISON
 */
export interface ComparisonMetadata {
  comparedAt: Date
  comparisonCriteria: AlternativeCriteria
  algorithmVersion: string
  catalogVersion: string
  userContext?: {
    skinType: string
    concerns: string[]
    budget: number
  }
}

/**
 * INTERFACE FEEDBACK UTILISATEUR SUR ALTERNATIVE
 */
export interface AlternativeFeedback {
  alternativeId: string
  originalProductId: string
  rating: number // 1-5
  helpful: boolean
  comments?: string
  wouldRecommend: boolean
  submittedAt: Date
}

/**
 * INTERFACE STATISTIQUES D'ALTERNATIVES
 */
export interface AlternativeStats {
  totalSearches: number
  successRate: number
  averageAlternativesFound: number
  mostPopularCriteria: AlternativeCriteria
  conversionRate: number // Taux de sélection d'alternatives
  userSatisfaction: number
}

/**
 * TYPE UNION POUR TYPES DE COMPARAISON
 */
export type ComparisonType = 'price' | 'naturalness' | 'potency' | 'speed' | 'effectiveness'

/**
 * TYPE UNION POUR STATUTS D'ALTERNATIVE
 */
export type AlternativeStatus = 'available' | 'out_of_stock' | 'discontinued' | 'restricted'

/**
 * INTERFACE CONFIGURATION ALGORITHME ALTERNATIVES
 */
export interface AlternativeAlgorithmConfig {
  weights: {
    price: number
    naturalness: number
    potency: number
    compatibility: number
    availability: number
  }
  thresholds: {
    minRelevanceScore: number
    maxPriceDifference: number
    minCompatibilityScore: number
  }
  filters: {
    enablePriceFilter: boolean
    enableNaturalnessFilter: boolean
    enablePotencyFilter: boolean
    enableAvailabilityFilter: boolean
  }
}
