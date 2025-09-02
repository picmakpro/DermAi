/**
 * Vérifications de compatibilité navigateur pour DermAI
 */

export interface BrowserCompatibility {
  isSupported: boolean
  missingFeatures: string[]
  warnings: string[]
}

/**
 * Vérifie si le navigateur supporte toutes les fonctionnalités requises
 */
export function checkBrowserCompatibility(): BrowserCompatibility {
  const missingFeatures: string[] = []
  const warnings: string[] = []

  // Vérifications côté client uniquement
  if (typeof window === 'undefined') {
    return { isSupported: true, missingFeatures: [], warnings: [] }
  }

  try {
    // 1. IndexedDB (stockage photos)
    if (!window.indexedDB) {
      missingFeatures.push('IndexedDB (stockage local des photos)')
    }

    // 2. SessionStorage (métadonnées)
    if (!window.sessionStorage) {
      missingFeatures.push('SessionStorage (données temporaires)')
    }

    // 3. FileReader API (lecture photos)
    if (!window.FileReader) {
      missingFeatures.push('FileReader (lecture des fichiers)')
    }

    // 4. Canvas API (compression images)
    const canvas = document.createElement('canvas')
    if (!canvas.getContext || !canvas.getContext('2d')) {
      missingFeatures.push('Canvas 2D (compression images)')
    }

    // 5. Fetch API (appels réseau)
    if (!window.fetch) {
      missingFeatures.push('Fetch API (communication serveur)')
    }

    // 6. Promise (asynchrone)
    if (!window.Promise) {
      missingFeatures.push('Promises (traitement asynchrone)')
    }

    // 7. URL API (partage liens)
    if (!window.URL) {
      missingFeatures.push('URL API (partage de liens)')
    }

    // Warnings pour des fonctionnalités optionnelles
    
    // WebP support (compression optimale)
    const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    if (!webpSupport) {
      warnings.push('WebP non supporté (compression moins efficace)')
    }

    // Modern JavaScript features
    if (!Array.prototype.includes) {
      warnings.push('JavaScript ES2016+ partiellement supporté')
    }

    // TouchEvent (mobile)
    if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
      warnings.push('Interface optimisée pour desktop uniquement')
    }

  } catch (error) {
    console.error('Erreur vérification compatibilité:', error)
    missingFeatures.push('Erreur lors de la vérification')
  }

  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures,
    warnings
  }
}

/**
 * Affiche un message d'incompatibilité si nécessaire
 */
export function showCompatibilityWarningIfNeeded(): boolean {
  const compat = checkBrowserCompatibility()
  
  if (!compat.isSupported) {
    const message = `Votre navigateur ne supporte pas certaines fonctionnalités requises :\n\n${compat.missingFeatures.join('\n')}\n\nVeuillez utiliser un navigateur moderne (Chrome, Firefox, Safari ou Edge récent).`
    
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message)
    }
    
    console.error('🚫 Navigateur incompatible:', compat)
    return false
  }

  if (compat.warnings.length > 0) {
    console.warn('⚠️ Avertissements navigateur:', compat.warnings)
  }

  return true
}

/**
 * Détecte le type de navigateur
 */
export function detectBrowser(): string {
  if (typeof window === 'undefined') return 'Server'
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'Chrome'
  if (userAgent.includes('firefox')) return 'Firefox'
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari'
  if (userAgent.includes('edg')) return 'Edge'
  if (userAgent.includes('opera')) return 'Opera'
  
  return 'Unknown'
}

/**
 * Détecte si on est sur mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  )
}
