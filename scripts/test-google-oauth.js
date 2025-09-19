#!/usr/bin/env node

/**
 * Script de test pour diagnostiquer les problèmes Google OAuth
 */

require('dotenv').config({ path: '.env.local' })

console.log('🔍 TEST CONFIGURATION GOOGLE OAUTH\n')

// Vérifier les variables d'environnement Google
console.log('📋 VARIABLES GOOGLE OAUTH:')
console.log('==========================')

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const nextAuthUrl = process.env.NEXTAUTH_URL

console.log('✅ GOOGLE_CLIENT_ID:', googleClientId ? `${googleClientId.substring(0, 20)}...` : '❌ MANQUANT')
console.log('✅ GOOGLE_CLIENT_SECRET:', googleClientSecret ? `${googleClientSecret.substring(0, 10)}...` : '❌ MANQUANT')
console.log('✅ NEXTAUTH_URL:', nextAuthUrl || '❌ MANQUANT')

// Vérifier le format du Client ID
if (googleClientId) {
  const isValidFormat = googleClientId.includes('.apps.googleusercontent.com')
  console.log('✅ Format Client ID:', isValidFormat ? '✅ VALIDE' : '❌ INVALIDE')
  
  if (!isValidFormat) {
    console.log('⚠️  Le Client ID doit finir par .apps.googleusercontent.com')
  }
}

// Construire l'URL de callback
const callbackUrl = `${nextAuthUrl}/api/auth/callback/google`
console.log('✅ URL Callback:', callbackUrl)

console.log('\n🔧 CONFIGURATION GOOGLE CLOUD CONSOLE REQUISE:')
console.log('===============================================')
console.log('1. Aller sur: https://console.cloud.google.com/')
console.log('2. Sélectionner votre projet')
console.log('3. APIs & Services → Credentials')
console.log('4. Cliquer sur votre OAuth 2.0 Client ID')
console.log('5. Dans "Authorized redirect URIs", ajouter EXACTEMENT:')
console.log(`   ${callbackUrl}`)
console.log('6. Dans "Authorized JavaScript origins", ajouter:')
console.log(`   ${nextAuthUrl}`)

console.log('\n⚠️  POINTS CRITIQUES:')
console.log('=====================')
console.log('- Pas de slash final dans les URLs')
console.log('- Respecter exactement la casse')
console.log('- Sauvegarder après modification')
console.log('- Attendre 5-10 minutes pour propagation')

console.log('\n🧪 TEST DE CONNEXION:')
console.log('=====================')
console.log('1. Redémarrer le serveur Next.js')
console.log('2. Aller sur: http://localhost:3000/auth/signin')
console.log('3. Cliquer "Continuer avec Google"')
console.log('4. Vérifier les logs de la console')

console.log('\n📊 LOGS À SURVEILLER:')
console.log('=====================')
console.log('✅ Succès: "NextAuth Debug: OAUTH_CALLBACK_SUCCESS"')
console.log('❌ Erreur: "invalid_client (Unauthorized)"')
console.log('❌ Erreur: "redirect_uri_mismatch"')

// Test de l'URL de callback
console.log('\n🔗 URLS IMPORTANTES:')
console.log('====================')
console.log('- Page de connexion:', `${nextAuthUrl}/auth/signin`)
console.log('- Callback Google:', callbackUrl)
console.log('- Debug auth:', `${nextAuthUrl}/debug-auth`)
console.log('- API NextAuth:', `${nextAuthUrl}/api/auth/providers`)

console.log('\n💡 SOLUTIONS COURANTES:')
console.log('=======================')
console.log('1. Vérifier que le projet Google Cloud est correct')
console.log('2. Vérifier que les APIs Google+ sont activées')
console.log('3. Régénérer les credentials si nécessaire')
console.log('4. Vérifier les quotas et limites')
console.log('5. Tester avec un autre compte Google')

