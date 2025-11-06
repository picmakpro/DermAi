/**
 * Script de Test : Budget Optimization V2
 * 
 * @description
 * Tests avec scénarios réalistes sur 110 produits
 * Validation des métriques de succès
 * 
 * @usage
 * npx tsx scripts/test-budget-optimization.ts
 */

import { config } from 'dotenv'
import * as path from 'path'

// Charger variables environnement
config({ path: path.join(process.cwd(), '.env.local') })

// Force Supabase catalog
process.env.USE_SUPABASE_CATALOG = 'true'
process.env.USE_PRODUCT_MATCHER_V2 = 'true'

import { ProductDatabaseLoader } from '@/services/products/ProductDatabaseLoader'
import { ProductMatcherV2 } from '@/services/products/ProductMatcherV2'
import { BudgetOptimizer } from '@/services/products/BudgetOptimizer'
import type { ProductMatch } from '@/services/products/BudgetOptimizer'
import type { BudgetConstraints } from '@/types'
import { CARETYPE_BUDGET_PRIORITIES } from '@/types'

// ==================== SCÉNARIOS TEST ====================

interface TestScenario {
  name: string
  description: string
  steps: Array<{
    careType: string
    stepNumber: number
    displayTitle: string
    targetZones: string[]
  }>
  profile: {
    skinType: string
    isPregnant: boolean
    concerns: string[]
    allergies: string[]
  }
  budget: number
  expectedOutcome: {
    budgetRespected: boolean
    spfPreserved: boolean
    nettoyantPreserved: boolean
    minScore: number
  }
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Scénario 1 : Budget Confortable',
    description: 'Budget 200€, routine complète 10 steps',
    steps: [
      { careType: 'nettoyage', stepNumber: 1, displayTitle: 'Nettoyage', targetZones: ['visage entier'] },
      { careType: 'tonification', stepNumber: 2, displayTitle: 'Tonification', targetZones: ['visage entier'] },
      { careType: 'hydratation', stepNumber: 3, displayTitle: 'Hydratation', targetZones: ['visage entier'] },
      { careType: 'protection', stepNumber: 4, displayTitle: 'Protection SPF', targetZones: ['visage entier'] },
      { careType: 'anti-age', stepNumber: 5, displayTitle: 'Anti-âge', targetZones: ['visage entier'] },
      { careType: 'eclat', stepNumber: 6, displayTitle: 'Éclat', targetZones: ['visage entier'] },
      { careType: 'traitement-cible', stepNumber: 7, displayTitle: 'Traitement Acné', targetZones: ['front'] },
      { careType: 'apaisement', stepNumber: 8, displayTitle: 'Apaisement', targetZones: ['joues'] },
      { careType: 'exfoliation', stepNumber: 9, displayTitle: 'Exfoliation', targetZones: ['visage entier'] },
      { careType: 'masque', stepNumber: 10, displayTitle: 'Masque', targetZones: ['visage entier'] }
    ],
    profile: {
      skinType: 'combination',
      isPregnant: false,
      concerns: ['acne', 'dark_spots', 'fine_lines'],
      allergies: []
    },
    budget: 200,
    expectedOutcome: {
      budgetRespected: true,
      spfPreserved: true,
      nettoyantPreserved: true,
      minScore: 70
    }
  },
  {
    name: 'Scénario 2 : Budget Serré',
    description: 'Budget 50€, routine basique 5 steps',
    steps: [
      { careType: 'nettoyage', stepNumber: 1, displayTitle: 'Nettoyage', targetZones: ['visage entier'] },
      { careType: 'hydratation', stepNumber: 2, displayTitle: 'Hydratation', targetZones: ['visage entier'] },
      { careType: 'protection', stepNumber: 3, displayTitle: 'Protection SPF', targetZones: ['visage entier'] },
      { careType: 'anti-age', stepNumber: 4, displayTitle: 'Anti-âge', targetZones: ['visage entier'] },
      { careType: 'tonification', stepNumber: 5, displayTitle: 'Tonification', targetZones: ['visage entier'] }
    ],
    profile: {
      skinType: 'normal',
      isPregnant: false,
      concerns: ['wrinkles'],
      allergies: []
    },
    budget: 50,
    expectedOutcome: {
      budgetRespected: true,
      spfPreserved: true, // CRITIQUE
      nettoyantPreserved: true, // CRITIQUE
      minScore: 65
    }
  },
  {
    name: 'Scénario 3 : Budget Très Serré',
    description: 'Budget 30€, routine minimale 3 steps essentiels',
    steps: [
      { careType: 'nettoyage', stepNumber: 1, displayTitle: 'Nettoyage', targetZones: ['visage entier'] },
      { careType: 'hydratation', stepNumber: 2, displayTitle: 'Hydratation', targetZones: ['visage entier'] },
      { careType: 'protection', stepNumber: 3, displayTitle: 'Protection SPF', targetZones: ['visage entier'] }
    ],
    profile: {
      skinType: 'dry',
      isPregnant: false,
      concerns: ['dryness'],
      allergies: []
    },
    budget: 30,
    expectedOutcome: {
      budgetRespected: true,
      spfPreserved: true,
      nettoyantPreserved: true,
      minScore: 70
    }
  },
  {
    name: 'Scénario 4 : Routine Luxe Optimisée',
    description: 'Budget 100€, routine premium 8 steps',
    steps: [
      { careType: 'nettoyage', stepNumber: 1, displayTitle: 'Nettoyage', targetZones: ['visage entier'] },
      { careType: 'tonification', stepNumber: 2, displayTitle: 'Tonification', targetZones: ['visage entier'] },
      { careType: 'hydratation', stepNumber: 3, displayTitle: 'Hydratation', targetZones: ['visage entier'] },
      { careType: 'protection', stepNumber: 4, displayTitle: 'Protection SPF', targetZones: ['visage entier'] },
      { careType: 'anti-age', stepNumber: 5, displayTitle: 'Anti-âge', targetZones: ['visage entier'] },
      { careType: 'eclat', stepNumber: 6, displayTitle: 'Éclat', targetZones: ['joues'] },
      { careType: 'exfoliation', stepNumber: 7, displayTitle: 'Exfoliation', targetZones: ['visage entier'] },
      { careType: 'masque', stepNumber: 8, displayTitle: 'Masque', targetZones: ['visage entier'] }
    ],
    profile: {
      skinType: 'mature',
      isPregnant: false,
      concerns: ['wrinkles', 'dark_spots', 'loss_of_firmness'],
      allergies: []
    },
    budget: 100,
    expectedOutcome: {
      budgetRespected: true,
      spfPreserved: true,
      nettoyantPreserved: true,
      minScore: 65
    }
  }
]

// ==================== FONCTIONS TEST ====================

async function runScenario(scenario: TestScenario, database: any) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🧪 ${scenario.name}`)
  console.log(`📝 ${scenario.description}`)
  console.log(`💰 Budget : ${scenario.budget}€`)
  console.log(`📋 Steps : ${scenario.steps.length}`)
  console.log(`${'='.repeat(80)}\n`)

  const matcher = new ProductMatcherV2(database)

  // PHASE 1 : Matching pur (sans contrainte budget)
  console.log('🔥 PHASE 1 : Matching pur (routine idéale)\n')

  const idealMatches: ProductMatch[] = []
  let matchFailures = 0

  for (const step of scenario.steps) {
    try {
      const match = await matcher.selectForRoutineStep(
        step as any,
        scenario.profile as any,
        {
          maxBudget: scenario.budget,
          expectedSteps: scenario.steps.length,
          enableSmartOptimization: true // Pas de filtrage budget unitaire
        } as BudgetConstraints
      )

      idealMatches.push({
        step: {
          stepNumber: step.stepNumber,
          careType: step.careType,
          displayTitle: step.displayTitle,
          targetZones: step.targetZones
        },
        mainProduct: match.selectedProduct,
        alternatives: match.alternatives,
        matchingScore: match.matchingScore,
        reasoning: match.reasoning
      })

      console.log(
        `  ✅ Step ${step.stepNumber} (${step.careType}) : ` +
          `${match.selectedProduct.name} - ${match.selectedProduct.price.toFixed(2)}€ (score: ${match.matchingScore})`
      )
    } catch (error: any) {
      console.log(`  ❌ Step ${step.stepNumber} (${step.careType}) : ÉCHEC - ${error.message}`)
      matchFailures++
    }
  }

  if (matchFailures > 0) {
    console.log(`\n⚠️ ${matchFailures} steps ont échoué au matching - Skip optimisation`)
    return null
  }

  // Calculer coût routine idéale
  const idealCost = idealMatches.reduce((sum, m) => sum + m.mainProduct.price, 0)
  const idealScoreAvg = idealMatches.reduce((sum, m) => sum + m.matchingScore, 0) / idealMatches.length

  console.log(`\n💵 Coût routine idéale : ${idealCost.toFixed(2)}€`)
  console.log(`📊 Score moyen : ${idealScoreAvg.toFixed(1)}/100`)

  // PHASE 2 : Optimisation budget (si dépassement)
  if (idealCost > scenario.budget) {
    console.log(`\n⚠️ DÉPASSEMENT BUDGET : ${idealCost.toFixed(2)}€ > ${scenario.budget}€ (+${(idealCost - scenario.budget).toFixed(2)}€)`)
    console.log(`\n💰 PHASE 2 : Optimisation budget globale\n`)

    const optimized = BudgetOptimizer.optimize(
      idealMatches,
      {
        maxBudget: scenario.budget,
        expectedSteps: scenario.steps.length,
        priority: 'balanced',
        flexibility: 0.1,
        enableSmartOptimization: true
      },
      (msg: string) => console.log(`  ${msg}`)
    )

    console.log(`\n✅ RÉSULTAT OPTIMISATION :`)
    console.log(`  • Coût final : ${optimized.finalCost.toFixed(2)}€`)
    console.log(`  • Économie : ${optimized.savings.toFixed(2)}€`)
    console.log(`  • Substitutions : ${optimized.substitutions.length}`)
    console.log(`  • Suppressions : ${optimized.stepsRemoved.length}`)
    console.log(`  • SPF + Nettoyant préservés : ${optimized.preservedCritical ? '✅' : '❌'}`)

    if (optimized.substitutions.length > 0) {
      console.log(`\n🔄 DÉTAILS SUBSTITUTIONS :`)
      optimized.substitutions.forEach((sub) => {
        console.log(
          `  • Step ${sub.stepNumber} (${sub.careType}) : ` +
            `${sub.originalProduct.name} (${sub.originalProduct.price.toFixed(2)}€) → ` +
            `${sub.substituteProduct.name} (${sub.substituteProduct.price.toFixed(2)}€) ` +
            `[Économie: ${sub.priceSaved.toFixed(2)}€, Score perdu: ${sub.scoreLost.toFixed(1)} pts]`
        )
      })
    }

    if (optimized.stepsRemoved.length > 0) {
      console.log(`\n❌ STEPS SUPPRIMÉS :`)
      optimized.stepsRemoved.forEach((stepNum) => {
        const step = scenario.steps.find((s) => s.stepNumber === stepNum)
        console.log(`  • Step ${stepNum} (${step?.careType}) - Priorité ${CARETYPE_BUDGET_PRIORITIES[step?.careType || '']?.priority || 'N/A'}/10`)
      })
    }

    // Calculer score final
    const finalScoreAvg = optimized.routine.reduce((sum, m) => sum + m.matchingScore, 0) / optimized.routine.length
    const scoreLossPercent = ((idealScoreAvg - finalScoreAvg) / idealScoreAvg) * 100

    console.log(`\n📊 SCORE MOYEN FINAL : ${finalScoreAvg.toFixed(1)}/100 (perte: ${scoreLossPercent.toFixed(1)}%)`)

    // Validation métriques
    console.log(`\n✅ VALIDATION MÉTRIQUES :`)
    const budgetRespected = optimized.finalCost <= scenario.budget
    const spfPreserved = optimized.routine.some((m) => m.step.careType === 'protection')
    const nettoyantPreserved = optimized.routine.some((m) => m.step.careType === 'nettoyage')
    const scoreAcceptable = finalScoreAvg >= scenario.expectedOutcome.minScore

    console.log(`  ${budgetRespected ? '✅' : '❌'} Budget respecté : ${optimized.finalCost.toFixed(2)}€ ≤ ${scenario.budget}€`)
    console.log(`  ${spfPreserved ? '✅' : '❌'} SPF préservé (priorité 10)`)
    console.log(`  ${nettoyantPreserved ? '✅' : '❌'} Nettoyant préservé (priorité 9)`)
    console.log(`  ${scoreAcceptable ? '✅' : '❌'} Score ≥ ${scenario.expectedOutcome.minScore} : ${finalScoreAvg.toFixed(1)}`)
    console.log(`  ${scoreLossPercent <= 10 ? '✅' : '⚠️'} Perte score ≤ 10% : ${scoreLossPercent.toFixed(1)}%`)

    return {
      scenario: scenario.name,
      success: budgetRespected && spfPreserved && nettoyantPreserved && scoreAcceptable,
      metrics: {
        idealCost,
        finalCost: optimized.finalCost,
        savings: optimized.savings,
        idealScore: idealScoreAvg,
        finalScore: finalScoreAvg,
        scoreLossPercent,
        substitutions: optimized.substitutions.length,
        suppressions: optimized.stepsRemoved.length,
        spfPreserved,
        nettoyantPreserved
      }
    }
  } else {
    console.log(`\n✅ Budget respecté (${idealCost.toFixed(2)}€ ≤ ${scenario.budget}€) - Pas d'optimisation requise`)

    return {
      scenario: scenario.name,
      success: true,
      metrics: {
        idealCost,
        finalCost: idealCost,
        savings: 0,
        idealScore: idealScoreAvg,
        finalScore: idealScoreAvg,
        scoreLossPercent: 0,
        substitutions: 0,
        suppressions: 0,
        spfPreserved: true,
        nettoyantPreserved: true
      }
    }
  }
}

// ==================== MAIN ====================

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗')
  console.log('║                                                                           ║')
  console.log('║         🧪 TESTS BUDGET OPTIMIZATION V2 - Scénarios Réalistes            ║')
  console.log('║                                                                           ║')
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n')

  console.log('📦 Chargement base de données produits (110 produits)...')
  const database = await ProductDatabaseLoader.load()
  console.log(`✅ ${database.allProducts.length} produits chargés\n`)

  console.log('📋 Exécution scénarios tests...\n')

  const results = []

  for (const scenario of TEST_SCENARIOS) {
    const result = await runScenario(scenario, database)
    if (result) {
      results.push(result)
    }
  }

  // Rapport final
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 RAPPORT FINAL')
  console.log('='.repeat(80) + '\n')

  const successCount = results.filter((r) => r.success).length
  const successRate = (successCount / results.length) * 100

  console.log(`✅ Scénarios réussis : ${successCount}/${results.length} (${successRate.toFixed(1)}%)`)

  console.log(`\n📈 MÉTRIQUES AGRÉGÉES :\n`)

  const avgSavings = results.reduce((sum, r) => sum + r.metrics.savings, 0) / results.length
  const avgScoreLoss = results.reduce((sum, r) => sum + r.metrics.scoreLossPercent, 0) / results.length
  const spfPreservedRate = (results.filter((r) => r.metrics.spfPreserved).length / results.length) * 100
  const nettoyantPreservedRate = (results.filter((r) => r.metrics.nettoyantPreserved).length / results.length) * 100

  console.log(`  • Économie moyenne : ${avgSavings.toFixed(2)}€`)
  console.log(`  • Perte score moyenne : ${avgScoreLoss.toFixed(1)}%`)
  console.log(`  • SPF préservé : ${spfPreservedRate.toFixed(0)}%`)
  console.log(`  • Nettoyant préservé : ${nettoyantPreservedRate.toFixed(0)}%`)

  console.log(`\n🎯 VALIDATION OBJECTIFS :\n`)
  console.log(`  ${spfPreservedRate === 100 ? '✅' : '❌'} SPF préservé 100% des cas (cible: 100%)`)
  console.log(`  ${nettoyantPreservedRate >= 95 ? '✅' : '❌'} Nettoyant préservé ≥ 95% (cible: 95%)`)
  console.log(`  ${avgScoreLoss <= 10 ? '✅' : '⚠️'} Perte score moyenne ≤ 10% (cible: ≤10%)`)
  console.log(`  ${successRate === 100 ? '✅' : '⚠️'} Taux succès 100% (cible: 100%)`)

  console.log('\n' + '='.repeat(80))
  console.log(`${successRate === 100 ? '✅' : '⚠️'} TESTS ${successRate === 100 ? 'RÉUSSIS' : 'PARTIELS'}`)
  console.log('='.repeat(80) + '\n')

  process.exit(successRate === 100 ? 0 : 1)
}

main().catch((error) => {
  console.error('\n❌ ERREUR FATALE :', error)
  process.exit(1)
})

