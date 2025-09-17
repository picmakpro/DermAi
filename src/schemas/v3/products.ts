import { z } from 'zod'

/**
 * 🔥 SCHÉMAS V3 - TOP 3 PRODUITS PAR CATÉGORIE
 * 
 * Version : 1.0
 * Date : 17 septembre 2025
 * 
 * Nouveaux schémas pour générer 3 produits classés par pertinence :
 * - Produit #1 : Le plus adapté (affiché dans routine)
 * - Produit #2 : Alternative de qualité équivalente  
 * - Produit #3 : Option économique ou spécialisée
 */

// ============================================================================
// INTERFACES TYPESCRIPT
// ============================================================================

/**
 * Détail enrichi d'un produit avec ranking et comparaisons
 */
export interface ProductDetail {
  catalogId: string
  productName: string
  brand: string
  price: number
  ranking: 1 | 2 | 3                    // NOUVEAU: Classement obligatoire
  justification: string                 // Justification spécifique au ranking
  applicationAdvice: string
  timing: string
  targetZones: string[]
  differentiators: string[]             // NOUVEAU: Ce qui distingue ce produit
  priceComparison: string              // NOUVEAU: "Plus économique", "Premium", etc.
  strengthComparison: string           // NOUVEAU: "Plus doux", "Plus puissant", etc.
  temporaryLabel?: boolean
  progressiveIntroduction?: string
  restrictions?: string[]
}

/**
 * Produit sélectionné avec ses alternatives
 */
export interface SelectedProductWithAlternatives {
  routineStepId: number
  primaryProduct: ProductDetail         // Produit #1 (affiché dans routine)
  alternatives: ProductDetail[]         // Produits #2 et #3
  categoryRanking: {
    criteria: string[]                  // Critères de classement utilisés
    justification: string               // Explication du classement
    diversificationStrategy: string     // Stratégie de diversification appliquée
  }
}

/**
 * Sélection complète V3 avec Top 3 par catégorie
 */
export interface ProductSelectionV3 {
  selectedProducts: SelectedProductWithAlternatives[]
  budgetBreakdown: {
    totalCost: number                   // Coût du produit principal uniquement
    budgetRespected: boolean
    optimizations: string[]
    alternatives: string[]
    priceDistribution: {                // NOUVEAU: Répartition des prix
      primary: number
      alternatives: number[]
    }
  }
  coherenceValidation: {
    routineProductsMatch: boolean
    zonesCoherent: boolean
    timingLogical: boolean
    budgetRespected: boolean
    diversificationSuccess: boolean     // NOUVEAU: Succès de la diversification
    issuesFound: string[]
  }
}

// ============================================================================
// SCHÉMAS ZOD DE VALIDATION
// ============================================================================

/**
 * Schéma Zod pour ProductDetail avec validation stricte
 */
export const ProductDetailSchema = z.object({
  catalogId: z.string().min(3).max(50),
  productName: z.string().min(5).max(200),
  brand: z.string().min(2).max(100),
  price: z.number().min(0),
  ranking: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  justification: z.string().min(30).max(400),
  applicationAdvice: z.string().min(20).max(300),
  timing: z.enum(['matin', 'soir', 'matin et soir', 'hebdomadaire']),
  targetZones: z.array(z.string()).min(1),
  differentiators: z.array(z.string()).min(1).max(3),
  priceComparison: z.string().min(5).max(50),
  strengthComparison: z.string().min(5).max(50),
  temporaryLabel: z.boolean().optional(),
  progressiveIntroduction: z.string().nullable().optional(),
  restrictions: z.array(z.string()).optional()
})

/**
 * Schéma Zod pour SelectedProductWithAlternatives
 */
export const SelectedProductWithAlternativesSchema = z.object({
  routineStepId: z.number().min(1),
  primaryProduct: ProductDetailSchema,
  alternatives: z.array(ProductDetailSchema).length(2), // Exactement 2 alternatives
  categoryRanking: z.object({
    criteria: z.array(z.string()).min(3).max(5),
    justification: z.string().min(50).max(300),
    diversificationStrategy: z.string().min(30).max(200)
  })
})

/**
 * Schéma Zod principal pour ProductSelectionV3
 */
export const ProductSelectionV3Schema = z.object({
  selectedProducts: z.array(SelectedProductWithAlternativesSchema).min(1).max(12),
  budgetBreakdown: z.object({
    totalCost: z.number().min(0),
    budgetRespected: z.boolean(),
    optimizations: z.array(z.string()),
    alternatives: z.array(z.string()),
    priceDistribution: z.object({
      primary: z.number(),
      alternatives: z.array(z.number()).length(2)
    })
  }),
  coherenceValidation: z.object({
    routineProductsMatch: z.boolean(),
    zonesCoherent: z.boolean(),
    timingLogical: z.boolean(),
    budgetRespected: z.boolean(),
    diversificationSuccess: z.boolean(),
    issuesFound: z.array(z.string())
  })
})

// ============================================================================
// TYPES DÉRIVÉS
// ============================================================================

export type ProductDetailType = z.infer<typeof ProductDetailSchema>
export type SelectedProductWithAlternativesType = z.infer<typeof SelectedProductWithAlternativesSchema>
export type ProductSelectionV3Type = z.infer<typeof ProductSelectionV3Schema>

// ============================================================================
// UTILITAIRES DE VALIDATION
// ============================================================================

/**
 * Valide qu'un produit a le bon ranking
 */
export function validateProductRanking(product: ProductDetail, expectedRanking: 1 | 2 | 3): boolean {
  return product.ranking === expectedRanking
}

/**
 * Valide la diversification des marques dans un groupe de 3 produits
 */
export function validateBrandDiversification(products: ProductDetail[]): {
  isSuccess: boolean
  uniqueBrands: number
  brands: string[]
} {
  if (products.length !== 3) {
    throw new Error('validateBrandDiversification requiert exactement 3 produits')
  }
  
  const brands = products.map(p => p.brand)
  const uniqueBrands = new Set(brands)
  
  return {
    isSuccess: uniqueBrands.size >= 2, // Au moins 2 marques différentes
    uniqueBrands: uniqueBrands.size,
    brands: Array.from(uniqueBrands)
  }
}

/**
 * Valide la cohérence des zones et timing entre 3 produits
 */
export function validateProductCoherence(products: ProductDetail[]): {
  zonesCoherent: boolean
  timingCoherent: boolean
  issues: string[]
} {
  if (products.length !== 3) {
    throw new Error('validateProductCoherence requiert exactement 3 produits')
  }
  
  const issues: string[] = []
  
  // Vérifier cohérence des zones
  const firstZones = JSON.stringify(products[0].targetZones.sort())
  const zonesCoherent = products.every(p => 
    JSON.stringify(p.targetZones.sort()) === firstZones
  )
  
  if (!zonesCoherent) {
    issues.push('Zones cibles incohérentes entre les 3 produits')
  }
  
  // Vérifier cohérence du timing
  const firstTiming = products[0].timing
  const timingCoherent = products.every(p => p.timing === firstTiming)
  
  if (!timingCoherent) {
    issues.push('Timing d\'application incohérent entre les 3 produits')
  }
  
  return {
    zonesCoherent,
    timingCoherent,
    issues
  }
}

/**
 * Valide qu'un ensemble de produits respecte les contraintes Top 3
 */
export function validateTop3Products(
  primaryProduct: ProductDetail,
  alternatives: ProductDetail[],
  maxBudget: number
): {
  isValid: boolean
  issues: string[]
  diversification: ReturnType<typeof validateBrandDiversification>
  coherence: ReturnType<typeof validateProductCoherence>
} {
  const issues: string[] = []
  const allProducts = [primaryProduct, ...alternatives]
  
  // Vérifier que le produit principal a ranking = 1
  if (primaryProduct.ranking !== 1) {
    issues.push(`Produit principal doit avoir ranking = 1, trouvé ${primaryProduct.ranking}`)
  }
  
  // Vérifier que les alternatives ont ranking = 2 et 3
  if (alternatives.length !== 2) {
    issues.push(`Exactement 2 alternatives requises, ${alternatives.length} trouvées`)
  } else {
    if (alternatives[0].ranking !== 2) {
      issues.push(`Alternative #1 doit avoir ranking = 2, trouvé ${alternatives[0].ranking}`)
    }
    if (alternatives[1].ranking !== 3) {
      issues.push(`Alternative #2 doit avoir ranking = 3, trouvé ${alternatives[1].ranking}`)
    }
  }
  
  // Vérifier que le produit principal respecte le budget
  if (primaryProduct.price > maxBudget) {
    issues.push(`Produit principal (${primaryProduct.price}€) dépasse le budget (${maxBudget}€)`)
  }
  
  // Valider diversification et cohérence
  const diversification = validateBrandDiversification(allProducts)
  const coherence = validateProductCoherence(allProducts)
  
  issues.push(...coherence.issues)
  
  return {
    isValid: issues.length === 0,
    issues,
    diversification,
    coherence
  }
}
