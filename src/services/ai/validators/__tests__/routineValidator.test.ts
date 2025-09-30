import {
  validateRoutineCompliance,
  countStepsByType,
  countHebdomadaireSteps,
  detectDangerousActifs,
  validateBaseDurable,
  validateAlternance,
  BUDGET_LIMITS,
  STYLE_LIMITS
} from '../routineValidator'
import type { PersonalizedRoutine } from '@/schemas/v2'
import type { RoutineContext } from '@/types/questionnaire'

/**
 * 🧪 TESTS UNITAIRES - ROUTINE VALIDATOR
 * 
 * Coverage cible : >95%
 * Cas métier testés : Budget/Style, Grossesse, Alternance, Base durable
 */

describe('Routine Validator', () => {
  
  // ════════════════════════════════════════════════════════════
  // 🏗️ FIXTURES (routines de test)
  // ════════════════════════════════════════════════════════════
  
  const createBasicRoutine = (overrides?: Partial<PersonalizedRoutine>): PersonalizedRoutine => ({
    phases: {
      immediate: {
        duration: '3 semaines',
        description: 'Phase de stabilisation',
        steps: [
          {
            stepNumber: 1,
            stepId: 'imm-nettoyage-matin',
            careType: 'nettoyage',
            timing: 'matin',
            targetProblem: 'Préparation de la peau',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            applicationInstructions: 'Appliquer matin',
            alternatives: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'quotidien',
            displayTitle: 'Nettoyage doux matin',
            targetBenefit: 'Préparation optimale'
          },
          {
            stepNumber: 2,
            stepId: 'imm-nettoyage-soir',
            careType: 'nettoyage',
            timing: 'soir',
            targetProblem: 'Préparation de la peau',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            applicationInstructions: 'Appliquer soir',
            alternatives: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'quotidien',
            displayTitle: 'Nettoyage doux soir',
            targetBenefit: 'Élimination impuretés'
          },
          {
            stepNumber: 3,
            stepId: 'imm-protection',
            careType: 'protection',
            timing: 'matin',
            targetProblem: 'Protection solaire',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            applicationInstructions: 'Appliquer SPF matin',
            alternatives: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'quotidien',
            displayTitle: 'Protection SPF',
            targetBenefit: 'Protection UV'
          }
        ]
      },
      adaptation: {
        duration: '4 semaines',
        description: 'Introduction traitements',
        steps: []
      },
      maintenance: {
        description: 'Maintien résultats',
        steps: []
      }
    },
    globalAdvice: ['Conseil 1', 'Conseil 2', 'Conseil 3'],
    dermatologicalRationale: 'Routine personnalisée selon diagnostic',
    ...overrides
  })
  
  const createContext = (overrides?: Partial<RoutineContext>): RoutineContext => ({
    profile: {
      age: 30,
      gender: 'Femme',
      pregnancy: false
    },
    constraints: {
      budgetTier: 'Confort',
      style: 'Équilibrée'
    },
    environment: {
      uvRiskBand: 'Moderate'
    },
    ...overrides
  })
  
  // ════════════════════════════════════════════════════════════
  // ✅ CAS MÉTIER 1 : Essentiel + Express (Minimal)
  // ════════════════════════════════════════════════════════════
  
  test('Cas 1: Essentiel + Express → 1 traitement, 1 hebdo max, routine valide', () => {
    const routine = createBasicRoutine({
      phases: {
        ...createBasicRoutine().phases,
        adaptation: {
          duration: '4 semaines',
          description: 'Adaptation',
          steps: [
            ...createBasicRoutine().phases.immediate.steps,
            {
              stepNumber: 4,
              stepId: 'adap-traitement1',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Pores',
              targetZones: ['front', 'nez'],
              progressiveIntroduction: null,
              restrictions: ['Soir uniquement'],
              applicationInstructions: 'Appliquer le soir',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Pores',
              targetBenefit: 'Réduction pores'
            }
          ]
        }
      }
    })
    
    const context = createContext({
      constraints: {
        budgetTier: 'Essentiel',
        style: 'Express'
      }
    })
    
    const result = validateRoutineCompliance(routine, context)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.metrics.treatmentsCount).toBe(1)
    expect(result.metrics.hebdosCount).toBe(0)
  })
  
  // ════════════════════════════════════════════════════════════
  // ⚠️ CAS MÉTIER 2 : Essentiel + Complète (Conflit Budget/Style)
  // ════════════════════════════════════════════════════════════
  
  test('Cas 2: Essentiel + Complète → 2 traitements INTERDIT (budget limite à 1)', () => {
    const routine = createBasicRoutine({
      phases: {
        ...createBasicRoutine().phases,
        adaptation: {
          duration: '4 semaines',
          description: 'Adaptation',
          steps: [
            ...createBasicRoutine().phases.immediate.steps,
            {
              stepNumber: 4,
              stepId: 'adap-traitement1',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Pores',
              targetZones: ['front'],
              progressiveIntroduction: null,
              restrictions: [],
              applicationInstructions: 'Le soir uniquement',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Pores',
              targetBenefit: 'Réduction pores'
            },
            {
              stepNumber: 5,
              stepId: 'adap-traitement2',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Rides',
              targetZones: ['contour-yeux'],
              progressiveIntroduction: null,
              restrictions: [],
              applicationInstructions: 'Le soir uniquement',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 1,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Rides',
              targetBenefit: 'Anti-âge'
            }
          ]
        }
      }
    })
    
    const context = createContext({
      constraints: {
        budgetTier: 'Essentiel',  // treatmentsMax = 1
        style: 'Complète'         // demande treatmentsMax = 2 (conflit!)
      }
    })
    
    const result = validateRoutineCompliance(routine, context)
    
    expect(result.valid).toBe(false)  // ❌ Erreur bloquante
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.join(' ')).toMatch(/Traitements.*2.*max.*1/)
    expect(result.metrics.treatmentsCount).toBe(2)
  })
  
  // ════════════════════════════════════════════════════════════
  // ✅ CAS MÉTIER 3 : Confort + Équilibrée (2 traitements alternance)
  // ════════════════════════════════════════════════════════════
  
  test('Cas 3: Confort + Équilibrée → 2 traitements alternance OK', () => {
    const routine = createBasicRoutine({
      phases: {
        ...createBasicRoutine().phases,
        adaptation: {
          duration: '4 semaines',
          description: 'Adaptation',
          steps: [
            ...createBasicRoutine().phases.immediate.steps,
            {
              stepNumber: 4,
              stepId: 'adap-traitement-aha',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Éclat + Texture',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Ne pas cumuler avec rétinoïde le même soir'],
              applicationInstructions: 'Le soir uniquement. Alterner avec "Traitement Rides" : ne pas cumuler le même soir.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Éclat + Texture',
              targetBenefit: 'Renouvellement cellulaire',
              ui: {
                needsAlternation: true,
                pairWithStepId: 'adap-traitement-retinol',
                maxPerNight: 1,
                suggestedNights: ['Lun', 'Mer', 'Ven']
              }
            },
            {
              stepNumber: 5,
              stepId: 'adap-traitement-retinol',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Rides',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Ne pas cumuler avec AHA le même soir'],
              applicationInstructions: 'Le soir uniquement. Alterner avec "Traitement Éclat + Texture" : ne pas cumuler le même soir.',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 1,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Rides',
              targetBenefit: 'Anti-âge',
              ui: {
                needsAlternation: true,
                pairWithStepId: 'adap-traitement-aha',
                maxPerNight: 1,
                suggestedNights: ['Mar', 'Jeu', 'Sam']
              }
            }
          ]
        }
      }
    })
    
    const context = createContext({
      constraints: {
        budgetTier: 'Confort',    // treatmentsMax = 2 ✅
        style: 'Équilibrée'       // treatmentsMax = 2 ✅
      }
    })
    
    const result = validateRoutineCompliance(routine, context)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.metrics.treatmentsCount).toBe(2)
    expect(result.warnings).toHaveLength(0)  // Alternance OK
  })
  
  // ════════════════════════════════════════════════════════════
  // ✅ CAS MÉTIER 4 : Expert + Complète (Routine maximale)
  // ════════════════════════════════════════════════════════════
  
  test('Cas 4: Expert + Complète → 2 traitements + 2 hebdos OK', () => {
    const routine = createBasicRoutine({
      phases: {
        ...createBasicRoutine().phases,
        adaptation: {
          duration: '4 semaines',
          description: 'Adaptation',
          steps: [
            ...createBasicRoutine().phases.immediate.steps,
            {
              stepNumber: 4,
              stepId: 'adap-traitement1',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Pores',
              targetZones: ['front', 'nez'],
              progressiveIntroduction: null,
              restrictions: [],
              applicationInstructions: 'Soir uniquement',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Pores',
              targetBenefit: 'Affinement grain'
            },
            {
              stepNumber: 5,
              stepId: 'adap-traitement2',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Rides',
              targetZones: ['contour-yeux'],
              progressiveIntroduction: null,
              restrictions: [],
              applicationInstructions: 'Soir uniquement',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 1,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Rides',
              targetBenefit: 'Anti-âge'
            }
          ]
        },
        maintenance: {
          description: 'Maintien',
          steps: [
            {
              stepNumber: 1,
              stepId: 'maint-masque',
              careType: 'masque',
              timing: 'hebdomadaire',
              targetProblem: 'Hydratation',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Max 15 min'],
              applicationInstructions: '1x/semaine',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: '3 semaines',
              frequency: '1x/semaine',
              displayTitle: 'Masque Hydratant',
              targetBenefit: 'Boost hydratation'
            },
            {
              stepNumber: 2,
              stepId: 'maint-exfoliation',
              careType: 'exfoliation',
              timing: 'hebdomadaire',
              targetProblem: 'Éclat',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Max 10 min'],
              applicationInstructions: '1x/semaine',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: '3 semaines',
              frequency: '1x/semaine',
              displayTitle: 'Exfoliation Douce',
              targetBenefit: 'Renouvellement'
            }
          ]
        }
      }
    })
    
    const context = createContext({
      constraints: {
        budgetTier: 'Expert',     // treatmentsMax=2, hebdoMax=2 ✅
        style: 'Complète'         // treatmentsMax=2, hebdoMax=2 ✅
      }
    })
    
    const result = validateRoutineCompliance(routine, context)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.metrics.treatmentsCount).toBe(2)
    expect(result.metrics.hebdosCount).toBe(2)
  })
  
  // ════════════════════════════════════════════════════════════
  // 🚫 CAS MÉTIER 5 : Grossesse (Détection actifs dangereux)
  // ════════════════════════════════════════════════════════════
  
  test('Cas 5: Grossesse → Rétinol détecté = ERREUR BLOQUANTE', () => {
    const routine = createBasicRoutine({
      phases: {
        ...createBasicRoutine().phases,
        adaptation: {
          duration: '4 semaines',
          description: 'Adaptation',
          steps: [
            ...createBasicRoutine().phases.immediate.steps,
            {
              stepNumber: 4,
              stepId: 'adap-traitement-retinol',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Rides',
              targetZones: ['visage entier'],
              progressiveIntroduction: null,
              restrictions: ['Interdit grossesse'],  // ❌ Présence keyword
              applicationInstructions: 'Appliquer rétinol progressif soir',  // ❌ Keyword
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Rides (Rétinol)',  // ❌ Keyword dans titre
              targetBenefit: 'Anti-âge'
            }
          ]
        }
      }
    })
    
    const context = createContext({
      profile: {
        age: 32,
        gender: 'Femme',
        pregnancy: true  // ✅ Grossesse active
      },
      constraints: {
        budgetTier: 'Confort',
        style: 'Équilibrée'
      }
    })
    
    const result = validateRoutineCompliance(routine, context)
    
    expect(result.valid).toBe(false)  // ❌ Erreur bloquante
    expect(result.errors.length).toBeGreaterThan(0)
    const errorsText = result.errors.join(' ')
    expect(errorsText).toMatch(/Grossesse.*dangereux/i)
    expect(errorsText).toMatch(/rétinol/i)
  })
  
  // ════════════════════════════════════════════════════════════
  // ⚠️ CAS MÉTIER 6 : Alternance manquante
  // ════════════════════════════════════════════════════════════
  
  test('Cas 6: 2 traitements SANS alternance → Warning (non bloquant)', () => {
    const routine = createBasicRoutine({
      phases: {
        ...createBasicRoutine().phases,
        adaptation: {
          duration: '4 semaines',
          description: 'Adaptation',
          steps: [
            ...createBasicRoutine().phases.immediate.steps,
            {
              stepNumber: 4,
              stepId: 'adap-traitement1',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Pores',
              targetZones: ['front'],
              progressiveIntroduction: null,
              restrictions: [],
              applicationInstructions: 'Soir uniquement',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 0,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Pores',
              targetBenefit: 'Affinement',
              // ❌ Pas de ui.needsAlternation
            },
            {
              stepNumber: 5,
              stepId: 'adap-traitement2',
              careType: 'traitement',
              timing: 'soir',
              targetProblem: 'Rides',
              targetZones: ['contour-yeux'],
              progressiveIntroduction: null,
              restrictions: [],
              applicationInstructions: 'Soir uniquement',
              alternatives: [],
              isTemporary: true,
              introduceFromWeek: 1,
              applicationDuration: 'progressive',
              frequency: 'quotidien',
              displayTitle: 'Traitement Rides',
              targetBenefit: 'Anti-âge',
              // ❌ Pas de ui.needsAlternation
            }
          ]
        }
      }
    })
    
    const context = createContext({
      constraints: {
        budgetTier: 'Confort',
        style: 'Équilibrée'
      }
    })
    
    const result = validateRoutineCompliance(routine, context)
    
    expect(result.valid).toBe(true)  // ✅ Valid (warning non bloquant)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.join(' ')).toMatch(/alternance.*manquant/i)
  })
  
  // ════════════════════════════════════════════════════════════
  // 🔧 TESTS UNITAIRES FONCTIONS UTILITAIRES
  // ════════════════════════════════════════════════════════════
  
  describe('countStepsByType()', () => {
    test('Compte correctement les traitements par phase', () => {
      const routine = createBasicRoutine({
        phases: {
          ...createBasicRoutine().phases,
          adaptation: {
            duration: '4 semaines',
            description: 'Adaptation',
            steps: [
              {
                stepNumber: 1,
                stepId: 'test',
                careType: 'traitement',
                timing: 'soir',
                targetProblem: 'Test',
                targetZones: ['front'],
                progressiveIntroduction: null,
                restrictions: [],
                applicationInstructions: 'Test',
                alternatives: [],
                isTemporary: true,
                introduceFromWeek: 0,
                applicationDuration: 'progressive',
                frequency: 'quotidien',
                displayTitle: 'Test',
                targetBenefit: 'Test'
              }
            ]
          }
        }
      })
      
      const count = countStepsByType(routine, 'traitement')
      
      expect(count.immediate).toBe(0)
      expect(count.adaptation).toBe(1)
      expect(count.maintenance).toBe(0)
    })
  })
  
  describe('countHebdomadaireSteps()', () => {
    test('Compte correctement les steps hebdomadaires', () => {
      const routine = createBasicRoutine({
        phases: {
          ...createBasicRoutine().phases,
          maintenance: {
            description: 'Maintien',
            steps: [
              {
                stepNumber: 1,
                stepId: 'hebdo1',
                careType: 'masque',
                timing: 'hebdomadaire',
                targetProblem: 'Test',
                targetZones: ['front'],
                progressiveIntroduction: null,
                restrictions: [],
                applicationInstructions: 'Test',
                alternatives: [],
                isTemporary: true,
                introduceFromWeek: 0,
                applicationDuration: '3 semaines',
                frequency: '1x/semaine',
                displayTitle: 'Test',
                targetBenefit: 'Test'
              },
              {
                stepNumber: 2,
                stepId: 'hebdo2',
                careType: 'exfoliation',
                timing: 'hebdomadaire',
                targetProblem: 'Test',
                targetZones: ['front'],
                progressiveIntroduction: null,
                restrictions: [],
                applicationInstructions: 'Test',
                alternatives: [],
                isTemporary: true,
                introduceFromWeek: 0,
                applicationDuration: '3 semaines',
                frequency: '1x/semaine',
                displayTitle: 'Test',
                targetBenefit: 'Test'
              }
            ]
          }
        }
      })
      
      const count = countHebdomadaireSteps(routine)
      
      expect(count.total).toBe(2)
      expect(count.byPhase.maintenance).toBe(2)
    })
  })
  
  describe('detectDangerousActifs()', () => {
    test('Détecte rétinol dans displayTitle', () => {
      const routine = createBasicRoutine({
        phases: {
          ...createBasicRoutine().phases,
          adaptation: {
            duration: '4 semaines',
            description: 'Adaptation',
            steps: [
              {
                stepNumber: 1,
                stepId: 'test',
                careType: 'traitement',
                timing: 'soir',
                targetProblem: 'Rides',
                targetZones: ['front'],
                progressiveIntroduction: null,
                restrictions: [],
                applicationInstructions: 'Appliquer',
                alternatives: [],
                isTemporary: true,
                introduceFromWeek: 0,
                applicationDuration: 'progressive',
                frequency: 'quotidien',
                displayTitle: 'Traitement Rétinol Progressif',  // ❌ Keyword
                targetBenefit: 'Anti-âge'
              }
            ]
          }
        }
      })
      
      const dangerous = detectDangerousActifs(routine)
      
      expect(dangerous).toHaveLength(1)
      expect(dangerous[0]).toContain('Rétinol')
    })
    
    test('Détecte acide salicylique dans instructions', () => {
      const routine = createBasicRoutine({
        phases: {
          ...createBasicRoutine().phases,
          adaptation: {
            duration: '4 semaines',
            description: 'Adaptation',
            steps: [
              {
                stepNumber: 1,
                stepId: 'test',
                careType: 'traitement',
                timing: 'soir',
                targetProblem: 'Pores',
                targetZones: ['front'],
                progressiveIntroduction: null,
                restrictions: [],
                applicationInstructions: 'Appliquer acide salicylique 2%',  // ❌ Keyword
                alternatives: [],
                isTemporary: true,
                introduceFromWeek: 0,
                applicationDuration: 'progressive',
                frequency: 'quotidien',
                displayTitle: 'Traitement Pores',
                targetBenefit: 'Affinement'
              }
            ]
          }
        }
      })
      
      const dangerous = detectDangerousActifs(routine)
      
      expect(dangerous).toHaveLength(1)
      expect(dangerous[0]).toContain('acide salicylique')
    })
  })
  
  describe('validateBaseDurable()', () => {
    test('Erreur si nettoyage matin manquant', () => {
      const routine = createBasicRoutine({
        phases: {
          ...createBasicRoutine().phases,
          immediate: {
            duration: '3 semaines',
            description: 'Phase immédiate',
            steps: [
              // ❌ Manque nettoyage matin
              {
                stepNumber: 1,
                stepId: 'imm-nettoyage-soir',
                careType: 'nettoyage',
                timing: 'soir',
                targetProblem: 'Préparation',
                targetZones: ['visage entier'],
                progressiveIntroduction: null,
                restrictions: [],
                applicationInstructions: 'Soir',
                alternatives: [],
                isTemporary: false,
                introduceFromWeek: 0,
                applicationDuration: 'continu',
                frequency: 'quotidien',
                displayTitle: 'Nettoyage soir',
                targetBenefit: 'Nettoyage'
              },
              {
                stepNumber: 2,
                stepId: 'imm-protection',
                careType: 'protection',
                timing: 'matin',
                targetProblem: 'Protection solaire',
                targetZones: ['visage entier'],
                progressiveIntroduction: null,
                restrictions: [],
                applicationInstructions: 'Matin',
                alternatives: [],
                isTemporary: false,
                introduceFromWeek: 0,
                applicationDuration: 'continu',
                frequency: 'quotidien',
                displayTitle: 'SPF',
                targetBenefit: 'Protection'
              }
            ]
          }
        }
      })
      
      const errors = validateBaseDurable(routine)
      
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('Nettoyage matin')
    })
  })
  
  describe('validateAlternance()', () => {
    test('Valide si alternance bien configurée', () => {
      const routine = createBasicRoutine({
        phases: {
          ...createBasicRoutine().phases,
          adaptation: {
            duration: '4 semaines',
            description: 'Adaptation',
            steps: [
              {
                stepNumber: 1,
                stepId: 'traitement1',
                careType: 'traitement',
                timing: 'soir',
                targetProblem: 'Test',
                targetZones: ['front'],
                progressiveIntroduction: null,
                restrictions: [],
                applicationInstructions: 'Alterner avec traitement 2',
                alternatives: [],
                isTemporary: true,
                introduceFromWeek: 0,
                applicationDuration: 'progressive',
                frequency: 'quotidien',
                displayTitle: 'Traitement 1',
                targetBenefit: 'Test',
                ui: {
                  needsAlternation: true,
                  pairWithStepId: 'traitement2'
                }
              },
              {
                stepNumber: 2,
                stepId: 'traitement2',
                careType: 'traitement',
                timing: 'soir',
                targetProblem: 'Test',
                targetZones: ['front'],
                progressiveIntroduction: null,
                restrictions: [],
                applicationInstructions: 'Alterner avec traitement 1',
                alternatives: [],
                isTemporary: true,
                introduceFromWeek: 1,
                applicationDuration: 'progressive',
                frequency: 'quotidien',
                displayTitle: 'Traitement 2',
                targetBenefit: 'Test',
                ui: {
                  needsAlternation: true,
                  pairWithStepId: 'traitement1'
                }
              }
            ]
          }
        }
      })
      
      const valid = validateAlternance(routine)
      
      expect(valid).toBe(true)
    })
  })
})
