/**
 * 🏷️ SERVICE DE CATÉGORISATION PRODUITS
 * 
 * Service responsable de la catégorisation intelligente des produits
 * par problème de peau et organisation de l'affichage
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { EnrichedProduct, ProductProblemCategory } from '@/types/productSync'

export class ProductCategoryService {
  
  /**
   * 🎯 CATÉGORISATION PRINCIPALE PAR PROBLÈME
   */
  static categorizeByProblem(products: EnrichedProduct[]): Map<ProductProblemCategory, EnrichedProduct[]> {
    const categories = new Map<ProductProblemCategory, EnrichedProduct[]>()
    
    // Initialiser toutes les catégories
    Object.values(ProductProblemCategory).forEach(category => {
      categories.set(category, [])
    })
    
    // Répartir les produits
    products.forEach(product => {
      const category = product.problemCategory || ProductProblemCategory.AUTRES
      const existingProducts = categories.get(category) || []
      existingProducts.push(product)
      categories.set(category, existingProducts)
    })
    
    // Supprimer les catégories vides
    categories.forEach((products, category) => {
      if (products.length === 0) {
        categories.delete(category)
      }
    })
    
    return categories
  }
  
  /**
   * 📊 STATISTIQUES DE CATÉGORISATION
   */
  static getCategoryStats(products: EnrichedProduct[]): {
    totalProducts: number
    categoriesUsed: number
    distribution: Record<string, number>
    mostPopularCategory: ProductProblemCategory | null
  } {
    const categorized = this.categorizeByProblem(products)
    const distribution: Record<string, number> = {}
    let mostPopularCategory: ProductProblemCategory | null = null
    let maxCount = 0
    
    categorized.forEach((products, category) => {
      distribution[category] = products.length
      if (products.length > maxCount) {
        maxCount = products.length
        mostPopularCategory = category
      }
    })
    
    return {
      totalProducts: products.length,
      categoriesUsed: categorized.size,
      distribution,
      mostPopularCategory
    }
  }
  
  /**
   * 🎨 CONFIGURATION AFFICHAGE PAR CATÉGORIE
   */
  static getCategoryDisplayConfig(category: ProductProblemCategory): {
    icon: string
    color: string
    description: string
    priority: number
  } {
    const configs = {
      [ProductProblemCategory.CLEANSING]: {
        icon: '🧼',
        color: 'blue',
        description: 'Nettoyage et purification de la peau',
        priority: 1
      },
      [ProductProblemCategory.HYDRATION]: {
        icon: '💧',
        color: 'cyan',
        description: 'Hydratation et nutrition cutanée',
        priority: 2
      },
      [ProductProblemCategory.ACNE]: {
        icon: '🎯',
        color: 'green',
        description: 'Traitement des imperfections et acné',
        priority: 3
      },
      [ProductProblemCategory.ANTI_AGING]: {
        icon: '✨',
        color: 'purple',
        description: 'Anti-âge et fermeté',
        priority: 4
      },
      [ProductProblemCategory.PIGMENTATION]: {
        icon: '🌟',
        color: 'yellow',
        description: 'Éclat et uniformité du teint',
        priority: 5
      },
      [ProductProblemCategory.PROTECTION]: {
        icon: '☀️',
        color: 'orange',
        description: 'Protection solaire et environnementale',
        priority: 6
      },
      [ProductProblemCategory.EXFOLIATION]: {
        icon: '🔄',
        color: 'pink',
        description: 'Exfoliation et renouvellement cellulaire',
        priority: 7
      },
      [ProductProblemCategory.SENSITIVITY]: {
        icon: '🌸',
        color: 'rose',
        description: 'Soins pour peaux sensibles',
        priority: 8
      },
      [ProductProblemCategory.AUTRES]: {
        icon: '🧴',
        color: 'gray',
        description: 'Autres soins spécialisés',
        priority: 9
      }
    }
    
    return configs[category] || configs[ProductProblemCategory.AUTRES]
  }
  
  /**
   * 📋 TRI DES CATÉGORIES PAR PRIORITÉ
   */
  static sortCategoriesByPriority(
    categories: Map<ProductProblemCategory, EnrichedProduct[]>
  ): [ProductProblemCategory, EnrichedProduct[]][] {
    return Array.from(categories.entries()).sort((a, b) => {
      const configA = this.getCategoryDisplayConfig(a[0])
      const configB = this.getCategoryDisplayConfig(b[0])
      return configA.priority - configB.priority
    })
  }
  
  /**
   * 🔍 RECHERCHE PRODUITS PAR CATÉGORIE
   */
  static findProductsByCategory(
    products: EnrichedProduct[], 
    category: ProductProblemCategory
  ): EnrichedProduct[] {
    return products.filter(product => product.problemCategory === category)
  }
  
  /**
   * 🏷️ SUGGESTION DE CATÉGORIE POUR NOUVEAU PRODUIT
   */
  static suggestCategory(
    productName: string,
    productCategory: string,
    activeIngredients?: string[],
    benefits?: string[]
  ): ProductProblemCategory {
    const name = productName.toLowerCase()
    const category = productCategory.toLowerCase()
    const ingredients = activeIngredients?.join(' ').toLowerCase() || ''
    const productBenefits = benefits?.join(' ').toLowerCase() || ''
    
    // Règles de catégorisation par mots-clés
    const rules = [
      {
        category: ProductProblemCategory.CLEANSING,
        keywords: ['cleanser', 'nettoyant', 'gel nettoyant', 'mousse', 'micellar', 'toner', 'démaquillant']
      },
      {
        category: ProductProblemCategory.HYDRATION,
        keywords: ['moisturizer', 'hydratant', 'crème', 'baume', 'hyaluronic', 'ceramide', 'face oil', 'huile']
      },
      {
        category: ProductProblemCategory.ACNE,
        keywords: ['acne', 'acné', 'imperfections', 'salicylic', 'bha', 'spot treatment', 'purifying']
      },
      {
        category: ProductProblemCategory.ANTI_AGING,
        keywords: ['anti-age', 'retinol', 'anti-rides', 'fermeté', 'serum', 'peptide', 'collagen', 'eye cream']
      },
      {
        category: ProductProblemCategory.PIGMENTATION,
        keywords: ['vitamin c', 'brightening', 'éclat', 'taches', 'pigmentation', 'kojic', 'arbutin']
      },
      {
        category: ProductProblemCategory.PROTECTION,
        keywords: ['sunscreen', 'spf', 'protection solaire', 'uv', 'écran solaire']
      },
      {
        category: ProductProblemCategory.EXFOLIATION,
        keywords: ['exfoliant', 'aha', 'bha', 'glycolic', 'lactic', 'peel', 'gommage']
      },
      {
        category: ProductProblemCategory.SENSITIVITY,
        keywords: ['sensitive', 'sensible', 'gentle', 'doux', 'apaisant', 'calming', 'allantoin']
      }
    ]
    
    // Recherche par règles
    for (const rule of rules) {
      const searchText = `${name} ${category} ${ingredients} ${productBenefits}`
      if (rule.keywords.some(keyword => searchText.includes(keyword))) {
        return rule.category
      }
    }
    
    // Catégorisation par défaut selon le type de produit
    const defaultMapping: Record<string, ProductProblemCategory> = {
      'cleanser': ProductProblemCategory.CLEANSING,
      'moisturizer': ProductProblemCategory.HYDRATION,
      'serum': ProductProblemCategory.ANTI_AGING,
      'sunscreen': ProductProblemCategory.PROTECTION,
      'treatment': ProductProblemCategory.ACNE,
      'exfoliant': ProductProblemCategory.EXFOLIATION,
      'mask': ProductProblemCategory.HYDRATION,
      'toner': ProductProblemCategory.CLEANSING,
      'eye-care': ProductProblemCategory.ANTI_AGING,
      'face-oil': ProductProblemCategory.HYDRATION
    }
    
    return defaultMapping[category] || ProductProblemCategory.AUTRES
  }
  
  /**
   * 🎨 GÉNÉRATION COULEURS POUR GRAPHIQUES
   */
  static getCategoryColors(): Record<ProductProblemCategory, string> {
    return {
      [ProductProblemCategory.CLEANSING]: '#3B82F6', // Bleu
      [ProductProblemCategory.HYDRATION]: '#06B6D4', // Cyan
      [ProductProblemCategory.ACNE]: '#10B981', // Vert
      [ProductProblemCategory.ANTI_AGING]: '#8B5CF6', // Violet
      [ProductProblemCategory.PIGMENTATION]: '#F59E0B', // Jaune
      [ProductProblemCategory.PROTECTION]: '#F97316', // Orange
      [ProductProblemCategory.EXFOLIATION]: '#EC4899', // Rose
      [ProductProblemCategory.SENSITIVITY]: '#F472B6', // Rose clair
      [ProductProblemCategory.AUTRES]: '#6B7280' // Gris
    }
  }
  
  /**
   * 📈 ANALYSE DE DISTRIBUTION DES CATÉGORIES
   */
  static analyzeDistribution(products: EnrichedProduct[]): {
    balanced: boolean
    recommendations: string[]
    missingCategories: ProductProblemCategory[]
    overrepresentedCategories: ProductProblemCategory[]
  } {
    const stats = this.getCategoryStats(products)
    const totalProducts = stats.totalProducts
    const expectedPercentage = 100 / Object.keys(ProductProblemCategory).length
    
    const recommendations: string[] = []
    const missingCategories: ProductProblemCategory[] = []
    const overrepresentedCategories: ProductProblemCategory[] = []
    
    // Analyser chaque catégorie
    Object.values(ProductProblemCategory).forEach(category => {
      const count = stats.distribution[category] || 0
      const percentage = (count / totalProducts) * 100
      
      if (count === 0) {
        missingCategories.push(category)
      } else if (percentage > expectedPercentage * 2) {
        overrepresentedCategories.push(category)
      }
    })
    
    // Générer des recommandations
    if (missingCategories.length > 0) {
      recommendations.push(`Ajouter des produits dans les catégories manquantes : ${missingCategories.join(', ')}`)
    }
    
    if (overrepresentedCategories.length > 0) {
      recommendations.push(`Équilibrer les catégories surreprésentées : ${overrepresentedCategories.join(', ')}`)
    }
    
    const balanced = missingCategories.length === 0 && overrepresentedCategories.length === 0
    
    if (balanced) {
      recommendations.push('Distribution équilibrée des catégories')
    }
    
    return {
      balanced,
      recommendations,
      missingCategories,
      overrepresentedCategories
    }
  }
  
  /**
   * 🔄 RÉORGANISATION INTELLIGENTE
   */
  static reorganizeByUserPreferences(
    categories: Map<ProductProblemCategory, EnrichedProduct[]>,
    userConcerns: string[]
  ): Map<ProductProblemCategory, EnrichedProduct[]> {
    // Mapping des préoccupations utilisateur vers les catégories
    const concernToCategoryMap: Record<string, ProductProblemCategory> = {
      'acné': ProductProblemCategory.ACNE,
      'imperfections': ProductProblemCategory.ACNE,
      'rides': ProductProblemCategory.ANTI_AGING,
      'anti-âge': ProductProblemCategory.ANTI_AGING,
      'hydratation': ProductProblemCategory.HYDRATION,
      'sécheresse': ProductProblemCategory.HYDRATION,
      'taches': ProductProblemCategory.PIGMENTATION,
      'éclat': ProductProblemCategory.PIGMENTATION,
      'sensibilité': ProductProblemCategory.SENSITIVITY,
      'irritation': ProductProblemCategory.SENSITIVITY
    }
    
    // Créer une nouvelle map avec priorités ajustées
    const reorganized = new Map<ProductProblemCategory, EnrichedProduct[]>()
    
    // D'abord, ajouter les catégories prioritaires selon les préoccupations utilisateur
    userConcerns.forEach(concern => {
      const category = concernToCategoryMap[concern.toLowerCase()]
      if (category && categories.has(category)) {
        reorganized.set(category, categories.get(category)!)
      }
    })
    
    // Ensuite, ajouter les autres catégories
    categories.forEach((products, category) => {
      if (!reorganized.has(category)) {
        reorganized.set(category, products)
      }
    })
    
    return reorganized
  }
}
