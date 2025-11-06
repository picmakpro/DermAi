/**
 * PHASE D2 : ProductMatcher Algorithme
 * 
 * Algorithme de matching produits basé sur scoring multi-critères déterministe.
 * Garantit : 1 produit principal + 3 alternatives par step de routine.
 * 
 * Scoring Formula (0-100) :
 * - 40% Alignement problématique (concern match)
 * - 30% Qualité dermatologique (dermatologist rating)
 * - 20% Rapport qualité/prix (price score)
 * - 10% Popularité (popularity)
 * 
 * Status : ✅ D2.1-D2.4 IMPLÉMENTÉ
 * 
 * Référence : docs/plan-execution-v2-5/SPRINT-D-REFONTE-HYBRIDE-EXECUTION.md (D2)
 */

import { EnrichedProduct, ProductDatabase } from '@/data/productsDatabase'

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
  skinType: string
  allergies: string[]
  preferences?: string[]
}

/**
 * Contraintes budgétaires
 */
export interface BudgetConstraints {
  maxBudget?: number
  expectedSteps: number
}

/**
 * Produit avec score de matching
 */
export interface ScoredProduct {
  product: EnrichedProduct
  score: number
}

/**
 * Résultat de matching pour un step
 * Garantit : 1 produit principal + jusqu'à 3 alternatives
 */
export interface ProductMatch {
  mainProduct: EnrichedProduct
  alternatives: EnrichedProduct[]
  matchingScore: number
  reasoning: string
}

// ========== CLASSE PRINCIPALE ==========

/**
 * Algorithme de matching produits
 * Sélection déterministe basée sur scoring multi-critères
 * 
 * Usage :
 * ```typescript
 * const matcher = new ProductMatcher(database)
 * const match = await matcher.selectForRoutineStep(step, profile, budget)
 * ```
 */
export class ProductMatcher {
  private database: ProductDatabase
  private logger = (msg: string, data?: any) =>
    console.log(`[ProductMatcher] ${msg}`, data || '')

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
  ): Promise<ProductMatch> {
    this.logger(
      `🔍 Matching step ${step.stepNumber} (${step.careType})${step.targetProblem ? ` - ${step.targetProblem}` : ''}`
    )

    // 1. FILTRAGE STRICT
    const candidates = this.filterCandidates(step, profile, budget)

    if (candidates.length === 0) {
      throw new Error(
        `NO_PRODUCT_FOUND: Aucun produit trouvé pour careType "${step.careType}"`
      )
    }

    this.logger(`   ✓ ${candidates.length} candidats après filtrage`)

    // 2. SCORING MULTI-CRITÈRES
    const scored = this.scoreProducts(candidates, step, profile)
    this.logger(
      `   ✓ Top 1 score: ${scored[0]?.score.toFixed(1)}/100 (${scored[0]?.product.name})`
    )

    // 3. SÉLECTION TOP 1
    const mainProduct = scored[0]

    if (!mainProduct) {
      throw new Error(
        `SCORING_FAILED: Échec scoring pour careType "${step.careType}"`
      )
    }

    // 4. ALTERNATIVES (Top 2-4)
    const alternatives = scored.slice(1, 4).map((s) => s.product)

    // 5. JUSTIFICATION
    const reasoning = this.explainMatch(mainProduct, step)

    return {
      mainProduct: mainProduct.product,
      alternatives,
      matchingScore: Math.round(mainProduct.score),
      reasoning
    }
  }

  // ========== FILTRAGE ==========

  /**
   * Filtre les candidats selon critères stricts et souples
   * 
   * Filtres STRICTS (obligatoires) :
   * - Allergies : exclusion totale
   * - CareType : match exact
   * 
   * Filtres SOUPLES (peuvent être relâchés) :
   * - Budget : marge 20%
   * - SkinType : relâché si 0 résultat
   */
  private filterCandidates(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): EnrichedProduct[] {
    const careType = step.careType
    let candidates = this.database.byCareType.get(careType) || []

    this.logger(`   🗂️ Candidats initiaux (${careType}): ${candidates.length}`)

    if (candidates.length === 0) {
      this.logger(`   ⚠️ Aucun produit pour careType "${careType}"`)
      return []
    }

    // FILTRE 1 : Allergies (STRICT)
    if (profile.allergies.length > 0) {
      const beforeAllergies = candidates.length
      candidates = candidates.filter(
        (p) =>
          !p.allergens.some((allergen) =>
            profile.allergies.some(
              (userAllergen) =>
                allergen.toLowerCase().includes(userAllergen.toLowerCase()) ||
                userAllergen.toLowerCase().includes(allergen.toLowerCase())
            )
          )
      )
      const removed = beforeAllergies - candidates.length
      if (removed > 0) {
        this.logger(
          `   ❌ ${removed} produits exclus (allergies: ${profile.allergies.join(', ')})`
        )
      }
    }

  // FILTRE 2 : Budget (SOUPLE)
  if (budget.maxBudget && budget.maxBudget > 0) {
    const avgBudgetPerStep = budget.maxBudget / budget.expectedSteps
    // ✅ FIX : Augmenter marge budget de 20% → 80% pour budgets serrés
    // Si budget/step < 10€, marge 80% permet de trouver plus de candidats
    const marginPercent = avgBudgetPerStep < 10 ? 1.8 : 1.5 // 80% ou 50% marge
    const maxPrice = avgBudgetPerStep * marginPercent

    const beforeBudget = candidates.length
    const budgetCandidates = candidates.filter((p) => p.price <= maxPrice)

    if (budgetCandidates.length > 0) {
      candidates = budgetCandidates
      const removed = beforeBudget - candidates.length

      if (removed > 0) {
        this.logger(
          `   💰 ${removed} produits exclus (budget: ${maxPrice.toFixed(2)}€ max, marge ${Math.round((marginPercent - 1) * 100)}%)`
        )
      }
    } else {
      this.logger(
        `   ⚠️ Filtre budget relâché (0 candidats < ${maxPrice.toFixed(2)}€)`
      )
    }
  }

  // FILTRE 3 : SkinType (SOUPLE - peut être relâché)
  const beforeSkinType = candidates.length
  const skinTypeCandidates = candidates.filter((p) =>
    p.targetSkinTypes.includes(profile.skinType as any)
  )

  if (skinTypeCandidates.length > 0) {
    candidates = skinTypeCandidates
    const removed = beforeSkinType - candidates.length
    if (removed > 0) {
      this.logger(
        `   🧴 ${removed} produits exclus (skinType: ${profile.skinType})`
      )
    }
  } else {
    this.logger(
      `   ⚠️ Filtre skinType relâché (0 candidats compatibles ${profile.skinType})`
    )
  }

    this.logger(`   ✅ ${candidates.length} candidats finaux`)

    return candidates
  }

  // ========== SCORING ==========

  /**
   * Score les produits selon 4 critères pondérés
   * Formule : 40% concern + 30% quality + 20% price + 10% popularity
   */
  private scoreProducts(
    candidates: EnrichedProduct[],
    step: RoutineStep,
    profile: UserProfile
  ): ScoredProduct[] {
    const scored: ScoredProduct[] = candidates.map((product) => {
      let score = 0

      // CRITÈRE 1 : Alignement problématique (40%)
      const concernMatch = this.calculateConcernMatch(
        product.targetConcerns,
        step.targetProblem
      )
      score += concernMatch * 40

      // CRITÈRE 2 : Qualité dermatologique (30%)
      score += (product.dermatologistRating / 100) * 30

      // CRITÈRE 3 : Rapport qualité/prix (20%)
      const priceScore = this.calculatePriceScore(product.price)
      score += priceScore * 20

      // CRITÈRE 4 : Popularité (10%)
      score += (product.popularity / 100) * 10

      return { product, score }
    })

    // Trier par score décroissant
    scored.sort((a, b) => b.score - a.score)

    return scored
  }

  /**
   * Calcule score de matching problématique (0-1)
   * Compare targetProblem du step avec targetConcerns du produit
   */
  private calculateConcernMatch(
    productConcerns: string[],
    targetProblem?: string
  ): number {
    if (!targetProblem || targetProblem.trim() === '') {
      return 0.5 // Score neutre si pas de problème ciblé
    }

    // Extraire mots-clés du problème ciblé
    const keywords = targetProblem
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((word) => word.length > 3) // Ignorer mots courts

    if (keywords.length === 0) {
      return 0.5
    }

    // Compter matchs dans productConcerns
    let matchCount = 0
    for (const keyword of keywords) {
      for (const concern of productConcerns) {
        if (
          concern.toLowerCase().includes(keyword) ||
          keyword.includes(concern.toLowerCase())
        ) {
          matchCount++
          break // Compter chaque keyword max 1 fois
        }
      }
    }

    // Score = ratio matchs / total keywords (clamped 0-1)
    const score = Math.min(matchCount / keywords.length, 1.0)

    return score
  }

  /**
   * Calcule score prix (0-1)
   * Score inversé : moins cher = meilleur score
   * Prix 10€ = 0.9, Prix 50€ = 0.5, Prix 100€+ = 0.0
   */
  private calculatePriceScore(price: number): number {
    // Score inversé : moins cher = meilleur
    const normalized = price / 100
    const score = Math.max(1 - normalized, 0)

    return score
  }

  // ========== JUSTIFICATION ==========

  /**
   * Génère justification humaine du matching
   * Template : "{productName} est optimal pour {careType} car {targetText} un score de {score}/100. Ce produit combine {topStrength}."
   */
  private explainMatch(scored: ScoredProduct, step: RoutineStep): string {
    const { product, score } = scored

    // Identifier point fort dominant
    let topStrength = 'une sélection basée sur vos besoins'

    if (product.dermatologistRating > 85) {
      topStrength = 'une efficacité dermatologique prouvée'
    } else if (product.popularity > 80) {
      topStrength = 'une popularité reconnue auprès des utilisateurs'
    } else if (product.price < 20) {
      topStrength = 'un excellent rapport qualité-prix'
    }

    // Template principal
    const targetText = step.targetProblem
      ? `il cible ${step.targetProblem} avec`
      : `il répond à vos besoins de ${step.careType} avec`

    const reasoning = `${product.name} est optimal pour ${step.careType} car ${targetText} un score de matching de ${Math.round(score)}/100. Ce produit combine ${topStrength}.`

    return reasoning
  }
}

