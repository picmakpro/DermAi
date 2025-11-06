import { 
  PureDiagnostic, 
  PersonalizedRoutine, 
  ProductSelection, 
  CompleteAnalysisV2,
  InterStepCoherence,
  QualityMetrics
} from '@/schemas/v2'
import { Logger } from '@/utils/Logger'

/**
 * Service d'assemblage et validation pour l'architecture V2
 * 
 * ÉTAPE 4: Assemblage algorithmique avec validation de cohérence inter-étapes
 */
export class AssemblyAndValidationService {
  private static logger = Logger.getInstance('AssemblyValidationV2')

  /**
   * Assembler l'analyse complète avec validation de cohérence
   */
  static async assembleCompleteAnalysis(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine, 
    products: ProductSelection
  ): Promise<CompleteAnalysisV2> {
    
    this.logger.info('🎯 Démarrage assemblage et validation V2')

    // 1. Validation cohérence inter-étapes
    const coherenceValidation = this.validateInterStepCoherence(diagnostic, routine, products)
    
    // 2. Calcul métriques de qualité
    const qualityMetrics = this.calculateQualityMetrics(diagnostic, routine, products, coherenceValidation)
    
    // 3. Assemblage final
    const completeAnalysis: CompleteAnalysisV2 = {
      id: this.generateAnalysisId(),
      diagnostic,
      routine,
      products,
      coherenceValidation,
      qualityMetrics,
      generatedAt: new Date(),
      version: '2.0'
    }

    this.logger.info('✅ Assemblage V2 terminé', {
      coherenceScore: coherenceValidation.overallScore,
      qualityScore: qualityMetrics.overallQuality,
      issuesCount: coherenceValidation.issuesFound.length
    })

    return completeAnalysis
  }

  /**
   * Valider la cohérence entre toutes les étapes
   */
  private static validateInterStepCoherence(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine,
    products: ProductSelection
  ): InterStepCoherence {
    const issues: string[] = []
    let overallScore = 100

    // Vérifier cohérence des zones
    const zonesCoherent = this.validateZonesCoherence(diagnostic, routine, products)
    if (!zonesCoherent) {
      issues.push('Incohérence zones diagnostic vs routine vs produits')
      overallScore -= 20
    }

    // Vérifier que les problèmes diagnostiqués sont traités
    const problemsCovered = this.validateProblemsCoverage(diagnostic, routine)
    if (problemsCovered < 0.8) {
      issues.push('Problèmes diagnostiqués insuffisamment traités par la routine')
      overallScore -= 15
    }

    // Vérifier respect du budget
    const budgetRespected = products.budgetBreakdown.budgetRespected
    if (!budgetRespected) {
      issues.push('Budget utilisateur dépassé')
      overallScore -= 25
    }

    // Vérifier correspondance routine-produits
    const routineProductsMatch = this.validateRoutineProductsMatch(routine, products)
    if (!routineProductsMatch) {
      issues.push('Correspondance routine-produits incohérente')
      overallScore -= 20
    }

    // Vérifier timing logique
    const timingLogical = this.validateTimingLogic(routine, products)
    if (!timingLogical) {
      issues.push('Timing d\'application incohérent')
      overallScore -= 10
    }

    const recommendations = this.generateCoherenceRecommendations(issues)

    return {
      overallScore: Math.max(0, overallScore),
      zonesCoherent,
      problemsCovered,
      budgetRespected,
      issuesFound: issues,
      recommendations
    }
  }

  /**
   * Calculer les métriques de qualité globales
   */
  private static calculateQualityMetrics(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine,
    products: ProductSelection,
    coherence: InterStepCoherence
  ): QualityMetrics {
    
    // Score de personnalisation (variabilité vs template générique)
    const personalizationScore = this.calculatePersonalizationScore(diagnostic, routine, products)
    
    // Score de cohérence (déjà calculé)
    const coherenceScore = coherence.overallScore
    
    // Score de complétude (couverture des besoins)
    const completenessScore = this.calculateCompletenessScore(diagnostic, routine, products)
    
    // Score global pondéré
    const overallQuality = Math.round(
      (personalizationScore * 0.4) + 
      (coherenceScore * 0.3) + 
      (completenessScore * 0.3)
    )

    return {
      personalizationScore,
      coherenceScore,
      completenessScore,
      overallQuality
    }
  }

  /**
   * Valider cohérence des zones entre diagnostic, routine et produits
   */
  private static validateZonesCoherence(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine,
    products: ProductSelection
  ): boolean {
    const diagnosticZones = new Set(diagnostic.zoneSpecificIssues.map(z => z.zone))
    
    const routineZones = new Set()
    Object.values(routine.phases).forEach(phase => {
      phase.steps.forEach(step => {
        step.targetZones?.forEach(zone => routineZones.add(zone))
      })
    })

    const productZones = new Set()
    products.selectedProducts.forEach(product => {
      product.targetZones.forEach(zone => productZones.add(zone))
    })

    // Vérifier qu'il y a un overlap significatif
    return this.hasSignificantOverlap(diagnosticZones, routineZones) &&
           this.hasSignificantOverlap(routineZones, productZones)
  }

  /**
   * Valider que les problèmes diagnostiqués sont couverts par la routine
   */
  private static validateProblemsCoverage(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine
  ): number {
    const diagnosticProblems = diagnostic.zoneSpecificIssues.map(z => z.problem.toLowerCase())
    
    const routineTargets = new Set<string>()
    Object.values(routine.phases).forEach(phase => {
      phase.steps.forEach(step => {
        if (step.targetProblem) {
          routineTargets.add(step.targetProblem.toLowerCase())
        }
      })
    })

    const coveredProblems = diagnosticProblems.filter(problem => 
      Array.from(routineTargets).some(target => 
        target.includes(problem) || problem.includes(target)
      )
    )

    return diagnosticProblems.length > 0 ? coveredProblems.length / diagnosticProblems.length : 1
  }

  /**
   * Valider correspondance entre étapes routine et produits sélectionnés
   */
  private static validateRoutineProductsMatch(
    routine: PersonalizedRoutine,
    products: ProductSelection
  ): boolean {
    const totalRoutineSteps = Object.values(routine.phases).reduce(
      (total, phase) => total + phase.steps.length, 0
    )
    
    const productStepIds = new Set(products.selectedProducts.map(p => p.routineStepId))
    
    // Au moins 80% des étapes doivent avoir un produit correspondant
    return productStepIds.size >= totalRoutineSteps * 0.8
  }

  /**
   * Valider cohérence du timing d'application
   */
  private static validateTimingLogic(
    routine: PersonalizedRoutine,
    products: ProductSelection
  ): boolean {
    // Vérifier que les timings des produits correspondent aux étapes de routine
    const routineTimings = new Set<string>()
    Object.values(routine.phases).forEach(phase => {
      phase.steps.forEach(step => {
        routineTimings.add(step.timing)
      })
    })

    const productTimings = products.selectedProducts.map(p => p.timing.toLowerCase())
    
    // Vérification basique de cohérence
    return productTimings.every(timing => 
      timing.includes('matin') || 
      timing.includes('soir') || 
      timing.includes('quotidien') ||
      timing.includes('hebdo')
    )
  }

  /**
   * Calculer score de personnalisation
   */
  private static calculatePersonalizationScore(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine,
    products: ProductSelection
  ): number {
    let score = 100

    // Pénaliser si routine trop générique
    const totalSteps = Object.values(routine.phases).reduce((total, phase) => total + phase.steps.length, 0)
    if (totalSteps === 9) { // Pattern fixe détecté
      score -= 30
    }

    // Bonus si adaptation aux problèmes spécifiques
    if (diagnostic.zoneSpecificIssues.length > 0) {
      const adaptedSteps = Object.values(routine.phases).reduce((count, phase) => 
        count + phase.steps.filter(step => step.targetProblem).length, 0
      )
      if (adaptedSteps > 0) {
        score += 10
      }
    }

    // Bonus si justifications produits personnalisées
    const personalizedJustifications = products.selectedProducts.filter(p => 
      p.justification.length > 50 && !p.justification.includes('générique')
    ).length
    
    if (personalizedJustifications > products.selectedProducts.length * 0.8) {
      score += 10
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Calculer score de complétude
   */
  private static calculateCompletenessScore(
    diagnostic: PureDiagnostic,
    routine: PersonalizedRoutine,
    products: ProductSelection
  ): number {
    let score = 100

    // Vérifier couverture des 3 phases
    const phases = ['immediate', 'adaptation', 'maintenance'] as const
    const missingPhases = phases.filter(phase => routine.phases[phase].steps.length === 0)
    score -= missingPhases.length * 20

    // Vérifier couverture des besoins de base (nettoyage, hydratation, protection)
    const basicCareTypes = ['nettoyage', 'hydratation', 'protection']
    const coveredCareTypes = new Set<string>()
    Object.values(routine.phases).forEach(phase => {
      phase.steps.forEach(step => {
        coveredCareTypes.add(step.careType)
      })
    })

    const missingBasicCare = basicCareTypes.filter(care => !coveredCareTypes.has(care))
    score -= missingBasicCare.length * 15

    return Math.max(0, score)
  }

  /**
   * Vérifier overlap significatif entre deux sets
   */
  private static hasSignificantOverlap<T>(set1: Set<T>, set2: Set<T>): boolean {
    if (set1.size === 0 || set2.size === 0) return true // Pas de contrainte si vide
    
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    return intersection.size > 0
  }

  /**
   * Générer recommandations basées sur les problèmes détectés
   */
  private static generateCoherenceRecommendations(issues: string[]): string[] {
    const recommendations: string[] = []

    if (issues.some(issue => issue.includes('zones'))) {
      recommendations.push('Vérifier la correspondance entre zones diagnostiquées et zones traitées')
    }

    if (issues.some(issue => issue.includes('budget'))) {
      recommendations.push('Optimiser la sélection produits pour respecter le budget')
    }

    if (issues.some(issue => issue.includes('problèmes'))) {
      recommendations.push('Adapter la routine pour mieux traiter les problèmes identifiés')
    }

    return recommendations
  }

  /**
   * Générer ID unique pour l'analyse
   */
  private static generateAnalysisId(): string {
    return `analysis_v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
