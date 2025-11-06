/**
 * 💰 BUDGET OPTIMIZER - Optimisation Budget Intelligente
 * 
 * @author CTO DermAI
 * @date 3 Octobre 2025
 * @version 1.0
 * 
 * @description
 * Service d'optimisation budget basé sur priorités dermatologiques.
 * Garantit que SPF + nettoyant sont préservés (santé peau)
 * tout en respectant le budget utilisateur.
 * 
 * @see docs/architecture/BUDGET-OPTIMIZATION-REFONTE.md
 */

import type { BudgetConstraints, BudgetPriority } from '@/types'
import { CARETYPE_BUDGET_PRIORITIES } from '@/types'
import type { EnrichedProduct } from '@/data/productsDatabase'

// ==================== INTERFACES ====================

export interface ProductMatch {
  step: {
    stepNumber: number
    careType: string
    displayTitle: string
    targetZones: string[]
  }
  mainProduct: EnrichedProduct
  alternatives: EnrichedProduct[]
  matchingScore: number
  reasoning?: string
}

export interface ProductSubstitution {
  originalProduct: EnrichedProduct
  substituteProduct: EnrichedProduct
  stepNumber: number
  careType: string
  priceSaved: number
  scoreLost: number
  efficiency: number // € économisé / score perdu (plus bas = meilleur)
  reason: string
}

export interface OptimizedRoutine {
  routine: ProductMatch[] // Routine finale optimisée
  optimized: boolean // true si optimisation appliquée
  originalCost: number // Coût routine idéale
  finalCost: number // Coût après optimisation
  savings: number // Économie réalisée
  substitutions: ProductSubstitution[] // Détails substitutions
  stepsRemoved: number[] // Steps supprimés (optionnels)
  preservedCritical: boolean // SPF + nettoyant préservés ?
}

interface SubstitutionCandidate {
  matchIndex: number
  match: ProductMatch
  priority: BudgetPriority
  bestAlternative: EnrichedProduct | null
  priceSaved: number
  scoreLost: number
  efficiency: number // Métrique clé : score perdu / € économisé
  isRemovable: boolean // Peut-on supprimer le step ?
}

// ==================== CLASSE PRINCIPALE ====================

export class BudgetOptimizer {
  private static readonly LOGGER_PREFIX = '[BudgetOptimizer]'

  /**
   * Point d'entrée principal : optimise une routine pour respecter le budget
   * en minimisant la perte de pertinence dermatologique
   */
  static optimize(
    idealRoutine: ProductMatch[],
    budget: BudgetConstraints,
    logger?: (msg: string) => void
  ): OptimizedRoutine {
    const log = logger || ((msg: string) => console.log(`${this.LOGGER_PREFIX} ${msg}`))

    log(`🔍 Optimisation budget : ${idealRoutine.length} steps, budget max ${budget.maxBudget}€`)

    // Calculer coût total routine idéale
    const originalCost = idealRoutine.reduce((sum, match) => sum + match.mainProduct.price, 0)

    log(`💰 Coût routine idéale : ${originalCost.toFixed(2)}€`)

    // Si dans budget, pas besoin d'optimiser
    if (originalCost <= budget.maxBudget) {
      log(`✅ Budget respecté (${originalCost.toFixed(2)}€ ≤ ${budget.maxBudget}€) - Aucune optimisation requise`)
      
      return {
        routine: idealRoutine,
        optimized: false,
        originalCost,
        finalCost: originalCost,
        savings: 0,
        substitutions: [],
        stepsRemoved: [],
        preservedCritical: this.checkCriticalPreserved(idealRoutine),
      }
    }

    // Dépassement budget → optimisation requise
    const overBudget = originalCost - budget.maxBudget
    log(`⚠️ Dépassement : +${overBudget.toFixed(2)}€ - Lancement optimisation intelligente`)

    return this.performSmartSubstitution(idealRoutine, budget, originalCost, log)
  }

  /**
   * Algorithme d'optimisation intelligent
   * Stratégie : Substituer/supprimer produits basse priorité en priorité
   */
  private static performSmartSubstitution(
    idealRoutine: ProductMatch[],
    budget: BudgetConstraints,
    originalCost: number,
    log: (msg: string) => void
  ): OptimizedRoutine {
    // 1. Calculer "substitutability" de chaque produit
    const candidates = this.calculateSubstitutability(idealRoutine, log)

    // 2. Trier par efficience (basse priorité + bon rapport €/score)
    const sortedCandidates = this.sortBySubstitutionPriority(candidates, log)

    // 3. Appliquer substitutions/suppressions jusqu'à respecter budget
    const result = this.applySubstitutions(
      idealRoutine,
      sortedCandidates,
      budget,
      originalCost,
      log
    )

    return result
  }

  /**
   * Calcule la "substitutability" de chaque produit
   * (facilité de remplacement sans perte de pertinence)
   */
  private static calculateSubstitutability(
    idealRoutine: ProductMatch[],
    log: (msg: string) => void
  ): SubstitutionCandidate[] {
    log(`📊 Calcul substitutability pour ${idealRoutine.length} produits...`)

    const candidates: SubstitutionCandidate[] = []

    for (let i = 0; i < idealRoutine.length; i++) {
      const match = idealRoutine[i]
      const careType = match.step.careType
      const priority = CARETYPE_BUDGET_PRIORITIES[careType]

      if (!priority) {
        log(`⚠️ CareType inconnu : ${careType} - Skip`)
        continue
      }

      // Trouver meilleure alternative moins chère
      const currentPrice = match.mainProduct.price
      const currentScore = match.matchingScore

      const cheaperAlternatives = match.alternatives
        .filter((alt) => alt.price < currentPrice)
        .sort((a, b) => {
          // Trier par score desc (meilleure alternative en premier)
          const scoreA = this.estimateAlternativeScore(match, a)
          const scoreB = this.estimateAlternativeScore(match, b)
          return scoreB - scoreA
        })

      const bestAlternative = cheaperAlternatives[0] || null
      const priceSaved = bestAlternative ? currentPrice - bestAlternative.price : 0
      const scoreLost = bestAlternative
        ? currentScore - this.estimateAlternativeScore(match, bestAlternative)
        : 0

      // Efficience = score perdu / € économisé (plus bas = meilleur)
      // Si pas d'alternative, efficience = Infinity (mauvais candidat)
      const efficiency = priceSaved > 0 ? scoreLost / priceSaved : Infinity

      // Peut-on supprimer ce step ? (priorité ≤ 3 = optionnel)
      const isRemovable = priority.priority <= 3 && priority.allowSubstitution

      candidates.push({
        matchIndex: i,
        match,
        priority,
        bestAlternative,
        priceSaved,
        scoreLost,
        efficiency,
        isRemovable,
      })

      log(
        `  → Step ${match.step.stepNumber} (${careType}, priorité ${priority.priority}) : ` +
          `${bestAlternative ? `alt -${priceSaved.toFixed(2)}€ (eff: ${efficiency.toFixed(2)})` : 'aucune alt'} ` +
          `${isRemovable ? '[REMOVABLE]' : ''}`
      )
    }

    return candidates
  }

  /**
   * Estime le score d'une alternative
   * (simplifié : on suppose -10% de score en moyenne pour alternative)
   */
  private static estimateAlternativeScore(match: ProductMatch, alternative: EnrichedProduct): number {
    // Dans un monde idéal, on recalculerait le score complet
    // Ici, on estime : alternative moins chère = score légèrement inférieur
    const currentScore = match.matchingScore
    const priceDiff = match.mainProduct.price - alternative.price
    const priceRatio = priceDiff / match.mainProduct.price

    // Estimation : perte de score proportionnelle à baisse prix (max -20%)
    const estimatedScoreLoss = Math.min(currentScore * priceRatio * 0.5, currentScore * 0.2)
    return Math.max(currentScore - estimatedScoreLoss, 50) // Minimum 50
  }

  /**
   * Trie les candidats par priorité de substitution
   * Stratégie : substituer d'abord basse priorité + bonne efficience
   */
  private static sortBySubstitutionPriority(
    candidates: SubstitutionCandidate[],
    log: (msg: string) => void
  ): SubstitutionCandidate[] {
    log(`🔀 Tri candidats par priorité substitution...`)

    return candidates.sort((a, b) => {
      // 1. Priorité : supprimer optionnels d'abord (removable)
      if (a.isRemovable && !b.isRemovable) return -1
      if (!a.isRemovable && b.isRemovable) return 1

      // 2. Priorité dermatologique (plus basse = substituer en premier)
      if (a.priority.priority !== b.priority.priority) {
        return a.priority.priority - b.priority.priority
      }

      // 3. Efficience (plus basse = meilleur candidat)
      // Si pas d'alternative (efficiency = Infinity), mettre à la fin
      if (a.efficiency === Infinity && b.efficiency !== Infinity) return 1
      if (a.efficiency !== Infinity && b.efficiency === Infinity) return -1

      return a.efficiency - b.efficiency
    })
  }

  /**
   * Applique les substitutions/suppressions pour respecter le budget
   */
  private static applySubstitutions(
    idealRoutine: ProductMatch[],
    sortedCandidates: SubstitutionCandidate[],
    budget: BudgetConstraints,
    originalCost: number,
    log: (msg: string) => void
  ): OptimizedRoutine {
    log(`🔧 Application substitutions (objectif : -${(originalCost - budget.maxBudget).toFixed(2)}€)`)

    let currentRoutine = [...idealRoutine]
    let currentCost = originalCost
    const substitutions: ProductSubstitution[] = []
    const stepsRemoved: number[] = []

    for (const candidate of sortedCandidates) {
      // Vérifier si budget respecté
      if (currentCost <= budget.maxBudget) {
        log(`✅ Budget respecté (${currentCost.toFixed(2)}€) - Stop optimisation`)
        break
      }

      const { matchIndex, match, priority, bestAlternative, priceSaved, scoreLost, isRemovable } =
        candidate

      // Option 1 : Supprimer step (si removable)
      if (isRemovable && priceSaved === 0) {
        log(
          `  ❌ Suppression step ${match.step.stepNumber} (${match.step.careType}, priorité ${priority.priority}) : -${match.mainProduct.price.toFixed(2)}€`
        )

        currentRoutine = currentRoutine.filter((_, idx) => idx !== matchIndex)
        currentCost -= match.mainProduct.price
        stepsRemoved.push(match.step.stepNumber)
        continue
      }

      // Option 2 : Substituer par alternative moins chère
      if (bestAlternative && priority.allowSubstitution) {
        log(
          `  🔄 Substitution step ${match.step.stepNumber} (${match.step.careType}, priorité ${priority.priority}) : ` +
            `${match.mainProduct.name} (${match.mainProduct.price.toFixed(2)}€) → ` +
            `${bestAlternative.name} (${bestAlternative.price.toFixed(2)}€) | ` +
            `Économie: ${priceSaved.toFixed(2)}€, Perte score: ${scoreLost.toFixed(1)} pts`
        )

        // Créer nouveau match avec alternative
        const newMatch: ProductMatch = {
          ...match,
          mainProduct: bestAlternative,
          matchingScore: this.estimateAlternativeScore(match, bestAlternative),
          reasoning: `Substitution budgétaire (économie ${priceSaved.toFixed(2)}€)`,
        }

        currentRoutine[matchIndex] = newMatch
        currentCost -= priceSaved

        substitutions.push({
          originalProduct: match.mainProduct,
          substituteProduct: bestAlternative,
          stepNumber: match.step.stepNumber,
          careType: match.step.careType,
          priceSaved,
          scoreLost,
          efficiency: candidate.efficiency,
          reason: `Budget (priorité ${priority.priority}/10)`,
        })
      }
    }

    const finalCost = currentCost
    const savings = originalCost - finalCost
    const preservedCritical = this.checkCriticalPreserved(currentRoutine)

    log(`✅ Optimisation terminée : ${originalCost.toFixed(2)}€ → ${finalCost.toFixed(2)}€ (économie: ${savings.toFixed(2)}€)`)
    log(`   📊 ${substitutions.length} substitutions, ${stepsRemoved.length} suppressions`)
    log(`   ${preservedCritical ? '✅' : '⚠️'} SPF + Nettoyant : ${preservedCritical ? 'PRÉSERVÉS' : 'COMPROMIS'}`)

    return {
      routine: currentRoutine,
      optimized: true,
      originalCost,
      finalCost,
      savings,
      substitutions,
      stepsRemoved,
      preservedCritical,
    }
  }

  /**
   * Vérifie que SPF + Nettoyant sont préservés (priorités critiques)
   */
  private static checkCriticalPreserved(routine: ProductMatch[]): boolean {
    const hasProtection = routine.some((m) => m.step.careType === 'protection')
    const hasNettoyage = routine.some((m) => m.step.careType === 'nettoyage')
    return hasProtection && hasNettoyage
  }
}

