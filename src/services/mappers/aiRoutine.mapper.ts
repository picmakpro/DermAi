/**
 * Mapper strict pour Refonte Routine UI V3
 * 
 * Principe: Mapping pur sans inférence métier
 * - Normalisation syntactique uniquement (careType → category, timing → slot)
 * - Logs des champs manquants pour debug
 * - Groupement automatique par slots dans chaque phase
 * - Validation que tous les temporaires ont intro/durée/fréquence
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

import { 
  AiRoutineOutput, 
  AiRoutinePhase, 
  AiRoutineItem, 
  PhaseId, 
  Slot,
  MappingResult,
  MissingFieldLog,
  PHASE_LABELS,
  SLOT_LABELS
} from '@/types/aiRoutine';

// ===== CONSTANTES DE MAPPING =====

/**
 * Mapping careType → category (normalisation syntactique)
 */
const CATEGORY_MAP = {
  nettoyage: 'cleanser',
  hydratation: 'moisturizer', 
  protection: 'spf',
  traitement: 'treatment',
  exfoliation: 'treatment',
  masque: 'treatment'
} as const;

/**
 * Mapping timing → routine_slot (normalisation syntactique)
 */
const SLOT_MAP = { 
  matin: 'morning', 
  soir: 'evening', 
  hebdomadaire: 'weekly' 
} as const;

/**
 * Champs obligatoires pour items temporaires
 */
const TEMPORARY_REQUIRED_FIELDS = [
  'introduce_from_week',
  'application_duration', 
  'frequency'
] as const;

// ===== FONCTIONS UTILITAIRES =====

/**
 * Log warning pour champ manquant
 */
function logMissingField(field: string, itemId: string, phase: PhaseId, slot: Slot): MissingFieldLog {
  const warning = { field, itemId, phase, slot };
  console.warn('[routine:missing-field]', field, itemId, `phase:${phase}`, `slot:${slot}`);
  return warning;
}

/**
 * Normalise le type de soin (careType → category)
 */
function normalizeCareType(careType: string): AiRoutineItem['category'] {
  const normalized = CATEGORY_MAP[careType.toLowerCase() as keyof typeof CATEGORY_MAP];
  if (normalized) {
    return normalized;
  }
  
  // Fallback intelligent
  if (/nettoy|cleans/i.test(careType)) return 'cleanser';
  if (/hydrat|moistur/i.test(careType)) return 'moisturizer';
  if (/spf|solaire|protection/i.test(careType)) return 'spf';
  
  // Défaut: treatment
  console.warn('[routine:unknown-category]', careType, '→ fallback: treatment');
  return 'treatment';
}

/**
 * Normalise le timing (timing → routine_slot)
 */
function normalizeTiming(timing: string): Slot {
  const normalized = SLOT_MAP[timing.toLowerCase() as keyof typeof SLOT_MAP];
  if (normalized) {
    return normalized;
  }
  
  // Fallback intelligent
  if (/matin|morning|am/i.test(timing)) return 'morning';
  if (/soir|evening|pm|night/i.test(timing)) return 'evening';
  if (/hebdo|weekly|week/i.test(timing)) return 'weekly';
  
  // Défaut: morning (le plus sûr)
  console.warn('[routine:unknown-timing]', timing, '→ fallback: morning');
  return 'morning';
}

/**
 * Détermine automatiquement le slot selon la fréquence
 * Règle: frequency !== 'daily' → weekly
 */
function inferSlotFromFrequency(frequency?: string, timing?: string): Slot {
  // Priorité au timing explicite
  if (timing) {
    return normalizeTiming(timing);
  }
  
  // Inférence par fréquence
  if (frequency && frequency !== 'daily' && !/quotidien/i.test(frequency)) {
    return 'weekly';
  }
  
  return 'morning'; // Défaut sécurisé
}

/**
 * Valide qu'un item temporaire a tous les champs requis
 */
function validateTemporaryItem(item: any, warnings: MissingFieldLog[], phase: PhaseId, slot: Slot): void {
  if (!item.is_temporary) return;
  
  for (const field of TEMPORARY_REQUIRED_FIELDS) {
    if (!item[field]) {
      warnings.push(logMissingField(field, item.id || 'unknown', phase, slot));
    }
  }
}

/**
 * Mappe un item brut vers AiRoutineItem
 */
function mapRoutineItem(rawItem: any, phase: PhaseId, warnings: MissingFieldLog[]): AiRoutineItem {
  // ID obligatoire
  const id = rawItem.id || `${phase}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Détermination du slot
  const slot = inferSlotFromFrequency(rawItem.frequency, rawItem.timing);
  
  // Mapping des champs de base
  const item: AiRoutineItem = {
    id,
    phase,
    routine_slot: slot,
    title: rawItem.title || rawItem.displayTitle || 'Soin non spécifié',
    product: rawItem.product || 'Produit non spécifié',
    category: normalizeCareType(rawItem.careType || rawItem.category || 'treatment'),
    
    // Flags base vs traitement
    is_continuous: rawItem.is_continuous || rawItem.isTemporary === false,
    is_temporary: rawItem.is_temporary || rawItem.isTemporary,
    
    // Métadonnées temporaires
    introduce_from_week: rawItem.introduce_from_week || rawItem.introduceFromWeek,
    application_duration: rawItem.application_duration || rawItem.applicationDuration,
    frequency: rawItem.frequency,
    
    // Pédagogie
    application_instructions: rawItem.application_instructions || rawItem.applicationInstructions,
    restrictions: Array.isArray(rawItem.restrictions) ? rawItem.restrictions : [],
    target_zones: Array.isArray(rawItem.target_zones) ? rawItem.target_zones : 
                  Array.isArray(rawItem.targetZones) ? rawItem.targetZones : [],
    notes: rawItem.notes,
    
    // Alternatives et image
    alternatives: Array.isArray(rawItem.alternatives) ? rawItem.alternatives : [],
    image_url: rawItem.image_url || rawItem.imageUrl
  };
  
  // Validation item temporaire
  validateTemporaryItem(item, warnings, phase, slot);
  
  // Logs pour champs manquants importants
  if (!rawItem.application_instructions && !rawItem.applicationInstructions) {
    warnings.push(logMissingField('application_instructions', id, phase, slot));
  }
  
  return item;
}

/**
 * Groupe les items par slots
 */
function groupItemsBySlots(items: AiRoutineItem[]): Record<Slot, AiRoutineItem[]> {
  const grouped: Record<Slot, AiRoutineItem[]> = {
    morning: [],
    evening: [],
    weekly: []
  };
  
  for (const item of items) {
    grouped[item.routine_slot].push(item);
  }
  
  return grouped;
}

/**
 * Mappe une phase brute vers AiRoutinePhase
 */
function mapRoutinePhase(rawPhase: any, warnings: MissingFieldLog[]): AiRoutinePhase {
  const phaseId = rawPhase.id as PhaseId;
  
  // Extraction des steps (peut être dans phases.steps ou directement dans slots)
  let items: AiRoutineItem[] = [];
  
  if (rawPhase.steps && Array.isArray(rawPhase.steps)) {
    // Format: { steps: [...] }
    items = rawPhase.steps.map((step: any) => mapRoutineItem(step, phaseId, warnings));
  } else if (rawPhase.slots) {
    // Format: { slots: { morning: [...], evening: [...], weekly: [...] } }
    const allSlots = Object.values(rawPhase.slots).flat() as any[];
    items = allSlots.map((step: any) => mapRoutineItem(step, phaseId, warnings));
  }
  
  // Groupement par slots
  const slots = groupItemsBySlots(items);
  
  return {
    id: phaseId,
    label: rawPhase.label || PHASE_LABELS[phaseId],
    durationLabel: rawPhase.durationLabel || rawPhase.duration || 'Durée non spécifiée',
    education: rawPhase.education ? {
      title: rawPhase.education.title || '',
      text: rawPhase.education.text || ''
    } : undefined,
    slots
  };
}

// ===== FONCTION PRINCIPALE =====

/**
 * Mappe une routine brute vers AiRoutineOutput
 * 
 * @param raw - Données brutes de l'IA (format variable)
 * @returns Routine mappée avec warnings
 */
export function toAiRoutineOutput(raw: unknown): MappingResult {
  const warnings: MissingFieldLog[] = [];
  const errors: string[] = [];
  
  try {
    // Validation input de base
    if (!raw || typeof raw !== 'object') {
      errors.push('Input invalide: doit être un objet');
      return {
        routine: { phases: [] },
        warnings,
        errors
      };
    }
    
    const rawData = raw as any;
    
    // Extraction des phases
    let rawPhases: any[] = [];
    
    if (rawData.phases && Array.isArray(rawData.phases)) {
      rawPhases = rawData.phases;
    } else if (Array.isArray(rawData)) {
      // Input direct = array de phases
      rawPhases = rawData;
    } else {
      errors.push('Format non reconnu: phases manquantes ou invalides');
      return {
        routine: { phases: [] },
        warnings,
        errors
      };
    }
    
    // Mapping des phases
    const phases: AiRoutinePhase[] = rawPhases.map(rawPhase => 
      mapRoutinePhase(rawPhase, warnings)
    );
    
    // Validation finale
    if (phases.length === 0) {
      errors.push('Aucune phase valide trouvée');
    }
    
    const routine: AiRoutineOutput = { phases };
    
    // Logs de synthèse
    console.log(`[routine:mapping-complete]`, {
      phases: phases.length,
      totalItems: phases.reduce((sum, p) => 
        sum + Object.values(p.slots).flat().length, 0
      ),
      warnings: warnings.length,
      errors: errors.length
    });
    
    return {
      routine,
      warnings,
      errors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    errors.push(`Erreur de mapping: ${errorMessage}`);
    console.error('[routine:mapping-error]', error);
    
    return {
      routine: { phases: [] },
      warnings,
      errors
    };
  }
}

/**
 * Version simplifiée qui retourne directement AiRoutineOutput
 * (pour compatibilité avec l'existant)
 */
export function mapToAiRoutine(raw: unknown): AiRoutineOutput {
  const result = toAiRoutineOutput(raw);
  return result.routine;
}

// ===== EXPORTS =====

export {
  CATEGORY_MAP,
  SLOT_MAP,
  normalizeCareType,
  normalizeTiming,
  validateTemporaryItem
};
