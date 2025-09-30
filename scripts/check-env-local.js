#!/usr/bin/env node

/**
 * 🔍 Script de vérification .env.local pour tests GPT-5
 * 
 * Usage: node scripts/check-env-local.js
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Vérification configuration .env.local pour GPT-5\n')

// ══════════════════════════════════════════════════════════════
// VARIABLES REQUISES
// ══════════════════════════════════════════════════════════════

const REQUIRED_VARS = [
  { name: 'OPENAI_API_KEY', required: true, description: 'Clé API OpenAI' },
  { name: 'USE_GPT5_DIAGNOSTIC', required: true, description: 'Feature flag GPT-5 Diagnostic', default: 'true' },
  { name: 'USE_GPT5_ROUTINE', required: true, description: 'Feature flag GPT-5 Routine', default: 'true' },
  { name: 'GPT5_ROLLOUT_PERCENTAGE', required: true, description: 'Rollout percentage', default: '100' }
]

const OPTIONAL_VARS = [
  { name: 'AI_MODEL_DIAGNOSTIC', description: 'Modèle diagnostic', default: 'chatgpt-5' },
  { name: 'AI_MODEL_ROUTINE', description: 'Modèle routine', default: 'gpt-5-thinking' },
  { name: 'TIMEOUT_DIAGNOSTIC_MS', description: 'Timeout diagnostic', default: '25000' },
  { name: 'TIMEOUT_ROUTINE_MS', description: 'Timeout routine', default: '50000' },
  { name: 'OPENAI_DAILY_BUDGET_USD', description: 'Budget quotidien', default: '50' },
  { name: 'LOG_LEVEL', description: 'Niveau logs', default: 'info' }
]

// ══════════════════════════════════════════════════════════════
// VÉRIFICATION
// ══════════════════════════════════════════════════════════════

const envPath = path.join(__dirname, '..', '.env.local')

if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env.local introuvable\n')
  console.log('📝 Créez le fichier .env.local avec les variables suivantes :\n')
  printRequiredVars()
  process.exit(1)
}

// Charger .env.local
require('dotenv').config({ path: envPath })

let hasErrors = false
let hasWarnings = false

console.log('📁 Fichier .env.local trouvé ✅\n')
console.log('══════════════════════════════════════════════════════════════\n')

// Vérifier variables requises
console.log('🔴 VARIABLES OBLIGATOIRES\n')
REQUIRED_VARS.forEach(v => {
  const value = process.env[v.name]
  
  if (!value) {
    console.error(`  ❌ ${v.name} : MANQUANT`)
    console.error(`     → ${v.description}`)
    if (v.default) {
      console.error(`     → Valeur recommandée : ${v.default}`)
    }
    hasErrors = true
  } else {
    // Masquer API key pour sécurité
    const displayValue = v.name === 'OPENAI_API_KEY' 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value
    
    console.log(`  ✅ ${v.name} : ${displayValue}`)
  }
})

console.log('\n══════════════════════════════════════════════════════════════\n')

// Vérifier variables optionnelles
console.log('🟡 VARIABLES OPTIONNELLES (avec défauts)\n')
OPTIONAL_VARS.forEach(v => {
  const value = process.env[v.name]
  
  if (!value) {
    console.warn(`  ⚠️  ${v.name} : Non défini`)
    console.warn(`     → Défaut : ${v.default}`)
    hasWarnings = true
  } else {
    console.log(`  ✅ ${v.name} : ${value}`)
  }
})

console.log('\n══════════════════════════════════════════════════════════════\n')

// Validations spécifiques
console.log('🔍 VALIDATIONS SPÉCIFIQUES\n')

// Validation API Key format
const apiKey = process.env.OPENAI_API_KEY
if (apiKey) {
  if (!apiKey.startsWith('sk-')) {
    console.error('  ❌ OPENAI_API_KEY : Format invalide (doit commencer par "sk-")')
    hasErrors = true
  } else if (apiKey.length < 40) {
    console.error('  ❌ OPENAI_API_KEY : Longueur invalide (trop courte)')
    hasErrors = true
  } else {
    console.log('  ✅ Format OPENAI_API_KEY : Valide')
  }
}

// Validation rollout percentage
const rollout = process.env.GPT5_ROLLOUT_PERCENTAGE
if (rollout) {
  const num = parseInt(rollout, 10)
  if (isNaN(num) || num < 0 || num > 100) {
    console.error('  ❌ GPT5_ROLLOUT_PERCENTAGE : Doit être entre 0 et 100')
    hasErrors = true
  } else {
    console.log(`  ✅ GPT5_ROLLOUT_PERCENTAGE : ${num}% (valide)`)
  }
}

// Validation timeouts
const timeouts = [
  'TIMEOUT_DIAGNOSTIC_MS',
  'TIMEOUT_ROUTINE_MS',
  'TIMEOUT_PRODUCTS_MS'
]

timeouts.forEach(t => {
  const value = process.env[t]
  if (value) {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1000) {
      console.error(`  ❌ ${t} : Doit être >= 1000ms`)
      hasErrors = true
    }
  }
})

console.log('\n══════════════════════════════════════════════════════════════\n')

// ══════════════════════════════════════════════════════════════
// RÉSUMÉ FINAL
// ══════════════════════════════════════════════════════════════

if (hasErrors) {
  console.error('❌ ERREURS DÉTECTÉES - Configuration incomplète\n')
  console.log('📝 Ajoutez les variables manquantes dans .env.local\n')
  console.log('📚 Guide : docs/deployment/config-env-local.md\n')
  process.exit(1)
}

if (hasWarnings) {
  console.warn('⚠️  WARNINGS - Variables optionnelles manquantes (valeurs par défaut utilisées)\n')
}

console.log('✅ CONFIGURATION VALIDE - Prêt pour tests locaux GPT-5\n')
console.log('🚀 Prochaines étapes :\n')
console.log('   1. npm test          # Lancer tests unitaires (43 tests)')
console.log('   2. npm run build     # Build production')
console.log('   3. npm run dev       # Démarrer serveur développement')
console.log('   4. http://localhost:3000  # Tester manuellement\n')

process.exit(0)

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

function printRequiredVars() {
  console.log('# Variables obligatoires')
  REQUIRED_VARS.forEach(v => {
    if (v.name === 'OPENAI_API_KEY') {
      console.log(`${v.name}=sk-proj-votre-clé-api-ici`)
    } else if (v.default) {
      console.log(`${v.name}=${v.default}`)
    } else {
      console.log(`${v.name}=`)
    }
  })
  console.log('\n# Variables optionnelles recommandées')
  OPTIONAL_VARS.forEach(v => {
    console.log(`${v.name}=${v.default}`)
  })
  console.log('')
}
