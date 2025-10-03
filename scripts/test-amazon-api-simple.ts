/**
 * PHASE 4 : Test Simple Amazon Product Advertising API
 * 
 * Script de test pour vérifier que l'API Amazon fonctionne correctement
 */

import { config } from 'dotenv'
import * as path from 'path'

// Charger .env.local
config({ path: path.join(process.cwd(), '.env.local') })

// Vérifier que les variables sont définies
const ACCESS_KEY = process.env.AMAZON_ACCESS_KEY_ID
const SECRET_KEY = process.env.AMAZON_SECRET_ACCESS_KEY
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG

if (!ACCESS_KEY || !SECRET_KEY || !PARTNER_TAG) {
  console.error('\n❌ ERREUR : Variables Amazon manquantes dans .env.local\n')
  console.error('Ajoute ces lignes dans .env.local :')
  console.error('AMAZON_ACCESS_KEY_ID=ton_access_key')
  console.error('AMAZON_SECRET_ACCESS_KEY=ton_secret_key')
  console.error('AMAZON_PARTNER_TAG=dermai-XXX\n')
  process.exit(1)
}

// Importer librairie amazon-paapi
let amazonPaapi: any
try {
  amazonPaapi = require('amazon-paapi')
} catch (error) {
  console.error('\n❌ ERREUR : Librairie amazon-paapi manquante\n')
  console.error('Installe-la avec : npm install amazon-paapi\n')
  process.exit(1)
}

// Configuration commune
const commonParameters = {
  AccessKey: ACCESS_KEY,
  SecretKey: SECRET_KEY,
  PartnerTag: PARTNER_TAG,
  PartnerType: 'Associates',
  Marketplace: 'www.amazon.fr'
}

async function searchProducts(keyword: string) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🔍 Recherche : "${keyword}"`)
  console.log('='.repeat(80) + '\n')

  try {
    const response = await amazonPaapi.SearchItems(commonParameters, {
      Keywords: keyword,
      SearchIndex: 'Beauty',
      ItemCount: 5, // 5 produits pour le test
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ByLineInfo',
        'Offers.Listings.Price'
      ]
    })

    const items = response.SearchResult.Items || []
    console.log(`✅ ${items.length} produits trouvés\n`)

    items.forEach((item: any, index: number) => {
      console.log(`📦 PRODUIT ${index + 1}`)
      console.log(`   Nom : ${item.ItemInfo.Title.DisplayValue}`)
      console.log(`   Marque : ${item.ItemInfo.ByLineInfo?.Brand?.DisplayValue || 'N/A'}`)
      console.log(`   ASIN : ${item.ASIN}`)
      console.log(`   Prix : ${item.Offers?.Listings?.[0]?.Price?.DisplayAmount || 'N/A'}`)
      console.log(`   Image : ${item.Images?.Primary?.Large?.URL?.substring(0, 50)}...`)
      console.log(`   🔗 Lien affiliation : https://amazon.fr/dp/${item.ASIN}/?tag=${PARTNER_TAG}`)
      console.log('')
    })

    return items.length
  } catch (error: any) {
    console.error('❌ ERREUR API :', error.message)
    
    if (error.message.includes('access denied') || error.message.includes('InvalidSignature')) {
      console.error('\n⚠️ Problème d\'authentification :')
      console.error('   - Vérifie tes Access Key / Secret Key dans .env.local')
      console.error('   - Vérifie que l\'accès API est approuvé sur https://partenaires.amazon.fr/\n')
    }
    
    return 0
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗')
  console.log('║                                                                            ║')
  console.log('║                   🧪 TEST AMAZON PRODUCT ADVERTISING API                   ║')
  console.log('║                                                                            ║')
  console.log('╚════════════════════════════════════════════════════════════════════════════╝')

  console.log('\n📋 Configuration :')
  console.log(`   Access Key : ${ACCESS_KEY?.substring(0, 10)}...`)
  console.log(`   Partner Tag : ${PARTNER_TAG}`)
  console.log(`   Marketplace : www.amazon.fr`)

  // Tests sur 3 catégories différentes
  const tests = [
    { keyword: 'crème hydratante CeraVe', category: 'Hydratation' },
    { keyword: 'sérum niacinamide', category: 'Traitement ciblé' },
    { keyword: 'crème solaire visage SPF 50', category: 'Protection' }
  ]

  let totalProducts = 0

  for (const test of tests) {
    const count = await searchProducts(test.keyword)
    totalProducts += count

    // Pause entre requêtes (rate limiting Amazon)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Résumé
  console.log('\n' + '='.repeat(80))
  console.log('📊 RÉSUMÉ DES TESTS\n')
  console.log(`   Total produits récupérés : ${totalProducts}`)
  console.log(`   Tests réussis : ${tests.length}/${tests.length}`)
  
  if (totalProducts > 0) {
    console.log('\n✅ API AMAZON FONCTIONNE CORRECTEMENT !')
    console.log('\n🎯 Prochaine étape : Lancer import complet (scripts/import-amazon-products.ts)')
  } else {
    console.log('\n❌ API AMAZON NE FONCTIONNE PAS')
    console.log('\n⚠️ Vérifie :')
    console.log('   1. Accès API approuvé sur https://partenaires.amazon.fr/')
    console.log('   2. Credentials corrects dans .env.local')
    console.log('   3. Tag partenaire valide')
  }
  
  console.log('\n' + '='.repeat(80) + '\n')
}

// Exécution
runTests()
  .then(() => {
    console.log('✅ Test terminé\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

