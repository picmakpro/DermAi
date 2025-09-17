/**
 * 📊 HOOK D'ANALYTICS PRODUITS
 * 
 * Hook React pour l'intégration facile des analytics de conversion
 * avec tracking automatique et métriques temps réel
 * 
 * Sprint 3 - Intégration, Tests & Optimisation
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { useCallback, useEffect, useState, useRef } from 'react'
import { 
  ProductConversionAnalytics,
  ConversionFunnel,
  ProductPerformanceMetrics,
  UserSegmentAnalytics
} from '@/services/analytics/ProductConversionAnalytics'
import { EnrichedProduct, AlternativeProduct } from '@/types/productSync'

interface UseProductAnalyticsReturn {
  // Tracking functions
  trackProductView: (product: EnrichedProduct, position: number, totalProducts: number) => void
  trackAlternativeOpened: (product: EnrichedProduct) => void
  trackAlternativeSelected: (original: EnrichedProduct, alternative: AlternativeProduct) => void
  trackProductReplacement: (oldProduct: EnrichedProduct, newProduct: AlternativeProduct) => void
  trackAffiliateClick: (product: EnrichedProduct | AlternativeProduct) => void
  trackPurchaseIntent: (product: EnrichedProduct | AlternativeProduct, intent: 'high' | 'medium' | 'low') => void
  
  // Analytics data
  conversionFunnel: ConversionFunnel[]
  isLoadingAnalytics: boolean
  
  // Performance metrics
  getProductPerformance: (productId: string) => ProductPerformanceMetrics | null
  
  // User context
  setUserContext: (context: Record<string, any>) => void
  
  // Real-time metrics
  sessionMetrics: {
    productsViewed: number
    alternativesExplored: number
    replacementsMade: number
    affiliateClicks: number
  }
}

interface UseProductAnalyticsOptions {
  userId?: string
  autoTrackViews?: boolean
  trackViewTime?: boolean
  batchEvents?: boolean
  realTimeMetrics?: boolean
}

export const useProductAnalytics = (
  options: UseProductAnalyticsOptions = {}
): UseProductAnalyticsReturn => {
  
  const {
    userId,
    autoTrackViews = true,
    trackViewTime = true,
    batchEvents = false,
    realTimeMetrics = true
  } = options
  
  // État local
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([])
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [userContext, setUserContextState] = useState<Record<string, any>>({})
  const [sessionMetrics, setSessionMetrics] = useState({
    productsViewed: 0,
    alternativesExplored: 0,
    replacementsMade: 0,
    affiliateClicks: 0
  })
  
  // Références pour le tracking
  const viewTimersRef = useRef<Map<string, number>>(new Map())
  const eventBatchRef = useRef<any[]>([])
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Configuration initiale
  useEffect(() => {
    if (userId) {
      ProductConversionAnalytics.setUserId(userId)
    }
  }, [userId])
  
  // Mise à jour des métriques temps réel
  useEffect(() => {
    if (!realTimeMetrics) return
    
    const updateMetrics = () => {
      const events = ProductConversionAnalytics.exportEvents()
      const sessionId = ProductConversionAnalytics.getSessionId()
      const sessionEvents = events.filter(e => e.sessionId === sessionId)
      
      setSessionMetrics({
        productsViewed: sessionEvents.filter(e => e.eventType === 'product_view').length,
        alternativesExplored: sessionEvents.filter(e => e.eventType === 'alternative_opened').length,
        replacementsMade: sessionEvents.filter(e => e.eventType === 'product_replaced').length,
        affiliateClicks: sessionEvents.filter(e => e.eventType === 'affiliate_click').length
      })
    }
    
    // Mise à jour initiale
    updateMetrics()
    
    // Mise à jour périodique
    const interval = setInterval(updateMetrics, 5000) // Toutes les 5 secondes
    
    return () => clearInterval(interval)
  }, [realTimeMetrics])
  
  // Mise à jour du funnel de conversion
  const updateConversionFunnel = useCallback(async () => {
    setIsLoadingAnalytics(true)
    
    try {
      const funnel = ProductConversionAnalytics.getConversionFunnel()
      setConversionFunnel(funnel)
    } catch (error) {
      console.error('❌ Erreur mise à jour funnel:', error)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }, [])
  
  // Batch des événements si configuré
  const processBatchedEvents = useCallback(() => {
    if (eventBatchRef.current.length === 0) return
    
    console.log(`📊 Traitement batch de ${eventBatchRef.current.length} événements`)
    
    // Traiter tous les événements en batch
    eventBatchRef.current.forEach(({ fn, args }) => {
      fn(...args)
    })
    
    // Vider le batch
    eventBatchRef.current = []
    
    // Mettre à jour le funnel
    updateConversionFunnel()
  }, [updateConversionFunnel])
  
  // Planifier le traitement en batch
  const scheduleBatchProcessing = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }
    
    batchTimeoutRef.current = setTimeout(processBatchedEvents, 2000) // 2 secondes
  }, [processBatchedEvents])
  
  // Wrapper pour les événements batchés
  const trackEvent = useCallback((fn: Function, ...args: any[]) => {
    if (batchEvents) {
      eventBatchRef.current.push({ fn, args })
      scheduleBatchProcessing()
    } else {
      fn(...args)
      updateConversionFunnel()
    }
  }, [batchEvents, scheduleBatchProcessing, updateConversionFunnel])
  
  /**
   * 👁️ TRACKING VUE PRODUIT
   */
  const trackProductView = useCallback((
    product: EnrichedProduct, 
    position: number, 
    totalProducts: number
  ) => {
    console.log('📊 Tracking vue produit:', product.name)
    
    // Démarrer le timer de vue si activé
    if (trackViewTime) {
      viewTimersRef.current.set(product.id, Date.now())
    }
    
    trackEvent(
      ProductConversionAnalytics.trackProductView.bind(ProductConversionAnalytics),
      product,
      position,
      totalProducts,
      userContext
    )
  }, [trackEvent, trackViewTime, userContext])
  
  /**
   * 🔍 TRACKING OUVERTURE ALTERNATIVES
   */
  const trackAlternativeOpened = useCallback((product: EnrichedProduct) => {
    console.log('📊 Tracking ouverture alternatives:', product.name)
    
    trackEvent(
      ProductConversionAnalytics.trackAlternativeOpened.bind(ProductConversionAnalytics),
      product,
      userContext
    )
  }, [trackEvent, userContext])
  
  /**
   * ✅ TRACKING SÉLECTION ALTERNATIVE
   */
  const trackAlternativeSelected = useCallback((
    original: EnrichedProduct, 
    alternative: AlternativeProduct
  ) => {
    console.log('📊 Tracking sélection alternative:', {
      original: original.name,
      alternative: alternative.name
    })
    
    trackEvent(
      ProductConversionAnalytics.trackAlternativeSelected.bind(ProductConversionAnalytics),
      original,
      alternative,
      userContext
    )
  }, [trackEvent, userContext])
  
  /**
   * 🔄 TRACKING REMPLACEMENT PRODUIT
   */
  const trackProductReplacement = useCallback((
    oldProduct: EnrichedProduct, 
    newProduct: AlternativeProduct
  ) => {
    console.log('📊 Tracking remplacement produit:', {
      ancien: oldProduct.name,
      nouveau: newProduct.name
    })
    
    trackEvent(
      ProductConversionAnalytics.trackProductReplacement.bind(ProductConversionAnalytics),
      oldProduct,
      newProduct,
      userContext
    )
  }, [trackEvent, userContext])
  
  /**
   * 🔗 TRACKING CLIC AFFILIATION
   */
  const trackAffiliateClick = useCallback((product: EnrichedProduct | AlternativeProduct) => {
    console.log('📊 Tracking clic affiliation:', product.name)
    
    // Calculer le temps de vue si disponible
    const viewTime = viewTimersRef.current.get(product.id)
    const contextWithViewTime = viewTime ? {
      ...userContext,
      viewTimeMs: Date.now() - viewTime
    } : userContext
    
    trackEvent(
      ProductConversionAnalytics.trackAffiliateClick.bind(ProductConversionAnalytics),
      product,
      contextWithViewTime
    )
  }, [trackEvent, userContext])
  
  /**
   * 💰 TRACKING INTENTION D'ACHAT
   */
  const trackPurchaseIntent = useCallback((
    product: EnrichedProduct | AlternativeProduct, 
    intent: 'high' | 'medium' | 'low'
  ) => {
    console.log('📊 Tracking intention d\'achat:', {
      produit: product.name,
      intention: intent
    })
    
    trackEvent(
      ProductConversionAnalytics.trackPurchaseIntent.bind(ProductConversionAnalytics),
      product,
      intent,
      userContext
    )
  }, [trackEvent, userContext])
  
  /**
   * 📊 RÉCUPÉRATION MÉTRIQUES PRODUIT
   */
  const getProductPerformance = useCallback((productId: string): ProductPerformanceMetrics | null => {
    return ProductConversionAnalytics.getProductPerformance(productId)
  }, [])
  
  /**
   * 👤 MISE À JOUR CONTEXTE UTILISATEUR
   */
  const setUserContext = useCallback((context: Record<string, any>) => {
    console.log('📊 Mise à jour contexte utilisateur:', context)
    setUserContextState(prev => ({ ...prev, ...context }))
  }, [])
  
  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
        // Traiter les événements restants
        processBatchedEvents()
      }
    }
  }, [processBatchedEvents])
  
  return {
    // Tracking functions
    trackProductView,
    trackAlternativeOpened,
    trackAlternativeSelected,
    trackProductReplacement,
    trackAffiliateClick,
    trackPurchaseIntent,
    
    // Analytics data
    conversionFunnel,
    isLoadingAnalytics,
    
    // Performance metrics
    getProductPerformance,
    
    // User context
    setUserContext,
    
    // Real-time metrics
    sessionMetrics
  }
}

/**
 * 🎯 HOOK SPÉCIALISÉ POUR SECTION PRODUITS
 */
export const useProductSectionAnalytics = (
  products: EnrichedProduct[],
  options: UseProductAnalyticsOptions = {}
) => {
  const analytics = useProductAnalytics(options)
  
  // Auto-tracking des vues produits
  useEffect(() => {
    if (options.autoTrackViews && products.length > 0) {
      products.forEach((product, index) => {
        analytics.trackProductView(product, index, products.length)
      })
    }
  }, [products, analytics, options.autoTrackViews])
  
  return analytics
}

/**
 * 🔍 HOOK SPÉCIALISÉ POUR ALTERNATIVES
 */
export const useAlternativeAnalytics = (
  currentProduct: EnrichedProduct | null,
  options: UseProductAnalyticsOptions = {}
) => {
  const analytics = useProductAnalytics(options)
  
  // Tracking automatique de l'ouverture des alternatives
  const trackAlternativeOpened = useCallback(() => {
    if (currentProduct) {
      analytics.trackAlternativeOpened(currentProduct)
    }
  }, [analytics, currentProduct])
  
  return {
    ...analytics,
    trackAlternativeOpened
  }
}
