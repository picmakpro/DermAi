import { z } from 'zod'

/**
 * 🔥 NOUVEAUX SCHÉMAS ZOD - SPRINT 1 REFONTE IA-FIRST
 * Validation stricte pour routine personnalisée générée par IA
 */

// Schéma pour une étape de routine personnalisée
export const RoutineStepPersonnaliseeSchema = z.object({
  stepNumber: z.number().min(1),
  title: z.string().min(10).max(200), // Titre personnalisé, pas template
  description: z.string().min(20).max(800), // Description personnalisée détaillée
  category: z.enum(['cleansing', 'treatment', 'hydration', 'protection', 'exfoliation']),
  timing: z.enum(['morning', 'evening', 'both']),
  frequency: z.string().min(5).max(100), // "Quotidien matin", "2x/semaine soir", etc.
  visualCriteria: z.string().optional(), // "Jusqu'à cicatrisation", "Jusqu'à amélioration texture"
  personalizedAdvice: z.string().min(10).max(400), // Conseil spécifique à l'utilisateur
  targetZones: z.array(z.string()).optional(), // Zones ciblées si applicable
  duration: z.string().optional() // Durée spécifique si différente de la phase
})

// Schéma pour une phase de routine (Immédiate, Adaptation, Maintenance)
export const RoutinePhaseSchema = z.object({
  phaseName: z.enum(['immediate', 'adaptation', 'maintenance']),
  duration: z.string().min(10).max(200), // "2-3 semaines selon votre âge et type de peau"
  objective: z.string().min(20).max(300), // "Stabiliser votre barrière cutanée et traiter l'acné active"
  description: z.string().min(30).max(500), // Description personnalisée de la phase
  steps: z.array(RoutineStepPersonnaliseeSchema).min(1).max(8),
  transitionCriteria: z.array(z.string()).optional() // Critères pour passer à la phase suivante
})

// Schéma pour les durées personnalisées
export const PersonalizedTimingSchema = z.object({
  immediateDuration: z.string().min(10).max(100), // "14-21 jours pour votre peau sensible"
  adaptationDuration: z.string().min(10).max(100), // "4-6 semaines avec introduction progressive"
  maintenanceDuration: z.string().min(10).max(100), // "En continu avec ajustements saisonniers"
  transitionCriteria: z.array(z.string()).min(1).max(5), // Critères visuels de transition
  ageFactors: z.string().optional(), // Facteurs liés à l'âge
  skinTypeFactors: z.string().optional() // Facteurs liés au type de peau
})

// Schéma principal pour routine personnalisée complète
export const RoutinePersonnaliseeCompleteSchema = z.object({
  // Métadonnées de personnalisation
  personalizationSummary: z.string().min(50).max(400), // Résumé de la personnalisation appliquée
  
  // Les 3 phases personnalisées
  immediatePhase: RoutinePhaseSchema.refine(
    (phase) => phase.phaseName === 'immediate',
    { message: "La phase immédiate doit avoir phaseName = 'immediate'" }
  ),
  
  adaptationPhase: RoutinePhaseSchema.refine(
    (phase) => phase.phaseName === 'adaptation',
    { message: "La phase d'adaptation doit avoir phaseName = 'adaptation'" }
  ),
  
  maintenancePhase: RoutinePhaseSchema.refine(
    (phase) => phase.phaseName === 'maintenance',
    { message: "La phase de maintenance doit avoir phaseName = 'maintenance'" }
  ),
  
  // Durées et critères personnalisés
  personalizedTimings: PersonalizedTimingSchema,
  
  // Conseils globaux personnalisés
  globalAdvice: z.array(z.string()).min(2).max(6), // Conseils généraux adaptés au profil
  
  // Facteurs de personnalisation appliqués
  personalizationFactors: z.object({
    ageGroup: z.string(), // "25-30 ans", "40-50 ans", etc.
    skinTypeAdaptation: z.string(), // Adaptations selon type de peau
    intensityLevel: z.string(), // Adaptations selon intensité problèmes
    lifestyleFactors: z.array(z.string()).optional() // Facteurs mode de vie pris en compte
  })
})

// Type TypeScript exporté
export type PersonalizedRoutine = z.infer<typeof RoutinePersonnaliseeCompleteSchema>
export type RoutinePhase = z.infer<typeof RoutinePhaseSchema>
export type RoutineStepPersonnalisee = z.infer<typeof RoutineStepPersonnaliseeSchema>
export type PersonalizedTiming = z.infer<typeof PersonalizedTimingSchema>

/**
 * Schéma pour les contraintes utilisateur (input)
 */
export const UserConstraintsSchema = z.object({
  budget: z.string().optional(), // "50-100€", "Pas de limite", etc.
  timeAvailable: z.string().optional(), // "5 min matin", "15 min soir", etc.
  allergies: z.array(z.string()).optional(), // Ingrédients à éviter
  currentRoutine: z.string().optional(), // Routine actuelle si mentionnée
  lifestyle: z.string().optional(), // "Voyage fréquent", "Vie active", etc.
  preferences: z.array(z.string()).optional() // Préférences spécifiques
})

export type UserConstraints = z.infer<typeof UserConstraintsSchema>

/**
 * 🔥 NOUVEAUX SCHÉMAS ZOD - SPRINT 2 REFONTE IA-FIRST
 * Validation stricte pour sélection produits générée par IA
 */

// Schéma pour un produit sélectionné par l'IA
export const SelectedProductSchema = z.object({
  routineStepId: z.number().min(1), // ID de l'étape de routine correspondante
  catalogId: z.string().min(3).max(50), // ID du produit dans le catalogue
  productName: z.string().min(5).max(200), // Nom du produit
  brand: z.string().min(2).max(100), // Marque
  category: z.string().min(3).max(50), // Catégorie (cleanser, serum, etc.)
  price: z.number().min(0), // Prix en euros
  phase: z.enum(['immediate', 'adaptation', 'maintenance']), // Phase de la routine
  stepTitle: z.string().min(10).max(200), // Titre de l'étape correspondante
  justification: z.string().min(30).max(600), // Pourquoi ce produit pour cet utilisateur
  applicationAdvice: z.string().min(20).max(400), // Conseil d'usage personnalisé
  dermatologicalReason: z.string().min(20).max(300), // Raison dermatologique spécifique
  alternatives: z.array(z.string()).optional(), // IDs produits alternatifs
  timing: z.enum(['morning', 'evening', 'both']), // Moment d'application
  frequency: z.string().min(5).max(100), // Fréquence d'usage
  targetZones: z.array(z.string()).optional(), // Zones d'application si spécifique
  compatibilityNotes: z.string().optional() // Notes de compatibilité avec autres produits
})

// Schéma pour la répartition budgétaire
export const BudgetBreakdownSchema = z.object({
  totalCost: z.number().min(0), // Coût total des produits sélectionnés
  budgetRespected: z.boolean(), // Budget utilisateur respecté ou non
  budgetUtilization: z.number().min(0).max(100), // % du budget utilisé
  priorityAllocation: z.object({
    essentials: z.number().min(0), // Coût produits essentiels (nettoyant, SPF)
    actives: z.number().min(0), // Coût produits actifs (sérums, traitements)
    comfort: z.number().min(0) // Coût produits confort (hydratants, extras)
  }),
  optimizations: z.array(z.string()).optional(), // Optimisations appliquées
  savingsAchieved: z.number().optional(), // Économies réalisées vs sélection premium
  costPerPhase: z.object({
    immediate: z.number().min(0),
    adaptation: z.number().min(0),
    maintenance: z.number().min(0)
  })
})

// Schéma pour la cohérence dermatologique
export const DermatologicalCoherenceSchema = z.object({
  zonesMatch: z.boolean(), // Zones diagnostic = zones produits
  intensityMatch: z.boolean(), // Intensité problème = potency produits
  phaseLogicRespected: z.boolean(), // Logique 3 phases respectée
  ingredientCompatibility: z.boolean(), // Compatibilité ingrédients validée
  applicationOrderValid: z.boolean(), // Ordre d'application correct
  timingCoherent: z.boolean(), // Timing produits cohérent avec routine
  overallCoherenceScore: z.number().min(0).max(100), // Score global de cohérence
  issues: z.array(z.string()).optional(), // Issues détectées
  strengths: z.array(z.string()).optional() // Points forts de la sélection
})

// Schéma pour les justifications de produits
export const ProductJustificationSchema = z.object({
  catalogId: z.string(),
  mainReason: z.string().min(20).max(200), // Raison principale de sélection
  dermatologicalBasis: z.string().min(30).max(300), // Base dermatologique
  userSpecificBenefit: z.string().min(20).max(200), // Bénéfice spécifique à l'utilisateur
  alternativeConsidered: z.string().optional(), // Alternative considérée mais écartée
  riskMitigation: z.string().optional(), // Atténuation des risques si applicable
  expectedResults: z.string().min(20).max(200), // Résultats attendus
  usageInstructions: z.string().min(30).max(400) // Instructions d'usage détaillées
})

// Schéma principal pour sélection produits complète
export const ProductSelectionCompleteSchema = z.object({
  // Métadonnées de sélection
  selectionSummary: z.string().min(50).max(400), // Résumé de la sélection appliquée
  
  // Produits sélectionnés par phase
  selectedProducts: z.array(SelectedProductSchema).min(3).max(15), // 3-15 produits max
  
  // Analyse budgétaire
  budgetBreakdown: BudgetBreakdownSchema,
  
  // Cohérence dermatologique
  dermatologicalCoherence: DermatologicalCoherenceSchema,
  
  // Justifications détaillées
  justifications: z.array(ProductJustificationSchema).min(1),
  
  // Conseils d'usage global
  globalUsageAdvice: z.array(z.string()).min(2).max(6),
  
  // Alternatives et optimisations
  alternatives: z.object({
    budgetFriendly: z.array(z.string()).optional(), // Alternatives moins chères
    premium: z.array(z.string()).optional(), // Alternatives premium
    sensitive: z.array(z.string()).optional() // Alternatives peaux sensibles
  }).optional(),
  
  // Facteurs de sélection appliqués
  selectionFactors: z.object({
    primaryCriteria: z.array(z.string()).min(1), // Critères principaux utilisés
    budgetConstraints: z.string(), // Contraintes budgétaires appliquées
    userPreferences: z.array(z.string()).optional(), // Préférences utilisateur prises en compte
    dermatologicalPriorities: z.array(z.string()).min(1) // Priorités dermatologiques
  }),
  
  // Métriques de qualité
  qualityMetrics: z.object({
    routineCompleteness: z.number().min(0).max(100), // Complétude de la routine
    budgetEfficiency: z.number().min(0).max(100), // Efficacité budgétaire
    dermatologicalSoundness: z.number().min(0).max(100), // Solidité dermatologique
    userPersonalization: z.number().min(0).max(100) // Niveau de personnalisation
  })
})

// Types TypeScript exportés pour sélection produits
export type ProductSelection = z.infer<typeof ProductSelectionCompleteSchema>
export type SelectedProduct = z.infer<typeof SelectedProductSchema>
export type BudgetBreakdown = z.infer<typeof BudgetBreakdownSchema>
export type DermatologicalCoherence = z.infer<typeof DermatologicalCoherenceSchema>
export type ProductJustification = z.infer<typeof ProductJustificationSchema>

/**
 * Validation helper pour vérifier la cohérence de la routine
 */
export function validateRoutineCoherence(routine: PersonalizedRoutine): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Vérifier que les phases ont des durées logiques
  const immediateDuration = routine.personalizedTimings.immediateDuration
  const adaptationDuration = routine.personalizedTimings.adaptationDuration
  
  if (!immediateDuration.includes('semaine') && !immediateDuration.includes('jour')) {
    errors.push('Durée phase immédiate doit mentionner semaines ou jours')
  }
  
  if (!adaptationDuration.includes('semaine')) {
    errors.push('Durée phase adaptation doit mentionner semaines')
  }
  
  // Vérifier que chaque phase a au moins une étape
  if (routine.immediatePhase.steps.length === 0) {
    errors.push('Phase immédiate doit avoir au moins une étape')
  }
  
  if (routine.adaptationPhase.steps.length === 0) {
    errors.push('Phase adaptation doit avoir au moins une étape')
  }
  
  if (routine.maintenancePhase.steps.length === 0) {
    errors.push('Phase maintenance doit avoir au moins une étape')
  }
  
  // Vérifier que les titres sont personnalisés (pas génériques)
  const allSteps = [
    ...routine.immediatePhase.steps,
    ...routine.adaptationPhase.steps,
    ...routine.maintenancePhase.steps
  ]
  
  const genericTitles = ['Nettoyage', 'Hydratation', 'Protection', 'Traitement']
  for (const step of allSteps) {
    if (genericTitles.some(generic => step.title === generic)) {
      errors.push(`Titre générique détecté: "${step.title}". Doit être personnalisé.`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
