/**
 * Category Mapping and Canonical Categories
 * Maps synonyms and variations to canonical category names
 */

export const CATEGORY_SYNONYMS: Record<string, string> = {
  // cleansers
  "face_wash": "cleanser",
  "gel_nettoyant": "cleanser",
  "nettoyant": "cleanser",
  "face_cleanser": "cleanser",
  "cleansing_gel": "cleanser",
  "cleansing_foam": "cleanser",
  
  // moisturizers
  "cream": "moisturizer",
  "creme": "moisturizer",
  "hydratant": "moisturizer",
  "moisturizing_cream": "moisturizer",
  "hydrating_cream": "moisturizer",
  "face_cream": "moisturizer",
  
  // sunscreen
  "spf": "sunscreen",
  "sunblock": "sunscreen",
  "protection_solaire": "sunscreen",
  "solar_protection": "sunscreen",
  "uv_protection": "sunscreen",
  
  // treatments (flat)
  "niacinamide": "niacinamide",
  "vitamin c": "vitamin_c",
  "vitamine_c": "vitamin_c",
  "vit_c": "vitamin_c",
  "ascorbic_acid": "vitamin_c",
  "aha": "aha_bha",
  "bha": "aha_bha",
  "exfoliant_chimique": "aha_bha",
  "chemical_exfoliant": "aha_bha",
  "alpha_hydroxy": "aha_bha",
  "beta_hydroxy": "aha_bha",
  "retinol": "retinoid",
  "retinoide": "retinoid",
  "retinoid": "retinoid",
  "tretinoin": "retinoid",
  
  // others
  "spot": "spot_treatment",
  "soin_local": "spot_treatment",
  "local_treatment": "spot_treatment",
  "acne_treatment": "spot_treatment",
  "exfoliant_hebdomadaire": "exfoliant_weekly",
  "weekly_exfoliant": "exfoliant_weekly",
  "physical_exfoliant": "exfoliant_weekly",
  "scrub": "exfoliant_weekly",
  "baume": "balm",
  "balm": "balm",
  "repair_balm": "balm",
  "healing_balm": "balm",
  "contour_des_yeux": "eye_cream",
  "eye_cream": "eye_cream",
  "eye_treatment": "eye_cream",
  "eye_serum": "eye_cream"
}

export const CANONICAL: Set<string> = new Set([
  "cleanser",
  "moisturizer", 
  "sunscreen",
  "niacinamide",
  "vitamin_c",
  "aha_bha",
  "retinoid",
  "spot_treatment",
  "exfoliant_weekly",
  "balm",
  "eye_cream",
  "treatment" // accepted as container with subcategory
])

/**
 * Check if a category is canonical
 */
export function isCanonicalCategory(category: string): boolean {
  return CANONICAL.has(category.toLowerCase().trim())
}

/**
 * Get canonical category from synonym
 */
export function getCanonicalCategory(category: string): string | null {
  const normalized = category.toLowerCase().trim()
  
  // Direct canonical match
  if (CANONICAL.has(normalized)) {
    return normalized
  }
  
  // Synonym match
  const canonical = CATEGORY_SYNONYMS[normalized]
  if (canonical && CANONICAL.has(canonical)) {
    return canonical
  }
  
  return null
}

