/**
 * PHASE 3 SPRINT 3.3 : Ingredient Scoring Utils
 * 
 * Fonctions utilitaires pour calculer le score de compatibilité ingrédients
 * Utilisées par ProductMatcherV2 pour le critère #1 (35% du score total)
 * 
 * Status : ✅ PHASE 3 Sprint 3.3
 */

import {
  INGREDIENT_DATABASE,
  IngredientCompatibility,
  SkinType,
  findIngredient,
  extractKnownIngredients
} from '@/data/ingredientCompatibilityDatabase'
import { EnrichedProduct } from '@/data/productsDatabase'

// ========== TYPES ==========

export interface UserProfile {
  skinType: SkinType
  isPregnant?: boolean
  concerns?: string[]
}

export interface IngredientCompatibilityScore {
  skinTypeCompatibility: number      // 0-1 (40% du critère)
  safetyScore: number                 // 0-1 (30% du critère)
  concentrationScore: number          // 0-1 (20% du critère)
  interactionScore: number            // 0-1 (10% du critère)
  finalScore: number                  // 0-1 (moyenne pondérée)
}

// ========== A. SKIN TYPE COMPATIBILITY (40%) ==========

/**
 * Calcule la compatibilité des ingrédients avec le type de peau
 * 
 * Principe : Compare chaque ingrédient connu avec le score de compatibilité
 * pour le type de peau de l'utilisateur
 * 
 * @param ingredients - Liste des ingrédients du produit
 * @param skinType - Type de peau utilisateur
 * @returns Score 0-1 (0 = incompatible, 1 = excellent)
 */
export function calculateSkinTypeCompatibility(
  ingredients: string[],
  skinType: SkinType
): number {
  if (!ingredients || ingredients.length === 0) {
    return 0.7  // Score neutre par défaut si aucun ingrédient
  }
  
  const knownIngredients = extractKnownIngredients(ingredients)
  
  if (knownIngredients.length === 0) {
    return 0.7  // Score neutre si aucun ingrédient reconnu
  }
  
  let totalScore = 0
  let scoredCount = 0
  
  for (const ingredientData of knownIngredients) {
    const compatScore = ingredientData.compatibility[skinType]
    totalScore += compatScore
    scoredCount++
    
    // Pénalité supplémentaire si ingrédient très incompatible (<0.4)
    if (compatScore < 0.4) {
      totalScore -= 0.2  // Pénalité -0.2
    }
  }
  
  if (scoredCount === 0) {
    return 0.7
  }
  
  // Score moyen clamped (0-1)
  const avgScore = totalScore / scoredCount
  return Math.max(0, Math.min(1, avgScore))
}

// ========== B. SAFETY SCORE (30%) ==========

/**
 * Calcule le score de sécurité basé sur les métadonnées produit
 * et le profil utilisateur
 * 
 * Principe : Pénalise les ingrédients à risque selon le contexte utilisateur
 * 
 * @param product - Produit enrichi avec métadonnées
 * @param profile - Profil utilisateur (skinType, isPregnant, etc.)
 * @returns Score 0-1 (0 = unsafe, 1 = très safe)
 */
export function calculateSafetyScore(
  product: EnrichedProduct,
  profile: UserProfile
): number {
  let safetyScore = 1.0  // Commence à 100%
  
  const knownIngredients = extractKnownIngredients(product.ingredients || [])
  
  // 1. Pénalité par niveau de risque des ingrédients
  for (const ing of knownIngredients) {
    switch (ing.riskLevel) {
      case 3: safetyScore -= 0.15; break  // High-risk : -15%
      case 2: safetyScore -= 0.08; break  // Moderate : -8%
      case 1: safetyScore -= 0.03; break  // Low : -3%
      case 0: break  // Safe : 0%
    }
  }
  
  // 2. Pénalité CRITIQUE si enceinte et produit unsafe
  if (profile.isPregnant && !product.pregnancySafe) {
    safetyScore -= 0.5  // -50% si interdit grossesse
  }
  
  // 3. Pénalité comédogène pour peaux acnéiques
  if (profile.skinType === 'acne_prone' && product.comedogenic) {
    safetyScore -= 0.1  // -10%
  }
  
  // 4. Pénalité irritant pour peaux sensibles
  if (profile.skinType === 'sensitive' && product.irritant) {
    safetyScore -= 0.15  // -15%
  }
  
  // 5. Pénalité supplémentaire pour ingrédients irritants sur peau sensible
  if (profile.skinType === 'sensitive') {
    for (const ing of knownIngredients) {
      if (ing.irritant) {
        safetyScore -= 0.05  // -5% par ingrédient irritant
      }
    }
  }
  
  return Math.max(0, safetyScore)
}

// ========== C. CONCENTRATION SCORE (20%) ==========

/**
 * Évalue si les concentrations d'actifs sont optimales
 * 
 * Principe : Vérifie si les concentrations sont dans les ranges optimaux
 * (ex: Niacinamide 5-10% = optimal, <2% = inefficace, >15% = irritant)
 * 
 * @param activeIngredients - Ingrédients actifs avec concentrations
 * @returns Score 0-1 (0 = concentration inadaptée, 1 = optimale)
 */
export function calculateConcentrationScore(
  activeIngredients: string[]
): number {
  if (!activeIngredients || activeIngredients.length === 0) {
    return 0.7  // Score neutre si pas d'actifs connus
  }
  
  let concentrationScore = 0.7  // Score de base
  let scoredIngredients = 0
  
  // Règles de concentration optimale
  const OPTIMAL_CONCENTRATIONS: Record<string, { min: number; max: number; tooLow: number; tooHigh: number }> = {
    'niacinamide': { min: 5, max: 10, tooLow: 2, tooHigh: 15 },
    'retinol': { min: 0.3, max: 1.0, tooLow: 0.1, tooHigh: 1.5 },
    'vitamin c': { min: 10, max: 20, tooLow: 5, tooHigh: 30 },
    'ascorbic acid': { min: 10, max: 20, tooLow: 5, tooHigh: 30 },
    'salicylic acid': { min: 0.5, max: 2.0, tooLow: 0.2, tooHigh: 3.0 },
    'glycolic acid': { min: 5, max: 10, tooLow: 2, tooHigh: 15 },
    'lactic acid': { min: 5, max: 10, tooLow: 2, tooHigh: 15 }
  }
  
  for (const active of activeIngredients) {
    // Extraire concentration (ex: "Niacinamide 10%" → 10)
    const match = active.match(/(\d+(?:\.\d+)?)\s*%/)
    if (!match) continue
    
    const concentration = parseFloat(match[1])
    const ingredientName = active.replace(match[0], '').trim().toLowerCase()
    
    // Trouver règle optimale
    const rule = Object.entries(OPTIMAL_CONCENTRATIONS).find(([key]) =>
      ingredientName.includes(key)
    )?.[1]
    
    if (!rule) continue
    
    scoredIngredients++
    
    // Scoring
    if (concentration >= rule.min && concentration <= rule.max) {
      concentrationScore += 0.1  // +10% si optimal
    } else if (concentration < rule.tooLow) {
      concentrationScore -= 0.05  // -5% si trop faible (inefficace)
    } else if (concentration > rule.tooHigh) {
      concentrationScore -= 0.15  // -15% si trop fort (irritant)
    }
  }
  
  return Math.max(0, Math.min(1, concentrationScore))
}

// ========== D. INTERACTION SCORE (10%) ==========

/**
 * Détecte les interactions négatives entre ingrédients
 * 
 * Principe : Certains ingrédients ne doivent pas être combinés
 * (ex: Retinol + Vitamin C = instabilité, Retinol + BHA = sur-irritation)
 * 
 * @param activeIngredients - Ingrédients actifs
 * @returns Score 0-1 (0 = interactions majeures, 1 = aucune interaction)
 */
export function calculateInteractionScore(
  activeIngredients: string[]
): number {
  if (!activeIngredients || activeIngredients.length === 0) {
    return 1.0  // Aucun actif = aucune interaction
  }
  
  let interactionScore = 1.0
  
  // Paires incompatibles avec pénalités
  const INCOMPATIBLE_PAIRS = [
    { ing1: 'retinol', ing2: 'vitamin c', penalty: 0.3, reason: 'instabilité pH' },
    { ing1: 'retinol', ing2: 'ascorbic', penalty: 0.3, reason: 'instabilité pH' },
    { ing1: 'retinol', ing2: 'benzoyl peroxide', penalty: 0.4, reason: 'dégradation' },
    { ing1: 'niacinamide', ing2: 'vitamin c', penalty: 0.1, reason: 'mythe mais éviter haute conc' },
    { ing1: 'niacinamide', ing2: 'ascorbic', penalty: 0.1, reason: 'mythe mais éviter haute conc' },
    { ing1: 'aha', ing2: 'bha', penalty: 0.2, reason: 'sur-exfoliation' },
    { ing1: 'glycolic', ing2: 'salicylic', penalty: 0.2, reason: 'sur-exfoliation' },
    { ing1: 'retinol', ing2: 'aha', penalty: 0.3, reason: 'sur-irritation' },
    { ing1: 'retinol', ing2: 'glycolic', penalty: 0.3, reason: 'sur-irritation' },
    { ing1: 'retinol', ing2: 'bha', penalty: 0.3, reason: 'sur-irritation' },
    { ing1: 'retinol', ing2: 'salicylic', penalty: 0.3, reason: 'sur-irritation' }
  ]
  
  const activesLower = activeIngredients.map(a => a.toLowerCase())
  
  for (const pair of INCOMPATIBLE_PAIRS) {
    const hasIng1 = activesLower.some(a => a.includes(pair.ing1))
    const hasIng2 = activesLower.some(a => a.includes(pair.ing2))
    
    if (hasIng1 && hasIng2) {
      interactionScore -= pair.penalty
    }
  }
  
  return Math.max(0, interactionScore)
}

// ========== SCORE FINAL INGRÉDIENTS ==========

/**
 * Calcule le score final de compatibilité ingrédients (0-100)
 * 
 * Formule :
 * - Skin Type Compatibility : 40%
 * - Safety Score : 30%
 * - Concentration Score : 20%
 * - Interaction Score : 10%
 * 
 * @param product - Produit enrichi
 * @param profile - Profil utilisateur
 * @returns Score détaillé avec breakdown
 */
export function calculateIngredientCompatibility(
  product: EnrichedProduct,
  profile: UserProfile
): IngredientCompatibilityScore {
  // A. Compatibilité type de peau (40%)
  const skinTypeCompatibility = calculateSkinTypeCompatibility(
    product.ingredients || [],
    profile.skinType
  )
  
  // B. Sécurité (30%)
  const safetyScore = calculateSafetyScore(product, profile)
  
  // C. Concentration actifs (20%)
  const concentrationScore = calculateConcentrationScore(
    product.activeIngredients || []
  )
  
  // D. Interactions (10%)
  const interactionScore = calculateInteractionScore(
    product.activeIngredients || []
  )
  
  // Score final pondéré
  const finalScore = 
    (skinTypeCompatibility * 0.40) +
    (safetyScore * 0.30) +
    (concentrationScore * 0.20) +
    (interactionScore * 0.10)
  
  return {
    skinTypeCompatibility,
    safetyScore,
    concentrationScore,
    interactionScore,
    finalScore
  }
}

// ========== UTILS EXPORT ==========

/**
 * Détermine si un produit est sûr pour l'utilisateur
 * (utilisé pour filtrage avant scoring)
 */
export function isProductSafeForUser(
  product: EnrichedProduct,
  profile: UserProfile
): boolean {
  // Filtre critique : grossesse
  if (profile.isPregnant && !product.pregnancySafe) {
    return false
  }
  
  // Filtre : peau sensible + très irritant
  if (profile.skinType === 'sensitive' && product.irritant) {
    const safetyScore = calculateSafetyScore(product, profile)
    if (safetyScore < 0.3) {
      return false  // Trop irritant pour peau sensible
    }
  }
  
  return true
}

/**
 * Retourne un label descriptif du score ingrédients
 */
export function getIngredientScoreLabel(score: number): string {
  if (score >= 0.9) return 'Excellent'
  if (score >= 0.75) return 'Très bon'
  if (score >= 0.6) return 'Bon'
  if (score >= 0.4) return 'Moyen'
  if (score >= 0.2) return 'Faible'
  return 'Incompatible'
}

