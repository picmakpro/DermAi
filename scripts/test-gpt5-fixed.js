#!/usr/bin/env node

/**
 * 🧪 Test rapide GPT-5 avec les corrections
 */

const OpenAI = require('openai')
require('dotenv').config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testGPT5() {
  console.log('🧪 Test GPT-5 avec paramètres corrigés\n')
  
  try {
    // Test 1: gpt-5 (diagnostic)
    console.log('1️⃣ Test gpt-5 (Diagnostic)...')
    const response1 = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: 'Tu es un dermatologue expert.' },
        { role: 'user', content: 'Analyse cette peau: type normal, âge 30 ans.' }
      ],
      max_completion_tokens: 200  // ✅ Paramètre correct
      // temperature: 0.0,  // ❌ GPT-5 n'accepte que la valeur par défaut (1)
      // response_format: { type: "json_object" }  // Testons sans d'abord
    })
    
    console.log('✅ GPT-5 fonctionne!')
    console.log('   Tokens utilisés:', response1.usage?.total_tokens)
    console.log('   Réponse:', response1.choices[0].message.content?.substring(0, 100) + '...\n')
    
    // Test 2: o3 (reasoning/routine)
    console.log('2️⃣ Test o3 (Reasoning)...')
    const response2 = await openai.chat.completions.create({
      model: 'o3',
      messages: [
        { role: 'system', content: 'Tu es un expert en routine de soin.' },
        { role: 'user', content: 'Crée une routine pour peau sensible, budget confort, style équilibré.' }
      ],
      max_completion_tokens: 300  // ✅ Paramètre correct
      // temperature: 0.1,  // ❌ o3 n'accepte que la valeur par défaut
      // response_format: { type: "json_object" },
      // reasoning_effort: 'medium'  // Testons sans d'abord
    })
    
    console.log('✅ o3 (Reasoning) fonctionne!')
    console.log('   Tokens utilisés:', response2.usage?.total_tokens)
    console.log('   Tokens reasoning:', response2.usage?.reasoning_tokens || 0)
    console.log('   Réponse:', response2.choices[0].message.content?.substring(0, 100) + '...\n')
    
    console.log('🎉 SUCCÈS - GPT-5 et o3 fonctionnent parfaitement!\n')
    console.log('📝 Configuration recommandée pour .env.local:')
    console.log('   AI_MODEL_DIAGNOSTIC=gpt-5')
    console.log('   AI_MODEL_ROUTINE=o3')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.response) {
      console.error('   Détails:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

testGPT5()
