/**
 * STEP 3: Product Selection Prompt
 * Map the category blueprint to the INTERNAL catalog only, with budget/allergy/skinType constraints
 * Output: JSON strict, FR, with alternatives and budget allocation
 */

export const productSelectionPrompt = `
(A) SYSTEM
You are *DermAI Product Selector*. Select products exclusively from the provided INTERNAL catalog. Never return empty/generic answers: metrics.noFallbacks must be true.

(B) CONSTRAINTS
- Respect the blueprint categories, the user's skinType and allergies, and the declared budget.
- Allocate budget by need priority (more for critical concerns).
- If over budget, propose intelligent alternatives (balm/oil/budget tier) and rebalance.
- French output.
- REPLY IN JSON ONLY – NO FREE TEXT – NO COMMENTS.

(C) INPUT
{
  "routineBlueprint": {{json_from_step2}},
  "catalog": {{catalog_json}},
  "user": {"budgetEuro": {{budget}}, "skinType":"{{skinType}}", "allergies":["string"]}
}

(D) OUTPUT_SCHEMA
{
  "selections":[
    {
      "category":"cleanser",
      "picked":{"id":"string","name":"string","brand":"string","price":12.9},
      "why":"string (match concern/skinType/budget)",
      "alternatives":[{"id":"string","why":"budget|sensibilité|stock"}]
    }
  ],
  "budget":{
    "allocatedByCategory":[{"category":"cleanser","euro":12.0}],
    "total":0,
    "utilization_pct":0
  },
  "notes":"string",
  "metrics":{"catalogCoveragePct":100,"noFallbacks":true}
}

(E) TASKS
1) Distribute user's budget across categories by detected priority from the blueprint.
2) For each step, pick one product + alternatives if needed; explain "why" briefly.
3) Guarantee metrics.noFallbacks=true via alternatives or budget rebalancing.
4) Ensure allergen exclusion and skinType compatibility.

(F) SCORING
Score = concern_match(40) + efficacy(25) + price_efficiency(20) + priority_score(10) + clinical/derm(5).

(G) SAFETY
Exclude any product matching listed allergens; if conflict, replace with a safe alternative.

STRICT_JSON: Return ONE single JSON object exactly matching OUTPUT_SCHEMA. If a key would be missing, regenerate to include it.
`;

export const PRODUCT_SELECTION_PROMPT = productSelectionPrompt; // alias

// ============================================================================
// ORCHESTRATOR COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Legacy system prompt builder for orchestrator compatibility
 */
export function buildProductSelectionSystemPrompt(catalogText: string): string {
  return productSelectionPrompt.replace('{{catalog_json}}', JSON.stringify(catalogText.split('\n').map(line => {
    const match = line.match(/- (\w+) : (.+) \((.+), (.+)\) - (.+)/)
    if (match) {
      return {
        id: match[1],
        name: match[2],
        brand: match[3],
        category: match[4],
        benefits: match[5]
      }
    }
    return null
  }).filter(Boolean), null, 2))
}

/**
 * Legacy user prompt builder for orchestrator compatibility
 */
export function buildProductSelectionUserPrompt(
  visionOutput: {
    beautyAssessment: {
      mainConcern: string
      intensity: string
      concernedZones: string[]
      skinType: string
    }
  },
  routineBlueprint: {
    phases: {
      immediate: Array<{
        name: string
        category: string
        frequency: string
        timeOfDay: string
      }>
      adaptation: Array<{
        name: string
        category: string
        frequency: string
        timeOfDay: string
      }>
      maintenance: Array<{
        name: string
        category: string
        frequency: string
        timeOfDay: string
      }>
    }
  },
  userProfile: {
    age: number
    gender: string
    skinType?: string
  },
  budget: string,
  allergies?: {
    ingredients?: string[]
    pastReactions?: string
  }
): string {
  // Inject data into the template
  const routineBlueprintJson = JSON.stringify({
    phaseImmediate: {
      steps: routineBlueprint.phases.immediate.map(step => ({
        category: step.category,
        frequency: step.frequency,
        notes: step.name
      }))
    },
    phaseAdaptation: {
      steps: routineBlueprint.phases.adaptation.map(step => ({
        category: step.category,
        frequency: step.frequency,
        notes: step.name
      }))
    },
    phaseMaintenance: {
      steps: routineBlueprint.phases.maintenance.map(step => ({
        category: step.category,
        frequency: step.frequency,
        notes: step.name
      }))
    }
  }, null, 2)

  return productSelectionPrompt
    .replace('{{json_from_step2}}', routineBlueprintJson)
    .replace('{{budget}}', budget.replace(/[^\d]/g, ''))
    .replace('{{skinType}}', userProfile.skinType || visionOutput.beautyAssessment.skinType)
}
