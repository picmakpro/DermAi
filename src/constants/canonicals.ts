/**
 * Canonical EN-only enums for DermAI V2
 * These are the single source of truth for all logic, comparisons, and stored values
 */

// Frequency canonical values
export const FREQUENCY_CANONICAL = ['daily', 'weekly', 'as_needed'] as const
export type FrequencyCanonical = typeof FREQUENCY_CANONICAL[number]

// Time of day canonical values
export const TIME_OF_DAY_CANONICAL = ['morning', 'evening', 'morning_and_evening'] as const
export type TimeOfDayCanonical = typeof TIME_OF_DAY_CANONICAL[number]

// Intensity canonical values
export const INTENSITY_CANONICAL = ['mild', 'moderate', 'intense', 'severe'] as const
export type IntensityCanonical = typeof INTENSITY_CANONICAL[number]

// Gender canonical values
export const GENDER_CANONICAL = ['male', 'female', 'prefer_not_to_say'] as const
export type GenderCanonical = typeof GENDER_CANONICAL[number]

// Skin type canonical values
export const SKIN_TYPE_CANONICAL = ['dry', 'combination', 'oily', 'normal', 'sensitive', 'unknown'] as const
export type SkinTypeCanonical = typeof SKIN_TYPE_CANONICAL[number]

// Budget canonical values
export const BUDGET_CANONICAL = ['under-50', '50-100', '100-200', 'over-200', 'no-limit'] as const
export type BudgetCanonical = typeof BUDGET_CANONICAL[number]

// Common skin concerns canonical values
export const SKIN_CONCERNS_CANONICAL = [
  'acne',
  'redness',
  'dryness',
  'oiliness',
  'sensitivity',
  'dark_spots',
  'wrinkles',
  'pores',
  'blackheads',
  'ingrown_hairs',
  'scarring',
  'uneven_texture'
] as const
export type SkinConcernCanonical = typeof SKIN_CONCERNS_CANONICAL[number]

// All canonical types for easy import
export type CanonicalValue = 
  | FrequencyCanonical 
  | TimeOfDayCanonical 
  | IntensityCanonical 
  | GenderCanonical 
  | SkinTypeCanonical 
  | BudgetCanonical 
  | SkinConcernCanonical

