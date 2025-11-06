/**
 * SERVICE CATALOGUE CATÉGORISÉ - DermAI V2
 * Chargement intelligent des produits par catégorie selon le diagnostic
 */

import fs from 'fs'
import path from 'path'

export interface CatalogProduct {
  id: string
  name: string
  brand: string
  category: string
  price: number
  currency: string
  imageUrl: string
  affiliateLink: string
  activeIngredients: string[]
  skinTypes: string[]
  benefits: string[]
}

export interface CategoryData {
  category: string
  count: number
  products: CatalogProduct[]
}

export interface CatalogIndex {
  version: string
  generatedAt: string
  totalProducts: number
  categories: Array<{
    name: string
    count: number
    file: string
  }>
  problemMapping: Record<string, string[]>
}

/**
 * Service de catalogue catégorisé pour chargement optimisé
 */
export class CategorizedCatalogService {
  private static catalogCache = new Map<string, CategoryData>()
  private static indexCache: CatalogIndex | null = null

  /**
   * Charge l'index du catalogue avec métadonnées
   */
  static loadIndex(): CatalogIndex {
    if (this.indexCache) {
      return this.indexCache
    }

    try {
      const indexPath = path.join(process.cwd(), 'public/catalog/index.json')
      const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
      this.indexCache = indexData
      return indexData
    } catch (error) {
      console.error('❌ Erreur chargement index catalogue:', error)
      throw new Error('Impossible de charger l\'index du catalogue')
    }
  }

  /**
   * Charge une catégorie spécifique de produits
   */
  static loadCategory(categoryName: string): CategoryData {
    // Vérifier le cache
    if (this.catalogCache.has(categoryName)) {
      return this.catalogCache.get(categoryName)!
    }

    try {
      const categoryPath = path.join(process.cwd(), `public/catalog/${categoryName}.json`)
      
      if (!fs.existsSync(categoryPath)) {
        console.warn(`⚠️ Catégorie non trouvée: ${categoryName}`)
        return { category: categoryName, count: 0, products: [] }
      }

      const categoryData = JSON.parse(fs.readFileSync(categoryPath, 'utf8'))
      
      // Mettre en cache
      this.catalogCache.set(categoryName, categoryData)
      
      console.log(`📦 Catégorie chargée: ${categoryName} (${categoryData.count} produits)`)
      return categoryData
    } catch (error) {
      console.error(`❌ Erreur chargement catégorie ${categoryName}:`, error)
      return { category: categoryName, count: 0, products: [] }
    }
  }

  /**
   * Charge plusieurs catégories en une fois
   */
  static loadCategories(categoryNames: string[]): CatalogProduct[] {
    const allProducts: CatalogProduct[] = []
    
    for (const categoryName of categoryNames) {
      const categoryData = this.loadCategory(categoryName)
      allProducts.push(...categoryData.products)
    }
    
    console.log(`📦 ${categoryNames.length} catégories chargées: ${allProducts.length} produits total`)
    return allProducts
  }

  /**
   * Sélection intelligente des catégories selon le diagnostic
   */
  static getCategoriesForDiagnosis(diagnostic: {
    mainConcern: string
    concernedZones: string[]
    intensity: string
  }): string[] {
    const index = this.loadIndex()
    const categories = new Set<string>()

    // 1. Catégories de base (toujours nécessaires)
    categories.add('cleanser')
    categories.add('moisturizer')
    categories.add('sunscreen')

    // 2. Analyse du diagnostic pour catégories spécifiques
    const concern = diagnostic.mainConcern.toLowerCase()
    
    if (concern.includes('acné') || concern.includes('imperfections') || concern.includes('boutons')) {
      categories.add('serum')      // Niacinamide, Zinc
      categories.add('treatment')  // Traitements anti-acné
      categories.add('exfoliant')  // BHA pour pores
    }
    
    if (concern.includes('pores') || concern.includes('dilatés')) {
      categories.add('exfoliant')  // AHA/BHA
      categories.add('serum')      // Niacinamide
      categories.add('toner')      // Resserrement pores
    }
    
    if (concern.includes('rides') || concern.includes('âge') || concern.includes('fermeté')) {
      categories.add('serum')      // Rétinol, Peptides
      categories.add('treatment')  // Anti-âge
      categories.add('eye-care')   // Contour des yeux
    }
    
    if (concern.includes('taches') || concern.includes('pigment') || concern.includes('cicatrices')) {
      categories.add('serum')      // Vitamine C, Arbutine
      categories.add('treatment')  // Dépigmentants
    }
    
    if (concern.includes('déshydrat') || concern.includes('sèche')) {
      categories.add('face-oil')   // Huiles nourrissantes
      categories.add('mist')       // Brumes hydratantes
    }
    
    if (concern.includes('sensible') || concern.includes('irritée')) {
      categories.add('mist')       // Eaux thermales
      categories.add('balm')       // Baumes réparateurs
    }

    // 3. Ajustement selon l'intensité
    if (diagnostic.intensity === 'sévère' || diagnostic.intensity === 'modérée à sévère') {
      categories.add('treatment')  // Traitements intensifs
      categories.add('mask')       // Masques thérapeutiques
    }

    const finalCategories = Array.from(categories)
    console.log(`🎯 Diagnostic "${diagnostic.mainConcern}" → Catégories: ${finalCategories.join(', ')}`)
    
    return finalCategories
  }

  /**
   * Charge les produits optimaux pour un diagnostic donné
   */
  static loadForDiagnosis(diagnostic: {
    mainConcern: string
    concernedZones: string[]
    intensity: string
  }): CatalogProduct[] {
    const categories = this.getCategoriesForDiagnosis(diagnostic)
    const products = this.loadCategories(categories)
    
    console.log(`🔥 Sélection intelligente: ${products.length} produits pour "${diagnostic.mainConcern}"`)
    return products
  }

  /**
   * Recherche de produits par critères
   */
  static searchProducts(criteria: {
    categories?: string[]
    skinTypes?: string[]
    ingredients?: string[]
    priceRange?: { min: number, max: number }
    brands?: string[]
  }): CatalogProduct[] {
    const categoriesToSearch = criteria.categories || ['cleanser', 'serum', 'moisturizer']
    const allProducts = this.loadCategories(categoriesToSearch)
    
    return allProducts.filter(product => {
      // Filtre par type de peau
      if (criteria.skinTypes && criteria.skinTypes.length > 0) {
        const hasMatchingSkinType = criteria.skinTypes.some(skinType => 
          product.skinTypes.some(pSkinType => 
            pSkinType.toLowerCase().includes(skinType.toLowerCase())
          )
        )
        if (!hasMatchingSkinType) return false
      }
      
      // Filtre par ingrédients
      if (criteria.ingredients && criteria.ingredients.length > 0) {
        const hasMatchingIngredient = criteria.ingredients.some(ingredient =>
          product.activeIngredients.some(pIngredient =>
            pIngredient.toLowerCase().includes(ingredient.toLowerCase())
          )
        )
        if (!hasMatchingIngredient) return false
      }
      
      // Filtre par prix
      if (criteria.priceRange) {
        if (product.price < criteria.priceRange.min || product.price > criteria.priceRange.max) {
          return false
        }
      }
      
      // Filtre par marque
      if (criteria.brands && criteria.brands.length > 0) {
        if (!criteria.brands.some(brand => 
          product.brand.toLowerCase().includes(brand.toLowerCase())
        )) {
          return false
        }
      }
      
      return true
    })
  }

  /**
   * Statistiques du catalogue
   */
  static getStats(): {
    totalProducts: number
    categoriesCount: number
    topBrands: Array<{ brand: string, count: number }>
    priceRange: { min: number, max: number, average: number }
  } {
    const index = this.loadIndex()
    const allProducts = this.loadCategories(index.categories.map(c => c.name))
    
    // Top marques
    const brandCounts = new Map<string, number>()
    allProducts.forEach(product => {
      brandCounts.set(product.brand, (brandCounts.get(product.brand) || 0) + 1)
    })
    
    const topBrands = Array.from(brandCounts.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Prix
    const prices = allProducts.map(p => p.price)
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length
    }
    
    return {
      totalProducts: allProducts.length,
      categoriesCount: index.categories.length,
      topBrands,
      priceRange
    }
  }

  /**
   * Vider le cache (utile pour les tests)
   */
  static clearCache(): void {
    this.catalogCache.clear()
    this.indexCache = null
  }
}

