/**
 * 🔬 PHASE DEPENDENCY CALCULATOR - SPRINT 3
 * 
 * Calcule les dépendances entre phases avec durées personnalisées
 * et critères de transition basés sur le profil utilisateur.
 * 
 * @version 1.0 - Sprint 3 Amélioration Routines
 */

import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'

export interface PhaseDependencies {
  immediate: PhaseInfo
  adaptation: PhaseInfo
  maintenance: PhaseInfo
}

export interface PhaseInfo {
  startDay: number
  duration: string
  endDay: number | null
  nextPhaseCondition: string | null
  transitionCriteria: string[]
}

export interface PhaseContext {
  phaseWeeks: number
  previousPhaseCompleted: boolean
  userSkinType: string
  age?: number
  hasUrgentIssues: boolean
}

export class PhaseDependencyCalculator {
  
  /**
   * Calcule les dépendances entre phases avec timeline personnalisée
   */
  static calculatePhaseDependencies(
    routine: UnifiedRoutineStep[],
    userProfile?: BeautyAssessment
  ): PhaseDependencies {
    const immediate = routine.filter(s => s.phase === 'immediate')
    const adaptation = routine.filter(s => s.phase === 'adaptation')
    const maintenance = routine.filter(s => s.phase === 'maintenance')
    
    const immediateEndDay = this.getImmediateEndDay(immediate, userProfile)
    const adaptationEndDay = this.getAdaptationEndDay(immediate, adaptation, userProfile)
    
    return {
      immediate: {
        startDay: 0,
        duration: this.calculateImmediateDuration(immediate, userProfile),
        endDay: immediateEndDay,
        nextPhaseCondition: 'Stabilisation de la peau observée',
        transitionCriteria: this.getImmediateTransitionCriteria(immediate)
      },
      adaptation: {
        startDay: immediateEndDay,
        duration: this.calculateAdaptationDuration(adaptation, userProfile),
        endDay: adaptationEndDay,
        nextPhaseCondition: 'Tolérance aux actifs établie',
        transitionCriteria: this.getAdaptationTransitionCriteria(adaptation)
      },
      maintenance: {
        startDay: adaptationEndDay,
        duration: 'Continu',
        endDay: null,
        nextPhaseCondition: null,
        transitionCriteria: ['Routine bien tolérée', 'Résultats satisfaisants']
      }
    }
  }
  
  /**
   * Calcule la durée de la phase immédiate basée sur le profil
   */
  private static calculateImmediateDuration(
    steps: UnifiedRoutineStep[], 
    userProfile?: BeautyAssessment
  ): string {
    // Facteurs d'ajustement
    const hasUrgentIssues = steps.some(s => 
      s.category === 'healing' || 
      s.applicationDuration?.includes('cicatrisation') ||
      s.targetArea === 'specific'
    )
    
    const isSensitiveSkin = userProfile?.skinType?.includes('sensible') || 
                           userProfile?.skinType?.includes('sensitive')
    const age = userProfile?.age || 30
    
    // Calcul basé sur profil
    let baseWeeks = hasUrgentIssues ? 3 : 2
    if (isSensitiveSkin) baseWeeks += 1
    if (age > 50) baseWeeks += 1
    
    return baseWeeks === 2 ? '2 semaines' : `${baseWeeks} semaines`
  }
  
  /**
   * Calcule la durée de la phase d'adaptation
   */
  private static calculateAdaptationDuration(
    steps: UnifiedRoutineStep[],
    userProfile?: BeautyAssessment
  ): string {
    const hasIntenseActives = steps.some(s => 
      s.category === 'treatment' && 
      (s.zones?.length || 0) > 2
    )
    
    const isSensitiveSkin = userProfile?.skinType?.includes('sensible') || 
                           userProfile?.skinType?.includes('sensitive')
    
    let baseWeeks = hasIntenseActives ? 6 : 4
    if (isSensitiveSkin) baseWeeks += 2
    
    return `${baseWeeks} semaines`
  }
  
  /**
   * Calcule le jour de fin de la phase immédiate
   */
  private static getImmediateEndDay(
    steps: UnifiedRoutineStep[],
    userProfile?: BeautyAssessment
  ): number {
    const durationStr = this.calculateImmediateDuration(steps, userProfile)
    const weeks = parseInt(durationStr.match(/(\d+)/)?.[1] || '2')
    return weeks * 7
  }
  
  /**
   * Calcule le jour de fin de la phase d'adaptation
   */
  private static getAdaptationEndDay(
    immediateSteps: UnifiedRoutineStep[],
    adaptationSteps: UnifiedRoutineStep[],
    userProfile?: BeautyAssessment
  ): number {
    const immediateEnd = this.getImmediateEndDay(immediateSteps, userProfile)
    const adaptationDurationStr = this.calculateAdaptationDuration(adaptationSteps, userProfile)
    const adaptationWeeks = parseInt(adaptationDurationStr.match(/(\d+)/)?.[1] || '4')
    
    return immediateEnd + (adaptationWeeks * 7)
  }
  
  /**
   * Définit les critères de transition de la phase immédiate
   */
  private static getImmediateTransitionCriteria(steps: UnifiedRoutineStep[]): string[] {
    const criteria = ['Peau stabilisée']
    
    if (steps.some(s => s.category === 'healing')) {
      criteria.push('Cicatrisation visible')
    }
    
    if (steps.some(s => s.category === 'treatment')) {
      criteria.push('Bonne tolérance aux actifs')
    }
    
    if (steps.some(s => s.category === 'cleansing')) {
      criteria.push('Routine de base établie')
    }
    
    return criteria
  }
  
  /**
   * Définit les critères de transition de la phase d'adaptation
   */
  private static getAdaptationTransitionCriteria(steps: UnifiedRoutineStep[]): string[] {
    const criteria = ['Tolérance complète aux actifs']
    
    if (steps.some(s => s.frequency === 'progressive')) {
      criteria.push('Fréquence optimale atteinte')
    }
    
    if (steps.some(s => s.category === 'treatment')) {
      criteria.push('Amélioration visible des problèmes ciblés')
    }
    
    criteria.push('Aucune irritation ou réaction')
    
    return criteria
  }
  
  /**
   * Génère le contexte de phase pour une étape donnée
   */
  static getPhaseContext(
    step: UnifiedRoutineStep,
    dependencies: PhaseDependencies
  ): PhaseContext {
    const phaseInfo = dependencies[step.phase as keyof PhaseDependencies]
    const phaseWeeks = phaseInfo.endDay ? Math.ceil(phaseInfo.endDay / 7) : 4
    
    return {
      phaseWeeks,
      previousPhaseCompleted: false, // À déterminer selon l'état utilisateur
      userSkinType: 'normal', // À récupérer du profil
      hasUrgentIssues: step.category === 'healing' || step.targetArea === 'specific'
    }
  }
  
  /**
   * Calcule le pourcentage de progression dans une phase
   */
  static calculatePhaseProgress(
    currentDay: number,
    phaseInfo: PhaseInfo
  ): number {
    if (!phaseInfo.endDay) return 0 // Phase maintenance
    
    const phaseDuration = phaseInfo.endDay - phaseInfo.startDay
    const daysSinceStart = Math.max(0, currentDay - phaseInfo.startDay)
    
    return Math.min(100, Math.round((daysSinceStart / phaseDuration) * 100))
  }
}

