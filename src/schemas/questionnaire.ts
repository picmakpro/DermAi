import { z } from "zod";

/**
 * 📋 SCHÉMAS ZOD - QUESTIONNAIRE V2
 * Validation stricte pour nouveaux champs personnalisation IA
 * Sprint 0 - Fondations
 */

export const zBudgetTier = z.enum(["Essentiel", "Confort", "Expert"]);
export const zRoutineStyle = z.enum(["Rapide", "Équilibrée", "Complète"]);
export const zGender = z.enum(["Femme", "Homme", "Autre", "Ne souhaite pas préciser"]);

export const zPregnancy = z.object({
  isPregnant: z.boolean(),
}).optional();

export const zLocation = z.object({
  city: z.string().min(1, "Ville requise"),
  country: z.string().min(1, "Pays requis"),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
});

export const zStep2Questionnaire = z.object({
  userProfile: z.object({
    age: z.number().int().min(12).max(100),
    gender: zGender,
    skinType: z.string().optional(),
  }),
  
  pregnancy: zPregnancy,
  location: zLocation,
  
  constraints: z.object({
    budget: z.object({ tier: zBudgetTier }),
    routineStyle: zRoutineStyle,
    // Préserver champs existants
    allergies: z.array(z.string()).optional(),
    preferences: z.record(z.any()).optional(),
  }),
  
  skinConcerns: z.object({
    primary: z.array(z.string()).max(3, "Maximum 3 préoccupations").default([]),
  }),
})
.refine(
  (d) => d.userProfile.gender !== "Femme" || d.pregnancy !== undefined,
  { message: "Statut grossesse requis pour les femmes", path: ["pregnancy"] }
);

export type QuestionnaireV2 = z.infer<typeof zStep2Questionnaire>;
