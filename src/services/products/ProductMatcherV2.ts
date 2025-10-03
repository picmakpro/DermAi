/**
 * PHASE 3 SPRINT 3.3 : ProductMatcherV2
 * 
 * Algorithme de matching produits V2 avec scoring ingrédients (35%)
 * 
 * Scoring Formula V2 (0-100) :
 * - 35% Compatibilité ingrédients (🆕 NOUVEAU)
 * - 30% Alignement problématique (vs 40% V1)
 * - 20% Qualité dermatologique (vs 30% V1)
 * - 10% Rapport qualité/prix (vs 20% V1)
 * -  5% Popularité (vs 10% V1)
 * 
 * Status : ✅ PHASE 3 Sprint 3.3
 */

import { EnrichedProduct, ProductDatabase } from '@/data/productsDatabase'
import {
  calculateIngredientCompatibility,
  isProductSafeForUser,
  UserProfile as IngredientUserProfile
} from '@/utils/v2/ingredientScoring'
import { SkinType } from '@/data/ingredientCompatibilityDatabase'

// ========== INTERFACES ==========

/**
 * Step de routine (extrait de PersonalizedRoutine)
 */
export interface RoutineStep {
  stepNumber: number
  careType: string
  targetProblem?: string
  timing: 'morning' | 'evening' | 'both'
  targetZones: string[]
}

/**
 * Profil utilisateur pour filtrage et scoring
 */
export interface UserProfile {
  skinType: SkinType
  concerns?: string[]
  budget?: number
  isPregnant?: boolean
}

/**
 * Contraintes budgétaires
 */
export interface BudgetConstraints {
  maxBudget?: number
  expectedSteps: number
}

/**
 * Produit avec score de matching détaillé
 */
export interface ScoredProductV2 {
  product: EnrichedProduct
  score: number
  breakdown: {
    ingredientCompatibility: number  // 0-100 (35%)
    concernMatch: number              // 0-100 (30%)
    dermatologistRating: number       // 0-100 (20%)
    priceScore: number                // 0-100 (10%)
    popularity: number                // 0-100 (5%)
  }
}

/**
 * Résultat de matching pour un step
 * Garantit : 1 produit principal + jusqu'à 3 alternatives
 */
export interface ProductMatchV2 {
  careType: string
  selectedProduct: EnrichedProduct
  alternatives: EnrichedProduct[]
  matchingScore: number
  breakdown: ScoredProductV2['breakdown']
  reasoning: string
}

// ========== CLASSE PRINCIPALE ==========

/**
 * Algorithme de matching produits V2 avec scoring ingrédients
 * 
 * Usage :
 * ```typescript
 * const matcher = new ProductMatcherV2(database)
 * const match = await matcher.selectForRoutineStep(step, profile, budget)
 * ```
 */
export class ProductMatcherV2 {
  private database: ProductDatabase
  private logger = (msg: string, data?: any) =>
    console.log(`[ProductMatcherV2] ${msg}`, data || '')

  constructor(database: ProductDatabase) {
    this.database = database
  }

  /**
   * Sélectionne le meilleur produit pour un step de routine
   * Garantit : 1 produit principal + jusqu'à 3 alternatives
   * 
   * @throws Error si aucun produit trouvé pour le careType
   */
  async selectForRoutineStep(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): Promise<ProductMatchV2> {
    this.logger(`🔍 Matching pour step ${step.stepNumber} (${step.careType})`)

    // 1. FILTRAGE CANDIDATS
    const candidates = this.filterCandidates(step, profile, budget)

    if (candidates.length === 0) {
      throw new Error(
        `NO_PRODUCTS_FOUND: Aucun produit ${step.careType} compatible avec profil`
      )
    }

    this.logger(`   ✅ ${candidates.length} candidats après filtrage`)

    // 2. SCORING V2
    const scored = this.scoreProducts(candidates, step, profile)

    this.logger(`   ✅ Produits scorés (meilleur: ${scored[0].score.toFixed(1)})`)

    // 3. SÉLECTION
    const selected = scored[0]
    const alternatives = scored.slice(1, 4).map((s) => s.product)

    this.logger(
      `   ✅ Sélectionné: ${selected.product.name} (score: ${selected.score.toFixed(1)})`
    )

    return {
      careType: step.careType,
      selectedProduct: selected.product,
      alternatives,
      matchingScore: Math.round(selected.score),
      breakdown: selected.breakdown,
      reasoning: this.generateReasoning(selected, step)
    }
  }

  // ========== FILTRAGE ==========

  /**
   * Filtre les candidats selon careType, skinType, budget, zones, sécurité
   * 
   * Critères V2 :
   * - careType match
   * - skinType compatible (targetSkinTypes)
   * - Budget respecté (budget/expectedSteps)
   * - Zones compatibles (restrictedZones)
   * - 🆕 Sécurité ingrédients (pregnancy, sensitive skin)
   */
  private filterCandidates(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): EnrichedProduct[] {
    // 1. Charger produits par careType
    const productsByCareType = this.database.byCareType.get(step.careType)

    if (!productsByCareType || productsByCareType.length === 0) {
      return []
    }

    this.logger(`   📦 ${productsByCareType.length} produits ${step.careType}`)

    let candidates = [...productsByCareType]

    // 2. Filtrer par skinType
    if (profile.skinType) {
      candidates = candidates.filter((p) =>
        p.targetSkinTypes.some((t) =>
          t.toLowerCase().includes(profile.skinType.toLowerCase())
        )
      )
      this.logger(`   ✅ ${candidates.length} après filtre skinType`)
    }

    // 3. Filtrer par budget
    if (budget.maxBudget && budget.expectedSteps > 0) {
      const maxPricePerStep = budget.maxBudget / budget.expectedSteps
      candidates = candidates.filter((p) => p.price <= maxPricePerStep * 1.2) // +20% tolérance
      this.logger(`   ✅ ${candidates.length} après filtre budget`)
    }

    // 4. Filtrer par zones (restrictedZones)
    if (step.targetZones && step.targetZones.length > 0) {
      candidates = candidates.filter((p) => {
        // Vérifier si produit a des zones restreintes qui overlappent avec target zones
        const hasRestriction = step.targetZones.some((zone) =>
          p.restrictedZones.some((restricted) =>
            restricted.toLowerCase().includes(zone.toLowerCase()) ||
            zone.toLowerCase().includes(restricted.toLowerCase())
          )
        )
        return !hasRestriction
      })
      this.logger(`   ✅ ${candidates.length} après filtre zones`)
    }

    // 5. 🆕 Filtrer par sécurité ingrédients
    const ingredientProfile: IngredientUserProfile = {
      skinType: profile.skinType,
      isPregnant: profile.isPregnant,
      concerns: profile.concerns
    }

    candidates = candidates.filter((p) => isProductSafeForUser(p, ingredientProfile))
    this.logger(`   ✅ ${candidates.length} après filtre sécurité`)

    return candidates
  }

  // ========== SCORING V2 ==========

  /**
   * Score les produits selon 5 critères pondérés
   * 
   * Formule V2 :
   * - 35% Compatibilité ingrédients (🆕)
   * - 30% Alignement problématique
   * - 20% Qualité dermatologique
   * - 10% Prix
   * -  5% Popularité
   */
  private scoreProducts(
    candidates: EnrichedProduct[],
    step: RoutineStep,
    profile: UserProfile
  ): ScoredProductV2[] {
    const ingredientProfile: IngredientUserProfile = {
      skinType: profile.skinType,
      isPregnant: profile.isPregnant,
      concerns: profile.concerns
    }

    const scored: ScoredProductV2[] = candidates.map((product) => {
      let score = 0
      const breakdown = {
        ingredientCompatibility: 0,
        concernMatch: 0,
        dermatologistRating: 0,
        priceScore: 0,
        popularity: 0
      }

      // 🆕 CRITÈRE 1 : Compatibilité ingrédients (35%)
      const ingredientScore = calculateIngredientCompatibility(
        product,
        ingredientProfile
      )
      breakdown.ingredientCompatibility = Math.round(ingredientScore.finalScore * 100)
      score += ingredientScore.finalScore * 35

      // CRITÈRE 2 : Alignement problématique (30%)
      const concernMatch = this.calculateConcernMatch(
        product.targetConcerns,
        step.targetProblem
      )
      breakdown.concernMatch = Math.round(concernMatch * 100)
      score += concernMatch * 30

      // CRITÈRE 3 : Qualité dermatologique (20%)
      breakdown.dermatologistRating = product.dermatologistRating
      score += (product.dermatologistRating / 100) * 20

      // CRITÈRE 4 : Prix (10%)
      const priceScore = this.calculatePriceScore(product.price)
      breakdown.priceScore = Math.round(priceScore * 100)
      score += priceScore * 10

      // CRITÈRE 5 : Popularité (5%)
      breakdown.popularity = product.popularity
      score += (product.popularity / 100) * 5

      return { product, score: Math.round(score), breakdown }
    })

    // Trier par score décroissant
    scored.sort((a, b) => b.score - a.score)

    return scored
  }

  // ========== CALCULS ==========

  /**
   * Calcule score de matching problématique (0-1)
   * Compare targetProblem du step avec targetConcerns du produit
   */
  private calculateConcernMatch(
    productConcerns: string[],
    stepProblem?: string
  ): number {
    if (!stepProblem) return 0.7 // Score neutre si pas de problème spécifique

    const normalizedProblem = stepProblem.toLowerCase().trim()
    const normalizedConcerns = productConcerns.map((c) => c.toLowerCase().trim())

    // Match exact
    if (normalizedConcerns.includes(normalizedProblem)) {
      return 1.0
    }

    // Match partiel (contient le mot)
    const hasPartialMatch = normalizedConcerns.some((c) =>
      c.includes(normalizedProblem) || normalizedProblem.includes(c)
    )

    if (hasPartialMatch) {
      return 0.8
    }

    // Synonymes et équivalences
    const synonyms: Record<string, string[]> = {
      rides: ['wrinkles', 'fine lines', 'aging', 'anti-age'],
      acne: ['acne', 'blemishes', 'breakouts', 'pimples'],
      taches: ['hyperpigmentation', 'dark spots', 'melasma', 'pigmentation'],
      hydratation: ['dryness', 'dehydration', 'moisture'],
      rougeurs: ['redness', 'irritation', 'sensitivity']
    }

    for (const [key, values] of Object.entries(synonyms)) {
      if (normalizedProblem.includes(key) || values.some((v) => normalizedProblem.includes(v))) {
        const hasSynonymMatch = normalizedConcerns.some((c) =>
          values.some((v) => c.includes(v))
        )
        if (hasSynonymMatch) {
          return 0.9
        }
      }
    }

    // Aucun match
    return 0.5
  }

  /**
   * Calcule score prix (0-1)
   * Principe : Prix plus bas = meilleur score
   * Mais pas linéaire (éviter produits trop cheap)
   */
  private calculatePriceScore(price: number): number {
    if (price <= 0) return 0

    // Ranges de prix optimaux
    if (price <= 15) return 0.9 // Très accessible
    if (price <= 30) return 1.0 // Prix optimal (meilleur rapport)
    if (price <= 50) return 0.8 // Acceptable
    if (price <= 100) return 0.6 // Cher
    return 0.4 // Très cher
  }

  /**
   * Génère un reasoning explicatif pour le choix
   */
  private generateReasoning(
    selected: ScoredProductV2,
    step: RoutineStep
  ): string {
    const reasons: string[] = []

    // Ingredient compatibility
    if (selected.breakdown.ingredientCompatibility >= 80) {
      reasons.push('Excellente compatibilité ingrédients avec votre type de peau')
    } else if (selected.breakdown.ingredientCompatibility >= 60) {
      reasons.push('Bonne compatibilité ingrédients')
    }

    // Concern match
    if (selected.breakdown.concernMatch >= 80 && step.targetProblem) {
      reasons.push(`Cible spécifiquement ${step.targetProblem}`)
    }

    // Quality
    if (selected.breakdown.dermatologistRating >= 85) {
      reasons.push('Note dermatologique excellente')
    }

    // Price
    if (selected.breakdown.priceScore >= 80) {
      reasons.push('Excellent rapport qualité/prix')
    }

    if (reasons.length === 0) {
      return 'Meilleur équilibre global entre tous les critères'
    }

    return reasons.join('. ')
  }
}

