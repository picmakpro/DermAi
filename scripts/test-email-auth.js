#!/usr/bin/env node

/**
 * Script de test pour l'authentification email/password
 */

require('dotenv').config({ path: '.env.local' })

const testEmailAuth = async () => {
  console.log('🧪 TEST AUTHENTIFICATION EMAIL/PASSWORD\n')
  
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  console.log('📧 Email de test:', testEmail)
  console.log('🔐 Mot de passe:', testPassword)
  
  try {
    // Test de l'API signup
    console.log('\n1️⃣ Test API Signup...')
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: 'Test User'
      })
    })
    
    const signupData = await signupResponse.json()
    console.log('Réponse signup:', signupResponse.status, signupData)
    
    if (signupResponse.ok) {
      console.log('✅ Inscription réussie!')
      
      // Test de connexion
      console.log('\n2️⃣ Test Connexion...')
      const signinResponse = await fetch('http://localhost:3000/api/auth/signin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          redirect: false
        })
      })
      
      const signinData = await signinResponse.json()
      console.log('Réponse signin:', signinResponse.status, signinData)
      
      if (signinData.ok) {
        console.log('✅ Connexion réussie!')
      } else {
        console.log('❌ Erreur connexion:', signinData.error)
      }
    } else {
      console.log('❌ Erreur inscription:', signupData.error)
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message)
    console.log('\n💡 Vérifiez que le serveur Next.js est démarré sur localhost:3000')
  }
}

// Vérifier que le serveur est accessible
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/providers')
    if (response.ok) {
      console.log('✅ Serveur Next.js accessible')
      return true
    }
  } catch (error) {
    console.log('❌ Serveur Next.js non accessible')
    console.log('💡 Démarrez le serveur avec: npm run dev')
    return false
  }
}

const main = async () => {
  const serverOk = await checkServer()
  if (serverOk) {
    await testEmailAuth()
  }
}

main().catch(console.error)
