/**
 * 🧪 TESTS UNITAIRES - useAlternatives Hook
 * 
 * Tests complets pour le hook de gestion des alternatives
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAlternatives } from '../useAlternatives'
import { EnrichedProduct } from '@/types/productSync'
import { AlternativeProduct, AlternativeCriteria } from '@/types/alternatives'

// Mock du service d'alternatives
jest.mock('@/services/products/AlternativeProductService', () => ({
  AlternativeProductService: {
    findAlternatives: jest.fn()
  }
}))

import { AlternativeProductService } from '@/services/products/AlternativeProductService'

const mockFindAlternatives = AlternativeProductService.findAlternatives as jest.MockedFunction<typeof AlternativeProductService.findAlternatives>

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

// Mock setTimeout pour les tests de debounce
jest.useFakeTimers()

describe('useAlternatives', () => {
  
  // Données de test
  const mockProduct: EnrichedProduct = {
    id: 'test-product',
    name: 'Test Product',
    brand: 'Test Brand',
    category: 'cleanser',
    price: 19.99,
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
  
  const mockAlternatives: AlternativeProduct[] = [
    {
      ...mockProduct,
      id: 'alternative-1',
      name: 'Alternative 1',
      price: 15.99,
      comparisonTags: ['Plus économique', 'Formule douce'],
      differenceHighlights: ['Prix avantageux', 'Texture gel'],
      priceComparison: '20% moins cher (15.99€)',
      potencyComparison: 'Formule plus douce',
      switchingImpact: {
        routineChanges: [],
        expectedResults: 'Résultats similaires',
        precautions: [],
        compatibilityWarnings: [],
        transitionPeriod: 'Immédiat'
      },
      relevanceScore: 85,
      compatibilityScore: 90,
      priceScore: 95,
      isAlternative: true,
      originalProductId: 'test-product',
      alternativeReason: 'Alternative plus économique'
    },
    {
      ...mockProduct,
      id: 'alternative-2',
      name: 'Alternative 2',
      price: 24.99,
      comparisonTags: ['Premium', 'Cliniquement prouvé'],
      differenceHighlights: ['Efficacité prouvée', 'Ingrédients premium'],
      priceComparison: '25% plus cher (24.99€)',
      potencyComparison: 'Action plus intensive',
      switchingImpact: {
        routineChanges: ['Introduction progressive recommandée'],
        expectedResults: 'Résultats plus rapides',
        precautions: ['Commencer 2-3x/semaine'],
        compatibilityWarnings: [],
        transitionPeriod: '2-3 semaines'
      },
      relevanceScore: 92,
      compatibilityScore: 88,
      priceScore: 70,
      isAlternative: true,
      originalProductId: 'test-product',
      alternativeReason: 'Alternative premium'
    }
  ]
  
  const mockSuccessResult = {
    success: true,
    alternatives: mockAlternatives,
    totalFound: 5,
    searchCriteria: {},
    processingTime: 150
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockFindAlternatives.mockResolvedValue(mockSuccessResult)
  })
  
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })
  
  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAlternatives())
      
      expect(result.current.alternatives).toEqual([])
      expect(result.current.isLoadingAlternatives).toBe(false)
      expect(result.current.alternativesError).toBe(null)
      expect(result.current.selectedAlternative).toBe(null)
      expect(result.current.searchResult).toBe(null)
    })
  })
  
  describe('loadAlternatives', () => {
    it('should load alternatives successfully', async () => {
      const { result } = renderHook(() => useAlternatives())
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      // Avancer les timers pour le debounce
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      expect(result.current.alternatives).toEqual(mockAlternatives)
      expect(result.current.searchResult).toEqual(mockSuccessResult)
      expect(result.current.alternativesError).toBe(null)
      expect(mockFindAlternatives).toHaveBeenCalledWith(mockProduct, {})
    })
    
    it('should apply debounce to search requests', async () => {
      const { result } = renderHook(() => useAlternatives({ debounceDelay: 500 }))
      
      // Faire plusieurs appels rapides
      act(() => {
        result.current.loadAlternatives(mockProduct)
        result.current.loadAlternatives(mockProduct)
        result.current.loadAlternatives(mockProduct)
      })
      
      // Avancer les timers partiellement
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      // Ne devrait pas encore avoir appelé le service
      expect(mockFindAlternatives).not.toHaveBeenCalled()
      
      // Avancer complètement
      await act(async () => {
        jest.advanceTimersByTime(200)
      })
      
      // Devrait avoir appelé le service une seule fois
      expect(mockFindAlternatives).toHaveBeenCalledTimes(1)
    })
    
    it('should handle search errors gracefully', async () => {
      const errorMessage = 'Search failed'
      mockFindAlternatives.mockResolvedValue({
        success: false,
        alternatives: [],
        totalFound: 0,
        searchCriteria: {},
        processingTime: 100,
        errors: [errorMessage]
      })
      
      const { result } = renderHook(() => useAlternatives())
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      expect(result.current.alternativesError).toBe(errorMessage)
      expect(result.current.alternatives).toEqual([])
    })
    
    it('should show loading state during search', async () => {
      let resolveSearch: (value: any) => void
      const searchPromise = new Promise(resolve => {
        resolveSearch = resolve
      })
      mockFindAlternatives.mockReturnValue(searchPromise)
      
      const { result } = renderHook(() => useAlternatives())
      
      act(() => {
        result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      expect(result.current.isLoadingAlternatives).toBe(true)
      
      await act(async () => {
        resolveSearch!(mockSuccessResult)
        await searchPromise
      })
      
      expect(result.current.isLoadingAlternatives).toBe(false)
    })
    
    it('should retry on error when autoRetry is enabled', async () => {
      mockFindAlternatives
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSuccessResult)
      
      const { result } = renderHook(() => useAlternatives({ autoRetry: true }))
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      // Avancer les timers pour le retry
      await act(async () => {
        jest.advanceTimersByTime(500)
      })
      
      await loadPromise
      
      expect(mockFindAlternatives).toHaveBeenCalledTimes(2)
      expect(result.current.alternatives).toEqual(mockAlternatives)
    })
    
    it('should pass search criteria correctly', async () => {
      const criteria: AlternativeCriteria = {
        priceRange: 'cheaper',
        naturalness: 'more_natural'
      }
      
      const { result } = renderHook(() => useAlternatives())
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct, criteria)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      expect(mockFindAlternatives).toHaveBeenCalledWith(mockProduct, criteria)
    })
  })
  
  describe('selectAlternative', () => {
    it('should select alternative correctly', () => {
      const { result } = renderHook(() => useAlternatives())
      
      act(() => {
        result.current.selectAlternative(mockAlternatives[0])
      })
      
      expect(result.current.selectedAlternative).toEqual(mockAlternatives[0])
    })
    
    it('should save selection to localStorage', () => {
      const { result } = renderHook(() => useAlternatives())
      
      act(() => {
        result.current.selectAlternative(mockAlternatives[0])
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'alternativeSelections',
        expect.stringContaining(mockAlternatives[0].id)
      )
    })
    
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })
      
      const { result } = renderHook(() => useAlternatives())
      
      expect(() => {
        act(() => {
          result.current.selectAlternative(mockAlternatives[0])
        })
      }).not.toThrow()
      
      expect(result.current.selectedAlternative).toEqual(mockAlternatives[0])
    })
  })
  
  describe('Caching', () => {
    it('should cache search results when enabled', async () => {
      const { result } = renderHook(() => useAlternatives({ cacheResults: true }))
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringMatching(/^alternatives_/),
        expect.stringContaining('"result"')
      )
    })
    
    it('should load from cache when available', async () => {
      const cacheKey = `alternatives_${mockProduct.id}_${JSON.stringify({})}`
      const cachedData = {
        result: mockSuccessResult,
        timestamp: Date.now() - 1000 // 1 seconde ago
      }
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === cacheKey) {
          return JSON.stringify(cachedData)
        }
        return null
      })
      
      const { result } = renderHook(() => useAlternatives({ cacheResults: true }))
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      // Devrait charger depuis le cache sans appeler le service
      expect(mockFindAlternatives).not.toHaveBeenCalled()
      expect(result.current.alternatives).toEqual(mockAlternatives)
    })
    
    it('should ignore expired cache', async () => {
      const cacheKey = `alternatives_${mockProduct.id}_${JSON.stringify({})}`
      const expiredData = {
        result: mockSuccessResult,
        timestamp: Date.now() - (35 * 60 * 1000) // 35 minutes ago (expired)
      }
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === cacheKey) {
          return JSON.stringify(expiredData)
        }
        return null
      })
      
      const { result } = renderHook(() => useAlternatives({ cacheResults: true }))
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      // Devrait faire une nouvelle recherche car le cache est expiré
      expect(mockFindAlternatives).toHaveBeenCalled()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(cacheKey)
    })
  })
  
  describe('Metrics', () => {
    it('should track search metrics', async () => {
      const { result } = renderHook(() => useAlternatives())
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      expect(result.current.searchMetrics.totalSearches).toBe(1)
      expect(result.current.searchMetrics.averageSearchTime).toBeGreaterThan(0)
      expect(result.current.searchMetrics.successRate).toBe(100)
      
      // Deuxième recherche
      const secondLoadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await secondLoadPromise
      
      expect(result.current.searchMetrics.totalSearches).toBe(2)
    })
    
    it('should track failed searches in metrics', async () => {
      mockFindAlternatives.mockRejectedValue(new Error('Search failed'))
      
      const { result } = renderHook(() => useAlternatives({ autoRetry: false }))
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      expect(result.current.searchMetrics.totalSearches).toBe(1)
      expect(result.current.searchMetrics.successRate).toBe(0)
    })
  })
  
  describe('Utility functions', () => {
    it('should clear alternatives', () => {
      const { result } = renderHook(() => useAlternatives())
      
      // Simuler des alternatives chargées
      act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      act(() => {
        result.current.selectAlternative(mockAlternatives[0])
      })
      
      act(() => {
        result.current.clearAlternatives()
      })
      
      expect(result.current.alternatives).toEqual([])
      expect(result.current.selectedAlternative).toBe(null)
      expect(result.current.alternativesError).toBe(null)
      expect(result.current.searchResult).toBe(null)
    })
    
    it('should clear alternatives error', async () => {
      mockFindAlternatives.mockResolvedValue({
        success: false,
        alternatives: [],
        totalFound: 0,
        searchCriteria: {},
        processingTime: 100,
        errors: ['Error message']
      })
      
      const { result } = renderHook(() => useAlternatives())
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      act(() => {
        result.current.clearAlternativesError()
      })
      
      expect(result.current.alternativesError).toBe(null)
    })
    
    it('should retry last search', async () => {
      const { result } = renderHook(() => useAlternatives())
      
      // Première recherche
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      // Clear mocks pour vérifier le retry
      jest.clearAllMocks()
      mockFindAlternatives.mockResolvedValue(mockSuccessResult)
      
      // Retry
      const retryPromise = act(async () => {
        await result.current.retryLoadAlternatives()
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await retryPromise
      
      expect(mockFindAlternatives).toHaveBeenCalledWith(mockProduct, {})
    })
    
    it('should handle retry when no previous search', async () => {
      const { result } = renderHook(() => useAlternatives())
      
      await act(async () => {
        await result.current.retryLoadAlternatives()
      })
      
      expect(mockFindAlternatives).not.toHaveBeenCalled()
    })
  })
  
  describe('Edge cases', () => {
    it('should handle malformed cache data', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      
      const { result } = renderHook(() => useAlternatives({ cacheResults: true }))
      
      const loadPromise = act(async () => {
        await result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      await loadPromise
      
      // Devrait faire une recherche normale malgré le cache corrompu
      expect(mockFindAlternatives).toHaveBeenCalled()
    })
    
    it('should cancel search when component unmounts', () => {
      const { result, unmount } = renderHook(() => useAlternatives())
      
      act(() => {
        result.current.loadAlternatives(mockProduct)
      })
      
      // Unmount avant que la recherche ne se termine
      unmount()
      
      // Ne devrait pas planter
      act(() => {
        jest.advanceTimersByTime(300)
      })
    })
    
    it('should handle concurrent searches correctly', async () => {
      let resolveFirst: (value: any) => void
      let resolveSecond: (value: any) => void
      
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve
      })
      const secondPromise = new Promise(resolve => {
        resolveSecond = resolve
      })
      
      mockFindAlternatives
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise)
      
      const { result } = renderHook(() => useAlternatives())
      
      // Démarrer première recherche
      act(() => {
        result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      // Démarrer deuxième recherche
      act(() => {
        result.current.loadAlternatives(mockProduct)
      })
      
      act(() => {
        jest.advanceTimersByTime(300)
      })
      
      // Résoudre la première (devrait être annulée)
      await act(async () => {
        resolveFirst!(mockSuccessResult)
        await firstPromise
      })
      
      // Résoudre la deuxième
      await act(async () => {
        resolveSecond!(mockSuccessResult)
        await secondPromise
      })
      
      expect(result.current.alternatives).toEqual(mockAlternatives)
    })
  })
})
