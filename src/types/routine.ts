// Types for an advanced dermatological routine system

export type FrequencyType =
  | 'daily'        // Daily (morning and/or evening)
  | 'weekly'       // Weekly (e.g., 2–3 times per week)
  | 'monthly'      // Monthly (e.g., once a month)
  | 'as-needed'    // As needed (e.g., after healing)
  | 'progressive'  // Progressive (e.g., introduce after 2 weeks)

export type TimeOfDay = 'morning' | 'evening' | 'both'

export type RoutinePhase =
  | 'immediate'     // Start right away
  | 'adaptation'    // After adaptation (2–4 weeks)
  | 'maintenance'   // Maintenance phase (after 6–8 weeks)
  | 'seasonal'      // Seasonal adjustments

export interface RoutineStep {
  id: string
  title: string
  description: string
  productSuggestion?: string
  applicationTips: string[]

  // Frequency & timing
  frequency: FrequencyType
  timeOfDay: TimeOfDay
  /** e.g., "2–3 times per week", "Every other day" */
  frequencyDetails?: string

  // Phase management
  phase: RoutinePhase
  /** Introduce after X days */
  startAfterDays?: number
  /** e.g., "For 4 weeks then replace" */
  duration?: string

  // Conditions & dependencies
  /** e.g., ["After healing", "If skin is dry"] */
  conditions?: string[]
  /** e.g., ["After completing step 2"] */
  prerequisites?: string[]

  // Metadata
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

  // View organized by time of day
  schedule: {
    morning: RoutineStep[]
    evening: RoutineStep[]
    weekly: RoutineStep[]
    asNeeded: RoutineStep[]
  }

  // Notifications & reminders
  reminders?: {
    stepId: string
    message: string
    /** Trigger reminder after X days */
    triggerAfterDays: number
  }[]

  // Progress & tracking
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
