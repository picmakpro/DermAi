/**
 * PHASE 2 : Script de migration 110 produits → Supabase
 * 
 * Migre enrichedCatalogV3.json vers table PostgreSQL `products`
 * 
 * Prérequis :
 * - Projet Supabase créé
 * - Table `products` créée (via 20251003_create_products_table.sql)
 * - Variables .env.local configurées :
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 * 
 * Durée : ~2 min
 */

import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Charger .env.local
config({ path: path.join(process.cwd(), '.env.local') })

// Types
interface ProductJSON {
  catalogId?: string
  id?: string
  name: string
  brand: string
  category: string
  careType: string
  price: number
  currency?: string
  imageUrl?: string
  affiliateLink?: string
  activeIngredients?: string[]
  targetConcerns?: string[]
  skinTypes?: string[]
  benefits?: string[]
  restrictedZones?: string[]
  targetZones?: string[]
  [key: string]: any
}

interface ProductDB {
  catalog_id: string
  name: string
  brand: string
  category: string
  care_type: string
  target_skin_types: string[]
  target_concerns: string[]
  active_ingredients: string[]
  allergens: string[]
  ingredients: string[]
  target_zones: string[]
  restricted_zones: string[]
  suitable_sensitive_areas: boolean
  warnings: string | null
  comedogenic: boolean
  irritant: boolean
  photosensitizing: boolean
  pregnancy_safe: boolean
  price: number
  popularity: number
  dermatologist_rating: number
  application_timing: string
  image_url: string | null
  retailers: any[]
  source: string
  status: string
  metadata: any
}

// Mapping skinTypes français → anglais
const SKIN_TYPE_MAPPING: Record<string, string> = {
  'sèche': 'dry',
  'très sèche': 'dry',
  'grasse': 'oily',
  'mixte': 'combination',
  'sensible': 'sensitive',
  'normale': 'normal',
  'acnéique': 'acne-prone',
  'mature': 'mature',
  'tous types': 'normal',
  'crevassée': 'dry',
  'irritée': 'sensitive',
  'massage': 'normal'
}

/**
 * Normalise skinTypes français → anglais
 */
function normalizeSkinTypes(skinTypes?: string[]): string[] {
  if (!skinTypes || skinTypes.length === 0) {
    return ['normal']  // Défaut si manquant
  }
  
  const normalized = skinTypes
    .map(type => {
      const lower = type.toLowerCase().trim()
      return SKIN_TYPE_MAPPING[lower] || 'normal'
    })
    .filter((value, index, self) => self.indexOf(value) === index)  // Unique
  
  return normalized.length > 0 ? normalized : ['normal']
}

/**
 * Transforme produit JSON → format Supabase
 */
function transformProduct(product: ProductJSON): ProductDB {
  return {
    catalog_id: product.catalogId || product.id || 'unknown',
    name: product.name,
    brand: product.brand,
    category: product.category,
    care_type: product.careType,
    target_skin_types: normalizeSkinTypes(product.skinTypes),
    target_concerns: product.targetConcerns || [],
    active_ingredients: product.activeIngredients || [],
    allergens: [],  // Sera enrichi Phase 3
    ingredients: [],  // Sera enrichi Phase 3
    target_zones: product.targetZones || ['visage entier'],
    restricted_zones: product.restrictedZones || [],
    suitable_sensitive_areas: false,
    warnings: null,
    comedogenic: false,
    irritant: false,
    photosensitizing: product.photosensitizing || false,
    pregnancy_safe: product.pregnancySafe !== false,  // true par défaut
    price: product.price,
    popularity: 50,  // Défaut
    dermatologist_rating: 70,  // Défaut
    application_timing: 'both',  // Défaut
    image_url: product.imageUrl || null,
    retailers: product.affiliateLink ? [{
      name: 'Amazon',
      url: product.affiliateLink,
      price: product.price
    }] : [],
    source: 'manual',
    status: 'active',
    metadata: {
      benefits: product.benefits || [],
      currency: product.currency || 'EUR'
    }
  }
}

/**
 * FONCTION PRINCIPALE
 */
async function main() {
  console.log('🚀 PHASE 2 : Migration 110 produits → Supabase\n')
  
  // ========== VÉRIFICATIONS ==========
  
  // Vérifier variables environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERREUR : Variables Supabase manquantes !')
    console.error('\nVérifier .env.local :')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  console.log(`✅ Supabase URL : ${supabaseUrl.substring(0, 30)}...`)
  console.log(`✅ Service Key : ${supabaseKey.substring(0, 20)}...\n`)
  
  // Charger catalogue V3
  const catalogPath = path.join(process.cwd(), 'src/data/enrichedCatalogV3.json')
  
  if (!fs.existsSync(catalogPath)) {
    console.error(`❌ Fichier introuvable : ${catalogPath}`)
    process.exit(1)
  }
  
  console.log(`📥 Chargement catalogue : ${catalogPath}`)
  const rawData = fs.readFileSync(catalogPath, 'utf-8')
  const products: ProductJSON[] = JSON.parse(rawData)
  
  console.log(`✅ ${products.length} produits chargés\n`)
  
  // ========== CONNEXION SUPABASE ==========
  
  console.log('🔌 Connexion à Supabase...')
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  // Test connexion
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('❌ Erreur connexion Supabase :', countError)
    console.error('\nVérifier :')
    console.error('  1. Table `products` existe (SQL Editor)')
    console.error('  2. RLS configuré correctement')
    console.error('  3. Service role key est correcte')
    process.exit(1)
  }
  
  console.log(`✅ Connexion réussie (${count || 0} produits existants)\n`)
  
  // ========== MIGRATION ==========
  
  console.log('🔄 Migration en cours...\n')
  
  const stats = {
    success: 0,
    skipped: 0,
    errors: 0
  }
  
  const errors: Array<{ catalogId: string; error: string }> = []
  
  for (const [index, product] of products.entries()) {
    const catalogId = product.catalogId || product.id || `unknown_${index}`
    
    try {
      // Transformer produit
      const dbProduct = transformProduct(product)
      
      // Upsert (insert ou update si existe)
      const { error } = await supabase
        .from('products')
        .upsert(dbProduct, {
          onConflict: 'catalog_id'
        })
      
      if (error) {
        stats.errors++
        errors.push({ catalogId, error: error.message })
        console.error(`❌ [${index + 1}/${products.length}] Erreur : ${catalogId}`)
        console.error(`   ${error.message}`)
      } else {
        stats.success++
        if ((index + 1) % 10 === 0) {
          console.log(`✓ [${index + 1}/${products.length}] ${stats.success} produits migrés`)
        }
      }
    } catch (err: any) {
      stats.errors++
      errors.push({ catalogId, error: err.message })
      console.error(`❌ [${index + 1}/${products.length}] Exception : ${catalogId}`)
      console.error(`   ${err.message}`)
    }
  }
  
  // ========== RAPPORT FINAL ==========
  
  console.log('\n✅ MIGRATION TERMINÉE\n')
  console.log('📊 STATISTIQUES :')
  console.log(`   - Succès : ${stats.success} (${Math.round(stats.success / products.length * 100)}%)`)
  console.log(`   - Erreurs : ${stats.errors} (${Math.round(stats.errors / products.length * 100)}%)`)
  console.log(`   - TOTAL : ${products.length} produits`)
  
  if (errors.length > 0) {
    console.log(`\n⚠️ ERREURS DÉTAILLÉES (${errors.length}) :`)
    errors.forEach(({ catalogId, error }) => {
      console.log(`   - ${catalogId}: ${error}`)
    })
  }
  
  // ========== VÉRIFICATION FINALE ==========
  
  console.log('\n🔍 Vérification finale...')
  
  const { count: finalCount, error: finalError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  
  if (finalError) {
    console.error('❌ Erreur vérification :', finalError)
  } else {
    console.log(`✅ ${finalCount} produits dans Supabase`)
    
    if (finalCount !== stats.success) {
      console.warn(`⚠️ Écart détecté : ${stats.success} migrés vs ${finalCount} en base`)
    }
  }
  
  // ========== DISTRIBUTION careTypes ==========
  
  const { data: distribution, error: distError } = await supabase
    .from('products')
    .select('care_type')
  
  if (!distError && distribution) {
    const careTypeCounts = distribution.reduce((acc, p) => {
      acc[p.care_type] = (acc[p.care_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('\n📈 DISTRIBUTION careTypes :')
    Object.entries(careTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`)
      })
  }
  
  console.log('\n🎯 PROCHAINES ÉTAPES :')
  console.log('   1. Vérifier sur Supabase Table Editor')
  console.log('   2. Créer ProductDatabaseLoaderV2')
  console.log('   3. Implémenter feature flag')
  console.log('   4. Tests E2E (0 régression)')
}

// Exécution
main().catch(error => {
  console.error('\n❌ ERREUR FATALE :', error)
  process.exit(1)
})

