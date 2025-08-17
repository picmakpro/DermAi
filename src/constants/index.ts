export const APP_NAME = 'DermAI V2'
export const APP_DESCRIPTION = 'Diagnostic dermatologique IA révolutionnaire'

export const PHOTO_TYPES = {
  'face-frontal': 'Face complète frontale',
  'close-up-zone': 'Close-up zone problématique',
  'profile-left': 'Profil gauche',
  'profile-right': 'Profil droit',
  'texture-macro': 'Texture peau macro'
} as const

export const SKIN_TYPES = [
  'Sèche',
  'Normale', 
  'Mixte',
  'Grasse',
  'Sensible',
  'Je ne sais pas'
] as const

export const GENDER_OPTIONS = [
  'Homme',
  'Femme', 
  'Autre',
  'Ne souhaite pas préciser'
] as const

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
