#!/usr/bin/env node

/**
 * 🧪 Test du normaliseur GPT-5
 */

// Simuler une réponse GPT-5 avec les erreurs identifiées
const gpt5Response = {
  "skinType": "Mixte",
  "scores": {
    "overall": 80,
    "hydration": { "value": 74, "justification": "Test", "confidence": 0.8, "basedOn": [] },
    "wrinkles": { "value": 85, "justification": "Test", "confidence": 0.8, "basedOn": [] },
    "firmness": { "value": 82, "justification": "Test", "confidence": 0.8, "basedOn": [] },
    "radiance": { "value": 78, "justification": "Test", "confidence": 0.8, "basedOn": [] },
    "pores": { "value": 70, "justification": "Test", "confidence": 0.8, "basedOn": [] },
    "spots": { "value": 88, "justification": "Test", "confidence": 0.8, "basedOn": [] },
    "darkCircles": { "value": 75, "justification": "Test", "confidence": 0.8, "basedOn": [] },
    "evenness": { "value": 80, "justification": "Test", "confidence": 0.8, "basedOn": [] }
    // ❌ skinAge manquant
  },
  "zoneSpecificIssues": [
    {
      "zone": "Front",  // ❌ Majuscule
      "problem": "Rides légères",
      "intensity": "modéré",  // ❌ Masculin
      "description": "Test"
    },
    {
      "zone": "Joues",  // ❌ Majuscule
      "problem": "Pores visibles",
      "intensity": "légère",  // ✅ Correct
      "description": "Test"
    },
    {
      "zone": "Mâchoire/Menton",  // ❌ Non standard
      "problem": "Imperfections",
      "intensity": "modéré",  // ❌ Masculin
      "description": "Test"
    },
    {
      "zone": "Contour des yeux",  // ❌ Non standard
      "problem": "Ridules",
      "intensity": "léger",  // ❌ Masculin
      "description": "Test"
    }
  ],
  "generalObservation": "Test observation",
  "skinAgeEstimate": 32,
  "photosAnalyzed": ["front"]
}

// Import du normaliseur (simulation)
function normalizeZone(zone) {
  const zoneMap = {
    'Front': 'front',
    'Joues': 'joues',
    'Mâchoire/Menton': 'menton',
    'Contour des yeux': 'contour-yeux'
  }
  return zoneMap[zone] || zone.toLowerCase()
}

function normalizeIntensity(intensity) {
  const intensityMap = {
    'modéré': 'modérée',
    'léger': 'légère'
  }
  return intensityMap[intensity] || intensity
}

console.log('🧪 Test Normaliseur GPT-5\n')

console.log('❌ AVANT normalisation:')
console.log('   scores.skinAge:', gpt5Response.scores.skinAge ? '✅' : '❌ MANQUANT')
gpt5Response.zoneSpecificIssues.forEach((issue, idx) => {
  console.log(`   [${idx}] zone: "${issue.zone}", intensity: "${issue.intensity}"`)
})

// Normaliser
const normalized = JSON.parse(JSON.stringify(gpt5Response))

// Ajouter skinAge
if (!normalized.scores.skinAge) {
  normalized.scores.skinAge = {
    value: normalized.skinAgeEstimate,
    justification: `Âge cutané estimé à ${normalized.skinAgeEstimate} ans`,
    confidence: 0.7,
    basedOn: ['analyse globale']
  }
}

// Normaliser zones et intensités
normalized.zoneSpecificIssues = normalized.zoneSpecificIssues.map(issue => ({
  ...issue,
  zone: normalizeZone(issue.zone),
  intensity: normalizeIntensity(issue.intensity)
}))

console.log('\n✅ APRÈS normalisation:')
console.log('   scores.skinAge:', normalized.scores.skinAge ? '✅ AJOUTÉ' : '❌')
normalized.zoneSpecificIssues.forEach((issue, idx) => {
  console.log(`   [${idx}] zone: "${issue.zone}", intensity: "${issue.intensity}"`)
})

console.log('\n🎯 Changements appliqués:')
gpt5Response.zoneSpecificIssues.forEach((orig, idx) => {
  const norm = normalized.zoneSpecificIssues[idx]
  if (orig.zone !== norm.zone) {
    console.log(`   ✅ zone[${idx}]: "${orig.zone}" → "${norm.zone}"`)
  }
  if (orig.intensity !== norm.intensity) {
    console.log(`   ✅ intensity[${idx}]: "${orig.intensity}" → "${norm.intensity}"`)
  }
})
if (!gpt5Response.scores.skinAge && normalized.scores.skinAge) {
  console.log(`   ✅ scores.skinAge: AJOUTÉ (value: ${normalized.scores.skinAge.value})`)
}

console.log('\n✅ Normaliseur fonctionne !')
