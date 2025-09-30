#!/usr/bin/env node

/**
 * 🔍 Script de test pour identifier les noms corrects des modèles GPT-5
 * 
 * Usage: node scripts/test-gpt5-models.js
 */

const OpenAI = require('openai')
require('dotenv').config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// ══════════════════════════════════════════════════════════════
// MODÈLES À TESTER (basés sur la documentation)
// ══════════════════════════════════════════════════════════════

const MODELS_TO_TEST = [
  // Noms actuels dans le code
  'chatgpt-5',
  'gpt-5-thinking',
  
  // Variations possibles basées sur la documentation
  'gpt-5',
  'gpt-5-turbo',
  'gpt-5-vision',
  'gpt-5-reasoning',
  'o3',              // Mentionné comme prédécesseur
  'o3-mini',
  
  // Patterns OpenAI habituels
  'gpt-5-1106',      // Pattern avec date
  'gpt-5-0125',
  'gpt-5-preview',
  'gpt-5-latest',
  
  // Modèles confirmés (pour validation)
  'gpt-4o',          // Devrait fonctionner
  'gpt-4o-mini'      // Devrait fonctionner
]

// ══════════════════════════════════════════════════════════════
// TEST CHAQUE MODÈLE
// ══════════════════════════════════════════════════════════════

async function testModel(modelName) {
  try {
    console.log(`\n🧪 Test du modèle: ${modelName}`)
    
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: 'Test model availability' },
        { role: 'user', content: 'Hello, please respond with OK' }
      ],
      max_tokens: 10,
      temperature: 0
    })
    
    console.log(`  ✅ SUCCÈS - Modèle "${modelName}" disponible`)
    console.log(`  📊 Tokens utilisés: ${response.usage?.total_tokens}`)
    return { model: modelName, status: 'available', usage: response.usage }
    
  } catch (error) {
    if (error.status === 404) {
      console.log(`  ❌ ERREUR 404 - Modèle "${modelName}" introuvable`)
    } else {
      console.log(`  ⚠️  AUTRE ERREUR (${error.status}) - ${error.message}`)
    }
    return { model: modelName, status: 'error', error: error.message }
  }
}

// ══════════════════════════════════════════════════════════════
// LISTE DES MODÈLES DISPONIBLES
// ══════════════════════════════════════════════════════════════

async function listAvailableModels() {
  try {
    console.log('\n📋 Récupération de la liste des modèles disponibles...\n')
    
    const models = await openai.models.list()
    
    console.log('🔍 Modèles GPT-5 disponibles:')
    const gpt5Models = []
    
    for (const model of models.data) {
      if (model.id.includes('gpt-5') || model.id.includes('o3')) {
        gpt5Models.push(model)
        console.log(`  • ${model.id} (créé: ${new Date(model.created * 1000).toLocaleDateString()})`)
      }
    }
    
    if (gpt5Models.length === 0) {
      console.log('  ❌ Aucun modèle GPT-5 trouvé dans votre compte')
      
      console.log('\n🔍 Modèles GPT-4 disponibles:')
      for (const model of models.data) {
        if (model.id.includes('gpt-4')) {
          console.log(`  • ${model.id}`)
        }
      }
    }
    
    return gpt5Models
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des modèles:', error.message)
    return []
  }
}

// ══════════════════════════════════════════════════════════════
// VÉRIFICATION PERMISSIONS COMPTE
// ══════════════════════════════════════════════════════════════

async function checkAccountPermissions() {
  try {
    console.log('\n🔐 Vérification des permissions du compte...\n')
    
    // Test avec un modèle de base pour vérifier l'API key
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    })
    
    console.log('  ✅ API Key valide et fonctionnelle')
    
    // Vérifier les quotas/limites
    // Note: L'API OpenAI ne fournit pas directement cette info
    console.log('  ℹ️  Note: Vérifiez votre dashboard OpenAI pour:')
    console.log('     - Statut du compte (Tier 1/2/3/4/5)')
    console.log('     - Accès anticipé GPT-5 (si applicable)')
    console.log('     - Limites de taux (RPM/TPM)')
    console.log('     - URL: https://platform.openai.com/usage')
    
  } catch (error) {
    console.error('  ❌ Erreur API Key:', error.message)
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════

async function main() {
  console.log('════════════════════════════════════════════════════════════')
  console.log('🔍 TEST DISPONIBILITÉ MODÈLES GPT-5')
  console.log('════════════════════════════════════════════════════════════')
  
  // 1. Vérifier permissions compte
  await checkAccountPermissions()
  
  // 2. Lister modèles disponibles
  const availableGPT5 = await listAvailableModels()
  
  // 3. Tester chaque modèle
  console.log('\n════════════════════════════════════════════════════════════')
  console.log('🧪 TESTS INDIVIDUELS DES MODÈLES')
  console.log('════════════════════════════════════════════════════════════')
  
  const results = []
  for (const model of MODELS_TO_TEST) {
    const result = await testModel(model)
    results.push(result)
  }
  
  // 4. Résumé
  console.log('\n════════════════════════════════════════════════════════════')
  console.log('📊 RÉSUMÉ DES RÉSULTATS')
  console.log('════════════════════════════════════════════════════════════')
  
  const available = results.filter(r => r.status === 'available')
  const unavailable = results.filter(r => r.status === 'error')
  
  console.log(`\n✅ Modèles disponibles (${available.length}):`)
  available.forEach(r => console.log(`  • ${r.model}`))
  
  console.log(`\n❌ Modèles non disponibles (${unavailable.length}):`)
  unavailable.forEach(r => console.log(`  • ${r.model}`))
  
  // 5. Recommandations
  console.log('\n════════════════════════════════════════════════════════════')
  console.log('💡 RECOMMANDATIONS')
  console.log('════════════════════════════════════════════════════════════')
  
  if (available.some(r => r.model.includes('gpt-5'))) {
    const gpt5Model = available.find(r => r.model.includes('gpt-5'))
    console.log(`\n✅ GPT-5 DISPONIBLE !`)
    console.log(`   Utilisez ce nom de modèle: "${gpt5Model.model}"`)
    console.log(`\n   Mettez à jour votre .env.local:`)
    console.log(`   AI_MODEL_DIAGNOSTIC=${gpt5Model.model}`)
    console.log(`   AI_MODEL_ROUTINE=${gpt5Model.model}`)
  } else {
    console.log(`\n⚠️  GPT-5 NON DISPONIBLE sur votre compte`)
    console.log(`\n   Causes possibles:`)
    console.log(`   1. Votre compte n'a pas encore accès à GPT-5`)
    console.log(`   2. GPT-5 nécessite un tier spécifique (Tier 4/5)`)
    console.log(`   3. Accès limité par région/organisation`)
    console.log(`\n   Actions:`)
    console.log(`   1. Vérifiez votre tier: https://platform.openai.com/account/limits`)
    console.log(`   2. Contactez OpenAI support pour accès GPT-5`)
    console.log(`   3. Utilisez GPT-4o en attendant (excellent modèle)`)
  }
}

// Lancer le script
main().catch(console.error)
