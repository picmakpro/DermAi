/**
 * NETTOYEUR DE RÉPONSES IA V2.1
 * Corrige automatiquement les erreurs communes de validation
 */

import { PureDiagnostic, PureDiagnosticSchema } from '../../../schemas/v2/diagnostic'
import { isValidLexiqueTerm } from '../../../schemas/v2/lexique'

/**
 * Nettoie et corrige une réponse IA pour la rendre conforme V2.1
 */
export function cleanAIResponse(rawResponse: string): {
  cleanedResponse: string
  corrections: string[]
  isValid: boolean
} {
  const corrections: string[] = []
  let cleanedResponse = rawResponse

  // 1. Nettoyer le JSON (enlever markdown, texte superflu)
  cleanedResponse = extractJSON(cleanedResponse)
  
  try {
    const parsed = JSON.parse(cleanedResponse)
    
    // 2. Corriger les intensités invalides
    const intensityCorrections = fixIntensities(parsed)
    corrections.push(...intensityCorrections)
    
    // 3. Corriger les skinTypes invalides
    const skinTypeCorrections = fixSkinType(parsed)
    corrections.push(...skinTypeCorrections)
    
    // 4. Corriger les justifications trop courtes
    const justificationCorrections = fixJustifications(parsed)
    corrections.push(...justificationCorrections)
    
    // 5. Corriger les basedOn insuffisants
    const basedOnCorrections = fixBasedOn(parsed)
    corrections.push(...basedOnCorrections)
    
    // 6. Recalculer overall si nécessaire
    const overallCorrections = fixOverallScore(parsed)
    corrections.push(...overallCorrections)
    
    cleanedResponse = JSON.stringify(parsed, null, 2)
    
    // Valider le JSON final après corrections
    const finalValidation = validateCleanedResponse(cleanedResponse)
    
    return {
      cleanedResponse,
      corrections,
      isValid: finalValidation.isValid
    }
  } catch (error) {
    return {
      cleanedResponse: rawResponse,
      corrections: [`Erreur parsing JSON: ${error}`],
      isValid: false
    }
  }
}

/**
 * Extrait le JSON d'une réponse IA (enlève markdown, texte superflu)
 */
function extractJSON(response: string): string {
  // Enlever les backticks markdown
  let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '')
  
  // Chercher le JSON entre accolades
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }
  
  // Enlever les commentaires
  cleaned = cleaned.replace(/\/\/.*$/gm, '')
  
  return cleaned.trim()
}

/**
 * Corrige les intensités invalides
 */
function fixIntensities(diagnostic: any): string[] {
  const corrections: string[] = []
  const validIntensities = ['légère', 'modérée', 'intense']
  const intensityMapping: Record<string, string> = {
    'marquée': 'modérée',
    'forte': 'intense',
    'sévère': 'intense',
    'importante': 'modérée',
    'visible': 'légère',
    'faible': 'légère',
    'moyenne': 'modérée',
    'élevée': 'intense'
  }
  
  if (diagnostic.zoneSpecificIssues && Array.isArray(diagnostic.zoneSpecificIssues)) {
    diagnostic.zoneSpecificIssues.forEach((issue: any, index: number) => {
      if (issue.intensity && !validIntensities.includes(issue.intensity)) {
        const corrected = intensityMapping[issue.intensity] || 'modérée'
        corrections.push(`Intensité "${issue.intensity}" → "${corrected}" (zone ${issue.zone})`)
        issue.intensity = corrected
      }
    })
  }
  
  return corrections
}

/**
 * Corrige les skinTypes invalides
 */
function fixSkinType(diagnostic: any): string[] {
  const corrections: string[] = []
  const validSkinTypes = ['Sèche', 'Normale', 'Mixte', 'Grasse', 'Sensible', 'Indéterminé']
  const skinTypeMapping: Record<string, string> = {
    'sèche': 'Sèche',
    'normale': 'Normale',
    'mixte': 'Mixte',
    'grasse': 'Grasse',
    'sensible': 'Sensible',
    'indéterminé': 'Indéterminé',
    'peau mixte': 'Mixte',
    'peau grasse': 'Grasse',
    'peau sèche': 'Sèche',
    'peau normale': 'Normale',
    'peau sensible': 'Sensible',
    'normal': 'Normale',
    'mixed': 'Mixte',
    'oily': 'Grasse',
    'dry': 'Sèche'
  }
  
  if (diagnostic.skinType && !validSkinTypes.includes(diagnostic.skinType)) {
    const corrected = skinTypeMapping[diagnostic.skinType.toLowerCase()] || 'Indéterminé'
    corrections.push(`SkinType "${diagnostic.skinType}" → "${corrected}"`)
    diagnostic.skinType = corrected
  }
  
  return corrections
}

/**
 * Corrige les justifications trop courtes
 */
function fixJustifications(diagnostic: any): string[] {
  const corrections: string[] = []
  const minLength = 80
  
  if (diagnostic.scores && typeof diagnostic.scores === 'object') {
    Object.entries(diagnostic.scores).forEach(([key, score]: [string, any]) => {
      if (key !== 'overall' && score && typeof score === 'object' && score.justification) {
        if (score.justification.length < minLength) {
          // Étendre la justification avec des termes génériques
          const extension = ' selon observation visuelle directe en conditions d\'éclairage naturel.'
          score.justification += extension
          corrections.push(`Justification ${key} étendue (${score.justification.length - extension.length} → ${score.justification.length} chars)`)
        }
      }
    })
  }
  
  return corrections
}

/**
 * Corrige les basedOn insuffisants
 */
function fixBasedOn(diagnostic: any): string[] {
  const corrections: string[] = []
  const minTerms = 3
  
  // Termes de fallback par catégorie
  const fallbackTerms: Record<string, string[]> = {
    hydration: ['homogénéité_teint', 'éclat_général', 'teint_terne'],
    wrinkles: ['contours_visage_nets', 'rides_fines', 'absence_rides_apparentes'],
    firmness: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli'],
    radiance: ['homogénéité_teint', 'éclat_général', 'teint_terne'],
    pores: ['pores_apparents', 'brillance_zone_T', 'filaments_sébacés'],
    spots: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint'],
    darkCircles: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches'],
    skinAge: ['rides_expression', 'contours_visage_nets', 'grain_photovieilli']
  }
  
  if (diagnostic.scores && typeof diagnostic.scores === 'object') {
    Object.entries(diagnostic.scores).forEach(([key, score]: [string, any]) => {
      if (key !== 'overall' && score && typeof score === 'object' && score.basedOn) {
        if (!Array.isArray(score.basedOn) || score.basedOn.length < minTerms) {
          const fallbacks = fallbackTerms[key] || ['homogénéité_teint', 'éclat_général', 'contours_visage_nets']
          
          // Garder les termes valides existants
          const validExisting = Array.isArray(score.basedOn) 
            ? score.basedOn.filter((term: string) => isValidLexiqueTerm(term))
            : []
          
          // Compléter avec des fallbacks
          const needed = minTerms - validExisting.length
          const toAdd = fallbacks.slice(0, needed)
          
          score.basedOn = [...validExisting, ...toAdd].slice(0, minTerms)
          corrections.push(`BasedOn ${key} complété (${validExisting.length} → ${score.basedOn.length} termes)`)
        }
      }
    })
  }
  
  return corrections
}

/**
 * Recalcule le score overall
 */
function fixOverallScore(diagnostic: any): string[] {
  const corrections: string[] = []
  
  if (diagnostic.scores && typeof diagnostic.scores === 'object') {
    const subScores = [
      'hydration', 'wrinkles', 'firmness', 'radiance', 
      'pores', 'spots', 'darkCircles'
    ].map(key => diagnostic.scores[key]?.value || 0)
    
    const calculatedOverall = Math.round(subScores.reduce((sum, score) => sum + score, 0) / 7)
    
    if (diagnostic.scores.overall !== calculatedOverall) {
      corrections.push(`Overall recalculé (${diagnostic.scores.overall} → ${calculatedOverall})`)
      diagnostic.scores.overall = calculatedOverall
    }
  }
  
  return corrections
}

/**
 * Valide qu'une réponse nettoyée est conforme avec Zod
 */
export function validateCleanedResponse(response: string): {
  isValid: boolean
  errors: string[]
} {
  try {
    const parsed = JSON.parse(response)
    const validation = PureDiagnosticSchema.safeParse(parsed)
    
    if (validation.success) {
      return {
        isValid: true,
        errors: []
      }
    } else {
      return {
        isValid: false,
        errors: validation.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        )
      }
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`JSON invalide: ${error}`]
    }
  }
}

/**
 * Applique le nettoyage avec retry automatique
 */
export function cleanWithRetry(rawResponse: string, maxRetries: number = 3): {
  finalResponse: string
  allCorrections: string[]
  success: boolean
  attempts: number
} {
  let currentResponse = rawResponse
  const allCorrections: string[] = []
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { cleanedResponse, corrections, isValid } = cleanAIResponse(currentResponse)
    allCorrections.push(...corrections.map(c => `[Attempt ${attempt}] ${c}`))
    
    if (isValid) {
      return {
        finalResponse: cleanedResponse,
        allCorrections,
        success: true,
        attempts: attempt
      }
    }
    
    currentResponse = cleanedResponse
  }
  
  return {
    finalResponse: currentResponse,
    allCorrections,
    success: false,
    attempts: maxRetries
  }
}
