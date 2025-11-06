/**
 * PHASE 3 SPRINT 3.4 : Tests Réalistes Basés sur 110 Produits
 * 
 * Tests adaptés à l'échantillon de 110 produits (pas de scénarios théoriques impossibles)
 * Basé sur la distribution réelle des produits dans la database
 */

import { config } from 'dotenv'
import * as path from 'path'
import { ProductDatabaseLoader } from '../src/services/products/ProductDatabaseLoader'
import { ProductMatcher } from '../src/services/products/ProductMatcher'
import { ProductMatcherV2 } from '../src/services/products/ProductMatcherV2'

// Charger .env.local
config({ path: path.join(process.cwd(), '.env.local') })

// Forcer utilisation Supabase
process.env.USE_SUPABASE_CATALOG = 'true'

// ========== SCÉNARIOS RÉALISTES (basés sur 110 produits) ==========

const REALISTIC_SCENARIOS = [
  {
    name: '✅ Peau Normale + Hydratation',
    step: {
      stepNumber: 1,
      careType: 'hydratation',
      targetProblem: 'hydratation',
      timing: 'both' as const,
      targetZones: ['visage entier']
    },
    profile: {
      skinType: 'normal' as const,
      concerns: ['hydratation'],
      isPregnant: false,
      allergies: []
    },
    budget: { maxBudget: 200, expectedSteps: 10 },
    expectedSuccess: true,
    reason: '22 hydratants dont 15 safe pour peau normale'
  },
  {
    name: '✅ Peau Sensible + Apaisement',
    step: {
      stepNumber: 1,
      careType: 'apaisement',
      targetProblem: 'rougeurs',
      timing: 'both' as const,
      targetZones: ['visage entier']
    },
    profile: {
      skinType: 'sensitive' as const,
      concerns: ['rougeurs', 'sensibilité'],
      isPregnant: false,
      allergies: []
    },
    budget: { maxBudget: 200, expectedSteps: 10 },
    expectedSuccess: true,
    reason: '11 produits apaisement, majorité safe peau sensible'
  },
  {
    name: '✅ Peau Grasse + Protection SPF',
    step: {
      stepNumber: 1,
      careType: 'protection',
      targetProblem: 'protection solaire',
      timing: 'morning' as const,
      targetZones: ['visage entier']
    },
    profile: {
      skinType: 'oily' as const,
      concerns: ['protection'],
      isPregnant: false,
      allergies: []
    },
    budget: { maxBudget: 200, expectedSteps: 10 },
    expectedSuccess: true,
    reason: '16 SPF dont plusieurs pour peau grasse'
  },
  {
    name: '✅ Peau Mature + Anti-Âge (tolérant)',
    step: {
      stepNumber: 1,
      careType: 'anti-age',
      targetProblem: 'rides',
      timing: 'evening' as const,
      targetZones: ['visage entier']
    },
    profile: {
      skinType: 'mature' as const,
      concerns: ['rides', 'fermeté'],
      isPregnant: false,
      allergies: []
    },
    budget: { maxBudget: 200, expectedSteps: 10 },
    expectedSuccess: true,
    reason: '11 anti-âge dont Retinol pour peau mature'
  },
  {
    name: '✅ Grossesse + Hydratation Safe',
    step: {
      stepNumber: 1,
      careType: 'hydratation',
      targetProblem: 'hydratation',
      timing: 'both' as const,
      targetZones: ['visage entier']
    },
    profile: {
      skinType: 'normal' as const,
      concerns: ['hydratation'],
      isPregnant: true,
      allergies: []
    },
    budget: { maxBudget: 200, expectedSteps: 10 },
    expectedSuccess: true,
    reason: '13 hydratants pregnancy_safe (CeraVe, Neutrogena, etc.)'
  },
  {
    name: '✅ Peau Sèche + Hydratation Riche',
    step: {
      stepNumber: 1,
      careType: 'hydratation',
      targetProblem: 'sécheresse',
      timing: 'both' as const,
      targetZones: ['visage entier']
    },
    profile: {
      skinType: 'dry' as const,
      concerns: ['sécheresse'],
      isPregnant: false,
      allergies: []
    },
    budget: { maxBudget: 200, expectedSteps: 10 },
    expectedSuccess: true,
    reason: '5-6 hydratants adaptés peau sèche'
  },
  {
    name: '✅ Nettoyage Quotidien',
    step: {
      stepNumber: 1,
      careType: 'nettoyage',
      targetProblem: undefined,
      timing: 'both' as const,
      targetZones: ['visage entier']
    },
    profile: {
      skinType: 'normal' as const,
      concerns: [],
      isPregnant: false,
      allergies: []
    },
    budget: { maxBudget: 200, expectedSteps: 10 },
    expectedSuccess: true,
    reason: '10 nettoyants universels'
  },
  {
    name: '✅ Tonification (optionnel)',
    step: {
      stepNumber: 1,
      careType: 'tonification',
      targetProblem: undefined,
      timing: 'both' as const,
      targetZones: ['visage entier']
    },
    profile: {
      skinType: 'combination' as const,
      concerns: [],
      isPregnant: false,
      allergies: []
    },
    budget: { maxBudget: 200, expectedSteps: 10 },
    expectedSuccess: true,
    reason: '12 toniques variés'
  }
]

// ========== FONCTION PRINCIPALE ==========

async function testRealisticScenarios() {
  console.log('\n🧪 TESTS RÉALISTES BASÉS SUR 110 PRODUITS\n')
  console.log('   Tests adaptés à echantillon reel (pas de scenarios theoriques)\n')

  try {
    // Charger database
    console.log('📥 Chargement database...')
    const database = await ProductDatabaseLoader.load()
    console.log(`✅ ${database.allProducts.length} produits chargés\n`)

    // Créer matchers
    const matcherV1 = new ProductMatcher(database)
    const matcherV2 = new ProductMatcherV2(database)

    const results: any[] = []
    let successV1 = 0
    let successV2 = 0

    // Tester chaque scénario
    for (const scenario of REALISTIC_SCENARIOS) {
      console.log('='.repeat(70))
      console.log(`\n${scenario.name}`)
      console.log(`   Raison : ${scenario.reason}\n`)

      let resultV1: any = null
      let resultV2: any = null

      // ========== V1 ==========
      try {
        const startV1 = Date.now()
        const matchV1 = await matcherV1.selectForRoutineStep(
          scenario.step,
          scenario.profile,
          scenario.budget
        )
        const timeV1 = Date.now() - startV1

        console.log(`   🔵 V1 : ${matchV1.mainProduct.name} (${matchV1.matchingScore})`)
        resultV1 = { success: true, product: matchV1.mainProduct.name, score: matchV1.matchingScore, time: timeV1 }
        successV1++
      } catch (error: any) {
        console.log(`   🔵 V1 : ❌ ${error.message}`)
        resultV1 = { success: false, error: error.message }
      }

      // ========== V2 ==========
      try {
        const startV2 = Date.now()
        const matchV2 = await matcherV2.selectForRoutineStep(
          scenario.step,
          scenario.profile,
          scenario.budget
        )
        const timeV2 = Date.now() - startV2

        console.log(`   🟢 V2 : ${matchV2.selectedProduct.name} (${matchV2.matchingScore})`)
        console.log(`      📊 Breakdown : Ingrédients ${matchV2.breakdown.ingredientCompatibility}/100 | Concerns ${matchV2.breakdown.concernMatch}/100`)
        resultV2 = { 
          success: true, 
          product: matchV2.selectedProduct.name, 
          score: matchV2.matchingScore,
          ingredientScore: matchV2.breakdown.ingredientCompatibility,
          time: timeV2 
        }
        successV2++
      } catch (error: any) {
        console.log(`   🟢 V2 : ❌ ${error.message}`)
        resultV2 = { success: false, error: error.message }
      }

      // ========== COMPARAISON ==========
      const expectedStatus = scenario.expectedSuccess ? '✅' : '⚠️'
      const actualV1Status = resultV1.success ? '✅' : '❌'
      const actualV2Status = resultV2.success ? '✅' : '❌'

      console.log(``)
      console.log(`   Attendu : ${expectedStatus} ${scenario.expectedSuccess ? 'Succès' : 'Échec'}`)
      console.log(`   V1 : ${actualV1Status} | V2 : ${actualV2Status}`)

      if (resultV1.success && resultV2.success) {
        const sameProduit = resultV1.product === resultV2.product
        if (sameProduit) {
          console.log(`   📊 Même produit, score amélioré : ${resultV1.score} → ${resultV2.score} (+${resultV2.score - resultV1.score})`)
        } else {
          console.log(`   🔄 Produit différent (score ingrédients : ${resultV2.ingredientScore}/100)`)
        }
      }

      results.push({
        scenario: scenario.name,
        expected: scenario.expectedSuccess,
        v1: resultV1,
        v2: resultV2
      })
    }

    // ========== RÉSUMÉ ==========
    
    console.log('\n' + '='.repeat(70))
    console.log('\n📊 RÉSUMÉ FINAL\n')

    console.log(`   Total scénarios : ${REALISTIC_SCENARIOS.length}`)
    console.log(`   V1 succès : ${successV1}/${REALISTIC_SCENARIOS.length} (${Math.round((successV1 / REALISTIC_SCENARIOS.length) * 100)}%)`)
    console.log(`   V2 succès : ${successV2}/${REALISTIC_SCENARIOS.length} (${Math.round((successV2 / REALISTIC_SCENARIOS.length) * 100)}%)`)
    console.log(``)

    const successResults = results.filter(r => r.v1.success && r.v2.success)
    
    if (successResults.length > 0) {
      const avgScoreV1 = successResults.reduce((sum, r) => sum + r.v1.score, 0) / successResults.length
      const avgScoreV2 = successResults.reduce((sum, r) => sum + r.v2.score, 0) / successResults.length
      const avgIngredientScore = successResults.reduce((sum, r) => sum + (r.v2.ingredientScore || 0), 0) / successResults.length

      console.log(`   📈 Score moyen V1 : ${avgScoreV1.toFixed(1)}/100`)
      console.log(`   📈 Score moyen V2 : ${avgScoreV2.toFixed(1)}/100`)
      console.log(`   📊 Amélioration : +${(avgScoreV2 - avgScoreV1).toFixed(1)} points (+${Math.round(((avgScoreV2 - avgScoreV1) / avgScoreV1) * 100)}%)`)
      console.log(`   🧬 Score ingrédients moyen : ${avgIngredientScore.toFixed(1)}/100`)
      console.log(``)
    }

    // ========== CONCLUSION ==========
    
    console.log('🎯 CONCLUSION\n')

    if (successV2 === REALISTIC_SCENARIOS.length) {
      console.log(`   ✅ 100% de succès sur scénarios réalistes (${successV2}/${REALISTIC_SCENARIOS.length})`)
      console.log(`   → ProductMatcherV2 fonctionne parfaitement sur echantillon de 110 produits`)
    } else {
      console.log(`   ⚠️ ${REALISTIC_SCENARIOS.length - successV2} echec(s) sur scénarios réalistes`)
      console.log(`   → A analyser (peut-etre limitation echantillon ou seuils a ajuster)`)
    }

    console.log(``)
    console.log(`   💡 Tests basés sur distribution réelle des 110 produits`)
    console.log(`   💡 Avec 2000+ produits, tous les scénarios (même théoriques) seront couverts`)
    console.log(``)

  } catch (error: any) {
    console.error('\n❌ ERREUR FATALE\n')
    console.error('Message :', error.message)
    console.error('\nStack:', error.stack)
    process.exit(1)
  }
}

// ========== EXÉCUTION ==========

testRealisticScenarios()
  .then(() => {
    console.log('✅ Tests terminés\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

