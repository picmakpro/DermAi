# 🏗️ Architecture Fiabilité DermAI V2

## Vue d'ensemble

Cette documentation détaille l'architecture de fiabilité mise en place pour garantir la stabilité, la reproductibilité et la robustesse du système d'analyse dermatologique IA de DermAI V2.

---

## 🎯 **OBJECTIFS DE FIABILITÉ**

### **Objectifs Quantifiés**
- **Reproductibilité** : 95% de résultats identiques pour mêmes inputs
- **Disponibilité** : 99.5% uptime avec fallback gracieux
- **Performance** : <30s latence P95, <2% taux d'erreur
- **Cohérence** : 90% cohérence diagnostic ↔ produits ↔ routine

### **Principes Fondamentaux**
1. **Déterminisme** : Éliminer toute variabilité non contrôlée
2. **Validation** : Vérifier tous les inputs/outputs à chaque étape
3. **Observabilité** : Traçabilité complète des opérations
4. **Résilience** : Dégradation gracieuse en cas d'erreur

---

## 🔧 **ARCHITECTURE TECHNIQUE**

### **Logique 2 Étapes Optimisée**

```typescript
interface AnalysisFlow {
  // ÉTAPE 1: Diagnostic déterministe
  diagnostic: {
    model: "gpt-4o-vision"
    temperature: 0.0
    seed: generateSeed(imageHashes)
    validation: DiagnosticSchema
    retryConfig: RetryConfig
  }
  
  // ÉTAPE 2: Sélection produits cohérente
  productSelection: {
    input: ValidatedDiagnostic
    catalogValidation: CatalogSchema
    budgetConstraints: UserConstraints
    validation: ProductSchema
  }
  
  // ÉTAPE 3: Génération routine (algorithmique)
  routineGeneration: {
    algorithm: "deterministic"
    phaseLogic: DermatologicalPhases
    personalization: UserProfile
  }
}
```

### **Validation Multi-Niveaux**

#### **Niveau 1 : Validation d'Entrée**
```typescript
const InputValidationSchema = z.object({
  photos: z.array(PhotoSchema).min(1).max(5),
  userProfile: z.object({
    age: z.number().min(13).max(99),
    gender: z.enum(['Homme', 'Femme', 'Autre', 'Ne souhaite pas préciser']),
    skinType: z.enum(['Sèche', 'Normale', 'Mixte', 'Grasse', 'Sensible'])
  }),
  skinConcerns: z.object({
    primary: z.array(z.string()).min(1).max(3)
  })
})
```

#### **Niveau 2 : Validation Outputs IA**
```typescript
const DiagnosticOutputSchema = z.object({
  scores: z.object({
    hydration: ScoreDetailSchema,
    wrinkles: ScoreDetailSchema,
    firmness: ScoreDetailSchema,
    radiance: ScoreDetailSchema,
    pores: ScoreDetailSchema,
    spots: ScoreDetailSchema,
    darkCircles: ScoreDetailSchema,
    skinAge: ScoreDetailSchema,
    overall: z.number().min(0).max(100)
  }),
  beautyAssessment: BeautyAssessmentSchema
})
```

#### **Niveau 3 : Validation Cohérence**
```typescript
function validateCoherence(
  diagnostic: DiagnosticResult, 
  products: ProductResult
): CoherenceResult {
  const issues: string[] = []
  
  // Vérifier correspondance zones
  const diagnosticZones = new Set(diagnostic.concernedZones)
  const productZones = new Set(products.targetZones)
  
  if (!hasOverlap(diagnosticZones, productZones)) {
    issues.push('Incohérence zones diagnostic vs produits')
  }
  
  // Vérifier correspondance intensité
  if (diagnostic.intensity === 'intense' && 
      !products.some(p => p.potency === 'high')) {
    issues.push('Intensité élevée mais produits doux')
  }
  
  return { coherent: issues.length === 0, issues }
}
```

---

## ⚠️ **GESTION D'ERREURS ROBUSTE**

### **Stratégie de Retry Intelligente**

```typescript
interface RetryConfig {
  maxAttempts: number
  timeoutMs: number
  baseDelayMs: number
  maxDelayMs: number
  validator?: (result: any) => boolean
}

const RETRY_CONFIGS = {
  diagnostic: {
    maxAttempts: 3,
    timeoutMs: 120000,
    baseDelayMs: 2000,
    maxDelayMs: 10000,
    validator: (result) => result?.scores?.overall !== undefined
  },
  productSelection: {
    maxAttempts: 2,
    timeoutMs: 60000,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
    validator: (result) => result?.routine?.immediate?.length > 0
  }
}
```

### **Classification d'Erreurs**

```typescript
enum ErrorType {
  VALIDATION_ERROR = 'validation',
  NETWORK_ERROR = 'network',
  TIMEOUT_ERROR = 'timeout',
  RATE_LIMIT_ERROR = 'rate_limit',
  AUTHENTICATION_ERROR = 'auth',
  PARSING_ERROR = 'parsing'
}

function shouldRetry(error: Error, attempt: number): boolean {
  const errorType = classifyError(error)
  
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
    case ErrorType.AUTHENTICATION_ERROR:
      return false // Ne pas retry
      
    case ErrorType.NETWORK_ERROR:
    case ErrorType.TIMEOUT_ERROR:
    case ErrorType.RATE_LIMIT_ERROR:
    case ErrorType.PARSING_ERROR:
      return attempt < 3 // Retry jusqu'à 3 fois
      
    default:
      return false
  }
}
```

### **Fallback Maîtrisé**

```typescript
interface FallbackResult<T> {
  data: T
  source: 'primary' | 'fallback'
  degraded: boolean
  primaryError?: string
  confidence: number
}

class FallbackStrategy {
  static generateDiagnosticFallback(request: AnalyzeRequest): DiagnosticResult {
    const ageGroup = this.getAgeGroup(request.userProfile.age)
    const skinProfile = this.getSkinTypeProfile(request.userProfile.skinType)
    const concernsProfile = this.getConcernsProfile(request.skinConcerns.primary)
    
    return {
      scores: this.generateStatisticalScores(ageGroup, skinProfile, concernsProfile),
      beautyAssessment: this.generateReasonableAssessment(request),
      confidence: 0.3, // Clairement marqué comme faible confiance
      source: 'statistical_fallback',
      degraded: true
    }
  }
}
```

---

## 📊 **MONITORING ET OBSERVABILITÉ**

### **Métriques Critiques**

```typescript
interface ReliabilityMetrics {
  // Fiabilité
  successRate: number // > 98%
  consistencyScore: number // > 95%
  fallbackRate: number // < 5%
  
  // Performance
  avgLatency: number // < 25s
  p95Latency: number // < 45s
  timeoutRate: number // < 2%
  
  // Qualité
  parsingErrorRate: number // < 0.1%
  validationErrorRate: number // < 0.5%
  coherenceScore: number // > 90%
}
```

### **Logging Structuré**

```typescript
interface AnalysisLog {
  requestId: string
  timestamp: Date
  stage: 'input' | 'diagnostic' | 'products' | 'output'
  duration_ms: number
  success: boolean
  error?: ErrorDetails
  metadata: {
    photosCount: number
    userAge: number
    skinType: string
    concerns: string[]
    retryAttempt?: number
    fallbackUsed?: boolean
  }
  performance: {
    tokensUsed: number
    apiLatency: number
    memoryUsage: number
  }
}
```

### **Alerting Intelligent**

```typescript
const CRITICAL_ALERTS = [
  {
    name: 'HIGH_ERROR_RATE',
    condition: 'error_rate_5min > 10%',
    severity: 'critical',
    notification: 'pagerduty'
  },
  {
    name: 'INCONSISTENT_RESULTS',
    condition: 'consistency_score_1h < 85%',
    severity: 'medium',
    notification: 'slack'
  },
  {
    name: 'API_TIMEOUT_SPIKE',
    condition: 'timeout_rate_15min > 5%',
    severity: 'high',
    notification: 'slack'
  }
]
```

---

## 🧪 **TESTS ET VALIDATION**

### **Tests Unitaires**

```typescript
describe('AnalysisService Reliability', () => {
  it('should produce consistent results', async () => {
    const request = createMockRequest()
    
    const results = await Promise.all([
      AnalysisService.analyzeSkin(request),
      AnalysisService.analyzeSkin(request),
      AnalysisService.analyzeSkin(request)
    ])
    
    // Vérifier cohérence des scores (±2 points)
    const scores = results.map(r => r.scores.overall)
    const maxDiff = Math.max(...scores) - Math.min(...scores)
    expect(maxDiff).toBeLessThan(2)
  })
  
  it('should validate all outputs', async () => {
    const result = await AnalysisService.analyzeSkin(createMockRequest())
    
    expect(() => DiagnosticOutputSchema.parse(result)).not.toThrow()
    expect(result.scores.overall).toBeGreaterThan(0)
    expect(result.beautyAssessment.mainConcern).toBeDefined()
  })
})
```

### **Tests d'Intégration E2E**

```typescript
test('complete user journey with reliability checks', async ({ page }) => {
  // Upload photos
  await page.goto('/upload')
  await page.setInputFiles('[data-testid="photo-upload"]', 'tests/fixtures/face.jpg')
  
  // Complete questionnaire
  await completeQuestionnaire(page)
  
  // Start analysis
  await page.click('[data-testid="start-analysis"]')
  
  // Wait for results with timeout
  await expect(page.locator('[data-testid="results"]')).toBeVisible({ timeout: 45000 })
  
  // Verify result quality
  const overallScore = await page.locator('[data-testid="overall-score"]').textContent()
  expect(parseInt(overallScore)).toBeGreaterThan(0)
  
  // Verify routine coherence
  const routineSteps = await page.locator('[data-testid="routine-step"]').count()
  expect(routineSteps).toBeGreaterThan(3)
})
```

---

## 🚀 **DÉPLOIEMENT ET PRODUCTION**

### **Configuration Vercel Optimisée**

```json
{
  "functions": {
    "src/app/api/analyze/route.ts": {
      "maxDuration": 35,
      "memory": 1024,
      "regions": ["iad1"]
    }
  },
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "ENABLE_FALLBACK": "true",
    "LOG_LEVEL": "info"
  }
}
```

### **Monitoring Production**

```typescript
// Dashboard métriques temps réel
const ProductionDashboard = {
  reliability: {
    uptime: '99.8%',
    errorRate: '0.3%',
    consistencyScore: '96.2%'
  },
  performance: {
    avgLatency: '18.5s',
    p95Latency: '42.1s',
    throughput: '45 req/min'
  },
  quality: {
    parsingErrors: '0.05%',
    coherenceScore: '92.1%',
    fallbackUsage: '2.1%'
  }
}
```

---

## 📈 **AMÉLIORATION CONTINUE**

### **Feedback Loop**

```typescript
interface QualityFeedback {
  analysisId: string
  userSatisfaction: number // 1-5
  diagnosticAccuracy: number // 1-5
  productRelevance: number // 1-5
  routineClarity: number // 1-5
  comments?: string
}

class QualityImprovement {
  static async processFeedback(feedback: QualityFeedback) {
    // Analyser patterns de feedback
    const patterns = await this.analyzeFeedbackPatterns(feedback)
    
    // Identifier améliorations prompts
    if (patterns.diagnosticAccuracy < 4.0) {
      await this.flagForPromptImprovement(feedback.analysisId)
    }
    
    // Ajuster algorithmes
    if (patterns.productRelevance < 4.0) {
      await this.adjustProductSelection(feedback)
    }
  }
}
```

### **A/B Testing**

```typescript
interface PromptVariant {
  id: string
  name: string
  prompt: string
  weight: number // % traffic
  metrics: {
    successRate: number
    consistencyScore: number
    userSatisfaction: number
  }
}

class PromptOptimization {
  static async runABTest(variants: PromptVariant[], duration: number) {
    // Distribuer traffic selon weights
    // Collecter métriques par variant
    // Analyser significance statistique
    // Promouvoir meilleur variant
  }
}
```

---

---

## 🚀 **REFONTE MAJEURE V2 (12 septembre 2025)**

### **🎯 Transition vers Architecture IA-First Pure**

**PROBLÈME IDENTIFIÉ :**
- Architecture hybride actuelle : 1 étape IA + 2 étapes algorithmiques
- Résultat : 80% des outputs identiques malgré photos différentes
- Personnalisation limitée par les algorithmes fixes

**SOLUTION : 4 ÉTAPES 100% IA**

```typescript
// NOUVELLE ARCHITECTURE V2
interface AnalysisFlowV2 {
  step1_pureDiagnostic: AIOpenAI     // Photos → Diagnostic structuré
  step2_personalizedRoutine: AIOpenAI // Diagnostic + Profil → Routine 3 phases
  step3_productSelection: AIOpenAI    // Routine + Catalogue → Produits adaptés
  step4_finalAssembly: Algorithmic   // Assemblage + Validation cohérence
}
```

### **📊 Métriques Cibles Refonte**
- **Personnalisation** : 20% → 95% (routines différentes)
- **Cohérence** : 60% → 90% (diagnostic-routine-produits)
- **Engagement** : +150% (routines vraiment adaptées)
- **Conversion** : +80% (produits parfaitement ciblés)

### **📄 Documentation Refonte**
**Référence Officielle :** [diagnostic-technique-refonte-ia-complete.md](./diagnostic-technique-refonte-ia-complete.md)
- Architecture détaillée 4 étapes IA pures
- Schémas de validation Zod spécialisés
- Planning d'implémentation (3 semaines)
- Prompts opérationnels par étape

---

*Documentation Architecture Fiabilité DermAI V2*  
*Dernière mise à jour : 12 septembre 2025 - Refonte IA Complète*
