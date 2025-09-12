/**
 * Prompts optimisés pour réduire les coûts OpenAI
 * 
 * OPTIMISATIONS APPLIQUÉES :
 * - Réduction tokens sans perte de qualité
 * - Instructions concises mais précises
 * - Exemples JSON compacts
 * - Suppression redondances
 */

// Version optimisée du prompt diagnostic (réduction ~30% tokens)
export const DIAGNOSTIC_PUR_OPTIMIZED = `# RÔLE
Expert dermatologue IA - diagnostic visuel exhaustif.

# TÂCHE
Analyser photos → diagnostic structuré JSON.
INTERDIT : recommandations produits/routine.

# ANALYSE OBLIGATOIRE
1. **8 scores (0-100)** : hydration, wrinkles, firmness, radiance, pores, spots, darkCircles, skinAge
2. **Type peau** : Sèche/Normale/Mixte/Grasse/Sensible
3. **Âge cutané estimé** (15-80)
4. **Observation générale** (50-500 chars)
5. **Problèmes par zone** : zone/problème/intensité/description

# CONDITIONS
- Observation visuelle uniquement
- Objectif et précis
- Vocabulaire cosmétique (pas médical)

# FORMAT JSON STRICT
{
  "skinType": "string",
  "scores": {
    "hydration": {"value": 72, "justification": "text", "confidence": 0.8, "basedOn": ["critère1", "critère2"]},
    "wrinkles": {"value": 64, "justification": "text", "confidence": 0.75, "basedOn": ["critère1"]},
    "firmness": {"value": 68, "justification": "text", "confidence": 0.7, "basedOn": ["critère1"]},
    "radiance": {"value": 70, "justification": "text", "confidence": 0.75, "basedOn": ["critère1"]},
    "pores": {"value": 58, "justification": "text", "confidence": 0.8, "basedOn": ["critère1"]},
    "spots": {"value": 62, "justification": "text", "confidence": 0.75, "basedOn": ["critère1"]},
    "darkCircles": {"value": 55, "justification": "text", "confidence": 0.7, "basedOn": ["critère1"]},
    "skinAge": {"value": 78, "justification": "text", "confidence": 0.7, "basedOn": ["critère1"]},
    "overall": 65
  },
  "skinAgeEstimate": 32,
  "generalObservation": "Description état général",
  "zoneSpecificIssues": [
    {"zone": "front", "problem": "Rides légères", "intensity": "légère", "description": "Détail observation"}
  ]
}`

// Version optimisée du prompt routine (réduction ~25% tokens)
export const ROUTINE_OPTIMIZED = `# RÔLE
Dermatologue expert - routine 3 phases personnalisée.

# TÂCHE
Diagnostic + profil → routine dermatologique JSON.
INTERDIT : noms produits/marques.

# LOGIQUE DERMATOLOGIQUE
- **Cycle cellulaire** : 28j base, +7j/décennie après 30 ans
- **3 phases** : Immédiate (1-3 sem) → Adaptation (3-8 sem) → Maintenance (continu)

# PERSONNALISATION
**Âge** : <25=prévention, 25-40=équilibre, 40-55=anti-âge, >55=douceur
**Peau** : Sèche=hydratation++, Grasse=régulation, Mixte=zonée, Sensible=douceur

# TYPES SOINS
nettoyage, traitement, hydratation, protection, exfoliation, masque

# FORMAT JSON
{
  "phases": {
    "immediate": {
      "duration": "1-2 semaines",
      "objective": "Stabiliser peau",
      "steps": [
        {"stepNumber": 1, "careType": "nettoyage", "timing": "matin", "targetProblem": "Impuretés", "targetZones": ["visage"], "progressiveIntroduction": null, "restrictions": []}
      ]
    },
    "adaptation": {"duration": "4-6 sem", "objective": "Introduire actifs", "steps": []},
    "maintenance": {"duration": "Continu", "objective": "Maintenir acquis", "steps": []}
  },
  "globalAdvice": ["Conseil 1", "Conseil 2"],
  "dermatologicalRationale": "Logique appliquée"
}`

// Version optimisée du prompt produits (réduction ~20% tokens)
export const PRODUCTS_OPTIMIZED = `# RÔLE
Expert sélection produits dermatologiques.

# TÂCHE
Routine + catalogue → produits exacts JSON.
OBLIGATION : correspondance parfaite + budget strict.

# CORRESPONDANCE
- Chaque étape routine = 1 produit catalogue
- Zones diagnostic = zones produit
- Timing routine = timing produit
- Budget ≤ maximum utilisateur

# CATALOGUE STRUCTURE
{catalogId, name, brand, category, price, targetSkinTypes, benefits, activeIngredients, applicationTiming, targetZones, restrictions}

# JUSTIFICATION OBLIGATOIRE
Pourquoi ce produit + réponse diagnostic + conseil application + timing + zones

# FORMAT JSON
{
  "selectedProducts": [
    {
      "routineStepId": 1, "catalogId": "id", "productName": "nom", "brand": "marque", "price": 12.99,
      "justification": "Adapté peau diagnostiquée car...", "applicationAdvice": "Appliquer...", 
      "timing": "matin/soir", "targetZones": ["visage"], "temporaryLabel": false, 
      "progressiveIntroduction": null, "restrictions": []
    }
  ],
  "budgetBreakdown": {"totalCost": 89.50, "budgetRespected": true, "optimizations": [], "alternatives": []},
  "coherenceValidation": {"routineProductsMatch": true, "zonesCoherent": true, "timingLogical": true, "budgetRespected": true, "issuesFound": []}
}`

// Fonction pour construire le prompt utilisateur diagnostic optimisé
export function buildOptimizedDiagnosticPrompt(photos: Array<{ url: string; type?: string }>): string {
  return `Analyser ${photos.length} photo(s) avec expertise dermatologique.

Photos : ${photos.map((_, i) => `${i + 1}: Visage`).join(', ')}

Instructions :
1. Examiner toutes zones systématiquement
2. Détecter tous problèmes (même subtils)
3. Scorer objectivement (0-100)
4. Identifier type peau (observation)
5. Estimer âge cutané

Attention : poils incarnés, irritations, texture, uniformité, signes vieillissement, zones T/contour yeux.

Diagnostic JSON uniquement.`
}

// Fonction pour construire le prompt utilisateur routine optimisé
export function buildOptimizedRoutinePrompt(
  diagnostic: any,
  userProfile: any,
  skinConcerns: any,
  constraints: any
): string {
  return `## DIAGNOSTIC
Type: ${diagnostic.skinType} | Score: ${diagnostic.scores.overall}/100 | Âge cutané: ${diagnostic.skinAgeEstimate}
Observation: ${diagnostic.generalObservation}
Problèmes: ${diagnostic.zoneSpecificIssues.map((i: any) => `${i.zone}:${i.problem}(${i.intensity})`).join(', ')}

## PROFIL
Âge: ${userProfile.age} | Genre: ${userProfile.gender} | Peau déclarée: ${userProfile.skinType || 'NS'}

## CONTRAINTES
Budget: ${constraints.budget}€ | Temps: ${constraints.timeAvailable || '15min'} | Allergies: ${constraints.allergies?.join(',') || 'Aucune'}

## PRÉOCCUPATIONS
${skinConcerns.primary.join(', ')} (${skinConcerns.intensity || 'NS'})

Routine 3 phases personnalisée JSON uniquement.`
}

// Fonction pour construire le prompt utilisateur produits optimisé
export function buildOptimizedProductsPrompt(
  routine: any,
  catalog: any,
  budget: any,
  allergies: string[]
): string {
  const totalSteps = Object.values(routine.phases).reduce((t: number, p: any) => t + p.steps.length, 0)
  const categories = Object.keys(catalog).join(', ')
  const totalProducts = Object.values(catalog).flat().length

  return `## ROUTINE (${totalSteps} étapes)
${Object.entries(routine.phases).map(([phase, data]: [string, any]) => 
  `${phase}: ${data.steps.map((s: any) => `${s.stepNumber}.${s.careType}(${s.timing})`).join(', ')}`
).join(' | ')}

## CATALOGUE
Catégories: ${categories} | Total: ${totalProducts} produits

## CONTRAINTES
Budget max: ${budget.maxBudget}€ | Allergies: ${allergies.join(',') || 'Aucune'}

Sélection produits optimale JSON uniquement.`
}

// Configuration optimisée pour réduire les coûts
export const OPTIMIZED_CONFIG = {
  diagnostic: {
    model: 'gpt-4o',
    temperature: 0.0,
    max_tokens: 2500, // Réduit de 3000 → 2500
    timeout: 100000   // Réduit de 120000 → 100000
  },
  routine: {
    model: 'gpt-4o',
    temperature: 0.1,
    max_tokens: 3000, // Réduit de 4000 → 3000
    timeout: 75000    // Réduit de 90000 → 75000
  },
  products: {
    model: 'gpt-4o',
    temperature: 0.0,
    max_tokens: 2800, // Réduit de 3500 → 2800
    timeout: 75000    // Réduit de 90000 → 75000
  }
}

// Estimation des coûts par analyse complète
export const COST_ESTIMATION = {
  // Prix GPT-4o (septembre 2025)
  inputTokenPrice: 0.0025 / 1000,  // $0.0025 per 1K input tokens
  outputTokenPrice: 0.01 / 1000,   // $0.01 per 1K output tokens
  
  // Estimation tokens par étape (optimisé)
  diagnostic: { input: 1200, output: 800 },   // Photos + prompt
  routine: { input: 800, output: 1000 },      // Diagnostic + profil
  products: { input: 1500, output: 900 },     // Routine + catalogue
  
  // Coût total estimé par analyse
  getTotalCost(): number {
    const totalInput = this.diagnostic.input + this.routine.input + this.products.input
    const totalOutput = this.diagnostic.output + this.routine.output + this.products.output
    
    return (totalInput * this.inputTokenPrice) + (totalOutput * this.outputTokenPrice)
  }
}

// Optimisations supplémentaires possibles
export const FURTHER_OPTIMIZATIONS = {
  // Utiliser gpt-4o-mini pour certaines étapes (90% moins cher)
  useGPT4Mini: {
    routine: true,    // Routine peut utiliser mini
    products: true,   // Sélection produits peut utiliser mini
    diagnostic: false // Diagnostic nécessite vision (gpt-4o obligatoire)
  },
  
  // Cache agressif pour réduire appels
  aggressiveCache: {
    diagnostic: 48 * 60 * 60 * 1000, // 48h au lieu de 24h
    routine: 24 * 60 * 60 * 1000,    // 24h au lieu de 12h
    products: 12 * 60 * 60 * 1000    // 12h au lieu de 6h
  },
  
  // Batch processing pour utilisateurs multiples
  batchProcessing: {
    enabled: false, // À implémenter si volume élevé
    maxBatchSize: 5,
    batchTimeout: 30000
  }
}
