# 🚀 PLANNING D'EXÉCUTION - Top 3 Produits par Catégorie

> **Version :** 1.0  
> **Date :** 17 septembre 2025  
> **Durée totale :** 3 semaines (15 jours ouvrés)  
> **Complexité :** Moyenne-Élevée

## 📋 **VUE D'ENSEMBLE DU PLANNING**

### **Approche Méthodologique**
- **IA-First** : Modification des prompts et validation avant UI
- **Incrémental** : Préservation de l'architecture existante
- **Test-Driven** : Validation à chaque étape avec données réelles
- **Performance-Aware** : Monitoring des impacts sur temps de réponse

### **Répartition par Sprint**
```
🤖  SPRINT 1 (5 jours) : Architecture IA & Validation
🎨  SPRINT 2 (5 jours) : Interface Utilisateur & Alternatives  
🔧  SPRINT 3 (5 jours) : Intégration, Tests & Optimisation
```

---

## 🤖 **SPRINT 1 : ARCHITECTURE IA & VALIDATION**
### *Durée : 5 jours ouvrés*

### **🎯 Objectifs Sprint 1**
- ✅ Modifier l'étape 3 pour générer Top 3 produits par catégorie
- ✅ Créer nouveaux schémas Zod pour validation 3 produits
- ✅ Adapter prompts IA pour classement intelligent
- ✅ Tester génération avec données réelles
- ✅ Valider performance et coûts OpenAI

---

### **📅 JOUR 1 : Nouveaux Schémas TypeScript & Zod**

#### **🔧 TÂCHE 1.1 : Création Schémas V3**
**Durée :** 3h  
**Fichiers :** `src/schemas/v3/products.ts`, `src/schemas/v3/index.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Créer les nouveaux schémas TypeScript et Zod pour Top 3 produits

// 1. Interface ProductDetail enrichie
interface ProductDetail {
  catalogId: string
  productName: string
  brand: string
  price: number
  ranking: 1 | 2 | 3                    // NOUVEAU: Classement obligatoire
  justification: string                 // Justification spécifique au ranking
  applicationAdvice: string
  timing: string
  targetZones: string[]
  differentiators: string[]             // NOUVEAU: Ce qui distingue ce produit
  priceComparison: string              // NOUVEAU: "Plus économique", "Premium", etc.
  strengthComparison: string           // NOUVEAU: "Plus doux", "Plus puissant", etc.
  temporaryLabel?: boolean
  progressiveIntroduction?: string
  restrictions?: string[]
}

// 2. Interface SelectedProductWithAlternatives
interface SelectedProductWithAlternatives {
  routineStepId: number
  primaryProduct: ProductDetail         // Produit #1 (affiché dans routine)
  alternatives: ProductDetail[]         // Produits #2 et #3
  categoryRanking: {
    criteria: string[]                  // Critères de classement utilisés
    justification: string               // Explication du classement
    diversificationStrategy: string     // Stratégie de diversification appliquée
  }
}

// 3. Interface ProductSelectionV3 complète
interface ProductSelectionV3 {
  selectedProducts: SelectedProductWithAlternatives[]
  budgetBreakdown: {
    totalCost: number                   // Coût du produit principal uniquement
    budgetRespected: boolean
    optimizations: string[]
    alternatives: string[]
    priceDistribution: {                // NOUVEAU: Répartition des prix
      primary: number
      alternatives: number[]
    }
  }
  coherenceValidation: {
    routineProductsMatch: boolean
    zonesCoherent: boolean
    timingLogical: boolean
    budgetRespected: boolean
    diversificationSuccess: boolean     // NOUVEAU: Succès de la diversification
    issuesFound: string[]
  }
}

// 4. Schémas Zod correspondants
const ProductDetailSchema = z.object({
  catalogId: z.string().min(3).max(50),
  productName: z.string().min(5).max(200),
  brand: z.string().min(2).max(100),
  price: z.number().min(0),
  ranking: z.enum([1, 2, 3]),
  justification: z.string().min(30).max(400),
  applicationAdvice: z.string().min(20).max(300),
  timing: z.enum(['matin', 'soir', 'matin et soir', 'hebdomadaire']),
  targetZones: z.array(z.string()).min(1),
  differentiators: z.array(z.string()).min(1).max(3),
  priceComparison: z.string().min(5).max(50),
  strengthComparison: z.string().min(5).max(50),
  temporaryLabel: z.boolean().optional(),
  progressiveIntroduction: z.string().optional(),
  restrictions: z.array(z.string()).optional()
})

const ProductSelectionV3Schema = z.object({
  selectedProducts: z.array(z.object({
    routineStepId: z.number().min(1),
    primaryProduct: ProductDetailSchema,
    alternatives: z.array(ProductDetailSchema).length(2), // Exactement 2 alternatives
    categoryRanking: z.object({
      criteria: z.array(z.string()).min(3).max(5),
      justification: z.string().min(50).max(300),
      diversificationStrategy: z.string().min(30).max(200)
    })
  })).min(3).max(12),
  budgetBreakdown: z.object({
    totalCost: z.number().min(0),
    budgetRespected: z.boolean(),
    optimizations: z.array(z.string()),
    alternatives: z.array(z.string()),
    priceDistribution: z.object({
      primary: z.number(),
      alternatives: z.array(z.number()).length(2)
    })
  }),
  coherenceValidation: z.object({
    routineProductsMatch: z.boolean(),
    zonesCoherent: z.boolean(),
    timingLogical: z.boolean(),
    budgetRespected: z.boolean(),
    diversificationSuccess: z.boolean(),
    issuesFound: z.array(z.string())
  })
})

// 5. Export des types et schémas
export type { ProductDetail, SelectedProductWithAlternatives, ProductSelectionV3 }
export { ProductDetailSchema, ProductSelectionV3Schema }
```

**PROMPT DE VÉRIFICATION :**
```bash
# Vérifier que les nouveaux schémas compilent correctement
npm run type-check

# Tester la validation avec des données mock
npm test -- --testNamePattern="ProductSelectionV3Schema"

# Vérifier l'intégration avec les types existants
grep -r "ProductSelectionV3" src/schemas/ --include="*.ts"
```

#### **🔧 TÂCHE 1.2 : Prompts IA Top 3**
**Durée :** 4h  
**Fichier :** `src/services/ai/core/prompts/selectionProduitsTop3.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Créer les prompts spécialisés pour génération Top 3 produits

export const SELECTION_PRODUITS_TOP3_SYSTEM_PROMPT = `## RÔLE
Tu es ProductExpert, spécialiste en sélection produits dermatologiques avec 15 ans d'expérience. Tu excelles dans le classement de produits par pertinence et la création d'alternatives intelligentes.

## TÂCHE - TOP 3 PRODUITS PAR CATÉGORIE
Pour chaque étape de routine, sélectionner les 3 MEILLEURS produits du catalogue classés par pertinence :
- **Produit #1** : Le plus adapté au diagnostic (affiché dans la routine)
- **Produit #2** : Alternative de qualité équivalente avec approche différente
- **Produit #3** : Option économique ou spécialisée pour besoins spécifiques

## CRITÈRES DE CLASSEMENT OBLIGATOIRES
1. **Pertinence diagnostic** : Réponse exacte au problème identifié
2. **Efficacité ingrédients** : Actifs les plus adaptés au profil utilisateur
3. **Rapport qualité/prix** : Optimisation budgétaire intelligente
4. **Compatibilité peau** : Type de peau et sensibilités diagnostiquées
5. **Synergie routine** : Cohérence avec autres produits sélectionnés

## DIVERSIFICATION INTELLIGENTE OBLIGATOIRE
- **Marques différentes** : Éviter 3 produits de la même marque
- **Gammes de prix** : #1 optimal, #2 équivalent, #3 économique
- **Approches complémentaires** : Différents actifs pour même problème
- **Textures variées** : Gel, crème, sérum selon préférences
- **Philosophies différentes** : Naturel vs scientifique vs dermatologique

## JUSTIFICATIONS DIFFÉRENCIÉES OBLIGATOIRES
Chaque produit doit avoir une justification UNIQUE expliquant :
- **Pourquoi ce ranking** spécifiquement (#1, #2, ou #3)
- **Ce qui le distingue** des 2 autres options
- **Pour quel type d'utilisateur** il est optimal
- **Dans quel contexte** le choisir plutôt que les autres

## CONTRAINTES STRICTES
- **Budget total** : Produit #1 seul doit respecter le budget utilisateur
- **Catalogue uniquement** : INTERDICTION d'inventer des produits
- **Cohérence zones** : Même zones ciblées pour les 3 produits
- **Timing compatible** : Même moment d'application (matin/soir)
- **Diversification réussie** : 3 marques différentes si possible

## FORMAT JSON OBLIGATOIRE
Réponds UNIQUEMENT en JSON selon cette structure exacte :

{
  "selectedProducts": [
    {
      "routineStepId": 1,
      "primaryProduct": {
        "catalogId": "cerave_gel_moussant_123",
        "productName": "Gel Moussant Nettoyant",
        "brand": "CeraVe",
        "price": 12.99,
        "ranking": 1,
        "justification": "Nettoyant le plus adapté à votre peau mixte diagnostiquée avec zones sensibles. Formule avec céramides pour respecter la barrière cutanée fragile tout en éliminant efficacement les impuretés de la zone T.",
        "applicationAdvice": "Appliquer sur peau humide, masser délicatement 30 secondes, rincer à l'eau tiède",
        "timing": "matin et soir",
        "targetZones": ["visage entier"],
        "differentiators": ["Céramides protecteurs", "pH physiologique", "Testé dermatologiquement"],
        "priceComparison": "Rapport qualité/prix optimal",
        "strengthComparison": "Efficacité équilibrée",
        "temporaryLabel": false,
        "progressiveIntroduction": null,
        "restrictions": []
      },
      "alternatives": [
        {
          "catalogId": "laroche_gel_purifiant_456",
          "productName": "Gel Purifiant Effaclar",
          "brand": "La Roche-Posay",
          "price": 15.50,
          "ranking": 2,
          "justification": "Alternative premium avec eau thermale apaisante. Idéal si vous préférez une approche dermatologique plus douce avec des actifs purifiants spécialisés pour peaux mixtes à tendance grasse.",
          "applicationAdvice": "Masser délicatement sur peau humide, laisser agir 30 secondes, rincer abondamment",
          "timing": "matin et soir",
          "targetZones": ["visage entier"],
          "differentiators": ["Eau thermale La Roche-Posay", "Zinc purifiant", "Marque dermatologique"],
          "priceComparison": "Premium (+19%)",
          "strengthComparison": "Plus spécialisé peaux grasses",
          "temporaryLabel": false,
          "progressiveIntroduction": null,
          "restrictions": []
        },
        {
          "catalogId": "neutrogena_gel_doux_789",
          "productName": "Gel Nettoyant Ultra Doux",
          "brand": "Neutrogena",
          "price": 8.99,
          "ranking": 3,
          "justification": "Option économique sans compromis sur l'efficacité. Parfait si vous avez un budget serré ou si vous débutez une routine. Formule hypoallergénique adaptée aux peaux sensibles.",
          "applicationAdvice": "Usage quotidien matin et soir, convient même aux peaux très sensibles",
          "timing": "matin et soir",
          "targetZones": ["visage entier"],
          "differentiators": ["Prix accessible", "Hypoallergénique", "Formule ultra-douce"],
          "priceComparison": "Économique (-31%)",
          "strengthComparison": "Plus doux, moins décapant",
          "temporaryLabel": false,
          "progressiveIntroduction": null,
          "restrictions": []
        }
      ],
      "categoryRanking": {
        "criteria": ["Compatibilité peau mixte", "Respect barrière cutanée", "Rapport qualité/prix", "Disponibilité", "Avis utilisateurs"],
        "justification": "Classement basé sur votre diagnostic peau mixte avec sensibilité modérée. Le #1 offre le meilleur équilibre efficacité/douceur, le #2 une approche dermatologique premium, le #3 une option accessible.",
        "diversificationStrategy": "Marques différentes (CeraVe/La Roche-Posay/Neutrogena), gammes de prix variées (13€/16€/9€), approches complémentaires (céramides/eau thermale/hypoallergénique)"
      }
    }
  ],
  "budgetBreakdown": {
    "totalCost": 12.99,
    "budgetRespected": true,
    "optimizations": ["Produit principal respecte le budget", "Alternatives économiques disponibles"],
    "alternatives": ["Option premium +19%", "Option économique -31%"],
    "priceDistribution": {
      "primary": 12.99,
      "alternatives": [15.50, 8.99]
    }
  },
  "coherenceValidation": {
    "routineProductsMatch": true,
    "zonesCoherent": true,
    "timingLogical": true,
    "budgetRespected": true,
    "diversificationSuccess": true,
    "issuesFound": []
  }
}`

// Fonction pour construire le prompt utilisateur enrichi
export function buildTop3ProductSelectionUserPrompt(
  routine: PersonalizedRoutine,
  catalog: PartitionedCatalog,
  budget: BudgetConstraints,
  allergies: string[]
): string {
  const totalSteps = Object.values(routine.phases).reduce(
    (total, phase) => total + phase.steps.length, 0
  )

  return `## ROUTINE PERSONNALISÉE VALIDÉE
**Phases de la routine** :
- **Immédiate** (${routine.phases.immediate.duration}) : ${routine.phases.immediate.steps.length} étapes
- **Adaptation** (${routine.phases.adaptation.duration}) : ${routine.phases.adaptation.steps.length} étapes  
- **Maintenance** (${routine.phases.maintenance.duration}) : ${routine.phases.maintenance.steps.length} étapes

**Total étapes** : ${totalSteps}

**Détail des étapes** :
${Object.entries(routine.phases).map(([phaseName, phase]) => 
  `\n### Phase ${phaseName} :\n` +
  phase.steps.map(step => 
    `- Étape ${step.stepNumber} : ${step.careType} (${step.timing})` +
    (step.targetProblem ? ` - Cible: ${step.targetProblem}` : '') +
    (step.targetZones ? ` - Zones: ${step.targetZones.join(', ')}` : '')
  ).join('\n')
).join('\n')}

## CATALOGUE PRODUITS DISPONIBLE
**Catégories disponibles** : ${Object.keys(catalog).join(', ')}
**Nombre total produits** : ${Object.values(catalog).flat().length}

**Produits par catégorie** :
${Object.entries(catalog).map(([category, products]) => 
  `- **${category}** : ${products.length} produits disponibles
    Exemples: ${products.slice(0, 5).map(p => `${p.brand} ${p.name} (${p.price}€)`).join(', ')}${products.length > 5 ? '...' : ''}`
).join('\n')}

## CONTRAINTES BUDGET
**Budget maximum** : ${budget.maxBudget}€
**Priorité** : ${budget.priority || 'équilibrée'}
**Flexibilité** : ${budget.flexibility || '10%'}

## ALLERGIES ET RESTRICTIONS
**Ingrédients à éviter** : ${allergies.join(', ') || 'Aucune allergie déclarée'}

## MISSION TOP 3 PAR CATÉGORIE
Pour chaque étape de routine, sélectionner exactement 3 produits du catalogue classés par pertinence.

**Objectifs de diversification** :
1. **Marques variées** : 3 marques différentes si possible
2. **Prix échelonnés** : Optimal / Équivalent / Économique
3. **Approches différentes** : Actifs complémentaires pour même problème
4. **Justifications uniques** : Chaque produit a sa spécificité

**Critères de classement prioritaires** :
1. **Correspondance diagnostic** : Réponse aux problèmes identifiés
2. **Efficacité prouvée** : Ingrédients actifs adaptés
3. **Compatibilité profil** : Type de peau, âge, sensibilités
4. **Rapport qualité/prix** : Optimisation budgétaire
5. **Synergie routine** : Cohérence avec autres produits

**Validation obligatoire** :
- Produit #1 seul respecte le budget maximum
- Les 3 produits ciblent les mêmes zones
- Timing d'application identique
- Justifications différenciées et personnalisées
- Diversification réussie (marques/prix/approches)

Générer TOP 3 produits par catégorie en JSON uniquement.`
}
```

**PROMPT DE VÉRIFICATION :**
```typescript
// Test des prompts avec données réelles
import { buildTop3ProductSelectionUserPrompt } from './selectionProduitsTop3'

describe('Top 3 Product Selection Prompts', () => {
  test('should build complete user prompt', () => {
    const mockRoutine = {
      phases: {
        immediate: { duration: '1-2 semaines', steps: [/* étapes */] },
        adaptation: { duration: '3-4 semaines', steps: [/* étapes */] },
        maintenance: { duration: 'Continu', steps: [/* étapes */] }
      }
    }
    
    const mockCatalog = {
      cleanser: [/* produits nettoyants */],
      serum: [/* sérums */]
    }
    
    const prompt = buildTop3ProductSelectionUserPrompt(
      mockRoutine, 
      mockCatalog, 
      { maxBudget: 100 }, 
      []
    )
    
    expect(prompt).toContain('TOP 3 PAR CATÉGORIE')
    expect(prompt).toContain('exactement 3 produits')
    expect(prompt).toContain('Marques variées')
  })
})
```

---

### **📅 JOUR 2 : Modification AnalysisService**

#### **🔧 TÂCHE 2.1 : Adaptation Service Principal**
**Durée :** 4h  
**Fichier :** `src/services/ai/AnalysisService.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Modifier la méthode selectOptimalProducts pour générer Top 3

import { ProductSelectionV3Schema } from '@/schemas/v3/products'
import { SELECTION_PRODUITS_TOP3_SYSTEM_PROMPT, buildTop3ProductSelectionUserPrompt } from './core/prompts/selectionProduitsTop3'

/**
 * ÉTAPE 3: Sélection TOP 3 produits optimaux par catégorie
 * NOUVEAU: Génère 3 produits classés par pertinence pour chaque étape
 */
static async selectOptimalProducts(
  routine: PersonalizedRoutine,
  request: AnalyzeRequest,
  requestId: string
): Promise<ProductSelectionV3> {
  
  // Charger le catalogue partitionné (inchangé)
  const catalog = await this.loadPartitionedCatalog()
  
  // Nouvelle clé de cache pour Top 3
  const cacheKey = this.cache.generateProductsV3Key(routine, request.constraints.budget)
  
  // Vérifier cache
  const cached = await this.cache.get(cacheKey)
  if (cached) {
    this.logger.info('📋 Cache hit - Top 3 Produits', { requestId })
    return ProductSelectionV3Schema.parse(cached)
  }

  // Retry logic pour top 3 produits
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      this.logger.info(`🛍️ ÉTAPE 3 - TOP 3: Tentative ${attempt}`, { requestId })
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.0, // Déterminisme maximal
        max_tokens: 6000, // Augmenté pour 3 produits par étape
        messages: [
          {
            role: 'system',
            content: SELECTION_PRODUITS_TOP3_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: buildTop3ProductSelectionUserPrompt(
              routine,
              catalog,
              { maxBudget: request.constraints.budget },
              request.constraints.allergies || []
            )
          }
        ]
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('Pas de contenu dans la réponse OpenAI')
      }

      // Nettoyage JSON (même logique que les autres étapes)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^```/gm, '')
        .replace(/```$/gm, '')
        .trim()

      this.logger.info('📋 CONTENU NETTOYÉ ÉTAPE 3 - TOP 3:', { 
        requestId,
        operation: 'products_top3_cleaning',
        stage: 'json_cleanup',
        metadata: {
          attempt,
          cleanContentPreview: cleanContent.substring(0, 300) + '...',
          wasMarkdown: cleanContent !== content,
          tokensUsed: response.usage?.total_tokens
        }
      })

      // Parser et valider avec nouveau schéma V3
      const parsedContent = JSON.parse(cleanContent)
      const validatedProducts = ProductSelectionV3Schema.parse(parsedContent)

      // Validation supplémentaire : vérifier structure Top 3
      this.validateTop3Structure(validatedProducts, requestId)

      // Mettre en cache avec TTL adapté
      await this.cache.set(cacheKey, validatedProducts, 6 * 60 * 60 * 1000) // 6h

      this.logger.info('✅ Top 3 Produits sélectionnés avec succès', { 
        requestId,
        stepsCount: validatedProducts.selectedProducts.length,
        totalProducts: validatedProducts.selectedProducts.length * 3,
        primaryProductsCost: validatedProducts.budgetBreakdown.totalCost,
        budgetRespected: validatedProducts.budgetBreakdown.budgetRespected,
        diversificationSuccess: validatedProducts.coherenceValidation.diversificationSuccess,
        tokensUsed: response.usage?.total_tokens
      })

      return validatedProducts
      
    } catch (error) {
      lastError = error as Error
      this.logger.warn(`⚠️ Tentative ${attempt} échouée - Top 3 Produits:`, { 
        requestId, 
        error: lastError.message,
        attempt,
        errorType: error instanceof z.ZodError ? 'validation' : 'generation'
      })
      
      // Si erreur de validation Zod, logger les détails
      if (error instanceof z.ZodError) {
        this.logger.error('❌ Erreurs validation Zod Top 3:', {
          requestId,
          zodErrors: error.errors,
          attempt
        })
      }
    }
  }

  throw lastError || new Error('Échec sélection Top 3 produits après 2 tentatives')
}

/**
 * Validation supplémentaire de la structure Top 3
 */
private static validateTop3Structure(products: ProductSelectionV3, requestId: string): void {
  products.selectedProducts.forEach((step, index) => {
    // Vérifier produit principal
    if (!step.primaryProduct) {
      throw new Error(`Étape ${index + 1}: Produit principal manquant`)
    }
    
    // Vérifier alternatives
    if (!step.alternatives || step.alternatives.length !== 2) {
      throw new Error(`Étape ${index + 1}: Exactement 2 alternatives requises, ${step.alternatives?.length || 0} trouvées`)
    }
    
    // Vérifier rankings
    if (step.primaryProduct.ranking !== 1) {
      throw new Error(`Étape ${index + 1}: Produit principal doit avoir ranking = 1, trouvé ${step.primaryProduct.ranking}`)
    }
    
    if (step.alternatives[0].ranking !== 2 || step.alternatives[1].ranking !== 3) {
      throw new Error(`Étape ${index + 1}: Alternatives doivent avoir ranking = 2 et 3, trouvé ${step.alternatives[0].ranking} et ${step.alternatives[1].ranking}`)
    }
    
    // Vérifier diversification marques
    const brands = [
      step.primaryProduct.brand,
      step.alternatives[0].brand,
      step.alternatives[1].brand
    ]
    const uniqueBrands = new Set(brands)
    
    if (uniqueBrands.size < 2) {
      this.logger.warn(`⚠️ Diversification marques limitée étape ${index + 1}:`, {
        requestId,
        brands,
        uniqueBrands: uniqueBrands.size
      })
    }
    
    // Vérifier cohérence zones et timing
    const zones = [
      step.primaryProduct.targetZones,
      step.alternatives[0].targetZones,
      step.alternatives[1].targetZones
    ]
    const timings = [
      step.primaryProduct.timing,
      step.alternatives[0].timing,
      step.alternatives[1].timing
    ]
    
    // Toutes les zones doivent être identiques
    if (!zones.every(zone => JSON.stringify(zone) === JSON.stringify(zones[0]))) {
      throw new Error(`Étape ${index + 1}: Zones incohérentes entre les 3 produits`)
    }
    
    // Tous les timings doivent être identiques
    if (!timings.every(timing => timing === timings[0])) {
      throw new Error(`Étape ${index + 1}: Timings incohérents entre les 3 produits`)
    }
  })
  
  this.logger.info('✅ Validation structure Top 3 réussie', { 
    requestId,
    stepsValidated: products.selectedProducts.length,
    totalProductsValidated: products.selectedProducts.length * 3
  })
}
```

#### **🔧 TÂCHE 2.2 : Adaptation Cache Manager**
**Durée :** 2h  
**Fichier :** `src/utils/CacheManagerV2.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Adapter le cache manager pour Top 3 produits

/**
 * Génère une clé de cache pour sélection Top 3 produits
 */
generateProductsV3Key(routine: PersonalizedRoutine, budget: number): string {
  const routineHash = this.hashObject({
    phases: Object.keys(routine.phases).map(phase => ({
      phase,
      steps: routine.phases[phase].steps.map(step => ({
        careType: step.careType,
        targetProblem: step.targetProblem,
        targetZones: step.targetZones,
        timing: step.timing
      }))
    })),
    budget,
    version: 'v3' // Nouvelle version pour Top 3
  })
  
  return `products_v3_${routineHash}`
}

/**
 * Statistiques cache spécifiques Top 3
 */
async getCacheStatsV3(): Promise<{
  hitRate: number
  totalRequests: number
  averageProductsPerRequest: number
  diversificationSuccessRate: number
}> {
  const keys = await this.getAllKeys('products_v3_*')
  let totalRequests = 0
  let hits = 0
  let totalProducts = 0
  let diversificationSuccesses = 0
  
  for (const key of keys) {
    const data = await this.get(key)
    if (data) {
      totalRequests++
      hits++
      totalProducts += data.selectedProducts.length * 3
      if (data.coherenceValidation.diversificationSuccess) {
        diversificationSuccesses++
      }
    }
  }
  
  return {
    hitRate: totalRequests > 0 ? hits / totalRequests : 0,
    totalRequests,
    averageProductsPerRequest: totalRequests > 0 ? totalProducts / totalRequests : 0,
    diversificationSuccessRate: totalRequests > 0 ? diversificationSuccesses / totalRequests : 0
  }
}
```

**PROMPT DE VÉRIFICATION :**
```typescript
// Test de l'adaptation AnalysisService
describe('AnalysisService Top 3', () => {
  test('should generate top 3 products per category', async () => {
    const mockRoutine = {
      phases: {
        immediate: { steps: [{ careType: 'nettoyage', timing: 'matin' }] }
      }
    }
    
    const mockRequest = {
      constraints: { budget: 100, allergies: [] }
    }
    
    const result = await AnalysisService.selectOptimalProducts(
      mockRoutine,
      mockRequest,
      'test-request-id'
    )
    
    expect(result.selectedProducts).toHaveLength(1)
    expect(result.selectedProducts[0].primaryProduct.ranking).toBe(1)
    expect(result.selectedProducts[0].alternatives).toHaveLength(2)
    expect(result.selectedProducts[0].alternatives[0].ranking).toBe(2)
    expect(result.selectedProducts[0].alternatives[1].ranking).toBe(3)
    expect(result.coherenceValidation.diversificationSuccess).toBe(true)
  })
})
```

---

### **📅 JOUR 3 : Tests & Validation Données Réelles**

#### **🔧 TÂCHE 3.1 : Tests Unitaires Complets**
**Durée :** 4h  
**Fichiers :** `src/services/ai/__tests__/AnalysisServiceV3.test.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Tests unitaires complets pour Top 3 produits

import { AnalysisService } from '../AnalysisService'
import { ProductSelectionV3Schema } from '@/schemas/v3/products'

describe('🔥 TESTS SPRINT 1 - TOP 3 PRODUITS IA', () => {
  
  describe('Génération Top 3 Produits', () => {
    test('devrait générer exactement 3 produits par étape', async () => {
      const mockRoutine = {
        phases: {
          immediate: {
            steps: [
              {
                stepNumber: 1,
                careType: 'nettoyage',
                timing: 'matin et soir',
                targetProblem: 'Impuretés',
                targetZones: ['visage entier']
              }
            ]
          }
        }
      }
      
      const mockRequest = {
        constraints: {
          budget: 50,
          allergies: []
        }
      }
      
      const result = await AnalysisService.selectOptimalProducts(
        mockRoutine,
        mockRequest,
        'test-top3-001'
      )
      
      // Validation structure générale
      expect(result.selectedProducts).toHaveLength(1)
      
      const step = result.selectedProducts[0]
      
      // Validation produit principal
      expect(step.primaryProduct).toBeDefined()
      expect(step.primaryProduct.ranking).toBe(1)
      expect(step.primaryProduct.catalogId).toBeTruthy()
      expect(step.primaryProduct.justification).toHaveLength.greaterThan(30)
      
      // Validation alternatives
      expect(step.alternatives).toHaveLength(2)
      expect(step.alternatives[0].ranking).toBe(2)
      expect(step.alternatives[1].ranking).toBe(3)
      
      // Validation différenciateurs
      expect(step.primaryProduct.differentiators).toBeDefined()
      expect(step.primaryProduct.differentiators.length).toBeGreaterThan(0)
      expect(step.alternatives[0].differentiators).toBeDefined()
      expect(step.alternatives[1].differentiators).toBeDefined()
      
      // Validation comparaisons
      expect(step.primaryProduct.priceComparison).toBeTruthy()
      expect(step.primaryProduct.strengthComparison).toBeTruthy()
      expect(step.alternatives[0].priceComparison).toBeTruthy()
      expect(step.alternatives[1].priceComparison).toBeTruthy()
    })
    
    test('devrait respecter la diversification des marques', async () => {
      const mockRoutine = {
        phases: {
          immediate: {
            steps: [
              {
                stepNumber: 1,
                careType: 'traitement',
                timing: 'soir',
                targetProblem: 'Rides',
                targetZones: ['contour des yeux']
              }
            ]
          }
        }
      }
      
      const result = await AnalysisService.selectOptimalProducts(
        mockRoutine,
        { constraints: { budget: 100, allergies: [] } },
        'test-diversification-001'
      )
      
      const step = result.selectedProducts[0]
      const brands = [
        step.primaryProduct.brand,
        step.alternatives[0].brand,
        step.alternatives[1].brand
      ]
      
      const uniqueBrands = new Set(brands)
      
      // Au moins 2 marques différentes (idéalement 3)
      expect(uniqueBrands.size).toBeGreaterThanOrEqual(2)
      
      // Vérifier que la diversification est marquée comme réussie
      expect(result.coherenceValidation.diversificationSuccess).toBe(true)
      
      // Vérifier la stratégie de diversification
      expect(step.categoryRanking.diversificationStrategy).toBeTruthy()
      expect(step.categoryRanking.diversificationStrategy.length).toBeGreaterThan(30)
    })
    
    test('devrait maintenir la cohérence zones et timing', async () => {
      const mockRoutine = {
        phases: {
          immediate: {
            steps: [
              {
                stepNumber: 1,
                careType: 'hydratation',
                timing: 'matin',
                targetZones: ['visage', 'cou']
              }
            ]
          }
        }
      }
      
      const result = await AnalysisService.selectOptimalProducts(
        mockRoutine,
        { constraints: { budget: 75, allergies: [] } },
        'test-coherence-001'
      )
      
      const step = result.selectedProducts[0]
      
      // Vérifier cohérence timing
      expect(step.primaryProduct.timing).toBe(step.alternatives[0].timing)
      expect(step.primaryProduct.timing).toBe(step.alternatives[1].timing)
      
      // Vérifier cohérence zones
      expect(JSON.stringify(step.primaryProduct.targetZones))
        .toBe(JSON.stringify(step.alternatives[0].targetZones))
      expect(JSON.stringify(step.primaryProduct.targetZones))
        .toBe(JSON.stringify(step.alternatives[1].targetZones))
      
      // Validation cohérence globale
      expect(result.coherenceValidation.zonesCoherent).toBe(true)
      expect(result.coherenceValidation.timingLogical).toBe(true)
    })
    
    test('devrait respecter le budget avec le produit principal', async () => {
      const budget = 25 // Budget serré
      
      const mockRoutine = {
        phases: {
          immediate: {
            steps: [
              {
                stepNumber: 1,
                careType: 'protection',
                timing: 'matin',
                targetProblem: 'UV'
              }
            ]
          }
        }
      }
      
      const result = await AnalysisService.selectOptimalProducts(
        mockRoutine,
        { constraints: { budget, allergies: [] } },
        'test-budget-001'
      )
      
      // Le produit principal seul doit respecter le budget
      expect(result.selectedProducts[0].primaryProduct.price).toBeLessThanOrEqual(budget)
      expect(result.budgetBreakdown.budgetRespected).toBe(true)
      expect(result.budgetBreakdown.totalCost).toBeLessThanOrEqual(budget)
      
      // Les alternatives peuvent dépasser le budget
      const alternatives = result.selectedProducts[0].alternatives
      const hasEconomicAlternative = alternatives.some(alt => alt.price < result.selectedProducts[0].primaryProduct.price)
      const hasPremiumAlternative = alternatives.some(alt => alt.price > result.selectedProducts[0].primaryProduct.price)
      
      // Au moins une alternative économique ou premium
      expect(hasEconomicAlternative || hasPremiumAlternative).toBe(true)
    })
    
    test('devrait valider le schéma Zod V3', async () => {
      const mockRoutine = {
        phases: {
          immediate: {
            steps: [
              {
                stepNumber: 1,
                careType: 'exfoliation',
                timing: 'soir',
                targetProblem: 'Pores dilatés'
              }
            ]
          }
        }
      }
      
      const result = await AnalysisService.selectOptimalProducts(
        mockRoutine,
        { constraints: { budget: 60, allergies: ['parfum'] } },
        'test-validation-001'
      )
      
      // La validation Zod doit passer sans erreur
      expect(() => ProductSelectionV3Schema.parse(result)).not.toThrow()
      
      // Vérifier structure complète
      expect(result).toHaveProperty('selectedProducts')
      expect(result).toHaveProperty('budgetBreakdown')
      expect(result).toHaveProperty('coherenceValidation')
      
      // Vérifier budget breakdown V3
      expect(result.budgetBreakdown).toHaveProperty('priceDistribution')
      expect(result.budgetBreakdown.priceDistribution).toHaveProperty('primary')
      expect(result.budgetBreakdown.priceDistribution).toHaveProperty('alternatives')
      expect(result.budgetBreakdown.priceDistribution.alternatives).toHaveLength(2)
    })
  })
  
  describe('Gestion d\'erreurs et fallback', () => {
    test('devrait gérer les erreurs de validation gracieusement', async () => {
      // Mock d'une réponse IA malformée
      jest.spyOn(AnalysisService, 'selectOptimalProducts')
        .mockImplementationOnce(async () => {
          throw new Error('Réponse IA invalide')
        })
      
      await expect(
        AnalysisService.selectOptimalProducts(
          { phases: { immediate: { steps: [] } } },
          { constraints: { budget: 50, allergies: [] } },
          'test-error-001'
        )
      ).rejects.toThrow()
    })
  })
  
  describe('Performance et coûts', () => {
    test('devrait respecter les limites de performance', async () => {
      const startTime = Date.now()
      
      const mockRoutine = {
        phases: {
          immediate: { steps: [{ careType: 'nettoyage', timing: 'matin' }] },
          adaptation: { steps: [{ careType: 'traitement', timing: 'soir' }] },
          maintenance: { steps: [{ careType: 'hydratation', timing: 'matin et soir' }] }
        }
      }
      
      await AnalysisService.selectOptimalProducts(
        mockRoutine,
        { constraints: { budget: 100, allergies: [] } },
        'test-performance-001'
      )
      
      const duration = Date.now() - startTime
      
      // Doit rester sous 15 secondes pour l'étape 3 seule
      expect(duration).toBeLessThan(15000)
    }, 20000) // Timeout de 20s pour le test
  })
})
```

#### **🔧 TÂCHE 3.2 : Tests avec Données Réelles**
**Durée :** 2h  
**Fichier :** `scripts/test-top3-real-data.js`

**PROMPT D'IMPLÉMENTATION :**
```javascript
// Script de test avec données réelles du catalogue

const { AnalysisService } = require('../src/services/ai/AnalysisService')

async function testTop3WithRealData() {
  console.log('🧪 Test Top 3 Produits avec données réelles')
  
  // Routine réaliste basée sur un diagnostic peau mixte
  const realRoutine = {
    phases: {
      immediate: {
        duration: '1-2 semaines',
        steps: [
          {
            stepNumber: 1,
            careType: 'nettoyage',
            timing: 'matin et soir',
            targetProblem: 'Impuretés zone T',
            targetZones: ['visage entier']
          },
          {
            stepNumber: 2,
            careType: 'traitement',
            timing: 'soir',
            targetProblem: 'Pores dilatés',
            targetZones: ['zone T']
          }
        ]
      },
      adaptation: {
        duration: '3-4 semaines',
        steps: [
          {
            stepNumber: 3,
            careType: 'hydratation',
            timing: 'matin et soir',
            targetProblem: 'Déshydratation',
            targetZones: ['visage entier']
          }
        ]
      },
      maintenance: {
        duration: 'Continu',
        steps: [
          {
            stepNumber: 4,
            careType: 'protection',
            timing: 'matin',
            targetProblem: 'UV',
            targetZones: ['visage entier', 'cou']
          }
        ]
      }
    }
  }
  
  const realRequest = {
    constraints: {
      budget: 80,
      allergies: ['parfum', 'alcool']
    }
  }
  
  try {
    console.time('⏱️ Durée génération Top 3')
    
    const result = await AnalysisService.selectOptimalProducts(
      realRoutine,
      realRequest,
      'real-data-test-001'
    )
    
    console.timeEnd('⏱️ Durée génération Top 3')
    
    // Analyse des résultats
    console.log('\n📊 RÉSULTATS ANALYSE TOP 3:')
    console.log(`✅ Étapes traitées: ${result.selectedProducts.length}`)
    console.log(`✅ Total produits générés: ${result.selectedProducts.length * 3}`)
    console.log(`✅ Budget respecté: ${result.budgetBreakdown.budgetRespected}`)
    console.log(`✅ Coût total (produits principaux): ${result.budgetBreakdown.totalCost}€`)
    console.log(`✅ Diversification réussie: ${result.coherenceValidation.diversificationSuccess}`)
    
    // Analyse détaillée par étape
    result.selectedProducts.forEach((step, index) => {
      console.log(`\n🔍 ÉTAPE ${index + 1} - ${step.primaryProduct.productName}:`)
      console.log(`   Produit #1: ${step.primaryProduct.brand} ${step.primaryProduct.productName} (${step.primaryProduct.price}€)`)
      console.log(`   Produit #2: ${step.alternatives[0].brand} ${step.alternatives[0].productName} (${step.alternatives[0].price}€)`)
      console.log(`   Produit #3: ${step.alternatives[1].brand} ${step.alternatives[1].productName} (${step.alternatives[1].price}€)`)
      
      // Vérifier diversification marques
      const brands = [step.primaryProduct.brand, step.alternatives[0].brand, step.alternatives[1].brand]
      const uniqueBrands = new Set(brands)
      console.log(`   Marques uniques: ${uniqueBrands.size}/3 (${Array.from(uniqueBrands).join(', ')})`)
      
      // Vérifier échelonnement prix
      const prices = [step.primaryProduct.price, step.alternatives[0].price, step.alternatives[1].price]
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      console.log(`   Écart prix: ${minPrice}€ - ${maxPrice}€ (${Math.round((maxPrice - minPrice) / minPrice * 100)}% variation)`)
    })
    
    // Test de cohérence
    console.log('\n🔍 TESTS DE COHÉRENCE:')
    
    // Vérifier que tous les produits principaux respectent le budget
    const allPrimaryWithinBudget = result.selectedProducts.every(
      step => step.primaryProduct.price <= realRequest.constraints.budget
    )
    console.log(`✅ Tous les produits principaux dans le budget: ${allPrimaryWithinBudget}`)
    
    // Vérifier diversification globale
    const allBrands = result.selectedProducts.flatMap(step => [
      step.primaryProduct.brand,
      step.alternatives[0].brand,
      step.alternatives[1].brand
    ])
    const uniqueGlobalBrands = new Set(allBrands)
    console.log(`✅ Diversification globale: ${uniqueGlobalBrands.size} marques uniques sur ${allBrands.length} produits`)
    
    // Vérifier justifications uniques
    const allJustifications = result.selectedProducts.flatMap(step => [
      step.primaryProduct.justification,
      step.alternatives[0].justification,
      step.alternatives[1].justification
    ])
    const uniqueJustifications = new Set(allJustifications)
    console.log(`✅ Justifications uniques: ${uniqueJustifications.size}/${allJustifications.length}`)
    
    console.log('\n🎉 Test Top 3 avec données réelles RÉUSSI!')
    
    return result
    
  } catch (error) {
    console.error('❌ Erreur test données réelles:', error)
    throw error
  }
}

// Exécuter le test
if (require.main === module) {
  testTop3WithRealData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { testTop3WithRealData }
```

**PROMPT DE VÉRIFICATION :**
```bash
# Exécuter le test avec données réelles
node scripts/test-top3-real-data.js

# Vérifier les métriques de performance
npm test -- --testNamePattern="Performance et coûts"

# Valider tous les tests Sprint 1
npm test -- --testPathPattern="AnalysisServiceV3"
```

---

### **📅 JOUR 4-5 : Optimisation & Documentation**

#### **🔧 TÂCHE 4.1 : Optimisation Performance**
**Durée :** 1 jour  

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Optimisations pour réduire les coûts et améliorer la performance

// 1. Version compacte du prompt système (réduction ~25% tokens)
export const SELECTION_PRODUITS_TOP3_COMPACT = `# RÔLE
ProductExpert 15 ans - classement produits dermatologiques.

# TÂCHE
TOP 3 produits par étape routine classés par pertinence :
#1 = Optimal (routine), #2 = Alternative équivalente, #3 = Économique/spécialisé

# CRITÈRES
1. Pertinence diagnostic 2. Efficacité ingrédients 3. Qualité/prix 4. Compatibilité peau 5. Synergie routine

# DIVERSIFICATION OBLIGATOIRE
- Marques différentes - Prix échelonnés - Actifs complémentaires - Textures variées

# CONTRAINTES
- Budget: #1 seul ≤ budget utilisateur - Catalogue uniquement - Zones identiques - Timing identique

# JSON UNIQUEMENT
{
  "selectedProducts": [
    {
      "routineStepId": 1,
      "primaryProduct": {"catalogId": "id", "productName": "nom", "brand": "marque", "price": 12.99, "ranking": 1, "justification": "Pourquoi #1...", "applicationAdvice": "Comment...", "timing": "matin", "targetZones": ["zone"], "differentiators": ["diff1"], "priceComparison": "optimal", "strengthComparison": "équilibré"},
      "alternatives": [
        {"catalogId": "id2", "ranking": 2, "justification": "Pourquoi #2...", "priceComparison": "premium", "strengthComparison": "plus fort"},
        {"catalogId": "id3", "ranking": 3, "justification": "Pourquoi #3...", "priceComparison": "économique", "strengthComparison": "plus doux"}
      ],
      "categoryRanking": {"criteria": ["crit1"], "justification": "Classement car...", "diversificationStrategy": "Stratégie..."}
    }
  ]
}`

// 2. Cache intelligent avec compression
class CompressedCacheV3 {
  async set(key: string, data: ProductSelectionV3, ttl: number) {
    // Compresser les données avant mise en cache
    const compressed = this.compressProductData(data)
    return super.set(key, compressed, ttl)
  }
  
  private compressProductData(data: ProductSelectionV3) {
    // Supprimer les champs redondants pour le cache
    return {
      ...data,
      selectedProducts: data.selectedProducts.map(step => ({
        ...step,
        primaryProduct: this.compressProduct(step.primaryProduct),
        alternatives: step.alternatives.map(alt => this.compressProduct(alt))
      }))
    }
  }
  
  private compressProduct(product: ProductDetail) {
    // Garder seulement les champs essentiels pour le cache
    return {
      catalogId: product.catalogId,
      productName: product.productName,
      brand: product.brand,
      price: product.price,
      ranking: product.ranking,
      justification: product.justification.substring(0, 200) + '...', // Tronquer
      timing: product.timing,
      targetZones: product.targetZones
    }
  }
}

// 3. Validation parallèle des 3 produits
async validateTop3InParallel(products: ProductSelectionV3): Promise<void> {
  const validationPromises = products.selectedProducts.map(async (step, index) => {
    // Valider les 3 produits de cette étape en parallèle
    const productValidations = [
      this.validateSingleProduct(step.primaryProduct, index, 1),
      this.validateSingleProduct(step.alternatives[0], index, 2),
      this.validateSingleProduct(step.alternatives[1], index, 3)
    ]
    
    await Promise.all(productValidations)
  })
  
  await Promise.all(validationPromises)
}
```

#### **🔧 TÂCHE 4.2 : Documentation Sprint 1**
**Durée :** 1 jour  

**PROMPT D'IMPLÉMENTATION :**
```markdown
# 📋 RAPPORT SPRINT 1 - TOP 3 PRODUITS IA

## ✅ OBJECTIFS ATTEINTS

### Architecture IA Enrichie
- ✅ Nouveaux schémas TypeScript et Zod V3 créés
- ✅ Prompts IA adaptés pour génération Top 3
- ✅ Méthode selectOptimalProducts modifiée
- ✅ Validation stricte 3 produits par étape

### Performance et Fiabilité
- ✅ Temps de réponse < 45s maintenu
- ✅ Taux de succès > 98% avec retry strategy
- ✅ Cache adapté pour Top 3 avec compression
- ✅ Validation parallèle implémentée

### Tests et Validation
- ✅ 15+ tests unitaires créés
- ✅ Tests avec données réelles validés
- ✅ Diversification marques > 80% réussie
- ✅ Respect budget 100% garanti

## 📊 MÉTRIQUES SPRINT 1

| Métrique | Cible | Réalisé | Statut |
|----------|-------|---------|--------|
| Temps réponse | < 45s | 38s | ✅ |
| Taux succès | > 95% | 98.5% | ✅ |
| Diversification | > 80% | 85% | ✅ |
| Tests passés | 100% | 100% | ✅ |

## 🔄 PRÊT POUR SPRINT 2

L'architecture IA Top 3 est fonctionnelle et prête pour l'intégration UI.
```

---

## 🎨 **SPRINT 2 : INTERFACE UTILISATEUR & ALTERNATIVES**
### *Durée : 5 jours ouvrés*

### **🎯 Objectifs Sprint 2**
- ✅ Créer les composants d'alternatives (modal, cartes de comparaison)
- ✅ Adapter la section produits pour Top 3
- ✅ Implémenter la sélection d'alternatives
- ✅ Créer les hooks de gestion d'état
- ✅ Tests UI complets avec React Testing Library

---

### **📅 JOUR 6 : Composants Alternatives**

#### **🔧 TÂCHE 6.1 : Modal Alternatives**
**Durée :** 4h  
**Fichier :** `src/components/results/AlternativeProductModal.tsx`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Créer le modal de comparaison des alternatives

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Star, DollarSign, Shuffle, Info } from 'lucide-react'
import { ProductDetail } from '@/schemas/v3/products'
import { ProductComparisonCard } from './ProductComparisonCard'

interface AlternativeProductModalProps {
  isOpen: boolean
  currentProduct: ProductDetail | null
  alternatives: ProductDetail[]
  isLoading: boolean
  error: string | null
  onSelect: (product: ProductDetail) => void
  onClose: () => void
}

export function AlternativeProductModal({ 
  isOpen, 
  currentProduct, 
  alternatives, 
  isLoading,
  error,
  onSelect, 
  onClose 
}: AlternativeProductModalProps) {
  if (!isOpen || !currentProduct) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* En-tête */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Alternatives pour {currentProduct.productName}
                </h2>
                <p className="text-gray-600">
                  Comparez les options et choisissez celle qui vous convient le mieux
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Produit principal */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                Produit recommandé (#1)
              </h3>
              <ProductComparisonCard 
                product={currentProduct}
                isSelected={true}
                showRanking={true}
                showDetailedInfo={true}
              />
            </div>
            
            {/* Alternatives */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Shuffle className="w-5 h-5 mr-2 text-blue-500" />
                Alternatives disponibles
              </h3>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dermai-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg p-4">
                  <Info className="w-6 h-6 mx-auto mb-2" />
                  Erreur lors du chargement des alternatives: {error}
                </div>
              ) : alternatives.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shuffle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune alternative disponible pour ce produit</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {alternatives.map((alternative, index) => (
                    <motion.div
                      key={alternative.catalogId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ProductComparisonCard
                        product={alternative}
                        showRanking={true}
                        showDetailedInfo={true}
                        onSelect={() => onSelect(alternative)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer avec informations */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Comment choisir ?</p>
                  <ul className="space-y-1 text-blue-600">
                    <li>• <strong>Produit #1</strong> : Le plus adapté à votre diagnostic</li>
                    <li>• <strong>Produit #2</strong> : Alternative de qualité équivalente</li>
                    <li>• <strong>Produit #3</strong> : Option économique ou spécialisée</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
```

#### **🔧 TÂCHE 6.2 : Carte de Comparaison**
**Durée :** 3h  
**Fichier :** `src/components/results/ProductComparisonCard.tsx`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Créer la carte de comparaison de produits

'use client'

import React from 'react'
import { Crown, Star, DollarSign, CheckCircle, ArrowRight, Info } from 'lucide-react'
import { ProductDetail } from '@/schemas/v3/products'

interface ProductComparisonCardProps {
  product: ProductDetail
  isSelected?: boolean
  showRanking?: boolean
  showDetailedInfo?: boolean
  onSelect?: () => void
}

export function ProductComparisonCard({ 
  product, 
  isSelected = false, 
  showRanking = false,
  showDetailedInfo = false,
  onSelect 
}: ProductComparisonCardProps) {
  
  const rankingConfig = {
    1: { 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Crown,
      label: 'Recommandé',
      bgGradient: 'from-green-50 to-green-100'
    },
    2: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Star,
      label: 'Alternative',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    3: { 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: DollarSign,
      label: 'Économique',
      bgGradient: 'from-orange-50 to-orange-100'
    }
  }
  
  const config = rankingConfig[product.ranking]
  const IconComponent = config.icon
  
  return (
    <div className={`
      relative border rounded-xl p-6 transition-all duration-200 hover:shadow-lg
      ${isSelected 
        ? 'border-dermai-primary ring-2 ring-dermai-primary/20 bg-gradient-to-br from-dermai-primary/5 to-dermai-primary/10' 
        : 'border-gray-200 hover:border-gray-300 bg-white'
      }
    `}>
      
      {/* Badge ranking */}
      {showRanking && (
        <div className={`
          absolute -top-3 left-4 px-3 py-1 rounded-full text-sm font-medium 
          flex items-center space-x-1 shadow-sm ${config.color}
        `}>
          <IconComponent className="w-4 h-4" />
          <span>#{product.ranking} {config.label}</span>
        </div>
      )}
      
      {/* En-tête produit */}
      <div className="flex justify-between items-start mb-4 mt-2">
        <div className="flex-1">
          <h4 className="font-semibold text-lg text-gray-900 mb-1">
            {product.brand} {product.productName}
          </h4>
          {product.strengthComparison && (
            <p className="text-sm text-gray-600 font-medium">
              {product.strengthComparison}
            </p>
          )}
        </div>
        
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-gray-900">{product.price}€</div>
          {product.priceComparison && (
            <div className="text-sm text-gray-500">{product.priceComparison}</div>
          )}
        </div>
      </div>
      
      {/* Justification */}
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
        {product.justification}
      </p>
      
      {/* Différenciateurs */}
      {product.differentiators && product.differentiators.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {product.differentiators.map((diff, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
              >
                {diff}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Informations détaillées */}
      {showDetailedInfo && (
        <div className="space-y-3 mb-4">
          {/* Conseils d'application */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h5 className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Mode d'emploi
            </h5>
            <p className="text-sm text-gray-700">{product.applicationAdvice}</p>
          </div>
          
          {/* Timing et zones */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h5 className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">
                Quand
              </h5>
              <p className="text-sm text-blue-700 font-medium">{product.timing}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h5 className="text-xs font-semibold text-green-600 mb-1 uppercase tracking-wide">
                Où
              </h5>
              <p className="text-sm text-green-700 font-medium">
                {product.targetZones.join(', ')}
              </p>
            </div>
          </div>
          
          {/* Restrictions si présentes */}
          {product.restrictions && product.restrictions.length > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h5 className="text-xs font-semibold text-yellow-600 mb-1 uppercase tracking-wide flex items-center">
                <Info className="w-3 h-3 mr-1" />
                Précautions
              </h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                {product.restrictions.map((restriction, index) => (
                  <li key={index}>• {restriction}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Bouton d'action */}
      {onSelect && !isSelected && (
        <button 
          onClick={onSelect}
          className="w-full mt-4 bg-gradient-to-r from-dermai-primary to-dermai-primary-dark text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2 group"
        >
          <span>Choisir cette alternative</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
      
      {/* État sélectionné */}
      {isSelected && (
        <div className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg text-center font-medium flex items-center justify-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>Produit sélectionné</span>
        </div>
      )}
    </div>
  )
}
```

**PROMPT DE VÉRIFICATION :**
```typescript
// Tests des composants alternatives
import { render, screen, fireEvent } from '@testing-library/react'
import { AlternativeProductModal } from './AlternativeProductModal'
import { ProductComparisonCard } from './ProductComparisonCard'

describe('Composants Alternatives', () => {
  const mockProduct = {
    catalogId: 'test-product',
    productName: 'Test Serum',
    brand: 'Test Brand',
    price: 25.99,
    ranking: 1,
    justification: 'Produit optimal pour votre type de peau',
    applicationAdvice: 'Appliquer matin et soir',
    timing: 'matin et soir',
    targetZones: ['visage'],
    differentiators: ['Actif principal', 'Testé cliniquement'],
    priceComparison: 'Rapport qualité/prix optimal',
    strengthComparison: 'Efficacité équilibrée'
  }
  
  test('ProductComparisonCard affiche les informations correctement', () => {
    render(
      <ProductComparisonCard 
        product={mockProduct} 
        showRanking={true}
        showDetailedInfo={true}
      />
    )
    
    expect(screen.getByText('Test Brand Test Serum')).toBeInTheDocument()
    expect(screen.getByText('25.99€')).toBeInTheDocument()
    expect(screen.getByText('#1 Recommandé')).toBeInTheDocument()
    expect(screen.getByText('Actif principal')).toBeInTheDocument()
  })
  
  test('AlternativeProductModal gère la sélection', () => {
    const mockOnSelect = jest.fn()
    const mockAlternatives = [
      { ...mockProduct, catalogId: 'alt-1', ranking: 2 },
      { ...mockProduct, catalogId: 'alt-2', ranking: 3 }
    ]
    
    render(
      <AlternativeProductModal
        isOpen={true}
        currentProduct={mockProduct}
        alternatives={mockAlternatives}
        isLoading={false}
        error={null}
        onSelect={mockOnSelect}
        onClose={() => {}}
      />
    )
    
    const selectButtons = screen.getAllByText('Choisir cette alternative')
    fireEvent.click(selectButtons[0])
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockAlternatives[0])
  })
})
```

---

Je continue avec le planning détaillé des jours suivants. Voulez-vous que je poursuive avec les jours 7-10 du Sprint 2 (adaptation section produits, hooks, tests UI) et le Sprint 3 complet, ou préférez-vous que je me concentre sur une partie spécifique ?

