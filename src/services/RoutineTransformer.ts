import { 
  EnrichedPersonalizedRoutine, 
  EnrichedRoutineStep, 
  validateAndEnrichRoutine 
} from '@/schemas/v2/routine'
import { UnifiedRoutineStep, RecommendedProduct } from '@/types'

/**
 * @deprecated OBSOLÈTE - Utiliser AnalysisServiceV3Adapter à la place
 * 
 * Ce service sera supprimé dans la prochaine version.
 * La nouvelle pipeline V3 utilise :
 * - AnalysisServiceV3Adapter.transformForUIV3()
 * - aiRoutine.mapper.ts
 * 
 * Migration :
 * Ancien: RoutineTransformer.transformToUnified(routine, products)
 * Nouveau: AnalysisServiceV3Adapter.transformForUIV3(diagnostic, routine, products)
 * 
 * @see src/services/ai/core/AnalysisServiceV3Adapter.ts
 * @see src/services/mappers/aiRoutine.mapper.ts
 * 
 * ---
 * 
 * Service de transformation des routines IA enrichies vers le format frontend
 * 
 * SPRINT 2 - REFONTE ROUTINES V2
 * - Mapping des nouveaux champs V2 (isTemporary, displayTitle, etc.)
 * - Déduplication intelligente des produits matin/soir
 * - Catégorisation automatique (hebdomadaire, temporaire, etc.)
 * - Génération des métadonnées d'affichage
 */
export class RoutineTransformer {
  
  /**
   * Transforme une routine IA (V1 ou V2) vers le format UnifiedRoutineStep[]
   * avec déduplication et enrichissement automatique
   */
  static transformToUnified(
    routineData: unknown, 
    productsData?: any[]
  ): UnifiedRoutineStep[] {
    // 1. Valider et enrichir la routine (migration V1→V2 automatique)
    const enrichedRoutine = validateAndEnrichRoutine(routineData)
    
    // 2. Créer mapping des produits par step
    const productsByStep = this.createProductMapping(productsData)
    
    // 3. Transformer chaque phase
    const allSteps: UnifiedRoutineStep[] = []
    let globalStepNumber = 1
    
    Object.entries(enrichedRoutine.phases).forEach(([phaseName, phase]) => {
      const phaseType = phaseName as 'immediate' | 'adaptation' | 'maintenance'
      
      phase.steps.forEach((step, index) => {
        const transformedStep = this.transformSingleStep(
          step,
          phaseType,
          globalStepNumber++,
          productsByStep
        )
        allSteps.push(transformedStep)
      })
    })
    
    // 4. Appliquer déduplication intelligente
    return this.applyIntelligentDeduplication(allSteps)
  }
  
  /**
   * Transforme une étape IA enrichie vers UnifiedRoutineStep
   */
  private static transformSingleStep(
    step: EnrichedRoutineStep,
    phase: 'immediate' | 'adaptation' | 'maintenance',
    stepNumber: number,
    productsByStep: Map<string, any>
  ): UnifiedRoutineStep {
    
    // Mapping des catégories
    const category = this.mapCareTypeToCategory(step.careType)
    
    // Mapping du timing
    const timeOfDay = this.mapTimingToTimeOfDay(step.timing)
    
    // Mapping de la fréquence
    const frequency = this.mapFrequencyToStandard(step.frequency)
    
    // Récupération du produit associé
    const product = productsByStep.get(stepNumber.toString()) || 
                   productsByStep.get(step.stepNumber.toString())
    
    // Génération des métadonnées d'affichage
    const displayMetadata = this.generateDisplayMetadata(step, phase)
    
    return {
      stepNumber,
      title: step.displayTitle || this.generateTitle(step, phase),
      description: step.targetProblem || `Soin ${step.careType}`,
      targetArea: (step.targetZones && step.targetZones.length > 0) ? 'specific' : 'global',
      zones: step.targetZones || [],
      
      // Produits recommandés
      recommendedProducts: product ? [this.transformProduct(product, step)] : [],
      
      // Conseils d'application
      applicationAdvice: step.progressiveIntroduction || 
                       product?.applicationAdvice || 
                       'Appliquer selon les instructions du produit',
      
      // Restrictions
      restrictions: step.restrictions || [],
      
      // Métadonnées de traitement
      treatmentType: this.mapCareTypeToTreatmentType(step.careType),
      priority: this.getPhasePriority(phase),
      phase,
      
      // Timing et fréquence
      frequency,
      timeOfDay,
      frequencyDetails: this.generateFrequencyDetails(step),
      startAfterDays: step.introduceFromWeek * 7, // Conversion semaines → jours
      
      // Catégorie
      category,
      
      // NOUVEAUX CHAMPS V2
      applicationDuration: step.applicationDuration,
      timingBadge: this.generateTimingBadge(step, timeOfDay, frequency),
      timingDetails: this.generateTimingDetails(step),
      
      // Métadonnées de déduplication (initialisées à false)
      isEvolutive: false,
      evolutivePhases: undefined,
      
      // Métadonnées d'affichage personnalisées
      ...displayMetadata
    }
  }
  
  /**
   * Crée un mapping des produits par stepNumber/routineStepId
   */
  private static createProductMapping(productsData?: any[]): Map<string, any> {
    const mapping = new Map<string, any>()
    
    if (!productsData) return mapping
    
    productsData.forEach(product => {
      // Vérifier que le produit n'est pas null/undefined
      if (!product) return
      
      // Essayer plusieurs clés possibles
      const keys = [
        product.routineStepId,
        product.stepId,
        product.stepNumber,
        product.originalStepNumber
      ].filter(Boolean).map(String)
      
      keys.forEach(key => {
        mapping.set(key, product)
      })
    })
    
    return mapping
  }
  
  /**
   * Transforme un produit vers le format RecommendedProduct
   */
  private static transformProduct(product: any, step: EnrichedRoutineStep): RecommendedProduct {
    return {
      id: product.catalogId || product.id || `product-${step.stepNumber}`,
      catalogId: product.catalogId,
      name: product.productName || product.name,
      brand: product.brand || 'Marque recommandée',
      category: step.careType,
      price: product.price,
      affiliateLink: product.affiliateUrl || product.affiliateLink,
      justification: product.justification || step.targetBenefit || `Recommandé pour ${step.careType}`,
      applicationAdvice: product.applicationAdvice
    }
  }
  
  /**
   * Applique la déduplication intelligente sur les étapes
   * Fusionne les produits identiques utilisés matin ET soir
   */
  private static applyIntelligentDeduplication(steps: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    const deduplicatedSteps: UnifiedRoutineStep[] = []
    const processedSteps = new Set<number>()
    
    steps.forEach((step, index) => {
      if (processedSteps.has(index)) return
      
      // Chercher des étapes similaires à fusionner
      const similarSteps = this.findSimilarSteps(step, steps, index)
      
      if (similarSteps.length > 0) {
        // Fusionner les étapes similaires
        const mergedStep = this.mergeSteps(step, similarSteps)
        deduplicatedSteps.push(mergedStep)
        
        // Marquer toutes les étapes fusionnées comme traitées
        similarSteps.forEach(similarStep => {
          const similarIndex = steps.indexOf(similarStep)
          processedSteps.add(similarIndex)
        })
      } else {
        // Étape unique, ajouter telle quelle
        deduplicatedSteps.push(step)
      }
      
      processedSteps.add(index)
    })
    
    return deduplicatedSteps
  }
  
  /**
   * Trouve les étapes similaires pouvant être fusionnées
   */
  private static findSimilarSteps(
    baseStep: UnifiedRoutineStep, 
    allSteps: UnifiedRoutineStep[], 
    baseIndex: number
  ): UnifiedRoutineStep[] {
    return allSteps.filter((step, index) => {
      if (index <= baseIndex) return false // Éviter les doublons
      
      // Critères de fusion :
      // 1. Même catégorie de soin
      // 2. Même phase
      // 3. Même produit (si présent)
      // 4. Timing différent (matin vs soir)
      
      const sameCategory = step.category === baseStep.category
      const samePhase = step.phase === baseStep.phase
      const sameProduct = this.haveSameProduct(step, baseStep)
      const differentTiming = step.timeOfDay !== baseStep.timeOfDay && 
                             step.timeOfDay !== 'both' && 
                             baseStep.timeOfDay !== 'both'
      
      return sameCategory && samePhase && sameProduct && differentTiming
    })
  }
  
  /**
   * Vérifie si deux étapes utilisent le même produit
   */
  private static haveSameProduct(step1: UnifiedRoutineStep, step2: UnifiedRoutineStep): boolean {
    const product1 = step1.recommendedProducts[0]
    const product2 = step2.recommendedProducts[0]
    
    if (!product1 || !product2) return false
    
    return product1.catalogId === product2.catalogId || 
           product1.name === product2.name
  }
  
  /**
   * Fusionne plusieurs étapes similaires en une seule
   */
  private static mergeSteps(baseStep: UnifiedRoutineStep, similarSteps: UnifiedRoutineStep[]): UnifiedRoutineStep {
    const allSteps = [baseStep, ...similarSteps]
    
    // Fusionner les timings
    const timings = allSteps.map(s => s.timeOfDay)
    const mergedTimeOfDay = timings.includes('morning') && timings.includes('evening') 
      ? 'both' 
      : baseStep.timeOfDay
    
    // Fusionner les phases (pour marquer l'évolution)
    const phases = [...new Set(allSteps.map(s => s.phase))]
    const isEvolutive = phases.length > 1
    
    // Fusionner les conseils d'application
    const mergedAdvice = allSteps
      .map(s => s.applicationAdvice)
      .filter((advice, index, arr) => arr.indexOf(advice) === index) // Déduplication
      .join(' | ')
    
    return {
      ...baseStep,
      title: this.generateMergedTitle(baseStep, similarSteps),
      timeOfDay: mergedTimeOfDay,
      applicationAdvice: mergedAdvice,
      timingBadge: this.generateMergedTimingBadge(mergedTimeOfDay, baseStep.frequency),
      isEvolutive,
      evolutivePhases: isEvolutive ? phases as any[] : undefined,
      
      // Conserver le stepNumber le plus petit
      stepNumber: Math.min(...allSteps.map(s => s.stepNumber))
    }
  }
  
  // === MÉTHODES UTILITAIRES DE MAPPING ===
  
  private static mapCareTypeToCategory(careType: string): UnifiedRoutineStep['category'] {
    const mapping = {
      'nettoyage': 'cleansing',
      'traitement': 'treatment', 
      'hydratation': 'hydration',
      'protection': 'protection',
      'exfoliation': 'exfoliation',
      'masque': 'treatment'
    } as const
    
    return mapping[careType as keyof typeof mapping] || 'treatment'
  }
  
  private static mapCareTypeToTreatmentType(careType: string): UnifiedRoutineStep['treatmentType'] {
    const mapping = {
      'nettoyage': 'cleansing',
      'traitement': 'treatment',
      'hydratation': 'moisturizing', 
      'protection': 'protection',
      'exfoliation': 'treatment',
      'masque': 'treatment'
    } as const
    
    return mapping[careType as keyof typeof mapping] || 'treatment'
  }
  
  private static mapTimingToTimeOfDay(timing: string): UnifiedRoutineStep['timeOfDay'] {
    if (timing === 'both' || (timing.includes('matin') && timing.includes('soir'))) {
      return 'both'
    }
    if (timing.includes('matin')) return 'morning'
    if (timing.includes('soir')) return 'evening'
    return 'both' // Fallback
  }
  
  private static mapFrequencyToStandard(frequency: string): UnifiedRoutineStep['frequency'] {
    if (frequency.includes('daily') || frequency.includes('quotidien')) return 'daily'
    if (frequency.includes('weekly') || frequency.includes('semaine')) return 'weekly'
    if (frequency.includes('progressive') || frequency.includes('progressif')) return 'progressive'
    return 'daily' // Fallback
  }
  
  private static getPhasePriority(phase: string): number {
    const priorities = { immediate: 1, adaptation: 2, maintenance: 3 }
    return priorities[phase as keyof typeof priorities] || 2
  }
  
  // === GÉNÉRATION DE MÉTADONNÉES D'AFFICHAGE ===
  
  private static generateTitle(step: EnrichedRoutineStep, phase: string): string {
    const phaseLabels = {
      immediate: 'Phase Immédiate',
      adaptation: 'Phase Adaptation', 
      maintenance: 'Phase Maintenance'
    }
    
    return step.displayTitle || 
           `${step.careType} - ${phaseLabels[phase as keyof typeof phaseLabels]}`
  }
  
  private static generateMergedTitle(baseStep: UnifiedRoutineStep, similarSteps: UnifiedRoutineStep[]): string {
    // Utiliser le displayTitle du produit ou générer un titre unifié
    const product = baseStep.recommendedProducts[0]
    if (product) {
      return `${product.name} (matin et soir)`
    }
    
    return baseStep.title.replace(/ - Phase \w+/, '') + ' (quotidien)'
  }
  
  private static generateTimingBadge(
    step: EnrichedRoutineStep, 
    timeOfDay: UnifiedRoutineStep['timeOfDay'],
    frequency: UnifiedRoutineStep['frequency']
  ): string {
    const timeIcons = {
      morning: '🌅',
      evening: '🌙', 
      both: '🌅🌙'
    }
    
    const freqLabels = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      progressive: 'Progressif'
    }
    
    return `${freqLabels[frequency]} ${timeIcons[timeOfDay]}`
  }
  
  private static generateMergedTimingBadge(
    timeOfDay: UnifiedRoutineStep['timeOfDay'],
    frequency: UnifiedRoutineStep['frequency']
  ): string {
    const timeIcons = {
      morning: '🌅',
      evening: '🌙',
      both: '🌅🌙'
    }
    
    return `Quotidien ${timeIcons[timeOfDay]}`
  }
  
  private static generateTimingDetails(step: EnrichedRoutineStep): string {
    const details = []
    
    if (step.frequency && step.frequency !== 'daily') {
      details.push(step.frequency)
    }
    
    if (step.introduceFromWeek > 0) {
      details.push(`À partir de la semaine ${step.introduceFromWeek + 1}`)
    }
    
    if (step.restrictions && step.restrictions.length > 0) {
      details.push(step.restrictions.join(', '))
    }
    
    return details.join(' | ')
  }
  
  private static generateFrequencyDetails(step: EnrichedRoutineStep): string {
    if (step.progressiveIntroduction) {
      return step.progressiveIntroduction
    }
    
    if (step.frequency === 'progressive') {
      return 'Commencer 2-3 fois par semaine puis quotidien'
    }
    
    return ''
  }
  
  private static generateDisplayMetadata(step: EnrichedRoutineStep, phase: string) {
    return {
      // Badges à afficher
      showTemporaryBadge: step.isTemporary,
      showPhaseBadge: phase !== 'maintenance',
      showDurationBadge: step.applicationDuration !== 'continu',
      
      // Métadonnées pour l'affichage conditionnel
      isTemporary: step.isTemporary,
      phaseLabel: phase,
      durationLabel: step.applicationDuration,
      benefitLabel: step.targetBenefit
    }
  }
}

/**
 * Fonction utilitaire pour transformer rapidement une routine
 * Compatible avec l'API existante
 */
export function transformRoutineToUnified(
  routineData: unknown,
  productsData?: any[]
): UnifiedRoutineStep[] {
  return RoutineTransformer.transformToUnified(routineData, productsData)
}

/**
 * Types pour les métadonnées d'affichage générées
 */
export interface DisplayMetadata {
  showTemporaryBadge: boolean
  showPhaseBadge: boolean  
  showDurationBadge: boolean
  isTemporary: boolean
  phaseLabel: string
  durationLabel: string
  benefitLabel: string
}
