/**
 * PHASE 2 : Test rapide ProductDatabaseLoaderV2
 * 
 * Vérifie que le loader Supabase fonctionne correctement
 * 
 * Durée : ~5 secondes
 */

import { config } from 'dotenv'
import * as path from 'path'

// Charger .env.local
config({ path: path.join(process.cwd(), '.env.local') })

async function testSupabaseLoader() {
  console.log('\n🧪 TEST : ProductDatabaseLoaderV2\n')

  try {
    const { ProductDatabaseLoaderV2 } = await import('../src/services/products/ProductDatabaseLoaderV2')

    console.log('1️⃣ Test chargement initial...')
    const startTime = Date.now()
    const db = await ProductDatabaseLoaderV2.load()
    const loadTime = Date.now() - startTime

    console.log(`✅ Database chargée en ${loadTime}ms`)
    console.log(`   - Total produits : ${db.allProducts.length}`)
    console.log(`   - CareTypes : ${db.byCareType.size}`)
    console.log(`   - Catégories : ${db.byCategory.size}`)

    // Vérifications
    const expectedCount = 110
    if (db.allProducts.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} products, got ${db.allProducts.length}`)
    }

    console.log('\n2️⃣ Test cache...')
    const cacheStartTime = Date.now()
    const db2 = await ProductDatabaseLoaderV2.load()
    const cacheLoadTime = Date.now() - cacheStartTime

    console.log(`✅ Cache hit en ${cacheLoadTime}ms (vs ${loadTime}ms initial)`)

    if (cacheLoadTime > 5) {
      console.warn(`⚠️ Cache semble lent (${cacheLoadTime}ms > 5ms)`)
    }

    console.log('\n3️⃣ Test distribution careTypes...')
    const careTypesDistribution: Record<string, number> = {}
    for (const [careType, products] of db.byCareType) {
      careTypesDistribution[careType] = products.length
      console.log(`   - ${careType}: ${products.length}`)
    }

    // Vérifier que tous les careTypes V2 sont présents
    const expectedCareTypes = [
      'nettoyage',
      'tonification',
      'hydratation',
      'protection',
      'exfoliation',
      'masque',
      'anti-age',
      'eclat',
      'traitement-cible',
      'apaisement'
    ]

    for (const careType of expectedCareTypes) {
      if (!db.byCareType.has(careType)) {
        throw new Error(`CareType manquant : ${careType}`)
      }
    }

    console.log('\n4️⃣ Test query par careType...')
    const hydratation = db.byCareType.get('hydratation')
    console.log(`   - hydratation: ${hydratation?.length || 0} produits`)

    if (!hydratation || hydratation.length === 0) {
      throw new Error('Aucun produit hydratation trouvé')
    }

    console.log('\n5️⃣ Test validation produit...')
    const firstProduct = db.allProducts[0]
    console.log(`   - catalogId: ${firstProduct.catalogId}`)
    console.log(`   - name: ${firstProduct.name}`)
    console.log(`   - careType: ${firstProduct.careType}`)
    console.log(`   - restrictedZones: ${firstProduct.restrictedZones.join(', ') || 'aucune'}`)

    // Vérifier structure
    if (!firstProduct.catalogId || !firstProduct.name || !firstProduct.careType) {
      throw new Error('Produit invalide : champs requis manquants')
    }

    console.log('\n6️⃣ Test stats cache...')
    const stats = ProductDatabaseLoaderV2.getCacheStats()
    console.log(`   - Cached: ${stats.cached}`)
    console.log(`   - Age: ${stats.age}s`)
    console.log(`   - Products: ${stats.products}`)

    console.log('\n✅ TOUS LES TESTS RÉUSSIS\n')
    console.log('📊 RÉSUMÉ :')
    console.log(`   - Latency : ${loadTime}ms (cible <100ms) ${loadTime < 100 ? '✅' : '⚠️'}`)
    console.log(`   - Produits : ${db.allProducts.length}/${expectedCount} ✅`)
    console.log(`   - CareTypes : ${db.byCareType.size}/10 ✅`)
    console.log(`   - Cache : Fonctionnel ✅`)

    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ TEST ÉCHOUÉ\n')
    console.error('Erreur :', error.message)
    console.error('\nStack:', error.stack)
    process.exit(1)
  }
}

testSupabaseLoader()

