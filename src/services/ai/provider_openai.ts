/**
 * OpenAI Provider Implementation
 * Uses OpenAI Responses API with proper multi-image support and JSON parsing
 */

import OpenAI from 'openai'
import type { AiProvider } from './provider'
import type {
  VisionOutputV2T,
  RoutineBlueprintV2T,
  ProductSelectionV2T
} from './schemas'
import {
  validateVisionOutputV2,
  validateRoutineBlueprintV2,
  validateProductSelectionV2
} from './schemas'
import { VISION_SYSTEM_PROMPT, buildVisionUserPrompt } from './prompts/visionPrompt'
import { ROUTINE_BLUEPRINT_SYSTEM_PROMPT, buildRoutineBlueprintUserPrompt } from './prompts/routineBlueprintPrompt'
import { buildProductSelectionSystemPrompt, buildProductSelectionUserPrompt } from './prompts/productSelectionPrompt'

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o'
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o'

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required when using OpenAI provider')
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

// Retry configuration
const MAX_RETRIES = 3
const BASE_DELAY = 1000 // 1 second

/**
 * Exponential backoff retry with specific error handling
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a retryable error
      const isRetryable = 
        error?.status === 429 || // Rate limit
        error?.status >= 500 ||  // Server errors
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT'
      
      if (!isRetryable || attempt === MAX_RETRIES) {
        console.error(`❌ ${operationName} failed (attempt ${attempt}):`, error)
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = BASE_DELAY * Math.pow(2, attempt - 1)
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}), retrying in ${delay}ms:`, error.message)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Parse JSON response with repair retry
 */
async function parseJsonWithRetry<T>(
  content: string,
  validator: (data: unknown) => T,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Clean the content
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      const parsed = JSON.parse(cleanContent)
      return validator(parsed)
    } catch (error) {
      lastError = error as Error
      
      if (attempt === 1) {
        console.warn(`⚠️ JSON parse failed for ${operationName}, attempting repair...`)
        // Try to repair common JSON issues
        const repaired = content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
          .trim()
        
        try {
          const parsed = JSON.parse(repaired)
          return validator(parsed)
        } catch (repairError) {
          console.error(`❌ JSON repair failed for ${operationName}:`, repairError)
        }
      }
    }
  }
  
  console.error(`❌ JSON parsing failed for ${operationName}:`, lastError)
  throw new Error(`Invalid JSON response from ${operationName}: ${lastError?.message}`)
}

/**
 * STEP 1: Vision Analysis with multi-image support
 */
async function step1Vision(input: {
  photos: { url: string; angle?: string }[]
  lighting_info?: string | null
}): Promise<VisionOutputV2T> {
  console.log('🤖 OpenAI Provider: step1Vision called with', input.photos.length, 'photos')
  
  return withRetry(async () => {
    const systemPrompt = VISION_SYSTEM_PROMPT
    const userPrompt = buildVisionUserPrompt(input)
    
    // Prepare content parts for multi-image support
    const contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: 'text', text: userPrompt }
    ]
    
    // Add images as image_url parts
    for (const photo of input.photos) {
      if (photo.url && photo.url.startsWith('data:')) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: photo.url }
        })
      } else if (photo.url && photo.url.startsWith('http')) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: photo.url }
        })
      }
    }
    
    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: contentParts
        }
      ],
      max_tokens: 3000,
      temperature: 0.3
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI Vision')
    }
    
    console.log('✅ OpenAI Vision response received:', {
      usage: response.usage,
      model: response.model
    })
    
    return parseJsonWithRetry(content, validateVisionOutputV2, 'Vision Analysis')
  }, 'Vision Analysis')
}

/**
 * STEP 2: Routine Blueprint Generation
 */
async function step2Routine(input: {
  visionOutput: VisionOutputV2T
  questionnaire: any
}): Promise<RoutineBlueprintV2T> {
  console.log('🤖 OpenAI Provider: step2Routine called')
  
  return withRetry(async () => {
    const systemPrompt = ROUTINE_BLUEPRINT_SYSTEM_PROMPT
    // Adapt V2 vision output to legacy format for prompt
    const scores = input.visionOutput.aggregated?.scores || {}
    const overallScore = Object.values(scores).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0) / Object.keys(scores).length || 50
    
    const legacyVisionOutput = {
      scores: {
        overall: overallScore,
        ...scores
      },
      beautyAssessment: {
        mainConcern: input.visionOutput.aggregated?.concerns?.[0]?.type || 'general care',
        intensity: input.visionOutput.aggregated?.concerns?.[0]?.intensity || 'mild',
        concernedZones: input.visionOutput.aggregated?.concerns?.map(c => c.zones).flat() || [],
        skinType: 'combination' // Default fallback
      }
    }
    
    const userPrompt = buildRoutineBlueprintUserPrompt(legacyVisionOutput, input.questionnaire)
    
    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: [{ type: 'text', text: userPrompt }]
        }
      ],
      max_tokens: 2500,
      temperature: 0.2
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI Routine')
    }
    
    console.log('✅ OpenAI Routine response received:', {
      usage: response.usage,
      model: response.model
    })
    
    return parseJsonWithRetry(content, validateRoutineBlueprintV2, 'Routine Blueprint')
  }, 'Routine Blueprint')
}

/**
 * STEP 3: Product Selection
 */
async function step3Products(input: {
  routineBlueprint: RoutineBlueprintV2T
  catalog: any
  user: any
}): Promise<ProductSelectionV2T> {
  console.log('🤖 OpenAI Provider: step3Products called')
  
  return withRetry(async () => {
    // Load catalog for prompt injection
    const catalogText = await loadCatalogForPrompt()
    const systemPrompt = buildProductSelectionSystemPrompt(catalogText)
    const userPrompt = buildProductSelectionUserPrompt(
      input.routineBlueprint as any,
      input.routineBlueprint as any,
      input.user,
      input.user.monthlyBudget || '50-100',
      input.user.allergies
    )
    
    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: [{ type: 'text', text: userPrompt }]
        }
      ],
      max_tokens: 2000,
      temperature: 0.2
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI Products')
    }
    
    console.log('✅ OpenAI Products response received:', {
      usage: response.usage,
      model: response.model
    })
    
    return parseJsonWithRetry(content, validateProductSelectionV2, 'Product Selection')
  }, 'Product Selection')
}

/**
 * Load catalog for prompt injection (reused from orchestrator)
 */
async function loadCatalogForPrompt(): Promise<string> {
  try {
    const fs = await import('fs').then((m) => m.promises)
    const path = await import('path')
    const catalogPath = path.join(process.cwd(), 'public', 'affiliateCatalog.json')
    const catalogData = await fs.readFile(catalogPath, 'utf-8')
    const catalog = JSON.parse(catalogData)
    const products = catalog.products || []

    const categorized = products.reduce((acc: any, p: any) => {
      if (!acc[p.category]) acc[p.category] = []
      acc[p.category].push(p)
      return acc
    }, {})

    const important = ['cleanser', 'serum', 'moisturizer', 'sunscreen', 'exfoliant', 'treatment', 'mist']
    const selected: any[] = []
    important.forEach((cat) => {
      if (categorized[cat]) {
        selected.push(...categorized[cat].slice(0, 4))
      }
    })

    const catalogText = selected
      .slice(0, 40)
      .map((p: any) => {
        const benefits = Array.isArray(p.benefits) ? p.benefits.slice(0, 2).join(', ') : 'Targeted care'
        return `- ${p.id} : ${p.name} (${p.brand}, ${p.category}) - ${benefits}`
      })
      .join('\n')

    console.log('📦 Catalog loaded for OpenAI Provider:', selected.length, 'products selected out of', products.length, 'total')
    return catalogText
  } catch (error) {
    console.error('❌ Error loading catalog for OpenAI Provider:', error)
    return `- B01MSSDEPK : CeraVe Hydrating Cleanser (CeraVe, cleanser) - cleanses while hydrating, barrier support
- B01MDTVZTZ : The Ordinary Niacinamide 10% + Zinc 1% (The Ordinary, serum) - sebum regulation, pore-minimizing
- B00949CTQQ : Paula's Choice SKIN PERFECTING 2% BHA (Paula's Choice, exfoliant) - unclogs pores, reduces blackheads
- B000O7PH34 : Avène Thermal Spring Water (Avène, mist) - soothes, refreshes
- B004W55086 : La Roche-Posay Anthelios Fluid SPF 50 (La Roche-Posay, sunscreen) - ultra-light, fast-absorbing
- B00BNUY3HE : La Roche-Posay Cicaplast Baume B5 (La Roche-Posay, balm) - repair, soothing`
  }
}

/**
 * OpenAI Provider implementation
 */
export const openaiProvider: AiProvider = {
  step1Vision,
  step2Routine,
  step3Products
}
