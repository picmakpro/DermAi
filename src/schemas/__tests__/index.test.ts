/**
 * TESTS SCHEMAS ZOD - SPRINT 3 QUALITÉ DERMAI V2
 * Tests validation schémas Zod pour tous inputs/outputs
 */

import {
  DiagnosticBrutSchema,
  RoutinePersonnaliseeSchema,
  generateSeed,
  hashImage,
  shouldRetry,
  classifyError,
  ErrorType
} from '../index'

describe('Schemas Zod - Sprint 3 Qualité', () => {
  
  describe('🧪 Tests DiagnosticBrutSchema', () => {
    
    const validDiagnostic = {
      scores: {
        hydration: {
          value: 75,
          justification: "Peau équilibrée avec légère déshydratation",
          confidence: 0.85,
          basedOn: ["texture visuelle", "brillance zones"]
        },
        wrinkles: {
          value: 88,
          justification: "Peau jeune sans rides marquées",
          confidence: 0.9,
          basedOn: ["analyse contours"]
        },
        firmness: {
          value: 82,
          justification: "Bonne fermeté générale",
          confidence: 0.8,
          basedOn: ["analyse structure"]
        },
        radiance: {
          value: 70,
          justification: "Éclat terne par endroits",
          confidence: 0.85,
          basedOn: ["luminosité", "uniformité teint"]
        },
        pores: {
          value: 65,
          justification: "Pores dilatés zone T",
          confidence: 0.9,
          basedOn: ["analyse texture", "zone T"]
        },
        spots: {
          value: 72,
          justification: "Quelques imperfections localisées",
          confidence: 0.8,
          basedOn: ["détection taches"]
        },
        darkCircles: {
          value: 85,
          justification: "Contour des yeux correct",
          confidence: 0.75,
          basedOn: ["analyse contour yeux"]
        },
        skinAge: {
          value: 78,
          justification: "Âge cutané légèrement inférieur",
          confidence: 0.8,
          basedOn: ["analyse globale"]
        },
        overall: 76
      },
      beautyAssessment: {
        skinType: "Peau mixte avec zone T grasse",
        mainConcern: "Imperfections et pores dilatés zone T",
        intensity: "modérée",
        concernedZones: ["nez", "menton", "front"],
        specificities: [
          {
            name: "Imperfections",
            intensity: "modérée",
            zones: ["menton", "nez"]
          }
        ],
        visualFindings: [
          "Pores dilatés visibles sur la zone T",
          "Quelques comédons sur le menton"
        ],
        overview: [
          "Peau mixte typique avec zone T grasse",
          "Préoccupations modérées nécessitant routine ciblée"
        ],
        zoneSpecific: [
          {
            zone: "nez",
            problems: [
              { name: "Pores dilatés", intensity: "modérée" }
            ],
            description: "Zone la plus problématique"
          }
        ],
        expectedImprovement: "Amélioration visible en 6-8 semaines",
        improvementTimeEstimate: "2-3 mois"
      }
    }
    
    test('Validation diagnostic valide - PASS', () => {
      expect(() => DiagnosticBrutSchema.parse(validDiagnostic)).not.toThrow()
      
      const parsed = DiagnosticBrutSchema.parse(validDiagnostic)
      expect(parsed.scores.overall).toBe(76)
      expect(parsed.beautyAssessment.intensity).toBe('modérée')
    })
    
    test('Validation scores - valeurs limites', () => {
      // Test score = 0
      const diagnosticScore0 = {
        ...validDiagnostic,
        scores: {
          ...validDiagnostic.scores,
          hydration: { ...validDiagnostic.scores.hydration, value: 0 }
        }
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticScore0)).not.toThrow()
      
      // Test score = 100
      const diagnosticScore100 = {
        ...validDiagnostic,
        scores: {
          ...validDiagnostic.scores,
          hydration: { ...validDiagnostic.scores.hydration, value: 100 }
        }
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticScore100)).not.toThrow()
      
      // Test score > 100 (invalide)
      const diagnosticScoreInvalide = {
        ...validDiagnostic,
        scores: {
          ...validDiagnostic.scores,
          hydration: { ...validDiagnostic.scores.hydration, value: 101 }
        }
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticScoreInvalide)).toThrow()
    })
    
    test('Validation confidence - valeurs limites', () => {
      // Test confidence = 0
      const diagnosticConf0 = {
        ...validDiagnostic,
        scores: {
          ...validDiagnostic.scores,
          hydration: { ...validDiagnostic.scores.hydration, confidence: 0 }
        }
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticConf0)).not.toThrow()
      
      // Test confidence = 1
      const diagnosticConf1 = {
        ...validDiagnostic,
        scores: {
          ...validDiagnostic.scores,
          hydration: { ...validDiagnostic.scores.hydration, confidence: 1 }
        }
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticConf1)).not.toThrow()
      
      // Test confidence > 1 (invalide)
      const diagnosticConfInvalide = {
        ...validDiagnostic,
        scores: {
          ...validDiagnostic.scores,
          hydration: { ...validDiagnostic.scores.hydration, confidence: 1.1 }
        }
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticConfInvalide)).toThrow()
    })
    
    test('Validation intensité - valeurs autorisées', () => {
      const intensitesValides = ['légère', 'modérée', 'modérée à sévère', 'intense', 'sévère']
      
      intensitesValides.forEach(intensite => {
        const diagnostic = {
          ...validDiagnostic,
          beautyAssessment: {
            ...validDiagnostic.beautyAssessment,
            intensity: intensite
          }
        }
        expect(() => DiagnosticBrutSchema.parse(diagnostic)).not.toThrow()
      })
      
      // Test intensité invalide
      const diagnosticIntensiteInvalide = {
        ...validDiagnostic,
        beautyAssessment: {
          ...validDiagnostic.beautyAssessment,
          intensity: 'très_intense' // Invalide
        }
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticIntensiteInvalide)).toThrow()
    })
    
    test('Validation champs obligatoires', () => {
      // Test sans scores
      const diagnosticSansScores = {
        beautyAssessment: validDiagnostic.beautyAssessment
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticSansScores)).toThrow()
      
      // Test sans beautyAssessment
      const diagnosticSansAssessment = {
        scores: validDiagnostic.scores
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticSansAssessment)).toThrow()
      
      // Test sans mainConcern
      const diagnosticSansConcern = {
        ...validDiagnostic,
        beautyAssessment: {
          ...validDiagnostic.beautyAssessment,
          mainConcern: undefined
        }
      }
      expect(() => DiagnosticBrutSchema.parse(diagnosticSansConcern)).toThrow()
    })
  })
  
  describe('🔧 Tests RoutinePersonnaliseeSchema', () => {
    
    const validRoutine = {
      immediate: [
        "Nettoyage adapté matin et soir",
        "Sérum régulateur de sébum"
      ],
      routine: {
        immediate: [
          {
            name: "CeraVe Nettoyant Moussant",
            frequency: "quotidien",
            timing: "matin_et_soir",
            catalogId: "B01MSSDEPK",
            application: "Nettoyage doux pour éliminer excès de sébum",
            startDate: "maintenant"
          }
        ],
        adaptation: [
          {
            name: "Paula's Choice BHA 2%",
            frequency: "3_fois_semaine",
            timing: "soir",
            catalogId: "B00949CTQQ",
            application: "Exfoliant chimique pour désobstruer pores",
            startDate: "semaine 3"
          }
        ],
        maintenance: []
      },
      localizedRoutine: [],
      overview: "Routine en 3 phases pour peau mixte",
      zoneSpecificCare: "Soins ciblés nez et menton",
      restrictions: "Éviter sur-nettoyage"
    }
    
    test('Validation routine valide - PASS', () => {
      expect(() => RoutinePersonnaliseeSchema.parse(validRoutine)).not.toThrow()
      
      const parsed = RoutinePersonnaliseeSchema.parse(validRoutine)
      expect(parsed.routine.immediate).toHaveLength(1)
      expect(parsed.routine.immediate[0].catalogId).toBe('B01MSSDEPK')
    })
    
    test('Validation catalogId - format strict', () => {
      // Test catalogId valide
      const catalogIdsValides = ['B01MSSDEPK', 'B00949CTQQ', 'ABCD123456', 'A1B2C3D4E5']
      
      catalogIdsValides.forEach(catalogId => {
        const routine = {
          ...validRoutine,
          routine: {
            ...validRoutine.routine,
            immediate: [{
              ...validRoutine.routine.immediate[0],
              catalogId
            }]
          }
        }
        expect(() => RoutinePersonnaliseeSchema.parse(routine)).not.toThrow()
      })
      
      // Test catalogId invalides
      const catalogIdsInvalides = ['abc123', 'B01', 'toolong123456789', '123456789', 'B01-INVALID']
      
      catalogIdsInvalides.forEach(catalogId => {
        const routine = {
          ...validRoutine,
          routine: {
            ...validRoutine.routine,
            immediate: [{
              ...validRoutine.routine.immediate[0],
              catalogId
            }]
          }
        }
        expect(() => RoutinePersonnaliseeSchema.parse(routine)).toThrow()
      })
    })
    
    test('Validation frequency - valeurs autorisées', () => {
      const frequencesValides = ['quotidien', '3_fois_semaine', 'hebdomadaire', 'selon_besoin', 'progressive']
      
      frequencesValides.forEach(frequency => {
        const routine = {
          ...validRoutine,
          routine: {
            ...validRoutine.routine,
            immediate: [{
              ...validRoutine.routine.immediate[0],
              frequency
            }]
          }
        }
        expect(() => RoutinePersonnaliseeSchema.parse(routine)).not.toThrow()
      })
      
      // Test frequency invalide
      const routineFreqInvalide = {
        ...validRoutine,
        routine: {
          ...validRoutine.routine,
          immediate: [{
            ...validRoutine.routine.immediate[0],
            frequency: 'tous_les_jours' // Invalide
          }]
        }
      }
      expect(() => RoutinePersonnaliseeSchema.parse(routineFreqInvalide)).toThrow()
    })
    
    test('Validation timing - valeurs autorisées', () => {
      const timingsValides = ['matin', 'soir', 'matin_et_soir']
      
      timingsValides.forEach(timing => {
        const routine = {
          ...validRoutine,
          routine: {
            ...validRoutine.routine,
            immediate: [{
              ...validRoutine.routine.immediate[0],
              timing
            }]
          }
        }
        expect(() => RoutinePersonnaliseeSchema.parse(routine)).not.toThrow()
      })
      
      // Test timing invalide
      const routineTimingInvalide = {
        ...validRoutine,
        routine: {
          ...validRoutine.routine,
          immediate: [{
            ...validRoutine.routine.immediate[0],
            timing: 'midi' // Invalide
          }]
        }
      }
      expect(() => RoutinePersonnaliseeSchema.parse(routineTimingInvalide)).toThrow()
    })
    
    test('Validation champs obligatoires routine', () => {
      // Test sans name
      const routineSansName = {
        ...validRoutine,
        routine: {
          ...validRoutine.routine,
          immediate: [{
            ...validRoutine.routine.immediate[0],
            name: undefined
          }]
        }
      }
      expect(() => RoutinePersonnaliseeSchema.parse(routineSansName)).toThrow()
      
      // Test sans catalogId
      const routineSansCatalogId = {
        ...validRoutine,
        routine: {
          ...validRoutine.routine,
          immediate: [{
            ...validRoutine.routine.immediate[0],
            catalogId: undefined
          }]
        }
      }
      expect(() => RoutinePersonnaliseeSchema.parse(routineSansCatalogId)).toThrow()
    })
  })
  
  describe('🔐 Tests Utilitaires Crypto', () => {
    
    test('generateSeed - reproductibilité', () => {
      const imageHashes = ['hash1', 'hash2', 'hash3']
      
      const seed1 = generateSeed(imageHashes)
      const seed2 = generateSeed(imageHashes)
      
      expect(seed1).toBe(seed2)
      expect(typeof seed1).toBe('number')
      expect(seed1).toBeGreaterThan(0)
    })
    
    test('generateSeed - différentiation', () => {
      const imageHashes1 = ['hash1', 'hash2']
      const imageHashes2 = ['hash3', 'hash4']
      
      const seed1 = generateSeed(imageHashes1)
      const seed2 = generateSeed(imageHashes2)
      
      expect(seed1).not.toBe(seed2)
    })
    
    test('hashImage - reproductibilité', () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD'
      
      const hash1 = hashImage(imageData)
      const hash2 = hashImage(imageData)
      
      expect(hash1).toBe(hash2)
      expect(typeof hash1).toBe('string')
      expect(hash1.length).toBeGreaterThan(0)
    })
    
    test('hashImage - différentiation', () => {
      const imageData1 = 'data:image/jpeg;base64,image1'
      const imageData2 = 'data:image/jpeg;base64,image2'
      
      const hash1 = hashImage(imageData1)
      const hash2 = hashImage(imageData2)
      
      expect(hash1).not.toBe(hash2)
    })
  })
  
  describe('⚠️ Tests Gestion Erreurs', () => {
    
    test('classifyError - classification correcte', () => {
      // Erreur réseau
      const networkError = new Error('Network request failed')
      expect(classifyError(networkError)).toBe(ErrorType.NETWORK_ERROR)
      
      // Erreur timeout
      const timeoutError = new Error('Request timeout')
      expect(classifyError(timeoutError)).toBe(ErrorType.TIMEOUT_ERROR)
      
      // Erreur validation
      const validationError = new Error('Invalid input format')
      expect(classifyError(validationError)).toBe(ErrorType.VALIDATION_ERROR)
      
      // Erreur auth
      const authError = new Error('Unauthorized access')
      expect(classifyError(authError)).toBe(ErrorType.AUTHENTICATION_ERROR)
      
      // Erreur rate limit
      const rateLimitError = new Error('Rate limit exceeded')
      expect(classifyError(rateLimitError)).toBe(ErrorType.RATE_LIMIT_ERROR)
    })
    
    test('shouldRetry - logique retry correcte', () => {
      // Erreurs qui doivent être retryées
      const networkError = new Error('Network error')
      expect(shouldRetry(networkError, 1)).toBe(true)
      expect(shouldRetry(networkError, 2)).toBe(true)
      expect(shouldRetry(networkError, 3)).toBe(true)
      expect(shouldRetry(networkError, 4)).toBe(false) // Max atteint
      
      // Erreurs qui ne doivent PAS être retryées
      const validationError = new Error('Invalid format')
      expect(shouldRetry(validationError, 1)).toBe(false)
      
      const authError = new Error('Unauthorized')
      expect(shouldRetry(authError, 1)).toBe(false)
    })
    
    test('ErrorType - énumération complète', () => {
      const expectedTypes = [
        'validation',
        'network',
        'timeout',
        'rate_limit',
        'auth',
        'parsing'
      ]
      
      expectedTypes.forEach(type => {
        expect(Object.values(ErrorType)).toContain(type)
      })
    })
  })
  
  describe('🎯 Tests Edge Cases', () => {
    
    test('Diagnostic avec champs optionnels manquants', () => {
      const diagnosticMinimal = {
        scores: {
          hydration: {
            value: 75,
            justification: "Test",
            confidence: 0.8,
            basedOn: ["test"]
          },
          wrinkles: {
            value: 80,
            justification: "Test",
            confidence: 0.8,
            basedOn: ["test"]
          },
          firmness: {
            value: 80,
            justification: "Test",
            confidence: 0.8,
            basedOn: ["test"]
          },
          radiance: {
            value: 80,
            justification: "Test",
            confidence: 0.8,
            basedOn: ["test"]
          },
          pores: {
            value: 80,
            justification: "Test",
            confidence: 0.8,
            basedOn: ["test"]
          },
          spots: {
            value: 80,
            justification: "Test",
            confidence: 0.8,
            basedOn: ["test"]
          },
          darkCircles: {
            value: 80,
            justification: "Test",
            confidence: 0.8,
            basedOn: ["test"]
          },
          skinAge: {
            value: 80,
            justification: "Test",
            confidence: 0.8,
            basedOn: ["test"]
          },
          overall: 80
        },
        beautyAssessment: {
          mainConcern: "Test concern",
          intensity: "légère",
          concernedZones: [],
          visualFindings: [],
          expectedImprovement: "Test improvement"
        }
      }
      
      expect(() => DiagnosticBrutSchema.parse(diagnosticMinimal)).not.toThrow()
    })
    
    test('Routine avec phases vides', () => {
      const routinePhasesVides = {
        immediate: [],
        routine: {
          immediate: [],
          adaptation: [],
          maintenance: []
        },
        localizedRoutine: [],
        overview: "Test",
        zoneSpecificCare: "Test",
        restrictions: "Test"
      }
      
      expect(() => RoutinePersonnaliseeSchema.parse(routinePhasesVides)).not.toThrow()
    })
    
    test('Gestion erreurs inconnues', () => {
      const unknownError = new Error('Something completely unexpected')
      
      // Devrait classifier comme parsing par défaut
      const classification = classifyError(unknownError)
      expect([ErrorType.PARSING_ERROR, ErrorType.NETWORK_ERROR]).toContain(classification)
      
      // Ne devrait pas retry par défaut
      expect(shouldRetry(unknownError, 1)).toBe(false)
    })
  })
})
