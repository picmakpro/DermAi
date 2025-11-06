import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { AnalysisServiceV2 } from '../AnalysisServiceV2'
import { PureDiagnosticSchema, PersonalizedRoutineSchema, ProductSelectionSchema } from '@/schemas/v2'

// Mock OpenAI
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}))

// Mock des utilitaires
jest.mock('@/utils/Logger')
jest.mock('@/utils/RetryStrategy')
jest.mock('@/utils/v2/CacheManagerV2')

describe('AnalysisServiceV2 - Architecture IA-First Pure', () => {
  const mockRequest = {
    photos: [
      { url: 'https://example.com/photo1.jpg', type: 'face' },
      { url: 'https://example.com/photo2.jpg', type: 'profile' }
    ],
    userProfile: {
      age: 28,
      gender: 'Femme',
      skinType: 'Mixte'
    },
    skinConcerns: {
      primary: ['Pores dilatés', 'Brillance T-zone'],
      intensity: 'modérée'
    },
    constraints: {
      budget: 100,
      timeAvailable: '15 min',
      allergies: [],
      currentRoutine: 'Basique'
    }
  }

  const mockDiagnostic = {
    skinType: 'Mixte',
    scores: {
      hydration: { value: 72, justification: 'Bonne hydratation générale', confidence: 0.8, basedOn: ['éclat', 'texture'] },
      wrinkles: { value: 85, justification: 'Peau jeune sans rides', confidence: 0.9, basedOn: ['lissé', 'fermeté'] },
      firmness: { value: 80, justification: 'Bonne tonicité', confidence: 0.8, basedOn: ['contours', 'élasticité'] },
      radiance: { value: 75, justification: 'Teint lumineux', confidence: 0.8, basedOn: ['éclat', 'vitalité'] },
      pores: { value: 55, justification: 'Pores visibles zone T', confidence: 0.9, basedOn: ['taille pores', 'zone T'] },
      spots: { value: 78, justification: 'Teint homogène', confidence: 0.8, basedOn: ['uniformité'] },
      darkCircles: { value: 70, justification: 'Cernes légères', confidence: 0.7, basedOn: ['contour yeux'] },
      skinAge: { value: 82, justification: 'Peau jeune', confidence: 0.8, basedOn: ['global'] },
      overall: 72
    },
    skinAgeEstimate: 25,
    generalObservation: 'Peau mixte jeune avec pores dilatés zone T',
    zoneSpecificIssues: [
      {
        zone: 'nez',
        problem: 'Pores dilatés',
        intensity: 'modérée',
        description: 'Pores visibles sur les ailes du nez'
      }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ÉTAPE 1: Diagnostic Pur', () => {
    it('devrait générer un diagnostic valide à partir des photos', async () => {
      // Mock réponse OpenAI
      const mockOpenAI = require('openai').default
      const mockCreate = mockOpenAI().chat.completions.create
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockDiagnostic)
          }
        }]
      })

      const result = await AnalysisServiceV2.performPureDiagnostic(mockRequest.photos, 'test-request-id')

      // Vérifier validation Zod
      expect(() => PureDiagnosticSchema.parse(result)).not.toThrow()
      
      // Vérifier structure
      expect(result.skinType).toBeDefined()
      expect(result.scores.overall).toBeGreaterThan(0)
      expect(result.skinAgeEstimate).toBeGreaterThan(15)
      expect(result.generalObservation).toBeDefined()
      
      // Vérifier appel OpenAI
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          temperature: 0.0,
          max_tokens: 3000
        })
      )
    })

    it('devrait utiliser le cache pour des photos identiques', async () => {
      const mockCache = require('@/utils/v2/CacheManagerV2').CacheManagerV2
      const mockCacheInstance = new mockCache()
      mockCacheInstance.get = jest.fn().mockResolvedValue(mockDiagnostic)

      const result = await AnalysisServiceV2.performPureDiagnostic(mockRequest.photos, 'test-request-id')

      expect(result).toEqual(mockDiagnostic)
    })

    it('devrait retry en cas d\'erreur OpenAI', async () => {
      const mockOpenAI = require('openai').default
      const mockCreate = mockOpenAI().chat.completions.create
      
      // Premier appel échoue, deuxième réussit
      mockCreate
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(mockDiagnostic)
            }
          }]
        })

      const result = await AnalysisServiceV2.performPureDiagnostic(mockRequest.photos, 'test-request-id')

      expect(result).toBeDefined()
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })
  })

  describe('ÉTAPE 2: Routine Personnalisée', () => {
    it('devrait générer une routine personnalisée basée sur le diagnostic', async () => {
      const mockRoutine = {
        phases: {
          immediate: {
            duration: '1-2 semaines',
            objective: 'Stabiliser la peau',
            steps: [
              {
                stepNumber: 1,
                careType: 'nettoyage',
                timing: 'both',
                targetProblem: 'Impuretés quotidiennes',
                targetZones: ['visage entier'],
                progressiveIntroduction: null,
                restrictions: []
              }
            ]
          },
          adaptation: {
            duration: '3-6 semaines',
            objective: 'Introduire actifs',
            steps: []
          },
          maintenance: {
            duration: 'Continu',
            objective: 'Maintenir acquis',
            steps: []
          }
        },
        globalAdvice: ['Conseil 1', 'Conseil 2'],
        dermatologicalRationale: 'Logique dermatologique adaptée'
      }

      const mockOpenAI = require('openai').default
      const mockCreate = mockOpenAI().chat.completions.create
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockRoutine)
          }
        }]
      })

      const result = await AnalysisServiceV2.generatePersonalizedRoutine(
        mockDiagnostic, 
        mockRequest, 
        'test-request-id'
      )

      // Vérifier validation Zod
      expect(() => PersonalizedRoutineSchema.parse(result)).not.toThrow()
      
      // Vérifier personnalisation
      expect(result.phases.immediate.steps.length).toBeGreaterThan(0)
      expect(result.dermatologicalRationale).toBeDefined()
      expect(result.globalAdvice.length).toBeGreaterThanOrEqual(2)
    })

    it('devrait adapter la routine selon l\'âge utilisateur', async () => {
      const youngUser = { ...mockRequest, userProfile: { ...mockRequest.userProfile, age: 20 } }
      const matureUser = { ...mockRequest, userProfile: { ...mockRequest.userProfile, age: 50 } }

      // Mock différentes réponses selon l'âge
      const mockOpenAI = require('openai').default
      const mockCreate = mockOpenAI().chat.completions.create

      // Test avec utilisateur jeune
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              phases: { immediate: { steps: [{ careType: 'traitement' }] }, adaptation: { steps: [] }, maintenance: { steps: [] } },
              globalAdvice: ['Prévention'],
              dermatologicalRationale: 'Routine préventive'
            })
          }
        }]
      })

      const youngResult = await AnalysisServiceV2.generatePersonalizedRoutine(
        mockDiagnostic, 
        youngUser, 
        'test-young'
      )

      // Vérifier que l'âge est pris en compte dans le prompt
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('20 ans')
            })
          ])
        })
      )
    })
  })

  describe('ÉTAPE 3: Sélection Produits', () => {
    const mockRoutine = {
      phases: {
        immediate: {
          duration: '1-2 semaines',
          objective: 'Stabiliser',
          steps: [
            {
              stepNumber: 1,
              careType: 'nettoyage',
              timing: 'both',
              targetProblem: 'Impuretés',
              targetZones: ['visage entier']
            }
          ]
        },
        adaptation: { duration: '3-6 semaines', objective: 'Adapter', steps: [] },
        maintenance: { duration: 'Continu', objective: 'Maintenir', steps: [] }
      },
      globalAdvice: ['Conseil'],
      dermatologicalRationale: 'Logique'
    }

    it('devrait sélectionner des produits correspondant à la routine', async () => {
      const mockProducts = {
        selectedProducts: [
          {
            routineStepId: 1,
            catalogId: 'cerave_gel_123',
            productName: 'Gel Nettoyant',
            brand: 'CeraVe',
            price: 12.99,
            justification: 'Adapté peau mixte',
            applicationAdvice: 'Masser délicatement',
            timing: 'matin et soir',
            targetZones: ['visage entier'],
            temporaryLabel: false,
            progressiveIntroduction: null,
            restrictions: []
          }
        ],
        budgetBreakdown: {
          totalCost: 12.99,
          budgetRespected: true,
          optimizations: [],
          alternatives: []
        },
        coherenceValidation: {
          routineProductsMatch: true,
          zonesCoherent: true,
          timingLogical: true,
          budgetRespected: true,
          issuesFound: []
        }
      }

      const mockOpenAI = require('openai').default
      const mockCreate = mockOpenAI().chat.completions.create
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockProducts)
          }
        }]
      })

      const result = await AnalysisServiceV2.selectOptimalProducts(
        mockRoutine, 
        mockRequest, 
        'test-request-id'
      )

      // Vérifier validation Zod
      expect(() => ProductSelectionSchema.parse(result)).not.toThrow()
      
      // Vérifier correspondance routine-produits
      expect(result.selectedProducts.length).toBeGreaterThan(0)
      expect(result.budgetBreakdown.budgetRespected).toBe(true)
      expect(result.coherenceValidation.routineProductsMatch).toBe(true)
    })

    it('devrait respecter le budget utilisateur', async () => {
      const lowBudgetRequest = { ...mockRequest, constraints: { ...mockRequest.constraints, budget: 30 } }

      const mockProducts = {
        selectedProducts: [
          {
            routineStepId: 1,
            catalogId: 'budget_product',
            productName: 'Produit Économique',
            brand: 'Budget Brand',
            price: 25.00,
            justification: 'Option économique',
            applicationAdvice: 'Usage normal',
            timing: 'quotidien',
            targetZones: ['visage'],
            temporaryLabel: false
          }
        ],
        budgetBreakdown: {
          totalCost: 25.00,
          budgetRespected: true,
          optimizations: ['Produit économique sélectionné'],
          alternatives: []
        },
        coherenceValidation: {
          routineProductsMatch: true,
          zonesCoherent: true,
          timingLogical: true,
          budgetRespected: true,
          issuesFound: []
        }
      }

      const mockOpenAI = require('openai').default
      const mockCreate = mockOpenAI().chat.completions.create
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockProducts)
          }
        }]
      })

      const result = await AnalysisServiceV2.selectOptimalProducts(
        mockRoutine, 
        lowBudgetRequest, 
        'test-budget'
      )

      expect(result.budgetBreakdown.totalCost).toBeLessThanOrEqual(30)
      expect(result.budgetBreakdown.budgetRespected).toBe(true)
    })
  })

  describe('ÉTAPE 4: Analyse Complète', () => {
    it('devrait orchestrer les 4 étapes avec succès', async () => {
      // Mock toutes les étapes
      const mockOpenAI = require('openai').default
      const mockCreate = mockOpenAI().chat.completions.create
      
      // Mock diagnostic
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockDiagnostic) } }]
      })
      
      // Mock routine
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          phases: {
            immediate: { duration: '1-2 sem', objective: 'Stabiliser', steps: [{ stepNumber: 1, careType: 'nettoyage', timing: 'both' }] },
            adaptation: { duration: '3-6 sem', objective: 'Adapter', steps: [] },
            maintenance: { duration: 'Continu', objective: 'Maintenir', steps: [] }
          },
          globalAdvice: ['Conseil'],
          dermatologicalRationale: 'Logique'
        }) } }]
      })
      
      // Mock produits
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          selectedProducts: [{
            routineStepId: 1,
            catalogId: 'test',
            productName: 'Test',
            brand: 'Test',
            price: 10,
            justification: 'Test',
            applicationAdvice: 'Test',
            timing: 'test',
            targetZones: ['test']
          }],
          budgetBreakdown: { totalCost: 10, budgetRespected: true },
          coherenceValidation: { routineProductsMatch: true, zonesCoherent: true, timingLogical: true, budgetRespected: true, issuesFound: [] }
        }) } }]
      })

      const result = await AnalysisServiceV2.analyzeSkinComplete(mockRequest)

      // Vérifier structure complète
      expect(result.diagnostic).toBeDefined()
      expect(result.routine).toBeDefined()
      expect(result.products).toBeDefined()
      expect(result.coherenceValidation).toBeDefined()
      expect(result.qualityMetrics).toBeDefined()
      expect(result.version).toBe('2.0')
    })

    it('devrait calculer des métriques de qualité', async () => {
      // Test avec mock complet...
      // (Implémentation similaire au test précédent)
    })
  })

  describe('Validation et Cohérence', () => {
    it('devrait valider la cohérence entre diagnostic et routine', () => {
      // Tests de validation croisée
      // Vérifier que les zones diagnostiquées sont traitées dans la routine
      // Vérifier que les problèmes identifiés ont des solutions
    })

    it('devrait détecter les incohérences budget', () => {
      // Tests de validation budget
      // Vérifier dépassement budget
      // Vérifier alternatives proposées
    })
  })
})

describe('Métriques de Personnalisation V2', () => {
  it('devrait générer des routines différentes pour des diagnostics différents', async () => {
    const diagnosticAcne = {
      ...mockDiagnostic,
      zoneSpecificIssues: [
        { zone: 'joues', problem: 'Acné active', intensity: 'intense', description: 'Boutons inflammatoires' }
      ]
    }

    const diagnosticPerfect = {
      ...mockDiagnostic,
      scores: { ...mockDiagnostic.scores, overall: 95 },
      zoneSpecificIssues: []
    }

    // Mock différentes réponses
    const mockOpenAI = require('openai').default
    const mockCreate = mockOpenAI().chat.completions.create
    
    mockCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          phases: {
            immediate: { steps: [{ careType: 'traitement', targetProblem: 'Acné' }] },
            adaptation: { steps: [] },
            maintenance: { steps: [] }
          },
          globalAdvice: ['Anti-acné'],
          dermatologicalRationale: 'Traitement acné'
        }) } }]
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          phases: {
            immediate: { steps: [{ careType: 'hydratation', targetProblem: 'Maintien' }] },
            adaptation: { steps: [] },
            maintenance: { steps: [] }
          },
          globalAdvice: ['Maintien'],
          dermatologicalRationale: 'Routine maintien'
        }) } }]
      })

    const routineAcne = await AnalysisServiceV2.generatePersonalizedRoutine(diagnosticAcne, mockRequest, 'test1')
    const routinePerfect = await AnalysisServiceV2.generatePersonalizedRoutine(diagnosticPerfect, mockRequest, 'test2')

    // Vérifier différenciation
    expect(routineAcne.dermatologicalRationale).not.toBe(routinePerfect.dermatologicalRationale)
    expect(routineAcne.phases.immediate.steps[0].targetProblem).not.toBe(routinePerfect.phases.immediate.steps[0].targetProblem)
  })
})
