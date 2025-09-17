# 🎯 SPÉCIFICATION TECHNIQUE - Top 3 Produits par Catégorie

> **Version :** 1.0  
> **Date :** 17 septembre 2025  
> **Statut :** En développement  
> **Priorité :** Haute - Amélioration UX et conversion majeure

## 🎯 **OBJECTIF PRINCIPAL**

Enrichir l'étape 3 (Sélection Produits IA) pour générer un top 3 de produits classés par pertinence pour chaque catégorie, tout en conservant la simplicité de la routine personnalisée (1 produit principal + 2 alternatives intelligentes).

## 📋 **CAHIER DES CHARGES FONCTIONNEL**

### **Exigences CEO Confirmées**
1. ✅ **Routine inchangée** : Toujours 1 produit prioritaire par étape (simplicité préservée)
2. ✅ **IA enrichie** : Génération de 3 produits classés par pertinence (#1, #2, #3)
3. ✅ **Alternatives intelligentes** : 2 produits supplémentaires avec justifications différenciées
4. ✅ **Validation stricte** : Tous les produits issus du catalogue interne (pas d'invention)
5. ✅ **Monétisation optimisée** : 3x plus d'opportunités de conversion par catégorie

### **Fonctionnalités Détaillées**

#### **1. Architecture IA Enrichie - Étape 3**
- **Input** : Routine personnalisée + Catalogue partitionné (inchangé)
- **Output** : Top 3 produits par catégorie avec classement justifié
- **Validation** : Nouveau schéma Zod `ProductSelectionV3Schema`
- **Performance** : <45s pour analyse complète (vs 30s actuellement)

#### **2. Classement Intelligent par l'IA**
```typescript
interface ProductRanking {
  ranking: 1 | 2 | 3
  justification: string
  criteria: string[]
  differentiators: string[]
}

// Exemple de classement
const productRanking = {
  "#1": "Le plus adapté - Affiché dans la routine",
  "#2": "Alternative de qualité équivalente", 
  "#3": "Option économique ou spécialisée"
}
```

#### **3. Critères de Classement IA**
1. **Pertinence diagnostic** : Réponse exacte au problème identifié
2. **Efficacité ingrédients** : Actifs les plus adaptés au profil
3. **Rapport qualité/prix** : Optimisation budgétaire intelligente
4. **Compatibilité peau** : Type de peau et sensibilités spécifiques
5. **Synergie routine** : Cohérence avec autres produits sélectionnés

#### **4. Diversification Automatique**
- **Marques différentes** : Éviter 3 produits de la même marque
- **Gammes de prix** : #1 optimal, #2 équivalent, #3 économique
- **Approches complémentaires** : Différents actifs pour même problème
- **Textures variées** : Gel, crème, sérum selon préférences utilisateur

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **1. Modifications Étape 3 - Sélection Produits IA**

#### **Interface TypeScript Enrichie**
```typescript
// AVANT (actuel)
interface SelectedProduct {
  routineStepId: number
  catalogId: string
  productName: string
  brand: string
  price: number
  justification: string
  applicationAdvice: string
  timing: string
  targetZones: string[]
}

// APRÈS (nouveau)
interface SelectedProductWithAlternatives {
  routineStepId: number
  primaryProduct: ProductDetail      // Produit #1 (routine)
  alternatives: ProductDetail[]      // Produits #2 et #3
  categoryRanking: {
    criteria: string[]               // Critères de classement utilisés
    justification: string            // Explication du classement
    diversificationStrategy: string  // Stratégie de diversification
  }
}

interface ProductDetail {
  catalogId: string
  productName: string
  brand: string
  price: number
  ranking: 1 | 2 | 3
  justification: string              // Justification spécifique au ranking
  applicationAdvice: string
  timing: string
  targetZones: string[]
  differentiators: string[]          // Ce qui le distingue des autres
  priceComparison: string           // "Plus économique", "Premium", etc.
  strengthComparison: string        // "Plus doux", "Plus puissant", etc.
  temporaryLabel?: boolean
  progressiveIntroduction?: string
  restrictions?: string[]
}
```

#### **Nouveaux Schémas Zod de Validation**
```typescript
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
```

### **2. Prompts IA Enrichis**

#### **Prompt Système Top 3**
```typescript
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

## JUSTIFICATIONS DIFFÉRENCIÉES
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

## FORMAT JSON OBLIGATOIRE
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
```

#### **Prompt Utilisateur Enrichi**
```typescript
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

### **3. Services Modifiés**

#### **AnalysisService.ts - Méthode Enrichie**
```typescript
/**
 * ÉTAPE 3: Sélection TOP 3 produits optimaux par catégorie
 */
static async selectOptimalProducts(
  routine: PersonalizedRoutine,
  request: AnalyzeRequest,
  requestId: string
): Promise<ProductSelectionV3> {
  
  const catalog = await this.loadPartitionedCatalog()
  
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

      // Nettoyage JSON
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
          wasMarkdown: cleanContent !== content
        }
      })

      // Parser et valider avec nouveau schéma
      const parsedContent = JSON.parse(cleanContent)
      const validatedProducts = ProductSelectionV3Schema.parse(parsedContent)

      // Validation supplémentaire : vérifier que chaque étape a exactement 3 produits
      validatedProducts.selectedProducts.forEach((step, index) => {
        if (!step.primaryProduct) {
          throw new Error(`Étape ${index + 1}: Produit principal manquant`)
        }
        if (!step.alternatives || step.alternatives.length !== 2) {
          throw new Error(`Étape ${index + 1}: Exactement 2 alternatives requises, ${step.alternatives?.length || 0} trouvées`)
        }
        
        // Vérifier que les rankings sont corrects
        if (step.primaryProduct.ranking !== 1) {
          throw new Error(`Étape ${index + 1}: Produit principal doit avoir ranking = 1`)
        }
        if (step.alternatives[0].ranking !== 2 || step.alternatives[1].ranking !== 3) {
          throw new Error(`Étape ${index + 1}: Alternatives doivent avoir ranking = 2 et 3`)
        }
      })

      // Mettre en cache
      await this.cache.set(cacheKey, validatedProducts, 6 * 60 * 60 * 1000) // 6h

      this.logger.info('✅ Top 3 Produits sélectionnés', { 
        requestId,
        stepsCount: validatedProducts.selectedProducts.length,
        totalProducts: validatedProducts.selectedProducts.length * 3,
        totalCost: validatedProducts.budgetBreakdown.totalCost,
        budgetRespected: validatedProducts.budgetBreakdown.budgetRespected,
        diversificationSuccess: validatedProducts.coherenceValidation.diversificationSuccess
      })

      return validatedProducts
      
    } catch (error) {
      lastError = error as Error
      this.logger.warn(`⚠️ Tentative ${attempt} échouée - Top 3 Produits:`, { 
        requestId, 
        error: lastError.message,
        attempt 
      })
    }
  }

  throw lastError || new Error('Échec sélection Top 3 produits après 2 tentatives')
}
```

### **4. Composants UI Nouveaux**

#### **AlternativeProductModal.tsx**
```typescript
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Alternatives pour {currentProduct.productName}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Produit principal */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-500" />
              Produit recommandé (#1)
            </h3>
            <ProductComparisonCard 
              product={currentProduct}
              isSelected={true}
              showRanking={true}
            />
          </div>
          
          {/* Alternatives */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dermai-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Erreur lors du chargement des alternatives: {error}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Shuffle className="w-5 h-5 mr-2 text-blue-500" />
                Alternatives disponibles
              </h3>
              
              {alternatives.map((alternative, index) => (
                <ProductComparisonCard
                  key={alternative.catalogId}
                  product={alternative}
                  showRanking={true}
                  onSelect={() => onSelect(alternative)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### **ProductComparisonCard.tsx**
```typescript
interface ProductComparisonCardProps {
  product: ProductDetail
  isSelected?: boolean
  showRanking?: boolean
  onSelect?: () => void
}

export function ProductComparisonCard({ 
  product, 
  isSelected = false, 
  showRanking = false,
  onSelect 
}: ProductComparisonCardProps) {
  const rankingConfig = {
    1: { 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Crown,
      label: 'Recommandé'
    },
    2: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Star,
      label: 'Alternative'
    },
    3: { 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: DollarSign,
      label: 'Économique'
    }
  }
  
  const config = rankingConfig[product.ranking]
  const IconComponent = config.icon
  
  return (
    <div className={`
      border rounded-xl p-4 transition-all duration-200
      ${isSelected ? 'border-dermai-primary ring-2 ring-dermai-primary/20' : 'border-gray-200 hover:border-gray-300'}
    `}>
      <div className="flex justify-between items-start mb-3">
        {showRanking && (
          <div className={`
            px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1
            ${config.color}
          `}>
            <IconComponent className="w-4 h-4" />
            <span>#{product.ranking} {config.label}</span>
          </div>
        )}
        
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{product.price}€</div>
          {product.priceComparison && (
            <div className="text-sm text-gray-500">{product.priceComparison}</div>
          )}
        </div>
      </div>
      
      <div className="mb-3">
        <h4 className="font-semibold text-lg text-gray-900">
          {product.brand} {product.productName}
        </h4>
        {product.strengthComparison && (
          <p className="text-sm text-gray-600 mt-1">{product.strengthComparison}</p>
        )}
      </div>
      
      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
        {product.justification}
      </p>
      
      {/* Différenciateurs */}
      {product.differentiators && product.differentiators.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {product.differentiators.map((diff, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
              >
                {diff}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Conseils d'application */}
      <div className="text-xs text-gray-600 mb-3">
        <strong>Application :</strong> {product.applicationAdvice}
      </div>
      
      {onSelect && !isSelected && (
        <button 
          onClick={onSelect}
          className="w-full mt-3 bg-dermai-primary text-white py-2 px-4 rounded-lg hover:bg-dermai-primary-dark transition-colors font-medium"
        >
          Choisir cette alternative
        </button>
      )}
      
      {isSelected && (
        <div className="w-full mt-3 bg-green-100 text-green-800 py-2 px-4 rounded-lg text-center font-medium">
          ✓ Produit sélectionné
        </div>
      )}
    </div>
  )
}
```

## 📁 **FICHIERS IMPACTÉS**

### **Nouveaux Fichiers à Créer**
```
src/schemas/v3/
├── products.ts                         # Nouveaux schémas ProductSelectionV3
└── index.ts                           # Export des schémas V3

src/services/ai/core/prompts/
├── selectionProduitsTop3.ts           # Prompts spécialisés Top 3
└── optimizedPromptsV3.ts              # Versions optimisées

src/components/results/
├── AlternativeProductModal.tsx        # Modal de comparaison alternatives
├── ProductComparisonCard.tsx          # Carte de comparaison produit
└── ProductRankingIndicator.tsx        # Indicateur de ranking (#1, #2, #3)

src/hooks/
├── useAlternativeSelection.ts         # Hook sélection alternatives
└── useProductRanking.ts               # Hook gestion rankings

src/utils/
├── productRankingHelpers.ts           # Utilitaires ranking
└── alternativeComparison.ts           # Logique de comparaison
```

### **Fichiers à Modifier**
```
src/services/ai/AnalysisService.ts     # Méthode selectOptimalProducts enrichie
src/schemas/v2/products.ts             # Extension pour compatibilité V3
src/components/results/EnhancedProductsSection.tsx  # Intégration alternatives
src/utils/CacheManagerV2.ts            # Cache adapté pour 3 produits
src/types/index.ts                     # Types étendus pour V3
```

## 🔐 **SÉCURITÉ ET PERFORMANCE**

### **Sécurité**
- **Validation stricte** : Schéma Zod renforcé pour 3 produits par étape
- **Catalogue uniquement** : Impossible d'inventer des produits (validation existante)
- **Budget respecté** : Produit principal seul doit respecter le budget
- **Cohérence garantie** : Validation croisée des 3 produits par catégorie

### **Performance**
- **Cache intelligent** : Clé de cache adaptée pour Top 3 (routine + budget + alternatives)
- **Tokens optimisés** : Prompts compacts mais précis (+30% tokens maximum)
- **Validation rapide** : Schémas Zod optimisés pour 3 produits
- **Parallélisation** : Validation des 3 produits en parallèle quand possible

### **Coûts OpenAI**
- **Estimation** : +30% de tokens par analyse (3 produits vs 1)
- **Mitigation** : Cache agressif (6h) + prompts optimisés
- **ROI** : 3x plus d'opportunités de conversion compensent le surcoût

## 📊 **MÉTRIQUES ET ANALYTICS**

### **Métriques Techniques**
- Temps de génération Top 3 par étape
- Taux de succès validation 3 produits
- Performance cache alternatives
- Taux d'erreur schéma V3

### **Métriques Business**
- Taux d'utilisation alternatives (#2 et #3)
- Conversion par ranking (1 vs 2 vs 3)
- Impact sur panier moyen
- Diversification marques réussie

### **Événements Analytics**
```typescript
// Nouveaux événements à tracker
'top3_products_generated'
'alternative_product_viewed'
'alternative_product_selected'
'ranking_comparison_made'
'price_comparison_influenced'
'brand_diversification_success'
```

## ⚠️ **POINTS DE VIGILANCE**

### **Risques Techniques**
1. **Performance dégradée** : +30% temps de réponse avec 3 produits
2. **Complexité validation** : 3x plus de validations par étape
3. **Cache invalidation** : Gestion cache plus complexe
4. **UI surchargée** : Risque de surcharge cognitive utilisateur

### **Mitigation**
1. **Optimisation prompts** : Réduction tokens sans perte de qualité
2. **Validation parallèle** : Traitement simultané des 3 produits
3. **Cache stratégique** : Clés optimisées pour hit rate élevé
4. **UI progressive** : Révélation alternatives sur demande

## 🎯 **CRITÈRES DE SUCCÈS**

### **Fonctionnels**
- ✅ Génération systématique de 3 produits classés par étape
- ✅ Diversification réussie (marques/prix/approches) > 80%
- ✅ Justifications différenciées et pertinentes
- ✅ Respect budget avec produit principal uniquement

### **Techniques**
- ✅ Temps de réponse < 45s (vs 30s actuellement)
- ✅ Taux de succès génération > 98%
- ✅ Cache hit rate > 80%
- ✅ Validation Zod 100% réussie

### **Business**
- ✅ Utilisation alternatives > 25% des utilisateurs
- ✅ Conversion produits +40% (3x plus d'options)
- ✅ Diversification marques +60%
- ✅ Satisfaction utilisateur > 4.5/5

---

**Document de référence pour l'implémentation du Top 3 Produits par Catégorie dans DermAI V2**

*Prochaine étape : Planning d'exécution détaillé avec prompts opérationnels*
