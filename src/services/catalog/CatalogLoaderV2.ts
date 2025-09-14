import fs from 'fs/promises'
import path from 'path'
import { Logger } from '@/utils/Logger'

/**
 * Service de chargement du catalogue partitionné pour l'architecture V2
 * 
 * STRUCTURE CATALOGUE :
 * - Index principal : public/catalog/index.json
 * - Fichiers par catégorie : public/catalog/{category}.json
 * - Format unifié pour IA OpenAI
 */

interface CatalogProduct {
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

interface PartitionedCatalog {
  [category: string]: CatalogProduct[]
}

interface CatalogIndex {
  version: string
  generatedAt: string
  totalProducts: number
  categories: Array<{
    name: string
    count: number
    file: string
  }>
  problemMapping: {
    [problem: string]: string[]
  }
}

export class CatalogLoaderV2 {
  private static logger = Logger.getInstance('CatalogLoaderV2')
  private static cache: PartitionedCatalog | null = null
  private static lastLoadTime = 0
  private static readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes

  /**
   * Charger le catalogue complet partitionné par catégories
   */
  static async loadPartitionedCatalog(): Promise<PartitionedCatalog> {
    // Vérifier cache
    if (this.cache && (Date.now() - this.lastLoadTime) < this.CACHE_TTL) {
      this.logger.debug('Catalogue chargé depuis le cache')
      return this.cache
    }

    try {
      this.logger.info('🔄 Chargement catalogue partitionné V2')

      // Charger l'index principal - Approche hybride pour Vercel
      let indexContent: string
      let index: CatalogIndex

      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        // En production/Vercel : utiliser fetch pour accéder aux fichiers statiques
        this.logger.debug('📡 Chargement catalogue via fetch (production)')
        const indexResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/catalog/index.json`)
        if (!indexResponse.ok) {
          throw new Error(`Erreur HTTP ${indexResponse.status} lors du chargement de l'index`)
        }
        indexContent = await indexResponse.text()
      } else {
        // En développement : utiliser fs
        this.logger.debug('📁 Chargement catalogue via fs (développement)')
        const catalogPath = path.join(process.cwd(), 'public', 'catalog')
        const indexPath = path.join(catalogPath, 'index.json')
        indexContent = await fs.readFile(indexPath, 'utf-8')
      }

      index = JSON.parse(indexContent)

      this.logger.info('📋 Index catalogue chargé', {
        version: index.version,
        totalProducts: index.totalProducts,
        categories: index.categories.length
      })

      // Charger chaque catégorie
      const partitionedCatalog: PartitionedCatalog = {}

      for (const category of index.categories) {
        try {
          let categoryContent: string

          if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
            // En production/Vercel : utiliser fetch
            const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/catalog/${category.file}`)
            if (!categoryResponse.ok) {
              throw new Error(`Erreur HTTP ${categoryResponse.status} pour ${category.file}`)
            }
            categoryContent = await categoryResponse.text()
          } else {
            // En développement : utiliser fs
            const catalogPath = path.join(process.cwd(), 'public', 'catalog')
            const categoryPath = path.join(catalogPath, category.file)
            categoryContent = await fs.readFile(categoryPath, 'utf-8')
          }

          const categoryData = JSON.parse(categoryContent)

          // Normaliser les produits pour l'IA
          const normalizedProducts = categoryData.products.map((product: any) => ({
            catalogId: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            price: product.price,
            targetSkinTypes: product.skinTypes || [],
            benefits: product.benefits || [],
            activeIngredients: product.activeIngredients || [],
            applicationTiming: this.inferApplicationTiming(product),
            targetZones: this.inferTargetZones(product),
            restrictions: this.inferRestrictions(product)
          }))

          partitionedCatalog[category.name] = normalizedProducts

          this.logger.debug(`✅ Catégorie ${category.name} chargée`, {
            products: normalizedProducts.length
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
          this.logger.error(`❌ Erreur chargement catégorie ${category.name}`, {
            error: errorMessage
          })
          // Continuer avec les autres catégories
        }
      }

      // Mettre en cache
      this.cache = partitionedCatalog
      this.lastLoadTime = Date.now()

      const totalLoaded = Object.values(partitionedCatalog).reduce(
        (total, products) => total + products.length, 0
      )

      this.logger.info('✅ Catalogue V2 chargé avec succès', {
        categories: Object.keys(partitionedCatalog).length,
        totalProducts: totalLoaded,
        cacheExpiry: new Date(this.lastLoadTime + this.CACHE_TTL).toISOString()
      })

      return partitionedCatalog

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      this.logger.error('❌ Erreur critique chargement catalogue', {
        error: errorMessage
      })
      throw new Error(`Impossible de charger le catalogue: ${errorMessage}`)
    }
  }

  /**
   * Charger une catégorie spécifique
   */
  static async loadCategory(categoryName: string): Promise<CatalogProduct[]> {
    const fullCatalog = await this.loadPartitionedCatalog()
    
    if (!fullCatalog[categoryName]) {
      this.logger.warn(`Catégorie ${categoryName} non trouvée`)
      return []
    }

    return fullCatalog[categoryName]
  }

  /**
   * Rechercher des produits par critères
   */
  static async searchProducts(criteria: {
    categories?: string[]
    skinTypes?: string[]
    problems?: string[]
    maxPrice?: number
    minPrice?: number
  }): Promise<CatalogProduct[]> {
    const catalog = await this.loadPartitionedCatalog()
    let results: CatalogProduct[] = []

    // Filtrer par catégories
    const categoriesToSearch = criteria.categories || Object.keys(catalog)
    
    for (const category of categoriesToSearch) {
      if (catalog[category]) {
        results.push(...catalog[category])
      }
    }

    // Filtrer par type de peau
    if (criteria.skinTypes?.length) {
      results = results.filter(product => 
        criteria.skinTypes!.some(skinType => 
          product.targetSkinTypes.some(target => 
            target.toLowerCase().includes(skinType.toLowerCase())
          )
        )
      )
    }

    // Filtrer par prix
    if (criteria.maxPrice !== undefined) {
      results = results.filter(product => product.price <= criteria.maxPrice!)
    }

    if (criteria.minPrice !== undefined) {
      results = results.filter(product => product.price >= criteria.minPrice!)
    }

    this.logger.debug('🔍 Recherche produits', {
      criteria,
      resultsCount: results.length
    })

    return results
  }

  /**
   * Obtenir les statistiques du catalogue
   */
  static async getCatalogStats(): Promise<{
    totalProducts: number
    categoriesCount: number
    averagePrice: number
    priceRange: { min: number; max: number }
    topBrands: Array<{ brand: string; count: number }>
  }> {
    const catalog = await this.loadPartitionedCatalog()
    
    const allProducts = Object.values(catalog).flat()
    const prices = allProducts.map(p => p.price)
    
    // Compter les marques
    const brandCounts = new Map<string, number>()
    allProducts.forEach(product => {
      const count = brandCounts.get(product.brand) || 0
      brandCounts.set(product.brand, count + 1)
    })

    const topBrands = Array.from(brandCounts.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalProducts: allProducts.length,
      categoriesCount: Object.keys(catalog).length,
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      topBrands
    }
  }

  /**
   * Invalider le cache
   */
  static invalidateCache(): void {
    this.cache = null
    this.lastLoadTime = 0
    this.logger.info('🗑️ Cache catalogue invalidé')
  }

  /**
   * Inférer le timing d'application depuis les données produit
   */
  private static inferApplicationTiming(product: any): string {
    const name = product.name.toLowerCase()
    const benefits = (product.benefits || []).join(' ').toLowerCase()
    const ingredients = (product.activeIngredients || []).join(' ').toLowerCase()

    // SPF = matin uniquement
    if (name.includes('spf') || name.includes('solaire') || product.category === 'sunscreen') {
      return 'morning'
    }

    // Actifs photosensibilisants = soir
    if (ingredients.includes('rétinol') || ingredients.includes('aha') || 
        ingredients.includes('bha') || ingredients.includes('acide')) {
      return 'evening'
    }

    // Nettoyants et hydratants = matin et soir
    if (product.category === 'cleanser' || product.category === 'moisturizer') {
      return 'both'
    }

    // Masques et traitements = hebdomadaire
    if (product.category === 'mask' || name.includes('masque')) {
      return 'weekly'
    }

    // Par défaut
    return 'both'
  }

  /**
   * Inférer les zones cibles depuis les données produit
   */
  private static inferTargetZones(product: any): string[] {
    const category = product.category
    const name = product.name.toLowerCase()

    if (category === 'eye-care' || name.includes('contour') || name.includes('yeux')) {
      return ['contour-yeux']
    }

    if (category === 'lip-care' || name.includes('lèvre')) {
      return ['lèvres']
    }

    if (name.includes('zone t') || name.includes('nez')) {
      return ['zone-t', 'nez']
    }

    // Par défaut = visage entier
    return ['visage-entier']
  }

  /**
   * Inférer les restrictions depuis les données produit
   */
  private static inferRestrictions(product: any): string[] {
    const restrictions: string[] = []
    const ingredients = (product.activeIngredients || []).join(' ').toLowerCase()
    const name = product.name.toLowerCase()

    // Actifs forts
    if (ingredients.includes('rétinol')) {
      restrictions.push('Éviter contour des yeux', 'Utiliser protection solaire')
    }

    if (ingredients.includes('aha') || ingredients.includes('bha')) {
      restrictions.push('Protection solaire obligatoire', 'Introduction progressive')
    }

    // Produits spécifiques zones
    if (product.category === 'eye-care') {
      restrictions.push('Contour des yeux uniquement')
    }

    return restrictions
  }
}
