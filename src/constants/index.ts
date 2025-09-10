export const APP_NAME = 'DermAI V2'
export const APP_DESCRIPTION = 'Revolutionary AI dermatological analysis'

export const PHOTO_TYPES = {
  'face-frontal': 'Full frontal face',
  'close-up-zone': 'Close-up problem zone',
  'profile-left': 'Left profile',
  'profile-right': 'Right profile',
  'texture-macro': 'Macro skin texture'
} as const

// canonical EN values used in logic (also shown in UI)
export const SKIN_TYPES = [
  'Dry',
  'Normal',
  'Combination',
  'Oily',
  'Sensitive',
  'Unknown'
] as const

// canonical EN values used in logic (also shown in UI)
export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Other',
  'Prefer-not-to-say' // hyphenated to match canonical code
] as const

// canonical EN values used in logic (also shown in UI)
// These button labels map cleanly via normalizeBudget:
//  - '<50€'  -> under-50
//  - '50-100€' -> 50-100
//  - '100-200€' -> 100-200
//  - '>200€' -> over-200
//  - 'No-limit' -> no-limit (hyphenated so it passes through)
export const BUDGET_RANGES = [
  '<50€',
  '50-100€',
  '100-200€',
  '>200€',
  'No-limit'
] as const

export const MAX_PHOTOS = 5
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MIN_IMAGE_RESOLUTION = { width: 800, height: 600 }
