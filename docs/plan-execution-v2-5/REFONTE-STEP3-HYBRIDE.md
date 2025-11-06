# 🔄 REFONTE STEP 3 - ARCHITECTURE HYBRIDE IA + ALGO

**Status** : 🚧 EN COURS  
**Branche** : `refonte-step3-hybride-ia-algo`  
**Date début** : 2 Octobre 2025  
**Branche sauvegarde** : `sauvegarde-app-complete-2025-09-30` (commit `7aa0d98`)

---

## 🎯 PROBLÈME IDENTIFIÉ

### Limites approche monolithique IA pure (Step 3)

**Symptômes observés** :
- ❌ JSON généré **incomplet** : 5 produits au lieu de 15-20 attendus
- ❌ Phases d'adaptation et maintenance **ignorées**
- ❌ Traitements alternés **non couverts**
- ❌ Token limit OpenAI atteint pour routines complexes
- ❌ Coût élevé par analyse (4000+ tokens Step 3)
- ❌ Latence importante (15-20s pour Step 3)
- ❌ Fragilité JSON (markdown wrapping, échappements)

**Diagnostic** :
> **Une seule étape IA ne peut pas gérer** : analyse routine (18 steps) + catalogue (300+ produits) + sélection précise + alternatives (3 par produit) + validation cohérence = **Mission impossible pour GPT-4o en un seul appel**

---

## 🏗️ ARCHITECTURE HYBRIDE CIBLE

### Principe : **"IA pour comprendre, Algo pour exécuter"**

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 3 HYBRIDE : Sélection Produits Intelligente          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📥 INPUTS                                                  │
│  - Routine personnalisée (Step 2) : 15-20 steps           │
│  - Profil utilisateur (allergies, budget, préférences)    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  🤖 MICRO-ÉTAPE IA (léger, 500 tokens)              │  │
│  │  GPT-4o : Mapping conceptuel uniquement             │  │
│  │                                                       │  │
│  │  Input :  1 routine step                            │  │
│  │  Output : { careType, intent, mustHave[], avoid[] } │  │
│  │  Durée :  ~2s par step                              │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  🗄️ DATABASE PRODUITS (structurée)                  │  │
│  │  Catalogue enrichi avec métadonnées                 │  │
│  │                                                       │  │
│  │  - Indexation par careType                          │  │
│  │  - Filtres : skinType, concerns, ingredients        │  │
│  │  - Scoring pré-calculé : prix, popularité, notes    │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  ⚙️ ALGORITHME MATCHING (TypeScript pur)            │  │
│  │  Sélection déterministe et rapide                   │  │
│  │                                                       │  │
│  │  1. Filtrage strict (allergies, budget)            │  │
│  │  2. Scoring multi-critères (intent + profile)      │  │
│  │  3. Sélection Top 1 (produit principal)            │  │
│  │  4. Sélection Top 3 alternatives                    │  │
│  │  Durée : <100ms pour 20 produits                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  📤 OUTPUT                                                  │
│  - ProductSelectionV3 : 100% complet, validé Zod          │
│  - Garantie : 1 produit + 3 alternatives par step         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

MÉTRIQUES CIBLES :
- ✅ Complétude : 100% steps couverts
- ✅ Latence : <5s total (vs 15-20s actuellement)
- ✅ Coût : -70% tokens (500 vs 4000+ actuellement)
- ✅ Fiabilité : 99% (algo déterministe)
- ✅ Qualité : Maintenue (IA pour l'intelligence, algo pour l'exécution)
```

---

## 📐 COMPARAISON ARCHITECTURES

| Critère | ❌ Monolithique IA pure | ✅ Hybride IA + Algo |
|---------|-------------------------|----------------------|
| **Complétude** | 30% (5/18 produits) | 100% garanti |
| **Latence Step 3** | 15-20s | <5s |
| **Coût par analyse** | ~4000 tokens | ~500 tokens (-88%) |
| **Fiabilité JSON** | 85% (parsing errors) | 99% (algo strict) |
| **Scalabilité routine** | Max 8-10 steps | Illimité |
| **Catalogue** | Inline (limite tokens) | Database (optimisé) |
| **Alternatives** | Aléatoires/manquantes | 3 par step garanti |
| **Maintenance** | Prompt engineering | Code TypeScript |

---

## 🛠️ IMPLÉMENTATION

### Phase 1 : Structure Database Produits (1h)

**Objectif** : Catalogue enrichi avec métadonnées de matching

**Fichier** : `src/data/productsDatabase.ts`

```typescript
export interface EnrichedProduct {
  // Identité
  catalogId: string
  name: string
  brand: string
  category: string // cleanser, treatment, moisturizer, sunscreen...
  
  // Métadonnées dermatologiques
  careType: string // nettoyage, hydratation, traitement, protection
  targetSkinTypes: string[]
  targetConcerns: string[] // acne, redness, aging, dryness...
  activeIngredients: string[]
  allergens: string[]
  
  // Scoring
  price: number
  popularity: number // 0-100
  dermatologistRating: number // 0-100
  
  // Retail
  imageUrl: string
  retailers: { name: string; url: string; price?: number }[]
  
  // Timing
  applicationTiming: 'morning' | 'evening' | 'both'
  targetZones: string[]
}

export interface ProductDatabase {
  byCategory: Map<string, EnrichedProduct[]>
  byCareType: Map<string, EnrichedProduct[]>
  allProducts: EnrichedProduct[]
}
```

**Actions** :
1. ✅ Créer schéma Zod `EnrichedProductSchema`
2. ✅ Migrer catalogue actuel vers nouveau format
3. ✅ Ajouter métadonnées manquantes (targetConcerns, careType)
4. ✅ Créer index par careType pour recherche rapide

---

### Phase 2 : Algorithme Matching (2h)

**Objectif** : Sélection déterministe et performante

**Fichier** : `src/services/products/ProductMatcher.ts`

```typescript
export class ProductMatcher {
  private database: ProductDatabase
  
  constructor(database: ProductDatabase) {
    this.database = database
  }
  
  /**
   * Sélectionne le meilleur produit pour un step de routine
   * Garantit : 1 produit principal + 3 alternatives
   */
  async selectForRoutineStep(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): Promise<ProductMatch> {
    // 1. FILTRAGE STRICT
    const candidates = this.filterCandidates(step, profile, budget)
    
    // 2. SCORING MULTI-CRITÈRES
    const scored = this.scoreProducts(candidates, step, profile)
    
    // 3. SÉLECTION TOP 1
    const mainProduct = scored[0]
    
    // 4. ALTERNATIVES (Top 2-4)
    const alternatives = scored.slice(1, 4)
    
    return {
      mainProduct,
      alternatives,
      matchingScore: mainProduct.score,
      reasoning: this.explainMatch(mainProduct, step)
    }
  }
  
  private filterCandidates(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): EnrichedProduct[] {
    const careType = step.careType
    let candidates = this.database.byCareType.get(careType) || []
    
    // Filtrer allergies
    if (profile.allergies.length > 0) {
      candidates = candidates.filter(p => 
        !p.allergens.some(a => profile.allergies.includes(a))
      )
    }
    
    // Filtrer budget
    if (budget.maxBudget) {
      const avgBudgetPerStep = budget.maxBudget / budget.expectedSteps
      candidates = candidates.filter(p => p.price <= avgBudgetPerStep * 1.2)
    }
    
    // Filtrer skinType
    candidates = candidates.filter(p =>
      p.targetSkinTypes.includes(profile.skinType)
    )
    
    return candidates
  }
  
  private scoreProducts(
    candidates: EnrichedProduct[],
    step: RoutineStep,
    profile: UserProfile
  ): ScoredProduct[] {
    return candidates.map(product => {
      let score = 0
      
      // Critère 1 : Alignement problématique (40%)
      const concernMatch = this.calculateConcernMatch(
        product.targetConcerns,
        step.targetProblem
      )
      score += concernMatch * 40
      
      // Critère 2 : Qualité dermatologique (30%)
      score += product.dermatologistRating * 0.3
      
      // Critère 3 : Rapport qualité/prix (20%)
      const priceScore = this.calculatePriceScore(product.price)
      score += priceScore * 20
      
      // Critère 4 : Popularité (10%)
      score += product.popularity * 0.1
      
      return { product, score }
    }).sort((a, b) => b.score - a.score)
  }
  
  private explainMatch(
    product: ScoredProduct,
    step: RoutineStep
  ): string {
    // Générer justification humaine
    return `${product.product.name} est optimal pour ${step.careType} car ` +
           `il cible ${step.targetProblem} avec un score de matching de ${product.score}/100.`
  }
}
```

**Algorithme de scoring** :
```
Score Total (0-100) = 
  40% Alignement problématique
+ 30% Qualité dermatologique
+ 20% Rapport qualité/prix
+ 10% Popularité/avis
```

---

### Phase 3 : Micro-IA Mapping (1h)

**Objectif** : IA légère pour traduire routine step → critères de recherche

**Fichier** : `src/services/ai/core/prompts/productMapping.ts`

```typescript
export const PRODUCT_MAPPING_SYSTEM_PROMPT = `
Tu es un expert en dermatologie cosmétique. Ta mission est de traduire une étape de routine de soin en critères de recherche produit.

ENTRÉE : 1 étape de routine
{
  "stepNumber": 3,
  "careType": "treatment",
  "timing": "evening",
  "targetProblem": "acné inflammatoire et rougeurs",
  "targetZones": ["front", "joues"]
}

SORTIE : Critères de recherche (JSON strict)
{
  "careType": "treatment",
  "intent": "anti-acne + anti-redness",
  "mustHaveIngredients": ["niacinamide", "zinc", "azelaic acid"],
  "avoidIngredients": ["alcohol", "fragrance"],
  "preferredFormats": ["gel", "serum"],
  "timing": "evening"
}

RÈGLES :
- JSON valide uniquement
- mustHaveIngredients : max 3 actifs prioritaires
- avoidIngredients : irritants à éviter
- Intent : résumé en 3-5 mots
`

export function buildProductMappingUserPrompt(step: RoutineStep): string {
  return `Étape routine :\n${JSON.stringify(step, null, 2)}`
}
```

**Avantages** :
- ✅ 500 tokens max (vs 4000+ actuellement)
- ✅ ~2s latence par step
- ✅ JSON simple → parsing ultra-fiable
- ✅ Peut être parallelisé (Promise.all sur steps)

---

### Phase 4 : Intégration Pipeline (1h)

**Objectif** : Remplacer Step 3 monolithique par pipeline hybride

**Fichier** : `src/services/ai/AnalysisService.ts`

```typescript
async selectOptimalProducts(
  routine: PersonalizedRoutine,
  profile: UserProfile,
  budget: BudgetConstraints
): Promise<ProductSelectionV3> {
  
  // 1. CHARGER DATABASE PRODUITS
  const productDatabase = await ProductDatabaseLoader.load()
  const matcher = new ProductMatcher(productDatabase)
  
  // 2. EXTRAIRE LES STEPS DE LA ROUTINE
  const allSteps = this.extractAllSteps(routine)
  
  // 3. POUR CHAQUE STEP : MAPPING IA + MATCHING ALGO
  const selectedProducts: SelectedProductV3[] = []
  
  for (const step of allSteps) {
    // 3a. Mapping IA léger (optionnel, peut être skipé si careType clair)
    const mappingCriteria = await this.mapStepToCriteria(step)
    
    // 3b. Matching algorithmique
    const match = await matcher.selectForRoutineStep(
      step,
      profile,
      budget,
      mappingCriteria
    )
    
    // 3c. Formater pour schéma V3
    selectedProducts.push({
      routineStepId: step.stepNumber,
      catalogId: match.mainProduct.catalogId,
      productName: match.mainProduct.name,
      brand: match.mainProduct.brand,
      price: match.mainProduct.price,
      matchingScore: match.matchingScore,
      alternatives: match.alternatives.map(alt => ({
        catalogId: alt.catalogId,
        productName: alt.name,
        brand: alt.brand,
        price: alt.price,
        matchingScore: alt.score
      })),
      justification: match.reasoning,
      applicationAdvice: match.mainProduct.applicationAdvice,
      timing: step.timing,
      targetZones: step.targetZones
    })
  }
  
  // 4. VALIDATION BUDGET
  const budgetBreakdown = this.calculateBudgetBreakdown(selectedProducts, budget)
  
  // 5. VALIDATION COHÉRENCE
  const coherenceValidation = this.validateCoherence(routine, selectedProducts)
  
  return {
    selectedProducts,
    budgetBreakdown,
    coherenceValidation
  }
}
```

---

## 📊 PLAN D'EXÉCUTION

### Sprint D : Implémentation Hybride (4h)

| Tâche | Durée | Fichier | Status |
|-------|-------|---------|--------|
| **D1** : Créer ProductDatabase structure | 1h | `src/data/productsDatabase.ts` | 🔲 TODO |
| **D2** : Implémenter ProductMatcher algo | 2h | `src/services/products/ProductMatcher.ts` | 🔲 TODO |
| **D3** : Créer prompt mapping léger | 30min | `src/services/ai/core/prompts/productMapping.ts` | 🔲 TODO |
| **D4** : Intégrer dans AnalysisService | 1h | `src/services/ai/AnalysisService.ts` | 🔲 TODO |
| **D5** : Tests E2E routine complexe | 30min | Tests manuels | 🔲 TODO |

**Durée totale** : ~5h  
**Validation** : Routine 18 steps → 18 produits + 54 alternatives (3×18)

---

## ✅ CRITÈRES DE SUCCÈS

### Métriques obligatoires

1. **Complétude** : 100% des steps ont un produit (0% "produit non spécifié")
2. **Alternatives** : 3 alternatives par step minimum
3. **Performance** : Step 3 < 5s pour routine 20 steps
4. **Coût** : < 1000 tokens total pour Step 3
5. **Fiabilité** : 0% erreur JSON parsing
6. **Budget** : Respect contrainte budget ±10%

### Tests de validation

```typescript
// Test 1 : Routine complexe (18 steps)
const routine = {
  immediate: { morning: 3, evening: 2 },
  adaptation: { morning: 4, evening: 5 },
  maintenance: { morning: 2, evening: 2 }
}

// Attente : 18 produits + 54 alternatives
// Budget : 120€
// Durée max : 5s

// Test 2 : Allergies multiples
const profile = {
  allergies: ['fragrance', 'alcohol', 'retinol']
}

// Attente : Tous produits sans allergènes listés

// Test 3 : Budget serré
const budget = { maxBudget: 50 }

// Attente : Somme prix produits principaux < 50€
```

---

## 🔄 ROLLBACK SI BESOIN

Si la refonte hybride échoue ou prend trop de temps :

```bash
# Revenir à la version sauvegardée
git checkout sauvegarde-app-complete-2025-09-30

# Ou merger les corrections markdown seules
git checkout refonte-step3-hybride-ia-algo -- src/services/ai/AnalysisService.ts
# (lignes 765-769 : nettoyage markdown)
```

---

## 📚 RÉFÉRENCES

- **Branche actuelle** : `refonte-step3-hybride-ia-algo`
- **Commit sauvegarde** : `7aa0d98` sur `sauvegarde-app-complete-2025-09-30`
- **Document plan V2.5** : `docs/plan-execution-v2-5/00-INDEX-GENERAL.md`
- **Fiche technique** : `docs/diagnostic-technique-refonte-ia-complete.md` (obsolète, à mettre à jour post-refonte)

---

**PRÊT À IMPLÉMENTER** 🚀

