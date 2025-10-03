/**
 * PHASE D1 : ProductDatabase Structure
 * 
 * Database de produits enrichie avec métadonnées dermatologiques complètes.
 * Utilisée par l'algorithme de matching pour sélection optimale des produits.
 * 
 * Architecture :
 * - EnrichedProduct : Produit avec métadonnées complètes (dermato + scoring + retail)
 * - ProductDatabase : Container avec index optimisés (byCategory, byCareType)
 * - EnrichedProductSchema : Validation Zod runtime
 * 
 * Status : ✅ D1.1 IMPLÉMENTÉ
 * 
 * Référence : docs/plan-execution-v2-5/SPRINT-D-REFONTE-HYBRIDE-EXECUTION.md (D1.1)
 */

import { z } from 'zod'

/**
 * Schéma Zod pour validation d'un produit enrichi
 * Validation stricte de tous les champs requis pour le matching algorithmique
 */
export const EnrichedProductSchema = z.object({
  // ========== IDENTITÉ ==========
  catalogId: z.string().min(3).max(100),
  name: z.string().min(3).max(200),
  brand: z.string().min(2).max(100),
  category: z.enum([
    'cleanser',
    'toner',
    'serum',
    'treatment',
    'moisturizer',
    'sunscreen',
    'mask',
    'exfoliant',
    'balm',
    'oil',
    // ✅ Catégories additionnelles (fix validation 27 produits échoués)
    'eye-care',
    'face-oil',
    'lip-care',
    'mist',
    'primer'
  ]),

  // ========== MÉTADONNÉES DERMATOLOGIQUES ==========
  /**
   * Type de soin (utilisé pour matching par careType)
   * PRIORITAIRE pour l'algorithme de sélection
   */
  careType: z.enum([
    'nettoyage',
    'tonification',
    'traitement',
    'hydratation',
    'protection',
    'exfoliation'
  ]),

  /**
   * Types de peau compatibles (utilisé pour filtrage strict)
   */
  targetSkinTypes: z
    .array(
      z.enum([
        'dry',
        'oily',
        'combination',
        'sensitive',
        'normal',
        'acne-prone',
        'mature'
      ])
    )
    .min(1),

  /**
   * Problématiques ciblées (utilisé pour scoring problématique 40%)
   * Ex: ['acne', 'redness', 'aging', 'dryness', 'hyperpigmentation']
   */
  targetConcerns: z.array(z.string()).default([]),

  /**
   * Ingrédients actifs principaux (information utilisateur)
   */
  activeIngredients: z.array(z.string()).default([]),

  /**
   * Allergènes connus (utilisé pour filtrage strict)
   * Ex: ['fragrance', 'alcohol', 'essential oils']
   */
  allergens: z.array(z.string()).default([]),

  // ========== SCORING ==========
  /**
   * Prix en euros (utilisé pour scoring prix 20% + filtrage budget)
   */
  price: z.number().min(0).max(500),

  /**
   * Score de popularité 0-100 (utilisé pour scoring 10%)
   * Basé sur ventes, avis utilisateurs, tendances
   */
  popularity: z.number().min(0).max(100).default(50),

  /**
   * Note dermatologique 0-100 (utilisé pour scoring qualité 30%)
   * Évaluation experte basée sur efficacité clinique
   */
  dermatologistRating: z.number().min(0).max(100).default(70),

  // ========== RETAIL ==========
  /**
   * URL image produit (affichage UI)
   */
  imageUrl: z.string().url().optional(),

  /**
   * Retailers avec liens d'affiliation
   */
  retailers: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        price: z.number().optional()
      })
    )
    .optional(),

  // ========== TIMING & ZONES ==========
  /**
   * Moment d'application (utilisé pour matching timing routine)
   */
  applicationTiming: z.enum(['morning', 'evening', 'both']),

  /**
   * Zones cibles par défaut
   */
  targetZones: z.array(z.string()).default(['visage entier']),

  /**
   * Zones restreintes (où le produit NE DOIT PAS être appliqué)
   * Ex: ['lèvres', 'yeux'] pour actifs irritants (Retinol, AHA, BHA, Niacinamide >5%)
   * Utilisé pour filtrage strict lors du matching
   */
  restrictedZones: z.array(z.string()).default([])
})

/**
 * Type TypeScript inféré du schéma Zod
 */
export type EnrichedProduct = z.infer<typeof EnrichedProductSchema>

/**
 * Database de produits avec index optimisés
 * Permet recherche rapide par category ou careType
 */
export interface ProductDatabase {
  /**
   * Index par catégorie (cleanser, moisturizer, etc.)
   * Recherche O(1) par category
   */
  byCategory: Map<string, EnrichedProduct[]>

  /**
   * Index par type de soin (nettoyage, hydratation, etc.)
   * PRIORITAIRE pour matching - Recherche O(1) par careType
   */
  byCareType: Map<string, EnrichedProduct[]>

  /**
   * Tous produits (array complet pour itération)
   */
  allProducts: EnrichedProduct[]
}

