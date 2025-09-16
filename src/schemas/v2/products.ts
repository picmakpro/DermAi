import { z } from 'zod'

// Schéma pour un produit sélectionné
export const SelectedProductSchema = z.object({
  routineStepId: z.number().min(1),
  catalogId: z.string().min(3).max(50),
  productName: z.string().min(5).max(100),
  brand: z.string().min(2).max(50),
  price: z.number().min(0).max(500),
  justification: z.string().min(20).max(300),
  applicationAdvice: z.string().min(10).max(200),
  timing: z.string().min(3).max(50),
  targetZones: z.array(z.string()).min(1).max(10),
  temporaryLabel: z.boolean().optional(),
  progressiveIntroduction: z.string().nullable().optional(), // Accepter null ET undefined
  restrictions: z.array(z.string()).optional()
})

// Schéma pour le breakdown budget
export const BudgetBreakdownSchema = z.object({
  totalCost: z.number().min(0).max(1000),
  budgetRespected: z.boolean(),
  optimizations: z.array(z.string()).optional(),
  alternatives: z.array(z.object({
    originalCatalogId: z.string(),
    alternativeCatalogId: z.string(),
    savings: z.number(),
    reason: z.string()
  })).min(0).optional()
})

// Schéma pour la validation de cohérence
export const CoherenceValidationSchema = z.object({
  routineProductsMatch: z.boolean(),
  zonesCoherent: z.boolean(),
  timingLogical: z.boolean(),
  budgetRespected: z.boolean(),
  issuesFound: z.array(z.string())
})

// Schéma principal pour la sélection de produits
export const ProductSelectionSchema = z.object({
  selectedProducts: z.array(SelectedProductSchema).min(3).max(12),
  budgetBreakdown: BudgetBreakdownSchema,
  coherenceValidation: CoherenceValidationSchema
})

// Types TypeScript dérivés
export type SelectedProduct = z.infer<typeof SelectedProductSchema>
export type BudgetBreakdown = z.infer<typeof BudgetBreakdownSchema>
export type CoherenceValidation = z.infer<typeof CoherenceValidationSchema>
export type ProductSelection = z.infer<typeof ProductSelectionSchema>
