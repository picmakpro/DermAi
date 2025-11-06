/**
 * PHASE 1 : Script de migration taxonomie careType V2
 * 
 * Migre les 110 produits vers 10 careTypes spécialisés
 * 
 * Étape 1 : Mapper category → careType initial
 * Étape 2 : Reclassifier selon ingrédients actifs
 * 
 * Durée : ~10 min
 */

import * as fs from 'fs'
import * as path from 'path'

// Types
type CareTypeV2 = 
  | 'nettoyage'
  | 'tonification'
  | 'hydratation'
  | 'protection'
  | 'exfoliation'
  | 'masque'
  | 'anti-age'
  | 'eclat'
  | 'traitement-cible'
  | 'apaisement'

interface Product {
  catalogId?: string
  id?: string
  name: string
  brand: string
  category: string
  careType?: CareTypeV2
  activeIngredients?: string[]
  targetConcerns?: string[]
  skinTypes?: string[]
  [key: string]: any
}

// Mapping category → careType de base
const CATEGORY_TO_CARETYPE: Record<string, CareTypeV2> = {
  'cleanser': 'nettoyage',
  'toner': 'tonification',
  'serum': 'traitement-cible',  // Par défaut, sera affiné
  'treatment': 'traitement-cible',
  'moisturizer': 'hydratation',
  'sunscreen': 'protection',
  'exfoliant': 'exfoliation',
  'mask': 'masque',
  'balm': 'apaisement',  // Baumes = souvent apaisants
  'oil': 'hydratation',
  'face-oil': 'hydratation',
  'eye-care': 'hydratation',
  'lip-care': 'apaisement',
  'mist': 'tonification',
  'primer': 'protection'
}

// Ingrédients par type
const ANTI_AGE_INGREDIENTS = [
  'retinol',
  'retinoid',
  'tretinoin',
  'adapalene',
  'peptide',
  'collagen',
  'bakuchiol',
  'age',
  'anti-age',
  'rides',
  'wrinkle',
  'firmness',
  'fermeté'
]

const ECLAT_INGREDIENTS = [
  'vitamin c',
  'vitamine c',
  'ascorbic',
  'kojic',
  'arbutin',
  'tranexamic',
  'brighten',
  'éclaircissant',
  'hyperpigment',
  'dark spot',
  'tache'
]

const TRAITEMENT_CIBLE_INGREDIENTS = [
  'niacinamide',
  'azelaic',
  'azélaïque',
  'salicylic',
  'benzoyl',
  'peroxide',
  'zinc',
  'acne',
  'acné',
  'pore',
  'sebum',
  'sébum'
]

const APAISEMENT_INGREDIENTS = [
  'cica',
  'centella',
  'aloe',
  'panthenol',
  'panthénol',
  'madecassoside',
  'soothing',
  'apaisant',
  'calming',
  'sensitive',
  'sensible',
  'redness',
  'rougeur'
]

/**
 * Détermine le careType précis basé sur les ingrédients
 */
function determineCareType(product: Product): CareTypeV2 {
  // 1. Mapping de base par category
  let baseType = CATEGORY_TO_CARETYPE[product.category] || 'traitement-cible'
  
  // Si pas serum/treatment, garder le type de base
  if (!['serum', 'treatment'].includes(product.category)) {
    return baseType
  }
  
  // 2. Pour serum/treatment, affiner selon ingrédients
  const activeIngredients = (product.activeIngredients || []).join(' ').toLowerCase()
  const concerns = (product.targetConcerns || []).join(' ').toLowerCase()
  const skinTypes = (product.skinTypes || []).join(' ').toLowerCase()
  const name = product.name.toLowerCase()
  const combined = activeIngredients + ' ' + concerns + ' ' + skinTypes + ' ' + name
  
  // Anti-âge (priorité haute)
  if (ANTI_AGE_INGREDIENTS.some(ing => combined.includes(ing))) {
    return 'anti-age'
  }
  
  // Éclat
  if (ECLAT_INGREDIENTS.some(ing => combined.includes(ing))) {
    return 'eclat'
  }
  
  // Apaisement
  if (APAISEMENT_INGREDIENTS.some(ing => combined.includes(ing))) {
    return 'apaisement'
  }
  
  // Traitement ciblé (défaut pour serum/treatment)
  if (TRAITEMENT_CIBLE_INGREDIENTS.some(ing => combined.includes(ing))) {
    return 'traitement-cible'
  }
  
  // Défaut : traitement-cible
  return 'traitement-cible'
}

/**
 * Migre un produit vers V2
 */
function migrateProduct(product: Product): Product {
  return {
    ...product,
    catalogId: product.catalogId || product.id || 'unknown',
    careType: determineCareType(product)
  }
}

/**
 * FONCTION PRINCIPALE
 */
async function main() {
  console.log('🚀 PHASE 1 : Migration taxonomie careType V2 (6 → 10 types)\n')
  
  // Chemins fichiers
  const inputPath = path.join(process.cwd(), 'src/data/enrichedCatalogV2.json')
  const outputPath = path.join(process.cwd(), 'src/data/enrichedCatalogV3.json')
  
  // Vérifier input existe
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Fichier introuvable: ${inputPath}`)
    process.exit(1)
  }
  
  // Charger catalogue V2
  console.log(`📥 Chargement catalogue : ${inputPath}`)
  const rawData = fs.readFileSync(inputPath, 'utf-8')
  const products: Product[] = JSON.parse(rawData)
  
  console.log(`✅ ${products.length} produits chargés\n`)
  
  // Migrer chaque produit
  console.log('🔄 Migration en cours...\n')
  
  const migratedProducts: Product[] = []
  const stats: Record<CareTypeV2, number> = {
    'nettoyage': 0,
    'tonification': 0,
    'hydratation': 0,
    'protection': 0,
    'exfoliation': 0,
    'masque': 0,
    'anti-age': 0,
    'eclat': 0,
    'traitement-cible': 0,
    'apaisement': 0
  }
  
  const samples: Record<string, string[]> = {}
  
  products.forEach((product, index) => {
    const migrated = migrateProduct(product)
    migratedProducts.push(migrated)
    
    // Stats
    const careType = migrated.careType!
    stats[careType]++
    
    // Échantillons pour review
    if (!samples[careType]) {
      samples[careType] = []
    }
    if (samples[careType].length < 3) {
      samples[careType].push(`${migrated.brand} - ${migrated.name}`)
    }
  })
  
  // Sauvegarder enrichedCatalogV3.json
  console.log(`💾 Sauvegarde : ${outputPath}`)
  fs.writeFileSync(outputPath, JSON.stringify(migratedProducts, null, 2), 'utf-8')
  
  // Rapport final
  console.log('\n✅ MIGRATION TERMINÉE\n')
  console.log('📊 DISTRIBUTION FINALE careTypes :\n')
  
  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1])
  
  sortedStats.forEach(([type, count]) => {
    const percentage = Math.round(count / products.length * 100)
    console.log(`   ✓ ${type}: ${count} produits (${percentage}%)`)
    if (samples[type] && samples[type].length > 0) {
      samples[type].forEach(sample => console.log(`      - ${sample}`))
    }
    console.log('')
  })
  
  console.log(`\n📁 Fichier généré : ${outputPath}`)
  console.log('\n🎯 PROCHAINES ÉTAPES :')
  console.log('   1. Review manuel des classifications')
  console.log('   2. Mettre à jour ProductDatabaseLoader pour charger enrichedCatalogV3.json')
  console.log('   3. Mettre à jour prompts IA (documenter nouveaux careTypes)')
  console.log('   4. Tests unitaires ProductMatcher')
  console.log('   5. Tests E2E (0 régression)')
}

// Exécution
main().catch(error => {
  console.error('❌ ERREUR :', error)
  process.exit(1)
})
