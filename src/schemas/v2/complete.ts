import { z } from 'zod'
import { PureDiagnosticSchema } from './diagnostic'
import { PersonalizedRoutineSchema } from './routine'
import { ProductSelectionSchema } from './products'

// Schéma pour les métriques de qualité
export const QualityMetricsSchema = z.object({
  personalizationScore: z.number().min(0).max(100),
  coherenceScore: z.number().min(0).max(100),
  completenessScore: z.number().min(0).max(100),
  overallQuality: z.number().min(0).max(100)
})

// Schéma pour la validation de cohérence inter-étapes
export const InterStepCoherenceSchema = z.object({
  overallScore: z.number().min(0).max(100),
  zonesCoherent: z.boolean(),
  problemsCovered: z.number().min(0).max(1),
  budgetRespected: z.boolean(),
  issuesFound: z.array(z.string()),
  recommendations: z.array(z.string()).optional()
})

// Schéma principal pour l'analyse complète V2
export const CompleteAnalysisV2Schema = z.object({
  id: z.string(),
  diagnostic: PureDiagnosticSchema,
  routine: PersonalizedRoutineSchema,
  products: ProductSelectionSchema,
  coherenceValidation: InterStepCoherenceSchema,
  qualityMetrics: QualityMetricsSchema,
  generatedAt: z.date(),
  version: z.string().default('2.0')
})

// Types TypeScript dérivés
export type QualityMetrics = z.infer<typeof QualityMetricsSchema>
export type InterStepCoherence = z.infer<typeof InterStepCoherenceSchema>
export type CompleteAnalysisV2 = z.infer<typeof CompleteAnalysisV2Schema>
