export const APP_NAME = 'DermAI V2'
export const APP_DESCRIPTION = 'Revolutionary AI dermatological diagnosis'

export const PHOTO_TYPES = {
  'face-frontal': 'Full frontal face',
  'close-up-zone': 'Close-up problem zone',
  'profile-left': 'Left profile',
  'profile-right': 'Right profile',
  'texture-macro': 'Macro skin texture'
} as const

// value used in logic; keep as-is (French)
export const SKIN_TYPES = [
  'Sèche',
  'Normale', 
  'Mixte',
  'Grasse',
  'Sensible',
  'Je ne sais pas'
] as const

// value used in logic; keep as-is (French)
export const GENDER_OPTIONS = [
  'Homme',
  'Femme', 
  'Autre',
  'Ne souhaite pas préciser'
] as const

// value used in logic; keep as-is (French)
export const BUDGET_RANGES = [
  '< 50€',
  '50-100€',
  '100-200€',
  '> 200€',
  'Pas de limite'
] as const

export const MAX_PHOTOS = 5
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MIN_IMAGE_RESOLUTION = { width: 800, height: 600 }
