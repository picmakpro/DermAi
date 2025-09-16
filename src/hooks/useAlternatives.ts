/**
 * 🔍 HOOK REACT - GESTION DES ALTERNATIVES
 * 
 * Hook personnalisé pour la gestion des alternatives de produits
 * avec critères de comparaison et logique de sélection
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { EnrichedProduct } from '@/types/productSync'
import { 
  AlternativeProduct, 
  AlternativeCriteria, 
  AlternativeSearchResult 
} from '@/types/alternatives'
import { AlternativeProductService } from '@/services/products/AlternativeProductService'

interface UseAlternativesReturn {
  // État
  alternatives: AlternativeProduct[]
  isLoadingAlternatives: boolean
  alternativesError: string | null
  selectedAlternative: AlternativeProduct | null
  searchResult: AlternativeSearchResult | null
  
  // Actions
  loadAlternatives: (product: EnrichedProduct, criteria?: AlternativeCriteria) => Promise<void>
  selectAlternative: (alternative: AlternativeProduct) => void
  clearAlternatives: () => void
  clearAlternativesError: () => void
  retryLoadAlternatives: () => Promise<void>
  
  // Métadonnées
  searchMetrics: {
    totalSearches: number
    averageSearchTime: number
    successRate: number
  }
}

interface UseAlternativesOptions {
  cacheResults?: boolean
  autoRetry?: boolean
  maxRetries?: number
  debounceDelay?: number
}

export const useAlternatives = (
  options: UseAlternativesOptions = {}
): UseAlternativesReturn => {
  
  const {
    cacheResults = true,
    autoRetry = true,
    maxRetries = 2,
    debounceDelay = 300
  } = options
  
  // État local
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([])
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false)
  const [alternativesError, setAlternativesError] = useState<string | null>(null)
  const [selectedAlternative, setSelectedAlternative] = useState<AlternativeProduct | null>(null)
  const [searchResult, setSearchResult] = useState<AlternativeSearchResult | null>(null)
  
  // Métriques de performance
  const [searchMetrics, setSearchMetrics] = useState({
    totalSearches: 0,
    averageSearchTime: 0,
    successRate: 0
  })
  
  // Refs pour gestion des requêtes et cache
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastSearchRef = useRef<{ product: EnrichedProduct, criteria: AlternativeCriteria } | null>(null)
  const searchTimesRef = useRef<number[]>([])
  const successfulSearchesRef = useRef(0)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  /**
   * 🔍 CHARGEMENT DES ALTERNATIVES
   */
  const loadAlternatives = useCallback(async (
    product: EnrichedProduct,
    criteria: AlternativeCriteria = {}
  ) => {
    console.log(`🔍 Hook: Chargement alternatives pour ${product.name}`)
    
    // Annuler toute recherche en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Annuler le timer de debounce précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Appliquer le debounce
    return new Promise<void>((resolve, reject) => {
      debounceTimerRef.current = setTimeout(async () => {
        await performSearch(product, criteria, resolve, reject)
      }, debounceDelay)
    })
  }, [debounceDelay])
  
  /**
   * 🔍 EXÉCUTION DE LA RECHERCHE
   */
  const performSearch = async (
    product: EnrichedProduct,
    criteria: AlternativeCriteria,
    resolve: () => void,
    reject: (error: any) => void
  ) => {
    // Créer nouveau controller pour cette recherche
    abortControllerRef.current = new AbortController()
    const startTime = Date.now()
    
    setIsLoadingAlternatives(true)
    setAlternativesError(null)
    lastSearchRef.current = { product, criteria }
    
    const performSearchWithRetry = async (attempt: number = 1): Promise<void> => {
      try {
        console.log(`🔍 Tentative de recherche ${attempt}/${maxRetries + 1}`)
        
        // Vérifier si l'opération a été annulée
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Recherche annulée')
        }
        
        // Vérifier le cache d'abord
        let result: AlternativeSearchResult | null = null
        
        if (cacheResults) {
          result = loadFromCache(product, criteria)
        }
        
        // Si pas de cache, effectuer la recherche
        if (!result) {
          result = await AlternativeProductService.findAlternatives(product, criteria)
        }
        
        // Vérifier annulation après recherche
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Recherche annulée')
        }
        
        if (result.success) {
          setAlternatives(result.alternatives)
          setSearchResult(result)
          
          // Mettre à jour les métriques
          const searchTime = Date.now() - startTime
          searchTimesRef.current.push(searchTime)
          successfulSearchesRef.current++
          
          setSearchMetrics(prev => ({
            totalSearches: prev.totalSearches + 1,
            averageSearchTime: searchTimesRef.current.reduce((a, b) => a + b, 0) / searchTimesRef.current.length,
            successRate: (successfulSearchesRef.current / (prev.totalSearches + 1)) * 100
          }))
          
          console.log(`✅ Hook: ${result.alternatives.length} alternatives trouvées en ${searchTime}ms`)
          
          // Sauvegarder en cache si activé
          if (cacheResults && !loadFromCache(product, criteria)) {
            saveToCache(product, criteria, result)
          }
          
        } else {
          throw new Error(result.errors?.join(', ') || 'Erreur de recherche d\'alternatives')
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de recherche d\'alternatives'
        
        // Ne pas retry si l'opération a été annulée
        if (errorMessage.includes('annulée')) {
          console.log('🔍 Recherche annulée par l\'utilisateur')
          return
        }
        
        console.error(`❌ Hook: Erreur recherche alternatives (tentative ${attempt}):`, err)
        
        // Retry si activé et tentatives restantes
        if (autoRetry && attempt <= maxRetries) {
          const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000) // Backoff exponentiel
          
          console.log(`🔍 Nouvelle tentative dans ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          return performSearchWithRetry(attempt + 1)
        }
        
        // Échec définitif
        setAlternativesError(errorMessage)
        setAlternatives([])
        setSearchResult(null)
        
        // Mettre à jour métriques d'échec
        setSearchMetrics(prev => ({
          totalSearches: prev.totalSearches + 1,
          averageSearchTime: prev.averageSearchTime, // Ne pas compter les échecs dans le temps moyen
          successRate: (successfulSearchesRef.current / (prev.totalSearches + 1)) * 100
        }))
        
        throw err
      }
    }
    
    try {
      await performSearchWithRetry()
      resolve()
    } catch (finalError) {
      reject(finalError)
    } finally {
      setIsLoadingAlternatives(false)
      abortControllerRef.current = null
    }
  }
  
  /**
   * ✅ SÉLECTION D'UNE ALTERNATIVE
   */
  const selectAlternative = useCallback((alternative: AlternativeProduct) => {
    console.log(`✅ Hook: Alternative sélectionnée: ${alternative.name}`)
    setSelectedAlternative(alternative)
    
    // Optionnel : tracker la sélection pour analytics
    try {
      const selectionEvent = {
        originalProductId: alternative.originalProductId,
        selectedAlternativeId: alternative.id,
        alternativeReason: alternative.alternativeReason,
        timestamp: Date.now()
      }
      
      // Sauvegarder l'historique des sélections
      const history = JSON.parse(localStorage.getItem('alternativeSelections') || '[]')
      history.push(selectionEvent)
      
      // Garder seulement les 50 dernières sélections
      if (history.length > 50) {
        history.splice(0, history.length - 50)
      }
      
      localStorage.setItem('alternativeSelections', JSON.stringify(history))
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder l\'historique de sélection:', error)
    }
  }, [])
  
  /**
   * 🧹 NETTOYAGE DES ALTERNATIVES
   */
  const clearAlternatives = useCallback(() => {
    console.log('🧹 Hook: Nettoyage des alternatives')
    setAlternatives([])
    setSelectedAlternative(null)
    setAlternativesError(null)
    setSearchResult(null)
    lastSearchRef.current = null
    
    // Annuler toute recherche en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Annuler le timer de debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])
  
  /**
   * 🧹 NETTOYAGE ERREUR ALTERNATIVES
   */
  const clearAlternativesError = useCallback(() => {
    setAlternativesError(null)
  }, [])
  
  /**
   * 🔄 RETRY DE LA DERNIÈRE RECHERCHE
   */
  const retryLoadAlternatives = useCallback(async () => {
    if (!lastSearchRef.current) {
      console.warn('⚠️ Aucune recherche précédente à relancer')
      return
    }
    
    const { product, criteria } = lastSearchRef.current
    console.log('🔄 Hook: Retry de la recherche d\'alternatives')
    await loadAlternatives(product, criteria)
  }, [loadAlternatives])
  
  /**
   * 💾 CHARGEMENT DEPUIS LE CACHE
   */
  const loadFromCache = useCallback((
    product: EnrichedProduct, 
    criteria: AlternativeCriteria
  ): AlternativeSearchResult | null => {
    if (!cacheResults) return null
    
    try {
      const cacheKey = `alternatives_${product.id}_${JSON.stringify(criteria)}`
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null
      
      const { result, timestamp } = JSON.parse(cached)
      
      // Vérifier si le cache n'est pas trop ancien (30 minutes)
      const cacheAge = Date.now() - timestamp
      if (cacheAge > 30 * 60 * 1000) {
        localStorage.removeItem(cacheKey)
        return null
      }
      
      console.log('✅ Alternatives chargées depuis le cache')
      return result
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement du cache d\'alternatives:', error)
      return null
    }
  }, [cacheResults])
  
  /**
   * 💾 SAUVEGARDE EN CACHE
   */
  const saveToCache = useCallback((
    product: EnrichedProduct,
    criteria: AlternativeCriteria,
    result: AlternativeSearchResult
  ) => {
    if (!cacheResults) return
    
    try {
      const cacheKey = `alternatives_${product.id}_${JSON.stringify(criteria)}`
      const cacheData = {
        result,
        timestamp: Date.now()
      }
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      
      // Nettoyer les anciens caches (garder max 20 entrées)
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('alternatives_'))
      if (allKeys.length > 20) {
        const oldestKeys = allKeys.slice(0, allKeys.length - 20)
        oldestKeys.forEach(key => localStorage.removeItem(key))
      }
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder en cache:', error)
    }
  }, [cacheResults])
  
  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])
  
  return {
    // État
    alternatives,
    isLoadingAlternatives,
    alternativesError,
    selectedAlternative,
    searchResult,
    
    // Actions
    loadAlternatives,
    selectAlternative,
    clearAlternatives,
    clearAlternativesError,
    retryLoadAlternatives,
    
    // Métadonnées
    searchMetrics
  }
}
