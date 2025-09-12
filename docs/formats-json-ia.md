# 📋 FORMATS JSON IA - DOCUMENTATION TECHNIQUE

> **SPRINT 3 - FORMATS PROMPTS STABLES**  
> *Version : 3.0 - 12 septembre 2025*  
> *Formats JSON documentés et stables pour A/B testing*

---

## 🎯 **OBJECTIF**

Cette documentation définit les formats JSON stables pour les outputs IA de DermAI V2, permettant :
- **Validation runtime stricte** avec schémas Zod
- **A/B testing des prompts** sans casser le parsing
- **Fallback algorithmique** robuste
- **Cohérence garantie** entre routine et produits

---

## 📐 **ARCHITECTURE FORMATS STABLES**

### **Principe de Séparation**

```typescript
interface StableFormat {
  structure: FixedStructure    // ❌ Ne change JAMAIS (parsing)
  content: VariableContent     // ✅ A/B testable (prompts)
  metadata: ValidationData     // 🔍 Tracking et validation
}
```

### **Avantages**
- **Parsing robuste** : Structure fixe garantit le parsing
- **Flexibilité prompts** : Contenu variable pour optimisation
- **Validation stricte** : Schémas Zod complets
- **Fallback sûr** : Templates algorithmiques de secours

---

## 🧬 **FORMAT ROUTINE PERSONNALISÉE**

### **Structure JSON Complète**

```json
{
  "version": "3.0",
  "format": "routine_personnalisee_complete",
  "personalizationSummary": "Routine personnalisée pour [profil utilisateur]...",
  "phases": {
    "immediate": {
      "phase": "immediate",
      "duration": "1-2 semaines",
      "description": "Phase de stabilisation...",
      "objectives": ["Nettoyer en douceur", "Hydrater quotidiennement"],
      "steps": [
        {
          "stepNumber": 1,
          "category": "cleansing",
          "phase": "immediate",
          "timing": "both",
          "title": "Nettoyage doux quotidien",
          "description": "Nettoyage matin et soir...",
          "personalizedAdvice": "Utilisez un gel nettoyant...",
          "frequency": "Matin et soir",
          "dermatologicalReason": "Le nettoyage quotidien...",
          "expectedResults": "Peau propre et préparée...",
          "catalogId": "cerave_gel_moussant",
          "productRequirements": {
            "category": "cleanser",
            "potency": "low",
            "ingredients": ["ceramides", "hyaluronic-acid"],
            "priceRange": { "min": 10, "max": 20 }
          }
        }
      ],
      "educationalContent": {
        "phaseExplanation": "Cette phase vise à...",
        "expectedTimeline": "Résultats visibles en 1-2 semaines",
        "successIndicators": ["Peau moins irritée", "Texture améliorée"],
        "commonMistakes": ["Utiliser trop de produit"]
      }
    },
    "adaptation": { /* Structure identique */ },
    "maintenance": { /* Structure identique */ }
  },
  "globalAdvice": [
    "Respectez l'ordre d'application des produits",
    "Soyez patient, les résultats apparaissent progressivement"
  ],
  "educationalContent": {
    "skinTypeExplanation": "Votre type de peau...",
    "routineRationale": "Cette routine est conçue pour...",
    "progressExpectations": "Vous devriez voir...",
    "maintenanceAdvice": "Pour maintenir les résultats..."
  },
  "metadata": {
    "generatedAt": "2025-09-12T10:30:00Z",
    "promptVersion": "v3.2-optimized",
    "modelUsed": "gpt-4o",
    "validationStatus": "valid",
    "coherenceScore": 92,
    "totalSteps": 8,
    "estimatedDuration": "6-8 semaines"
  },
  "coherenceValidation": {
    "phasesCoherent": true,
    "stepsProgressive": true,
    "timingLogical": true,
    "categoriesBalanced": true,
    "issuesFound": []
  }
}
```

### **Champs A/B Testables**

| Champ | Type | A/B Testable | Description |
|-------|------|--------------|-------------|
| `personalizationSummary` | string | ✅ | Ton, style, longueur |
| `description` | string | ✅ | Explication des phases |
| `title` | string | ✅ | Noms des étapes |
| `personalizedAdvice` | string | ✅ | Conseils personnalisés |
| `educationalContent` | object | ✅ | Contenu éducatif |
| `globalAdvice` | array | ✅ | Conseils généraux |

### **Champs Fixes (Non A/B Testables)**

| Champ | Type | Fixe | Description |
|-------|------|------|-------------|
| `version` | string | ❌ | Version du format |
| `format` | string | ❌ | Type de format |
| `stepNumber` | number | ❌ | Numérotation étapes |
| `category` | enum | ❌ | Catégorie technique |
| `phase` | enum | ❌ | Phase de routine |
| `timing` | enum | ❌ | Moment application |

---

## 🛍️ **FORMAT SÉLECTION PRODUITS**

### **Structure JSON Complète**

```json
{
  "version": "3.0",
  "format": "product_selection_complete",
  "selectionSummary": "Sélection de 6 produits adaptés à votre profil...",
  "selectedProducts": [
    {
      "routineStepId": 1,
      "catalogId": "cerave_gel_moussant",
      "phase": "immediate",
      "category": "cleansing",
      "productName": "Gel Moussant Nettoyant",
      "brand": "CeraVe",
      "price": 12.99,
      "justification": "Nettoyant doux formulé avec des céramides...",
      "applicationAdvice": "Appliquez sur peau humide...",
      "dermatologicalReason": "Les céramides aident à restaurer...",
      "timing": "both",
      "frequency": "Matin et soir",
      "targetZones": ["visage"],
      "alternatives": ["la_roche_posay_toleriane"],
      "compatibilityNotes": "Compatible avec tous les actifs",
      "selectionConfidence": 0.95,
      "expectedResults": "Peau propre sans tiraillement"
    }
  ],
  "justifications": [
    {
      "catalogId": "cerave_gel_moussant",
      "mainReason": "Produit de référence pour nettoyage quotidien",
      "dermatologicalBasis": "Formulé avec céramides essentiels...",
      "userSpecificBenefit": "Convient à votre type de peau sensible",
      "expectedResults": "Nettoyage efficace sans dessèchement",
      "usageInstructions": "Utilisez matin et soir sur peau humide",
      "scientificEvidence": ["Étude clinique CeraVe 2023"],
      "contraindications": [],
      "confidenceLevel": "high",
      "alternativeOptions": ["la_roche_posay_toleriane"]
    }
  ],
  "globalUsageAdvice": [
    "Commencez toujours par le nettoyage",
    "Respectez les temps de pause entre produits"
  ],
  "budgetBreakdown": {
    "totalCost": 89.50,
    "budgetRespected": true,
    "costOptimizations": ["Produit 2-en-1 hydratant/sérum"],
    "alternativesForBudget": [
      {
        "originalCatalogId": "skinceuticals_ce_ferulic",
        "alternativeCatalogId": "ordinary_vitamin_c",
        "savings": 120.00,
        "reason": "Alternative efficace à prix accessible"
      }
    ]
  },
  "selectionFactors": {
    "primaryCriteria": ["Efficacité", "Tolérance", "Budget"],
    "budgetConstraints": "Budget 100€/mois respecté",
    "dermatologicalPriorities": ["Hydratation", "Anti-âge préventif"],
    "userPreferences": ["Marques dermatologiques", "Textures légères"]
  },
  "metadata": {
    "generatedAt": "2025-09-12T10:35:00Z",
    "promptVersion": "v3.2-products",
    "modelUsed": "gpt-4o",
    "validationStatus": "valid",
    "totalProducts": 6,
    "averagePrice": 14.92
  },
  "qualityMetrics": {
    "routineCompleteness": 95,
    "budgetEfficiency": 88,
    "dermatologicalSoundness": 92,
    "userPersonalization": 90,
    "overallCoherenceScore": 91
  },
  "coherenceValidation": {
    "routineProductsMatch": true,
    "budgetRespected": true,
    "zonesCoherent": true,
    "timingLogical": true,
    "issuesFound": []
  }
}
```

---

## 🧪 **A/B TESTING - GUIDE PRATIQUE**

### **1. Identification des Variables Testables**

```typescript
// Variables A/B testables dans les prompts
const AB_TESTABLE_ELEMENTS = {
  routine: {
    tone: ['professionnel', 'bienveillant', 'expert'],
    detail_level: ['concis', 'détaillé', 'très_détaillé'],
    personalization: ['générique', 'modéré', 'hyper_personnalisé'],
    educational_content: ['minimal', 'standard', 'complet']
  },
  products: {
    justification_style: ['scientifique', 'pratique', 'émotionnel'],
    price_sensitivity: ['budget', 'qualité', 'premium'],
    brand_preference: ['dermatologique', 'naturel', 'mixte']
  }
}
```

### **2. Structure Prompts A/B**

```typescript
// Template prompt avec variables A/B
const PROMPT_TEMPLATE = {
  base: "Tu es un expert dermatologue...",
  variables: {
    tone_A: "Adopte un ton professionnel et précis",
    tone_B: "Adopte un ton bienveillant et rassurant",
    detail_A: "Sois concis et va à l'essentiel",
    detail_B: "Fournis des explications détaillées"
  },
  structure_fixed: "Réponds OBLIGATOIREMENT au format JSON suivant..."
}
```

### **3. Métriques A/B Testing**

```typescript
interface ABTestMetrics {
  // Métriques techniques
  validation_success_rate: number    // % de validations réussies
  parsing_error_rate: number        // % d'erreurs de parsing
  fallback_activation_rate: number  // % d'activation fallback
  
  // Métriques qualité
  coherence_score: number           // Score cohérence routine-produits
  personalization_score: number    // Score personnalisation
  user_satisfaction: number        // Satisfaction utilisateur
  
  // Métriques business
  conversion_rate: number           // Taux conversion produits
  engagement_time: number          // Temps engagement interface
  return_usage: number             // Taux retour utilisateur
}
```

### **4. Implémentation A/B Testing**

```typescript
// Service A/B Testing
class ABTestingService {
  async getPromptVariant(userId: string, testName: string): Promise<PromptVariant> {
    // Logique attribution variant A/B
    const variant = this.assignVariant(userId, testName)
    return this.getPromptTemplate(testName, variant)
  }
  
  async trackResult(userId: string, testName: string, metrics: ABTestMetrics) {
    // Tracking résultats pour analyse
    await this.analytics.track('ab_test_result', {
      userId,
      testName,
      variant: this.getUserVariant(userId, testName),
      metrics
    })
  }
}
```

---

## 🔧 **VALIDATION RUNTIME**

### **Pipeline de Validation**

```typescript
// Processus validation complet
const validationPipeline = async (aiOutput: any) => {
  // 1. Nettoyage JSON
  const cleaned = sanitizeAndParseJSON(aiOutput)
  
  // 2. Validation Zod
  const validation = validateRoutineOutput(cleaned)
  
  // 3. Retry si échec (max 3 tentatives)
  if (!validation.isValid) {
    return await retryWithBackoff(aiOutput)
  }
  
  // 4. Validation cohérence
  const coherence = validateCoherence(validation.data)
  
  // 5. Fallback si nécessaire
  if (!coherence.isCoherent) {
    return generateFallbackTemplate()
  }
  
  return validation.data
}
```

### **Gestion d'Erreurs**

| Type d'Erreur | Action | Retry | Fallback |
|---------------|--------|-------|----------|
| JSON malformé | Nettoyage + parsing | ✅ | ✅ |
| Validation Zod | Retry avec prompt modifié | ✅ | ✅ |
| Cohérence | Validation croisée | ❌ | ✅ |
| Timeout | Retry avec timeout étendu | ✅ | ✅ |
| Rate limit | Backoff exponentiel | ✅ | ✅ |

---

## 📊 **MÉTRIQUES DE QUALITÉ**

### **Scores de Validation**

```typescript
interface QualityMetrics {
  // Validation technique
  parsing_success: boolean          // JSON parsé avec succès
  zod_validation: boolean          // Schéma Zod respecté
  structure_integrity: number      // Intégrité structure (0-100)
  
  // Cohérence métier
  routine_coherence: number        // Cohérence interne routine
  product_matching: number         // Correspondance routine-produits
  budget_respect: number          // Respect contraintes budget
  
  // Personnalisation
  user_specificity: number        // Spécificité utilisateur
  educational_value: number       // Valeur éducative
  actionability: number          // Caractère actionnable
  
  // Score global
  overall_quality: number         // Score global (0-100)
}
```

### **Seuils de Qualité**

| Métrique | Minimum | Optimal | Action si < Minimum |
|----------|---------|---------|-------------------|
| `parsing_success` | 100% | 100% | Retry obligatoire |
| `zod_validation` | 100% | 100% | Retry obligatoire |
| `routine_coherence` | 80% | 90% | Validation manuelle |
| `product_matching` | 85% | 95% | Retry recommandé |
| `overall_quality` | 75% | 85% | Fallback si < 60% |

---

## 🚀 **EXEMPLES D'UTILISATION**

### **Validation Simple**

```typescript
import { validateRoutineOutput } from '@/schemas/routineFormats'

const result = validateRoutineOutput(aiResponse)
if (result.isValid) {
  console.log('✅ Routine valide:', result.data)
} else {
  console.error('❌ Erreurs:', result.errors)
}
```

### **Pipeline Complet avec Retry**

```typescript
import { validationPipeline } from '@/utils/ValidationPipeline'

const validatedResult = await validationPipeline.retryOnValidationError(
  aiFunction,
  prompt,
  'routine'
)

if (validatedResult.isValid) {
  console.log(`✅ Validation réussie (${validatedResult.attempts} tentatives)`)
  console.log(`Source: ${validatedResult.source}`) // 'ai' ou 'fallback'
}
```

### **A/B Testing**

```typescript
// Test variant A vs B
const variantA = await generateRoutineWithPrompt(promptA, userProfile)
const variantB = await generateRoutineWithPrompt(promptB, userProfile)

// Comparer métriques
const metricsA = calculateQualityMetrics(variantA)
const metricsB = calculateQualityMetrics(variantB)

console.log('Variant A score:', metricsA.overall_quality)
console.log('Variant B score:', metricsB.overall_quality)
```

---

## 📚 **RESSOURCES**

### **Fichiers Associés**
- `src/schemas/routineFormats.ts` - Schémas Zod complets
- `src/utils/ValidationPipeline.ts` - Pipeline validation
- `src/services/ai/__tests__/validation.test.ts` - Tests validation

### **Documentation Technique**
- [Architecture Fiabilité](./architecture-fiabilite.md)
- [Diagnostic Technique Complet](./diagnostic-technique-complet.md)
- [Planning Exécution Refonte](./planning-execution-refonte-routines.md)

---

*Documentation Formats JSON IA - DermAI V2*  
*Sprint 3 : Formats Prompts Stables*  
*Version 3.0 - 12 septembre 2025*
