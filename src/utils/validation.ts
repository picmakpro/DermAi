export const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  // Types supportés après conversion (HEIC/HEIF seront convertis en JPEG)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  const minWidth = 400 // Réduit pour mobile
  const minHeight = 400 // Réduit pour mobile

  // Vérification du type après conversion
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Format non supporté. Utilisez JPG, PNG ou WebP.` }
  }

  // Vérification de la taille
  if (file.size > maxSize) {
    return { valid: false, error: 'Image trop lourde. Maximum 5MB.' }
  }

  // Validation asynchrone des dimensions
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      // Nettoyage de l'URL temporaire
      URL.revokeObjectURL(img.src)
      
      if (img.width < minWidth || img.height < minHeight) {
        resolve({ 
          valid: false, 
          error: `Résolution trop faible: ${img.width}x${img.height}px. Minimum ${minWidth}x${minHeight}px` 
        })
      } else {
        resolve({ valid: true })
      }
    }
    
    img.onerror = () => {
      // Nettoyage de l'URL temporaire
      URL.revokeObjectURL(img.src)
      resolve({ valid: false, error: 'Image corrompue ou illisible' })
    }
    
    // Créer une URL temporaire pour le test
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
