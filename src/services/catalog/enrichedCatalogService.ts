import type { ProductCatalog, CatalogProduct } from '@/types'
import enrichedCatalogData from '@/data/enrichedCatalog.json'

/**
 * 🔥 SERVICE CATALOGUE ENRICHI - SPRINT 2 REFONTE IA-FIRST
 * Gestion du catalogue avec spécifications techniques complètes pour l'IA
 */
export class EnrichedCatalogService {
  
  private static catalogCache: ProductCatalog | null = null

  /**
   * Charge le catalogue enrichi avec toutes les spécifications techniques
   */
  static getCatalog(): ProductCatalog {
    if (this.catalogCache) {
      return this.catalogCache
    }

    this.catalogCache = {
      products: enrichedCatalogData as CatalogProduct[],
      lastUpdated: new Date(),
      version: "2.0-enriched"
    }

    return this.catalogCache
  }

  /**
   * Recherche des produits par catégorie
   */
  static getProductsByCategory(category: string): CatalogProduct[] {
    const catalog = this.getCatalog()
    return catalog.products.filter(product => 
      product.category.toLowerCase() === category.toLowerCase()
    )
  }

  /**
   * Recherche des produits par type de peau
   */
  static getProductsBySkinType(skinType: string): CatalogProduct[] {
    const catalog = this.getCatalog()
    return catalog.products.filter(product => 
      product.skinTypes?.some(type => 
        type.toLowerCase().includes(skinType.toLowerCase())
      )
    )
  }

  /**
   * Recherche des produits par budget
   */
  static getProductsByBudget(maxPrice: number): CatalogProduct[] {
    const catalog = this.getCatalog()
    return catalog.products.filter(product => product.price <= maxPrice)
  }

  /**
   * Recherche des produits compatibles avec un ingrédient
   */
  static getCompatibleProducts(ingredient: string): CatalogProduct[] {
    const catalog = this.getCatalog()
    return catalog.products.filter(product => 
      product.compatibilities?.some(compat => 
        compat.toLowerCase().includes(ingredient.toLowerCase())
      ) || 
      product.compatibilities?.includes("Tous actifs")
    )
  }

  /**
   * Recherche des produits par puissance
   */
  static getProductsByPotency(potency: 'gentle' | 'medium' | 'strong'): CatalogProduct[] {
    const catalog = this.getCatalog()
    return catalog.products.filter(product => product.potency === potency)
  }

  /**
   * Recherche des produits sûrs pendant la grossesse
   */
  static getPregnancySafeProducts(): CatalogProduct[] {
    const catalog = this.getCatalog()
    return catalog.products.filter(product => product.pregnancySafe === true)
  }

  /**
   * Recherche des produits photosensibilisants
   */
  static getPhotosensitizingProducts(): CatalogProduct[] {
    const catalog = this.getCatalog()
    return catalog.products.filter(product => product.photosensitizing === true)
  }

  /**
   * Obtient un produit par son ID
   */
  static getProductById(id: string): CatalogProduct | null {
    const catalog = this.getCatalog()
    return catalog.products.find(product => product.id === id) || null
  }

  /**
   * Recherche des alternatives à un produit (même catégorie, prix similaire)
   */
  static getAlternatives(productId: string, priceRange: number = 0.3): CatalogProduct[] {
    const product = this.getProductById(productId)
    if (!product) return []

    const catalog = this.getCatalog()
    const minPrice = product.price * (1 - priceRange)
    const maxPrice = product.price * (1 + priceRange)

    return catalog.products.filter(p => 
      p.id !== productId &&
      p.category === product.category &&
      p.price >= minPrice &&
      p.price <= maxPrice
    )
  }

  /**
   * Génère la description complète du catalogue pour l'IA
   */
  static generateCatalogDescriptionForAI(): string {
    const catalog = this.getCatalog()
    
    let description = `## CATALOGUE PRODUITS ENRICHI (${catalog.products.length} produits)\n\n`
    
    // Grouper par catégorie
    const categories = [...new Set(catalog.products.map(p => p.category))]
    
    for (const category of categories) {
      const categoryProducts = this.getProductsByCategory(category)
      description += `### ${category.toUpperCase()} (${categoryProducts.length} produits)\n\n`
      
      for (const product of categoryProducts) {
        description += this.generateProductDescriptionForAI(product)
        description += '\n'
      }
    }
    
    return description
  }

  /**
   * Génère la description d'un produit pour l'IA
   */
  static generateProductDescriptionForAI(product: CatalogProduct): string {
    const ingredients = product.activeIngredients?.join(', ') || 'Non spécifié'
    const skinTypes = product.skinTypes?.join(', ') || 'Tous types'
    const benefits = product.benefits?.join(', ') || 'Soin général'
    const compatibilities = product.compatibilities?.join(', ') || 'Standard'
    const contraindications = product.contraindications?.length 
      ? product.contraindications.join(', ') 
      : 'Aucune'

    return `**${product.id}** - ${product.name} (${product.brand})
- **Catégorie :** ${product.category}
- **Prix :** ${product.price}€
- **Ingrédients actifs :** ${ingredients}
- **Types de peau :** ${skinTypes}
- **Bénéfices :** ${benefits}
- **pH :** ${product.pH || 'Non spécifié'}
- **Concentration :** ${product.concentration || 'Standard'}
- **Puissance :** ${product.potency || 'medium'}
- **Texture :** ${product.texture || 'Non spécifiée'}
- **Ordre application :** ${product.applicationOrder || 'Flexible'}
- **Compatibilités :** ${compatibilities}
- **Contre-indications :** ${contraindications}
- **Photosensibilisant :** ${product.photosensitizing ? 'OUI' : 'NON'}
- **Grossesse :** ${product.pregnancySafe ? 'Sûr' : 'À éviter'}
- **Zones cibles :** ${product.targetZones?.join(', ') || 'Visage complet'}
- **Durée d'usage :** ${product.usageDuration || 'Variable'}
- **Score avis :** ${product.reviewScore || 'N/A'}/5
- **Disponibilité :** ${product.availability || 'in-stock'}`
  }

  /**
   * Valide la compatibilité entre plusieurs produits
   */
  static validateProductCompatibility(productIds: string[]): {
    compatible: boolean
    issues: string[]
    recommendations: string[]
  } {
    const products = productIds.map(id => this.getProductById(id)).filter(Boolean) as CatalogProduct[]
    const issues: string[] = []
    const recommendations: string[] = []

    // Vérifier les contre-indications croisées
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const product1 = products[i]
        const product2 = products[j]

        // Vérifier si les ingrédients de product1 sont dans les contre-indications de product2
        product1.activeIngredients?.forEach(ingredient => {
          if (product2.contraindications?.some(contra => 
            contra.toLowerCase().includes(ingredient.toLowerCase())
          )) {
            issues.push(`${product1.name} (${ingredient}) incompatible avec ${product2.name}`)
          }
        })
      }
    }

    // Vérifier les produits photosensibilisants
    const photosensitizing = products.filter(p => p.photosensitizing)
    if (photosensitizing.length > 0) {
      recommendations.push(`Produits photosensibilisants détectés: ${photosensitizing.map(p => p.name).join(', ')}. SPF obligatoire.`)
    }

    // Vérifier l'ordre d'application
    const orderedProducts = products
      .filter(p => p.applicationOrder !== undefined)
      .sort((a, b) => (a.applicationOrder || 0) - (b.applicationOrder || 0))

    if (orderedProducts.length > 1) {
      recommendations.push(`Ordre d'application recommandé: ${orderedProducts.map(p => p.name).join(' → ')}`)
    }

    return {
      compatible: issues.length === 0,
      issues,
      recommendations
    }
  }

  /**
   * Optimise la sélection selon le budget
   */
  static optimizeForBudget(
    desiredProducts: string[], 
    maxBudget: number
  ): {
    selectedProducts: CatalogProduct[]
    totalCost: number
    alternatives: CatalogProduct[]
    budgetRespected: boolean
  } {
    const products = desiredProducts.map(id => this.getProductById(id)).filter(Boolean) as CatalogProduct[]
    const totalCost = products.reduce((sum, p) => sum + p.price, 0)

    if (totalCost <= maxBudget) {
      return {
        selectedProducts: products,
        totalCost,
        alternatives: [],
        budgetRespected: true
      }
    }

    // Chercher des alternatives moins chères
    const alternatives: CatalogProduct[] = []
    let optimizedProducts = [...products]
    let optimizedCost = totalCost

    for (const product of products) {
      if (optimizedCost > maxBudget) {
        const cheaperAlternatives = this.getAlternatives(product.id, 0.5)
          .filter(alt => alt.price < product.price)
          .sort((a, b) => a.price - b.price)

        if (cheaperAlternatives.length > 0) {
          const alternative = cheaperAlternatives[0]
          const index = optimizedProducts.findIndex(p => p.id === product.id)
          if (index !== -1) {
            optimizedProducts[index] = alternative
            optimizedCost = optimizedCost - product.price + alternative.price
            alternatives.push(alternative)
          }
        }
      }
    }

    return {
      selectedProducts: optimizedProducts,
      totalCost: optimizedCost,
      alternatives,
      budgetRespected: optimizedCost <= maxBudget
    }
  }
}

