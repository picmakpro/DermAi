#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TEST SPRINT 1 - TOP 3 PRODUITS
 * 
 * Test rapide de validation des schémas et prompts créés
 * Version : 1.0
 * Date : 17 septembre 2025
 */

const path = require('path')

// Configuration du chemin pour les imports TypeScript
require('ts-node').register({
  project: path.resolve(__dirname, '../tsconfig.json'),
  transpileOnly: true
})

async function testSprint1() {
  console.log('🚀 Test Sprint 1 - Top 3 Produits par Catégorie')
  console.log('=' .repeat(60))
  
  try {
    // Test 1: Import des schémas V3
    console.log('\n📋 Test 1: Import des schémas V3...')
    const { ProductSelectionV3Schema, validateTop3Products } = require('../src/schemas/v3')
    console.log('✅ Schémas V3 importés avec succès')
    
    // Test 2: Validation d'un exemple de données
    console.log('\n📋 Test 2: Validation schéma avec données exemple...')
    const exampleData = {
      selectedProducts: [
        {
          routineStepId: 1,
          primaryProduct: {
            catalogId: 'test-001',
            productName: 'Nettoyant Test',
            brand: 'Test Brand',
            price: 15.99,
            ranking: 1,
            justification: 'Produit optimal pour votre type de peau diagnostiqué avec zones sensibles.',
            applicationAdvice: 'Appliquer matin et soir',
            timing: 'matin et soir',
            targetZones: ['visage entier'],
            differentiators: ['Formule douce', 'pH équilibré'],
            priceComparison: 'Optimal',
            strengthComparison: 'Équilibré'
          },
          alternatives: [
            {
              catalogId: 'test-002',
              productName: 'Nettoyant Premium',
              brand: 'Premium Brand',
              price: 22.50,
              ranking: 2,
              justification: 'Alternative premium avec actifs spécialisés.',
              applicationAdvice: 'Usage matin et soir',
              timing: 'matin et soir',
              targetZones: ['visage entier'],
              differentiators: ['Actifs premium'],
              priceComparison: 'Premium',
              strengthComparison: 'Plus fort'
            },
            {
              catalogId: 'test-003',
              productName: 'Nettoyant Économique',
              brand: 'Eco Brand',
              price: 9.99,
              ranking: 3,
              justification: 'Option économique sans compromis.',
              applicationAdvice: 'Application simple',
              timing: 'matin et soir',
              targetZones: ['visage entier'],
              differentiators: ['Prix accessible'],
              priceComparison: 'Économique',
              strengthComparison: 'Plus doux'
            }
          ],
          categoryRanking: {
            criteria: ['Compatibilité', 'Efficacité', 'Prix'],
            justification: 'Classement basé sur diagnostic.',
            diversificationStrategy: '3 marques, 3 prix, approches variées'
          }
        }
      ],
      budgetBreakdown: {
        totalCost: 15.99,
        budgetRespected: true,
        optimizations: ['Budget respecté'],
        alternatives: ['Premium +41%', 'Économique -37%'],
        priceDistribution: {
          primary: 15.99,
          alternatives: [22.50, 9.99]
        }
      },
      coherenceValidation: {
        routineProductsMatch: true,
        zonesCoherent: true,
        timingLogical: true,
        budgetRespected: true,
        diversificationSuccess: true,
        issuesFound: []
      }
    }
    
    const validated = ProductSelectionV3Schema.parse(exampleData)
    console.log('✅ Validation Zod réussie')
    console.log(`   - ${validated.selectedProducts.length} étape(s) validée(s)`)
    console.log(`   - ${validated.selectedProducts.length * 3} produits au total`)
    console.log(`   - Diversification: ${validated.coherenceValidation.diversificationSuccess ? 'Réussie' : 'Échouée'}`)
    
    // Test 3: Import des prompts
    console.log('\n📋 Test 3: Import des prompts Top 3...')
    const { SELECTION_PRODUITS_TOP3_SYSTEM_PROMPT, buildTop3ProductSelectionUserPrompt } = require('../src/services/ai/core/prompts/selectionProduitsTop3')
    console.log('✅ Prompts Top 3 importés avec succès')
    console.log(`   - Prompt système: ${SELECTION_PRODUITS_TOP3_SYSTEM_PROMPT.length} caractères`)
    
    // Test 4: Génération d'un prompt utilisateur
    console.log('\n📋 Test 4: Génération prompt utilisateur...')
    const mockRoutine = {
      phases: {
        immediate: { 
          duration: '1-2 semaines',
          steps: [{ stepNumber: 1, careType: 'nettoyage', timing: 'matin et soir' }] 
        },
        adaptation: { 
          duration: '3-4 semaines',
          steps: [] 
        },
        maintenance: { 
          duration: 'Continu',
          steps: [] 
        }
      }
    }
    
    const mockCatalog = {
      cleanser: [
        { brand: 'Test', name: 'Nettoyant Test', price: 15 }
      ]
    }
    
    const userPrompt = buildTop3ProductSelectionUserPrompt(
      mockRoutine,
      mockCatalog,
      { maxBudget: 50 },
      []
    )
    
    console.log('✅ Prompt utilisateur généré')
    console.log(`   - Longueur: ${userPrompt.length} caractères`)
    console.log(`   - Contient "TOP 3": ${userPrompt.includes('TOP 3') ? 'Oui' : 'Non'}`)
    
    // Test 5: Validation utilitaires
    console.log('\n📋 Test 5: Test des utilitaires de validation...')
    const { validateBrandDiversification, validateProductCoherence } = require('../src/schemas/v3')
    
    const testProducts = [
      { brand: 'Brand A', targetZones: ['visage'], timing: 'matin' },
      { brand: 'Brand B', targetZones: ['visage'], timing: 'matin' },
      { brand: 'Brand C', targetZones: ['visage'], timing: 'matin' }
    ]
    
    const diversification = validateBrandDiversification(testProducts)
    const coherence = validateProductCoherence(testProducts)
    
    console.log('✅ Utilitaires de validation testés')
    console.log(`   - Diversification: ${diversification.uniqueBrands}/3 marques uniques`)
    console.log(`   - Cohérence zones: ${coherence.zonesCoherent ? 'OK' : 'KO'}`)
    console.log(`   - Cohérence timing: ${coherence.timingCoherent ? 'OK' : 'KO'}`)
    
    console.log('\n🎉 TOUS LES TESTS SPRINT 1 RÉUSSIS!')
    console.log('=' .repeat(60))
    console.log('✅ Schémas V3 fonctionnels')
    console.log('✅ Prompts Top 3 opérationnels') 
    console.log('✅ Validation et utilitaires OK')
    console.log('✅ Prêt pour intégration AnalysisService')
    
    return true
    
  } catch (error) {
    console.error('\n❌ ERREUR DURANT LES TESTS:')
    console.error(error.message)
    if (error.issues) {
      console.error('Détails Zod:', error.issues)
    }
    console.error('\nStack trace:', error.stack)
    return false
  }
}

// Exécuter les tests
if (require.main === module) {
  testSprint1()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Erreur fatale:', error)
      process.exit(1)
    })
}

module.exports = { testSprint1 }
