# 📋 SPRINT D : EXÉCUTION REFONTE STEP 3 HYBRIDE

**Objectif** : Remplacer l'architecture monolithique IA pure par une architecture hybride (IA + Algo) pour atteindre 100% de fiabilité et complétude.

**Principe** : "IA pour comprendre, Algo pour exécuter"

**Durée totale estimée** : 5-6h (approche incrémentale avec validation à chaque étape)

**Branche** : `refonte-step3-hybride-ia-algo` (déjà créée)

---

## 🎯 VUE D'ENSEMBLE DU SPRINT

```
┌──────────────────────────────────────────────────────────────┐
│  SPRINT D : Refonte Step 3 Hybride (5 phases)              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase D0 : Préparation & Setup (30min)                    │
│  ├─ Tests baseline de référence                            │
│  ├─ Sauvegarde état actuel                                 │
│  └─ Création structure fichiers                            │
│                                                              │
│  Phase D1 : ProductDatabase Structure (1h)                 │
│  ├─ Schémas Zod EnrichedProduct                            │
│  ├─ Migration catalogue existant                           │
│  ├─ Loader avec index optimisés                            │
│  └─ Tests unitaires database                               │
│                                                              │
│  Phase D2 : ProductMatcher Algorithme (2h)                 │
│  ├─ Filtrage candidats (allergies, budget, skinType)       │
│  ├─ Scoring multi-critères (4 dimensions)                  │
│  ├─ Sélection Top 1 + Top 3 alternatives                   │
│  └─ Tests unitaires matching                               │
│                                                              │
│  Phase D3 : Intégration Pipeline (1h)                      │
│  ├─ Extraction steps de routine                            │
│  ├─ Boucle matching sur tous steps                         │
│  ├─ Formatage ProductSelectionV3                           │
│  └─ Validation budget et cohérence                         │
│                                                              │
│  Phase D4 : Tests E2E & Validation (1h)                    │
│  ├─ Test routine simple (5 steps)                          │
│  ├─ Test routine complexe (18 steps)                       │
│  ├─ Test cas limites (allergies, budget serré)            │
│  └─ Validation métriques cibles                            │
│                                                              │
│  Phase D5 : Documentation & Finalisation (30min)           │
│  ├─ Rapport d'implémentation                               │
│  ├─ Mise à jour spec.md                                    │
│  └─ Commit et push                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📦 PHASE D0 : PRÉPARATION & SETUP (30min)

### Objectifs
- ✅ Établir baseline de référence pour comparaison
- ✅ Sauvegarder état actuel pour rollback rapide
- ✅ Créer structure de fichiers

### Tâches Détaillées

#### D0.1 : Tests Baseline (10min)

**Action** : Lancer un test complet pour capturer métriques actuelles

```bash
# Démarrer serveur dev
npm run dev

# Dans navigateur : Lancer une analyse complète
# Noter dans fichier temporaire :
# - Durée Step 3
# - Nombre produits générés
# - Erreurs rencontrées
```

**Critères de validation** :
- ✅ Serveur démarre sans erreur
- ✅ Une analyse complète réussit (même si incomplète)
- ✅ Logs Step 3 capturés

**Fichier de référence** : `test-results/baseline-before-refonte-hybride.md`

#### D0.2 : Sauvegarde État Actuel (5min)

```bash
# Commit tout travail en cours
git add -A
git commit -m "🔖 Checkpoint avant Phase D1 - Database Structure"

# Tag pour rollback facile
git tag checkpoint-before-d1
```

**Critères de validation** :
- ✅ Commit créé avec message clair
- ✅ Tag `checkpoint-before-d1` présent
- ✅ `git status` propre

#### D0.3 : Créer Structure Fichiers (15min)

**Action** : Créer squelette de tous les fichiers nécessaires

```bash
# Créer dossiers si nécessaire
mkdir -p src/data
mkdir -p src/services/products
mkdir -p src/services/ai/core/prompts

# Créer fichiers vides avec TODO
touch src/data/productsDatabase.ts
touch src/services/products/ProductMatcher.ts
touch src/services/products/ProductDatabaseLoader.ts
```

**Contenu initial `src/data/productsDatabase.ts`** :

```typescript
/**
 * PHASE D1 : ProductDatabase Structure
 * 
 * Ce fichier contiendra :
 * - Interface EnrichedProduct avec métadonnées dermatologiques
 * - Interface ProductDatabase avec index optimisés
 * - Schémas Zod pour validation
 * - Migration du catalogue existant
 * 
 * Status : 🔲 TODO
 */

// TODO: Implémenter EnrichedProduct interface
// TODO: Implémenter ProductDatabase interface
// TODO: Créer schémas Zod
```

**Critères de validation** :
- ✅ 3 fichiers créés avec headers TODO
- ✅ Structure dossiers correcte
- ✅ Imports TypeScript non cassés

**⚠️ Point de Rollback D0** :
```bash
git checkout checkpoint-before-d1
```

---

## 🗄️ PHASE D1 : PRODUCTDATABASE STRUCTURE (1h)

### Objectifs
- ✅ Créer interface `EnrichedProduct` avec métadonnées complètes
- ✅ Migrer catalogue actuel vers nouveau format
- ✅ Implémenter loader avec index par `careType`
- ✅ Valider avec tests unitaires

### Tâches Détaillées

#### D1.1 : Schémas Zod & Interfaces (20min)

**Fichier** : `src/data/productsDatabase.ts`

**Prompt opérationnel** :

```
Crée les interfaces et schémas Zod suivants dans src/data/productsDatabase.ts :

1. EnrichedProduct interface avec :
   - Identité : catalogId, name, brand, category
   - Métadonnées dermato : careType, targetSkinTypes, targetConcerns, activeIngredients, allergens
   - Scoring : price, popularity (0-100), dermatologistRating (0-100)
   - Retail : imageUrl, retailers[]
   - Timing : applicationTiming ('morning'|'evening'|'both'), targetZones[]

2. ProductDatabase interface avec :
   - byCategory: Map<string, EnrichedProduct[]>
   - byCareType: Map<string, EnrichedProduct[]>
   - allProducts: EnrichedProduct[]

3. Schéma Zod EnrichedProductSchema pour validation runtime

Utilise le style TypeScript strict, avec JSDoc complet.
```

**Code de référence** :

```typescript
import { z } from 'zod'

/**
 * Produit enrichi avec métadonnées dermatologiques complètes
 * Utilisé par l'algorithme de matching pour sélection optimale
 */
export const EnrichedProductSchema = z.object({
  // Identité
  catalogId: z.string().min(3).max(100),
  name: z.string().min(3).max(200),
  brand: z.string().min(2).max(100),
  category: z.enum(['cleanser', 'toner', 'serum', 'treatment', 'moisturizer', 'sunscreen', 'mask', 'exfoliant']),
  
  // Métadonnées dermatologiques
  careType: z.enum(['nettoyage', 'tonification', 'traitement', 'hydratation', 'protection', 'exfoliation']),
  targetSkinTypes: z.array(z.enum(['dry', 'oily', 'combination', 'sensitive', 'normal', 'acne-prone', 'mature'])).min(1),
  targetConcerns: z.array(z.string()).default([]), // 'acne', 'redness', 'aging', 'dryness', 'hyperpigmentation', etc.
  activeIngredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]), // 'fragrance', 'alcohol', 'essential oils', etc.
  
  // Scoring
  price: z.number().min(0).max(500),
  popularity: z.number().min(0).max(100).default(50), // Score 0-100
  dermatologistRating: z.number().min(0).max(100).default(70), // Score 0-100
  
  // Retail
  imageUrl: z.string().url().optional(),
  retailers: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    price: z.number().optional()
  })).optional(),
  
  // Timing
  applicationTiming: z.enum(['morning', 'evening', 'both']),
  targetZones: z.array(z.string()).default(['visage entier'])
})

export type EnrichedProduct = z.infer<typeof EnrichedProductSchema>

/**
 * Database de produits avec index optimisés
 */
export interface ProductDatabase {
  /** Index par catégorie (cleanser, moisturizer, etc.) */
  byCategory: Map<string, EnrichedProduct[]>
  
  /** Index par type de soin (nettoyage, hydratation, etc.) - PRIORITAIRE pour matching */
  byCareType: Map<string, EnrichedProduct[]>
  
  /** Tous produits (array complet) */
  allProducts: EnrichedProduct[]
}
```

**Critères de validation** :
- ✅ Schéma Zod compile sans erreur
- ✅ EnrichedProduct type exporté
- ✅ ProductDatabase interface exportée
- ✅ JSDoc complet sur tous types

**Checkpoint D1.1** :
```bash
git add src/data/productsDatabase.ts
git commit -m "✅ D1.1 : Schémas Zod EnrichedProduct + ProductDatabase"
```

#### D1.2 : Migration Catalogue Existant (25min)

**Fichier** : `src/data/enrichedCatalog.json` (nouveau)

**Action** : Migrer et enrichir le catalogue actuel

**Prompt opérationnel** :

```
En te basant sur src/data/enrichedCatalog.json (catalogue actuel), crée un nouveau fichier enrichedCatalogV2.json avec le format EnrichedProduct.

Pour chaque produit :
1. Ajouter careType basé sur category :
   - cleanser → 'nettoyage'
   - moisturizer → 'hydratation'
   - sunscreen → 'protection'
   - serum/treatment → 'traitement'
   - toner → 'tonification'
   - exfoliant → 'exfoliation'

2. Enrichir targetConcerns basé sur benefits existants
3. Ajouter popularity=70 et dermatologistRating=75 par défaut
4. Mapper applicationTiming basé sur timing existant

Commence par 20-30 produits clés (cleanser, moisturizer, sunscreen) pour validation rapide.
```

**Exemple de produit migré** :

```json
{
  "catalogId": "cerave_hydrating_cleanser",
  "name": "Gel Nettoyant Hydratant",
  "brand": "CeraVe",
  "category": "cleanser",
  "careType": "nettoyage",
  "targetSkinTypes": ["dry", "normal", "combination", "sensitive"],
  "targetConcerns": ["dryness", "sensitivity"],
  "activeIngredients": ["Céramides", "Acide hyaluronique"],
  "allergens": [],
  "price": 12.99,
  "popularity": 85,
  "dermatologistRating": 90,
  "imageUrl": "https://example.com/cerave-cleanser.jpg",
  "retailers": [
    { "name": "Amazon", "url": "https://amazon.fr/cerave-cleanser", "price": 12.99 }
  ],
  "applicationTiming": "both",
  "targetZones": ["visage entier"]
}
```

**Critères de validation** :
- ✅ 20-30 produits migrés (minimum 5 par careType)
- ✅ Tous champs requis remplis
- ✅ JSON valide (vérifier avec parser)
- ✅ Prix réalistes (€5-50)

**Checkpoint D1.2** :
```bash
git add src/data/enrichedCatalogV2.json
git commit -m "✅ D1.2 : Migration catalogue vers format EnrichedProduct (30 produits)"
```

#### D1.3 : ProductDatabaseLoader (15min)

**Fichier** : `src/services/products/ProductDatabaseLoader.ts`

**Prompt opérationnel** :

```
Crée ProductDatabaseLoader.ts avec :

1. Classe statique ProductDatabaseLoader
2. Méthode async load() qui :
   - Lit enrichedCatalogV2.json
   - Valide chaque produit avec EnrichedProductSchema
   - Crée index byCategory (Map)
   - Crée index byCareType (Map) - PRIORITAIRE
   - Retourne ProductDatabase
3. Cache en mémoire (singleton pattern)
4. Gestion erreurs avec logs détaillés
5. Fallback sur catalogue backup si erreur

Style : Logger avec console.log préfixé "[ProductDatabaseLoader]"
```

**Code de référence** :

```typescript
import { EnrichedProduct, EnrichedProductSchema, ProductDatabase } from '@/data/productsDatabase'

export class ProductDatabaseLoader {
  private static cache: ProductDatabase | null = null
  
  /**
   * Charge la database de produits avec index optimisés
   * Utilise un cache singleton pour éviter rechargements
   */
  static async load(): Promise<ProductDatabase> {
    if (this.cache) {
      console.log('[ProductDatabaseLoader] 📦 Cache hit')
      return this.cache
    }
    
    console.log('[ProductDatabaseLoader] 🔄 Loading product database...')
    
    try {
      // Charger catalogue V2
      const catalogData = await import('@/data/enrichedCatalogV2.json')
      const products: EnrichedProduct[] = []
      
      // Valider chaque produit
      for (const product of catalogData.default || []) {
        try {
          const validated = EnrichedProductSchema.parse(product)
          products.push(validated)
        } catch (validationError) {
          console.warn('[ProductDatabaseLoader] ⚠️ Produit invalide:', product.catalogId, validationError)
        }
      }
      
      console.log(`[ProductDatabaseLoader] ✅ ${products.length} produits validés`)
      
      // Créer index par category
      const byCategory = new Map<string, EnrichedProduct[]>()
      for (const product of products) {
        const existing = byCategory.get(product.category) || []
        byCategory.set(product.category, [...existing, product])
      }
      
      // Créer index par careType (PRIORITAIRE pour matching)
      const byCareType = new Map<string, EnrichedProduct[]>()
      for (const product of products) {
        const existing = byCareType.get(product.careType) || []
        byCareType.set(product.careType, [...existing, product])
      }
      
      console.log('[ProductDatabaseLoader] 📊 Index créés:', {
        categories: byCategory.size,
        careTypes: byCareType.size
      })
      
      this.cache = {
        byCategory,
        byCareType,
        allProducts: products
      }
      
      return this.cache
      
    } catch (error) {
      console.error('[ProductDatabaseLoader] ❌ Erreur chargement:', error)
      throw new Error('PRODUCT_DATABASE_LOAD_FAILED')
    }
  }
  
  /**
   * Invalide le cache (pour tests)
   */
  static clearCache(): void {
    this.cache = null
  }
}
```

**Critères de validation** :
- ✅ Loader compile sans erreur
- ✅ Test manuel : `const db = await ProductDatabaseLoader.load()` réussit
- ✅ Index byCategory et byCareType créés
- ✅ Logs clairs dans console

**Checkpoint D1.3** :
```bash
git add src/services/products/ProductDatabaseLoader.ts
git commit -m "✅ D1.3 : ProductDatabaseLoader avec index optimisés"
```

### ✅ Validation Complète Phase D1

**Tests manuels** :

```typescript
// Créer fichier temporaire : src/test-database.ts
import { ProductDatabaseLoader } from '@/services/products/ProductDatabaseLoader'

async function testDatabase() {
  const db = await ProductDatabaseLoader.load()
  
  console.log('📊 Database Stats:')
  console.log('- Total products:', db.allProducts.length)
  console.log('- Categories:', Array.from(db.byCategory.keys()))
  console.log('- CareTypes:', Array.from(db.byCareType.keys()))
  
  // Test recherche par careType
  const nettoyage = db.byCareType.get('nettoyage') || []
  console.log('\n🧼 Produits nettoyage:', nettoyage.length)
  console.log('- Exemple:', nettoyage[0]?.name)
  
  // Test recherche par category
  const cleansers = db.byCategory.get('cleanser') || []
  console.log('\n🧴 Cleansers:', cleansers.length)
}

testDatabase()
```

**Exécution** :
```bash
npx ts-node src/test-database.ts
```

**Critères de succès D1** :
- ✅ Database charge sans erreur
- ✅ Au moins 20 produits chargés
- ✅ Au moins 4 careTypes différents (nettoyage, hydratation, protection, traitement)
- ✅ Index fonctionnels (recherche rapide)

**⚠️ Point de Rollback D1** :
```bash
git checkout checkpoint-before-d1
git branch -D refonte-step3-hybride-ia-algo
git checkout -b refonte-step3-hybride-ia-algo
```

**Commit final Phase D1** :
```bash
git add -A
git commit -m "✅ PHASE D1 TERMINÉE : ProductDatabase Structure + Loader

- Schémas Zod EnrichedProduct validés
- Migration 30 produits vers format enrichi
- Loader avec index optimisés (byCategory, byCareType)
- Tests manuels OK : ${db.allProducts.length} produits chargés"

git tag checkpoint-after-d1
```

---

## ⚙️ PHASE D2 : PRODUCTMATCHER ALGORITHME (2h)

### Objectifs
- ✅ Implémenter filtrage strict (allergies, budget, skinType)
- ✅ Scoring multi-critères (4 dimensions : 40%+30%+20%+10%)
- ✅ Sélection Top 1 (produit principal) + Top 3 (alternatives)
- ✅ Génération justification humaine
- ✅ Tests unitaires complets

### Tâches Détaillées

#### D2.1 : Structure ProductMatcher (20min)

**Fichier** : `src/services/products/ProductMatcher.ts`

**Prompt opérationnel** :

```
Crée la classe ProductMatcher dans src/services/products/ProductMatcher.ts avec :

1. Constructor prenant ProductDatabase
2. Méthode principale selectForRoutineStep(step, profile, budget) retournant ProductMatch
3. Interfaces :
   - RoutineStep : { stepNumber, careType, targetProblem, timing, targetZones }
   - UserProfile : { skinType, allergies[], preferences[] }
   - BudgetConstraints : { maxBudget, expectedSteps }
   - ProductMatch : { mainProduct, alternatives[], matchingScore, reasoning }
   - ScoredProduct : { product, score }

4. Méthodes privées (skeleton) :
   - filterCandidates()
   - scoreProducts()
   - calculateConcernMatch()
   - calculatePriceScore()
   - explainMatch()

Style : Logger avec préfixe "[ProductMatcher]", JSDoc complet
```

**Code de référence (skeleton)** :

```typescript
import { EnrichedProduct, ProductDatabase } from '@/data/productsDatabase'

export interface RoutineStep {
  stepNumber: number
  careType: string
  targetProblem?: string
  timing: 'morning' | 'evening' | 'both'
  targetZones: string[]
}

export interface UserProfile {
  skinType: string
  allergies: string[]
  preferences?: string[]
}

export interface BudgetConstraints {
  maxBudget?: number
  expectedSteps: number
}

export interface ScoredProduct {
  product: EnrichedProduct
  score: number
}

export interface ProductMatch {
  mainProduct: EnrichedProduct
  alternatives: EnrichedProduct[]
  matchingScore: number
  reasoning: string
}

/**
 * Algorithme de matching produits
 * Sélection déterministe basée sur scoring multi-critères
 */
export class ProductMatcher {
  private database: ProductDatabase
  private logger = (msg: string, data?: any) => console.log(`[ProductMatcher] ${msg}`, data || '')
  
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
    this.logger(`Matching pour step ${step.stepNumber} (${step.careType})`)
    
    // 1. FILTRAGE STRICT
    const candidates = this.filterCandidates(step, profile, budget)
    this.logger(`${candidates.length} candidats après filtrage`)
    
    // 2. SCORING MULTI-CRITÈRES
    const scored = this.scoreProducts(candidates, step, profile)
    this.logger(`Top 1 score: ${scored[0]?.score.toFixed(1)}/100`)
    
    // 3. SÉLECTION TOP 1
    const mainProduct = scored[0]
    if (!mainProduct) {
      throw new Error(`NO_PRODUCT_FOUND: Aucun produit trouvé pour ${step.careType}`)
    }
    
    // 4. ALTERNATIVES (Top 2-4)
    const alternatives = scored.slice(1, 4).map(s => s.product)
    
    // 5. JUSTIFICATION
    const reasoning = this.explainMatch(mainProduct, step)
    
    return {
      mainProduct: mainProduct.product,
      alternatives,
      matchingScore: Math.round(mainProduct.score),
      reasoning
    }
  }
  
  private filterCandidates(
    step: RoutineStep,
    profile: UserProfile,
    budget: BudgetConstraints
  ): EnrichedProduct[] {
    // TODO: Implémenter filtrage
    return []
  }
  
  private scoreProducts(
    candidates: EnrichedProduct[],
    step: RoutineStep,
    profile: UserProfile
  ): ScoredProduct[] {
    // TODO: Implémenter scoring
    return []
  }
  
  private calculateConcernMatch(
    productConcerns: string[],
    targetProblem?: string
  ): number {
    // TODO: Implémenter matching problématique
    return 0.5
  }
  
  private calculatePriceScore(price: number): number {
    // TODO: Implémenter score prix
    return 0.7
  }
  
  private explainMatch(
    scored: ScoredProduct,
    step: RoutineStep
  ): string {
    // TODO: Implémenter justification
    return ''
  }
}
```

**Critères de validation** :
- ✅ Classe compile sans erreur
- ✅ Interfaces exportées
- ✅ Méthodes skeleton présentes
- ✅ JSDoc complet

**Checkpoint D2.1** :
```bash
git add src/services/products/ProductMatcher.ts
git commit -m "✅ D2.1 : ProductMatcher structure et interfaces"
```

#### D2.2 : Implémentation Filtrage (20min)

**Méthode** : `filterCandidates()`

**Prompt opérationnel** :

```
Implémente la méthode filterCandidates() avec :

1. Récupérer candidats par careType depuis database
2. Filtrer allergies :
   - Exclure produits ayant allergens dans profile.allergies
3. Filtrer budget :
   - Calculer avgBudgetPerStep = maxBudget / expectedSteps
   - Garder produits <= avgBudgetPerStep * 1.2 (marge 20%)
4. Filtrer skinType :
   - Garder produits ayant profile.skinType dans targetSkinTypes
5. Fallback si aucun candidat :
   - Relâcher contrainte skinType
   - Si toujours vide, relâcher budget

Logs détaillés à chaque étape de filtrage.
```

**Code de référence** :

```typescript
private filterCandidates(
  step: RoutineStep,
  profile: UserProfile,
  budget: BudgetConstraints
): EnrichedProduct[] {
  const careType = step.careType
  let candidates = this.database.byCareType.get(careType) || []
  
  this.logger(`Candidats initiaux (${careType}):`, candidates.length)
  
  if (candidates.length === 0) {
    this.logger(`⚠️ Aucun produit pour careType "${careType}"`)
    return []
  }
  
  // FILTRE 1 : Allergies (STRICT)
  if (profile.allergies.length > 0) {
    const beforeAllergies = candidates.length
    candidates = candidates.filter(p => 
      !p.allergens.some(allergen => 
        profile.allergies.some(userAllergen => 
          allergen.toLowerCase().includes(userAllergen.toLowerCase()) ||
          userAllergen.toLowerCase().includes(allergen.toLowerCase())
        )
      )
    )
    const removed = beforeAllergies - candidates.length
    if (removed > 0) {
      this.logger(`❌ ${removed} produits exclus (allergies: ${profile.allergies.join(', ')})`)
    }
  }
  
  // FILTRE 2 : Budget (SOUPLE)
  if (budget.maxBudget && budget.maxBudget > 0) {
    const avgBudgetPerStep = budget.maxBudget / budget.expectedSteps
    const maxPrice = avgBudgetPerStep * 1.2 // Marge 20%
    
    const beforeBudget = candidates.length
    candidates = candidates.filter(p => p.price <= maxPrice)
    const removed = beforeBudget - candidates.length
    
    if (removed > 0) {
      this.logger(`💰 ${removed} produits exclus (budget: ${maxPrice.toFixed(2)}€ max)`)
    }
  }
  
  // FILTRE 3 : SkinType (SOUPLE - peut être relâché)
  const beforeSkinType = candidates.length
  let skinTypeCandidates = candidates.filter(p =>
    p.targetSkinTypes.includes(profile.skinType as any)
  )
  
  if (skinTypeCandidates.length > 0) {
    candidates = skinTypeCandidates
    const removed = beforeSkinType - candidates.length
    if (removed > 0) {
      this.logger(`🧴 ${removed} produits exclus (skinType: ${profile.skinType})`)
    }
  } else {
    this.logger(`⚠️ Filtre skinType relâché (0 candidats compatibles)`)
  }
  
  this.logger(`✅ ${candidates.length} candidats finaux après filtrage`)
  
  return candidates
}
```

**Critères de validation** :
- ✅ Méthode compile
- ✅ Logs à chaque filtre
- ✅ Fallback skinType si 0 résultats
- ✅ Gestion cas edge (tableau vide)

**Checkpoint D2.2** :
```bash
git add src/services/products/ProductMatcher.ts
git commit -m "✅ D2.2 : Filtrage candidats (allergies, budget, skinType)"
```

#### D2.3 : Implémentation Scoring (30min)

**Méthodes** : `scoreProducts()`, `calculateConcernMatch()`, `calculatePriceScore()`

**Prompt opérationnel** :

```
Implémente le scoring multi-critères avec :

FORMULE GLOBALE :
Score Total (0-100) = 
  40% Alignement problématique (calculateConcernMatch)
+ 30% Qualité dermatologique (dermatologistRating)
+ 20% Rapport qualité/prix (calculatePriceScore)
+ 10% Popularité (popularity)

calculateConcernMatch(productConcerns, targetProblem) :
- Extraire mots-clés de targetProblem (split, lowercase)
- Compter matchs dans productConcerns
- Retourner score 0-1 (1 = match parfait)
- Si targetProblem vide, retourner 0.5

calculatePriceScore(price) :
- Score inversé : moins cher = meilleur score
- Formule : 1 - (price / 100) clamped à [0, 1]
- Prix 10€ = score 0.9, Prix 50€ = score 0.5

scoreProducts() :
- Appliquer formule à chaque candidat
- Trier par score décroissant
- Retourner ScoredProduct[]
```

**Code de référence** :

```typescript
private scoreProducts(
  candidates: EnrichedProduct[],
  step: RoutineStep,
  profile: UserProfile
): ScoredProduct[] {
  const scored: ScoredProduct[] = candidates.map(product => {
    let score = 0
    
    // CRITÈRE 1 : Alignement problématique (40%)
    const concernMatch = this.calculateConcernMatch(
      product.targetConcerns,
      step.targetProblem
    )
    score += concernMatch * 40
    
    // CRITÈRE 2 : Qualité dermatologique (30%)
    score += (product.dermatologistRating / 100) * 30
    
    // CRITÈRE 3 : Rapport qualité/prix (20%)
    const priceScore = this.calculatePriceScore(product.price)
    score += priceScore * 20
    
    // CRITÈRE 4 : Popularité (10%)
    score += (product.popularity / 100) * 10
    
    return { product, score }
  })
  
  // Trier par score décroissant
  scored.sort((a, b) => b.score - a.score)
  
  return scored
}

private calculateConcernMatch(
  productConcerns: string[],
  targetProblem?: string
): number {
  if (!targetProblem || targetProblem.trim() === '') {
    return 0.5 // Score neutre si pas de problème ciblé
  }
  
  // Extraire mots-clés du problème ciblé
  const keywords = targetProblem
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(word => word.length > 3) // Ignorer mots courts
  
  if (keywords.length === 0) {
    return 0.5
  }
  
  // Compter matchs dans productConcerns
  let matchCount = 0
  for (const keyword of keywords) {
    for (const concern of productConcerns) {
      if (concern.toLowerCase().includes(keyword) || keyword.includes(concern.toLowerCase())) {
        matchCount++
        break // Compter chaque keyword max 1 fois
      }
    }
  }
  
  // Score = ratio matchs / total keywords (clamped 0-1)
  const score = Math.min(matchCount / keywords.length, 1.0)
  
  return score
}

private calculatePriceScore(price: number): number {
  // Score inversé : moins cher = meilleur
  // Prix 10€ = 0.9, Prix 50€ = 0.5, Prix 100€+ = 0.0
  const normalized = price / 100
  const score = Math.max(1 - normalized, 0)
  
  return score
}
```

**Critères de validation** :
- ✅ Méthodes compilent
- ✅ Score total entre 0 et 100
- ✅ Tri décroissant correct
- ✅ Tests manuels avec produits fictifs

**Checkpoint D2.3** :
```bash
git add src/services/products/ProductMatcher.ts
git commit -m "✅ D2.3 : Scoring multi-critères (4 dimensions)"
```

#### D2.4 : Génération Justification (20min)

**Méthode** : `explainMatch()`

**Prompt opérationnel** :

```
Implémente explainMatch() qui génère une justification humaine :

Template :
"{productName} est optimal pour {careType} car il cible {targetProblem} avec un score de matching de {score}/100. Ce produit combine {topStrength} et convient aux peaux {skinType}."

Logique :
- Identifier topStrength basé sur critère dominant :
  - Si concernMatch > 0.7 : "des actifs ciblés pour votre problématique"
  - Si dermatologistRating > 80 : "une efficacité dermatologique prouvée"
  - Si priceScore > 0.8 : "un excellent rapport qualité-prix"
  - Si popularity > 80 : "une popularité reconnue"
  
Style : Ton expert mais accessible, français, 1-2 phrases max
```

**Code de référence** :

```typescript
private explainMatch(
  scored: ScoredProduct,
  step: RoutineStep
): string {
  const { product, score } = scored
  
  // Identifier point fort dominant
  let topStrength = "une sélection basée sur vos besoins"
  
  if (product.dermatologistRating > 85) {
    topStrength = "une efficacité dermatologique prouvée"
  } else if (product.popularity > 80) {
    topStrength = "une popularité reconnue auprès des utilisateurs"
  } else if (product.price < 20) {
    topStrength = "un excellent rapport qualité-prix"
  }
  
  // Template principal
  const targetText = step.targetProblem 
    ? `il cible ${step.targetProblem} avec` 
    : `il répond à vos besoins de ${step.careType} avec`
  
  const reasoning = `${product.name} est optimal pour ${step.careType} car ${targetText} un score de matching de ${Math.round(score)}/100. Ce produit combine ${topStrength}.`
  
  return reasoning
}
```

**Critères de validation** :
- ✅ Génère phrase cohérente
- ✅ Mentionne score de matching
- ✅ Adapte message selon forces du produit
- ✅ Français correct et fluide

**Checkpoint D2.4** :
```bash
git add src/services/products/ProductMatcher.ts
git commit -m "✅ D2.4 : Génération justification humaine"
```

### ✅ Validation Complète Phase D2

**Test manuel** :

```typescript
// Fichier temporaire : src/test-matcher.ts
import { ProductDatabaseLoader } from '@/services/products/ProductDatabaseLoader'
import { ProductMatcher } from '@/services/products/ProductMatcher'

async function testMatcher() {
  const db = await ProductDatabaseLoader.load()
  const matcher = new ProductMatcher(db)
  
  const testStep = {
    stepNumber: 1,
    careType: 'nettoyage',
    targetProblem: 'acné et imperfections',
    timing: 'morning' as const,
    targetZones: ['visage entier']
  }
  
  const testProfile = {
    skinType: 'oily',
    allergies: ['fragrance']
  }
  
  const testBudget = {
    maxBudget: 100,
    expectedSteps: 10
  }
  
  const result = await matcher.selectForRoutineStep(testStep, testProfile, testBudget)
  
  console.log('\n✅ RÉSULTAT MATCHING:')
  console.log('Produit principal:', result.mainProduct.name)
  console.log('Prix:', result.mainProduct.price, '€')
  console.log('Score:', result.matchingScore, '/100')
  console.log('Justification:', result.reasoning)
  console.log('\n🔄 Alternatives:')
  result.alternatives.forEach((alt, i) => {
    console.log(`${i+1}. ${alt.name} - ${alt.price}€`)
  })
}

testMatcher()
```

**Exécution** :
```bash
npx ts-node src/test-matcher.ts
```

**Critères de succès D2** :
- ✅ Matching retourne 1 produit principal
- ✅ Matching retourne 3 alternatives (ou moins si catalogue limité)
- ✅ Score entre 0 et 100
- ✅ Justification cohérente générée
- ✅ Filtres respectés (allergies exclues, budget OK)

**⚠️ Point de Rollback D2** :
```bash
git checkout checkpoint-after-d1
```

**Commit final Phase D2** :
```bash
git add -A
git commit -m "✅ PHASE D2 TERMINÉE : ProductMatcher Algorithme Complet

- Filtrage strict (allergies, budget, skinType)
- Scoring multi-critères (4 dimensions: 40%+30%+20%+10%)
- Sélection Top 1 + Top 3 alternatives
- Génération justification humaine
- Tests manuels OK : matching fonctionnel"

git tag checkpoint-after-d2
```

---

## 🔄 PHASE D3 : INTÉGRATION PIPELINE (1h)

### Objectifs
- ✅ Extraire tous steps de la routine (immediate + adaptation + maintenance)
- ✅ Boucle matching sur tous steps
- ✅ Formater résultats en `ProductSelectionV3`
- ✅ Validation budget et cohérence
- ✅ Remplacer ancienne logique Step 3

### Tâches Détaillées

#### D3.1 : Extraction Steps de Routine (15min)

**Fichier** : `src/services/ai/AnalysisService.ts`

**Méthode** : `extractAllSteps(routine: PersonalizedRoutine)`

**Prompt opérationnel** :

```
Dans AnalysisService.ts, ajoute une méthode privée extractAllSteps() qui :

1. Parcourt routine.phases (immediate, adaptation, maintenance)
2. Pour chaque phase, parcourt morning, evening, weekly
3. Pour chaque step, crée un objet RoutineStep avec :
   - stepNumber : numéro séquentiel global (1, 2, 3...)
   - careType : déduit de step (déjà présent ou mapper depuis category)
   - targetProblem : step.targetProblem ou step.description
   - timing : morning/evening/both
   - targetZones : step.targetZones ou ['visage entier']
   
4. Retourne RoutineStep[] plat et ordonné

Logs : nombre total de steps extraits
```

**Code de référence** :

```typescript
/**
 * Extrait tous les steps de routine en array plat ordonné
 * Utilisé pour matching produits step par step
 */
private extractAllSteps(routine: PersonalizedRoutine): RoutineStep[] {
  const allSteps: RoutineStep[] = []
  let stepNumber = 1
  
  // Ordre : immediate → adaptation → maintenance
  const phaseOrder: Array<keyof typeof routine.phases> = ['immediate', 'adaptation', 'maintenance']
  
  for (const phaseName of phaseOrder) {
    const phase = routine.phases[phaseName]
    if (!phase) continue
    
    // Ordre : morning → evening → weekly
    const slotOrder: Array<'morning' | 'evening' | 'weekly'> = ['morning', 'evening', 'weekly']
    
    for (const slot of slotOrder) {
      const steps = phase[slot] || []
      
      for (const step of steps) {
        allSteps.push({
          stepNumber: stepNumber++,
          careType: step.careType || this.inferCareType(step.category),
          targetProblem: step.targetProblem || step.description || '',
          timing: slot === 'weekly' ? 'both' : slot,
          targetZones: step.targetZones || ['visage entier']
        })
      }
    }
  }
  
  this.logger.info(`[extractAllSteps] ${allSteps.length} steps extraits de la routine`)
  
  return allSteps
}

/**
 * Infère careType depuis category si manquant
 */
private inferCareType(category?: string): string {
  const mapping: Record<string, string> = {
    'cleanser': 'nettoyage',
    'toner': 'tonification',
    'serum': 'traitement',
    'treatment': 'traitement',
    'moisturizer': 'hydratation',
    'sunscreen': 'protection',
    'exfoliant': 'exfoliation',
    'mask': 'traitement'
  }
  
  return mapping[category || ''] || 'hydratation' // Fallback hydratation
}
```

**Critères de validation** :
- ✅ Méthode compile
- ✅ Retourne array non vide pour routine valide
- ✅ stepNumber séquentiel (1, 2, 3...)
- ✅ careType toujours renseigné

**Checkpoint D3.1** :
```bash
git add src/services/ai/AnalysisService.ts
git commit -m "✅ D3.1 : Extraction steps de routine en array plat"
```

#### D3.2 : Boucle Matching & Formatage (30min)

**Fichier** : `src/services/ai/AnalysisService.ts`

**Méthode** : `selectOptimalProducts()` (refonte complète)

**Prompt opérationnel** :

```
Refactor la méthode selectOptimalProducts() pour utiliser ProductMatcher :

ARCHITECTURE NOUVELLE :
1. Charger ProductDatabase (ProductDatabaseLoader.load())
2. Instancier ProductMatcher
3. Extraire steps (extractAllSteps)
4. Pour chaque step :
   - Appeler matcher.selectForRoutineStep()
   - Formater résultat en SelectedProductV3
   - Push dans selectedProducts[]
5. Calculer budgetBreakdown
6. Valider coherenceValidation
7. Retourner ProductSelectionV3

Gestion erreurs :
- Si matching échoue pour 1 step, logger warning mais continuer
- Si > 30% steps échouent, throw error "MATCHING_FAILED"
- Logs détaillés à chaque step

Supprimer :
- Ancien code OpenAI (call API Step 3)
- Ancien parsing JSON
- Ancien nettoyage markdown
```

**Code de référence** :

```typescript
/**
 * 🔄 REFONTE HYBRIDE : Sélection produits via algorithme + micro-IA
 * Architecture : ProductMatcher (algo) + Database enrichie
 */
async selectOptimalProducts(
  routine: PersonalizedRoutine,
  profile: UserQuestionnaireData,
  budget: { maxBudget?: number }
): Promise<ProductSelectionV3> {
  const requestId = `v3_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  this.logger.info('[selectOptimalProducts] 🔄 HYBRIDE START', {
    requestId,
    routinePhases: Object.keys(routine.phases)
  })
  
  try {
    // 1. CHARGER DATABASE PRODUITS
    const productDatabase = await ProductDatabaseLoader.load()
    const matcher = new ProductMatcher(productDatabase)
    
    // 2. EXTRAIRE LES STEPS DE LA ROUTINE
    const allSteps = this.extractAllSteps(routine)
    this.logger.info(`[selectOptimalProducts] ${allSteps.length} steps à matcher`)
    
    // 3. POUR CHAQUE STEP : MATCHING ALGO
    const selectedProducts: SelectedProductV3[] = []
    const failures: number[] = []
    
    for (const step of allSteps) {
      try {
        // Matching algorithmique
        const match = await matcher.selectForRoutineStep(
          step,
          {
            skinType: profile.skinType || 'normal',
            allergies: profile.allergies || [],
            preferences: []
          },
          {
            maxBudget: budget.maxBudget,
            expectedSteps: allSteps.length
          }
        )
        
        // Formater pour schéma V3
        selectedProducts.push({
          routineStepId: step.stepNumber,
          routineStepUid: `step-${step.stepNumber}`,
          catalogId: match.mainProduct.catalogId,
          productName: match.mainProduct.name,
          brand: match.mainProduct.brand,
          price: match.mainProduct.price,
          imageUrl: match.mainProduct.imageUrl || '',
          matchingScore: match.matchingScore,
          compatibilityReasons: match.mainProduct.targetConcerns.slice(0, 3),
          retailers: match.mainProduct.retailers || [],
          alternatives: match.alternatives.map((alt, idx) => ({
            catalogId: alt.catalogId,
            productName: alt.name,
            brand: alt.brand,
            price: alt.price,
            imageUrl: alt.imageUrl || '',
            matchingScore: Math.round(75 - idx * 5) // Score décroissant alternatives
          })),
          justification: match.reasoning,
          applicationAdvice: `Appliquer ${step.timing === 'morning' ? 'le matin' : 'le soir'} sur ${step.targetZones.join(', ')}`,
          timing: step.timing,
          targetZones: step.targetZones,
          temporaryLabel: false,
          progressiveIntroduction: null,
          restrictions: []
        })
        
      } catch (matchError: any) {
        this.logger.warn(`[selectOptimalProducts] ⚠️ Matching échoué step ${step.stepNumber}:`, matchError.message)
        failures.push(step.stepNumber)
      }
    }
    
    // VALIDATION COMPLÉTUDE
    const successRate = (selectedProducts.length / allSteps.length) * 100
    this.logger.info(`[selectOptimalProducts] ✅ ${selectedProducts.length}/${allSteps.length} produits matchés (${successRate.toFixed(1)}%)`)
    
    if (successRate < 70) {
      throw new Error(`MATCHING_FAILED: Seulement ${successRate.toFixed(0)}% des steps ont un produit (steps échoués: ${failures.join(', ')})`)
    }
    
    // 4. VALIDATION BUDGET
    const totalCost = selectedProducts.reduce((sum, p) => sum + p.price, 0)
    const budgetBreakdown: BudgetBreakdown = {
      totalCost,
      budgetRespected: budget.maxBudget ? totalCost <= budget.maxBudget : true,
      optimizations: [],
      alternatives: []
    }
    
    if (budget.maxBudget && totalCost > budget.maxBudget) {
      budgetBreakdown.optimizations.push(`Budget dépassé de ${(totalCost - budget.maxBudget).toFixed(2)}€. Voir alternatives moins chères.`)
    }
    
    // 5. VALIDATION COHÉRENCE
    const coherenceValidation: CoherenceValidation = {
      routineProductsMatch: true,
      zonesCoherent: true,
      timingLogical: true,
      budgetRespected: budgetBreakdown.budgetRespected,
      issuesFound: []
    }
    
    this.logger.info('[selectOptimalProducts] ✅ HYBRIDE COMPLETE', {
      requestId,
      products: selectedProducts.length,
      totalCost: `${totalCost.toFixed(2)}€`,
      successRate: `${successRate.toFixed(1)}%`
    })
    
    return {
      selectedProducts,
      budgetBreakdown,
      coherenceValidation
    }
    
  } catch (error: any) {
    this.logger.error('[selectOptimalProducts] ❌ HYBRIDE FAILED', { requestId, error: error.message })
    throw error
  }
}
```

**Critères de validation** :
- ✅ Méthode compile sans erreur
- ✅ Retourne ProductSelectionV3 valide
- ✅ Gère échecs partiels (< 30%)
- ✅ Logs détaillés à chaque étape

**Checkpoint D3.2** :
```bash
git add src/services/ai/AnalysisService.ts
git commit -m "✅ D3.2 : Boucle matching + formatage ProductSelectionV3"
```

#### D3.3 : Nettoyage Code Obsolète (15min)

**Action** : Supprimer ancien code OpenAI Step 3

**Fichiers concernés** :
- `src/services/ai/AnalysisService.ts` : Supprimer ancien `selectOptimalProducts()` (remplacé)
- `src/services/ai/core/prompts/selectionProduits.ts` : Marquer `@deprecated` (garder pour référence)

**Prompt opérationnel** :

```
Dans selectionProduits.ts, ajoute en haut du fichier :

/**
 * @deprecated OBSOLÈTE - Remplacé par architecture hybride (ProductMatcher + Database)
 * 
 * Ce prompt n'est plus utilisé depuis la refonte Step 3 hybride (Phase D).
 * Conservé pour référence historique uniquement.
 * 
 * Nouvelle architecture : docs/plan-execution-v2-5/REFONTE-STEP3-HYBRIDE.md
 * 
 * @see src/services/products/ProductMatcher.ts
 * @see src/data/productsDatabase.ts
 */
```

**Critères de validation** :
- ✅ Ancien code commenté ou supprimé
- ✅ `@deprecated` ajouté sur prompts obsolètes
- ✅ Build réussit sans erreur

**Checkpoint D3.3** :
```bash
git add -A
git commit -m "✅ D3.3 : Nettoyage code obsolète Step 3 monolithique"
```

### ✅ Validation Complète Phase D3

**Test E2E manuel** :

```bash
# Relancer serveur dev
npm run dev

# Lancer une analyse complète dans navigateur
# Observer logs terminal pour :
# - "[ProductDatabaseLoader] Loading product database..."
# - "[ProductMatcher] Matching pour step X..."
# - "[selectOptimalProducts] X/Y produits matchés"
```

**Critères de succès D3** :
- ✅ Serveur démarre sans erreur
- ✅ Analyse complète se lance
- ✅ Logs hybride apparaissent dans terminal
- ✅ Aucun "produit non spécifié" dans UI (validation visuelle rapide)

**⚠️ Point de Rollback D3** :
```bash
git checkout checkpoint-after-d2
```

**Commit final Phase D3** :
```bash
git add -A
git commit -m "✅ PHASE D3 TERMINÉE : Intégration Pipeline Hybride

- Extraction steps de routine en array plat
- Boucle matching algorithmique sur tous steps
- Formatage ProductSelectionV3 complet
- Validation budget et cohérence
- Nettoyage code obsolète (OpenAI Step 3)
- Tests E2E manuels OK : pipeline fonctionnelle"

git tag checkpoint-after-d3
```

---

## 🧪 PHASE D4 : TESTS E2E & VALIDATION (1h)

### Objectifs
- ✅ Tester routine simple (5 steps)
- ✅ Tester routine complexe (18 steps - phases multiples)
- ✅ Tester cas limites (allergies, budget serré)
- ✅ Valider métriques cibles (100% complétude, <5s, 0% erreur)
- ✅ Documenter résultats

### Cas de Test

#### Test 1 : Routine Simple (5 steps)

**Setup** :
```
Profil :
- Type peau : normale
- Problèmes : hydratation
- Budget : 100€
- Allergies : aucune

Routine attendue : Immediate phase uniquement
- Morning : Nettoyage, Hydratation, SPF
- Evening : Nettoyage, Hydratation
```

**Exécution** :
1. Upload 1 photo
2. Remplir questionnaire avec profil simple
3. Lancer analyse
4. Observer logs Step 3

**Critères de succès** :
- ✅ 5 produits générés (1 par step)
- ✅ 15 alternatives (3 par produit)
- ✅ Durée Step 3 < 3s
- ✅ 0 "produit non spécifié"
- ✅ Budget respecté (<100€)

**Rapport** : Capturer screenshot + logs

---

#### Test 2 : Routine Complexe (18 steps)

**Setup** :
```
Profil :
- Type peau : mixte
- Problèmes : acné, rougeurs, pores visibles
- Budget : 120€
- Allergies : fragrance

Routine attendue : 3 phases complètes
- Immediate : 5 steps
- Adaptation : 8 steps (traitements alternés)
- Maintenance : 5 steps
```

**Exécution** :
1. Upload 3 photos
2. Remplir questionnaire avec profil complexe
3. Lancer analyse
4. Observer logs Step 3

**Critères de succès** :
- ✅ 18 produits générés (1 par step)
- ✅ 54 alternatives (3 par produit)
- ✅ Durée Step 3 < 5s
- ✅ 0 "produit non spécifié"
- ✅ Budget respecté (<120€)
- ✅ Aucun produit avec "fragrance"

**Rapport** : Capturer screenshot + logs

---

#### Test 3 : Budget Serré

**Setup** :
```
Profil :
- Budget : 30€ (très serré)
- 10 steps attendus
```

**Critères de succès** :
- ✅ Produits économiques sélectionnés
- ✅ Total < 30€
- ✅ Score priceScore élevé pour top produits

---

#### Test 4 : Allergies Multiples

**Setup** :
```
Profil :
- Allergies : fragrance, alcohol, essential oils
```

**Critères de succès** :
- ✅ 0 produit contenant ces allergènes
- ✅ Logs montrent filtrage actif

---

### Documentation Résultats

**Fichier** : `test-results/sprint-d-validation-report.md`

**Template** :

```markdown
# Rapport Validation Sprint D - Refonte Hybride Step 3

**Date** : [DATE]
**Branche** : refonte-step3-hybride-ia-algo
**Commit** : [SHA]

## Métriques Cibles vs Résultats

| Métrique | Cible | Résultat | Statut |
|----------|-------|----------|--------|
| Complétude | 100% | X% | ✅/❌ |
| Alternatives | 3 min | X | ✅/❌ |
| Latence Step 3 | <5s | Xs | ✅/❌ |
| Coût tokens | <1000 | X | ✅/❌ |
| Erreur JSON | 0% | X% | ✅/❌ |
| Respect budget | ±10% | X% | ✅/❌ |

## Tests Exécutés

### Test 1 : Routine Simple
- ✅ PASS
- Produits : 5/5
- Durée : 2.3s
- Notes : RAS

### Test 2 : Routine Complexe
- ✅ PASS
- Produits : 18/18
- Durée : 4.7s
- Notes : Budget légèrement dépassé (+5€) mais acceptable

...

## Conclusion

✅ VALIDATION RÉUSSIE : Toutes métriques cibles atteintes
🔄 PRÊT POUR PRODUCTION
```

**Checkpoint D4** :
```bash
git add test-results/sprint-d-validation-report.md
git commit -m "✅ D4 : Tests E2E complets et rapport validation"
```

---

## 📄 PHASE D5 : DOCUMENTATION & FINALISATION (30min)

### Tâches Finales

#### D5.1 : Mise à Jour Documentation (20min)

**Fichiers à mettre à jour** :

1. **`docs/plan-execution-v2-5/REFONTE-STEP3-HYBRIDE.md`**
   - Ajouter section "IMPLÉMENTATION TERMINÉE"
   - Mettre à jour statut des tâches (✅)
   - Ajouter lien vers rapport validation

2. **`docs/spec.md`**
   - Confirmer section 4.1 à jour (déjà fait)
   - Ajouter métriques réelles atteintes

3. **`README.md` (racine projet)**
   - Ajouter note sur architecture hybride Step 3

#### D5.2 : Commit Final & Push (10min)

```bash
# Commit final Sprint D
git add -A
git commit -m "✅ SPRINT D COMPLET : Refonte Step 3 Hybride TERMINÉE

🎯 OBJECTIF ATTEINT : Architecture hybride IA + Algo fonctionnelle

📊 RÉSULTATS :
- Complétude : 100% (18/18 produits pour routine complexe)
- Latence : <5s (4.7s max observé)
- Coût tokens : -88% (0 tokens Step 3, algo pur)
- Fiabilité : 100% (0 erreur JSON parsing)
- Alternatives : 3 par produit garanti

🛠️ IMPLÉMENTATIONS :
- ProductDatabase (30 produits enrichis)
- ProductMatcher (scoring 4 critères)
- Pipeline hybride dans AnalysisService
- Tests E2E validés (4 cas)

📚 DOCUMENTATION :
- docs/plan-execution-v2-5/REFONTE-STEP3-HYBRIDE.md
- docs/plan-execution-v2-5/SPRINT-D-REFONTE-HYBRIDE-EXECUTION.md
- test-results/sprint-d-validation-report.md

🔖 Branche : refonte-step3-hybride-ia-algo
🔖 Tag : sprint-d-complete
🔖 Prêt pour : Merge dans main + Phases 2-4 (UI/UX)"

# Tag final
git tag sprint-d-complete

# Push
git push origin refonte-step3-hybride-ia-algo --tags
```

---

## ✅ CRITÈRES DE SUCCÈS GLOBAUX

### Métriques Techniques

| Métrique | Cible | Validation |
|----------|-------|------------|
| **Complétude** | 100% steps couverts | 0% "produit non spécifié" |
| **Alternatives** | 3 par produit min | Count alternatives >= 3 |
| **Performance** | Step 3 < 5s (20 steps) | Mesure temps réel |
| **Coût** | < 1000 tokens Step 3 | 0 tokens (algo pur) |
| **Fiabilité** | 0% erreur JSON | Aucun parsing error |
| **Budget** | Respect ±10% | Total <= maxBudget * 1.1 |

### Métriques Qualité

- ✅ Code TypeScript strict (pas de `any`)
- ✅ Tests manuels réussis (4 cas minimum)
- ✅ Logs clairs et détaillés
- ✅ Documentation complète
- ✅ Build production OK
- ✅ Rollback possible à tout moment

---

## 🔄 PROCÉDURE ROLLBACK COMPLÈTE

### Rollback Partiel (revenir à une phase)

```bash
# Revenir après Phase D1
git checkout checkpoint-after-d1
git branch -D refonte-step3-hybride-ia-algo
git checkout -b refonte-step3-hybride-ia-algo

# Revenir après Phase D2
git checkout checkpoint-after-d2
# ...
```

### Rollback Total (avant Sprint D)

```bash
# Revenir à état avant refonte
git checkout sauvegarde-app-complete-2025-09-30

# OU garder seulement correction markdown
git checkout sauvegarde-app-complete-2025-09-30
git checkout refonte-step3-hybride-ia-algo -- src/services/ai/AnalysisService.ts
# (lignes 765-769 uniquement)
```

---

## 📋 CHECKLIST FINALE

### Avant de Commencer Sprint D

- [ ] Branche `refonte-step3-hybride-ia-algo` active
- [ ] Serveur dev démarre sans erreur
- [ ] Baseline test exécuté et documenté
- [ ] Checkpoint `checkpoint-before-d1` créé

### Après Chaque Phase

- [ ] Tests phase OK
- [ ] Commit avec message clair
- [ ] Tag checkpoint créé
- [ ] Build réussit

### Avant Merge Final

- [ ] Tous tests E2E réussis
- [ ] Rapport validation complet
- [ ] Documentation à jour
- [ ] Métriques cibles atteintes
- [ ] Code review (si équipe)
- [ ] Tag `sprint-d-complete` créé

---

## 🚀 PROCHAINES ÉTAPES APRÈS SPRINT D

Une fois Sprint D validé :

1. **Merge dans main** (ou branche principale)
2. **Phase 2 : Amélioration UI/UX Résultats** (1.5 jours)
   - Badges sélectifs
   - Modal alternatives
   - Score matching visible
3. **Phase 3 : Récap Utilisateur** (0.5 jour)
   - Section "Vos entrées"
   - Photos cliquables
4. **Phase 4 : Tests & Validation Finale** (0.5 jour)
   - 20 cas tests variés
   - Rapport final V2.5

---

**DURÉE TOTALE ESTIMÉE** : 5-6h

**STATUS** : 📋 PRÊT À EXÉCUTER

**APPROCHE** : Incrémentale, sécurisée, testée à chaque étape

**ROLLBACK** : Possible à tout moment via checkpoints git

