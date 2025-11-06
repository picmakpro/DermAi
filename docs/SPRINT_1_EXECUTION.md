# 🚀 SPRINT 1 : Correction Step 3 Produits (Hybride IA+Algo)

**Durée** : 5 jours  
**Priorité** : ⚡ **CRITIQUE**  
**Objectif** : Finaliser Step 3 avec architecture hybride pour 100% fiabilité  
**Branche** : `feature/step3-hybrid`

---

## 🎯 OBJECTIF

Implémenter l'architecture hybride IA + Algorithme pour Step 3 (sélection produits) afin d'atteindre :
- ✅ 100% complétude (tous steps couverts, 0 "produit non spécifié")
- ✅ 3+ alternatives par produit
- ✅ Score matching visible partout
- ✅ Performance < 5s (vs 15-20s avant)
- ✅ Coût -88% tokens ($0.10 vs $0.80)

---

## 📋 CONTEXTE

### Problème Actuel
- ❌ Step 3 instable : "produits non spécifiés", pas d'alternatives
- ❌ JSON incomplet : 5 produits générés au lieu de 15-20
- ❌ Limite architecture monolithique : Token limit OpenAI atteint
- ❌ Latence élevée : 15-20s pour routine complexe

### Solution : Architecture Hybride

```
┌─────────────────────────────────────────────────────────┐
│                   STEP 3 HYBRIDE                        │
├─────────────────────────────────────────────────────────┤
│  1. MICRO-IA (GPT-4o-mini) : Mapping conceptuel        │
│     → 500 tokens, 2s par step                           │
│                                                          │
│  2. DATABASE : Catalogue enrichi Supabase               │
│     → 2000+ produits, cache 1h                          │
│                                                          │
│  3. ALGORITHME : Scoring multi-critères TypeScript     │
│     → 5 critères pondérés, <100ms                       │
│                                                          │
│  4. GARANTIES : 1 produit + 3 alternatives par step    │
│     → 0% fallback générique                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 AGENTS PARALLÈLES

### **Agent 1 : Backend** 🔧
**Responsabilité** : Implémentation HybridProductSelector + ProductMatcherV2

**Fichiers à créer/modifier** :
1. `src/services/products/HybridProductSelector.ts` (nouveau)
2. `src/services/products/ProductMatcherV2.ts` (modifier)
3. `src/services/products/ProductDatabaseLoaderV2.ts` (modifier)
4. `src/services/products/scoring/ingredientScoring.ts` (nouveau)
5. `src/app/api/analyze/route.ts` (modifier - intégration Step 3)

**Tâches** :
- [ ] Créer `HybridProductSelector` avec méthode `selectForStep()`
- [ ] Implémenter micro-IA (GPT-4o-mini) pour mapping conceptuel
- [ ] Intégrer `ProductMatcherV2` avec scoring 5 critères
- [ ] Ajouter cache 1h par careType dans `ProductDatabaseLoaderV2`
- [ ] Implémenter scoring ingrédients (35% du score total)
- [ ] Garantir 1 produit + 3 alternatives par step
- [ ] Ajouter logs détaillés pour debugging
- [ ] Intégrer dans pipeline Step 3 (`/api/analyze`)

---

### **Agent 2 : Frontend** 🎨
**Responsabilité** : Affichage scores + alternatives dans ResultsPage

**Fichiers à créer/modifier** :
1. `src/components/features/routine/ProductCard.tsx` (modifier)
2. `src/components/features/routine/AlternativesModal.tsx` (nouveau)
3. `src/components/features/routine/ScoreBadge.tsx` (nouveau)
4. `src/app/results/page.tsx` (modifier)

**Tâches** :
- [ ] Ajouter affichage score matching dans `ProductCard` (50-95%)
- [ ] Créer `AlternativesModal` avec liste 3+ alternatives
- [ ] Créer `ScoreBadge` avec couleurs selon score (vert >80, jaune 60-80, rouge <60)
- [ ] Ajouter bouton "Voir alternatives" dans `ProductCard`
- [ ] Intégrer modal dans `ResultsPage`
- [ ] Ajouter loading states pendant fetch alternatives
- [ ] Responsive mobile pour modal

---

### **Agent 3 : Tests** ✅
**Responsabilité** : Tests unitaires + E2E validation Step 3

**Fichiers à créer** :
1. `tests/unit/services/products/HybridProductSelector.test.ts`
2. `tests/unit/services/products/ProductMatcherV2.test.ts`
3. `tests/unit/services/products/ingredientScoring.test.ts`
4. `tests/e2e/step3-hybrid.spec.ts`

**Tâches** :
- [ ] Tests unitaires `HybridProductSelector` (10+ cas)
- [ ] Tests unitaires `ProductMatcherV2` (scoring 5 critères)
- [ ] Tests unitaires scoring ingrédients
- [ ] Tests E2E : 20 cas variés (différents profils)
- [ ] Validation 100% complétude (0 "produit non spécifié")
- [ ] Validation 3+ alternatives par step
- [ ] Validation performance < 5s
- [ ] Validation score matching affiché

---

## 📝 SPÉCIFICATIONS DÉTAILLÉES

### 1. HybridProductSelector

```typescript
// src/services/products/HybridProductSelector.ts
import OpenAI from 'openai'
import { ProductMatcherV2 } from './ProductMatcherV2'
import { ProductDatabaseLoaderV2 } from './ProductDatabaseLoaderV2'
import type { RoutineStep, UserProfile, BudgetConstraints, ProductMatch } from '@/types'

export class HybridProductSelector {
  private openai: OpenAI
  private matcher: ProductMatcherV2
  
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.matcher = new ProductMatcherV2()
  }
  
  /**
   * Sélectionne produit + alternatives pour un step de routine
   * Architecture hybride : Micro-IA + Database + Algo
   */
  async selectForStep(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): Promise<ProductMatch> {
    console.log(`[HybridSelector] Step ${step.stepNumber} - ${step.careType}`)
    
    try {
      // 1. MICRO-IA : Mapping conceptuel (optionnel, peut être skip si careType clair)
      const enrichedStep = await this.enrichStepWithAI(step)
      
      // 2. DATABASE : Charger produits par careType (avec cache)
      const candidates = await ProductDatabaseLoaderV2.loadByCareType(
        enrichedStep.careType
      )
      
      console.log(`   📦 ${candidates.length} candidats chargés`)
      
      // 3. ALGORITHME : Scoring multi-critères
      const match = this.matcher.selectForRoutineStep(
        enrichedStep,
        profile,
        budget,
        candidates
      )
      
      console.log(`   ✓ Produit sélectionné : ${match.product.name} (score ${match.score})`)
      console.log(`   ✓ ${match.alternatives.length} alternatives disponibles`)
      
      // 4. GARANTIES : Vérifier complétude
      if (!match.product) {
        throw new Error(`No product found for step ${step.stepNumber}`)
      }
      
      if (match.alternatives.length < 3) {
        console.warn(`   ⚠️ Seulement ${match.alternatives.length} alternatives (cible 3+)`)
      }
      
      return match
      
    } catch (error) {
      console.error(`[HybridSelector] Error step ${step.stepNumber}:`, error)
      throw error
    }
  }
  
  /**
   * Enrichissement optionnel via micro-IA
   * Seulement si careType ambigu ou targetProblem complexe
   */
  private async enrichStepWithAI(step: RoutineStep): Promise<RoutineStep> {
    // Si careType déjà clair, skip IA
    if (this.isCareTypeClear(step.careType)) {
      return step
    }
    
    // Sinon, micro-IA pour clarifier
    const prompt = `
Analyse ce step de routine et retourne JSON strict :
{
  "careType": "nettoyage|tonification|hydratation|protection|anti-age|eclat|traitement-cible|apaisement|exfoliation|masque",
  "targetConcerns": ["concern1", "concern2"]
}

Step : ${JSON.stringify(step)}
`
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    })
    
    const enriched = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      ...step,
      careType: enriched.careType || step.careType,
      targetConcerns: enriched.targetConcerns || []
    }
  }
  
  private isCareTypeClear(careType: string): boolean {
    const validCareTypes = [
      'nettoyage', 'tonification', 'hydratation', 'protection',
      'anti-age', 'eclat', 'traitement-cible', 'apaisement',
      'exfoliation', 'masque'
    ]
    return validCareTypes.includes(careType)
  }
}
```

---

### 2. ProductMatcherV2 (Scoring 5 Critères)

```typescript
// src/services/products/ProductMatcherV2.ts
import type { EnrichedProduct, RoutineStep, UserProfile, BudgetConstraints } from '@/types'
import { calculateIngredientScore } from './scoring/ingredientScoring'

export interface ProductMatch {
  product: EnrichedProduct
  alternatives: EnrichedProduct[]
  score: number
  reasoning: string
}

export class ProductMatcherV2 {
  /**
   * Sélectionne produit optimal + alternatives
   * Scoring 5 critères : Ingrédients 35% + Concerns 30% + Qualité 20% + Prix 10% + Popularité 5%
   */
  selectForRoutineStep(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints,
    candidates: EnrichedProduct[]
  ): ProductMatch {
    console.log(`[MatcherV2] Matching step ${step.stepNumber}`)
    
    // 1. FILTRAGE STRICT
    let filtered = this.filterCandidates(candidates, step, profile, budget)
    console.log(`   🔍 ${filtered.length} candidats après filtrage`)
    
    if (filtered.length === 0) {
      throw new Error(`No products match filters for step ${step.stepNumber}`)
    }
    
    // 2. SCORING MULTI-CRITÈRES
    const scored = this.scoreProducts(filtered, step, profile)
    
    // 3. SÉLECTION TOP 1 + ALTERNATIVES
    const mainProduct = scored[0]
    const alternatives = scored.slice(1, 4) // Top 2-4
    
    console.log(`   ✓ Score top 1 : ${mainProduct.score}/100`)
    console.log(`   ✓ Alternatives : ${alternatives.map(s => s.score).join(', ')}`)
    
    return {
      product: mainProduct.product,
      alternatives: alternatives.map(s => s.product),
      score: mainProduct.score,
      reasoning: this.generateReasoning(mainProduct, step)
    }
  }
  
  /**
   * Filtrage strict : allergies, budget, skinType, zones
   */
  private filterCandidates(
    candidates: EnrichedProduct[],
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): EnrichedProduct[] {
    let filtered = candidates
    
    // FILTRE 1 : Allergies (STRICT)
    if (profile.allergies && profile.allergies.length > 0) {
      const before = filtered.length
      filtered = filtered.filter(p => 
        !p.allergens.some(allergen => profile.allergies.includes(allergen))
      )
      console.log(`   🚫 ${before - filtered.length} exclus (allergies)`)
    }
    
    // FILTRE 2 : Budget (SOUPLE)
    const avgBudgetPerStep = budget.maxBudget / budget.expectedSteps
    const maxPrice = avgBudgetPerStep * 1.5
    const budgetFiltered = filtered.filter(p => p.price <= maxPrice)
    if (budgetFiltered.length > 0) {
      const before = filtered.length
      filtered = budgetFiltered
      console.log(`   💰 ${before - filtered.length} exclus (budget > ${maxPrice}€)`)
    }
    
    // FILTRE 3 : SkinType (SOUPLE)
    const skinTypeFiltered = filtered.filter(p =>
      p.targetSkinTypes.includes(profile.skinType)
    )
    if (skinTypeFiltered.length > 0) {
      const before = filtered.length
      filtered = skinTypeFiltered
      console.log(`   🧴 ${before - filtered.length} exclus (skinType)`)
    }
    
    // FILTRE 4 : Zones (STRICT)
    if (step.targetZones && step.targetZones.length > 0) {
      const before = filtered.length
      filtered = filtered.filter(p => {
        if (!p.restrictedZones || p.restrictedZones.length === 0) {
          return true // Pas de restriction
        }
        // Vérifier intersection zones
        const hasRestriction = step.targetZones.some(stepZone =>
          p.restrictedZones.some(restrictedZone =>
            stepZone.toLowerCase().includes(restrictedZone.toLowerCase())
          )
        )
        return !hasRestriction
      })
      console.log(`   🚫 ${before - filtered.length} exclus (zones incompatibles)`)
    }
    
    return filtered
  }
  
  /**
   * Scoring 5 critères pondérés
   */
  private scoreProducts(
    candidates: EnrichedProduct[],
    step: RoutineStep,
    profile: UserProfile
  ): Array<{ product: EnrichedProduct; score: number }> {
    const scored = candidates.map(product => {
      let score = 0
      
      // CRITÈRE 1 : Compatibilité ingrédients × skinType (35%)
      const ingredientScore = calculateIngredientScore(product, profile.skinType)
      score += ingredientScore * 0.35
      
      // CRITÈRE 2 : Alignement problématique (30%)
      const concernScore = this.calculateConcernMatch(
        product.targetConcerns,
        step.targetProblem
      )
      score += concernScore * 30
      
      // CRITÈRE 3 : Qualité dermatologique (20%)
      score += (product.dermatologistRating / 100) * 20
      
      // CRITÈRE 4 : Prix (10%)
      const priceScore = Math.max(1 - product.price / 100, 0)
      score += priceScore * 10
      
      // CRITÈRE 5 : Popularité (5%)
      score += (product.popularity / 100) * 5
      
      return { product, score: Math.round(score) }
    })
    
    // Trier par score décroissant
    scored.sort((a, b) => b.score - a.score)
    
    return scored
  }
  
  private calculateConcernMatch(
    productConcerns: string[],
    targetProblem?: string
  ): number {
    if (!targetProblem) return 50 // Score neutre
    
    const keywords = targetProblem
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(word => word.length > 3)
    
    let matchCount = 0
    for (const keyword of keywords) {
      for (const concern of productConcerns) {
        if (concern.toLowerCase().includes(keyword) || 
            keyword.includes(concern.toLowerCase())) {
          matchCount++
          break
        }
      }
    }
    
    return Math.min((matchCount / keywords.length) * 100, 100)
  }
  
  private generateReasoning(
    scored: { product: EnrichedProduct; score: number },
    step: RoutineStep
  ): string {
    return `${scored.product.name} est optimal pour ${step.careType} avec un score de ${scored.score}/100. Ce produit combine efficacité dermatologique et compatibilité avec votre profil.`
  }
}
```

---

### 3. Scoring Ingrédients

```typescript
// src/services/products/scoring/ingredientScoring.ts
import type { EnrichedProduct, SkinType } from '@/types'

/**
 * Database compatibilité ingrédients × skinType
 * Source : Phase 3 Sprint 3.1
 */
const INGREDIENT_COMPATIBILITY: Record<string, Record<SkinType, number>> = {
  'Niacinamide': { dry: 0.9, oily: 1.0, combination: 0.95, sensitive: 0.85, normal: 0.95, acne_prone: 1.0, mature: 0.9 },
  'Hyaluronic Acid': { dry: 1.0, oily: 0.95, combination: 0.95, sensitive: 0.95, normal: 1.0, acne_prone: 0.9, mature: 1.0 },
  'Retinol': { dry: 0.7, oily: 0.9, combination: 0.85, sensitive: 0.4, normal: 0.85, acne_prone: 0.9, mature: 0.95 },
  'Vitamin C': { dry: 0.85, oily: 0.9, combination: 0.9, sensitive: 0.7, normal: 0.9, acne_prone: 0.85, mature: 0.95 },
  'Salicylic Acid': { dry: 0.5, oily: 1.0, combination: 0.9, sensitive: 0.4, normal: 0.8, acne_prone: 1.0, mature: 0.7 },
  'Glycolic Acid': { dry: 0.6, oily: 0.95, combination: 0.85, sensitive: 0.3, normal: 0.85, acne_prone: 0.9, mature: 0.9 },
  'Ceramides': { dry: 1.0, oily: 0.8, combination: 0.9, sensitive: 1.0, normal: 0.95, acne_prone: 0.85, mature: 1.0 },
  'Peptides': { dry: 0.9, oily: 0.85, combination: 0.9, sensitive: 0.9, normal: 0.95, acne_prone: 0.85, mature: 1.0 },
  'Zinc': { dry: 0.7, oily: 1.0, combination: 0.9, sensitive: 0.85, normal: 0.85, acne_prone: 1.0, mature: 0.8 },
  'Centella Asiatica': { dry: 0.9, oily: 0.85, combination: 0.9, sensitive: 1.0, normal: 0.95, acne_prone: 0.9, mature: 0.9 }
  // ... 16 autres ingrédients (voir Phase 3 Sprint 3.1)
}

/**
 * Calcule score compatibilité ingrédients (0-100)
 */
export function calculateIngredientScore(
  product: EnrichedProduct,
  skinType: SkinType
): number {
  if (!product.ingredients || product.ingredients.length === 0) {
    return 50 // Score neutre si pas d'ingrédients
  }
  
  let totalScore = 0
  let matchedIngredients = 0
  
  for (const ingredient of product.ingredients) {
    // Nettoyer nom ingrédient (enlever concentration)
    const cleanName = ingredient.replace(/\s*\d+%?/g, '').trim()
    
    // Chercher dans database
    const compatibility = INGREDIENT_COMPATIBILITY[cleanName]
    if (compatibility) {
      totalScore += compatibility[skinType] * 100
      matchedIngredients++
    }
  }
  
  if (matchedIngredients === 0) {
    return 50 // Score neutre si aucun ingrédient reconnu
  }
  
  return Math.round(totalScore / matchedIngredients)
}
```

---

## ✅ DEFINITION OF DONE (DoD)

### Backend
- [ ] `HybridProductSelector` implémenté et testé
- [ ] `ProductMatcherV2` avec scoring 5 critères opérationnel
- [ ] Scoring ingrédients (35%) fonctionnel
- [ ] Cache 1h par careType implémenté
- [ ] Logs détaillés pour debugging
- [ ] Intégration dans `/api/analyze` complète
- [ ] Performance Step 3 < 5s validée

### Frontend
- [ ] Score matching affiché dans `ProductCard`
- [ ] `AlternativesModal` fonctionnel avec 3+ alternatives
- [ ] `ScoreBadge` avec couleurs selon score
- [ ] Bouton "Voir alternatives" opérationnel
- [ ] Responsive mobile validé
- [ ] Loading states implémentés

### Tests
- [ ] 10+ tests unitaires `HybridProductSelector`
- [ ] 10+ tests unitaires `ProductMatcherV2`
- [ ] 5+ tests unitaires scoring ingrédients
- [ ] 20 tests E2E cas variés (100% passants)
- [ ] Validation 100% complétude (0 "produit non spécifié")
- [ ] Validation 3+ alternatives par step
- [ ] Validation performance < 5s

### Global
- [ ] Build production OK (0 erreur TypeScript)
- [ ] Linter 0 erreur
- [ ] 0 console.log en production
- [ ] Documentation mise à jour

---

## 🚀 COMMANDES D'EXÉCUTION

### Setup
```bash
# Créer branche
git checkout -b feature/step3-hybrid

# Installer dépendances (si nécessaire)
npm install
```

### Développement
```bash
# Serveur dev
npm run dev

# Type check
npm run type-check

# Linter
npm run lint
```

### Tests
```bash
# Tests unitaires
npm run test

# Tests unitaires (watch mode)
npm run test:watch

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

### Build
```bash
# Build production
npm run build

# Vérifier build
npm run start
```

### Validation Finale
```bash
# Checklist complète
npm run type-check && \
npm run lint && \
npm run test && \
npm run build && \
echo "✅ Sprint 1 validé !"
```

---

## 📊 MÉTRIQUES DE SUCCÈS

| Métrique | Avant | Cible | Validation |
|----------|-------|-------|------------|
| **Complétude** | 70% | 100% | 0 "produit non spécifié" |
| **Alternatives** | 0-1 | 3+ | Modal avec 3+ produits |
| **Performance** | 15-20s | <5s | Tests E2E |
| **Coût tokens** | $0.80 | $0.10 | Logs OpenAI |
| **Score affiché** | ❌ | ✅ | UI ResultsPage |

---

## 🔄 WORKFLOW AGENTS

### Jour 1-2 : Agent Backend
```bash
# Agent Backend démarre
@agent backend "Implémenter HybridProductSelector selon spec Sprint 1"

# Fichiers créés/modifiés :
# - src/services/products/HybridProductSelector.ts
# - src/services/products/ProductMatcherV2.ts
# - src/services/products/scoring/ingredientScoring.ts
# - src/services/products/ProductDatabaseLoaderV2.ts

# Validation intermédiaire
npm run type-check
npm run test src/services/products/
```

### Jour 3-4 : Agent Frontend (parallèle)
```bash
# Agent Frontend démarre (parallèle à Backend)
@agent frontend "Afficher scores + alternatives produits dans ResultsPage"

# Fichiers créés/modifiés :
# - src/components/features/routine/ProductCard.tsx
# - src/components/features/routine/AlternativesModal.tsx
# - src/components/features/routine/ScoreBadge.tsx
# - src/app/results/page.tsx

# Validation intermédiaire
npm run lint
npm run dev # Test visuel
```

### Jour 5 : Agent Tests
```bash
# Agent Tests démarre (après Backend + Frontend)
@agent tests "Créer tests unitaires + E2E validation Step 3"

# Fichiers créés :
# - tests/unit/services/products/HybridProductSelector.test.ts
# - tests/unit/services/products/ProductMatcherV2.test.ts
# - tests/unit/services/products/ingredientScoring.test.ts
# - tests/e2e/step3-hybrid.spec.ts

# Validation finale
npm run test
npm run test:e2e
npm run build
```

---

## 📞 SUPPORT

### En cas de blocage :
1. Consulter `.cursor/BACKEND.md` (patterns services)
2. Consulter `docs/spec.md` section Step 3
3. Consulter `docs/plan-execution-v2-5/REFONTE-STEP3-HYBRIDE.md`
4. Rollback au commit précédent si nécessaire

### Validation avant merge :
- [ ] Tous tests passent (unit + E2E)
- [ ] Build production OK
- [ ] DoD complète validée
- [ ] Code review effectuée

---

**Prochaine action** : Exécuter Agent Backend (Jour 1-2)  
**Commande** : `@agent backend "Implémenter HybridProductSelector selon spec Sprint 1"`

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Statut** : ⚡ PRÊT À EXÉCUTION

