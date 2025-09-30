/**
 * 🔧 NORMALISEUR GPT-5 → ZOD
 * 
 * GPT-5 génère du JSON valide mais avec des variations de format
 * qui ne passent pas la validation Zod stricte.
 * Ce module normalise les réponses GPT-5 pour qu'elles respectent le schéma.
 */

/**
 * Normalise une réponse JSON de GPT-5 pour la validation Zod
 */
export function normalizeGPT5DiagnosticResponse(data: any): any {
  if (!data || typeof data !== 'object') return data
  
  const normalized = { ...data }
  
  // 1️⃣ AJOUTER scores.skinAge si manquant (GPT-5 l'oublie parfois)
  if (normalized.scores && !normalized.scores.skinAge) {
    // Calculer à partir de skinAgeEstimate si disponible
    const estimate = normalized.skinAgeEstimate || 30
    normalized.scores.skinAge = {
      value: estimate,
      justification: `Âge cutané estimé à ${estimate} ans basé sur l'analyse globale`,
      confidence: 0.7,
      basedOn: ['analyse globale']
    }
  }
  
  // 2️⃣ NORMALISER zoneSpecificIssues
  if (normalized.zoneSpecificIssues && Array.isArray(normalized.zoneSpecificIssues)) {
    normalized.zoneSpecificIssues = normalized.zoneSpecificIssues.map((issue: any) => {
      const normalizedIssue = { ...issue }
      
      // Normaliser la zone (lowercase + mapping)
      if (normalizedIssue.zone) {
        normalizedIssue.zone = normalizeZone(normalizedIssue.zone)
      }
      
      // Normaliser l'intensité (féminin)
      if (normalizedIssue.intensity) {
        normalizedIssue.intensity = normalizeIntensity(normalizedIssue.intensity)
      }
      
      return normalizedIssue
    })
  }
  
  return normalized
}

/**
 * Normalise les noms de zones
 */
function normalizeZone(zone: string): string {
  const zoneStr = zone.trim()
  
  // Mapping des variations courantes
  const zoneMap: Record<string, string> = {
    // Casse
    'front': 'front',
    'Front': 'front',
    'FRONT': 'front',
    
    'joues': 'joues',
    'Joues': 'joues',
    'JOUES': 'joues',
    'joue': 'joues',
    'Joue': 'joues',
    
    'nez': 'nez',
    'Nez': 'nez',
    'NEZ': 'nez',
    
    'menton': 'menton',
    'Menton': 'menton',
    'MENTON': 'menton',
    'mâchoire': 'menton',
    'Mâchoire': 'menton',
    'mâchoire/menton': 'menton',
    'Mâchoire/Menton': 'menton',
    
    'contour-yeux': 'contour-yeux',
    'Contour-yeux': 'contour-yeux',
    'contour des yeux': 'contour-yeux',
    'Contour des yeux': 'contour-yeux',
    'contour yeux': 'contour-yeux',
    'yeux': 'contour-yeux',
    'Yeux': 'contour-yeux',
    
    'cou': 'cou',
    'Cou': 'cou',
    'COU': 'cou',
    
    'zone T': 'zone T',
    'Zone T': 'zone T',
    'zone-t': 'zone-t',
    'Zone-T': 'zone-t',
    't-zone': 't-zone',
    'T-zone': 't-zone',
    'T-Zone': 't-zone'
  }
  
  // Chercher dans le mapping
  if (zoneMap[zoneStr]) {
    return zoneMap[zoneStr]
  }
  
  // Fallback: lowercase simple
  return zoneStr.toLowerCase()
}

/**
 * Normalise l'intensité (féminin requis par Zod)
 */
function normalizeIntensity(intensity: string): string {
  const intensityStr = intensity.trim().toLowerCase()
  
  // Mapping masculin → féminin
  const intensityMap: Record<string, string> = {
    'léger': 'légère',
    'légère': 'légère',
    'legere': 'légère',
    'leger': 'légère',
    'faible': 'légère',
    
    'modéré': 'modérée',
    'modérée': 'modérée',
    'moderee': 'modérée',
    'modere': 'modérée',
    'moyen': 'modérée',
    'moyenne': 'modérée',
    
    'intense': 'intense',
    'intensif': 'intense',
    'fort': 'intense',
    'forte': 'intense',
    'sévère': 'intense',
    'severe': 'intense'
  }
  
  return intensityMap[intensityStr] || 'modérée' // Fallback safe
}

/**
 * Log les transformations appliquées (debug)
 */
export function logNormalizationChanges(original: any, normalized: any, requestId: string): void {
  const changes: string[] = []
  
  // Vérifier scores.skinAge
  if (!original.scores?.skinAge && normalized.scores?.skinAge) {
    changes.push('✅ scores.skinAge ajouté')
  }
  
  // Vérifier zones
  if (original.zoneSpecificIssues && normalized.zoneSpecificIssues) {
    original.zoneSpecificIssues.forEach((orig: any, idx: number) => {
      const norm = normalized.zoneSpecificIssues[idx]
      if (orig.zone !== norm.zone) {
        changes.push(`✅ zone[${idx}]: "${orig.zone}" → "${norm.zone}"`)
      }
      if (orig.intensity !== norm.intensity) {
        changes.push(`✅ intensity[${idx}]: "${orig.intensity}" → "${norm.intensity}"`)
      }
    })
  }
  
  if (changes.length > 0) {
    console.log(`[${requestId}] 🔧 Normalisation GPT-5:`, changes)
  }
}
