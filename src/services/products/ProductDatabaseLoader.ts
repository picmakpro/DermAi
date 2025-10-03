/**
 * PHASE D1.3 : ProductDatabaseLoader
 * 
 * Loader de la database de produits avec cache singleton et validation stricte.
 * Charge enrichedCatalogV2.json, valide avec Zod et crée les index optimisés.
 * 
 * Fonctionnalités :
 * - Chargement avec validation Zod stricte (EnrichedProductSchema)
 * - Cache singleton en mémoire (pattern singleton)
 * - Index optimisés : byCategory et byCareType (O(1) lookup)
 * - Gestion erreurs gracieuse avec logs détaillés
 * - Méthode clearCache() pour tests
 * 
 * Status : ✅ D1.3 IMPLÉMENTÉ
 * 
 * Référence : docs/plan-execution-v2-5/SPRINT-D-REFONTE-HYBRIDE-EXECUTION.md (D1.3)
 */

import {
  EnrichedProduct,
  EnrichedProductSchema,
  ProductDatabase
} from '@/data/productsDatabase'

/**
 * Loader statique de la database produits avec cache singleton
 * 
 * Usage :
 * ```typescript
 * const db = await ProductDatabaseLoader.load()
 * const cleansers = db.byCareType.get('nettoyage')
 * ```
 */
export class ProductDatabaseLoader {
  private static cache: ProductDatabase | null = null

  /**
   * Charge la database de produits avec index optimisés
   * Utilise un cache singleton pour éviter rechargements
   * 
   * @returns ProductDatabase avec 110 produits indexés
   * @throws Error si fichier introuvable ou validation échoue
   */
  static async load(): Promise<ProductDatabase> {
    // Cache hit : retourner database déjà chargée
    if (this.cache) {
      console.log('[ProductDatabaseLoader] 📦 Cache hit - Database déjà chargée')
      return this.cache
    }

    console.log('[ProductDatabaseLoader] 🔄 Loading product database...')
    const startTime = Date.now()

    try {
      // ========== CHARGEMENT CATALOGUE ==========
      // ✅ PHASE 1 : Utilise enrichedCatalogV3.json avec careType V2 (10 types)
      const catalogData = await import('@/data/enrichedCatalogV3.json')
      const rawProducts = catalogData.default || []

      if (!Array.isArray(rawProducts)) {
        throw new Error('INVALID_CATALOG_FORMAT: enrichedCatalogV2.json doit être un array')
      }

      console.log(`[ProductDatabaseLoader] 📥 ${rawProducts.length} produits à valider`)

      // ========== VALIDATION ZOD ==========
      const validatedProducts: EnrichedProduct[] = []
      const errors: Array<{ catalogId: string; error: string }> = []

      for (const product of rawProducts) {
        try {
          const validated = EnrichedProductSchema.parse(product)
          validatedProducts.push(validated)
        } catch (validationError: any) {
          console.warn(
            `[ProductDatabaseLoader] ⚠️ Produit invalide:`,
            product.catalogId || 'unknown',
            validationError.errors?.[0]?.message || validationError.message
          )
          errors.push({
            catalogId: product.catalogId || 'unknown',
            error: validationError.errors?.[0]?.message || 'Unknown validation error'
          })
        }
      }

      console.log(`[ProductDatabaseLoader] ✅ ${validatedProducts.length} produits validés`)

      if (errors.length > 0) {
        console.warn(
          `[ProductDatabaseLoader] ⚠️ ${errors.length} produits échoués (${((errors.length / rawProducts.length) * 100).toFixed(1)}%)`
        )
      }

      if (validatedProducts.length === 0) {
        throw new Error(
          'PRODUCT_DATABASE_EMPTY: Aucun produit valide après validation Zod'
        )
      }

      // ========== CRÉATION INDEX PAR CATEGORY ==========
      const byCategory = new Map<string, EnrichedProduct[]>()

      for (const product of validatedProducts) {
        const existing = byCategory.get(product.category) || []
        byCategory.set(product.category, [...existing, product])
      }

      console.log(
        `[ProductDatabaseLoader] 🗂️ Index byCategory créé: ${byCategory.size} categories`
      )

      // ========== CRÉATION INDEX PAR CARETYPE (PRIORITAIRE) ==========
      const byCareType = new Map<string, EnrichedProduct[]>()

      for (const product of validatedProducts) {
        const existing = byCareType.get(product.careType) || []
        byCareType.set(product.careType, [...existing, product])
      }

      console.log(
        `[ProductDatabaseLoader] 🎯 Index byCareType créé: ${byCareType.size} careTypes`
      )

      // Afficher répartition careType
      const careTypeStats: Record<string, number> = {}
      for (const [careType, products] of byCareType.entries()) {
        careTypeStats[careType] = products.length
      }
      console.log('[ProductDatabaseLoader] 📊 Répartition careType:', careTypeStats)

      // ========== ASSEMBLAGE FINALE ==========
      this.cache = {
        byCategory,
        byCareType,
        allProducts: validatedProducts
      }

      const duration = Date.now() - startTime
      console.log(
        `[ProductDatabaseLoader] ✅ Database chargée en ${duration}ms (${validatedProducts.length} produits)`
      )

      return this.cache
    } catch (error: any) {
      console.error('[ProductDatabaseLoader] ❌ Erreur chargement:', error.message)

      // Erreur critique : impossible de continuer
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error(
          'PRODUCT_DATABASE_NOT_FOUND: Fichier enrichedCatalogV2.json introuvable. ' +
            'Exécutez "node scripts/migrate-catalog-v2.js" pour générer le catalogue.'
        )
      }

      throw new Error(`PRODUCT_DATABASE_LOAD_FAILED: ${error.message}`)
    }
  }

  /**
   * Invalide le cache (pour tests unitaires)
   * Force le rechargement lors du prochain appel à load()
   */
  static clearCache(): void {
    console.log('[ProductDatabaseLoader] 🗑️ Cache invalidé')
    this.cache = null
  }

  /**
   * Retourne statistiques de la database (sans charger si pas en cache)
   * Utile pour monitoring
   */
  static getStats(): {
    loaded: boolean
    productCount?: number
    categoryCount?: number
    careTypeCount?: number
  } {
    if (!this.cache) {
      return { loaded: false }
    }

    return {
      loaded: true,
      productCount: this.cache.allProducts.length,
      categoryCount: this.cache.byCategory.size,
      careTypeCount: this.cache.byCareType.size
    }
  }
}

