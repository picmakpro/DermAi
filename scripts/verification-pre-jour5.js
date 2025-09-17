#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE VÉRIFICATION PRÉ-JOUR 5
 * 
 * Ce script vérifie que tous les éléments du Jour 4 sont en place
 * avant de commencer l'implémentation du Jour 5 (Pages Auth & Intégration)
 * 
 * Basé sur GUIDE-TEST-JOUR4.md
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 VÉRIFICATION PRÉ-JOUR 5 - Authentification & Cloud Storage')
console.log('=' .repeat(70))

let allChecksPass = true
const results = []

/**
 * Fonction utilitaire pour vérifier l'existence d'un fichier
 */
function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath)
  const exists = fs.existsSync(fullPath)
  
  results.push({
    check: description,
    status: exists ? '✅' : '❌',
    details: exists ? `Fichier trouvé: ${filePath}` : `Fichier manquant: ${filePath}`
  })
  
  if (!exists) allChecksPass = false
  return exists
}

/**
 * Fonction utilitaire pour vérifier le contenu d'un fichier
 */
function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    results.push({
      check: description,
      status: '❌',
      details: `Fichier non trouvé: ${filePath}`
    })
    allChecksPass = false
    return false
  }
  
  const content = fs.readFileSync(fullPath, 'utf8')
  const found = content.includes(searchString)
  
  results.push({
    check: description,
    status: found ? '✅' : '❌',
    details: found ? `Trouvé dans ${filePath}` : `Non trouvé dans ${filePath}: "${searchString}"`
  })
  
  if (!found) allChecksPass = false
  return found
}

console.log('\n📁 1. VÉRIFICATION STRUCTURE FICHIERS')
console.log('-'.repeat(50))

// Services Core
checkFileExists('src/lib/supabase.ts', 'Client Supabase')
checkFileExists('src/lib/supabaseAdmin.ts', 'Client Supabase Admin')
checkFileExists('src/lib/auth.ts', 'Configuration NextAuth')
checkFileExists('src/services/storage/cloudStorage.ts', 'Service Cloud Storage')
checkFileExists('src/services/migration/migrationService.ts', 'Service Migration')
checkFileExists('src/services/auth/authService.ts', 'Service Authentification')
checkFileExists('src/hooks/useAuth.ts', 'Hook useAuth')

// API Routes
checkFileExists('src/app/api/auth/[...nextauth]/route.ts', 'API Route NextAuth')
checkFileExists('src/app/api/test-supabase/route.ts', 'API Route Test Supabase')
checkFileExists('src/app/api/test-cloud-storage/route.ts', 'API Route Test Cloud Storage')
checkFileExists('src/app/api/test-migration/route.ts', 'API Route Test Migration')

// Pages de test
checkFileExists('src/app/test-cloud-migration/page.tsx', 'Page Test Cloud Migration')

console.log('\n🔧 2. VÉRIFICATION CONFIGURATION')
console.log('-'.repeat(50))

// Vérifier les imports et exports essentiels
checkFileContent('src/lib/supabase.ts', 'export const supabase', 'Export client Supabase')
checkFileContent('src/lib/supabase.ts', 'interface Profile', 'Interface Profile définie')
checkFileContent('src/lib/supabase.ts', 'interface UserAnalysis', 'Interface UserAnalysis définie')

checkFileContent('src/lib/auth.ts', 'export const authOptions', 'Configuration NextAuth exportée')
checkFileContent('src/lib/auth.ts', 'GoogleProvider', 'Provider Google configuré')

checkFileContent('src/services/storage/cloudStorage.ts', 'class CloudStorageService', 'Classe CloudStorageService')
checkFileContent('src/services/storage/cloudStorage.ts', 'saveAnalysis', 'Méthode saveAnalysis')
checkFileContent('src/services/storage/cloudStorage.ts', 'getUserAnalyses', 'Méthode getUserAnalyses')

checkFileContent('src/services/migration/migrationService.ts', 'class MigrationService', 'Classe MigrationService')
checkFileContent('src/services/migration/migrationService.ts', 'migrateLocalAnalyses', 'Méthode migrateLocalAnalyses')

checkFileContent('src/hooks/useAuth.ts', 'export function useAuth', 'Hook useAuth exporté')
checkFileContent('src/hooks/useAuth.ts', 'useSession', 'Import useSession NextAuth')

console.log('\n🗄️ 3. VÉRIFICATION TYPES & INTERFACES')
console.log('-'.repeat(50))

// Vérifier les types essentiels
checkFileContent('src/lib/supabase.ts', 'subscription_status: \'free\' | \'premium\'', 'Type subscription_status')
checkFileContent('src/lib/supabase.ts', 'migrated_from_local: boolean', 'Champ migrated_from_local')
checkFileContent('src/services/migration/migrationService.ts', 'interface MigrationResult', 'Interface MigrationResult')

console.log('\n📦 4. VÉRIFICATION DÉPENDANCES')
console.log('-'.repeat(50))

// Vérifier package.json
const packageJsonPath = path.join(process.cwd(), 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'next-auth',
    '@next-auth/supabase-adapter'
  ]
  
  requiredDeps.forEach(dep => {
    const installed = dependencies[dep]
    results.push({
      check: `Dépendance ${dep}`,
      status: installed ? '✅' : '❌',
      details: installed ? `Version: ${installed}` : 'Non installée'
    })
    if (!installed) allChecksPass = false
  })
} else {
  results.push({
    check: 'package.json',
    status: '❌',
    details: 'Fichier package.json non trouvé'
  })
  allChecksPass = false
}

console.log('\n📋 5. RÉSUMÉ DES VÉRIFICATIONS')
console.log('-'.repeat(50))

results.forEach(result => {
  console.log(`${result.status} ${result.check}`)
  if (result.status === '❌') {
    console.log(`   └─ ${result.details}`)
  }
})

console.log('\n🎯 6. STATUT GLOBAL')
console.log('-'.repeat(50))

if (allChecksPass) {
  console.log('✅ TOUTES LES VÉRIFICATIONS PASSÉES')
  console.log('🚀 PRÊT POUR LE JOUR 5 - Pages Auth & Intégration')
  console.log('')
  console.log('📋 PROCHAINES ÉTAPES:')
  console.log('1. Configurer les variables d\'environnement (.env.local)')
  console.log('2. Créer le projet Supabase et récupérer les clés')
  console.log('3. Configurer Google OAuth dans Google Cloud Console')
  console.log('4. Tester l\'authentification sur http://localhost:3000/test-cloud-migration')
  console.log('5. Implémenter les pages d\'authentification')
  process.exit(0)
} else {
  console.log('❌ CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ')
  console.log('⚠️  CORRIGER LES ERREURS AVANT DE CONTINUER')
  console.log('')
  console.log('📋 ACTIONS REQUISES:')
  
  const failedChecks = results.filter(r => r.status === '❌')
  failedChecks.forEach((check, index) => {
    console.log(`${index + 1}. ${check.check}: ${check.details}`)
  })
  
  process.exit(1)
}
