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

      // Check environment variables
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is missing in Vercel environment variables')
      }

      // Create OpenAI client server-side
      const openai = createOpenAIClient()
      console.log('✅ OpenAI client initialized successfully')

      // Normalize input request from FR to EN at the boundary
      const normalizedRequest = {
        ...request,
        userProfile: {
          ...request.userProfile,
          gender: normalizeGender(request.userProfile.gender) || request.userProfile.gender,
          skinType: normalizeSkinType(request.userProfile.skinType) || request.userProfile.skinType
        },
        currentRoutine: {
          ...request.currentRoutine,
          routinePreference: normalizeRoutinePreference(request.currentRoutine.routinePreference) || request.currentRoutine.routinePreference,
          monthlyBudget: normalizeBudget(request.currentRoutine.monthlyBudget) || request.currentRoutine.monthlyBudget
        }
      }

      // Images are already base64 from client
      const imageContents = normalizedRequest.photos
        .map((photo) => {
          // Extract base64 part if it contains a data: prefix
          let base64Data = ''

          if (typeof photo.file === 'string') {
            if (photo.file.includes('base64,')) {
              base64Data = photo.file.split('base64,')[1]
            } else {
              base64Data = photo.file
            }
          }

          return base64Data
        })
        .filter((base64) => base64.length > 0)

      // Image validation
      if (imageContents.length === 0) {
        throw new Error('No valid images found for analysis')
      }

      console.log('🔍 STEP 1: Pure diagnostic analysis (without catalog)')

      // STEP 1: Pure diagnostic analysis WITHOUT catalog
      const diagnosticResult = await this.performDiagnosticAnalysis(openai, imageContents, request)

      console.log('✅ Diagnosis established:', {
        mainConcern: diagnosticResult.beautyAssessment?.mainConcern,
        overallScore: diagnosticResult.scores?.overall,
        concernedZones: diagnosticResult.beautyAssessment?.concernedZones
      })

      console.log('🛍️ STEP 2: Product selection based on diagnosis')

      // STEP 2: Product selection based on established diagnosis
      const productRecommendations = await this.selectProductsBasedOnDiagnosis(openai, diagnosticResult, request)

      console.log('✅ Products selected:', productRecommendations)

      // STEP 3: Unified routine generation
      console.log('🔄 STEP 3: Unified routine generation')
      const unifiedRoutine = this.generateUnifiedRoutine(diagnosticResult.beautyAssessment, productRecommendations)
      console.log('✅ Unified routine generated:', unifiedRoutine.length, 'steps')

      // Merge results with unified routine
      const finalAnalysis: SkinAnalysis = {
        id: this.generateId(),
        userId: 'temp-user',
        photos: request.photos,
        scores: diagnosticResult.scores,
        beautyAssessment: diagnosticResult.beautyAssessment,
        recommendations: {
          ...productRecommendations,
          unifiedRoutine // Add unified routine
        },
        createdAt: new Date()
      }

      return finalAnalysis
    } catch (error) {
      console.error('❌ Full AI analysis error:', error)

      // Specific diagnostics for Vercel
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()

        if (errorMessage.includes('api key') || errorMessage.includes('unauthorized')) {
          throw new Error('Invalid OpenAI configuration – check OPENAI_API_KEY in Vercel')
        }

        if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          throw new Error('OpenAI limit reached – please try again in a few minutes')
        }

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          throw new Error('Network connection issue from Vercel to OpenAI')
        }

        if (errorMessage.includes('timeout')) {
          throw new Error('Analysis timeout – image too large or slow connection')
        }

        if (errorMessage.includes('expected pattern') || errorMessage.includes('json')) {
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
      // Load catalog from file system
      const fs = await import('fs').then((m) => m.promises)
      const path = await import('path')

      const catalogPath = path.join(process.cwd(), 'public', 'affiliateCatalog.json')
      const catalogData = await fs.readFile(catalogPath, 'utf-8')
      const catalog = JSON.parse(catalogData)
      const products = catalog.products || []

      // Format for the prompt (diverse selection per category)
      const categorizedProducts = products.reduce((acc: any, product: any) => {
        if (!acc[product.category]) acc[product.category] = []
        acc[product.category].push(product)
        return acc
      }, {})

      // Take 3–5 products per main category
      const importantCategories = ['cleanser', 'serum', 'moisturizer', 'sunscreen', 'exfoliant', 'treatment', 'mist']
      const selectedProducts: any[] = []

      importantCategories.forEach((category) => {
        if (categorizedProducts[category]) {
          selectedProducts.push(...categorizedProducts[category].slice(0, 4))
        }
      })

      // Limit overall to avoid an overly long prompt
      const catalogText = selectedProducts
        .slice(0, 40)
        .map((product: any) => {
          const benefits = Array.isArray(product.benefits)
            ? product.benefits.slice(0, 2).join(', ')
            : 'Targeted care'
          return `- ${product.id} : ${product.name} (${product.brand}, ${product.category}) - ${benefits}`
        })
        .join('\n')

      console.log(
        '📦 Catalog loaded for ChatGPT:',
        selectedProducts.length,
        'products selected out of',
        products.length,
        'total'
      )
      return catalogText
    } catch (error) {
      console.error('❌ Error loading catalog for prompt:', error)
      // Fallback with a few baseline products from the real catalog
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
        {
          signal: controller.signal
        }
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
    // Load the full catalog
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
          temperature: 0.2 // More deterministic for selection
        },
        {
          signal: controller.signal
        }
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
   * Weights chosen for consumer-friendly meaning (sum = 1)
   */
  private static computeWeightedOverall(scores: Record<string, { value: number }>): number {
    const weights: Record<string, number> = {
      hydration: 0.15, // Hydration
      wrinkles: 0.2, // Wrinkles
      firmness: 0.12, // Firmness
      radiance: 0.12, // Radiance
      pores: 0.15, // Pores
      spots: 0.08, // Spots
      darkCircles: 0.08, // Dark circles
      skinAge: 0.1 // Skin age
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

    if (usedWeightSum === 0) {
      return 0
    }

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
DO NOT recommend products at this stage — focus 100% on diagnostic analysis.

## CONTEXT
Professional skin analysis app. You analyze the skin visually to produce an objective diagnostic based on observable cosmetic characteristics.

## REQUIRED ANALYSIS
1. **DETAILED SCORES**: Rate each criterion out of 100
2. **PRIMARY CONCERN**: Identify the main concern
3. **CONCERNED ZONES**: Precisely locate issues
4. **VISUAL FINDINGS**: Describe what you objectively see
5. **IMPROVEMENT ESTIMATE**: Estimate realistic time to reach 90/100 based on current state

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
      "Presence of ingrown hairs on shaving zone",
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
- **CRITICAL**: Return VALID JSON in English canonical values only
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
- Prep (tonic/toner)
- Treat (serum, treatment)
- Moisturize (moisturizer)
- Nourish (face_oil, balm if needed)
- Protect (sunscreen)

## OUTPUT – MANDATORY JSON FORMAT
Respond ONLY with valid JSON matching this exact shape.
IMPORTANT: Keep these exact French tokens for interoperability:
- frequency: "quotidien" | "hebdomadaire" | "ponctuel"
- timing: "matin" | "soir" | "matin_et_soir"
**CRITICAL**: For all other fields use English canonical values:
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
        "frequency": "quotidien",
        "timing": "matin_et_soir",
        "catalogId": "B01MSSDEPK",
        "application": "Massage gently, rinse with lukewarm water",
        "startDate": "maintenant"
      }
    ],
    "adaptation": [
      {
        "name": "Gentle exfoliation",
        "frequency": "hebdomadaire",
        "timing": "soir",
        "catalogId": "B00949CTQQ",
        "application": "Start once a week, increase progressively",
        "startDate": "après_2_semaines"
      }
    ],
    "maintenance": [
      {
        "name": "Sun protection",
        "frequency": "quotidien",
        "timing": "matin",
        "catalogId": "B004W55086",
        "application": "Reapply every 2h if exposed",
        "startDate": "maintenant"
      }
    ]
  },
  "localizedRoutine": [
    {
      "zone": "menton",
      "priority": "haute",
      "steps": [
        {
          "name": "Soothing care",
          "frequency": "quotidien",
          "timing": "soir",
          "catalogId": "B00BNUY3HE",
          "application": "Thin layer on sensitive zones",
          "duration": "jusqu'à amélioration",
          "resume": "quand sensibilité disparue"
        }
      ]
    }
  ],
  "overview": "Progressive routine focused on soothing then prevention",
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
**Routine preference:** ${request.currentRoutine.routinePreference || 'Équilibrée'}

## CURRENT ROUTINE
**Morning:** ${request.currentRoutine.morningProducts.join(', ') || 'No routine'}
**Evening:** ${request.currentRoutine.eveningProducts.join(', ') || 'No routine'}
**Routine preference (complexity):** ${request.currentRoutine.routinePreference || 'Équilibrée'}
**Monthly budget:** ${request.currentRoutine.monthlyBudget}

## ALLERGIES & SENSITIVITIES
**Ingredients to avoid:** ${
      request.allergies?.ingredients?.join(', ') || 'No known allergies'
    }
**Past reactions:** ${request.allergies?.pastReactions || 'No reactions reported'}

## PRODUCT CATALOG (STRUCTURED)
- If a catalog is provided by the app, it will be passed separately and you must pick from it. Otherwise, do not cite brands.

## PROVIDED PHOTOS
${request.photos.map((photo, index) => `Photo ${index + 1}: ${photo.type}`).join('\n')}

## BEAUTY MISSION
Analyze these ${request.photos.length} photos with maximum expert beauty advice.

**PAY SPECIAL ATTENTION TO:**
- Mentioned beauty concerns: ${request.skinConcerns.primary.join(', ')}
// (Note: user selected routine preference: ${request.currentRoutine.routinePreference || 'Équilibrée'})
- Sensitivities to consider: ${
      request.allergies?.ingredients?.filter((i) => i !== 'Aucune allergie connue').join(', ') || 'None'
    }
- Available budget: ${request.currentRoutine.monthlyBudget}

**YOU MUST DETERMINE:**
- Real intensity based only on visual analysis (ignore self-assessment)
- Precise skin concerns observed
- Cosmetic recommendations adapted to budget and sensitivities
- An overview (max 3 points) + a localized view by zones (forehead, cheeks, nose, eye contour, beard, lips...) with concerns and intensity
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
${
  diagnostic.beautyAssessment.overview?.map((item) => `- ${item}`).join('\n') ||
  "No overview"
}

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
**Routine preference:** ${request.currentRoutine.routinePreference || 'Équilibrée'}

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

  /**
   * Parse diagnostic response (STEP 1)
   */
  private static parseDiagnosticResponse(content: string | null): Record<string, unknown> {
    if (!content) {
      throw new Error('Empty diagnostic response from AI')
    }

    try {
      // Clean response (strip markdown fences if present)
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      console.log('Diagnostic content to parse:', cleanContent.substring(0, 200) + '...')

      const parsed = JSON.parse(cleanContent)

      // Basic validation of diagnostic structure
      if (!parsed.scores || !parsed.beautyAssessment) {
        throw new Error('Invalid diagnostic response structure')
      }

      // Normalize FR to EN at the boundary
      if (parsed.beautyAssessment) {
        parsed.beautyAssessment = normalizeAssessmentFRtoEN(parsed.beautyAssessment)
      }

      return parsed
    } catch (error) {
      console.error('Diagnostic JSON parsing error:', error)
      console.error('Raw content received:', content)
      throw new Error('Invalid diagnostic response format from AI')
    }
  }

  /**
   * Parse product selection response (STEP 2)
   */
  private static parseProductSelectionResponse(content: string | null): ProductRecommendations {
    if (!content) {
      throw new Error('Empty product-selection response from AI')
    }

    try {
      // Clean response (strip markdown fences if present)
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

      console.log('Product selection content to parse:', cleanContent.substring(0, 200) + '...')

      const parsed = JSON.parse(cleanContent)

      // Basic validation of recommendations structure
      if (!parsed.routine) {
        throw new Error('Invalid product-selection response structure')
      }

      return parsed as ProductRecommendations
    } catch (error) {
      console.error('Product selection JSON parsing error:', error)
      console.error('Raw content received:', content)
      throw new Error('Invalid product selection response format from AI')
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * STEP 3: Generate unified routine with smart product grouping
   * Removes separate “zones to monitor” section + avoids redundant steps
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

    // Generate all 3 phases with smart transitions
    const immediateSteps = this.generateImmediatePhase(beautyAssessment, productRecommendations)
    const adaptationSteps = this.generateAdaptationPhase(beautyAssessment, productRecommendations, immediateSteps)
    const maintenanceSteps = this.generateMaintenancePhase(beautyAssessment, productRecommendations, adaptationSteps)

    // Combine
    const allSteps = [...immediateSteps, ...adaptationSteps, ...maintenanceSteps]

    console.log('✅ Unified 3-phase routine created:', {
      immediate: immediateSteps.length,
      adaptation: adaptationSteps.length,
      maintenance: maintenanceSteps.length,
      total: allSteps.length
    })

    return allSteps
  }

  /**
   * Generate immediate phase (urgent issues, simple routine)
   */
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

    // Filter empty steps, add visual criteria, and mark as immediate phase
    return this.filterRedundantSteps(steps)
      .map((step) => this.addVisualCriteria(step))
      .map((step) => ({
        ...step,
        phase: 'immediate' as const
      }))
  }

  /**
   * Generate adaptation phase (weeks 2–4, stronger actives)
   */
  private static generateAdaptationPhase(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations,
    immediatePhase: UnifiedRoutineStep[]
  ): UnifiedRoutineStep[] {
    const steps: UnifiedRoutineStep[] = []
    let stepCounter = 1 // CORRECTION: numbering 1,2,3 per phase

    // NEW DERMATOLOGIC LOGIC: smart transition of products

    // 1) Identify durable base from immediate phase
    const baseDurable = this.identifyLongTermBase(immediatePhase)
    console.log(
      '📊 Durable base identified:',
      baseDurable.map((b) => `${b.title} (${b.category})`).join(', ')
    )

    // 2) Evolve the base
    const evolvedBase = this.evolveBaseProducts(baseDurable, beautyAssessment)

    // 3) Add progressive actives per AI diagnosis
    const progressiveActives = this.generateProgressiveActives(beautyAssessment, evolvedBase.length + 1)

    // 4) Combine and order logically (cleansing → treatments → moisturization → protection)
    const allSteps = [...evolvedBase, ...progressiveActives]
    const orderedSteps = this.orderStepsLogically(allSteps)

    // 5) Renumber properly
    const finalSteps = orderedSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))

    steps.push(...finalSteps)

    console.log('✨ Adaptation phase generated:', {
      baseEvolved: evolvedBase.length,
      newActives: progressiveActives.length,
      total: steps.length
    })

    return steps
  }

  /**
   * Generate maintenance phase (optimized routine + weekly care)
   */
  private static generateMaintenancePhase(
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations,
    adaptationPhase: UnifiedRoutineStep[]
  ): UnifiedRoutineStep[] {
    const steps: UnifiedRoutineStep[] = []
    let stepCounter = 1 // CORRECTION: numbering 1,2,3 per phase

    // NEW DERMATOLOGIC LOGIC: continued evolved base + preventive care

    // 1) Transfer & optimize evolved base from adaptation
    const finalBase = this.transferAndOptimizeBase(adaptationPhase)

    // 2) Add preventive/optimization care
    const preventiveCare = this.generatePreventiveCare(beautyAssessment, finalBase.length + 1)

    // 3) Combine and order logically
    const allSteps = [...finalBase, ...preventiveCare]
    const orderedSteps = this.orderStepsLogically(allSteps)

    // 4) Renumber properly
    const finalSteps = orderedSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))

    steps.push(...finalSteps)

    console.log('🏥 Maintenance phase generated:', {
      finalBase: finalBase.length,
      preventiveCare: preventiveCare.length,
      total: steps.length
    })

    return steps
  }

  /**
   * Helper methods to analyze needs
   * (supports French + English keywords to remain compatible)
   */
  private static hasAgingConcerns(beautyAssessment: BeautyAssessment): boolean {
    const agingKeywords = [
      'wrinkles',
      'fine lines',
      'aging',
      'firmness',
      'elasticity'
    ]
    return (
      agingKeywords.some((k) => beautyAssessment.mainConcern?.toLowerCase().includes(k)) ||
      beautyAssessment.zoneSpecific?.some((zone) =>
        zone.problems?.some((problem) => agingKeywords.some((k) => problem.name.toLowerCase().includes(k)))
      ) ||
      false
    )
  }

  private static hasAcneConcerns(beautyAssessment: BeautyAssessment): boolean {
    const acneKeywords = [
      'blemishes',
      'pimples',
      'acne',
      'blackheads',
      'comedones',
      'congestion'
    ]
    return (
      acneKeywords.some((k) => beautyAssessment.mainConcern?.toLowerCase().includes(k)) ||
      beautyAssessment.zoneSpecific?.some((zone) =>
        zone.problems?.some((problem) => acneKeywords.some((k) => problem.name.toLowerCase().includes(k)))
      ) ||
      false
    )
  }

  private static hasPigmentationConcerns(beautyAssessment: BeautyAssessment): boolean {
    const pigmentationKeywords = [
      'spots',
      'pigment',
      'pigmentation',
      'hyperpigmentation',
      'melasma',
      'discoloration',
      'dark spots'
    ]
    return (
      pigmentationKeywords.some((k) => beautyAssessment.mainConcern?.toLowerCase().includes(k)) ||
      beautyAssessment.zoneSpecific?.some((zone) =>
        zone.problems?.some((problem) => pigmentationKeywords.some((k) => problem.name.toLowerCase().includes(k)))
      ) ||
      false
    )
  }

  private static needsExfoliation(beautyAssessment: BeautyAssessment): boolean {
    const exfoliationKeywords = [
      'pores',
      'enlarged-pores',
      'texture',
      'roughness',
      'dullness',
      'glow',
      'radiance'
    ]
    return (
      exfoliationKeywords.some((k) => beautyAssessment.mainConcern?.toLowerCase().includes(k)) ||
      beautyAssessment.zoneSpecific?.some((zone) =>
        zone.problems?.some((problem) => exfoliationKeywords.some((k) => problem.name.toLowerCase().includes(k)))
      ) ||
      false
    )
  }

  /**
   * Filter redundant or low-value steps
   */
  private static filterRedundantSteps(steps: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    const filteredSteps = steps.filter((step) => {
      // Always keep essentials (cleansing, hydration, protection)
      if (['cleansing', 'hydration', 'protection'].includes(step.category)) {
        return true
      }

      // Filter treatment steps without specific products
      if (
        step.treatmentType === 'treatment' &&
        (!step.recommendedProducts || step.recommendedProducts.length === 0)
      ) {
        console.log(`🚫 Step filtered (no specific products): ${step.title}`)
        return false
      }

      // Filter steps with generic/fallback products
      if (step.treatmentType === 'treatment' && step.recommendedProducts.length > 0) {
        const hasGenericProducts = step.recommendedProducts.some((product) => {
          const isGeneric =
            product.name.includes('Soin ciblé adapté') ||
            product.name.includes('Sélection DermAI') ||
            product.brand === 'Sélection DermAI' ||
            !product.catalogId ||
            product.catalogId === 'fallback'
          return isGeneric
        })

        if (hasGenericProducts) {
          console.log(
            `🚫 Step filtered (generic products): ${step.title} - ${step.recommendedProducts
              .map((p) => p.name)
              .join(', ')}`
          )
          return false
        }
      }
      // Keep the rest
      return true
    })

    // Renumber after filtering
    return filteredSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))
  }

  /**
   * Group problems by type from zoneSpecific
   */
  private static groupIssuesByType(beautyAssessment: BeautyAssessment): Map<string, string[]> {
    const grouped = new Map<string, string[]>()

    if (!beautyAssessment.zoneSpecific || !Array.isArray(beautyAssessment.zoneSpecific)) {
      console.log('⚠️ No specific zones found, using fallback')
      // Fallback based on mainConcern
      const mainConcern = beautyAssessment.mainConcern || 'hydratation'
      grouped.set(mainConcern.toLowerCase(), beautyAssessment.concernedZones || [])
      return grouped
    }

    for (const zone of beautyAssessment.zoneSpecific) {
      if (!zone.zone) continue

      // New structure with problems array
      if (Array.isArray(zone.problems)) {
        for (const problem of zone.problems) {
          const issueType = problem.name?.toLowerCase() || 'soin général'
          if (!grouped.has(issueType)) {
            grouped.set(issueType, [])
          }
          grouped.get(issueType)!.push(zone.zone)
        }
      }
      // Fallback for older structure
      else if (Array.isArray((zone as any).concerns)) {
        for (const concern of (zone as any).concerns) {
          const issueType = concern.toLowerCase()
          if (!grouped.has(issueType)) {
            grouped.set(issueType, [])
          }
          grouped.get(issueType)!.push(zone.zone)
        }
      }
      // Last resort
      else {
        const issueType = 'soin ciblé'
        if (!grouped.has(issueType)) {
          grouped.set(issueType, [])
        }
        grouped.get(issueType)!.push(zone.zone)
      }
    }

    console.log(
      '📊 Grouped problems:',
      Array.from(grouped.entries()).map(([type, zones]) => `${type}: ${zones.join(', ')}`)
    )
    return grouped
  }

  /**
   * Create cleansing step (always first)
   */
  private static createCleansingStep(stepNumber: number, beautyAssessment: BeautyAssessment): UnifiedRoutineStep {
    return {
      stepNumber,
      title: 'Nettoyage doux',
      targetArea: 'global',
      recommendedProducts: [
        {
          id: 'B01MSSDEPK',
          name: 'CeraVe Nettoyant Hydratant',
          brand: 'CeraVe',
          category: 'cleanser',
          catalogId: 'B01MSSDEPK'
        }
      ],
      applicationAdvice:
        "Masser délicatement sur tout le visage humide, rincer à l'eau tiède. Éviter le contour des yeux.",
      treatmentType: 'cleansing',
      priority: 10,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'both',
      category: 'cleansing'
    }
  }

  /**
   * Create a targeted treatment step
   */
  private static createTargetedTreatmentStep(
    stepNumber: number,
    issueType: string,
    zones: string[],
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    // Select targeted products by issue type
    const products = this.selectProductsForIssue(issueType, zones, productRecommendations)

    // Smart title
    const title = this.generateStepTitle(issueType, zones)

    // Application tips
    const applicationAdvice = this.generateApplicationAdvice(issueType, zones, products)

    // Restrictions
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

  /**
   * Create global moisturization step
   */
  private static createMoisturizingStep(
    stepNumber: number,
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    return {
      stepNumber,
      title: 'Hydratation globale',
      targetArea: 'global',
      recommendedProducts: [
        {
          id: 'TOLERIANE_SENSITIVE',
          name: 'Tolériane Sensitive',
          brand: 'La Roche-Posay',
          category: 'moisturizer',
          catalogId: 'B00BNUY3HE'
        }
      ],
      applicationAdvice:
        "Appliquer sur l'ensemble du visage en évitant les zones déjà traitées. Masser jusqu'à absorption complète.",
      treatmentType: 'moisturizing',
      priority: 9,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'both',
      category: 'hydration'
    }
  }

  /**
   * Create sun protection step
   */
  private static createSunProtectionStep(
    stepNumber: number,
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    return {
      stepNumber,
      title: 'Protection solaire quotidienne',
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
      applicationAdvice:
        "Appliquer généreusement le matin, 20 minutes avant l'exposition. Renouveler toutes les 2h si exposition prolongée.",
      treatmentType: 'protection',
      priority: 10,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'morning',
      category: 'protection'
    }
  }

  /**
   * Generate step title based on issue type (zones are displayed separately in UI)
   * (Accepts French or English issue tokens)
   */
  private static generateStepTitle(issueType: string, zones: string[]): string {
    const map: Record<string, string> = {
      // fr
      'rougeurs': 'Traitement des rougeurs',
      'poils incarnés': 'Traitement des poils incarnés',
      'imperfections': 'Traitement des imperfections',
      'hyperpigmentation': 'Traitement des taches pigmentaires',
      'taches pigmentaires': 'Traitement des taches pigmentaires',
      'pores dilatés': 'Resserrement des pores',
      'déshydratation': 'Hydratation ciblée',
      'rides': "Traitement anti-âge",
      'points noirs': 'Désobstruction des pores',
      // en
      'redness': 'Traitement des rougeurs',
      'ingrown hairs': 'Traitement des poils incarnés',
      'blemishes': 'Traitement des imperfections',
      'acne': 'Traitement des imperfections',
      'pigmentation': 'Traitement des taches pigmentaires',
      'dark spots': 'Traitement des taches pigmentaires',
      'enlarged pores': 'Resserrement des pores',
      'dehydration': 'Hydratation ciblée',
      'wrinkles': "Traitement anti-âge",
      'blackheads': 'Désobstruction des pores'
    }

    return map[issueType.toLowerCase()] || `Traitement ${issueType}`
  }

  /**
   * Select appropriate products for an issue type
   */
  private static selectProductsForIssue(
    issueType: string,
    zones: string[],
    productRecommendations: ProductRecommendations
  ): RecommendedProduct[] {
    const productMapping: Record<string, RecommendedProduct> = {
      // fr
      'rougeurs': {
        id: 'B000O7PH34',
        name: 'Avène Thermal Spring Water',
        brand: 'Avène',
        category: 'treatment',
        catalogId: 'B000O7PH34'
      },
      'poils incarnés': {
        id: 'B00BNUY3HE',
        name: 'La Roche-Posay Cicaplast Baume B5',
        brand: 'La Roche-Posay',
        category: 'treatment',
        catalogId: 'B00BNUY3HE'
      },
      'imperfections': {
        id: 'B01MDTVZTZ',
        name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        category: 'serum',
        catalogId: 'B01MDTVZTZ'
      },
      'pores dilatés': {
        id: 'B01MDTVZTZ',
        name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        category: 'serum',
        catalogId: 'B01MDTVZTZ'
      },
      'points noirs': {
        id: 'B00949CTQQ',
        name: "Paula's Choice SKIN PERFECTING 2% BHA",
        brand: "Paula's Choice",
        category: 'exfoliant',
        catalogId: 'B00949CTQQ'
      },
      // en aliases
      'redness': {
        id: 'B000O7PH34',
        name: 'Avène Thermal Spring Water',
        brand: 'Avène',
        category: 'treatment',
        catalogId: 'B000O7PH34'
      },
      'ingrown hairs': {
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
      'enlarged pores': {
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
            name: 'Soin ciblé adapté',
            brand: 'Sélection DermAI',
            category: 'treatment',
            catalogId: 'B01MSSDEPK'
          }
        ]
  }

  /**
   * Generate application tips by issue
   */
  private static generateApplicationAdvice(
    issueType: string,
    zones: string[],
    products: RecommendedProduct[]
  ): string {
    const zoneText =
      zones.length === 1
        ? `sur le ${zones[0]}`
        : zones.length > 1
        ? `sur les zones : ${zones.join(', ')}`
        : 'sur les zones concernées'

    const adviceMapping: Record<string, string> = {
      // fr
      'rougeurs': `Vaporiser délicatement ${zoneText}, tapoter sans frotter. Laisser sécher naturellement.`,
      'poils incarnés': `Appliquer en fine couche ${zoneText} après rasage. Éviter massage agressif.`,
      'imperfections': `Appliquer 2-3 gouttes ${zoneText} le soir uniquement. Commencer par une application tous les 2 jours.`,
      'pores dilatés': `Appliquer sur peau propre ${zoneText}. Utiliser le soir, commencer progressivement.`,
      'points noirs': `Appliquer avec un coton-tige ${zoneText}. 2-3 fois par semaine maximum.`,
      // en
      'redness': `Vaporiser délicatement ${zoneText}, tapoter sans frotter. Laisser sécher naturellement.`,
      'ingrown hairs': `Appliquer en fine couche ${zoneText} après rasage. Éviter massage agressif.`,
      'blemishes': `Appliquer 2-3 gouttes ${zoneText} le soir uniquement. Commencer tous les 2 jours.`,
      'enlarged pores': `Appliquer sur peau propre ${zoneText}, le soir, progressivement.`,
      'blackheads': `Appliquer avec un coton ${zoneText}, 2-3 fois/semaine max, le soir.`
    }

    return (
      adviceMapping[issueType.toLowerCase()] ||
      `Appliquer selon les instructions du produit ${zoneText}. Surveiller la tolérance cutanée.`
    )
  }

  /**
   * Generate restrictions by issue
   */
  private static generateRestrictions(issueType: string, beautyAssessment: BeautyAssessment): string[] | undefined {
    const restrictionsMapping: Record<string, string[]> = {
      // fr
      'rougeurs': ["Éviter AHA/BHA et rétinoïdes jusqu'à amélioration", "Pas d'exfoliation mécanique sur zones irritées"],
      'poils incarnés': ['Éviter rasage à sec', 'Préférer tondeuse ou rasage avec mousse', "Pas d'exfoliation agressive"],
      'imperfections': [
        'Commencer progressivement (tous les 2 jours)',
        'Utiliser protection solaire obligatoire',
        "Éviter association avec rétinoïdes au début"
      ],
      // en aliases
      'redness': ["Éviter AHA/BHA et rétinoïdes jusqu'à amélioration", "Pas d'exfoliation mécanique sur zones irritées"],
      'ingrown hairs': ['Éviter rasage à sec', 'Préférer tondeuse ou rasage avec mousse', "Pas d'exfoliation agressive"],
      'blemishes': [
        'Commencer progressivement (tous les 2 jours)',
        'Utiliser protection solaire obligatoire',
        "Éviter association avec rétinoïdes au début"
      ]
    }

    return restrictionsMapping[issueType.toLowerCase()]
  }

  /**
   * Priority by issue
   */
  private static calculatePriority(issueType: string): number {
    const priorityMapping: Record<string, number> = {
      // fr + en
      'rougeurs': 8,
      'redness': 8,
      'poils incarnés': 7,
      'ingrown hairs': 7,
      'imperfections': 6,
      'blemishes': 6,
      'pores dilatés': 5,
      'enlarged pores': 5,
      'points noirs': 4,
      'blackheads': 4,
      'rides': 3,
      'wrinkles': 3
    }

    return priorityMapping[issueType.toLowerCase()] || 5
  }

  /**
   * Include sun protection?
   */
  private static includesSunProtection(_beautyAssessment: BeautyAssessment): boolean {
    // Always include sun protection (except very specific cases)
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
          issues: [beautyAssessment.mainConcern || 'hydratation'],
          zones: beautyAssessment.concernedZones || [],
          catalogId: 'B01MSSDEPK', // default CeraVe
          priority: 5
        }
      ]
    }

    // 1) Extract all problems with zones
    const allProblems: { issue: string; zone: string; intensity: string }[] = []

    for (const zoneData of beautyAssessment.zoneSpecific) {
      if (!zoneData.zone) continue

      if (Array.isArray(zoneData.problems)) {
        for (const problem of zoneData.problems) {
          allProblems.push({
            issue: problem.name?.toLowerCase() || 'soin général',
            zone: zoneData.zone,
            intensity: problem.intensity || 'modérée'
          })
        }
      }
    }

    console.log('🔍 Extracted problems:', allProblems)

    // 2) Group by recommended product (same catalogId)
    const productGroups = new Map<
      string,
      { issues: string[]; zones: string[]; priority: number; intensity: string }
    >()

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

    // 3) Convert to OptimizedTreatment sorted by priority
    const treatments: OptimizedTreatment[] = Array.from(productGroups.entries())
      .map(([catalogId, data]) => ({
        issues: data.issues,
        zones: data.zones,
        catalogId,
        priority: data.priority
      }))
      .sort((a, b) => b.priority - a.priority)

    console.log(
      '✅ Treatments grouped by product:',
      treatments.map((t) => `${t.catalogId}: ${t.issues.join(' + ')} (zones: ${t.zones.join(', ')})`)
    )

    return treatments
  }

  /**
   * Get catalogId for issue type (supports fr + en)
   */
  private static getProductIdForIssue(issueType: string): string {
    const map: Record<string, string> = {
      // fr
      'rougeurs': 'B000O7PH34',
      'poils incarnés': 'B00BNUY3HE',
      'imperfections': 'B01MDTVZTZ',
      'taches pigmentaires': 'B01MDTVZTZ',
      'hyperpigmentation': 'B01MDTVZTZ',
      'pores dilatés': 'B01MDTVZTZ',
      'points noirs': 'B00949CTQQ',
      'comédons': 'B00949CTQQ',
      'rides': 'B01MSSDEPK',
      "rides d'expression": 'B01MSSDEPK',
      'déshydratation': 'B01MSSDEPK',
      // en
      'redness': 'B000O7PH34',
      'ingrown hairs': 'B00BNUY3HE',
      'blemishes': 'B01MDTVZTZ',
      'pigmentation': 'B01MDTVZTZ',
      'dark spots': 'B01MDTVZTZ',
      'enlarged pores': 'B01MDTVZTZ',
      'blackheads': 'B00949CTQQ',
      'comedones': 'B00949CTQQ',
      'wrinkles': 'B01MSSDEPK',
      'dehydration': 'B01MSSDEPK'
    }

    return map[issueType.toLowerCase()] || 'B01MSSDEPK'
  }

  /**
   * Create optimized grouped treatment step
   */
  private static createOptimizedTreatmentStep(
    stepNumber: number,
    treatment: OptimizedTreatment,
    beautyAssessment: BeautyAssessment,
    productRecommendations: ProductRecommendations
  ): UnifiedRoutineStep {
    // Smart title for grouped treatment
    const title = this.generateOptimizedStepTitle(treatment.issues, treatment.zones)

    // Select product by catalogId
    const product = this.getProductByCatalogId(treatment.catalogId)

    // Application tips
    const applicationAdvice = this.generateGroupedApplicationAdvice(treatment)

    // Restrictions
    const restrictions = this.generateGroupedRestrictions(treatment.issues, beautyAssessment)

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

  /**
   * Smart title for grouped treatment (zones displayed separately in UI)
   */
  private static generateOptimizedStepTitle(issues: string[], zones: string[]): string {
    const labels: Record<string, string> = {
      // fr
      'rougeurs': 'rougeurs',
      'poils incarnés': 'poils incarnés',
      'imperfections': 'imperfections',
      'taches pigmentaires': 'taches pigmentaires',
      'hyperpigmentation': 'taches pigmentaires',
      'pores dilatés': 'pores dilatés',
      'points noirs': 'points noirs',
      'comédons': 'points noirs',
      'rides': 'rides',
      "rides d'expression": "rides d'expression",
      // en
      'redness': 'rougeurs',
      'ingrown hairs': 'poils incarnés',
      'blemishes': 'imperfections',
      'pigmentation': 'taches pigmentaires',
      'dark spots': 'taches pigmentaires',
      'enlarged pores': 'pores dilatés',
      'blackheads': 'points noirs',
      'wrinkles': 'rides'
    }

    const friendlyIssues = issues
      .map((issue) => labels[issue.toLowerCase()] || issue)
      .filter((v, i, arr) => arr.indexOf(v) === i)

    let issuesText = ''
    if (friendlyIssues.length === 1) issuesText = `Traitement des ${friendlyIssues[0]}`
    else if (friendlyIssues.length === 2) issuesText = `Traitement des ${friendlyIssues[0]} et ${friendlyIssues[1]}`
    else issuesText = `Traitement des ${friendlyIssues.slice(0, -1).join(', ')} et ${friendlyIssues[friendlyIssues.length - 1]}`

    return issuesText
  }

  /**
   * Get product by catalogId
   */
  private static getProductByCatalogId(catalogId: string): RecommendedProduct {
    const map: Record<string, RecommendedProduct> = {
      'B000O7PH34': {
        id: 'B000O7PH34',
        name: 'Avène Thermal Spring Water',
        brand: 'Avène',
        category: 'treatment',
        catalogId: 'B000O7PH34'
      },
      'B00BNUY3HE': {
        id: 'B00BNUY3HE',
        name: 'La Roche-Posay Cicaplast Baume B5',
        brand: 'La Roche-Posay',
        category: 'treatment',
        catalogId: 'B00BNUY3HE'
      },
      'B01MDTVZTZ': {
        id: 'B01MDTVZTZ',
        name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        category: 'serum',
        catalogId: 'B01MDTVZTZ'
      },
      'B00949CTQQ': {
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
        name: 'Soin ciblé adapté',
        brand: 'Sélection DermAI',
        category: 'treatment',
        catalogId: 'B01MSSDEPK'
      }
    )
  }

  /**
   * Grouped treatment – application tips
   */
  private static generateGroupedApplicationAdvice(treatment: OptimizedTreatment): string {
    const zoneText =
      treatment.zones.length === 1
        ? `sur le ${treatment.zones[0]}`
        : `sur les zones concernées : ${treatment.zones.join(', ')}`

    const catalogId = treatment.catalogId

    if (catalogId === 'B000O7PH34') return `Vaporiser délicatement ${zoneText}, tapoter sans frotter. Laisser sécher.`
    if (catalogId === 'B00BNUY3HE')
      return `Appliquer en fine couche ${zoneText}. Masser très délicatement jusqu'à absorption.`
    if (catalogId === 'B01MDTVZTZ')
      return `Appliquer 2-3 gouttes ${zoneText} le soir uniquement. Commencer progressivement (tous les 2 jours).`
    if (catalogId === 'B00949CTQQ')
      return `Appliquer avec un coton ${zoneText}. 2-3 fois par semaine max, toujours le soir.`

    return `Appliquer selon les instructions du produit ${zoneText}. Surveiller la tolérance cutanée.`
  }

  /**
   * Grouped treatment – restrictions
   * (supports fr + en tokens)
   */
  private static generateGroupedRestrictions(
    issues: string[],
    beautyAssessment: BeautyAssessment
  ): string[] | undefined {
    const restrictions = new Set<string>()

    for (const issue of issues) {
      const s = issue.toLowerCase()

      if (s.includes('rougeur') || s.includes('irritat') || s.includes('redness') || s.includes('irritat')) {
        restrictions.add("Éviter AHA/BHA et rétinoïdes jusqu'à amélioration")
        restrictions.add("Pas d'exfoliation mécanique sur zones irritées")
      }

      if (s.includes('poils incarnés') || s.includes('ingrown')) {
        restrictions.add('Éviter rasage à sec')
        restrictions.add('Préférer tondeuse ou rasage avec mousse')
      }

      if (s.includes('imperfection') || s.includes('tache') || s.includes('blemish') || s.includes('spot')) {
        restrictions.add('Utiliser protection solaire obligatoire')
        restrictions.add('Commencer progressivement (tous les 2 jours)')
      }
    }

    return restrictions.size > 0 ? Array.from(restrictions) : undefined
  }

  /**
   * NEW LOGIC: Identify durable base in immediate phase
   */
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
        productBrand: step.recommendedProducts[0]?.brand || 'Sélection DermAI',
        canBeMaintainedMonths: true,
        isTemporaryTreatment: false,
        frequency: step.frequency,
        category: step.category,
        phase: step.phase
      }))

    console.log(
      '📊 Final durable base:',
      longTermBase.map((b) => `${b.title} - ${b.productName} (${b.catalogId})`).join(', ')
    )
    return longTermBase
  }

  /**
   * Determine if a treatment is temporary
   */
  private static isTemporaryTreatment(step: UnifiedRoutineStep): boolean {
    const keywords = [
      // fr
      'poils incarnés',
      'cicatrisation',
      'réparation barriere',
      'inflammation',
      'irritation aigu',
      'urgence',
      // en
      'ingrown hairs',
      'healing',
      'barrier repair',
      'inflammation',
      'acute irritation',
      'emergency'
    ]

    const t = `${step.title} ${step.applicationAdvice}`.toLowerCase()
    return keywords.some((k) => t.includes(k))
  }

  /**
   * Evolve base products based on AI needs
   * (keeps French UX strings like “En continu”, “Quotidien” for UI compatibility)
   */
  private static evolveBaseProducts(
    baseDurable: LongTermBaseProduct[],
    beautyAssessment: BeautyAssessment
  ): UnifiedRoutineStep[] {
    const originalProductMapping: Record<string, RecommendedProduct> = {
      B01MSSDEPK: {
        id: 'B01MSSDEPK',
        name: 'CeraVe Nettoyant Hydratant',
        brand: 'CeraVe',
        category: 'cleanser',
        catalogId: 'B01MSSDEPK'
      },
      B00BNUY3HE: {
        id: 'B00BNUY3HE',
        name: 'Tolériane Sensitive',
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

    return baseDurable.map((baseProduct, index) => {
      const newStepNumber = index + 1

      if (baseProduct.category === 'hydration') {
        if (this.needsReinforcedHydration(beautyAssessment)) {
          return {
            stepNumber: newStepNumber,
            title: baseProduct.title.replace('globale', 'renforcée'),
            targetArea: 'global' as const,
            recommendedProducts: this.getReinforcedHydrationProducts(),
            applicationAdvice:
              "Appliquer généreusement pour contrebalancer l'introduction des actifs plus forts.",
            treatmentType: 'moisturizing' as const,
            priority: 9,
            phase: 'adaptation' as const,
            frequency: 'daily' as const,
            timeOfDay: 'both' as const,
            category: 'hydration' as const,
            // UX fields (French strings kept intentionally)
            applicationDuration: 'En continu',
            timingBadge: 'Quotidien ☀️🌙',
            timingDetails: 'Matin et soir'
          }
        }
      }

      if (baseProduct.category === 'protection') {
        if (this.hasProgressiveActives(beautyAssessment) || this.hasHighExposure(beautyAssessment)) {
          return {
            stepNumber: newStepNumber,
            title: 'Protection solaire renforcée',
            targetArea: 'global' as const,
            recommendedProducts: this.getHigherSPFProducts(),
            applicationAdvice:
              "Application quotidienne indispensable avec actifs. Renouveler toutes les 2h si exposition.",
            treatmentType: 'protection' as const,
            priority: 10,
            phase: 'adaptation' as const,
            frequency: 'daily' as const,
            timeOfDay: 'morning' as const,
            category: 'protection' as const,
            // UX fields (French)
            applicationDuration: 'En continu',
            timingBadge: 'Quotidien ☀️',
            timingDetails: 'Matin uniquement'
          }
        }
      }

      const originalProduct =
        originalProductMapping[baseProduct.catalogId] || ({
          id: baseProduct.catalogId,
          name: baseProduct.productName,
          brand: baseProduct.productBrand,
          category: baseProduct.category,
          catalogId: baseProduct.catalogId
        } as RecommendedProduct)

      return {
        stepNumber: newStepNumber,
        title: baseProduct.title,
        targetArea: 'global' as const,
        recommendedProducts: [originalProduct],
        applicationAdvice:
          'Routine maintenant établie. Continuer l’application selon les instructions précédentes.',
        treatmentType: this.mapCategoryToTreatmentType(baseProduct.category),
        priority: 9,
        phase: 'adaptation' as const,
        frequency: baseProduct.frequency as any,
        timeOfDay: 'both' as const,
        category: baseProduct.category as any,
        // UX fields (French)
        applicationDuration: 'En continu',
        timingBadge: 'Quotidien ☀️🌙',
        timingDetails: 'Matin et soir'
      }
    })
  }

  /**
   * Progressive actives per diagnosis
   */
  private static generateProgressiveActives(
    beautyAssessment: BeautyAssessment,
    stepCounter: number
  ): UnifiedRoutineStep[] {
    const actives: UnifiedRoutineStep[] = []

    const hasAging = this.hasAgingConcerns(beautyAssessment)
    const hasAcne = this.hasAcneConcerns(beautyAssessment)
    const hasPigmentation = this.hasPigmentationConcerns(beautyAssessment)

    if (hasAging) {
      actives.push({
        stepNumber: stepCounter++,
        title: 'Sérum anti-âge progressif',
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
        applicationAdvice:
          'Commencer 1 soir sur 3, puis augmenter selon tolérance. Appliquer sur peau sèche.',
        restrictions: ['Protection solaire obligatoire le lendemain', 'Commencer très progressivement'],
        treatmentType: 'treatment',
        priority: 8,
        phase: 'adaptation',
        frequency: 'progressive',
        timeOfDay: 'evening',
        category: 'treatment',
        startAfterDays: 14,
        frequencyDetails: '1x tous les 3 soirs, puis augmenter',
        // UX
        applicationDuration: 'Introduction progressive selon tolérance',
        timingBadge: 'Progressif 📈',
        timingDetails: '1x tous les 3 soirs, puis augmenter'
      })
    }

    if (hasAcne || hasPigmentation) {
      actives.push({
        stepNumber: stepCounter++,
        title: 'Traitement actif ciblé (Niacinamide)',
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
        applicationAdvice: '2-3 gouttes le soir uniquement sur zones concernées.',
        treatmentType: 'treatment',
        priority: 7,
        phase: 'adaptation',
        frequency: 'daily',
        timeOfDay: 'evening',
        category: 'treatment',
        startAfterDays: 14,
        // UX
        applicationDuration: 'En continu pour maintenir les résultats',
        timingBadge: 'Quotidien 🌙',
        timingDetails: 'Soir uniquement'
      })
    }

    return actives
  }

  /**
   * Add visual criteria AND timing/duration fields
   * (French strings kept for UI compatibility)
   */
  private static addVisualCriteria(step: UnifiedRoutineStep): UnifiedRoutineStep {
    const visualCriteria = this.getVisualCriteriaForTreatment(step.title)
    const timingInfo = this.generateTimingBadge(step)

    return {
      ...step,
      applicationDuration: this.generateApplicationDuration(step, visualCriteria),
      timingBadge: timingInfo.badge,
      timingDetails: timingInfo.details
    }
  }

  /**
   * Visual criteria by treatment (supports fr titles)
   */
  private static getVisualCriteriaForTreatment(title: string): VisualCriteria | null {
    const criteriaMapping: Record<string, VisualCriteria> = {
      'poils incarnés': {
        goal: 'disparition des inflammations',
        observation: 'Vérifier absence de rougeurs et gonflements',
        estimatedDays: '1-2 semaines',
        nextStep: 'Continuer prévention rasage puis phase suivante'
      },
      'imperfections': {
        goal: 'réduction visible des lésions',
        observation: 'Compter diminution nombre boutons actifs',
        estimatedDays: '2-3 semaines',
        nextStep: 'Introduire prévention récidive'
      },
      'rougeurs': {
        goal: 'apaisement et uniformisation',
        observation: 'Teint plus homogène, moins de réactivité',
        estimatedDays: '1-2 semaines',
        nextStep: 'Renforcer barrière cutanée'
      },
      'cicatrisation': {
        goal: 'fermeture complète plaies',
        observation: 'Peau lisse, couleur normalisée',
        estimatedDays: '1-3 semaines',
        nextStep: 'Prévention cicatrices'
      }
    }

    const lower = title.toLowerCase()
    for (const [k, v] of Object.entries(criteriaMapping)) {
      if (lower.includes(k)) return v
    }
    return null
  }

  /**
   * Need reinforced hydration?
   */
  private static needsReinforcedHydration(beautyAssessment: BeautyAssessment): boolean {
    const s = beautyAssessment.mainConcern?.toLowerCase() || ''
    return (
      s.includes('sécheresse') ||
      s.includes('déshydratation') ||
      s.includes('dehydration') ||
      beautyAssessment.zoneSpecific?.some((zone) =>
        zone.problems?.some((p) => p.name.toLowerCase().includes('sécheresse') || p.name.toLowerCase().includes('dehydration'))
      ) ||
      false
    )
  }

  private static hasProgressiveActives(beautyAssessment: BeautyAssessment): boolean {
    return this.hasAgingConcerns(beautyAssessment) || this.hasAcneConcerns(beautyAssessment)
  }

  private static hasHighExposure(beautyAssessment: BeautyAssessment): boolean {
    const s = beautyAssessment.mainConcern?.toLowerCase() || ''
    return s.includes('tache') || s.includes('pigment') || s.includes('photoaging') || s.includes('photovieillissement')
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

  /**
   * Order steps by dermatologic logic
   */
  private static orderStepsLogically(steps: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    const categoryOrder = {
      cleansing: 1,
      treatment: 2,
      hydration: 3,
      protection: 4
    }

    return steps.sort((a, b) => {
      const orderA = (categoryOrder as any)[a.category] || 5
      const orderB = (categoryOrder as any)[b.category] || 5

      if (orderA !== orderB) return orderA - orderB
      // If same category, sort by priority desc
      return b.priority - a.priority
    })
  }

  /**
   * Transfer & optimize base from adaptation to maintenance
   */
  private static transferAndOptimizeBase(adaptationPhase: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    console.log(
      '🔄 Transferring adaptation base to maintenance:',
      adaptationPhase.map((s) => `${s.stepNumber}. ${s.title}`).join(', ')
    )

    const baseProducts = adaptationPhase.filter(
      (step) => step.frequency === 'daily' && ['cleansing', 'hydration', 'protection'].includes(step.category)
    )

    console.log('🏠 Base to transfer:', baseProducts.map((s) => s.title).join(', '))

    // Optimize for maintenance (same efficacy, smoother gesture)
    return baseProducts.map((step) => ({
      ...step,
      phase: 'maintenance' as const,
      title: step.title.includes('renforcé') || step.title.toLowerCase().includes('reinforc')
        ? step.title
        : `${step.title} optimisée`,
      applicationAdvice: `Routine établie et maîtrisée. ${step.applicationAdvice.replace(
        'Routine maintenant établie. ',
        ''
      )}`
    }))
  }

  /**
   * Preventive care for long-term needs
   */
  private static generatePreventiveCare(
    beautyAssessment: BeautyAssessment,
    stepCounter: number
  ): UnifiedRoutineStep[] {
    const preventiveCare: UnifiedRoutineStep[] = []

    if (this.needsExfoliation(beautyAssessment)) {
      preventiveCare.push({
        stepNumber: stepCounter++,
        title: 'Exfoliation préventive',
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
        applicationAdvice:
          "Appliquer pour maintenir le renouvellement cellulaire et prévenir l'accumulation de cellules mortes.",
        restrictions: ['Ne pas combiner avec rétinol le même soir', 'Protection solaire indispensable'],
        treatmentType: 'treatment',
        priority: 6,
        phase: 'maintenance',
        frequency: 'weekly',
        timeOfDay: 'evening',
        category: 'exfoliation',
        startAfterDays: 42,
        frequencyDetails: '1x/semaine, soir sans rétinol',
        // UX (French)
        applicationDuration: 'Entretien hebdomadaire',
        timingBadge: 'Hebdomadaire 🌙',
        timingDetails: '1x/semaine, soir sans rétinol'
      })
    }

    const mainConcern = beautyAssessment.mainConcern?.toLowerCase() || ''

    if (mainConcern.includes('tache') || mainConcern.includes('pigment') || mainConcern.includes('spot')) {
      preventiveCare.push({
        stepNumber: stepCounter++,
        title: 'Prévention taches pigmentaires',
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
        applicationAdvice:
          "Application continue pour maintenir l'uniformité du teint et prévenir nouvelles taches.",
        treatmentType: 'treatment',
        priority: 7,
        phase: 'maintenance',
        frequency: 'daily',
        timeOfDay: 'evening',
        category: 'treatment',
        // UX
        applicationDuration: 'En continu pour prévention',
        timingBadge: 'Quotidien 🌙',
        timingDetails: 'Soir uniquement'
      })
    }

    if (mainConcern.includes('ride') || mainConcern.includes('âge') || mainConcern.includes('wrinkle')) {
      preventiveCare.push({
        stepNumber: stepCounter++,
        title: 'Prévention vieillissement',
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
        applicationAdvice:
          'Maintenir 3-4 applications par semaine pour prévenir nouveaux signes de vieillissement.',
        restrictions: ['Protection solaire obligatoire'],
        treatmentType: 'treatment',
        priority: 8,
        phase: 'maintenance',
        frequency: 'weekly',
        timeOfDay: 'evening',
        category: 'treatment',
        frequencyDetails: '3-4x/semaine',
        // UX
        applicationDuration: 'En continu pour prévention',
        timingBadge: 'Varié ⚡',
        timingDetails: '3-4x/semaine'
      })
    }

    return preventiveCare
  }

  /**
   * Generate application duration string
   * (kept in French to match UI logic)
   */
  private static generateApplicationDuration(
    step: UnifiedRoutineStep,
    visualCriteria: VisualCriteria | null
  ): string {
    if (visualCriteria) {
      return `Jusqu'à ${visualCriteria.observation.toLowerCase()} (${visualCriteria.estimatedDays})`
    }

    if (['cleansing', 'hydration', 'protection'].includes(step.category)) {
      return 'En continu'
    }

    if (step.frequency === 'weekly') {
      return 'Entretien hebdomadaire'
    }

    if (step.frequency === 'progressive') {
      return 'Introduction progressive selon tolérance'
    }

    return 'Selon besoin'
  }

  /**
   * Generate timing badge (kept in French for UI)
   */
  private static generateTimingBadge(step: UnifiedRoutineStep): TimingBadgeResult {
    const { frequency, timeOfDay, frequencyDetails } = step

    const icons = {
      morning: '☀️',
      evening: '🌙',
      both: '☀️🌙'
    }

    if (frequency === 'daily') {
      const icon = (icons as any)[timeOfDay] || ''
      return {
        badge: `Quotidien ${icon}`,
        details:
          timeOfDay === 'evening' ? 'Soir uniquement' : timeOfDay === 'morning' ? 'Matin uniquement' : 'Matin et soir'
      }
    }

    if (frequency === 'weekly') {
      const icon = (icons as any)[timeOfDay] || '🌙'
      let details = '1x/semaine'
      if (step.title.toLowerCase().includes('exfoliation')) {
        details = '1x/semaine, soir sans rétinol'
      } else if (frequencyDetails) {
        details = frequencyDetails
      }
      return { badge: `Hebdomadaire ${icon}`, details }
    }

    if (frequency === 'progressive') {
      return {
        badge: 'Progressif 📈',
        details: frequencyDetails || 'Commencer 1x tous les 3 jours, puis augmenter'
      }
    }

    if (frequency === 'as-needed') {
      return { badge: 'Au besoin 🎯', details: 'Selon apparition des problèmes' }
    }

    return { badge: 'Varié ⚡', details: frequencyDetails || 'Fréquence variable' }
  }
}

// Optimized treatment interface
interface OptimizedTreatment {
  issues: string[]
  zones: string[]
  catalogId: string
  priority: number
}

// Durable base interface
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

// Visual criteria interface
interface VisualCriteria {
  goal: string
  observation: string
  estimatedDays: string
  nextStep: string
}

// Timing badge interface
interface TimingBadgeResult {
  badge: string
  details?: string
}
