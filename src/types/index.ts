export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface PhotoUpload {
  id: string
  file: File
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

export interface SkinAnalysis {
  id: string
  userId: string
  photos: PhotoUpload[]
  scores: SkinScores
  diagnostic: SkinDiagnostic
  recommendations: ProductRecommendations
  createdAt: Date
}

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

export interface ScoreDetail {
  value: number // 0-100
  justification: string
  confidence: number // 0-1
  basedOn: string[]
}

export interface SkinDiagnostic {
  primaryCondition: string
  severity: 'Légère' | 'Modérée' | 'Sévère'
  affectedAreas: string[]
  observations: string[]
  prognosis: string
}

export interface ProductRecommendations {
  immediate: string[]
  routine: string[] | AdvancedRoutine // Support ancien + nouveau format
  products: string[]
  lifestyle: string[]
  // Optionnel: données enrichies pour l'UI produit
  productsDetailed?: RecommendedProductCard[]
  // Optionnel: routine structurée (obsolète, remplacé par AdvancedRoutine)
  routineBreakdown?: {
    morning: string[]
    evening: string[]
    weekly: string[]
  }
}

// Import du nouveau système de routine
export interface AdvancedRoutine {
  immediate: AdvancedRoutineStep[]
  adaptation: AdvancedRoutineStep[]
  maintenance: AdvancedRoutineStep[]
}

export interface AdvancedRoutineStep {
  title: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'as-needed' | 'progressive'
  timeOfDay: 'morning' | 'evening' | 'both'
  frequencyDetails?: string
  phase: 'immediate' | 'adaptation' | 'maintenance'
  startAfterDays?: number
  category: 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation'
  productSuggestion?: string
  applicationTips: string[]
}

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

export interface RoutineStep {
  order: number
  product: Product
  instructions: string
  frequency: string
  tips: string
}

export interface ProductBundle {
  products: Product[]
  totalPrice: number
  savings: number
  description: string
}
