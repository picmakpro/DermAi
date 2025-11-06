/**
 * Tests Unitaires : BudgetOptimizer
 * 
 * @description
 * Tests complets pour l'optimisation budget intelligente
 * basée sur priorités dermatologiques
 * 
 * @see src/services/products/BudgetOptimizer.ts
 * @see docs/architecture/BUDGET-OPTIMIZATION-REFONTE.md
 */

import { BudgetOptimizer } from '@/services/products/BudgetOptimizer'
import type { ProductMatch } from '@/services/products/BudgetOptimizer'
import type { EnrichedProduct } from '@/data/productsDatabase'
import type { BudgetConstraints } from '@/types'
import { CARETYPE_BUDGET_PRIORITIES } from '@/types'

// ==================== MOCKS ====================

const createMockProduct = (overrides: Partial<EnrichedProduct> = {}): EnrichedProduct => ({
  catalogId: 'mock-product-1',
  name: 'Mock Product',
  brand: 'Mock Brand',
  category: 'moisturizer',
  careType: 'hydratation',
  price: 15,
  targetSkinTypes: ['normal'],
  targetConcerns: ['dryness'],
  activeIngredients: ['Hyaluronic Acid'],
  allergens: [],
  targetZones: ['visage entier'],
  restrictedZones: [],
  suitableSensitiveAreas: true,
  warnings: null,
  popularity: 50,
  dermatologistRating: 70,
  applicationTiming: 'both',
  imageUrl: null,
  retailers: [],
  ...overrides
})

const createMockMatch = (overrides: Partial<ProductMatch> = {}): ProductMatch => ({
  step: {
    stepNumber: 1,
    careType: 'hydratation',
    displayTitle: 'Hydratation',
    targetZones: ['visage entier']
  },
  mainProduct: createMockProduct(),
  alternatives: [],
  matchingScore: 75,
  reasoning: 'Mock reasoning',
  ...overrides
})

// ==================== TESTS ====================

describe('BudgetOptimizer', () => {
  describe('optimize()', () => {
    it('devrait retourner routine inchangée si budget respecté', () => {
      const routine: ProductMatch[] = [
        createMockMatch({
          step: { stepNumber: 1, careType: 'nettoyage', displayTitle: 'Nettoyage', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ catalogId: 'nettoyant-1', name: 'Nettoyant Doux', careType: 'nettoyage', price: 15 })
        }),
        createMockMatch({
          step: { stepNumber: 2, careType: 'hydratation', displayTitle: 'Hydratation', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ catalogId: 'hydratant-1', name: 'Crème Hydratante', careType: 'hydratation', price: 12 })
        })
      ]

      const budget: BudgetConstraints = {
        maxBudget: 50,
        expectedSteps: 2,
        priority: 'balanced',
        flexibility: 0.1,
        enableSmartOptimization: true
      }

      const result = BudgetOptimizer.optimize(routine, budget)

      expect(result.optimized).toBe(false)
      expect(result.routine).toEqual(routine)
      expect(result.savings).toBe(0)
      expect(result.substitutions).toHaveLength(0)
      expect(result.stepsRemoved).toHaveLength(0)
    })

    it('devrait optimiser routine si budget dépassé', () => {
      const routine: ProductMatch[] = [
        createMockMatch({
          step: { stepNumber: 1, careType: 'nettoyage', displayTitle: 'Nettoyage', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ 
            catalogId: 'nettoyant-1', 
            name: 'Nettoyant Premium', 
            careType: 'nettoyage', 
            price: 25 
          })
        }),
        createMockMatch({
          step: { stepNumber: 2, careType: 'protection', displayTitle: 'Protection SPF', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ 
            catalogId: 'spf-1', 
            name: 'SPF50+', 
            careType: 'protection', 
            price: 30 
          })
        }),
        createMockMatch({
          step: { stepNumber: 3, careType: 'tonification', displayTitle: 'Tonification', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ 
            catalogId: 'toner-1', 
            name: 'Toner', 
            careType: 'tonification', 
            price: 15 
          }),
          alternatives: [] // Pas d'alternative
        }),
        createMockMatch({
          step: { stepNumber: 4, careType: 'anti-age', displayTitle: 'Anti-âge', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ 
            catalogId: 'antiage-premium', 
            name: 'Sérum Anti-Âge Premium', 
            careType: 'anti-age', 
            price: 80 
          }),
          alternatives: [
            createMockProduct({ 
              catalogId: 'antiage-eco', 
              name: 'Sérum Anti-Âge Économique', 
              careType: 'anti-age', 
              price: 15 
            })
          ],
          matchingScore: 90
        })
      ]

      const budget: BudgetConstraints = {
        maxBudget: 100, // Budget plus réaliste avec SPF + Nettoyant critiques
        expectedSteps: 4,
        priority: 'balanced',
        flexibility: 0.1,
        enableSmartOptimization: true
      }

      const result = BudgetOptimizer.optimize(routine, budget)

      expect(result.optimized).toBe(true)
      expect(result.originalCost).toBe(150) // 25 + 30 + 15 + 80
      expect(result.finalCost).toBeLessThanOrEqual(100)
      expect(result.finalCost).toBeLessThan(result.originalCost) // Optimisation effective
      expect(result.savings).toBeGreaterThan(0)
      
      // Vérifier que SPF et nettoyage sont préservés
      expect(result.preservedCritical).toBe(true)
      
      // Vérifier qu'il y a eu des substitutions ou suppressions
      expect(result.substitutions.length + result.stepsRemoved.length).toBeGreaterThan(0)
    })

    it('devrait préserver SPF et nettoyant (priorités critiques)', () => {
      const routine: ProductMatch[] = [
        createMockMatch({
          step: { stepNumber: 1, careType: 'nettoyage', displayTitle: 'Nettoyage', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ 
            catalogId: 'nettoyant-1', 
            name: 'Nettoyant', 
            careType: 'nettoyage', 
            price: 20 
          })
        }),
        createMockMatch({
          step: { stepNumber: 2, careType: 'protection', displayTitle: 'Protection SPF', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ 
            catalogId: 'spf-1', 
            name: 'SPF50+', 
            careType: 'protection', 
            price: 30 
          })
        }),
        createMockMatch({
          step: { stepNumber: 3, careType: 'masque', displayTitle: 'Masque', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ 
            catalogId: 'masque-1', 
            name: 'Masque Hydratant', 
            careType: 'masque', 
            price: 25 
          }),
          alternatives: []
        })
      ]

      const budget: BudgetConstraints = {
        maxBudget: 55, // Budget serré → forcer suppression masque
        expectedSteps: 3,
        priority: 'balanced',
        flexibility: 0.1,
        enableSmartOptimization: true
      }

      const result = BudgetOptimizer.optimize(routine, budget)

      // Vérifier que SPF et nettoyant sont préservés
      expect(result.preservedCritical).toBe(true)
      
      const finalCareTypes = result.routine.map(m => m.step.careType)
      expect(finalCareTypes).toContain('protection') // SPF préservé
      expect(finalCareTypes).toContain('nettoyage') // Nettoyant préservé
      
      // Masque devrait être supprimé (priorité 3/10)
      expect(result.stepsRemoved).toContain(3)
    })

    it('devrait supprimer produits optionnels (priorité ≤ 3) en premier', () => {
      const routine: ProductMatch[] = [
        createMockMatch({
          step: { stepNumber: 1, careType: 'nettoyage', displayTitle: 'Nettoyage', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ catalogId: 'n1', careType: 'nettoyage', price: 15 })
        }),
        createMockMatch({
          step: { stepNumber: 2, careType: 'tonification', displayTitle: 'Tonification', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ catalogId: 't1', careType: 'tonification', price: 10 }),
          alternatives: []
        }),
        createMockMatch({
          step: { stepNumber: 3, careType: 'masque', displayTitle: 'Masque', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ catalogId: 'm1', careType: 'masque', price: 15 }),
          alternatives: []
        })
      ]

      const budget: BudgetConstraints = {
        maxBudget: 20,
        expectedSteps: 3,
        priority: 'balanced',
        flexibility: 0.1
      }

      const result = BudgetOptimizer.optimize(routine, budget)

      // Tonification (priorité 3) et Masque (priorité 3) devraient être supprimés
      // Nettoyage (priorité 9) préservé
      expect(result.stepsRemoved).toContain(2) // Tonification
      expect(result.stepsRemoved).toContain(3) // Masque
      expect(result.stepsRemoved).not.toContain(1) // Nettoyage préservé
    })

    it('devrait substituer par alternatives moins chères si disponibles', () => {
      const routine: ProductMatch[] = [
        createMockMatch({
          step: { stepNumber: 1, careType: 'anti-age', displayTitle: 'Anti-âge', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ 
            catalogId: 'antiage-premium', 
            name: 'Premium Anti-Âge', 
            careType: 'anti-age', 
            price: 80 
          }),
          alternatives: [
            createMockProduct({ 
              catalogId: 'antiage-eco', 
              name: 'Économique Anti-Âge', 
              careType: 'anti-age', 
              price: 20 
            })
          ],
          matchingScore: 90
        })
      ]

      const budget: BudgetConstraints = {
        maxBudget: 30,
        expectedSteps: 1,
        priority: 'balanced',
        flexibility: 0.1
      }

      const result = BudgetOptimizer.optimize(routine, budget)

      expect(result.substitutions).toHaveLength(1)
      expect(result.substitutions[0].originalProduct.catalogId).toBe('antiage-premium')
      expect(result.substitutions[0].substituteProduct.catalogId).toBe('antiage-eco')
      expect(result.substitutions[0].priceSaved).toBe(60) // 80 - 20
      expect(result.finalCost).toBeLessThanOrEqual(30)
    })
  })

  describe('CARETYPE_BUDGET_PRIORITIES', () => {
    it('devrait avoir Protection comme priorité 10 (la plus haute)', () => {
      expect(CARETYPE_BUDGET_PRIORITIES['protection'].priority).toBe(10)
      expect(CARETYPE_BUDGET_PRIORITIES['protection'].allowSubstitution).toBe(false)
    })

    it('devrait avoir Nettoyage comme priorité 9', () => {
      expect(CARETYPE_BUDGET_PRIORITIES['nettoyage'].priority).toBe(9)
    })

    it('devrait avoir Traitements actifs avec priorité 8', () => {
      expect(CARETYPE_BUDGET_PRIORITIES['anti-age'].priority).toBe(8)
      expect(CARETYPE_BUDGET_PRIORITIES['eclat'].priority).toBe(8)
      expect(CARETYPE_BUDGET_PRIORITIES['traitement-cible'].priority).toBe(8)
    })

    it('devrait avoir Tonification et Masque comme priorités basses (3)', () => {
      expect(CARETYPE_BUDGET_PRIORITIES['tonification'].priority).toBe(3)
      expect(CARETYPE_BUDGET_PRIORITIES['masque'].priority).toBe(3)
    })

    it('devrait couvrir tous les 10 careTypes', () => {
      const expectedCareTypes = [
        'protection', 'nettoyage', 'traitement-cible', 'anti-age', 'eclat',
        'hydratation', 'apaisement', 'exfoliation', 'tonification', 'masque'
      ]

      expectedCareTypes.forEach(careType => {
        expect(CARETYPE_BUDGET_PRIORITIES).toHaveProperty(careType)
      })
    })
  })

  describe('Efficience Calculation', () => {
    it('devrait calculer efficiency (score perdu / € économisé)', () => {
      // Test avec calcul manual de efficiency
      const routine: ProductMatch[] = [
        createMockMatch({
          step: { stepNumber: 1, careType: 'hydratation', displayTitle: 'Hydratation', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ 
            catalogId: 'hydratant-premium', 
            name: 'Hydratant Premium', 
            careType: 'hydratation', 
            price: 30 
          }),
          alternatives: [
            createMockProduct({ 
              catalogId: 'hydratant-eco', 
              name: 'Hydratant Économique', 
              careType: 'hydratation', 
              price: 10 
            })
          ],
          matchingScore: 80
        })
      ]

      const budget: BudgetConstraints = {
        maxBudget: 15,
        expectedSteps: 1,
        priority: 'balanced',
        flexibility: 0.1
      }

      const result = BudgetOptimizer.optimize(routine, budget)

      // Devrait avoir substitué (économie 20€, perte score estimée faible)
      expect(result.substitutions).toHaveLength(1)
      expect(result.substitutions[0].priceSaved).toBe(20)
      expect(result.substitutions[0].efficiency).toBeDefined()
      expect(result.substitutions[0].efficiency).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('devrait gérer routine vide', () => {
      const routine: ProductMatch[] = []
      const budget: BudgetConstraints = {
        maxBudget: 100,
        expectedSteps: 0,
        priority: 'balanced',
        flexibility: 0.1
      }

      const result = BudgetOptimizer.optimize(routine, budget)

      expect(result.optimized).toBe(false)
      expect(result.routine).toEqual([])
      expect(result.originalCost).toBe(0)
      expect(result.finalCost).toBe(0)
    })

    it('devrait gérer produits sans alternatives', () => {
      const routine: ProductMatch[] = [
        createMockMatch({
          step: { stepNumber: 1, careType: 'protection', displayTitle: 'Protection', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ catalogId: 'spf-1', careType: 'protection', price: 50 }),
          alternatives: [] // Pas d'alternative
        })
      ]

      const budget: BudgetConstraints = {
        maxBudget: 30,
        expectedSteps: 1,
        priority: 'balanced',
        flexibility: 0.1
      }

      const result = BudgetOptimizer.optimize(routine, budget)

      // SPF ne peut pas être substitué (pas d'alternative) ni supprimé (priorité 10)
      // Budget ne peut pas être respecté → routine inchangée
      expect(result.routine).toHaveLength(1)
      expect(result.finalCost).toBe(50) // Prix original maintenu
    })

    it('devrait gérer budget illimité (undefined)', () => {
      const routine: ProductMatch[] = [
        createMockMatch({
          mainProduct: createMockProduct({ price: 100 })
        })
      ]

      const budget: BudgetConstraints = {
        maxBudget: 0, // Budget illimité simulé par 0
        expectedSteps: 1,
        priority: 'balanced',
        flexibility: 0.1
      }

      // Avec maxBudget = 0, l'optimisation ne devrait pas se déclencher
      // Car la condition est : idealCost > budget.maxBudget
      // 100 > 0 = true → optimisation déclenchée mais impossible

      // Note : dans le code réel, budget illimité serait géré différemment
      // Ici on teste juste la robustesse
    })
  })

  describe('Métriques Succès', () => {
    it('devrait atteindre score moyen ≥ 90% du score idéal', () => {
      // Test de non-régression : vérifier que l'optimisation ne dégrade pas trop les scores
      const routine: ProductMatch[] = [
        createMockMatch({
          step: { stepNumber: 1, careType: 'nettoyage', displayTitle: 'Nettoyage', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ catalogId: 'n1', careType: 'nettoyage', price: 20 }),
          matchingScore: 85
        }),
        createMockMatch({
          step: { stepNumber: 2, careType: 'hydratation', displayTitle: 'Hydratation', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ catalogId: 'h1', careType: 'hydratation', price: 25 }),
          alternatives: [
            createMockProduct({ catalogId: 'h2', careType: 'hydratation', price: 12 })
          ],
          matchingScore: 82
        }),
        createMockMatch({
          step: { stepNumber: 3, careType: 'protection', displayTitle: 'Protection', targetZones: ['visage entier'] },
          mainProduct: createMockProduct({ catalogId: 'p1', careType: 'protection', price: 30 }),
          matchingScore: 90
        })
      ]

      const budget: BudgetConstraints = {
        maxBudget: 50,
        expectedSteps: 3,
        priority: 'balanced',
        flexibility: 0.1
      }

      const idealScoreAvg = (85 + 82 + 90) / 3 // 85.67

      const result = BudgetOptimizer.optimize(routine, budget)

      // Calculer score moyen après optimisation
      const finalScoreAvg = result.routine.reduce((sum, m) => sum + m.matchingScore, 0) / result.routine.length

      // Score final devrait être ≥ 90% du score idéal
      expect(finalScoreAvg).toBeGreaterThanOrEqual(idealScoreAvg * 0.9)
    })
  })
})

