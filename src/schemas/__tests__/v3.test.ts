/**
 * Tests pour les schémas V3 - Top 3 Produits
 */

import { 
  ProductSelectionV3Schema, 
  validateBrandDiversification, 
  validateProductCoherence,
  validateTop3Products 
} from '../v3'

describe('Schémas V3 - Top 3 Produits', () => {
  const createMockStep = (stepId: number) => ({
    routineStepId: stepId,
    primaryProduct: {
      catalogId: `test-product-${stepId}01`,
      productName: `Test Nettoyant ${stepId}`,
      brand: `Test Brand ${stepId}`,
      price: 15.99,
      ranking: 1,
      justification: 'Produit optimal pour votre type de peau diagnostiqué avec zones sensibles.',
      applicationAdvice: 'Appliquer matin et soir sur peau humide',
      timing: 'matin et soir',
      targetZones: ['visage entier'],
      differentiators: ['Formule douce', 'pH équilibré'],
      priceComparison: 'Rapport qualité/prix optimal',
      strengthComparison: 'Efficacité équilibrée'
    },
    alternatives: [
      {
        catalogId: `test-product-${stepId}02`,
        productName: `Test Nettoyant Premium ${stepId}`,
        brand: `Premium Brand ${stepId}`,
        price: 22.50,
        ranking: 2,
        justification: 'Alternative premium avec actifs spécialisés pour une efficacité renforcée.',
        applicationAdvice: 'Usage matin et soir, laisser agir 1 minute',
        timing: 'matin et soir',
        targetZones: ['visage entier'],
        differentiators: ['Actifs premium', 'Technologie avancée'],
        priceComparison: 'Premium (+41%)',
        strengthComparison: 'Plus concentré'
      },
      {
        catalogId: `test-product-${stepId}03`,
        productName: `Test Nettoyant Économique ${stepId}`,
        brand: `Accessible Brand ${stepId}`,
        price: 9.99,
        ranking: 3,
        justification: 'Option économique sans compromis sur la qualité pour budget limité.',
        applicationAdvice: 'Application quotidienne simple',
        timing: 'matin et soir',
        targetZones: ['visage entier'],
        differentiators: ['Prix accessible', 'Formule simple'],
        priceComparison: 'Économique (-37%)',
        strengthComparison: 'Plus doux'
      }
    ],
    categoryRanking: {
      criteria: ['Compatibilité type de peau', 'Efficacité nettoyage', 'Rapport qualité/prix'],
      justification: 'Classement basé sur votre profil de peau diagnostiqué.',
      diversificationStrategy: '3 marques différentes, 3 gammes de prix, approches complémentaires'
    }
  })

  const mockProductSelectionV3 = {
    selectedProducts: [
      createMockStep(1),
      createMockStep(2),
      createMockStep(3)
    ],
    budgetBreakdown: {
      totalCost: 15.99,
      budgetRespected: true,
      optimizations: ['Produit principal dans le budget'],
      alternatives: ['Option premium +41%', 'Option économique -37%'],
      priceDistribution: {
        primary: 15.99,
        alternatives: [22.50, 9.99]
      }
    },
    coherenceValidation: {
      routineProductsMatch: true,
      zonesCoherent: true,
      timingLogical: true,
      budgetRespected: true,
      diversificationSuccess: true,
      issuesFound: []
    }
  }

  test('devrait valider un ProductSelectionV3 correct', () => {
    expect(() => ProductSelectionV3Schema.parse(mockProductSelectionV3)).not.toThrow()
    
    const validated = ProductSelectionV3Schema.parse(mockProductSelectionV3)
    expect(validated.selectedProducts).toHaveLength(3)
    expect(validated.selectedProducts[0].alternatives).toHaveLength(2)
    expect(validated.budgetBreakdown.priceDistribution.alternatives).toHaveLength(2)
  })

  test('devrait valider la diversification des marques', () => {
    const products = [
      { brand: 'Brand A', targetZones: ['visage'], timing: 'matin' },
      { brand: 'Brand B', targetZones: ['visage'], timing: 'matin' },
      { brand: 'Brand C', targetZones: ['visage'], timing: 'matin' }
    ]
    
    const result = validateBrandDiversification(products as any)
    expect(result.isSuccess).toBe(true)
    expect(result.uniqueBrands).toBe(3)
    expect(result.brands).toEqual(['Brand A', 'Brand B', 'Brand C'])
  })

  test('devrait valider la cohérence des produits', () => {
    const products = [
      { targetZones: ['visage'], timing: 'matin' },
      { targetZones: ['visage'], timing: 'matin' },
      { targetZones: ['visage'], timing: 'matin' }
    ]
    
    const result = validateProductCoherence(products as any)
    expect(result.zonesCoherent).toBe(true)
    expect(result.timingCoherent).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  test('devrait détecter les incohérences', () => {
    const products = [
      { targetZones: ['visage'], timing: 'matin' },
      { targetZones: ['cou'], timing: 'soir' },
      { targetZones: ['visage'], timing: 'matin' }
    ]
    
    const result = validateProductCoherence(products as any)
    expect(result.zonesCoherent).toBe(false)
    expect(result.timingCoherent).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  test('devrait valider un ensemble Top 3 complet', () => {
    const primaryProduct = mockProductSelectionV3.selectedProducts[0].primaryProduct
    const alternatives = mockProductSelectionV3.selectedProducts[0].alternatives
    
    const result = validateTop3Products(primaryProduct as any, alternatives as any, 50)
    expect(result.isValid).toBe(true)
    expect(result.issues).toHaveLength(0)
    expect(result.diversification.isSuccess).toBe(true)
    expect(result.coherence.zonesCoherent).toBe(true)
  })
})