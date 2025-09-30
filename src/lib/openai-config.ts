/**
 * 🤖 CONFIGURATION MODÈLES OPENAI - GPT-5 MIGRATION
 * 
 * Gestion centralisée des modèles IA avec:
 * - Fallback automatique GPT-4o si GPT-5 indisponible
 * - Rollout progressif par requestId (10% → 50% → 100%)
 * - Seed déterministe pour reproductibilité diagnostic
 * 
 * @version 2.0
 * @date 30 septembre 2025
 */

import OpenAI from 'openai'
import crypto from 'crypto'

// ✅ CLIENT OPENAI LAZY-LOADED (évite erreur Jest)
let _openai: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return _openai
}

// Alias pour compatibilité
export const openai = getOpenAIClient()

// ══════════════════════════════════════════════════════════════
// 🎯 CONFIGURATION MODÈLES V2
// ══════════════════════════════════════════════════════════════

export const AI_MODELS = {
  
  /**
   * ÉTAPE 1 : Diagnostic Pur (Vision + Déterminisme)
   */
  DIAGNOSTIC: {
    primary: process.env.AI_MODEL_DIAGNOSTIC || 'gpt-5',  // ✅ Nom correct
    fallback: 'gpt-4o',
    config: {
      // temperature: 0.0,  // ❌ GPT-5 n'accepte que la valeur par défaut
      max_completion_tokens: 4000,  // ✅ AUGMENTÉ : GPT-5 a besoin de plus de tokens
      // response_format: { type: "json_object" as const }  // ❌ Non supporté par GPT-5
      // seed sera ajouté dynamiquement via hashImages()
    },
    configFallback: {
      temperature: 0.0,  // ✅ GPT-4o supporte temperature
      max_tokens: 1400,
      response_format: { type: "json_object" as const }
    }
  },
  
  /**
   * ÉTAPE 2 : Routine Personnalisée (Reasoning Multicritère)
   */
  ROUTINE: {
    primary: process.env.AI_MODEL_ROUTINE || 'o3',  // ✅ o3 = reasoning model
    fallback: 'gpt-4o',
    config: {
      // temperature: 0.1,  // ❌ o3 n'accepte que la valeur par défaut
      max_completion_tokens: 4000,  // ✅ Paramètre GPT-5
      // response_format: { type: "json_object" as const },  // ❌ Non supporté
      // reasoning_effort: 'medium'  // ❌ Non supporté dans l'API actuelle
    },
    configFallback: {
      temperature: 0.1,  // ✅ GPT-4o supporte temperature
      max_tokens: 4000,
      response_format: { type: "json_object" as const }
    }
  },
  
  /**
   * ÉTAPE 3 : Sélection Produits (Précision)
   */
  PRODUCTS: {
    primary: process.env.AI_MODEL_PRODUCTS || 'gpt-4o',
    fallback: 'gpt-4o-mini',
    config: {
      temperature: 0.0,  // ✅ Précision MAX
      max_tokens: 3000,  // ✅ GPT-4o garde max_tokens
      response_format: { type: "json_object" as const }
    }
  }
  
} as const

// ══════════════════════════════════════════════════════════════
// 🎛️ FEATURE FLAGS (ROLLOUT PROGRESSIF)
// ══════════════════════════════════════════════════════════════

export const AI_FEATURE_FLAGS = {
  /**
   * Activer GPT-5 pour Diagnostic
   * @default true
   */
  USE_GPT5_DIAGNOSTIC: process.env.USE_GPT5_DIAGNOSTIC === 'true',
  
  /**
   * Activer GPT-5 Thinking pour Routine
   * @default true
   */
  USE_GPT5_ROUTINE: process.env.USE_GPT5_ROUTINE === 'true',
  
  /**
   * Pourcentage rollout progressif GPT-5
   * @default 10
   * @range 0-100
   */
  GPT5_ROLLOUT_PERCENTAGE: parseInt(
    process.env.GPT5_ROLLOUT_PERCENTAGE || '10',
    10
  )
}

// ══════════════════════════════════════════════════════════════
// 🔧 FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════

/**
 * Sélection modèle avec fallback intelligent + rollout progressif
 * 
 * @param type - Type d'étape IA
 * @param requestId - ID unique requête (pour rollout déterministe)
 * @returns Nom du modèle à utiliser
 * 
 * @example
 * ```typescript
 * const model = selectModel('ROUTINE', 'req_abc123')
 * // Si rollout 10% et requestId hash < 10 → 'gpt-5-thinking'
 * // Sinon → 'gpt-4o' (fallback)
 * ```
 */
export function selectModel(
  type: 'DIAGNOSTIC' | 'ROUTINE' | 'PRODUCTS',
  requestId: string
): string {
  
  const config = AI_MODELS[type]
  
  // Lire flags dynamiquement (pour tests)
  const rolloutPct = parseInt(process.env.GPT5_ROLLOUT_PERCENTAGE || '10', 10)
  const flags = {
    USE_GPT5_DIAGNOSTIC: process.env.USE_GPT5_DIAGNOSTIC === 'true',
    USE_GPT5_ROUTINE: process.env.USE_GPT5_ROUTINE === 'true',
    GPT5_ROLLOUT_PERCENTAGE: isNaN(rolloutPct) ? 10 : rolloutPct
  }
  
  // ──────────────────────────────────────────────────────────
  // 1️⃣ VÉRIFICATION FEATURE FLAG
  // ──────────────────────────────────────────────────────────
  
  if (type === 'DIAGNOSTIC' && !flags.USE_GPT5_DIAGNOSTIC) {
    console.log(
      `[${requestId}] GPT-5 Diagnostic désactivé (USE_GPT5_DIAGNOSTIC=false) → Fallback ${config.fallback}`
    )
    return config.fallback
  }
  
  if (type === 'ROUTINE' && !flags.USE_GPT5_ROUTINE) {
    console.log(
      `[${requestId}] GPT-5 Routine désactivé (USE_GPT5_ROUTINE=false) → Fallback ${config.fallback}`
    )
    return config.fallback
  }
  
  // ──────────────────────────────────────────────────────────
  // 2️⃣ ROLLOUT PROGRESSIF (uniquement ROUTINE)
  // ──────────────────────────────────────────────────────────
  
  if (type === 'ROUTINE') {
    const rolloutHash = hashStringToPercentage(requestId)
    const rolloutThreshold = flags.GPT5_ROLLOUT_PERCENTAGE
    
    if (rolloutHash >= rolloutThreshold) {
      console.log(
        `[${requestId}] Rollout ${rolloutHash}% >= ${rolloutThreshold}% → Fallback ${config.fallback}`
      )
      return config.fallback
    }
    
    console.log(
      `[${requestId}] Rollout ${rolloutHash}% < ${rolloutThreshold}% → GPT-5 ${config.primary}`
    )
  }
  
  // ──────────────────────────────────────────────────────────
  // 3️⃣ MODÈLE PRIMARY SÉLECTIONNÉ
  // ──────────────────────────────────────────────────────────
  
  return config.primary
}

/**
 * Hash requestId vers pourcentage 0-99 (rollout déterministe)
 * 
 * Même requestId = Même modèle (évite flip-flop retry)
 * 
 * @param str - String à hasher (généralement requestId)
 * @returns Nombre 0-99
 * 
 * @example
 * ```typescript
 * hashStringToPercentage('req_abc123') // 42
 * hashStringToPercentage('req_abc123') // 42 (reproductible)
 * hashStringToPercentage('req_xyz789') // 17
 * ```
 */
function hashStringToPercentage(str: string): number {
  const hash = crypto.createHash('sha256').update(str).digest('hex')
  // Prendre premiers 8 chars hex → int → modulo 100
  return parseInt(hash.substring(0, 8), 16) % 100
}

/**
 * Calcul seed déterministe pour diagnostic (reproductibilité)
 * 
 * Même images (URLs triées) = Même seed = Même diagnostic
 * 
 * @param images - Liste photos avec URLs
 * @returns Seed numérique 32-bit
 * 
 * @example
 * ```typescript
 * const images = [
 *   { url: 'https://example.com/front.jpg' },
 *   { url: 'https://example.com/side.jpg' }
 * ]
 * const seed = hashImages(images) // 1234567890
 * 
 * // Même images dans ordre différent = Même seed (tri automatique)
 * const images2 = [
 *   { url: 'https://example.com/side.jpg' },
 *   { url: 'https://example.com/front.jpg' }
 * ]
 * const seed2 = hashImages(images2) // 1234567890 (identique)
 * ```
 */
export function hashImages(images: Array<{ url: string }>): number {
  // Trier URLs pour ordre déterministe
  const sortedUrls = images
    .map(img => img.url)
    .sort()
    .join('|')
  
  const hash = crypto.createHash('sha256').update(sortedUrls).digest('hex')
  
  // Convertir premiers 8 chars hex → int 32-bit
  return parseInt(hash.substring(0, 8), 16)
}

// ══════════════════════════════════════════════════════════════
// 📊 HELPERS DIAGNOSTICS
// ══════════════════════════════════════════════════════════════

/**
 * Récupère config modèle sélectionné
 * 
 * @param type - Type étape IA
 * @param requestId - ID requête
 * @returns Config complète (model + params)
 */
export function getModelConfig(
  type: 'DIAGNOSTIC' | 'ROUTINE' | 'PRODUCTS',
  requestId: string
) {
  const modelName = selectModel(type, requestId)
  const isFallback = modelName === AI_MODELS[type].fallback
  
  // Utiliser la bonne config selon le modèle (GPT-5 ou fallback)
  const baseConfig = isFallback && AI_MODELS[type].configFallback 
    ? AI_MODELS[type].configFallback 
    : AI_MODELS[type].config
    
  const rawPct = parseInt(process.env.GPT5_ROLLOUT_PERCENTAGE || '10', 10)
  const rolloutPct = isNaN(rawPct) ? 10 : rawPct
  
  return {
    model: modelName,
    ...baseConfig,
    // Métadonnées
    _meta: {
      type,
      requestId,
      isPrimary: modelName === AI_MODELS[type].primary,
      isFallback: isFallback,
      rolloutPercentage: type === 'ROUTINE' ? rolloutPct : null
    }
  }
}

/**
 * Logs configuration actuelle (debug)
 */
export function logCurrentConfig() {
  const useDiag = process.env.USE_GPT5_DIAGNOSTIC === 'true'
  const useRoutine = process.env.USE_GPT5_ROUTINE === 'true'
  const rawPct = parseInt(process.env.GPT5_ROLLOUT_PERCENTAGE || '10', 10)
  const rolloutPct = isNaN(rawPct) ? 10 : rawPct
  
  console.log('🤖 Configuration Modèles IA V2:')
  console.log('  Diagnostic:', {
    primary: AI_MODELS.DIAGNOSTIC.primary,
    fallback: AI_MODELS.DIAGNOSTIC.fallback,
    enabled: useDiag
  })
  console.log('  Routine:', {
    primary: AI_MODELS.ROUTINE.primary,
    fallback: AI_MODELS.ROUTINE.fallback,
    enabled: useRoutine,
    rollout: `${rolloutPct}%`
  })
  console.log('  Products:', {
    primary: AI_MODELS.PRODUCTS.primary,
    fallback: AI_MODELS.PRODUCTS.fallback
  })
}

// ══════════════════════════════════════════════════════════════
// 🧪 EXPORTS POUR TESTS
// ══════════════════════════════════════════════════════════════

export const __testing = {
  hashStringToPercentage,
  AI_MODELS,
  AI_FEATURE_FLAGS
}
