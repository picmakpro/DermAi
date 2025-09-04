/**
 * Personalized timing calculator based on dermatological principles.
 * Respects the ~28-day skin renewal cycle and individual factors.
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
   * Calculates the personalized duration of the immediate phase.
   * Takes into account the MAXIMUM duration among individual treatments.
   */
  static calculateImmediateDuration(
    assessment: BeautyAssessment,
    immediateSteps?: UnifiedRoutineStep[]
  ): string {
    // Guard against undefined/null
    if (!assessment) {
      return '1–3 weeks' // Wider default range
    }

    let baseDuration = 14 // 2 weeks standard

    // NEW: Take individual treatment durations into account
    if (immediateSteps && immediateSteps.length > 0) {
      const treatmentDurations: number[] = []

      immediateSteps.forEach((step) => {
        const criteria = this.getVisualCriteria(step)
        if (criteria) {
          // Extract the max from a range (e.g., "14–21 days" -> 21)
          const match = criteria.estimatedDays.match(/(\d+)-(\d+)/)
          if (match) {
            treatmentDurations.push(parseInt(match[2])) // take max
          }
        }
      })

      // Use the longest treatment duration
      if (treatmentDurations.length > 0) {
        const maxTreatmentDuration = Math.max(...treatmentDurations)
        baseDuration = Math.max(baseDuration, maxTreatmentDuration)
      }
    }

    // Age factor (slower healing)
    const estimatedAge = assessment.estimatedSkinAge || 30
    if (estimatedAge > 50) baseDuration += 7
    if (estimatedAge > 65) baseDuration += 7

    // Severity factor (reduced because treatments already account for it)
    const severeProblemCount =
      assessment.zoneSpecific?.filter((zone) =>
        zone.problems?.some((p) => p.intensity === 'severe')
      ).length || 0
    baseDuration += severeProblemCount * 2 // reduced from 3 to 2

    // Skin type factor
    const skinType = assessment.skinType?.toLowerCase() || ''
    if (skinType.includes('sensitive')) baseDuration += 5

    return this.formatDurationRange(baseDuration)
  }

  /**
   * Calculates the personalized duration of the adaptation phase.
   * Factors: treatment complexity, number of actives to introduce.
   */
  static calculateAdaptationDuration(treatments: UnifiedRoutineStep[]): string {
    let baseDuration = 28 // 4 weeks standard

    // Treatment complexity factor
    const complexTreatments = treatments.filter((t) =>
      ['retinol', 'aha', 'bha', 'vitamin-c', 'niacinamide'].some(
        (active) =>
          t.title.toLowerCase().includes(active) || t.applicationAdvice.toLowerCase().includes(active)
      )
    ).length
    baseDuration += complexTreatments * 7

    // Number of zones treated
    const totalZones = new Set(treatments.flatMap((t) => t.zones || [])).size
    baseDuration += totalZones * 2

    // Progressive frequency factor
    const progressiveTreatments = treatments.filter(
      (t) => t.frequency === 'progressive' || t.frequencyDetails?.includes('progressive')
    ).length
    baseDuration += progressiveTreatments * 5

    return this.formatDurationRange(baseDuration)
  }

  /**
   * Maintenance duration (always ongoing with cycles)
   */
  static calculateMaintenanceDuration(): string {
    return 'Ongoing'
  }

  /**
   * Format a number of days into a readable range.
   */
  private static formatDurationRange(days: number): string {
    if (days <= 7) return '1 week'
    if (days <= 14) return '1–2 weeks'
    if (days <= 21) return '2–3 weeks'
    if (days <= 28) return '3–4 weeks'
    if (days <= 42) return '4–6 weeks'
    if (days <= 56) return '6–8 weeks'
    return '8+ weeks'
  }

  /**
   * Educational objectives per phase.
   */
  static getPhaseObjectives(): Record<string, PhaseObjective> {
    return {
      immediate: {
        title: 'Soothe and protect the skin, restore the barrier',
        description:
          'This phase stabilizes your skin and addresses urgent concerns while respecting its natural rhythm.',
        tooltip: `NATURAL CELLULAR CYCLE

Your skin follows a natural ~28-day cycle to renew itself.

Starting directly with strong actives can cause:
• Irritation and redness
• Defensive reactions in the skin
• Long-term sensitization

This phase prepares your skin for subsequent treatments while respecting its biology.`
      },

      adaptation: {
        title: 'Introduce stronger actives progressively',
        description:
          'Your skin adapts to new actives for optimal tolerance and lasting benefits.',
        tooltip: `PROGRESSIVE ADAPTATION

Your skin needs time to adjust to new actives.

This progression helps prevent:
• Purging breakouts
• Excessive flaking
• Lasting sensitization

Result: optimal tolerance and durable benefits.`
      },

      maintenance: {
        title: 'Maintain results and prevent relapse',
        description:
          'An optimized routine that preserves progress and prevents initial concerns from returning.',
        tooltip: `PRESERVING GAINS

Your skin is now adapted and can handle targeted care.

This phase helps you:
• Maintain improvements
• Prevent setbacks
• Optimize long-term benefits

A well-established routine ensures lasting results.`
      }
    }
  }

  /**
   * Computes all timing info for a complete routine.
   */
  static calculateCompleteTiming(
    assessment: BeautyAssessment,
    routine: UnifiedRoutineStep[]
  ): Record<string, PhaseTiming> {
    const objectives = this.getPhaseObjectives()

    // Guard against undefined/null
    if (!assessment) {
      return {
        immediate: {
          duration: '1–3 weeks',
          objective: objectives.immediate,
          educationalTips: []
        },
        adaptation: {
          duration: '3–6 weeks',
          objective: objectives.adaptation,
          educationalTips: [
            'Follow each product’s instructions precisely',
            'Monitor skin reactions daily',
            "Don’t add non-recommended products"
          ]
        },
        maintenance: {
          duration: 'Ongoing',
          objective: objectives.maintenance,
          educationalTips: []
        }
      }
    }

    const immediateSteps = routine.filter((step) => step.phase === 'immediate')
    const adaptationSteps = routine.filter((step) => step.phase === 'adaptation')

    return {
      immediate: {
        duration: this.calculateImmediateDuration(assessment, immediateSteps),
        objective: objectives.immediate,
        educationalTips: [
          'Start with the basics (cleansing, moisturizing)',
          'Observe your skin’s reaction daily',
          'Be patient: results appear progressively'
        ]
      },

      adaptation: {
        duration: this.calculateAdaptationDuration(adaptationSteps),
        objective: objectives.adaptation,
        educationalTips: [
          'Follow each product’s instructions precisely',
          'Monitor skin reactions daily',
          "Don’t add non-recommended products"
        ]
      },

      maintenance: {
        duration: this.calculateMaintenanceDuration(),
        objective: objectives.maintenance,
        educationalTips: [
          'Keep a consistent daily routine',
          'Adjust with seasons and your progress',
          'Check in regularly to optimize'
        ]
      }
    }
  }

  /**
   * Generates enriched time badges for steps.
   */
  static generateTimingBadge(step: UnifiedRoutineStep): string {
    // Observation badges for temporary treatments — support FR & EN keywords
    if (step.applicationDuration) {
      const ad = step.applicationDuration.toLowerCase()
      if (ad.includes('cicatrisation') || ad.includes('healing')) {
        return '👁️ Until healing'
      }
      if (ad.includes('disparition') || ad.includes('clear') || ad.includes('resolution')) {
        return '👁️ Until it clears'
      }
      if (ad.includes('réduction') || ad.includes('reduction') || ad.includes('reduced')) {
        return '👁️ Until reduction'
      }
      if (ad.includes('apaisement') || ad.includes('soothing') || ad.includes('calm')) {
        return '👁️ Until soothed'
      }
    }

    // Standard time badges
    if (step.frequency === 'daily') {
      return step.timeOfDay === 'morning'
        ? '⏰ Daily morning'
        : step.timeOfDay === 'evening'
        ? '⏰ Daily evening'
        : '⏰ Daily'
    }

    if (step.frequency === 'weekly') {
      return '⏱️ Weekly'
    }

    if (step.frequency === 'progressive') {
      return '📈 Progressive'
    }

    if (step.frequency === 'as-needed') {
      return '🎯 As needed'
    }

    return '⏰ Daily'
  }

  /**
   * Determines visual evolution criteria for a step.
   */
  static getVisualCriteria(
    step: UnifiedRoutineStep
  ): {
    observation: string
    estimatedDays: string
    nextStep: string
  } | null {
    const title = step.title.toLowerCase()

    if (title.includes('poils incarnés') || title.includes('ingrown')) {
      return {
        observation: 'Check absence of redness and swelling',
        estimatedDays: '7–14 days',
        nextStep: 'Continue shaving prevention'
      }
    }

    if (title.includes('imperfections') || title.includes('blemish') || title.includes('acne')) {
      return {
        observation: 'Count the reduction in active blemishes',
        estimatedDays: '14–21 days',
        nextStep: 'Introduce relapse prevention'
      }
    }

    if (title.includes('rougeurs') || title.includes('redness')) {
      return {
        observation: 'More even tone, less reactivity',
        estimatedDays: '7–14 days',
        nextStep: 'Reinforce skin barrier'
      }
    }

    if (title.includes('cicatrisation') || title.includes('healing')) {
      return {
        observation: 'Skin smooth, color normalized',
        estimatedDays: '10–21 days',
        nextStep: 'Scar prevention'
      }
    }

    return null
  }
}
