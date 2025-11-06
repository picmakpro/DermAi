# ⚙️ BACKEND.md - Patterns API & Services DermAI V2

**Version** : 1.0  
**Date** : 6 Novembre 2025

---

## 📋 TABLE DES MATIÈRES

1. [Architecture Services](#architecture-services)
2. [API Routes Next.js](#api-routes-nextjs)
3. [Services IA](#services-ia)
4. [Database (Supabase)](#database-supabase)
5. [Validation & Sécurité](#validation--sécurité)
6. [Error Handling](#error-handling)
7. [Performance & Cache](#performance--cache)
8. [Exemples](#exemples)

---

## 🏗️ ARCHITECTURE SERVICES

### Structure

```
/src/services
├── ai/
│   ├── analysis.service.ts       # Diagnostic IA (Step 1-2)
│   ├── routine.service.ts        # Routine personnalisée (Step 2)
│   └── prompts/                  # Prompts OpenAI
│       ├── step1-diagnostic.ts
│       └── step2-routine.ts
│
├── products/
│   ├── ProductMatcher.ts         # Matching V1 (actuel)
│   ├── ProductMatcherV2.ts       # Matching V2 (scoring ingrédients)
│   ├── ProductDatabaseLoader.ts  # Loader catalogue
│   ├── HybridProductSelector.ts  # Sélecteur hybride IA+Algo
│   └── scoring/
│       ├── ingredientScoring.ts
│       └── concernScoring.ts
│
├── storage/
│   ├── cloudStorage.service.ts   # Supabase Storage
│   └── migration.service.ts      # Migration local → cloud
│
├── analytics/
│   ├── tracking.service.ts       # GA4 + événements
│   └── conversion.service.ts     # Tracking affiliation
│
└── auth/
    └── session.service.ts        # NextAuth helpers (à venir)
```

### Principes

1. **Single Responsibility** : 1 service = 1 responsabilité
2. **Dependency Injection** : Services injectés via constructeur
3. **Error Handling** : Try/catch + erreurs typées
4. **Logging** : Logs structurés pour debugging
5. **Testabilité** : Interfaces mockables

---

## 🚀 API ROUTES NEXT.JS

### Pattern Standard

```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeImages } from '@/services/ai/analysis.service'
import { withAuth } from '@/lib/middleware/auth'
import { rateLimit } from '@/lib/middleware/rateLimit'

// Configuration
export const runtime = 'nodejs' // ou 'edge'
export const maxDuration = 30 // secondes

// Schéma de validation
const AnalyzeRequestSchema = z.object({
  photos: z.array(z.string().url()).min(1).max(5),
  profile: z.object({
    age: z.number().min(13).max(120),
    skinType: z.enum(['dry', 'oily', 'combination', 'sensitive', 'normal']),
    concerns: z.array(z.string()).max(3)
  })
})

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
    
    // 2. Parse body
    const body = await request.json()
    
    // 3. Validation Zod
    const validated = AnalyzeRequestSchema.parse(body)
    
    // 4. Traitement métier
    const result = await analyzeImages({
      photos: validated.photos,
      profile: validated.profile
    })
    
    // 5. Réponse
    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    // Gestion erreurs typées
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    if (error instanceof OpenAIError) {
      console.error('[API] OpenAI error:', error)
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 }
      )
    }
    
    // Erreur générique
    console.error('[API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Middleware Personnalisé

```typescript
// lib/middleware/auth.ts
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function withAuth(
  handler: (req: NextRequest, session: Session) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return handler(req, session)
  }
}

// Usage
export const POST = withAuth(async (req, session) => {
  // Handler avec session garantie
  const userId = session.user.id
  // ...
})
```

---

## 🤖 SERVICES IA

### Service Diagnostic (Step 1)

```typescript
// services/ai/analysis.service.ts
import OpenAI from 'openai'
import { z } from 'zod'
import { STEP1_DIAGNOSTIC_PROMPT } from './prompts/step1-diagnostic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Schéma de validation output IA
const DiagnosticOutputSchema = z.object({
  skinType: z.enum(['dry', 'oily', 'combination', 'sensitive', 'normal']),
  concerns: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    zones: z.array(z.string())
  })),
  scores: z.object({
    hydration: z.number().min(0).max(100),
    texture: z.number().min(0).max(100),
    wrinkles: z.number().min(0).max(100),
    pigmentation: z.number().min(0).max(100),
    redness: z.number().min(0).max(100),
    pores: z.number().min(0).max(100),
    acne: z.number().min(0).max(100),
    overall: z.number().min(0).max(100)
  }),
  recommendations: z.array(z.string())
})

export type DiagnosticOutput = z.infer<typeof DiagnosticOutputSchema>

interface AnalyzeImagesParams {
  photos: string[] // Base64 ou URLs
  profile: {
    age: number
    skinType?: string
    concerns?: string[]
  }
}

export async function analyzeImages({
  photos,
  profile
}: AnalyzeImagesParams): Promise<DiagnosticOutput> {
  console.log('[AnalysisService] Starting analysis', {
    photoCount: photos.length,
    age: profile.age
  })
  
  try {
    // 1. Construire messages avec images
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: STEP1_DIAGNOSTIC_PROMPT
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Profil : Âge ${profile.age} ans. Analyse ces photos de visage :`
          },
          ...photos.map(photo => ({
            type: 'image_url' as const,
            image_url: { url: photo }
          }))
        ]
      }
    ]
    
    // 2. Appel OpenAI avec retry
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.0,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })
    
    // 3. Parse réponse
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }
    
    const parsed = JSON.parse(content)
    
    // 4. Validation Zod
    const validated = DiagnosticOutputSchema.parse(parsed)
    
    console.log('[AnalysisService] Analysis completed', {
      skinType: validated.skinType,
      concernsCount: validated.concerns.length,
      overallScore: validated.scores.overall
    })
    
    return validated
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[AnalysisService] Validation error:', error.errors)
      throw new Error('Invalid AI response format')
    }
    
    if (error instanceof OpenAI.APIError) {
      console.error('[AnalysisService] OpenAI API error:', {
        status: error.status,
        message: error.message
      })
      throw new OpenAIServiceError(error.message, error.status)
    }
    
    throw error
  }
}

// Helper : Retry avec backoff exponentiel
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = baseDelay * Math.pow(2, i)
      console.log(`[Retry] Attempt ${i + 1} failed, retrying in ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// Erreur custom
export class OpenAIServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'OpenAIServiceError'
  }
}
```

### Service Routine (Step 2)

```typescript
// services/ai/routine.service.ts
import OpenAI from 'openai'
import { z } from 'zod'
import { STEP2_ROUTINE_PROMPT } from './prompts/step2-routine'
import type { DiagnosticOutput } from './analysis.service'

const RoutineOutputSchema = z.object({
  phases: z.array(z.object({
    name: z.enum(['immediate', 'adaptation', 'maintenance']),
    duration: z.string(),
    objective: z.string(),
    slots: z.object({
      morning: z.array(z.object({
        stepNumber: z.number(),
        careType: z.string(),
        targetProblem: z.string(),
        timing: z.enum(['morning', 'evening', 'both']),
        targetZones: z.array(z.string()),
        isTemporary: z.boolean(),
        metadata: z.object({
          introductionWeek: z.number().optional(),
          duration: z.string().optional(),
          frequency: z.string().optional()
        }).optional()
      })),
      evening: z.array(z.any()),
      weekly: z.array(z.any())
    })
  }))
})

export type RoutineOutput = z.infer<typeof RoutineOutputSchema>

interface GenerateRoutineParams {
  diagnostic: DiagnosticOutput
  profile: {
    age: number
    skinType: string
    concerns: string[]
    budget: number
    routineComplexity: 'simple' | 'moderate' | 'complete'
  }
}

export async function generateRoutine({
  diagnostic,
  profile
}: GenerateRoutineParams): Promise<RoutineOutput> {
  console.log('[RoutineService] Generating routine', {
    skinType: diagnostic.skinType,
    concerns: diagnostic.concerns.length,
    budget: profile.budget
  })
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: STEP2_ROUTINE_PROMPT
      },
      {
        role: 'user',
        content: JSON.stringify({
          diagnostic,
          profile
        })
      }
    ],
    temperature: 0.0,
    max_tokens: 3000,
    response_format: { type: 'json_object' }
  })
  
  const content = response.choices[0].message.content!
  const parsed = JSON.parse(content)
  const validated = RoutineOutputSchema.parse(parsed)
  
  console.log('[RoutineService] Routine generated', {
    phasesCount: validated.phases.length,
    totalSteps: validated.phases.reduce((sum, p) => 
      sum + p.slots.morning.length + p.slots.evening.length + p.slots.weekly.length, 0
    )
  })
  
  return validated
}
```

---

## 💾 DATABASE (SUPABASE)

### Client Supabase

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Client serveur (avec service role key)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Service Database

```typescript
// services/products/ProductDatabaseLoader.ts
import { supabase } from '@/lib/supabase'
import type { EnrichedProduct } from '@/types/products.types'

export class ProductDatabaseLoader {
  private static cache: Map<string, EnrichedProduct[]> = new Map()
  private static cacheTimestamp: Map<string, number> = new Map()
  private static CACHE_TTL = 3600 * 1000 // 1 heure
  
  /**
   * Charge produits par careType avec cache
   */
  static async loadByCareType(careType: string): Promise<EnrichedProduct[]> {
    const cacheKey = `careType:${careType}`
    
    // Vérifier cache
    const cached = this.cache.get(cacheKey)
    const timestamp = this.cacheTimestamp.get(cacheKey)
    
    if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
      console.log(`[ProductLoader] Cache hit for ${careType}`)
      return cached
    }
    
    // Fetch Supabase
    console.log(`[ProductLoader] Fetching from Supabase: ${careType}`)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('care_type', careType)
      .eq('status', 'active')
      .order('dermatologist_rating', { ascending: false })
    
    if (error) {
      console.error('[ProductLoader] Supabase error:', error)
      throw new Error(`Failed to load products: ${error.message}`)
    }
    
    // Mapper vers EnrichedProduct
    const products = data.map(row => this.mapRowToProduct(row))
    
    // Mettre en cache
    this.cache.set(cacheKey, products)
    this.cacheTimestamp.set(cacheKey, Date.now())
    
    console.log(`[ProductLoader] Loaded ${products.length} products for ${careType}`)
    return products
  }
  
  /**
   * Mapper row Supabase → EnrichedProduct
   */
  private static mapRowToProduct(row: any): EnrichedProduct {
    return {
      catalogId: row.catalog_id,
      name: row.name,
      brand: row.brand,
      category: row.category,
      careType: row.care_type,
      targetSkinTypes: row.target_skin_types || [],
      targetConcerns: row.target_concerns || [],
      activeIngredients: row.active_ingredients || [],
      allergens: row.allergens || [],
      ingredients: row.ingredients || [],
      targetZones: row.target_zones || ['visage entier'],
      restrictedZones: row.restricted_zones || [],
      price: row.price,
      popularity: row.popularity || 50,
      dermatologistRating: row.dermatologist_rating || 70,
      applicationTiming: row.application_timing,
      imageUrl: row.image_url,
      retailers: row.retailers || [],
      comedogenic: row.comedogenic || false,
      irritant: row.irritant || false,
      photosensitizing: row.photosensitizing || false,
      pregnancySafe: row.pregnancy_safe !== false
    }
  }
  
  /**
   * Invalider cache (après update produits)
   */
  static invalidateCache(careType?: string) {
    if (careType) {
      this.cache.delete(`careType:${careType}`)
      this.cacheTimestamp.delete(`careType:${careType}`)
    } else {
      this.cache.clear()
      this.cacheTimestamp.clear()
    }
  }
}
```

---

## 🔒 VALIDATION & SÉCURITÉ

### Validation Zod Stricte

```typescript
// types/analysis.types.ts
import { z } from 'zod'

export const UserProfileSchema = z.object({
  age: z.number().min(13).max(120),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  skinType: z.enum(['dry', 'oily', 'combination', 'sensitive', 'normal', 'acne_prone', 'mature']),
  concerns: z.array(z.string()).max(3),
  allergies: z.array(z.string()).default([]),
  isPregnant: z.boolean().default(false),
  budget: z.number().min(0).max(1000)
})

export type UserProfile = z.infer<typeof UserProfileSchema>

// Validation helper
export function validateUserProfile(data: unknown): UserProfile {
  try {
    return UserProfileSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid user profile', error.errors)
    }
    throw error
  }
}
```

### Sanitization

```typescript
// lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 255)
}
```

---

## 🚨 ERROR HANDLING

### Erreurs Typées

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

export class OpenAIServiceError extends AppError {
  constructor(message: string, status?: number) {
    super(message, 'OPENAI_ERROR', status || 503)
    this.name = 'OpenAIServiceError'
  }
}
```

### Error Handler Global

```typescript
// lib/errorHandler.ts
import { NextResponse } from 'next/server'
import { AppError } from './errors'
import { z } from 'zod'

export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error)
  
  // Erreur applicative
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details
      },
      { status: error.statusCode }
    )
  }
  
  // Erreur Zod
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors
      },
      { status: 400 }
    )
  }
  
  // Erreur générique
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  )
}

// Usage dans API route
export async function POST(request: NextRequest) {
  try {
    // ... logique
  } catch (error) {
    return handleApiError(error)
  }
}
```

---

## ⚡ PERFORMANCE & CACHE

### Cache Redis (Optionnel)

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export async function getCached<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key)
  return cached as T | null
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl: number = 3600
): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value))
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

// Usage
export async function getProducts(careType: string) {
  const cacheKey = `products:${careType}`
  
  // Vérifier cache
  const cached = await getCached<EnrichedProduct[]>(cacheKey)
  if (cached) return cached
  
  // Fetch database
  const products = await ProductDatabaseLoader.loadByCareType(careType)
  
  // Mettre en cache
  await setCached(cacheKey, products, 3600)
  
  return products
}
```

### Compression Réponses

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Compression gzip
  if (request.headers.get('accept-encoding')?.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip')
  }
  
  // Cache headers
  if (request.nextUrl.pathname.startsWith('/api/products')) {
    response.headers.set('Cache-Control', 'public, max-age=3600')
  }
  
  return response
}
```

---

## 📚 EXEMPLES COMPLETS

### Service Complet avec Tests

```typescript
// services/products/ProductMatcher.ts
import type { EnrichedProduct, RoutineStep, UserProfile, BudgetConstraints } from '@/types'

export interface ProductMatch {
  product: EnrichedProduct
  alternatives: EnrichedProduct[]
  score: number
  reasoning: string
}

export class ProductMatcher {
  constructor(
    private logger: (msg: string) => void = console.log
  ) {}
  
  /**
   * Sélectionne le meilleur produit pour un step de routine
   */
  selectForRoutineStep(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): ProductMatch {
    this.logger(`[ProductMatcher] Matching step ${step.stepNumber} (${step.careType})`)
    
    // 1. Filtrage candidats
    const candidates = this.filterCandidates(step, profile, budget)
    
    if (candidates.length === 0) {
      throw new Error(`No products found for ${step.careType}`)
    }
    
    // 2. Scoring
    const scored = this.scoreProducts(candidates, step, profile)
    
    // 3. Sélection
    const mainProduct = scored[0]
    const alternatives = scored.slice(1, 4)
    
    this.logger(`   ✓ Top 1 score: ${mainProduct.score}/100 (${mainProduct.product.name})`)
    
    return {
      product: mainProduct.product,
      alternatives: alternatives.map(s => s.product),
      score: mainProduct.score,
      reasoning: this.generateReasoning(mainProduct, step)
    }
  }
  
  private filterCandidates(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): EnrichedProduct[] {
    // Implémentation filtrage...
    return []
  }
  
  private scoreProducts(
    candidates: EnrichedProduct[],
    step: RoutineStep,
    profile: UserProfile
  ): Array<{ product: EnrichedProduct; score: number }> {
    // Implémentation scoring...
    return []
  }
  
  private generateReasoning(
    scored: { product: EnrichedProduct; score: number },
    step: RoutineStep
  ): string {
    return `${scored.product.name} est optimal pour ${step.careType} avec un score de ${scored.score}/100.`
  }
}
```

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Prochain review** : Fin Sprint 2

