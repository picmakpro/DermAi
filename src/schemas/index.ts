/**
 * Utilitaires pour validation et gestion d'erreurs IA
 * Ces fonctions sont partagées entre tous les schémas v2/*
 */

// Types d'erreur pour classification intelligente
export enum ErrorType {
  VALIDATION_ERROR = 'validation',
  NETWORK_ERROR = 'network',
  TIMEOUT_ERROR = 'timeout',
  RATE_LIMIT_ERROR = 'rate_limit',
  AUTHENTICATION_ERROR = 'auth',
  PARSING_ERROR = 'parsing',
  OPENAI_REFUSAL = 'openai_refusal'
}

// Fonction de classification d'erreurs
export function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase()
  
  if (message.includes('openai_refusal') || message.includes('refusé d\'analyser')) {
    return ErrorType.OPENAI_REFUSAL
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION_ERROR
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return ErrorType.NETWORK_ERROR
  }
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return ErrorType.TIMEOUT_ERROR
  }
  
  if (message.includes('rate limit') || message.includes('quota') || message.includes('too many requests')) {
    return ErrorType.RATE_LIMIT_ERROR
  }
  
  if (message.includes('unauthorized') || message.includes('api key')) {
    return ErrorType.AUTHENTICATION_ERROR
  }
  
  if (message.includes('json') || message.includes('parse')) {
    return ErrorType.PARSING_ERROR
  }
  
  return ErrorType.NETWORK_ERROR // Fallback
}

// Fonction pour déterminer si retry est approprié
export function shouldRetry(error: Error, attempt: number): boolean {
  const errorType = classifyError(error)
  
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
    case ErrorType.AUTHENTICATION_ERROR:
      return false // Ne pas retry
      
    case ErrorType.OPENAI_REFUSAL:
      return attempt <= 3 // Retry les refus OpenAI (prompt amélioré)
      
    case ErrorType.NETWORK_ERROR:
    case ErrorType.TIMEOUT_ERROR:
    case ErrorType.RATE_LIMIT_ERROR:
    case ErrorType.PARSING_ERROR:
      return attempt <= 3 // Retry jusqu'à 3 fois
      
    default:
      return false
  }
}

// Fonction de génération de seed déterministe
export function generateSeed(imageHashes: string[]): number {
  // Créer un hash stable basé sur les images
  const combined = imageHashes.sort().join('')
  let hash = 0
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Retourner un seed positif entre 1 et 2147483647
  return Math.abs(hash) || 1
}

// Fonction de hash d'image simple
export function hashImage(base64Data: string): string {
  // Prendre un échantillon de la donnée base64 pour créer un hash stable
  const sample = base64Data.slice(0, 100) + base64Data.slice(-100)
  let hash = 0
  
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return Math.abs(hash).toString(36)
}

