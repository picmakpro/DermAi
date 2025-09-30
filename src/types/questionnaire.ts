/**
 * 🎯 TYPES - QUESTIONNAIRE V2
 * Types TypeScript pour nouveaux champs personnalisation
 * Sprint 0 - Fondations
 */

export type BudgetTier = "Essentiel" | "Confort" | "Expert";
export type RoutineStyle = "Rapide" | "Équilibrée" | "Complète";
export type UvBand = "Low" | "Moderate" | "High" | "VeryHigh";

export interface PregnancyData {
  isPregnant: boolean;
}

export interface LocationData {
  city: string;
  country: string;
  lat?: number;
  lon?: number;
}

export interface BudgetConfig {
  tier: BudgetTier;
}

export interface RoutineContext {
  profile: {
    age: number;
    gender: string;
    pregnancy: boolean;
  };
  constraints: {
    budgetTier: BudgetTier;
    style: RoutineStyle;
  };
  environment: {
    uvRiskBand: UvBand;
  };
}
