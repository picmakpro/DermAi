/**
 * 🧪 TESTS SPRINT 3 - PHASE DEPENDENCY CALCULATOR
 * 
 * Tests pour la logique de calcul des dépendances entre phases
 * avec durées personnalisées et critères de transition.
 */

import { PhaseDependencyCalculator } from '../PhaseDependencyCalculator'
import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'

describe('PhaseDependencyCalculator', () => {
  
  const mockRoutineSteps: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      title: 'Nettoyage doux',
      category: 'cleansing',
      phase: 'immediate',
      timeOfDay: 'both',
      frequency: 'daily',
      applicationAdvice: 'Masser délicatement',
      applicationDuration: '2 semaines',
      recommendedProducts: []
    },
    {
      stepNumber: 2,
      title: 'Traitement cicatrisant',
      category: 'healing',
      phase: 'immediate',
      timeOfDay: 'evening',
      frequency: 'daily',
      applicationAdvice: 'Application localisée',
      applicationDuration: 'Jusqu\'à cicatrisation',
      recommendedProducts: []
    },
    {
      stepNumber: 3,
      title: 'Sérum actif',
      category: 'treatment',
      phase: 'adaptation',
      timeOfDay: 'evening',
      frequency: 'progressive',
      applicationAdvice: 'Commencer 2x/semaine',
      zones: ['front', 'joues'],
      recommendedProducts: []
    }
  ]

  const mockUserProfile: BeautyAssessment = {
    age: 35,
    skinType: 'sensible',
    skinConcerns: ['acne', 'sensitivity']
  }

  describe('calculatePhaseDependencies', () => {
    
    test('should calculate basic phase dependencies', () => {
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies(
        mockRoutineSteps
      )
      
      expect(dependencies).toHaveProperty('immediate')
      expect(dependencies).toHaveProperty('adaptation')
      expect(dependencies).toHaveProperty('maintenance')
      
      expect(dependencies.immediate.startDay).toBe(0)
      expect(dependencies.immediate.duration).toMatch(/semaines?/)
      expect(dependencies.immediate.nextPhaseCondition).toBe('Stabilisation de la peau observée')
    })
    
    test('should adjust immediate phase duration based on urgent issues', () => {
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies(
        mockRoutineSteps
      )
      
      // Avec healing category, durée devrait être plus longue
      expect(dependencies.immediate.duration).toBe('3 semaines')
    })
    
    test('should adjust durations for sensitive skin', () => {
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies(
        mockRoutineSteps,
        mockUserProfile
      )
      
      // Peau sensible = +1 semaine
      expect(dependencies.immediate.duration).toBe('4 semaines')
    })
    
    test('should adjust durations for older users', () => {
      const olderProfile = { ...mockUserProfile, age: 55 }
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies(
        mockRoutineSteps,
        olderProfile
      )
      
      // Age > 50 = +1 semaine supplémentaire
      expect(dependencies.immediate.duration).toBe('5 semaines')
    })
    
    test('should calculate correct phase start days', () => {
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies(
        mockRoutineSteps,
        mockUserProfile
      )
      
      expect(dependencies.immediate.startDay).toBe(0)
      expect(dependencies.adaptation.startDay).toBe(28) // 4 semaines * 7 jours
      expect(dependencies.maintenance.startDay).toBeGreaterThan(28)
    })
    
    test('should set correct transition criteria', () => {
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies(
        mockRoutineSteps
      )
      
      expect(dependencies.immediate.transitionCriteria).toContain('Peau stabilisée')
      expect(dependencies.immediate.transitionCriteria).toContain('Cicatrisation visible')
      expect(dependencies.immediate.transitionCriteria).toContain('Routine de base établie')
      
      expect(dependencies.adaptation.transitionCriteria).toContain('Tolérance complète aux actifs')
      expect(dependencies.adaptation.transitionCriteria).toContain('Fréquence optimale atteinte')
    })
  })

  describe('getPhaseContext', () => {
    
    test('should generate correct phase context', () => {
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies(
        mockRoutineSteps
      )
      
      const context = PhaseDependencyCalculator.getPhaseContext(
        mockRoutineSteps[0],
        dependencies
      )
      
      expect(context).toHaveProperty('phaseWeeks')
      expect(context).toHaveProperty('previousPhaseCompleted')
      expect(context).toHaveProperty('userSkinType')
      expect(context).toHaveProperty('hasUrgentIssues')
      
      expect(context.phaseWeeks).toBeGreaterThan(0)
      expect(typeof context.previousPhaseCompleted).toBe('boolean')
    })
    
    test('should identify urgent issues correctly', () => {
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies(
        mockRoutineSteps
      )
      
      const healingContext = PhaseDependencyCalculator.getPhaseContext(
        mockRoutineSteps[1], // healing category
        dependencies
      )
      
      expect(healingContext.hasUrgentIssues).toBe(true)
      
      const cleansingContext = PhaseDependencyCalculator.getPhaseContext(
        mockRoutineSteps[0], // cleansing category
        dependencies
      )
      
      expect(cleansingContext.hasUrgentIssues).toBe(false)
    })
  })

  describe('calculatePhaseProgress', () => {
    
    test('should calculate progress correctly', () => {
      const phaseInfo = {
        startDay: 0,
        endDay: 14,
        duration: '2 semaines',
        nextPhaseCondition: 'Test',
        transitionCriteria: []
      }
      
      const progress0 = PhaseDependencyCalculator.calculatePhaseProgress(0, phaseInfo)
      const progress7 = PhaseDependencyCalculator.calculatePhaseProgress(7, phaseInfo)
      const progress14 = PhaseDependencyCalculator.calculatePhaseProgress(14, phaseInfo)
      
      expect(progress0).toBe(0)
      expect(progress7).toBe(50)
      expect(progress14).toBe(100)
    })
    
    test('should handle maintenance phase (no end day)', () => {
      const maintenancePhase = {
        startDay: 28,
        endDay: null,
        duration: 'Continu',
        nextPhaseCondition: null,
        transitionCriteria: []
      }
      
      const progress = PhaseDependencyCalculator.calculatePhaseProgress(35, maintenancePhase)
      expect(progress).toBe(0) // Maintenance = pas de progression
    })
    
    test('should cap progress at 100%', () => {
      const phaseInfo = {
        startDay: 0,
        endDay: 14,
        duration: '2 semaines',
        nextPhaseCondition: 'Test',
        transitionCriteria: []
      }
      
      const progress = PhaseDependencyCalculator.calculatePhaseProgress(20, phaseInfo)
      expect(progress).toBe(100)
    })
  })

  describe('edge cases', () => {
    
    test('should handle empty routine', () => {
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies([])
      
      expect(dependencies.immediate.duration).toBe('2 semaines') // Durée par défaut
      expect(dependencies.immediate.transitionCriteria).toEqual(['Peau stabilisée'])
    })
    
    test('should handle routine without user profile', () => {
      const dependencies = PhaseDependencyCalculator.calculatePhaseDependencies(
        mockRoutineSteps
      )
      
      expect(dependencies).toBeDefined()
      expect(dependencies.immediate.duration).toBeDefined()
    })
    
    test('should handle unknown phases gracefully', () => {
      const unknownPhaseStep = {
        ...mockRoutineSteps[0],
        phase: 'unknown' as any
      }
      
      expect(() => {
        PhaseDependencyCalculator.calculatePhaseDependencies([unknownPhaseStep])
      }).not.toThrow()
    })
  })
})

