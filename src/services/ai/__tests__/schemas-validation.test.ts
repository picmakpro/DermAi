/**
 * Validation tests for V2 Schemas
 * Tests parse() succeeds on valid samples and fails with readable errors on bad shapes
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
    const validVisionOutput = {
      perPhoto: [
        {
          url: 'https://example.com/photo1.jpg',
          angle: 'front' as const,
          imageQuality: {
            issues: ['slight glare'],
            overall: 'good' as const
          },
          findings: [
            {
              zone: 'forehead' as const,
              finding: 'Mild redness observed',
              evidence: 'Visible pinkish tone in T-zone',
              confidence: 0.8
            }
          ],
          scores: {
            hydration: 75,
            oiliness: 60,
            pores: 55,
            texture: 70,
            redness: 65,
            pigmentation: 80,
            wrinkles_fine_lines: 85,
            sensitivity: 70
          },
          notes: 'Good image quality'
        }
      ],
      aggregated: {
        method: 'weighted_average' as const,
        weightsUsed: { front: 0.5, left: 0.25, right: 0.25 },
        globalFindings: [
          {
            zone: 'forehead' as const,
            finding: 'Mild redness in T-zone',
            evidence: 'Consistent across multiple angles',
            confidence: 0.85
          }
        ],
        concerns: [
          {
            type: 'redness',
            intensity: 'mild' as const,
            zones: ['forehead', 'nose'],
            evidence: 'Visible pinkish tone',
            confidence: 0.8
          }
        ],
        scores: {
          hydration: 75,
          oiliness: 60,
          pores: 55,
          texture: 70,
          redness: 65,
          pigmentation: 80,
          wrinkles_fine_lines: 85,
          sensitivity: 70
        },
        notes: 'Overall good skin condition'
      }
    }

    it('should parse valid vision output', () => {
      expect(() => VisionOutputV2Schema.parse(validVisionOutput)).not.toThrow()
      const result = VisionOutputV2Schema.parse(validVisionOutput)
      expect(result.perPhoto).toHaveLength(1)
      expect(result.aggregated.method).toBe('weighted_average')
      expect(result.aggregated.concerns[0].intensity).toBe('mild')
    })

    it('should reject invalid angle values', () => {
      const invalidOutput = {
        ...validVisionOutput,
        perPhoto: [{
          ...validVisionOutput.perPhoto[0],
          angle: 'invalid_angle'
        }]
      }
      
      expect(() => VisionOutputV2Schema.parse(invalidOutput)).toThrow()
    })

    it('should reject scores outside 0-100 range', () => {
      const invalidOutput = {
        ...validVisionOutput,
        perPhoto: [{
          ...validVisionOutput.perPhoto[0],
          scores: {
            ...validVisionOutput.perPhoto[0].scores,
            hydration: 150 // Invalid: > 100
          }
        }]
      }
      
      expect(() => VisionOutputV2Schema.parse(invalidOutput)).toThrow()
    })

    it('should reject confidence outside 0-1 range', () => {
      const invalidOutput = {
        ...validVisionOutput,
        perPhoto: [{
          ...validVisionOutput.perPhoto[0],
          findings: [{
            ...validVisionOutput.perPhoto[0].findings[0],
            confidence: 1.5 // Invalid: > 1
          }]
        }]
      }
      
      expect(() => VisionOutputV2Schema.parse(invalidOutput)).toThrow()
    })
  })

  describe('RoutineBlueprintV2Schema', () => {
    const validRoutineBlueprint = {
      phaseImmediate: {
        duration: '1-2 semaines',
        objective: 'Stabiliser la peau et réduire les rougeurs',
        criteriaToMoveOn: ['👁️ Réduction notable des rougeurs', '👁️ Peau non irritée'],
        steps: [
          {
            category: 'cleanser',
            frequency: 'daily',
            notes: 'doux',
            isTemporaryTreatment: false
          },
          {
            category: 'spot_treatment',
            frequency: 'until_improvement',
            notes: 'localisé',
            isTemporaryTreatment: true
          }
        ]
      },
      phaseAdaptation: {
        duration: '3-4 semaines',
        objective: 'Introduire des actifs progressivement',
        criteriaToMoveOn: ['👁️ Tolérance aux actifs', '👁️ Amélioration de la texture'],
        steps: [
          {
            category: 'niacinamide',
            introProtocol: 'progressive',
            notes: 'augmenter lentement'
          }
        ]
      },
      phaseMaintenance: {
        duration: 'continu',
        objective: 'Maintenir les résultats obtenus',
        criteriaToMoveOn: ['👁️ Résultats maintenus'],
        steps: [
          {
            category: 'exfoliant_weekly',
            notes: '1x/sem si toléré'
          }
        ]
      },
      educational: {
        tooltips: {
          immediate: 'rôle de stabilisation',
          adaptation: 'tolérance progressive',
          maintenance: 'prévention des rechutes'
        },
        badges: ['👁️ critère visuel', '⏱️ durée estimée', '🎯 objectif suivant']
      }
    }

    it('should parse valid routine blueprint', () => {
      expect(() => RoutineBlueprintV2Schema.parse(validRoutineBlueprint)).not.toThrow()
      const result = RoutineBlueprintV2Schema.parse(validRoutineBlueprint)
      expect(result.phaseImmediate.steps).toHaveLength(2)
      expect(result.phaseAdaptation.steps).toHaveLength(1)
      expect(result.phaseMaintenance.steps).toHaveLength(1)
      expect(result.educational.badges).toContain('👁️ critère visuel')
    })

    it('should reject missing required fields', () => {
      const invalidOutput = {
        ...validRoutineBlueprint,
        phaseImmediate: {
          // Missing duration, objective, criteriaToMoveOn, steps
        }
      }
      
      expect(() => RoutineBlueprintV2Schema.parse(invalidOutput)).toThrow()
    })

    it('should accept optional fields', () => {
      const minimalOutput = {
        ...validRoutineBlueprint,
        phaseImmediate: {
          ...validRoutineBlueprint.phaseImmediate,
          steps: [{
            category: 'cleanser'
            // No optional fields
          }]
        }
      }
      
      expect(() => RoutineBlueprintV2Schema.parse(minimalOutput)).not.toThrow()
    })
  })

  describe('ProductSelectionV2Schema', () => {
    const validProductSelection = {
      selections: [
        {
          category: 'cleanser',
          picked: {
            id: 'B01MSSDEPK',
            name: 'CeraVe Hydrating Cleanser',
            brand: 'CeraVe',
            price: 12.99
          },
          why: 'Gentle, non-foaming cleanser perfect for sensitive skin',
          alternatives: [
            {
              id: 'B000O7PH34',
              why: 'budget option'
            }
          ]
        }
      ],
      budget: {
        allocatedByCategory: [
          { category: 'cleanser', euro: 12.99 }
        ],
        total: 12.99,
        utilization_pct: 100
      },
      notes: 'Selected based on skin sensitivity',
      metrics: {
        catalogCoveragePct: 100,
        noFallbacks: true
      }
    }

    it('should parse valid product selection', () => {
      expect(() => ProductSelectionV2Schema.parse(validProductSelection)).not.toThrow()
      const result = ProductSelectionV2Schema.parse(validProductSelection)
      expect(result.selections).toHaveLength(1)
      expect(result.metrics.noFallbacks).toBe(true)
      expect(result.budget.total).toBe(12.99)
    })

    it('should reject when noFallbacks is false', () => {
      const invalidOutput = {
        ...validProductSelection,
        metrics: {
          ...validProductSelection.metrics,
          noFallbacks: false // Invalid: must be true
        }
      }
      
      expect(() => ProductSelectionV2Schema.parse(invalidOutput)).toThrow()
    })

    it('should accept selections without alternatives', () => {
      const minimalOutput = {
        ...validProductSelection,
        selections: [{
          ...validProductSelection.selections[0],
          alternatives: undefined
        }]
      }
      
      expect(() => ProductSelectionV2Schema.parse(minimalOutput)).not.toThrow()
    })

    it('should accept without notes', () => {
      const minimalOutput = {
        ...validProductSelection,
        notes: undefined
      }
      
      expect(() => ProductSelectionV2Schema.parse(minimalOutput)).not.toThrow()
    })
  })

  describe('Validation Helper Functions', () => {
    it('should validate vision output with helper function', () => {
      const validData = {
        perPhoto: [{
          url: 'test.jpg',
          angle: 'front' as const,
          imageQuality: { issues: [], overall: 'good' as const },
          findings: [],
          scores: {
            hydration: 50, oiliness: 50, pores: 50, texture: 50,
            redness: 50, pigmentation: 50, wrinkles_fine_lines: 50, sensitivity: 50
          }
        }],
        aggregated: {
          method: 'weighted_average' as const,
          globalFindings: [],
          concerns: [],
          scores: {
            hydration: 50, oiliness: 50, pores: 50, texture: 50,
            redness: 50, pigmentation: 50, wrinkles_fine_lines: 50, sensitivity: 50
          }
        }
      }

      expect(() => validateVisionOutputV2(validData)).not.toThrow()
    })

    it('should throw readable error for invalid data', () => {
      const invalidData = { invalid: 'data' }
      
      expect(() => validateVisionOutputV2(invalidData)).toThrow('Invalid VisionOutputV2 format')
    })
  })
})

