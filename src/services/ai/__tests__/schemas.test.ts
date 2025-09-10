/**
 * Unit tests for V2 Schemas validation
 */

import { describe, it, expect } from 'vitest'
import {
  VisionOutputV2Schema,
  RoutineBlueprintV2Schema,
  ProductSelectionV2Schema,
  validateVisionOutputV2,
  validateRoutineBlueprintV2,
  validateProductSelectionV2
} from '../schemas'

describe('V2 Schemas Validation', () => {
  describe('VisionOutputV2Schema', () => {
    it('should validate a complete vision output', () => {
      const validVisionOutput = {
        scores: {
          hydration: { value: 72, justification: 'Well-hydrated skin', confidence: 0.8, basedOn: ['no flaking'] },
          wrinkles: { value: 64, justification: 'Fine expression lines', confidence: 0.75, basedOn: ['dynamic lines'] },
          firmness: { value: 68, justification: 'Good overall tone', confidence: 0.7, basedOn: ['defined contours'] },
          radiance: { value: 70, justification: 'Fairly bright complexion', confidence: 0.75, basedOn: ['even sheen'] },
          pores: { value: 58, justification: 'Visible pores in T-zone', confidence: 0.8, basedOn: ['irregular texture'] },
          spots: { value: 62, justification: 'Mild hyperpigmentation', confidence: 0.75, basedOn: ['discrete macules'] },
          darkCircles: { value: 55, justification: 'Mild pigmented circles', confidence: 0.7, basedOn: ['under-eye hue'] },
          skinAge: { value: 78, justification: 'Skin age close to actual age', confidence: 0.7, basedOn: ['elasticity'] },
          overall: 67
        },
        beautyAssessment: {
          skinType: 'combination',
          mainConcern: 'ingrowns',
          intensity: 'moderate',
          concernedZones: ['chin', 'neck'],
          visualFindings: ['Presence of ingrowns on shaving zone'],
          expectedImprovement: 'Visible improvement in 4–6 weeks',
          improvementTimeEstimate: '3–4 months'
        }
      }

      expect(() => validateVisionOutputV2(validVisionOutput)).not.toThrow()
    })

    it('should reject invalid intensity values', () => {
      const invalidVisionOutput = {
        scores: {
          hydration: { value: 72, justification: 'Well-hydrated skin', confidence: 0.8, basedOn: ['no flaking'] },
          wrinkles: { value: 64, justification: 'Fine expression lines', confidence: 0.75, basedOn: ['dynamic lines'] },
          firmness: { value: 68, justification: 'Good overall tone', confidence: 0.7, basedOn: ['defined contours'] },
          radiance: { value: 70, justification: 'Fairly bright complexion', confidence: 0.75, basedOn: ['even sheen'] },
          pores: { value: 58, justification: 'Visible pores in T-zone', confidence: 0.8, basedOn: ['irregular texture'] },
          spots: { value: 62, justification: 'Mild hyperpigmentation', confidence: 0.75, basedOn: ['discrete macules'] },
          darkCircles: { value: 55, justification: 'Mild pigmented circles', confidence: 0.7, basedOn: ['under-eye hue'] },
          skinAge: { value: 78, justification: 'Skin age close to actual age', confidence: 0.7, basedOn: ['elasticity'] },
          overall: 67
        },
        beautyAssessment: {
          skinType: 'combination',
          mainConcern: 'ingrowns',
          intensity: 'invalid', // Invalid intensity
          concernedZones: ['chin', 'neck'],
          visualFindings: ['Presence of ingrowns on shaving zone'],
          expectedImprovement: 'Visible improvement in 4–6 weeks'
        }
      }

      expect(() => validateVisionOutputV2(invalidVisionOutput)).toThrow()
    })
  })

  describe('RoutineBlueprintV2Schema', () => {
    it('should validate a complete routine blueprint', () => {
      const validRoutineBlueprint = {
        phases: {
          immediate: [
            {
              name: 'Gentle cleansing',
              description: 'Daily gentle cleansing',
              frequency: 'daily',
              timeOfDay: 'morning_and_evening',
              category: 'cleansing',
              priority: 10,
              startAfterDays: 0,
              duration: 'Ongoing',
              applicationTips: ['Use lukewarm water'],
              restrictions: ['Avoid hot water']
            }
          ],
          adaptation: [
            {
              name: 'Progressive exfoliation',
              description: 'Introduce gentle exfoliation',
              frequency: 'weekly',
              timeOfDay: 'evening',
              category: 'exfoliation',
              priority: 7,
              startAfterDays: 14,
              duration: '4-6 weeks',
              applicationTips: ['Start once per week'],
              restrictions: ['Do not combine with retinoids']
            }
          ],
          maintenance: [
            {
              name: 'Optimized routine',
              description: 'Maintain established routine',
              frequency: 'daily',
              timeOfDay: 'morning_and_evening',
              category: 'treatment',
              priority: 8,
              startAfterDays: 42,
              duration: 'Ongoing',
              applicationTips: ['Continue established routine']
            }
          ]
        },
        personalizedTiming: {
          immediateDuration: '2-3 weeks',
          adaptationDuration: '4-6 weeks',
          maintenanceDuration: 'Ongoing',
          transitionCriteria: ['No irritation or redness']
        },
        routineOverview: 'Progressive routine starting with gentle base',
        keyPrinciples: ['Start gentle, progress gradually']
      }

      expect(() => validateRoutineBlueprintV2(validRoutineBlueprint)).not.toThrow()
    })
  })

  describe('ProductSelectionV2Schema', () => {
    it('should validate a complete product selection', () => {
      const validProductSelection = {
        selectedProducts: [
          {
            catalogId: 'B01MSSDEPK',
            name: 'CeraVe Hydrating Cleanser',
            brand: 'CeraVe',
            category: 'cleanser',
            price: 12.99,
            whySelected: 'Gentle, non-foaming cleanser',
            compatibilityScore: 95,
            phase: 'immediate',
            frequency: 'daily',
            timeOfDay: 'morning_and_evening',
            applicationInstructions: 'Massage gently onto damp skin',
            startAfterDays: 0,
            restrictions: ['Avoid hot water']
          }
        ],
        routineMapping: {
          immediate: [
            {
              stepName: 'Gentle cleansing',
              catalogIds: ['B01MSSDEPK'],
              applicationOrder: 1
            }
          ],
          adaptation: [],
          maintenance: []
        },
        budgetAnalysis: {
          totalCost: 45.97,
          monthlyCost: 23.50,
          costPerPhase: {
            immediate: 15.99,
            adaptation: 18.99,
            maintenance: 11.99
          },
          valueScore: 88
        },
        noFallbacks: true,
        selectionRationale: 'Selected products based on gentle approach'
      }

      expect(() => validateProductSelectionV2(validProductSelection)).not.toThrow()
    })

    it('should reject when noFallbacks is false', () => {
      const invalidProductSelection = {
        selectedProducts: [
          {
            catalogId: 'B01MSSDEPK',
            name: 'CeraVe Hydrating Cleanser',
            brand: 'CeraVe',
            category: 'cleanser',
            whySelected: 'Gentle, non-foaming cleanser',
            compatibilityScore: 95,
            phase: 'immediate',
            frequency: 'daily',
            timeOfDay: 'morning_and_evening',
            applicationInstructions: 'Massage gently onto damp skin'
          }
        ],
        routineMapping: {
          immediate: [],
          adaptation: [],
          maintenance: []
        },
        budgetAnalysis: {
          totalCost: 45.97,
          monthlyCost: 23.50,
          costPerPhase: {
            immediate: 15.99,
            adaptation: 18.99,
            maintenance: 11.99
          },
          valueScore: 88
        },
        noFallbacks: false, // Invalid - must be true
        selectionRationale: 'Selected products based on gentle approach'
      }

      expect(() => validateProductSelectionV2(invalidProductSelection)).toThrow()
    })
  })
})

