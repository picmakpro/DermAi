/**
 * Tests for V2 to Legacy UI Adapters
 * Validates that V2 objects are correctly mapped to existing UI shapes
 */

import { describe, it, expect } from 'vitest'
import {
  toExistingVisionShape,
  toExistingRoutineShape,
  toExistingProductsShape
} from '../adapters'
import type { VisionOutputV2T, RoutineBlueprintV2T, ProductSelectionV2T } from '../schemas'

describe('V2 to Legacy UI Adapters', () => {
  const mockVisionOutputV2: VisionOutputV2T = {
    perPhoto: [
      {
        url: 'https://example.com/photo1.jpg',
        angle: 'front',
        imageQuality: {
          issues: ['slight glare'],
          overall: 'good'
        },
        findings: [
          {
            zone: 'forehead',
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
      method: 'weighted_average',
      weightsUsed: { front: 0.5, left: 0.25, right: 0.25 },
      globalFindings: [
        {
          zone: 'forehead',
          finding: 'Mild redness in T-zone',
          evidence: 'Consistent across multiple angles',
          confidence: 0.85
        }
      ],
      concerns: [
        {
          type: 'redness',
          intensity: 'mild',
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

  const mockRoutineBlueprintV2: RoutineBlueprintV2T = {
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

  const mockProductSelectionV2: ProductSelectionV2T = {
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
      },
      {
        category: 'niacinamide',
        picked: {
          id: 'B01MDTVZTZ',
          name: 'The Ordinary Niacinamide 10% + Zinc 1%',
          brand: 'The Ordinary',
          price: 8.99
        },
        why: 'Effective for pore reduction and oil control',
        alternatives: []
      }
    ],
    budget: {
      allocatedByCategory: [
        { category: 'cleanser', euro: 12.99 },
        { category: 'niacinamide', euro: 8.99 }
      ],
      total: 21.98,
      utilization_pct: 100
    },
    notes: 'Selected based on skin sensitivity and budget constraints',
    metrics: {
      catalogCoveragePct: 100,
      noFallbacks: true
    }
  }

  describe('toExistingVisionShape', () => {
    it('should map V2 vision output to legacy vision shape', () => {
      const result = toExistingVisionShape(mockVisionOutputV2)

      // Check scores structure
      expect(result.scores).toHaveProperty('overall')
      expect(result.scores).toHaveProperty('hydration')
      expect(result.scores).toHaveProperty('wrinkles')
      expect(result.scores).toHaveProperty('firmness')
      expect(result.scores).toHaveProperty('radiance')
      expect(result.scores).toHaveProperty('pores')
      expect(result.scores).toHaveProperty('spots')
      expect(result.scores).toHaveProperty('darkCircles')
      expect(result.scores).toHaveProperty('skinAge')

      // Check score values
      expect(result.scores.hydration.value).toBe(75)
      expect(result.scores.pores.value).toBe(55) // pores value from V2
      expect(result.scores.firmness.value).toBe(70) // texture mapped to firmness
      expect(result.scores.spots.value).toBe(80) // pigmentation mapped to spots (last one wins)
      expect(result.scores.wrinkles.value).toBe(85)
      expect(result.scores.darkCircles.value).toBe(70) // sensitivity mapped to darkCircles

      // Check beauty assessment
      expect(result.beautyAssessment).toHaveProperty('mainConcern', 'redness')
      expect(result.beautyAssessment).toHaveProperty('intensity', 'mild')
      expect(result.beautyAssessment).toHaveProperty('concernedZones', ['forehead', 'nose'])
      expect(result.beautyAssessment).toHaveProperty('visualFindings')
      expect(result.beautyAssessment).toHaveProperty('specificities')
      expect(result.beautyAssessment).toHaveProperty('zoneSpecific')

      // Check specificities
      expect(result.beautyAssessment.specificities).toHaveLength(1)
      expect(result.beautyAssessment.specificities![0]).toHaveProperty('name', 'redness')
      expect(result.beautyAssessment.specificities![0]).toHaveProperty('intensity', 'mild')

      // Check zone specific
      expect(result.beautyAssessment.zoneSpecific).toHaveLength(1)
      expect(result.beautyAssessment.zoneSpecific![0]).toHaveProperty('zone', 'forehead')
      expect(result.beautyAssessment.zoneSpecific![0]).toHaveProperty('problems')
    })

    it('should handle missing scores gracefully', () => {
      const incompleteV2 = {
        ...mockVisionOutputV2,
        aggregated: {
          ...mockVisionOutputV2.aggregated,
          scores: {
            hydration: 75,
            oiliness: 60,
            pores: 55,
            texture: 70,
            redness: 65,
            pigmentation: 80,
            wrinkles_fine_lines: 85,
            sensitivity: 70
          }
        }
      }

      const result = toExistingVisionShape(incompleteV2)

      // Should have all required scores with defaults for missing ones
      expect(result.scores).toHaveProperty('overall')
      expect(result.scores).toHaveProperty('hydration')
      expect(result.scores).toHaveProperty('wrinkles')
      expect(result.scores).toHaveProperty('firmness')
      expect(result.scores).toHaveProperty('radiance')
      expect(result.scores).toHaveProperty('pores')
      expect(result.scores).toHaveProperty('spots')
      expect(result.scores).toHaveProperty('darkCircles')
      expect(result.scores).toHaveProperty('skinAge')
    })
  })

  describe('toExistingRoutineShape', () => {
    it('should map V2 routine blueprint to legacy routine shape', () => {
      const result = toExistingRoutineShape(mockRoutineBlueprintV2)

      // Check routine structure
      expect(result.routine).toHaveProperty('immediate')
      expect(result.routine).toHaveProperty('adaptation')
      expect(result.routine).toHaveProperty('maintenance')

      // Check immediate phase
      expect(result.routine.immediate).toHaveLength(2)
      expect(result.routine.immediate[0]).toHaveProperty('name', 'cleanser')
      expect(result.routine.immediate[0]).toHaveProperty('frequency', 'daily')
      expect(result.routine.immediate[0]).toHaveProperty('timing', 'morning_and_evening')
      expect(result.routine.immediate[0]).toHaveProperty('catalogId', 'B01MSSDEPK')
      expect(result.routine.immediate[0]).toHaveProperty('application')
      expect(result.routine.immediate[0]).toHaveProperty('startDate', 'now')

      // Check adaptation phase
      expect(result.routine.adaptation).toHaveLength(1)
      expect(result.routine.adaptation[0]).toHaveProperty('name', 'niacinamide')
      expect(result.routine.adaptation[0]).toHaveProperty('frequency', 'daily')
      expect(result.routine.adaptation[0]).toHaveProperty('startDate')

      // Check maintenance phase
      expect(result.routine.maintenance).toHaveLength(1)
      expect(result.routine.maintenance[0]).toHaveProperty('name', 'exfoliant_weekly')

      // Check localized routine
      expect(result.localizedRoutine).toBeDefined()
      expect(Array.isArray(result.localizedRoutine)).toBe(true)

      // Check unified routine
      expect(result.unifiedRoutine).toBeDefined()
      expect(Array.isArray(result.unifiedRoutine)).toBe(true)
      expect(result.unifiedRoutine.length).toBeGreaterThan(0)

      // Check unified routine structure
      const firstStep = result.unifiedRoutine[0]
      expect(firstStep).toHaveProperty('stepNumber')
      expect(firstStep).toHaveProperty('title')
      expect(firstStep).toHaveProperty('targetArea')
      expect(firstStep).toHaveProperty('recommendedProducts')
      expect(firstStep).toHaveProperty('applicationAdvice')
      expect(firstStep).toHaveProperty('treatmentType')
      expect(firstStep).toHaveProperty('priority')
      expect(firstStep).toHaveProperty('phase')
      expect(firstStep).toHaveProperty('frequency')
      expect(firstStep).toHaveProperty('timeOfDay')
      expect(firstStep).toHaveProperty('category')
    })

    it('should handle empty phases gracefully', () => {
      const emptyRoutine = {
        ...mockRoutineBlueprintV2,
        phaseImmediate: {
          ...mockRoutineBlueprintV2.phaseImmediate,
          steps: []
        }
      }

      const result = toExistingRoutineShape(emptyRoutine)

      expect(result.routine.immediate).toHaveLength(0)
      expect(result.routine.adaptation).toHaveLength(1)
      expect(result.routine.maintenance).toHaveLength(1)
    })
  })

  describe('toExistingProductsShape', () => {
    it('should map V2 product selection to legacy products shape', () => {
      const result = toExistingProductsShape(mockProductSelectionV2)

      // Check products array
      expect(result.products).toHaveLength(2)
      expect(result.products).toContain('CeraVe Hydrating Cleanser')
      expect(result.products).toContain('The Ordinary Niacinamide 10% + Zinc 1%')

      // Check products detailed
      expect(result.productsDetailed).toHaveLength(2)
      expect(result.productsDetailed[0]).toHaveProperty('name', 'CeraVe Hydrating Cleanser')
      expect(result.productsDetailed[0]).toHaveProperty('brand', 'CeraVe')
      expect(result.productsDetailed[0]).toHaveProperty('price', 12.99)
      expect(result.productsDetailed[0]).toHaveProperty('imageUrl')
      expect(result.productsDetailed[0]).toHaveProperty('affiliateLink')
      expect(result.productsDetailed[0]).toHaveProperty('frequency', 'Quotidien')
      expect(result.productsDetailed[0]).toHaveProperty('benefits')
      expect(result.productsDetailed[0]).toHaveProperty('badges')

      // Check overview
      expect(result.overview).toBe('Selected based on skin sensitivity and budget constraints')

      // Check zone specific care
      expect(result.zoneSpecificCare).toContain('cleanser')
      expect(result.zoneSpecificCare).toContain('niacinamide')

      // Check restrictions
      expect(result.restrictions).toBeDefined()
    })

    it('should handle empty selections gracefully', () => {
      const emptySelection = {
        ...mockProductSelectionV2,
        selections: []
      }

      const result = toExistingProductsShape(emptySelection)

      expect(result.products).toHaveLength(0)
      expect(result.productsDetailed).toHaveLength(0)
      expect(result.overview).toBeDefined()
      expect(result.zoneSpecificCare).toBeDefined()
      expect(result.restrictions).toBeDefined()
    })

    it('should map different product categories to correct frequencies', () => {
      const mixedSelection = {
        ...mockProductSelectionV2,
        selections: [
          {
            category: 'cleanser',
            picked: { id: 'B01MSSDEPK', name: 'Cleanser', brand: 'Brand', price: 10 },
            why: 'Daily cleanser'
          },
          {
            category: 'aha_bha',
            picked: { id: 'B00949CTQQ', name: 'Exfoliant', brand: 'Brand', price: 15 },
            why: 'Weekly exfoliant'
          },
          {
            category: 'spot_treatment',
            picked: { id: 'B00BNUY3HE', name: 'Spot Treatment', brand: 'Brand', price: 8 },
            why: 'As needed treatment'
          }
        ]
      }

      const result = toExistingProductsShape(mixedSelection)

      expect(result.productsDetailed[0].frequency).toBe('Quotidien')
      expect(result.productsDetailed[1].frequency).toBe('Hebdomadaire')
      expect(result.productsDetailed[2].frequency).toBe('Ponctuel')
    })
  })

  describe('Integration Tests', () => {
    it('should produce consistent results across multiple calls', () => {
      const visionResult1 = toExistingVisionShape(mockVisionOutputV2)
      const visionResult2 = toExistingVisionShape(mockVisionOutputV2)

      expect(visionResult1.scores.overall).toBe(visionResult2.scores.overall)
      expect(visionResult1.beautyAssessment.mainConcern).toBe(visionResult2.beautyAssessment.mainConcern)

      const routineResult1 = toExistingRoutineShape(mockRoutineBlueprintV2)
      const routineResult2 = toExistingRoutineShape(mockRoutineBlueprintV2)

      expect(routineResult1.routine.immediate.length).toBe(routineResult2.routine.immediate.length)
      expect(routineResult1.unifiedRoutine.length).toBe(routineResult2.unifiedRoutine.length)

      const productsResult1 = toExistingProductsShape(mockProductSelectionV2)
      const productsResult2 = toExistingProductsShape(mockProductSelectionV2)

      expect(productsResult1.products.length).toBe(productsResult2.products.length)
      expect(productsResult1.productsDetailed.length).toBe(productsResult2.productsDetailed.length)
    })

    it('should handle edge cases without throwing', () => {
      const minimalVision = {
        perPhoto: [],
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

      const minimalRoutine = {
        phaseImmediate: { duration: '1 week', objective: 'test', criteriaToMoveOn: [], steps: [] },
        phaseAdaptation: { duration: '2 weeks', objective: 'test', criteriaToMoveOn: [], steps: [] },
        phaseMaintenance: { duration: 'ongoing', objective: 'test', criteriaToMoveOn: [], steps: [] },
        educational: { tooltips: {}, badges: [] }
      }

      const minimalProducts = {
        selections: [],
        budget: { allocatedByCategory: [], total: 0, utilization_pct: 0 },
        metrics: { catalogCoveragePct: 0, noFallbacks: true as const }
      }

      expect(() => toExistingVisionShape(minimalVision)).not.toThrow()
      expect(() => toExistingRoutineShape(minimalRoutine)).not.toThrow()
      expect(() => toExistingProductsShape(minimalProducts)).not.toThrow()
    })
  })
})