import type { PhotoUpload } from './index'

/**
 * Generic API response envelope
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Analyze endpoint payload
 */
export interface AnalyzeRequest {
  photos: PhotoUpload[]           // Base64 photos captured client-side
  userProfile: UserProfile        // Declared demographics & skin type
  skinConcerns: SkinConcerns      // User-selected concerns
  currentRoutine: CurrentRoutine  // Current products & preferences
  allergies?: {
    ingredients: string[]         // Ingredients to avoid (FR values expected)
    pastReactions: string         // Free-text reactions history
  }
}

/**
 * User profile — Canonical values in English
 */
export interface UserProfile {
  age: number
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  skinType: 'dry' | 'normal' | 'combination' | 'oily' | 'sensitive' | 'unknown'
}

/**
 * User-selected primary concerns and optional free-text
 */
export interface SkinConcerns {
  primary: string[]
  otherText?: string
}

/**
 * Current routine + budget/preference — Canonical values in English
 */
export interface CurrentRoutine {
  morningProducts: string[]       // Free-form product names used in the morning
  eveningProducts: string[]       // Free-form product names used in the evening
  // User preference for routine complexity/size
  routinePreference?: 'minimalist' | 'simple' | 'balanced' | 'complete'
  monthlyBudget: 'under-50' | '50-100' | '100-200' | 'over-200' | 'no-limit'
}
