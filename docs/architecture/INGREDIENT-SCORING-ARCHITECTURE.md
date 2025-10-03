# 🧬 ARCHITECTURE SCORING INGRÉDIENTS

**Date** : 2 Octobre 2025  
**Version** : 2.0  
**Objectif** : Scoring basé compatibilité ingrédients × type de peau (35% du score total)

---

## 🔴 PROBLÈME : Scoring Actuel (Incomplet)

### Algorithme V1 (ProductMatcher actuel)

```typescript
score = 
  (concernMatch × 40%) +          // Compare targetProblem avec targetConcerns
  (dermatologistRating × 30%) +   // Note subjective générique
  (priceScore × 20%) +            // Prix inversé
  (popularity × 10%)              // Popularité
```

**Limitations critiques** :
1. ❌ **Aucun critère ingrédients** : Ne vérifie PAS si ingrédients compatibles avec type de peau
2. ❌ **dermatologistRating générique** : Pas personnalisé au profil utilisateur
3. ❌ **Pas de notion de risque** : Ignore si ingrédient irritant/comédogène
4. ❌ **Pas de concentration** : Niacinamide 5% vs 10% = même score
5. ❌ **Pas d'interactions** : Retinol + Vitamin C = aucune alerte

**Exemple anomalie** :
```
Produit A : Retinol 1% (pour peau sensible)
→ Score V1 : 72/100 → ✅ SÉLECTIONNÉ
  - concernMatch : 40% (cible rides)
  - dermaRating : 30%
  - price : 2%
  - popularity : 0%
  
MAIS : Retinol = 0.2 compatibilité peau sensible ❌
→ Irritation garantie !
```

---

## ✅ SOLUTION : Scoring V2 (5 Critères)

### Nouvelle Formule

```typescript
score = 
  (ingredientCompatibility × 35%) +  // 🆕 NOUVEAU #1
  (concernMatch × 30%) +             // Réduit (vs 40%)
  (dermatologistRating × 20%) +      // Réduit (vs 30%)
  (priceScore × 10%) +               // Réduit (vs 20%)
  (popularity × 5%)                  // Réduit (vs 10%)
```

**Justification pondération** :
- **35% Ingrédients** : Facteur #1 de compatibilité dermatologique (irritation, efficacité)
- **30% Concerns** : Toujours important mais insuffisant seul
- **20% Quality** : Note dermatologique générale
- **10% Price** : Secondaire (budget déjà filtré en amont)
- **5% Popularity** : Indicateur faible de qualité réelle

---

## 🧪 CRITÈRE #1 : Ingredient Compatibility (35%)

### Formule Détaillée

```typescript
ingredientCompatibility = 
  (skinTypeCompatibility × 40%) +    // Compatibilité avec type de peau
  (safetyScore × 30%) +               // Niveau de risque ingrédients
  (concentrationScore × 20%) +        // Concentration actifs optimale
  (interactionScore × 10%)            // Interactions ingrédients
```

---

### A. Skin Type Compatibility (40%)

**Principe** : Certains ingrédients sont mal tolérés par certains types de peau.

#### Structure Base de Données

```typescript
interface IngredientCompatibility {
  name: string             // Nom commun
  inci: string             // Nom INCI normalisé
  
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
  }
  
  // Métadonnées risque
  riskLevel: 0 | 1 | 2 | 3       // 0=safe, 1=low, 2=moderate, 3=high
  comedogenic: boolean            // Comédogène (bouche pores)
  irritant: boolean               // Irritant
  photosensitizing: boolean       // Photosensibilisant (SPF obligatoire)
  pregnancy_safe: boolean         // Safe grossesse
}
```

#### Exemples Concrets (Top 20)

**1. Hyaluronic Acid** (Safe universel)
```typescript
{
  name: "Hyaluronic Acid",
  inci: "Hyaluronic Acid",
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
}
```

**2. Retinol** (High-risk peau sensible)
```typescript
{
  name: "Retinol",
  inci: "Retinol",
  compatibility: {
    dry: 0.4,          // ⚠️ Dessèche
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
  pregnancy_safe: false  // ❌ INTERDIT
}
```

**3. Niacinamide** (Safe, excellent peaux grasses)
```typescript
{
  name: "Niacinamide",
  inci: "Niacinamide",
  compatibility: {
    dry: 0.8,
    oily: 1.0,         // ✅ Régule sébum
    combination: 0.95,
    sensitive: 0.7,    // ⚠️ Peut irriter >10%
    normal: 0.9,
    acne_prone: 0.95,
    mature: 0.85
  },
  sideEffects: {
    sensitive: ["rougeurs légères", "picotements"]  // Seulement haute concentration
  },
  riskLevel: 1,
  comedogenic: false,
  irritant: false,    // < 5%
  photosensitizing: false,
  pregnancy_safe: true
}
```

**4. Salicylic Acid (BHA)** (Excellent peaux grasses, éviter sèches)
```typescript
{
  name: "Salicylic Acid (BHA)",
  inci: "Salicylic Acid",
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
  pregnancy_safe: false
}
```

**5. Glycolic Acid (AHA)** (Exfoliant fort)
```typescript
{
  name: "Glycolic Acid (AHA)",
  inci: "Glycolic Acid",
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
  pregnancy_safe: true
}
```

**6. Alcohol Denat** (Desséchant)
```typescript
{
  name: "Alcohol Denat",
  inci: "Alcohol Denat",
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
}
```

**7. Fragrance** (Allergène fréquent)
```typescript
{
  name: "Fragrance",
  inci: "Parfum",
  compatibility: {
    dry: 0.6,
    oily: 0.7,
    combination: 0.7,
    sensitive: 0.2,    // ❌ Allergène
    normal: 0.8,
    acne_prone: 0.6,
    mature: 0.6
  },
  sideEffects: {
    sensitive: ["réactions allergiques", "eczéma"]
  },
  riskLevel: 2,
  comedogenic: false,
  irritant: true,
  photosensitizing: false,
  pregnancy_safe: true
}
```

#### Calcul skinTypeCompatibility

```typescript
function calculateSkinTypeCompatibility(
  productIngredients: string[],
  userSkinType: SkinType
): number {
  if (!productIngredients || productIngredients.length === 0) {
    return 0.7  // Score neutre par défaut
  }
  
  let totalScore = 0
  let scoredIngredients = 0
  
  for (const ingredient of productIngredients) {
    const ingredientData = INGREDIENT_DATABASE.find(ing => 
      ing.inci.toLowerCase() === ingredient.toLowerCase() ||
      ingredient.toLowerCase().includes(ing.inci.toLowerCase())
    )
    
    if (ingredientData) {
      const compatScore = ingredientData.compatibility[userSkinType]
      totalScore += compatScore
      scoredIngredients++
      
      // Pénalité supplémentaire si ingrédient très incompatible
      if (compatScore < 0.4) {
        totalScore -= 0.2  // -0.2 pénalité
      }
    }
  }
  
  if (scoredIngredients === 0) {
    return 0.7  // Aucun ingrédient connu → score neutre
  }
  
  // Score moyen clamped (0-1)
  const avgScore = totalScore / scoredIngredients
  return Math.max(0, Math.min(1, avgScore))
}
```

**Exemple calcul** :
```typescript
Produit A : ["Retinol 0.5%", "Hyaluronic Acid", "Glycerin"]
User : skinType = 'sensitive'

Retinol : 0.2 (peau sensible)
Hyaluronic Acid : 1.0
Glycerin : 0.9
→ Moyenne : (0.2 + 1.0 + 0.9) / 3 = 0.7
→ Pénalité Retinol <0.4 : -0.2
→ Final : 0.5 (50%)

Score ingredient compat : 0.5 × 0.40 (pondération) = 0.20 (20% du critère)
```

---

### B. Safety Score (30%)

**Principe** : Certains ingrédients sont **intrinsèquement à risque**.

```typescript
function calculateSafetyScore(
  productIngredients: string[],
  userProfile: UserProfile
): number {
  let safetyScore = 1.0  // Commence à 100%
  
  for (const ingredient of productIngredients) {
    const ingredientData = INGREDIENT_DATABASE.find(ing => 
      ing.inci.toLowerCase() === ingredient.toLowerCase()
    )
    
    if (!ingredientData) continue
    
    // Pénalité selon niveau de risque
    switch (ingredientData.riskLevel) {
      case 3: safetyScore -= 0.15; break  // High-risk : -15%
      case 2: safetyScore -= 0.08; break  // Moderate : -8%
      case 1: safetyScore -= 0.03; break  // Low : -3%
      case 0: break  // Safe : 0%
    }
    
    // Pénalité CRITIQUE grossesse
    if (userProfile.isPregnant && !ingredientData.pregnancy_safe) {
      safetyScore -= 0.5  // -50% si interdit grossesse
    }
    
    // Pénalité comédogène pour peaux acnéiques
    if (userProfile.skinType === 'acne-prone' && ingredientData.comedogenic) {
      safetyScore -= 0.1  // -10%
    }
    
    // Pénalité irritant pour peaux sensibles
    if (userProfile.skinType === 'sensitive' && ingredientData.irritant) {
      safetyScore -= 0.15  // -15%
    }
  }
  
  return Math.max(0, safetyScore)
}
```

---

### C. Concentration Score (20%)

**Principe** : La **concentration** des actifs impacte efficacité ET risque.

```typescript
interface OptimalConcentration {
  ingredient: string
  optimalMin: number  // % minimal efficace
  optimalMax: number  // % maximal safe
  tooLow: number      // Seuil inefficace
  tooHigh: number     // Seuil irritant
}

const OPTIMAL_CONCENTRATIONS: OptimalConcentration[] = [
  {
    ingredient: 'Niacinamide',
    optimalMin: 5,
    optimalMax: 10,
    tooLow: 2,
    tooHigh: 15
  },
  {
    ingredient: 'Retinol',
    optimalMin: 0.3,
    optimalMax: 1.0,
    tooLow: 0.1,
    tooHigh: 1.5
  },
  {
    ingredient: 'Vitamin C',
    optimalMin: 10,
    optimalMax: 20,
    tooLow: 5,
    tooHigh: 30
  },
  {
    ingredient: 'Salicylic Acid',
    optimalMin: 0.5,
    optimalMax: 2.0,
    tooLow: 0.2,
    tooHigh: 3.0
  }
  // ... etc
]

function calculateConcentrationScore(
  activeIngredients: string[]
): number {
  let concentrationScore = 0.7  // Score neutre par défaut
  
  for (const active of activeIngredients) {
    // Extraire concentration (ex: "Niacinamide 10%" → 10)
    const match = active.match(/(\d+(?:\.\d+)?)\s*%/)
    if (!match) continue
    
    const concentration = parseFloat(match[1])
    const ingredientName = active.replace(match[0], '').trim()
    
    // Trouver règle optimale
    const rule = OPTIMAL_CONCENTRATIONS.find(r => 
      ingredientName.toLowerCase().includes(r.ingredient.toLowerCase())
    )
    
    if (!rule) continue
    
    // Scoring
    if (concentration >= rule.optimalMin && concentration <= rule.optimalMax) {
      concentrationScore += 0.1  // +10% si optimal
    } else if (concentration < rule.tooLow) {
      concentrationScore -= 0.05  // -5% si trop faible (inefficace)
    } else if (concentration > rule.tooHigh) {
      concentrationScore -= 0.15  // -15% si trop fort (irritant)
    }
  }
  
  return Math.max(0, Math.min(1, concentrationScore))
}
```

---

### D. Interaction Score (10%)

**Principe** : Certains ingrédients **interagissent mal**.

```typescript
const INCOMPATIBLE_PAIRS = [
  { ing1: 'Retinol', ing2: 'Vitamin C', penalty: 0.3 },      // Instabilité pH
  { ing1: 'Retinol', ing2: 'Benzoyl Peroxide', penalty: 0.4 },  // Dégradation
  { ing1: 'Niacinamide', ing2: 'Vitamin C', penalty: 0.1 },  // Mythe mais éviter haute conc
  { ing1: 'AHA', ing2: 'BHA', penalty: 0.2 },                // Sur-exfoliation
  { ing1: 'Retinol', ing2: 'AHA', penalty: 0.3 },            // Sur-irritation
  { ing1: 'Retinol', ing2: 'BHA', penalty: 0.3 }             // Sur-irritation
]

function calculateInteractionScore(
  activeIngredients: string[]
): number {
  let interactionScore = 1.0
  
  for (const pair of INCOMPATIBLE_PAIRS) {
    const hasIng1 = activeIngredients.some(ing => 
      ing.toLowerCase().includes(pair.ing1.toLowerCase())
    )
    const hasIng2 = activeIngredients.some(ing => 
      ing.toLowerCase().includes(pair.ing2.toLowerCase())
    )
    
    if (hasIng1 && hasIng2) {
      interactionScore -= pair.penalty
    }
  }
  
  return Math.max(0, interactionScore)
}
```

---

## 🔧 IMPLÉMENTATION FINALE

### ProductMatcherV2.scoreProducts()

```typescript
private scoreProducts(
  candidates: EnrichedProduct[],
  step: RoutineStep,
  profile: UserProfile
): ScoredProduct[] {
  return candidates.map((product) => {
    let score = 0
    
    // 🆕 CRITÈRE 1 : Compatibilité Ingrédients (35%)
    const ingredientCompatibility = this.calculateIngredientCompatibility(
      product,
      profile
    )
    score += ingredientCompatibility * 35
    
    // CRITÈRE 2 : Alignement problématique (30%)
    const concernMatch = this.calculateConcernMatch(
      product.targetConcerns,
      step.targetProblem
    )
    score += concernMatch * 30
    
    // CRITÈRE 3 : Qualité dermatologique (20%)
    score += (product.dermatologistRating / 100) * 20
    
    // CRITÈRE 4 : Prix (10%)
    const priceScore = this.calculatePriceScore(product.price)
    score += priceScore * 10
    
    // CRITÈRE 5 : Popularité (5%)
    score += (product.popularity / 100) * 5
    
    return { 
      product, 
      score: Math.round(score),
      breakdown: {  // 🆕 Debug scoring
        ingredientCompatibility: Math.round(ingredientCompatibility * 100),
        concernMatch: Math.round(concernMatch * 100),
        dermaRating: product.dermatologistRating,
        priceScore: Math.round(priceScore * 100),
        popularityScore: product.popularity
      }
    }
  })
  .sort((a, b) => b.score - a.score)
}

private calculateIngredientCompatibility(
  product: EnrichedProduct,
  profile: UserProfile
): number {
  // A. Compatibilité type de peau (40%)
  const skinTypeScore = calculateSkinTypeCompatibility(
    product.ingredients || [],
    profile.skinType
  )
  
  // B. Sécurité (30%)
  const safetyScore = calculateSafetyScore(
    product.ingredients || [],
    profile
  )
  
  // C. Concentration actifs (20%)
  const concentrationScore = calculateConcentrationScore(
    product.activeIngredients || []
  )
  
  // D. Interactions (10%)
  const interactionScore = calculateInteractionScore(
    product.activeIngredients || []
  )
  
  const finalScore = 
    (skinTypeScore * 0.40) +
    (safetyScore * 0.30) +
    (concentrationScore * 0.20) +
    (interactionScore * 0.10)
  
  return finalScore  // 0-1
}
```

---

## 📊 IMPACT ATTENDU

### Exemple Comparatif

**Scénario** : Utilisateur peau sensible cherche traitement anti-âge

#### Scoring V1 (Sans ingrédients)

```
Produit A : Retinol 1%
→ Score V1 : 72/100
  - concernMatch : 40% (anti-âge)
  - dermaRating : 30% (85/100)
  - price : 2%
  - popularity : 0%
→ ✅ SÉLECTIONNÉ (rang #1)

Produit B : Bakuchiol 1% + Peptides
→ Score V1 : 68/100
  - concernMatch : 35%
  - dermaRating : 28%
  - price : 5%
  - popularity : 0%
→ ❌ Rang #2
```

**Problème** : Retinol très irritant pour peau sensible ignoré !

---

#### Scoring V2 (Avec ingrédients)

```
Produit A : Retinol 1%
→ Score V2 : 42/100  (REJETÉ !)
  - ingredientCompat : 10% (Retinol = 0.2 compat sensible)
  - concernMatch : 25%
  - dermaRating : 7%
  - price : 0%
  - popularity : 0%
→ ❌ Rang #2

Produit B : Bakuchiol 1% + Peptides
→ Score V2 : 78/100  (SÉLECTIONNÉ !)
  - ingredientCompat : 32% (Bakuchiol = 0.9 compat sensible)
  - concernMatch : 30%
  - dermaRating : 16%
  - price : 0%
  - popularity : 0%
→ ✅ SÉLECTIONNÉ (rang #1)
```

**Résultat** : **Meilleure sélection** adaptée type de peau !

---

## ✅ MÉTRIQUES SUCCÈS

| Métrique | Avant (V1) | Après (V2) | Amélioration |
|----------|------------|------------|--------------|
| **Scores moyens** | 65/100 | **72/100** | **+11%** |
| **Anomalies zones** | 2-3% | **0%** | **-100%** |
| **Irritations** | ~15% | **<5%** | **-67%** |
| **Satisfaction ingrédients** | 60% | **85%** | **+42%** |

---

**Version** : 2.0  
**Dernière mise à jour** : 2 Octobre 2025  
**Prochaine révision** : Post-tests A/B (Sem 6)

