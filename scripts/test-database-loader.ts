/**
 * Test manuel ProductDatabaseLoader
 * Validation : Chargement database + index + cache
 */

import { ProductDatabaseLoader } from '../src/services/products/ProductDatabaseLoader'

async function testDatabase() {
  console.log('🧪 TEST ProductDatabaseLoader\n')
  console.log('=' .repeat(60))

  try {
    // TEST 1 : Chargement initial
    console.log('\n📦 TEST 1 : Chargement initial')
    const db = await ProductDatabaseLoader.load()

    console.log('\n📊 Database Stats:')
    console.log(`   - Total products: ${db.allProducts.length}`)
    console.log(`   - Categories: ${db.byCategory.size}`)
    console.log(`   - CareTypes: ${db.byCareType.size}`)

    // TEST 2 : Index byCareType
    console.log('\n🎯 TEST 2 : Index byCareType')
    for (const [careType, products] of db.byCareType.entries()) {
      console.log(`   - ${careType}: ${products.length} produits`)
      if (products.length > 0) {
        console.log(`      Exemple: ${products[0].name} (${products[0].brand})`)
      }
    }

    // TEST 3 : Recherche par careType
    console.log('\n🔍 TEST 3 : Recherche par careType "nettoyage"')
    const nettoyage = db.byCareType.get('nettoyage') || []
    console.log(`   - ${nettoyage.length} produits trouvés`)
    nettoyage.slice(0, 3).forEach((p, i) => {
      console.log(
        `   ${i + 1}. ${p.name} - ${p.brand} (${p.price}€) - Score: ${p.dermatologistRating}`
      )
    })

    // TEST 4 : Cache hit
    console.log('\n♻️ TEST 4 : Cache hit (second load)')
    const db2 = await ProductDatabaseLoader.load()
    console.log(`   - Cache hit: ${db === db2 ? '✅ OUI' : '❌ NON'}`)

    // TEST 5 : Validation structure produit
    console.log('\n✅ TEST 5 : Validation structure produit')
    const sampleProduct = db.allProducts[0]
    console.log('   Champs présents:')
    console.log(`   - catalogId: ${sampleProduct.catalogId}`)
    console.log(`   - name: ${sampleProduct.name}`)
    console.log(`   - category: ${sampleProduct.category}`)
    console.log(`   - careType: ${sampleProduct.careType}`)
    console.log(`   - targetSkinTypes: ${sampleProduct.targetSkinTypes.join(', ')}`)
    console.log(`   - targetConcerns: ${sampleProduct.targetConcerns.join(', ')}`)
    console.log(`   - price: ${sampleProduct.price}€`)
    console.log(`   - dermatologistRating: ${sampleProduct.dermatologistRating}/100`)
    console.log(`   - popularity: ${sampleProduct.popularity}/100`)
    console.log(`   - applicationTiming: ${sampleProduct.applicationTiming}`)

    // TEST 6 : getStats()
    console.log('\n📈 TEST 6 : getStats()')
    const stats = ProductDatabaseLoader.getStats()
    console.log('   Stats:', JSON.stringify(stats, null, 2))

    console.log('\n' + '='.repeat(60))
    console.log('✅ TOUS LES TESTS RÉUSSIS !\n')
  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

testDatabase()

