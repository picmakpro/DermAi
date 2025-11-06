/**
 * 🧪 TESTS UNITAIRES - ProductRoutineSyncService
 * 
 * Tests complets pour le service de synchronisation routine ↔ produits
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { ProductRoutineSyncService } from '../ProductRoutineSyncService'
import { UnifiedRoutineStep, RecommendedProduct, CatalogProduct } from '@/types'
import { EnrichedProduct, ProductProblemCategory } from '@/types/productSync'

// Mock du service de catalogue
jest.mock('@/services/catalog/catalogService', () => ({
  loadCatalog: jest.fn()
}))

import { loadCatalog } from '@/services/catalog/catalogService'
const mockLoadCatalog = loadCatalog as jest.MockedFunction<typeof loadCatalog>

describe('ProductRoutineSyncService', () => {
  
  // Données de test
  const mockCatalog = {
    products: [
      {
        id: 'test-cleanser-1',
        name: 'Gentle Foam Cleanser',
        brand: 'TestBrand',
        category: 'cleanser',
        price: 15.99,
        imageUrl: 'https://example.com/cleanser.jpg',
        benefits: ['Nettoie en douceur', 'Respecte la barrière cutanée'],
        activeIngredients: ['Glycerin', 'Ceramides'],
        skinTypes: ['sensitive', 'dry'],
        clinicallyTested: true
      } as CatalogProduct,
      {
        id: 'test-serum-1',
        name: 'Vitamin C Serum',
        brand: 'TestBrand',
        category: 'serum',
        price: 29.99,
        imageUrl: 'https://example.com/serum.jpg',
        benefits: ['Éclat immédiat', 'Antioxydant'],
        activeIngredients: ['Vitamin C', 'Hyaluronic Acid'],
        potency: 'medium'
      } as CatalogProduct
    ]
  }
  
  const mockRoutine: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      title: 'Nettoyage quotidien',
      targetArea: 'global',
      category: 'cleansing',
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'both',
      treatmentType: 'cleansing',
      priority: 1,
      recommendedProducts: [
        {
          id: 'test-cleanser-1',
          name: 'Gentle Foam Cleanser',
          brand: 'TestBrand',
          category: 'cleanser',
          catalogId: 'test-cleanser-1'
        }
      ],
      applicationAdvice: 'Appliquer matin et soir'
    },
    {
      stepNumber: 2,
      title: 'Traitement antioxydant',
      targetArea: 'global',
      category: 'treatment',
      phase: 'adaptation',
      frequency: 'daily',
      timeOfDay: 'morning',
      treatmentType: 'treatment',
      priority: 2,
      recommendedProducts: [
        {
          id: 'test-serum-1',
          name: 'Vitamin C Serum',
          brand: 'TestBrand',
          category: 'serum',
          catalogId: 'test-serum-1'
        }
      ],
      applicationAdvice: 'Appliquer le matin avant la crème'
    }
  ]
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockLoadCatalog.mockResolvedValue(mockCatalog)
  })
  
  describe('extractProductsFromRoutine', () => {
    it('should extract products from routine correctly', () => {
      const extracted = ProductRoutineSyncService.extractProductsFromRoutine(mockRoutine)
      
      expect(extracted).toHaveLength(2)
      
      // Vérifier le premier produit
      expect(extracted[0]).toEqual(
        expect.objectContaining({
          id: 'test-cleanser-1',
          name: 'Gentle Foam Cleanser',
          brand: 'TestBrand',
          category: 'cleanser',
          routineContext: expect.objectContaining({
            stepTitle: 'Nettoyage quotidien',
            stepNumber: 1,
            phase: 'immediate',
            category: 'cleansing',
            frequency: 'daily',
            timing: 'both'
          })
        })
      )
      
      // Vérifier le deuxième produit
      expect(extracted[1]).toEqual(
        expect.objectContaining({
          id: 'test-serum-1',
          name: 'Vitamin C Serum',
          brand: 'TestBrand',
          category: 'serum',
          routineContext: expect.objectContaining({
            stepTitle: 'Traitement antioxydant',
            stepNumber: 2,
            phase: 'adaptation'
          })
        })
      )
    })
    
    it('should handle empty routine', () => {
      const extracted = ProductRoutineSyncService.extractProductsFromRoutine([])
      expect(extracted).toHaveLength(0)
    })
    
    it('should handle routine steps without products', () => {
      const routineWithoutProducts: UnifiedRoutineStep[] = [
        {
          ...mockRoutine[0],
          recommendedProducts: []
        }
      ]
      
      const extracted = ProductRoutineSyncService.extractProductsFromRoutine(routineWithoutProducts)
      expect(extracted).toHaveLength(0)
    })
  })
  
  describe('enrichProductsWithCatalogData', () => {
    it('should enrich products with catalog data successfully', async () => {
      const mockProducts: RecommendedProduct[] = [
        {
          id: 'test-cleanser-1',
          name: 'Gentle Foam Cleanser',
          brand: 'TestBrand',
          category: 'cleanser',
          catalogId: 'test-cleanser-1'
        }
      ]
      
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(mockProducts)
      
      expect(enriched).toHaveLength(1)
      expect(enriched[0]).toEqual(
        expect.objectContaining({
          id: 'test-cleanser-1',
          name: 'Gentle Foam Cleanser',
          brand: 'TestBrand',
          category: 'cleanser',
          imageUrl: 'https://example.com/cleanser.jpg',
          description: expect.stringContaining('Nettoie en douceur'),
          keywordBenefits: expect.arrayContaining(['Nettoie en douceur']),
          problemCategory: ProductProblemCategory.CLEANSING,
          usageInstructions: expect.objectContaining({
            application: expect.stringContaining('Appliquer sur peau humide'),
            frequency: 'Selon routine',
            timing: 'Matin/Soir'
          }),
          aiJustification: expect.objectContaining({
            whySelected: expect.stringContaining('Sélectionné pour votre cleanser'),
            skinBenefits: expect.arrayContaining(['Nettoie en douceur']),
            routineIntegration: expect.stringContaining('Intégré dans votre routine')
          })
        })
      )
    })
    
    it('should handle products not found in catalog', async () => {
      const mockProducts: RecommendedProduct[] = [
        {
          id: 'unknown-product',
          name: 'Unknown Product',
          brand: 'Unknown Brand',
          category: 'unknown'
        }
      ]
      
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(mockProducts)
      
      expect(enriched).toHaveLength(1)
      expect(enriched[0]).toEqual(
        expect.objectContaining({
          id: 'unknown-product',
          imageUrl: '/placeholder-product.jpg',
          description: expect.stringContaining('Produit recommandé'),
          problemCategory: ProductProblemCategory.AUTRES
        })
      )
    })
    
    it('should handle catalog loading error gracefully', async () => {
      mockLoadCatalog.mockRejectedValue(new Error('Catalog not available'))
      
      const mockProducts: RecommendedProduct[] = [
        {
          id: 'test-product',
          name: 'Test Product',
          brand: 'Test Brand',
          category: 'test'
        }
      ]
      
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(mockProducts)
      
      expect(enriched).toHaveLength(1)
      expect(enriched[0]).toEqual(
        expect.objectContaining({
          id: 'test-product',
          imageUrl: '/placeholder-product.jpg'
        })
      )
    })
  })
  
  describe('syncProductReplacement', () => {
    it('should sync product replacement successfully', async () => {
      const oldProduct: EnrichedProduct = {
        id: 'old-product',
        name: 'Old Product',
        brand: 'Old Brand',
        category: 'cleanser',
        imageUrl: '/old-image.jpg',
        description: 'Old description',
        keywordBenefits: ['old benefit'],
        problemCategory: ProductProblemCategory.CLEANSING,
        usageInstructions: {
          application: 'old application',
          frequency: 'daily',
          timing: 'morning'
        },
        aiJustification: {
          whySelected: 'old reason',
          skinBenefits: ['old benefit'],
          routineIntegration: 'old integration'
        }
      }
      
      const newProduct: EnrichedProduct = {
        id: 'new-product',
        name: 'New Product',
        brand: 'New Brand',
        category: 'cleanser',
        imageUrl: '/new-image.jpg',
        description: 'New description',
        keywordBenefits: ['new benefit'],
        problemCategory: ProductProblemCategory.CLEANSING,
        usageInstructions: {
          application: 'new application',
          frequency: 'daily',
          timing: 'morning'
        },
        aiJustification: {
          whySelected: 'new reason',
          skinBenefits: ['new benefit'],
          routineIntegration: 'new integration'
        }
      }
      
      const routineWithOldProduct: UnifiedRoutineStep[] = [
        {
          ...mockRoutine[0],
          recommendedProducts: [
            {
              id: 'old-product',
              name: 'Old Product',
              brand: 'Old Brand',
              category: 'cleanser'
            }
          ]
        }
      ]
      
      const result = await ProductRoutineSyncService.syncProductReplacement(
        oldProduct,
        newProduct,
        routineWithOldProduct
      )
      
      expect(result.success).toBe(true)
      expect(result.updatedRoutine).toBeDefined()
      expect(result.updatedProducts).toBeDefined()
      expect(result.errors).toBeUndefined()
    })
    
    it('should handle sync errors gracefully', async () => {
      // Mock une erreur dans le processus de synchronisation
      const invalidOldProduct = {} as EnrichedProduct
      const invalidNewProduct = {} as EnrichedProduct
      
      const result = await ProductRoutineSyncService.syncProductReplacement(
        invalidOldProduct,
        invalidNewProduct,
        []
      )
      
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })
  
  describe('Private methods integration', () => {
    it('should categorize products by skin problem correctly', () => {
      // Test via enrichProductsWithCatalogData qui utilise categorizeBySkinProblem
      const testCases = [
        { category: 'cleanser', expected: ProductProblemCategory.CLEANSING },
        { category: 'moisturizer', expected: ProductProblemCategory.HYDRATION },
        { category: 'serum', expected: ProductProblemCategory.ANTI_AGING },
        { category: 'sunscreen', expected: ProductProblemCategory.PROTECTION },
        { category: 'exfoliant', expected: ProductProblemCategory.EXFOLIATION },
        { category: 'unknown', expected: ProductProblemCategory.AUTRES }
      ]
      
      testCases.forEach(async ({ category, expected }) => {
        const mockProducts: RecommendedProduct[] = [
          {
            id: `test-${category}`,
            name: `Test ${category}`,
            brand: 'Test Brand',
            category
          }
        ]
        
        const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(mockProducts)
        expect(enriched[0].problemCategory).toBe(expected)
      })
    })
  })
  
  describe('Error handling and edge cases', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      // Test avec routine null
      expect(() => ProductRoutineSyncService.extractProductsFromRoutine(null as any)).not.toThrow()
      
      // Test avec produits null
      const result = await ProductRoutineSyncService.enrichProductsWithCatalogData(null as any)
      expect(Array.isArray(result)).toBe(true)
    })
    
    it('should handle malformed catalog data', async () => {
      mockLoadCatalog.mockResolvedValue({ products: null })
      
      const mockProducts: RecommendedProduct[] = [
        {
          id: 'test-product',
          name: 'Test Product',
          brand: 'Test Brand',
          category: 'test'
        }
      ]
      
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(mockProducts)
      
      expect(enriched).toHaveLength(1)
      expect(enriched[0].imageUrl).toBe('/placeholder-product.jpg')
    })
  })
  
  describe('Performance and caching', () => {
    it('should handle large routine efficiently', () => {
      const largeRoutine: UnifiedRoutineStep[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockRoutine[0],
        stepNumber: i + 1,
        title: `Step ${i + 1}`,
        recommendedProducts: [
          {
            id: `product-${i}`,
            name: `Product ${i}`,
            brand: 'Test Brand',
            category: 'test'
          }
        ]
      }))
      
      const startTime = Date.now()
      const extracted = ProductRoutineSyncService.extractProductsFromRoutine(largeRoutine)
      const endTime = Date.now()
      
      expect(extracted).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(100) // Doit être rapide
    })
  })
})
