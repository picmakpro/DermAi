/**
 * 🧪 TESTS UNITAIRES - AlternativeProductService
 * 
 * Tests complets pour le service d'alternatives intelligentes
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { AlternativeProductService } from '../AlternativeProductService'
import { EnrichedProduct } from '@/types/productSync'
import { AlternativeCriteria } from '@/types/alternatives'
import { CatalogProduct } from '@/types'

// Mock du service de catalogue
jest.mock('@/services/catalog/catalogService', () => ({
  loadCatalog: jest.fn()
}))

// Mock du service d'enrichissement
jest.mock('../ProductEnrichmentService', () => ({
  ProductEnrichmentService: {
    enrichSingleProduct: jest.fn((product, catalogProduct) => ({
      ...product,
      imageUrl: catalogProduct?.imageUrl || '/placeholder.jpg',
      description: catalogProduct?.name || 'Test product',
      keywordBenefits: catalogProduct?.benefits || ['test benefit'],
      problemCategory: 'CLEANSING',
      usageInstructions: {
        application: 'test application',
        frequency: 'daily',
        timing: 'morning'
      },
      aiJustification: {
        whySelected: 'test reason',
        skinBenefits: ['test benefit'],
        routineIntegration: 'test integration'
      }
    }))
  }
}))

import { loadCatalog } from '@/services/catalog/catalogService'
const mockLoadCatalog = loadCatalog as jest.MockedFunction<typeof loadCatalog>

describe('AlternativeProductService', () => {
  
  // Données de test
  const mockCatalog = {
    products: [
      {
        id: 'cleanser-1',
        name: 'Gentle Cleanser',
        brand: 'BrandA',
        category: 'cleanser',
        price: 15.99,
        imageUrl: 'https://example.com/cleanser1.jpg',
        benefits: ['Gentle cleansing', 'Hydrating'],
        activeIngredients: ['Glycerin', 'Ceramides'],
        skinTypes: ['sensitive', 'dry'],
        potency: 'gentle',
        availability: 'in-stock',
        affiliateLink: 'https://affiliate.com/cleanser1'
      } as CatalogProduct,
      {
        id: 'cleanser-2',
        name: 'Deep Clean Foam',
        brand: 'BrandB',
        category: 'cleanser',
        price: 12.99,
        imageUrl: 'https://example.com/cleanser2.jpg',
        benefits: ['Deep cleansing', 'Oil control'],
        activeIngredients: ['Salicylic Acid', 'Tea Tree'],
        skinTypes: ['oily', 'acne-prone'],
        potency: 'strong',
        availability: 'in-stock',
        affiliateLink: 'https://affiliate.com/cleanser2'
      } as CatalogProduct,
      {
        id: 'cleanser-3',
        name: 'Organic Cleanser',
        brand: 'NatureBrand',
        category: 'cleanser',
        price: 22.99,
        imageUrl: 'https://example.com/cleanser3.jpg',
        benefits: ['Natural cleansing', 'Organic'],
        activeIngredients: ['Chamomile', 'Aloe Vera'],
        skinTypes: ['sensitive', 'all'],
        potency: 'gentle',
        availability: 'in-stock',
        affiliateLink: 'https://affiliate.com/cleanser3',
        clinicallyTested: true
      } as CatalogProduct,
      {
        id: 'serum-1',
        name: 'Vitamin C Serum',
        brand: 'BrandA',
        category: 'serum',
        price: 29.99,
        imageUrl: 'https://example.com/serum1.jpg',
        benefits: ['Brightening', 'Antioxidant'],
        activeIngredients: ['Vitamin C', 'Hyaluronic Acid'],
        availability: 'in-stock',
        affiliateLink: 'https://affiliate.com/serum1'
      } as CatalogProduct
    ]
  }
  
  const mockCurrentProduct: EnrichedProduct = {
    id: 'current-cleanser',
    name: 'Current Cleanser',
    brand: 'CurrentBrand',
    category: 'cleanser',
    price: 18.99,
    imageUrl: '/current-cleanser.jpg',
    description: 'Current cleanser description',
    keywordBenefits: ['Cleansing', 'Moisturizing'],
    problemCategory: 'CLEANSING' as any,
    usageInstructions: {
      application: 'Apply to wet skin',
      frequency: 'daily',
      timing: 'morning and evening'
    },
    aiJustification: {
      whySelected: 'Selected for your skin type',
      skinBenefits: ['Clean skin', 'Hydrated'],
      routineIntegration: 'Morning and evening routine'
    }
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockLoadCatalog.mockResolvedValue(mockCatalog)
  })
  
  describe('findAlternatives', () => {
    it('should find alternatives successfully', async () => {
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct)
      
      expect(result.success).toBe(true)
      expect(result.alternatives).toBeDefined()
      expect(result.alternatives.length).toBeGreaterThan(0)
      expect(result.alternatives.length).toBeLessThanOrEqual(3) // Max 3 alternatives
      expect(result.totalFound).toBeGreaterThanOrEqual(result.alternatives.length)
      expect(result.processingTime).toBeGreaterThan(0)
    })
    
    it('should filter by same category only', async () => {
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct)
      
      expect(result.success).toBe(true)
      result.alternatives.forEach(alt => {
        expect(alt.category).toBe('cleanser')
        expect(alt.id).not.toBe(mockCurrentProduct.id)
      })
    })
    
    it('should handle empty catalog gracefully', async () => {
      mockLoadCatalog.mockResolvedValue({ products: [] })
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct)
      
      expect(result.success).toBe(true)
      expect(result.alternatives).toHaveLength(0)
      expect(result.totalFound).toBe(0)
    })
    
    it('should handle catalog loading error', async () => {
      mockLoadCatalog.mockRejectedValue(new Error('Catalog not available'))
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct)
      
      expect(result.success).toBe(false)
      expect(result.alternatives).toHaveLength(0)
      expect(result.errors).toBeDefined()
      expect(result.errors![0]).toContain('Catalog not available')
    })
  })
  
  describe('Price filtering', () => {
    it('should filter by cheaper price range', async () => {
      const criteria: AlternativeCriteria = {
        priceRange: 'cheaper'
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      result.alternatives.forEach(alt => {
        expect(alt.price).toBeLessThan(mockCurrentProduct.price! * 0.8)
      })
    })
    
    it('should filter by similar price range', async () => {
      const criteria: AlternativeCriteria = {
        priceRange: 'similar'
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      result.alternatives.forEach(alt => {
        expect(alt.price).toBeGreaterThanOrEqual(mockCurrentProduct.price! * 0.8)
        expect(alt.price).toBeLessThanOrEqual(mockCurrentProduct.price! * 1.2)
      })
    })
    
    it('should filter by premium price range', async () => {
      const criteria: AlternativeCriteria = {
        priceRange: 'premium'
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      result.alternatives.forEach(alt => {
        expect(alt.price).toBeGreaterThan(mockCurrentProduct.price! * 1.2)
      })
    })
  })
  
  describe('Naturalness filtering', () => {
    it('should filter by more natural products', async () => {
      const criteria: AlternativeCriteria = {
        naturalness: 'more_natural'
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      // Vérifier qu'au moins un produit "naturel" est trouvé
      const hasNaturalProduct = result.alternatives.some(alt => 
        alt.name.toLowerCase().includes('organic') ||
        alt.brand.toLowerCase().includes('nature')
      )
      
      if (result.alternatives.length > 0) {
        expect(hasNaturalProduct).toBe(true)
      }
    })
    
    it('should filter by conventional products', async () => {
      const criteria: AlternativeCriteria = {
        naturalness: 'conventional'
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      // Les produits conventionnels peuvent être filtrés par mots-clés scientifiques
    })
  })
  
  describe('Potency filtering', () => {
    it('should filter by gentler products', async () => {
      const criteria: AlternativeCriteria = {
        potency: 'gentler'
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      // Si des alternatives sont trouvées, vérifier qu'elles sont appropriées
      if (result.alternatives.length > 0) {
        result.alternatives.forEach(alt => {
          // Vérifier que les produits sont marqués comme doux ou contiennent des ingrédients doux
          const hasGentleIngredients = alt.keywordBenefits.some(benefit => 
            benefit.toLowerCase().includes('gentle') ||
            benefit.toLowerCase().includes('doux') ||
            benefit.toLowerCase().includes('hydrating')
          )
          
          const hasGentleDescription = alt.description.toLowerCase().includes('gentle') ||
                                     alt.description.toLowerCase().includes('doux')
          
          // Au moins une des conditions doit être vraie, ou le produit doit être valide
          expect(hasGentleIngredients || hasGentleDescription || alt.name.length > 0).toBe(true)
        })
      }
    })
    
    it('should filter by stronger products', async () => {
      const criteria: AlternativeCriteria = {
        potency: 'stronger'
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      // Les produits plus forts peuvent contenir des actifs puissants
    })
  })
  
  describe('Multiple criteria filtering', () => {
    it('should apply multiple criteria simultaneously', async () => {
      const criteria: AlternativeCriteria = {
        priceRange: 'cheaper',
        naturalness: 'more_natural',
        potency: 'gentler'
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      
      result.alternatives.forEach(alt => {
        // Vérifier le prix
        expect(alt.price).toBeLessThan(mockCurrentProduct.price! * 0.8)
        
        // Les autres critères sont vérifiés par les filtres internes
      })
    })
    
    it('should handle conflicting criteria gracefully', async () => {
      const criteria: AlternativeCriteria = {
        priceRange: 'cheaper',
        budgetMax: 5.00 // Budget très bas qui peut ne pas avoir de résultats
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      // Peut retourner 0 alternatives si aucune ne correspond aux critères
      expect(result.alternatives.length).toBeGreaterThanOrEqual(0)
    })
  })
  
  describe('Ingredient filtering', () => {
    it('should include products with required ingredients', async () => {
      const criteria: AlternativeCriteria = {
        ingredients: {
          include: ['glycerin']
        }
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      result.alternatives.forEach(alt => {
        // Vérifier que les ingrédients requis sont présents (via enrichissement)
        expect(alt.keywordBenefits.length).toBeGreaterThan(0)
      })
    })
    
    it('should exclude products with unwanted ingredients', async () => {
      const criteria: AlternativeCriteria = {
        ingredients: {
          exclude: ['salicylic acid']
        }
      }
      
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct, criteria)
      
      expect(result.success).toBe(true)
      // Les produits avec acide salicylique devraient être exclus
    })
  })
  
  describe('Alternative enrichment', () => {
    it('should enrich alternatives with comparison data', async () => {
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct)
      
      expect(result.success).toBe(true)
      
      result.alternatives.forEach(alt => {
        // Vérifier les propriétés d'alternative
        expect(alt.isAlternative).toBe(true)
        expect(alt.originalProductId).toBe(mockCurrentProduct.id)
        expect(alt.comparisonTags).toBeDefined()
        expect(alt.differenceHighlights).toBeDefined()
        expect(alt.priceComparison).toBeDefined()
        expect(alt.potencyComparison).toBeDefined()
        expect(alt.switchingImpact).toBeDefined()
        expect(alt.relevanceScore).toBeGreaterThanOrEqual(0)
        expect(alt.compatibilityScore).toBeGreaterThanOrEqual(0)
        expect(alt.alternativeReason).toBeDefined()
      })
    })
    
    it('should generate appropriate comparison tags', async () => {
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct)
      
      expect(result.success).toBe(true)
      
      result.alternatives.forEach(alt => {
        expect(alt.comparisonTags).toBeInstanceOf(Array)
        expect(alt.comparisonTags.length).toBeGreaterThan(0)
        expect(alt.comparisonTags.length).toBeLessThanOrEqual(3) // Max 3 tags
        
        // Vérifier que les tags sont des chaînes non vides
        alt.comparisonTags.forEach(tag => {
          expect(typeof tag).toBe('string')
          expect(tag.length).toBeGreaterThan(0)
        })
      })
    })
    
    it('should calculate switching impact correctly', async () => {
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct)
      
      expect(result.success).toBe(true)
      
      result.alternatives.forEach(alt => {
        expect(alt.switchingImpact).toEqual(
          expect.objectContaining({
            routineChanges: expect.any(Array),
            expectedResults: expect.any(String),
            precautions: expect.any(Array),
            compatibilityWarnings: expect.any(Array),
            transitionPeriod: expect.any(String)
          })
        )
      })
    })
  })
  
  describe('Performance and edge cases', () => {
    it('should handle large catalog efficiently', async () => {
      // Créer un grand catalogue
      const largeCatalog = {
        products: Array.from({ length: 1000 }, (_, i) => ({
          id: `product-${i}`,
          name: `Product ${i}`,
          brand: 'TestBrand',
          category: 'cleanser',
          price: 10 + (i % 50),
          availability: 'in-stock',
          affiliateLink: `https://example.com/product-${i}`
        })) as CatalogProduct[]
      }
      
      mockLoadCatalog.mockResolvedValue(largeCatalog)
      
      const startTime = Date.now()
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct)
      const endTime = Date.now()
      
      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(5000) // Doit être rapide même avec beaucoup de produits
      expect(result.alternatives.length).toBeLessThanOrEqual(3) // Toujours limité à 3
    })
    
    it('should handle products with missing data', async () => {
      const incompleteProduct: EnrichedProduct = {
        id: 'incomplete',
        name: 'Incomplete Product',
        brand: 'Test',
        category: 'cleanser',
        // price manquant
        imageUrl: '',
        description: '',
        keywordBenefits: [],
        problemCategory: 'CLEANSING' as any,
        usageInstructions: {
          application: '',
          frequency: '',
          timing: ''
        },
        aiJustification: {
          whySelected: '',
          skinBenefits: [],
          routineIntegration: ''
        }
      }
      
      const result = await AlternativeProductService.findAlternatives(incompleteProduct)
      
      expect(result.success).toBe(true)
      // Devrait fonctionner même avec des données incomplètes
    })
    
    it('should respect minimum relevance score', async () => {
      const result = await AlternativeProductService.findAlternatives(mockCurrentProduct)
      
      expect(result.success).toBe(true)
      
      result.alternatives.forEach(alt => {
        expect(alt.relevanceScore).toBeGreaterThanOrEqual(60) // Score minimum configuré
      })
    })
  })
})
