/**
 * PHASE 2 : ProductDatabaseLoaderV2 - Supabase
 * 
 * Loader de la database de produits depuis Supabase PostgreSQL
 * Alternative scalable au loader V1 (JSON statique)
 * 
 * Fonctionnalités :
 * - Query Supabase avec filtres optimisés
 * - Cache singleton en mémoire (1h TTL)
 * - Index automatiques utilisés (12 index créés)
 * - Latency <100ms attendue
 * 
 * Status : ✅ PHASE 2 IMPLÉMENTÉ
 */

import { createClient } from '@supabase/supabase-js'
import {
  EnrichedProduct,
  EnrichedProductSchema,
  ProductDatabase
} from '@/data/productsDatabase'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Loader V2 de la database produits depuis Supabase
 * 
 * Usage :
 * ```typescript
 * const db = await ProductDatabaseLoaderV2.load()
 * const cleansers = db.byCareType.get('nettoyage')
 * ```
 */
export class ProductDatabaseLoaderV2 {
  private static cache: ProductDatabase | null = null
  private static cacheTimestamp: number = 0
  private static readonly CACHE_TTL = 3600000 // 1 heure en ms

  /**
   * Charge la database de produits depuis Supabase
   * Utilise un cache singleton avec TTL 1h
   * 
   * @param forceRefresh - Force le rechargement depuis Supabase
   * @returns ProductDatabase avec produits indexés
   * @throws Error si connexion Supabase échoue ou validation Zod échoue
   */
  static async load(forceRefresh = false): Promise<ProductDatabase> {
    const now = Date.now()
    
    // Cache hit : retourner database déjà chargée (si < 1h)
    if (
      !forceRefresh &&
      this.cache &&
      now - this.cacheTimestamp < this.CACHE_TTL
    ) {
      const cacheAge = Math.round((now - this.cacheTimestamp) / 1000)
      console.log(`[ProductDatabaseLoaderV2] 📦 Cache hit (age: ${cacheAge}s)`)
      return this.cache
    }

    console.log('[ProductDatabaseLoaderV2] 🔄 Loading from Supabase...')
    const startTime = Date.now()

    try {
      // ========== CONNEXION SUPABASE ==========
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('SUPABASE_CONFIG_MISSING: Variables Supabase non configurées')
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // ========== QUERY PRODUCTS ==========
      
      // Query optimisée : seulement produits actifs, triés par care_type
      // Index utilisé : idx_products_care_type_status
      const { data: rawProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('care_type', { ascending: true })
        .order('dermatologist_rating', { ascending: false })

      if (error) {
        throw new Error(`SUPABASE_QUERY_ERROR: ${error.message}`)
      }

      if (!rawProducts || rawProducts.length === 0) {
        throw new Error('NO_PRODUCTS_FOUND: Aucun produit actif dans Supabase')
      }

      const queryTime = Date.now() - startTime
      console.log(`[ProductDatabaseLoaderV2] ✅ Query: ${rawProducts.length} produits (${queryTime}ms)`)

      // ========== TRANSFORMATION SUPABASE → SCHEMA FRONTEND ==========
      
      const validatedProducts: EnrichedProduct[] = []
      const errors: Array<{ catalogId: string; error: string }> = []

      for (const product of rawProducts) {
        try {
          // Transformer snake_case (Supabase) → camelCase (Frontend)
          const transformed = this.transformSupabaseProduct(product)
          
          // Valider avec Zod
          const validated = EnrichedProductSchema.parse(transformed)
          validatedProducts.push(validated)
        } catch (validationError: any) {
          console.warn(
            `[ProductDatabaseLoaderV2] ⚠️ Produit invalide:`,
            product.catalog_id || 'unknown',
            validationError.errors?.[0]?.message || validationError.message
          )
          errors.push({
            catalogId: product.catalog_id || 'unknown',
            error: validationError.errors?.[0]?.message || 'Unknown validation error'
          })
        }
      }

      console.log(`[ProductDatabaseLoaderV2] ✅ ${validatedProducts.length} produits validés`)

      if (errors.length > 0) {
        console.warn(
          `[ProductDatabaseLoaderV2] ⚠️ ${errors.length} produits ignorés (validation failed)`
        )
      }

      // ========== CRÉATION INDEX ==========
      
      const database = this.createIndexes(validatedProducts)

      // ========== MISE À JOUR CACHE ==========
      
      this.cache = database
      this.cacheTimestamp = now

      const totalTime = Date.now() - startTime
      console.log(`[ProductDatabaseLoaderV2] ✅ Database loaded in ${totalTime}ms`)

      return database
    } catch (error: any) {
      console.error('[ProductDatabaseLoaderV2] ❌ Error:', error.message)
      throw error
    }
  }

  /**
   * Transforme un produit Supabase (snake_case) en format frontend (camelCase)
   */
  private static transformSupabaseProduct(product: any): any {
    return {
      catalogId: product.catalog_id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      careType: product.care_type,
      targetSkinTypes: product.target_skin_types || [],
      targetConcerns: product.target_concerns || [],
      activeIngredients: product.active_ingredients || [],
      allergens: product.allergens || [],
      price: product.price,
      popularity: product.popularity || 50,
      dermatologistRating: product.dermatologist_rating || 70,
      imageUrl: product.image_url,
      retailers: product.retailers || [],
      applicationTiming: product.application_timing || 'both',
      targetZones: product.target_zones || ['visage entier'],
      restrictedZones: product.restricted_zones || []
    }
  }

  /**
   * Crée les index optimisés (byCategory, byCareType)
   */
  private static createIndexes(products: EnrichedProduct[]): ProductDatabase {
    const byCategory = new Map<string, EnrichedProduct[]>()
    const byCareType = new Map<string, EnrichedProduct[]>()

    for (const product of products) {
      // Index by category
      if (!byCategory.has(product.category)) {
        byCategory.set(product.category, [])
      }
      byCategory.get(product.category)!.push(product)

      // Index by careType (prioritaire)
      if (!byCareType.has(product.careType)) {
        byCareType.set(product.careType, [])
      }
      byCareType.get(product.careType)!.push(product)
    }

    return {
      byCategory,
      byCareType,
      allProducts: products
    }
  }

  /**
   * Vide le cache (pour tests ou refresh manuel)
   */
  static clearCache(): void {
    this.cache = null
    this.cacheTimestamp = 0
    console.log('[ProductDatabaseLoaderV2] 🗑️ Cache cleared')
  }

  /**
   * Stats du cache actuel
   */
  static getCacheStats(): {
    cached: boolean
    age: number
    products: number
  } {
    const age = this.cacheTimestamp ? Date.now() - this.cacheTimestamp : 0
    return {
      cached: this.cache !== null,
      age: Math.round(age / 1000), // en secondes
      products: this.cache?.allProducts.length || 0
    }
  }
}

