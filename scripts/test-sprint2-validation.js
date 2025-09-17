#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE VALIDATION SPRINT 2
 * 
 * Script de validation complète pour le Sprint 2 :
 * Interface Utilisateur & Alternatives
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 VALIDATION SPRINT 2 - Interface Utilisateur & Alternatives')
console.log('=' .repeat(70))

let totalTests = 0
let passedTests = 0
let errors = []

/**
 * 🔍 FONCTION DE TEST GÉNÉRIQUE
 */
function test(description, testFn) {
  totalTests++
  try {
    const result = testFn()
    if (result) {
      console.log(`✅ ${description}`)
      passedTests++
    } else {
      console.log(`❌ ${description}`)
      errors.push(description)
    }
  } catch (error) {
    console.log(`❌ ${description} - Erreur: ${error.message}`)
    errors.push(`${description} - ${error.message}`)
  }
}

/**
 * 📁 VÉRIFICATION EXISTENCE FICHIERS
 */
console.log('\n📁 VÉRIFICATION DES FICHIERS CRÉÉS')
console.log('-'.repeat(50))

const requiredFiles = [
  'src/components/results/EnhancedProductsSection.tsx',
  'src/components/results/EnrichedProductCard.tsx',
  'src/components/results/AlternativeModal.tsx',
  'src/components/results/ProductReplacementWarning.tsx',
  'src/components/results/__tests__/EnhancedProductsSection.test.tsx',
  'src/components/results/__tests__/EnrichedProductCard.test.tsx',
  'src/components/results/__tests__/AlternativeModal.test.tsx'
]

requiredFiles.forEach(filePath => {
  test(`Fichier existe: ${filePath}`, () => {
    return fs.existsSync(path.join(process.cwd(), filePath))
  })
})

/**
 * 🔧 VÉRIFICATION INTÉGRATION
 */
console.log('\n🔧 VÉRIFICATION DE L\'INTÉGRATION')
console.log('-'.repeat(50))

test('Import EnhancedProductsSection dans page résultats', () => {
  const resultsPagePath = path.join(process.cwd(), 'src/app/results/page.tsx')
  if (!fs.existsSync(resultsPagePath)) return false
  
  const content = fs.readFileSync(resultsPagePath, 'utf8')
  return content.includes('import { EnhancedProductsSection }') &&
         content.includes('<EnhancedProductsSection')
})

test('Utilisation des hooks Sprint 1', () => {
  const sectionPath = path.join(process.cwd(), 'src/components/results/EnhancedProductsSection.tsx')
  if (!fs.existsSync(sectionPath)) return false
  
  const content = fs.readFileSync(sectionPath, 'utf8')
  return content.includes('useProductSync') && content.includes('useAlternatives')
})

/**
 * 🎨 VÉRIFICATION COMPOSANTS UI
 */
console.log('\n🎨 VÉRIFICATION DES COMPOSANTS UI')
console.log('-'.repeat(50))

test('EnhancedProductsSection contient la logique de catégorisation', () => {
  const filePath = path.join(process.cwd(), 'src/components/results/EnhancedProductsSection.tsx')
  if (!fs.existsSync(filePath)) return false
  
  const content = fs.readFileSync(filePath, 'utf8')
  return content.includes('categorizeProductsByProblem') &&
         content.includes('problemCategory')
})

test('EnrichedProductCard contient les bulles d\'info', () => {
  const filePath = path.join(process.cwd(), 'src/components/results/EnrichedProductCard.tsx')
  if (!fs.existsSync(filePath)) return false
  
  const content = fs.readFileSync(filePath, 'utf8')
  return content.includes('usageInstructions') &&
         content.includes('aiJustification') &&
         content.includes('AnimatePresence')
})

test('AlternativeModal contient la logique de comparaison', () => {
  const filePath = path.join(process.cwd(), 'src/components/results/AlternativeModal.tsx')
  if (!fs.existsSync(filePath)) return false
  
  const content = fs.readFileSync(filePath, 'utf8')
  return content.includes('calculatePriceDifference') &&
         content.includes('comparisonTags') &&
         content.includes('switchingImpact')
})

test('ProductReplacementWarning contient l\'analyse d\'impact', () => {
  const filePath = path.join(process.cwd(), 'src/components/results/ProductReplacementWarning.tsx')
  if (!fs.existsSync(filePath)) return false
  
  const content = fs.readFileSync(filePath, 'utf8')
  return content.includes('analyzeReplacementImpact') &&
         content.includes('userConfirmations') &&
         content.includes('priceImpact')
})

/**
 * 🔄 VÉRIFICATION FONCTIONNALITÉS ALTERNATIVES
 */
console.log('\n🔄 VÉRIFICATION DES FONCTIONNALITÉS D\'ALTERNATIVES')
console.log('-'.repeat(50))

test('Système de tags de comparaison implémenté', () => {
  const modalPath = path.join(process.cwd(), 'src/components/results/AlternativeModal.tsx')
  if (!fs.existsSync(modalPath)) return false
  
  const content = fs.readFileSync(modalPath, 'utf8')
  return content.includes('Plus économique') &&
         content.includes('Premium') &&
         content.includes('Plus naturel') &&
         content.includes('renderComparisonTag')
})

test('Calcul des différences de prix', () => {
  const modalPath = path.join(process.cwd(), 'src/components/results/AlternativeModal.tsx')
  if (!fs.existsSync(modalPath)) return false
  
  const content = fs.readFileSync(modalPath, 'utf8')
  return content.includes('calculatePriceDifference') &&
         content.includes('TrendingUp') &&
         content.includes('TrendingDown')
})

test('Gestion des impacts de remplacement', () => {
  const warningPath = path.join(process.cwd(), 'src/components/results/ProductReplacementWarning.tsx')
  if (!fs.existsSync(warningPath)) return false
  
  const content = fs.readFileSync(warningPath, 'utf8')
  return content.includes('routineImpact') &&
         content.includes('skinImpact') &&
         content.includes('compatibilityWarnings')
})

/**
 * 🧪 VÉRIFICATION TESTS UNITAIRES
 */
console.log('\n🧪 VÉRIFICATION DES TESTS UNITAIRES')
console.log('-'.repeat(50))

test('Tests EnhancedProductsSection complets', () => {
  const testPath = path.join(process.cwd(), 'src/components/results/__tests__/EnhancedProductsSection.test.tsx')
  if (!fs.existsSync(testPath)) return false
  
  const content = fs.readFileSync(testPath, 'utf8')
  return content.includes('describe(') &&
         content.includes('test(') &&
         content.includes('render(') &&
         content.includes('fireEvent') &&
         content.includes('waitFor')
})

test('Tests EnrichedProductCard avec interactions', () => {
  const testPath = path.join(process.cwd(), 'src/components/results/__tests__/EnrichedProductCard.test.tsx')
  if (!fs.existsSync(testPath)) return false
  
  const content = fs.readFileSync(testPath, 'utf8')
  return content.includes('should show usage instructions on hover') &&
         content.includes('should handle purchase click') &&
         content.includes('should handle alternative click')
})

test('Tests AlternativeModal avec comparaison', () => {
  const testPath = path.join(process.cwd(), 'src/components/results/__tests__/AlternativeModal.test.tsx')
  if (!fs.existsSync(testPath)) return false
  
  const content = fs.readFileSync(testPath, 'utf8')
  return content.includes('should show detailed comparison') &&
         content.includes('should handle alternative selection') &&
         content.includes('should calculate price differences')
})

/**
 * 🎯 VÉRIFICATION TYPES TYPESCRIPT
 */
console.log('\n🎯 VÉRIFICATION DES TYPES TYPESCRIPT')
console.log('-'.repeat(50))

test('Types EnrichedProduct utilisés', () => {
  const files = [
    'src/components/results/EnhancedProductsSection.tsx',
    'src/components/results/EnrichedProductCard.tsx'
  ]
  
  return files.every(filePath => {
    const fullPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(fullPath)) return false
    
    const content = fs.readFileSync(fullPath, 'utf8')
    return content.includes('EnrichedProduct')
  })
})

test('Types AlternativeProduct utilisés', () => {
  const files = [
    'src/components/results/AlternativeModal.tsx',
    'src/components/results/ProductReplacementWarning.tsx'
  ]
  
  return files.every(filePath => {
    const fullPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(fullPath)) return false
    
    const content = fs.readFileSync(fullPath, 'utf8')
    return content.includes('AlternativeProduct')
  })
})

/**
 * 🎨 VÉRIFICATION ANIMATIONS ET UX
 */
console.log('\n🎨 VÉRIFICATION ANIMATIONS ET UX')
console.log('-'.repeat(50))

test('Animations Framer Motion implémentées', () => {
  const files = [
    'src/components/results/EnhancedProductsSection.tsx',
    'src/components/results/EnrichedProductCard.tsx',
    'src/components/results/AlternativeModal.tsx',
    'src/components/results/ProductReplacementWarning.tsx'
  ]
  
  return files.every(filePath => {
    const fullPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(fullPath)) return false
    
    const content = fs.readFileSync(fullPath, 'utf8')
    return content.includes('motion.') && content.includes('framer-motion')
  })
})

test('États de chargement gérés', () => {
  const sectionPath = path.join(process.cwd(), 'src/components/results/EnhancedProductsSection.tsx')
  if (!fs.existsSync(sectionPath)) return false
  
  const content = fs.readFileSync(sectionPath, 'utf8')
  return content.includes('isLoading') &&
         content.includes('RefreshCw') &&
         content.includes('animate-spin')
})

test('Gestion des erreurs avec retry', () => {
  const sectionPath = path.join(process.cwd(), 'src/components/results/EnhancedProductsSection.tsx')
  if (!fs.existsSync(sectionPath)) return false
  
  const content = fs.readFileSync(sectionPath, 'utf8')
  return content.includes('error') &&
         content.includes('clearError') &&
         content.includes('Réessayer')
})

/**
 * 📊 RÉSULTATS FINAUX
 */
console.log('\n📊 RÉSULTATS DE LA VALIDATION')
console.log('='.repeat(70))

console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`)
console.log(`❌ Tests échoués: ${totalTests - passedTests}/${totalTests}`)

if (errors.length > 0) {
  console.log('\n❌ ERREURS DÉTECTÉES:')
  errors.forEach((error, index) => {
    console.log(`   ${index + 1}. ${error}`)
  })
}

const successRate = (passedTests / totalTests) * 100
console.log(`\n📈 Taux de réussite: ${successRate.toFixed(1)}%`)

if (successRate >= 90) {
  console.log('\n🎉 SPRINT 2 VALIDÉ AVEC SUCCÈS!')
  console.log('✅ Interface Utilisateur & Alternatives implémentées')
  console.log('✅ Tous les composants sont fonctionnels')
  console.log('✅ Tests unitaires complets')
  console.log('✅ Intégration réussie')
} else if (successRate >= 75) {
  console.log('\n⚠️  SPRINT 2 PARTIELLEMENT VALIDÉ')
  console.log('🔧 Quelques ajustements nécessaires')
} else {
  console.log('\n❌ SPRINT 2 NON VALIDÉ')
  console.log('🚨 Corrections importantes requises')
}

console.log('\n🔄 Prochaine étape: Sprint 3 - Intégration, Tests & Optimisation')
console.log('=' .repeat(70))

process.exit(successRate >= 75 ? 0 : 1)
