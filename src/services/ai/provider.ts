/**
 * AI Provider Interface
 * Abstracts AI model calls to support multiple providers (OpenAI, Mock, etc.)
 */

export type VisionInput = { 
  photos: { url: string; angle?: string }[]; 
  lighting_info?: string | null 
}

export type RoutineInput = { 
  visionOutput: unknown; 
  questionnaire: unknown 
}

export type ProductsInput = { 
  routineBlueprint: unknown; 
  catalog: unknown; 
  user: unknown 
}

export interface AiProvider {
  step1Vision(input: VisionInput): Promise<unknown>
  step2Routine(input: RoutineInput): Promise<unknown>
  step3Products(input: ProductsInput): Promise<unknown>
}

/**
 * Get the configured AI provider for a specific step
 */
export function getProvider(step?: 1 | 2 | 3): AiProvider {
  // Get step-specific override or fall back to global provider
  const stepEnvVar = step ? `DERMAI_STEP${step}_PROVIDER` : null
  const stepProvider = stepEnvVar ? process.env[stepEnvVar] : null
  const globalProvider = process.env.DERMAI_AI_PROVIDER || 'mock'
  
  const provider = (stepProvider || globalProvider).toLowerCase()
  
  if (provider === 'openai') {
    try {
      return require('./provider_openai').openaiProvider
    } catch (error) {
      console.error(`❌ Failed to load OpenAI provider for step ${step || 'global'}:`, error)
      console.warn('⚠️ Falling back to mock provider')
      return require('./mocks').mockProvider
    }
  }
  
  // Default to mock provider
  return require('./mocks').mockProvider
}

/**
 * Get provider configuration for analytics
 */
export function getProviderConfig(): { global: string; stepProviders: { 1: string; 2: string; 3: string } } {
  const globalProvider = (process.env.DERMAI_AI_PROVIDER || 'mock').toLowerCase()
  
  const stepProviders = {
    1: (process.env.DERMAI_STEP1_PROVIDER || globalProvider).toLowerCase(),
    2: (process.env.DERMAI_STEP2_PROVIDER || globalProvider).toLowerCase(),
    3: (process.env.DERMAI_STEP3_PROVIDER || globalProvider).toLowerCase()
  }
  
  return {
    global: globalProvider,
    stepProviders
  }
}

/**
 * Safe Mode: Get provider configuration with health checks
 * Forces safe defaults (all mock) unless explicitly overridden
 */
export function getSafeProviderConfig() {
  const base = (process.env.DERMAI_AI_PROVIDER || 'mock').toLowerCase()
  const s1 = (process.env.DERMAI_STEP1_PROVIDER || base).toLowerCase()
  const s2 = (process.env.DERMAI_STEP2_PROVIDER || base).toLowerCase()
  const s3 = (process.env.DERMAI_STEP3_PROVIDER || base).toLowerCase()
  const hasKey = !!process.env.OPENAI_API_KEY
  const warnOpenAiNoKey = [s1, s2, s3].some(p => p === 'openai') && !hasKey
  
  return {
    provider: base,
    stepProviders: { 1: s1, 2: s2, 3: s3 },
    hasOpenAIKey: hasKey,
    warnOpenAiNoKey
  }
}
