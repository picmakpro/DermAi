/**
 * 🔥 SCHÉMAS V3 - TOP 3 PRODUITS PAR CATÉGORIE
 * 
 * Point d'entrée pour tous les schémas V3
 * Version : 1.0
 * Date : 17 septembre 2025
 */

// Export des interfaces principales
export type {
  ProductDetail,
  SelectedProductWithAlternatives,
  ProductSelectionV3,
  ProductDetailType,
  SelectedProductWithAlternativesType,
  ProductSelectionV3Type
} from './products'

// Export des schémas Zod
export {
  ProductDetailSchema,
  SelectedProductWithAlternativesSchema,
  ProductSelectionV3Schema
} from './products'

// Export des utilitaires de validation
export {
  validateProductRanking,
  validateBrandDiversification,
  validateProductCoherence,
  validateTop3Products
} from './products'

// Constantes utiles
export const PRODUCT_RANKINGS = [1, 2, 3] as const
export const RANKING_LABELS = {
  1: 'Recommandé',
  2: 'Alternative', 
  3: 'Économique'
} as const

export const TIMING_OPTIONS = [
  'matin',
  'soir', 
  'matin et soir',
  'hebdomadaire'
] as const
