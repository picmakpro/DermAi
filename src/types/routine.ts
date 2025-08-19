// Types pour un système de routine dermatologique avancé

export type FrequencyType = 
  | 'daily' // Quotidien (matin et/ou soir)
  | 'weekly' // Hebdomadaire (ex: 2-3 fois par semaine)
  | 'monthly' // Mensuel (ex: 1 fois par mois)
  | 'as-needed' // Au besoin (ex: après cicatrisation)
  | 'progressive' // Progression (ex: introduire après 2 semaines)

export type TimeOfDay = 'morning' | 'evening' | 'both'

export type RoutinePhase = 
  | 'immediate' // Dès maintenant
  | 'adaptation' // Après adaptation (2-4 semaines)
  | 'maintenance' // Phase de maintenance (après 6-8 semaines)
  | 'seasonal' // Selon la saison

export interface RoutineStep {
  id: string
  title: string
  description: string
  productSuggestion?: string
  applicationTips: string[]
  
  // Fréquence et timing
  frequency: FrequencyType
  timeOfDay: TimeOfDay
  frequencyDetails?: string // "2-3 fois par semaine", "Tous les 2 jours"
  
  // Gestion des phases
  phase: RoutinePhase
  startAfterDays?: number // Introduire après X jours
  duration?: string // "Pendant 4 semaines puis remplacer"
  
  // Conditions et dependencies
  conditions?: string[] // ["Après cicatrisation", "Si peau sèche"]
  prerequisites?: string[] // ["Après avoir terminé l'étape 2"]
  
  // Métadonnées
  category: 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation'
  importance: 'essential' | 'recommended' | 'optional'
  order: number
}

export interface PersonalizedRoutine {
  id: string
  userId: string
  skinProfile: {
    primaryConcerns: string[]
    skinType: string
    sensitivity: 'low' | 'medium' | 'high'
    allergies: string[]
  }
  
  phases: {
    immediate: RoutineStep[]
    adaptation: RoutineStep[]
    maintenance: RoutineStep[]
  }
  
  // Vue organisée par moment de la journée
  schedule: {
    morning: RoutineStep[]
    evening: RoutineStep[]
    weekly: RoutineStep[]
    asNeeded: RoutineStep[]
  }
  
  // Notifications et rappels
  reminders?: {
    stepId: string
    message: string
    triggerAfterDays: number
  }[]
  
  // Évolution et suivi
  progressTracking?: {
    currentPhase: RoutinePhase
    phaseStartDate: Date
    nextPhaseDate?: Date
    completedSteps: string[]
  }
  
  createdAt: Date
  updatedAt: Date
}

export interface RoutineProduct {
  stepId: string
  productName: string
  brand: string
  activeIngredients: string[]
  priceRange: string
  purchaseLink?: string
  alternativeOptions: string[]
  whyRecommended: string
}

export interface RoutineTimeline {
  week: number
  phase: RoutinePhase
  activeSteps: RoutineStep[]
  newIntroductions: RoutineStep[]
  modifications: {
    stepId: string
    change: string
    reason: string
  }[]
}
