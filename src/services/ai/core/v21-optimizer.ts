/**
 * OPTIMISEUR V2.1 - UTILITAIRES POUR PROMPT CEO OPTIMISÉ
 * Fonctions d'aide pour maximiser la précision et la conformité du diagnostic V2.1
 */

import { PureDiagnostic } from '../../../schemas/v2/diagnostic'
import { isValidLexiqueTerm, isValidProblemField, LexiqueTerm } from '../../../schemas/v2/lexique'

/**
 * Valide la conformité d'un diagnostic aux exigences V2.1
 */
export function validateV21Compliance(diagnostic: PureDiagnostic): {
  isCompliant: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  // Validation des justifications (≥80 chars)
  Object.entries(diagnostic.scores).forEach(([key, score]) => {
    if (key !== 'overall' && typeof score === 'object') {
      if (score.justification.length < 80) {
        issues.push(`${key}: justification trop courte (${score.justification.length} < 80 chars)`)
        suggestions.push(`${key}: ajouter localisation précise et indices visuels concrets`)
      }
    }
  })

  // Validation basedOn (≥3 termes du lexique)
  Object.entries(diagnostic.scores).forEach(([key, score]) => {
    if (key !== 'overall' && typeof score === 'object') {
      if (score.basedOn.length < 3) {
        issues.push(`${key}: basedOn insuffisant (${score.basedOn.length} < 3 termes)`)
        suggestions.push(`${key}: ajouter termes du lexique standardisé`)
      }
      
      // Vérification que tous les termes sont dans le lexique
      score.basedOn.forEach(term => {
        if (!isValidLexiqueTerm(term)) {
          issues.push(`${key}: terme "${term}" non standardisé dans basedOn`)
          suggestions.push(`${key}: utiliser uniquement les termes du lexique V2.1`)
        }
      })
    }
  })

  // Validation generalObservation (150-400 chars)
  if (diagnostic.generalObservation.length < 150) {
    issues.push(`generalObservation trop courte (${diagnostic.generalObservation.length} < 150 chars)`)
    suggestions.push('generalObservation: développer avec termes du lexique standardisé')
  }
  if (diagnostic.generalObservation.length > 400) {
    issues.push(`generalObservation trop longue (${diagnostic.generalObservation.length} > 400 chars)`)
    suggestions.push('generalObservation: condenser en gardant les éléments essentiels')
  }

  // Validation zoneSpecificIssues
  diagnostic.zoneSpecificIssues.forEach((issue, index) => {
    if (issue.description.length < 80) {
      issues.push(`zoneSpecificIssues[${index}]: description trop courte (${issue.description.length} < 80 chars)`)
      suggestions.push(`zoneSpecificIssues[${index}]: ajouter localisation et termes du lexique`)
    }
    
    if (!isValidProblemField(issue.problem)) {
      issues.push(`zoneSpecificIssues[${index}]: problem "${issue.problem}" non conforme`)
      suggestions.push(`zoneSpecificIssues[${index}]: utiliser lexique ou format "autre: description"`)
    }
  })

  // Validation cohérence overall (moyenne des 7 sous-scores)
  const subScores = [
    diagnostic.scores.hydration.value,
    diagnostic.scores.wrinkles.value,
    diagnostic.scores.firmness.value,
    diagnostic.scores.radiance.value,
    diagnostic.scores.pores.value,
    diagnostic.scores.spots.value,
    diagnostic.scores.darkCircles.value
  ]
  const expectedOverall = Math.round(subScores.reduce((sum, score) => sum + score, 0) / 7)
  
  if (Math.abs(diagnostic.scores.overall - expectedOverall) > 1) {
    issues.push(`overall incohérent: ${diagnostic.scores.overall} vs ${expectedOverall} attendu`)
    suggestions.push('overall: recalculer comme moyenne simple des 7 sous-scores')
  }

  return {
    isCompliant: issues.length === 0,
    issues,
    suggestions
  }
}

/**
 * Suggestions de termes du lexique par catégorie pour aider l'IA
 */
export const LEXIQUE_SUGGESTIONS = {
  hydration: [
    'déshydratation_visuelle',
    'sécheresse_squames',
    'barrière_fragile_apparente',
    'teint_terne',
    'homogénéité_teint',
    'réactivité_visible'
  ],
  sebum_pores: [
    'brillance_zone_T',
    'brillance_excessive',
    'pores_apparents',
    'pores_obstrués',
    'filaments_sébacés',
    'points_noirs',
    'points_blancs'
  ],
  imperfections: [
    'lésions_inflammatoires',
    'marques_post_imperfections',
    'comédons_fermés',
    'distribution_mandibulaire'
  ],
  pigmentation: [
    'hyperpigmentation_diffuse',
    'PIH',
    'PIE',
    'dyschromies',
    'éphélides_visibles'
  ],
  rougeurs: [
    'rougeurs_diffuses',
    'rougeurs_localisées',
    'rougeurs_réactives',
    'télangiectasies_visibles'
  ],
  vieillissement: [
    'rides_expression',
    'rides_fines',
    'rides_marquees',
    'perte_fermeté_apparente',
    'grain_photovieilli',
    'contours_visage_nets'
  ],
  cernes: [
    'cernes_pigmentés',
    'cernes_vasculaires',
    'ombre_sous_orbitaire',
    'poches',
    'rides_pattes_oeil'
  ],
  limites: [
    'flou_image',
    'éclairage_difficile',
    'angle_limité',
    'maquillage_probable',
    'résolution_insuffisante'
  ]
} as const

/**
 * Calibration des scores selon les directives V2.1
 */
export const SCORE_CALIBRATION = {
  pores: {
    excellent: { range: [80, 100], description: 'peu visibles' },
    bon: { range: [50, 70], description: 'visibles' },
    problematique: { range: [0, 40], description: 'très apparents/obstrués' }
  },
  spots: {
    excellent: { range: [80, 100], description: 'rares' },
    bon: { range: [50, 70], description: 'quelques' },
    problematique: { range: [0, 40], description: 'nombreux/étendus' }
  },
  radiance: {
    excellent: { range: [80, 100], description: 'uniforme' },
    bon: { range: [50, 70], description: 'correct' },
    problematique: { range: [0, 45], description: 'terne/irrégulier' }
  },
  darkCircles: {
    excellent: { range: [80, 100], description: 'faibles' },
    bon: { range: [50, 70], description: 'modérés' },
    problematique: { range: [0, 45], description: 'marqués' }
  }
} as const

/**
 * Génère des suggestions d'amélioration pour un diagnostic
 */
export function generateV21Suggestions(diagnostic: PureDiagnostic): {
  lexiqueImprovements: string[]
  calibrationWarnings: string[]
  structuralIssues: string[]
} {
  const lexiqueImprovements: string[] = []
  const calibrationWarnings: string[] = []
  const structuralIssues: string[] = []

  // Analyse des termes basedOn pour suggestions d'amélioration
  Object.entries(diagnostic.scores).forEach(([key, score]) => {
    if (key !== 'overall' && typeof score === 'object') {
      const uniqueTerms = new Set(score.basedOn)
      if (uniqueTerms.size < score.basedOn.length) {
        lexiqueImprovements.push(`${key}: éviter les doublons dans basedOn`)
      }
      
      // Vérification cohérence termes avec critère
      if (key === 'pores' && !score.basedOn.some(term => term.includes('pores'))) {
        lexiqueImprovements.push(`${key}: inclure des termes spécifiques aux pores`)
      }
      if (key === 'hydration' && !score.basedOn.some(term => 
        ['hydratation', 'sécheresse', 'barrière', 'teint'].some(cat => term.includes(cat))
      )) {
        lexiqueImprovements.push(`${key}: inclure des termes d'hydratation`)
      }
    }
  })

  // Vérification calibration
  const poresScore = diagnostic.scores.pores.value
  if (poresScore > 70 && diagnostic.zoneSpecificIssues.some(issue => 
    issue.problem.includes('pores') && issue.intensity !== 'légère'
  )) {
    calibrationWarnings.push('Incohérence: score pores élevé mais problème pores modéré/intense')
  }

  // Vérification structure
  if (diagnostic.zoneSpecificIssues.length === 0) {
    structuralIssues.push('Aucun problème de zone identifié - vérifier si normal')
  }

  return {
    lexiqueImprovements,
    calibrationWarnings,
    structuralIssues
  }
}

/**
 * Calcule le score overall selon la formule V2.1
 */
export function calculateOverallScore(scores: PureDiagnostic['scores']): number {
  const subScores = [
    scores.hydration.value,
    scores.wrinkles.value,
    scores.firmness.value,
    scores.radiance.value,
    scores.pores.value,
    scores.spots.value,
    scores.darkCircles.value
  ]
  
  return Math.round(subScores.reduce((sum, score) => sum + score, 0) / 7)
}

/**
 * Valide qu'une confidence est au format V2.1 (max 2 décimales)
 */
export function isValidConfidence(confidence: number): boolean {
  return Number(confidence.toFixed(2)) === confidence && confidence >= 0 && confidence <= 1
}

/**
 * Formate une confidence au format V2.1
 */
export function formatConfidence(confidence: number): number {
  return Number(Math.max(0, Math.min(1, confidence)).toFixed(2))
}

