import { UnifiedRoutineStep } from '@/types'
import { generateProductKey } from './ProductMappingHelpers'

/**
 * SPRINT 2 - REFONTE ROUTINES V2 - ORGANISATION PAR PHASES
 * 
 * PhaseOrganizer - Organise la routine par phase puis horaire avec déduplication intelligente
 * 
 * OBJECTIFS:
 * 1. Organisation hiérarchique : Phase → Horaire (Matin, Soir, Hebdomadaire)
 * 2. Déduplication intelligente des produits continus matin/soir
 * 3. Séparation automatique des soins hebdomadaires
 * 4. Tri par ordre logique d'application
 * 5. Support des nouveaux champs V2 (isTemporary, displayTitle, etc.)
 */

// Interface pour l'organisation par phase et horaire
export interface PhaseOrganization {
  immediate: {
    morning: UnifiedRoutineStep[]
    evening: UnifiedRoutineStep[]
    weekly: UnifiedRoutineStep[]
  }
  adaptation: {
    morning: UnifiedRoutineStep[]
    evening: UnifiedRoutineStep[]
    weekly: UnifiedRoutineStep[]
  }
  maintenance: {
    morning: UnifiedRoutineStep[]
    evening: UnifiedRoutineStep[]
    weekly: UnifiedRoutineStep[]
  }
}

// Interface pour les métadonnées de déduplication
export interface DeduplicationMetadata {
  originalSteps: UnifiedRoutineStep[]
  mergedTimeOfDay: 'morning' | 'evening' | 'both'
  deduplicationReason: string
}

/**
 * Classe principale pour organiser les routines par phase et horaire
 */
export class PhaseOrganizer {
  
  /**
   * Organise une routine par phase puis par horaire avec déduplication
   */
  static organizeByPhaseAndTime(steps: UnifiedRoutineStep[]): PhaseOrganization {
    console.log('🔄 PhaseOrganizer - Début organisation par phase et horaire')
    console.log(`📊 Input: ${steps.length} étapes à organiser`)
    
    // 1. Grouper par phase
    const stepsByPhase = this.groupByPhase(steps)
    
    // 2. Pour chaque phase, organiser par horaire avec déduplication
    const organization: PhaseOrganization = {
      immediate: this.organizePhaseByTime(stepsByPhase.immediate),
      adaptation: this.organizePhaseByTime(stepsByPhase.adaptation),
      maintenance: this.organizePhaseByTime(stepsByPhase.maintenance)
    }
    
    console.log('✅ PhaseOrganizer - Organisation terminée:', {
      immediate: {
        morning: organization.immediate.morning.length,
        evening: organization.immediate.evening.length,
        weekly: organization.immediate.weekly.length
      },
      adaptation: {
        morning: organization.adaptation.morning.length,
        evening: organization.adaptation.evening.length,
        weekly: organization.adaptation.weekly.length
      },
      maintenance: {
        morning: organization.maintenance.morning.length,
        evening: organization.maintenance.evening.length,
        weekly: organization.maintenance.weekly.length
      }
    })
    
    return organization
  }
  
  /**
   * Groupe les étapes par phase
   */
  private static groupByPhase(steps: UnifiedRoutineStep[]): {
    immediate: UnifiedRoutineStep[]
    adaptation: UnifiedRoutineStep[]
    maintenance: UnifiedRoutineStep[]
  } {
    return {
      immediate: steps.filter(s => s.phase === 'immediate'),
      adaptation: steps.filter(s => s.phase === 'adaptation'),
      maintenance: steps.filter(s => s.phase === 'maintenance')
    }
  }
  
  /**
   * Organise une phase par horaire avec déduplication
   */
  private static organizePhaseByTime(phaseSteps: UnifiedRoutineStep[]): {
    morning: UnifiedRoutineStep[]
    evening: UnifiedRoutineStep[]
    weekly: UnifiedRoutineStep[]
  } {
    console.log(`🔄 Organisation horaire pour ${phaseSteps.length} étapes`)
    
    // 1. Séparer les soins hebdomadaires
    const { weeklySteps, dailySteps } = this.separateWeeklySteps(phaseSteps)
    
    // 2. Appliquer déduplication sur les étapes quotidiennes
    const deduplicatedSteps = this.deduplicateWithinPhase(dailySteps)
    
    // 3. Organiser par horaire
    const morningSteps = deduplicatedSteps
      .filter(s => s.timeOfDay === 'morning' || s.timeOfDay === 'both')
      .sort((a, b) => this.getApplicationOrder(a) - this.getApplicationOrder(b))
    
    const eveningSteps = deduplicatedSteps
      .filter(s => s.timeOfDay === 'evening' || s.timeOfDay === 'both')
      .sort((a, b) => this.getApplicationOrder(a) - this.getApplicationOrder(b))
    
    // 4. Trier les soins hebdomadaires
    const sortedWeeklySteps = weeklySteps
      .sort((a, b) => this.getApplicationOrder(a) - this.getApplicationOrder(b))
    
    console.log(`✅ Organisation horaire terminée:`, {
      morning: morningSteps.length,
      evening: eveningSteps.length,
      weekly: sortedWeeklySteps.length,
      deduplication: dailySteps.length - deduplicatedSteps.length
    })
    
    return {
      morning: morningSteps,
      evening: eveningSteps,
      weekly: sortedWeeklySteps
    }
  }
  
  /**
   * Sépare les soins hebdomadaires des soins quotidiens
   */
  private static separateWeeklySteps(steps: UnifiedRoutineStep[]): {
    weeklySteps: UnifiedRoutineStep[]
    dailySteps: UnifiedRoutineStep[]
  } {
    const weeklySteps: UnifiedRoutineStep[] = []
    const dailySteps: UnifiedRoutineStep[] = []
    
    steps.forEach(step => {
      // Critères pour identifier un soin hebdomadaire
      const isWeekly = step.frequency === 'weekly' ||
                      step.timing?.includes('hebdomadaire') ||
                      step.timing?.includes('semaine') ||
                      step.frequencyDetails?.includes('semaine') ||
                      step.category === 'exfoliation' // Les exfoliants sont souvent hebdomadaires
      
      if (isWeekly) {
        weeklySteps.push({
          ...step,
          frequency: 'weekly' // Normaliser
        })
        console.log(`📅 Soin hebdomadaire identifié: ${step.title}`)
      } else {
        dailySteps.push(step)
      }
    })
    
    return { weeklySteps, dailySteps }
  }
  
  /**
   * Applique la déduplication intelligente au sein d'une phase
   */
  private static deduplicateWithinPhase(steps: UnifiedRoutineStep[]): UnifiedRoutineStep[] {
    console.log(`🔄 Déduplication de ${steps.length} étapes`)
    
    const deduplicatedSteps: UnifiedRoutineStep[] = []
    const processedKeys = new Set<string>()
    
    steps.forEach(step => {
      const productKey = generateProductKey(step)
      
      if (processedKeys.has(productKey)) {
        console.log(`🔄 Étape déjà traitée (déduplication): ${step.title}`)
        return
      }
      
      // Chercher des étapes similaires à fusionner
      const similarSteps = this.findSimilarStepsForMerging(step, steps, processedKeys)
      
      if (similarSteps.length > 0) {
        // Fusionner les étapes similaires
        const mergedStep = this.mergeSteps(step, similarSteps)
        deduplicatedSteps.push(mergedStep)
        
        // Marquer toutes les étapes fusionnées comme traitées
        processedKeys.add(productKey)
        similarSteps.forEach(similarStep => {
          const similarKey = generateProductKey(similarStep)
          processedKeys.add(similarKey)
        })
        
        console.log(`🔀 Fusion réalisée: ${step.title} + ${similarSteps.length} étapes similaires`)
      } else {
        // Étape unique, ajouter telle quelle
        deduplicatedSteps.push(step)
        processedKeys.add(productKey)
      }
    })
    
    console.log(`✅ Déduplication terminée: ${steps.length} → ${deduplicatedSteps.length} étapes`)
    
    return deduplicatedSteps
  }
  
  /**
   * Trouve les étapes similaires pouvant être fusionnées
   */
  private static findSimilarStepsForMerging(
    baseStep: UnifiedRoutineStep,
    allSteps: UnifiedRoutineStep[],
    processedKeys: Set<string>
  ): UnifiedRoutineStep[] {
    const baseProductKey = generateProductKey(baseStep)
    
    return allSteps.filter(step => {
      const stepProductKey = generateProductKey(step)
      
      // Ne pas traiter les étapes déjà processées
      if (processedKeys.has(stepProductKey)) return false
      
      // Ne pas fusionner avec soi-même
      if (step === baseStep) return false
      
      // Critères de fusion :
      // 1. Même produit (même catalogId)
      // 2. Même catégorie
      // 3. Timing différent (matin vs soir) pour fusion en 'both'
      // 4. Pas de traitement temporaire (les traitements restent séparés)
      
      const sameProduct = this.haveSameProduct(baseStep, step)
      const sameCategory = step.category === baseStep.category
      const differentTiming = step.timeOfDay !== baseStep.timeOfDay &&
                             step.timeOfDay !== 'both' &&
                             baseStep.timeOfDay !== 'both'
      
      // Vérifier si c'est un produit continu (pas temporaire)
      const isBaseTemporary = (baseStep as any).isTemporary ?? 
                             ['treatment', 'exfoliation'].includes(baseStep.category)
      const isStepTemporary = (step as any).isTemporary ?? 
                             ['treatment', 'exfoliation'].includes(step.category)
      
      const canMerge = sameProduct && sameCategory && differentTiming && 
                      !isBaseTemporary && !isStepTemporary
      
      if (canMerge) {
        console.log(`🔍 Étape fusionnable trouvée: ${step.title} avec ${baseStep.title}`)
      }
      
      return canMerge
    })
  }
  
  /**
   * Vérifie si deux étapes utilisent le même produit
   */
  private static haveSameProduct(step1: UnifiedRoutineStep, step2: UnifiedRoutineStep): boolean {
    const product1 = step1.recommendedProducts[0]
    const product2 = step2.recommendedProducts[0]
    
    if (!product1 || !product2) return false
    
    // Comparer par catalogId d'abord, puis par nom
    return (product1.catalogId && product2.catalogId && product1.catalogId === product2.catalogId) ||
           (product1.name === product2.name && product1.brand === product2.brand)
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
    
    // Fusionner les conseils d'application (déduplication)
    const mergedAdvice = [...new Set(allSteps.map(s => s.applicationAdvice))]
      .filter(Boolean)
      .join(' | ')
    
    // Fusionner les restrictions
    const mergedRestrictions = [...new Set(
      allSteps.flatMap(s => s.restrictions || [])
    )]
    
    // Générer un titre unifié
    const product = baseStep.recommendedProducts[0]
    const mergedTitle = product ? 
      `${product.name} (matin et soir)` : 
      baseStep.title.replace(/ - Phase \w+/, '') + ' (quotidien)'
    
    return {
      ...baseStep,
      title: mergedTitle,
      timeOfDay: mergedTimeOfDay,
      applicationAdvice: mergedAdvice || baseStep.applicationAdvice,
      restrictions: mergedRestrictions,
      
      // Métadonnées de fusion
      isEvolutive: true,
      evolutivePhases: [baseStep.phase], // Même phase, mais timing fusionné
      
      // Badges adaptés
      timingBadge: `Quotidien 🌅🌙`,
      timingDetails: `Matin et soir (${allSteps.length} applications fusionnées)`,
      
      // Conserver le stepNumber le plus petit
      stepNumber: Math.min(...allSteps.map(s => s.stepNumber))
    }
  }
  
  /**
   * Détermine l'ordre d'application des soins
   * Ordre logique : nettoyage → traitement → hydratation → protection
   */
  private static getApplicationOrder(step: UnifiedRoutineStep): number {
    const orderMap = {
      'cleansing': 1,
      'treatment': 2,
      'hydration': 3,
      'protection': 4,
      'exfoliation': 2.5 // Entre traitement et hydratation
    }
    
    return orderMap[step.category] || 3 // Fallback au milieu
  }
  
  /**
   * Utilitaire : Compte le nombre total d'étapes dans une organisation
   */
  static countTotalSteps(organization: PhaseOrganization): number {
    return Object.values(organization).reduce((total, phase) => {
      return total + phase.morning.length + phase.evening.length + phase.weekly.length
    }, 0)
  }
  
  /**
   * Utilitaire : Extrait tous les catalogIds d'une organisation
   */
  static extractCatalogIds(organization: PhaseOrganization): string[] {
    const catalogIds = new Set<string>()
    
    Object.values(organization).forEach(phase => {
      [...phase.morning, ...phase.evening, ...phase.weekly].forEach(step => {
        step.recommendedProducts.forEach(product => {
          if (product.catalogId) {
            catalogIds.add(product.catalogId)
          }
        })
      })
    })
    
    return Array.from(catalogIds)
  }
  
  /**
   * Utilitaire : Valide qu'une organisation est cohérente
   */
  static validateOrganization(organization: PhaseOrganization): {
    isValid: boolean
    issues: string[]
  } {
    const issues: string[] = []
    
    // Vérifier que chaque phase a au moins un nettoyage et une hydratation
    Object.entries(organization).forEach(([phaseName, phase]) => {
      const allSteps = [...phase.morning, ...phase.evening, ...phase.weekly]
      
      const hasCleanser = allSteps.some(s => s.category === 'cleansing')
      const hasMoisturizer = allSteps.some(s => s.category === 'hydration')
      
      if (!hasCleanser) {
        issues.push(`Phase ${phaseName} manque un nettoyant`)
      }
      if (!hasMoisturizer) {
        issues.push(`Phase ${phaseName} manque un hydratant`)
      }
    })
    
    // Vérifier qu'il n'y a pas de doublons
    const allCatalogIds = this.extractCatalogIds(organization)
    const uniqueCatalogIds = new Set(allCatalogIds)
    if (allCatalogIds.length !== uniqueCatalogIds.size) {
      issues.push('Doublons de produits détectés dans l\'organisation')
    }
    
    return {
      isValid: issues.length === 0,
      issues
    }
  }
}

/**
 * Fonction utilitaire pour organiser rapidement une routine
 */
export function organizeRoutineByPhaseAndTime(steps: UnifiedRoutineStep[]): PhaseOrganization {
  return PhaseOrganizer.organizeByPhaseAndTime(steps)
}

/**
 * Types d'export pour l'utilisation dans d'autres composants
 */
export type { PhaseOrganization, DeduplicationMetadata }

