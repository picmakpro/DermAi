/**
 * 🧪 TESTS UNITAIRES - useProductSync Hook
 * 
 * Tests complets pour le hook de synchronisation produits ↔ routine
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useProductSync } from '../useProductSync'
import { UnifiedRoutineStep } from '@/types'
import { EnrichedProduct } from '@/types/productSync'

// Mock du service de synchronisation
jest.mock('@/services/products/ProductRoutineSyncService', () => ({
  ProductRoutineSyncService: {
    extractProductsFromRoutine: jest.fn(),
    enrichProductsWithCatalogData: jest.fn(),
    syncProductReplacement: jest.fn()
  }
}))

import { ProductRoutineSyncService } from '@/services/products/ProductRoutineSyncService'

const mockExtractProducts = ProductRoutineSyncService.extractProductsFromRoutine as jest.MockedFunction<typeof ProductRoutineSyncService.extractProductsFromRoutine>
const mockEnrichProducts = ProductRoutineSyncService.enrichProductsWithCatalogData as jest.MockedFunction<typeof ProductRoutineSyncService.enrichProductsWithCatalogData>
const mockSyncReplacement = ProductRoutineSyncService.syncProductReplacement as jest.MockedFunction<typeof ProductRoutineSyncService.syncProductReplacement>

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useProductSync', () => {
  
  // Données de test
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
          id: 'test-cleanser',
          name: 'Test Cleanser',
          brand: 'Test Brand',
          category: 'cleanser'
        }
      ],
      applicationAdvice: 'Apply morning and evening'
    }
  ]
  
  const mockExtractedProducts = [
    {
      id: 'test-cleanser',
      name: 'Test Cleanser',
      brand: 'Test Brand',
      category: 'cleanser'
    }
  ]
  
  const mockEnrichedProducts: EnrichedProduct[] = [
    {
      id: 'test-cleanser',
      name: 'Test Cleanser',
      brand: 'Test Brand',
      category: 'cleanser',
      imageUrl: '/test-image.jpg',
      description: 'Test description',
      keywordBenefits: ['cleansing', 'gentle'],
      problemCategory: 'CLEANSING' as any,
      usageInstructions: {
        application: 'Apply to wet skin',
        frequency: 'daily',
        timing: 'morning and evening'
      },
      aiJustification: {
        whySelected: 'Perfect for your skin type',
        skinBenefits: ['clean skin', 'healthy'],
        routineIntegration: 'Morning and evening routine'
      }
    }
  ]
  
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    
    // Configuration par défaut des mocks
    mockExtractProducts.mockReturnValue(mockExtractedProducts)
    mockEnrichProducts.mockResolvedValue(mockEnrichedProducts)
    mockSyncReplacement.mockResolvedValue({
      success: true,
      updatedRoutine: mockRoutine,
      updatedProducts: mockEnrichedProducts
    })
  })
  
  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useProductSync())
      
      expect(result.current.enrichedProducts).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.syncStatus).toBe('idle')
      expect(result.current.lastSyncTime).toBe(null)
    })
    
    it('should auto-sync with initial routine when provided', async () => {
      const { result } = renderHook(() => useProductSync(mockRoutine))
      
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
      })
      
      expect(mockExtractProducts).toHaveBeenCalledWith(mockRoutine)
      expect(mockEnrichProducts).toHaveBeenCalledWith(mockExtractedProducts)
      expect(result.current.enrichedProducts).toEqual(mockEnrichedProducts)
    })
    
    it('should not auto-sync when autoSync is disabled', () => {
      const { result } = renderHook(() => useProductSync(mockRoutine, { autoSync: false }))
      
      expect(result.current.syncStatus).toBe('idle')
      expect(mockExtractProducts).not.toHaveBeenCalled()
    })
  })
  
  describe('syncFromRoutine', () => {
    it('should sync products from routine successfully', async () => {
      const { result } = renderHook(() => useProductSync())
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      expect(result.current.syncStatus).toBe('success')
      expect(result.current.enrichedProducts).toEqual(mockEnrichedProducts)
      expect(result.current.error).toBe(null)
      expect(result.current.lastSyncTime).toBeTruthy()
    })
    
    it('should handle sync errors gracefully', async () => {
      const errorMessage = 'Sync failed'
      mockEnrichProducts.mockRejectedValue(new Error(errorMessage))
      
      const { result } = renderHook(() => useProductSync())
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      expect(result.current.syncStatus).toBe('error')
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.enrichedProducts).toEqual([])
    })
    
    it('should show loading state during sync', async () => {
      let resolveEnrich: (value: any) => void
      const enrichPromise = new Promise(resolve => {
        resolveEnrich = resolve
      })
      mockEnrichProducts.mockReturnValue(enrichPromise)
      
      const { result } = renderHook(() => useProductSync())
      
      act(() => {
        result.current.syncFromRoutine(mockRoutine)
      })
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.syncStatus).toBe('syncing')
      
      await act(async () => {
        resolveEnrich!(mockEnrichedProducts)
        await enrichPromise
      })
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.syncStatus).toBe('success')
    })
    
    it('should retry on error when retryOnError is enabled', async () => {
      mockEnrichProducts
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockEnrichedProducts)
      
      const { result } = renderHook(() => useProductSync(undefined, { retryOnError: true }))
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      expect(mockEnrichProducts).toHaveBeenCalledTimes(2)
      expect(result.current.syncStatus).toBe('success')
      expect(result.current.enrichedProducts).toEqual(mockEnrichedProducts)
    })
    
    it('should cancel previous sync when new sync starts', async () => {
      let resolveFirst: (value: any) => void
      let resolveSecond: (value: any) => void
      
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve
      })
      const secondPromise = new Promise(resolve => {
        resolveSecond = resolve
      })
      
      mockEnrichProducts
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise)
      
      const { result } = renderHook(() => useProductSync())
      
      // Démarrer première sync
      act(() => {
        result.current.syncFromRoutine(mockRoutine)
      })
      
      // Démarrer deuxième sync avant que la première ne se termine
      act(() => {
        result.current.syncFromRoutine(mockRoutine)
      })
      
      // Résoudre la première (devrait être ignorée)
      await act(async () => {
        resolveFirst!(mockEnrichedProducts)
        await firstPromise
      })
      
      // Résoudre la deuxième
      await act(async () => {
        resolveSecond!(mockEnrichedProducts)
        await secondPromise
      })
      
      expect(result.current.syncStatus).toBe('success')
    })
  })
  
  describe('replaceProduct', () => {
    const oldProduct: EnrichedProduct = mockEnrichedProducts[0]
    const newProduct: EnrichedProduct = {
      ...mockEnrichedProducts[0],
      id: 'new-product',
      name: 'New Product'
    }
    
    it('should replace product successfully', async () => {
      const { result } = renderHook(() => useProductSync(mockRoutine))
      
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
      })
      
      let syncResult
      await act(async () => {
        syncResult = await result.current.replaceProduct(oldProduct, newProduct)
      })
      
      expect(syncResult.success).toBe(true)
      expect(mockSyncReplacement).toHaveBeenCalledWith(oldProduct, newProduct, mockRoutine)
    })
    
    it('should handle replacement errors', async () => {
      const errorMessage = 'Replacement failed'
      mockSyncReplacement.mockResolvedValue({
        success: false,
        updatedRoutine: [],
        updatedProducts: [],
        errors: [errorMessage]
      })
      
      const { result } = renderHook(() => useProductSync(mockRoutine))
      
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
      })
      
      await act(async () => {
        try {
          await result.current.replaceProduct(oldProduct, newProduct)
        } catch (error) {
          expect(error.message).toBe(errorMessage)
        }
      })
      
      expect(result.current.error).toBe(errorMessage)
    })
  })
  
  describe('Caching', () => {
    it('should cache results when cacheResults is enabled', async () => {
      const { result } = renderHook(() => useProductSync(undefined, { cacheResults: true }))
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'productSync_cache',
        expect.stringContaining('"products"')
      )
    })
    
    it('should load from cache when available', () => {
      const cachedData = {
        products: mockEnrichedProducts,
        routine: mockRoutine,
        timestamp: Date.now() - 1000 // 1 seconde ago
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData))
      
      const { result } = renderHook(() => useProductSync(mockRoutine, { cacheResults: true }))
      
      // Devrait charger depuis le cache sans appeler les services
      expect(result.current.enrichedProducts).toEqual(mockEnrichedProducts)
      expect(mockExtractProducts).not.toHaveBeenCalled()
    })
    
    it('should ignore expired cache', async () => {
      const expiredData = {
        products: mockEnrichedProducts,
        routine: mockRoutine,
        timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 heures ago
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData))
      
      const { result } = renderHook(() => useProductSync(mockRoutine, { cacheResults: true }))
      
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
      })
      
      // Devrait faire une nouvelle sync car le cache est expiré
      expect(mockExtractProducts).toHaveBeenCalled()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('productSync_cache')
    })
  })
  
  describe('Metrics', () => {
    it('should track sync metrics', async () => {
      const { result } = renderHook(() => useProductSync())
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      expect(result.current.syncMetrics.totalSyncs).toBe(1)
      expect(result.current.syncMetrics.successfulSyncs).toBe(1)
      expect(result.current.syncMetrics.averageSyncTime).toBeGreaterThan(0)
      
      // Deuxième sync
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      expect(result.current.syncMetrics.totalSyncs).toBe(2)
      expect(result.current.syncMetrics.successfulSyncs).toBe(2)
    })
    
    it('should track failed syncs in metrics', async () => {
      mockEnrichProducts.mockRejectedValue(new Error('Sync failed'))
      
      const { result } = renderHook(() => useProductSync())
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      expect(result.current.syncMetrics.totalSyncs).toBe(1)
      expect(result.current.syncMetrics.successfulSyncs).toBe(0)
    })
  })
  
  describe('Utility functions', () => {
    it('should refresh products', async () => {
      const { result } = renderHook(() => useProductSync(mockRoutine))
      
      await waitFor(() => {
        expect(result.current.syncStatus).toBe('success')
      })
      
      // Clear mocks to verify refresh calls
      jest.clearAllMocks()
      mockExtractProducts.mockReturnValue(mockExtractedProducts)
      mockEnrichProducts.mockResolvedValue(mockEnrichedProducts)
      
      await act(async () => {
        await result.current.refreshProducts()
      })
      
      expect(mockExtractProducts).toHaveBeenCalledWith(mockRoutine)
      expect(mockEnrichProducts).toHaveBeenCalled()
    })
    
    it('should clear error', () => {
      const { result } = renderHook(() => useProductSync())
      
      // Simuler une erreur
      act(() => {
        result.current.syncFromRoutine([])
      })
      
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBe(null)
      expect(result.current.syncStatus).toBe('idle')
    })
  })
  
  describe('Edge cases', () => {
    it('should handle empty routine gracefully', async () => {
      const { result } = renderHook(() => useProductSync())
      
      await act(async () => {
        await result.current.syncFromRoutine([])
      })
      
      expect(result.current.syncStatus).toBe('success')
      expect(result.current.enrichedProducts).toEqual([])
    })
    
    it('should handle malformed cache data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const { result } = renderHook(() => useProductSync(mockRoutine, { cacheResults: true }))
      
      // Ne devrait pas planter et devrait faire une sync normale
      expect(result.current.enrichedProducts).toEqual([])
    })
    
    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })
      
      const { result } = renderHook(() => useProductSync(undefined, { cacheResults: true }))
      
      await act(async () => {
        await result.current.syncFromRoutine(mockRoutine)
      })
      
      // Devrait réussir malgré l'erreur de cache
      expect(result.current.syncStatus).toBe('success')
    })
  })
})
