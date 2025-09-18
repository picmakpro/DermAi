#!/usr/bin/env node

/**
 * Script de debug pour vérifier la configuration d'authentification
 */

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: '.env.local' })

console.log('🔍 DEBUG CONFIGURATION AUTHENTIFICATION\n')

// Vérifier les variables d'environnement
console.log('📋 VARIABLES D\'ENVIRONNEMENT:')
console.log('================================')

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
]

let allPresent = true

requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  const status = value ? '✅' : '❌'
  const displayValue = value ? 
    (varName.includes('SECRET') || varName.includes('KEY') ? 
      `${value.substring(0, 10)}...` : value) : 
    'NON DÉFINI'
  
  console.log(`${status} ${varName}: ${displayValue}`)
  
  if (!value) allPresent = false
})

console.log('\n📊 RÉSUMÉ:')
console.log('==========')
if (allPresent) {
  console.log('✅ Toutes les variables d\'environnement sont définies')
} else {
  console.log('❌ Variables manquantes détectées')
  console.log('\n🔧 ACTIONS REQUISES:')
  console.log('- Vérifier le fichier .env.local')
  console.log('- S\'assurer que toutes les clés sont correctement copiées')
  console.log('- Redémarrer le serveur de développement après modification')
}

// Test de connexion Supabase si les variables sont présentes
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('\n🧪 TEST CONNEXION SUPABASE:')
  console.log('============================')
  
  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // Test simple de connexion
    supabase.from('profiles').select('count').then(({ data, error }) => {
      if (error) {
        console.log('❌ Erreur connexion Supabase:', error.message)
      } else {
        console.log('✅ Connexion Supabase réussie')
      }
    }).catch(err => {
      console.log('❌ Erreur test Supabase:', err.message)
    })
    
  } catch (error) {
    console.log('❌ Erreur import Supabase:', error.message)
  }
}

console.log('\n🔗 LIENS UTILES:')
console.log('================')
console.log('- Page de debug: http://localhost:3000/debug-auth')
console.log('- Connexion: http://localhost:3000/auth/signin')
console.log('- Inscription: http://localhost:3000/auth/signup')
console.log('- Test intégration: http://localhost:3000/test-integration')

console.log('\n💡 CONSEILS DE DEBUG:')
console.log('======================')
console.log('1. Vérifier les logs de la console navigateur')
console.log('2. Vérifier les logs du serveur Next.js')
console.log('3. Tester avec la page /debug-auth')
console.log('4. Vérifier la configuration Google Cloud Console')
console.log('5. Vérifier les politiques RLS dans Supabase')
