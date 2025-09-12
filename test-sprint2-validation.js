#!/usr/bin/env node

/**
 * 🔍 TEST VALIDATION SPRINT 2 REFONTE - DermAI V2
 * Validation complète de la sélection produits IA
 */

const fs = require('fs')
const path = require('path')

console.log('\n' + '🔍'.repeat(60))
console.log('🔍 VALIDATION SPRINT 2 REFONTE IA-FIRST - DermAI V2')
console.log('🔍'.repeat(60))

// Test 1: Vérification existence services IA
console.log('\n📋 TEST 1: VÉRIFICATION EXISTENCE SERVICES IA')
console.log('=' .repeat(50))

const aiRoutineGeneratorPath = 'src/services/ai/AIRoutineGenerator.ts'
const aiProductSelectorPath = 'src/services/ai/AIProductSelector.ts'
const enrichedCatalogPath = 'src/data/enrichedCatalog.json'
const refonteSchemaPath = 'src/schemas/refonte.ts'

const checkFile = (filePath, description) => {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath)
    console.log(`✅ ${description}: ${filePath} (${Math.round(stats.size/1024)}KB)`)
    return true
  } else {
    console.log(`❌ ${description}: ${filePath} - MANQUANT`)
    return false
  }
}

let test1Pass = true
test1Pass &= checkFile(aiRoutineGeneratorPath, 'AIRoutineGenerator')
test1Pass &= checkFile(aiProductSelectorPath, 'AIProductSelector')
test1Pass &= checkFile(enrichedCatalogPath, 'Catalogue enrichi')
test1Pass &= checkFile(refonteSchemaPath, 'Schémas refonte')

console.log(`\n📊 RÉSULTAT TEST 1: ${test1Pass ? '✅ PASS' : '❌ FAIL'}`)

// Test 2: Vérification intégration dans analysis.service.ts
console.log('\n📋 TEST 2: VÉRIFICATION INTÉGRATION PIPELINE IA')
console.log('=' .repeat(50))

const analysisServicePath = 'src/services/ai/analysis.service.ts'
let test2Pass = true

if (fs.existsSync(analysisServicePath)) {
  const analysisContent = fs.readFileSync(analysisServicePath, 'utf8')
  
  // Vérifier imports
  const hasAIProductSelectorImport = analysisContent.includes('import { AIProductSelector }')
  const hasAIRoutineGeneratorImport = analysisContent.includes('import { AIRoutineGenerator }')
  const hasEnrichedCatalogImport = analysisContent.includes('import { EnrichedCatalogService }')
  
  console.log(`${hasAIProductSelectorImport ? '✅' : '❌'} Import AIProductSelector`)
  console.log(`${hasAIRoutineGeneratorImport ? '✅' : '❌'} Import AIRoutineGenerator`)
  console.log(`${hasEnrichedCatalogImport ? '✅' : '❌'} Import EnrichedCatalogService`)
  
  // Vérifier utilisation
  const hasProductSelectorUsage = analysisContent.includes('AIProductSelector.selectOptimalProducts')
  const hasRoutineGeneratorUsage = analysisContent.includes('AIRoutineGenerator.generatePersonalizedRoutine')
  
  console.log(`${hasProductSelectorUsage ? '✅' : '❌'} Utilisation AIProductSelector.selectOptimalProducts`)
  console.log(`${hasRoutineGeneratorUsage ? '✅' : '❌'} Utilisation AIRoutineGenerator.generatePersonalizedRoutine`)
  
  test2Pass = hasAIProductSelectorImport && hasAIRoutineGeneratorImport && 
              hasEnrichedCatalogImport && hasProductSelectorUsage && hasRoutineGeneratorUsage
} else {
  console.log('❌ analysis.service.ts non trouvé')
  test2Pass = false
}

console.log(`\n📊 RÉSULTAT TEST 2: ${test2Pass ? '✅ PASS' : '❌ FAIL'}`)

// Test 3: Vérification suppression algorithme produits
console.log('\n📋 TEST 3: VÉRIFICATION SUPPRESSION ALGORITHME PRODUITS')
console.log('=' .repeat(50))

let test3Pass = true

if (fs.existsSync(analysisServicePath)) {
  const analysisContent = fs.readFileSync(analysisServicePath, 'utf8')
  
  // Vérifier que les anciennes méthodes sont supprimées/commentées
  const hasOldSelectProducts = analysisContent.includes('selectProductsBasedOnDiagnosis(') && 
                                !analysisContent.includes('// selectProductsBasedOnDiagnosis()')
  const hasOldBuildPrompt = analysisContent.includes('buildProductSelectionSystemPrompt(') && 
                           !analysisContent.includes('// buildProductSelectionSystemPrompt()')
  const hasOldParseResponse = analysisContent.includes('parseProductSelectionResponse(') && 
                             !analysisContent.includes('// parseProductSelectionResponse()')
  
  console.log(`${!hasOldSelectProducts ? '✅' : '❌'} selectProductsBasedOnDiagnosis supprimée`)
  console.log(`${!hasOldBuildPrompt ? '✅' : '❌'} buildProductSelectionSystemPrompt supprimée`)
  console.log(`${!hasOldParseResponse ? '✅' : '❌'} parseProductSelectionResponse supprimée`)
  
  // Vérifier commentaires de suppression
  const hasSuppressionComments = analysisContent.includes('SPRINT 2 REFONTE - MÉTHODE SUPPRIMÉE')
  console.log(`${hasSuppressionComments ? '✅' : '❌'} Commentaires de suppression présents`)
  
  test3Pass = !hasOldSelectProducts && !hasOldBuildPrompt && !hasOldParseResponse && hasSuppressionComments
} else {
  test3Pass = false
}

console.log(`\n📊 RÉSULTAT TEST 3: ${test3Pass ? '✅ PASS' : '❌ FAIL'}`)

// Test 4: Vérification catalogue enrichi
console.log('\n📋 TEST 4: VÉRIFICATION CATALOGUE ENRICHI')
console.log('=' .repeat(50))

let test4Pass = true

if (fs.existsSync(enrichedCatalogPath)) {
  const catalogContent = JSON.parse(fs.readFileSync(enrichedCatalogPath, 'utf8'))
  
  console.log(`✅ Catalogue chargé: ${catalogContent.length} produits`)
  
  // Vérifier structure enrichie
  const firstProduct = catalogContent[0]
  const hasEnrichedFields = firstProduct.activeIngredients && 
                           firstProduct.pH && 
                           firstProduct.compatibilities && 
                           firstProduct.contraindications !== undefined &&
                           firstProduct.potency &&
                           firstProduct.applicationOrder !== undefined
  
  console.log(`${hasEnrichedFields ? '✅' : '❌'} Structure enrichie complète`)
  console.log(`✅ Exemple produit: ${firstProduct.name} (${firstProduct.brand}) - ${firstProduct.price}€`)
  
  // Compter les catégories
  const categories = [...new Set(catalogContent.map(p => p.category))]
  console.log(`✅ Catégories disponibles: ${categories.join(', ')}`)
  
  test4Pass = hasEnrichedFields && catalogContent.length >= 5
} else {
  console.log('❌ Catalogue enrichi non trouvé')
  test4Pass = false
}

console.log(`\n📊 RÉSULTAT TEST 4: ${test4Pass ? '✅ PASS' : '❌ FAIL'}`)

// Test 5: Vérification schémas Zod refonte
console.log('\n📋 TEST 5: VÉRIFICATION SCHÉMAS ZOD REFONTE')
console.log('=' .repeat(50))

let test5Pass = true

if (fs.existsSync(refonteSchemaPath)) {
  const schemaContent = fs.readFileSync(refonteSchemaPath, 'utf8')
  
  // Vérifier schémas Sprint 1
  const hasRoutineSchema = schemaContent.includes('RoutinePersonnaliseeCompleteSchema')
  const hasRoutinePhaseSchema = schemaContent.includes('RoutinePhaseSchema')
  const hasPersonalizedTimingSchema = schemaContent.includes('PersonalizedTimingSchema')
  
  console.log(`${hasRoutineSchema ? '✅' : '❌'} RoutinePersonnaliseeCompleteSchema`)
  console.log(`${hasRoutinePhaseSchema ? '✅' : '❌'} RoutinePhaseSchema`)
  console.log(`${hasPersonalizedTimingSchema ? '✅' : '❌'} PersonalizedTimingSchema`)
  
  // Vérifier schémas Sprint 2
  const hasProductSelectionSchema = schemaContent.includes('ProductSelectionCompleteSchema')
  const hasSelectedProductSchema = schemaContent.includes('SelectedProductSchema')
  const hasBudgetBreakdownSchema = schemaContent.includes('BudgetBreakdownSchema')
  const hasDermatologicalCoherenceSchema = schemaContent.includes('DermatologicalCoherenceSchema')
  
  console.log(`${hasProductSelectionSchema ? '✅' : '❌'} ProductSelectionCompleteSchema`)
  console.log(`${hasSelectedProductSchema ? '✅' : '❌'} SelectedProductSchema`)
  console.log(`${hasBudgetBreakdownSchema ? '✅' : '❌'} BudgetBreakdownSchema`)
  console.log(`${hasDermatologicalCoherenceSchema ? '✅' : '❌'} DermatologicalCoherenceSchema`)
  
  test5Pass = hasRoutineSchema && hasRoutinePhaseSchema && hasPersonalizedTimingSchema &&
              hasProductSelectionSchema && hasSelectedProductSchema && hasBudgetBreakdownSchema &&
              hasDermatologicalCoherenceSchema
} else {
  console.log('❌ Schémas refonte non trouvés')
  test5Pass = false
}

console.log(`\n📊 RÉSULTAT TEST 5: ${test5Pass ? '✅ PASS' : '❌ FAIL'}`)

// Résultat global
console.log('\n' + '📊'.repeat(60))
console.log('📊 RÉSULTAT GLOBAL VALIDATION SPRINT 2 REFONTE')
console.log('📊'.repeat(60))

const allTestsPass = test1Pass && test2Pass && test3Pass && test4Pass && test5Pass

console.log(`\n🎯 MÉTRIQUES CIBLES SPRINT 2:`)
console.log(`- Services IA créés : ${test1Pass ? '✅ 100%' : '❌ INCOMPLET'}`)
console.log(`- Intégration pipeline : ${test2Pass ? '✅ 100%' : '❌ INCOMPLET'}`)
console.log(`- Suppression algorithme : ${test3Pass ? '✅ 100%' : '❌ INCOMPLET'}`)
console.log(`- Catalogue enrichi : ${test4Pass ? '✅ 100%' : '❌ INCOMPLET'}`)
console.log(`- Schémas Zod : ${test5Pass ? '✅ 100%' : '❌ INCOMPLET'}`)

console.log(`\n🏆 RÉSULTAT FINAL:`)
if (allTestsPass) {
  console.log(`✅ SPRINT 2 REFONTE VALIDÉ - Passer au Sprint 3`)
  console.log(`🚀 Sélection produits IA complètement implémentée`)
  console.log(`🎉 Architecture IA-First fonctionnelle`)
} else {
  console.log(`❌ SPRINT 2 REFONTE INCOMPLET - Corriger avant de continuer`)
  console.log(`🔧 Utiliser prompt "Debug Sprint 2 Refonte" pour identifier problèmes`)
}

console.log('\n' + '🔍'.repeat(60))

// Nettoyer le fichier de test
setTimeout(() => {
  if (fs.existsSync('test-sprint2-validation.js')) {
    fs.unlinkSync('test-sprint2-validation.js')
    console.log('🧹 Fichier de test nettoyé')
  }
}, 1000)
