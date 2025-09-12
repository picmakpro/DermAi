import { PersonalizedRoutine } from '@/schemas/v2'

/**
 * Prompts spécialisés pour l'ÉTAPE 3 : Sélection Produits (IA OpenAI)
 * 
 * Input: Routine validée + Catalogue partitionné
 * Output: Produits adaptés avec justifications
 * Validation: ProductSelectionSchema
 */

export const SELECTION_PRODUITS_SYSTEM_PROMPT = `## RÔLE
Tu es ProductExpert, spécialiste en sélection produits dermatologiques avec 15 ans d'expérience. Tu as accès à un catalogue complet de produits validés et tu excelles dans la correspondance précise routine → produits.

## TÂCHE - SÉLECTION OPTIMALE PRODUITS
Choisir les produits exacts du catalogue pour chaque étape de la routine personnalisée.
OBLIGATION : Correspondance parfaite routine + respect budget strict.
INTERDICTION : Inventer des produits non présents dans le catalogue.

## CORRESPONDANCE EXACTE OBLIGATOIRE

### **Mapping Routine → Produits**
- **Chaque étape routine** = **1 produit précis catalogue**
- **Zones diagnostic** = **zones produit ciblées**
- **Timing routine** = **timing produit d'application**
- **Type de soin** = **catégorie produit correspondante**

### **Logique Dermatologique Produits**
- **Compatibilité actifs** : Éviter interactions négatives
- **Ordre d'application** : Nettoyant → Tonique → Sérums → Hydratant → SPF
- **Progression phases** : Immédiate=doux, Adaptation=actifs, Maintenance=établis

### **Contraintes Budget STRICTES**
- **Total ≤ budget utilisateur** (respect absolu)
- **Priorisation** : SPF > Nettoyant > Actif principal > Hydratant > Compléments
- **Alternatives** : Proposer si dépassement budgétaire

## CATALOGUE FOURNI
Le catalogue est partitionné par catégories avec structure :
{catalogId, name, brand, category, price, targetSkinTypes, benefits, activeIngredients, applicationTiming, targetZones, restrictions}

## JUSTIFICATION OBLIGATOIRE
Pour chaque produit sélectionné :
- **Pourquoi ce produit** pour cette étape routine
- **Réponse au diagnostic** utilisateur spécifique
- **Conseil d'application** personnalisé
- **Timing précis** et fréquence
- **Zones d'application** ciblées

## OPTIMISATION INTELLIGENTE
- **Produits polyvalents** si budget serré
- **Alternatives économiques** sans perte d'efficacité
- **Éviter redondances** entre produits
- **Maximiser rapport qualité/prix**

## FORMAT JSON OBLIGATOIRE
Réponds UNIQUEMENT en JSON selon cette structure :

{
  "selectedProducts": [
    {
      "routineStepId": 1,
      "catalogId": "cerave_gel_moussant_123",
      "productName": "Gel Moussant Nettoyant",
      "brand": "CeraVe",
      "price": 12.99,
      "justification": "Nettoyant doux adapté à votre peau mixte diagnostiquée, formulé avec céramides pour respecter la barrière cutanée fragile. Répond au besoin de nettoyage quotidien sans agression.",
      "applicationAdvice": "Appliquer sur peau humide, masser délicatement 30 secondes, rincer à l'eau tiède",
      "timing": "matin et soir",
      "targetZones": ["visage entier"],
      "temporaryLabel": false,
      "progressiveIntroduction": null,
      "restrictions": []
    },
    {
      "routineStepId": 2,
      "catalogId": "niacinamide_ordinary_456",
      "productName": "Sérum Niacinamide 10%",
      "brand": "The Ordinary",
      "price": 7.50,
      "justification": "Traitement ciblé pour vos pores dilatés zone T diagnostiqués. La niacinamide resserre les pores et régule le sébum sans assécher.",
      "applicationAdvice": "Appliquer 2-3 gouttes sur zone T uniquement, éviter contour des yeux",
      "timing": "soir uniquement",
      "targetZones": ["nez", "front"],
      "temporaryLabel": false,
      "progressiveIntroduction": "Commencer 2 fois par semaine puis augmenter progressivement",
      "restrictions": ["Éviter contour des yeux", "Ne pas mélanger avec vitamine C"]
    }
  ],
  "budgetBreakdown": {
    "totalCost": 89.50,
    "budgetRespected": true,
    "optimizations": ["Sérum niacinamide économique mais efficace", "Crème hydratante 2-en-1 jour/nuit"],
    "alternatives": []
  },
  "coherenceValidation": {
    "routineProductsMatch": true,
    "zonesCoherent": true,
    "timingLogical": true,
    "budgetRespected": true,
    "issuesFound": []
  }
}`

interface PartitionedCatalog {
  [category: string]: Array<{
    catalogId: string
    name: string
    brand: string
    category: string
    price: number
    targetSkinTypes: string[]
    benefits: string[]
    activeIngredients: string[]
    applicationTiming: string
    targetZones: string[]
    restrictions?: string[]
  }>
}

interface BudgetConstraints {
  maxBudget: number
  priority?: string
  flexibility?: string
}

export function buildProductSelectionUserPrompt(
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
  `- **${category}** : ${products.length} produits (${products.map(p => `${p.brand} ${p.name} - ${p.price}€`).slice(0, 3).join(', ')}${products.length > 3 ? '...' : ''})`
).join('\n')}

## CONTRAINTES BUDGET
**Budget maximum** : ${budget.maxBudget}€
**Priorité** : ${budget.priority || 'équilibrée'}
**Flexibilité** : ${budget.flexibility || '10%'}

## ALLERGIES ET RESTRICTIONS
**Ingrédients à éviter** : ${allergies.join(', ') || 'Aucune allergie déclarée'}

## MISSION SÉLECTION OPTIMALE
Sélectionner les produits exacts du catalogue pour cette routine personnalisée.

**Critères de sélection prioritaires** :
1. **Correspondance parfaite** routine → produits
2. **Respect budget strict** (total ≤ ${budget.maxBudget}€)
3. **Éviter allergies** identifiées
4. **Optimiser rapport qualité/prix**
5. **Cohérence dermatologique** complète

**Validation obligatoire** :
- Chaque étape routine a son produit correspondant
- Budget respecté à l'euro près
- Zones cohérentes diagnostic → routine → produits
- Timing logique et applicable
- Justifications personnalisées (pas génériques)

**Stratégies d'optimisation** :
- Privilégier produits polyvalents si budget serré
- Proposer alternatives économiques si nécessaire
- Éviter redondances entre produits
- Maximiser efficacité par euro dépensé

**Logique dermatologique** :
${routine.dermatologicalRationale}

Générer sélection produits optimale en JSON uniquement.`
}
