/**
 * Normalization functions to convert FR/EN values to canonical EN values
 * These must be used at all input boundaries
 */

import {
  FrequencyCanonical,
  TimeOfDayCanonical,
  IntensityCanonical,
  GenderCanonical,
  SkinTypeCanonical,
  BudgetCanonical,
  SkinConcernCanonical
} from '@/constants/canonicals'

/**
 * Normalize frequency values to canonical EN
 */
export function normalizeFrequency(value: string): FrequencyCanonical {
  const normalized = value.toLowerCase().trim()
  
  // FR mappings
  if (normalized.includes('quotidien') || normalized === 'daily') {
    return 'daily'
  }
  if (normalized.includes('hebdomadaire') || normalized === 'weekly') {
    return 'weekly'
  }
  if (normalized.includes('ponctuel') || normalized.includes('as-needed') || normalized.includes('as_needed')) {
    return 'as_needed'
  }
  // Handle progressive/progressif -> map to weekly (closest valid)
  if (normalized.includes('progressif') || normalized.includes('progressive')) {
    return 'weekly'
  }
  
  // Default fallback
  return 'daily'
}

/**
 * Normalize time of day values to canonical EN
 */
export function normalizeTimeOfDay(value: string): TimeOfDayCanonical {
  const normalized = value.toLowerCase().trim()
  
  // FR mappings - test most specific first
  if (normalized.includes('matin_et_soir') || normalized === 'morning_and_evening' || normalized === 'both') {
    return 'morning_and_evening'
  }
  if (normalized.includes('matin') || normalized === 'morning') {
    return 'morning'
  }
  if (normalized.includes('soir') || normalized === 'evening') {
    return 'evening'
  }
  
  // Default fallback
  return 'morning'
}

/**
 * Normalize intensity values to canonical EN
 */
export function normalizeIntensity(value: string): IntensityCanonical {
  const normalized = value.toLowerCase().trim()
  
  // FR mappings
  if (normalized.includes('légère') || normalized.includes('legere') || normalized === 'mild') {
    return 'mild'
  }
  if (normalized.includes('modérée') || normalized.includes('moderee') || normalized === 'moderate') {
    return 'moderate'
  }
  if (normalized.includes('intense') || normalized === 'intense') {
    return 'intense'
  }
  if (normalized.includes('sévère') || normalized.includes('severe') || normalized === 'severe') {
    return 'severe'
  }
  
  // Default fallback
  return 'mild'
}

/**
 * Normalize gender values to canonical EN
 */
export function normalizeGender(value: string): GenderCanonical {
  const normalized = value.toLowerCase().trim()
  
  // FR mappings
  if (normalized.includes('homme') || normalized === 'male') {
    return 'male'
  }
  if (normalized.includes('femme') || normalized === 'female') {
    return 'female'
  }
  if (normalized.includes('ne souhaite pas') || normalized.includes('prefer_not_to_say') || normalized.includes('prefer-not-to-say')) {
    return 'prefer_not_to_say'
  }
  
  // Default fallback
  return 'prefer_not_to_say'
}

/**
 * Normalize skin type values to canonical EN
 */
export function normalizeSkinType(value: string): SkinTypeCanonical {
  const normalized = value.toLowerCase().trim()
  
  // FR mappings
  if (normalized.includes('sèche') || normalized.includes('seche') || normalized === 'dry') {
    return 'dry'
  }
  if (normalized.includes('mixte') || normalized === 'combination') {
    return 'combination'
  }
  if (normalized.includes('grasse') || normalized === 'oily') {
    return 'oily'
  }
  if (normalized.includes('normale') || normalized === 'normal') {
    return 'normal'
  }
  if (normalized.includes('sensible') || normalized === 'sensitive') {
    return 'sensitive'
  }
  if (normalized.includes('je ne sais pas') || normalized === 'unknown') {
    return 'unknown'
  }
  
  // Default fallback
  return 'unknown'
}

/**
 * Normalize budget values to canonical EN
 */
export function normalizeBudget(value: string): BudgetCanonical {
  const normalized = value.toLowerCase().trim()
  
  if (normalized.includes('<50') || normalized.includes('moins de 50')) {
    return 'under-50'
  }
  if (normalized.includes('50-100') || normalized.includes('50 à 100')) {
    return '50-100'
  }
  if (normalized.includes('100-200') || normalized.includes('100 à 200')) {
    return '100-200'
  }
  if (normalized.includes('>200') || normalized.includes('plus de 200')) {
    return 'over-200'
  }
  if (normalized.includes('no-limit') || normalized.includes('sans limite')) {
    return 'no-limit'
  }
  
  // Default fallback
  return '50-100'
}

/**
 * Normalize skin concerns to canonical EN
 */
export function normalizeSkinConcern(value: string): SkinConcernCanonical {
  const normalized = value.toLowerCase().trim()
  
  // FR mappings
  if (normalized.includes('rougeurs') || normalized === 'redness') {
    return 'redness'
  }
  if (normalized.includes('poils incarnés') || normalized.includes('ingrown_hairs')) {
    return 'ingrown_hairs'
  }
  if (normalized.includes('imperfections') || normalized === 'acne') {
    return 'acne'
  }
  if (normalized.includes('cicatrisation') || normalized === 'scarring') {
    return 'scarring'
  }
  if (normalized.includes('sécheresse') || normalized === 'dryness') {
    return 'dryness'
  }
  if (normalized.includes('brillance') || normalized === 'oiliness') {
    return 'oiliness'
  }
  if (normalized.includes('sensibilité') || normalized === 'sensitivity') {
    return 'sensitivity'
  }
  if (normalized.includes('taches') || normalized === 'dark_spots') {
    return 'dark_spots'
  }
  if (normalized.includes('rides') || normalized === 'wrinkles') {
    return 'wrinkles'
  }
  if (normalized.includes('pores') || normalized === 'pores') {
    return 'pores'
  }
  if (normalized.includes('points noirs') || normalized === 'blackheads') {
    return 'blackheads'
  }
  if (normalized.includes('texture') || normalized === 'uneven_texture') {
    return 'uneven_texture'
  }
  
  // Default fallback
  return 'acne'
}

/**
 * Generic function to convert any value to canonical if known
 */
export function toCanonical(value: string, type?: string): string {
  if (!value) return value
  
  switch (type) {
    case 'frequency':
      return normalizeFrequency(value)
    case 'timeOfDay':
      return normalizeTimeOfDay(value)
    case 'intensity':
      return normalizeIntensity(value)
    case 'gender':
      return normalizeGender(value)
    case 'skinType':
      return normalizeSkinType(value)
    case 'budget':
      return normalizeBudget(value)
    case 'concern':
      return normalizeSkinConcern(value)
    default:
      // Try to auto-detect and normalize
      const lowerValue = value.toLowerCase()
      
      // Frequency detection
      if (['quotidien', 'daily', 'hebdomadaire', 'weekly', 'ponctuel', 'as_needed', 'as-needed'].some(term => lowerValue.includes(term))) {
        return normalizeFrequency(value)
      }
      
      // Time detection
      if (['matin', 'morning', 'soir', 'evening', 'both'].some(term => lowerValue.includes(term))) {
        return normalizeTimeOfDay(value)
      }
      
      // Return as-is if no match
      return value
  }
}

/**
 * Normalize a complete routine-like object recursively
 */
export function normalizeRoutineLike(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeRoutineLike(item))
  }
  
  const normalized = { ...obj }
  
  // Normalize known fields
  if (normalized.frequency) {
    normalized.frequency = normalizeFrequency(normalized.frequency)
  }
  if (normalized.timeOfDay) {
    normalized.timeOfDay = normalizeTimeOfDay(normalized.timeOfDay)
  }
  if (normalized.intensity) {
    normalized.intensity = normalizeIntensity(normalized.intensity)
  }
  if (normalized.gender) {
    normalized.gender = normalizeGender(normalized.gender)
  }
  if (normalized.skinType) {
    normalized.skinType = normalizeSkinType(normalized.skinType)
  }
  if (normalized.budget) {
    normalized.budget = normalizeBudget(normalized.budget)
  }
  if (normalized.concern) {
    normalized.concern = normalizeSkinConcern(normalized.concern)
  }
  if (normalized.concerns && Array.isArray(normalized.concerns)) {
    normalized.concerns = normalized.concerns.map((concern: string) => normalizeSkinConcern(concern))
  }
  
  // Recursively normalize nested objects
  for (const key in normalized) {
    if (typeof normalized[key] === 'object' && normalized[key] !== null) {
      normalized[key] = normalizeRoutineLike(normalized[key])
    }
  }
  
  return normalized
}
