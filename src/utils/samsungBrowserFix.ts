/**
 * Fixes spécifiques pour navigateur Samsung et autres navigateurs mobiles
 * Problème: Accès aux propriétés d'objets undefined causant des crashes
 */

/**
 * Accès sécurisé aux propriétés d'objets pour navigateur Samsung
 */
export function safeGet<T, K extends keyof T>(obj: T | undefined | null, key: K): T[K] | undefined {
  try {
    return obj?.[key]
  } catch (error) {
    console.warn(`🔧 Samsung browser fix: Accès sécurisé à ${String(key)}`, error)
    return undefined
  }
}

/**
 * Accès sécurisé aux propriétés imbriquées
 */
export function safeGetNested<T>(obj: any, path: string, defaultValue?: T): T | undefined {
  try {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current == null) return defaultValue
      current = current[key]
    }
    
    return current ?? defaultValue
  } catch (error) {
    console.warn(`🔧 Samsung browser fix: Accès sécurisé à ${path}`, error)
    return defaultValue
  }
}

/**
 * Normalise les données utilisateur pour éviter les erreurs Samsung
 */
export function normalizeUserProfile(userProfile: any) {
  if (!userProfile || typeof userProfile !== 'object') {
    return {
      age: 'Non spécifié',
      gender: 'Non spécifié', 
      skinType: 'À déterminer'
    }
  }

  return {
    age: userProfile.age ?? 'Non spécifié',
    gender: userProfile.gender ?? 'Non spécifié',
    skinType: userProfile.skinType ?? 'À déterminer'
  }
}

/**
 * Normalise les données d'analyse pour éviter les erreurs
 */
export function normalizeBeautyAssessment(assessment: any) {
  if (!assessment || typeof assessment !== 'object') {
    return {
      skinType: 'À déterminer',
      mainConcern: 'Analyse en cours',
      overview: [],
      zoneSpecific: []
    }
  }

  return {
    skinType: assessment.skinType ?? assessment.mainConcern ?? 'À déterminer',
    mainConcern: assessment.mainConcern ?? 'Analyse en cours',
    overview: Array.isArray(assessment.overview) ? assessment.overview : [],
    zoneSpecific: Array.isArray(assessment.zoneSpecific) ? assessment.zoneSpecific : []
  }
}

/**
 * Détecte si on est sur navigateur Samsung
 */
export function isSamsungBrowser(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  return userAgent.includes('samsung') || 
         userAgent.includes('samsungbrowser') ||
         (userAgent.includes('chrome') && userAgent.includes('wv')) // Samsung WebView
}

/**
 * Wrapper sécurisé pour les templates strings avec objets
 */
export function safeTemplate(template: string, data: Record<string, any>): string {
  try {
    return template.replace(/\${(\w+(?:\.\w+)*)}/g, (match, path) => {
      const value = safeGetNested(data, path, 'N/A')
      return String(value)
    })
  } catch (error) {
    console.warn('🔧 Samsung browser fix: Template string sécurisé', error)
    return template
  }
}

/**
 * Log spécifique Samsung pour debugging
 */
export function samsungLog(message: string, data?: any) {
  if (isSamsungBrowser()) {
    console.log(`🔧 Samsung Browser: ${message}`, data)
  }
}
