/**
 * Service de calcul des durées personnalisées selon les principes dermatologiques
 * Respecte le cycle cellulaire de 28 jours et les facteurs individuels
 */

import type { BeautyAssessment, UnifiedRoutineStep } from '@/types'

export interface PhaseObjective {
  title: string
  description: string
  tooltip: string
}

export interface PhaseTiming {
  duration: string
  objective: PhaseObjective
  educationalTips: string[]
}

export class PhaseTimingCalculator {
  
  /**
   * Calcule la durée personnalisée de la phase immédiate
   * Prend en compte la durée MAXIMALE des traitements individuels
   */
  static calculateImmediateDuration(
    assessment: BeautyAssessment, 
    immediateSteps?: UnifiedRoutineStep[]
  ): string {
    // Protection contre undefined/null
    if (!assessment) {
      return "1-3 semaines" // Valeur par défaut élargie
    }
    
    let baseDuration = 14 // 2 semaines standard
    
    // NOUVEAU : Prendre en compte les durées des traitements individuels
    if (immediateSteps && immediateSteps.length > 0) {
      const treatmentDurations: number[] = []
      
      immediateSteps.forEach(step => {
        const criteria = this.getVisualCriteria(step)
        if (criteria) {
          // Extraire durée maximale du range (ex: "14-21 jours" -> 21)
          const match = criteria.estimatedDays.match(/(\d+)-(\d+)/)
          if (match) {
            treatmentDurations.push(parseInt(match[2])) // Prendre max
          }
        }
      })
      
      // Utiliser la durée la plus longue des traitements
      if (treatmentDurations.length > 0) {
        const maxTreatmentDuration = Math.max(...treatmentDurations)
        baseDuration = Math.max(baseDuration, maxTreatmentDuration)
      }
    }
    
    // Facteur âge (cicatrisation plus lente)
    const estimatedAge = assessment.estimatedSkinAge || 30
    if (estimatedAge > 50) baseDuration += 7
    if (estimatedAge > 65) baseDuration += 7
    
    // Facteur gravité problèmes (réduit car déjà pris en compte via traitements)
    const severeProblemCount = assessment.zoneSpecific?.filter(zone => 
      zone.problems?.some(p => p.intensity === 'intense')
    ).length || 0
    baseDuration += severeProblemCount * 2 // Réduit de 3 à 2
    
    // Facteur type de peau
    if (assessment.skinType?.toLowerCase().includes('sensible')) baseDuration += 5
    
    return this.formatDurationRange(baseDuration)
  }
  
  /**
   * Calcule la durée personnalisée de la phase d'adaptation
   * Facteurs : complexité traitements, nombre actifs à introduire
   */
  static calculateAdaptationDuration(treatments: UnifiedRoutineStep[]): string {
    let baseDuration = 28 // 4 semaines standard
    
    // Facteur complexité traitements
    const complexTreatments = treatments.filter(t => 
      ['retinol', 'aha', 'bha', 'vitamin-c', 'niacinamide'].some(active => 
        t.title.toLowerCase().includes(active) ||
        t.applicationAdvice.toLowerCase().includes(active)
      )
    ).length
    baseDuration += complexTreatments * 7
    
    // Facteur nombre zones traitées
    const totalZones = new Set(
      treatments.flatMap(t => t.zones || [])
    ).size
    baseDuration += totalZones * 2
    
    // Facteur fréquence progressive
    const progressiveTreatments = treatments.filter(t => 
      t.frequency === 'progressive' || 
      t.frequencyDetails?.includes('progressive')
    ).length
    baseDuration += progressiveTreatments * 5
    
    return this.formatDurationRange(baseDuration)
  }
  
  /**
   * Durée de maintenance (toujours continue avec cycles)
   */
  static calculateMaintenanceDuration(): string {
    return "En continu"
  }
  
  /**
   * Formate une durée en jours vers un range lisible
   */
  private static formatDurationRange(days: number): string {
    if (days <= 7) return "1 semaine"
    if (days <= 14) return "1-2 semaines"
    if (days <= 21) return "2-3 semaines"
    if (days <= 28) return "3-4 semaines"
    if (days <= 42) return "4-6 semaines"
    if (days <= 56) return "6-8 semaines"
    return "8+ semaines"
  }
  
  /**
   * Objectifs éducatifs par phase
   */
  static getPhaseObjectives(): Record<string, PhaseObjective> {
    return {
      immediate: {
        title: "Calmer et protéger la peau, rétablir la barrière cutanée",
        description: "Cette phase stabilise votre peau et traite les problèmes urgents en respectant son rythme naturel.",
        tooltip: `CYCLE CELLULAIRE NATUREL

Votre peau suit un cycle naturel de 28 jours pour se renouveler.

Attaquer directement avec des actifs forts risque de provoquer :
• Irritations et rougeurs
• Réactions de défense de la peau  
• Sensibilisation durable

Cette phase prépare votre peau aux traitements suivants en respectant son rythme biologique.`
      },
      
      adaptation: {
        title: "Introduire progressivement des actifs plus puissants",
        description: "Votre peau s'habitue aux nouveaux actifs pour une tolérance optimale et des bénéfices durables.",
        tooltip: `ADAPTATION PROGRESSIVE

Votre peau a besoin de temps pour s'habituer aux nouveaux actifs.

Cette progression évite :
• Les boutons d'adaptation (purging)
• Les desquamations excessives
• Les sensibilisations permanentes

Résultat : Une tolérance optimale pour des bénéfices durables.`
      },
      
      maintenance: {
        title: "Maintenir les résultats obtenus, éviter les rechutes",
        description: "Routine optimisée qui préserve vos acquis et prévient le retour des problèmes initiaux.",
        tooltip: `PRÉSERVATION DES ACQUIS

Votre peau est maintenant habituée et peut recevoir des soins ciblés.

Cette phase permet de :
• Maintenir les améliorations obtenues
• Prévenir les rechutes
• Optimiser les bénéfices long terme

Une routine bien établie garantit des résultats durables.`
      }
    }
  }
  
  /**
   * Calcule toutes les informations de timing pour une routine complète
   */
  static calculateCompleteTiming(
    assessment: BeautyAssessment, 
    routine: UnifiedRoutineStep[]
  ): Record<string, PhaseTiming> {
    const objectives = this.getPhaseObjectives()
    
    // Protection contre undefined/null
    if (!assessment) {
      return {
        immediate: {
          duration: "1-3 semaines",
          objective: objectives.immediate,
          educationalTips: []
        },
        adaptation: {
          duration: "3-6 semaines",
          objective: objectives.adaptation,
          educationalTips: [
            "Suivez précisément les instructions de chaque produit",
            "Surveillez les réactions cutanées quotidiennement",
            "N'ajoutez pas d'autres produits non recommandés"
          ]
        },
        maintenance: {
          duration: "En continu",
          objective: objectives.maintenance,
          educationalTips: []
        }
      }
    }
    
    const immediateSteps = routine.filter(step => step.phase === 'immediate')
    const adaptationSteps = routine.filter(step => step.phase === 'adaptation')
    
    return {
      immediate: {
        duration: this.calculateImmediateDuration(assessment, immediateSteps),
        objective: objectives.immediate,
        educationalTips: [
          "Commencez par les soins de base (nettoyage, hydratation)",
          "Observez la réaction de votre peau quotidiennement",
          "Patience : les résultats apparaissent progressivement"
        ]
      },
      
      adaptation: {
        duration: this.calculateAdaptationDuration(adaptationSteps),
        objective: objectives.adaptation,
        educationalTips: [
          "Suivez précisément les instructions de chaque produit",
          "Surveillez les réactions cutanées quotidiennement",
          "N'ajoutez pas d'autres produits non recommandés"
        ]
      },
      
      maintenance: {
        duration: this.calculateMaintenanceDuration(),
        objective: objectives.maintenance,
        educationalTips: [
          "Maintenez une routine quotidienne régulière",
          "Adaptez selon les saisons et votre évolution",
          "Consultez régulièrement pour optimiser"
        ]
      }
    }
  }
  
  /**
   * Génère des badges temporels enrichis pour les étapes
   */
  static generateTimingBadge(step: UnifiedRoutineStep): string {
    // Badges d'observation pour traitements temporaires
    if (step.applicationDuration) {
      if (step.applicationDuration.includes('cicatrisation')) {
        return "👁️ Jusqu'à cicatrisation"
      }
      if (step.applicationDuration.includes('disparition')) {
        return "👁️ Jusqu'à disparition"
      }
      if (step.applicationDuration.includes('réduction')) {
        return "👁️ Jusqu'à réduction"
      }
      if (step.applicationDuration.includes('apaisement')) {
        return "👁️ Jusqu'à apaisement"
      }
    }
    
    // Badges temporels standards
    if (step.frequency === 'daily') {
      return step.timeOfDay === 'morning' ? "⏰ Quotidien matin" : 
             step.timeOfDay === 'evening' ? "⏰ Quotidien soir" : 
             "⏰ Quotidien"
    }
    
    if (step.frequency === 'weekly') {
      return "⏱️ Hebdomadaire"
    }
    
    if (step.frequency === 'progressive') {
      return "📈 Progressif"
    }
    
    if (step.frequency === 'as-needed') {
      return "🎯 Au besoin"
    }
    
    return "⏰ Quotidien"
  }
  
  /**
   * Détermine les critères visuels d'évolution pour une étape
   */
  static getVisualCriteria(step: UnifiedRoutineStep): {
    observation: string
    estimatedDays: string
    nextStep: string
  } | null {
    const title = step.title.toLowerCase()
    
    if (title.includes('poils incarnés')) {
      return {
        observation: 'Vérifier absence de rougeurs et gonflements',
        estimatedDays: '7-14 jours',
        nextStep: 'Continuer prévention rasage'
      }
    }
    
    if (title.includes('imperfections')) {
      return {
        observation: 'Compter diminution nombre boutons actifs',
        estimatedDays: '14-21 jours',
        nextStep: 'Introduire prévention récidive'
      }
    }
    
    if (title.includes('rougeurs')) {
      return {
        observation: 'Teint plus homogène, moins de réactivité',
        estimatedDays: '7-14 jours',
        nextStep: 'Renforcer barrière cutanée'
      }
    }
    
    if (title.includes('cicatrisation')) {
      return {
        observation: 'Peau lisse, couleur normalisée',
        estimatedDays: '10-21 jours',
        nextStep: 'Prévention cicatrices'
      }
    }
    
    return null
  }
}
