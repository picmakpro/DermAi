/**
 * Test rapide pour vérifier que l'interface éducative gère bien les cas undefined
 */

import { PhaseTimingCalculator } from '@/services/educational/phaseTimingCalculator'
import type { BeautyAssessment, UnifiedRoutineStep } from '@/types'

// Test avec assessment undefined
console.log('=== TEST AVEC ASSESSMENT UNDEFINED ===')
try {
  const timingsUndefined = PhaseTimingCalculator.calculateCompleteTiming(
    undefined as any, // Simule le cas d'erreur
    []
  )
  console.log('✅ Durées avec assessment undefined:', {
    immediate: timingsUndefined.immediate.duration,
    adaptation: timingsUndefined.adaptation.duration,
    maintenance: timingsUndefined.maintenance.duration
  })
} catch (error) {
  console.error('❌ Erreur avec assessment undefined:', error)
}

// Test avec assessment null
console.log('\n=== TEST AVEC ASSESSMENT NULL ===')
try {
  const timingsNull = PhaseTimingCalculator.calculateCompleteTiming(
    null as any, // Simule le cas d'erreur
    []
  )
  console.log('✅ Durées avec assessment null:', {
    immediate: timingsNull.immediate.duration,
    adaptation: timingsNull.adaptation.duration,
    maintenance: timingsNull.maintenance.duration
  })
} catch (error) {
  console.error('❌ Erreur avec assessment null:', error)
}

// Test avec assessment vide
console.log('\n=== TEST AVEC ASSESSMENT VIDE ===')
try {
  const emptyAssessment: BeautyAssessment = {
    mainConcern: '',
    intensity: 'légère',
    concernedZones: [],
    visualFindings: [],
    expectedImprovement: ''
  }
  
  const timingsEmpty = PhaseTimingCalculator.calculateCompleteTiming(
    emptyAssessment,
    []
  )
  console.log('✅ Durées avec assessment vide:', {
    immediate: timingsEmpty.immediate.duration,
    adaptation: timingsEmpty.adaptation.duration,
    maintenance: timingsEmpty.maintenance.duration
  })
} catch (error) {
  console.error('❌ Erreur avec assessment vide:', error)
}

// Test avec assessment complet
console.log('\n=== TEST AVEC ASSESSMENT COMPLET ===')
try {
  const fullAssessment: BeautyAssessment = {
    mainConcern: 'Poils incarnés et rougeurs',
    intensity: 'modérée',
    concernedZones: ['menton', 'joues'],
    skinType: 'Peau mixte sensible',
    estimatedSkinAge: 32,
    visualFindings: ['Poils incarnés', 'Rougeurs localisées'],
    expectedImprovement: 'Amélioration en 4-6 semaines',
    zoneSpecific: [
      {
        zone: 'menton',
        problems: [
          { name: 'Poils incarnés', intensity: 'intense' },
          { name: 'Rougeurs', intensity: 'modérée' }
        ],
        description: 'Zone sensible'
      }
    ]
  }
  
  const mockRoutine: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      title: 'Nettoyage doux',
      targetArea: 'global',
      recommendedProducts: [],
      applicationAdvice: 'Matin et soir',
      treatmentType: 'cleansing',
      priority: 1,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'both',
      category: 'cleansing'
    }
  ]
  
  const timingsFull = PhaseTimingCalculator.calculateCompleteTiming(
    fullAssessment,
    mockRoutine
  )
  console.log('✅ Durées avec assessment complet:', {
    immediate: timingsFull.immediate.duration,
    adaptation: timingsFull.adaptation.duration,
    maintenance: timingsFull.maintenance.duration
  })
  
  console.log('✅ Objectifs éducatifs:', {
    immediate: timingsFull.immediate.objective.title,
    adaptation: timingsFull.adaptation.objective.title,
    maintenance: timingsFull.maintenance.objective.title
  })
} catch (error) {
  console.error('❌ Erreur avec assessment complet:', error)
}

export default {}
