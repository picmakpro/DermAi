#!/usr/bin/env node

/**
 * 🧪 Test pour comprendre le format de réponse GPT-5
 */

const OpenAI = require('openai')
require('dotenv').config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testGPT5Diagnostic() {
  console.log('🧪 Test diagnostic GPT-5 avec différents formats\n')
  
  try {
    // Test 1: Sans format JSON
    console.log('1️⃣ Test sans format JSON forcé...')
    const response1 = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un dermatologue expert. Analyse la peau et retourne UNIQUEMENT un objet JSON avec les champs: skinType (string), overallScore (number 0-100), issues (array).'
        },
        { 
          role: 'user', 
          content: 'Analyse cette peau: femme 30 ans, peau normale avec quelques imperfections zone T.'
        }
      ],
      max_completion_tokens: 2000
    })
    
    console.log('✅ Réponse GPT-5:')
    console.log('   Contenu:', response1.choices[0].message.content)
    console.log('   Finish reason:', response1.choices[0].finish_reason)
    console.log('   Tokens:', response1.usage?.total_tokens)
    console.log('')
    
    // Test 2: Avec instruction JSON explicite
    console.log('2️⃣ Test avec instruction JSON explicite...')
    const response2 = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { 
          role: 'system', 
          content: `Tu es un dermatologue expert. 
IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.
Format requis:
{
  "skinType": "string",
  "overallScore": number,
  "issues": []
}`
        },
        { 
          role: 'user', 
          content: 'Analyse: femme 30 ans, peau normale, zone T légèrement grasse.'
        }
      ],
      max_completion_tokens: 2000
    })
    
    console.log('✅ Réponse GPT-5:')
    console.log('   Contenu:', response2.choices[0].message.content)
    console.log('   Finish reason:', response2.choices[0].finish_reason)
    console.log('')
    
    // Test 3: Parsing JSON
    console.log('3️⃣ Test parsing JSON...')
    try {
      const parsed = JSON.parse(response2.choices[0].message.content)
      console.log('✅ JSON parsé avec succès:', parsed)
    } catch (e) {
      console.log('❌ Erreur parsing JSON:', e.message)
      console.log('   Contenu brut:', response2.choices[0].message.content)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.response) {
      console.error('   Détails:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

testGPT5Diagnostic()

