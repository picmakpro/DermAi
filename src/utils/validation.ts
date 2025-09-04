export const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  // Supported types after conversion (HEIC/HEIF will be converted to JPEG)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  const minWidth = 400 // Reduced for mobile
  const minHeight = 400 // Reduced for mobile

  // Type verification after conversion
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Unsupported format. Use JPG, PNG or WebP.` }
  }

  // Size verification
  if (file.size > maxSize) {
    return { valid: false, error: 'Image too large. Maximum 5MB.' }
  }

  // Asynchronous dimension validation
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      // Clean up temporary URL
      URL.revokeObjectURL(img.src)
      
      if (img.width < minWidth || img.height < minHeight) {
        resolve({ 
          valid: false, 
          error: `Resolution too low: ${img.width}x${img.height}px. Minimum ${minWidth}x${minHeight}px` 
        })
      } else {
        resolve({ valid: true })
      }
    }
    
    img.onerror = () => {
      // Clean up temporary URL
      URL.revokeObjectURL(img.src)
      resolve({ valid: false, error: 'Corrupted or unreadable image' })
    }
    
    // Create temporary URL for testing
    img.src = URL.createObjectURL(file)
  })
}

import type { UserProfile } from '@/types/api'

export const validateUserProfile = (profile: UserProfile): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!profile.age || profile.age < 13 || profile.age > 100) {
    errors.push('Invalid age (13-100 years)')
  }

  if (!profile.gender) {
    errors.push('Gender required')
  }

  if (!profile.skinType) {
    errors.push('Skin type required')
  }

  return { valid: errors.length === 0, errors }
}
