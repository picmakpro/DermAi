/**
 * 🧪 TESTS D'INTÉGRATION - SYNCHRONISATION PRODUITS ↔ ROUTINE
 * 
 * Tests d'intégration complets pour valider le flux end-to-end
 * de la synchronisation bidirectionnelle produits-routine
 * 
 * Sprint 3 - Intégration, Tests & Optimisation
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ProductRoutineSyncService } from '@/services/products/ProductRoutineSyncService'
import { AlternativeProductService } from '@/services/products/AlternativeProductService'
import { useProductSync } from '@/hooks/useProductSync'
import { useAlternatives } from '@/hooks/useAlternatives'
import { UnifiedRoutineStep, RecommendedProduct } from '@/types'
import { EnrichedProduct } from '@/types/productSync'

// Mock des services externes
jest.mock('@/services/catalog/catalogService')
jest.mock('@/lib/openai')

describe('🔄 Integration Tests - Product Sync Complete Flow', () => {
  
  // Données de test réalistes
  const mockRoutine: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      title: 'Nettoyage quotidien',
      description: 'Nettoyage en profondeur pour éliminer les impuretés',
      category: 'cleansing',
      phase: 'immediate',
      zones: ['visage'],
      frequency: 'daily',
      timeOfDay: 'morning',
      applicationDuration: 'En continu',
      recommendedProducts: [
        {
          id: 'cleanser-001',
          name: 'Gentle Foaming Cleanser',
          brand: 'CeraVe',
          category: 'cleanser',
          price: 12.99,
          catalogId: 'cerave-foaming-cleanser',
          affiliateLink: 'https://amazon.com/cerave-cleanser',
          applicationAdvice: 'Masser délicatement sur peau humide',
          restrictions: []
        }
      ]
    },
    {
      stepNumber: 2,
      title: 'Hydratation intensive',
      description: 'Restaurer la barrière cutanée',
      category: 'moisturizing',
      phase: 'immediate',
      zones: ['visage'],
      frequency: 'daily',
      timeOfDay: 'morning',
      applicationDuration: 'En continu',
      recommendedProducts: [
        {
          id: 'moisturizer-001',
          name: 'Daily Facial Moisturizer',
          brand: 'Neutrogena',
          category: 'moisturizer',
          price: 15.99,
          catalogId: 'neutrogena-daily-moisturizer',
          affiliateLink: 'https://amazon.com/neutrogena-moisturizer',
          applicationAdvice: 'Appliquer uniformément sur visage propre',
          restrictions: []
        }
      ]
    }
  ]

  const mockCatalog = {
    products: [
      {
        id: 'cerave-foaming-cleanser',
        name: 'Gentle Foaming Cleanser',
        brand: 'CeraVe',
        category: 'cleanser',
        price: 12.99,
        imageUrl: 'https://example.com/cerave-cleanser.jpg',
        benefits: ['Nettoie en douceur', 'Respecte la barrière cutanée'],
        skinTypes: ['normale', 'mixte', 'grasse'],
        affiliateLink: 'https://amazon.com/cerave-cleanser'
      },
      {
        id: 'neutrogena-daily-moisturizer',
        name: 'Daily Facial Moisturizer',
        brand: 'Neutrogena',
        category: 'moisturizer',
        price: 15.99,
        imageUrl: 'https://example.com/neutrogena-moisturizer.jpg',
        benefits: ['Hydratation 24h', 'Non comédogène'],
        skinTypes: ['normale', 'sèche'],
        affiliateLink: 'https://amazon.com/neutrogena-moisturizer'
      },
      // Alternatives pour tests
      {
        id: 'alternative-cleanser-001',
        name: 'Hydrating Cleanser',
        brand: 'La Roche-Posay',
        category: 'cleanser',
        price: 18.99,
        imageUrl: 'https://example.com/lrp-cleanser.jpg',
        benefits: ['Nettoyage doux', 'Enrichi en céramides'],
        skinTypes: ['sensible', 'sèche'],
        affiliateLink: 'https://amazon.com/lrp-cleanser'
      }
    ]
  }

  beforeEach(() => {
    // Mock du catalogue
    const { loadCatalog } = require('@/services/catalog/catalogService')
    loadCatalog.mockResolvedValue(mockCatalog)
    
    // Reset des mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('🔄 Service Integration Tests', () => {
    
    it('should extract and enrich products from routine successfully', async () => {
      // Test du flux complet service
      const extractedProducts = ProductRoutineSyncService.extractProductsFromRoutine(mockRoutine)
      
      expect(extractedProducts).toHaveLength(2)
      expect(extractedProducts[0]).toHaveProperty('routineContext')
      expect(extractedProducts[0].routineContext?.stepTitle).toBe('Nettoyage quotidien')
      
      // Test enrichissement
      const enrichedProducts = await ProductRoutineSyncService.enrichProductsWithCatalogData(extractedProducts)
      
      expect(enrichedProducts).toHaveLength(2)
      expect(enrichedProducts[0]).toHaveProperty('imageUrl')
      expect(enrichedProducts[0]).toHaveProperty('aiJustification')
      expect(enrichedProducts[0]).toHaveProperty('usageInstructions')
      expect(enrichedProducts[0].imageUrl).toBe('https://example.com/cerave-cleanser.jpg')
    })

    it('should handle product replacement synchronization', async () => {
      // Préparer les produits
      const extractedProducts = ProductRoutineSyncService.extractProductsFromRoutine(mockRoutine)
      const enrichedProducts = await ProductRoutineSyncService.enrichProductsWithCatalogData(extractedProducts)
      
      // Créer une alternative
      const oldProduct = enrichedProducts[0]
      const newProduct: EnrichedProduct = {
        ...oldProduct,
        id: 'alternative-cleanser-001',
        name: 'Hydrating Cleanser',
        brand: 'La Roche-Posay',
        price: 18.99,
        isAlternative: true,
        originalProductId: oldProduct.id
      }
      
      // Test du remplacement
      const syncResult = await ProductRoutineSyncService.syncProductReplacement(
        oldProduct,
        newProduct,
        mockRoutine
      )
      
      expect(syncResult.success).toBe(true)
      expect(syncResult.updatedRoutine).toBeDefined()
      expect(syncResult.updatedProducts).toBeDefined()
      expect(syncResult.errors).toBeUndefined()
    })

    it('should find alternatives with intelligent criteria', async () => {
      // Test du service d'alternatives
      const extractedProducts = ProductRoutineSyncService.extractProductsFromRoutine(mockRoutine)
      const enrichedProducts = await ProductRoutineSyncService.enrichProductsWithCatalogData(extractedProducts)
      
      const currentProduct = enrichedProducts[0] // Cleanser CeraVe
      
      const alternatives = await AlternativeProductService.findAlternatives(currentProduct, {
        priceRange: 'premium',
        naturalness: 'more_natural'
      })
      
      expect(alternatives).toHaveLength(1) // La Roche-Posay alternative
      expect(alternatives[0]).toHaveProperty('comparisonTags')
      expect(alternatives[0]).toHaveProperty('switchingImpact')
      expect(alternatives[0].category).toBe(currentProduct.category)
    })
  })

  describe('🎣 Hook Integration Tests', () => {
    
    it('should sync products from routine using useProductSync hook', async () => {
      const { result } = renderHook(() => useProductSync())
      
      // État initial
      expect(result.current.enrichedProducts).toHaveLength(0)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.syncStatus).toBe('idle')
      
      // Déclencher la synchronisation
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      // Vérifier le résultat
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
        expect(result.current.enrichedProducts).toHaveLength(2)
        expect(result.current.error).toBeNull()
        expect(result.current.lastSyncTime).toBeInstanceOf(Date)
      })
      
      // Vérifier les métriques
      expect(result.current.syncMetrics.totalSyncs).toBe(1)
      expect(result.current.syncMetrics.successfulSyncs).toBe(1)
    })

    it('should handle product replacement using hooks', async () => {
      const { result: syncResult } = renderHook(() => useProductSync())
      const { result: altResult } = renderHook(() => useAlternatives())
      
      // Synchroniser d'abord
      await act(async () => {
        await syncResult.current.syncFromRoutine(mockRoutine)
      })
      
      await waitFor(() => {
        expect(syncResult.current.enrichedProducts).toHaveLength(2)
      })
      
      const currentProduct = syncResult.current.enrichedProducts[0]
      
      // Charger les alternatives
      await act(async () => {
        await altResult.current.loadAlternatives(currentProduct)
      })
      
      await waitFor(() => {
        expect(altResult.current.alternatives).toHaveLength(1)
        expect(altResult.current.isLoadingAlternatives).toBe(false)
      })
      
      // Effectuer le remplacement
      const alternative = altResult.current.alternatives[0]
      
      await act(async () => {
        const replaceResult = await syncResult.current.replaceProduct(currentProduct, alternative)
        expect(replaceResult.success).toBe(true)
      })
      
      // Vérifier que les produits ont été mis à jour
      await waitFor(() => {
        const updatedProducts = syncResult.current.enrichedProducts
        expect(updatedProducts.some(p => p.id === alternative.id)).toBe(true)
      })
    })
  })

  describe('🚨 Error Handling Integration Tests', () => {
    
    it('should handle catalog loading errors gracefully', async () => {
      // Mock d'erreur de catalogue
      const { loadCatalog } = require('@/services/catalog/catalogService')
      loadCatalog.mockRejectedValue(new Error('Catalog service unavailable'))
      
      const { result } = renderHook(() => useProductSync())
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('error')
        expect(result.current.error).toContain('Catalog service unavailable')
        expect(result.current.enrichedProducts).toHaveLength(0)
      })
    })

    it('should handle invalid routine data', async () => {
      const invalidRoutine = [
        {
          stepNumber: 1,
          title: 'Invalid Step',
          // Champs manquants intentionnellement
        }
      ] as UnifiedRoutineStep[]
      
      const { result } = renderHook(() => useProductSync())
      
      await act(async () => {
        await result.current.syncFromRoutine(invalidRoutine)
      })
      
      // Devrait gérer gracieusement les données invalides
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success') // Avec fallbacks
        expect(result.current.error).toBeNull()
      })
    })

    it('should retry failed synchronizations', async () => {
      const { loadCatalog } = require('@/services/catalog/catalogService')
      
      // Premier appel échoue, deuxième réussit
      loadCatalog
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockCatalog)
      
      const { result } = renderHook(() => useProductSync(undefined, { maxRetries: 2 }))
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
        expect(result.current.enrichedProducts).toHaveLength(2)
      })
      
      // Vérifier que le retry a eu lieu
      expect(loadCatalog).toHaveBeenCalledTimes(2)
    })
  })

  describe('⚡ Performance Integration Tests', () => {
    
    it('should complete sync within performance targets', async () => {
      const { result } = renderHook(() => useProductSync())
      
      const startTime = Date.now()
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
      })
      
      const syncTime = Date.now() - startTime
      
      // Objectif: synchronisation < 500ms
      expect(syncTime).toBeLessThan(500)
      expect(result.current.syncMetrics.averageSyncTime).toBeLessThan(500)
    })

    it('should handle large routines efficiently', async () => {
      // Créer une routine avec beaucoup d'étapes
      const largeRoutine: UnifiedRoutineStep[] = Array.from({ length: 20 }, (_, i) => ({
        stepNumber: i + 1,
        title: `Step ${i + 1}`,
        description: `Description ${i + 1}`,
        category: 'treatment',
        phase: 'immediate',
        zones: ['visage'],
        frequency: 'daily',
        timeOfDay: 'morning',
        applicationDuration: 'En continu',
        recommendedProducts: [
          {
            id: `product-${i}`,
            name: `Product ${i}`,
            brand: 'Test Brand',
            category: 'treatment',
            price: 20.00,
            catalogId: `catalog-${i}`,
            affiliateLink: `https://example.com/product-${i}`,
            applicationAdvice: 'Test advice',
            restrictions: []
          }
        ]
      }))
      
      const { result } = renderHook(() => useProductSync())
      
      const startTime = Date.now()
      
      await act(async () => {
        await result.current.syncFromRoutine(largeRoutine)
      })
      
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
      })
      
      const syncTime = Date.now() - startTime
      
      // Même avec 20 étapes, devrait rester performant
      expect(syncTime).toBeLessThan(1000)
      expect(result.current.enrichedProducts).toHaveLength(20)
    })
  })

  describe('🔄 End-to-End User Journey Tests', () => {
    
    it('should complete full user journey: sync → view alternatives → replace → re-sync', async () => {
      const { result: syncResult } = renderHook(() => useProductSync())
      const { result: altResult } = renderHook(() => useAlternatives())
      
      // 1. Synchronisation initiale
      await act(async () => {
        await syncResult.current.syncFromRoutine(mockRoutine)
      })
      
      await waitFor(() => {
        expect(syncResult.current.enrichedProducts).toHaveLength(2)
      })
      
      const originalProduct = syncResult.current.enrichedProducts[0]
      
      // 2. Recherche d'alternatives
      await act(async () => {
        await altResult.current.loadAlternatives(originalProduct)
      })
      
      await waitFor(() => {
        expect(altResult.current.alternatives).toHaveLength(1)
      })
      
      // 3. Sélection d'une alternative
      const selectedAlternative = altResult.current.alternatives[0]
      
      act(() => {
        altResult.current.selectAlternative(selectedAlternative)
      })
      
      expect(altResult.current.selectedAlternative).toBe(selectedAlternative)
      
      // 4. Remplacement du produit
      await act(async () => {
        const replaceResult = await syncResult.current.replaceProduct(
          originalProduct, 
          selectedAlternative
        )
        expect(replaceResult.success).toBe(true)
      })
      
      // 5. Vérification de la synchronisation
      await waitFor(() => {
        const updatedProducts = syncResult.current.enrichedProducts
        expect(updatedProducts.some(p => p.id === selectedAlternative.id)).toBe(true)
        expect(updatedProducts.some(p => p.id === originalProduct.id)).toBe(false)
      })
      
      // 6. Re-synchronisation pour vérifier la cohérence
      await act(async () => {
        await syncResult.current.refreshProducts()
      })
      
      await waitFor(() => {
        expect(syncResult.current.syncStatus).toBe('success')
        expect(syncResult.current.syncMetrics.totalSyncs).toBe(2)
      })
    })
  })
})
