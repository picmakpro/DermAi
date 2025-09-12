import { z } from 'zod'

// Schéma pour une étape de routine
export const RoutineStepSchema = z.object({
  stepNumber: z.number().min(1).max(20),
  careType: z.enum(['nettoyage', 'traitement', 'hydratation', 'protection', 'exfoliation', 'masque']),
  timing: z.string(), // Assouplir : accepter toutes les chaînes ("matin et soir", "1-2 fois par semaine", etc.)
  targetProblem: z.string().optional(),
  targetZones: z.array(z.string()).optional(),
  progressiveIntroduction: z.string().nullable().optional(), // Accepter null ET undefined
  restrictions: z.array(z.string()).optional()
})

// Schéma pour une phase de routine
export const PhaseDetailSchema = z.object({
  duration: z.string().min(5).max(50),
  objective: z.string().min(20).max(200),
  steps: z.array(RoutineStepSchema).min(1).max(10)
})

// Schéma principal pour la routine personnalisée
export const PersonalizedRoutineSchema = z.object({
  phases: z.object({
    immediate: PhaseDetailSchema,
    adaptation: PhaseDetailSchema,
    maintenance: PhaseDetailSchema
  }),
  globalAdvice: z.array(z.string()).min(2).max(5),
  dermatologicalRationale: z.string().min(100).max(800)
})

// Types TypeScript dérivés
export type RoutineStep = z.infer<typeof RoutineStepSchema>
export type PhaseDetail = z.infer<typeof PhaseDetailSchema>
export type PersonalizedRoutine = z.infer<typeof PersonalizedRoutineSchema>
