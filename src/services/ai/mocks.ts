/**
 * Mock AI Provider
 * Returns valid V2 shapes for local testing without OpenAI API calls
 */

import { VisionOutputV2Schema, RoutineBlueprintV2Schema, ProductSelectionV2Schema } from './schemas'
import type { AiProvider } from './provider'

export const mockProvider: AiProvider = {
  async step1Vision(_: any) {
    console.log('🤖 Mock Provider: step1Vision called')
    
    // Return minimal valid object per VisionOutputV2Schema
    const mockVisionOutput = {
      perPhoto: [{
        url: "mock://front", 
        angle: "front",
        imageQuality: { 
          issues: [], 
          overall: "good" 
        },
        findings: [],
        scores: { 
          hydration: 60, 
          oiliness: 55, 
          pores: 50, 
          texture: 55, 
          redness: 45, 
          pigmentation: 40, 
          wrinkles_fine_lines: 70, 
          sensitivity: 50 
        },
        notes: "Mock analysis for testing"
      }],
      aggregated: {
        method: "weighted_average",
        weightsUsed: { front: 1.0 },
        globalFindings: [],
        concerns: [],
        scores: { 
          hydration: 60, 
          oiliness: 55, 
          pores: 50, 
          texture: 55, 
          redness: 45, 
          pigmentation: 40, 
          wrinkles_fine_lines: 70, 
          sensitivity: 50 
        },
        notes: "Mock aggregated analysis"
      }
    }
    
    // Validate with schema
    return VisionOutputV2Schema.parse(mockVisionOutput)
  },

  async step2Routine(_: any) {
    console.log('🤖 Mock Provider: step2Routine called')
    
    const mockRoutineBlueprint = {
      phaseImmediate: {
        duration: "1-2 semaines",
        objective: "stabiliser",
        criteriaToMoveOn: ["👁️ réduction notable des rougeurs"],
        steps: [
          { category: "cleanser", frequency: "daily", notes: "doux", isTemporaryTreatment: false },
          { category: "spot_treatment", frequency: "until_improvement", notes: "localisé", isTemporaryTreatment: true },
          { category: "moisturizer", frequency: "daily", notes: "barrière" },
          { category: "sunscreen", frequency: "daily", notes: "SPF" }
        ]
      },
      phaseAdaptation: {
        duration: "3-4 semaines",
        objective: "introduire actifs progressifs",
        criteriaToMoveOn: ["👁️ tolérance établie"],
        steps: [
          { category: "niacinamide", introProtocol: "progressive", notes: "lentement" },
          { category: "moisturizer", evolution: "unchanged", notes: "ajuster si sec" }
        ]
      },
      phaseMaintenance: {
        duration: "continu",
        objective: "prévenir rechutes",
        criteriaToMoveOn: [],
        steps: [
          { category: "exfoliant_weekly", notes: "1x/sem" },
          { category: "sunscreen", notes: "quotidien" }
        ]
      },
      educational: {
        tooltips: { 
          immediate: "rôle de stabilisation", 
          adaptation: "tolérance progressive", 
          maintenance: "prévention" 
        },
        badges: ["👁️ critère visuel", "⏱️ durée estimée", "🎯 objectif suivant"]
      }
    }
    
    // Validate with schema
    return RoutineBlueprintV2Schema.parse(mockRoutineBlueprint)
  },

  async step3Products(_: any) {
    console.log('🤖 Mock Provider: step3Products called')
    
    const mockProductSelection = {
      selections: [
        { 
          category: "cleanser", 
          picked: { 
            id: "p_cleanser_combo_budget", 
            name: "Gel Nettoyant Doux", 
            brand: "DemoBrand", 
            price: 8.9 
          },
          why: "match skinType/budget", 
          alternatives: [] 
        }
      ],
      budget: { 
        allocatedByCategory: [{ category: "cleanser", euro: 8.9 }], 
        total: 8.9, 
        utilization_pct: 90 
      },
      notes: "Mock product selection for testing",
      metrics: { 
        catalogCoveragePct: 100, 
        noFallbacks: true 
      }
    }
    
    // Validate with schema
    return ProductSelectionV2Schema.parse(mockProductSelection)
  }
}

