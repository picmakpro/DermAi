/**
 * TESTS PHASE TIMING CALCULATOR - SPRINT 3 QUALITÉ DERMAI V2
 */

import { PhaseTimingCalculator } from '../phaseTimingCalculator'
import type { BeautyAssessment, UnifiedRoutineStep } from '@/types'

describe('PhaseTimingCalculator - Sprint 3 Qualité', () => {
  
  const mockAssessmentBasic: BeautyAssessment = {
    skinType: 'Peau normale',
    mainConcern: 'Hydratation',
    intensity: 'légère',
    concernedZones: ['visage'],
    specificities: [],
    visualFindings: ['Peau légèrement déshydratée'],
    overview: ['Peau normale'],
    zoneSpecific: [
      { zone: 'visage', problems: [{ name: 'Déshydratation', intensity: 'légère' }], description: 'Test' }
    ],
    expectedImprovement: 'Amélioration en 2-4 semaines',
    improvementTimeEstimate: '2-3 mois',
    estimatedSkinAge: 30
  }
  
  describe('⏱️ Tests Calcul Durée Phase Immédiate', () => {
    test('Durée basique pour profil simple', () => {
      const duration = PhaseTimingCalculator.calculateImmediateDuration(mockAssessmentBasic)
      expect(duration).toMatch(/^\d+-\d+ semaines?$/)
    })
    
    test('Facteur âge - peau mature', () => {
      const assessmentMature = { ...mockAssessmentBasic, estimatedSkinAge: 65 }
      const durationMature = PhaseTimingCalculator.calculateImmediateDuration(assessmentMature)
      expect(durationMature).toBeDefined()
    })
  })
  
  describe('🔄 Tests Calcul Durée Phase Adaptation', () => {
    test('Durée basique pour traitements simples', () => {
      const mockSteps: UnifiedRoutineStep[] = []
      const duration = PhaseTimingCalculator.calculateAdaptationDuration(mockSteps)
      expect(duration).toMatch(/^\d+-\d+ semaines?$/)
    })
  })
  
  describe('🔄 Tests Calcul Durée Phase Maintenance', () => {
    test('Durée maintenance toujours continue', () => {
      const duration = PhaseTimingCalculator.calculateMaintenanceDuration()
      expect(duration).toBe('En continu')
    })
  })
})