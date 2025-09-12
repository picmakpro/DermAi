# 📅 PLANNING EXÉCUTION - REFONTE IA COMPLÈTE

> **REFONTE MAJEURE - ARCHITECTURE IA-FIRST PURE**  
> *Version : 2.0 - 12 septembre 2025*  
> *Durée : 3 semaines (15 jours ouvrés)*

---

## 🎯 **VUE D'ENSEMBLE DU PLANNING**

### **Objectif Global**
Transformer l'architecture hybride actuelle (1 IA + 2 algorithmes) en architecture IA-First pure (4 étapes 100% IA) pour atteindre 95% de personnalisation.

### **Métriques de Succès**
- **Personnalisation** : 20% → 95% (routines différentes)
- **Cohérence** : 60% → 90% (diagnostic-routine-produits)  
- **Performance** : <45s latence P95
- **Fiabilité** : 98% taux de succès

---

## 📊 **PLANNING DÉTAILLÉ PAR SEMAINE**

### **🚀 SEMAINE 1 : FONDATIONS IA-FIRST**

#### **Jour 1-2 : Refonte Service Principal**
**Tâches :**
- [ ] Créer `AnalysisServiceV2` avec architecture 4 étapes
- [ ] Implémenter chaînage séquentiel des appels IA
- [ ] Migrer la logique de retry par étape
- [ ] Tests unitaires de base

**Prompts Opérationnels :**
```bash
# Création service principal
mkdir -p src/services/ai/v2
touch src/services/ai/v2/AnalysisServiceV2.ts
touch src/services/ai/v2/__tests__/AnalysisServiceV2.test.ts

# Structure de base
interface AnalysisServiceV2 {
  static analyzeSkinComplete(request: AnalyzeRequest): Promise<CompleteAnalysisV2>
  static performPureDiagnostic(photos: Photo[]): Promise<PureDiagnostic>
  static generatePersonalizedRoutine(diagnostic: PureDiagnostic, profile: UserProfile): Promise<PersonalizedRoutine>
  static selectOptimalProducts(routine: PersonalizedRoutine, catalog: PartitionedCatalog): Promise<ProductSelection>
  static assembleAndValidate(diagnostic: PureDiagnostic, routine: PersonalizedRoutine, products: ProductSelection): Promise<CompleteAnalysisV2>
}
```

#### **Jour 3-4 : Nouveaux Schémas Zod**
**Tâches :**
- [ ] Créer `PureDiagnosticSchema` (étape 1)
- [ ] Créer `PersonalizedRoutineSchema` (étape 2)  
- [ ] Créer `ProductSelectionSchema` (étape 3)
- [ ] Créer `CompleteAnalysisV2Schema` (étape 4)
- [ ] Tests de validation complets

**Prompts Opérationnels :**
```typescript
// src/schemas/v2/index.ts
export const PureDiagnosticSchema = z.object({
  skinType: z.string(),
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
  skinAgeEstimate: z.number().min(15).max(80),
  generalObservation: z.string().min(50).max(500),
  zoneSpecificIssues: z.array(ZoneIssueSchema)
})
```

#### **Jour 5 : Prompts Spécialisés Étape 1**
**Tâches :**
- [ ] Créer prompt diagnostic pur (photos uniquement)
- [ ] Optimiser pour détection exhaustive
- [ ] Tests avec vraies photos
- [ ] Validation outputs

**Prompts Opérationnels :**
```typescript
// src/services/ai/v2/prompts/diagnosticPur.ts
export const DIAGNOSTIC_PUR_SYSTEM_PROMPT = `
## RÔLE
Expert dermatologue IA spécialisé en diagnostic visuel exhaustif.

## TÂCHE - DIAGNOSTIC PUR
Analyser UNIQUEMENT les photos pour établir un diagnostic complet.
INTERDICTION : Aucune recommandation de produits ou routine.

## ANALYSE EXHAUSTIVE OBLIGATOIRE
1. **SCORES DÉTAILLÉS** (8 critères sur 100)
2. **TYPE DE PEAU** (observation visuelle)
3. **ÂGE CUTANÉ** (estimation vs âge réel)
4. **OBSERVATION GÉNÉRALE** (état global)
5. **PROBLÈMES PAR ZONE** (localisation précise)

## FORMAT JSON STRICT
Répondre UNIQUEMENT en JSON selon PureDiagnosticSchema.
`
```

### **🔧 SEMAINE 2 : INTÉGRATION COMPLÈTE**

#### **Jour 6-7 : Prompts Étapes 2 & 3**
**Tâches :**
- [ ] Créer prompt routine personnalisée (étape 2)
- [ ] Créer prompt sélection produits (étape 3)
- [ ] Implémenter chaînage des inputs/outputs
- [ ] Tests d'intégration

**Prompts Opérationnels :**
```typescript
// Étape 2 : Routine personnalisée
export const ROUTINE_PERSONNALISEE_SYSTEM_PROMPT = `
## RÔLE
Expert dermatologue avec 15 ans d'expérience en routine personnalisée.

## TÂCHE - ROUTINE 3 PHASES
Créer routine dermatologique basée sur diagnostic + profil utilisateur.

## INPUT
- Diagnostic validé (étape 1)
- Profil utilisateur (âge, type peau, contraintes)

## LOGIQUE DERMATOLOGIQUE STRICTE
- Phase Immédiate (1-3 sem) : Stabiliser + traiter urgent
- Phase Adaptation (3-8 sem) : Introduire actifs progressifs
- Phase Maintenance (continu) : Maintenir + prévention

## FORMAT JSON STRICT
Répondre selon PersonalizedRoutineSchema.
INTERDICTION : Mentionner des produits spécifiques.
`

// Étape 3 : Sélection produits
export const SELECTION_PRODUITS_SYSTEM_PROMPT = `
## RÔLE
Expert sélection produits dermatologiques avec accès catalogue complet.

## TÂCHE - SÉLECTION OPTIMALE
Choisir produits précis pour chaque étape de routine.

## INPUT
- Routine validée (étape 2)
- Catalogue partitionné par catégories
- Contraintes budget utilisateur

## CORRESPONDANCE EXACTE
- Chaque étape routine = 1 produit catalogue
- Zones diagnostic = zones produit
- Timing routine = timing produit
- Budget respecté strictement

## FORMAT JSON STRICT
Répondre selon ProductSelectionSchema.
`
```

#### **Jour 8-9 : Cache Multi-Niveaux**
**Tâches :**
- [ ] Implémenter cache par étape
- [ ] Optimiser clés de cache
- [ ] Tests de performance
- [ ] Monitoring cache hits

**Prompts Opérationnels :**
```typescript
// src/utils/CacheManagerV2.ts
interface CacheStrategyV2 {
  diagnostic: {
    keyGenerator: (photos: Photo[]) => string
    ttl: 24 * 60 * 60 * 1000 // 24h
    compression: true
  }
  routine: {
    keyGenerator: (diagnostic: PureDiagnostic, profile: UserProfile) => string
    ttl: 12 * 60 * 60 * 1000 // 12h
    compression: true
  }
  products: {
    keyGenerator: (routine: PersonalizedRoutine, budget: Budget) => string
    ttl: 6 * 60 * 60 * 1000 // 6h
    compression: true
  }
}
```

#### **Jour 10 : Assemblage & Validation**
**Tâches :**
- [ ] Implémenter étape 4 (assemblage)
- [ ] Validation cohérence inter-étapes
- [ ] Formatage pour UI
- [ ] Tests complets

### **🎯 SEMAINE 3 : VALIDATION & OPTIMISATION**

#### **Jour 11-12 : Tests E2E Complets**
**Tâches :**
- [ ] Tests avec vrais utilisateurs
- [ ] Validation métriques cibles
- [ ] Optimisations performance
- [ ] Debug et corrections

**Prompts de Vérification :**
```typescript
// Tests de validation
describe('Refonte IA Complète E2E', () => {
  it('devrait générer des routines différentes pour diagnostics différents', async () => {
    const photo1 = loadTestPhoto('acne_severe.jpg')
    const photo2 = loadTestPhoto('skin_perfect.jpg')
    
    const result1 = await AnalysisServiceV2.analyzeSkinComplete({photos: [photo1], ...mockProfile})
    const result2 = await AnalysisServiceV2.analyzeSkinComplete({photos: [photo2], ...mockProfile})
    
    // Vérifier différenciation
    expect(result1.routine.phases.immediate.steps).not.toEqual(result2.routine.phases.immediate.steps)
    expect(result1.products.selectedProducts).not.toEqual(result2.products.selectedProducts)
  })
  
  it('devrait maintenir cohérence diagnostic-routine-produits', async () => {
    const result = await AnalysisServiceV2.analyzeSkinComplete(mockRequest)
    
    // Vérifier cohérence
    const coherenceScore = validateCoherence(result.diagnostic, result.routine, result.products)
    expect(coherenceScore).toBeGreaterThan(90)
  })
})
```

#### **Jour 13-14 : Optimisations Finales**
**Tâches :**
- [ ] Optimisation prompts (réduction tokens)
- [ ] Parallélisation où possible
- [ ] Monitoring avancé
- [ ] Documentation finale

#### **Jour 15 : Déploiement & Validation**
**Tâches :**
- [ ] Migration progressive (feature flag)
- [ ] Tests production
- [ ] Monitoring intensif
- [ ] Validation métriques

---

## 🔧 **PROMPTS DE MISE EN PLACE**

### **Prompt Initialisation Projet**
```bash
# 1. Créer structure V2
mkdir -p src/services/ai/v2/{prompts,__tests__}
mkdir -p src/schemas/v2
mkdir -p src/utils/v2

# 2. Créer fichiers principaux
touch src/services/ai/v2/AnalysisServiceV2.ts
touch src/services/ai/v2/prompts/{diagnosticPur,routinePersonnalisee,selectionProduits}.ts
touch src/schemas/v2/{diagnostic,routine,products,complete}.ts
touch src/utils/v2/CacheManagerV2.ts

# 3. Installer dépendances si nécessaire
npm install --save-dev @types/jest playwright
```

### **Prompt Configuration Tests**
```typescript
// jest.config.v2.js
module.exports = {
  ...require('./jest.config.js'),
  testMatch: ['**/v2/**/*.test.ts'],
  collectCoverageFrom: [
    'src/services/ai/v2/**/*.ts',
    'src/schemas/v2/**/*.ts',
    'src/utils/v2/**/*.ts'
  ]
}
```

---

## 🔍 **PROMPTS DE VÉRIFICATION**

### **Vérification Architecture**
```bash
# Vérifier structure créée
find src -name "*v2*" -type f | head -10

# Vérifier imports
grep -r "AnalysisServiceV2" src/ | wc -l

# Vérifier schémas Zod
grep -r "PureDiagnosticSchema" src/schemas/v2/
```

### **Vérification Fonctionnelle**
```typescript
// Script de test rapide
import { AnalysisServiceV2 } from '@/services/ai/v2/AnalysisServiceV2'

async function testRefonteIA() {
  const mockRequest = createMockRequest()
  
  console.log('🧪 Test Refonte IA Complète...')
  
  try {
    const result = await AnalysisServiceV2.analyzeSkinComplete(mockRequest)
    
    console.log('✅ Diagnostic:', result.diagnostic.skinType)
    console.log('✅ Routine phases:', Object.keys(result.routine.phases))
    console.log('✅ Produits sélectionnés:', result.products.selectedProducts.length)
    console.log('✅ Cohérence score:', result.coherenceValidation.overallScore)
    
    return true
  } catch (error) {
    console.error('❌ Erreur refonte:', error.message)
    return false
  }
}
```

---

## 🐛 **PROMPTS DE DEBUG**

### **Debug Étape par Étape**
```typescript
// Debug diagnostic
const diagnostic = await AnalysisServiceV2.performPureDiagnostic(photos)
console.log('🔍 Diagnostic brut:', JSON.stringify(diagnostic, null, 2))

// Debug routine
const routine = await AnalysisServiceV2.generatePersonalizedRoutine(diagnostic, profile)
console.log('🧬 Routine générée:', JSON.stringify(routine, null, 2))

// Debug produits
const products = await AnalysisServiceV2.selectOptimalProducts(routine, catalog)
console.log('🛍️ Produits sélectionnés:', JSON.stringify(products, null, 2))
```

### **Debug Performance**
```typescript
// Mesurer performance par étape
const startTime = performance.now()

const diagnostic = await AnalysisServiceV2.performPureDiagnostic(photos)
console.log(`⏱️ Étape 1: ${performance.now() - startTime}ms`)

const routine = await AnalysisServiceV2.generatePersonalizedRoutine(diagnostic, profile)
console.log(`⏱️ Étape 2: ${performance.now() - startTime}ms`)

// etc...
```

### **Debug Cohérence**
```typescript
// Vérifier cohérence inter-étapes
function debugCoherence(diagnostic, routine, products) {
  console.log('🔍 Debug Cohérence:')
  
  // Zones cohérentes ?
  const diagnosticZones = diagnostic.zoneSpecificIssues.map(z => z.zone)
  const routineZones = routine.phases.immediate.steps.flatMap(s => s.targetZones || [])
  console.log('Zones diagnostic:', diagnosticZones)
  console.log('Zones routine:', routineZones)
  
  // Problèmes traités ?
  const diagnosticProblems = diagnostic.zoneSpecificIssues.map(z => z.problem)
  const routineProblems = routine.phases.immediate.steps.map(s => s.targetProblem).filter(Boolean)
  console.log('Problèmes diagnostic:', diagnosticProblems)
  console.log('Problèmes routine:', routineProblems)
}
```

---

## 📊 **TABLEAU DE BORD PROGRESSION**

| Semaine | Tâches | Statut | Métriques |
|---------|--------|--------|-----------|
| **S1** | Fondations IA-First | 🔄 En cours | Architecture 4 étapes |
| **S2** | Intégration Complète | ⏳ Planifié | Cache + Prompts |
| **S3** | Validation & Optimisation | ⏳ Planifié | Tests E2E + Perf |

### **Métriques Temps Réel**
- **Personnalisation** : `___%` (cible: 95%)
- **Cohérence** : `___%` (cible: 90%)
- **Performance** : `___s` (cible: <45s)
- **Fiabilité** : `___%` (cible: 98%)

---

*Planning Exécution Refonte IA Complète - DermAI V2*  
*Version 2.0 - Architecture IA-First Pure*  
*12 septembre 2025*
