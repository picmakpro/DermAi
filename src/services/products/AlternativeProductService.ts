/**
 * 🔍 SERVICE D'ALTERNATIVES INTELLIGENTES
 * 
 * Service responsable de la recherche et génération d'alternatives
 * de produits basées sur des critères de comparaison intelligents
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { CatalogProduct } from '@/types'
import { 
  EnrichedProduct, 
  AlternativeProduct, 
  AlternativeCriteria,
  AlternativeSearchResult,
  AlternativeScoring
} from '@/types/alternatives'
import { loadCatalog } from '@/services/catalog/catalogService'
import { ProductEnrichmentService } from './ProductEnrichmentService'

export class AlternativeProductService {
  
  // Configuration par défaut
  private static readonly DEFAULT_CONFIG = {
    maxAlternatives: 3,
    minRelevanceScore: 60,
    maxPriceDifference: 0.5, // 50% de différence max
    enableSmartFiltering: true
  }
  
  /**
   * 🎯 FONCTION PRINCIPALE : Rechercher alternatives intelligentes
   */
  static async findAlternatives(
    currentProduct: EnrichedProduct,
    criteria: AlternativeCriteria = {}
  ): Promise<AlternativeSearchResult> {
    console.log(`🔍 Recherche alternatives pour: ${currentProduct.name}`)
    
    const startTime = Date.now()
    
    try {
      // 1. Charger le catalogue JSON
      const catalog = await loadCatalog()
      
      if (!catalog?.products) {
        throw new Error('Catalogue non disponible')
      }
      
      // 2. Filtrer par catégorie identique
      const sameCategoryProducts = this.findSameCategoryProducts(catalog, currentProduct)
      
      if (sameCategoryProducts.length === 0) {
        console.warn(`⚠️ Aucun produit de même catégorie trouvé pour: ${currentProduct.category}`)
        return this.createEmptyResult(criteria, Date.now() - startTime)
      }
      
      // 3. Appliquer les critères de comparaison
      const filteredAlternatives = this.applyComparisonCriteria(
        sameCategoryProducts, 
        currentProduct, 
        criteria
      )
      
      // 4. Scorer et trier les alternatives
      const scoredAlternatives = this.scoreAlternatives(filteredAlternatives, currentProduct, criteria)
      
      // 5. Enrichir avec données de comparaison
      const enrichedAlternatives = await this.enrichWithComparisonData(
        scoredAlternatives,
        currentProduct
      )
      
      // 6. Limiter aux meilleures alternatives
      const topAlternatives = enrichedAlternatives
        .filter(alt => alt.relevanceScore >= this.DEFAULT_CONFIG.minRelevanceScore)
        .slice(0, this.DEFAULT_CONFIG.maxAlternatives)
      
      const processingTime = Date.now() - startTime
      console.log(`✅ ${topAlternatives.length} alternatives trouvées en ${processingTime}ms`)
      
      return {
        success: true,
        alternatives: topAlternatives,
        totalFound: enrichedAlternatives.length,
        searchCriteria: criteria,
        processingTime
      }
      
    } catch (error) {
      console.error('❌ Erreur recherche alternatives:', error)
      return {
        success: false,
        alternatives: [],
        totalFound: 0,
        searchCriteria: criteria,
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }
  
  /**
   * 🔍 FILTRAGE PAR CATÉGORIE IDENTIQUE
   */
  private static findSameCategoryProducts(catalog: any, currentProduct: EnrichedProduct): CatalogProduct[] {
    return catalog.products.filter((p: CatalogProduct) => 
      // Même catégorie
      p.category.toLowerCase() === currentProduct.category.toLowerCase() && 
      // Pas le même produit
      p.id !== currentProduct.id &&
      // Produit valide
      p.price > 0 && 
      p.name && 
      p.brand &&
      // Lien d'affiliation disponible
      p.affiliateLink &&
      // Disponible
      (!p.availability || p.availability !== 'out-of-stock')
    )
  }
  
  /**
   * 🎛️ APPLICATION DES CRITÈRES DE COMPARAISON
   */
  private static applyComparisonCriteria(
    candidates: CatalogProduct[],
    currentProduct: EnrichedProduct,
    criteria: AlternativeCriteria
  ): CatalogProduct[] {
    let filtered = [...candidates]
    
    // Critère PRIX
    if (criteria.priceRange && currentProduct.price) {
      filtered = this.filterByPrice(filtered, currentProduct.price, criteria.priceRange)
    }
    
    // Critère NATURALITÉ
    if (criteria.naturalness) {
      filtered = this.filterByNaturalness(filtered, criteria.naturalness)
    }
    
    // Critère PUISSANCE
    if (criteria.potency) {
      filtered = this.filterByPotency(filtered, currentProduct, criteria.potency)
    }
    
    // Critère TYPE DE PEAU
    if (criteria.skinType && criteria.skinType.length > 0) {
      filtered = this.filterBySkinType(filtered, criteria.skinType)
    }
    
    // Critère INGRÉDIENTS
    if (criteria.ingredients) {
      filtered = this.filterByIngredients(filtered, criteria.ingredients)
    }
    
    // Critère BUDGET MAXIMUM
    if (criteria.budgetMax) {
      filtered = filtered.filter(p => p.price <= criteria.budgetMax!)
    }
    
    // Critère BIO UNIQUEMENT
    if (criteria.organicOnly) {
      filtered = this.filterByOrganic(filtered)
    }
    
    console.log(`🎛️ Filtrage: ${candidates.length} → ${filtered.length} produits`)
    return filtered
  }
  
  /**
   * 💰 FILTRAGE PAR PRIX
   */
  private static filterByPrice(products: CatalogProduct[], currentPrice: number, priceRange: string): CatalogProduct[] {
    switch (priceRange) {
      case 'cheaper':
        return products.filter(p => p.price < currentPrice * 0.8) // 20% moins cher minimum
      case 'similar':
        return products.filter(p => 
          p.price >= currentPrice * 0.8 && 
          p.price <= currentPrice * 1.2
        ) // ±20%
      case 'premium':
        return products.filter(p => p.price > currentPrice * 1.2) // 20% plus cher minimum
      default:
        return products
    }
  }
  
  /**
   * 🌿 FILTRAGE PAR NATURALITÉ
   */
  private static filterByNaturalness(products: CatalogProduct[], naturalness: string): CatalogProduct[] {
    const naturalKeywords = ['bio', 'organic', 'natural', 'naturel', 'végétal', 'plant-based', 'botanical']
    const conventionalKeywords = ['clinical', 'laboratory', 'scientifique', 'dermatologique', 'medical', 'pharmaceutical']
    
    switch (naturalness) {
      case 'more_natural':
        return products.filter(p => {
          const searchText = `${p.name} ${p.brand} ${p.benefits?.join(' ') || ''}`.toLowerCase()
          return naturalKeywords.some(keyword => searchText.includes(keyword))
        })
      case 'conventional':
        return products.filter(p => {
          const searchText = `${p.name} ${p.brand} ${p.benefits?.join(' ') || ''}`.toLowerCase()
          return conventionalKeywords.some(keyword => searchText.includes(keyword))
        })
      default:
        return products
    }
  }
  
  /**
   * 💪 FILTRAGE PAR PUISSANCE
   */
  private static filterByPotency(products: CatalogProduct[], currentProduct: EnrichedProduct, potency: string): CatalogProduct[] {
    const strongActives = ['retinol', 'tretinoin', 'aha', 'bha', 'glycolic', 'salicylic', 'lactic']
    const gentleActives = ['hyaluronic', 'niacinamide', 'ceramide', 'panthenol', 'allantoin']
    
    switch (potency) {
      case 'gentler':
        return products.filter(p => {
          const ingredients = p.activeIngredients?.join(' ').toLowerCase() || ''
          const hasGentle = gentleActives.some(active => ingredients.includes(active))
          const hasStrong = strongActives.some(active => ingredients.includes(active))
          return hasGentle || (!hasStrong && p.potency !== 'strong')
        })
      case 'stronger':
        return products.filter(p => {
          const ingredients = p.activeIngredients?.join(' ').toLowerCase() || ''
          const hasStrong = strongActives.some(active => ingredients.includes(active))
          return hasStrong || p.potency === 'strong'
        })
      default:
        return products
    }
  }
  
  /**
   * 🧴 FILTRAGE PAR TYPE DE PEAU
   */
  private static filterBySkinType(products: CatalogProduct[], skinTypes: string[]): CatalogProduct[] {
    return products.filter(p => {
      if (!p.skinTypes || p.skinTypes.length === 0) return true // Produit universel
      
      return skinTypes.some(userSkinType => 
        p.skinTypes!.some(productSkinType => 
          productSkinType.toLowerCase().includes(userSkinType.toLowerCase()) ||
          userSkinType.toLowerCase().includes(productSkinType.toLowerCase())
        )
      )
    })
  }
  
  /**
   * 🧪 FILTRAGE PAR INGRÉDIENTS
   */
  private static filterByIngredients(products: CatalogProduct[], ingredients: { include?: string[], exclude?: string[] }): CatalogProduct[] {
    return products.filter(p => {
      const productIngredients = p.activeIngredients?.join(' ').toLowerCase() || ''
      
      // Vérifier les ingrédients à inclure
      if (ingredients.include && ingredients.include.length > 0) {
        const hasRequired = ingredients.include.some(ingredient => 
          productIngredients.includes(ingredient.toLowerCase())
        )
        if (!hasRequired) return false
      }
      
      // Vérifier les ingrédients à exclure
      if (ingredients.exclude && ingredients.exclude.length > 0) {
        const hasExcluded = ingredients.exclude.some(ingredient => 
          productIngredients.includes(ingredient.toLowerCase())
        )
        if (hasExcluded) return false
      }
      
      return true
    })
  }
  
  /**
   * 🌱 FILTRAGE PRODUITS BIO
   */
  private static filterByOrganic(products: CatalogProduct[]): CatalogProduct[] {
    const organicKeywords = ['bio', 'organic', 'certifié bio', 'ecocert', 'cosmos']
    
    return products.filter(p => {
      const searchText = `${p.name} ${p.brand} ${p.benefits?.join(' ') || ''}`.toLowerCase()
      return organicKeywords.some(keyword => searchText.includes(keyword))
    })
  }
  
  /**
   * 📊 SCORING DES ALTERNATIVES
   */
  private static scoreAlternatives(
    alternatives: CatalogProduct[], 
    currentProduct: EnrichedProduct,
    criteria: AlternativeCriteria
  ): (CatalogProduct & { scoring: AlternativeScoring })[] {
    
    return alternatives.map(alt => {
      const scoring: AlternativeScoring = {
        relevance: this.calculateRelevanceScore(alt, currentProduct),
        compatibility: this.calculateCompatibilityScore(alt, currentProduct),
        price: this.calculatePriceScore(alt, currentProduct, criteria),
        availability: this.calculateAvailabilityScore(alt),
        userPreference: this.calculateUserPreferenceScore(alt, criteria),
        overall: 0
      }
      
      // Calcul du score global pondéré
      scoring.overall = (
        scoring.relevance * 0.3 +
        scoring.compatibility * 0.25 +
        scoring.price * 0.2 +
        scoring.availability * 0.15 +
        scoring.userPreference * 0.1
      )
      
      return { ...alt, scoring }
    }).sort((a, b) => b.scoring.overall - a.scoring.overall)
  }
  
  /**
   * 🎨 ENRICHISSEMENT AVEC DONNÉES DE COMPARAISON
   */
  private static async enrichWithComparisonData(
    scoredAlternatives: (CatalogProduct & { scoring: AlternativeScoring })[],
    currentProduct: EnrichedProduct
  ): Promise<AlternativeProduct[]> {
    
    return scoredAlternatives.map(alt => {
      // Créer un produit enrichi de base
      const baseEnriched = ProductEnrichmentService.enrichSingleProduct(
        {
          id: alt.id,
          name: alt.name,
          brand: alt.brand,
          category: alt.category,
          price: alt.price,
          affiliateLink: alt.affiliateLink
        },
        alt
      )
      
      // Ajouter les données spécifiques aux alternatives
      const alternative: AlternativeProduct = {
        ...baseEnriched,
        
        // Tags de comparaison
        comparisonTags: this.generateComparisonTags(alt, currentProduct),
        differenceHighlights: this.generateDifferenceHighlights(alt, currentProduct),
        
        // Comparaisons spécifiques
        priceComparison: this.generatePriceComparison(alt.price, currentProduct.price || 0),
        potencyComparison: this.generatePotencyComparison(alt, currentProduct),
        naturalnessComparison: this.generateNaturalnessComparison(alt, currentProduct),
        speedComparison: this.generateSpeedComparison(alt, currentProduct),
        
        // Impact du changement
        switchingImpact: {
          routineChanges: this.calculateRoutineChanges(alt, currentProduct),
          expectedResults: this.generateExpectedResults(alt, currentProduct),
          precautions: this.generatePrecautions(alt, currentProduct),
          compatibilityWarnings: this.checkCompatibilityWarnings(alt, currentProduct),
          transitionPeriod: this.calculateTransitionPeriod(alt, currentProduct)
        },
        
        // Métadonnées de scoring
        relevanceScore: alt.scoring.relevance,
        compatibilityScore: alt.scoring.compatibility,
        priceScore: alt.scoring.price,
        
        // Marquage alternatif
        isAlternative: true,
        originalProductId: currentProduct.id,
        alternativeReason: this.generateAlternativeReason(alt, currentProduct)
      }
      
      return alternative
    })
  }
  
  /**
   * 🏷️ GÉNÉRATION DES TAGS DE COMPARAISON
   */
  private static generateComparisonTags(alternative: CatalogProduct, current: EnrichedProduct): string[] {
    const tags: string[] = []
    
    // Tag prix
    if (current.price) {
      if (alternative.price < current.price * 0.8) {
        tags.push('Plus économique')
      } else if (alternative.price > current.price * 1.2) {
        tags.push('Premium')
      } else {
        tags.push('Prix similaire')
      }
    }
    
    // Tag naturalité
    const naturalKeywords = ['bio', 'organic', 'natural', 'naturel']
    const altText = `${alternative.name} ${alternative.brand}`.toLowerCase()
    if (naturalKeywords.some(k => altText.includes(k))) {
      tags.push('Plus naturel')
    }
    
    // Tag spécificité peau
    if (alternative.skinTypes?.includes('sensible') || alternative.skinTypes?.includes('sensitive')) {
      tags.push('Peau sensible')
    }
    
    // Tag efficacité
    if (alternative.clinicallyTested) {
      tags.push('Cliniquement prouvé')
    }
    
    if (alternative.dermatologistRecommended) {
      tags.push('Recommandé dermatologue')
    }
    
    // Tag puissance
    if (alternative.potency === 'gentle') {
      tags.push('Formule douce')
    } else if (alternative.potency === 'strong') {
      tags.push('Action intensive')
    }
    
    return tags.slice(0, 3) // Maximum 3 tags
  }
  
  /**
   * 🔍 GÉNÉRATION DIFFÉRENCES CLÉS
   */
  private static generateDifferenceHighlights(alternative: CatalogProduct, current: EnrichedProduct): string[] {
    const highlights: string[] = []
    
    // Différences d'ingrédients
    if (alternative.activeIngredients && alternative.activeIngredients.length > 0) {
      const keyIngredient = alternative.activeIngredients[0]
      highlights.push(`Enrichi en ${keyIngredient}`)
    }
    
    // Différences de texture
    if (alternative.texture) {
      highlights.push(`Texture ${alternative.texture}`)
    }
    
    // Différences de bénéfices
    if (alternative.benefits && alternative.benefits.length > 0) {
      const uniqueBenefit = alternative.benefits.find(benefit => 
        !current.keywordBenefits.includes(benefit)
      )
      if (uniqueBenefit) {
        highlights.push(uniqueBenefit)
      }
    }
    
    // Différences de certifications
    if (alternative.awards && alternative.awards.length > 0) {
      highlights.push(alternative.awards[0])
    }
    
    return highlights.slice(0, 3)
  }
  
  /**
   * 💰 GÉNÉRATION COMPARAISON PRIX
   */
  private static generatePriceComparison(altPrice: number, currentPrice: number): string {
    if (!currentPrice || currentPrice === 0) {
      return `${altPrice.toFixed(2)}€`
    }
    
    const difference = ((altPrice - currentPrice) / currentPrice) * 100
    
    if (Math.abs(difference) < 10) {
      return `Prix similaire (${altPrice.toFixed(2)}€)`
    } else if (difference < 0) {
      return `${Math.abs(difference).toFixed(0)}% moins cher (${altPrice.toFixed(2)}€)`
    } else {
      return `${difference.toFixed(0)}% plus cher (${altPrice.toFixed(2)}€)`
    }
  }
  
  /**
   * 💪 GÉNÉRATION COMPARAISON PUISSANCE
   */
  private static generatePotencyComparison(alternative: CatalogProduct, current: EnrichedProduct): string {
    const strongActives = ['retinol', 'tretinoin', 'aha', 'bha', 'glycolic']
    const gentleActives = ['hyaluronic', 'niacinamide', 'ceramide']
    
    const altIngredients = alternative.activeIngredients?.join(' ').toLowerCase() || ''
    const altHasStrong = strongActives.some(active => altIngredients.includes(active))
    const altHasGentle = gentleActives.some(active => altIngredients.includes(active))
    
    if (alternative.potency === 'strong' || altHasStrong) {
      return 'Action plus intensive'
    } else if (alternative.potency === 'gentle' || altHasGentle) {
      return 'Formule plus douce'
    } else {
      return 'Efficacité similaire'
    }
  }
  
  // Méthodes de scoring privées
  
  private static calculateRelevanceScore(alt: CatalogProduct, current: EnrichedProduct): number {
    let score = 70 // Score de base pour même catégorie
    
    // Bonus pour ingrédients similaires
    if (alt.activeIngredients && current.keywordBenefits) {
      const commonIngredients = alt.activeIngredients.filter(ingredient =>
        current.keywordBenefits.some(benefit => 
          benefit.toLowerCase().includes(ingredient.toLowerCase()) ||
          ingredient.toLowerCase().includes(benefit.toLowerCase())
        )
      )
      score += commonIngredients.length * 5
    }
    
    // Bonus pour bénéfices similaires
    if (alt.benefits && current.keywordBenefits) {
      const commonBenefits = alt.benefits.filter(benefit =>
        current.keywordBenefits.includes(benefit)
      )
      score += commonBenefits.length * 3
    }
    
    return Math.min(score, 100)
  }
  
  private static calculateCompatibilityScore(alt: CatalogProduct, current: EnrichedProduct): number {
    let score = 80 // Score de base
    
    // Vérifier les contre-indications
    if (alt.contraindications && alt.contraindications.length > 0) {
      score -= alt.contraindications.length * 5
    }
    
    // Bonus pour compatibilité testée
    if (alt.clinicallyTested) {
      score += 10
    }
    
    if (alt.dermatologistRecommended) {
      score += 10
    }
    
    return Math.max(Math.min(score, 100), 0)
  }
  
  private static calculatePriceScore(alt: CatalogProduct, current: EnrichedProduct, criteria: AlternativeCriteria): number {
    if (!current.price) return 80
    
    const priceDiff = Math.abs(alt.price - current.price) / current.price
    
    // Score inversement proportionnel à la différence de prix
    let score = Math.max(100 - (priceDiff * 100), 20)
    
    // Ajustement selon les préférences utilisateur
    if (criteria.priceRange === 'cheaper' && alt.price < current.price) {
      score += 20
    } else if (criteria.priceRange === 'premium' && alt.price > current.price) {
      score += 10
    }
    
    return Math.min(score, 100)
  }
  
  private static calculateAvailabilityScore(alt: CatalogProduct): number {
    if (!alt.availability || alt.availability === 'in-stock') return 100
    if (alt.availability === 'limited') return 70
    if (alt.availability === 'out-of-stock') return 0
    return 80
  }
  
  private static calculateUserPreferenceScore(alt: CatalogProduct, criteria: AlternativeCriteria): number {
    let score = 50
    
    // Préférences de marque
    if (criteria.brandPreferences && criteria.brandPreferences.includes(alt.brand)) {
      score += 30
    }
    
    // Ingrédients à éviter
    if (criteria.ingredients?.exclude) {
      const hasExcluded = criteria.ingredients.exclude.some(ingredient =>
        alt.activeIngredients?.some(altIngredient => 
          altIngredient.toLowerCase().includes(ingredient.toLowerCase())
        )
      )
      if (hasExcluded) score -= 40
    }
    
    // Préférence bio
    if (criteria.organicOnly) {
      const isOrganic = ['bio', 'organic'].some(keyword =>
        `${alt.name} ${alt.brand}`.toLowerCase().includes(keyword)
      )
      if (isOrganic) score += 20
      else score -= 20
    }
    
    return Math.max(Math.min(score, 100), 0)
  }
  
  // Méthodes utilitaires pour génération de contenu
  
  private static generateNaturalnessComparison(alt: CatalogProduct, current: EnrichedProduct): string {
    const naturalKeywords = ['bio', 'organic', 'natural', 'naturel']
    const altText = `${alt.name} ${alt.brand}`.toLowerCase()
    const isNatural = naturalKeywords.some(k => altText.includes(k))
    
    return isNatural ? 'Plus naturel' : 'Formule conventionnelle'
  }
  
  private static generateSpeedComparison(alt: CatalogProduct, current: EnrichedProduct): string {
    const fastActives = ['aha', 'bha', 'retinol', 'vitamin c']
    const altIngredients = alt.activeIngredients?.join(' ').toLowerCase() || ''
    const hasFastActives = fastActives.some(active => altIngredients.includes(active))
    
    return hasFastActives ? 'Résultats plus rapides' : 'Action progressive'
  }
  
  private static calculateRoutineChanges(alt: CatalogProduct, current: EnrichedProduct): string[] {
    const changes: string[] = []
    
    if (alt.photosensitizing && !current.aiJustification.whySelected.includes('soir')) {
      changes.push('Utiliser uniquement le soir')
    }
    
    if (alt.potency === 'strong') {
      changes.push('Introduction progressive recommandée')
    }
    
    return changes
  }
  
  private static generateExpectedResults(alt: CatalogProduct, current: EnrichedProduct): string {
    if (alt.benefits && alt.benefits.length > 0) {
      return `Résultats attendus : ${alt.benefits.slice(0, 2).join(', ').toLowerCase()}`
    }
    return 'Résultats similaires au produit actuel'
  }
  
  private static generatePrecautions(alt: CatalogProduct, current: EnrichedProduct): string[] {
    const precautions: string[] = []
    
    if (alt.potency === 'strong') {
      precautions.push('Commencer par une utilisation tous les 2-3 jours')
    }
    
    if (alt.photosensitizing) {
      precautions.push('Toujours utiliser une protection solaire')
    }
    
    if (alt.contraindications) {
      precautions.push(...alt.contraindications)
    }
    
    return precautions
  }
  
  private static checkCompatibilityWarnings(alt: CatalogProduct, current: EnrichedProduct): string[] {
    const warnings: string[] = []
    
    // Vérifier les incompatibilités connues
    const altIngredients = alt.activeIngredients?.join(' ').toLowerCase() || ''
    
    if (altIngredients.includes('retinol') && altIngredients.includes('vitamin c')) {
      warnings.push('Ne pas utiliser simultanément avec la vitamine C')
    }
    
    if (altIngredients.includes('aha') && altIngredients.includes('bha')) {
      warnings.push('Éviter l\'utilisation simultanée d\'autres exfoliants')
    }
    
    return warnings
  }
  
  private static calculateTransitionPeriod(alt: CatalogProduct, current: EnrichedProduct): string {
    if (alt.potency === 'strong') {
      return '2-3 semaines d\'adaptation progressive'
    }
    
    if (alt.potency === 'gentle') {
      return 'Transition immédiate possible'
    }
    
    return '1-2 semaines de transition'
  }
  
  private static generateAlternativeReason(alt: CatalogProduct, current: EnrichedProduct): string {
    if (alt.price < (current.price || 0) * 0.8) {
      return 'Alternative plus économique'
    }
    
    const naturalKeywords = ['bio', 'organic', 'natural']
    const altText = `${alt.name} ${alt.brand}`.toLowerCase()
    if (naturalKeywords.some(k => altText.includes(k))) {
      return 'Alternative plus naturelle'
    }
    
    if (alt.clinicallyTested) {
      return 'Alternative cliniquement prouvée'
    }
    
    return 'Alternative recommandée'
  }
  
  /**
   * 🆘 CRÉATION RÉSULTAT VIDE
   */
  private static createEmptyResult(criteria: AlternativeCriteria, processingTime: number): AlternativeSearchResult {
    return {
      success: true,
      alternatives: [],
      totalFound: 0,
      searchCriteria: criteria,
      processingTime,
      errors: ['Aucune alternative trouvée pour ce produit']
    }
  }
}
