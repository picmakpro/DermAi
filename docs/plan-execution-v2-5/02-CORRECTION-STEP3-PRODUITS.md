# 🔧 PHASE 1 : CORRECTION STEP 3 - SÉLECTION PRODUITS

> **Objectif :** Réparer Step 3 pour éliminer "produits non spécifiés" et ajouter alternatives + score

**Durée totale :** 1 jour (8h)  
**Priorité :** P0 (BLOQUANT)  
**Risque :** 🟡 Moyen (modification schéma + prompt)

---

## 📋 **VUE D'ENSEMBLE**

### **Problèmes Identifiés**

❌ **Incohérence Prompt ↔ Schéma**
- Prompt demande `routineStepUid`, `imageUrl`, `retailers`, `alternatives` (objets)
- Schéma accepte seulement `routineStepId`, `catalogId`, `productName`
- **Résultat :** Zod rejette 50% des données → alternatives perdues

❌ **Pas de Score de Matching**
- Aucun champ score dans le schéma
- Impossible d'afficher badge % compatibilité
- Pas de raisons de compatibilité

❌ **Catalogue Peut Être Vide**
- Aucune validation avant Step 3
- Si catalogue vide → IA génère "produit non spécifié"
- Logs insuffisants

❌ **Enrichissement Produits Fragile**
- 3 méthodes de fallback pour matcher
- Si toutes échouent → `product = undefined`
- Pas de validation finale

### **Résultat Attendu**

✅ Schéma V3 aligné avec prompt (routineStepUid, imageUrl, retailers, alternatives)  
✅ Score matching 0-100 sur chaque produit  
✅ Alternatives complètes (3-5 par produit)  
✅ Catalogue validé avant Step 3  
✅ 100% produits mappés

---

## 🎯 **SPRINT FIX-1A : Créer Schéma V3 Aligné** (2h)

### **Objectif**
Créer `ProductSelectionSchemaV3` cohérent avec le prompt Step 3

### **Tâches**

#### **1A.1 Créer nouveau schéma produit**

**Modifier :** `src/schemas/v2/products.ts`

**Ajouter après SelectedProductSchema (garder V2 pour compatibilité) :**

```typescript
// ===== SCHÉMA V3 - ALIGNÉ AVEC PROMPT STEP 3 =====

/**
 * Schéma pour un produit sélectionné V3 (avec alternatives et score)
 * Aligné avec selectionProduits.ts prompt
 */
export const SelectedProductSchemaV3 = z.object({
  // Champs existants V2
  routineStepId: z.number().min(1),
  catalogId: z.string().min(3).max(50),
  productName: z.string().min(5).max(100),
  brand: z.string().min(2).max(50),
  price: z.number().min(0).max(500),
  
  // ✨ NOUVEAUX CHAMPS V3 (alignés prompt)
  routineStepUid: z.string().optional(), // "immediate:morning:nettoyage:1"
  imageUrl: z.string().url().optional(),
  
  // Score de matching (0-100)
  matchingScore: z.number().min(0).max(100),
  compatibilityReasons: z.array(z.string()).min(2).max(4), // 2-4 raisons courtes
  
  // Retailers (liens d'achat)
  retailers: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    price: z.number().optional()
  })).min(1).optional(),
  
  // Alternatives (OBJETS COMPLETS)
  alternatives: z.array(z.object({
    catalogId: z.string(),
    name: z.string(),
    brand: z.string().optional(),
    price: z.number(),
    imageUrl: z.string().url().optional(),
    matchingScore: z.number().min(0).max(100) // Score de l'alternative
  })).min(2).max(5).optional(), // 2-5 alternatives
  
  // Champs existants
  justification: z.string().min(20).max(300),
  applicationAdvice: z.string().min(10).max(200),
  timing: z.string().min(3).max(50),
  targetZones: z.array(z.string()).min(1).max(10),
  temporaryLabel: z.boolean().optional(),
  progressiveIntroduction: z.string().nullable().optional(),
  restrictions: z.array(z.string()).optional()
})

// Schéma principal V3
export const ProductSelectionSchemaV3 = z.object({
  selectedProducts: z.array(SelectedProductSchemaV3).min(3).max(12),
  budgetBreakdown: BudgetBreakdownSchema,
  coherenceValidation: CoherenceValidationSchema
})

// Export types
export type SelectedProductV3 = z.infer<typeof SelectedProductSchemaV3>
export type ProductSelectionV3 = z.infer<typeof ProductSelectionSchemaV3>
```

#### **1A.2 Exporter nouveau schéma**

**Modifier :** `src/schemas/v2/index.ts`

```typescript
// Export all V2 schemas and types
export * from './diagnostic'
export * from './routine'
export * from './products' // ✅ Inclut déjà V3
export * from './complete'
```

#### **1A.3 Utiliser schéma V3 dans AnalysisService**

**Modifier :** `src/services/ai/AnalysisService.ts`

```typescript
// Ligne ~1-15 : Imports
import { 
  PureDiagnostic, 
  PersonalizedRoutine, 
  ProductSelection,
  ProductSelectionV3, // ✅ NOUVEAU
  CompleteAnalysisV2,
  PureDiagnosticSchema,
  PersonalizedRoutineSchema,
  ProductSelectionSchema,
  ProductSelectionSchemaV3, // ✅ NOUVEAU
  CompleteAnalysisV2Schema
} from '@/schemas/v2'

// Ligne ~638 : selectOptimalProducts
static async selectOptimalProducts(
  routine: PersonalizedRoutine,
  request: AnalyzeRequest,
  requestId: string
): Promise<ProductSelectionV3> { // ✅ Type retour V3
  
  // ... code existant ...
  
  // Ligne ~707 : Validation avec schéma V3
  const validatedProducts = ProductSelectionSchemaV3.parse(parsedContent) // ✅
  
  // ... reste inchangé
}
```

### **DoD Sprint FIX-1A**

- [ ] SelectedProductSchemaV3 créé avec tous les champs
- [ ] ProductSelectionSchemaV3 créé
- [ ] Types exportés (SelectedProductV3, ProductSelectionV3)
- [ ] AnalysisService utilise schéma V3
- [ ] Build passe : `npm run build`
- [ ] Commit : "feat: add ProductSelectionSchemaV3 with alternatives and matching score"

---

## 🎯 **SPRINT FIX-1B : Mettre à Jour Prompt Step 3** (1.5h)

### **Objectif**
Demander explicitement score + alternatives dans le prompt

### **Tâches**

#### **1B.1 Ajouter section scoring dans prompt système**

**Modifier :** `src/services/ai/core/prompts/selectionProduits.ts`

**Ajouter après ligne 40 (avant ## CATALOGUE FOURNI) :**

```typescript
### **SCORE DE MATCHING OBLIGATOIRE**

Pour chaque produit sélectionné, calculer un **matchingScore** (0-100) selon cette formule :

**Calcul du score :**
- **40 pts** : Adéquation au problème de peau diagnostiqué
  - Ingrédients actifs ciblant le problème identifié
  - Efficacité prouvée pour le type de problème
- **30 pts** : Compatibilité avec le type de peau
  - Texture adaptée (gel/crème/sérum)
  - Non-comédogène si peau grasse
  - Hydratant si peau sèche
- **20 pts** : Rapport qualité/prix
  - Prix/mL compétitif
  - Respect budget utilisateur
  - Concentration actifs optimale
- **10 pts** : Disponibilité et fiabilité
  - En stock
  - Marque reconnue
  - Avis positifs

**Raisons de compatibilité :**
Fournir 2-4 raisons courtes (15-30 mots chacune) expliquant le score.

Exemples :
- "Acide hyaluronique haute concentration pour peau déshydratée"
- "Texture gel non-comédogène adaptée zone T grasse"
- "Prix compétitif pour budget Essentiel (0.25€/mL)"

### **ALTERNATIVES OBLIGATOIRES**

Pour chaque produit principal, fournir **3-5 alternatives** avec :
- Même catégorie (cleanser → cleanser)
- Score ≥ 70% du score principal
- Prix variés (économique, similaire, premium)
- Chaque alternative doit avoir son propre matchingScore

Critères alternatives :
- **Budget :** ±30% du prix principal
- **Efficacité :** Mêmes actifs clés ou équivalents
- **Disponibilité :** En stock prioritairement
```

#### **1B.2 Mettre à jour format JSON attendu**

**Modifier section FORMAT JSON OBLIGATOIRE (ligne ~60) :**

```typescript
## FORMAT JSON OBLIGATOIRE
Réponds UNIQUEMENT en JSON selon cette structure :

{
  "selectedProducts": [
    {
      "routineStepId": 1,
      "routineStepUid": "immediate:morning:nettoyage:1",
      "catalogId": "cerave_gel_moussant_123",
      "productName": "Gel Moussant Nettoyant",
      "brand": "CeraVe",
      "price": 12.99,
      "imageUrl": "https://example.com/cerave-gel.jpg",
      
      // ✨ SCORE ET RAISONS
      "matchingScore": 87,
      "compatibilityReasons": [
        "Formule gel adaptée peau mixte diagnostiquée",
        "Céramides pour barrière cutanée fragilisée", 
        "pH physiologique 5.5 non-irritant",
        "Rapport qualité/prix optimal (0.22€/mL)"
      ],
      
      // ✨ RETAILERS
      "retailers": [
        { "name": "Amazon", "url": "https://amazon.fr/cerave-gel", "price": 12.99 },
        { "name": "Sephora", "url": "https://sephora.fr/cerave-gel", "price": 13.50 }
      ],
      
      // ✨ ALTERNATIVES COMPLÈTES
      "alternatives": [
        { 
          "catalogId": "cetaphil_cleanser_456", 
          "name": "Cetaphil Gentle Skin Cleanser", 
          "brand": "Cetaphil", 
          "price": 10.99,
          "imageUrl": "https://example.com/cetaphil.jpg",
          "matchingScore": 82
        },
        { 
          "catalogId": "lrp_toleriane_789", 
          "name": "La Roche-Posay Toleriane Dermo-Nettoyant", 
          "brand": "La Roche-Posay", 
          "price": 15.99,
          "imageUrl": "https://example.com/lrp.jpg",
          "matchingScore": 85
        },
        {
          "catalogId": "bioderma_sensibio_101",
          "name": "Bioderma Sensibio Gel Moussant",
          "brand": "Bioderma",
          "price": 11.50,
          "imageUrl": "https://example.com/bioderma.jpg",
          "matchingScore": 80
        }
      ],
      
      "justification": "Nettoyant doux adapté à votre peau mixte...",
      "applicationAdvice": "Appliquer sur peau humide...",
      "timing": "matin",
      "targetZones": ["visage entier"],
      "temporaryLabel": false,
      "restrictions": []
    }
  ],
  "budgetBreakdown": { ... },
  "coherenceValidation": { ... }
}

**VALIDATION OBLIGATOIRE :**
- Chaque produit a matchingScore entre 50-100
- Chaque produit a 2-4 compatibilityReasons
- Chaque produit a 3-5 alternatives avec leur score
- Alternatives ont score ≥ 70% du principal
```

### **DoD Sprint FIX-1B**

- [ ] Section scoring ajoutée au prompt système
- [ ] Formule 40+30+20+10 documentée
- [ ] Section alternatives obligatoires ajoutée
- [ ] Format JSON mis à jour avec exemples
- [ ] Commit : "feat: update Step 3 prompt to require matching score and alternatives"

---

## 🎯 **SPRINT FIX-1C : Sécuriser Catalogue** (1h)

### **Objectif**
Valider que le catalogue est chargé avant Step 3

### **Tâches**

#### **1C.1 Ajouter validation catalogue**

**Modifier :** `src/services/ai/AnalysisService.ts` (ligne ~640)

```typescript
static async selectOptimalProducts(
  routine: PersonalizedRoutine,
  request: AnalyzeRequest,
  requestId: string
): Promise<ProductSelectionV3> {
  
  // Charger le catalogue partitionné
  const catalog = await this.loadPartitionedCatalog()
  
  // ✅ VALIDATION CATALOGUE (NOUVEAU)
  const totalProducts = Object.values(catalog).flat().length
  const categoriesCount = Object.keys(catalog).length
  
  if (totalProducts === 0) {
    this.logger.error('❌ CATALOGUE VIDE - Step 3 impossible', { requestId })
    throw new Error('CATALOGUE_EMPTY: Impossible de sélectionner des produits sans catalogue')
  }
  
  if (totalProducts < 50) {
    this.logger.warn(`⚠️ Catalogue incomplet: ${totalProducts} produits seulement`, { 
      requestId,
      categoriesCount 
    })
  }
  
  this.logger.info('✅ Catalogue validé pour Step 3', { 
    requestId,
    totalProducts,
    categoriesCount,
    categories: Object.keys(catalog)
  })
  
  // ✅ LOGS INPUT DÉTAILLÉS (NOUVEAU)
  const totalSteps = Object.values(routine.phases).reduce(
    (sum, phase) => sum + phase.steps.length, 0
  )
  
  this.logger.info('[step3:input-details]', {
    requestId,
    routine: {
      totalSteps,
      immediate: routine.phases.immediate.steps.length,
      adaptation: routine.phases.adaptation.steps.length,
      maintenance: routine.phases.maintenance.steps.length
    },
    catalogue: {
      totalProducts,
      categories: categoriesCount
    },
    constraints: {
      budget: request.constraints.budget,
      pregnancy: request.userProfile.pregnancy,
      allergies: request.constraints.allergies?.length || 0
    }
  })
  
  const cacheKey = this.cache.generateProductsKey(routine, request.constraints.budget)
  
  // ... reste du code inchangé
}
```

#### **1C.2 Ajouter fallback catalogue**

**Créer :** `src/data/catalogBackup.json` (extrait minimal)

```json
{
  "cleanser": [
    {
      "catalogId": "cerave_hydrating_cleanser",
      "name": "Gel Nettoyant Hydratant",
      "brand": "CeraVe",
      "category": "cleanser",
      "price": 12.99,
      "targetSkinTypes": ["dry", "normal", "combination"],
      "benefits": ["Nettoyage doux", "Hydratation"],
      "activeIngredients": ["Céramides", "Acide hyaluronique"],
      "applicationTiming": "morning_evening",
      "targetZones": ["visage entier"]
    }
  ],
  "moisturizer": [
    {
      "catalogId": "cerave_moisturizing_cream",
      "name": "Crème Hydratante",
      "brand": "CeraVe",
      "category": "moisturizer",
      "price": 15.99,
      "targetSkinTypes": ["dry", "normal"],
      "benefits": ["Hydratation 24h"],
      "activeIngredients": ["Céramides"],
      "applicationTiming": "morning_evening",
      "targetZones": ["visage entier"]
    }
  ],
  "sunscreen": [
    {
      "catalogId": "lrp_anthelios_spf50",
      "name": "Anthelios SPF50+",
      "brand": "La Roche-Posay",
      "category": "sunscreen",
      "price": 18.99,
      "targetSkinTypes": ["all"],
      "benefits": ["Protection UVA/UVB"],
      "activeIngredients": ["Filtres UV"],
      "applicationTiming": "morning",
      "targetZones": ["visage entier"]
    }
  ]
}
```

**Modifier :** `src/services/ai/core/CatalogLoaderV2.ts` (ligne ~55)

```typescript
static async loadPartitionedCatalog(): Promise<PartitionedCatalog> {
  // ... code existant ...
  
  try {
    // ... chargement normal ...
  } catch (error) {
    this.logger.error('❌ Erreur chargement catalogue', { error })
    
    // ✅ FALLBACK CATALOGUE BACKUP
    this.logger.warn('🔄 Utilisation catalogue backup')
    
    try {
      const catalogBackup = await import('@/data/catalogBackup.json')
      return catalogBackup.default as PartitionedCatalog
    } catch (backupError) {
      this.logger.error('❌ Catalogue backup aussi en erreur', { backupError })
      throw new Error('CATALOGUE_UNAVAILABLE: Impossible de charger le catalogue')
    }
  }
}
```

### **DoD Sprint FIX-1C**

- [ ] Validation catalogue avant Step 3
- [ ] Erreur claire si catalogue vide
- [ ] Logs détaillés input Step 3
- [ ] Catalogue backup créé (3+ catégories minimum)
- [ ] Fallback implémenté
- [ ] Test : Catalogue vide → erreur `CATALOGUE_EMPTY`
- [ ] Commit : "feat: add catalogue validation and backup for Step 3"

---

## 🎯 **SPRINT FIX-1D : Valider Enrichissement Produits** (1.5h)

### **Objectif**
S'assurer que 100% des produits sont mappés routine→produits

### **Tâches**

#### **1D.1 Ajouter validation stricte mapping**

**Modifier :** `src/services/ai/core/AnalysisServiceV3Adapter.ts` (ligne ~200)

```typescript
private static enrichWithProductData(
  routine: AiRoutineOutput, 
  products: ProductSelection
): AiRoutineOutput {
  
  console.log('[analysis:enrichment-start]', {
    totalProducts: products.selectedProducts.length,
    totalItems: this.countTotalItems(routine)
  })
  
  // ... code existant de matching ...
  
  // ✅ VALIDATION FINALE STRICTE (NOUVEAU)
  let unmatchedItems: any[] = []
  let totalItems = 0
  
  routine.phases.forEach(phase => {
    Object.values(phase.slots).flat().forEach(item => {
      totalItems++
      
      if (!item.product || item.product === 'Non spécifié' || item.product === '') {
        unmatchedItems.push({
          phase: phase.id,
          slot: item.routine_slot,
          category: item.category,
          title: item.title
        })
        
        console.warn(`[analysis:product-missing]`, {
          phase: phase.id,
          slot: item.routine_slot,
          category: item.category,
          title: item.title
        })
      }
    })
  })
  
  const matchedCount = totalItems - unmatchedItems.length
  const matchRate = totalItems > 0 ? (matchedCount / totalItems * 100).toFixed(1) : '0'
  
  console.log(`[analysis:enrichment-complete]`, {
    totalItems,
    matched: matchedCount,
    unmatched: unmatchedItems.length,
    matchRate: `${matchRate}%`
  })
  
  // ✅ ERREUR SI TROP DE PRODUITS MANQUANTS
  if (unmatchedItems.length > 0) {
    const threshold = 0.3 // 30% maximum de produits manquants
    
    if (unmatchedItems.length > totalItems * threshold) {
      console.error(`[analysis:enrichment-failed]`, {
        unmatchedItems,
        threshold: `${threshold * 100}%`,
        actual: matchRate
      })
      
      throw new Error(
        `ENRICHMENT_FAILED: ${unmatchedItems.length}/${totalItems} produits non mappés (${matchRate}% match). ` +
        `Vérifier que Step 3 génère les bons catalogId et routineStepId.`
      )
    }
    
    // Warning si <100% mais >70%
    console.warn(`⚠️ Enrichissement incomplet mais acceptable: ${matchRate}% match`)
  }
  
  return routine
}
```

#### **1D.2 Ajouter logs de debug matching**

**Ajouter méthode de debug dans AnalysisServiceV3Adapter :**

```typescript
/**
 * Debug helper pour diagnostiquer problèmes de matching
 */
private static debugProductMatching(
  routine: AiRoutineOutput,
  products: ProductSelection
): void {
  
  console.log('[analysis:debug-matching-start]')
  
  // Lister tous les stepIds de la routine
  const routineStepIds: number[] = []
  let stepCounter = 1
  
  routine.phases.forEach(phase => {
    Object.values(phase.slots).flat().forEach(item => {
      routineStepIds.push(stepCounter++)
    })
  })
  
  // Lister tous les routineStepId des produits
  const productStepIds = products.selectedProducts.map(p => p.routineStepId)
  
  // Identifier les IDs manquants
  const missingStepIds = routineStepIds.filter(id => !productStepIds.includes(id))
  
  if (missingStepIds.length > 0) {
    console.warn('[analysis:debug-missing-stepids]', {
      routineStepIds,
      productStepIds,
      missingStepIds,
      message: `Step 3 n'a pas généré de produits pour les stepIds: ${missingStepIds.join(', ')}`
    })
  } else {
    console.log('[analysis:debug-matching-ok]', {
      routineSteps: routineStepIds.length,
      productSteps: productStepIds.length,
      message: 'Tous les stepIds sont couverts'
    })
  }
}
```

**Appeler dans enrichWithProductData (début) :**

```typescript
private static enrichWithProductData(...): AiRoutineOutput {
  
  // Debug matching
  this.debugProductMatching(routine, products)
  
  // ... reste du code
}
```

### **DoD Sprint FIX-1D**

- [ ] Validation stricte 100% produits mappés
- [ ] Erreur si >30% manquants
- [ ] Warning si <100% mais >70%
- [ ] Logs détaillés produits manquants
- [ ] Debug helper pour diagnostiquer
- [ ] Test : Routine 8 steps → 8 produits mappés
- [ ] Commit : "feat: add strict product matching validation with debug helpers"

---

## 🎯 **SPRINT FIX-1E : Tests & Validation** (2h)

### **Objectif**
Tester Step 3 corrigé sur plusieurs cas

### **Tâches**

#### **1E.1 Test unitaire schéma V3**

**Créer :** `src/schemas/v2/__tests__/products.v3.test.ts`

```typescript
import { 
  SelectedProductSchemaV3, 
  ProductSelectionSchemaV3 
} from '../products'

describe('ProductSelectionSchemaV3', () => {
  
  it('valide un produit complet avec alternatives et score', () => {
    const validProduct = {
      routineStepId: 1,
      catalogId: 'cerave_gel_123',
      productName: 'Gel Nettoyant',
      brand: 'CeraVe',
      price: 12.99,
      routineStepUid: 'immediate:morning:nettoyage:1',
      imageUrl: 'https://example.com/cerave.jpg',
      matchingScore: 87,
      compatibilityReasons: [
        'Adapté peau mixte',
        'pH physiologique 5.5'
      ],
      retailers: [
        { name: 'Amazon', url: 'https://amazon.fr/cerave' }
      ],
      alternatives: [
        {
          catalogId: 'cetaphil_456',
          name: 'Cetaphil Cleanser',
          price: 10.99,
          matchingScore: 82
        }
      ],
      justification: 'Nettoyant doux pour peau mixte',
      applicationAdvice: 'Appliquer matin et soir',
      timing: 'matin',
      targetZones: ['visage entier']
    }
    
    expect(() => SelectedProductSchemaV3.parse(validProduct)).not.toThrow()
  })
  
  it('rejette un produit sans score de matching', () => {
    const invalidProduct = {
      routineStepId: 1,
      catalogId: 'test_123',
      productName: 'Test',
      brand: 'Test',
      price: 10,
      // ❌ Pas de matchingScore
      justification: 'Test',
      applicationAdvice: 'Test',
      timing: 'matin',
      targetZones: ['visage']
    }
    
    expect(() => SelectedProductSchemaV3.parse(invalidProduct)).toThrow()
  })
  
  it('valide une sélection complète V3', () => {
    const validSelection = {
      selectedProducts: [
        {
          routineStepId: 1,
          catalogId: 'prod_1',
          productName: 'Produit 1',
          brand: 'Marque',
          price: 15,
          matchingScore: 85,
          compatibilityReasons: ['Raison 1', 'Raison 2'],
          justification: 'Justification produit',
          applicationAdvice: 'Conseil application',
          timing: 'matin',
          targetZones: ['visage']
        },
        // ... 2 autres produits minimum
      ],
      budgetBreakdown: {
        totalCost: 50,
        budgetRespected: true,
        optimizations: []
      },
      coherenceValidation: {
        routineProductsMatch: true,
        zonesCoherent: true,
        timingLogical: true,
        budgetRespected: true,
        issuesFound: []
      }
    }
    
    expect(() => ProductSelectionSchemaV3.parse(validSelection)).not.toThrow()
  })
})
```

**Lancer :**
```bash
npm test -- products.v3.test.ts
```

#### **1E.2 Test fonctionnel Step 3**

**Créer script de test :** `scripts/test-step3.ts`

```typescript
import { AnalysisService } from '@/services/ai/AnalysisService'

// Mock routine et request
const mockRoutine = { /* routine complète */ }
const mockRequest = { /* request avec photos */ }

async function testStep3() {
  try {
    console.log('🧪 Test Step 3 avec schéma V3...')
    
    const products = await AnalysisService.selectOptimalProducts(
      mockRoutine,
      mockRequest,
      'test-request-id'
    )
    
    console.log('✅ Step 3 réussi')
    console.log(`Produits: ${products.selectedProducts.length}`)
    
    // Vérifier alternatives
    const withAlternatives = products.selectedProducts.filter(p => 
      p.alternatives && p.alternatives.length >= 2
    )
    
    console.log(`Produits avec alternatives: ${withAlternatives.length}/${products.selectedProducts.length}`)
    
    // Vérifier scores
    const scores = products.selectedProducts.map(p => p.matchingScore)
    console.log(`Scores: min=${Math.min(...scores)}, max=${Math.max(...scores)}, avg=${(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)}`)
    
  } catch (error) {
    console.error('❌ Test Step 3 échoué:', error)
  }
}

testStep3()
```

**Lancer :**
```bash
npx ts-node scripts/test-step3.ts
```

#### **1E.3 Test E2E complet**

**Parcours de test :**

1. Démarrer app : `npm run dev`
2. Upload 3 photos
3. Remplir questionnaire
4. Lancer analyse
5. **Vérifier page résultats :**
   - [ ] Routine s'affiche
   - [ ] AUCUN "produit non spécifié"
   - [ ] Ouvrir console :
     - [ ] Logs `[step3:input-details]` présents
     - [ ] Logs `[analysis:enrichment-complete]` avec 100% match
     - [ ] 0 erreur critique

6. **Inspecter données :**
   - Ouvrir DevTools → Network → Trouver requête `/api/analyze`
   - Copier réponse JSON
   - Vérifier dans `selectedProducts` :
     - [ ] Tous ont `matchingScore` 50-100
     - [ ] Tous ont `compatibilityReasons` (2-4 items)
     - [ ] Tous ont `alternatives` (2-5 items)

#### **1E.4 Créer rapport de validation**

**Créer :** `docs/plan-execution-v2-5/RAPPORT-STEP3-V3.md`

```markdown
# Rapport Correction Step 3 - Schéma V3

**Date :** {DATE}  
**Durée :** {DURÉE}

## Modifications Apportées

### Schéma V3
- ✅ `SelectedProductSchemaV3` créé
- ✅ Champs ajoutés : `matchingScore`, `compatibilityReasons`, `retailers`, `alternatives`
- ✅ `ProductSelectionSchemaV3` utilise V3

### Prompt Step 3
- ✅ Section scoring 40+30+20+10 ajoutée
- ✅ Alternatives obligatoires (3-5 par produit)
- ✅ Format JSON mis à jour

### Sécurisation
- ✅ Validation catalogue avant Step 3
- ✅ Fallback catalogue backup
- ✅ Logs détaillés input Step 3

### Validation Enrichissement
- ✅ Vérification 100% produits mappés
- ✅ Erreur si >30% manquants
- ✅ Debug helper pour diagnostiquer

## Tests Réalisés

### Tests Unitaires
- [x] Schéma V3 valide produit complet
- [x] Schéma V3 rejette produit sans score
- [x] ProductSelectionV3 valide sélection complète
- **Résultat :** 3/3 tests passés ✅

### Tests Fonctionnels
- [x] Step 3 génère produits avec V3
- [x] Alternatives présentes (2-5 par produit)
- [x] Scores matching 50-95
- **Résultat :** ✅ Fonctionnel

### Tests E2E
- [x] Parcours complet analyse
- [x] 0 "produit non spécifié"
- [x] Alternatives visibles dans data
- [x] Logs complets Step 3
- **Résultat :** ✅ Opérationnel

## Métriques

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Produits avec alternatives | 0% | 100% | +100% |
| Score matching affiché | ❌ | ✅ | Feature ajoutée |
| "Produit non spécifié" | Fréquent | 0 | ✅ Résolu |
| Logs Step 3 | Incomplets | Détaillés | +200% |
| Validation catalogue | ❌ | ✅ | Sécurisé |

## Prochaines Étapes

✅ **Phase 1 complète**  
→ Passer à `03-AMELIORATION-UI-RESULTATS.md`

## Issues Connues

- [ ] TODO: Implémenter affichage score dans UI (Phase 2)
- [ ] TODO: Modal alternatives (Phase 2)
```

### **DoD Sprint FIX-1E**

- [ ] Tests unitaires V3 créés et passent
- [ ] Script test Step 3 fonctionne
- [ ] Test E2E validé : 0 "produit non spécifié"
- [ ] RAPPORT-STEP3-V3.md créé
- [ ] Commit : "test: add Step 3 V3 validation tests and report"

---

## 🚨 **SPRINTS DE DEBUG**

### **DEBUG-1 : Validation Zod Échoue**

**Symptôme :** Erreur `ZodError` lors de Step 3

**Diagnostic :**
```bash
# Activer logs détaillés
# Dans AnalysisService.ts ligne ~690
console.log('DEBUG Step 3 - Contenu brut:', cleanContent)
console.log('DEBUG Step 3 - Parsé:', JSON.stringify(parsedContent, null, 2))
```

**Solutions :**
1. Vérifier que prompt génère tous les champs V3
2. Vérifier types (matchingScore = number, pas string)
3. Si alternatives vides → ajuster prompt pour forcer 2 minimum

**Rollback temporaire :**
```typescript
// Revenir au schéma V2 temporairement
const validatedProducts = ProductSelectionSchema.parse(parsedContent) // V2
```

### **DEBUG-2 : Catalogue Vide**

**Symptôme :** Erreur `CATALOGUE_EMPTY`

**Diagnostic :**
```bash
# Vérifier fichiers catalogue
ls -la public/catalog/
cat public/catalog/index.json | jq '.totalProducts'
```

**Solutions :**
1. Vérifier que `/public/catalog/` existe
2. Vérifier `index.json` bien formaté
3. Tester chargement manuel :
```typescript
const catalog = await loadPartitionedCatalog()
console.log('Catalogue chargé:', Object.keys(catalog))
```

4. Utiliser catalogue backup si nécessaire

### **DEBUG-3 : Produits Non Mappés**

**Symptôme :** Warning `enrichment-incomplete` >30%

**Diagnostic :**
```bash
# Activer debug matching
# AnalysisServiceV3Adapter ligne ~120
this.debugProductMatching(routine, products)
```

**Solutions :**
1. Vérifier logs `[analysis:debug-missing-stepids]`
2. Comparer `routineStepIds` vs `productStepIds`
3. Si stepIds manquants → Step 3 ne génère pas assez de produits
4. Ajuster prompt pour couvrir tous les steps

**Fix rapide :**
```typescript
// Créer produits fallback pour IDs manquants
missingStepIds.forEach(id => {
  products.selectedProducts.push({
    routineStepId: id,
    catalogId: 'fallback_product',
    productName: 'Produit à sélectionner',
    // ... valeurs par défaut
  })
})
```

---

## ✅ **CHECKLIST FINALE PHASE 1**

Avant de passer à Phase 2 (Amélioration UI) :

### **Schéma V3**
- [ ] SelectedProductSchemaV3 créé avec 10+ champs
- [ ] ProductSelectionSchemaV3 créé
- [ ] Types exportés et utilisés
- [ ] AnalysisService utilise V3
- [ ] Build passe

### **Prompt Step 3**
- [ ] Section scoring 40+30+20+10 ajoutée
- [ ] Formule détaillée documentée
- [ ] Alternatives obligatoires 3-5
- [ ] Format JSON mis à jour
- [ ] Exemples complets fournis

### **Catalogue**
- [ ] Validation avant Step 3
- [ ] Erreur si vide
- [ ] Logs détaillés
- [ ] Catalogue backup créé
- [ ] Fallback implémenté

### **Enrichissement**
- [ ] Validation 100% mapping
- [ ] Erreur si >30% manquants
- [ ] Debug helper créé
- [ ] Logs complets

### **Tests**
- [ ] Tests unitaires V3 passent
- [ ] Test fonctionnel Step 3 OK
- [ ] Test E2E : 0 "produit non spécifié"
- [ ] RAPPORT-STEP3-V3.md créé

### **Commits Recommandés**
```bash
git commit -m "feat: add ProductSelectionSchemaV3 with alternatives and matching score"
git commit -m "feat: update Step 3 prompt to require matching score and alternatives"
git commit -m "feat: add catalogue validation and backup for Step 3"
git commit -m "feat: add strict product matching validation with debug helpers"
git commit -m "test: add Step 3 V3 validation tests and report"
```

---

## 🎯 **RÉSULTAT ATTENDU**

À la fin de cette phase :

✅ **Step 3 corrigé :** Schéma V3 aligné avec prompt  
✅ **Alternatives présentes :** 3-5 par produit  
✅ **Score matching :** 0-100 sur chaque produit  
✅ **Catalogue sécurisé :** Validation + fallback  
✅ **100% mapping :** Aucun "produit non spécifié"

---

**📍 PROCHAINE ÉTAPE :** `03-AMELIORATION-UI-RESULTATS.md`

**⏱️ DURÉE TOTALE PHASE 1 :** ~8h (1 jour)  
**🎯 VALIDATION :** Tests E2E + 0 produit non spécifié

