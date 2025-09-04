/**
 * Exemples concrets du système éducatif DermAI
 * Illustre comment les durées personnalisées s'adaptent selon le profil utilisateur
 */

import { PhaseTimingCalculator } from '../phaseTimingCalculator'
import type { BeautyAssessment, UnifiedRoutineStep } from '@/types'

// EXEMPLE 1: Utilisateur jeune avec problèmes légers
export const youngUserProfile: BeautyAssessment = {
  mainConcern: 'Imperfections légères zone T',
  intensity: 'mild',
  concernedZones: ['front', 'nez'],
  skinType: 'Peau mixte',
  estimatedSkinAge: 24,
  visualFindings: [
    'Quelques comédons sur le front',
    'Léger excès de sébum zone T',
    'Texture globalement lisse'
  ],
  expectedImprovement: 'Amélioration rapide en 2-3 semaines',
  zoneSpecific: [
    {
      zone: 'front',
      problems: [{ name: 'Comédons', intensity: 'mild' }],
      description: 'Quelques points noirs ponctuels'
    }
  ]
}

export const youngUserRoutine: UnifiedRoutineStep[] = [
  {
    stepNumber: 1,
    title: 'Nettoyage doux quotidien',
    targetArea: 'global',
    zones: [],
    recommendedProducts: [],
    applicationAdvice: 'Matin et soir, massage circulaire doux',
    treatmentType: 'cleansing',
    priority: 10,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'both',
    category: 'cleansing'
  },
  {
    stepNumber: 2,
    title: 'Traitement imperfections — Zone : front',
    targetArea: 'specific',
    zones: ['front'],
    recommendedProducts: [],
    applicationAdvice: 'Le soir, en couche fine sur les zones concernées',
    treatmentType: 'treatment',
    priority: 8,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'evening',
    category: 'treatment',
    applicationDuration: 'Jusqu\'à réduction notable des comédons'
  }
]

// EXEMPLE 2: Utilisateur mature avec problèmes complexes
export const matureUserProfile: BeautyAssessment = {
  mainConcern: 'Vieillissement cutané avec taches pigmentaires',
  intensity: 'moderate',
  concernedZones: ['visage complet', 'contour des yeux'],
  skinType: 'Peau sèche sensible',
  estimatedSkinAge: 58,
  visualFindings: [
    'Rides d\'expression marquées',
    'Taches pigmentaires sur les pommettes',
    'Perte de fermeté générale',
    'Sécheresse importante'
  ],
  expectedImprovement: 'Amélioration progressive en 3-4 mois',
  zoneSpecific: [
    {
      zone: 'contour des yeux',
      problems: [
        { name: 'Rides fines', intensity: 'moderate' },
        { name: 'Cernes', intensity: 'mild' }
      ],
      description: 'Zone délicate avec signes de fatigue'
    },
    {
      zone: 'joues',
      problems: [
        { name: 'Taches pigmentaires', intensity: 'severe' },
        { name: 'Perte de fermeté', intensity: 'moderate' }
      ],
      description: 'Hyperpigmentation solaire ancienne'
    }
  ]
}

export const matureUserRoutine: UnifiedRoutineStep[] = [
  {
    stepNumber: 1,
    title: 'Nettoyage très doux',
    targetArea: 'global',
    zones: [],
    recommendedProducts: [],
    applicationAdvice: 'Huile démaquillante puis nettoyant crème',
    treatmentType: 'cleansing',
    priority: 10,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'both',
    category: 'cleansing'
  },
  {
    stepNumber: 2,
    title: 'Réparation barrière cutanée',
    targetArea: 'global',
    zones: [],
    recommendedProducts: [],
    applicationAdvice: 'Sérum réparateur matin et soir',
    treatmentType: 'treatment',
    priority: 9,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'both',
    category: 'treatment',
    applicationDuration: 'Jusqu\'à apaisement de la sensibilité'
  },
  {
    stepNumber: 3,
    title: 'Rétinol progressif — Zones : visage',
    targetArea: 'global',
    zones: ['visage'],
    recommendedProducts: [],
    applicationAdvice: 'Commencer 1x/semaine le soir, augmenter progressivement',
    treatmentType: 'treatment',
    priority: 7,
    phase: 'adaptation',
    frequency: 'progressive',
    timeOfDay: 'evening',
    category: 'treatment'
  }
]

// EXEMPLE 3: Utilisateur avec problèmes de rasage
export const shavingIssuesProfile: BeautyAssessment = {
  mainConcern: 'Poils incarnés et irritations post-rasage',
  intensity: 'severe',
  concernedZones: ['menton', 'cou', 'joues basses'],
  skinType: 'Peau mixte sensible',
  estimatedSkinAge: 32,
  visualFindings: [
    'Poils incarnés multiples',
    'Inflammations post-rasage',
    'Hyperpigmentation post-inflammatoire',
    'Sensibilité cutanée élevée'
  ],
  expectedImprovement: 'Amélioration notable en 6-8 semaines avec technique adaptée',
  zoneSpecific: [
    {
      zone: 'menton',
      problems: [
        { name: 'Poils incarnés', intensity: 'severe' },
        { name: 'Rougeurs', intensity: 'severe' }
      ],
      description: 'Zone de rasage la plus problématique'
    },
    {
      zone: 'cou',
      problems: [
        { name: 'Poils incarnés', intensity: 'moderate' },
        { name: 'Cicatrisation', intensity: 'moderate' }
      ],
      description: 'Inflammations récurrentes'
    }
  ]
}

export const shavingRoutine: UnifiedRoutineStep[] = [
  {
    stepNumber: 1,
    title: 'Traitement poils incarnés — Zones : menton, cou',
    targetArea: 'specific',
    zones: ['menton', 'cou'],
    recommendedProducts: [],
    applicationAdvice: 'Matin et soir, après nettoyage doux',
    treatmentType: 'treatment',
    priority: 10,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'both',
    category: 'treatment',
    applicationDuration: 'Jusqu\'à cicatrisation des inflammations'
  },
  {
    stepNumber: 2,
    title: 'Exfoliation douce préventive',
    targetArea: 'specific',
    zones: ['zone de rasage'],
    recommendedProducts: [],
    applicationAdvice: '1-2x/semaine, jamais le jour du rasage',
    treatmentType: 'treatment',
    priority: 6,
    phase: 'adaptation',
    frequency: 'weekly',
    timeOfDay: 'evening',
    category: 'exfoliation'
  }
]

// Fonction de démonstration des calculs
export function demonstrateEducationalSystem() {
  console.log('=== SYSTÈME ÉDUCATIF DERMAI - EXEMPLES ===\n')
  
  // Exemple 1: Utilisateur jeune
  const youngTimings = PhaseTimingCalculator.calculateCompleteTiming(
    youngUserProfile, 
    youngUserRoutine
  )
  
  console.log('👦 UTILISATEUR JEUNE (24 ans, problèmes légers):')
  console.log(`   Phase Immédiate: ${youngTimings.immediate.duration}`)
  console.log(`   Objectif: ${youngTimings.immediate.objective.title}`)
  console.log(`   Phase Adaptation: ${youngTimings.adaptation.duration}`)
  console.log(`   Phase Maintenance: ${youngTimings.maintenance.duration}\n`)
  
  // Exemple 2: Utilisateur mature
  const matureTimings = PhaseTimingCalculator.calculateCompleteTiming(
    matureUserProfile,
    matureUserRoutine
  )
  
  console.log('👩 UTILISATRICE MATURE (58 ans, problèmes complexes):')
  console.log(`   Phase Immédiate: ${matureTimings.immediate.duration}`)
  console.log(`   Objectif: ${matureTimings.immediate.objective.title}`)
  console.log(`   Phase Adaptation: ${matureTimings.adaptation.duration}`)
  console.log(`   Phase Maintenance: ${matureTimings.maintenance.duration}\n`)
  
  // Exemple 3: Problèmes de rasage
  const shavingTimings = PhaseTimingCalculator.calculateCompleteTiming(
    shavingIssuesProfile,
    shavingRoutine
  )
  
  console.log('🪒 PROBLÈMES DE RASAGE (32 ans, intensité élevée):')
  console.log(`   Phase Immédiate: ${shavingTimings.immediate.duration}`)
  console.log(`   Objectif: ${shavingTimings.immediate.objective.title}`)
  console.log(`   Phase Adaptation: ${shavingTimings.adaptation.duration}`)
  console.log(`   Phase Maintenance: ${shavingTimings.maintenance.duration}\n`)
  
  // Démonstration badges temporels
  console.log('🏷️ BADGES TEMPORELS GÉNÉRÉS:')
  youngUserRoutine.forEach(step => {
    const badge = PhaseTimingCalculator.generateTimingBadge(step)
    console.log(`   "${step.title}" → ${badge}`)
  })
  
  console.log()
  shavingRoutine.forEach(step => {
    const badge = PhaseTimingCalculator.generateTimingBadge(step)
    const criteria = PhaseTimingCalculator.getVisualCriteria(step)
    console.log(`   "${step.title}" → ${badge}`)
    if (criteria) {
      console.log(`      Critère visuel: ${criteria.observation}`)
    }
  })
}

// Comparaison avant/après implémentation
export const beforeAfterComparison = {
  before: {
    phaseLabels: [
      'Phase Immédiate (5)',
      'Phase Adaptation (3)', 
      'Phase Maintenance (2)'
    ],
    timing: 'Durées fixes et arbitraires',
    education: 'Aucune explication du "pourquoi"',
    badges: 'Simples: "Quotidien", "Hebdomadaire"',
    userAutonomy: 'Faible - suit aveuglément'
  },
  
  after: {
    phaseLabels: [
      'Phase Immédiate (1-2 semaines)',
      'Phase Adaptation (4-6 semaines)',
      'Phase Maintenance (En continu)'
    ],
    timing: 'Durées personnalisées selon diagnostic',
    education: 'Objectifs clairs + info-bulles dermatologiques',
    badges: 'Enrichis: "👁️ Jusqu\'à cicatrisation", "📈 Progressif"',
    userAutonomy: 'Élevée - comprend la logique'
  }
}

const educationalExamples = {
  youngUserProfile,
  youngUserRoutine,
  matureUserProfile, 
  matureUserRoutine,
  shavingIssuesProfile,
  shavingRoutine,
  demonstrateEducationalSystem,
  beforeAfterComparison
}

export default educationalExamples
