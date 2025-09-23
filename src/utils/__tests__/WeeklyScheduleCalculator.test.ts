/**
 * 🧪 TESTS UNITAIRES - WEEKLY SCHEDULE CALCULATOR
 * 
 * Tests complets pour le calculateur de planning hebdomadaire
 * avec validation des jours suggérés et conseils d'espacement.
 * 
 * @version 1.0 - Sprint 4 Amélioration Routines
 */

import { WeeklyScheduleCalculator } from '../WeeklyScheduleCalculator'
import type { UnifiedRoutineStep } from '@/types'

describe('WeeklyScheduleCalculator', () => {
  
  // Mock data pour les tests
  const mockExfoliationStep: UnifiedRoutineStep = {
    stepNumber: 1,
    title: 'Exfoliation douce',
    category: 'exfoliation',
    timeOfDay: 'evening',
    phase: 'adaptation',
    applicationAdvice: 'Appliquer en mouvements circulaires',
    applicationDuration: '2x par semaine',
    frequency: 'weekly',
    zones: ['visage'],
    recommendedProducts: []
  }
  
  const mockTreatmentStep: UnifiedRoutineStep = {
    stepNumber: 2,
    title: 'Traitement anti-âge',
    category: 'treatment',
    timeOfDay: 'evening',
    phase: 'adaptation',
    applicationAdvice: 'Appliquer progressivement',
    targetArea: 'specific',
    zones: ['rides', 'cernes'],
    recommendedProducts: []
  }
  
  const mockMaskStep: UnifiedRoutineStep = {
    stepNumber: 3,
    title: 'Masque hydratant',
    category: 'mask',
    timeOfDay: 'evening',
    phase: 'maintenance',
    applicationAdvice: 'Laisser poser 15 minutes',
    recommendedProducts: []
  }

  describe('calculateWeeklySchedule', () => {
    
    test('should calculate exfoliation schedule correctly', () => {
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(mockExfoliationStep)
      
      expect(schedule.frequency).toBe('2x par semaine') // Light intensity par défaut
      expect(schedule.suggestedDays).toEqual(['Mardi', 'Vendredi'])
      expect(schedule.spacingAdvice).toBe('Espacer de 2-3 jours minimum')
      expect(schedule.timeOfDay).toBe('evening')
      expect(schedule.warnings).toContain('Éviter avant exposition solaire')
    })
    
    test('should calculate treatment schedule for spot treatment', () => {
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(mockTreatmentStep)
      
      expect(schedule.frequency).toBe('3-4x par semaine')
      expect(schedule.suggestedDays).toEqual(['Lundi', 'Mercredi', 'Vendredi', 'Dimanche'])
      expect(schedule.spacingAdvice).toBe('Application ciblée selon besoin')
      expect(schedule.warnings).toContain('Surveiller tolérance cutanée')
    })
    
    test('should calculate mask schedule correctly', () => {
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(mockMaskStep)
      
      expect(schedule.frequency).toBe('1-2x par semaine')
      expect(schedule.suggestedDays).toEqual(['Mercredi', 'Samedi'])
      expect(schedule.spacingAdvice).toBe('Espacer de 3-4 jours minimum')
      expect(schedule.timeOfDay).toBe('evening')
    })
    
    test('should return default schedule for unknown category', () => {
      const unknownStep: UnifiedRoutineStep = {
        ...mockExfoliationStep,
        category: 'unknown' as any
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(unknownStep)
      
      expect(schedule.frequency).toBe('1x par semaine')
      expect(schedule.suggestedDays).toEqual(['Dimanche'])
      expect(schedule.spacingAdvice).toBe('Même jour chaque semaine pour créer une habitude')
    })
  })

  describe('getIntensity', () => {
    
    test('should detect light intensity', () => {
      const lightStep: UnifiedRoutineStep = {
        ...mockExfoliationStep,
        zones: ['joues']
      }
      
      // Utiliser une méthode publique pour tester l'intensité indirectement
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(lightStep)
      expect(schedule.frequency).toBe('2x par semaine') // Light exfoliation
    })
    
    test('should detect moderate intensity', () => {
      const moderateStep: UnifiedRoutineStep = {
        ...mockExfoliationStep,
        zones: ['front', 'joues'], // 2 zones seulement pour moderate
        targetArea: 'specific'
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(moderateStep)
      expect(schedule.frequency).toBe('1-2x par semaine') // Moderate exfoliation
      expect(schedule.suggestedDays).toEqual(['Mercredi', 'Dimanche'])
    })
    
    test('should detect intense intensity', () => {
      const intenseStep: UnifiedRoutineStep = {
        ...mockExfoliationStep,
        zones: ['front', 'joues', 'menton', 'nez'],
        targetArea: 'specific',
        applicationAdvice: 'Appliquer progressivement selon tolérance'
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(intenseStep)
      expect(schedule.frequency).toBe('1x par semaine maximum') // Intense exfoliation
    })
  })

  describe('getExfoliationSchedule', () => {
    
    test('should provide light exfoliation schedule', () => {
      const lightStep: UnifiedRoutineStep = {
        ...mockExfoliationStep,
        zones: ['joues']
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(lightStep)
      
      expect(schedule.frequency).toBe('2x par semaine')
      expect(schedule.suggestedDays).toEqual(['Mardi', 'Vendredi'])
      expect(schedule.spacingAdvice).toBe('Espacer de 2-3 jours minimum')
      expect(schedule.warnings).toContain('Éviter avant exposition solaire')
    })
    
    test('should provide intense exfoliation schedule', () => {
      const intenseStep: UnifiedRoutineStep = {
        ...mockExfoliationStep,
        zones: ['front', 'joues', 'menton', 'nez'],
        targetArea: 'specific',
        applicationAdvice: 'Appliquer progressivement selon tolérance'
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(intenseStep)
      
      expect(schedule.frequency).toBe('1x par semaine maximum')
      expect(schedule.suggestedDays).toEqual(['Dimanche'])
      expect(schedule.spacingAdvice).toBe('Une fois par semaine seulement')
      expect(schedule.warnings).toContain('Peau sensible : 1x toutes les 2 semaines')
    })
  })

  describe('getTreatmentSchedule', () => {
    
    test('should handle spot treatment correctly', () => {
      const spotTreatment: UnifiedRoutineStep = {
        ...mockTreatmentStep,
        targetArea: 'specific',
        timeOfDay: 'morning'
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(spotTreatment)
      
      expect(schedule.frequency).toBe('3-4x par semaine')
      expect(schedule.timeOfDay).toBe('morning')
      expect(schedule.warnings).toContain('Surveiller tolérance cutanée')
    })
    
    test('should handle general treatment correctly', () => {
      const generalTreatment: UnifiedRoutineStep = {
        ...mockTreatmentStep,
        targetArea: 'general'
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(generalTreatment)
      
      expect(schedule.frequency).toBe('2-3x par semaine')
      expect(schedule.suggestedDays).toEqual(['Lundi', 'Mercredi', 'Vendredi'])
      expect(schedule.warnings).toContain('Introduire progressivement')
    })
  })

  describe('getMaskSchedule', () => {
    
    test('should handle hydrating mask', () => {
      const hydratingMask: UnifiedRoutineStep = {
        ...mockMaskStep,
        applicationAdvice: 'Masque hydratant intensif' // Contient 'hydrat'
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(hydratingMask)
      
      expect(schedule.frequency).toBe('2-3x par semaine')
      expect(schedule.suggestedDays).toEqual(['Mardi', 'Jeudi', 'Samedi'])
      expect(schedule.warnings).toContain('Peut être utilisé quotidiennement si besoin')
    })
    
    test('should handle purifying mask', () => {
      const purifyingMask: UnifiedRoutineStep = {
        ...mockMaskStep,
        applicationAdvice: 'Masque purifiant'
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(purifyingMask)
      
      expect(schedule.frequency).toBe('1-2x par semaine')
      expect(schedule.suggestedDays).toEqual(['Mercredi', 'Samedi'])
      expect(schedule.warnings).toContain('Éviter si peau irritée')
    })
  })

  describe('generateSpacingAdvice', () => {
    
    test('should generate advice for 2x frequency', () => {
      const advice = WeeklyScheduleCalculator.generateSpacingAdvice('2x par semaine', 'exfoliation')
      expect(advice).toBe('Espacer de 2-3 jours minimum entre les applications')
    })
    
    test('should generate advice for 3x frequency', () => {
      const advice = WeeklyScheduleCalculator.generateSpacingAdvice('3x par semaine', 'treatment')
      expect(advice).toBe('Laisser au moins 1 jour de repos entre les applications')
    })
    
    test('should generate advice for exfoliation intense', () => {
      const advice = WeeklyScheduleCalculator.generateSpacingAdvice('1x par semaine', 'exfoliation', 'intense')
      expect(advice).toBe('Une seule fois par semaine, toujours le même jour')
    })
    
    test('should generate default advice', () => {
      const advice = WeeklyScheduleCalculator.generateSpacingAdvice('1x par semaine', 'unknown')
      expect(advice).toBe('Adapter selon la tolérance de votre peau')
    })
  })

  describe('suggestOptimalDays', () => {
    
    test('should suggest days for exfoliation', () => {
      const days = WeeklyScheduleCalculator.suggestOptimalDays('2x par semaine', 'exfoliation', 'evening')
      expect(days).toEqual(['Mercredi', 'Dimanche'])
    })
    
    test('should suggest days for treatment', () => {
      const days = WeeklyScheduleCalculator.suggestOptimalDays('3x par semaine', 'treatment', 'evening')
      expect(days).toEqual(['Lundi', 'Mercredi', 'Vendredi'])
    })
    
    test('should suggest single day for weekly', () => {
      const days = WeeklyScheduleCalculator.suggestOptimalDays('1x par semaine', 'mask', 'evening')
      expect(days).toEqual(['Dimanche'])
    })
    
    test('should handle high frequency', () => {
      const days = WeeklyScheduleCalculator.suggestOptimalDays('4x par semaine', 'treatment', 'evening')
      expect(days).toEqual(['Lundi', 'Mercredi', 'Vendredi', 'Dimanche'])
    })
  })

  describe('extractFrequencyNumber', () => {
    
    test('should extract number from frequency string', () => {
      // Test via suggestOptimalDays qui utilise extractFrequencyNumber
      const days1 = WeeklyScheduleCalculator.suggestOptimalDays('2x par semaine', 'treatment', 'evening')
      expect(days1).toHaveLength(2)
      
      const days3 = WeeklyScheduleCalculator.suggestOptimalDays('3x par semaine', 'treatment', 'evening')
      expect(days3).toHaveLength(3)
    })
    
    test('should handle special cases', () => {
      const daysDaily = WeeklyScheduleCalculator.suggestOptimalDays('quotidien', 'treatment', 'morning')
      expect(daysDaily).toHaveLength(7)
      
      const days12 = WeeklyScheduleCalculator.suggestOptimalDays('1-2x par semaine', 'exfoliation', 'evening')
      expect(days12).toHaveLength(2)
    })
  })

  describe('generateContextualWarnings', () => {
    
    test('should generate exfoliation warnings', () => {
      const warnings = WeeklyScheduleCalculator.generateContextualWarnings(mockExfoliationStep, 'moderate')
      
      expect(warnings).toContain('Toujours appliquer le soir')
    })
    
    test('should generate intense exfoliation warnings', () => {
      const warnings = WeeklyScheduleCalculator.generateContextualWarnings(mockExfoliationStep, 'intense')
      
      expect(warnings).toContain('Toujours appliquer le soir')
      expect(warnings).toContain('Peau sensible : commencer toutes les 2 semaines')
    })
    
    test('should generate treatment warnings', () => {
      const treatmentWithManyZones: UnifiedRoutineStep = {
        ...mockTreatmentStep,
        zones: ['rides', 'cernes', 'taches'] // 3 zones pour déclencher l'avertissement
      }
      
      const warnings = WeeklyScheduleCalculator.generateContextualWarnings(treatmentWithManyZones, 'moderate')
      
      expect(warnings).toContain('Surveiller les signes d\'irritation')
      expect(warnings).toContain('Commencer par une zone puis étendre')
    })
    
    test('should generate morning application warnings', () => {
      const morningStep: UnifiedRoutineStep = {
        ...mockTreatmentStep,
        timeOfDay: 'morning'
      }
      
      const warnings = WeeklyScheduleCalculator.generateContextualWarnings(morningStep, 'light')
      
      expect(warnings).toContain('Toujours suivre d\'une protection solaire')
    })
    
    test('should generate progressive frequency warnings', () => {
      const progressiveStep: UnifiedRoutineStep = {
        ...mockTreatmentStep,
        frequency: 'progressive'
      }
      
      const warnings = WeeklyScheduleCalculator.generateContextualWarnings(progressiveStep, 'moderate')
      
      expect(warnings).toContain('Augmenter progressivement selon tolérance')
    })
  })

  describe('edge cases', () => {
    
    test('should handle step without zones', () => {
      const stepWithoutZones: UnifiedRoutineStep = {
        ...mockExfoliationStep,
        zones: undefined
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(stepWithoutZones)
      expect(schedule).toBeDefined()
      expect(schedule.frequency).toBeTruthy()
    })
    
    test('should handle step without timeOfDay', () => {
      const stepWithoutTime: UnifiedRoutineStep = {
        ...mockTreatmentStep,
        timeOfDay: undefined as any
      }
      
      const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(stepWithoutTime)
      expect(schedule.timeOfDay).toBe('evening') // Default fallback
    })
    
    test('should handle empty applicationAdvice', () => {
      const stepWithoutAdvice: UnifiedRoutineStep = {
        ...mockExfoliationStep,
        applicationAdvice: ''
      }
      
      const warnings = WeeklyScheduleCalculator.generateContextualWarnings(stepWithoutAdvice, 'light')
      expect(warnings).toBeDefined()
      expect(Array.isArray(warnings)).toBe(true)
    })
  })
})
