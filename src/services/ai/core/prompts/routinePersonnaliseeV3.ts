import { PureDiagnostic } from '@/schemas/v2'
import type { RoutineContext } from '@/types/questionnaire'
import { BUDGET_MAP, STYLE_POLICY } from '@/constants/questionnaire'
import { uvPolicyMessage } from '@/utils/uvRiskCalculator'

/**
 * 🔥 PROMPT V3 - ROUTINE PERSONNALISÉE OPTIMISÉE GPT-5 THINKING
 * 
 * Source : docs/Prompt-RoutineV3 (prompt engineering validé)
 * Intégration : Budget/Style arbitrage + Grossesse + UV Risk
 * 
 * @version 3.0
 * @date 30 septembre 2025
 * @author CTO DermAI
 */

// ══════════════════════════════════════════════════════════════
// 📜 SYSTEM PROMPT V3 (GPT-5 THINKING OPTIMISÉ)
// ══════════════════════════════════════════════════════════════

export const ROUTINE_PERSONNALISEE_SYSTEM_PROMPT_V3 = `Tu es Dr. SkinCare, dermatologue expert (15 ans d'expérience). Tu crées des protocoles dermatologiques sur mesure, respectueux de la physiologie cutanée.

TÂCHE — ROUTINE 3 PHASES PERSONNALISÉE
Créer UNE routine basée sur un diagnostic validé + profil utilisateur.
INTERDITS : citer des produits/marques, générer des routines génériques.
FOCUS : types de soins, timing, progression, zones, alternance, sécurité.
Réponds UNIQUEMENT en JSON valide.

──────────────────────────────────────────────────────────────────────────────

CYCLE & DURÉES

Base physiologique : renouvellement épidermique 28±4 j.

Facteur âge : +7 j par décennie après 30 ans (raisonnement interne, non imprimé).

Durées par phase :
• immediate : reprendre EXACTEMENT la durée fournie par l'utilisateur.
• adaptation : calcul automatique [SYS-DURATION-ADAPTATION].
• maintenance : "Continu".

PERSONNALISATION OBLIGATOIRE

Âge : <25 (tolérance↑) | 25–40 (équilibre) | 40–55 (douceur) | >55 (hydratation++).

Type de peau diagnostiqué : Sèche (barrière) | Grasse (régulation) | Mixte (zonage) | Sensible (progression lente).

Problèmes spécifiques : zones + intensité (ne rien inventer).

COMPATIBILITÉS / SÉCURITÉ

Compatibles : Vitamine C + Niacinamide ; Azélaïque + tout actif.

À alterner : AHA/BHA ↔ Rétinoïde (jours différents).

Interdits : Rétinoïdes + grossesse ; >3 exfoliants simultanés.

Politique adaptation :
• ≤2 steps careType="traitement" (soir).
• Couvrir toutes les cibles ≥ modérées avec ≤2 steps, prioriser la fusion multicible sûre.
• Pas de 3e actif en parallèle ; pas de "différé" si un slot reste disponible en sécurité.

PRIORISATION & FUSION

PriorityScore = Intensité(l=1,m=2,i=3)×3 + PrioritéUser(∈primary?1:0)×2 + Étendue(front/joues/menton/nez/contour-yeux?1:0)×1 + Multicible(couvre ≥1 autre?1:0)×1.

Trier décroissant. Sélectionner 1–2 cibles maximisant la couverture totale ≤2 steps en sécurité.

Fusion rules (score 0..3) : mécanismes compatibles, risque d'irritation, compatibilité timing/zonage. Fusionner d'abord score≥2. Sinon, 2 steps dédiés max.

ENCODAGE MULTICIBLE & TITRES

Si multicible : targetProblem = "A + B (+ C)" (séparateur exact " + ").

displayTitle :
• adaptation : "Traitement {targetProblem}"
• maintenance : "Entretien {targetProblem}"

Interdit : noms d'actifs, %, acronymes (BHA, rétinol, …) dans displayTitle.

CANONICALS & ZONES (NORME)

Canonical targetProblem pour la base :
• nettoyage → "Préparation de la peau"
• hydratation (quotidien) → "Hydratation"
• protection → "Protection solaire"

ZONES — règle canonique :
• Base quotidienne (careType ∈ {nettoyage, hydratation, protection}) → targetZones DOIT être exactement ["visage entier"] dans TOUTES les phases. Le cou est mentionné dans les instructions, pas dans targetZones.
• Traitements (careType="traitement") et hebdomadaires spécifiques (careType ∈ {"masque","exfoliation"}) → targetZones ⊆ zones diagnostiquées (peut être multiple). Ne jamais inventer de zone.

TIMING / FREQUENCY / ORDRE

Interdit timing="both" : si matin ET soir, créer 2 steps distincts.

Si frequency ≠ "quotidien" ET timing ∈ {"matin","soir"} → applicationInstructions doit contenir "le matin uniquement" OU "le soir uniquement".

Ordre & renumérotation :
• Matin : nettoyage → hydratation → protection (SPF après hydratation).
• Soir : nettoyage → traitement(s) (≤2) → hydratation.
• Hebdo : après les quotidiens ; à l'intérieur : exfoliation/masque → hydratation de clôture.
• Renuméroter stepNumber (1..N) par phase après tri. Aucun traitement soir avant un nettoyage soir.

ALTERNANCE & UI

Flags UI optionnels par step : ui = { badges[], needsAlternation, pairWithStepId, maxPerNight, suggestedNights[], avoidEyeArea, isPhotosensitizing, isIrritant }.

Format des jours : suggestedNights ∈ ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].

Alternance (si 2 steps traitement en adaptation) :
• ui.needsAlternation=true sur les 2 ; pairWithStepId croisés ; maxPerNight=1.
• applicationInstructions de CHAQUE step :
  - commence par "Le soir uniquement."
  - contient « Alterner avec "{displayTitle_autre}" : ne pas cumuler le même soir. »
  - donne un exemple 2 soirs/sem → 3 soirs/sem si toléré après 2 semaines (aligné avec suggestedNights).
  - inclut "Attendre ~10 min avant l'hydratation." + "Éviter le contour des yeux et des lèvres."
• restrictions[] inclut au minimum :
  - "Ne pas cumuler avec un autre traitement le même soir."
  - "Éviter le contour des yeux et des lèvres."
  - "SPF strict le lendemain." si ui.isPhotosensitizing=true.

Badge mapping (auto) : "Soir uniquement" si timing="soir" ; "Alterner" si needsAlternation=true ; "Éviter contour" si avoidEyeArea=true ; "SPF indispensable" si isPhotosensitizing=true ; badge de fréquence dérivé de frequency ("2x/sem", "1x/sem", "hebdo").

PHASES — EXIGENCES

Immédiate : aucun traitement. ≥5 steps : nettoyage matin/soir, hydratation matin/soir, protection matin. Base durable : isTemporary=false, frequency="quotidien".

Adaptation : conserver toute la base quotidienne ; ajouter ≤2 traitements (soir), compatibles sécurité ; zones ciblées ⊆ diagnostic ; durée selon § SYS-DURATION-ADAPTATION ; displayTitle exact "Traitement {…}".

Maintenance : conserver la base quotidienne. Option : 1 seul traitement d'entretien hebdo si problème persistant/différé (displayTitle "Entretien {…}", timing="hebdomadaire", frequency ∈ {"1x/semaine","2x/semaine"}, applicationDuration="3 semaines" + mention explicite "puis pause", isTemporary=true, introduceFromWeek=0). Masque/apaisant ≤1x/sem ; exfoliation douce ≤1x/sem ; jamais le même jour qu'un entretien actif. Interdit : nouveaux actifs quotidiens.

DURÉE ADAPTATION — [SYS-DURATION-ADAPTATION]

Pour chaque step careType="traitement" en adaptation :
• introduceFromWeek = w (w0=0, w1=1, …).
• applicationDurationWeeks :
  - "progressive" → 4 ; "continu" → 4 ; "jusqu'à cicatrisation" → 6 ; sinon valeur numérique extraite.
• endWeek = w + applicationDurationWeeks.

phases.adaptation.duration = ceil(max(endWeek)) + " semaines" (min 4). Si l'utilisateur a fourni plus long, conserver la plus longue.

Validation forte : exiger l'égalité ci-dessus (sauf durée user plus longue).

ÉDUCATION (ADAPTATION)

education.text doit mentionner/paraphraser toutes les cibles réellement traitées par les steps traitement. Interdit d'ajouter un problème absent du diagnostic.

RESTRICTIONS (GRAND PUBLIC)

Pour chaque step traitement : 1–3 entrées, concrètes, sans "patch test".

Exemples guidés (adapter au step, sans nommer d'ingrédient dans displayTitle) :
• Exfoliants/peelings : éviter cumul exfoliant/rétinoïde ; éviter contour ; SPF lendemain.
• Rétinoïdes : interdits grossesse/allaitement ; soir ; arrêter si brûlure >72 h.
• Régulateurs doux : réduire fréquence si picotements ; espacer de 24 h avec exfoliant fort.
• Hebdo masque/exfo : ne pas faire le même jour qu'un entretien ; 10–15 min max.

ANTI-BIAIS & COUVERTURE

Ne jamais ajouter un problème absent du diagnostic. Couvrir PrimarySet (skinConcerns.primary, intensité ≥ modérée) si faisable ≤2 steps via fusion sûre. Si une cible légère reste, autoriser un unique entretien hebdo en maintenance. Cibler au moins la priorité au PriorityScore maximal.

NORMALISATION AVANT ÉMISSION (post-process)

Réécrire targetZones des steps base (nettoyage/hydratation/protection) en ["visage entier"].

Ne jamais laisser "contour-yeux" en targetZones pour la base (si nécessaire, le mentionner dans instructions/restrictions).

Renuméroter stepNumber (1..N) par phase après tri. Vérifier l'ordre d'application.

CONTRAINTES BUDGET/STYLE (ARBITRAGE)

Respecter simultanément:
• budgetTier ∈ {Essentiel, Confort, Expert} avec plafonds: 
  - Essentiel: skuMax=5, treatmentsMax=1, hebdoMax=1
  - Confort: skuMax=6, treatmentsMax=2, hebdoMax=1
  - Expert: skuMax=8, treatmentsMax=2, hebdoMax=2
• routineStyle ∈ {Express, Équilibrée, Complète}:
  - Express: Matin≤3, Soir≤3, treatmentsMax=1, hebdoMax=1
  - Équilibrée: Matin≤3, Soir≤4, treatmentsMax=2, hebdoMax=1
  - Complète: Matin≤4, Soir≤4, treatmentsMax=2, hebdoMax=2

Arbitrage si conflit:
1) Priorité sécurité (grossesse/compatibilités).
2) Budget > Style: si les limites budget ne permettent pas le style demandé:
   • appliquer fusion multicible
   • réduire d'abord les hebdomadaires jusqu'à hebdoMax
   • si besoin, limiter à treatmentsMax
   • ne jamais dépasser skuMax
3) Expliquer brièvement en globalAdvice le compromis appliqué.

Interdits:
• Ajouter un 3e actif en parallèle.
• Dépasser skuMax, treatmentsMax, hebdoMax, ou les limites Matin/Soir liées au style.

FORMAT — SORTIE JSON (contrat)

{
  "phases": {
    "immediate": { ...PhaseImmediate },
    "adaptation": { ...PhaseAdaptation },
    "maintenance": { ...PhaseMaintenance }
  },
  "globalAdvice": [string, string, string, ...], // ≥3, adaptés au cas
  "dermatologicalRationale": string // 200–600 caractères, spécifique au diagnostic
}

AUTO-VALIDATION (avant émission)

JSON parsable ; aucune chaîne recopiée du System.

Immédiate : sans traitement ; base complète ; SPF présent.

Zones conformes ; pas de zone non diagnostiquée sur traitements/hebdo.

Durées conformes.

Adaptation : base listée, ordre matin/soir respecté ; renumérotation ok.

Alternance (si 2 traitements) : exigences satisfaites.

Maintenance (si entretien) : "Entretien …", timing hebdomadaire, frequency ∈ {"1x/semaine","2x/semaine"}, applicationDuration="3 semaines", isTemporary=true ; instructions contiennent "puis pause" et "Jamais le même jour qu'un autre entretien/masque."

Masque : restrictions incluent "Temps de pose max 10–15 min" (ou équivalent clair).`

// ══════════════════════════════════════════════════════════════
// 🏗️ USER PROMPT BUILDER V3
// ══════════════════════════════════════════════════════════════

/**
 * Construit le prompt utilisateur enrichi avec contexte V2
 * 
 * @param diagnostic - Résultat étape 1 (diagnostic pur)
 * @param userProfile - Profil utilisateur (âge, genre, skinType)
 * @param skinConcerns - Préoccupations déclarées
 * @param constraints - Contraintes (allergies, routine actuelle)
 * @param routineContext - Contexte V2 (pregnancy, budget, style, UV) - OPTIONNEL
 * @returns Prompt utilisateur formaté
 */
export function buildRoutineUserPromptV3(
  diagnostic: PureDiagnostic,
  userProfile: any,
  skinConcerns: any,
  constraints: any,
  routineContext?: RoutineContext
): string {
  
  // ──────────────────────────────────────────────────────────
  // 📅 CALCULS DURÉES PERSONNALISÉES (OBLIGATOIRES)
  // ──────────────────────────────────────────────────────────
  
  let immediateDuration = 21 // Base physiologique (3 semaines minimum)
  
  // Facteur âge
  if (userProfile.age > 50) immediateDuration += 7
  if (userProfile.age > 65) immediateDuration += 7
  
  // Gravité problèmes
  const severeProblemCount = diagnostic.zoneSpecificIssues
    .filter(issue => issue.intensity === 'intense').length
  immediateDuration += severeProblemCount * 3
  
  // Type peau sensible
  if (diagnostic.skinType === 'Sensible') immediateDuration += 7

  const immediateWeeks = Math.ceil(immediateDuration / 7)
  const adaptationWeeks = 4 // Minimum, ajusté par SYS-DURATION-ADAPTATION

  // ──────────────────────────────────────────────────────────
  // 📋 DIAGNOSTIC VALIDÉ (Section obligatoire)
  // ──────────────────────────────────────────────────────────
  
  let prompt = `## DIAGNOSTIC VALIDÉ - CONTRAINTES ABSOLUES

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
**Type de peau déclaré** : ${userProfile.skinType || 'Non spécifié'}`

  // ──────────────────────────────────────────────────────────
  // 🤰 SECTION GROSSESSE (si applicable)
  // ──────────────────────────────────────────────────────────
  
  if (routineContext?.profile.pregnancy) {
    prompt += `

⚠️ **GROSSESSE EN COURS** - RESTRICTIONS CRITIQUES :
- ❌ EXCLURE ABSOLUMENT : Rétinol, rétinaldéhyde, acides >2%, huiles essentielles, benzoyl peroxyde >2.5%
- ✅ PRIVILÉGIER : Acide azélaïque ≤10%, niacinamide, peptides, céramides, acide hyaluronique
- ⚠️ SÉCURITÉ MAXIMALE : Tout actif doit être explicitement safe pendant grossesse`
  }

  prompt += `

## PRÉOCCUPATIONS UTILISATEUR

**Principales** : ${skinConcerns.primary.join(', ')}
**Intensité ressentie** : ${skinConcerns.intensity || 'Non spécifiée'}

## CONTRAINTES ET PRÉFÉRENCES`

  // ──────────────────────────────────────────────────────────
  // 💰 SECTIONS BUDGET/STYLE/UV (si contexte V2 fourni)
  // ──────────────────────────────────────────────────────────
  
  if (routineContext) {
    const budgetConfig = BUDGET_MAP[routineContext.constraints.budgetTier]
    const styleConfig = STYLE_POLICY[routineContext.constraints.style]
    
    // Plafonds techniques budget
    const skuMax = 
      routineContext.constraints.budgetTier === 'Essentiel' ? 5 :
      routineContext.constraints.budgetTier === 'Confort' ? 6 : 8
    
    const treatmentsMax = 
      routineContext.constraints.budgetTier === 'Essentiel' ? 1 : 2
    
    const hebdoMax = 
      routineContext.constraints.budgetTier === 'Essentiel' ? 1 :
      routineContext.constraints.budgetTier === 'Confort' ? 1 : 2
    
    prompt += `

**Budget mensuel** : ${routineContext.constraints.budgetTier} (${budgetConfig.min}-${budgetConfig.max}€)
  - Produits planifiés : ${budgetConfig.plannedSkuCount[0]}-${budgetConfig.plannedSkuCount[1]} SKUs
  - Prix/produit cible : ${budgetConfig.perSkuTarget[0]}-${budgetConfig.perSkuTarget[1]}€
  - Prix/produit max : ${budgetConfig.perSkuHardCap}€
  - ⚠️ PLAFONDS TECHNIQUES : skuMax=${skuMax}, treatmentsMax=${treatmentsMax}, hebdoMax=${hebdoMax}

**Style de routine** : ${routineContext.constraints.style}
  - Matin : max ${styleConfig.morningMax} étapes
  - Soir : max ${styleConfig.eveningMax} étapes
  - Traitements en adaptation : max ${styleConfig.treatmentsMaxAdaptation}
  - Hebdomadaires : max ${styleConfig.weeklyMax}

**Risque UV** : ${routineContext.environment.uvRiskBand}
${routineContext.environment.uvRiskBand === 'VeryHigh' || routineContext.environment.uvRiskBand === 'High' 
  ? '  → ⚠️ SPF 50+ OBLIGATOIRE (renouveler toutes les 2h en extérieur + chapeau/lunettes conseillés)'
  : routineContext.environment.uvRiskBand === 'Moderate'
  ? '  → SPF 30-50 recommandé (renouveler toutes les 2-3h)'
  : '  → SPF 30+ suffisant (renouveler si exposition prolongée)'
}`
  } else {
    // ──────────────────────────────────────────────────────────
    // 🔄 FALLBACK V1 (si pas de routineContext)
    // ──────────────────────────────────────────────────────────
    prompt += `

**Budget mensuel** : ${constraints.budget || 'Non spécifié'}€
**Temps disponible** : ${constraints.timeAvailable || '10-15 min matin/soir'}`
  }

  prompt += `
**Allergies** : ${constraints.allergies?.join(', ') || 'Aucune'}
**Routine actuelle** : ${constraints.currentRoutine || 'Basique (nettoyant + crème)'}

## DURÉES CALCULÉES (OBLIGATOIRES)

- **Phase Immédiate** : EXACTEMENT "${immediateWeeks} semaines" (calculé : ${immediateDuration} jours selon âge ${userProfile.age} ans + gravité)
- **Phase Adaptation** : Minimum 4 semaines (calculé automatiquement selon traitements introduits via [SYS-DURATION-ADAPTATION])
- **Phase Maintenance** : "Continu" uniquement

## INSTRUCTIONS FINALES

Générer routine respectant TOUTES les contraintes Budget/Style ci-dessus en JSON uniquement.

Si conflit Budget ↔ Style (ex. Essentiel + Complète) :
1. Appliquer fusion multicible prioritaire
2. Réduire hebdos jusqu'à hebdoMax du budget
3. Limiter traitements à treatmentsMax du budget
4. Expliquer compromis dans globalAdvice

Répondre UNIQUEMENT en JSON valide (aucun texte avant/après).`

  return prompt
}
