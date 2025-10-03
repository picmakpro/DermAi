/**
 * PHASE 3 : Test Ingredient Database
 * 
 * Valide la structure et cohérence de la database d'ingrédients
 * 
 * Durée : ~1 seconde
 */

import { config } from 'dotenv'
import * as path from 'path'
import {
  INGREDIENT_DATABASE,
  getDatabaseStats,
  findIngredient,
  hasIngredient,
  extractKnownIngredients
} from '../src/data/ingredientCompatibilityDatabase'

// Charger .env.local
config({ path: path.join(process.cwd(), '.env.local') })

function testIngredientDatabase() {
  console.log('\n🧪 TEST : Ingredient Database\n')

  let testsPass = 0
  let testsFail = 0

  // ========== TEST 1 : Stats Générales ==========
  
  console.log('1️⃣ Test stats database...')
  const stats = getDatabaseStats()
  
  console.log(`   Total ingrédients : ${stats.totalIngredients}`)
  console.log(`   Par niveau de risque :`)
  console.log(`   - Safe (0) : ${stats.bySafetyLevel.safe}`)
  console.log(`   - Low (1) : ${stats.bySafetyLevel.low}`)
  console.log(`   - Moderate (2) : ${stats.bySafetyLevel.moderate}`)
  console.log(`   - High (3) : ${stats.bySafetyLevel.high}`)
  console.log(`   Pregnancy safe : ${stats.pregnancySafe}/${stats.totalIngredients}`)
  console.log(`   Photosensitizing : ${stats.photosensitizing}/${stats.totalIngredients}`)
  console.log(`   Comedogenic : ${stats.comedogenic}/${stats.totalIngredients}`)
  console.log(`   Irritant : ${stats.irritant}/${stats.totalIngredients}`)
  
  if (stats.totalIngredients >= 20) {
    console.log(`   ✅ Au moins 20 ingrédients présents`)
    testsPass++
  } else {
    console.log(`   ❌ Pas assez d'ingrédients : ${stats.totalIngredients} < 20`)
    testsFail++
  }

  // ========== TEST 2 : Validation Structure ==========
  
  console.log('\n2️⃣ Test validation structure...')
  let structureErrors = 0
  
  for (const ing of INGREDIENT_DATABASE) {
    // Vérifier champs requis
    if (!ing.name || !ing.inci) {
      console.log(`   ❌ Champs manquants : ${ing.name || 'unknown'}`)
      structureErrors++
      continue
    }
    
    // Vérifier compatibilité (7 skin types)
    const skinTypes = ['dry', 'oily', 'combination', 'sensitive', 'normal', 'acne_prone', 'mature']
    for (const skinType of skinTypes) {
      const score = ing.compatibility[skinType as keyof typeof ing.compatibility]
      if (typeof score !== 'number' || score < 0 || score > 1) {
        console.log(`   ❌ Score invalide ${ing.name}.${skinType}: ${score}`)
        structureErrors++
      }
    }
    
    // Vérifier riskLevel
    if (![0, 1, 2, 3].includes(ing.riskLevel)) {
      console.log(`   ❌ riskLevel invalide ${ing.name}: ${ing.riskLevel}`)
      structureErrors++
    }
  }
  
  if (structureErrors === 0) {
    console.log(`   ✅ Structure valide pour ${INGREDIENT_DATABASE.length} ingrédients`)
    testsPass++
  } else {
    console.log(`   ❌ ${structureErrors} erreurs de structure détectées`)
    testsFail++
  }

  // ========== TEST 3 : Search Functions ==========
  
  console.log('\n3️⃣ Test fonctions de recherche...')
  
  // Test findIngredient
  const retinol = findIngredient('Retinol')
  const hyaluronic = findIngredient('Acide Hyaluronique')  // Alias français
  const niacinamide = findIngredient('niacinamide')        // Case insensitive
  
  if (retinol && retinol.name === 'Retinol') {
    console.log(`   ✅ findIngredient('Retinol') fonctionne`)
    testsPass++
  } else {
    console.log(`   ❌ findIngredient('Retinol') échoue`)
    testsFail++
  }
  
  if (hyaluronic && hyaluronic.name === 'Hyaluronic Acid') {
    console.log(`   ✅ findIngredient('Acide Hyaluronique') trouve alias`)
    testsPass++
  } else {
    console.log(`   ❌ findIngredient('Acide Hyaluronique') échoue`)
    testsFail++
  }
  
  if (niacinamide && niacinamide.name === 'Niacinamide') {
    console.log(`   ✅ findIngredient case-insensitive fonctionne`)
    testsPass++
  } else {
    console.log(`   ❌ findIngredient case-insensitive échoue`)
    testsFail++
  }
  
  // Test hasIngredient
  const testIngredients = ['Retinol 0.5%', 'Hyaluronic Acid', 'Glycerin']
  const hasRetinol = hasIngredient(testIngredients, 'Retinol')
  const hasVitaminE = hasIngredient(testIngredients, 'Vitamin E')
  
  if (hasRetinol) {
    console.log(`   ✅ hasIngredient détecte Retinol`)
    testsPass++
  } else {
    console.log(`   ❌ hasIngredient rate Retinol`)
    testsFail++
  }
  
  if (!hasVitaminE) {
    console.log(`   ✅ hasIngredient ne trouve pas Vitamin E (attendu)`)
    testsPass++
  } else {
    console.log(`   ❌ hasIngredient faux positif Vitamin E`)
    testsFail++
  }
  
  // Test extractKnownIngredients
  const known = extractKnownIngredients(testIngredients)
  if (known.length === 3) {
    console.log(`   ✅ extractKnownIngredients trouve 3/3 ingrédients`)
    testsPass++
  } else {
    console.log(`   ❌ extractKnownIngredients trouve ${known.length}/3 ingrédients`)
    testsFail++
  }

  // ========== TEST 4 : Cohérence Métadonnées ==========
  
  console.log('\n4️⃣ Test cohérence métadonnées...')
  let coherenceErrors = 0
  
  for (const ing of INGREDIENT_DATABASE) {
    // Si irritant = true et sensitive < 0.5, c'est cohérent
    if (ing.irritant && ing.compatibility.sensitive >= 0.7) {
      console.log(`   ⚠️ Incohérence : ${ing.name} marqué irritant mais score sensitive élevé (${ing.compatibility.sensitive})`)
      coherenceErrors++
    }
    
    // Si pregnancy_safe = false et riskLevel < 2, c'est suspect
    if (!ing.pregnancy_safe && ing.riskLevel < 2) {
      console.log(`   ⚠️ Incohérence : ${ing.name} unsafe grossesse mais riskLevel faible (${ing.riskLevel})`)
      coherenceErrors++
    }
    
    // Si comedogenic = true et acne_prone >= 0.7, c'est suspect
    if (ing.comedogenic && ing.compatibility.acne_prone >= 0.7) {
      console.log(`   ⚠️ Incohérence : ${ing.name} comédogène mais score acne_prone élevé (${ing.compatibility.acne_prone})`)
      coherenceErrors++
    }
  }
  
  if (coherenceErrors === 0) {
    console.log(`   ✅ Métadonnées cohérentes`)
    testsPass++
  } else {
    console.log(`   ⚠️ ${coherenceErrors} incohérences détectées (non bloquant)`)
    testsPass++  // Non bloquant, juste warnings
  }

  // ========== TEST 5 : Ingrédients Critiques Présents ==========
  
  console.log('\n5️⃣ Test présence ingrédients critiques...')
  
  const criticalIngredients = [
    'Retinol',
    'Niacinamide',
    'Salicylic Acid',
    'Hyaluronic Acid',
    'Glycolic Acid',
    'Vitamin C',
    'Centella Asiatica'
  ]
  
  let missingCritical = 0
  for (const critical of criticalIngredients) {
    const found = findIngredient(critical)
    if (!found) {
      console.log(`   ❌ Ingrédient critique manquant : ${critical}`)
      missingCritical++
    }
  }
  
  if (missingCritical === 0) {
    console.log(`   ✅ Tous les ingrédients critiques présents`)
    testsPass++
  } else {
    console.log(`   ❌ ${missingCritical} ingrédients critiques manquants`)
    testsFail++
  }

  // ========== TEST 6 : Scoring Différencié ==========
  
  console.log('\n6️⃣ Test scoring différencié par skin type...')
  
  // Retinol devrait être meilleur pour oily que sensitive
  if (retinol) {
    const oilyScore = retinol.compatibility.oily
    const sensitiveScore = retinol.compatibility.sensitive
    
    if (oilyScore > sensitiveScore + 0.3) {
      console.log(`   ✅ Retinol : oily (${oilyScore}) > sensitive (${sensitiveScore})`)
      testsPass++
    } else {
      console.log(`   ❌ Retinol : scoring non différencié`)
      testsFail++
    }
  }
  
  // Hyaluronic Acid devrait être bon pour tous types
  if (hyaluronic) {
    const avgScore = Object.values(hyaluronic.compatibility).reduce((a, b) => a + b, 0) / 7
    
    if (avgScore >= 0.9) {
      console.log(`   ✅ Hyaluronic Acid : score moyen élevé (${avgScore.toFixed(2)})`)
      testsPass++
    } else {
      console.log(`   ❌ Hyaluronic Acid : score moyen trop bas (${avgScore.toFixed(2)})`)
      testsFail++
    }
  }

  // ========== RÉSUMÉ ==========
  
  console.log('\n' + '='.repeat(70))
  console.log(`\n📊 RÉSUMÉ TESTS\n`)
  console.log(`   ✅ Tests réussis : ${testsPass}`)
  console.log(`   ❌ Tests échoués : ${testsFail}`)
  console.log(`   📦 Total ingrédients : ${stats.totalIngredients}`)
  
  if (testsFail === 0) {
    console.log(`\n✅ TOUS LES TESTS RÉUSSIS\n`)
    console.log(`🎯 Database prête pour Sprint 3.2 (Enrichissement produits)\n`)
    return true
  } else {
    console.log(`\n❌ ${testsFail} TESTS ÉCHOUÉS\n`)
    console.log(`⚠️ Corriger les erreurs avant de continuer\n`)
    return false
  }
}

// Run tests
const success = testIngredientDatabase()
process.exit(success ? 0 : 1)

