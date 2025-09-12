/**
 * COHERENCE VALIDATOR - SPRINT 3 QUALITÉ DERMAI V2
 * Validation cohérence diagnostic ↔ produits ↔ budget utilisateur
 */

import type { SkinAnalysis, BeautyAssessment, ProductRecommendations, UnifiedRoutineStep } from '@/types'
import type { AnalyzeRequest } from '@/types/api'
import { logger } from '@/utils/Logger'

export interface CoherenceCheck {
  zonesMatch: boolean        // zones diagnostic = zones produits
  intensityMatch: boolean    // intensité = potency produits
  budgetRespected: boolean   // prix total ≤ budget utilisateur
  overallCoherent: boolean   // cohérence globale
  issues: string[]           // Liste des incohérences détectées
  score: number             // Score de cohérence 0-100
}

export interface CoherenceReport {
  requestId: string
  coherenceCheck: CoherenceCheck
  corrections: CoherenceCorrection[]
  finalScore: number
  timestamp: Date
}

export interface CoherenceCorrection {
  type: 'zone' | 'intensity' | 'budget' | 'product'
  issue: string
  correction: string
  impact: 'low' | 'medium' | 'high'
}

export interface ProductPricing {
  catalogId: string
  estimatedPrice: number
  category: string
  potency: 'low' | 'medium' | 'high'
}

export class CoherenceValidator {
  
  /**
   * Valide la cohérence complète d'une analyse
   */
  static validateAnalysis(
    request: AnalyzeRequest,
    analysis: SkinAnalysis,
    requestId?: string
  ): CoherenceReport {
    const startTime = Date.now()
    const rid = requestId || 'coherence_validation'
    
    logger.info('🔍 Démarrage validation cohérence', { requestId: rid })
    
    const coherenceCheck = this.performCoherenceCheck(request, analysis)
    const corrections = this.generateCorrections(coherenceCheck, request, analysis)
    const finalScore = this.calculateFinalScore(coherenceCheck, corrections)
    
    const report: CoherenceReport = {
      requestId: rid,
      coherenceCheck,
      corrections,
      finalScore,
      timestamp: new Date()
    }
    
    const duration = Date.now() - startTime
    logger.info('✅ Validation cohérence terminée', { requestId: rid }, {
      duration,
      finalScore,
      issuesCount: coherenceCheck.issues.length,
      correctionsCount: corrections.length
    })
    
    return report
  }
  
  /**
   * Effectue les vérifications de cohérence
   */
  private static performCoherenceCheck(
    request: AnalyzeRequest,
    analysis: SkinAnalysis
  ): CoherenceCheck {
    const issues: string[] = []
    
    // 1. Vérification cohérence zones
    const zonesMatch = this.validateZonesCoherence(
      analysis.beautyAssessment,
      analysis.recommendations,
      issues
    )
    
    // 2. Vérification cohérence intensité
    const intensityMatch = this.validateIntensityCoherence(
      analysis.beautyAssessment,
      analysis.recommendations,
      issues
    )
    
    // 3. Vérification respect budget
    const budgetRespected = this.validateBudgetCoherence(
      request.currentRoutine.monthlyBudget,
      analysis.recommendations,
      issues
    )
    
    // 4. Calcul cohérence globale
    const overallCoherent = zonesMatch && intensityMatch && budgetRespected
    
    // 5. Calcul score de cohérence
    const score = this.calculateCoherenceScore(zonesMatch, intensityMatch, budgetRespected, issues.length)
    
    return {
      zonesMatch,
      intensityMatch,
      budgetRespected,
      overallCoherent,
      issues,
      score
    }
  }
  
  /**
   * Valide la cohérence des zones diagnostic ↔ produits
   */
  private static validateZonesCoherence(
    assessment: BeautyAssessment,
    recommendations: ProductRecommendations,
    issues: string[]
  ): boolean {
    // Extraire zones du diagnostic
    const diagnosticZones = new Set([
      ...assessment.concernedZones,
      ...assessment.zoneSpecific.map(z => z.zone)
    ])
    
    // Extraire zones des produits (via routine)
    const productZones = new Set<string>()
    
    // Analyser routine immédiate
    recommendations.routine.immediate.forEach(step => {
      if (step.application && step.application.toLowerCase().includes('zone')) {
        // Extraire zones mentionnées dans l'application
        const zones = this.extractZonesFromText(step.application)
        zones.forEach(zone => productZones.add(zone))
      }
    })
    
    // Analyser routine localisée
    recommendations.localizedRoutine.forEach(step => {
      if (step.targetZone) {
        productZones.add(step.targetZone)
      }
    })
    
    // Vérifier overlap des zones
    const hasOverlap = this.hasSetOverlap(diagnosticZones, productZones)
    
    if (!hasOverlap && diagnosticZones.size > 0) {
      issues.push(`Incohérence zones: diagnostic [${Array.from(diagnosticZones).join(', ')}] vs produits [${Array.from(productZones).join(', ')}]`)
      return false
    }
    
    return true
  }
  
  /**
   * Valide la cohérence intensité problème ↔ potency produits
   */
  private static validateIntensityCoherence(
    assessment: BeautyAssessment,
    recommendations: ProductRecommendations,
    issues: string[]
  ): boolean {
    const diagnosticIntensity = assessment.intensity
    
    // Analyser la potency des produits recommandés
    const productPotencies = this.analyzeProductPotencies(recommendations)
    
    // Règles de cohérence intensité ↔ potency
    const coherenceRules = {
      'légère': ['low', 'medium'],
      'modérée': ['medium', 'high'],
      'intense': ['high']
    }
    
    const allowedPotencies = coherenceRules[diagnosticIntensity as keyof typeof coherenceRules] || ['medium']
    
    // Vérifier si au moins 70% des produits ont une potency appropriée
    const appropriateProducts = productPotencies.filter(p => 
      allowedPotencies.includes(p.potency)
    )
    
    const coherenceRatio = appropriateProducts.length / Math.max(productPotencies.length, 1)
    
    if (coherenceRatio < 0.7) {
      issues.push(`Incohérence intensité: diagnostic "${diagnosticIntensity}" mais ${Math.round((1-coherenceRatio)*100)}% produits inadaptés`)
      return false
    }
    
    return true
  }
  
  /**
   * Valide le respect du budget utilisateur
   */
  private static validateBudgetCoherence(
    userBudget: string,
    recommendations: ProductRecommendations,
    issues: string[]
  ): boolean {
    // Parser le budget utilisateur
    const budgetRange = this.parseBudgetRange(userBudget)
    if (!budgetRange) {
      issues.push(`Budget utilisateur invalide: "${userBudget}"`)
      return false
    }
    
    // Estimer le coût total des recommandations
    const totalCost = this.estimateTotalCost(recommendations)
    
    // Vérifier si le coût est dans la fourchette (avec marge de 20%)
    const maxBudget = budgetRange.max * 1.2 // Marge de 20%
    
    if (totalCost > maxBudget) {
      issues.push(`Budget dépassé: ${totalCost}€ recommandés pour budget max ${budgetRange.max}€`)
      return false
    }
    
    // Vérifier qu'on n'est pas trop en dessous non plus (min 50% du budget min)
    const minBudget = budgetRange.min * 0.5
    if (totalCost < minBudget) {
      issues.push(`Recommandations trop économiques: ${totalCost}€ pour budget min ${budgetRange.min}€`)
      return false
    }
    
    return true
  }
  
  /**
   * Génère des corrections automatiques
   */
  private static generateCorrections(
    coherenceCheck: CoherenceCheck,
    request: AnalyzeRequest,
    analysis: SkinAnalysis
  ): CoherenceCorrection[] {
    const corrections: CoherenceCorrection[] = []
    
    // Corrections pour zones incohérentes
    if (!coherenceCheck.zonesMatch) {
      corrections.push({
        type: 'zone',
        issue: 'Zones diagnostic et produits incohérentes',
        correction: 'Ajuster les zones ciblées par les produits selon le diagnostic',
        impact: 'high'
      })
    }
    
    // Corrections pour intensité incohérente
    if (!coherenceCheck.intensityMatch) {
      corrections.push({
        type: 'intensity',
        issue: 'Intensité diagnostic et potency produits incohérentes',
        correction: 'Adapter la sélection produits selon l\'intensité diagnostiquée',
        impact: 'high'
      })
    }
    
    // Corrections pour budget dépassé
    if (!coherenceCheck.budgetRespected) {
      corrections.push({
        type: 'budget',
        issue: 'Budget utilisateur non respecté',
        correction: 'Proposer des alternatives dans la gamme de prix appropriée',
        impact: 'medium'
      })
    }
    
    return corrections
  }
  
  /**
   * Calcule le score final de cohérence
   */
  private static calculateFinalScore(
    coherenceCheck: CoherenceCheck,
    corrections: CoherenceCorrection[]
  ): number {
    let score = coherenceCheck.score
    
    // Pénalité pour corrections nécessaires
    const highImpactCorrections = corrections.filter(c => c.impact === 'high').length
    const mediumImpactCorrections = corrections.filter(c => c.impact === 'medium').length
    
    score -= highImpactCorrections * 15
    score -= mediumImpactCorrections * 8
    
    return Math.max(0, Math.min(100, score))
  }
  
  /**
   * Calcule le score de cohérence de base
   */
  private static calculateCoherenceScore(
    zonesMatch: boolean,
    intensityMatch: boolean,
    budgetRespected: boolean,
    issuesCount: number
  ): number {
    let score = 100
    
    // Pénalités principales
    if (!zonesMatch) score -= 30
    if (!intensityMatch) score -= 25
    if (!budgetRespected) score -= 20
    
    // Pénalité pour nombre d'issues
    score -= Math.min(issuesCount * 5, 25)
    
    return Math.max(0, score)
  }
  
  /**
   * Utilitaires privés
   */
  
  private static extractZonesFromText(text: string): string[] {
    const zones = ['visage', 'front', 'joues', 'nez', 'menton', 'contour des yeux', 'lèvres', 'cou']
    return zones.filter(zone => 
      text.toLowerCase().includes(zone.toLowerCase())
    )
  }
  
  private static hasSetOverlap<T>(set1: Set<T>, set2: Set<T>): boolean {
    for (const item of set1) {
      if (set2.has(item)) return true
    }
    return false
  }
  
  private static analyzeProductPotencies(recommendations: ProductRecommendations): ProductPricing[] {
    const products: ProductPricing[] = []
    
    // Analyser routine immédiate
    recommendations.routine.immediate.forEach(step => {
      const potency = this.estimateProductPotency(step)
      const price = this.estimateProductPrice(step.catalogId, step.name)
      
      products.push({
        catalogId: step.catalogId,
        estimatedPrice: price,
        category: this.categorizeProduct(step.name),
        potency
      })
    })
    
    return products
  }
  
  private static estimateProductPotency(step: UnifiedRoutineStep): 'low' | 'medium' | 'high' {
    const name = step.name.toLowerCase()
    const application = step.application?.toLowerCase() || ''
    
    // Produits haute potency
    if (name.includes('retinol') || name.includes('tretinoin') || 
        name.includes('glycolic') || name.includes('salicylic') ||
        application.includes('actif puissant')) {
      return 'high'
    }
    
    // Produits faible potency
    if (name.includes('gentle') || name.includes('doux') || 
        name.includes('sensitive') || name.includes('hydratant') ||
        application.includes('doux')) {
      return 'low'
    }
    
    // Par défaut medium
    return 'medium'
  }
  
  private static estimateProductPrice(catalogId: string, productName: string): number {
    // Estimation basée sur les patterns de catalogId et nom
    // En production, ceci devrait interroger la vraie base de prix
    
    const name = productName.toLowerCase()
    
    // Marques premium
    if (name.includes('la mer') || name.includes('sk-ii') || name.includes('sisley')) {
      return 150
    }
    
    // Marques mid-range
    if (name.includes('clinique') || name.includes('estée lauder') || name.includes('kiehl')) {
      return 60
    }
    
    // Marques accessibles
    if (name.includes('cerave') || name.includes('neutrogena') || name.includes('ordinary')) {
      return 25
    }
    
    // Par défaut
    return 40
  }
  
  private static categorizeProduct(productName: string): string {
    const name = productName.toLowerCase()
    
    if (name.includes('nettoyant') || name.includes('cleanser')) return 'cleanser'
    if (name.includes('sérum') || name.includes('serum')) return 'serum'
    if (name.includes('crème') || name.includes('moisturizer')) return 'moisturizer'
    if (name.includes('protection') || name.includes('spf')) return 'sunscreen'
    
    return 'treatment'
  }
  
  private static parseBudgetRange(budget: string): { min: number; max: number } | null {
    // Parser les formats: "50-100€", "moins de 50€", "plus de 100€"
    
    if (budget.includes('-')) {
      const match = budget.match(/(\d+)-(\d+)/)
      if (match) {
        return { min: parseInt(match[1]), max: parseInt(match[2]) }
      }
    }
    
    if (budget.includes('moins de')) {
      const match = budget.match(/moins de (\d+)/)
      if (match) {
        return { min: 0, max: parseInt(match[1]) }
      }
    }
    
    if (budget.includes('plus de')) {
      const match = budget.match(/plus de (\d+)/)
      if (match) {
        return { min: parseInt(match[1]), max: 500 } // Cap raisonnable
      }
    }
    
    // Formats par défaut
    const budgetMap: Record<string, { min: number; max: number }> = {
      '0-50€': { min: 0, max: 50 },
      '50-100€': { min: 50, max: 100 },
      '100-200€': { min: 100, max: 200 },
      '200€+': { min: 200, max: 500 }
    }
    
    return budgetMap[budget] || null
  }
  
  private static estimateTotalCost(recommendations: ProductRecommendations): number {
    let total = 0
    
    // Coût routine immédiate
    recommendations.routine.immediate.forEach(step => {
      total += this.estimateProductPrice(step.catalogId, step.name)
    })
    
    // Coût routine adaptation (pondéré à 50% car pas immédiat)
    recommendations.routine.adaptation.forEach(step => {
      total += this.estimateProductPrice(step.catalogId, step.name) * 0.5
    })
    
    return Math.round(total)
  }
  
  /**
   * Métriques de cohérence pour monitoring
   */
  static getCoherenceMetrics(reports: CoherenceReport[]): CoherenceMetrics {
    const totalReports = reports.length
    if (totalReports === 0) {
      return {
        totalValidations: 0,
        avgCoherenceScore: 0,
        zonesCoherenceRate: 0,
        intensityCoherenceRate: 0,
        budgetCoherenceRate: 0,
        overallCoherenceRate: 0,
        avgCorrections: 0,
        issueTypes: {}
      }
    }
    
    const avgCoherenceScore = reports.reduce((sum, r) => sum + r.finalScore, 0) / totalReports
    const zonesCoherenceRate = reports.filter(r => r.coherenceCheck.zonesMatch).length / totalReports
    const intensityCoherenceRate = reports.filter(r => r.coherenceCheck.intensityMatch).length / totalReports
    const budgetCoherenceRate = reports.filter(r => r.coherenceCheck.budgetRespected).length / totalReports
    const overallCoherenceRate = reports.filter(r => r.coherenceCheck.overallCoherent).length / totalReports
    const avgCorrections = reports.reduce((sum, r) => sum + r.corrections.length, 0) / totalReports
    
    // Compter les types d'issues
    const issueTypes = reports.reduce((acc, r) => {
      r.coherenceCheck.issues.forEach(issue => {
        const type = this.classifyIssueType(issue)
        acc[type] = (acc[type] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalValidations: totalReports,
      avgCoherenceScore,
      zonesCoherenceRate,
      intensityCoherenceRate,
      budgetCoherenceRate,
      overallCoherenceRate,
      avgCorrections,
      issueTypes
    }
  }
  
  private static classifyIssueType(issue: string): string {
    if (issue.includes('zones')) return 'zones_mismatch'
    if (issue.includes('intensité')) return 'intensity_mismatch'
    if (issue.includes('budget')) return 'budget_violation'
    return 'other'
  }
}

export interface CoherenceMetrics {
  totalValidations: number
  avgCoherenceScore: number
  zonesCoherenceRate: number
  intensityCoherenceRate: number
  budgetCoherenceRate: number
  overallCoherenceRate: number
  avgCorrections: number
  issueTypes: Record<string, number>
}
