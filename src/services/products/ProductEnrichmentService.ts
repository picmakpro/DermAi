/**
 * 🎨 SERVICE D'ENRICHISSEMENT PRODUITS
 * 
 * Service responsable de l'enrichissement des données produits
 * avec informations du catalogue et métadonnées IA
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { RecommendedProduct, CatalogProduct } from '@/types'
import { EnrichedProduct, ProductProblemCategory } from '@/types/productSync'

export class ProductEnrichmentService {
  
  /**
   * 🎯 ENRICHISSEMENT PRINCIPAL D'UN PRODUIT
   */
  static enrichSingleProduct(
    product: RecommendedProduct,
    catalogProduct: CatalogProduct | null
  ): EnrichedProduct {
    if (!catalogProduct) {
      return this.createMinimalEnrichedProduct(product)
    }
    
    return {
      ...product,
      // Données catalogue
      imageUrl: catalogProduct.imageUrl || this.getDefaultImageUrl(product.category),
      description: this.generateRichDescription(catalogProduct),
      keywordBenefits: this.extractKeywordBenefits(catalogProduct),
      problemCategory: this.mapCategoryToProblem(catalogProduct.category),
      
      // Instructions enrichies
      usageInstructions: {
        application: this.generateDetailedInstructions(catalogProduct),
        frequency: this.inferFrequencyFromProduct(catalogProduct),
        timing: this.inferTimingFromProduct(catalogProduct),
        routineStep: (product as any).routineContext?.stepTitle
      },
      
      // Justification IA enrichie
      aiJustification: {
        whySelected: this.generateDetailedJustification(product, catalogProduct),
        skinBenefits: this.extractSkinBenefits(catalogProduct),
        routineIntegration: this.generateIntegrationAdvice(product, catalogProduct)
      }
    }
  }
  
  /**
   * 📝 GÉNÉRATION DESCRIPTION RICHE
   */
  private static generateRichDescription(catalogProduct: CatalogProduct): string {
    let description = ''
    
    // Bénéfices principaux
    if (catalogProduct.benefits && catalogProduct.benefits.length > 0) {
      const mainBenefits = catalogProduct.benefits.slice(0, 3)
      description += `${mainBenefits.join(', ')}.`
    }
    
    // Ingrédients actifs
    if (catalogProduct.activeIngredients && catalogProduct.activeIngredients.length > 0) {
      const keyIngredients = catalogProduct.activeIngredients.slice(0, 2)
      description += ` Enrichi en ${keyIngredients.join(' et ')}.`
    }
    
    // Spécificités techniques
    if (catalogProduct.pH) {
      description += ` pH équilibré (${catalogProduct.pH}).`
    }
    
    if (catalogProduct.clinicallyTested) {
      description += ` Testé cliniquement.`
    }
    
    return description || 'Produit de soin spécialisé pour votre routine beauté.'
  }
  
  /**
   * 🏷️ EXTRACTION MOTS-CLÉS BÉNÉFICES
   */
  private static extractKeywordBenefits(catalogProduct: CatalogProduct): string[] {
    const benefits: string[] = []
    
    // Bénéfices directs du catalogue
    if (catalogProduct.benefits) {
      benefits.push(...catalogProduct.benefits.slice(0, 4))
    }
    
    // Bénéfices inférés des ingrédients
    if (catalogProduct.activeIngredients) {
      catalogProduct.activeIngredients.forEach(ingredient => {
        const inferredBenefit = this.inferBenefitFromIngredient(ingredient)
        if (inferredBenefit && !benefits.includes(inferredBenefit)) {
          benefits.push(inferredBenefit)
        }
      })
    }
    
    // Bénéfices inférés de la catégorie
    const categoryBenefits = this.getCategoryBenefits(catalogProduct.category)
    categoryBenefits.forEach(benefit => {
      if (!benefits.includes(benefit)) {
        benefits.push(benefit)
      }
    })
    
    return benefits.slice(0, 5) // Maximum 5 bénéfices
  }
  
  /**
   * 🗺️ MAPPING CATÉGORIE → PROBLÈME DE PEAU
   */
  private static mapCategoryToProblem(category: string): ProductProblemCategory {
    const categoryLower = category.toLowerCase()
    
    const mapping: Record<string, ProductProblemCategory> = {
      // Nettoyage
      'cleanser': ProductProblemCategory.CLEANSING,
      'toner': ProductProblemCategory.CLEANSING,
      'micellar': ProductProblemCategory.CLEANSING,
      
      // Hydratation
      'moisturizer': ProductProblemCategory.HYDRATION,
      'face-oil': ProductProblemCategory.HYDRATION,
      'balm': ProductProblemCategory.HYDRATION,
      'mist': ProductProblemCategory.HYDRATION,
      
      // Anti-âge
      'serum': ProductProblemCategory.ANTI_AGING,
      'eye-care': ProductProblemCategory.ANTI_AGING,
      'treatment': ProductProblemCategory.ANTI_AGING,
      
      // Acné et imperfections
      'spot-treatment': ProductProblemCategory.ACNE,
      'blemish': ProductProblemCategory.ACNE,
      
      // Exfoliation
      'exfoliant': ProductProblemCategory.EXFOLIATION,
      'peel': ProductProblemCategory.EXFOLIATION,
      
      // Protection
      'sunscreen': ProductProblemCategory.PROTECTION,
      'spf': ProductProblemCategory.PROTECTION,
      
      // Pigmentation
      'brightening': ProductProblemCategory.PIGMENTATION,
      'vitamin-c': ProductProblemCategory.PIGMENTATION,
      
      // Sensibilité
      'sensitive': ProductProblemCategory.SENSITIVITY,
      'gentle': ProductProblemCategory.SENSITIVITY
    }
    
    // Recherche exacte
    if (mapping[categoryLower]) {
      return mapping[categoryLower]
    }
    
    // Recherche par inclusion
    for (const [key, value] of Object.entries(mapping)) {
      if (categoryLower.includes(key) || key.includes(categoryLower)) {
        return value
      }
    }
    
    return ProductProblemCategory.AUTRES
  }
  
  /**
   * 📋 GÉNÉRATION INSTRUCTIONS DÉTAILLÉES
   */
  private static generateDetailedInstructions(catalogProduct: CatalogProduct): string {
    const category = catalogProduct.category.toLowerCase()
    const texture = catalogProduct.texture?.toLowerCase() || ''
    const potency = catalogProduct.potency || 'medium'
    
    let instructions = ''
    
    // Instructions de base par catégorie
    switch (category) {
      case 'cleanser':
        instructions = 'Appliquer sur peau humide, masser délicatement en mouvements circulaires, rincer abondamment à l\'eau tiède'
        break
      case 'serum':
        instructions = 'Appliquer 2-3 gouttes sur peau propre et sèche, tapoter délicatement du centre vers l\'extérieur'
        break
      case 'moisturizer':
        instructions = 'Appliquer généreusement sur visage et cou, masser par mouvements ascendants jusqu\'à absorption complète'
        break
      case 'sunscreen':
        instructions = 'Appliquer généreusement 15-20 minutes avant exposition, renouveler toutes les 2 heures'
        break
      case 'exfoliant':
        instructions = 'Appliquer sur peau sèche, masser délicatement en évitant le contour des yeux, rincer à l\'eau tiède'
        break
      default:
        instructions = 'Appliquer selon les besoins sur peau propre'
    }
    
    // Ajustements selon la texture
    if (texture.includes('gel')) {
      instructions += '. Texture gel : absorption rapide'
    } else if (texture.includes('cream')) {
      instructions += '. Texture crème : laisser pénétrer quelques minutes'
    } else if (texture.includes('oil')) {
      instructions += '. Huile : quelques gouttes suffisent'
    }
    
    // Ajustements selon la puissance
    if (potency === 'strong') {
      instructions += '. Produit concentré : commencer par une utilisation tous les 2-3 jours'
    } else if (potency === 'gentle') {
      instructions += '. Formule douce : peut être utilisé quotidiennement'
    }
    
    return instructions
  }
  
  /**
   * ⏰ INFÉRENCE FRÉQUENCE D'UTILISATION
   */
  private static inferFrequencyFromProduct(catalogProduct: CatalogProduct): string {
    const category = catalogProduct.category.toLowerCase()
    const potency = catalogProduct.potency || 'medium'
    const activeIngredients = catalogProduct.activeIngredients || []
    
    // Fréquence par catégorie
    const categoryFrequency: Record<string, string> = {
      'cleanser': 'Quotidien',
      'moisturizer': 'Quotidien',
      'sunscreen': 'Quotidien (matin)',
      'toner': 'Quotidien',
      'serum': 'Quotidien',
      'mask': 'Hebdomadaire',
      'exfoliant': 'Hebdomadaire',
      'treatment': 'Selon besoin'
    }
    
    let frequency = categoryFrequency[category] || 'Selon routine'
    
    // Ajustements selon les ingrédients actifs
    const strongActives = ['retinol', 'tretinoin', 'aha', 'bha', 'glycolic', 'salicylic']
    const hasStrongActives = activeIngredients.some(ingredient => 
      strongActives.some(active => ingredient.toLowerCase().includes(active))
    )
    
    if (hasStrongActives || potency === 'strong') {
      if (frequency === 'Quotidien') {
        frequency = 'Progressif (commencer 2-3x/semaine)'
      }
    }
    
    return frequency
  }
  
  /**
   * 🌅 INFÉRENCE TIMING D'UTILISATION
   */
  private static inferTimingFromProduct(catalogProduct: CatalogProduct): string {
    const category = catalogProduct.category.toLowerCase()
    const activeIngredients = catalogProduct.activeIngredients || []
    const photosensitizing = catalogProduct.photosensitizing || false
    
    // Timing par catégorie
    if (category === 'sunscreen') return 'Matin'
    if (category === 'cleanser') return 'Matin et soir'
    if (category === 'moisturizer') return 'Matin et soir'
    
    // Ingrédients photosensibilisants → soir uniquement
    const photosensitizingIngredients = ['retinol', 'tretinoin', 'aha', 'glycolic', 'lactic']
    const hasPhotosensitizing = activeIngredients.some(ingredient => 
      photosensitizingIngredients.some(photo => ingredient.toLowerCase().includes(photo))
    )
    
    if (hasPhotosensitizing || photosensitizing) {
      return 'Soir uniquement'
    }
    
    // Ingrédients antioxydants → matin de préférence
    const antioxidants = ['vitamin c', 'niacinamide', 'vitamin e']
    const hasAntioxidants = activeIngredients.some(ingredient => 
      antioxidants.some(antioxidant => ingredient.toLowerCase().includes(antioxidant))
    )
    
    if (hasAntioxidants) {
      return 'Matin de préférence'
    }
    
    return 'Matin ou soir'
  }
  
  /**
   * 🤖 GÉNÉRATION JUSTIFICATION DÉTAILLÉE
   */
  private static generateDetailedJustification(
    product: RecommendedProduct,
    catalogProduct: CatalogProduct
  ): string {
    let justification = `Sélectionné spécifiquement pour votre routine ${catalogProduct.category}`
    
    // Ajouter contexte de la routine si disponible
    const routineContext = (product as any).routineContext
    if (routineContext?.phase) {
      justification += ` en phase ${routineContext.phase}`
    }
    
    // Ajouter bénéfices principaux
    if (catalogProduct.benefits && catalogProduct.benefits.length > 0) {
      const mainBenefit = catalogProduct.benefits[0]
      justification += `. Idéal pour ${mainBenefit.toLowerCase()}`
    }
    
    // Ajouter spécificités techniques
    if (catalogProduct.clinicallyTested) {
      justification += '. Efficacité cliniquement prouvée'
    }
    
    if (catalogProduct.dermatologistRecommended) {
      justification += '. Recommandé par les dermatologues'
    }
    
    return justification + '.'
  }
  
  /**
   * 🌟 EXTRACTION BÉNÉFICES PEAU
   */
  private static extractSkinBenefits(catalogProduct: CatalogProduct): string[] {
    const benefits: string[] = []
    
    // Bénéfices directs
    if (catalogProduct.benefits) {
      benefits.push(...catalogProduct.benefits)
    }
    
    // Bénéfices inférés des ingrédients
    if (catalogProduct.activeIngredients) {
      catalogProduct.activeIngredients.forEach(ingredient => {
        const skinBenefits = this.getSkinBenefitsFromIngredient(ingredient)
        benefits.push(...skinBenefits)
      })
    }
    
    // Déduplication et limitation
    return [...new Set(benefits)].slice(0, 6)
  }
  
  /**
   * 🔗 GÉNÉRATION CONSEIL D'INTÉGRATION
   */
  private static generateIntegrationAdvice(
    product: RecommendedProduct,
    catalogProduct: CatalogProduct
  ): string {
    const routineContext = (product as any).routineContext
    
    let advice = ''
    
    if (routineContext) {
      advice = `Étape ${routineContext.stepNumber}: ${routineContext.stepTitle}`
      
      if (routineContext.frequency && routineContext.timing) {
        advice += ` - ${routineContext.frequency}, ${routineContext.timing}`
      }
    } else {
      advice = 'Intégré dans votre routine personnalisée'
    }
    
    // Ajouter conseils spécifiques selon le produit
    if (catalogProduct.potency === 'strong') {
      advice += '. Introduire progressivement pour éviter les irritations'
    }
    
    if (catalogProduct.photosensitizing) {
      advice += '. Toujours utiliser une protection solaire le lendemain'
    }
    
    return advice
  }
  
  /**
   * 🆘 CRÉATION PRODUIT ENRICHI MINIMAL
   */
  private static createMinimalEnrichedProduct(product: RecommendedProduct): EnrichedProduct {
    return {
      ...product,
      imageUrl: this.getDefaultImageUrl(product.category),
      description: `Produit ${product.category} recommandé pour votre routine`,
      keywordBenefits: this.getCategoryBenefits(product.category),
      problemCategory: this.mapCategoryToProblem(product.category),
      usageInstructions: {
        application: 'Suivre les instructions du fabricant',
        frequency: 'Selon routine',
        timing: 'Selon indications',
        routineStep: (product as any).routineContext?.stepTitle
      },
      aiJustification: {
        whySelected: `Recommandé pour votre type de peau et routine ${product.category}`,
        skinBenefits: this.getCategoryBenefits(product.category),
        routineIntegration: 'Intégré dans votre routine personnalisée'
      }
    }
  }
  
  // Méthodes utilitaires privées
  
  private static getDefaultImageUrl(category: string): string {
    const defaultImages: Record<string, string> = {
      'cleanser': '/images/products/default-cleanser.jpg',
      'serum': '/images/products/default-serum.jpg',
      'moisturizer': '/images/products/default-moisturizer.jpg',
      'sunscreen': '/images/products/default-sunscreen.jpg'
    }
    
    return defaultImages[category.toLowerCase()] || '/placeholder-product.jpg'
  }
  
  private static getCategoryBenefits(category: string): string[] {
    const benefits: Record<string, string[]> = {
      'cleanser': ['Nettoie en profondeur', 'Purifie', 'Respecte la barrière cutanée'],
      'serum': ['Traitement ciblé', 'Haute concentration', 'Pénétration optimale'],
      'moisturizer': ['Hydrate intensément', 'Nourrit', 'Protège la barrière cutanée'],
      'sunscreen': ['Protection UV', 'Prévient le vieillissement', 'Anti-taches'],
      'exfoliant': ['Exfolie en douceur', 'Affine le grain de peau', 'Éclat immédiat']
    }
    
    return benefits[category.toLowerCase()] || ['Soin spécialisé']
  }
  
  private static inferBenefitFromIngredient(ingredient: string): string | null {
    const ingredientBenefits: Record<string, string> = {
      'hyaluronic acid': 'Hydratation intense',
      'niacinamide': 'Régule le sébum',
      'vitamin c': 'Antioxydant puissant',
      'retinol': 'Anti-âge efficace',
      'salicylic acid': 'Purifie les pores',
      'glycolic acid': 'Exfoliation douce'
    }
    
    const ingredientLower = ingredient.toLowerCase()
    for (const [key, benefit] of Object.entries(ingredientBenefits)) {
      if (ingredientLower.includes(key)) {
        return benefit
      }
    }
    
    return null
  }
  
  private static getSkinBenefitsFromIngredient(ingredient: string): string[] {
    const ingredientSkinBenefits: Record<string, string[]> = {
      'hyaluronic acid': ['Hydratation longue durée', 'Repulpe la peau'],
      'niacinamide': ['Resserre les pores', 'Unifie le teint', 'Apaise'],
      'vitamin c': ['Éclat immédiat', 'Protection antioxydante', 'Anti-taches'],
      'retinol': ['Stimule le renouvellement', 'Lisse les rides', 'Affine la texture'],
      'salicylic acid': ['Désobstrue les pores', 'Prévient les imperfections'],
      'glycolic acid': ['Exfolie en surface', 'Stimule le renouvellement']
    }
    
    const ingredientLower = ingredient.toLowerCase()
    for (const [key, benefits] of Object.entries(ingredientSkinBenefits)) {
      if (ingredientLower.includes(key)) {
        return benefits
      }
    }
    
    return []
  }
}
