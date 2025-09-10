/**
 * Routine Blueprint Normalization
 * Normalizes Step 2 output to ensure canonical categories for Step 3
 */

import { CATEGORY_SYNONYMS, CANONICAL } from './categoryMap'

type Step = {
  category: string
  subcategory?: string
  [k: string]: any
}

/**
 * Canonize a token to its canonical form
 */
function canonizeToken(token?: string): string | undefined {
  if (!token) return undefined
  const t = String(token).toLowerCase().trim()
  if (CANONICAL.has(t)) return t
  return CATEGORY_SYNONYMS[t] ?? t
}

/**
 * Normalize a single step to canonical categories
 */
function normalizeStep(step: Step): Step | null {
  const cat0 = canonizeToken(step.category)
  let cat = cat0
  let sub = canonizeToken(step.subcategory)

  // Allow "treatment"+"subcategory" or direct category = one of (niacinamide|vitamin_c|aha_bha|retinoid)
  const treatmentSubs = new Set(["niacinamide", "vitamin_c", "aha_bha", "retinoid"])

  if (cat === "treatment" && sub && treatmentSubs.has(sub)) {
    // Keep treatment + subcategory format
  } else if (treatmentSubs.has(cat || "")) {
    // Promote direct subtype into category, drop subcategory
    sub = undefined
  } else if (cat && !CANONICAL.has(cat)) {
    // Unknown category after mapping -> drop this step
    console.warn(`⚠️ Dropping step with unknown category: ${step.category} (mapped to: ${cat})`)
    return null
  }

  if (!cat) {
    console.warn(`⚠️ Dropping step with empty category:`, step)
    return null
  }

  return { ...step, category: cat, subcategory: sub }
}

/**
 * Normalize routine blueprint for catalog compatibility
 * Ensures all categories are canonical before passing to Step 3
 */
export function normalizeRoutineForCatalog(blueprint: any) {
  if (!blueprint) {
    console.warn('⚠️ Empty blueprint provided to normalizeRoutineForCatalog')
    return blueprint
  }

  const out = JSON.parse(JSON.stringify(blueprint || {}))
  let totalSteps = 0
  let normalizedSteps = 0
  let droppedSteps = 0

  const phases = ["phaseImmediate", "phaseAdaptation", "phaseMaintenance"]
  
  for (const ph of phases) {
    const steps: Step[] = out?.[ph]?.steps || []
    const cleaned: Step[] = []
    
    for (const s of steps) {
      totalSteps++
      const normalized = normalizeStep(s)
      if (normalized) {
        cleaned.push(normalized)
        normalizedSteps++
      } else {
        droppedSteps++
      }
    }
    
    if (out?.[ph]) {
      out[ph].steps = cleaned
    }
  }

  console.log(`📊 Routine normalization: ${normalizedSteps}/${totalSteps} steps kept, ${droppedSteps} dropped`)
  
  return out
}

/**
 * Validate that a routine blueprint contains only canonical categories
 */
export function validateCanonicalCategories(blueprint: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!blueprint) {
    return { valid: false, errors: ['Blueprint is empty'] }
  }

  const phases = ["phaseImmediate", "phaseAdaptation", "phaseMaintenance"]
  const treatmentSubs = new Set(["niacinamide", "vitamin_c", "aha_bha", "retinoid"])
  
  for (const ph of phases) {
    const steps: Step[] = blueprint?.[ph]?.steps || []
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const category = step.category?.toLowerCase().trim()
      const subcategory = step.subcategory?.toLowerCase().trim()
      
      if (!category) {
        errors.push(`${ph}.steps[${i}]: Missing category`)
        continue
      }
      
      if (category === "treatment") {
        if (!subcategory) {
          errors.push(`${ph}.steps[${i}]: Treatment category requires subcategory`)
        } else if (!treatmentSubs.has(subcategory)) {
          errors.push(`${ph}.steps[${i}]: Invalid treatment subcategory: ${subcategory}`)
        }
      } else if (!CANONICAL.has(category)) {
        errors.push(`${ph}.steps[${i}]: Non-canonical category: ${category}`)
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}

