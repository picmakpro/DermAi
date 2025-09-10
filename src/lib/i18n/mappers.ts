// Canonical types used across the app (EN-normalized)
export type IntensityEN = 'mild' | 'moderate' | 'severe'

export const normalizeIntensity = (v?: string): IntensityEN | undefined => {
  if (!v) return undefined
  const k = v.toLowerCase()
  const map: Record<string, IntensityEN> = {
    'légère': 'mild',
    'legere': 'mild',
    'modérée': 'moderate',
    'moderee': 'moderate',
    'intense': 'severe'
  }
  if (map[k]) return map[k]
  if (['mild', 'moderate', 'severe'].includes(k)) return k as IntensityEN
  return undefined
}

export type ZoneEN = 'chin' | 'cheeks' | 'forehead' | 'nose' | 'neck' | 'eye-contour'

export const normalizeZone = (z?: string): ZoneEN | undefined => {
  if (!z) return undefined
  const k = z.toLowerCase()
  const map: Record<string, ZoneEN> = {
    menton: 'chin',
    joues: 'cheeks',
    front: 'forehead',
    nez: 'nose',
    cou: 'neck',
    'contour des yeux': 'eye-contour'
  }
  if (map[k]) return map[k]
  const pass: ZoneEN[] = ['chin', 'cheeks', 'forehead', 'nose', 'neck', 'eye-contour']
  return pass.includes(k as ZoneEN) ? (k as ZoneEN) : undefined
}

export type SkinTypeEN = 'dry' | 'normal' | 'combination' | 'oily' | 'sensitive' | 'unknown'

export const normalizeSkinType = (v?: string): SkinTypeEN | undefined => {
  if (!v) return undefined
  const k = v.toLowerCase()
  const map: Record<string, SkinTypeEN> = {
    'sèche': 'dry',
    seche: 'dry',
    normale: 'normal',
    mixte: 'combination',
    grasse: 'oily',
    sensible: 'sensitive',
    'je ne sais pas': 'unknown'
  }
  if (map[k]) return map[k]
  const pass: SkinTypeEN[] = ['dry', 'normal', 'combination', 'oily', 'sensitive', 'unknown']
  return pass.includes(k as SkinTypeEN) ? (k as SkinTypeEN) : undefined
}

export const normalizeConcern = (s: string): string => {
  const k = (s || '').toLowerCase().trim()
  const map: Record<string, string> = {
    // Questionnaire concerns (FR → EN canonical)
    'acné/boutons': 'blemishes',
    'poils incarnés': 'ingrowns',
    'rides/vieillissement': 'wrinkles',
    'taches pigmentaires': 'pigmentation',
    'rougeurs/irritations': 'redness',
    'peau sèche': 'dehydration',
    'points noirs': 'blackheads',
    'cicatrices': 'scars',
    'sensibilité': 'sensitivity',
    'je ne sais pas': 'unknown',
    autres: 'other',
    // Legacy mappings
    rougeurs: 'redness',
    imperfections: 'blemishes',
    taches: 'pigmentation',
    hyperpigmentation: 'pigmentation',
    'pores dilatés': 'enlarged-pores',
    déshydratation: 'dehydration',
    deshydratation: 'dehydration',
    rides: 'wrinkles'
  }
  return map[k] || k // assume already EN if unknown
}

export type GenderEN = 'male' | 'female' | 'other' | 'prefer-not-to-say'

export const normalizeGender = (v?: string): GenderEN | undefined => {
  if (!v) return undefined
  const k = v.toLowerCase()
  const map: Record<string, GenderEN> = {
    homme: 'male',
    femme: 'female',
    autre: 'other',
    'ne souhaite pas préciser': 'prefer-not-to-say'
  }
  if (map[k]) return map[k]
  const pass: GenderEN[] = ['male', 'female', 'other', 'prefer-not-to-say']
  return pass.includes(k as GenderEN) ? (k as GenderEN) : undefined
}

export type RoutinePreferenceEN = 'minimalist' | 'simple' | 'balanced' | 'complete'

export const normalizeRoutinePreference = (v?: string): RoutinePreferenceEN | undefined => {
  if (!v) return undefined
  const k = v.toLowerCase()
  const map: Record<string, RoutinePreferenceEN> = {
    minimaliste: 'minimalist',
    simple: 'simple',
    'équilibrée': 'balanced',
    'equilibree': 'balanced',
    'complète': 'complete',
    complete: 'complete'
  }
  if (map[k]) return map[k]
  const pass: RoutinePreferenceEN[] = ['minimalist', 'simple', 'balanced', 'complete']
  return pass.includes(k as RoutinePreferenceEN) ? (k as RoutinePreferenceEN) : undefined
}

export type BudgetEN = 'under-50' | '50-100' | '100-200' | 'over-200' | 'no-limit'

export const normalizeBudget = (v?: string): BudgetEN | undefined => {
  if (!v) return undefined
  const k = v.toLowerCase().replace(/\s+/g, '')
  const map: Record<string, BudgetEN> = {
    '<50€': 'under-50',
    '50-100€': '50-100',
    '100-200€': '100-200',
    '>200€': 'over-200',
    pasdelimite: 'no-limit'
  }
  if (map[k]) return map[k]
  const pass: BudgetEN[] = ['under-50', '50-100', '100-200', 'over-200', 'no-limit']
  return pass.includes(k as BudgetEN) ? (k as BudgetEN) : undefined
}

/**
 * Normalize a BeautyAssessment object from FR inputs to EN canonical values.
 */
export const normalizeAssessmentFRtoEN = (assessment: any): any => {
  if (!assessment) return assessment

  const normalized = { ...assessment }

  // Intensity → EN
  if (assessment.intensity) {
    normalized.intensity = normalizeIntensity(assessment.intensity) || assessment.intensity
  }

  // Skin type → EN
  if (assessment.skinType) {
    normalized.skinType = normalizeSkinType(assessment.skinType) || assessment.skinType
  }

  // Main concern → EN
  if (assessment.mainConcern) {
    normalized.mainConcern = normalizeConcern(assessment.mainConcern)
  }

  // Concerned zones → EN
  if (Array.isArray(assessment.concernedZones)) {
    normalized.concernedZones = assessment.concernedZones
      .map((zone: string) => normalizeZone(zone) || zone)
      .filter(Boolean)
  }

  // Specificities → EN
  if (Array.isArray(assessment.specificities)) {
    normalized.specificities = assessment.specificities.map((spec: any) => ({
      ...spec,
      intensity: normalizeIntensity(spec.intensity) || spec.intensity,
      zones: Array.isArray(spec.zones)
        ? spec.zones.map((zone: string) => normalizeZone(zone) || zone).filter(Boolean)
        : spec.zones,
      name: normalizeConcern(spec.name || '')
    }))
  }

  // Zone-specific details → EN
  if (Array.isArray(assessment.zoneSpecific)) {
    normalized.zoneSpecific = assessment.zoneSpecific.map((zoneItem: any) => ({
      ...zoneItem,
      zone: normalizeZone(zoneItem.zone) || zoneItem.zone,
      problems: Array.isArray(zoneItem.problems)
        ? zoneItem.problems.map((problem: any) => ({
            ...problem,
            name: normalizeConcern(problem.name || ''),
            intensity: normalizeIntensity(problem.intensity) || problem.intensity
          }))
        : zoneItem.problems
    }))
  }

  return normalized
}

/* ------------------------- Display mappers (EN) ------------------------- */
/* Convert canonical EN codes → human-friendly EN labels for the UI. */

export const getGenderLabel = (gender?: string): string => {
  const map: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    'prefer-not-to-say': 'Prefer not to say'
  }
  return map[gender || ''] || gender || 'Prefer not to say'
}

export const getSkinTypeLabel = (skinType?: string): string => {
  const map: Record<string, string> = {
    dry: 'Dry',
    normal: 'Normal',
    combination: 'Combination',
    oily: 'Oily',
    sensitive: 'Sensitive',
    unknown: 'To be set by AI'
  }
  return map[skinType || ''] || 'To be set by AI'
}

export const getRoutinePreferenceLabel = (preference?: string): string => {
  const map: Record<string, string> = {
    minimalist: 'Minimalist',
    simple: 'Simple',
    balanced: 'Balanced',
    complete: 'Complete'
  }
  return map[preference || ''] || preference || 'Balanced'
}

export const getBudgetLabel = (budget?: string): string => {
  const map: Record<string, string> = {
    'under-50': '< €50',
    '50-100': '€50–€100',
    '100-200': '€100–€200',
    'over-200': '> €200',
    'no-limit': 'No limit'
  }
  return map[budget || ''] || budget || '€50–€100'
}

export const getConcernLabel = (concern?: string): string => {
  const map: Record<string, string> = {
    blemishes: 'Acne/Blemishes',
    ingrowns: 'Ingrown hairs',
    wrinkles: 'Wrinkles/Aging',
    pigmentation: 'Dark spots/Pigmentation',
    redness: 'Redness/Irritation',
    dehydration: 'Dryness/Dehydration',
    blackheads: 'Blackheads',
    scars: 'Scars',
    sensitivity: 'Sensitivity',
    unknown: "I don't know",
    other: 'Other'
  }
  return map[concern || ''] || concern || "I don't know"
}

export const getFrequencyLabel = (frequency?: string): string => {
  const map: Record<string, string> = {
    // FR inputs
    quotidien: 'Daily',
    hebdomadaire: 'Weekly',
    ponctuel: 'As needed',
    // EN canonical
    daily: 'Daily',
    weekly: 'Weekly',
    'as-needed': 'As needed',
    'as_needed': 'As needed'
  }
  const k = (frequency || '').toLowerCase()
  return map[k] || frequency || 'Daily'
}

export const getTimingLabel = (timing?: string): string => {
  const map: Record<string, string> = {
    // FR inputs
    matin: 'Morning',
    soir: 'Evening',
    'matin_et_soir': 'Morning and evening',
    // EN canonical
    morning: 'Morning',
    evening: 'Evening',
    both: 'Morning and evening',
    'morning_and_evening': 'Morning and evening'
  }
  const k = (timing || '').toLowerCase()
  return map[k] || timing || 'Morning'
}
