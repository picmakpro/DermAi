import { createOpenAIClient, ANALYSIS_MODEL } from '@/lib/openai'
import type {
  SkinAnalysis,
  SkinScores,
  BeautyAssessment,
  ProductRecommendations,
  UnifiedRoutineStep,
  RecommendedProduct,
  ZoneSpecificIssue
} from '@/types'
import type { AnalyzeRequest } from '@/types/api'
import { normalizeRoutineLike } from '@/lib/i18n/normalization'
import {
  normalizeAssessmentFRtoEN,
  normalizeGender,
  normalizeSkinType,
  normalizeRoutinePreference,
  normalizeBudget
} from '@/lib/i18n/mappers'

export class AnalysisService {
  /**
   * Complete photo analysis with GPT-4o Vision – NEW 2-STEP LOGIC
   */
  static async analyzeSkin(request: AnalyzeRequest): Promise<SkinAnalysis> {
    try {
      console.log('🔧 Initializing OpenAI client...')

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is missing in Vercel environment variables')
      }

      const openai = createOpenAIClient()
      console.log('✅ OpenAI client initialized successfully')

      // Normalize input to EN at the boundary using comprehensive normalization
      const normalizedRequest = normalizeRoutineLike(request) as AnalyzeRequest

      // Images are already base64 from client
      const imageContents = normalizedRequest.photos
        .map((photo) => {
          let base64Data = ''
          if (typeof photo.file === 'string') {
            base64Data = photo.file.includes('base64,') ? photo.file.split('base64,')[1] : photo.file
          }
          return base64Data
        })
        .filter((base64) => base64.length > 0)

      if (imageContents.length === 0) {
        throw new Error('No valid images found for analysis')
      }

      console.log('🔍 STEP 1: Pure diagnostic analysis (without catalog)')
      const diagnosticResult = await this.performDiagnosticAnalysis(openai, imageContents, normalizedRequest)

      console.log('✅ Diagnosis established:', {
        mainConcern: diagnosticResult.beautyAssessment?.mainConcern,
        overallScore: diagnosticResult.scores?.overall,
        concernedZones: diagnosticResult.beautyAssessment?.concernedZones
      })

      console.log('🛍️ STEP 2: Product selection based on diagnosis')
      const productRecommendations = await this.selectProductsBasedOnDiagnosis(openai, diagnosticResult, normalizedRequest)
      console.log('✅ Products selected:', productRecommendations)

      // STEP 3: Unified routine generation
      console.log('🔄 STEP 3: Unified routine generation')
      const unifiedRoutine = this.generateUnifiedRoutine(diagnosticResult.beautyAssessment, productRecommendations)
      console.log('✅ Unified routine generated:', unifiedRoutine.length, 'steps')

      const finalAnalysis: SkinAnalysis = {
        id: this.generateId(),
        userId: 'temp-user',
        photos: request.photos,
        scores: diagnosticResult.scores,
        beautyAssessment: diagnosticResult.beautyAssessment,
        recommendations: {
          ...productRecommendations,
          unifiedRoutine
        },
        createdAt: new Date()
      }

      return finalAnalysis
    } catch (error) {
      console.error('❌ Full AI analysis error:', error)

      if (error instanceof Error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('api key') || msg.includes('unauthorized')) {
          throw new Error('Invalid OpenAI configuration – check OPENAI_API_KEY in Vercel')
        }
        if (msg.includes('rate limit') || msg.includes('quota')) {
          throw new Error('OpenAI limit reached – please try again in a few minutes')
        }
        if (msg.includes('network') || msg.includes('fetch')) {
          throw new Error('Network connection issue from Vercel to OpenAI')
        }
        if (msg.includes('timeout')) {
          throw new Error('Analysis timeout – image too large or slow connection')
        }
        if (msg.includes('expected pattern') || msg.includes('json')) {
          throw new Error('OpenAI response parsing error – unexpected format')
        }
      }

      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load catalog for prompt injection
   */
  private static async loadCatalogForPrompt(): Promise<string> {
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

      console.log('📦 Catalog loaded for ChatGPT:', selected.length, 'products selected out of', products.length, 'total')
      return catalogText
    } catch (error) {
      console.error('❌ Error loading catalog for prompt:', error)
      return `- B01MSSDEPK : CeraVe Hydrating Cleanser (CeraVe, cleanser) - cleanses while hydrating, barrier support
- B01MDTVZTZ : The Ordinary Niacinamide 10% + Zinc 1% (The Ordinary, serum) - sebum regulation, pore-minimizing
- B00949CTQQ : Paula's Choice SKIN PERFECTING 2% BHA (Paula's Choice, exfoliant) - unclogs pores, reduces blackheads
- B000O7PH34 : Avène Thermal Spring Water (Avène, mist) - soothes, refreshes
- B004W55086 : La Roche-Posay Anthelios Fluid SPF 50 (La Roche-Posay, sunscreen) - ultra-light, fast-absorbing
- B00BNUY3HE : La Roche-Posay Cicaplast Baume B5 (La Roche-Posay, balm) - repair, soothing`
    }
  }

  /**
   * STEP 1: Pure diagnostic analysis WITHOUT catalog
   */
  private static async performDiagnosticAnalysis(
    openai: any,
    imageContents: string[],
    request: AnalyzeRequest
  ): Promise<{ scores: SkinScores; beautyAssessment: BeautyAssessment }> {
    const systemPrompt = this.buildDiagnosticSystemPrompt()
    const userPrompt = this.buildUserPrompt(request)

    console.log('Sending to OpenAI (Step 1 – Diagnostic):', {
      imagesCount: imageContents.length,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    try {
      const response = await openai.chat.completions.create(
        {
          model: ANALYSIS_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                ...imageContents.map((image) => ({
                  type: 'image_url' as const,
                  image_url: {
                    url: `data:image/jpeg;base64,${image}`,
                    detail: 'high' as const
                  }
                }))
              ]
            }
          ],
          max_tokens: 3000,
          temperature: 0.3
        },
        { signal: controller.signal }
      )

      clearTimeout(timeoutId)

      console.log('OpenAI response received (Diagnostic):', {
        usage: response.usage,
        model: response.model
      })

      const diagnosticResult = this.parseDiagnosticResponse(response.choices[0]?.message?.content)

      // Compute overall score
      const scores = diagnosticResult.scores as any
      scores.overall = this.computeWeightedOverall(scores)

      return {
        scores: scores as SkinScores,
        beautyAssessment: diagnosticResult.beautyAssessment as BeautyAssessment
      }
    } catch (apiError) {
      clearTimeout(timeoutId)
      if (apiError instanceof Error && apiError.name === 'AbortError') {
        throw new Error('Timeout: Diagnostic analysis took too long')
      }
      throw apiError
    }
  }

  /**
   * STEP 2: Product selection based on the established diagnosis
   */
  private static async selectProductsBasedOnDiagnosis(
    openai: any,
    diagnostic: { scores: SkinScores; beautyAssessment: BeautyAssessment },
    request: AnalyzeRequest
  ): Promise<ProductRecommendations> {
    const catalogText = await this.loadCatalogForPrompt()
    const systemPrompt = this.buildProductSelectionSystemPrompt(catalogText)
    const userPrompt = this.buildProductSelectionUserPrompt(diagnostic, request)

    console.log('Sending to OpenAI (Step 2 – Product selection):', {
      catalogProductsCount: catalogText.split('\n').length,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 90000)

    try {
      const response = await openai.chat.completions.create(
        {
          model: ANALYSIS_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.2
        },
        { signal: controller.signal }
      )

      clearTimeout(timeoutId)

      console.log('OpenAI response received (Product selection):', {
        usage: response.usage,
        model: response.model
      })

      return this.parseProductSelectionResponse(response.choices[0]?.message?.content)
    } catch (apiError) {
      clearTimeout(timeoutId)
      if (apiError instanceof Error && apiError.name === 'AbortError') {
        throw new Error('Timeout: Product selection took too long')
      }
      throw apiError
    }
  }

  /**
   * Compute a weighted overall score from sub-scores
   */
  private static computeWeightedOverall(scores: Record<string, { value: number }>): number {
    const weights: Record<string, number> = {
      hydration: 0.15,
      wrinkles: 0.2,
      firmness: 0.12,
      radiance: 0.12,
      pores: 0.15,
      spots: 0.08,
      darkCircles: 0.08,
      skinAge: 0.1
    }

    let weightedSum = 0
    let usedWeightSum = 0

    for (const key of Object.keys(weights)) {
      const weight = weights[key]
      const detail = scores?.[key]
      const value: number | undefined = detail && typeof detail.value === 'number' ? detail.value : undefined
      if (typeof value === 'number' && !Number.isNaN(value)) {
        weightedSum += value * weight
        usedWeightSum += weight
      }
    }

    if (usedWeightSum === 0) return 0
    return Math.round(weightedSum / usedWeightSum)
  }

  /**
   * System prompt for pure diagnostic analysis (STEP 1)
   */
  private static buildDiagnosticSystemPrompt(): string {
    return `## ROLE
You are BeautyAI, an AI dermatology expert focused on visual skin analysis. You specialize in visual cosmetic/beauty diagnostics.

## TASK – STEP 1: PURE DIAGNOSTIC
Analyze ONLY the photos to establish an accurate assessment of the skin's condition.
Do NOT recommend products at this stage — focus 100% on diagnostic analysis.

## CONTEXT
Professional skin analysis app. You analyze the skin visually to produce an objective diagnostic based on observable cosmetic characteristics.

## REQUIRED ANALYSIS
1. DETAILED SCORES: Rate each criterion out of 100
2. PRIMARY CONCERN: Identify the main concern
3. CONCERNED ZONES: Precisely locate issues
4. VISUAL FINDINGS: Describe what you objectively see
5. IMPROVEMENT ESTIMATE: Estimate realistic time to reach 90/100 based on current state

## OUTPUT – MANDATORY JSON FORMAT
Respond ONLY with valid JSON matching this exact shape:

{
  "scores": {
    "hydration": {"value": 72, "justification": "Well-hydrated skin", "confidence": 0.8, "basedOn": ["no flaking", "healthy sheen"]},
    "wrinkles": {"value": 64, "justification": "Fine expression lines", "confidence": 0.75, "basedOn": ["dynamic lines", "no deep furrows"]},
    "firmness": {"value": 68, "justification": "Good overall tone", "confidence": 0.7, "basedOn": ["defined contours", "limited sagging"]},
    "radiance": {"value": 70, "justification": "Fairly bright complexion", "confidence": 0.75, "basedOn": ["even sheen", "few dull areas"]},
    "pores": {"value": 58, "justification": "Visible pores in T-zone", "confidence": 0.8, "basedOn": ["irregular texture", "localized shine"]},
    "spots": {"value": 62, "justification": "Mild, localized hyperpigmentation", "confidence": 0.75, "basedOn": ["discrete macules", "tone differences"]},
    "darkCircles": {"value": 55, "justification": "Mild pigmented circles", "confidence": 0.7, "basedOn": ["under-eye hue", "slight hollowing"]},
    "skinAge": {"value": 78, "justification": "Skin age close to actual age", "confidence": 0.7, "basedOn": ["elasticity", "texture"]}
  },
  "beautyAssessment": {
    "skinType": "combination",
    "mainConcern": "ingrowns",
    "intensity": "moderate",
    "concernedZones": ["chin", "neck", "lower cheeks"],
    "specificities": [
      {"name": "ingrowns", "intensity": "moderate", "zones": ["chin", "neck"]},
      {"name": "redness", "intensity": "mild", "zones": ["nose", "cheeks"]},
      {"name": "pigmentation", "intensity": "mild", "zones": ["forehead", "cheeks"]}
    ],
    "visualFindings": [
      "Presence of ingrowns on shaving zone",
      "Redness and minor post-shave blemishes",
      "Overall healthy texture outside concerned zones",
      "Subtle post-irritation pigment marks"
    ],
    "overview": [
      "Global dehydration",
      "Visible pores in T-zone",
      "Insufficient sun protection"
    ],
    "zoneSpecific": [
      {
        "zone": "chin",
        "problems": [
          {"name": "ingrowns", "intensity": "moderate"},
          {"name": "redness", "intensity": "severe"}
        ],
        "description": "Sensitive shaving area with multiple issues"
      },
      {
        "zone": "cheeks",
        "problems": [
          {"name": "enlarged-pores", "intensity": "mild"},
          {"name": "pigmentation", "intensity": "moderate"}
        ],
        "description": "Irregular texture with hyperpigmentation"
      }
    ],
    "expectedImprovement": "Visible improvement in 4–6 weeks with a tailored routine",
    "improvementTimeEstimate": "3–4 months"
  }
}

## CONDITIONS
- Focus 100% on visual diagnostic analysis
- Be precise and objective in observations
- Base yourself only on what is visible in the photos
- Avoid medical jargon; stay in the beauty/cosmetic domain
- CRITICAL: Return VALID JSON in English canonical values only
- intensity must be: "mild", "moderate", or "severe"
- zones must be: "chin", "cheeks", "forehead", "nose", "neck", "eye-contour"
- concerns must be: "redness", "pigmentation", "wrinkles", "blackheads", "enlarged-pores", "dehydration", "ingrowns", "blemishes"
- skinType must be: "dry", "normal", "combination", "oily", "sensitive", "unknown"

## IMPROVEMENT ESTIMATION LOGIC
For improvementTimeEstimate, compute by:
- Overall 80–100: "4–6 weeks"
- Overall 60–79: "2–3 months"
- Overall 40–59: "3–4 months"
- Overall 20–39: "4–6 months"
- Overall 0–19: "6–8 months"

Adjust for specific concerns:
- Hydration/dryness: −2 weeks
- Deep wrinkles/aging: +1–2 months
- Active acne/inflammation: +2–4 weeks
- Pigment spots: +1–2 months
- Sensitivity/irritation: +2–6 weeks`
  }

  /**
   * System prompt for product selection (STEP 2)
   */
  private static buildProductSelectionSystemPrompt(catalogText: string): string {
    return `## ROLE
You are BeautyAI, a beauty advisor expert specialized in personalized cosmetic product selection.

## TASK – STEP 2: PRODUCT SELECTION
Based on the established diagnosis, choose the best products from the catalog to create an optimal beauty routine.

## AVAILABLE COSMETIC CATALOG
You have access to the following catalog with product references:

${catalogText}

IMPORTANT: Use ONLY the real references from the catalog above (e.g., B01MSSDEPK, B000O7PH34, etc.)

## ESSENTIAL BEAUTY RULES
1. MANDATORY REFERENCE: Every recommended product MUST include a real catalogId
2. COSMETICS ONLY: Use only existing references from the catalog
3. BEAUTY COHERENCE: The product reference must match the identified care need
4. DIAGNOSTIC FIRST: Base your choices on the provided diagnosis, not assumptions

## BEAUTY ROUTINE PILLARS
- Cleanse (cleanser)
- Prep (toner/mist)
- Treat (serum, treatment)
- Moisturize (moisturizer)
- Nourish (face oil / balm if needed)
- Protect (sunscreen)

## OUTPUT – MANDATORY JSON FORMAT
Respond ONLY with valid JSON matching this exact shape.
Use English canonical tokens everywhere:
- frequency: "daily" | "weekly" | "as_needed"
- timing: "morning" | "evening" | "morning_and_evening"
- intensity: "mild" | "moderate" | "severe"
- zones: "chin" | "cheeks" | "forehead" | "nose" | "neck" | "eye-contour"
- concerns: "redness" | "pigmentation" | "wrinkles" | "blackheads" | "enlarged-pores" | "dehydration" | "ingrowns" | "blemishes"

{
  "immediate": [
    "Temporarily space out daily shaving",
    "Apply a soothing cream",
    "Avoid alcohol-based products"
  ],
  "routine": {
    "immediate": [
      {
        "name": "Gentle cleansing",
        "frequency": "daily",
        "timing": "morning_and_evening",
        "catalogId": "B01MSSDEPK",
        "application": "Massage gently, rinse with lukewarm water",
        "startDate": "now"
      }
    ],
    "adaptation": [
      {
        "name": "Gentle exfoliation",
        "frequency": "weekly",
        "timing": "evening",
        "catalogId": "B00949CTQQ",
        "application": "Start once a week, increase progressively",
        "startDate": "after_2_weeks"
      }
    ],
    "maintenance": [
      {
        "name": "Sun protection",
        "frequency": "daily",
        "timing": "morning",
        "catalogId": "B004W55086",
        "application": "Reapply every 2h if exposed",
        "startDate": "now"
      }
    ]
  },
  "localizedRoutine": [
    {
      "zone": "chin",
      "priority": "high",
      "steps": [
        {
          "name": "Soothing care",
          "frequency": "daily",
          "timing": "evening",
          "catalogId": "B00BNUY3HE",
          "application": "Thin layer on sensitive zones",
          "duration": "until improvement",
          "resume": "when sensitivity disappears"
        }
      ]
    }
  ],
  "overview": "Progressive routine focused first on soothing, then prevention",
  "zoneSpecificCare": "Zone-specific care prioritized for sensitive areas",
  "restrictions": "Avoid exfoliants on sensitized zones until improved"
}

## CONDITIONS
- Each catalogId MUST exist in the catalog
- Adapt the selection to the provided diagnosis
- Routine must be progressive: immediate → adaptation → maintenance
- Localized care addresses zone-specific concerns`
  }

  /**
   * Contextual user prompt
   */
  private static buildUserPrompt(request: AnalyzeRequest): string {
    return `## USER CONTEXT
**Profile:** ${request.userProfile.gender}, ${request.userProfile.age} years
**Declared skin type:** ${request.userProfile.skinType}

## PRIMARY CONCERNS
${request.skinConcerns.primary.join(', ')}${
      request.skinConcerns.otherText ? ` (Other: ${request.skinConcerns.otherText})` : ''
    }
**Routine preference:** ${request.currentRoutine.routinePreference || 'Balanced'}

## CURRENT ROUTINE
**Morning:** ${request.currentRoutine.morningProducts.join(', ') || 'No routine'}
**Evening:** ${request.currentRoutine.eveningProducts.join(', ') || 'No routine'}
**Routine preference (complexity):** ${request.currentRoutine.routinePreference || 'Balanced'}
**Monthly budget:** ${request.currentRoutine.monthlyBudget}

## ALLERGIES & SENSITIVITIES
**Ingredients to avoid:** ${request.allergies?.ingredients?.join(', ') || 'No known allergies'}
**Past reactions:** ${request.allergies?.pastReactions || 'No reactions reported'}

## PRODUCT CATALOG (STRUCTURED)
- If a catalog is provided by the app, it will be passed separately and you must pick from it. Otherwise, do not cite brands.

## PROVIDED PHOTOS
${request.photos.map((photo, index) => `Photo ${index + 1}: ${photo.type}`).join('\n')}

## BEAUTY MISSION
Analyze these ${request.photos.length} photos with maximum expert beauty advice.

**PAY SPECIAL ATTENTION TO:**
- Mentioned beauty concerns: ${request.skinConcerns.primary.join(', ')}
- Sensitivities to consider: ${request.allergies?.ingredients?.join(', ') || 'None'}
- Available budget: ${request.currentRoutine.monthlyBudget}

**YOU MUST DETERMINE:**
- Real intensity based only on visual analysis (ignore self-assessment)
- Precise skin concerns observed
- Cosmetic recommendations adapted to budget and sensitivities
- An overview (max 3 points) + a localized view by zones (forehead, cheeks, nose, eye-contour, beard, lips...) with concerns and intensity
- A routine organized by pillars (Cleanse, Prep, Treat, Moisturize, Nourish, Protect), adapted to the complexity preference.

Provide precise personalized analysis + justified scores + actionable recommendations.
REPLY IN JSON ONLY – NO FREE TEXT.`
  }

  /**
   * User prompt for product selection (STEP 2)
   */
  private static buildProductSelectionUserPrompt(
    diagnostic: { scores: SkinScores; beautyAssessment: BeautyAssessment },
    request: AnalyzeRequest
  ): string {
    return `## ESTABLISHED DIAGNOSIS
**Main concern:** ${diagnostic.beautyAssessment.mainConcern}
**Intensity:** ${diagnostic.beautyAssessment.intensity}
**Zones:** ${diagnostic.beautyAssessment.concernedZones?.join(', ') || 'Not specified'}

**Detailed scores:**
- Hydration: ${diagnostic.scores.hydration?.value || 'N/A'}/100
- Wrinkles: ${diagnostic.scores.wrinkles?.value || 'N/A'}/100
- Firmness: ${diagnostic.scores.firmness?.value || 'N/A'}/100
- Radiance: ${diagnostic.scores.radiance?.value || 'N/A'}/100
- Pores: ${diagnostic.scores.pores?.value || 'N/A'}/100
- Spots: ${diagnostic.scores.spots?.value || 'N/A'}/100
- Dark circles: ${diagnostic.scores.darkCircles?.value || 'N/A'}/100
- Overall score: ${diagnostic.scores.overall || 'N/A'}/100

**Visual findings:**
${diagnostic.beautyAssessment.visualFindings?.map((f) => `- ${f}`).join('\n') || 'No specific findings'}

**Overview:**
${diagnostic.beautyAssessment.overview?.map((item) => `- ${item}`).join('\n') || 'No overview'}

**Zone specifics:**
${
  diagnostic.beautyAssessment.zoneSpecific
    ?.map((zone) => `- ${zone.zone}: ${zone.problems?.map((p) => `${p.name} (${p.intensity})`).join(', ')}`)
    .join('\n') || 'No zone-specific data'
}

## USER PROFILE
**Profile:** ${request.userProfile.gender}, ${request.userProfile.age} years
**Declared skin type:** ${request.userProfile.skinType}
**Monthly budget:** ${request.currentRoutine.monthlyBudget}
**Routine preference:** ${request.currentRoutine.routinePreference || 'Balanced'}

## ALLERGIES & SENSITIVITIES
**Ingredients to avoid:** ${request.allergies?.ingredients?.join(', ') || 'No known allergies'}
**Past reactions:** ${request.allergies?.pastReactions || 'No reactions reported'}

## MISSION
Based on this precise diagnosis, select the most relevant products from the catalog to:
1. Treat the main concern (${diagnostic.beautyAssessment.mainConcern})
2. Improve the lowest scores
3. Target the concerned zones (${diagnostic.beautyAssessment.concernedZones?.join(', ')})
4. Respect budget and preferences

REPLY IN JSON ONLY – NO FREE TEXT.`
  }

  /** Parse diagnostic response (STEP 1) */
  private static parseDiagnosticResponse(content: string | null): Record<string, unknown> {
    if (!content) throw new Error('Empty diagnostic response from AI')
    try {
      const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      console.log('Diagnostic content to parse:', clean.substring(0, 200) + '...')
      const parsed = JSON.parse(clean)
      
      // Normalize AI response to ensure EN canonicals
      const normalizedParsed = normalizeRoutineLike(parsed)

      if (!normalizedParsed.scores || !normalizedParsed.beautyAssessment) {
        throw new Error('Invalid diagnostic response structure')
      }

      // Additional specific normalization for beauty assessment
      if (normalizedParsed.beautyAssessment) {
        normalizedParsed.beautyAssessment = normalizeAssessmentFRtoEN(normalizedParsed.beautyAssessment)
      }

      return normalizedParsed
    } catch (e) {
      console.error('Diagnostic JSON parsing error:', e)
      console.error('Raw content received:', content)
      throw new Error('Invalid diagnostic response format from AI')
    }
  }

  /** Parse product selection response (STEP 2) */
  private static parseProductSelectionResponse(content: string | null): ProductRecommendations {
    if (!content) throw new Error('Empty product-selection response from AI')
    try {
      const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      console.log('Product selection content to parse:', clean.substring(0, 200) + '...')
      const parsed = JSON.parse(clean)
      
      // Normalize AI response to ensure EN canonicals  
      const normalizedParsed = normalizeRoutineLike(parsed)

      if (!normalizedParsed.routine) {
        throw new Error('Invalid product-selection response structure')
      }

      return normalizedParsed as ProductRecommendations
    } catch (e) {
      console.error('Product selection JSON parsing error:', e)
      console.error('Raw content received:', content)
      throw new Error('Invalid product selection response format from AI')
    }
  }

  /** Generate unique ID */
  private static generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * STEP 3: Generate unified routine with smart product grouping
   */
  private static generateUnifiedRoutine(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep[] {
    console.log('🏗️ Generating unified routine with 3 automatic phases from:', {
      zoneSpecific: beautyAssessment.zoneSpecific?.length || 0,
      localizedRoutine: productRecommendations.localizedRoutine?.length || 0,
      routine: productRecommendations.routine ? 'present' : 'missing'
    })

    const immediateSteps = this.generateImmediatePhase(beautyAssessment, productRecommendations)
    const adaptationSteps = this.generateAdaptationPhase(beautyAssessment, productRecommendations, immediateSteps)
    const maintenanceSteps = this.generateMaintenancePhase(beautyAssessment, productRecommendations, adaptationSteps)

    const allSteps = [...immediateSteps, ...adaptationSteps, ...maintenanceSteps]

    console.log('✅ Unified 3-phase routine created:', {
      immediate: immediateSteps.length,
      adaptation: adaptationSteps.length,
      maintenance: maintenanceSteps.length,
      total: allSteps.length
    })

    return allSteps
  }

  /** Immediate phase (urgent issues, simple routine) */
  private static generateImmediatePhase(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep[] {
    const steps: UnifiedRoutineStep[] = []
    let stepCounter = 1

    // 1) Gentle cleansing
    steps.push(this.createCleansingStep(stepCounter++, beautyAssessment))

    // 2) Targeted urgent treatments
    const optimizedTreatments = this.groupTreatmentsByProduct(beautyAssessment)
    for (const treatment of optimizedTreatments) {
      steps.push(this.createOptimizedTreatmentStep(stepCounter++, treatment, beautyAssessment, productRecommendations))
    }

    // 3) Global moisturization
    steps.push(this.createMoisturizingStep(stepCounter++, beautyAssessment, productRecommendations))

    // 4) Sun protection
    if (this.includesSunProtection(beautyAssessment)) {
      steps.push(this.createSunProtectionStep(stepCounter++, beautyAssessment, productRecommendations))
    }

    // Filter, add visual criteria, mark as immediate phase
    return this.filterRedundantSteps(steps)
      .map((s) => this.addVisualCriteria(s))
      .map((s) => ({ ...s, phase: 'immediate' as const }))
  }

  /** Adaptation phase (weeks 2–4, stronger actives) */
  private static generateAdaptationPhase(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations,
    immediatePhase: UnifiedRoutineStep[]
  ): UnifiedRoutineStep[] {
    const steps: UnifiedRoutineStep[] = []

    // 1) Durable base from immediate phase
    const baseDurable = this.identifyLongTermBase(immediatePhase)
    console.log('📊 Durable base identified:', baseDurable.map((b) => `${b.title} (${b.category})`).join(', '))

    // 2) Evolve the base
    const evolvedBase = this.evolveBaseProducts(baseDurable, beautyAssessment)

    // 3) Add progressive actives per AI diagnosis
    const progressiveActives = this.generateProgressiveActives(beautyAssessment, evolvedBase.length + 1)

    // 4) Combine/order logically
    const all = [...evolvedBase, ...progressiveActives]
    const ordered = this.orderStepsLogically(all)

    // 5) Renumber per phase
    const finalSteps = ordered.map((step, index) => ({ ...step, stepNumber: index + 1 }))
    steps.push(...finalSteps)

    console.log('✨ Adaptation phase generated:', {
      baseEvolved: evolvedBase.length,
      newActives: progressiveActives.length,
      total: steps.length
    })

    return steps
  }

  /** Maintenance phase (optimized routine + weekly care) */
  private static generateMaintenancePhase(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations,
    adaptationPhase: UnifiedRoutineStep[]
  ): UnifiedRoutineStep[] {
    const steps: UnifiedRoutineStep[] = []

    // 1) Transfer & optimize evolved base
    const finalBase = this.transferAndOptimizeBase(adaptationPhase)

    // 2) Add preventive/optimization care
    const preventiveCare = this.generatePreventiveCare(beautyAssessment, finalBase.length + 1)

    // 3) Combine/order
    const all = [...finalBase, ...preventiveCare]
    const ordered = this.orderStepsLogically(all)

    // 4) Renumber per phase
    const finalSteps = ordered.map((step, index) => ({ ...step, stepNumber: index + 1 }))
    steps.push(...finalSteps)

    console.log('🏥 Maintenance phase generated:', {
      finalBase: finalBase.length,
      preventiveCare: preventiveCare.length,
      total: steps.length
    })

    return steps
  }

  // -------- Analysis helpers (English canonicals only) --------

  private static hasAgingConcerns(beautyAssessment: BeautyAssessment): boolean {
    const aging = ['wrinkles', 'fine lines', 'aging', 'firmness', 'elasticity']
    return (
      aging.some((k) => beautyAssessment.mainConcern?.toLowerCase().includes(k)) ||
      beautyAssessment.zoneSpecific?.some((z) =>
        z.problems?.some((p) => aging.some((k) => p.name.toLowerCase().includes(k)))
      ) ||
      false
    )
  }

  private static hasAcneConcerns(beautyAssessment: BeautyAssessment): boolean {
    const acne = ['blemishes', 'pimples', 'acne', 'blackheads', 'comedones', 'congestion']
    return (
      acne.some((k) => beautyAssessment.mainConcern?.toLowerCase().includes(k)) ||
      beautyAssessment.zoneSpecific?.some((z) =>
        z.problems?.some((p) => acne.some((k) => p.name.toLowerCase().includes(k)))
      ) ||
      false
    )
  }

  private static hasPigmentationConcerns(beautyAssessment: BeautyAssessment): boolean {
    const pigm = ['spots', 'pigment', 'pigmentation', 'hyperpigmentation', 'melasma', 'discoloration', 'dark spots']
    return (
      pigm.some((k) => beautyAssessment.mainConcern?.toLowerCase().includes(k)) ||
      beautyAssessment.zoneSpecific?.some((z) =>
        z.problems?.some((p) => pigm.some((k) => p.name.toLowerCase().includes(k)))
      ) ||
      false
    )
  }

  private static needsExfoliation(beautyAssessment: BeautyAssessment): boolean {
    const exf = ['pores', 'enlarged-pores', 'texture', 'roughness', 'dullness', 'glow', 'radiance']
    return (
      exf.some((k) => beautyAssessment.mainConcern?.toLowerCase().includes(k)) ||
      beautyAssessment.zoneSpecific?.some((z) =>
        z.problems?.some((p) => exf.some((k) => p.name.toLowerCase().includes(k)))
      ) ||
      false
    )
  }

  /**
   * Filter redundant or low-value steps
   */
  private static filterRedundantSteps(steps: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    const filtered = steps.filter((step) => {
      // Always keep essentials (cleansing, hydration, protection)
      if (['cleansing', 'hydration', 'protection'].includes(step.category)) return true

      // Filter treatment steps without specific products
      if (step.treatmentType === 'treatment' && (!step.recommendedProducts || step.recommendedProducts.length === 0)) {
        console.log(`🚫 Step filtered (no specific products): ${step.title}`)
        return false
      }

      // Filter steps with generic/fallback products
      if (step.treatmentType === 'treatment' && step.recommendedProducts.length > 0) {
        const hasGeneric = step.recommendedProducts.some((p) => {
          const isGeneric =
            p.name.includes('Targeted care') ||
            p.brand === 'DermAI Selection' ||
            !p.catalogId ||
            p.catalogId === 'fallback'
          return isGeneric
        })
        if (hasGeneric) {
          console.log(
            `🚫 Step filtered (generic products): ${step.title} - ${step.recommendedProducts.map((p) => p.name).join(', ')}`
          )
          return false
        }
      }
      return true
    })

    return filtered.map((s, i) => ({ ...s, stepNumber: i + 1 }))
  }

  /**
   * Group problems by type from zoneSpecific
   */
  private static groupIssuesByType(beautyAssessment: BeautyAssessment): Map<string, string[]> {
    const grouped = new Map<string, string[]>()

    if (!beautyAssessment.zoneSpecific || !Array.isArray(beautyAssessment.zoneSpecific)) {
      console.log('⚠️ No specific zones found, using fallback')
      const mainConcern = beautyAssessment.mainConcern || 'hydration'
      grouped.set(mainConcern.toLowerCase(), beautyAssessment.concernedZones || [])
      return grouped
    }

    for (const zone of beautyAssessment.zoneSpecific) {
      if (!zone.zone) continue
      if (Array.isArray(zone.problems)) {
        for (const problem of zone.problems) {
          const issueType = problem.name?.toLowerCase() || 'targeted-care'
          if (!grouped.has(issueType)) grouped.set(issueType, [])
          grouped.get(issueType)!.push(zone.zone)
        }
      } else if (Array.isArray((zone as any).concerns)) {
        for (const concern of (zone as any).concerns) {
          const issueType = concern.toLowerCase()
          if (!grouped.has(issueType)) grouped.set(issueType, [])
          grouped.get(issueType)!.push(zone.zone)
        }
      } else {
        const issueType = 'targeted-care'
        if (!grouped.has(issueType)) grouped.set(issueType, [])
        grouped.get(issueType)!.push(zone.zone)
      }
    }

    console.log(
      '📊 Grouped problems:',
      Array.from(grouped.entries()).map(([type, zones]) => `${type}: ${zones.join(', ')}`)
    )
    return grouped
  }

  /** Create cleansing step (always first) */
  private static createCleansingStep(stepNumber: number, _beautyAssessment: BeautyAssessment): UnifiedRoutineStep {
    return {
      stepNumber,
      title: 'Gentle cleansing',
      targetArea: 'global',
      recommendedProducts: [
        {
          id: 'B01MSSDEPK',
          name: 'CeraVe Hydrating Cleanser',
          brand: 'CeraVe',
          category: 'cleanser',
          catalogId: 'B01MSSDEPK'
        }
      ],
      applicationAdvice: 'Massage gently onto damp skin, rinse with lukewarm water. Avoid the eye contour.',
      treatmentType: 'cleansing',
      priority: 10,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'morning_and_evening',
      category: 'cleansing'
    }
  }

  /** Create a targeted treatment step */
  private static createTargetedTreatmentStep(
    stepNumber: number,
    issueType: string,
    zones: string[],
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    const products = this.selectProductsForIssue(issueType, zones, productRecommendations)
    const title = this.generateStepTitle(issueType, zones)
    const applicationAdvice = this.generateApplicationAdvice(issueType, zones, products)
    const restrictions = this.generateRestrictions(issueType, beautyAssessment)

    return {
      stepNumber,
      title,
      targetArea: 'specific',
      zones: [...new Set(zones)],
      recommendedProducts: products,
      applicationAdvice,
      restrictions,
      treatmentType: 'treatment',
      priority: this.calculatePriority(issueType),
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'evening',
      category: 'treatment'
    }
  }

  /** Global moisturization step */
  private static createMoisturizingStep(
    stepNumber: number,
    _beautyAssessment: BeautyAssessment,
    _productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    return {
      stepNumber,
      title: 'Global hydration',
      targetArea: 'global',
      recommendedProducts: [
        {
          id: 'TOLERIANE_SENSITIVE',
          name: 'Toleriane Sensitive',
          brand: 'La Roche-Posay',
          category: 'moisturizer',
          catalogId: 'B00BNUY3HE'
        }
      ],
      applicationAdvice: 'Apply to the whole face, avoiding recently treated zones. Massage until fully absorbed.',
      treatmentType: 'moisturizing',
      priority: 9,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'morning_and_evening',
      category: 'hydration'
    }
  }

  /** Sun protection step */
  private static createSunProtectionStep(
    stepNumber: number,
    _beautyAssessment: BeautyAssessment,
    _productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    return {
      stepNumber,
      title: 'Daily sun protection',
      targetArea: 'global',
      recommendedProducts: [
        {
          id: 'B004W55086',
          name: 'La Roche-Posay Anthelios Fluid SPF 50',
          brand: 'La Roche-Posay',
          category: 'sunscreen',
          catalogId: 'B004W55086'
        }
      ],
      applicationAdvice: 'Apply generously in the morning, 20 minutes before exposure. Reapply every 2h if exposed.',
      treatmentType: 'protection',
      priority: 10,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'morning',
      category: 'protection'
    }
  }

  /**
   * Generate step title based on issue type (zones are shown separately in UI)
   */
  private static generateStepTitle(issueType: string, _zones: string[]): string {
    const map: Record<string, string> = {
      // EN canonicals only (keys can be synonyms)
      'redness': 'Redness treatment',
      'ingrowns': 'Ingrowns treatment',
      'blemishes': 'Blemishes treatment',
      'acne': 'Blemishes treatment',
      'pigmentation': 'Pigmentation treatment',
      'dark spots': 'Pigmentation treatment',
      'enlarged-pores': 'Pore-refining treatment',
      'enlarged pores': 'Pore-refining treatment',
      'dehydration': 'Targeted hydration',
      'wrinkles': 'Anti-aging treatment',
      'blackheads': 'Pore decongestion'
    }
    return map[issueType.toLowerCase()] || `Targeted treatment (${issueType})`
  }

  /** Select appropriate products for an issue type */
  private static selectProductsForIssue(
    issueType: string,
    _zones: string[],
    _productRecommendations: ProductRecommendations
  ): RecommendedProduct[] {
    const productMapping: Record<string, RecommendedProduct> = {
      'redness': {
        id: 'B000O7PH34',
        name: 'Avène Thermal Spring Water',
        brand: 'Avène',
        category: 'treatment',
        catalogId: 'B000O7PH34'
      },
      'ingrowns': {
        id: 'B00BNUY3HE',
        name: 'La Roche-Posay Cicaplast Baume B5',
        brand: 'La Roche-Posay',
        category: 'treatment',
        catalogId: 'B00BNUY3HE'
      },
      'blemishes': {
        id: 'B01MDTVZTZ',
        name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        category: 'serum',
        catalogId: 'B01MDTVZTZ'
      },
      'enlarged-pores': {
        id: 'B01MDTVZTZ',
        name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        category: 'serum',
        catalogId: 'B01MDTVZTZ'
      },
      'blackheads': {
        id: 'B00949CTQQ',
        name: "Paula's Choice SKIN PERFECTING 2% BHA",
        brand: "Paula's Choice",
        category: 'exfoliant',
        catalogId: 'B00949CTQQ'
      }
    }

    const product = productMapping[issueType.toLowerCase()]
    return product
      ? [product]
      : [
          {
            id: 'B01MSSDEPK',
            name: 'Targeted care',
            brand: 'DermAI Selection',
            category: 'treatment',
            catalogId: 'B01MSSDEPK'
          }
        ]
  }

  /** Generate application tips by issue */
  private static generateApplicationAdvice(issueType: string, zones: string[], _products: RecommendedProduct[]): string {
    const zoneText =
      zones.length === 1 ? `on the ${zones[0]}` : zones.length > 1 ? `on: ${zones.join(', ')}` : 'on concerned zones'

    const advice: Record<string, string> = {
      'redness': `Mist gently ${zoneText}, pat without rubbing. Let it air dry.`,
      'ingrowns': `Apply a thin layer ${zoneText} after shaving. Avoid aggressive massage.`,
      'blemishes': `Apply 2–3 drops ${zoneText} in the evening only. Start every other day.`,
      'enlarged-pores': `Apply on clean skin ${zoneText}. Use at night, start progressively.`,
      'blackheads': `Apply with a cotton pad ${zoneText}, 2–3×/week max, at night.`
    }

    return advice[issueType.toLowerCase()] || `Apply per product instructions ${zoneText}. Monitor skin tolerance.`
  }

  /** Generate restrictions by issue */
  private static generateRestrictions(issueType: string, _beautyAssessment: BeautyAssessment): string[] | undefined {
    const restrictions: Record<string, string[]> = {
      'redness': ['Avoid AHA/BHA and retinoids until improvement', 'No mechanical exfoliation on irritated zones'],
      'ingrowns': ['Avoid dry shaving', 'Prefer trimmer or shaving with foam', 'Avoid aggressive exfoliation'],
      'blemishes': [
        'Start progressively (every other day)',
        'Daily sun protection required',
        'Avoid combining with retinoids initially'
      ]
    }
    return restrictions[issueType.toLowerCase()]
  }

  /** Priority by issue */
  private static calculatePriority(issueType: string): number {
    const mapping: Record<string, number> = {
      'redness': 8,
      'ingrowns': 7,
      'blemishes': 6,
      'enlarged-pores': 5,
      'blackheads': 4,
      'wrinkles': 3
    }
    return mapping[issueType.toLowerCase()] || 5
  }

  /** Always include sun protection (business rule) */
  private static includesSunProtection(_beautyAssessment: BeautyAssessment): boolean {
    return true
  }

  /**
   * NEW: Smart grouping by product to avoid redundant steps
   */
  private static groupTreatmentsByProduct(beautyAssessment: BeautyAssessment): OptimizedTreatment[] {
    if (!beautyAssessment.zoneSpecific || !Array.isArray(beautyAssessment.zoneSpecific)) {
      console.log('⚠️ No specific zones, fallback to general treatment')
      return [
        {
          issues: [beautyAssessment.mainConcern || 'hydration'],
          zones: beautyAssessment.concernedZones || [],
          catalogId: 'B01MSSDEPK', // default cleanser as safe fallback
          priority: 5
        }
      ]
    }

    const allProblems: { issue: string; zone: string; intensity: string }[] = []
    for (const zoneData of beautyAssessment.zoneSpecific) {
      if (!zoneData.zone) continue
      if (Array.isArray(zoneData.problems)) {
        for (const problem of zoneData.problems) {
          allProblems.push({
            issue: problem.name?.toLowerCase() || 'targeted-care',
            zone: zoneData.zone,
            intensity: problem.intensity || 'moderate'
          })
        }
      }
    }

    console.log('🔍 Extracted problems:', allProblems)

    const productGroups = new Map<string, { issues: string[]; zones: string[]; priority: number; intensity: string }>()
    for (const problem of allProblems) {
      const catalogId = this.getProductIdForIssue(problem.issue)
      if (!productGroups.has(catalogId)) {
        productGroups.set(catalogId, {
          issues: [],
          zones: [],
          priority: this.calculatePriority(problem.issue),
          intensity: problem.intensity
        })
      }
      const group = productGroups.get(catalogId)!
      if (!group.issues.includes(problem.issue)) group.issues.push(problem.issue)
      if (!group.zones.includes(problem.zone)) group.zones.push(problem.zone)
    }

    const treatments: OptimizedTreatment[] = Array.from(productGroups.entries())
      .map(([catalogId, data]) => ({ issues: data.issues, zones: data.zones, catalogId, priority: data.priority }))
      .sort((a, b) => b.priority - a.priority)

    console.log(
      '✅ Treatments grouped by product:',
      treatments.map((t) => `${t.catalogId}: ${t.issues.join(' + ')} (zones: ${t.zones.join(', ')})`)
    )

    return treatments
  }

  /** Get catalogId for issue type (EN canonicals only) */
  private static getProductIdForIssue(issueType: string): string {
    const map: Record<string, string> = {
      'redness': 'B000O7PH34',
      'ingrowns': 'B00BNUY3HE',
      'blemishes': 'B01MDTVZTZ',
      'pigmentation': 'B01MDTVZTZ',
      'dark spots': 'B01MDTVZTZ',
      'enlarged-pores': 'B01MDTVZTZ',
      'blackheads': 'B00949CTQQ',
      'comedones': 'B00949CTQQ',
      'wrinkles': 'B01MSSDEPK',
      'dehydration': 'B01MSSDEPK'
    }
    return map[issueType.toLowerCase()] || 'B01MSSDEPK'
  }

  /** Create optimized grouped treatment step */
  private static createOptimizedTreatmentStep(
    stepNumber: number,
    treatment: OptimizedTreatment,
    _beautyAssessment: BeautyAssessment,
    _productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    const title = this.generateOptimizedStepTitle(treatment.issues, treatment.zones)
    const product = this.getProductByCatalogId(treatment.catalogId)
    const applicationAdvice = this.generateGroupedApplicationAdvice(treatment)
    const restrictions = this.generateGroupedRestrictions(treatment.issues)

    return {
      stepNumber,
      title,
      targetArea: 'specific',
      zones: [...new Set(treatment.zones)],
      recommendedProducts: [product],
      applicationAdvice,
      restrictions,
      treatmentType: 'treatment',
      priority: treatment.priority,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'evening',
      category: 'treatment'
    }
  }

  /** Smart title for grouped treatment */
  private static generateOptimizedStepTitle(issues: string[], _zones: string[]): string {
    const labels: Record<string, string> = {
      'redness': 'redness',
      'ingrowns': 'ingrowns',
      'blemishes': 'blemishes',
      'pigmentation': 'pigmentation',
      'dark spots': 'pigmentation',
      'enlarged-pores': 'enlarged pores',
      'blackheads': 'blackheads',
      'comedones': 'blackheads',
      'wrinkles': 'wrinkles'
    }

    const friendly = issues
      .map((i) => labels[i.toLowerCase()] || i)
      .filter((v, i, arr) => arr.indexOf(v) === i)

    let text = ''
    if (friendly.length === 1) text = `Treat ${friendly[0]}`
    else if (friendly.length === 2) text = `Treat ${friendly[0]} and ${friendly[1]}`
    else text = `Treat ${friendly.slice(0, -1).join(', ')} and ${friendly[friendly.length - 1]}`

    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  /** Get product by catalogId */
  private static getProductByCatalogId(catalogId: string): RecommendedProduct {
    const map: Record<string, RecommendedProduct> = {
      B000O7PH34: {
        id: 'B000O7PH34',
        name: 'Avène Thermal Spring Water',
        brand: 'Avène',
        category: 'treatment',
        catalogId: 'B000O7PH34'
      },
      B00BNUY3HE: {
        id: 'B00BNUY3HE',
        name: 'La Roche-Posay Cicaplast Baume B5',
        brand: 'La Roche-Posay',
        category: 'treatment',
        catalogId: 'B00BNUY3HE'
      },
      B01MDTVZTZ: {
        id: 'B01MDTVZTZ',
        name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        category: 'serum',
        catalogId: 'B01MDTVZTZ'
      },
      B00949CTQQ: {
        id: 'B00949CTQQ',
        name: "Paula's Choice SKIN PERFECTING 2% BHA",
        brand: "Paula's Choice",
        category: 'exfoliant',
        catalogId: 'B00949CTQQ'
      }
    }

    return (
      map[catalogId] || {
        id: 'B01MSSDEPK',
        name: 'Targeted care',
        brand: 'DermAI Selection',
        category: 'treatment',
        catalogId: 'B01MSSDEPK'
      }
    )
  }

  /** Grouped treatment – application tips */
  private static generateGroupedApplicationAdvice(t: OptimizedTreatment): string {
    const zoneText = t.zones.length === 1 ? `on the ${t.zones[0]}` : `on: ${t.zones.join(', ')}`
    const id = t.catalogId

    if (id === 'B000O7PH34') return `Mist gently ${zoneText}, pat without rubbing. Let it air dry.`
    if (id === 'B00BNUY3HE') return `Apply a thin layer ${zoneText}. Massage very gently until absorbed.`
    if (id === 'B01MDTVZTZ') return `Apply 2–3 drops ${zoneText} in the evening only. Start every other day.`
    if (id === 'B00949CTQQ') return `Apply with a cotton pad ${zoneText}. 2–3×/week max, always at night.`

    return `Apply per product instructions ${zoneText}. Monitor skin tolerance.`
  }

  /** Grouped treatment – restrictions */
  private static generateGroupedRestrictions(issues: string[]): string[] | undefined {
    const s = new Set<string>()
    for (const issue of issues) {
      const k = issue.toLowerCase()
      if (k.includes('redness') || k.includes('irritat')) {
        s.add('Avoid AHA/BHA and retinoids until improvement')
        s.add('No mechanical exfoliation on irritated zones')
      }
      if (k.includes('ingrown')) {
        s.add('Avoid dry shaving')
        s.add('Prefer trimmer or shaving with foam')
      }
      if (k.includes('blemish') || k.includes('spot') || k.includes('pigment')) {
        s.add('Daily sun protection required')
        s.add('Start progressively (every other day)')
      }
    }
    return s.size > 0 ? Array.from(s) : undefined
  }

  /** NEW LOGIC: Identify durable base in immediate phase */
  private static identifyLongTermBase(immediatePhase: UnifiedRoutineStep[]): LongTermBaseProduct[] {
    console.log(
      '🔍 Analyzing immediate phase to identify durable base:',
      immediatePhase.map((s) => `${s.stepNumber}. ${s.title} (${s.category})`).join(', ')
    )

    const longTermBase = immediatePhase
      .filter((step) => {
        const isDurable =
          step.frequency === 'daily' &&
          ['cleansing', 'hydration', 'protection'].includes(step.category) &&
          !this.isTemporaryTreatment(step)
        console.log(
          `  - ${step.title}: ${isDurable ? '✓ Durable base' : '✗ Temporary'} (${step.category}, ${step.frequency})`
        )
        return isDurable
      })
      .map((step) => ({
        stepNumber: step.stepNumber,
        title: step.title,
        catalogId: step.recommendedProducts[0]?.catalogId || step.recommendedProducts[0]?.id || '',
        productName: step.recommendedProducts[0]?.name || step.title,
        productBrand: step.recommendedProducts[0]?.brand || 'DermAI Selection',
        canBeMaintainedMonths: true,
        isTemporaryTreatment: false,
        frequency: step.frequency,
        category: step.category,
        phase: step.phase
      }))

    console.log('📊 Final durable base:', longTermBase.map((b) => `${b.title} - ${b.productName} (${b.catalogId})`).join(', '))
    return longTermBase
  }

  /** Determine if a treatment is temporary */
  private static isTemporaryTreatment(step: UnifiedRoutineStep): boolean {
    const keywords = ['ingrowns', 'healing', 'barrier repair', 'inflammation', 'acute irritation', 'emergency']
    const t = `${step.title} ${step.applicationAdvice}`.toLowerCase()
    return keywords.some((k) => t.includes(k))
  }

  /** Evolve base products based on AI needs */
  private static evolveBaseProducts(baseDurable: LongTermBaseProduct[], beautyAssessment: BeautyAssessment): UnifiedRoutineStep[] {
    const originalProductMapping: Record<string, RecommendedProduct> = {
      B01MSSDEPK: {
        id: 'B01MSSDEPK',
        name: 'CeraVe Hydrating Cleanser',
        brand: 'CeraVe',
        category: 'cleanser',
        catalogId: 'B01MSSDEPK'
      },
      B00BNUY3HE: {
        id: 'B00BNUY3HE',
        name: 'Toleriane Sensitive',
        brand: 'La Roche-Posay',
        category: 'moisturizer',
        catalogId: 'B00BNUY3HE'
      },
      B004W55086: {
        id: 'B004W55086',
        name: 'La Roche-Posay Anthelios Fluid SPF 50',
        brand: 'La Roche-Posay',
        category: 'sunscreen',
        catalogId: 'B004W55086'
      }
    }

    return baseDurable.map((base, i) => {
      const newStepNumber = i + 1

      if (base.category === 'hydration') {
        if (this.needsReinforcedHydration(beautyAssessment)) {
          return {
            stepNumber: newStepNumber,
            title: base.title.replace(/global/i, 'reinforced'),
            targetArea: 'global' as const,
            recommendedProducts: this.getReinforcedHydrationProducts(),
            applicationAdvice: 'Apply generously to offset introduction of stronger actives.',
            treatmentType: 'moisturizing' as const,
            priority: 9,
            phase: 'adaptation' as const,
            frequency: 'daily' as const,
            timeOfDay: 'morning_and_evening' as const,
            category: 'hydration' as const,
            applicationDuration: 'Ongoing',
            timingBadge: 'Daily ☀️🌙',
            timingDetails: 'Morning and evening'
          }
        }
      }

      if (base.category === 'protection') {
        if (this.hasProgressiveActives(beautyAssessment) || this.hasHighExposure(beautyAssessment)) {
          return {
            stepNumber: newStepNumber,
            title: 'Reinforced sun protection',
            targetArea: 'global' as const,
            recommendedProducts: this.getHigherSPFProducts(),
            applicationAdvice: 'Daily application is essential with actives. Reapply every 2h if exposed.',
            treatmentType: 'protection' as const,
            priority: 10,
            phase: 'adaptation' as const,
            frequency: 'daily' as const,
            timeOfDay: 'morning' as const,
            category: 'protection' as const,
            applicationDuration: 'Ongoing',
            timingBadge: 'Daily ☀️',
            timingDetails: 'Morning only'
          }
        }
      }

      const original =
        originalProductMapping[base.catalogId] ||
        ({
          id: base.catalogId,
          name: base.productName,
          brand: base.productBrand,
          category: base.category,
          catalogId: base.catalogId
        } as RecommendedProduct)

      return {
        stepNumber: newStepNumber,
        title: base.title,
        targetArea: 'global' as const,
        recommendedProducts: [original],
        applicationAdvice: 'Routine established. Continue application as previously instructed.',
        treatmentType: this.mapCategoryToTreatmentType(base.category),
        priority: 9,
        phase: 'adaptation' as const,
        frequency: base.frequency as any,
        timeOfDay: 'morning_and_evening' as const,
        category: base.category as any,
        applicationDuration: 'Ongoing',
        timingBadge: 'Daily ☀️🌙',
        timingDetails: 'Morning and evening'
      }
    })
  }

  /** Progressive actives per diagnosis */
  private static generateProgressiveActives(beautyAssessment: BeautyAssessment, stepCounter: number): UnifiedRoutineStep[] {
    const actives: UnifiedRoutineStep[] = []
    const hasAging = this.hasAgingConcerns(beautyAssessment)
    const hasAcne = this.hasAcneConcerns(beautyAssessment)
    const hasPigmentation = this.hasPigmentationConcerns(beautyAssessment)

    if (hasAging) {
      actives.push({
        stepNumber: stepCounter++,
        title: 'Progressive anti-aging serum',
        targetArea: 'global',
        recommendedProducts: [
          {
            id: 'B08KGXQY2R',
            name: 'The Ordinary Retinol 0.2% in Squalane',
            brand: 'The Ordinary',
            category: 'serum',
            catalogId: 'B08KGXQY2R'
          }
        ],
        applicationAdvice: 'Start every 3 nights, then increase per tolerance. Apply on dry skin.',
        restrictions: ['Daily sun protection required', 'Start very progressively'],
        treatmentType: 'treatment',
        priority: 8,
        phase: 'adaptation',
        frequency: 'weekly',
        timeOfDay: 'evening',
        category: 'treatment',
        startAfterDays: 14,
        frequencyDetails: 'Once every 3 nights, then increase',
        applicationDuration: 'Progressive introduction per tolerance',
        timingBadge: 'Progressive 📈',
        timingDetails: 'Every 3 nights, then increase'
      })
    }

    if (hasAcne || hasPigmentation) {
      actives.push({
        stepNumber: stepCounter++,
        title: 'Targeted active treatment (Niacinamide)',
        targetArea: 'specific',
        zones: beautyAssessment.concernedZones || [],
        recommendedProducts: [
          {
            id: 'B077RZ5LPG',
            name: 'The Ordinary Niacinamide 10% + Zinc 1%',
            brand: 'The Ordinary',
            category: 'serum',
            catalogId: 'B077RZ5LPG'
          }
        ],
        applicationAdvice: '2–3 drops in the evening only on concerned zones.',
        treatmentType: 'treatment',
        priority: 7,
        phase: 'adaptation',
        frequency: 'daily',
        timeOfDay: 'evening',
        category: 'treatment',
        startAfterDays: 14,
        applicationDuration: 'Ongoing to maintain results',
        timingBadge: 'Daily 🌙',
        timingDetails: 'Evening only'
      })
    }

    return actives
  }

  /** Add visual criteria AND timing/duration fields */
  private static addVisualCriteria(step: UnifiedRoutineStep): UnifiedRoutineStep {
    const visual = this.getVisualCriteriaForTreatment(step.title)
    const timing = this.generateTimingBadge(step)

    return {
      ...step,
      applicationDuration: this.generateApplicationDuration(step, visual),
      timingBadge: timing.badge,
      timingDetails: timing.details
    }
  }

  /** Visual criteria by treatment (EN titles) */
  private static getVisualCriteriaForTreatment(title: string): VisualCriteria | null {
    const criteria: Record<string, VisualCriteria> = {
      'ingrowns': {
        goal: 'inflammation resolved',
        observation: 'Check absence of redness and swelling',
        estimatedDays: '1–2 weeks',
        nextStep: 'Continue shaving prevention, then move to next phase'
      },
      'blemishes': {
        goal: 'visible reduction of lesions',
        observation: 'Count reduction in number of active spots',
        estimatedDays: '2–3 weeks',
        nextStep: 'Introduce recurrence prevention'
      },
      'redness': {
        goal: 'soothing and tone evening',
        observation: 'More even tone, less reactivity',
        estimatedDays: '1–2 weeks',
        nextStep: 'Strengthen skin barrier'
      },
      'healing': {
        goal: 'complete closure of lesions',
        observation: 'Skin smooth, color normalized',
        estimatedDays: '1–3 weeks',
        nextStep: 'Scar prevention'
      }
    }

    const lower = title.toLowerCase()
    for (const [k, v] of Object.entries(criteria)) {
      if (lower.includes(k)) return v
    }
    return null
  }

  /** Need reinforced hydration? */
  private static needsReinforcedHydration(beautyAssessment: BeautyAssessment): boolean {
    const s = beautyAssessment.mainConcern?.toLowerCase() || ''
    return (
      s.includes('dehydration') ||
      beautyAssessment.zoneSpecific?.some((zone) => zone.problems?.some((p) => p.name.toLowerCase().includes('dehydration'))) ||
      false
    )
  }

  private static hasProgressiveActives(beautyAssessment: BeautyAssessment): boolean {
    return this.hasAgingConcerns(beautyAssessment) || this.hasAcneConcerns(beautyAssessment)
  }

  private static hasHighExposure(beautyAssessment: BeautyAssessment): boolean {
    const s = beautyAssessment.mainConcern?.toLowerCase() || ''
    return s.includes('spot') || s.includes('pigment') || s.includes('photoaging')
  }

  private static getReinforcedHydrationProducts(): RecommendedProduct[] {
    return [
      {
        id: '3337875588378',
        name: 'La Roche-Posay Toleriane Ultra Fluide',
        brand: 'La Roche-Posay',
        category: 'moisturizer',
        catalogId: '3337875588378'
      }
    ]
  }

  private static getHigherSPFProducts(): RecommendedProduct[] {
    return [
      {
        id: '3337875588600',
        name: 'La Roche-Posay Anthelios Ultra Fluide SPF 60',
        brand: 'La Roche-Posay',
        category: 'sunscreen',
        catalogId: '3337875588600'
      }
    ]
  }

  private static mapCategoryToTreatmentType(
    category: string
  ): 'cleansing' | 'treatment' | 'moisturizing' | 'protection' {
    const mapping: Record<string, any> = {
      cleansing: 'cleansing',
      hydration: 'moisturizing',
      protection: 'protection',
      treatment: 'treatment'
    }
    return mapping[category] || 'treatment'
  }

  /** Order steps by dermatologic logic */
  private static orderStepsLogically(steps: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    const order = { cleansing: 1, treatment: 2, hydration: 3, protection: 4 } as const
    return steps.sort((a, b) => {
      const aO = (order as any)[a.category] || 5
      const bO = (order as any)[b.category] || 5
      if (aO !== bO) return aO - bO
      return b.priority - a.priority
    })
  }

  /** Transfer & optimize base from adaptation to maintenance */
  private static transferAndOptimizeBase(adaptationPhase: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    console.log(
      '🔄 Transferring adaptation base to maintenance:',
      adaptationPhase.map((s) => `${s.stepNumber}. ${s.title}`).join(', ')
    )

    const base = adaptationPhase.filter(
      (s) => s.frequency === 'daily' && ['cleansing', 'hydration', 'protection'].includes(s.category)
    )

    console.log('🏠 Base to transfer:', base.map((s) => s.title).join(', '))

    return base.map((step) => ({
      ...step,
      phase: 'maintenance' as const,
      title: step.title.toLowerCase().includes('reinforc') ? step.title : `${step.title} (optimized)`,
      applicationAdvice: `Routine established and mastered. ${step.applicationAdvice.replace(
        'Routine established. ',
        ''
      )}`
    }))
  }

  /** Preventive care for long-term needs */
  private static generatePreventiveCare(beautyAssessment: BeautyAssessment, stepCounter: number): UnifiedRoutineStep[] {
    const out: UnifiedRoutineStep[] = []

    if (this.needsExfoliation(beautyAssessment)) {
      out.push({
        stepNumber: stepCounter++,
        title: 'Preventive exfoliation',
        targetArea: 'global',
        recommendedProducts: [
          {
            id: 'B07XDQJV2P',
            name: 'The Ordinary Lactic Acid 5% + HA',
            brand: 'The Ordinary',
            category: 'exfoliant',
            catalogId: 'B07XDQJV2P'
          }
        ],
        applicationAdvice: 'Apply to maintain cell turnover and prevent dead cell buildup.',
        restrictions: ['Do not combine with retinol on the same night', 'Daily sun protection is essential'],
        treatmentType: 'treatment',
        priority: 6,
        phase: 'maintenance',
        frequency: 'weekly',
        timeOfDay: 'evening',
        category: 'exfoliation',
        startAfterDays: 42,
        frequencyDetails: 'Once/week, evening without retinol',
        applicationDuration: 'Weekly maintenance',
        timingBadge: 'Weekly 🌙',
        timingDetails: 'Once/week, evening without retinol'
      })
    }

    const main = (beautyAssessment.mainConcern || '').toLowerCase()

    if (main.includes('spot') || main.includes('pigment')) {
      out.push({
        stepNumber: stepCounter++,
        title: 'Pigment-spot prevention',
        targetArea: 'specific',
        zones: beautyAssessment.concernedZones || [],
        recommendedProducts: [
          {
            id: 'B077RZ5LPG',
            name: 'The Ordinary Niacinamide 10% + Zinc 1%',
            brand: 'The Ordinary',
            category: 'serum',
            catalogId: 'B077RZ5LPG'
          }
        ],
        applicationAdvice: 'Continued application to maintain even tone and prevent new spots.',
        treatmentType: 'treatment',
        priority: 7,
        phase: 'maintenance',
        frequency: 'daily',
        timeOfDay: 'evening',
        category: 'treatment',
        applicationDuration: 'Ongoing for prevention',
        timingBadge: 'Daily 🌙',
        timingDetails: 'Evening only'
      })
    }

    if (main.includes('wrinkle') || main.includes('aging')) {
      out.push({
        stepNumber: stepCounter++,
        title: 'Aging prevention',
        targetArea: 'global',
        recommendedProducts: [
          {
            id: 'B08KGXQY2R',
            name: 'The Ordinary Retinol 0.2% in Squalane',
            brand: 'The Ordinary',
            category: 'serum',
            catalogId: 'B08KGXQY2R'
          }
        ],
        applicationAdvice: 'Maintain 3–4 applications/week to prevent new signs of aging.',
        restrictions: ['Daily sun protection required'],
        treatmentType: 'treatment',
        priority: 8,
        phase: 'maintenance',
        frequency: 'weekly',
        timeOfDay: 'evening',
        category: 'treatment',
        frequencyDetails: '3–4×/week',
        applicationDuration: 'Ongoing for prevention',
        timingBadge: 'Varied ⚡',
        timingDetails: '3–4×/week'
      })
    }

    return out
  }

  /** Generate application duration string (EN) */
  private static generateApplicationDuration(step: UnifiedRoutineStep, visual: VisualCriteria | null): string {
    if (visual) return `Until ${visual.observation.toLowerCase()} (${visual.estimatedDays})`
    if (['cleansing', 'hydration', 'protection'].includes(step.category)) return 'Ongoing'
    if (step.frequency === 'weekly') return 'Weekly maintenance'
    if (step.frequencyDetails?.toLowerCase().includes('progressive') || step.applicationDuration?.toLowerCase().includes('progressive')) return 'Progressive introduction per tolerance'
    return 'As needed'
  }

  /** Generate timing badge (EN) */
  private static generateTimingBadge(step: UnifiedRoutineStep): TimingBadgeResult {
    const { frequency, timeOfDay, frequencyDetails } = step
    const icons = { morning: '☀️', evening: '🌙', morning_and_evening: '☀️🌙' }

    if (frequency === 'daily') {
      const icon = (icons as any)[timeOfDay] || ''
      return {
        badge: `Daily ${icon}`,
        details: timeOfDay === 'evening' ? 'Evening only' : timeOfDay === 'morning' ? 'Morning only' : 'Morning and evening'
      }
    }

    if (frequency === 'weekly') {
      const icon = (icons as any)[timeOfDay] || '🌙'
      let details = 'Once/week'
      if (step.title.toLowerCase().includes('exfoliation')) {
        details = 'Once/week, evening without retinol'
      } else if (frequencyDetails) {
        details = frequencyDetails
      }
      return { badge: `Weekly ${icon}`, details }
    }

    if (frequencyDetails?.toLowerCase().includes('progressive') || step.applicationDuration?.toLowerCase().includes('progressive')) {
      return {
        badge: 'Progressive 📈',
        details: frequencyDetails || 'Start once every 3 days, then increase'
      }
    }

    if (frequency === 'as_needed') {
      return { badge: 'As needed 🎯', details: 'According to issue appearance' }
    }

    return { badge: 'Varied ⚡', details: frequencyDetails || 'Variable frequency' }
  }
}

// -------- Internal helper interfaces --------

interface OptimizedTreatment {
  issues: string[]
  zones: string[]
  catalogId: string
  priority: number
}

interface LongTermBaseProduct {
  stepNumber: number
  title: string
  catalogId: string
  productName: string
  productBrand: string
  canBeMaintainedMonths: boolean
  isTemporaryTreatment: boolean
  frequency: string
  category: string
  phase: 'immediate' | 'adaptation' | 'maintenance'
}

interface VisualCriteria {
  goal: string
  observation: string
  estimatedDays: string
  nextStep: string
}

interface TimingBadgeResult {
  badge: string
  details?: string
}
