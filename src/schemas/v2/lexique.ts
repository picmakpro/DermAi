import { z } from 'zod'

/**
 * LEXIQUE STANDARDISÉ V2.1 - SCHÉMAS DE VALIDATION
 * Termes exacts à utiliser dans basedOn et problem selon le prompt CEO V2.1
 */

// Termes du lexique standardisé pour basedOn
export const LexiqueTermsSchema = z.enum([
  // Hydratation
  'déshydratation_visuelle',
  'sécheresse_squames', 
  'barrière_fragile_apparente',
  'teint_terne',
  'homogénéité_teint',
  'réactivité_visible',
  'micro_inflammations_diffuses',
  
  // Sébum & Pores
  'brillance_zone_T',
  'brillance_excessive',
  'excès_de_sébum',
  'pores_apparents',
  'pores_obstrués',
  'pores_étirés',
  'filaments_sébacés',
  'points_noirs',
  'points_blancs',
  'séborrhée_sèche',
  
  // Imperfections
  'lésions_inflammatoires',
  'lésions_en_relief',
  'marques_post_imperfections',
  'comédons_fermés',
  'distribution_mandibulaire',
  'nodules_profonds_apparents',
  
  // Pigmentation
  'hyperpigmentation_diffuse',
  'PIH',
  'PIE',
  'dyschromies',
  'éphélides_visibles',
  'lentigos_probables',
  'hypopigmentation_post_lesion',
  
  // Rougeurs & Vascularité
  'rougeurs_diffuses',
  'rougeurs_localisées',
  'rougeurs_réactives',
  'télangiectasies_visibles',
  
  // Vieillissement
  'rides_expression',
  'rides_fines',
  'rides_marquees',
  'ridules_déshydratation',
  'perte_fermeté_apparente',
  'grain_photovieilli',
  'contours_visage_nets',
  'laxité_paupières',
  
  // Texture & Cicatrices
  'grain_irregulier',
  'cicatrices_icepick',
  'cicatrices_boxcar',
  'cicatrices_rolling',
  'cicatrices_hypertrophiques',
  'milia',
  'hyperplasie_sébacée',
  
  // Contour des yeux
  'cernes_pigmentés',
  'cernes_vasculaires',
  'cernes_structurels',
  'ombre_sous_orbitaire',
  'poches',
  'rides_pattes_oeil',
  'milium_palpébral',
  
  // Rasage & pilosité
  'irritation_post_rasage',
  'ombre_barbe',
  'poils_incarnés',
  'folliculite_barbe_apparente',
  
  // Limites techniques
  'flou_image',
  'éclairage_difficile',
  'angle_limité',
  'maquillage_probable',
  'résolution_insuffisante',
  'zone_non_visible',
  
  // Termes généraux d'observation
  'absence_rides_apparentes',
  'éclat_général'
])

// Termes pour les problèmes de zones (problem field)
export const ProblemTermsSchema = z.enum([
  // Hydratation & Barrière
  'déshydratation_visuelle',
  'sécheresse_squames',
  'barrière_fragile_apparente',
  'peau_asphyxiée',
  'teint_terne',
  'réactivité_visible',
  'micro_inflammations_diffuses',
  
  // Sébum & Pores
  'excès_de_sébum',
  'brillance_excessive',
  'pores_apparents',
  'pores_obstrués',
  'pores_étirés',
  'séborrhée_sèche',
  'filaments_sébacés',
  'points_noirs',
  'points_blancs',
  
  // Imperfections
  'comédons_fermés',
  'lésions_inflammatoires',
  'lésions_en_relief',
  'nodules_profonds_apparents',
  'distribution_mandibulaire',
  'marques_post_imperfections',
  
  // Pigmentation
  'hyperpigmentation_diffuse',
  'PIH',
  'PIE',
  'lentigos_probables',
  'éphélides_visibles',
  'dyschromies',
  'hypopigmentation_post_lesion',
  
  // Rougeurs
  'rougeurs_diffuses',
  'rougeurs_localisées',
  'rougeurs_réactives',
  'télangiectasies_visibles',
  
  // Vieillissement
  'ridules_déshydratation',
  'rides_expression',
  'rides_marquees',
  'perte_fermeté_apparente',
  'laxité_paupières',
  'grain_photovieilli',
  
  // Texture & Cicatrices
  'grain_irregulier',
  'cicatrices_icepick',
  'cicatrices_boxcar',
  'cicatrices_rolling',
  'cicatrices_hypertrophiques',
  'milia',
  'hyperplasie_sébacée',
  
  // Contour yeux
  'cernes_pigmentés',
  'cernes_vasculaires',
  'cernes_structurels',
  'poches',
  'rides_pattes_oeil',
  'milium_palpébral',
  
  // Rasage
  'irritation_post_rasage',
  'ombre_barbe',
  'poils_incarnés',
  'folliculite_barbe_apparente'
])

// Validation pour problem field (lexique ou "autre: description")
export const ProblemFieldSchema = z.union([
  ProblemTermsSchema,
  z.string().regex(/^autre:\s*.+/, "Format 'autre: description' requis pour termes hors lexique")
])

// Validation stricte pour basedOn (uniquement termes du lexique)
export const BasedOnArraySchema = z.array(LexiqueTermsSchema).min(3).max(6)

// Types TypeScript dérivés
export type LexiqueTerm = z.infer<typeof LexiqueTermsSchema>
export type ProblemTerm = z.infer<typeof ProblemTermsSchema>
export type ProblemField = z.infer<typeof ProblemFieldSchema>
export type BasedOnArray = z.infer<typeof BasedOnArraySchema>

// Utilitaire pour valider si un terme est dans le lexique
export function isValidLexiqueTerm(term: string): term is LexiqueTerm {
  return LexiqueTermsSchema.safeParse(term).success
}

// Utilitaire pour valider un problem field
export function isValidProblemField(problem: string): problem is ProblemField {
  return ProblemFieldSchema.safeParse(problem).success
}
