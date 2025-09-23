/**
 * 📅 WEEKLY SCHEDULE CALCULATOR - SPRINT 4
 * 
 * Calcule les plannings hebdomadaires précis avec jours suggérés
 * et conseils d'espacement pour les produits à fréquence hebdomadaire.
 * 
 * @version 1.0 - Sprint 4 Amélioration Routines
 */

import type { UnifiedRoutineStep } from '@/types'

export interface WeeklySchedule {
  frequency: string
  suggestedDays: string[]
  spacingAdvice: string
  timeOfDay: 'morning' | 'evening' | 'both'
  warnings?: string[]
}

export class WeeklyScheduleCalculator {
  
  /**
   * Calcule le planning hebdomadaire pour une étape donnée
   */
  static calculateWeeklySchedule(step: UnifiedRoutineStep): WeeklySchedule {
    const category = step.category
    const intensity = this.getIntensity(step)
    
    if (category === 'exfoliation') {
      return this.getExfoliationSchedule(intensity)
    }
    
    if (category === 'treatment') {
      return this.getTreatmentSchedule(step, intensity)
    }
    
    if (category === 'mask') {
      return this.getMaskSchedule(step)
    }
    
    return this.getDefaultWeeklySchedule()
  }
  
  /**
   * Détermine l'intensité d'un produit basé sur ses caractéristiques
   */
  private static getIntensity(step: UnifiedRoutineStep): 'light' | 'moderate' | 'intense' {
    // Facteurs d'intensité
    const hasMultipleZones = (step.zones?.length || 0) > 2
    const isSpecificTarget = step.targetArea === 'specific'
    const hasStrongActives = step.applicationAdvice?.includes('progressivement') || 
                            step.applicationAdvice?.includes('tolérance')
    
    if (hasStrongActives || (hasMultipleZones && isSpecificTarget)) {
      return 'intense'
    }
    
    if (hasMultipleZones || isSpecificTarget) {
      return 'moderate'
    }
    
    return 'light'
  }
  
  /**
   * Planning pour les exfoliants selon l'intensité
   */
  private static getExfoliationSchedule(intensity: 'light' | 'moderate' | 'intense'): WeeklySchedule {
    const schedules = {
      light: {
        frequency: '2x par semaine',
        suggestedDays: ['Mardi', 'Vendredi'],
        spacingAdvice: 'Espacer de 2-3 jours minimum',
        timeOfDay: 'evening' as const,
        warnings: ['Éviter avant exposition solaire']
      },
      moderate: {
        frequency: '1-2x par semaine',
        suggestedDays: ['Mercredi', 'Dimanche'],
        spacingAdvice: 'Espacer de 3-4 jours minimum',
        timeOfDay: 'evening' as const,
        warnings: ['Commencer 1x/semaine puis augmenter']
      },
      intense: {
        frequency: '1x par semaine maximum',
        suggestedDays: ['Dimanche'],
        spacingAdvice: 'Une fois par semaine seulement',
        timeOfDay: 'evening' as const,
        warnings: ['Peau sensible : 1x toutes les 2 semaines']
      }
    }
    
    return schedules[intensity]
  }
  
  /**
   * Planning pour les traitements selon le type et l'intensité
   */
  private static getTreatmentSchedule(step: UnifiedRoutineStep, intensity: string): WeeklySchedule {
    const isSpotTreatment = step.targetArea === 'specific'
    const timeOfDay = step.timeOfDay || 'evening'
    
    if (isSpotTreatment) {
      return {
        frequency: '3-4x par semaine',
        suggestedDays: ['Lundi', 'Mercredi', 'Vendredi', 'Dimanche'],
        spacingAdvice: 'Application ciblée selon besoin',
        timeOfDay: timeOfDay as 'morning' | 'evening' | 'both',
        warnings: ['Surveiller tolérance cutanée']
      }
    }
    
    // Traitement général
    return {
      frequency: '2-3x par semaine',
      suggestedDays: ['Lundi', 'Mercredi', 'Vendredi'],
      spacingAdvice: 'Commencer 2x/semaine puis augmenter selon tolérance',
      timeOfDay: timeOfDay as 'morning' | 'evening' | 'both',
      warnings: ['Introduire progressivement']
    }
  }
  
  /**
   * Planning pour les masques selon le type
   */
  private static getMaskSchedule(step: UnifiedRoutineStep): WeeklySchedule {
    const isHydrating = step.category === 'hydration' || 
                       step.applicationAdvice?.includes('hydrat')
    
    if (isHydrating) {
      return {
        frequency: '2-3x par semaine',
        suggestedDays: ['Mardi', 'Jeudi', 'Samedi'],
        spacingAdvice: 'Selon les besoins de la peau',
        timeOfDay: 'evening',
        warnings: ['Peut être utilisé quotidiennement si besoin']
      }
    }
    
    // Masque purifiant/traitant
    return {
      frequency: '1-2x par semaine',
      suggestedDays: ['Mercredi', 'Samedi'],
      spacingAdvice: 'Espacer de 3-4 jours minimum',
      timeOfDay: 'evening',
      warnings: ['Éviter si peau irritée']
    }
  }
  
  /**
   * Planning par défaut pour les autres catégories
   */
  private static getDefaultWeeklySchedule(): WeeklySchedule {
    return {
      frequency: '1x par semaine',
      suggestedDays: ['Dimanche'],
      spacingAdvice: 'Même jour chaque semaine pour créer une habitude',
      timeOfDay: 'evening',
      warnings: ['Adapter selon tolérance']
    }
  }
  
  /**
   * Génère des conseils d'espacement personnalisés
   */
  static generateSpacingAdvice(
    frequency: string, 
    category: string,
    intensity?: 'light' | 'moderate' | 'intense'
  ): string {
    if (frequency.includes('2x')) {
      return 'Espacer de 2-3 jours minimum entre les applications'
    }
    
    if (frequency.includes('3x')) {
      return 'Laisser au moins 1 jour de repos entre les applications'
    }
    
    if (category === 'exfoliation') {
      return intensity === 'intense' 
        ? 'Une seule fois par semaine, toujours le même jour'
        : 'Espacer de 3-4 jours minimum'
    }
    
    return 'Adapter selon la tolérance de votre peau'
  }
  
  /**
   * Suggère des jours optimaux selon la fréquence et le type
   */
  static suggestOptimalDays(
    frequency: string,
    category: string,
    timeOfDay: string
  ): string[] {
    const frequencyNum = this.extractFrequencyNumber(frequency)
    
    // Jours de repos (weekend) pour traitements intensifs
    if (category === 'exfoliation' || category === 'mask') {
      if (frequencyNum === 1) return ['Dimanche']
      if (frequencyNum === 2) return ['Mercredi', 'Dimanche']
      if (frequencyNum === 3) return ['Mardi', 'Jeudi', 'Dimanche']
    }
    
    // Jours de semaine pour traitements quotidiens
    if (category === 'treatment') {
      if (frequencyNum === 2) return ['Lundi', 'Jeudi']
      if (frequencyNum === 3) return ['Lundi', 'Mercredi', 'Vendredi']
      if (frequencyNum === 4) return ['Lundi', 'Mercredi', 'Vendredi', 'Dimanche']
    }
    
    // Par défaut : répartition équilibrée
    const allDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    const interval = Math.floor(7 / frequencyNum)
    
    return Array.from({ length: frequencyNum }, (_, i) => 
      allDays[i * interval] || allDays[i]
    ).filter(Boolean)
  }
  
  /**
   * Extrait le nombre de fois par semaine d'une chaîne de fréquence
   */
  private static extractFrequencyNumber(frequency: string): number {
    const match = frequency.match(/(\d+)x?\s*par\s*semaine/i)
    if (match) return parseInt(match[1])
    
    // Cas spéciaux
    if (frequency.includes('quotidien')) return 7
    if (frequency.includes('1-2x')) return 2
    if (frequency.includes('2-3x')) return 3
    if (frequency.includes('3-4x')) return 4
    
    return 1 // Par défaut
  }
  
  /**
   * Génère des avertissements contextuels
   */
  static generateContextualWarnings(
    step: UnifiedRoutineStep,
    intensity: 'light' | 'moderate' | 'intense'
  ): string[] {
    const warnings: string[] = []
    
    // Avertissements par catégorie
    if (step.category === 'exfoliation') {
      warnings.push('Toujours appliquer le soir')
      if (intensity === 'intense') {
        warnings.push('Peau sensible : commencer toutes les 2 semaines')
      }
    }
    
    if (step.category === 'treatment') {
      warnings.push('Surveiller les signes d\'irritation')
      if (step.zones && step.zones.length > 2) {
        warnings.push('Commencer par une zone puis étendre')
      }
    }
    
    // Avertissements par timing
    if (step.timeOfDay === 'morning') {
      warnings.push('Toujours suivre d\'une protection solaire')
    }
    
    // Avertissements par fréquence
    if (step.frequency === 'progressive') {
      warnings.push('Augmenter progressivement selon tolérance')
    }
    
    return warnings
  }
}

