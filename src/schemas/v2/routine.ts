import { z } from 'zod'

// Schéma pour une étape de routine (V1 - rétrocompatible)
export const RoutineStepSchema = z.object({
  stepNumber: z.number().min(1).max(20),
  careType: z.enum(['nettoyage', 'traitement', 'hydratation', 'protection', 'exfoliation', 'masque']),
  timing: z.string(), // Assouplir : accepter toutes les chaînes ("matin et soir", "1-2 fois par semaine", etc.)
  targetProblem: z.string().optional(),
  targetZones: z.array(z.string()).optional(),
  progressiveIntroduction: z.string().nullable().optional(), // Accepter null ET undefined
  restrictions: z.array(z.string()).optional(),
  // NOUVEAUX CHAMPS V2 - Optionnels pour rétrocompatibilité
  isTemporary: z.boolean().optional(),
  introduceFromWeek: z.number().min(0).max(12).optional(),
  applicationDuration: z.string().optional(),
  frequency: z.string().optional(),
  displayTitle: z.string().min(3).max(40).optional(),
  targetBenefit: z.string().min(3).max(30).optional()
})

// Schéma enrichi pour les nouvelles routines V2 (tous champs requis)
export const EnrichedRoutineStepSchema = z.object({
  stepNumber: z.number().min(1).max(20),
  careType: z.enum(['nettoyage', 'traitement', 'hydratation', 'protection', 'exfoliation', 'masque']),
  timing: z.string(),
  targetProblem: z.string().optional(),
  targetZones: z.array(z.string()).optional(),
  progressiveIntroduction: z.string().nullable().optional(),
  restrictions: z.array(z.string()).optional(),
  // CHAMPS V2 OBLIGATOIRES
  isTemporary: z.boolean(),
  introduceFromWeek: z.number().min(0).max(12),
  applicationDuration: z.string().min(1),
  frequency: z.enum(['daily', '2x/week', 'weekly', '1x/week', 'progressive']).or(z.string()),
  displayTitle: z.string().min(3).max(40),
  targetBenefit: z.string().min(3).max(30)
})

// Schéma pour une phase de routine (V1 - rétrocompatible)
export const PhaseDetailSchema = z.object({
  duration: z.string().min(5).max(50),
  objective: z.string().min(20).max(200).optional(), // ✅ Optionnel (prompt V3 ne génère pas toujours)
  steps: z.array(RoutineStepSchema).min(1).max(10)
})

// Schéma pour une phase enrichie V2
export const EnrichedPhaseDetailSchema = z.object({
  duration: z.string().min(5).max(50),
  objective: z.string().min(20).max(200).optional(), // ✅ Optionnel (prompt V3 ne génère pas toujours)
  steps: z.array(EnrichedRoutineStepSchema).min(1).max(10)
})

// Schéma principal pour la routine personnalisée (V1 - rétrocompatible)
export const PersonalizedRoutineSchema = z.object({
  phases: z.object({
    immediate: PhaseDetailSchema,
    adaptation: PhaseDetailSchema,
    maintenance: PhaseDetailSchema
  }),
  globalAdvice: z.array(z.string()).min(2).max(5),
  dermatologicalRationale: z.string().min(100).max(800)
})

// Schéma enrichi pour les nouvelles routines V2
export const EnrichedPersonalizedRoutineSchema = z.object({
  phases: z.object({
    immediate: EnrichedPhaseDetailSchema,
    adaptation: EnrichedPhaseDetailSchema,
    maintenance: EnrichedPhaseDetailSchema
  }),
  globalAdvice: z.array(z.string()).min(2).max(5),
  dermatologicalRationale: z.string().min(100).max(800)
})

// Types TypeScript dérivés (V1 - rétrocompatibles)
export type RoutineStep = z.infer<typeof RoutineStepSchema>
export type PhaseDetail = z.infer<typeof PhaseDetailSchema>
export type PersonalizedRoutine = z.infer<typeof PersonalizedRoutineSchema>

// Types TypeScript enrichis V2
export type EnrichedRoutineStep = z.infer<typeof EnrichedRoutineStepSchema>
export type EnrichedPhaseDetail = z.infer<typeof EnrichedPhaseDetailSchema>
export type EnrichedPersonalizedRoutine = z.infer<typeof EnrichedPersonalizedRoutineSchema>

// Fonction utilitaire pour valider et migrer ancien format vers nouveau
export function validateAndEnrichRoutine(data: unknown): EnrichedPersonalizedRoutine {
  // Essayer d'abord le nouveau format
  try {
    return EnrichedPersonalizedRoutineSchema.parse(data)
  } catch {
    // Fallback sur ancien format puis enrichissement
    const oldRoutine = PersonalizedRoutineSchema.parse(data)
    return enrichLegacyRoutine(oldRoutine)
  }
}

// Migration automatique ancien → nouveau format
function enrichLegacyRoutine(routine: PersonalizedRoutine): EnrichedPersonalizedRoutine {
  const enrichStep = (step: RoutineStep): EnrichedRoutineStep => ({
    ...step,
    isTemporary: step.isTemporary ?? inferIsTemporary(step.careType),
    introduceFromWeek: step.introduceFromWeek ?? 0,
    applicationDuration: step.applicationDuration ?? inferDuration(step.careType),
    frequency: step.frequency ?? inferFrequency(step.timing),
    displayTitle: step.displayTitle ?? generateDisplayTitle(step.careType, step.targetProblem),
    targetBenefit: step.targetBenefit ?? generateTargetBenefit(step.careType, step.targetProblem)
  })

  return {
    ...routine,
    phases: {
      immediate: {
        ...routine.phases.immediate,
        steps: routine.phases.immediate.steps.map(enrichStep)
      },
      adaptation: {
        ...routine.phases.adaptation,
        steps: routine.phases.adaptation.steps.map(enrichStep)
      },
      maintenance: {
        ...routine.phases.maintenance,
        steps: routine.phases.maintenance.steps.map(enrichStep)
      }
    }
  }
}

// Fonctions d'inférence pour migration automatique
function inferIsTemporary(careType: string): boolean {
  return ['traitement', 'exfoliation', 'masque'].includes(careType)
}

function inferDuration(careType: string): string {
  const durations = {
    'nettoyage': 'continu',
    'hydratation': 'continu', 
    'protection': 'continu',
    'traitement': '3-4 semaines',
    'exfoliation': '2-3 semaines',
    'masque': 'jusqu\'à amélioration'
  }
  return durations[careType as keyof typeof durations] || 'continu'
}

function inferFrequency(timing: string): string {
  if (timing.includes('hebdomadaire') || timing.includes('semaine')) return 'weekly'
  if (timing === 'both' || timing.includes('matin') && timing.includes('soir')) return 'daily'
  return 'daily'
}

function generateDisplayTitle(careType: string, targetProblem?: string): string {
  const titles = {
    'nettoyage': 'Nettoyage quotidien',
    'traitement': targetProblem ? `Traitement ${targetProblem.split(' ')[0]}` : 'Traitement ciblé',
    'hydratation': 'Hydratation',
    'protection': 'Protection solaire',
    'exfoliation': 'Exfoliation douce',
    'masque': 'Masque intensif'
  }
  return titles[careType as keyof typeof titles] || 'Soin spécialisé'
}

function generateTargetBenefit(careType: string, targetProblem?: string): string {
  const benefits = {
    'nettoyage': 'Purifier quotidiennement',
    'traitement': 'Corriger problèmes',
    'hydratation': 'Nourrir et protéger',
    'protection': 'Prévenir vieillissement',
    'exfoliation': 'Renouveler peau',
    'masque': 'Traitement intensif'
  }
  return benefits[careType as keyof typeof benefits] || 'Améliorer peau'
}
