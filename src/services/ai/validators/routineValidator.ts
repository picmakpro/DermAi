import type { PersonalizedRoutine } from '@/schemas/v2'
import type { RoutineContext } from '@/types/questionnaire'

/**
 * 🛡️ VALIDATORS - ROUTINE COMPLIANCE V2
 * 
 * Validation post-génération IA pour garantir respect contraintes Budget/Style/Sécurité.
 * 
 * @version 2.0
 * @date 30 septembre 2025
 */

// ══════════════════════════════════════════════════════════════
// 📏 LIMITES TECHNIQUES (identiques au prompt V3)
// ══════════════════════════════════════════════════════════════

export const BUDGET_LIMITS = {
  Essentiel: { skuMax: 5, treatmentsMax: 1, hebdoMax: 1 },
  Confort: { skuMax: 6, treatmentsMax: 2, hebdoMax: 1 },
  Expert: { skuMax: 8, treatmentsMax: 2, hebdoMax: 2 }
} as const

export const STYLE_LIMITS = {
  Express: { morningMax: 3, eveningMax: 3, treatmentsMax: 1, hebdoMax: 1 },
  Équilibrée: { morningMax: 3, eveningMax: 4, treatmentsMax: 2, hebdoMax: 1 },
  Complète: { morningMax: 4, eveningMax: 4, treatmentsMax: 2, hebdoMax: 2 }
} as const

// ══════════════════════════════════════════════════════════════
// 📊 TYPES
// ══════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  metrics: {
    treatmentsCount: number
    hebdosCount: number
    morningStepsCount: number
    eveningStepsCount: number
  }
}

export interface StepCount {
  immediate: number
  adaptation: number
  maintenance: number
}

export interface HebdoCount {
  total: number
  byPhase: {
    immediate: number
    adaptation: number
    maintenance: number
  }
}

// ══════════════════════════════════════════════════════════════
// 🔍 FONCTION PRINCIPALE DE VALIDATION
// ══════════════════════════════════════════════════════════════

/**
 * Validation post-génération complète (défensive)
 * 
 * @param routine - Routine générée par GPT-5 Thinking
 * @param context - Contexte V2 (pregnancy, budget, style, UV)
 * @returns Résultat validation avec erreurs/warnings
 * 
 * @example
 * ```typescript
 * const validation = validateRoutineCompliance(routine, routineContext)
 * 
 * if (!validation.valid) {
 *   throw new Error(`Routine non conforme: ${validation.errors.join('; ')}`)
 * }
 * 
 * if (validation.warnings.length > 0) {
 *   logger.warn('Warnings validation', { warnings: validation.warnings })
 * }
 * ```
 */
export function validateRoutineCompliance(
  routine: PersonalizedRoutine,
  context: RoutineContext
): ValidationResult {
  
  const errors: string[] = []
  const warnings: string[] = []
  
  const budgetLimits = BUDGET_LIMITS[context.constraints.budgetTier]
  const styleLimits = STYLE_LIMITS[context.constraints.style]
  
  // ──────────────────────────────────────────────────────────
  // 1️⃣ COMPTAGE GLOBAL
  // ──────────────────────────────────────────────────────────
  
  const treatments = countStepsByType(routine, 'traitement')
  const hebdos = countHebdomadaireSteps(routine)
  const morningSteps = countTimingSteps(routine.phases.adaptation, 'matin')
  const eveningSteps = countTimingSteps(routine.phases.adaptation, 'soir')
  
  // ──────────────────────────────────────────────────────────
  // 2️⃣ VALIDATION BUDGET (CRITÈRE BLOQUANT)
  // ──────────────────────────────────────────────────────────
  
  if (treatments.adaptation > budgetLimits.treatmentsMax) {
    errors.push(
      `Budget ${context.constraints.budgetTier}: Traitements (${treatments.adaptation}) > max ${budgetLimits.treatmentsMax}`
    )
  }
  
  if (hebdos.total > budgetLimits.hebdoMax) {
    errors.push(
      `Budget ${context.constraints.budgetTier}: Hebdomadaires (${hebdos.total}) > max ${budgetLimits.hebdoMax}`
    )
  }
  
  // ──────────────────────────────────────────────────────────
  // 3️⃣ VALIDATION STYLE (WARNINGS non bloquants)
  // ──────────────────────────────────────────────────────────
  
  if (morningSteps > styleLimits.morningMax) {
    warnings.push(
      `Style ${context.constraints.style}: Matin (${morningSteps} steps) > max ${styleLimits.morningMax}`
    )
  }
  
  if (eveningSteps > styleLimits.eveningMax) {
    warnings.push(
      `Style ${context.constraints.style}: Soir (${eveningSteps} steps) > max ${styleLimits.eveningMax}`
    )
  }
  
  // ──────────────────────────────────────────────────────────
  // 4️⃣ SÉCURITÉ GROSSESSE (CRITÈRE BLOQUANT)
  // ──────────────────────────────────────────────────────────
  
  if (context.profile.pregnancy) {
    const dangerousActifs = detectDangerousActifs(routine)
    if (dangerousActifs.length > 0) {
      errors.push(
        `Grossesse: Actifs dangereux détectés → ${dangerousActifs.join(', ')}`
      )
    }
  }
  
  // ──────────────────────────────────────────────────────────
  // 5️⃣ BASE DURABLE (CRITÈRE BLOQUANT)
  // ──────────────────────────────────────────────────────────
  
  const baseErrors = validateBaseDurable(routine)
  errors.push(...baseErrors)
  
  // ──────────────────────────────────────────────────────────
  // 6️⃣ ALTERNANCE (si 2 traitements)
  // ──────────────────────────────────────────────────────────
  
  if (treatments.adaptation === 2) {
    const alternanceValid = validateAlternance(routine)
    if (!alternanceValid) {
      warnings.push('2 traitements adaptation sans alternance configurée (ui.needsAlternation manquant)')
    }
  }
  
  // ──────────────────────────────────────────────────────────
  // 7️⃣ RÉSULTAT
  // ──────────────────────────────────────────────────────────
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      treatmentsCount: treatments.adaptation,
      hebdosCount: hebdos.total,
      morningStepsCount: morningSteps,
      eveningStepsCount: eveningSteps
    }
  }
}

// ══════════════════════════════════════════════════════════════
// 🔧 FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════

/**
 * Compte les steps par careType dans toutes les phases
 */
export function countStepsByType(routine: PersonalizedRoutine, careType: string): StepCount {
  return {
    immediate: routine.phases.immediate.steps.filter(s => s.careType === careType).length,
    adaptation: routine.phases.adaptation.steps.filter(s => s.careType === careType).length,
    maintenance: routine.phases.maintenance.steps.filter(s => s.careType === careType).length
  }
}

/**
 * Compte les steps hebdomadaires (timing="hebdomadaire")
 */
export function countHebdomadaireSteps(routine: PersonalizedRoutine): HebdoCount {
  const allSteps = [
    ...routine.phases.immediate.steps,
    ...routine.phases.adaptation.steps,
    ...routine.phases.maintenance.steps
  ]
  
  return {
    total: allSteps.filter(s => s.timing === 'hebdomadaire').length,
    byPhase: {
      immediate: routine.phases.immediate.steps.filter(s => s.timing === 'hebdomadaire').length,
      adaptation: routine.phases.adaptation.steps.filter(s => s.timing === 'hebdomadaire').length,
      maintenance: routine.phases.maintenance.steps.filter(s => s.timing === 'hebdomadaire').length
    }
  }
}

/**
 * Compte les steps par timing dans une phase donnée
 */
export function countTimingSteps(phase: any, timing: 'matin' | 'soir'): number {
  if (!phase || !phase.steps) return 0
  return phase.steps.filter((s: any) => s.timing === timing).length
}

/**
 * Détecte les actifs dangereux pendant grossesse
 * 
 * Mots-clés interdits :
 * - Rétinol, rétinoïde, rétinal, trétinoïne
 * - Acide salicylique, BHA >2%
 * - Huiles essentielles
 * - Benzoyl peroxyde >2.5%
 */
export function detectDangerousActifs(routine: PersonalizedRoutine): string[] {
  const dangerousKeywords = [
    'rétinol', 'rétinoïde', 'rétinal', 'trétinoïne', 
    'acide salicylique', 'salicylic', 'bha >2%',
    'huile essentielle', 'essential oil',
    'benzoyl peroxyde >2.5%', 'benzoyl peroxide >2.5%'
  ]
  
  const found: string[] = []
  const allSteps = [
    ...routine.phases.immediate.steps,
    ...routine.phases.adaptation.steps,
    ...routine.phases.maintenance.steps
  ]
  
  allSteps.forEach(step => {
    const title = step.displayTitle?.toLowerCase() || ''
    const instructions = step.applicationInstructions?.toLowerCase() || ''
    const restrictions = step.restrictions?.join(' ').toLowerCase() || ''
    const combined = `${title} ${instructions} ${restrictions}`
    
    dangerousKeywords.forEach(keyword => {
      if (combined.includes(keyword)) {
        found.push(`"${step.displayTitle}" (${keyword})`)
      }
    })
  })
  
  return [...new Set(found)] // Dédupliquer
}

/**
 * Valide la présence de la base durable en phase immédiate
 * 
 * Base obligatoire :
 * - Nettoyage matin (isTemporary=false)
 * - Nettoyage soir (isTemporary=false)
 * - Protection matin/SPF (isTemporary=false)
 */
export function validateBaseDurable(routine: PersonalizedRoutine): string[] {
  const errors: string[] = []
  const immediate = routine.phases.immediate.steps
  
  const requiredBase = [
    { careType: 'nettoyage', timing: 'matin', label: 'Nettoyage matin' },
    { careType: 'nettoyage', timing: 'soir', label: 'Nettoyage soir' },
    { careType: 'protection', timing: 'matin', label: 'Protection SPF matin' }
  ]
  
  requiredBase.forEach(req => {
    const found = immediate.find(s => 
      s.careType === req.careType && 
      s.timing === req.timing && 
      s.isTemporary === false
    )
    
    if (!found) {
      errors.push(`Base manquante en phase immédiate : ${req.label}`)
    }
  })
  
  return errors
}

/**
 * Valide l'alternance entre 2 traitements
 * 
 * Si 2 traitements en adaptation, vérifier :
 * - ui.needsAlternation = true sur les 2
 * - ui.pairWithStepId croisés
 * - applicationInstructions contient "Alterner"
 */
export function validateAlternance(routine: PersonalizedRoutine): boolean {
  const treatments = routine.phases.adaptation.steps.filter(s => s.careType === 'traitement')
  
  if (treatments.length !== 2) return true
  
  // Vérifier que les deux ont needsAlternation=true
  const hasAlternance = treatments.every(t => 
    t.ui?.needsAlternation === true &&
    t.ui?.pairWithStepId !== undefined
  )
  
  if (!hasAlternance) return false
  
  // Vérifier que les pairWithStepId sont croisés
  const [t1, t2] = treatments
  const crossLinked = 
    t1.ui?.pairWithStepId === t2.stepId &&
    t2.ui?.pairWithStepId === t1.stepId
  
  if (!crossLinked) return false
  
  // Vérifier que les instructions mentionnent l'alternance
  const bothMentionAlternance = treatments.every(t => 
    t.applicationInstructions?.toLowerCase().includes('alterner')
  )
  
  return bothMentionAlternance
}

// ══════════════════════════════════════════════════════════════
// 📊 FONCTION D'ENRICHISSEMENT (optionnelle)
// ══════════════════════════════════════════════════════════════

/**
 * Ajoute des conseils explicatifs si compromis Budget/Style appliqué
 * 
 * @param routine - Routine à enrichir
 * @param context - Contexte V2
 * @param validation - Résultat validation
 * @returns Routine enrichie avec globalAdvice mis à jour
 */
export function enrichAdviceWithCompromises(
  routine: PersonalizedRoutine,
  context: RoutineContext,
  validation: ValidationResult
): PersonalizedRoutine {
  
  const budgetLimits = BUDGET_LIMITS[context.constraints.budgetTier]
  const styleLimits = STYLE_LIMITS[context.constraints.style]
  
  const compromises: string[] = []
  
  // Détection compromis Budget
  if (validation.metrics.treatmentsCount < styleLimits.treatmentsMax) {
    compromises.push(
      `Routine ajustée au budget ${context.constraints.budgetTier} : ` +
      `${validation.metrics.treatmentsCount} traitement(s) au lieu de ${styleLimits.treatmentsMax} ` +
      `pour respecter les ${budgetLimits.treatmentsMax} max autorisé(s).`
    )
  }
  
  if (validation.metrics.hebdosCount < styleLimits.hebdoMax) {
    compromises.push(
      `Soins hebdomadaires limités à ${validation.metrics.hebdosCount} ` +
      `pour respecter le budget ${context.constraints.budgetTier}.`
    )
  }
  
  // Ajouter en début de globalAdvice si compromis détectés
  if (compromises.length > 0) {
    const enrichedAdvice = [
      ...compromises,
      ...routine.globalAdvice
    ]
    
    return {
      ...routine,
      globalAdvice: enrichedAdvice
    }
  }
  
  return routine
}
