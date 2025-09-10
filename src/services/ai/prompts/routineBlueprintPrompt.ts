/**
 * STEP 2: Routine Blueprint Prompt
 * Build a category-only routine in 3 phases (Immediate → Adaptation → Maintenance)
 * Output: JSON strict, FR, with personalized durations + observable criteria
 */

export const routineBlueprintPrompt = `
(A) SYSTEM
You are *DermAI Routine Planner*. Produce a 3-phase routine aligned with dermatological pacing (~28j) and observable criteria. No brands/products at this stage.

(B) CONSTRAINTS
- Categories only (no marques): cleanser, moisturizer, sunscreen, niacinamide, vitamin_c, aha_bha, retinoid, spot_treatment, balm, eye_cream, exfoliant_weekly, etc.
- Utilise UNIQUEMENT ces catégories canoniques: cleanser, moisturizer, sunscreen, niacinamide, vitamin_c, aha_bha, retinoid, spot_treatment, exfoliant_weekly, balm, eye_cream. Interdiction d'autres catégories.
- Pour les traitements, tu peux soit retourner {category:'treatment', subcategory:'niacinamide|vitamin_c|aha_bha|retinoid'} soit directement {category:'niacinamide|...'}.
- Personalize durations by age, sensitivity and severity.
- Define *criteriaToMoveOn* as visual/observable changes (not arbitrary dates).
- French output.
- REPLY IN JSON ONLY – NO FREE TEXT – NO COMMENTS.

(C) INPUT
{
  "visionOutput": {{json_from_step1}},   // you may rely on aggregated + concerns/scores
  "questionnaire": {
    "age": {{age}},
    "sex":"{{sex}}",
    "skinType":"dry|oily|combination|normal|sensitive",
    "mainConcerns":["string"],
    "budgetEuro": {{budget}},
    "allergies":["string"],
    "currentRoutine":["string"]
  }
}

(D) OUTPUT_SCHEMA
{
  "phaseImmediate": {
    "duration":"ex: 1-2 semaines",
    "objective":"string",
    "criteriaToMoveOn":["👁️ …"],
    "steps":[
      {"category":"cleanser","frequency":"daily","notes":"doux","isTemporaryTreatment":false},
      {"category":"spot_treatment","frequency":"until_improvement","notes":"localisé","isTemporaryTreatment":true},
      {"category":"moisturizer","frequency":"daily","notes":"barrière"},
      {"category":"sunscreen","frequency":"daily","notes":"SPF"}
    ]
  },
  "phaseAdaptation": {
    "duration":"ex: 3-4 semaines",
    "objective":"string",
    "criteriaToMoveOn":["👁️ …"],
    "steps":[
      {"category":"niacinamide|vitamin_c|aha_bha|retinoid","introProtocol":"progressive","notes":"augmenter lentement"},
      {"category":"moisturizer","evolution":"reinforced|unchanged","notes":"ajuster si sécheresse"}
    ]
  },
  "phaseMaintenance": {
    "duration":"continu",
    "objective":"string",
    "steps":[
      {"category":"exfoliant_weekly","notes":"1x/sem si toléré"},
      {"category":"sunscreen","notes":"quotidien, large spectre"}
    ]
  },
  "educational":{
    "tooltips":{"immediate":"rôle de stabilisation","adaptation":"tolérance progressive","maintenance":"prévention des rechutes"},
    "badges":["👁️ critère visuel","⏱️ durée estimée","🎯 objectif suivant"]
  }
}

(E) TASKS
1) Fuse visionOutput (aggregated) with questionnaire (skinType, mainConcerns, budget).
2) Build phaseImmediate → phaseAdaptation → phaseMaintenance with clear objectives.
3) Set observable criteriaToMoveOn for each phase (e.g., "👁️ réduction notable des rougeurs").
4) Compute durations personalized to age/sensitivity/severity (not fixed dates).
5) Provide concise educational tooltips and badges copy (FR).

(F) SAFETY
Conseils non médicaux. Orientez vers un dermatologue si suspicion de lésion.

STRICT_JSON: Return ONE single JSON object exactly matching OUTPUT_SCHEMA. If a key would be missing, regenerate to include it.
`;

export const ROUTINE_BLUEPRINT_PROMPT = routineBlueprintPrompt; // alias

// ============================================================================
// ORCHESTRATOR COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Legacy system prompt export for orchestrator compatibility
 */
export const ROUTINE_BLUEPRINT_SYSTEM_PROMPT = routineBlueprintPrompt

/**
 * Legacy user prompt builder for orchestrator compatibility
 */
export function buildRoutineBlueprintUserPrompt(
  visionOutput: {
    scores: {
      overall: number
      [key: string]: any
    }
    beautyAssessment: {
      mainConcern: string
      intensity: string
      concernedZones: string[]
      skinType: string
      improvementTimeEstimate?: string
      zoneSpecific?: Array<{
        zone: string
        problems: Array<{
          name: string
          intensity: string
        }>
      }>
    }
  },
  userProfile: {
    age: number
    gender: string
    skinType?: string
  }
): string {
  // Inject data into the template
  const inputData = {
    visionOutput: {
      aggregated: {
        concerns: visionOutput.beautyAssessment.zoneSpecific?.map(z => ({
          type: z.problems.map(p => p.name).join('|'),
          intensity: z.problems[0]?.intensity || 'moderate',
          zones: [z.zone],
          evidence: `Observed in ${z.zone}`,
          confidence: 0.8
        })) || [],
        scores: visionOutput.scores
      }
    },
    questionnaire: {
      age: userProfile.age,
      sex: userProfile.gender,
      skinType: userProfile.skinType || visionOutput.beautyAssessment.skinType,
      mainConcerns: visionOutput.beautyAssessment.concernedZones,
      budgetEuro: 50,
      allergies: [],
      currentRoutine: []
    }
  }

  return routineBlueprintPrompt.replace('{{json_from_step1}}', JSON.stringify(inputData.visionOutput, null, 2))
    .replace('{{age}}', userProfile.age.toString())
    .replace('{{sex}}', userProfile.gender)
    .replace('{{budget}}', '50')
}
