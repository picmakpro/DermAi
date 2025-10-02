/**
 * PHASE D1.2 : Migration Catalogue vers EnrichedProduct V2
 * 
 * Ce script migre le catalogue public/catalog/*.json vers le format EnrichedProductV2
 * avec métadonnées dermatologiques complètes pour le matching algorithmique.
 * 
 * Input : public/catalog/*.json (110 produits)
 * Output : src/data/enrichedCatalogV2.json
 */

const fs = require('fs')
const path = require('path')

// ========== MAPPINGS MÉTADONNÉES ==========

/**
 * Mapping category → careType (prioritaire pour matching)
 */
const CATEGORY_TO_CARETYPE = {
  'cleanser': 'nettoyage',
  'toner': 'tonification',
  'serum': 'traitement',
  'treatment': 'traitement',
  'moisturizer': 'hydratation',
  'face-oil': 'hydratation',
  'sunscreen': 'protection',
  'exfoliant': 'exfoliation',
  'mask': 'traitement',
  'balm': 'hydratation',
  'mist': 'tonification',
  'eye-care': 'traitement',
  'lip-care': 'hydratation',
  'primer': 'traitement'
}

/**
 * Mapping skinTypes français → anglais
 */
const SKIN_TYPE_MAPPING = {
  'sèche': 'dry',
  'grasse': 'oily',
  'mixte': 'combination',
  'sensible': 'sensitive',
  'normale': 'normal',
  'acnéique': 'acne-prone',
  'mature': 'mature'
}

/**
 * Extraire targetConcerns depuis benefits (analyse textuelle)
 */
function extractConcerns(benefits = [], activeIngredients = []) {
  const concerns = []
  
  const concernKeywords = {
    'acne': ['acné', 'imperfection', 'bouton', 'sébum', 'zinc', 'acide salicylique'],
    'redness': ['rougeur', 'apaisant', 'anti-inflammatoire', 'calme'],
    'aging': ['ride', 'fermeté', 'anti-âge', 'rétinol', 'peptide', 'collagène'],
    'dryness': ['hydrat', 'sèche', 'acide hyaluronique', 'céramide'],
    'hyperpigmentation': ['tache', 'éclaircissant', 'pigment', 'vitamine c', 'niacinamide'],
    'sensitivity': ['sensible', 'irritation', 'apaisant', 'tolérance'],
    'dullness': ['éclat', 'radiance', 'luminosité'],
    'texture': ['texture', 'lisse', 'grain de peau', 'exfoliant']
  }
  
  const allText = [...benefits, ...activeIngredients].join(' ').toLowerCase()
  
  for (const [concern, keywords] of Object.entries(concernKeywords)) {
    if (keywords.some(kw => allText.includes(kw))) {
      concerns.push(concern)
    }
  }
  
  return [...new Set(concerns)] // Déduplicate
}

/**
 * Extraire allergènes potentiels
 */
function extractAllergens(activeIngredients = []) {
  const allergens = []
  const allergenKeywords = {
    'fragrance': ['parfum', 'fragrance'],
    'alcohol': ['alcohol', 'éthanol'],
    'essential oils': ['huile essentielle', 'essential oil']
  }
  
  const allText = activeIngredients.join(' ').toLowerCase()
  
  for (const [allergen, keywords] of Object.entries(allergenKeywords)) {
    if (keywords.some(kw => allText.includes(kw))) {
      allergens.push(allergen)
    }
  }
  
  return allergens
}

/**
 * Déterminer timing d'application
 */
function inferTiming(category, benefits = []) {
  const allText = benefits.join(' ').toLowerCase()
  
  // SPF = matin uniquement
  if (category === 'sunscreen') return 'morning'
  
  // Rétinol, AHA, BHA = soir de préférence
  if (allText.includes('rétinol') || allText.includes('acide') || allText.includes('exfoliant')) {
    return 'evening'
  }
  
  // Défaut : both
  return 'both'
}

/**
 * Calculer dermatologistRating basé sur qualité perçue
 */
function calculateDermatologistRating(product) {
  let rating = 70 // Base
  
  // Bonus marques reconnues
  const premiumBrands = ['La Roche-Posay', 'CeraVe', 'The Ordinary', 'Paula\'s Choice', 'Skinceuticals', 'Avène']
  if (premiumBrands.some(b => product.brand.includes(b))) {
    rating += 15
  }
  
  // Bonus actifs reconnus
  const clinicalIngredients = ['niacinamide', 'rétinol', 'acide hyaluronique', 'vitamine c', 'céramide']
  const hasClinic = product.activeIngredients?.some(ing => 
    clinicalIngredients.some(ci => ing.toLowerCase().includes(ci))
  )
  if (hasClinic) {
    rating += 10
  }
  
  // Bonus multi-benefits
  if (product.benefits && product.benefits.length >= 3) {
    rating += 5
  }
  
  return Math.min(rating, 100)
}

/**
 * Calculer popularity basé sur prix et marque
 */
function calculatePopularity(product) {
  let popularity = 50 // Base
  
  // Bonus marques populaires
  const popularBrands = ['CeraVe', 'The Ordinary', 'Neutrogena', 'Garnier', 'L\'Oréal']
  if (popularBrands.some(b => product.brand.includes(b))) {
    popularity += 20
  }
  
  // Bonus rapport qualité/prix
  if (product.price < 15) {
    popularity += 15
  }
  
  return Math.min(popularity, 100)
}

// ========== MIGRATION ==========

async function migrateProduct(product) {
  // Normaliser skinTypes
  const targetSkinTypes = (product.skinTypes || ['normal'])
    .map(st => SKIN_TYPE_MAPPING[st.toLowerCase()] || 'normal')
    .filter((v, i, arr) => arr.indexOf(v) === i) // Déduplicate
  
  // Extraire targetConcerns
  const targetConcerns = extractConcerns(product.benefits, product.activeIngredients)
  
  // Extraire allergens
  const allergens = extractAllergens(product.activeIngredients)
  
  // Inférer careType
  const careType = CATEGORY_TO_CARETYPE[product.category] || 'hydratation'
  
  // Calculer scores
  const dermatologistRating = calculateDermatologistRating(product)
  const popularity = calculatePopularity(product)
  
  // Timing
  const applicationTiming = inferTiming(product.category, product.benefits)
  
  return {
    catalogId: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    careType,
    targetSkinTypes,
    targetConcerns,
    activeIngredients: product.activeIngredients || [],
    allergens,
    price: product.price,
    popularity,
    dermatologistRating,
    imageUrl: product.imageUrl || undefined,
    retailers: product.affiliateLink ? [{
      name: 'Amazon',
      url: product.affiliateLink,
      price: product.price
    }] : [],
    applicationTiming,
    targetZones: ['visage entier']
  }
}

async function main() {
  console.log('[Migration] 🔄 Début migration catalogue V2...\n')
  
  const catalogDir = path.join(__dirname, '../public/catalog')
  const outputPath = path.join(__dirname, '../src/data/enrichedCatalogV2.json')
  
  const allProducts = []
  const files = fs.readdirSync(catalogDir).filter(f => f.endsWith('.json') && f !== 'index.json')
  
  for (const file of files) {
    const filePath = path.join(catalogDir, file)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    
    if (data.products && Array.isArray(data.products)) {
      console.log(`📁 ${file}: ${data.products.length} produits`)
      
      for (const product of data.products) {
        const enriched = await migrateProduct(product)
        allProducts.push(enriched)
      }
    }
  }
  
  console.log(`\n✅ Total migré: ${allProducts.length} produits`)
  
  // Statistiques par careType
  const byCareType = allProducts.reduce((acc, p) => {
    acc[p.careType] = (acc[p.careType] || 0) + 1
    return acc
  }, {})
  
  console.log('\n📊 Répartition par careType:')
  Object.entries(byCareType).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count} produits`)
  })
  
  // Sauvegarder
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2), 'utf-8')
  console.log(`\n💾 Sauvegardé: ${outputPath}`)
  console.log('\n🎉 Migration terminée avec succès !')
}

main().catch(err => {
  console.error('❌ Erreur migration:', err)
  process.exit(1)
})

