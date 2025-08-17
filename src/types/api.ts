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
}

export interface UserProfile {
  age: number
  gender: 'Homme' | 'Femme' | 'Autre' | 'Ne souhaite pas préciser'
  skinType: 'Sèche' | 'Normale' | 'Mixte' | 'Grasse' | 'Sensible' | 'Je ne sais pas'
}

export interface SkinConcerns {
  primary: string[]
  severity: number // 1-10
  duration: '< 1 mois' | '1-6 mois' | '6-12 mois' | '> 1 an'
}

export interface CurrentRoutine {
  morningProducts: string[]
  eveningProducts: string[]
  cleansingFrequency: string
  monthlyBudget: '< 50€' | '50-100€' | '100-200€' | '> 200€' | 'Pas de limite'
}
