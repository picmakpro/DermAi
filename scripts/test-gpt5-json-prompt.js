#!/usr/bin/env node

/**
 * 🧪 Test du nouveau prompt simplifié pour GPT-5
 */

const OpenAI = require('openai')
require('dotenv').config({ path: '.env.local' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testGPT5JsonPrompt() {
  console.log('🧪 Test prompt simplifié GPT-5 pour diagnostic\n')
  
  const systemPrompt = `Tu es un dermatologue expert. Analyse les photos de peau et retourne UNIQUEMENT un objet JSON valide.

STRUCTURE JSON REQUISE (respecte EXACTEMENT ce format):
{
  "skinType": "string (Sèche/Grasse/Mixte/Normale/Sensible)",
  "scores": {
    "overall": number (0-100),
    "hydration": { "value": number (0-100), "justification": "string", "confidence": number (0-1), "basedOn": [] },
    "wrinkles": { "value": number (0-100), "justification": "string", "confidence": number (0-1), "basedOn": [] },
    "firmness": { "value": number (0-100), "justification": "string", "confidence": number (0-1), "basedOn": [] },
    "radiance": { "value": number (0-100), "justification": "string", "confidence": number (0-1), "basedOn": [] },
    "pores": { "value": number (0-100), "justification": "string", "confidence": number (0-1), "basedOn": [] },
    "spots": { "value": number (0-100), "justification": "string", "confidence": number (0-1), "basedOn": [] },
    "darkCircles": { "value": number (0-100), "justification": "string", "confidence": number (0-1), "basedOn": [] },
    "evenness": { "value": number (0-100), "justification": "string", "confidence": number (0-1), "basedOn": [] }
  },
  "zoneSpecificIssues": [
    {
      "zone": "string",
      "problem": "string", 
      "intensity": "léger|modéré|intense",
      "description": "string"
    }
  ],
  "generalObservation": "string (200-500 caractères)",
  "skinAgeEstimate": number,
  "photosAnalyzed": ["string"]
}

RÈGLES:
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
- Tous les champs sont obligatoires
- Les scores vont de 0 (pire) à 100 (meilleur)
- Analyse objective basée sur les photos uniquement
- Pas de conseils ni recommandations`

  try {
    console.log('1️⃣ Envoi de la requête GPT-5...')
    const response = await openai.chat.completions.create({
      model: 'gpt-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: 'Analyse: femme 30 ans, photos montrant peau mixte avec zone T brillante, quelques pores visibles sur le nez, teint globalement uniforme, légères ridules autour des yeux.' 
        }
      ],
      max_completion_tokens: 4000
    })
    
    console.log('✅ Réponse reçue:')
    console.log('   Finish reason:', response.choices[0].finish_reason)
    console.log('   Tokens utilisés:', response.usage?.total_tokens)
    console.log('')
    
    const content = response.choices[0].message.content
    console.log('2️⃣ Contenu brut:')
    console.log(content.substring(0, 200) + '...')
    console.log('')
    
    console.log('3️⃣ Parsing JSON...')
    try {
      const parsed = JSON.parse(content)
      console.log('✅ JSON parsé avec succès!')
      console.log('   skinType:', parsed.skinType)
      console.log('   overall score:', parsed.scores?.overall)
      console.log('   issues count:', parsed.zoneSpecificIssues?.length || 0)
      console.log('   Tous les champs requis présents:', 
        !!parsed.skinType && 
        !!parsed.scores && 
        !!parsed.zoneSpecificIssues &&
        !!parsed.generalObservation &&
        typeof parsed.skinAgeEstimate === 'number' &&
        !!parsed.photosAnalyzed
      )
    } catch (e) {
      console.log('❌ Erreur parsing:', e.message)
      console.log('   Contenu complet:')
      console.log(content)
    }
    
  } catch (error) {
    console.error('❌ Erreur API:', error.message)
  }
}

testGPT5JsonPrompt()
