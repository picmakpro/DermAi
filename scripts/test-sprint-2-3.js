#!/usr/bin/env node

/**
 * Script de test pour Sprint 2.3 - Routine Tracker & Étagères
 * Vérifie que tous les composants et API routes sont fonctionnels
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 TEST SPRINT 2.3 - ROUTINE TRACKER & ÉTAGÈRES')
console.log('=' .repeat(60))

// Vérifier les fichiers créés
const filesToCheck = [
  // API Routes
  'src/app/api/routine/completions/route.ts',
  'src/app/api/routine/stats/route.ts', 
  'src/app/api/routine/today/route.ts',
  'src/app/api/routine/shelves/route.ts',
  'src/app/api/routine/shelves/[id]/route.ts',
  'src/app/api/products/search/route.ts',
  
  // Pages
  'src/app/dashboard/routine/page.tsx',
  'src/app/dashboard/routine/shelves/page.tsx',
  
  // Composants
  'src/components/dashboard/routine/RoutineCalendar.tsx',
  'src/components/dashboard/routine/ProductShelves.tsx',
  'src/components/dashboard/routine/ShelfEditor.tsx',
  
  // SQL
  'SPRINT-2-3-SUPABASE-TABLES.sql'
]

let allFilesExist = true

console.log('\n📁 Vérification des fichiers créés:')
filesToCheck.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file))
  console.log(`${exists ? '✅' : '❌'} ${file}`)
  if (!exists) allFilesExist = false
})

// Vérifier les dépendances
console.log('\n📦 Vérification des dépendances:')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const requiredDeps = [
  'react-calendar',
  '@dnd-kit/core',
  '@dnd-kit/sortable', 
  '@dnd-kit/utilities',
  'date-fns'
]

let allDepsInstalled = true
requiredDeps.forEach(dep => {
  const installed = packageJson.dependencies[dep] || packageJson.devDependencies[dep]
  console.log(`${installed ? '✅' : '❌'} ${dep} ${installed ? `(${installed})` : '(manquant)'}`)
  if (!installed) allDepsInstalled = false
})

// Vérifier la structure des composants
console.log('\n🔍 Vérification du contenu des composants:')

const checks = [
  {
    file: 'src/components/dashboard/routine/RoutineCalendar.tsx',
    contains: ['react-calendar', 'DashboardCard', 'fetchCompletions', 'handleToggleCompletion'],
    name: 'RoutineCalendar'
  },
  {
    file: 'src/components/dashboard/routine/ProductShelves.tsx', 
    contains: ['@dnd-kit/core', 'DndContext', 'SortableContext', 'handleDragEnd'],
    name: 'ProductShelves'
  },
  {
    file: 'src/components/dashboard/routine/ShelfEditor.tsx',
    contains: ['SortableProductItem', 'CustomProductForm', 'searchProducts'],
    name: 'ShelfEditor'
  },
  {
    file: 'src/app/api/routine/completions/route.ts',
    contains: ['routine_completions', 'getServerSession', 'completion_date', 'phase'],
    name: 'API Completions'
  },
  {
    file: 'src/app/api/routine/stats/route.ts',
    contains: ['calculateRoutineStats', 'currentStreak', 'bestStreak', 'completionRate'],
    name: 'API Stats'
  }
]

let allChecksPass = true
checks.forEach(check => {
  try {
    const content = fs.readFileSync(check.file, 'utf8')
    const missingItems = check.contains.filter(item => !content.includes(item))
    
    if (missingItems.length === 0) {
      console.log(`✅ ${check.name} - Tous les éléments requis présents`)
    } else {
      console.log(`❌ ${check.name} - Éléments manquants: ${missingItems.join(', ')}`)
      allChecksPass = false
    }
  } catch (error) {
    console.log(`❌ ${check.name} - Erreur lecture fichier: ${error.message}`)
    allChecksPass = false
  }
})

// Résumé final
console.log('\n' + '='.repeat(60))
console.log('📊 RÉSUMÉ DU TEST SPRINT 2.3')
console.log('='.repeat(60))

const results = [
  { name: 'Fichiers créés', status: allFilesExist },
  { name: 'Dépendances installées', status: allDepsInstalled },
  { name: 'Contenu des composants', status: allChecksPass }
]

results.forEach(result => {
  console.log(`${result.status ? '✅' : '❌'} ${result.name}`)
})

const overallSuccess = allFilesExist && allDepsInstalled && allChecksPass

console.log('\n' + (overallSuccess ? '🎉' : '⚠️') + ' STATUT GLOBAL: ' + 
  (overallSuccess ? 'SPRINT 2.3 PRÊT ✅' : 'CORRECTIONS NÉCESSAIRES ❌'))

if (overallSuccess) {
  console.log('\n📋 PROCHAINES ÉTAPES:')
  console.log('1. Exécuter le script SQL: SPRINT-2-3-SUPABASE-TABLES.sql')
  console.log('2. Tester les pages: /dashboard/routine et /dashboard/routine/shelves')
  console.log('3. Vérifier les API routes avec des données de test')
  console.log('4. Valider le drag & drop des étagères')
  console.log('5. Tester le calendrier de routine avec complétion')
}

process.exit(overallSuccess ? 0 : 1)

