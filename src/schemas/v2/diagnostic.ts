import { z } from 'zod'

// Schéma pour les détails de score
export const ScoreDetailSchema = z.object({
  value: z.number().min(0).max(100),
  justification: z.string().min(10).max(300), // ✅ Augmenté pour justifications détaillées
  confidence: z.number().min(0).max(1),
  basedOn: z.array(z.string()).min(1).max(5)
})

// Schéma pour les problèmes par zone
export const ZoneIssueSchema = z.object({
  zone: z.enum(['front', 'joues', 'nez', 'menton', 'contour-yeux', 'cou', 'lèvres', 'bouche', 'zone T', 'zone-t', 'T-zone', 't-zone']), // ✅ Ajout lèvres/bouche
  problem: z.string().min(3).max(100), // Réduit pour permettre "Rides", "Pores"
  intensity: z.enum(['légère', 'modérée', 'intense']),
  description: z.string().min(10).max(200)
})

// Schéma principal pour le diagnostic pur
export const PureDiagnosticSchema = z.object({
  skinType: z.string().min(3).max(20),
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
  generalObservation: z.string().min(50).max(500),
  zoneSpecificIssues: z.array(ZoneIssueSchema).min(0).max(10)
})

// Types TypeScript dérivés
export type ScoreDetail = z.infer<typeof ScoreDetailSchema>
export type ZoneIssue = z.infer<typeof ZoneIssueSchema>
export type PureDiagnostic = z.infer<typeof PureDiagnosticSchema>
