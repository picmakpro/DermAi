/**
 * ⚡ TESTS DE PERFORMANCE - SYNCHRONISATION PRODUITS ↔ ROUTINE
 * 
 * Tests de performance et charge pour valider les objectifs de rapidité
 * et de scalabilité du système d'alternatives intelligentes
 * 
 * Sprint 3 - Intégration, Tests & Optimisation
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { performance } from 'perf_hooks'
import { ProductRoutineSyncService } from '@/services/products/ProductRoutineSyncService'
import { AlternativeProductService } from '@/services/products/AlternativeProductService'
import { useProductSync } from '@/hooks/useProductSync'
import { renderHook, act } from '@testing-library/react'
import { UnifiedRoutineStep } from '@/types'
import { EnrichedProduct } from '@/types/productSync'

// Mock des services externes
jest.mock('@/services/catalog/catalogService')

describe('⚡ Performance Tests - Product Sync System', () => {
  
  // Générateur de données de test à grande échelle
  const generateLargeRoutine = (stepCount: number): UnifiedRoutineStep[] => {
    return Array.from({ length: stepCount }, (_, i) => ({
      stepNumber: i + 1,
      title: `Step ${i + 1}`,
      description: `Description for step ${i + 1}`,
      category: ['cleansing', 'treatment', 'moisturizing', 'protection'][i % 4] as any,
      phase: ['immediate', 'adaptation', 'maintenance'][i % 3] as any,
      zones: ['visage', 'contour_yeux', 'cou'][i % 3],
      frequency: 'daily',
      timeOfDay: ['morning', 'evening'][i % 2] as any,
      applicationDuration: 'En continu',
      recommendedProducts: Array.from({ length: Math.min(3, i % 4 + 1) }, (_, j) => ({
        id: `product-${i}-${j}`,
        name: `Product ${i}-${j}`,
        brand: `Brand ${j % 5}`,
        category: ['cleanser', 'serum', 'moisturizer', 'sunscreen'][j % 4] as any,
        price: 10 + (i * j) % 50,
        catalogId: `catalog-${i}-${j}`,
        affiliateLink: `https://example.com/product-${i}-${j}`,
        applicationAdvice: `Application advice for product ${i}-${j}`,
        restrictions: []
      }))
    }))
  }

  const generateLargeCatalog = (productCount: number) => ({
    products: Array.from({ length: productCount }, (_, i) => ({
      id: `catalog-${Math.floor(i / 3)}-${i % 3}`,
      name: `Catalog Product ${i}`,
      brand: `Brand ${i % 10}`,
      category: ['cleanser', 'serum', 'moisturizer', 'sunscreen', 'treatment'][i % 5],
      price: 5 + (i % 100),
      imageUrl: `https://example.com/product-${i}.jpg`,
      benefits: [`Benefit ${i}`, `Feature ${i}`],
      skinTypes: ['normale', 'sèche', 'grasse', 'mixte', 'sensible'][i % 5],
      affiliateLink: `https://example.com/affiliate-${i}`
    }))
  })

  beforeEach(() => {
    // Mock du catalogue avec beaucoup de produits
    const { loadCatalog } = require('@/services/catalog/catalogService')
    loadCatalog.mockResolvedValue(generateLargeCatalog(1000))
    
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('🚀 Sync Performance Tests', () => {
    
    it('should sync small routine within 100ms', async () => {
      const smallRoutine = generateLargeRoutine(3) // 3 étapes
      
      const startTime = performance.now()
      
      const extractedProducts = ProductRoutineSyncService.extractProductsFromRoutine(smallRoutine)
      const enrichedProducts = await ProductRoutineSyncService.enrichProductsWithCatalogData(extractedProducts)
      
      const endTime = performance.now()
      const syncTime = endTime - startTime
      
      expect(syncTime).toBeLessThan(100) // < 100ms pour petite routine
      expect(enrichedProducts.length).toBeGreaterThan(0)
      
      console.log(`✅ Small routine sync: ${syncTime.toFixed(2)}ms for ${enrichedProducts.length} products`)
    })

    it('should sync medium routine within 300ms', async () => {
      const mediumRoutine = generateLargeRoutine(10) // 10 étapes
      
      const startTime = performance.now()
      
      const extractedProducts = ProductRoutineSyncService.extractProductsFromRoutine(mediumRoutine)
      const enrichedProducts = await ProductRoutineSyncService.enrichProductsWithCatalogData(extractedProducts)
      
      const endTime = performance.now()
      const syncTime = endTime - startTime
      
      expect(syncTime).toBeLessThan(300) // < 300ms pour routine moyenne
      expect(enrichedProducts.length).toBeGreaterThan(10)
      
      console.log(`✅ Medium routine sync: ${syncTime.toFixed(2)}ms for ${enrichedProducts.length} products`)
    })

    it('should sync large routine within 500ms (target)', async () => {
      const largeRoutine = generateLargeRoutine(25) // 25 étapes
      
      const startTime = performance.now()
      
      const extractedProducts = ProductRoutineSyncService.extractProductsFromRoutine(largeRoutine)
      const enrichedProducts = await ProductRoutineSyncService.enrichProductsWithCatalogData(extractedProducts)
      
      const endTime = performance.now()
      const syncTime = endTime - startTime
      
      expect(syncTime).toBeLessThan(500) // Objectif: < 500ms
      expect(enrichedProducts.length).toBeGreaterThan(25)
      
      console.log(`✅ Large routine sync: ${syncTime.toFixed(2)}ms for ${enrichedProducts.length} products`)
    })

    it('should handle concurrent sync operations', async () => {
      const routines = Array.from({ length: 5 }, (_, i) => generateLargeRoutine(5 + i))
      
      const startTime = performance.now()
      
      // Exécuter 5 synchronisations en parallèle
      const promises = routines.map(async (routine) => {
        const extracted = ProductRoutineSyncService.extractProductsFromRoutine(routine)
        return ProductRoutineSyncService.enrichProductsWithCatalogData(extracted)
      })
      
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(1000) // < 1s pour 5 syncs parallèles
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result.length).toBeGreaterThan(0)
      })
      
      console.log(`✅ Concurrent sync: ${totalTime.toFixed(2)}ms for ${results.length} parallel operations`)
    })
  })

  describe('🔍 Alternative Search Performance Tests', () => {
    
    it('should find alternatives within 50ms', async () => {
      const routine = generateLargeRoutine(1)
      const extracted = ProductRoutineSyncService.extractProductsFromRoutine(routine)
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(extracted)
      
      const testProduct = enriched[0]
      
      const startTime = performance.now()
      
      const alternatives = await AlternativeProductService.findAlternatives(testProduct)
      
      const endTime = performance.now()
      const searchTime = endTime - startTime
      
      expect(searchTime).toBeLessThan(50) // < 50ms pour recherche alternatives
      expect(alternatives.length).toBeLessThanOrEqual(3) // Max 3 alternatives
      
      console.log(`✅ Alternative search: ${searchTime.toFixed(2)}ms for ${alternatives.length} alternatives`)
    })

    it('should handle multiple alternative searches efficiently', async () => {
      const routine = generateLargeRoutine(10)
      const extracted = ProductRoutineSyncService.extractProductsFromRoutine(routine)
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(extracted)
      
      const startTime = performance.now()
      
      // Rechercher des alternatives pour tous les produits
      const alternativePromises = enriched.map(product => 
        AlternativeProductService.findAlternatives(product)
      )
      
      const allAlternatives = await Promise.all(alternativePromises)
      
      const endTime = performance.now()
      const totalSearchTime = endTime - startTime
      
      expect(totalSearchTime).toBeLessThan(200) // < 200ms pour recherche multiple
      expect(allAlternatives).toHaveLength(enriched.length)
      
      console.log(`✅ Multiple alternative searches: ${totalSearchTime.toFixed(2)}ms for ${enriched.length} products`)
    })

    it('should filter alternatives by criteria efficiently', async () => {
      const routine = generateLargeRoutine(1)
      const extracted = ProductRoutineSyncService.extractProductsFromRoutine(routine)
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(extracted)
      
      const testProduct = enriched[0]
      
      const criteriaTests = [
        { priceRange: 'cheaper' as const },
        { priceRange: 'premium' as const },
        { naturalness: 'more_natural' as const },
        { potency: 'gentler' as const }
      ]
      
      const startTime = performance.now()
      
      const results = await Promise.all(
        criteriaTests.map(criteria => 
          AlternativeProductService.findAlternatives(testProduct, criteria)
        )
      )
      
      const endTime = performance.now()
      const filterTime = endTime - startTime
      
      expect(filterTime).toBeLessThan(100) // < 100ms pour filtrage multiple
      expect(results).toHaveLength(4)
      
      console.log(`✅ Criteria filtering: ${filterTime.toFixed(2)}ms for ${criteriaTests.length} criteria`)
    })
  })

  describe('🎣 Hook Performance Tests', () => {
    
    it('should initialize useProductSync hook quickly', async () => {
      const routine = generateLargeRoutine(5)
      
      const startTime = performance.now()
      
      const { result } = renderHook(() => useProductSync(routine))
      
      // Attendre l'initialisation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      const endTime = performance.now()
      const initTime = endTime - startTime
      
      expect(initTime).toBeLessThan(150) // < 150ms pour initialisation
      expect(result.current.enrichedProducts.length).toBeGreaterThan(0)
      
      console.log(`✅ Hook initialization: ${initTime.toFixed(2)}ms`)
    })

    it('should handle rapid state updates efficiently', async () => {
      const { result } = renderHook(() => useProductSync())
      
      const routines = Array.from({ length: 10 }, (_, i) => generateLargeRoutine(2 + i))
      
      const startTime = performance.now()
      
      // Effectuer des mises à jour rapides
      for (const routine of routines) {
        await act(async () => {
          await result.current.syncFromRoutine(routine)
        })
      }
      
      const endTime = performance.now()
      const updateTime = endTime - startTime
      
      expect(updateTime).toBeLessThan(1000) // < 1s pour 10 mises à jour
      expect(result.current.syncMetrics.totalSyncs).toBe(10)
      
      console.log(`✅ Rapid updates: ${updateTime.toFixed(2)}ms for ${routines.length} updates`)
    })
  })

  describe('💾 Memory Performance Tests', () => {
    
    it('should not leak memory during multiple syncs', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Effectuer beaucoup de synchronisations
      for (let i = 0; i < 50; i++) {
        const routine = generateLargeRoutine(10)
        const extracted = ProductRoutineSyncService.extractProductsFromRoutine(routine)
        await ProductRoutineSyncService.enrichProductsWithCatalogData(extracted)
        
        // Forcer le garbage collection si disponible
        if (global.gc) {
          global.gc()
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // L'augmentation de mémoire ne devrait pas être excessive
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // < 50MB
      
      console.log(`✅ Memory usage: +${(memoryIncrease / 1024 / 1024).toFixed(2)}MB after 50 syncs`)
    })

    it('should handle large datasets without memory issues', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Créer une très grande routine
      const hugeRoutine = generateLargeRoutine(100) // 100 étapes
      
      const extracted = ProductRoutineSyncService.extractProductsFromRoutine(hugeRoutine)
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(extracted)
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryUsed = finalMemory - initialMemory
      
      expect(enriched.length).toBeGreaterThan(100)
      expect(memoryUsed).toBeLessThan(100 * 1024 * 1024) // < 100MB pour 100 étapes
      
      console.log(`✅ Large dataset: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB for ${enriched.length} products`)
    })
  })

  describe('🌐 Network Performance Simulation', () => {
    
    it('should handle slow catalog loading gracefully', async () => {
      // Simuler un chargement lent du catalogue
      const { loadCatalog } = require('@/services/catalog/catalogService')
      loadCatalog.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(generateLargeCatalog(100)), 200) // 200ms delay
        )
      )
      
      const routine = generateLargeRoutine(5)
      
      const startTime = performance.now()
      
      const extracted = ProductRoutineSyncService.extractProductsFromRoutine(routine)
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(extracted)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeGreaterThan(200) // Au moins le délai simulé
      expect(totalTime).toBeLessThan(300) // Mais pas trop plus
      expect(enriched.length).toBeGreaterThan(0)
      
      console.log(`✅ Slow network: ${totalTime.toFixed(2)}ms with 200ms catalog delay`)
    })

    it('should timeout appropriately on very slow requests', async () => {
      // Simuler un timeout très long
      const { loadCatalog } = require('@/services/catalog/catalogService')
      loadCatalog.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(generateLargeCatalog(100)), 5000) // 5s delay
        )
      )
      
      const routine = generateLargeRoutine(3)
      
      const startTime = performance.now()
      
      try {
        const extracted = ProductRoutineSyncService.extractProductsFromRoutine(routine)
        
        // Avec timeout (simulé par Promise.race)
        const enrichmentPromise = ProductRoutineSyncService.enrichProductsWithCatalogData(extracted)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 1000)
        )
        
        await Promise.race([enrichmentPromise, timeoutPromise])
        
        // Ne devrait pas arriver ici
        expect(true).toBe(false)
        
      } catch (error) {
        const endTime = performance.now()
        const timeoutTime = endTime - startTime
        
        expect(error.message).toBe('Timeout')
        expect(timeoutTime).toBeLessThan(1100) // Proche de 1s
        
        console.log(`✅ Timeout handling: ${timeoutTime.toFixed(2)}ms`)
      }
    })
  })

  describe('📊 Performance Metrics Collection', () => {
    
    it('should collect accurate performance metrics', async () => {
      const { result } = renderHook(() => useProductSync())
      
      const routines = [
        generateLargeRoutine(3),
        generateLargeRoutine(5),
        generateLargeRoutine(7)
      ]
      
      // Effectuer plusieurs syncs pour collecter des métriques
      for (const routine of routines) {
        await act(async () => {
          await result.current.syncFromRoutine(routine)
        })
      }
      
      const metrics = result.current.syncMetrics
      
      expect(metrics.totalSyncs).toBe(3)
      expect(metrics.successfulSyncs).toBe(3)
      expect(metrics.averageSyncTime).toBeGreaterThan(0)
      expect(metrics.averageSyncTime).toBeLessThan(500) // Dans les objectifs
      
      console.log(`✅ Metrics: ${metrics.totalSyncs} syncs, avg ${metrics.averageSyncTime.toFixed(2)}ms`)
    })

    it('should track performance degradation over time', async () => {
      const { result } = renderHook(() => useProductSync())
      
      const syncTimes: number[] = []
      
      // Effectuer 20 syncs et mesurer les temps
      for (let i = 0; i < 20; i++) {
        const routine = generateLargeRoutine(5)
        
        const startTime = performance.now()
        
        await act(async () => {
          await result.current.syncFromRoutine(routine)
        })
        
        const syncTime = performance.now() - startTime
        syncTimes.push(syncTime)
      }
      
      // Vérifier qu'il n'y a pas de dégradation significative
      const firstHalf = syncTimes.slice(0, 10)
      const secondHalf = syncTimes.slice(10, 20)
      
      const avgFirstHalf = firstHalf.reduce((a, b) => a + b) / firstHalf.length
      const avgSecondHalf = secondHalf.reduce((a, b) => a + b) / secondHalf.length
      
      // La deuxième moitié ne devrait pas être plus de 50% plus lente
      expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 1.5)
      
      console.log(`✅ Performance stability: ${avgFirstHalf.toFixed(2)}ms → ${avgSecondHalf.toFixed(2)}ms`)
    })
  })
})
