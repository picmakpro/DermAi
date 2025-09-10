/**
 * V2 to Legacy UI Adapters
 * Maps V2 pipeline outputs to exact Legacy UI shapes without modifying @/types
 */

import type {
  SkinScores,
  ScoreDetail,
  BeautyAssessment,
  ProductRecommendations,
  NewRoutineStructure,
  NewRoutineStep,
  LocalizedRoutineStep,
  LocalizedStep,
  UnifiedRoutineStep,
  RecommendedProduct,
  ZoneSpecificIssue,
  SkinSpecificity,
  SkinAnalysis
} from '@/types'
import type {
  VisionOutputV2T,
  RoutineBlueprintV2T,
  ProductSelectionV2T
} from './schemas'
import type { FrequencyCanonical, TimeOfDayCanonical } from '@/constants/canonicals'

// ============================================================================
// TYPE ALIASES FOR LEGACY SHAPES
// ============================================================================

type ExistingVisionShape = {
  scores: SkinScores
  beautyAssessment: BeautyAssessment
}

type ExistingRoutineShape = {
  routine: NewRoutineStructure
  localizedRoutine: LocalizedRoutineStep[]
  unifiedRoutine: UnifiedRoutineStep[]
}

type ExistingProductsShape = {
  products: string[]
  productsDetailed: RecommendedProductCard[]
  overview: string
  zoneSpecificCare: string
  restrictions: string
}

type RecommendedProductCard = {
  name: string
  brand: string
  price: number
  imageUrl: string
  affiliateLink: string
  frequency: 'Quotidien' | 'Hebdomadaire' | 'Ponctuel'
  benefits: string[]
  badges?: string[]
}

// ============================================================================
// VISION ADAPTER
// ============================================================================

/**
 * Maps V2 Vision Output to existing vision shape expected by UI
 */
export function toExistingVisionShape(v2: VisionOutputV2T): ExistingVisionShape {
  const scores = mapV2ScoresToLegacy(v2.aggregated.scores)
  const beautyAssessment = mapV2BeautyAssessmentToLegacy(v2.aggregated)

  return {
    scores,
    beautyAssessment
  }
}

/**
 * Maps V2 aggregated scores to legacy SkinScores format
 */
function mapV2ScoresToLegacy(v2Scores: VisionOutputV2T['aggregated']['scores']): SkinScores {
  // Map V2 score names to legacy score names
  const scoreMapping: Record<string, keyof SkinScores> = {
    hydration: 'hydration',
    oiliness: 'pores', // Map oiliness to pores in legacy
    pores: 'pores',
    texture: 'firmness', // Map texture to firmness in legacy
    redness: 'spots', // Map redness to spots in legacy
    pigmentation: 'spots',
    wrinkles_fine_lines: 'wrinkles',
    sensitivity: 'darkCircles' // Map sensitivity to darkCircles in legacy
  }

  const scores: Partial<SkinScores> = {}

  // Map each V2 score to legacy format
  for (const [v2Key, legacyKey] of Object.entries(scoreMapping)) {
    const value = v2Scores[v2Key as keyof typeof v2Scores]
    if (value !== undefined) {
      (scores as any)[legacyKey] = {
        value,
        justification: `Based on ${v2Key} analysis`,
        confidence: 0.8, // Default confidence
        basedOn: [`${v2Key} assessment`]
      }
    }
  }

  // Calculate overall score as average
  const scoreValues = Object.values(scores).map(s => (s as ScoreDetail).value)
  const overall = scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : 0

  return {
    hydration: scores.hydration || createDefaultScoreDetail('hydration'),
    wrinkles: scores.wrinkles || createDefaultScoreDetail('wrinkles'),
    firmness: scores.firmness || createDefaultScoreDetail('firmness'),
    radiance: scores.radiance || createDefaultScoreDetail('radiance'),
    pores: scores.pores || createDefaultScoreDetail('pores'),
    spots: scores.spots || createDefaultScoreDetail('spots'),
    darkCircles: scores.darkCircles || createDefaultScoreDetail('darkCircles'),
    skinAge: scores.skinAge || createDefaultScoreDetail('skinAge'),
    overall
  }
}

/**
 * Maps V2 aggregated data to legacy BeautyAssessment format
 */
function mapV2BeautyAssessmentToLegacy(v2Aggregated: VisionOutputV2T['aggregated']): BeautyAssessment {
  // Extract main concern from concerns array
  const mainConcern = v2Aggregated.concerns.length > 0 ? v2Aggregated.concerns[0].type : 'general care'
  const intensity = v2Aggregated.concerns.length > 0 ? v2Aggregated.concerns[0].intensity : 'mild'
  
  // Extract concerned zones
  const concernedZones = v2Aggregated.concerns.flatMap(c => c.zones)
  
  // Map global findings to visual findings
  const visualFindings = v2Aggregated.globalFindings.map(f => `${f.finding} (${f.zone})`)
  
  // Map concerns to specificities
  const specificities: SkinSpecificity[] = v2Aggregated.concerns.map(concern => ({
    name: concern.type,
    intensity: concern.intensity,
    zones: concern.zones
  }))

  // Map global findings to zone-specific issues
  const zoneSpecific: ZoneSpecificIssue[] = v2Aggregated.globalFindings.map(finding => ({
    zone: finding.zone,
    problems: [{
      name: finding.finding,
      intensity: 'mild', // Default intensity
      description: finding.evidence
    }],
    description: finding.evidence
  }))

  return {
    skinType: 'combination', // Default skin type
    mainConcern,
    intensity,
    concernedZones: [...new Set(concernedZones)], // Remove duplicates
    specificities,
    visualFindings,
    expectedImprovement: 'Visible improvement expected with proper care routine',
    improvementTimeEstimate: '2-4 weeks',
    overview: visualFindings.slice(0, 3), // First 3 findings as overview
    zoneSpecific
  }
}

/**
 * Creates a default ScoreDetail for missing scores
 */
function createDefaultScoreDetail(scoreName: string): ScoreDetail {
  return {
    value: 50,
    justification: `Default ${scoreName} score`,
    confidence: 0.5,
    basedOn: ['Default assessment']
  }
}

// ============================================================================
// ROUTINE ADAPTER
// ============================================================================

/**
 * Maps V2 Routine Blueprint to existing routine shape expected by UI
 */
export function toExistingRoutineShape(v2: RoutineBlueprintV2T): ExistingRoutineShape {
  const routine = mapV2RoutineToLegacy(v2)
  const localizedRoutine = mapV2LocalizedRoutineToLegacy(v2)
  const unifiedRoutine = mapV2UnifiedRoutineToLegacy(v2)

  return {
    routine,
    localizedRoutine,
    unifiedRoutine
  }
}

/**
 * Maps V2 routine phases to legacy NewRoutineStructure
 */
function mapV2RoutineToLegacy(v2: RoutineBlueprintV2T): NewRoutineStructure {
  return {
    immediate: mapV2PhaseToLegacySteps(v2.phaseImmediate, 'immediate'),
    adaptation: mapV2PhaseToLegacySteps(v2.phaseAdaptation, 'adaptation'),
    maintenance: mapV2PhaseToLegacySteps(v2.phaseMaintenance, 'maintenance')
  }
}

/**
 * Maps V2 phase steps to legacy NewRoutineStep format
 */
function mapV2PhaseToLegacySteps(
  phase: RoutineBlueprintV2T['phaseImmediate'],
  phaseName: 'immediate' | 'adaptation' | 'maintenance'
): NewRoutineStep[] {
  return phase.steps.map((step, index) => ({
    name: step.category,
    frequency: mapFrequencyToCanonical(step.frequency || 'daily'),
    timing: mapTimeOfDayToCanonical(step.frequency || 'daily'),
    catalogId: generateCatalogId(step.category),
    application: step.notes || `Apply ${step.category} as instructed`,
    startDate: phaseName === 'immediate' ? 'now' : `after_${(index + 1) * 7}_days`
  }))
}

/**
 * Maps V2 routine to legacy LocalizedRoutineStep format
 */
function mapV2LocalizedRoutineToLegacy(v2: RoutineBlueprintV2T): LocalizedRoutineStep[] {
  // Extract zones from criteria
  const zones = extractZonesFromCriteria(v2)
  
  return zones.map(zone => ({
    zone,
    priority: 'moyenne', // Default priority
    steps: mapV2StepsToLocalizedSteps(v2, zone)
  }))
}

/**
 * Maps V2 routine to legacy UnifiedRoutineStep format
 */
function mapV2UnifiedRoutineToLegacy(v2: RoutineBlueprintV2T): UnifiedRoutineStep[] {
  const allSteps: UnifiedRoutineStep[] = []
  let stepCounter = 1

  // Process all phases
  const phases = [
    { phase: 'immediate' as const, data: v2.phaseImmediate },
    { phase: 'adaptation' as const, data: v2.phaseAdaptation },
    { phase: 'maintenance' as const, data: v2.phaseMaintenance }
  ]

  for (const { phase, data } of phases) {
    for (const step of data.steps) {
      const unifiedStep: UnifiedRoutineStep = {
        stepNumber: stepCounter++,
        title: step.category,
        targetArea: step.category === 'cleanser' || step.category === 'sunscreen' ? 'global' : 'specific',
        zones: extractZonesFromCriteria(v2),
        recommendedProducts: [{
          id: generateCatalogId(step.category),
          name: step.category,
          brand: 'DermAI Selection',
          category: step.category,
          price: 15.99,
          affiliateLink: `https://amazon.com/dp/${generateCatalogId(step.category)}`,
          catalogId: generateCatalogId(step.category)
        }],
        applicationAdvice: step.notes || `Apply ${step.category} as instructed`,
        restrictions: step.isTemporaryTreatment ? ['Temporary treatment'] : undefined,
        treatmentType: mapCategoryToTreatmentType(step.category),
        priority: stepCounter,
        phase,
        frequency: mapFrequencyToCanonical(step.frequency || 'daily'),
        timeOfDay: mapTimeOfDayToCanonical(step.frequency || 'daily'),
        frequencyDetails: step.frequency,
        startAfterDays: phase === 'immediate' ? 0 : (stepCounter - 1) * 7,
        category: mapCategoryToLegacyCategory(step.category),
        applicationDuration: data.duration,
        timingBadge: generateTimingBadge(step.frequency || 'daily'),
        timingDetails: step.frequency || 'daily'
      }

      allSteps.push(unifiedStep)
    }
  }

  return allSteps
}

// ============================================================================
// PRODUCTS ADAPTER
// ============================================================================

/**
 * Maps V2 Product Selection to existing products shape expected by UI
 */
export function toExistingProductsShape(v2: ProductSelectionV2T): ExistingProductsShape {
  const products = v2.selections.map(s => s.picked.name)
  const productsDetailed = mapV2SelectionsToProductCards(v2.selections)
  const overview = v2.notes || 'Personalized product selection based on analysis'
  const zoneSpecificCare = generateZoneSpecificCare(v2.selections)
  const restrictions = generateRestrictions(v2.selections)

  return {
    products,
    productsDetailed,
    overview,
    zoneSpecificCare,
    restrictions
  }
}

/**
 * Maps V2 selections to legacy RecommendedProductCard format
 */
function mapV2SelectionsToProductCards(selections: ProductSelectionV2T['selections']): RecommendedProductCard[] {
  return selections.map(selection => ({
    name: selection.picked.name,
    brand: selection.picked.brand,
    price: selection.picked.price,
    imageUrl: `https://images.example.com/${selection.picked.id}.jpg`,
    affiliateLink: `https://amazon.com/dp/${selection.picked.id}`,
    frequency: mapCategoryToFrequency(selection.category),
    benefits: [selection.why],
    badges: ['Recommended']
  }))
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Maps frequency string to canonical frequency
 */
function mapFrequencyToCanonical(frequency: string): FrequencyCanonical {
  const mapping: Record<string, FrequencyCanonical> = {
    'daily': 'daily',
    'weekly': 'weekly',
    'as_needed': 'as_needed',
    'until_improvement': 'as_needed'
  }
  return mapping[frequency] || 'daily'
}

/**
 * Maps time of day based on frequency
 */
function mapTimeOfDayToCanonical(frequency: string): TimeOfDayCanonical {
  if (frequency === 'weekly') return 'evening'
  if (frequency === 'as_needed') return 'evening'
  return 'morning_and_evening'
}

/**
 * Maps category to treatment type
 */
function mapCategoryToTreatmentType(category: string): 'cleansing' | 'treatment' | 'moisturizing' | 'protection' {
  const mapping: Record<string, 'cleansing' | 'treatment' | 'moisturizing' | 'protection'> = {
    'cleanser': 'cleansing',
    'moisturizer': 'moisturizing',
    'sunscreen': 'protection',
    'niacinamide': 'treatment',
    'vitamin_c': 'treatment',
    'aha_bha': 'treatment',
    'retinoid': 'treatment',
    'spot_treatment': 'treatment',
    'balm': 'moisturizing',
    'eye_cream': 'moisturizing',
    'exfoliant_weekly': 'treatment'
  }
  return mapping[category] || 'treatment'
}

/**
 * Maps category to legacy category
 */
function mapCategoryToLegacyCategory(category: string): 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation' {
  const mapping: Record<string, 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation'> = {
    'cleanser': 'cleansing',
    'moisturizer': 'hydration',
    'sunscreen': 'protection',
    'niacinamide': 'treatment',
    'vitamin_c': 'treatment',
    'aha_bha': 'exfoliation',
    'retinoid': 'treatment',
    'spot_treatment': 'treatment',
    'balm': 'hydration',
    'eye_cream': 'hydration',
    'exfoliant_weekly': 'exfoliation'
  }
  return mapping[category] || 'treatment'
}

/**
 * Maps category to frequency display
 */
function mapCategoryToFrequency(category: string): 'Quotidien' | 'Hebdomadaire' | 'Ponctuel' {
  const mapping: Record<string, 'Quotidien' | 'Hebdomadaire' | 'Ponctuel'> = {
    'cleanser': 'Quotidien',
    'moisturizer': 'Quotidien',
    'sunscreen': 'Quotidien',
    'niacinamide': 'Quotidien',
    'vitamin_c': 'Quotidien',
    'aha_bha': 'Hebdomadaire',
    'retinoid': 'Quotidien',
    'spot_treatment': 'Ponctuel',
    'balm': 'Quotidien',
    'eye_cream': 'Quotidien',
    'exfoliant_weekly': 'Hebdomadaire'
  }
  return mapping[category] || 'Quotidien'
}

/**
 * Generates a catalog ID for a category
 */
function generateCatalogId(category: string): string {
  const mapping: Record<string, string> = {
    'cleanser': 'B01MSSDEPK',
    'moisturizer': 'B00BNUY3HE',
    'sunscreen': 'B004W55086',
    'niacinamide': 'B01MDTVZTZ',
    'vitamin_c': 'B08KGXQY2R',
    'aha_bha': 'B00949CTQQ',
    'retinoid': 'B08KGXQY2R',
    'spot_treatment': 'B00BNUY3HE',
    'balm': 'B00BNUY3HE',
    'eye_cream': 'B00BNUY3HE',
    'exfoliant_weekly': 'B00949CTQQ'
  }
  return mapping[category] || 'B01MSSDEPK'
}

/**
 * Generates timing badge
 */
function generateTimingBadge(frequency: string): string {
  const mapping: Record<string, string> = {
    'daily': 'Daily ☀️🌙',
    'weekly': 'Weekly 🌙',
    'as_needed': 'As needed 🎯',
    'until_improvement': 'Until improvement 📈'
  }
  return mapping[frequency] || 'Daily ☀️🌙'
}

/**
 * Extracts zones from criteria
 */
function extractZonesFromCriteria(v2: RoutineBlueprintV2T): string[] {
  const zones = new Set<string>()
  
  // Extract from all phases
  const allCriteria = [
    ...v2.phaseImmediate.criteriaToMoveOn,
    ...v2.phaseAdaptation.criteriaToMoveOn,
    ...v2.phaseMaintenance.criteriaToMoveOn
  ]
  
  allCriteria.forEach(criteria => {
    // Look for zone mentions in criteria
    const zoneMatches = criteria.match(/(forehead|cheek|nose|chin|eye|neck)/gi)
    if (zoneMatches) {
      zoneMatches.forEach(zone => zones.add(zone.toLowerCase()))
    }
  })
  
  return zones.size > 0 ? Array.from(zones) : ['face']
}

/**
 * Maps V2 steps to localized steps
 */
function mapV2StepsToLocalizedSteps(v2: RoutineBlueprintV2T, zone: string): LocalizedStep[] {
  const allSteps: LocalizedStep[] = []
  
  // Collect steps from all phases
  const phases = [v2.phaseImmediate, v2.phaseAdaptation, v2.phaseMaintenance]
  
  phases.forEach(phase => {
    phase.steps.forEach(step => {
      allSteps.push({
        name: step.category,
        frequency: mapFrequencyToCanonical(step.frequency || 'daily'),
        timing: mapTimeOfDayToCanonical(step.frequency || 'daily'),
        catalogId: generateCatalogId(step.category),
        application: step.notes || `Apply ${step.category} to ${zone}`,
        duration: phase.duration,
        resume: step.notes || `Continue ${step.category} application`
      })
    })
  })
  
  return allSteps
}

/**
 * Generates zone-specific care description
 */
function generateZoneSpecificCare(selections: ProductSelectionV2T['selections']): string {
  const categories = selections.map(s => s.category).join(', ')
  return `Targeted care for specific zones using: ${categories}`
}

/**
 * Generates restrictions based on selections
 */
function generateRestrictions(selections: ProductSelectionV2T['selections']): string {
  const restrictions: string[] = []
  
  selections.forEach(selection => {
    if (selection.category === 'retinoid') {
      restrictions.push('Daily sun protection required with retinoids')
    }
    if (selection.category === 'aha_bha') {
      restrictions.push('Do not combine AHA/BHA with retinoids')
    }
    if (selection.category === 'spot_treatment') {
      restrictions.push('Apply spot treatment only to affected areas')
    }
  })
  
  return restrictions.length > 0 ? restrictions.join('. ') : 'No specific restrictions'
}

// ============================================================================
// ORCHESTRATOR ADAPTER
// ============================================================================

/**
 * Main adapter function expected by the orchestrator
 * Composes all V2 outputs into the legacy SkinAnalysis shape expected by the UI
 */
export function adaptV2ToLegacySkinAnalysis(input: {
  vision: VisionOutputV2T
  routine: RoutineBlueprintV2T
  products: ProductSelectionV2T
  metadata?: {
    processingTimeMs: number
    aiModelUsed: string
    analysisVersion: string
    timestamp: Date
    stepProviders?: { 1: string; 2: string; 3: string }
  }
}): SkinAnalysis {
  // Use existing mappers to transform V2 outputs to legacy shapes
  const visionLegacy = toExistingVisionShape(input.vision)
  const routineLegacy = toExistingRoutineShape(input.routine)
  const productsLegacy = toExistingProductsShape(input.products)

  // Compose the complete legacy SkinAnalysis object
  const legacyAnalysis: SkinAnalysis = {
    id: `analysis_${Date.now()}`, // Generate unique ID
    userId: 'anonymous', // Default user ID
    photos: [], // Photos will be handled separately
    scores: visionLegacy.scores,
    beautyAssessment: visionLegacy.beautyAssessment,
    recommendations: {
      immediate: productsLegacy.products || [],
      routine: routineLegacy.routine,
      products: productsLegacy.products || [],
      lifestyle: [], // Default empty lifestyle recommendations
      unifiedRoutine: routineLegacy.unifiedRoutine || [],
      localizedRoutine: routineLegacy.localizedRoutine || [],
      productsDetailed: productsLegacy.productsDetailed || [],
      overview: productsLegacy.overview || '',
      zoneSpecificCare: productsLegacy.zoneSpecificCare || '',
      restrictions: productsLegacy.restrictions || ''
    },
    // Add V2 metrics for E2E testing
    v2Metrics: {
      noFallbacks: input.products.metrics.noFallbacks,
      utilization_pct: input.products.budget.utilization_pct
    },
    createdAt: new Date(),
    // Add V2 metadata if available
    metadata: input.metadata ? {
      analysis_version: input.metadata.analysisVersion,
      processing_time_ms: input.metadata.processingTimeMs,
      ai_model_used: input.metadata.aiModelUsed,
      pipeline_version: 'v2',
      timestamp: input.metadata.timestamp.toISOString(),
      ...(input.metadata.stepProviders && { stepProviders: input.metadata.stepProviders })
    } : undefined
  }

  return legacyAnalysis
}