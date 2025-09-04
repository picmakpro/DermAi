import { describe, it, expect } from 'vitest'
import { PhaseTimingCalculator } from '../phaseTimingCalculator'
import type { BeautyAssessment } from '@/types'

describe('PhaseTimingCalculator', () => {
  const mockAssessment: BeautyAssessment = {
    mainConcern: 'Test concern',
    intensity: 'moderate' as const,
    concernedZones: ['visage'],
    visualFindings: ['test finding'],
    expectedImprovement: 'Test improvement'
  }

  it('should calculate immediate duration', () => {
    const duration = PhaseTimingCalculator.calculateImmediateDuration(mockAssessment)
    expect(typeof duration).toBe('string')
    expect(duration).toBeTruthy()
  })

  it('should calculate complete timing', () => {
    const phases = PhaseTimingCalculator.calculateCompleteTiming(mockAssessment, [])
    expect(phases).toHaveProperty('immediate')
    expect(phases).toHaveProperty('adaptation')
    expect(phases).toHaveProperty('maintenance')
    
    // Verify each phase has required properties
    expect(phases.immediate).toHaveProperty('duration')
    expect(phases.immediate).toHaveProperty('objective')
    expect(typeof phases.immediate.duration).toBe('string')
  })

  it('should handle different intensities', () => {
    const lightAssessment: BeautyAssessment = {
      ...mockAssessment,
      intensity: 'mild' as const
    }
    
    const intenseAssessment: BeautyAssessment = {
      ...mockAssessment,
      intensity: 'severe' as const
    }
    
    const lightPhases = PhaseTimingCalculator.calculateCompleteTiming(lightAssessment, [])
    const intensePhases = PhaseTimingCalculator.calculateCompleteTiming(intenseAssessment, [])
    
    expect(lightPhases.immediate.duration).toBeDefined()
    expect(intensePhases.immediate.duration).toBeDefined()
  })
})