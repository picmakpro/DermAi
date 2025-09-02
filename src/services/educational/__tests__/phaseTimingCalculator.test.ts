/**
 * Tests unitaires pour PhaseTimingCalculator
 */

import { PhaseTimingCalculator } from '../phaseTimingCalculator'
import type { BeautyAssessment, UnifiedRoutineStep } from '@/types'

describe('PhaseTimingCalculator', () => {
  
  const mockBeautyAssessment: BeautyAssessment = {
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
        description: 'Zone sensible avec inflammations'
      },
      {
        zone: 'joues',
        problems: [
          { name: 'Pores dilatés', intensity: 'légère' }
        ],
        description: 'Texture irrégulière'
      }
    ]
  }
  
  const mockRoutineSteps: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      title: 'Traitement des poils incarnés — Zone : menton',
      targetArea: 'specific',
      zones: ['menton'],
      recommendedProducts: [],
      applicationAdvice: 'Appliquer le soir',
      treatmentType: 'treatment',
      priority: 1,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'evening',
      category: 'treatment'
    },
    {
      stepNumber: 2,
      title: 'Soin rétinol progressif',
      targetArea: 'global',
      recommendedProducts: [],
      applicationAdvice: 'Commencer 1x/semaine',
      treatmentType: 'treatment',
      priority: 2,
      phase: 'adaptation',
      frequency: 'progressive',
      timeOfDay: 'evening',
      category: 'treatment'
    }
  ]

  describe('calculateImmediateDuration', () => {
    it('devrait calculer la durée de base pour un profil standard', () => {
      const assessment: BeautyAssessment = {
        mainConcern: 'Hydratation',
        intensity: 'légère',
        concernedZones: ['visage'],
        visualFindings: [],
        expectedImprovement: 'Rapide',
        estimatedSkinAge: 25
      }
      
      const duration = PhaseTimingCalculator.calculateImmediateDuration(assessment)
      expect(duration).toBe('1-2 semaines')
    })
    
    it('devrait prolonger pour peau mature', () => {
      const assessment: BeautyAssessment = {
        ...mockBeautyAssessment,
        estimatedSkinAge: 55
      }
      
      const duration = PhaseTimingCalculator.calculateImmediateDuration(assessment)
      expect(duration).toBe('2-3 semaines')
    })
    
    it('devrait prolonger pour peau sensible', () => {
      const duration = PhaseTimingCalculator.calculateImmediateDuration(mockBeautyAssessment)
      expect(duration).toBe('2-3 semaines')
    })
  })

  describe('calculateAdaptationDuration', () => {
    it('devrait calculer la durée selon la complexité des traitements', () => {
      const duration = PhaseTimingCalculator.calculateAdaptationDuration(mockRoutineSteps)
      expect(duration).toBe('4-6 semaines')
    })
    
    it('devrait retourner la durée de base pour traitements simples', () => {
      const simpleSteps: UnifiedRoutineStep[] = [
        {
          ...mockRoutineSteps[0],
          title: 'Hydratation simple',
          frequency: 'daily'
        }
      ]
      
      const duration = PhaseTimingCalculator.calculateAdaptationDuration(simpleSteps)
      expect(duration).toBe('3-4 semaines')
    })
  })

  describe('generateTimingBadge', () => {
    it('devrait générer badge pour traitement avec critères visuels', () => {
      const step: UnifiedRoutineStep = {
        ...mockRoutineSteps[0],
        applicationDuration: 'Jusqu\'à cicatrisation visible'
      }
      
      const badge = PhaseTimingCalculator.generateTimingBadge(step)
      expect(badge).toBe('👁️ Jusqu\'à cicatrisation')
    })
    
    it('devrait générer badge quotidien pour soin de base', () => {
      const step: UnifiedRoutineStep = {
        ...mockRoutineSteps[0],
        frequency: 'daily',
        timeOfDay: 'morning'
      }
      
      const badge = PhaseTimingCalculator.generateTimingBadge(step)
      expect(badge).toBe('⏰ Quotidien matin')
    })
    
    it('devrait générer badge progressif', () => {
      const badge = PhaseTimingCalculator.generateTimingBadge(mockRoutineSteps[1])
      expect(badge).toBe('📈 Progressif')
    })
  })

  describe('getVisualCriteria', () => {
    it('devrait retourner critères pour poils incarnés', () => {
      const criteria = PhaseTimingCalculator.getVisualCriteria(mockRoutineSteps[0])
      
      expect(criteria).toEqual({
        observation: 'Vérifier absence de rougeurs et gonflements',
        estimatedDays: '7-14 jours',
        nextStep: 'Continuer prévention rasage'
      })
    })
    
    it('devrait retourner null pour traitements sans critères spécifiques', () => {
      const step: UnifiedRoutineStep = {
        ...mockRoutineSteps[0],
        title: 'Hydratation globale'
      }
      
      const criteria = PhaseTimingCalculator.getVisualCriteria(step)
      expect(criteria).toBeNull()
    })
  })

  describe('getPhaseObjectives', () => {
    it('devrait retourner objectifs pour toutes les phases', () => {
      const objectives = PhaseTimingCalculator.getPhaseObjectives()
      
      expect(objectives).toHaveProperty('immediate')
      expect(objectives).toHaveProperty('adaptation') 
      expect(objectives).toHaveProperty('maintenance')
      
      expect(objectives.immediate.title).toContain('Calmer et protéger')
      expect(objectives.adaptation.title).toContain('Introduire progressivement')
      expect(objectives.maintenance.title).toContain('Maintenir les résultats')
    })
  })

  describe('calculateCompleteTiming', () => {
    it('devrait calculer timing complet pour une routine', () => {
      const timings = PhaseTimingCalculator.calculateCompleteTiming(
        mockBeautyAssessment, 
        mockRoutineSteps
      )
      
      expect(timings).toHaveProperty('immediate')
      expect(timings).toHaveProperty('adaptation')
      expect(timings).toHaveProperty('maintenance')
      
      expect(timings.immediate.duration).toBe('2-3 semaines')
      expect(timings.adaptation.duration).toBe('4-6 semaines')
      expect(timings.maintenance.duration).toBe('En continu')
      
      expect(timings.immediate.educationalTips).toHaveLength(3)
      expect(timings.adaptation.educationalTips).toHaveLength(3)
      expect(timings.maintenance.educationalTips).toHaveLength(3)
    })
  })
})
