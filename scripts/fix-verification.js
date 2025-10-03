#!/usr/bin/env node

/**
 * Vérification des corrections appliquées
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 VÉRIFICATION DES CORRECTIONS APPLIQUÉES')
console.log('=' .repeat(50))

// Vérifier les imports corrigés
const filesToCheck = [
  'src/app/api/routine/completions/route.ts',
  'src/app/api/routine/stats/route.ts',
  'src/app/api/routine/today/route.ts',
  'src/app/api/routine/shelves/route.ts',
  'src/app/api/routine/shelves/[id]/route.ts'
]

let allFixed = true

console.log('\n📦 Vérification des imports Supabase:')
filesToCheck.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
    const hasCorrectImport = content.includes("import { supabase } from '@/lib/supabase'")
    const hasWrongImport = content.includes("import { createClient } from '@/lib/supabase'")
    const hasCreateClientCall = content.includes('const supabase = createClient()')
    
    if (hasCorrectImport && !hasWrongImport && !hasCreateClientCall) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ ${file}`)
      if (hasWrongImport) console.log(`   - Import incorrect détecté`)
      if (hasCreateClientCall) console.log(`   - Appel createClient() détecté`)
      allFixed = false
    }
  } catch (error) {
    console.log(`❌ ${file} - Erreur lecture: ${error.message}`)
    allFixed = false
  }
})

// Vérifier les pages searchParams
const pagesWithSearchParams = [
  'src/app/dashboard/analyses/page.tsx',
  'src/app/dashboard/analyses/compare/page.tsx'
]

console.log('\n🔍 Vérification des searchParams (Next.js 15):')
pagesWithSearchParams.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
    const hasAsyncFunction = content.includes('export default async function')
    const hasAwaitSearchParams = content.includes('await searchParams')
    const hasPromiseType = content.includes('searchParams: Promise<')
    
    if (hasAsyncFunction && hasAwaitSearchParams && hasPromiseType) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ ${file}`)
      if (!hasAsyncFunction) console.log(`   - Fonction non async`)
      if (!hasAwaitSearchParams) console.log(`   - searchParams non awaité`)
      if (!hasPromiseType) console.log(`   - Type Promise manquant`)
      allFixed = false
    }
  } catch (error) {
    console.log(`❌ ${file} - Erreur lecture: ${error.message}`)
    allFixed = false
  }
})

console.log('\n' + '='.repeat(50))
console.log(allFixed ? '🎉 TOUTES LES CORRECTIONS APPLIQUÉES ✅' : '⚠️  CORRECTIONS INCOMPLÈTES ❌')

if (allFixed) {
  console.log('\n📋 PROCHAINES ÉTAPES:')
  console.log('1. Redémarrer le serveur de développement')
  console.log('2. Tester les pages /dashboard/routine et /dashboard/routine/shelves')
  console.log('3. Vérifier que les API routes fonctionnent')
} else {
  console.log('\n🔧 ACTIONS REQUISES:')
  console.log('- Corriger les fichiers marqués ❌')
  console.log('- Redémarrer le serveur après corrections')
}

process.exit(allFixed ? 0 : 1)






