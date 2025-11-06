/**
 * PHASE 3 : Ingredient Compatibility Database
 * 
 * Base de données des ingrédients avec scores de compatibilité par type de peau
 * Utilisée par ProductMatcherV2 pour scoring ingrédients (35% du score total)
 * 
 * Source : Documentation dermatologique + INGREDIENT-SCORING-ARCHITECTURE.md
 * 
 * Status : ✅ PHASE 3 Sprint 3.1
 */

// ========== TYPES ==========

export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal' | 'acne_prone' | 'mature'

export type RiskLevel = 0 | 1 | 2 | 3  // 0=safe, 1=low, 2=moderate, 3=high

export interface IngredientCompatibility {
  // Identité
  name: string             // Nom commun (ex: "Hyaluronic Acid")
  inci: string             // Nom INCI normalisé (ex: "Hyaluronic Acid")
  aliases: string[]        // Variantes de noms (ex: ["Acide Hyaluronique", "Sodium Hyaluronate"])
  
  // Compatibilité par type de peau (0-1)
  compatibility: {
    dry: number           // 0 = très mauvais, 1 = excellent
    oily: number
    combination: number
    sensitive: number
    normal: number
    acne_prone: number
    mature: number
  }
  
  // Effets secondaires par type de peau
  sideEffects: {
    dry?: string[]
    oily?: string[]
    sensitive?: string[]
    acne_prone?: string[]
    mature?: string[]
  }
  
  // Métadonnées risque
  riskLevel: RiskLevel         // 0=safe, 1=low, 2=moderate, 3=high
  comedogenic: boolean          // Comédogène (bouche pores)
  irritant: boolean             // Irritant
  photosensitizing: boolean     // Photosensibilisant (SPF obligatoire)
  pregnancy_safe: boolean       // Safe grossesse
  
  // Concentration optimale (optionnel)
  optimalConcentration?: {
    min: number               // % minimal efficace
    max: number               // % maximal safe
    unit: '%' | 'ppm'
  }
}

// ========== DATABASE ==========

export const INGREDIENT_DATABASE: IngredientCompatibility[] = [
  // ===== 1. HYDRATANTS (Safe universels) =====
  
  {
    name: "Hyaluronic Acid",
    inci: "Hyaluronic Acid",
    aliases: ["Acide Hyaluronique", "Sodium Hyaluronate", "Hyaluronate de Sodium"],
    compatibility: {
      dry: 1.0,          // ✅ Excellent hydratant
      oily: 0.9,         // ✅ Léger, non gras
      combination: 0.95,
      sensitive: 1.0,    // ✅ Non irritant
      normal: 1.0,
      acne_prone: 0.9,
      mature: 1.0
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Glycerin",
    inci: "Glycerin",
    aliases: ["Glycérine", "Glycerol"],
    compatibility: {
      dry: 1.0,          // ✅ Humectant puissant
      oily: 0.8,         // ✅ OK mais peut être collant
      combination: 0.9,
      sensitive: 1.0,    // ✅ Très doux
      normal: 1.0,
      acne_prone: 0.85,
      mature: 1.0
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Ceramides",
    inci: "Ceramide NP",
    aliases: ["Céramides", "Ceramide 3", "Ceramide AP"],
    compatibility: {
      dry: 1.0,          // ✅ Répare barrière
      oily: 0.7,
      combination: 0.85,
      sensitive: 1.0,    // ✅ Anti-inflammatoire
      normal: 0.95,
      acne_prone: 0.75,
      mature: 1.0        // ✅ Anti-âge
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Squalane",
    inci: "Squalane",
    aliases: ["Squalène"],
    compatibility: {
      dry: 1.0,          // ✅ Émollient excellent
      oily: 0.6,         // ⚠️ Peut être gras
      combination: 0.75,
      sensitive: 0.95,
      normal: 0.9,
      acne_prone: 0.5,   // ⚠️ Peut boucher pores
      mature: 1.0
    },
    sideEffects: {
      oily: ["sensation grasse"],
      acne_prone: ["peut aggraver acné si concentration élevée"]
    },
    riskLevel: 0,
    comedogenic: false,  // Squalane (avec 'a') non comédogène vs Squalene (avec 'e')
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  // ===== 2. ACTIFS ANTI-ÂGE =====
  
  {
    name: "Retinol",
    inci: "Retinol",
    aliases: ["Rétinol", "Vitamin A", "Vitamine A"],
    compatibility: {
      dry: 0.4,          // ⚠️ Dessèche fortement
      oily: 0.8,         // ✅ Régule sébum
      combination: 0.7,
      sensitive: 0.2,    // ❌ Très irritant
      normal: 0.7,
      acne_prone: 0.9,   // ✅ Excellent anti-acné
      mature: 0.9        // ✅ Excellent anti-âge
    },
    sideEffects: {
      dry: ["dessèchement", "desquamation", "irritation"],
      sensitive: ["rougeurs intenses", "brûlures", "peeling"]
    },
    riskLevel: 2,
    comedogenic: false,
    irritant: true,
    photosensitizing: true,
    pregnancy_safe: false,  // ❌ INTERDIT grossesse
    optimalConcentration: {
      min: 0.3,
      max: 1.0,
      unit: '%'
    }
  },
  
  {
    name: "Bakuchiol",
    inci: "Bakuchiol",
    aliases: [],
    compatibility: {
      dry: 0.8,
      oily: 0.85,
      combination: 0.9,
      sensitive: 0.9,    // ✅ Alternative rétinol douce
      normal: 0.9,
      acne_prone: 0.85,
      mature: 0.9
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true    // ✅ Safe grossesse
  },
  
  {
    name: "Peptides",
    inci: "Palmitoyl Tripeptide-1",
    aliases: ["Matrixyl", "Copper Peptides", "Peptide de Cuivre"],
    compatibility: {
      dry: 0.9,
      oily: 0.85,
      combination: 0.9,
      sensitive: 0.85,
      normal: 0.9,
      acne_prone: 0.8,
      mature: 1.0        // ✅ Excellent anti-âge
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  // ===== 3. ACTIFS ÉCLAT =====
  
  {
    name: "Vitamin C",
    inci: "Ascorbic Acid",
    aliases: ["Vitamine C", "L-Ascorbic Acid", "Acide Ascorbique"],
    compatibility: {
      dry: 0.7,
      oily: 0.9,         // ✅ Régule sébum
      combination: 0.85,
      sensitive: 0.5,    // ⚠️ Peut picoter >15%
      normal: 0.9,
      acne_prone: 0.85,
      mature: 0.9        // ✅ Antioxydant puissant
    },
    sideEffects: {
      sensitive: ["picotements", "rougeurs légères"]
    },
    riskLevel: 1,
    comedogenic: false,
    irritant: false,    // < 15%
    photosensitizing: false,
    pregnancy_safe: true,
    optimalConcentration: {
      min: 10,
      max: 20,
      unit: '%'
    }
  },
  
  {
    name: "Kojic Acid",
    inci: "Kojic Acid",
    aliases: ["Acide Kojique"],
    compatibility: {
      dry: 0.6,
      oily: 0.85,
      combination: 0.75,
      sensitive: 0.4,    // ⚠️ Peut irriter
      normal: 0.8,
      acne_prone: 0.8,
      mature: 0.85
    },
    sideEffects: {
      sensitive: ["irritation", "rougeurs"]
    },
    riskLevel: 1,
    comedogenic: false,
    irritant: true,
    photosensitizing: true,
    pregnancy_safe: true
  },
  
  {
    name: "Arbutin",
    inci: "Alpha-Arbutin",
    aliases: ["Alpha Arbutin", "Arbutine"],
    compatibility: {
      dry: 0.85,
      oily: 0.9,
      combination: 0.9,
      sensitive: 0.8,    // ✅ Plus doux que Vitamin C
      normal: 0.9,
      acne_prone: 0.85,
      mature: 0.85
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Tranexamic Acid",
    inci: "Tranexamic Acid",
    aliases: ["Acide Tranexamique"],
    compatibility: {
      dry: 0.8,
      oily: 0.9,
      combination: 0.9,
      sensitive: 0.75,
      normal: 0.9,
      acne_prone: 0.85,
      mature: 0.9
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  // ===== 4. ACTIFS TRAITEMENT CIBLÉ =====
  
  {
    name: "Niacinamide",
    inci: "Niacinamide",
    aliases: ["Nicotinamide", "Vitamin B3", "Vitamine B3"],
    compatibility: {
      dry: 0.8,
      oily: 1.0,         // ✅ Régule sébum excellent
      combination: 0.95,
      sensitive: 0.7,    // ⚠️ Peut irriter >10%
      normal: 0.9,
      acne_prone: 0.95,
      mature: 0.85
    },
    sideEffects: {
      sensitive: ["rougeurs légères", "picotements"]  // Seulement >10%
    },
    riskLevel: 1,
    comedogenic: false,
    irritant: false,    // < 10%
    photosensitizing: false,
    pregnancy_safe: true,
    optimalConcentration: {
      min: 5,
      max: 10,
      unit: '%'
    }
  },
  
  {
    name: "Salicylic Acid",
    inci: "Salicylic Acid",
    aliases: ["Acide Salicylique", "BHA", "Beta Hydroxy Acid"],
    compatibility: {
      dry: 0.3,          // ❌ Dessèche fortement
      oily: 0.95,        // ✅ Exfolie pores
      combination: 0.8,
      sensitive: 0.4,
      normal: 0.7,
      acne_prone: 1.0,   // ✅ Pénètre pores
      mature: 0.6
    },
    sideEffects: {
      dry: ["sécheresse intense", "desquamation"],
      sensitive: ["irritation", "rougeurs"]
    },
    riskLevel: 2,
    comedogenic: false,
    irritant: true,
    photosensitizing: true,
    pregnancy_safe: false,  // ❌ Controversé grossesse
    optimalConcentration: {
      min: 0.5,
      max: 2.0,
      unit: '%'
    }
  },
  
  {
    name: "Azelaic Acid",
    inci: "Azelaic Acid",
    aliases: ["Acide Azélaïque"],
    compatibility: {
      dry: 0.6,
      oily: 0.9,
      combination: 0.85,
      sensitive: 0.7,
      normal: 0.85,
      acne_prone: 0.95,  // ✅ Anti-acné + anti-taches
      mature: 0.8
    },
    sideEffects: {
      sensitive: ["picotements légers", "rougeurs temporaires"]
    },
    riskLevel: 1,
    comedogenic: false,
    irritant: false,    // Généralement bien toléré
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Benzoyl Peroxide",
    inci: "Benzoyl Peroxide",
    aliases: ["Peroxyde de Benzoyle"],
    compatibility: {
      dry: 0.3,          // ❌ Très desséchant
      oily: 0.9,         // ✅ Antibactérien puissant
      combination: 0.7,
      sensitive: 0.2,    // ❌ Très irritant
      normal: 0.6,
      acne_prone: 1.0,   // ✅ Excellent anti-acné
      mature: 0.4
    },
    sideEffects: {
      dry: ["sécheresse extrême", "desquamation"],
      sensitive: ["irritation sévère", "brûlures", "rougeurs"]
    },
    riskLevel: 3,
    comedogenic: false,
    irritant: true,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  // ===== 5. EXFOLIANTS =====
  
  {
    name: "Glycolic Acid",
    inci: "Glycolic Acid",
    aliases: ["Acide Glycolique", "AHA"],
    compatibility: {
      dry: 0.5,
      oily: 0.9,
      combination: 0.8,
      sensitive: 0.3,    // ❌ Très irritant
      normal: 0.8,
      acne_prone: 0.8,
      mature: 0.9
    },
    sideEffects: {
      sensitive: ["brûlures", "rougeurs", "desquamation"]
    },
    riskLevel: 2,
    comedogenic: false,
    irritant: true,
    photosensitizing: true,
    pregnancy_safe: true,
    optimalConcentration: {
      min: 5,
      max: 10,
      unit: '%'
    }
  },
  
  {
    name: "Lactic Acid",
    inci: "Lactic Acid",
    aliases: ["Acide Lactique", "AHA"],
    compatibility: {
      dry: 0.7,          // ✅ Plus doux que Glycolic
      oily: 0.9,
      combination: 0.85,
      sensitive: 0.5,
      normal: 0.85,
      acne_prone: 0.8,
      mature: 0.9
    },
    sideEffects: {
      sensitive: ["picotements", "rougeurs légères"]
    },
    riskLevel: 1,
    comedogenic: false,
    irritant: false,    // Plus doux
    photosensitizing: true,
    pregnancy_safe: true
  },
  
  {
    name: "Mandelic Acid",
    inci: "Mandelic Acid",
    aliases: ["Acide Mandélique", "AHA"],
    compatibility: {
      dry: 0.75,
      oily: 0.85,
      combination: 0.85,
      sensitive: 0.7,    // ✅ AHA le plus doux
      normal: 0.85,
      acne_prone: 0.85,
      mature: 0.85
    },
    sideEffects: {},
    riskLevel: 1,
    comedogenic: false,
    irritant: false,
    photosensitizing: true,
    pregnancy_safe: true
  },
  
  // ===== 6. APAISANTS =====
  
  {
    name: "Centella Asiatica",
    inci: "Centella Asiatica Extract",
    aliases: ["Cica", "Gotu Kola", "Madecassoside"],
    compatibility: {
      dry: 0.9,
      oily: 0.85,
      combination: 0.9,
      sensitive: 1.0,    // ✅ Anti-inflammatoire
      normal: 0.9,
      acne_prone: 0.9,   // ✅ Cicatrisant
      mature: 0.85
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Aloe Vera",
    inci: "Aloe Barbadensis Leaf Extract",
    aliases: ["Aloe Barbadensis", "Aloe"],
    compatibility: {
      dry: 0.95,         // ✅ Hydratant apaisant
      oily: 0.9,
      combination: 0.95,
      sensitive: 1.0,    // ✅ Très doux
      normal: 0.95,
      acne_prone: 0.9,
      mature: 0.85
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Panthenol",
    inci: "Panthenol",
    aliases: ["Pro-Vitamin B5", "Provitamine B5", "D-Panthenol"],
    compatibility: {
      dry: 1.0,          // ✅ Réparateur excellent
      oily: 0.85,
      combination: 0.9,
      sensitive: 1.0,    // ✅ Anti-inflammatoire
      normal: 0.95,
      acne_prone: 0.85,
      mature: 0.9
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  // ===== 7. IRRITANTS COURANTS =====
  
  {
    name: "Alcohol Denat",
    inci: "Alcohol Denat",
    aliases: ["SD Alcohol", "Ethanol", "Alcool Dénaturé"],
    compatibility: {
      dry: 0.1,          // ❌ Déshydrate
      oily: 0.7,         // ✅ Matifiant
      combination: 0.5,
      sensitive: 0.2,    // ❌ Irritant
      normal: 0.6,
      acne_prone: 0.5,
      mature: 0.3
    },
    sideEffects: {
      dry: ["déshydratation", "tiraillement"],
      sensitive: ["irritation"]
    },
    riskLevel: 2,
    comedogenic: false,
    irritant: true,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Fragrance",
    inci: "Parfum",
    aliases: ["Perfume", "Fragrance"],
    compatibility: {
      dry: 0.6,
      oily: 0.7,
      combination: 0.7,
      sensitive: 0.2,    // ❌ Allergène fréquent
      normal: 0.8,
      acne_prone: 0.6,
      mature: 0.6
    },
    sideEffects: {
      sensitive: ["réactions allergiques", "eczéma", "dermatite"]
    },
    riskLevel: 2,
    comedogenic: false,
    irritant: true,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Essential Oils",
    inci: "Essential Oils",
    aliases: ["Huiles Essentielles", "Lavender Oil", "Tea Tree Oil"],
    compatibility: {
      dry: 0.5,
      oily: 0.6,
      combination: 0.6,
      sensitive: 0.2,    // ❌ Très irritant
      normal: 0.7,
      acne_prone: 0.5,
      mature: 0.5
    },
    sideEffects: {
      sensitive: ["irritation", "réactions allergiques", "photosensibilisation"]
    },
    riskLevel: 2,
    comedogenic: false,
    irritant: true,
    photosensitizing: true,  // Beaucoup d'huiles essentielles photosensibilisent
    pregnancy_safe: false    // Certaines interdites
  },
  
  // ===== 8. PROTECTION UV =====
  
  {
    name: "Zinc Oxide",
    inci: "Zinc Oxide",
    aliases: ["Oxyde de Zinc"],
    compatibility: {
      dry: 0.7,          // ⚠️ Peut dessécher
      oily: 0.95,        // ✅ Matifiant
      combination: 0.85,
      sensitive: 1.0,    // ✅ Minéral doux
      normal: 0.9,
      acne_prone: 0.95,  // ✅ Anti-inflammatoire
      mature: 0.85
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  },
  
  {
    name: "Titanium Dioxide",
    inci: "Titanium Dioxide",
    aliases: ["Dioxyde de Titane"],
    compatibility: {
      dry: 0.75,
      oily: 0.9,
      combination: 0.85,
      sensitive: 1.0,    // ✅ Minéral doux
      normal: 0.9,
      acne_prone: 0.9,
      mature: 0.85
    },
    sideEffects: {},
    riskLevel: 0,
    comedogenic: false,
    irritant: false,
    photosensitizing: false,
    pregnancy_safe: true
  }
]

// ========== UTILITAIRES ==========

/**
 * Trouve un ingrédient par son nom ou alias
 */
export function findIngredient(name: string): IngredientCompatibility | undefined {
  const lowerName = name.toLowerCase().trim()
  
  return INGREDIENT_DATABASE.find(ing => {
    // Match nom principal
    if (ing.name.toLowerCase() === lowerName) return true
    
    // Match INCI
    if (ing.inci.toLowerCase() === lowerName) return true
    
    // Match alias
    if (ing.aliases.some(alias => alias.toLowerCase() === lowerName)) return true
    
    // Match partiel (ex: "Hyaluronic" match "Hyaluronic Acid")
    if (ing.name.toLowerCase().includes(lowerName)) return true
    if (lowerName.includes(ing.name.toLowerCase())) return true
    
    return false
  })
}

/**
 * Vérifie si un ingrédient est présent dans une liste
 */
export function hasIngredient(
  ingredients: string[],
  searchIngredient: string
): boolean {
  return ingredients.some(ing => {
    const found = findIngredient(ing)
    return found?.name === searchIngredient || found?.inci === searchIngredient
  })
}

/**
 * Extrait les ingrédients connus d'une liste
 */
export function extractKnownIngredients(
  ingredients: string[]
): IngredientCompatibility[] {
  const known: IngredientCompatibility[] = []
  
  for (const ing of ingredients) {
    const found = findIngredient(ing)
    if (found) {
      known.push(found)
    }
  }
  
  return known
}

/**
 * Statistiques de la database
 */
export function getDatabaseStats() {
  return {
    totalIngredients: INGREDIENT_DATABASE.length,
    bySafetyLevel: {
      safe: INGREDIENT_DATABASE.filter(i => i.riskLevel === 0).length,
      low: INGREDIENT_DATABASE.filter(i => i.riskLevel === 1).length,
      moderate: INGREDIENT_DATABASE.filter(i => i.riskLevel === 2).length,
      high: INGREDIENT_DATABASE.filter(i => i.riskLevel === 3).length
    },
    pregnancySafe: INGREDIENT_DATABASE.filter(i => i.pregnancy_safe).length,
    photosensitizing: INGREDIENT_DATABASE.filter(i => i.photosensitizing).length,
    comedogenic: INGREDIENT_DATABASE.filter(i => i.comedogenic).length,
    irritant: INGREDIENT_DATABASE.filter(i => i.irritant).length
  }
}

