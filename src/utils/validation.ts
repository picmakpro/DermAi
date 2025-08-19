export const validateImage = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  const minWidth = 800
  const minHeight = 600

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image trop lourde. Maximum 5MB.' }
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (img.width < minWidth || img.height < minHeight) {
        resolve({ valid: false, error: `Résolution minimale: ${minWidth}x${minHeight}px` })
      } else {
        resolve({ valid: true })
      }
    }
    img.onerror = () => resolve({ valid: false, error: 'Image corrompue' })
    img.src = URL.createObjectURL(file)
  })
}

import type { UserProfile } from '@/types/api'

export const validateUserProfile = (profile: UserProfile): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!profile.age || profile.age < 13 || profile.age > 100) {
    errors.push('Âge invalide (13-100 ans)')
  }

  if (!profile.gender) {
    errors.push('Genre requis')
  }

  if (!profile.skinType) {
    errors.push('Type de peau requis')
  }

  return { valid: errors.length === 0, errors }
}
