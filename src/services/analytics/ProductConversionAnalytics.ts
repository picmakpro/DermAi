/**
 * 📊 SERVICE D'ANALYTICS AVANCÉES - CONVERSIONS PRODUITS
 * 
 * Service pour le tracking et l'analyse des conversions produits
 * avec métriques business et optimisation des recommandations
 * 
 * Sprint 3 - Intégration, Tests & Optimisation
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { EnrichedProduct, AlternativeProduct } from '@/types/productSync'

export interface ConversionEvent {
  eventType: 'product_view' | 'alternative_opened' | 'alternative_selected' | 'product_replaced' | 'affiliate_click' | 'purchase_intent'
  timestamp: Date
  sessionId: string
  userId?: string
  productId: string
  productDetails: {
    name: string
    brand: string
    category: string
    price: number
    isAlternative: boolean
    originalProductId?: string
  }
  context: {
    routinePhase?: string
    skinConcerns?: string[]
    userAge?: string
    skinType?: string
    position?: number // Position dans la liste
    totalProducts?: number
  }
  metadata?: Record<string, any>
}

export interface ConversionFunnel {
  step: 'view' | 'alternative_interest' | 'alternative_selection' | 'replacement' | 'click' | 'conversion'
  count: number
  conversionRate: number
  averageTimeSpent: number
  dropoffReasons?: string[]
}

export interface ProductPerformanceMetrics {
  productId: string
  productName: string
  brand: string
  category: string
  
  // Métriques de visibilité
  totalViews: number
  uniqueViews: number
  averageViewTime: number
  
  // Métriques d'engagement
  alternativeRequests: number
  alternativeRequestRate: number
  replacementRate: number
  
  // Métriques de conversion
  affiliateClicks: number
  clickThroughRate: number
  estimatedConversions: number
  conversionRate: number
  
  // Métriques business
  totalRevenue: number
  averageOrderValue: number
  revenuePerView: number
  
  // Comparaison avec alternatives
  alternativePerformance?: {
    betterAlternatives: number
    worseAlternatives: number
    averageAlternativePerformance: number
  }
}

export interface UserSegmentAnalytics {
  segment: string
  criteria: Record<string, any>
  
  // Comportement du segment
  averageProductsViewed: number
  alternativeUsageRate: number
  conversionRate: number
  averageOrderValue: number
  
  // Préférences produits
  topCategories: Array<{ category: string; preference: number }>
  topBrands: Array<{ brand: string; preference: number }>
  pricePreferences: {
    averagePrice: number
    priceRange: { min: number; max: number }
    priceSegment: 'budget' | 'mid-range' | 'premium'
  }
  
  // Insights
  insights: string[]
  recommendations: string[]
}

export class ProductConversionAnalytics {
  
  private static events: ConversionEvent[] = []
  private static sessionId: string = this.generateSessionId()
  private static userId?: string
  
  /**
   * 📊 TRACKING DES ÉVÉNEMENTS
   */
  static trackEvent(
    eventType: ConversionEvent['eventType'],
    product: EnrichedProduct | AlternativeProduct,
    context: ConversionEvent['context'] = {},
    metadata: Record<string, any> = {}
  ): void {
    
    const event: ConversionEvent = {
      eventType,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.userId,
      productId: product.id,
      productDetails: {
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        isAlternative: 'isAlternative' in product ? product.isAlternative || false : false,
        originalProductId: 'originalProductId' in product ? product.originalProductId : undefined
      },
      context,
      metadata
    }
    
    this.events.push(event)
    
    // Envoyer à Google Analytics 4
    this.sendToGA4(event)
    
    // Envoyer à un service d'analytics personnalisé
    this.sendToCustomAnalytics(event)
    
    console.log('📊 Analytics: Event tracked', {
      type: eventType,
      product: product.name,
      context
    })
  }
  
  /**
   * 👁️ TRACKING VUE PRODUIT
   */
  static trackProductView(
    product: EnrichedProduct,
    position: number,
    totalProducts: number,
    context: Partial<ConversionEvent['context']> = {}
  ): void {
    this.trackEvent('product_view', product, {
      ...context,
      position,
      totalProducts
    }, {
      viewStartTime: Date.now()
    })
  }
  
  /**
   * 🔍 TRACKING OUVERTURE ALTERNATIVES
   */
  static trackAlternativeOpened(
    product: EnrichedProduct,
    context: Partial<ConversionEvent['context']> = {}
  ): void {
    this.trackEvent('alternative_opened', product, context, {
      alternativeRequestTime: Date.now()
    })
  }
  
  /**
   * ✅ TRACKING SÉLECTION ALTERNATIVE
   */
  static trackAlternativeSelected(
    originalProduct: EnrichedProduct,
    selectedAlternative: AlternativeProduct,
    context: Partial<ConversionEvent['context']> = {}
  ): void {
    // Tracker la sélection de l'alternative
    this.trackEvent('alternative_selected', selectedAlternative, context, {
      originalProductId: originalProduct.id,
      selectionReason: selectedAlternative.comparisonTags?.join(', '),
      priceDifference: selectedAlternative.price - originalProduct.price
    })
  }
  
  /**
   * 🔄 TRACKING REMPLACEMENT PRODUIT
   */
  static trackProductReplacement(
    oldProduct: EnrichedProduct,
    newProduct: AlternativeProduct,
    context: Partial<ConversionEvent['context']> = {}
  ): void {
    this.trackEvent('product_replaced', newProduct, context, {
      replacedProductId: oldProduct.id,
      replacementReason: newProduct.comparisonTags?.join(', '),
      priceImpact: newProduct.price - oldProduct.price,
      replacementTime: Date.now()
    })
  }
  
  /**
   * 🔗 TRACKING CLIC AFFILIATION
   */
  static trackAffiliateClick(
    product: EnrichedProduct | AlternativeProduct,
    context: Partial<ConversionEvent['context']> = {}
  ): void {
    this.trackEvent('affiliate_click', product, context, {
      affiliateLink: product.affiliateLink,
      clickTime: Date.now(),
      expectedRevenue: this.estimateRevenue(product.price)
    })
  }
  
  /**
   * 💰 TRACKING INTENTION D'ACHAT
   */
  static trackPurchaseIntent(
    product: EnrichedProduct | AlternativeProduct,
    intent: 'high' | 'medium' | 'low',
    context: Partial<ConversionEvent['context']> = {}
  ): void {
    this.trackEvent('purchase_intent', product, context, {
      intentLevel: intent,
      estimatedConversionProbability: this.getConversionProbability(intent),
      timeToIntent: Date.now()
    })
  }
  
  /**
   * 📈 ANALYSE DU FUNNEL DE CONVERSION
   */
  static getConversionFunnel(
    timeRange: { start: Date; end: Date } = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h
      end: new Date()
    }
  ): ConversionFunnel[] {
    
    const filteredEvents = this.events.filter(event => 
      event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
    )
    
    // Compter les événements par étape
    const stepCounts = {
      view: filteredEvents.filter(e => e.eventType === 'product_view').length,
      alternative_interest: filteredEvents.filter(e => e.eventType === 'alternative_opened').length,
      alternative_selection: filteredEvents.filter(e => e.eventType === 'alternative_selected').length,
      replacement: filteredEvents.filter(e => e.eventType === 'product_replaced').length,
      click: filteredEvents.filter(e => e.eventType === 'affiliate_click').length,
      conversion: filteredEvents.filter(e => e.eventType === 'purchase_intent').length
    }
    
    // Calculer les taux de conversion
    const funnel: ConversionFunnel[] = [
      {
        step: 'view',
        count: stepCounts.view,
        conversionRate: 100,
        averageTimeSpent: this.calculateAverageTimeSpent('product_view', filteredEvents)
      },
      {
        step: 'alternative_interest',
        count: stepCounts.alternative_interest,
        conversionRate: stepCounts.view > 0 ? (stepCounts.alternative_interest / stepCounts.view) * 100 : 0,
        averageTimeSpent: this.calculateAverageTimeSpent('alternative_opened', filteredEvents)
      },
      {
        step: 'alternative_selection',
        count: stepCounts.alternative_selection,
        conversionRate: stepCounts.alternative_interest > 0 ? (stepCounts.alternative_selection / stepCounts.alternative_interest) * 100 : 0,
        averageTimeSpent: this.calculateAverageTimeSpent('alternative_selected', filteredEvents)
      },
      {
        step: 'replacement',
        count: stepCounts.replacement,
        conversionRate: stepCounts.alternative_selection > 0 ? (stepCounts.replacement / stepCounts.alternative_selection) * 100 : 0,
        averageTimeSpent: this.calculateAverageTimeSpent('product_replaced', filteredEvents)
      },
      {
        step: 'click',
        count: stepCounts.click,
        conversionRate: stepCounts.view > 0 ? (stepCounts.click / stepCounts.view) * 100 : 0,
        averageTimeSpent: this.calculateAverageTimeSpent('affiliate_click', filteredEvents)
      },
      {
        step: 'conversion',
        count: stepCounts.conversion,
        conversionRate: stepCounts.click > 0 ? (stepCounts.conversion / stepCounts.click) * 100 : 0,
        averageTimeSpent: this.calculateAverageTimeSpent('purchase_intent', filteredEvents)
      }
    ]
    
    return funnel
  }
  
  /**
   * 📊 MÉTRIQUES DE PERFORMANCE PRODUIT
   */
  static getProductPerformance(productId: string): ProductPerformanceMetrics | null {
    const productEvents = this.events.filter(event => 
      event.productId === productId || event.metadata?.originalProductId === productId
    )
    
    if (productEvents.length === 0) return null
    
    const firstEvent = productEvents[0]
    const views = productEvents.filter(e => e.eventType === 'product_view')
    const alternativeRequests = productEvents.filter(e => e.eventType === 'alternative_opened')
    const replacements = productEvents.filter(e => e.eventType === 'product_replaced')
    const clicks = productEvents.filter(e => e.eventType === 'affiliate_click')
    const conversions = productEvents.filter(e => e.eventType === 'purchase_intent')
    
    const uniqueViews = new Set(views.map(e => e.sessionId)).size
    const totalViews = views.length
    const affiliateClicks = clicks.length
    const estimatedConversions = conversions.length
    
    return {
      productId,
      productName: firstEvent.productDetails.name,
      brand: firstEvent.productDetails.brand,
      category: firstEvent.productDetails.category,
      
      // Métriques de visibilité
      totalViews,
      uniqueViews,
      averageViewTime: this.calculateAverageTimeSpent('product_view', productEvents),
      
      // Métriques d'engagement
      alternativeRequests: alternativeRequests.length,
      alternativeRequestRate: totalViews > 0 ? (alternativeRequests.length / totalViews) * 100 : 0,
      replacementRate: alternativeRequests.length > 0 ? (replacements.length / alternativeRequests.length) * 100 : 0,
      
      // Métriques de conversion
      affiliateClicks,
      clickThroughRate: totalViews > 0 ? (affiliateClicks / totalViews) * 100 : 0,
      estimatedConversions,
      conversionRate: affiliateClicks > 0 ? (estimatedConversions / affiliateClicks) * 100 : 0,
      
      // Métriques business
      totalRevenue: this.calculateRevenue(productEvents),
      averageOrderValue: firstEvent.productDetails.price,
      revenuePerView: totalViews > 0 ? this.calculateRevenue(productEvents) / totalViews : 0
    }
  }
  
  /**
   * 👥 ANALYSE PAR SEGMENT UTILISATEUR
   */
  static getUserSegmentAnalytics(
    segmentCriteria: Record<string, any>
  ): UserSegmentAnalytics {
    
    // Filtrer les événements selon les critères du segment
    const segmentEvents = this.events.filter(event => {
      return Object.entries(segmentCriteria).every(([key, value]) => {
        return event.context[key as keyof typeof event.context] === value
      })
    })
    
    if (segmentEvents.length === 0) {
      return this.getEmptySegmentAnalytics(segmentCriteria)
    }
    
    // Calculer les métriques du segment
    const uniqueSessions = new Set(segmentEvents.map(e => e.sessionId)).size
    const views = segmentEvents.filter(e => e.eventType === 'product_view')
    const alternativeOpens = segmentEvents.filter(e => e.eventType === 'alternative_opened')
    const clicks = segmentEvents.filter(e => e.eventType === 'affiliate_click')
    const conversions = segmentEvents.filter(e => e.eventType === 'purchase_intent')
    
    // Analyser les préférences
    const categoryPreferences = this.analyzeCategoryPreferences(segmentEvents)
    const brandPreferences = this.analyzeBrandPreferences(segmentEvents)
    const pricePreferences = this.analyzePricePreferences(segmentEvents)
    
    return {
      segment: Object.entries(segmentCriteria).map(([k, v]) => `${k}:${v}`).join(','),
      criteria: segmentCriteria,
      
      // Comportement du segment
      averageProductsViewed: uniqueSessions > 0 ? views.length / uniqueSessions : 0,
      alternativeUsageRate: views.length > 0 ? (alternativeOpens.length / views.length) * 100 : 0,
      conversionRate: clicks.length > 0 ? (conversions.length / clicks.length) * 100 : 0,
      averageOrderValue: this.calculateAverageOrderValue(segmentEvents),
      
      // Préférences produits
      topCategories: categoryPreferences,
      topBrands: brandPreferences,
      pricePreferences,
      
      // Insights
      insights: this.generateSegmentInsights(segmentEvents, segmentCriteria),
      recommendations: this.generateSegmentRecommendations(segmentEvents, segmentCriteria)
    }
  }
  
  /**
   * 🎯 RECOMMANDATIONS D'OPTIMISATION
   */
  static getOptimizationRecommendations(): Array<{
    type: 'product' | 'alternative' | 'pricing' | 'positioning'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    expectedImpact: string
    actionItems: string[]
  }> {
    
    const recommendations = []
    const funnel = this.getConversionFunnel()
    
    // Analyser les points de friction dans le funnel
    const viewToAlternativeRate = funnel.find(f => f.step === 'alternative_interest')?.conversionRate || 0
    const alternativeToClickRate = funnel.find(f => f.step === 'click')?.conversionRate || 0
    const clickToConversionRate = funnel.find(f => f.step === 'conversion')?.conversionRate || 0
    
    // Recommandation: Améliorer l'engagement alternatives
    if (viewToAlternativeRate < 15) {
      recommendations.push({
        type: 'alternative',
        priority: 'high',
        title: 'Améliorer la visibilité des alternatives',
        description: `Seulement ${viewToAlternativeRate.toFixed(1)}% des utilisateurs explorent les alternatives`,
        expectedImpact: '+25% d\'engagement alternatives',
        actionItems: [
          'Rendre le bouton "Voir alternatives" plus visible',
          'Ajouter des badges "Économie possible" ou "Option premium"',
          'Proposer des alternatives automatiquement selon le profil'
        ]
      })
    }
    
    // Recommandation: Optimiser les conversions
    if (clickToConversionRate < 20) {
      recommendations.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Optimiser la conversion après clic',
        description: `Taux de conversion de ${clickToConversionRate.toFixed(1)}% après clic d'affiliation`,
        expectedImpact: '+15% de conversions',
        actionItems: [
          'Améliorer la page de destination partenaire',
          'Ajouter des codes promo exclusifs',
          'Optimiser le timing des recommandations'
        ]
      })
    }
    
    return recommendations
  }
  
  /**
   * 🔧 MÉTHODES UTILITAIRES PRIVÉES
   */
  
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private static estimateRevenue(price: number): number {
    // Estimation basée sur un taux de commission moyen de 5%
    return price * 0.05
  }
  
  private static getConversionProbability(intent: 'high' | 'medium' | 'low'): number {
    const probabilities = { high: 0.8, medium: 0.5, low: 0.2 }
    return probabilities[intent]
  }
  
  private static calculateAverageTimeSpent(
    eventType: ConversionEvent['eventType'],
    events: ConversionEvent[]
  ): number {
    const relevantEvents = events.filter(e => e.eventType === eventType)
    if (relevantEvents.length === 0) return 0
    
    // Simulation du temps passé (en production, utiliser des vraies métriques)
    return relevantEvents.reduce((sum, event) => {
      const baseTime = { 
        product_view: 15000, 
        alternative_opened: 30000, 
        alternative_selected: 10000,
        product_replaced: 5000,
        affiliate_click: 2000,
        purchase_intent: 60000
      }[eventType] || 10000
      
      return sum + baseTime + (Math.random() * 10000)
    }, 0) / relevantEvents.length
  }
  
  private static calculateRevenue(events: ConversionEvent[]): number {
    return events
      .filter(e => e.eventType === 'affiliate_click')
      .reduce((sum, event) => sum + this.estimateRevenue(event.productDetails.price), 0)
  }
  
  private static analyzeCategoryPreferences(events: ConversionEvent[]) {
    const categoryCount = new Map<string, number>()
    
    events.forEach(event => {
      const category = event.productDetails.category
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1)
    })
    
    const total = events.length
    return Array.from(categoryCount.entries())
      .map(([category, count]) => ({
        category,
        preference: (count / total) * 100
      }))
      .sort((a, b) => b.preference - a.preference)
      .slice(0, 5)
  }
  
  private static analyzeBrandPreferences(events: ConversionEvent[]) {
    const brandCount = new Map<string, number>()
    
    events.forEach(event => {
      const brand = event.productDetails.brand
      brandCount.set(brand, (brandCount.get(brand) || 0) + 1)
    })
    
    const total = events.length
    return Array.from(brandCount.entries())
      .map(([brand, count]) => ({
        brand,
        preference: (count / total) * 100
      }))
      .sort((a, b) => b.preference - a.preference)
      .slice(0, 5)
  }
  
  private static analyzePricePreferences(events: ConversionEvent[]) {
    const prices = events.map(e => e.productDetails.price).filter(p => p > 0)
    
    if (prices.length === 0) {
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        priceSegment: 'budget' as const
      }
    }
    
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    let priceSegment: 'budget' | 'mid-range' | 'premium'
    if (averagePrice < 20) priceSegment = 'budget'
    else if (averagePrice < 50) priceSegment = 'mid-range'
    else priceSegment = 'premium'
    
    return {
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      priceSegment
    }
  }
  
  private static calculateAverageOrderValue(events: ConversionEvent[]): number {
    const purchases = events.filter(e => e.eventType === 'purchase_intent')
    if (purchases.length === 0) return 0
    
    return purchases.reduce((sum, event) => sum + event.productDetails.price, 0) / purchases.length
  }
  
  private static generateSegmentInsights(
    events: ConversionEvent[], 
    criteria: Record<string, any>
  ): string[] {
    const insights = []
    
    // Insight sur l'engagement alternatives
    const views = events.filter(e => e.eventType === 'product_view').length
    const alternativeOpens = events.filter(e => e.eventType === 'alternative_opened').length
    const alternativeRate = views > 0 ? (alternativeOpens / views) * 100 : 0
    
    if (alternativeRate > 30) {
      insights.push('Ce segment montre un fort intérêt pour les alternatives produits')
    } else if (alternativeRate < 10) {
      insights.push('Ce segment utilise peu les alternatives - opportunité d\'amélioration')
    }
    
    // Insight sur les préférences prix
    const avgPrice = this.analyzePricePreferences(events).averagePrice
    if (avgPrice > 40) {
      insights.push('Segment premium - privilégie la qualité au prix')
    } else if (avgPrice < 15) {
      insights.push('Segment budget-conscious - sensible au prix')
    }
    
    return insights
  }
  
  private static generateSegmentRecommendations(
    events: ConversionEvent[], 
    criteria: Record<string, any>
  ): string[] {
    const recommendations = []
    
    // Recommandations basées sur le comportement
    const alternativeRate = events.filter(e => e.eventType === 'alternative_opened').length / 
                           Math.max(1, events.filter(e => e.eventType === 'product_view').length) * 100
    
    if (alternativeRate < 15) {
      recommendations.push('Mettre en avant les bénéfices des alternatives pour ce segment')
      recommendations.push('Proposer des alternatives automatiquement selon le profil')
    }
    
    if (alternativeRate > 40) {
      recommendations.push('Optimiser la sélection d\'alternatives pour ce segment engagé')
      recommendations.push('Proposer plus d\'options de comparaison avancées')
    }
    
    return recommendations
  }
  
  private static getEmptySegmentAnalytics(criteria: Record<string, any>): UserSegmentAnalytics {
    return {
      segment: Object.entries(criteria).map(([k, v]) => `${k}:${v}`).join(','),
      criteria,
      averageProductsViewed: 0,
      alternativeUsageRate: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      topCategories: [],
      topBrands: [],
      pricePreferences: {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        priceSegment: 'budget'
      },
      insights: ['Segment sans données - nécessite plus d\'interactions'],
      recommendations: ['Collecter plus de données pour ce segment']
    }
  }
  
  /**
   * 📡 INTÉGRATIONS EXTERNES
   */
  
  private static sendToGA4(event: ConversionEvent): void {
    if (typeof window !== 'undefined' && window.gtag) {
      const eventName = `dermai_${event.eventType}`
      
      window.gtag('event', eventName, {
        event_category: 'product_interaction',
        event_label: event.productDetails.name,
        value: event.productDetails.price,
        custom_parameters: {
          product_id: event.productId,
          brand: event.productDetails.brand,
          category: event.productDetails.category,
          is_alternative: event.productDetails.isAlternative,
          session_id: event.sessionId,
          user_id: event.userId,
          ...event.context
        }
      })
    }
  }
  
  private static async sendToCustomAnalytics(event: ConversionEvent): Promise<void> {
    try {
      await fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.warn('⚠️ Impossible d\'envoyer l\'événement aux analytics:', error)
    }
  }
  
  /**
   * 🔧 CONFIGURATION ET GESTION
   */
  
  static setUserId(userId: string): void {
    this.userId = userId
  }
  
  static getSessionId(): string {
    return this.sessionId
  }
  
  static clearEvents(): void {
    this.events = []
  }
  
  static getEventCount(): number {
    return this.events.length
  }
  
  static exportEvents(): ConversionEvent[] {
    return [...this.events]
  }
}
