/**
 * Types TypeScript pour la Refonte Routine UI V3
 * 
 * Architecture: Onglets Phase → Slots (Matin/Soir/Hebdo)
 * Principe: Le front ne fait que mapper, zéro inférence métier
 * 
 * @version 1.0.0
 * @created 2025-01-23
 */

// ===== TYPES DE BASE =====

export type PhaseId = "immediate" | "adaptation" | "maintenance";
export type Slot = "morning" | "evening" | "weekly";

// ===== INTERFACES CORE =====

export interface AiAlternative {
  id: string;
  name: string;
}

export interface AiRoutineItem {
  id: string;
  phase: PhaseId;
  routine_slot: Slot;
  title: string;
  product: string;
  category: "cleanser" | "moisturizer" | "spf" | "treatment";
  
  // Base vs traitement
  is_continuous?: boolean;  // true pour base durable (aucun badge UI)
  is_temporary?: boolean;   // true pour traitements (afficher méta/badges)
  
  // Méta obligatoires si is_temporary
  introduce_from_week?: number;      // ex. 1, 2…
  application_duration?: string;     // « 3 semaines », « jusqu'à cicatrisation »
  frequency?: string;                // « daily », « 2x/week », « weekly », « 3–5x/week »
  
  // Pédagogie item
  application_instructions?: string;
  restrictions?: string[];
  target_zones?: string[];
  notes?: string;
  
  // Alternatives & image (optionnelle)
  alternatives?: AiAlternative[];
  image_url?: string;                // si disponible, sinon fallback local/gradient
}

export interface AiRoutinePhase {
  id: PhaseId;
  label?: string;
  durationLabel: string;             // « 1–3 semaines », « 4–6 semaines », « Continu »
  education?: { 
    title: string; 
    text: string; 
  };
  slots: Record<Slot, AiRoutineItem[]>; // groupé par slot
}

export interface AiRoutineOutput {
  phases: AiRoutinePhase[];
}

// ===== TYPES UTILITAIRES =====

/**
 * Type pour override produit dans UI (alternatives)
 */
export interface ProductOverride {
  product: string;
  imgSeed?: string;
  imgSrc?: string;
}

/**
 * Type pour variantes design (Clinical/Glow/Editorial)
 */
export type DesignVariant = "A" | "B" | "C";

/**
 * Type pour thème UI
 */
export type Theme = "light" | "dark";

// ===== TYPES DE VALIDATION =====

/**
 * Type pour logs de champs manquants
 */
export interface MissingFieldLog {
  field: string;
  itemId: string;
  phase: PhaseId;
  slot: Slot;
}

/**
 * Type pour résultat de mapping avec warnings
 */
export interface MappingResult {
  routine: AiRoutineOutput;
  warnings: MissingFieldLog[];
  errors: string[];
}

// ===== CONSTANTES =====

/**
 * Phases disponibles avec labels par défaut
 */
export const PHASE_LABELS: Record<PhaseId, string> = {
  immediate: "Phase Immédiate",
  adaptation: "Phase d'Adaptation", 
  maintenance: "Phase de Maintenance"
} as const;

/**
 * Slots disponibles avec labels par défaut
 */
export const SLOT_LABELS: Record<Slot, string> = {
  morning: "Matin",
  evening: "Soir",
  weekly: "Hebdomadaire"
} as const;

/**
 * Catégories produits avec labels
 */
export const CATEGORY_LABELS: Record<AiRoutineItem["category"], string> = {
  cleanser: "Nettoyant",
  moisturizer: "Hydratant",
  spf: "Protection solaire",
  treatment: "Traitement"
} as const;
