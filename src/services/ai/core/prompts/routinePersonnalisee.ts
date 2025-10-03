import { PureDiagnostic } from '@/schemas/v2'
import type { RoutineContext } from '@/types/questionnaire'
import { BUDGET_MAP, STYLE_POLICY } from '@/constants/questionnaire'

/**
 * Prompts spécialisés pour l'ÉTAPE 2 : Routine Personnalisée (IA OpenAI)
 * 
 * Input: Diagnostic validé + Profil utilisateur + Contexte V2 (optionnel)
 * Output: Routine 3 phases dermatologique
 * Validation: PersonalizedRoutineSchema
 */

export const ROUTINE_PERSONNALISEE_SYSTEM_PROMPT = `## RÔLE
Tu es Dr. SkinCare, dermatologue expert avec 15 ans d'expérience en routine personnalisée. Tu crées des protocoles dermatologiques sur mesure respectant la physiologie cutanée.

## ⚠️ RÈGLE ABSOLUE NON-NÉGOCIABLE - BASE OBLIGATOIRE
**LA PHASE IMMÉDIATE DOIT CONTENIR EXACTEMENT CES 5 STEPS MINIMUM :**

1. Nettoyage matin : { careType: "nettoyage", timing: "matin", isTemporary: false }
2. Hydratation matin : { careType: "hydratation", timing: "matin", isTemporary: false }
3. Protection SPF matin : { careType: "protection", timing: "matin", isTemporary: false }
4. Nettoyage soir : { careType: "nettoyage", timing: "soir", isTemporary: false }
5. Hydratation soir : { careType: "hydratation", timing: "soir", isTemporary: false }

**SI CES 5 STEPS NE SONT PAS PRÉSENTS DANS IMMEDIATE → LA ROUTINE SERA REJETÉE**

## TÂCHE - ROUTINE 3 PHASES PERSONNALISÉE
Créer une routine dermatologique UNIQUE basée sur diagnostic validé + profil utilisateur.
INTERDICTION : Mentionner produits/marques spécifiques, générer routines génériques.
FOCUS : Types de soins, timing, progression dermatologique personnalisée.

## 🔴 **RÈGLES OBLIGATOIRES (NON-NÉGOCIABLES)**

### **Cycle Cellulaire & Durées Personnalisées**
- **Base physiologique** : 28±4 jours renouvellement épidermique
- **Facteur âge** : +7 jours par décennie après 30 ans
- **Durées à utiliser** : EXACTEMENT celles fournies par le UserPrompt

### **Personnalisation OBLIGATOIRE selon :**
- **Âge** : moins 25 (tolérance élevée) | 25-40 (équilibre) | 40-55 (douceur) | plus 55 (hydratation++)
- **Type peau diagnostiqué** : Sèche (barrière) | Grasse (régulation) | Mixte (zonage) | Sensible (progression lente)
- **Problèmes spécifiques** : Zones + intensité du diagnostic

### **Compatibilités d'Actifs (Sécurité)**
- **COMPATIBLES** : Vitamine C + Niacinamide | Azélaïque + tout actif
- **ALTERNER** : AHA/BHA + Rétinoïde (jours différents)
- **INTERDITS** : Rétinoïdes + Grossesse | Plus de 3 actifs exfoliants simultanés

### **Format JSON V3 - Champs OBLIGATOIRES**
- **timing** : UNIQUEMENT "matin", "soir", "hebdomadaire" (JAMAIS "both")
- **frequency non "daily"** → **timing = "hebdomadaire"** (AUTOMATIQUE)
- **Champs requis** : applicationInstructions, restrictions[], targetZones[], alternatives[]
- **Métadonnées temporaires** : isTemporary, introduceFromWeek, applicationDuration

## 🟡 **RÈGLES RECOMMANDÉES**

### **3 Phases Dermatologiques**
- **Immédiate** : Stabiliser barrière uniquement (nettoyage, hydratation, SPF, apaisement optionnel)
- **Adaptation** : Conserver base + introduire actifs progressifs
- **Maintenance** : Maintenir acquis + prévention rechutes

### **Types de Soins Autorisés**
nettoyage | traitement | hydratation | protection | exfoliation | masque

## 🟢 **RÈGLES OPTIONNELLES**
- Nombre d'étapes variable selon besoins
- Zones ciblées selon diagnostic spécifique
- Progression logique entre phases

## ❌ **CONTRAINTES ABSOLUES (ÉCHEC SI NON RESPECTÉES)**

### **DURÉES OBLIGATOIRES**
- **Phase Immédiate** : 1-3 semaines
- **Phase Adaptation** : Dépend de la durée du traitement(s)/actif(s) introduit(s)

### **BASE DURABLE OBLIGATOIRE (Phase Immédiate)**
- **Nettoyage matin** : careType="nettoyage", timing="matin", isTemporary=false
- **Nettoyage soir** : careType="nettoyage", timing="soir", isTemporary=false  
- **SPF protection** : careType="protection", timing="matin", isTemporary=false
- **Hydratation** : careType="hydratation", isTemporary=false

### **COHÉRENCE ZONES OBLIGATOIRE**
- **Chaque traitement** DOIT cibler les zones EXACTES du diagnostic
- **INTERDICTION** : Traiter des zones non diagnostiquées
- **INTERDICTION** : Ignorer des zones diagnostiquées

### **🚨 REGROUPEMENT TRAITEMENTS - RÈGLES CRITIQUES**
- **Si ≤ 2 problèmes diagnostiqués** → TOUJOURS créer des traitements SÉPARÉS (PAS de regroupement)
- **Si 3+ problèmes** → Regroupement possible MAIS vérifier compatibilité zones
- **ZONES SENSIBLES INTERDITES pour actifs** :
  - ❌ Lèvres : INTERDICTION BHA, AHA, Niacinamide, Rétinol, Exfoliants
  - ❌ Contour yeux : INTERDICTION tous actifs (sauf produits eye-safe spécifiques)
  - ✅ Lèvres : UNIQUEMENT baumes hydratants, céramides, occlusifs
- **Si zones incompatibles** → SÉPARER les traitements même si >3 problèmes
- **Priorisation** : Traiter d'abord intensité "intense"/"modérée", reporter "légère" si incompatibilité

### **PROGRESSION SÉCURISÉE OBLIGATOIRE**
- **Phase Immédiate** : Base durable UNIQUEMENT (aucun traitement actif)
- **Phase Adaptation** : Conserver base + MAX 2 nouveaux actifs
- **INTERDICTION** : les actif introduits doivent respecter les compatibilités d'actifs

## FORMAT JSON SIMPLIFIÉ
Structure attendue avec tous les champs obligatoires :
- phases.immediate/adaptation/maintenance avec duration, objective, education, steps
- Chaque step avec stepNumber, careType, timing, targetProblem, targetZones
- applicationInstructions, restrictions, isTemporary, introduceFromWeek
- applicationDuration, frequency, displayTitle, targetBenefit
- globalAdvice et dermatologicalRationale

## RÈGLES STRICTES FORMAT JSON V3

### **INTERDICTION TIMING "both"**
- **timing** : INTERDICTION ABSOLUE de "both" - créer deux steps distincts si nécessaire
- **timing** : UNIQUEMENT "matin", "soir", ou "hebdomadaire" 
- Si un produit s'utilise matin ET soir → créer 2 steps avec timing différent

### **RÈGLE TIMING/FREQUENCY**
- **Ne jamais modifier timing** (matin/soir conservés)
- **frequency** porte la cadence (ex. "2-3x/semaine")
- **timing="hebdomadaire"** UNIQUEMENT pour soins sans moment précis (ex:masques)

### **CHAMPS OBLIGATOIRES V3**
- **careType** : UNIQUEMENT les valeurs autorisées (nettoyage, traitement, hydratation, protection, exfoliation, masque)
- **applicationInstructions** : string obligatoire (instructions d'application détaillées)
- **restrictions** : array obligatoire (même si vide [])
- **targetZones** : array obligatoire (même si ["visage entier"])
- **alternatives** : array obligatoire (même si vide [] - sera rempli par Étape 3)

## NOUVEAUX CHAMPS OBLIGATOIRES V2
Chaque step doit maintenant inclure ces champs supplémentaires :

### **Champs de Métadonnées Enrichies**
- **isTemporary** : boolean - true pour traitements ponctuels/temporaires, false pour soins continus
- **introduceFromWeek** : number - 0 = dès le début, 1 = semaine 2, etc. (max 12)
- **applicationDuration** : string - "3 semaines", "jusqu'à cicatrisation", "continu"
- **frequency** : string - "daily", "2x/week", "weekly", "1x/week", "progressive"
- **displayTitle** : string - titre court et descriptif pour UI (3-40 caractères)
- **targetBenefit** : string - bénéfice principal en 3-5 mots (3-30 caractères)

### **Règles de Cohérence**
- Les produits de base (nettoyage, hydratation, protection) ont toujours **isTemporary=false**
- Les traitements ciblés ont généralement **isTemporary=true**
- **applicationDuration** doit être cohérent avec la phase
- **frequency="daily"** pour soins quotidiens, autres valeurs pour soins spécialisés

## FORMAT JSON OBLIGATOIRE ENRICHI
Réponds UNIQUEMENT en JSON selon cette structure EXACTE avec TOUS les champs :

{
  "phases": {
    "immediate": {
      "duration": "1-2 semaines",
      "objective": "Stabiliser votre peau et traiter les problèmes urgents identifiés",
      "education": {
        "title": "Objectif : Stabiliser la barrière cutanée",
        "text": "Cette phase prépare votre peau aux traitements plus intensifs. Les durées sont dictées par les traitements temporaires pour éviter la sur-stimulation."
      },
      "steps": [
        {
          "stepNumber": 1,
          "careType": "nettoyage",
          "timing": "matin",
          "targetProblem": "Impuretés quotidiennes",
          "targetZones": ["visage entier"],
          "progressiveIntroduction": null,
          "restrictions": [],
          "applicationInstructions": "Appliquer sur peau humide, masser délicatement 30 secondes, rincer à l'eau tiède",
          "alternatives": [],
          "isTemporary": false,
          "introduceFromWeek": 0,
          "applicationDuration": "continu",
          "frequency": "daily",
          "displayTitle": "Nettoyage matinal",
          "targetBenefit": "Purifier et préparer"
        },
        {
          "stepNumber": 2,
          "careType": "hydratation",
          "timing": "matin",
          "targetProblem": "Déshydratation",
          "targetZones": ["visage entier"],
          "progressiveIntroduction": null,
          "restrictions": [],
          "applicationInstructions": "Appliquer quantité lentille sur peau propre, masser délicatement",
          "alternatives": [],
          "isTemporary": false,
          "introduceFromWeek": 0,
          "applicationDuration": "continu",
          "frequency": "daily",
          "displayTitle": "Hydratation matin",
          "targetBenefit": "Hydrater et protéger"
        },
        {
          "stepNumber": 3,
          "careType": "protection",
          "timing": "matin",
          "targetProblem": "Protection UV",
          "targetZones": ["visage entier"],
          "progressiveIntroduction": null,
          "restrictions": [],
          "applicationInstructions": "Appliquer 2 bandes (méthode 2 doigts) sur visage et cou",
          "alternatives": [],
          "isTemporary": false,
          "introduceFromWeek": 0,
          "applicationDuration": "continu",
          "frequency": "daily",
          "displayTitle": "Protection solaire",
          "targetBenefit": "Prévenir vieillissement"
        },
        {
          "stepNumber": 4,
          "careType": "nettoyage",
          "timing": "soir",
          "targetProblem": "Impuretés accumulées",
          "targetZones": ["visage entier"],
          "progressiveIntroduction": null,
          "restrictions": [],
          "applicationInstructions": "Démaquiller puis nettoyer, sécher par tapotements",
          "alternatives": [],
          "isTemporary": false,
          "introduceFromWeek": 0,
          "applicationDuration": "continu",
          "frequency": "daily",
          "displayTitle": "Nettoyage soir",
          "targetBenefit": "Purifier et régénérer"
        },
        {
          "stepNumber": 5,
          "careType": "hydratation",
          "timing": "soir",
          "targetProblem": "Déshydratation",
          "targetZones": ["visage entier"],
          "progressiveIntroduction": null,
          "restrictions": [],
          "applicationInstructions": "Appliquer quantité pois, masser jusqu'à absorption",
          "alternatives": [],
          "isTemporary": false,
          "introduceFromWeek": 0,
          "applicationDuration": "continu",
          "frequency": "daily",
          "displayTitle": "Hydratation soir",
          "targetBenefit": "Réparer et hydrater"
        }
      ]
    },
    "adaptation": {
      "duration": "4-6 semaines", 
      "objective": "Introduire des actifs plus puissants progressivement",
      "education": {
        "title": "Objectif : Introduire progressivement des actifs",
        "text": "Augmentation graduelle de la puissance ou fréquence selon la tolérance. Éviter les changements multiples simultanés."
      },
      "steps": [
        {
          "stepNumber": 1,
          "careType": "nettoyage",
          "timing": "matin",
          "targetProblem": "Maintien propreté matinale",
          "targetZones": ["visage entier"],
          "progressiveIntroduction": null,
          "restrictions": [],
          "applicationInstructions": "Appliquer sur peau humide, masser délicatement, rincer à l'eau tiède",
          "alternatives": [],
          "isTemporary": false,
          "introduceFromWeek": 0,
          "applicationDuration": "continu",
          "frequency": "daily",
          "displayTitle": "Nettoyage matin",
          "targetBenefit": "Purifier et préparer"
        },
        {
          "stepNumber": 2,
          "careType": "nettoyage",
          "timing": "soir",
          "targetProblem": "Maintien propreté nocturne",
          "targetZones": ["visage entier"],
          "progressiveIntroduction": null,
          "restrictions": [],
          "applicationInstructions": "Démaquiller puis nettoyer, sécher par tapotements",
          "alternatives": [],
          "isTemporary": false,
          "introduceFromWeek": 0,
          "applicationDuration": "continu",
          "frequency": "daily",
          "displayTitle": "Nettoyage soir",
          "targetBenefit": "Purifier et régénérer"
        },
        {
          "stepNumber": 3,
          "careType": "traitement",
          "timing": "soir",
          "targetProblem": "Desquamation",
          "targetZones": ["joues", "menton"],
          "progressiveIntroduction": "2-3x/semaine puis adapter selon tolérance",
          "restrictions": ["Patch test préalable", "Éviter contour des yeux"],
          "applicationInstructions": "Après nettoyage, appliquer quantité lentille sur zones concernées, attendre 60s avant hydratant",
          "alternatives": [],
          "isTemporary": true,
          "introduceFromWeek": 2,
          "applicationDuration": "progressive",
          "frequency": "2-3x/semaine",
          "displayTitle": "Urée 5-10%",
          "targetBenefit": "Réduire desquamation"
        }
      ]
    },
    "maintenance": {
      "duration": "Continu",
      "objective": "Maintenir les acquis et prévenir les rechutes",
      "education": {
        "title": "Objectif : Maintenir les acquis",
        "text": "Stabilisation de la routine et prévention des rechutes. Ajustements possibles selon les résultats obtenus."
      }, 
      "steps": [
        {
          "stepNumber": 1,
          "careType": "protection",
          "timing": "matin",
          "targetProblem": "Prévention vieillissement",
          "targetZones": ["visage entier"],
          "progressiveIntroduction": null,
          "restrictions": [],
          "applicationInstructions": "Appliquer généreusement en dernière étape, renouveler toutes les 2h si exposition",
          "alternatives": [],
          "isTemporary": false,
          "introduceFromWeek": 0,
          "applicationDuration": "continu",
          "frequency": "daily",
          "displayTitle": "Protection solaire",
          "targetBenefit": "Prévenir vieillissement"
        },
        {
          "stepNumber": 2,
          "careType": "traitement",
          "timing": "soir",
          "targetProblem": "Maintien acquis desquamation",
          "targetZones": ["joues", "menton"],
          "progressiveIntroduction": null,
          "restrictions": ["Adapter fréquence selon tolérance"],
          "applicationInstructions": "Utiliser à la fréquence tolérée en adaptation",
          "alternatives": [],
          "isTemporary": false,
          "introduceFromWeek": 0,
          "applicationDuration": "continu",
          "frequency": "2-3x/semaine",
          "displayTitle": "Entretien Urée",
          "targetBenefit": "Maintenir texture"
        }
      ]
    }
  },
  "globalAdvice": [
    "Respectez l'ordre d'application des soins",
    "Soyez patient, les résultats apparaissent progressivement",
    "Adaptez la fréquence selon la réaction de votre peau"
  ],
  "dermatologicalRationale": "Cette routine respecte le cycle cellulaire de 28 jours et s'adapte à votre peau mixte avec pores dilatés. La phase immédiate stabilise, l'adaptation introduit des actifs ciblés, et la maintenance préserve les acquis."
}`

interface UserProfile {
  age: number
  gender: string
  skinType?: string
}

interface SkinConcerns {
  primary: string[]
  intensity?: string
}

interface UserConstraints {
  budget: number
  timeAvailable?: string
  allergies?: string[]
  currentRoutine?: string
}

export function buildRoutineUserPrompt(
  diagnostic: PureDiagnostic,
  userProfile: UserProfile,
  skinConcerns: SkinConcerns,
  constraints: UserConstraints,
  routineContext?: RoutineContext  // ✅ NOUVEAU V2: Contexte enrichi optionnel
): string {
  
  // CALCULS DURÉES PERSONNALISÉES (OBLIGATOIRES)
  let immediateDuration = 21 // Base physiologique (3 semaines minimum pour stabilisation)
  if (userProfile.age > 50) immediateDuration += 7
  if (userProfile.age > 65) immediateDuration += 7
  
  const severeProblemCount = diagnostic.zoneSpecificIssues
    .filter(issue => issue.intensity === 'intense').length
  immediateDuration += severeProblemCount * 3
  
  if (diagnostic.skinType === 'Sensible') immediateDuration += 7

  // Calcul Phase Adaptation (minimum 4 semaines)
  let adaptationDuration = 28 // Base physiologique
  adaptationDuration += 7 // +7j pour actifs complexes prévus

  // Conversion en semaines pour affichage
  const immediateWeeks = Math.ceil(immediateDuration / 7)
  const adaptationWeeks = Math.ceil(adaptationDuration / 7)

  return `## DIAGNOSTIC VALIDÉ - CONTRAINTES ABSOLUES
**Type de peau diagnostiqué** : ${diagnostic.skinType}
**Score global** : ${diagnostic.scores.overall}/100
**Âge cutané estimé** : ${diagnostic.skinAgeEstimate} ans
**Observation générale** : ${diagnostic.generalObservation}

**Problèmes spécifiques identifiés** :
${diagnostic.zoneSpecificIssues.map(issue => 
  `- ${issue.zone} : ${issue.problem} (${issue.intensity})`
).join('\n')}

**Scores détaillés** :
- Hydratation : ${diagnostic.scores.hydration.value}/100
- Rides : ${diagnostic.scores.wrinkles.value}/100
- Fermeté : ${diagnostic.scores.firmness.value}/100
- Éclat : ${diagnostic.scores.radiance.value}/100
- Pores : ${diagnostic.scores.pores.value}/100
- Taches : ${diagnostic.scores.spots.value}/100
- Cernes : ${diagnostic.scores.darkCircles.value}/100

## PROFIL UTILISATEUR
**Âge** : ${userProfile.age} ans
**Genre** : ${userProfile.gender}
**Type de peau déclaré** : ${userProfile.skinType || 'Non spécifié'}
${routineContext?.profile.pregnancy ? `
⚠️ **GROSSESSE EN COURS** - RESTRICTIONS CRITIQUES :
- ❌ EXCLURE ABSOLUMENT : Rétinol, rétinaldéhyde, acides >2%, huiles essentielles, benzoyl peroxyde >2.5%
- ✅ PRIVILÉGIER : Acide azélaïque ≤10%, niacinamide, peptides, céramides, acide hyaluronique
- ⚠️ SÉCURITÉ MAXIMALE : Tout actif doit être explicitement safe pendant grossesse
` : ''}

## PRÉOCCUPATIONS UTILISATEUR
**Principales** : ${skinConcerns.primary.join(', ')}
**Intensité ressentie** : ${skinConcerns.intensity || 'Non spécifiée'}

## CONTRAINTES ET PRÉFÉRENCES
${routineContext ? `
**Budget mensuel** : ${routineContext.constraints.budgetTier} (${BUDGET_MAP[routineContext.constraints.budgetTier].min}-${BUDGET_MAP[routineContext.constraints.budgetTier].max}€)
  - Produits planifiés : ${BUDGET_MAP[routineContext.constraints.budgetTier].plannedSkuCount[0]}-${BUDGET_MAP[routineContext.constraints.budgetTier].plannedSkuCount[1]} SKUs
  - Prix/produit cible : ${BUDGET_MAP[routineContext.constraints.budgetTier].perSkuTarget[0]}-${BUDGET_MAP[routineContext.constraints.budgetTier].perSkuTarget[1]}€
  - Prix/produit max : ${BUDGET_MAP[routineContext.constraints.budgetTier].perSkuHardCap}€

**Style de routine** : ${routineContext.constraints.style}
  - Matin : max ${STYLE_POLICY[routineContext.constraints.style].morningMax} étapes
  - Soir : max ${STYLE_POLICY[routineContext.constraints.style].eveningMax} étapes
  - Traitements en adaptation : max ${STYLE_POLICY[routineContext.constraints.style].treatmentsMaxAdaptation}
  - Hebdomadaires : max ${STYLE_POLICY[routineContext.constraints.style].weeklyMax}

**Risque UV** : ${routineContext.environment.uvRiskBand}
${routineContext.environment.uvRiskBand === 'VeryHigh' || routineContext.environment.uvRiskBand === 'High' 
  ? '  → ⚠️ SPF 50+ OBLIGATOIRE (renouveler toutes les 2h en extérieur + chapeau/lunettes conseillés)'
  : routineContext.environment.uvRiskBand === 'Moderate'
  ? '  → SPF 30-50 recommandé (renouveler toutes les 2-3h)'
  : '  → SPF 30+ suffisant (renouveler si exposition prolongée)'
}
` : `
**Budget mensuel** : ${constraints.budget}€
**Temps disponible** : ${constraints.timeAvailable || '10-15 min matin/soir'}
`}
**Allergies** : ${constraints.allergies?.join(', ') || 'Aucune'}
**Routine actuelle** : ${constraints.currentRoutine || 'Basique (nettoyant + crème)'}

## CONTRAINTES ABSOLUES NON-NÉGOCIABLES

### **DURÉES CALCULÉES (OBLIGATOIRES)**
- **Phase Immédiate** : EXACTEMENT "${immediateWeeks} semaines" (calculé : ${immediateDuration} jours selon âge ${userProfile.age} ans + gravité)
- **Phase Adaptation** : EXACTEMENT "${adaptationWeeks} semaines" (calculé : ${adaptationDuration} jours selon actifs prévus)
- **Phase Maintenance** : "Continu" uniquement

### **BASE DURABLE OBLIGATOIRE (Phase Immédiate)**
1. **Nettoyage matin** (careType: "nettoyage", timing: "matin", isTemporary: false)
2. **Nettoyage soir** (careType: "nettoyage", timing: "soir", isTemporary: false)
3. **Hydratation matin** (careType: "hydratation", timing: "matin", isTemporary: false)
4. **Hydratation soir** (careType: "hydratation", timing: "soir", isTemporary: false)
5. **SPF OBLIGATOIRE matin** (careType: "protection", timing: "matin", isTemporary: false)

### **INTERDICTIONS PHASE IMMÉDIATE (Stabilisation d'abord)**
❌ **AUCUN actif irritant** avant 2-4 semaines de stabilisation
❌ **AUCUN traitement** pores/pigmentation/rides en phase immédiate  
❌ **AUCUN AHA/BHA/rétinoïde** avant phase adaptation
✅ **UNIQUEMENT** : Nettoyage + Hydratation + SPF + apaisement si nécessaire

### **ZONES COHÉRENTES OBLIGATOIRES**
Problèmes diagnostiqués : ${diagnostic.zoneSpecificIssues.map(issue => `${issue.zone}: ${issue.problem} (${issue.intensity})`).join(' | ')}

**🚨 VALIDATION REGROUPEMENT OBLIGATOIRE :**
- **Nombre de problèmes** : ${diagnostic.zoneSpecificIssues.length}
${diagnostic.zoneSpecificIssues.length <= 2 ? `
  → ⚠️ RÈGLE CRITIQUE : ${diagnostic.zoneSpecificIssues.length} problème(s) ≤ 2 
  → ✅ CRÉER DES TRAITEMENTS SÉPARÉS (PAS de regroupement)
  → ✅ 1 traitement par problème en phase adaptation
` : `
  → ${diagnostic.zoneSpecificIssues.length} problèmes > 2
  → ⚠️ Regroupement possible MAIS vérifier compatibilité zones AVANT
`}
${diagnostic.zoneSpecificIssues.some(issue => issue.zone === 'lèvres' || issue.zone.includes('lèvres')) ? `
  → 🚨 ATTENTION : Problème détecté sur LÈVRES
  → ❌ INTERDICTION ABSOLUE : BHA, AHA, Niacinamide, Rétinol, Exfoliants sur lèvres
  → ✅ UNIQUEMENT : Baumes hydratants, céramides, occlusifs (vaseline, beurres)
  → ✅ CRÉER UN TRAITEMENT SÉPARÉ pour les lèvres avec produit adapté
` : ''}
${diagnostic.zoneSpecificIssues.some(issue => issue.zone.includes('contour') || issue.zone.includes('yeux')) ? `
  → 🚨 ATTENTION : Problème détecté sur CONTOUR YEUX
  → ❌ INTERDICTION : Tous actifs sauf produits eye-safe spécifiques
  → ✅ CRÉER UN TRAITEMENT SÉPARÉ avec produit contour yeux dédié
` : ''}

**RÈGLE** : Traiter ces zones UNIQUEMENT en phase adaptation (pas immédiate)

### **PROGRESSION SÉCURISÉE OBLIGATOIRE (Guide Niveau A)**
- **Phase Immédiate** : STABILISATION uniquement (base durable + apaisement)
- **Phase Adaptation** : Introduire 1 actif ciblé MAX (sem 3-4)
- **Phase Maintenance** : Maintenir actifs tolérés + SPF quotidien

### **PHASE ADAPTATION - RÈGLES SPÉCIFIQUES**
- **Conserver TOUTE la base durable** (nettoyage matin/soir + hydratation matin/soir + SPF)
- **Introduire 1 actif ciblé MAX** selon diagnostic avec NOM PRÉCIS OBLIGATOIRE :
  - Pores/Zone T : "BHA doux 0.5-2%" ou "Niacinamide 2-5%"
  - Pigmentation/PIH : "Azélaïque 10-20%" ou "Vitamine C stabilisée"
  - Rides/Texture : "Rétinol faible dose" ou "Rétinal progressif"
  - Desquamation : "Urée 5-10%" ou "Acide lactique doux"
  - **LÈVRES (sécheresse/irritation)** : "Céramides" ou "Beurre de karité" ou "Occlusifs (vaseline)" ou "Baume réparateur"
  - **CONTOUR YEUX** : "Produit contour yeux spécifique" (JAMAIS d'actifs classiques)
- **Fréquence OBLIGATOIRE** : "2-3x/semaine puis adapter selon tolérance"
- **Restrictions OBLIGATOIRES** pour chaque actif :
  - "Patch test préalable" (TOUJOURS)
  - Si AHA/BHA/Rétinoïde : "Photosensibilisation : SPF strict quotidien"
- **⚠️ INTERDICTIONS ZONES SENSIBLES** :
  - Si zone = "lèvres" → NE JAMAIS utiliser BHA, AHA, Niacinamide, Rétinol, Exfoliants
  - Si zone = "lèvres" → UNIQUEMENT Céramides, Occlusifs, Baumes hydratants
  - Si zone = "contour yeux" → UNIQUEMENT produits eye-safe spécifiques

### **🚨 RÈGLES REGROUPEMENT TRAITEMENTS - CRITIQUES**

**RÈGLE 1 : PAS DE REGROUPEMENT SI ≤ 2 PROBLÈMES**
- Si le diagnostic contient **2 problèmes ou moins** → TOUJOURS créer des traitements séparés
- Ne JAMAIS regrouper "Problème A + Problème B" dans un seul traitement si possible de les séparer
- Exemple : 2 problèmes = 2 traitements distincts en phase adaptation (max 2 traitements autorisés)

**RÈGLE 2 : COMPATIBILITÉ ZONES OBLIGATOIRE**
- **AVANT de regrouper** deux problèmes, VÉRIFIER la compatibilité des zones avec le produit ciblé
- **ZONES INCOMPATIBLES à ne JAMAIS traiter avec produits actifs** :
  - ❌ Lèvres : INTERDICTION totale pour BHA, AHA, Niacinamide, Rétinol, Exfoliants
  - ❌ Contour yeux : INTERDICTION pour tous actifs sauf produits spécifiques contour yeux
  - ✅ Lèvres : UNIQUEMENT baumes hydratants, céramides, occlusifs (vaseline, beurres)
  - ✅ Contour yeux : UNIQUEMENT produits "eye-safe" spécifiques

**RÈGLE 3 : LOGIQUE DE REGROUPEMENT INTELLIGENT**
- **Si 3+ problèmes** → Regroupement possible MAIS vérifier compatibilité zones
- **Si zones incompatibles** → Créer des traitements séparés même si >3 problèmes
- **Priorisation** : Traiter en priorité les problèmes d'intensité "intense" ou "modérée"
- **Report intelligent** : Si incompatibilité, reporter le problème d'intensité "légère" en maintenance

**EXEMPLE CORRECT : 2 problèmes, zones incompatibles**
Diagnostic : 
- Nez : Pores visibles (modérée)
- Lèvres : Sécheresse ou Irritation (légère)

❌ INCORRECT : Utiliser le même actif pour les deux zones
  Traitement 1: targetProblem: "Niacinamide 2-5%", targetZones: ["nez"]  ✓
  Traitement 2: targetProblem: "Niacinamide 2-5%", targetZones: ["lèvres"]  ✗ DANGEREUX !

✅ CORRECT : Créer deux traitements avec actifs adaptés à chaque zone
  Traitement 1 (pour nez):
    stepNumber: 5, careType: "traitement"
    displayTitle: "Traitement Pores visibles"
    targetZones: ["nez"]
    targetProblem: "Niacinamide 2-5%"  ← Actif safe pour le nez
    restrictions: ["Ne pas appliquer sur lèvres ni contour yeux", "Patch test préalable"]
  
  Traitement 2 (pour lèvres):
    stepNumber: 6, careType: "traitement"
    displayTitle: "Soin réparateur lèvres"
    targetZones: ["lèvres"]
    targetProblem: "Céramides + Occlusifs"  ← Actif safe pour les lèvres
    restrictions: ["Produit spécifique lèvres uniquement", "Réappliquer fréquemment"]

🚨 RÈGLE ABSOLUE : Chaque zone nécessite un actif ADAPTÉ à sa sensibilité !
- Nez/Front/Joues : Actifs classiques OK (Niacinamide, BHA, Rétinol, etc.)
- Lèvres : UNIQUEMENT Céramides, Occlusifs, Baumes (JAMAIS d'actifs exfoliants)
- Contour yeux : UNIQUEMENT produits eye-safe spécifiques

**VALIDATION AVANT RÉPONSE :**
1. ✅ Compter le nombre de problèmes diagnostiqués
2. ✅ Si ≤ 2 problèmes → Créer des traitements SÉPARÉS
3. ✅ Si regroupement nécessaire → Vérifier compatibilité zones AVANT
4. ✅ Si zones incompatibles → Séparer les traitements
5. ✅ **Pour CHAQUE traitement avec targetZones contenant "lèvres"** :
   - Vérifier que targetProblem contient "Céramides" OU "Occlusifs" OU "Baume" OU "Beurre de karité"
   - Vérifier que targetProblem NE contient PAS "Niacinamide", "BHA", "AHA", "Rétinol", "Exfoliant"
6. ✅ **Pour CHAQUE traitement avec targetZones contenant "contour" ou "yeux"** :
   - Vérifier que targetProblem contient "contour yeux spécifique"
   - Vérifier que targetProblem NE contient PAS d'actifs classiques

### **PHASE MAINTENANCE - RÈGLES SPÉCIFIQUES**  
- **SPF quotidien** = pilier absolu (A)
- **Maintenir actifs tolérés** avec fréquence adaptée (PAS daily automatique)
- **Fréquence maintenance** : Hériter de celle tolérée en adaptation
- **Exemple** : Si adaptation finit à "3x/semaine" → maintenance garde "3x/semaine"
- **Hydratation continue** selon type de peau
- **AUCUN nouvel actif** en maintenance

### **CONSEILS GLOBAUX OBLIGATOIRES**
Ajouter OBLIGATOIREMENT dans globalAdvice :
- "Effectuer un patch test avant tout nouvel actif"
- "Utiliser un SPF strict quotidien, surtout avec actifs exfoliants"
- "Adapter la fréquence selon la tolérance de votre peau"

### **VALIDATION FINALE OBLIGATOIRE**
Avant de répondre, VÉRIFIER IMPÉRATIVEMENT :

**A. Structure de base (5 steps obligatoires) :**
1. ✅ Phase immédiate contient nettoyage matin (careType="nettoyage", timing="matin")
2. ✅ Phase immédiate contient hydratation matin (careType="hydratation", timing="matin") 
3. ✅ Phase immédiate contient protection matin (careType="protection", timing="matin")
4. ✅ Phase immédiate contient nettoyage soir (careType="nettoyage", timing="soir")
5. ✅ Phase immédiate contient hydratation soir (careType="hydratation", timing="soir")
6. ✅ Tous ces 5 steps ont isTemporary=false
7. ✅ Phase adaptation CONSERVE ces 5 steps (COPIER-COLLER depuis immédiate)
8. ✅ Phase maintenance CONSERVE au minimum nettoyage + SPF + hydratation

**B. Regroupement traitements (CRITIQUE) :**
9. ✅ Si ${diagnostic.zoneSpecificIssues.length} problème(s) ≤ 2 → J'ai créé des traitements SÉPARÉS
10. ✅ Si regroupement fait → J'ai vérifié compatibilité zones AVANT regroupement
11. ✅ AUCUN actif (BHA/AHA/Niacinamide/Rétinol/Exfoliant) n'est appliqué sur lèvres
12. ✅ AUCUN actif n'est appliqué sur contour yeux (sauf produits eye-safe)
13. ✅ Si problème sur lèvres → J'ai créé traitement SÉPARÉ avec baume/céramides/occlusifs UNIQUEMENT
14. ✅ Si zones incompatibles → J'ai créé des traitements SÉPARÉS même si >3 problèmes
15. ✅ **VÉRIFICATION ACTIFS PAR ZONE** : 
    - Pour chaque traitement, j'ai vérifié que l'actif choisi est COMPATIBLE avec la zone ciblée
    - Zones lèvres → UNIQUEMENT Céramides/Occlusifs/Baumes (pas Niacinamide, pas BHA, pas AHA)
    - Zones normales → Actifs classiques OK

**C. Cohérence globale :**
16. ✅ Duration: "${immediateWeeks} semaines" pour immediate
17. ✅ Duration: "${adaptationWeeks} semaines" pour adaptation  
18. ✅ AUCUN traitement actif en Phase Immédiate
19. ✅ SPF présent dans TOUTES les phases
20. ✅ Actifs nommés précisément en Phase Adaptation
21. ✅ "Patch test" mentionné dans restrictions des actifs

**🚨 SI UN SEUL DE CES 21 POINTS N'EST PAS RESPECTÉ → RECOMMENCER LA ROUTINE**

**RAPPEL FINAL ZONES SENSIBLES :**
- Lèvres détectées : ${diagnostic.zoneSpecificIssues.some(issue => issue.zone === 'lèvres' || issue.zone.includes('lèvres')) ? 'OUI → Traitement séparé obligatoire avec Céramides/Occlusifs/Baume UNIQUEMENT' : 'NON'}
- Nombre de problèmes : ${diagnostic.zoneSpecificIssues.length} ${diagnostic.zoneSpecificIssues.length <= 2 ? '→ SÉPARER les traitements avec actifs adaptés à chaque zone' : '→ Vérifier compatibilité zones'}

**🚨 DERNIÈRE VÉRIFICATION CRITIQUE AVANT GÉNÉRATION :**
${diagnostic.zoneSpecificIssues.some(issue => issue.zone === 'lèvres' || issue.zone.includes('lèvres')) ? `
⚠️ ATTENTION : Problème détecté sur les LÈVRES !
→ Je DOIS créer un traitement séparé pour les lèvres
→ Pour ce traitement lèvres, je DOIS utiliser UNIQUEMENT :
   • targetProblem: "Céramides + Occlusifs" OU
   • targetProblem: "Baume réparateur" OU  
   • targetProblem: "Beurre de karité"
→ Je NE DOIS JAMAIS utiliser pour les lèvres :
   • "Niacinamide" ❌
   • "BHA" ❌
   • "AHA" ❌
   • "Rétinol" ❌
   • "Exfoliant" ❌
` : ''}

Générer routine respectant TOUTES ces contraintes absolues en JSON uniquement.`
}

