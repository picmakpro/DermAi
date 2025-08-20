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
}

export interface UserProfile {
  age: number
  gender: 'Homme' | 'Femme' | 'Autre' | 'Ne souhaite pas préciser'
  skinType: 'Sèche' | 'Normale' | 'Mixte' | 'Grasse' | 'Sensible' | 'Je ne sais pas'
}

export interface SkinConcerns {
  primary: string[]
  otherText?: string
}

export interface CurrentRoutine {
  morningProducts: string[]
  eveningProducts: string[]
  // Préférence utilisateur pour la complexité/étendue de la routine
  routinePreference?: 'Minimaliste' | 'Simple' | 'Équilibrée' | 'Complète'
  monthlyBudget: '< 50€' | '50-100€' | '100-200€' | '> 200€' | 'Pas de limite'
}
