/**
 * 🔄 HOOK REACT - SYNCHRONISATION PRODUITS ↔ ROUTINE
 * 
 * Hook personnalisé pour la gestion de la synchronisation bidirectionnelle
 * entre la routine personnalisée et la section produits recommandés
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { UnifiedRoutineStep, RecommendedProduct } from '@/types'
import { EnrichedProduct, SyncResult } from '@/types/productSync'
import { ProductRoutineSyncService } from '@/services/products/ProductRoutineSyncService'

interface UseProductSyncReturn {
  // État
  enrichedProducts: EnrichedProduct[]
  isLoading: boolean
  error: string | null
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  lastSyncTime: Date | null
  
  // Actions
  syncFromRoutine: (routine: UnifiedRoutineStep[]) => Promise<void>
  replaceProduct: (oldProduct: EnrichedProduct, newProduct: EnrichedProduct) => Promise<SyncResult>
  refreshProducts: () => Promise<void>
  clearError: () => void
  
  // Métadonnées
  syncMetrics: {
    totalSyncs: number
    successfulSyncs: number
    averageSyncTime: number
  }
}

interface UseProductSyncOptions {
  autoSync?: boolean
  cacheResults?: boolean
  retryOnError?: boolean
  maxRetries?: number
}

export const useProductSync = (
  initialRoutine?: UnifiedRoutineStep[],
  options: UseProductSyncOptions = {}
): UseProductSyncReturn => {
  
  const {
    autoSync = true,
    cacheResults = true,
    retryOnError = true,
    maxRetries = 3
  } = options
  
  // État local
  const [enrichedProducts, setEnrichedProducts] = useState<EnrichedProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [currentRoutine, setCurrentRoutine] = useState<UnifiedRoutineStep[]>(initialRoutine || [])
  
  // Métriques de performance
  const [syncMetrics, setSyncMetrics] = useState({
    totalSyncs: 0,
    successfulSyncs: 0,
    averageSyncTime: 0
  })
  
  // Refs pour éviter les fuites mémoire et gérer les annulations
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)
  const syncTimesRef = useRef<number[]>([])
  
  /**
   * 🔄 SYNCHRONISATION DEPUIS ROUTINE
   */
  const syncFromRoutine = useCallback(async (routine: UnifiedRoutineStep[]) => {
    console.log('🔄 Hook: Synchronisation depuis routine')
    
    // Annuler toute synchronisation en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Créer nouveau controller pour cette synchronisation
    abortControllerRef.current = new AbortController()
    const startTime = Date.now()
    
    setIsLoading(true)
    setSyncStatus('syncing')
    setError(null)
    retryCountRef.current = 0
    
    const performSync = async (attempt: number = 1): Promise<void> => {
      try {
        console.log(`🔄 Tentative de synchronisation ${attempt}/${maxRetries + 1}`)
        
        // Vérifier si l'opération a été annulée
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Synchronisation annulée')
        }
        
        // 1. Extraire produits de la routine
        const extractedProducts = ProductRoutineSyncService.extractProductsFromRoutine(routine)
        
        // Vérifier annulation après extraction
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Synchronisation annulée')
        }
        
        // 2. Enrichir avec données catalogue
        const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(extractedProducts)
        
        // Vérifier annulation après enrichissement
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Synchronisation annulée')
        }
        
        // 3. Mettre à jour l'état
        setEnrichedProducts(enriched)
        setCurrentRoutine(routine)
        setSyncStatus('success')
        setLastSyncTime(new Date())
        
        // Mettre à jour les métriques
        const syncTime = Date.now() - startTime
        syncTimesRef.current.push(syncTime)
        
        setSyncMetrics(prev => ({
          totalSyncs: prev.totalSyncs + 1,
          successfulSyncs: prev.successfulSyncs + 1,
          averageSyncTime: syncTimesRef.current.reduce((a, b) => a + b, 0) / syncTimesRef.current.length
        }))
        
        console.log(`✅ Hook: ${enriched.length} produits synchronisés en ${syncTime}ms`)
        
        // Cache des résultats si activé
        if (cacheResults) {
          try {
            localStorage.setItem('productSync_cache', JSON.stringify({
              products: enriched,
              routine: routine,
              timestamp: Date.now()
            }))
          } catch (cacheError) {
            console.warn('⚠️ Impossible de mettre en cache les résultats:', cacheError)
          }
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de synchronisation'
        
        // Ne pas retry si l'opération a été annulée
        if (errorMessage.includes('annulée')) {
          console.log('🔄 Synchronisation annulée par l\'utilisateur')
          return
        }
        
        console.error(`❌ Hook: Erreur synchronisation (tentative ${attempt}):`, err)
        
        // Retry si activé et tentatives restantes
        if (retryOnError && attempt <= maxRetries) {
          retryCountRef.current = attempt
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Backoff exponentiel
          
          console.log(`🔄 Nouvelle tentative dans ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          return performSync(attempt + 1)
        }
        
        // Échec définitif
        setError(errorMessage)
        setSyncStatus('error')
        
        // Mettre à jour métriques d'échec
        setSyncMetrics(prev => ({
          ...prev,
          totalSyncs: prev.totalSyncs + 1
        }))
        
        throw err
      }
    }
    
    try {
      await performSync()
    } catch (finalError) {
      // L'erreur a déjà été gérée dans performSync
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [cacheResults, retryOnError, maxRetries])
  
  /**
   * 🔄 REMPLACEMENT DE PRODUIT
   */
  const replaceProduct = useCallback(async (
    oldProduct: EnrichedProduct, 
    newProduct: EnrichedProduct
  ): Promise<SyncResult> => {
    console.log(`🔄 Hook: Remplacement ${oldProduct.name} → ${newProduct.name}`)
    setIsLoading(true)
    setError(null)
    
    try {
      // 1. Synchroniser le remplacement
      const syncResult = await ProductRoutineSyncService.syncProductReplacement(
        oldProduct,
        newProduct,
        currentRoutine
      )
      
      if (syncResult.success) {
        // 2. Mettre à jour l'état local
        setEnrichedProducts(syncResult.updatedProducts)
        setCurrentRoutine(syncResult.updatedRoutine)
        setLastSyncTime(new Date())
        
        // 3. Afficher les avertissements s'il y en a
        if (syncResult.warnings && syncResult.warnings.length > 0) {
          console.warn('⚠️ Avertissements lors du remplacement:', syncResult.warnings)
        }
        
        console.log('✅ Hook: Remplacement réussi')
      } else {
        throw new Error(syncResult.errors?.join(', ') || 'Erreur de remplacement')
      }
      
      return syncResult
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de remplacement'
      console.error('❌ Hook: Erreur remplacement:', err)
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [currentRoutine])
  
  /**
   * 🔄 RAFRAÎCHISSEMENT DES PRODUITS
   */
  const refreshProducts = useCallback(async () => {
    if (currentRoutine.length > 0) {
      console.log('🔄 Hook: Rafraîchissement des produits')
      await syncFromRoutine(currentRoutine)
    } else {
      console.warn('⚠️ Aucune routine disponible pour le rafraîchissement')
    }
  }, [currentRoutine, syncFromRoutine])
  
  /**
   * 🧹 NETTOYAGE ERREUR
   */
  const clearError = useCallback(() => {
    setError(null)
    setSyncStatus('idle')
    retryCountRef.current = 0
  }, [])
  
  /**
   * 💾 CHARGEMENT DEPUIS LE CACHE
   */
  const loadFromCache = useCallback(() => {
    if (!cacheResults) return false
    
    try {
      const cached = localStorage.getItem('productSync_cache')
      if (!cached) return false
      
      const { products, routine, timestamp } = JSON.parse(cached)
      
      // Vérifier si le cache n'est pas trop ancien (1 heure)
      const cacheAge = Date.now() - timestamp
      if (cacheAge > 60 * 60 * 1000) {
        localStorage.removeItem('productSync_cache')
        return false
      }
      
      setEnrichedProducts(products)
      setCurrentRoutine(routine)
      setSyncStatus('success')
      setLastSyncTime(new Date(timestamp))
      
      console.log('✅ Données chargées depuis le cache')
      return true
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement du cache:', error)
      localStorage.removeItem('productSync_cache')
      return false
    }
  }, [cacheResults])
  
  // Synchronisation initiale
  useEffect(() => {
    if (initialRoutine && initialRoutine.length > 0) {
      // Essayer de charger depuis le cache d'abord
      const loadedFromCache = loadFromCache()
      
      // Si pas de cache ou auto-sync activé, synchroniser
      if (!loadedFromCache && autoSync) {
        syncFromRoutine(initialRoutine)
      }
    }
  }, [initialRoutine, syncFromRoutine, autoSync, loadFromCache])
  
  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  return {
    // État
    enrichedProducts,
    isLoading,
    error,
    syncStatus,
    lastSyncTime,
    
    // Actions
    syncFromRoutine,
    replaceProduct,
    refreshProducts,
    clearError,
    
    // Métadonnées
    syncMetrics
  }
}
