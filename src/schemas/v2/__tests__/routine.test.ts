import { describe, it, expect } from '@jest/globals'
import {
  RoutineStepSchema,
  EnrichedRoutineStepSchema,
  PersonalizedRoutineSchema,
  EnrichedPersonalizedRoutineSchema,
  validateAndEnrichRoutine,
  type RoutineStep,
  type EnrichedRoutineStep,
  type PersonalizedRoutine,
  type EnrichedPersonalizedRoutine
} from '../routine'

describe('Routine Schema Validation V2', () => {
  // Fixtures de test
  const legacyRoutineStep: RoutineStep = {
    stepNumber: 1,
    careType: 'nettoyage',
    timing: 'matin',
    targetProblem: 'Impuretés quotidiennes',
    targetZones: ['visage entier'],
    progressiveIntroduction: null,
    restrictions: []
  }

  const enrichedRoutineStep: EnrichedRoutineStep = {
    stepNumber: 1,
    careType: 'nettoyage',
    timing: 'matin',
    targetProblem: 'Impuretés quotidiennes',
    targetZones: ['visage entier'],
    progressiveIntroduction: null,
    restrictions: [],
    isTemporary: false,
    introduceFromWeek: 0,
    applicationDuration: 'continu',
    frequency: 'daily',
    displayTitle: 'Nettoyage matinal',
    targetBenefit: 'Purifier et préparer'
  }

  const legacyRoutine: PersonalizedRoutine = {
    phases: {
      immediate: {
        duration: '1-2 semaines',
        objective: 'Stabiliser votre peau et traiter les problèmes urgents identifiés',
        steps: [legacyRoutineStep]
      },
      adaptation: {
        duration: '4-6 semaines',
        objective: 'Introduire des actifs plus puissants progressivement',
        steps: [{ ...legacyRoutineStep, stepNumber: 2, careType: 'traitement' }]
      },
      maintenance: {
        duration: 'Continu',
        objective: 'Maintenir les acquis et prévenir les rechutes',
        steps: [{ ...legacyRoutineStep, stepNumber: 3, careType: 'protection' }]
      }
    },
    globalAdvice: [
      'Respectez l\'ordre d\'application des soins',
      'Soyez patient, les résultats apparaissent progressivement'
    ],
    dermatologicalRationale: 'Cette routine respecte le cycle cellulaire de 28 jours et s\'adapte à votre peau mixte avec pores dilatés.'
  }

  const enrichedRoutine: EnrichedPersonalizedRoutine = {
    phases: {
      immediate: {
        duration: '1-2 semaines',
        objective: 'Stabiliser votre peau et traiter les problèmes urgents identifiés',
        steps: [enrichedRoutineStep]
      },
      adaptation: {
        duration: '4-6 semaines',
        objective: 'Introduire des actifs plus puissants progressivement',
        steps: [{
          ...enrichedRoutineStep,
          stepNumber: 2,
          careType: 'traitement',
          isTemporary: true,
          applicationDuration: '3-4 semaines',
          displayTitle: 'Traitement ciblé',
          targetBenefit: 'Corriger problèmes'
        }]
      },
      maintenance: {
        duration: 'Continu',
        objective: 'Maintenir les acquis et prévenir les rechutes',
        steps: [{
          ...enrichedRoutineStep,
          stepNumber: 3,
          careType: 'protection',
          displayTitle: 'Protection solaire',
          targetBenefit: 'Prévenir vieillissement'
        }]
      }
    },
    globalAdvice: [
      'Respectez l\'ordre d\'application des soins',
      'Soyez patient, les résultats apparaissent progressivement'
    ],
    dermatologicalRationale: 'Cette routine respecte le cycle cellulaire de 28 jours et s\'adapte à votre peau mixte avec pores dilatés.'
  }

  describe('RoutineStepSchema (V1 - Rétrocompatible)', () => {
    it('devrait valider un step ancien format', () => {
      expect(() => RoutineStepSchema.parse(legacyRoutineStep)).not.toThrow()
    })

    it('devrait valider un step avec nouveaux champs optionnels', () => {
      const stepWithNewFields = {
        ...legacyRoutineStep,
        isTemporary: false,
        displayTitle: 'Nettoyage doux'
      }
      expect(() => RoutineStepSchema.parse(stepWithNewFields)).not.toThrow()
    })

    it('devrait rejeter un step avec champs invalides', () => {
      const invalidStep = {
        ...legacyRoutineStep,
        stepNumber: 0, // Invalid: min 1
        displayTitle: 'AB' // Invalid: min 3 chars
      }
      expect(() => RoutineStepSchema.parse(invalidStep)).toThrow()
    })

    it('devrait accepter introduceFromWeek dans la plage valide', () => {
      const stepWithWeek = {
        ...legacyRoutineStep,
        introduceFromWeek: 5
      }
      expect(() => RoutineStepSchema.parse(stepWithWeek)).not.toThrow()
    })

    it('devrait rejeter introduceFromWeek hors plage', () => {
      const stepWithInvalidWeek = {
        ...legacyRoutineStep,
        introduceFromWeek: 15 // Invalid: max 12
      }
      expect(() => RoutineStepSchema.parse(stepWithInvalidWeek)).toThrow()
    })
  })

  describe('EnrichedRoutineStepSchema (V2 - Complet)', () => {
    it('devrait valider un step enrichi complet', () => {
      expect(() => EnrichedRoutineStepSchema.parse(enrichedRoutineStep)).not.toThrow()
    })

    it('devrait rejeter un step enrichi avec champs manquants', () => {
      const incompleteStep = {
        ...legacyRoutineStep
        // Manque les champs V2 obligatoires
      }
      expect(() => EnrichedRoutineStepSchema.parse(incompleteStep)).toThrow()
    })

    it('devrait valider les fréquences enum et string', () => {
      const stepWithEnumFreq = {
        ...enrichedRoutineStep,
        frequency: 'daily'
      }
      const stepWithStringFreq = {
        ...enrichedRoutineStep,
        frequency: '2x/week puis daily'
      }
      
      expect(() => EnrichedRoutineStepSchema.parse(stepWithEnumFreq)).not.toThrow()
      expect(() => EnrichedRoutineStepSchema.parse(stepWithStringFreq)).not.toThrow()
    })

    it('devrait valider les contraintes de longueur des titres', () => {
      const stepWithValidTitle = {
        ...enrichedRoutineStep,
        displayTitle: 'Nettoyage quotidien adapté peau sensible'
      }
      expect(() => EnrichedRoutineStepSchema.parse(stepWithValidTitle)).not.toThrow()

      const stepWithTooLongTitle = {
        ...enrichedRoutineStep,
        displayTitle: 'Nettoyage quotidien ultra-doux adapté spécialement pour les peaux très sensibles et réactives'
      }
      expect(() => EnrichedRoutineStepSchema.parse(stepWithTooLongTitle)).toThrow()
    })
  })

  describe('PersonalizedRoutineSchema (V1 - Rétrocompatible)', () => {
    it('devrait valider une routine ancienne complète', () => {
      expect(() => PersonalizedRoutineSchema.parse(legacyRoutine)).not.toThrow()
    })

    it('devrait rejeter une routine avec phases manquantes', () => {
      const incompleteRoutine = {
        ...legacyRoutine,
        phases: {
          immediate: legacyRoutine.phases.immediate
          // Manque adaptation et maintenance
        }
      }
      expect(() => PersonalizedRoutineSchema.parse(incompleteRoutine)).toThrow()
    })

    it('devrait valider les contraintes globalAdvice', () => {
      const routineWithValidAdvice = {
        ...legacyRoutine,
        globalAdvice: ['Conseil 1', 'Conseil 2', 'Conseil 3']
      }
      expect(() => PersonalizedRoutineSchema.parse(routineWithValidAdvice)).not.toThrow()

      const routineWithTooFewAdvice = {
        ...legacyRoutine,
        globalAdvice: ['Seul conseil']
      }
      expect(() => PersonalizedRoutineSchema.parse(routineWithTooFewAdvice)).toThrow()
    })
  })

  describe('EnrichedPersonalizedRoutineSchema (V2 - Complet)', () => {
    it('devrait valider une routine enrichie complète', () => {
      expect(() => EnrichedPersonalizedRoutineSchema.parse(enrichedRoutine)).not.toThrow()
    })

    it('devrait rejeter une routine enrichie avec steps incomplets', () => {
      const routineWithIncompleteSteps = {
        ...enrichedRoutine,
        phases: {
          ...enrichedRoutine.phases,
          immediate: {
            ...enrichedRoutine.phases.immediate,
            steps: [legacyRoutineStep] // Step sans champs V2
          }
        }
      }
      expect(() => EnrichedPersonalizedRoutineSchema.parse(routineWithIncompleteSteps)).toThrow()
    })
  })

  describe('validateAndEnrichRoutine (Migration)', () => {
    it('devrait accepter et retourner une routine enrichie V2', () => {
      const result = validateAndEnrichRoutine(enrichedRoutine)
      expect(result).toEqual(enrichedRoutine)
      expect(result.phases.immediate.steps[0]).toHaveProperty('isTemporary')
      expect(result.phases.immediate.steps[0]).toHaveProperty('displayTitle')
    })

    it('devrait migrer automatiquement une routine V1 vers V2', () => {
      const result = validateAndEnrichRoutine(legacyRoutine)
      
      // Vérifier que tous les champs V2 sont présents
      expect(result.phases.immediate.steps[0]).toHaveProperty('isTemporary')
      expect(result.phases.immediate.steps[0]).toHaveProperty('introduceFromWeek')
      expect(result.phases.immediate.steps[0]).toHaveProperty('applicationDuration')
      expect(result.phases.immediate.steps[0]).toHaveProperty('frequency')
      expect(result.phases.immediate.steps[0]).toHaveProperty('displayTitle')
      expect(result.phases.immediate.steps[0]).toHaveProperty('targetBenefit')
      
      // Vérifier les valeurs inférées
      expect(result.phases.immediate.steps[0].isTemporary).toBe(false) // nettoyage = continu
      expect(result.phases.immediate.steps[0].applicationDuration).toBe('continu')
      expect(result.phases.immediate.steps[0].displayTitle).toBe('Nettoyage quotidien')
    })

    it('devrait inférer correctement isTemporary selon careType', () => {
      const routineWithTreatment = {
        ...legacyRoutine,
        phases: {
          ...legacyRoutine.phases,
          immediate: {
            ...legacyRoutine.phases.immediate,
            steps: [{
              ...legacyRoutineStep,
              careType: 'traitement' as const
            }]
          }
        }
      }
      
      const result = validateAndEnrichRoutine(routineWithTreatment)
      expect(result.phases.immediate.steps[0].isTemporary).toBe(true) // traitement = temporaire
    })

    it('devrait inférer correctement la fréquence selon timing', () => {
      const routineWithWeekly = {
        ...legacyRoutine,
        phases: {
          ...legacyRoutine.phases,
          immediate: {
            ...legacyRoutine.phases.immediate,
            steps: [{
              ...legacyRoutineStep,
              timing: '1-2 fois par semaine'
            }]
          }
        }
      }
      
      const result = validateAndEnrichRoutine(routineWithWeekly)
      expect(result.phases.immediate.steps[0].frequency).toBe('weekly')
    })

    it('devrait rejeter des données complètement invalides', () => {
      const invalidData = {
        invalid: 'structure'
      }
      
      expect(() => validateAndEnrichRoutine(invalidData)).toThrow()
    })

    it('devrait gérer les cas limites de migration', () => {
      const edgeCaseRoutine = {
        ...legacyRoutine,
        phases: {
          ...legacyRoutine.phases,
          immediate: {
            ...legacyRoutine.phases.immediate,
            steps: [{
              ...legacyRoutineStep,
              careType: 'masque' as const,
              timing: 'both',
              targetProblem: undefined
            }]
          }
        }
      }
      
      const result = validateAndEnrichRoutine(edgeCaseRoutine)
      expect(result.phases.immediate.steps[0].isTemporary).toBe(true) // masque = temporaire
      expect(result.phases.immediate.steps[0].displayTitle).toBe('Masque intensif') // fallback sans targetProblem
    })
  })

  describe('Performance et Benchmark', () => {
    it('devrait valider en moins de 10ms', () => {
      const start = performance.now()
      
      for (let i = 0; i < 100; i++) {
        validateAndEnrichRoutine(legacyRoutine)
      }
      
      const end = performance.now()
      const avgTime = (end - start) / 100
      
      expect(avgTime).toBeLessThan(10) // < 10ms par validation
    })

    it('devrait gérer des routines complexes avec de nombreux steps', () => {
      const complexRoutine = {
        ...legacyRoutine,
        phases: {
          immediate: {
            ...legacyRoutine.phases.immediate,
            steps: Array.from({ length: 8 }, (_, i) => ({
              ...legacyRoutineStep,
              stepNumber: i + 1,
              careType: ['nettoyage', 'traitement', 'hydratation', 'protection'][i % 4] as any
            }))
          },
          adaptation: legacyRoutine.phases.adaptation,
          maintenance: legacyRoutine.phases.maintenance
        }
      }
      
      expect(() => validateAndEnrichRoutine(complexRoutine)).not.toThrow()
      
      const result = validateAndEnrichRoutine(complexRoutine)
      expect(result.phases.immediate.steps).toHaveLength(8)
      expect(result.phases.immediate.steps.every(step => 
        step.hasOwnProperty('isTemporary') && 
        step.hasOwnProperty('displayTitle')
      )).toBe(true)
    })
  })
})

