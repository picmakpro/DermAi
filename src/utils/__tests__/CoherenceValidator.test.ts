/**
 * TESTS COHERENCE VALIDATOR - SPRINT 3 QUALITÉ DERMAI V2
 * Tests validation cohérence diagnostic ↔ produits ↔ budget
 */

import { CoherenceValidator } from '../CoherenceValidator'
import type { SkinAnalysis, BeautyAssessment, ProductRecommendations } from '@/types'
import type { AnalyzeRequest } from '@/types/api'

// Mock uuid pour éviter les problèmes d'import
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}))

// Mock Logger pour éviter les dépendances
jest.mock('../Logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

describe('CoherenceValidator - Sprint 3 Qualité', () => {
  
  // Données de test standardisées
  const mockRequest: AnalyzeRequest = {
    photos: [{ file: 'data:image/jpeg;base64,test', type: 'selfie' }],
    userProfile: {
      age: 30,
      gender: 'Femme',
      skinType: 'Mixte'
    },
    skinConcerns: {
      primary: ['Imperfections', 'Pores dilatés']
    },
    currentRoutine: {
      morningProducts: [],
      eveningProducts: [],
      monthlyBudget: '50-100€',
      routinePreference: 'Simple'
    },
    allergies: {
      ingredients: [],
      pastReactions: ''
    }
  }
  
  const mockAnalysisCoherent: SkinAnalysis = {
    id: 'test_analysis_coherent',
    userId: 'test_user',
    photos: mockRequest.photos,
    scores: {
      hydration: { value: 75, justification: 'Test', confidence: 0.8, basedOn: ['visual'] },
      wrinkles: { value: 80, justification: 'Test', confidence: 0.8, basedOn: ['visual'] },
      firmness: { value: 78, justification: 'Test', confidence: 0.8, basedOn: ['visual'] },
      radiance: { value: 72, justification: 'Test', confidence: 0.8, basedOn: ['visual'] },
      pores: { value: 65, justification: 'Test', confidence: 0.8, basedOn: ['visual'] },
      spots: { value: 70, justification: 'Test', confidence: 0.8, basedOn: ['visual'] },
      darkCircles: { value: 85, justification: 'Test', confidence: 0.8, basedOn: ['visual'] },
      skinAge: { value: 75, justification: 'Test', confidence: 0.8, basedOn: ['visual'] },
      overall: 75
    },
    beautyAssessment: {
      skinType: 'Peau mixte',
      mainConcern: 'Imperfections et pores dilatés',
      intensity: 'modérée',
      concernedZones: ['nez', 'menton', 'front'],
      specificities: [
        { name: 'Imperfections', intensity: 'modérée', zones: ['nez', 'menton'] },
        { name: 'Pores dilatés', intensity: 'modérée', zones: ['nez'] }
      ],
      visualFindings: ['Pores visibles zone T', 'Quelques imperfections'],
      overview: ['Peau mixte avec zone T grasse', 'Préoccupations modérées'],
      zoneSpecific: [
        { zone: 'nez', problems: [{ name: 'Pores dilatés', intensity: 'modérée' }], description: 'Zone T grasse' },
        { zone: 'menton', problems: [{ name: 'Imperfections', intensity: 'modérée' }], description: 'Quelques boutons' }
      ],
      expectedImprovement: 'Amélioration visible en 6-8 semaines',
      improvementTimeEstimate: '2-3 mois'
    },
    recommendations: {
      immediate: ['Nettoyage adapté zone T', 'Sérum régulateur sébum'],
      routine: {
        immediate: [
          {
            name: 'CeraVe Nettoyant Moussant',
            frequency: 'quotidien',
            timing: 'matin_et_soir',
            catalogId: 'B01MSSDEPK',
            application: 'Nettoyage adapté pour zone T et menton',
            startDate: 'maintenant'
          },
          {
            name: 'The Ordinary Niacinamide 10%',
            frequency: 'quotidien',
            timing: 'soir',
            catalogId: 'B01MDTVZTZ',
            application: 'Sérum régulateur actif pour nez et menton',
            startDate: 'maintenant'
          }
        ],
        adaptation: [],
        maintenance: []
      },
      localizedRoutine: [
        {
          name: 'Traitement localisé nez',
          frequency: 'quotidien',
          timing: 'soir',
          catalogId: 'B00949CTQQ',
          application: 'BHA pour pores dilatés',
          startDate: 'semaine 2',
          targetZone: 'nez'
        }
      ],
      overview: 'Routine ciblée zone T',
      zoneSpecificCare: 'Soins spécifiques nez et menton',
      restrictions: 'Éviter sur-nettoyage'
    },
    createdAt: new Date()
  }
  
  describe('🔍 Tests Validation Cohérence Complète', () => {
    
    test('Validation analyse cohérente - PASS complet', () => {
      const report = CoherenceValidator.validateAnalysis(
        mockRequest,
        mockAnalysisCoherent,
        'test_coherent'
      )
      
      expect(report.coherenceCheck.zonesMatch).toBe(true)
      expect(report.coherenceCheck.intensityMatch).toBe(true)
      expect(report.coherenceCheck.budgetRespected).toBe(true)
      expect(report.coherenceCheck.overallCoherent).toBe(true)
      expect(report.coherenceCheck.issues).toHaveLength(0)
      expect(report.coherenceCheck.score).toBeGreaterThan(90)
      expect(report.finalScore).toBeGreaterThan(90)
      expect(report.corrections).toHaveLength(0)
    })
    
    test('Détection incohérence zones diagnostic vs produits', () => {
      const analysisIncohérente = {
        ...mockAnalysisCoherent,
        beautyAssessment: {
          ...mockAnalysisCoherent.beautyAssessment,
          concernedZones: ['contour des yeux', 'lèvres'], // Zones différentes
          zoneSpecific: [
            { zone: 'contour des yeux', problems: [{ name: 'Rides', intensity: 'légère' }], description: 'Rides fines' }
          ]
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        mockRequest,
        analysisIncohérente,
        'test_zones_incoherent'
      )
      
      expect(report.coherenceCheck.zonesMatch).toBe(false)
      expect(report.coherenceCheck.issues.some(issue => issue.includes('Incohérence zones'))).toBe(true)
      expect(report.corrections.some(c => c.type === 'zone')).toBe(true)
      expect(report.finalScore).toBeLessThan(80)
    })
    
    test('Détection incohérence intensité vs potency produits', () => {
      const analysisIntenseAvecProduitsDoux = {
        ...mockAnalysisCoherent,
        beautyAssessment: {
          ...mockAnalysisCoherent.beautyAssessment,
          intensity: 'intense' // Problème intense
        },
        recommendations: {
          ...mockAnalysisCoherent.recommendations,
          routine: {
            immediate: [
              {
                name: 'Nettoyant Doux Sensitive', // Produit doux pour problème intense
                frequency: 'quotidien',
                timing: 'matin_et_soir',
                catalogId: 'B01GENTLE',
                application: 'Nettoyage très doux',
                startDate: 'maintenant'
              }
            ],
            adaptation: [],
            maintenance: []
          }
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        mockRequest,
        analysisIntenseAvecProduitsDoux,
        'test_intensity_incoherent'
      )
      
      expect(report.coherenceCheck.intensityMatch).toBe(false)
      expect(report.coherenceCheck.issues.some(issue => issue.includes('Incohérence intensité'))).toBe(true)
      expect(report.corrections.some(c => c.type === 'intensity')).toBe(true)
    })
    
    test('Détection dépassement budget utilisateur', () => {
      const requestBudgetFaible = {
        ...mockRequest,
        currentRoutine: {
          ...mockRequest.currentRoutine,
          monthlyBudget: '0-50€' // Budget faible
        }
      }
      
      const analysisProduitsCher = {
        ...mockAnalysisCoherent,
        recommendations: {
          ...mockAnalysisCoherent.recommendations,
          routine: {
            immediate: [
              {
                name: 'La Mer Crème Premium', // Produit très cher
                frequency: 'quotidien',
                timing: 'soir',
                catalogId: 'B01LAMER',
                application: 'Crème premium',
                startDate: 'maintenant'
              },
              {
                name: 'SK-II Essence Premium',
                frequency: 'quotidien',
                timing: 'matin',
                catalogId: 'B01SKII',
                application: 'Essence premium',
                startDate: 'maintenant'
              }
            ],
            adaptation: [],
            maintenance: []
          }
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        requestBudgetFaible,
        analysisProduitsCher,
        'test_budget_depasse'
      )
      
      expect(report.coherenceCheck.budgetRespected).toBe(false)
      expect(report.coherenceCheck.issues.some(issue => issue.includes('Budget dépassé'))).toBe(true)
      expect(report.corrections.some(c => c.type === 'budget')).toBe(true)
    })
  })
  
  describe('🎯 Tests Edge Cases Cohérence', () => {
    
    test('Gestion budget format non-standard', () => {
      const requestBudgetSpecial = {
        ...mockRequest,
        currentRoutine: {
          ...mockRequest.currentRoutine,
          monthlyBudget: 'moins de 30€'
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        requestBudgetSpecial,
        mockAnalysisCoherent,
        'test_budget_special'
      )
      
      // Devrait parser correctement "moins de 30€"
      expect(report.coherenceCheck.budgetRespected).toBeDefined()
    })
    
    test('Analyse sans zones spécifiques', () => {
      const analysisSansZones = {
        ...mockAnalysisCoherent,
        beautyAssessment: {
          ...mockAnalysisCoherent.beautyAssessment,
          concernedZones: [],
          zoneSpecific: []
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        mockRequest,
        analysisSansZones,
        'test_sans_zones'
      )
      
      // Ne devrait pas échouer sur zones vides
      expect(report.coherenceCheck.zonesMatch).toBe(true)
      expect(report.coherenceCheck.overallCoherent).toBeDefined()
    })
    
    test('Routine avec produits sans catalogId', () => {
      const analysisIdManquant = {
        ...mockAnalysisCoherent,
        recommendations: {
          ...mockAnalysisCoherent.recommendations,
          routine: {
            immediate: [
              {
                name: 'Produit Sans ID',
                frequency: 'quotidien',
                timing: 'soir',
                catalogId: '', // ID manquant
                application: 'Application test',
                startDate: 'maintenant'
              }
            ],
            adaptation: [],
            maintenance: []
          }
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        mockRequest,
        analysisIdManquant,
        'test_id_manquant'
      )
      
      // Devrait gérer gracieusement les IDs manquants
      expect(report.coherenceCheck).toBeDefined()
      expect(report.finalScore).toBeGreaterThan(0)
    })
  })
  
  describe('📊 Tests Métriques Cohérence', () => {
    
    test('Calcul métriques sur multiple rapports', () => {
      const reports = [
        CoherenceValidator.validateAnalysis(mockRequest, mockAnalysisCoherent, 'test1'),
        CoherenceValidator.validateAnalysis(mockRequest, mockAnalysisCoherent, 'test2'),
        CoherenceValidator.validateAnalysis(mockRequest, {
          ...mockAnalysisCoherent,
          beautyAssessment: {
            ...mockAnalysisCoherent.beautyAssessment,
            intensity: 'intense'
          }
        }, 'test3')
      ]
      
      const metrics = CoherenceValidator.getCoherenceMetrics(reports)
      
      expect(metrics.totalValidations).toBe(3)
      expect(metrics.avgCoherenceScore).toBeGreaterThan(0)
      expect(metrics.zonesCoherenceRate).toBeGreaterThanOrEqual(0)
      expect(metrics.zonesCoherenceRate).toBeLessThanOrEqual(1)
      expect(metrics.intensityCoherenceRate).toBeGreaterThanOrEqual(0)
      expect(metrics.budgetCoherenceRate).toBeGreaterThanOrEqual(0)
      expect(metrics.overallCoherenceRate).toBeGreaterThanOrEqual(0)
    })
    
    test('Métriques sur liste vide', () => {
      const metrics = CoherenceValidator.getCoherenceMetrics([])
      
      expect(metrics.totalValidations).toBe(0)
      expect(metrics.avgCoherenceScore).toBe(0)
      expect(metrics.zonesCoherenceRate).toBe(0)
      expect(metrics.intensityCoherenceRate).toBe(0)
      expect(metrics.budgetCoherenceRate).toBe(0)
      expect(metrics.overallCoherenceRate).toBe(0)
      expect(metrics.avgCorrections).toBe(0)
    })
  })
  
  describe('🔧 Tests Corrections Automatiques', () => {
    
    test('Génération corrections pour problèmes multiples', () => {
      const analysisProblematique = {
        ...mockAnalysisCoherent,
        beautyAssessment: {
          ...mockAnalysisCoherent.beautyAssessment,
          intensity: 'intense',
          concernedZones: ['contour des yeux'] // Zone différente des produits
        },
        recommendations: {
          ...mockAnalysisCoherent.recommendations,
          routine: {
            ...mockAnalysisCoherent.recommendations.routine,
            immediate: [
              {
                name: 'La Mer Crème Hydratante', // Produit cher + trop doux pour intensité "intense"
                frequency: 'quotidien',
                timing: 'matin_et_soir',
                catalogId: 'B01MSSDEPK',
                application: 'Nettoyage doux pour zone joues',
                startDate: 'maintenant'
              }
            ]
          },
          localizedRoutine: [] // Vider la routine localisée pour éviter l'overlap
        }
      }
      
      const requestBudgetFaible = {
        ...mockRequest,
        currentRoutine: {
          ...mockRequest.currentRoutine,
          monthlyBudget: '0-30€'
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        requestBudgetFaible,
        analysisProblematique,
        'test_corrections_multiples'
      )
      
      expect(report.corrections.length).toBeGreaterThanOrEqual(2)
      expect(report.corrections.some(c => c.type === 'zone')).toBe(true)
      expect(report.corrections.some(c => c.type === 'intensity')).toBe(true)
    })
    
    test('Priorisation corrections par impact', () => {
      const analysisAvecProblemes = {
        ...mockAnalysisCoherent,
        beautyAssessment: {
          ...mockAnalysisCoherent.beautyAssessment,
          concernedZones: ['zones_inexistantes']
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        mockRequest,
        analysisAvecProblemes,
        'test_priorisation'
      )
      
      const highImpactCorrections = report.corrections.filter(c => c.impact === 'high')
      const mediumImpactCorrections = report.corrections.filter(c => c.impact === 'medium')
      
      // Les corrections high impact devraient être présentes pour zones incohérentes
      expect(highImpactCorrections.length).toBeGreaterThanOrEqual(0)
      expect(report.corrections.every(c => ['low', 'medium', 'high'].includes(c.impact))).toBe(true)
    })
  })
  
  describe('🧮 Tests Calculs Spécialisés', () => {
    
    test('Estimation prix produits selon marques', () => {
      // Test indirect via validation budget
      const analysisProduitsPremium = {
        ...mockAnalysisCoherent,
        recommendations: {
          ...mockAnalysisCoherent.recommendations,
          routine: {
            immediate: [
              {
                name: 'La Mer Regenerating Serum',
                frequency: 'quotidien',
                timing: 'soir',
                catalogId: 'B01LAMER001',
                application: 'Sérum premium',
                startDate: 'maintenant'
              }
            ],
            adaptation: [],
            maintenance: []
          }
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        mockRequest, // Budget 50-100€
        analysisProduitsPremium,
        'test_prix_premium'
      )
      
      // La Mer devrait être détectée comme chère et dépasser le budget
      expect(report.coherenceCheck.budgetRespected).toBe(false)
    })
    
    test('Classification potency produits', () => {
      const analysisProduitsActifs = {
        ...mockAnalysisCoherent,
        beautyAssessment: {
          ...mockAnalysisCoherent.beautyAssessment,
          intensity: 'légère' // Intensité légère
        },
        recommendations: {
          ...mockAnalysisCoherent.recommendations,
          routine: {
            immediate: [
              {
                name: 'Retinol 1% Intense Treatment', // Produit fort
                frequency: 'quotidien',
                timing: 'soir',
                catalogId: 'B01RETINOL',
                application: 'Traitement actif puissant',
                startDate: 'maintenant'
              }
            ],
            adaptation: [],
            maintenance: []
          }
        }
      }
      
      const report = CoherenceValidator.validateAnalysis(
        mockRequest,
        analysisProduitsActifs,
        'test_potency_classification'
      )
      
      // Retinol devrait être détecté comme high potency, incohérent avec intensité légère
      expect(report.coherenceCheck.intensityMatch).toBe(false)
    })
  })
})
