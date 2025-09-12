/**
 * 🔥 SPRINT 2 - TESTS COHÉRENCE PRODUITS
 * Tests pour ProductMappingHelpers.ts
 * 
 * TESTS OBLIGATOIRES selon planning:
 * - Test mapping : routine sans produits → produits générés
 * - Test cohérence : produits continus dans 3 phases
 * - Test synchronisation : routine produits = section produits
 * - Test labels : nouveaux actifs ont "introduire J+X"
 */

import {
  ensureProductMapping,
  generateFallbackProduct,
  validateProductExists,
  ensurePhaseCoherence,
  propagateContinuousProducts,
  addIntroductionLabels,
  extractAllCatalogIds,
  ensureProductSync,
  hasStepsWithoutProducts,
  countStepsWithoutProducts,
  applyProductMappingToRoutine,
  applyFullCoherence
} from '../ProductMappingHelpers'

import type { UnifiedRoutineStep, SkinAnalysis, RecommendedProduct } from '@/types'

// Mock du service de catalogue
jest.mock('@/services/catalog/enrichedCatalogService', () => ({
  EnrichedCatalogService: {
    getProductById: jest.fn((id: string) => {
      const mockProducts: Record<string, any> = {
        'cerave_gel_moussant': {
          id: 'cerave_gel_moussant',
          name: 'Gel Moussant Nettoyant',
          brand: 'CeraVe',
          category: 'cleanser',
          price: 12.99,
          affiliateLink: 'https://example.com/cerave'
        },
        'ordinary_niacinamide_10': {
          id: 'ordinary_niacinamide_10',
          name: 'Sérum Niacinamide 10%',
          brand: 'The Ordinary',
          category: 'serum',
          price: 7.20,
          affiliateLink: 'https://example.com/ordinary'
        }
      }
      return Promise.resolve(mockProducts[id] || null)
    })
  }
}))

describe('ProductMappingHelpers - Sprint 2 Cohérence Produits', () => {
  
  // Données de test
  const createMockStep = (overrides: Partial<UnifiedRoutineStep> = {}): UnifiedRoutineStep => ({
    stepNumber: 1,
    title: 'Test Step',
    targetArea: 'global',
    recommendedProducts: [],
    applicationAdvice: 'Test advice',
    treatmentType: 'cleansing',
    priority: 1,
    phase: 'immediate',
    frequency: 'daily',
    timeOfDay: 'morning',
    category: 'cleansing',
    ...overrides
  })

  const createMockAnalysis = (overrides: Partial<SkinAnalysis> = {}): SkinAnalysis => ({
    id: 'test-analysis',
    userId: 'test-user',
    photos: [],
    scores: {
      hydration: { value: 70, justification: 'Test', confidence: 0.9, basedOn: [] },
      wrinkles: { value: 80, justification: 'Test', confidence: 0.9, basedOn: [] },
      firmness: { value: 75, justification: 'Test', confidence: 0.9, basedOn: [] },
      radiance: { value: 85, justification: 'Test', confidence: 0.9, basedOn: [] },
      pores: { value: 70, justification: 'Test', confidence: 0.9, basedOn: [] },
      spots: { value: 90, justification: 'Test', confidence: 0.9, basedOn: [] },
      darkCircles: { value: 65, justification: 'Test', confidence: 0.9, basedOn: [] },
      skinAge: { value: 75, justification: 'Test', confidence: 0.9, basedOn: [] },
      overall: 75
    },
    beautyAssessment: {
      mainConcern: 'Test concern',
      intensity: 'modérée',
      concernedZones: ['visage'],
      visualFindings: ['Test finding'],
      expectedImprovement: 'Test improvement'
    },
    recommendations: {
      immediate: [],
      routine: [],
      products: [],
      lifestyle: []
    },
    createdAt: new Date(),
    ...overrides
  })

  describe('TÂCHE 2.1: MAPPING PRODUITS GARANTI', () => {
    
    test('ensureProductMapping - étape avec produits existants', async () => {
      const existingProduct: RecommendedProduct = {
        id: 'existing-product',
        name: 'Existing Product',
        brand: 'Test Brand',
        category: 'cleanser'
      }
      
      const step = createMockStep({
        recommendedProducts: [existingProduct]
      })

      const result = await ensureProductMapping(step)
      
      expect(result.recommendedProducts).toHaveLength(1)
      expect(result.recommendedProducts[0]).toEqual(existingProduct)
    })

    test('ensureProductMapping - étape sans produit avec catalogId valide', async () => {
      const step = createMockStep({
        catalogId: 'cerave_gel_moussant',
        recommendedProducts: []
      })

      const result = await ensureProductMapping(step)
      
      expect(result.recommendedProducts).toHaveLength(1)
      expect(result.recommendedProducts[0].name).toBe('Gel Moussant Nettoyant')
      expect(result.recommendedProducts[0].brand).toBe('CeraVe')
    })

    test('ensureProductMapping - étape sans produit avec catalogId invalide', async () => {
      const step = createMockStep({
        catalogId: 'invalid-catalog-id',
        category: 'cleansing',
        recommendedProducts: []
      })

      const result = await ensureProductMapping(step)
      
      expect(result.recommendedProducts).toHaveLength(1)
      expect(result.recommendedProducts[0].name).toBe('Gel Moussant Nettoyant')
      expect(result.recommendedProducts[0].brand).toBe('CeraVe')
    })

    test('ensureProductMapping - étape sans produit ni catalogId', async () => {
      const step = createMockStep({
        category: 'hydration',
        recommendedProducts: []
      })

      const result = await ensureProductMapping(step)
      
      expect(result.recommendedProducts).toHaveLength(1)
      expect(result.recommendedProducts[0].category).toBe('moisturizer')
      expect(result.recommendedProducts[0].brand).toBe('CeraVe')
    })

    test('generateFallbackProduct - catégories différentes', () => {
      const cleansingProduct = generateFallbackProduct('cleansing', 'Test Cleanser')
      expect(cleansingProduct.category).toBe('cleanser')
      expect(cleansingProduct.brand).toBe('CeraVe')

      const treatmentProduct = generateFallbackProduct('treatment', 'Test Treatment')
      expect(treatmentProduct.category).toBe('serum')
      expect(treatmentProduct.brand).toBe('The Ordinary')

      const protectionProduct = generateFallbackProduct('protection', 'Test SPF')
      expect(protectionProduct.category).toBe('sunscreen')
      expect(protectionProduct.brand).toBe('La Roche-Posay')
    })

    test('validateProductExists - produit existant', async () => {
      const exists = await validateProductExists('cerave_gel_moussant')
      expect(exists).toBe(true)
    })

    test('validateProductExists - produit inexistant', async () => {
      const exists = await validateProductExists('invalid-product-id')
      expect(exists).toBe(false)
    })
  })

  describe('TÂCHE 2.2: COHÉRENCE INTER-PHASES', () => {
    
    test('ensurePhaseCoherence - produits continus dans toutes phases', () => {
      const routine: UnifiedRoutineStep[] = [
        // Phase immédiate avec nettoyant
        createMockStep({
          stepNumber: 1,
          phase: 'immediate',
          category: 'cleansing',
          timeOfDay: 'morning',
          title: 'Nettoyant matin'
        }),
        // Phase adaptation sans nettoyant
        createMockStep({
          stepNumber: 2,
          phase: 'adaptation',
          category: 'treatment',
          timeOfDay: 'morning',
          title: 'Traitement adaptation'
        }),
        // Phase maintenance sans nettoyant
        createMockStep({
          stepNumber: 3,
          phase: 'maintenance',
          category: 'treatment',
          timeOfDay: 'morning',
          title: 'Traitement maintenance'
        })
      ]

      const result = ensurePhaseCoherence(routine)
      
      // Vérifier que le nettoyant est présent dans toutes les phases
      const cleansingSteps = result.filter(step => step.category === 'cleansing')
      expect(cleansingSteps).toHaveLength(3) // Une pour chaque phase
      
      const phases = cleansingSteps.map(step => step.phase)
      expect(phases).toContain('immediate')
      expect(phases).toContain('adaptation')
      expect(phases).toContain('maintenance')
    })

    test('ensurePhaseCoherence - hydratant et protection propagés', () => {
      const routine: UnifiedRoutineStep[] = [
        createMockStep({
          phase: 'immediate',
          category: 'hydration',
          timeOfDay: 'both',
          title: 'Hydratant'
        }),
        createMockStep({
          phase: 'immediate',
          category: 'protection',
          timeOfDay: 'morning',
          title: 'Protection solaire'
        })
      ]

      const result = ensurePhaseCoherence(routine)
      
      // Vérifier propagation hydratant
      const hydrationSteps = result.filter(step => step.category === 'hydration')
      expect(hydrationSteps).toHaveLength(3) // Une pour chaque phase
      
      // Vérifier propagation protection
      const protectionSteps = result.filter(step => step.category === 'protection')
      expect(protectionSteps).toHaveLength(3) // Une pour chaque phase
    })

    test('addIntroductionLabels - labels temporels pour traitements', () => {
      const treatmentStep = createMockStep({
        category: 'treatment',
        title: 'Sérum actif'
      })

      const result = addIntroductionLabels(treatmentStep, 14)
      
      expect(result.startAfterDays).toBe(14)
      expect(result.frequencyDetails).toBe('Introduire à partir de J+14')
      expect(result.applicationDuration).toContain('J+14')
    })

    test('addIntroductionLabels - pas de labels pour produits continus', () => {
      const cleansingStep = createMockStep({
        category: 'cleansing',
        title: 'Nettoyant'
      })

      const result = addIntroductionLabels(cleansingStep, 14)
      
      expect(result.startAfterDays).toBeUndefined()
      expect(result.frequencyDetails).toBeUndefined()
    })
  })

  describe('TÂCHE 2.3: SYNCHRONISATION SECTION PRODUITS', () => {
    
    test('extractAllCatalogIds - routine unifiée', () => {
      const analysis = createMockAnalysis({
        recommendations: {
          immediate: [],
          routine: [],
          products: [],
          lifestyle: [],
          unifiedRoutine: [
            createMockStep({
              catalogId: 'cerave_gel_moussant',
              recommendedProducts: [
                {
                  id: 'product-1',
                  name: 'Product 1',
                  brand: 'Brand 1',
                  category: 'cleanser',
                  catalogId: 'ordinary_niacinamide_10'
                }
              ]
            })
          ]
        }
      })

      const catalogIds = extractAllCatalogIds(analysis)
      
      expect(catalogIds).toContain('cerave_gel_moussant')
      expect(catalogIds).toContain('ordinary_niacinamide_10')
      expect(catalogIds).toHaveLength(2)
    })

    test('extractAllCatalogIds - routine par phases', () => {
      const analysis = createMockAnalysis({
        recommendations: {
          immediate: [],
          routine: {
            immediate: [{ catalogId: 'cerave_gel_moussant', name: 'Nettoyant' }],
            adaptation: [{ catalogId: 'ordinary_niacinamide_10', name: 'Sérum' }],
            maintenance: [{ catalogId: 'lrp_anthelios_fluid', name: 'Protection' }]
          },
          products: [],
          lifestyle: []
        }
      })

      const catalogIds = extractAllCatalogIds(analysis)
      
      expect(catalogIds).toContain('cerave_gel_moussant')
      expect(catalogIds).toContain('ordinary_niacinamide_10')
      expect(catalogIds).toContain('lrp_anthelios_fluid')
      expect(catalogIds).toHaveLength(3)
    })

    test('extractAllCatalogIds - routine localisée', () => {
      const analysis = createMockAnalysis({
        recommendations: {
          immediate: [],
          routine: [],
          products: [],
          lifestyle: [],
          localizedRoutine: [
            {
              zone: 'menton',
              steps: [
                { catalogId: 'cerave_gel_moussant', name: 'Nettoyant zone' }
              ]
            }
          ]
        }
      })

      const catalogIds = extractAllCatalogIds(analysis)
      
      expect(catalogIds).toContain('cerave_gel_moussant')
      expect(catalogIds).toHaveLength(1)
    })

    test('ensureProductSync - synchronisation complète', async () => {
      const analysis = createMockAnalysis({
        recommendations: {
          immediate: [],
          routine: [],
          products: [],
          lifestyle: [],
          unifiedRoutine: [
            createMockStep({
              catalogId: 'cerave_gel_moussant'
            }),
            createMockStep({
              catalogId: 'invalid-product-id'
            })
          ]
        }
      })

      const result = await ensureProductSync(analysis)
      
      expect(result.catalogIds).toContain('cerave_gel_moussant')
      expect(result.catalogIds).toContain('invalid-product-id')
      expect(result.missingProducts).toContain('invalid-product-id')
      expect(result.syncedProducts).toHaveLength(2) // 1 réel + 1 fallback
    })
  })

  describe('FONCTIONS UTILITAIRES', () => {
    
    test('hasStepsWithoutProducts - détection étapes sans produits', () => {
      const routineWithMissing: UnifiedRoutineStep[] = [
        createMockStep({
          recommendedProducts: [{ id: '1', name: 'Product', brand: 'Brand', category: 'cleanser' }]
        }),
        createMockStep({
          recommendedProducts: [] // Étape sans produit
        })
      ]

      const routineComplete: UnifiedRoutineStep[] = [
        createMockStep({
          recommendedProducts: [{ id: '1', name: 'Product', brand: 'Brand', category: 'cleanser' }]
        })
      ]

      expect(hasStepsWithoutProducts(routineWithMissing)).toBe(true)
      expect(hasStepsWithoutProducts(routineComplete)).toBe(false)
    })

    test('countStepsWithoutProducts - comptage étapes sans produits', () => {
      const routine: UnifiedRoutineStep[] = [
        createMockStep({
          recommendedProducts: [{ id: '1', name: 'Product', brand: 'Brand', category: 'cleanser' }]
        }),
        createMockStep({
          recommendedProducts: []
        }),
        createMockStep({
          recommendedProducts: []
        })
      ]

      expect(countStepsWithoutProducts(routine)).toBe(2)
    })

    test('applyProductMappingToRoutine - mapping complet', async () => {
      const routine: UnifiedRoutineStep[] = [
        createMockStep({
          category: 'cleansing',
          recommendedProducts: []
        }),
        createMockStep({
          category: 'hydration',
          recommendedProducts: []
        })
      ]

      const result = await applyProductMappingToRoutine(routine)
      
      expect(result).toHaveLength(2)
      expect(result[0].recommendedProducts).toHaveLength(1)
      expect(result[1].recommendedProducts).toHaveLength(1)
      expect(result[0].recommendedProducts[0].category).toBe('cleanser')
      expect(result[1].recommendedProducts[0].category).toBe('moisturizer')
    })

    test('applyFullCoherence - cohérence complète', async () => {
      const routine: UnifiedRoutineStep[] = [
        createMockStep({
          phase: 'immediate',
          category: 'cleansing',
          timeOfDay: 'morning',
          recommendedProducts: []
        }),
        createMockStep({
          phase: 'adaptation',
          category: 'treatment',
          timeOfDay: 'evening',
          recommendedProducts: []
        })
      ]

      const result = await applyFullCoherence(routine)
      
      // Vérifier que tous les steps ont des produits
      expect(result.every(step => step.recommendedProducts.length > 0)).toBe(true)
      
      // Vérifier que le nettoyant est propagé dans toutes les phases
      const cleansingSteps = result.filter(step => step.category === 'cleansing')
      expect(cleansingSteps.length).toBeGreaterThan(1)
      
      // Vérifier les labels temporels pour les traitements
      const treatmentInAdaptation = result.find(step => 
        step.phase === 'adaptation' && step.category === 'treatment'
      )
      expect(treatmentInAdaptation?.startAfterDays).toBe(14)
    })
  })

  describe('TESTS D\'INTÉGRATION - CRITÈRES SUCCÈS SPRINT 2', () => {
    
    test('CRITÈRE: Chaque étape routine a un produit recommandé (100%)', async () => {
      const routineIncomplete: UnifiedRoutineStep[] = [
        createMockStep({ recommendedProducts: [] }),
        createMockStep({ recommendedProducts: [] }),
        createMockStep({ recommendedProducts: [] })
      ]

      const result = await applyProductMappingToRoutine(routineIncomplete)
      
      // 100% des étapes doivent avoir des produits
      expect(result.every(step => step.recommendedProducts.length > 0)).toBe(true)
      expect(countStepsWithoutProducts(result)).toBe(0)
    })

    test('CRITÈRE: Produits continus présents dans toutes phases', () => {
      const routine: UnifiedRoutineStep[] = [
        createMockStep({
          phase: 'immediate',
          category: 'cleansing',
          timeOfDay: 'morning'
        }),
        createMockStep({
          phase: 'immediate',
          category: 'hydration',
          timeOfDay: 'both'
        })
      ]

      const result = ensurePhaseCoherence(routine)
      
      // Nettoyant dans toutes les phases
      const cleansingByPhase = {
        immediate: result.filter(s => s.phase === 'immediate' && s.category === 'cleansing'),
        adaptation: result.filter(s => s.phase === 'adaptation' && s.category === 'cleansing'),
        maintenance: result.filter(s => s.phase === 'maintenance' && s.category === 'cleansing')
      }
      
      expect(cleansingByPhase.immediate.length).toBeGreaterThan(0)
      expect(cleansingByPhase.adaptation.length).toBeGreaterThan(0)
      expect(cleansingByPhase.maintenance.length).toBeGreaterThan(0)
      
      // Hydratant dans toutes les phases
      const hydrationByPhase = {
        immediate: result.filter(s => s.phase === 'immediate' && s.category === 'hydration'),
        adaptation: result.filter(s => s.phase === 'adaptation' && s.category === 'hydration'),
        maintenance: result.filter(s => s.phase === 'maintenance' && s.category === 'hydration')
      }
      
      expect(hydrationByPhase.immediate.length).toBeGreaterThan(0)
      expect(hydrationByPhase.adaptation.length).toBeGreaterThan(0)
      expect(hydrationByPhase.maintenance.length).toBeGreaterThan(0)
    })

    test('CRITÈRE: Section "Produits Recommandés" synchronisée avec routine', async () => {
      const analysis = createMockAnalysis({
        recommendations: {
          immediate: [],
          routine: [],
          products: [],
          lifestyle: [],
          unifiedRoutine: [
            createMockStep({ catalogId: 'cerave_gel_moussant' }),
            createMockStep({ catalogId: 'ordinary_niacinamide_10' })
          ]
        }
      })

      const syncResult = await ensureProductSync(analysis)
      const extractedIds = extractAllCatalogIds(analysis)
      
      // Tous les IDs de la routine doivent être dans la synchronisation
      expect(syncResult.catalogIds).toEqual(expect.arrayContaining(extractedIds))
      expect(syncResult.syncedProducts.length).toBe(extractedIds.length)
    })

    test('CRITÈRE: Labels temporels "J+X" fonctionnels', () => {
      const treatmentStep = createMockStep({
        category: 'treatment',
        phase: 'adaptation'
      })

      const labeledStep = addIntroductionLabels(treatmentStep, 14)
      
      expect(labeledStep.startAfterDays).toBe(14)
      expect(labeledStep.frequencyDetails).toContain('J+14')
      expect(labeledStep.applicationDuration).toContain('J+14')
    })
  })
})
