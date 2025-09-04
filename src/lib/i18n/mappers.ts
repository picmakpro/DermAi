export type IntensityEN = 'mild' | 'moderate' | 'severe';
export const normalizeIntensity = (v?: string): IntensityEN | undefined => {
  if (!v) return undefined;
  const k = v.toLowerCase();
  const map: Record<string, IntensityEN> = {
    'légère': 'mild','legere':'mild',
    'modérée': 'moderate','moderee':'moderate',
    'intense': 'severe'
  };
  if (map[k]) return map[k];
  if (['mild','moderate','severe'].includes(k)) return k as IntensityEN;
  return undefined;
};

export type ZoneEN = 'chin' | 'cheeks' | 'forehead' | 'nose' | 'neck' | 'eye-contour';
export const normalizeZone = (z?: string): ZoneEN | undefined => {
  if (!z) return undefined;
  const k = z.toLowerCase();
  const map: Record<string, ZoneEN> = {
    'menton':'chin','joues':'cheeks','front':'forehead',
    'nez':'nose','cou':'neck','contour des yeux':'eye-contour'
  };
  if (map[k]) return map[k];
  const pass: ZoneEN[] = ['chin','cheeks','forehead','nose','neck','eye-contour'];
  return pass.includes(k as ZoneEN) ? (k as ZoneEN) : undefined;
};

export type SkinTypeEN = 'dry' | 'normal' | 'combination' | 'oily' | 'sensitive' | 'unknown';
export const normalizeSkinType = (v?: string): SkinTypeEN | undefined => {
  if (!v) return undefined;
  const k = v.toLowerCase();
  const map: Record<string, SkinTypeEN> = {
    'sèche':'dry','seche':'dry','normale':'normal','mixte':'combination',
    'grasse':'oily','sensible':'sensitive','je ne sais pas':'unknown'
  };
  if (map[k]) return map[k];
  const pass: SkinTypeEN[] = ['dry','normal','combination','oily','sensitive','unknown'];
  return pass.includes(k as SkinTypeEN) ? (k as SkinTypeEN) : undefined;
};

export const normalizeConcern = (s: string): string => {
  const k = (s||'').toLowerCase().trim();
  const map: Record<string, string> = {
    // Skin concerns from questionnaire
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
    'autres': 'other',
    // Legacy mappings
    'rougeurs':'redness','imperfections':'blemishes',
    'taches':'pigmentation','hyperpigmentation':'pigmentation',
    'pores dilatés':'enlarged-pores',
    'déshydratation':'dehydration','deshydratation':'dehydration','rides':'wrinkles'
  };
  return map[k] || k; // assume EN already if unknown
};

export type GenderEN = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export const normalizeGender = (v?: string): GenderEN | undefined => {
  if (!v) return undefined;
  const k = v.toLowerCase();
  const map: Record<string, GenderEN> = {
    'homme': 'male',
    'femme': 'female',
    'autre': 'other',
    'ne souhaite pas préciser': 'prefer-not-to-say'
  };
  if (map[k]) return map[k];
  const pass: GenderEN[] = ['male', 'female', 'other', 'prefer-not-to-say'];
  return pass.includes(k as GenderEN) ? (k as GenderEN) : undefined;
};

export type RoutinePreferenceEN = 'minimalist' | 'simple' | 'balanced' | 'complete';
export const normalizeRoutinePreference = (v?: string): RoutinePreferenceEN | undefined => {
  if (!v) return undefined;
  const k = v.toLowerCase();
  const map: Record<string, RoutinePreferenceEN> = {
    'minimaliste': 'minimalist',
    'simple': 'simple',
    'équilibrée': 'balanced',
    'complète': 'complete'
  };
  if (map[k]) return map[k];
  const pass: RoutinePreferenceEN[] = ['minimalist', 'simple', 'balanced', 'complete'];
  return pass.includes(k as RoutinePreferenceEN) ? (k as RoutinePreferenceEN) : undefined;
};

export type BudgetEN = 'under-50' | '50-100' | '100-200' | 'over-200' | 'no-limit';
export const normalizeBudget = (v?: string): BudgetEN | undefined => {
  if (!v) return undefined;
  const k = v.toLowerCase().replace(/\s+/g, '');
  const map: Record<string, BudgetEN> = {
    '<50€': 'under-50',
    '50-100€': '50-100',
    '100-200€': '100-200',
    '>200€': 'over-200',
    'pasdelimite': 'no-limit'
  };
  if (map[k]) return map[k];
  const pass: BudgetEN[] = ['under-50', '50-100', '100-200', 'over-200', 'no-limit'];
  return pass.includes(k as BudgetEN) ? (k as BudgetEN) : undefined;
};

// Helper to normalize BeautyAssessment from FR to EN
export const normalizeAssessmentFRtoEN = (assessment: any): any => {
  if (!assessment) return assessment;

  const normalized = { ...assessment };

  // Normalize intensity
  if (assessment.intensity) {
    normalized.intensity = normalizeIntensity(assessment.intensity) || assessment.intensity;
  }

  // Normalize skinType
  if (assessment.skinType) {
    normalized.skinType = normalizeSkinType(assessment.skinType) || assessment.skinType;
  }

  // Normalize mainConcern
  if (assessment.mainConcern) {
    normalized.mainConcern = normalizeConcern(assessment.mainConcern);
  }

  // Normalize concernedZones array
  if (Array.isArray(assessment.concernedZones)) {
    normalized.concernedZones = assessment.concernedZones
      .map((zone: string) => normalizeZone(zone) || zone)
      .filter(Boolean);
  }

  // Normalize specificities
  if (Array.isArray(assessment.specificities)) {
    normalized.specificities = assessment.specificities.map((spec: any) => ({
      ...spec,
      intensity: normalizeIntensity(spec.intensity) || spec.intensity,
      zones: Array.isArray(spec.zones) 
        ? spec.zones.map((zone: string) => normalizeZone(zone) || zone).filter(Boolean)
        : spec.zones,
      name: normalizeConcern(spec.name || '')
    }));
  }

  // Normalize zoneSpecific
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
    }));
  }

  return normalized;
};
