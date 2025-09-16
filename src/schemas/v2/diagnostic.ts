import { z } from 'zod'
import { BasedOnArraySchema, ProblemFieldSchema } from './lexique'

// Schéma pour les détails de score (V2.1 compatible avec lexique strict)
export const ScoreDetailSchema = z.object({
  value: z.number().min(0).max(100),
  justification: z.string().min(80).max(300), // Ajusté pour V2.1: ≥80 chars
  confidence: z.number().min(0).max(1).refine(val => Number(val.toFixed(2)) === val, {
    message: "Confidence must have max 2 decimal places"
  }),
  basedOn: BasedOnArraySchema // Utilise le lexique standardisé strict
})

// Schéma pour les problèmes par zone (V2.1 compatible avec lexique strict)
export const ZoneIssueSchema = z.object({
  zone: z.enum(['front', 'joues', 'nez', 'menton', 'contour-yeux', 'cou']), // Zones strictes V2.1
  problem: ProblemFieldSchema, // Utilise le lexique standardisé ou "autre: ..."
  intensity: z.enum(['légère', 'modérée', 'intense']),
  description: z.string().min(80).max(300) // Ajusté pour V2.1: ≥80 chars
})

// Schéma principal pour le diagnostic pur (V2.1 compatible)
export const PureDiagnosticSchema = z.object({
  skinType: z.enum(['Sèche', 'Normale', 'Mixte', 'Grasse', 'Sensible', 'Indéterminé']), // Types stricts V2.1
  scores: z.object({
    hydration: ScoreDetailSchema,
    wrinkles: ScoreDetailSchema,
    firmness: ScoreDetailSchema,
    radiance: ScoreDetailSchema,
    pores: ScoreDetailSchema,
    spots: ScoreDetailSchema,
    darkCircles: ScoreDetailSchema,
    skinAge: ScoreDetailSchema,
    overall: z.number().min(0).max(100)
  }),
  skinAgeEstimate: z.number().min(15).max(80),
  generalObservation: z.string().min(150).max(400), // Ajusté pour V2.1: 150-400 chars
  zoneSpecificIssues: z.array(ZoneIssueSchema).min(0).max(10)
})

// Types TypeScript dérivés
export type ScoreDetail = z.infer<typeof ScoreDetailSchema>
export type ZoneIssue = z.infer<typeof ZoneIssueSchema>
export type PureDiagnostic = z.infer<typeof PureDiagnosticSchema>
