#!/usr/bin/env node

/**
 * 🧪 TEST ENVIRONNEMENT PRÊT
 * 
 * Script rapide pour vérifier que l'environnement est configuré
 * et prêt pour les tests d'authentification
 */

console.log('🧪 TEST ENVIRONNEMENT - Prêt pour Jour 5')
console.log('=' .repeat(50))

// Vérifier les variables d'environnement
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'OPENAI_API_KEY'
]

let allEnvVarsPresent = true

console.log('\n🔧 Variables d\'environnement:')
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  const status = value ? '✅' : '❌'
  const display = value ? (varName.includes('SECRET') || varName.includes('KEY') ? '***' : value.substring(0, 20) + '...') : 'NON DÉFINIE'
  
  console.log(`${status} ${varName}: ${display}`)
  
  if (!value) {
    allEnvVarsPresent = false
  }
})

console.log('\n🎯 Statut global:')
if (allEnvVarsPresent) {
  console.log('✅ ENVIRONNEMENT PRÊT')
  console.log('🚀 Vous pouvez démarrer les tests:')
  console.log('   npm run dev')
  console.log('   http://localhost:3000/test-cloud-migration')
  process.exit(0)
} else {
  console.log('❌ ENVIRONNEMENT NON PRÊT')
  console.log('⚠️  Configurer les variables manquantes dans .env.local')
  console.log('📖 Voir: GUIDE-CONFIGURATION-ENV.md')
  process.exit(1)
}
