import type { PregnancyData, LocationData, BudgetTier, RoutineStyle } from './questionnaire'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface AnalyzeRequest {
  photos: PhotoUpload[]
  userProfile: UserProfile
  skinConcerns: SkinConcerns
  currentRoutine: CurrentRoutine
  allergies?: {
    ingredients: string[]
    pastReactions: string
  }
  
  // ✅ NOUVEAUX CHAMPS V2 (optionnels pour rétrocompat)
  pregnancy?: PregnancyData
  location?: LocationData
}

export interface UserProfile {
  age: number
  gender: 'Homme' | 'Femme' | 'Autre' | 'Ne souhaite pas préciser'
  skinType: 'Sèche' | 'Normale' | 'Mixte' | 'Grasse' | 'Sensible' | 'Je ne sais pas'
  
  // ✅ NOUVEAUX CHAMPS V2 (optionnels pour rétrocompat)
  pregnancy?: PregnancyData
}

export interface SkinConcerns {
  primary: string[]
  otherText?: string
}

export interface CurrentRoutine {
  morningProducts: string[]
  eveningProducts: string[]
  
  // ANCIEN FORMAT (deprecated mais supporté pour rétrocompatibilité)
  routinePreference?: 'Minimaliste' | 'Simple' | 'Équilibrée' | 'Complète'
  monthlyBudget?: '< 50€' | '50-100€' | '100-200€' | '> 200€' | 'Pas de limite'
  
  // ✅ NOUVEAU FORMAT V2 (optionnels pour rétrocompat)
  budgetTier?: BudgetTier
  routineStyle?: RoutineStyle
}
