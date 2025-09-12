/**
 * FALLBACK STRATEGY - SPRINT 2 ROBUSTESSE DERMAI V2
 * Génération intelligente de fallback basé sur profil statistique utilisateur
 */

import type { SkinAnalysis, SkinScores, BeautyAssessment, ProductRecommendations, AnalyzeRequest } from '@/types'

export interface FallbackResult<T> {
  data: T
  source: 'primary' | 'fallback'
  degraded: boolean
  primaryError?: string
  confidence: number
  fallbackReason: string
}

export interface StatisticalProfile {
  ageGroup: 'young' | 'adult' | 'mature' | 'senior'
  skinTypeCategory: 'dry' | 'normal' | 'combination' | 'oily' | 'sensitive'
  concernsCategory: 'basic' | 'moderate' | 'advanced'
  expectedScoreRange: { min: number; max: number }
}

export class FallbackStrategy {
  
  /**
   * Génère un diagnostic de fallback basé sur le profil statistique
   */
  static generateDiagnosticFallback(
    request: AnalyzeRequest,
    primaryError: string
  ): FallbackResult<SkinAnalysis> {
    console.log('🔄 Génération fallback diagnostic pour:', {
      age: request.userProfile.age,
      skinType: request.userProfile.skinType,
      concerns: request.skinConcerns.primary,
      error: primaryError
    })
    
    // Analyser le profil utilisateur
    const profile = this.analyzeUserProfile(request)
    
    // Générer scores statistiques réalistes
    const scores = this.generateStatisticalScores(profile, request)
    
    // Générer assessment basé sur le profil
    const beautyAssessment = this.generateStatisticalAssessment(profile, request)
    
    // Générer recommandations de base
    const recommendations = this.generateBasicRecommendations(profile, request)
    
    const fallbackAnalysis: SkinAnalysis = {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'temp-user',
      photos: request.photos,
      scores,
      beautyAssessment,
      recommendations,
      createdAt: new Date()
    }
    
    return {
      data: fallbackAnalysis,
      source: 'fallback',
      degraded: true,
      primaryError,
      confidence: this.calculateFallbackConfidence(profile),
      fallbackReason: this.getFallbackReason(primaryError)
    }
  }
  
  /**
   * Analyse le profil utilisateur pour déterminer la catégorie statistique
   */
  private static analyzeUserProfile(request: AnalyzeRequest): StatisticalProfile {
    // Catégorisation par âge
    const age = request.userProfile.age
    let ageGroup: StatisticalProfile['ageGroup']
    if (age < 25) ageGroup = 'young'
    else if (age < 40) ageGroup = 'adult'
    else if (age < 55) ageGroup = 'mature'
    else ageGroup = 'senior'
    
    // Catégorisation type de peau
    const skinTypeMap: Record<string, StatisticalProfile['skinTypeCategory']> = {
      'Sèche': 'dry',
      'Normale': 'normal',
      'Mixte': 'combination',
      'Grasse': 'oily',
      'Sensible': 'sensitive'
    }
    const skinTypeCategory = skinTypeMap[request.userProfile.skinType] || 'normal'
    
    // Catégorisation préoccupations
    const concernsCount = request.skinConcerns.primary.length
    let concernsCategory: StatisticalProfile['concernsCategory']
    if (concernsCount <= 1) concernsCategory = 'basic'
    else if (concernsCount <= 2) concernsCategory = 'moderate'
    else concernsCategory = 'advanced'
    
    // Calcul de la fourchette de scores attendue
    const expectedScoreRange = this.calculateExpectedScoreRange(ageGroup, skinTypeCategory, concernsCategory)
    
    return {
      ageGroup,
      skinTypeCategory,
      concernsCategory,
      expectedScoreRange
    }
  }
  
  /**
   * Calcule la fourchette de scores attendue selon le profil
   */
  private static calculateExpectedScoreRange(
    ageGroup: StatisticalProfile['ageGroup'],
    skinType: StatisticalProfile['skinTypeCategory'],
    concerns: StatisticalProfile['concernsCategory']
  ): { min: number; max: number } {
    // Base selon l'âge
    let baseScore = 80
    switch (ageGroup) {
      case 'young': baseScore = 85; break
      case 'adult': baseScore = 75; break
      case 'mature': baseScore = 65; break
      case 'senior': baseScore = 55; break
    }
    
    // Ajustement selon le type de peau
    let skinTypeModifier = 0
    switch (skinType) {
      case 'normal': skinTypeModifier = 5; break
      case 'dry': skinTypeModifier = -5; break
      case 'oily': skinTypeModifier = -3; break
      case 'combination': skinTypeModifier = 0; break
      case 'sensitive': skinTypeModifier = -8; break
    }
    
    // Ajustement selon les préoccupations
    let concernsModifier = 0
    switch (concerns) {
      case 'basic': concernsModifier = 5; break
      case 'moderate': concernsModifier = -5; break
      case 'advanced': concernsModifier = -15; break
    }
    
    const adjustedScore = Math.max(20, Math.min(95, baseScore + skinTypeModifier + concernsModifier))
    
    return {
      min: Math.max(20, adjustedScore - 10),
      max: Math.min(95, adjustedScore + 10)
    }
  }
  
  /**
   * Génère des scores statistiques réalistes
   */
  private static generateStatisticalScores(
    profile: StatisticalProfile,
    request: AnalyzeRequest
  ): SkinScores {
    const { min, max } = profile.expectedScoreRange
    
    // Fonction pour générer un score dans la fourchette avec variation
    const generateScore = (baseAdjustment = 0) => {
      const adjustedMin = Math.max(0, min + baseAdjustment)
      const adjustedMax = Math.min(100, max + baseAdjustment)
      return Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin
    }
    
    // Ajustements spécifiques selon les préoccupations
    const concerns = request.skinConcerns.primary.map(c => c.toLowerCase())
    
    const scores: SkinScores = {
      hydration: {
        value: generateScore(profile.skinTypeCategory === 'dry' ? -10 : 0),
        justification: "Évaluation basée sur profil statistique",
        confidence: 0.3,
        basedOn: ["profil utilisateur", "données statistiques"]
      },
      wrinkles: {
        value: generateScore(profile.ageGroup === 'young' ? 10 : profile.ageGroup === 'senior' ? -15 : -5),
        justification: "Estimation selon groupe d'âge",
        confidence: 0.3,
        basedOn: ["âge utilisateur", "statistiques démographiques"]
      },
      firmness: {
        value: generateScore(profile.ageGroup === 'young' ? 8 : profile.ageGroup === 'senior' ? -12 : -3),
        justification: "Projection basée sur l'âge",
        confidence: 0.3,
        basedOn: ["profil âge", "données moyennes"]
      },
      radiance: {
        value: generateScore(concerns.includes('éclat') ? -8 : 0),
        justification: "Estimation selon préoccupations",
        confidence: 0.3,
        basedOn: ["préoccupations déclarées"]
      },
      pores: {
        value: generateScore(
          profile.skinTypeCategory === 'oily' ? -8 : 
          concerns.includes('pores') ? -10 : 0
        ),
        justification: "Évaluation type de peau",
        confidence: 0.3,
        basedOn: ["type de peau", "préoccupations"]
      },
      spots: {
        value: generateScore(
          concerns.includes('taches') || concerns.includes('imperfections') ? -12 : 0
        ),
        justification: "Basé sur préoccupations déclarées",
        confidence: 0.3,
        basedOn: ["préoccupations cutanées"]
      },
      darkCircles: {
        value: generateScore(concerns.includes('cernes') ? -15 : 5),
        justification: "Estimation statistique",
        confidence: 0.3,
        basedOn: ["profil général"]
      },
      skinAge: {
        value: generateScore(profile.ageGroup === 'young' ? 5 : -5),
        justification: "Corrélation âge chronologique",
        confidence: 0.3,
        basedOn: ["âge utilisateur"]
      },
      overall: 0 // Sera calculé
    }
    
    // Calculer le score global
    const scoreValues = Object.values(scores).slice(0, -1).map(s => s.value)
    scores.overall = Math.round(scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length)
    
    return scores
  }
  
  /**
   * Génère un assessment statistique
   */
  private static generateStatisticalAssessment(
    profile: StatisticalProfile,
    request: AnalyzeRequest
  ): BeautyAssessment {
    const concerns = request.skinConcerns.primary
    
    // Préoccupation principale basée sur les déclarations
    const mainConcern = concerns.length > 0 
      ? `${concerns[0]} avec ${concerns.slice(1).join(' et ')}`
      : "Maintien de l'équilibre cutané"
    
    // Intensité basée sur le nombre de préoccupations
    const intensity = concerns.length <= 1 ? 'légère' : 
                     concerns.length <= 2 ? 'modérée' : 'intense'
    
    // Zones concernées génériques
    const concernedZones = this.getTypicalZones(profile, concerns)
    
    return {
      skinType: `Peau ${request.userProfile.skinType.toLowerCase()} (estimation)`,
      mainConcern,
      intensity,
      concernedZones,
      specificities: concerns.map(concern => ({
        name: concern,
        intensity: 'modérée',
        zones: concernedZones.slice(0, 2)
      })),
      visualFindings: [
        "Analyse basée sur profil statistique",
        "Évaluation sans analyse visuelle directe",
        "Recommandations génériques adaptées au profil"
      ],
      overview: [
        `Profil ${profile.ageGroup} avec peau ${profile.skinTypeCategory}`,
        `Préoccupations de niveau ${profile.concernsCategory}`,
        "Routine préventive recommandée"
      ],
      zoneSpecific: concernedZones.map(zone => ({
        zone,
        problems: [{
          name: concerns[0] || "Entretien général",
          intensity: 'modérée'
        }],
        description: `Zone nécessitant attention selon profil ${profile.ageGroup}`
      })),
      expectedImprovement: this.getExpectedImprovement(profile),
      improvementTimeEstimate: this.getImprovementTimeEstimate(profile)
    }
  }
  
  /**
   * Génère des recommandations de base
   */
  private static generateBasicRecommendations(
    profile: StatisticalProfile,
    request: AnalyzeRequest
  ): ProductRecommendations {
    return {
      immediate: [
        "Routine de base adaptée au profil",
        "Nettoyage doux quotidien",
        "Hydratation selon type de peau"
      ],
      routine: {
        immediate: [
          {
            name: "Nettoyage adapté",
            frequency: "quotidien",
            timing: "matin_et_soir",
            catalogId: "B01MSSDEPK", // CeraVe par défaut
            application: "Routine de base pour votre profil",
            startDate: "maintenant"
          }
        ],
        adaptation: [],
        maintenance: []
      },
      localizedRoutine: [],
      overview: `Routine de base adaptée à votre profil ${profile.ageGroup} avec peau ${profile.skinTypeCategory}`,
      zoneSpecificCare: "Soins génériques selon préoccupations déclarées",
      restrictions: "Commencer progressivement et observer la tolérance"
    }
  }
  
  /**
   * Calcule la confiance du fallback
   */
  private static calculateFallbackConfidence(profile: StatisticalProfile): number {
    // Confiance basée sur la précision du profil
    let confidence = 0.3 // Base faible pour fallback
    
    // Ajustements selon la qualité des données
    if (profile.concernsCategory === 'basic') confidence += 0.1
    if (profile.ageGroup === 'adult' || profile.ageGroup === 'young') confidence += 0.05
    
    return Math.min(0.5, confidence) // Max 50% pour fallback
  }
  
  /**
   * Utilitaires pour génération de contenu
   */
  private static getTypicalZones(profile: StatisticalProfile, concerns: string[]): string[] {
    const baseZones = ['visage', 'front', 'joues']
    
    if (concerns.some(c => c.toLowerCase().includes('pores'))) {
      baseZones.push('nez', 'menton')
    }
    
    if (profile.ageGroup === 'mature' || profile.ageGroup === 'senior') {
      baseZones.push('contour des yeux')
    }
    
    return baseZones.slice(0, 4) // Limiter à 4 zones
  }
  
  private static getExpectedImprovement(profile: StatisticalProfile): string {
    switch (profile.concernsCategory) {
      case 'basic': return "Amélioration visible avec routine adaptée"
      case 'moderate': return "Progrès progressifs avec soins ciblés"
      case 'advanced': return "Amélioration nécessitant patience et constance"
      default: return "Résultats variables selon observance"
    }
  }
  
  private static getImprovementTimeEstimate(profile: StatisticalProfile): "4-6 semaines" | "2-3 mois" | "3-4 mois" | "4-6 mois" | "6-8 mois" {
    if (profile.ageGroup === 'young' && profile.concernsCategory === 'basic') {
      return "4-6 semaines"
    } else if (profile.concernsCategory === 'moderate') {
      return "2-3 mois"
    } else if (profile.concernsCategory === 'advanced' || profile.ageGroup === 'senior') {
      return "4-6 mois"
    } else {
      return "3-4 mois"
    }
  }
  
  private static getFallbackReason(primaryError: string): string {
    const errorLower = primaryError.toLowerCase()
    
    if (errorLower.includes('timeout')) {
      return "Analyse interrompue par timeout - Fallback basé sur profil"
    } else if (errorLower.includes('network') || errorLower.includes('connection')) {
      return "Problème de connexion - Estimation statistique"
    } else if (errorLower.includes('rate limit') || errorLower.includes('quota') || errorLower.includes('too many')) {
      return "Limite API atteinte - Analyse différée avec profil"
    } else {
      return "Erreur technique - Analyse de base selon profil utilisateur"
    }
  }
  
  /**
   * Métriques de fallback pour monitoring
   */
  static getFallbackMetrics(results: FallbackResult<any>[]): FallbackMetrics {
    const totalOperations = results.length
    const fallbackOperations = results.filter(r => r.source === 'fallback').length
    
    const fallbackRate = fallbackOperations / totalOperations
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalOperations
    
    const reasonCounts = results
      .filter(r => r.source === 'fallback')
      .reduce((acc, r) => {
        acc[r.fallbackReason] = (acc[r.fallbackReason] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    return {
      totalOperations,
      fallbackOperations,
      fallbackRate,
      avgConfidence,
      reasonCounts
    }
  }
}

export interface FallbackMetrics {
  totalOperations: number
  fallbackOperations: number
  fallbackRate: number
  avgConfidence: number
  reasonCounts: Record<string, number>
}
