import { z } from 'zod'

// ============================================================================
// V2 SCHEMAS - New pipeline output formats
// ============================================================================

/**
 * STEP 1: Vision Analysis Output (Photo-only analysis)
 */
export const VisionOutputV2Schema = z.object({
  perPhoto: z.array(z.object({
    url: z.string(),
    angle: z.literal('front').or(z.literal('left')).or(z.literal('right')).or(z.literal('three_quarters')).or(z.literal('chin_up')).or(z.literal('custom')),
    imageQuality: z.object({
      issues: z.array(z.string()),
      overall: z.literal('good').or(z.literal('ok')).or(z.literal('poor'))
    }),
    findings: z.array(z.object({
      zone: z.literal('forehead').or(z.literal('cheek_left')).or(z.literal('cheek_right')).or(z.literal('nose')).or(z.literal('chin')),
      finding: z.string(),
      evidence: z.string(),
      confidence: z.number().min(0).max(1)
    })),
    scores: z.object({
      hydration: z.number().min(0).max(100),
      oiliness: z.number().min(0).max(100),
      pores: z.number().min(0).max(100),
      texture: z.number().min(0).max(100),
      redness: z.number().min(0).max(100),
      pigmentation: z.number().min(0).max(100),
      wrinkles_fine_lines: z.number().min(0).max(100),
      sensitivity: z.number().min(0).max(100)
    }),
    notes: z.string().optional()
  })),
  aggregated: z.object({
    method: z.literal('weighted_average').or(z.literal('median')).or(z.literal('max_severity')),
    weightsUsed: z.record(z.string(), z.number()).optional(),
    globalFindings: z.array(z.object({
      zone: z.literal('forehead').or(z.literal('cheek_left')).or(z.literal('cheek_right')).or(z.literal('nose')).or(z.literal('chin')),
      finding: z.string(),
      evidence: z.string(),
      confidence: z.number().min(0).max(1)
    })),
    concerns: z.array(z.object({
      type: z.string(),
      intensity: z.literal('mild').or(z.literal('moderate')).or(z.literal('severe')),
      zones: z.array(z.string()),
      evidence: z.string(),
      confidence: z.number().min(0).max(1)
    })),
    scores: z.object({
      hydration: z.number().min(0).max(100),
      oiliness: z.number().min(0).max(100),
      pores: z.number().min(0).max(100),
      texture: z.number().min(0).max(100),
      redness: z.number().min(0).max(100),
      pigmentation: z.number().min(0).max(100),
      wrinkles_fine_lines: z.number().min(0).max(100),
      sensitivity: z.number().min(0).max(100)
    }),
    notes: z.string().optional()
  })
})

export type VisionOutputV2T = z.infer<typeof VisionOutputV2Schema>

/**
 * STEP 2: Routine Blueprint Output (3-phase routine structure)
 */
export const RoutineBlueprintV2Schema = z.object({
  phaseImmediate: z.object({
    duration: z.string(),
    objective: z.string(),
    criteriaToMoveOn: z.array(z.string()),
    steps: z.array(z.object({
      category: z.string(),
      frequency: z.string().optional(),
      introProtocol: z.string().optional(),
      evolution: z.string().optional(),
      notes: z.string().optional(),
      isTemporaryTreatment: z.boolean().optional()
    }))
  }),
  phaseAdaptation: z.object({
    duration: z.string(),
    objective: z.string(),
    criteriaToMoveOn: z.array(z.string()),
    steps: z.array(z.object({
      category: z.string(),
      frequency: z.string().optional(),
      introProtocol: z.string().optional(),
      evolution: z.string().optional(),
      notes: z.string().optional(),
      isTemporaryTreatment: z.boolean().optional()
    }))
  }),
  phaseMaintenance: z.object({
    duration: z.string(),
    objective: z.string(),
    criteriaToMoveOn: z.array(z.string()),
    steps: z.array(z.object({
      category: z.string(),
      frequency: z.string().optional(),
      introProtocol: z.string().optional(),
      evolution: z.string().optional(),
      notes: z.string().optional(),
      isTemporaryTreatment: z.boolean().optional()
    }))
  }),
  educational: z.object({
    tooltips: z.record(z.string(), z.string()),
    badges: z.array(z.string())
  })
})

export type RoutineBlueprintV2T = z.infer<typeof RoutineBlueprintV2Schema>

/**
 * STEP 3: Product Selection Output (Catalogue-based selection)
 */
export const ProductSelectionV2Schema = z.object({
  selections: z.array(z.object({
    category: z.string(),
    picked: z.object({
      id: z.string(),
      name: z.string(),
      brand: z.string(),
      price: z.number()
    }),
    why: z.string(),
    alternatives: z.array(z.object({
      id: z.string(),
      why: z.string()
    })).optional()
  })),
  budget: z.object({
    allocatedByCategory: z.array(z.object({
      category: z.string(),
      euro: z.number()
    })),
    total: z.number(),
    utilization_pct: z.number()
  }),
  notes: z.string().optional(),
  metrics: z.object({
    catalogCoveragePct: z.number(),
    noFallbacks: z.literal(true) // Must be true - no generic products allowed
  })
})

export type ProductSelectionV2T = z.infer<typeof ProductSelectionV2Schema>

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate Vision Output V2
 */
export function validateVisionOutputV2(data: unknown): VisionOutputV2T {
  try {
    return VisionOutputV2Schema.parse(data)
  } catch (error) {
    console.error('VisionOutputV2 validation error:', error)
    throw new Error(`Invalid VisionOutputV2 format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate Routine Blueprint V2
 */
export function validateRoutineBlueprintV2(data: unknown): RoutineBlueprintV2T {
  try {
    return RoutineBlueprintV2Schema.parse(data)
  } catch (error) {
    console.error('RoutineBlueprintV2 validation error:', error)
    throw new Error(`Invalid RoutineBlueprintV2 format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate Product Selection V2
 */
export function validateProductSelectionV2(data: unknown): ProductSelectionV2T {
  try {
    return ProductSelectionV2Schema.parse(data)
  } catch (error) {
    console.error('ProductSelectionV2 validation error:', error)
    throw new Error(`Invalid ProductSelectionV2 format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Complete V2 Pipeline Output
 */
export interface V2PipelineOutput {
  vision: VisionOutputV2T
  routine: RoutineBlueprintV2T
  products: ProductSelectionV2T
  metadata: {
    processingTimeMs: number
    aiModelUsed: string
    analysisVersion: string
    timestamp: Date
    stepProviders?: { 1: string; 2: string; 3: string }
  }
}
