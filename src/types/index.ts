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
  sebum: ScoreDetail
  texture: ScoreDetail
  uniformity: ScoreDetail
  acneIngrown: ScoreDetail
  redness: ScoreDetail
  aging: ScoreDetail
  photoaging: ScoreDetail
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
  routine: {
    morning: RoutineStep[]
    evening: RoutineStep[]
    weekly: RoutineStep[]
  }
  products: {
    essential: Product[]
    bonus: Product[]
    luxury: Product[]
  }
  budgetOptions: {
    economical: ProductBundle
    balanced: ProductBundle
    premium: ProductBundle
  }
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
