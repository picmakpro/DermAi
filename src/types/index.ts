// Core domain types — translated docs/comments to EN.
// NOTE: Keep all French union literal values as-is to preserve mappings.

/** Basic user identity */
export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

/** Client-side photo upload metadata */
export interface PhotoUpload {
  id: string
  file: File | string // File on client-side, string (base64) on server-side
  preview: string
  type: PhotoType
  quality: 'good' | 'medium' | 'poor'
}

export type PhotoType =
  | 'face-frontal'
  | 'close-up-zone'
  | 'profile-left'
  | 'profile-right'
  | 'texture-macro'

/** Full skin analysis record */
export interface SkinAnalysis {
  id: string
  userId: string
  photos: PhotoUpload[]
  scores: SkinScores
  beautyAssessment: BeautyAssessment
  recommendations: ProductRecommendations
  createdAt: Date
  v2Metrics?: {
    noFallbacks: boolean
    utilization_pct: number
  }
  metadata?: {
    analysis_version: string
    processing_time_ms: number
    ai_model_used: string
    pipeline_version: string
    timestamp: string
    stepProviders?: { 1: string; 2: string; 3: string }
  }
}

/** Model scores (0–100) + overall */
export interface SkinScores {
  hydration: ScoreDetail
  wrinkles: ScoreDetail // rides
  firmness: ScoreDetail // fermeté
  radiance: ScoreDetail // éclat
  pores: ScoreDetail
  spots: ScoreDetail // taches
  darkCircles: ScoreDetail // cernes
  skinAge: ScoreDetail // âge de la peau
  overall: number
}

/** Single score with rationale and confidence */
export interface ScoreDetail {
  value: number // 0-100
  justification: string
  confidence: number // 0-1
  basedOn: string[]
}

/** Visual assessment consolidated for UX + logic */
export interface BeautyAssessment {
  skinType?: string // Global skin type (e.g., "combination", "oily")
  mainConcern: string
  // canonical values in English
  intensity: 'mild' | 'moderate' | 'severe'
  concernedZones: string[]
  specificities?: SkinSpecificity[] // New detailed specificities with intensity
  visualFindings: string[]
  expectedImprovement: string
  improvementTimeEstimate?: string // New: time to reach ~90/100
  // New structure: global + per-zone beauty evaluation
  estimatedSkinAge?: number
  overview?: string[]
  zoneSpecific?: ZoneSpecificIssue[]
}

/** Specificity item */
export interface SkinSpecificity {
  name: string // e.g., "Ingrown hairs after shaving"
  // canonical values in English
  intensity: 'mild' | 'moderate' | 'severe'
  zones: string[] // e.g., ["chin", "neck"]
}

/** Per-zone issues (new multi-problem structure) */
export interface ZoneSpecificIssue {
  zone: string
  problems: ZoneProblem[] // New: multiple problems per zone
  description?: string // Optional now
}

/** Problem within a zone */
export interface ZoneProblem {
  name: string // e.g., "ingrowns", "redness"
  // canonical values in English
  intensity: 'mild' | 'moderate' | 'severe'
  description?: string // Optional problem description
}

/** Legacy shape kept for backward compatibility */
export interface ZoneSpecificIssueLegacy {
  zone: string
  // canonical values in English
  intensity: 'mild' | 'moderate' | 'severe'
  concerns: string[]
  description: string
}

/** AI product & routine recommendations */
export interface ProductRecommendations {
  immediate: string[]
  routine: NewRoutineStructure | AdvancedRoutine // New structure with catalogId
  products: string[]
  lifestyle: string[]
  // New: global/localized recommendations
  overview?: string
  zoneSpecificCare?: string
  restrictions?: string
  localizedRoutine?: LocalizedRoutineStep[]
  // Optional: enriched data for product UI
  productsDetailed?: RecommendedProductCard[]
  // Optional: structured routine (deprecated, replaced by AdvancedRoutine)
  routineBreakdown?: {
    morning: string[]
    evening: string[]
    weekly: string[]
  }
  // NEW: unified routine (replaces “zones to monitor” + routine)
  unifiedRoutine?: UnifiedRoutineStep[]
}

/** New routine structure with mandatory catalogId */
export interface NewRoutineStructure {
  immediate: NewRoutineStep[]
  adaptation: NewRoutineStep[]
  maintenance: NewRoutineStep[]
}

export interface NewRoutineStep {
  name: string
  frequency: import('@/constants/canonicals').FrequencyCanonical
  timing: import('@/constants/canonicals').TimeOfDayCanonical
  catalogId: string // Mandatory catalog ID
  application: string
  startDate: string
}

/** Localized routine (per-zone) */
export interface LocalizedRoutineStep {
  zone: string
  priority: 'haute' | 'moyenne' | 'basse'
  steps: LocalizedStep[]
}

export interface LocalizedStep {
  name: string
  frequency: import('@/constants/canonicals').FrequencyCanonical
  timing: import('@/constants/canonicals').TimeOfDayCanonical
  catalogId: string // Mandatory catalog ID
  application: string
  duration: string
  resume: string
}

/** Advanced routine system (legacy/alt structure) */
export interface AdvancedRoutine {
  immediate: AdvancedRoutineStep[]
  adaptation: AdvancedRoutineStep[]
  maintenance: AdvancedRoutineStep[]
}

export interface AdvancedRoutineStep {
  title: string
  description: string
  frequency: import('@/constants/canonicals').FrequencyCanonical
  timeOfDay: import('@/constants/canonicals').TimeOfDayCanonical
  frequencyDetails?: string
  phase: 'immediate' | 'adaptation' | 'maintenance'
  startAfterDays?: number
  category: 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation'
  productSuggestion?: string
  applicationTips: string[]
}

/** Compact product card for UI lists */
export interface RecommendedProductCard {
  name: string
  brand: string
  price: number
  imageUrl: string
  affiliateLink: string
  frequency: 'Quotidien' | 'Hebdomadaire' | 'Ponctuel'
  benefits: string[]
  badges?: string[]
}

/** Internal product model */
export interface Product {
  id: string
  name: string
  brand: string
  price: number
  description: string
  activeIngredients: string[]
  affiliateLink: string
  commission: number
  whyRecommended: string
  compatibilityScore: number
}

/** A single routine step resolved to a product */
export interface RoutineStep {
  order: number
  product: Product
  instructions: string
  frequency: string
  tips: string
}

/** Bundled products with savings info */
export interface ProductBundle {
  products: Product[]
  totalPrice: number
  savings: number
  description: string
}

/**
 * Unified routine step (integrates zones + treatments + phase/timing)
 */
export interface UnifiedRoutineStep {
  stepNumber: number
  title: string // e.g., "Traitement des rougeurs — Zones : joues, front"
  targetArea: 'global' | 'specific' // global = whole face, specific = targeted zones
  zones?: string[] // e.g., ["menton", "joues"] when targetArea = 'specific'

  // Kept blocks
  recommendedProducts: RecommendedProduct[]
  applicationAdvice: string
  restrictions?: string[]

  // AI metadata + new phase/timing data
  treatmentType: 'cleansing' | 'treatment' | 'moisturizing' | 'protection'
  priority: number
  phase: 'immediate' | 'adaptation' | 'maintenance'

  // New properties for phase/temporal UI
  frequency: import('@/constants/canonicals').FrequencyCanonical
  timeOfDay: import('@/constants/canonicals').TimeOfDayCanonical
  frequencyDetails?: string
  startAfterDays?: number
  category: 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation'

  // NEW UX fields
  applicationDuration?: string // e.g., "Jusqu'à teint plus homogène (1-2 semaines)" | "En continu"
  timingBadge?: string // e.g., "Quotidien 🌙" | "Hebdomadaire 🌙" | "Progressif"
  timingDetails?: string // e.g., "1x/semaine, soir sans rétinol" | "tous les 2 jours"

  // NEW fields for de-duplication in schedule view
  isEvolutive?: boolean // Mark if this step is a fusion across phases
  evolutivePhases?: ('immediate' | 'adaptation' | 'maintenance')[] // Fused phases
}

/** Product referenced within a unified routine step */
export interface RecommendedProduct {
  id: string
  name: string
  brand: string
  category: string
  price?: number
  affiliateLink?: string
  catalogId?: string
}

/** Timing badge info for UI chips */
export interface TimingBadgeInfo {
  badge: string // Main badge text
  icon: string  // Morning/evening icons
  details?: string // Extra details (e.g., "1x/semaine, soir sans rétinol")
  color: 'blue' | 'purple' | 'green' | 'orange'
}

// Re-export API types for convenience
export type { AnalyzeRequest, UserProfile, SkinConcerns, CurrentRoutine, ApiResponse } from './api'
