/**
 * PHASE 0 : Script d'enrichissement restrictedZones
 * 
 * Enrichit les 110 produits existants avec le champ restrictedZones
 * pour éviter les anomalies de sélection (produits inadaptés lèvres/yeux)
 * 
 * Règles :
 * - Si actif irritant (Retinol, AHA, BHA, Niacinamide >5%) → restrictedZones: ['lèvres', 'yeux']
 * - Si produit spécifique yeux/lèvres (eye cream, lip balm) → restrictedZones: []
 * - Sinon → restrictedZones: []
 * 
 * Durée : ~5 min
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

// Types
interface OldProduct {
  catalogId: string
  name: string
  brand: string
  category: string
  activeIngredients?: string[]
  concentration?: string
  [key: string]: any
}

interface EnrichedProductV2 extends OldProduct {
  restrictedZones: string[]
}

// Détection ingrédients à risque
const IRRITANT_INGREDIENTS = [
  'retinol',
  'retinoid',
  'tretinoin',
  'adapalene',
  'glycolic acid',
  'glycolique',
  'lactic acid',
  'lactique',
  'salicylic acid',
  'salicylique',
  'bha',
  'aha',
  'mandelic acid',
  'benzoyl peroxide',
  'peroxyde de benzoyle',
  'azelaic acid',
  'azélaïque'
]

// Catégories spécifiques zones sensibles
const EYE_SPECIFIC_CATEGORIES = ['eye-care', 'eye cream', 'eye serum']
const LIP_SPECIFIC_CATEGORIES = ['lip-care', 'lip balm', 'lip treatment']

/**
 * Détermine si un produit contient un actif irritant
 */
function hasIrritantIngredient(product: OldProduct): boolean {
  const activeIngredients = product.activeIngredients || []
  const concentration = (product.concentration || '').toLowerCase()
  const name = product.name.toLowerCase()
  
  // Vérifier actifs connus
  const hasIrritant = activeIngredients.some(ingredient => {
    const ingredientLower = ingredient.toLowerCase()
    return IRRITANT_INGREDIENTS.some(irritant => ingredientLower.includes(irritant))
  })
  
  // Vérifier concentration et nom
  const hasConcentration = concentration + ' ' + name
  
  // Cas spécial : Niacinamide >5%
  if (hasConcentration.includes('niacinamide')) {
    const match = hasConcentration.match(/niacinamide\s*(\d+)\s*%/i)
    if (match) {
      const concentrationValue = parseInt(match[1])
      if (concentrationValue > 5) {
        return true  // Niacinamide >5% = irritant potentiel
      }
    }
  }
  
  return hasIrritant
}

/**
 * Détermine si un produit est spécifique yeux/lèvres
 */
function isEyeOrLipSpecific(product: OldProduct): boolean {
  const category = product.category.toLowerCase()
  const name = product.name.toLowerCase()
  
  const isEye = EYE_SPECIFIC_CATEGORIES.some(cat => category.includes(cat)) || 
                name.includes('eye') || 
                name.includes('contour yeux') ||
                name.includes('contour des yeux')
  
  const isLip = LIP_SPECIFIC_CATEGORIES.some(cat => category.includes(cat)) || 
                name.includes('lip') || 
                name.includes('lèvres') ||
                name.includes('baume')
  
  return isEye || isLip
}

/**
 * Calcule restrictedZones pour un produit
 */
function calculateRestrictedZones(product: OldProduct): string[] {
  // Produits spécifiques yeux/lèvres → pas de restriction
  if (isEyeOrLipSpecific(product)) {
    return []
  }
  
  // Produits avec actifs irritants → restreindre lèvres + yeux
  if (hasIrritantIngredient(product)) {
    return ['lèvres', 'yeux']
  }
  
  // Par défaut : pas de restriction
  return []
}

/**
 * Enrichit un produit avec restrictedZones
 */
function enrichProduct(product: OldProduct): EnrichedProductV2 {
  return {
    ...product,
    restrictedZones: calculateRestrictedZones(product)
  }
}

/**
 * Charge tous les produits depuis public/catalog/*.json
 */
async function loadAllProducts(): Promise<OldProduct[]> {
  const catalogDir = path.join(process.cwd(), 'public/catalog')
  const files = fs.readdirSync(catalogDir).filter(f => f.endsWith('.json') && f !== 'index.json')
  
  const allProducts: OldProduct[] = []
  
  for (const file of files) {
    const filePath = path.join(catalogDir, file)
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(rawData)
    
    // Chaque fichier peut contenir un array de produits
    if (Array.isArray(data)) {
      allProducts.push(...data)
    } else if (data.products && Array.isArray(data.products)) {
      allProducts.push(...data.products)
    }
  }
  
  return allProducts
}

/**
 * FONCTION PRINCIPALE
 */
async function main() {
  console.log('🚀 PHASE 0 : Enrichissement restrictedZones (110 produits)\n')
  
  // Chemins fichiers
  const outputPath = path.join(process.cwd(), 'src/data/enrichedCatalogV2.json')
  
  // Charger tous les produits depuis public/catalog/
  console.log(`📥 Chargement catalogue depuis : public/catalog/`)
  const products = await loadAllProducts()
  
  console.log(`✅ ${products.length} produits chargés\n`)
  
  if (products.length === 0) {
    console.error('❌ Aucun produit trouvé !')
    process.exit(1)
  }
  
  // Enrichir chaque produit
  console.log('🔄 Enrichissement en cours...\n')
  
  const enrichedProducts: EnrichedProductV2[] = []
  const stats = {
    restricted: 0,
    unrestricted: 0,
    eyeLip: 0
  }
  
  const restrictedList: string[] = []
  
  products.forEach((product, index) => {
    const enriched = enrichProduct(product)
    enrichedProducts.push(enriched)
    
    // Stats
    if (enriched.restrictedZones.length > 0) {
      stats.restricted++
      restrictedList.push(`  - ${enriched.brand} - ${enriched.name} (${enriched.category})`)
    } else if (isEyeOrLipSpecific(product)) {
      stats.eyeLip++
    } else {
      stats.unrestricted++
    }
  })
  
  // Afficher liste des produits avec restrictions
  console.log(`✅ Produits avec restrictions (${stats.restricted}) :`)
  restrictedList.forEach(p => console.log(p))
  console.log('')
  
  // Sauvegarder enrichedCatalogV2.json
  console.log(`💾 Sauvegarde : ${outputPath}`)
  fs.writeFileSync(outputPath, JSON.stringify(enrichedProducts, null, 2), 'utf-8')
  
  // Rapport final
  console.log('\n✅ ENRICHISSEMENT TERMINÉ\n')
  console.log('📊 STATISTIQUES :')
  console.log(`   - Produits avec restrictions : ${stats.restricted} (${Math.round(stats.restricted / products.length * 100)}%)`)
  console.log(`   - Produits spécifiques yeux/lèvres : ${stats.eyeLip} (${Math.round(stats.eyeLip / products.length * 100)}%)`)
  console.log(`   - Produits sans restrictions : ${stats.unrestricted} (${Math.round(stats.unrestricted / products.length * 100)}%)`)
  console.log(`   - TOTAL : ${products.length} produits`)
  
  console.log(`\n📁 Fichier généré : ${outputPath}`)
  console.log('\n🎯 PROCHAINES ÉTAPES :')
  console.log('   1. Review manuel des produits avec restrictions')
  console.log('   2. Mettre à jour ProductDatabaseLoader pour charger enrichedCatalogV2.json')
  console.log('   3. Lancer tests E2E pour valider 0 anomalie zones')
}

// Exécution
main().catch(error => {
  console.error('❌ ERREUR :', error)
  process.exit(1)
})
