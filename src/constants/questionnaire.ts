/**
 * 💰 CONSTANTES - QUESTIONNAIRE V2
 * Mappings budget, style routine, labels UI
 * Sprint 0 - Fondations
 */

export type BudgetTier = "Essentiel" | "Confort" | "Expert";
export type RoutineStyle = "Rapide" | "Équilibrée" | "Complète";

// Mapping budget → SKU count, prix/SKU, etc.
export const BUDGET_MAP = {
  Essentiel: { 
    min: 30, 
    max: 70, 
    plannedSkuCount: [3, 4] as const, 
    perSkuTarget: [10, 18] as const, 
    perSkuHardCap: 25 
  },
  Confort: { 
    min: 70, 
    max: 150, 
    plannedSkuCount: [4, 5] as const, 
    perSkuTarget: [15, 30] as const, 
    perSkuHardCap: 40 
  },
  Expert: { 
    min: 150, 
    max: 300, 
    plannedSkuCount: [5, 7] as const, 
    perSkuTarget: [25, 45] as const, 
    perSkuHardCap: 60 
  },
} as const;

// Politique complexité routine selon style
export const STYLE_POLICY = {
  Rapide: { 
    treatmentsMaxAdaptation: 1, 
    weeklyMax: 0, 
    morningMax: 3, 
    eveningMax: 3 
  },
  Équilibrée: { 
    treatmentsMaxAdaptation: 2, 
    weeklyMax: 1, 
    morningMax: 3, 
    eveningMax: 4 
  },
  Complète: { 
    treatmentsMaxAdaptation: 2, 
    weeklyMax: 2, 
    morningMax: 4, 
    eveningMax: 4 
  },
} as const;

// UI Labels pour les selects
export const BUDGET_TIERS_UI = [
  { value: "Essentiel" as const, label: "Essentiel — Base efficace (30-70€/mois)" },
  { value: "Confort" as const, label: "Confort — Latitude ciblée (70-150€/mois)" },
  { value: "Expert" as const, label: "Expert — Budget généreux (150-300€/mois)" },
] as const;

export const ROUTINE_STYLES_UI = [
  { value: "Rapide" as const, label: "Rapide — Épurée : 3 matin, 2-3 soir" },
  { value: "Équilibrée" as const, label: "Équilibrée — Standard : 3 matin, 3-4 soir" },
  { value: "Complète" as const, label: "Complète — Détaillée : 3 matin, 3-4 soir + hebdo" },
] as const;
