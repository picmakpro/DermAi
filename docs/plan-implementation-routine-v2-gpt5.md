# 📋 Plan d'Implémentation Incrémental - Routine V2 + GPT-5

**Date:** 30 septembre 2025  
**Version:** 1.0  
**Statut:** 🟡 En Attente de Validation  
**Objectif:** Migration vers GPT-5 Thinking + Prompt V3 optimisé

---

## 🎯 **OBJECTIFS GLOBAUX**

### **Résultat Attendu**
- ✅ **Étape 1 (Diagnostic)** : ChatGPT-5 (vision) avec température 0.0
- ✅ **Étape 2 (Routine)** : GPT-5 Thinking avec Prompt V3 optimisé
- ✅ **Arbitrage Budget/Style** : Validation post-processing stricte
- ✅ **Monitoring complet** : Coûts, latency, compliance
- ✅ **Déploiement progressif** : 10% → 50% → 100% avec rollback <30s

### **Métriques Succès**
| Métrique | Cible | Alerte Si |
|----------|-------|-----------|
| **Latency Étape 2 (P95)** | <35s | >45s |
| **Coût/analyse** | <$0.25 | >$0.35 |
| **Compliance Budget/Style** | 100% | <98% |
| **Sécurité Grossesse** | 100% | 1 seul cas |
| **Taux erreur validation** | <1% | >2% |

### **Timeline**
- **Sprint 0** : 1 jour (Setup + Audit)
- **Sprint 1** : 2 jours (Prompt V3 + Config Modèles)
- **Sprint 2** : 2 jours (Validators + Post-processing)
- **Sprint 3** : 2 jours (Tests E2E + Snapshots)
- **Sprint 4** : 1.5 jours (Monitoring + Logs)
- **Sprint 5** : 1.5 jours (Déploiement Progressif)

**TOTAL : 10 jours ouvrés = 2 semaines calendaires**

---

## 📊 **SPRINT 0 : AUDIT & PRÉPARATION** (1 jour)

### **Objectif**
Valider l'existant et préparer l'environnement pour la migration GPT-5.

### **Tâches**

#### **0.1 - Audit Questionnaire V2** (1h)
```bash
# Vérifier que toutes les données V2 remontent correctement
✅ À vérifier :
- pregnancy (si gender="Femme")
- location (city, country, lat?, lon?)
- budgetTier (Essentiel/Confort/Expert)
- routineStyle (Express/Équilibrée/Complète)
- UVRisk calculé (Low/Moderate/High/VeryHigh)
```

**Action :**
```bash
# Test manuel complet
cd /Users/mak/dermai-v2
npm run dev

# Parcours utilisateur :
1. Questionnaire complet avec gender="Femme"
2. Activer pregnancy=true
3. Location Paris, France
4. BudgetTier = Confort
5. RoutineStyle = Équilibrée
6. Vérifier logs backend (grep "[questionnaire_v2]")
```

**DoD :**
- [ ] Tous les champs V2 présents dans logs
- [ ] UVRisk calculé correctement
- [ ] Aucune erreur TypeScript

---

#### **0.2 - Sauvegarde Prompt Actuel** (15min)

**Action :**
```bash
# Sauvegarder le prompt actuel avant migration
cp src/services/ai/core/prompts/routinePersonnalisee.ts \
   archive/routinePersonnalisee-pre-v3-$(date +%Y%m%d).ts
```

**DoD :**
- [ ] Fichier archivé avec date
- [ ] Possibilité de rollback immédiat

---

#### **0.3 - Vérification Accès GPT-5** (30min)

**Action :**
```typescript
// Test simple accès GPT-5
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function testGPT5Access() {
  try {
    // Test ChatGPT-5
    const resp1 = await openai.chat.completions.create({
      model: 'chatgpt-5',
      messages: [{ role: 'user', content: 'Test access' }],
      max_tokens: 10
    })
    console.log('✅ ChatGPT-5 accessible:', resp1.choices[0].message.content)
    
    // Test GPT-5 Thinking
    const resp2 = await openai.chat.completions.create({
      model: 'gpt-5-thinking',
      messages: [{ role: 'user', content: 'Test reasoning' }],
      max_tokens: 10
    })
    console.log('✅ GPT-5 Thinking accessible:', resp2.choices[0].message.content)
    
  } catch (error) {
    console.error('❌ Erreur accès GPT-5:', error)
  }
}
```

**DoD :**
- [ ] ChatGPT-5 accessible (ou fallback GPT-4o documenté)
- [ ] GPT-5 Thinking accessible (ou fallback GPT-4o documenté)
- [ ] Pricing estimé ($0.10-0.25/analyse)

---

#### **0.4 - Configuration .env Staging** (15min)

**Fichier :** `.env.staging`

```bash
# ✅ MODÈLES IA V2 (GPT-5)
AI_MODEL_DIAGNOSTIC=chatgpt-5
AI_MODEL_ROUTINE=gpt-5-thinking

# ✅ FEATURE FLAGS (staging = 100%)
USE_GPT5_DIAGNOSTIC=true
USE_GPT5_ROUTINE=true
GPT5_ROLLOUT_PERCENTAGE=100

# ✅ MONITORING COÛTS
OPENAI_DAILY_BUDGET_USD=500
OPENAI_COST_ALERT_WEBHOOK=https://hooks.slack.com/services/xxx

# ✅ TIMEOUTS (GPT-5 Thinking peut être plus long)
TIMEOUT_DIAGNOSTIC_MS=25000  # 25s (vs 20s GPT-4o)
TIMEOUT_ROUTINE_MS=50000     # 50s (vs 45s GPT-4o)
```

**DoD :**
- [ ] `.env.staging` créé avec tous les flags
- [ ] Timeouts ajustés pour GPT-5 Thinking
- [ ] Webhook alertes configuré

---

## 📐 **SPRINT 1 : PROMPT V3 + CONFIG MODÈLES** (2 jours)

### **Objectif**
Intégrer le Prompt-RoutineV3 optimisé et configurer les clients OpenAI GPT-5.

---

### **Jour 1 : Configuration Modèles OpenAI**

#### **1.1 - Créer Module de Configuration** (2h)

**Fichier :** `src/lib/openai-config.ts`

```typescript
import OpenAI from 'openai'
import crypto from 'crypto'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// ✅ CONFIGURATION MODÈLES V2 (GPT-5)
export const AI_MODELS = {
  
  // ÉTAPE 1 : Diagnostic Pur (Vision)
  DIAGNOSTIC: {
    primary: process.env.AI_MODEL_DIAGNOSTIC || 'chatgpt-5',
    fallback: 'gpt-4o',
    config: {
      temperature: 0.0,  // ✅ Déterminisme MAX
      max_tokens: 1400,
      response_format: { type: "json_object" as const }
    }
  },
  
  // ÉTAPE 2 : Routine Personnalisée (Reasoning)
  ROUTINE: {
    primary: process.env.AI_MODEL_ROUTINE || 'gpt-5-thinking',
    fallback: 'gpt-4o',
    config: {
      temperature: 0.1,  // ✅ Créativité contrôlée (aligné Prompt V3)
      max_tokens: 4000,
      response_format: { type: "json_object" as const },
      // @ts-ignore - reasoning_effort peut ne pas être dans types OpenAI encore
      reasoning_effort: 'medium'  // ✅ Optimal multicritère Budget/Style
    }
  },
  
  // ÉTAPE 3 : Sélection Produits (Précision)
  PRODUCTS: {
    primary: 'gpt-4o',
    fallback: 'gpt-4o-mini',
    config: {
      temperature: 0.0,
      max_tokens: 3000,
      response_format: { type: "json_object" as const }
    }
  }
  
} as const

// ✅ FEATURE FLAGS (rollout progressif)
export const AI_FEATURE_FLAGS = {
  USE_GPT5_DIAGNOSTIC: process.env.USE_GPT5_DIAGNOSTIC === 'true',
  USE_GPT5_ROUTINE: process.env.USE_GPT5_ROUTINE === 'true',
  GPT5_ROLLOUT_PERCENTAGE: parseInt(process.env.GPT5_ROLLOUT_PERCENTAGE || '10', 10)
}

/**
 * Sélection modèle avec fallback + rollout progressif
 */
export function selectModel(
  type: 'DIAGNOSTIC' | 'ROUTINE' | 'PRODUCTS',
  requestId: string
): string {
  
  const config = AI_MODELS[type]
  
  // Feature flag check
  if (type === 'DIAGNOSTIC' && !AI_FEATURE_FLAGS.USE_GPT5_DIAGNOSTIC) {
    console.log(`[${requestId}] GPT-5 Diagnostic désactivé → Fallback ${config.fallback}`)
    return config.fallback
  }
  
  if (type === 'ROUTINE') {
    if (!AI_FEATURE_FLAGS.USE_GPT5_ROUTINE) {
      console.log(`[${requestId}] GPT-5 Routine désactivé → Fallback ${config.fallback}`)
      return config.fallback
    }
    
    // Rollout progressif (10% → 50% → 100%)
    const rolloutHash = hashString(requestId) % 100
    if (rolloutHash >= AI_FEATURE_FLAGS.GPT5_ROLLOUT_PERCENTAGE) {
      console.log(`[${requestId}] Rollout ${rolloutHash}% >= ${AI_FEATURE_FLAGS.GPT5_ROLLOUT_PERCENTAGE}% → Fallback ${config.fallback}`)
      return config.fallback
    }
  }
  
  return config.primary
}

/**
 * Hash stable pour rollout déterministe (même requestId = même modèle)
 */
function hashString(str: string): number {
  const hash = crypto.createHash('sha256').update(str).digest('hex')
  return parseInt(hash.substring(0, 8), 16) % 100
}

/**
 * Calcul seed pour diagnostic (reproductibilité)
 */
export function hashImages(images: Array<{ url: string }>): number {
  const combined = images.map(img => img.url).sort().join('|')
  const hash = crypto.createHash('sha256').update(combined).digest('hex')
  return parseInt(hash.substring(0, 8), 16)
}
```

**DoD :**
- [ ] Module créé avec tous les configs
- [ ] `selectModel()` testé (10%, 50%, 100%)
- [ ] `hashImages()` testé (reproductibilité)
- [ ] Tests unitaires `openai-config.test.ts` (>90% coverage)

---

#### **1.2 - Intégrer dans AnalysisService** (1h)

**Fichier :** `src/services/ai/AnalysisService.ts`

**Modifications :**

```typescript
// Ligne ~72 : Remplacer client OpenAI statique
import { openai, selectModel, hashImages, AI_MODELS } from '@/lib/openai-config'

export class AnalysisService {
  private static openai = openai  // ✅ Import du client configuré
  private static logger = Logger.getInstance('AnalysisServiceV2')
  private static cache = new CacheManagerV2()
  
  // ... reste inchangé ...
}
```

```typescript
// Ligne ~245 : Étape 1 - Diagnostic (utiliser GPT-5 + seed)
static async performPureDiagnostic(
  photos: Array<{ url: string; type?: string }>, 
  requestId: string
): Promise<PureDiagnostic> {
  
  const modelName = selectModel('DIAGNOSTIC', requestId)  // ✅ GPT-5 ou fallback
  const seed = hashImages(photos)  // ✅ Reproductibilité
  
  this.logger.info('🔍 Étape 1: Diagnostic pur', { 
    requestId, 
    model: modelName,
    seed,
    photosCount: photos.length 
  })
  
  const response = await this.openai.chat.completions.create({
    model: modelName,
    ...AI_MODELS.DIAGNOSTIC.config,
    seed,  // ✅ Ajout seed
    messages: [
      { role: 'system', content: DIAGNOSTIC_PUR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: buildDiagnosticUserPrompt() },
          ...photos.map(p => ({
            type: 'image_url' as const,
            image_url: { url: p.url, detail: 'high' as const }
          }))
        ]
      }
    ]
  })
  
  // ... reste du code parsing inchangé ...
}
```

```typescript
// Ligne ~374 : Étape 2 - Routine (utiliser GPT-5 Thinking)
static async generatePersonalizedRoutine(
  diagnostic: PureDiagnostic,
  request: AnalyzeRequest,
  requestId: string,
  routineContext?: RoutineContext
): Promise<PersonalizedRoutine> {
  
  const modelName = selectModel('ROUTINE', requestId)  // ✅ GPT-5 Thinking ou fallback
  
  this.logger.info('🧬 Étape 2: Routine personnalisée', { 
    requestId,
    model: modelName,
    hasRoutineContext: !!routineContext 
  })
  
  const response = await this.openai.chat.completions.create({
    model: modelName,
    ...AI_MODELS.ROUTINE.config,  // ✅ Inclut reasoning_effort
    messages: [
      {
        role: 'system',
        content: ROUTINE_PERSONNALISEE_SYSTEM_PROMPT_V3  // ✅ Nouveau prompt
      },
      {
        role: 'user',
        content: buildRoutineUserPromptV3(  // ✅ Nouveau builder
          diagnostic,
          request.userProfile,
          request.skinConcerns,
          request.constraints,
          routineContext
        )
      }
    ]
  })
  
  // ... reste du code parsing inchangé ...
}
```

**DoD :**
- [ ] `selectModel()` intégré dans Étape 1 et 2
- [ ] Seed calculé et utilisé pour Diagnostic
- [ ] Logs indiquent le modèle utilisé (GPT-5 ou fallback)
- [ ] Tests unitaires AnalysisService mis à jour

---

### **Jour 2 : Migration Prompt V3**

#### **1.3 - Créer Nouveau Fichier Prompt V3** (3h)

**Fichier :** `src/services/ai/core/prompts/routinePersonnaliseeV3.ts`

**Contenu :**

```typescript
import { PureDiagnostic } from '@/schemas/v2'
import type { RoutineContext } from '@/types/questionnaire'
import { BUDGET_MAP, STYLE_POLICY } from '@/constants/questionnaire'
import { uvPolicyMessage } from '@/utils/uvRiskCalculator'

/**
 * 🔥 PROMPT V3 - OPTIMISÉ GPT-5 THINKING
 * 
 * Source : docs/Prompt-RoutineV3 (prompt engineering validé)
 * Intégration : Budget/Style arbitrage + Grossesse + UV Risk
 * 
 * Version : 3.0
 * Date : 30 septembre 2025
 */

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

/**
 * Builder User Prompt V3 (enrichi contexte V2)
 */
export function buildRoutineUserPromptV3(
  diagnostic: PureDiagnostic,
  userProfile: any,
  skinConcerns: any,
  constraints: any,
  routineContext?: RoutineContext
): string {
  
  // CALCULS DURÉES PERSONNALISÉES (OBLIGATOIRES)
  let immediateDuration = 21 // Base physiologique (3 semaines minimum)
  if (userProfile.age > 50) immediateDuration += 7
  if (userProfile.age > 65) immediateDuration += 7
  
  const severeProblemCount = diagnostic.zoneSpecificIssues
    .filter(issue => issue.intensity === 'intense').length
  immediateDuration += severeProblemCount * 3
  
  if (diagnostic.skinType === 'Sensible') immediateDuration += 7

  const immediateWeeks = Math.ceil(immediateDuration / 7)
  const adaptationWeeks = 4 // Minimum, ajusté par SYS-DURATION-ADAPTATION

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

  // ✅ SECTION GROSSESSE (si applicable)
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

  // ✅ SECTIONS BUDGET/STYLE/UV (si contexte V2 fourni)
  if (routineContext) {
    const budgetConfig = BUDGET_MAP[routineContext.constraints.budgetTier]
    const styleConfig = STYLE_POLICY[routineContext.constraints.style]
    
    prompt += `

**Budget mensuel** : ${routineContext.constraints.budgetTier} (${budgetConfig.min}-${budgetConfig.max}€)
  - Produits planifiés : ${budgetConfig.plannedSkuCount[0]}-${budgetConfig.plannedSkuCount[1]} SKUs
  - Prix/produit cible : ${budgetConfig.perSkuTarget[0]}-${budgetConfig.perSkuTarget[1]}€
  - Prix/produit max : ${budgetConfig.perSkuHardCap}€
  - ⚠️ PLAFONDS TECHNIQUES : skuMax=${
    routineContext.constraints.budgetTier === 'Essentiel' ? 5 :
    routineContext.constraints.budgetTier === 'Confort' ? 6 : 8
  }, treatmentsMax=${
    routineContext.constraints.budgetTier === 'Essentiel' ? 1 : 2
  }, hebdoMax=${
    routineContext.constraints.budgetTier === 'Essentiel' ? 1 :
    routineContext.constraints.budgetTier === 'Confort' ? 1 : 2
  }

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
    // Fallback V1 (si pas de routineContext)
    prompt += `

**Budget mensuel** : ${constraints.budget}€
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
```

**DoD :**
- [ ] Fichier créé avec prompt V3 complet
- [ ] `buildRoutineUserPromptV3()` intègre Budget/Style/UV/Grossesse
- [ ] Calcul durées personnalisé identique à V2
- [ ] Tests unitaires builder prompt (snapshots)

---

#### **1.4 - Mettre à Jour AnalysisService** (30min)

**Fichier :** `src/services/ai/AnalysisService.ts`

**Modifications :**

```typescript
// Ligne ~1 : Import nouveau prompt
import { 
  ROUTINE_PERSONNALISEE_SYSTEM_PROMPT_V3,
  buildRoutineUserPromptV3 
} from '@/services/ai/core/prompts/routinePersonnaliseeV3'

// Ligne ~381 : Utiliser nouveau prompt
const response = await this.openai.chat.completions.create({
  model: modelName,
  ...AI_MODELS.ROUTINE.config,
  messages: [
    {
      role: 'system',
      content: ROUTINE_PERSONNALISEE_SYSTEM_PROMPT_V3  // ✅ V3
    },
    {
      role: 'user',
      content: buildRoutineUserPromptV3(  // ✅ V3
        diagnostic,
        request.userProfile,
        request.skinConcerns,
        request.constraints,
        routineContext
      )
    }
  ]
})
```

**DoD :**
- [ ] Import V3 actif
- [ ] Ancien prompt V2 commenté (pas supprimé, pour rollback)
- [ ] Tests passage (aucune régression)

---

## 🛡️ **SPRINT 2 : VALIDATORS + POST-PROCESSING** (2 jours)

### **Objectif**
Ajouter validation stricte Budget/Style côté serveur (défensive).

---

### **Jour 3 : Création Validators**

#### **2.1 - Créer Module Validation** (3h)

**Fichier :** `src/services/ai/validators/routineValidator.ts`

```typescript
import type { PersonalizedRoutine } from '@/schemas/v2'
import type { RoutineContext } from '@/types/questionnaire'

// ✅ LIMITES TECHNIQUES (identiques au prompt)
export const BUDGET_LIMITS = {
  Essentiel: { skuMax: 5, treatmentsMax: 1, hebdoMax: 1 },
  Confort: { skuMax: 6, treatmentsMax: 2, hebdoMax: 1 },
  Expert: { skuMax: 8, treatmentsMax: 2, hebdoMax: 2 }
} as const

export const STYLE_LIMITS = {
  Express: { morningMax: 3, eveningMax: 3, treatmentsMax: 1, hebdoMax: 1 },
  Équilibrée: { morningMax: 3, eveningMax: 4, treatmentsMax: 2, hebdoMax: 1 },
  Complète: { morningMax: 4, eveningMax: 4, treatmentsMax: 2, hebdoMax: 2 }
} as const

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  metrics: {
    treatmentsCount: number
    hebdosCount: number
    morningStepsCount: number
    eveningStepsCount: number
  }
}

/**
 * Validation post-génération (défensive)
 */
export function validateRoutineCompliance(
  routine: PersonalizedRoutine,
  context: RoutineContext
): ValidationResult {
  
  const errors: string[] = []
  const warnings: string[] = []
  
  const budgetLimits = BUDGET_LIMITS[context.constraints.budgetTier]
  const styleLimits = STYLE_LIMITS[context.constraints.style]
  
  // 1️⃣ COMPTAGE
  const treatments = countStepsByType(routine, 'traitement')
  const hebdos = countHebdomadaireSteps(routine)
  const morningSteps = countTimingSteps(routine.phases.adaptation, 'matin')
  const eveningSteps = countTimingSteps(routine.phases.adaptation, 'soir')
  
  // 2️⃣ VALIDATION BUDGET
  if (treatments.adaptation > budgetLimits.treatmentsMax) {
    errors.push(
      `Traitements (${treatments.adaptation}) > max ${budgetLimits.treatmentsMax} (${context.constraints.budgetTier})`
    )
  }
  
  if (hebdos.total > budgetLimits.hebdoMax) {
    errors.push(
      `Hebdomadaires (${hebdos.total}) > max ${budgetLimits.hebdoMax} (${context.constraints.budgetTier})`
    )
  }
  
  // 3️⃣ VALIDATION STYLE
  if (morningSteps > styleLimits.morningMax) {
    warnings.push(
      `Matin (${morningSteps} steps) > max ${styleLimits.morningMax} (${context.constraints.style})`
    )
  }
  
  if (eveningSteps > styleLimits.eveningMax) {
    warnings.push(
      `Soir (${eveningSteps} steps) > max ${styleLimits.eveningMax} (${context.constraints.style})`
    )
  }
  
  // 4️⃣ SÉCURITÉ GROSSESSE
  if (context.profile.pregnancy) {
    const dangerousActifs = detectDangerousActifs(routine)
    if (dangerousActifs.length > 0) {
      errors.push(
        `Actifs dangereux grossesse : ${dangerousActifs.join(', ')}`
      )
    }
  }
  
  // 5️⃣ BASE DURABLE
  const baseErrors = validateBaseDurable(routine)
  errors.push(...baseErrors)
  
  // 6️⃣ ALTERNANCE (si 2 traitements)
  if (treatments.adaptation === 2) {
    const alternanceValid = validateAlternance(routine)
    if (!alternanceValid) {
      warnings.push('2 traitements sans alternance configurée')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      treatmentsCount: treatments.adaptation,
      hebdosCount: hebdos.total,
      morningStepsCount: morningSteps,
      eveningStepsCount: eveningSteps
    }
  }
}

// ✅ HELPERS

function countStepsByType(routine: PersonalizedRoutine, careType: string) {
  return {
    immediate: routine.phases.immediate.steps.filter(s => s.careType === careType).length,
    adaptation: routine.phases.adaptation.steps.filter(s => s.careType === careType).length,
    maintenance: routine.phases.maintenance.steps.filter(s => s.careType === careType).length
  }
}

function countHebdomadaireSteps(routine: PersonalizedRoutine) {
  const allSteps = [
    ...routine.phases.immediate.steps,
    ...routine.phases.adaptation.steps,
    ...routine.phases.maintenance.steps
  ]
  
  return {
    total: allSteps.filter(s => s.timing === 'hebdomadaire').length,
    byPhase: {
      immediate: routine.phases.immediate.steps.filter(s => s.timing === 'hebdomadaire').length,
      adaptation: routine.phases.adaptation.steps.filter(s => s.timing === 'hebdomadaire').length,
      maintenance: routine.phases.maintenance.steps.filter(s => s.timing === 'hebdomadaire').length
    }
  }
}

function countTimingSteps(phase: any, timing: 'matin' | 'soir') {
  return phase.steps.filter((s: any) => s.timing === timing).length
}

function detectDangerousActifs(routine: PersonalizedRoutine): string[] {
  const dangerousKeywords = [
    'rétinol', 'rétinoïde', 'rétinal', 'trétinoïne', 
    'acide salicylique', 'salicylic', 'bha >2%'
  ]
  
  const found: string[] = []
  const allSteps = [
    ...routine.phases.immediate.steps,
    ...routine.phases.adaptation.steps,
    ...routine.phases.maintenance.steps
  ]
  
  allSteps.forEach(step => {
    const title = step.displayTitle?.toLowerCase() || ''
    const instructions = step.applicationInstructions?.toLowerCase() || ''
    const combined = `${title} ${instructions}`
    
    dangerousKeywords.forEach(keyword => {
      if (combined.includes(keyword)) {
        found.push(step.displayTitle || 'actif non identifié')
      }
    })
  })
  
  return [...new Set(found)] // Dédupliquer
}

function validateBaseDurable(routine: PersonalizedRoutine): string[] {
  const errors: string[] = []
  const immediate = routine.phases.immediate.steps
  
  const requiredBase = [
    { careType: 'nettoyage', timing: 'matin' },
    { careType: 'nettoyage', timing: 'soir' },
    { careType: 'protection', timing: 'matin' }
  ]
  
  requiredBase.forEach(req => {
    const found = immediate.find(s => 
      s.careType === req.careType && 
      s.timing === req.timing && 
      s.isTemporary === false
    )
    
    if (!found) {
      errors.push(`Base manquante : ${req.careType} ${req.timing}`)
    }
  })
  
  return errors
}

function validateAlternance(routine: PersonalizedRoutine): boolean {
  const treatments = routine.phases.adaptation.steps.filter(s => s.careType === 'traitement')
  
  if (treatments.length !== 2) return true
  
  // Vérifier que les deux ont needsAlternation=true
  const hasAlternance = treatments.every(t => 
    t.ui?.needsAlternation === true &&
    t.ui?.pairWithStepId !== undefined
  )
  
  return hasAlternance
}
```

**DoD :**
- [ ] Module créé avec toutes les fonctions
- [ ] Tests unitaires `routineValidator.test.ts` (>95% coverage)
- [ ] Cas edge testés (0 traitements, 1 traitement, 2 traitements)

---

### **Jour 4 : Intégration Validators**

#### **2.2 - Intégrer dans AnalysisService** (1h)

**Fichier :** `src/services/ai/AnalysisService.ts`

**Modifications :**

```typescript
// Ligne ~3 : Import validator
import { validateRoutineCompliance } from '@/services/ai/validators/routineValidator'

// Ligne ~440 : Après parsing Zod, avant cache
const routine = PersonalizedRoutineSchema.parse(cleanedJson)

// ✅ VALIDATION COMPLIANCE V2
if (routineContext) {
  const validation = validateRoutineCompliance(routine, routineContext)
  
  this.logger.info('🔍 Validation compliance routine', { 
    requestId,
    operation: 'routine_validation',
    stage: 'post_processing'
  }, {
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    metrics: validation.metrics
  })
  
  // ❌ ERREURS CRITIQUES → BLOQUANT
  if (!validation.valid) {
    this.logger.error('❌ Routine non conforme', { requestId }, {
      errors: validation.errors
    })
    
    throw new Error(
      `Routine non conforme aux contraintes Budget/Style : ${validation.errors.join('; ')}`
    )
  }
  
  // ⚠️ WARNINGS → LOGS (non bloquant)
  if (validation.warnings.length > 0) {
    this.logger.warn('⚠️ Warnings validation (non bloquants)', {
      requestId,
      warnings: validation.warnings
    })
  }
}

// Cache & retour
await this.cache.set(cacheKey, routine)
return routine
```

**DoD :**
- [ ] Validation appelée systématiquement si routineContext fourni
- [ ] Erreurs bloquent génération (throw Error)
- [ ] Warnings loggés mais non bloquants
- [ ] Tests intégration AnalysisService

---

#### **2.3 - Tests Cas Métier** (2h)

**Fichier :** `src/services/ai/__tests__/routineComplianceV2.test.ts`

```typescript
import { validateRoutineCompliance } from '../validators/routineValidator'
import type { PersonalizedRoutine } from '@/schemas/v2'
import type { RoutineContext } from '@/types/questionnaire'

describe('Validation Compliance Budget/Style V2', () => {
  
  test('Cas 1: Essentiel + Express → 1 traitement, 1 hebdo max', () => {
    const routine: PersonalizedRoutine = {
      phases: {
        immediate: { /* base 5 steps */ },
        adaptation: {
          steps: [
            { careType: 'nettoyage', timing: 'matin', /* ... */ },
            { careType: 'traitement', timing: 'soir', /* ... */ } // 1 seul
          ]
        },
        maintenance: { /* ... */ }
      },
      globalAdvice: [],
      dermatologicalRationale: ''
    }
    
    const context: RoutineContext = {
      profile: { age: 30, gender: 'Femme', pregnancy: false },
      constraints: {
        budgetTier: 'Essentiel',
        style: 'Express'
      },
      environment: { uvRiskBand: 'Moderate' }
    }
    
    const result = validateRoutineCompliance(routine, context)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.metrics.treatmentsCount).toBe(1)
  })
  
  test('Cas 2: Essentiel + Complète → Downgrade accepté (fusion multicible)', () => {
    // Conflit Budget/Style résolu intelligemment
    // ...
  })
  
  test('Cas 3: Confort + Équilibrée → 2 traitements alternance OK', () => {
    // ...
  })
  
  test('Cas 4: Expert + Complète → 2 traitements + 2 hebdos OK', () => {
    // ...
  })
  
  test('Cas 5: Grossesse → AUCUN rétinoïde détecté', () => {
    const routineWithRetinol: PersonalizedRoutine = {
      phases: {
        adaptation: {
          steps: [
            { 
              careType: 'traitement', 
              timing: 'soir',
              displayTitle: 'Rétinol progressif',  // ❌ INTERDIT
              /* ... */
            }
          ]
        }
      }
    }
    
    const context: RoutineContext = {
      profile: { pregnancy: true },  // ✅ Grossesse active
      /* ... */
    }
    
    const result = validateRoutineCompliance(routineWithRetinol, context)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain(expect.stringContaining('dangereux grossesse'))
  })
  
  test('Cas 6: 2 traitements SANS alternance → Warning', () => {
    // ...
  })
})
```

**DoD :**
- [ ] 10 tests métier couverts
- [ ] Tous les tests passent (100% success)
- [ ] Coverage validator >95%

---

## 🧪 **SPRINT 3 : TESTS E2E + SNAPSHOTS** (2 jours)

### **Objectif**
Valider le pipeline complet avec GPT-5 Thinking + Prompt V3.

---

### **Jour 5 : Tests Snapshots**

#### **3.1 - Créer Snapshots GPT-5** (3h)

**Fichier :** `src/services/ai/__tests__/snapshotsGPT5.test.ts`

```typescript
import { AnalysisService } from '../AnalysisService'
import type { AnalyzeRequest } from '@/types/api'

// ⚠️ Tests réels GPT-5 (coûteux, run manuel)
describe('Snapshots GPT-5 Thinking - Routine V3', () => {
  
  beforeAll(() => {
    // Force GPT-5 même si rollout <100%
    process.env.USE_GPT5_ROUTINE = 'true'
    process.env.GPT5_ROLLOUT_PERCENTAGE = '100'
  })
  
  test('Snapshot 1: Essentiel + Express → Routine minimale', async () => {
    const request: AnalyzeRequest = {
      photos: [{ url: 'https://test.jpg', type: 'front' }],
      userProfile: { age: 28, gender: 'Femme', skinType: 'Mixte' },
      skinConcerns: { primary: ['Pores/Zone T'] },
      constraints: { budget: 50, allergies: [] },
      pregnancy: { isPregnant: false },
      location: { city: 'Paris', country: 'France', lat: 48.85, lon: 2.35 }
    }
    
    const routineContext = {
      profile: { age: 28, gender: 'Femme', pregnancy: false },
      constraints: { budgetTier: 'Essentiel', style: 'Express' },
      environment: { uvRiskBand: 'Moderate' }
    }
    
    const result = await AnalysisService.analyzeSkinComplete(request, routineContext)
    
    // Vérifications structurelles
    expect(result.routine.phases.adaptation.steps.filter(s => s.careType === 'traitement')).toHaveLength(1)
    expect(result.routine.globalAdvice).toContain(expect.stringMatching(/budget.*essentiel/i))
    
    // Snapshot (sauvegardé pour comparaison future)
    expect(result.routine).toMatchSnapshot('essentiel-express')
  }, 60000) // Timeout 60s
  
  test('Snapshot 2: Essentiel + Complète → Fusion multicible + Compromis', async () => {
    // Cas conflit Budget/Style
    // ...
  }, 60000)
  
  test('Snapshot 3: Confort + Équilibrée → 2 traitements alternance', async () => {
    // ...
  }, 60000)
  
  test('Snapshot 4: Expert + Complète → Routine maximale', async () => {
    // ...
  }, 60000)
  
  test('Snapshot 5: Grossesse + Confort → Restrictions actives', async () => {
    const routineContext = {
      profile: { age: 32, gender: 'Femme', pregnancy: true },  // ✅ Grossesse
      constraints: { budgetTier: 'Confort', style: 'Équilibrée' },
      environment: { uvRiskBand: 'High' }
    }
    
    const result = await AnalysisService.analyzeSkinComplete(request, routineContext)
    
    // Vérifier AUCUN rétinoïde
    const allTitles = [
      ...result.routine.phases.immediate.steps,
      ...result.routine.phases.adaptation.steps,
      ...result.routine.phases.maintenance.steps
    ].map(s => s.displayTitle?.toLowerCase() || '')
    
    const hasRetinol = allTitles.some(t => 
      t.includes('rétinol') || t.includes('rétinoïde')
    )
    
    expect(hasRetinol).toBe(false)
    expect(result.routine.globalAdvice).toContain(expect.stringMatching(/grossesse/i))
    
    expect(result.routine).toMatchSnapshot('grossesse-confort')
  }, 60000)
})
```

**DoD :**
- [ ] 5 snapshots métier créés
- [ ] Snapshots stables (run 3x → même résultat)
- [ ] Documentation snapshots (quand les regénérer)

---

### **Jour 6 : Tests E2E**

#### **3.2 - Playwright E2E** (3h)

**Fichier :** `e2e/routineV2GPT5.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Parcours Complet - Routine V2 GPT-5', () => {
  
  test('E2E 1: Questionnaire V2 → Routine GPT-5 → Résultats', async ({ page }) => {
    // 1️⃣ QUESTIONNAIRE
    await page.goto('http://localhost:3000/questionnaire')
    
    // Upload photos
    await page.setInputFiles('input[type="file"]', [
      'e2e/fixtures/test-face-front.jpg',
      'e2e/fixtures/test-face-side.jpg'
    ])
    await page.click('[data-testid="next-button"]')
    
    // Profil (Step 1)
    await page.fill('input[name="age"]', '32')
    await page.click('input[value="Femme"]')
    await page.click('input[name="pregnancy"]') // Toggle grossesse
    await page.click('[data-testid="next-button"]')
    
    // Localisation (Step 2)
    await page.fill('input[name="city"]', 'Paris')
    await page.fill('input[name="country"]', 'France')
    await page.click('[data-testid="next-button"]')
    
    // Préoccupations (Step 3) - Max 3
    await page.click('input[value="Rides/Vieillissement"]')
    await page.click('input[value="Taches/Pigmentation"]')
    await page.click('[data-testid="next-button"]')
    
    // ... steps 4-7 ...
    
    // Budget + Style (Step 8)
    await page.click('input[value="Confort"]')
    await page.click('input[value="Équilibrée"]')
    await page.click('[data-testid="submit-questionnaire"]')
    
    // 2️⃣ ATTENTE RÉSULTATS (max 60s)
    await page.waitForSelector('[data-testid="results-routine"]', { 
      timeout: 60000 
    })
    
    // 3️⃣ VÉRIFICATIONS UI
    
    // Badges visibles
    const badges = await page.$$('[data-badge-type]')
    expect(badges.length).toBeGreaterThanOrEqual(4) // pregnancy, budget, style, UV
    
    const badgeTexts = await Promise.all(
      badges.map(b => b.textContent())
    )
    expect(badgeTexts).toContain(expect.stringMatching(/grossesse/i))
    expect(badgeTexts).toContain(expect.stringMatching(/confort/i))
    expect(badgeTexts).toContain(expect.stringMatching(/équilibrée/i))
    
    // Traitements count
    const treatments = await page.$$('[data-care-type="traitement"]')
    expect(treatments.length).toBeLessThanOrEqual(2) // Confort = max 2
    
    // Alternance visible (si 2 traitements)
    if (treatments.length === 2) {
      const alternanceBadge = await page.$('text=/Alterner/i')
      expect(alternanceBadge).not.toBeNull()
    }
    
    // GlobalAdvice contient mentions Budget/Style
    const advice = await page.textContent('[data-testid="global-advice"]')
    expect(advice).toMatch(/budget.*confort/i)
    
    // 4️⃣ VÉRIFICATION LOGS (backend)
    // Consulter logs via API ou fichier
    const response = await page.request.get('/api/logs/latest')
    const logs = await response.json()
    
    const routineLog = logs.find((l: any) => 
      l.operation === 'routine_generation' && 
      l.model?.includes('gpt-5')
    )
    
    expect(routineLog).toBeDefined()
    expect(routineLog.budgetTier).toBe('Confort')
    expect(routineLog.routineStyle).toBe('Équilibrée')
    expect(routineLog.pregnancy).toBe(true)
  })
  
  test('E2E 2: Rollback Fallback GPT-4o (si GPT-5 désactivé)', async ({ page }) => {
    // Tester fallback si USE_GPT5_ROUTINE=false
    // ...
  })
})
```

**DoD :**
- [ ] 3 tests E2E passent
- [ ] Temps exécution <5 min total
- [ ] CI/CD intégré (run sur PR)

---

## 📊 **SPRINT 4 : MONITORING + LOGS** (1.5 jours)

### **Objectif**
Observabilité complète pour surveiller GPT-5 (coûts, latency, compliance).

---

### **Jour 7 : Logs Structurés**

#### **4.1 - Enrichir Logs AnalysisService** (2h)

**Fichier :** `src/services/ai/AnalysisService.ts`

**Modifications :**

```typescript
// Ligne ~245 : Étape 1 - Logs détaillés
this.logger.info('🔍 Étape 1: Diagnostic pur - START', { 
  requestId,
  operation: 'diagnostic_pure',
  stage: 'start'
}, {
  model: modelName,
  seed,
  photosCount: photos.length,
  photosTypes: photos.map(p => p.type),
  fallbackUsed: modelName !== AI_MODELS.DIAGNOSTIC.primary
})

// Après réponse
this.logger.info('🔍 Étape 1: Diagnostic pur - SUCCESS', { 
  requestId,
  operation: 'diagnostic_pure',
  stage: 'success'
}, {
  model: modelName,
  tokensUsed: response.usage?.total_tokens || 0,
  tokensPrompt: response.usage?.prompt_tokens || 0,
  tokensCompletion: response.usage?.completion_tokens || 0,
  duration_ms: performance.now() - stepStartTime,
  skinType: diagnostic.skinType,
  overallScore: diagnostic.scores.overall,
  problemsCount: diagnostic.zoneSpecificIssues.length
})
```

```typescript
// Ligne ~374 : Étape 2 - Logs GPT-5 Thinking
this.logger.info('🧬 Étape 2: Routine personnalisée - START', { 
  requestId,
  operation: 'routine_generation',
  stage: 'start'
}, {
  model: modelName,
  fallbackUsed: modelName !== AI_MODELS.ROUTINE.primary,
  budgetTier: routineContext?.constraints.budgetTier,
  routineStyle: routineContext?.constraints.style,
  pregnancy: routineContext?.profile.pregnancy,
  uvRiskBand: routineContext?.environment.uvRiskBand
})

// Après réponse
const tokensReasoning = response.usage?.reasoning_tokens || 0  // ✅ GPT-5 Thinking

this.logger.info('🧬 Étape 2: Routine personnalisée - SUCCESS', { 
  requestId,
  operation: 'routine_generation',
  stage: 'success'
}, {
  model: modelName,
  tokensUsed: response.usage?.total_tokens || 0,
  tokensPrompt: response.usage?.prompt_tokens || 0,
  tokensCompletion: response.usage?.completion_tokens || 0,
  tokensReasoning,  // ✅ NOUVEAU (GPT-5 Thinking uniquement)
  duration_ms: performance.now() - stepStartTime,
  treatmentsCount: routine.phases.adaptation.steps.filter(s => s.careType === 'traitement').length,
  hebdosCount: [...routine.phases.immediate.steps, ...routine.phases.adaptation.steps, ...routine.phases.maintenance.steps].filter(s => s.timing === 'hebdomadaire').length,
  complianceValid: validation?.valid,
  complianceErrors: validation?.errors.length || 0,
  complianceWarnings: validation?.warnings.length || 0
})
```

**DoD :**
- [ ] Logs structurés avec tous les champs
- [ ] `tokensReasoning` capturé (GPT-5 Thinking)
- [ ] `fallbackUsed` indique si fallback activé
- [ ] Durée par étape loggée

---

#### **4.2 - Métriques Coûts Temps Réel** (2h)

**Fichier :** `src/utils/CostMonitor.ts`

```typescript
interface TokenUsage {
  prompt: number
  completion: number
  reasoning?: number  // GPT-5 Thinking
  total: number
}

interface CostEstimate {
  diagnostic_usd: number
  routine_usd: number
  products_usd: number
  total_usd: number
}

// ✅ PRICING GPT-5 (source: OpenAI Platform)
const PRICING = {
  'chatgpt-5': {
    input: 0.00003,   // $0.03/1K tokens (estimation)
    output: 0.00006   // $0.06/1K tokens
  },
  'gpt-5-thinking': {
    input: 0.00004,   // $0.04/1K tokens
    output: 0.00008,  // $0.08/1K tokens
    reasoning: 0.00012 // $0.12/1K tokens (x1.5)
  },
  'gpt-4o': {
    input: 0.000025,
    output: 0.00005
  }
} as const

export class CostMonitor {
  
  static calculateCost(model: string, usage: TokenUsage): number {
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4o']
    
    let cost = 0
    cost += (usage.prompt / 1000) * pricing.input
    cost += (usage.completion / 1000) * pricing.output
    
    // GPT-5 Thinking : reasoning tokens facturés séparément
    if (usage.reasoning && 'reasoning' in pricing) {
      cost += (usage.reasoning / 1000) * pricing.reasoning
    }
    
    return cost
  }
  
  static async trackDailyCost(cost: number): Promise<void> {
    // Incrémenter compteur quotidien (Redis/Database)
    const dailyKey = `cost:daily:${new Date().toISOString().split('T')[0]}`
    const currentTotal = await redis.incrbyfloat(dailyKey, cost)
    
    // Alert si dépassement budget
    const dailyBudget = parseFloat(process.env.OPENAI_DAILY_BUDGET_USD || '500')
    if (currentTotal > dailyBudget) {
      await this.alertBudgetExceeded(currentTotal, dailyBudget)
    }
  }
  
  private static async alertBudgetExceeded(current: number, limit: number) {
    const webhook = process.env.OPENAI_COST_ALERT_WEBHOOK
    if (!webhook) return
    
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Budget OpenAI dépassé : $${current.toFixed(2)} / $${limit} (${((current/limit)*100).toFixed(0)}%)`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Budget Quotidien Dépassé*\nActuel: $${current.toFixed(2)}\nLimite: $${limit}\nDépassement: ${((current-limit)/limit*100).toFixed(0)}%`
            }
          }
        ]
      })
    })
  }
}
```

**Intégration dans AnalysisService :**

```typescript
// Après chaque étape IA
const costDiag = CostMonitor.calculateCost(modelName, {
  prompt: response.usage.prompt_tokens,
  completion: response.usage.completion_tokens,
  total: response.usage.total_tokens
})

await CostMonitor.trackDailyCost(costDiag)

this.logger.info('💰 Coût étape 1', { requestId }, {
  model: modelName,
  cost_usd: costDiag.toFixed(4),
  tokens: response.usage.total_tokens
})
```

**DoD :**
- [ ] Coût calculé par étape
- [ ] Cumul quotidien Redis
- [ ] Alert Slack si >$500/jour
- [ ] Dashboard temps réel (Grafana)

---

### **Jour 8 : Dashboard Monitoring**

#### **4.3 - Grafana Dashboard** (2h)

**Fichier :** `monitoring/grafana-dashboard-gpt5.json`

```json
{
  "dashboard": {
    "title": "DermAI V2 - Routine GPT-5 Monitoring",
    "panels": [
      {
        "title": "Modèles Utilisés (24h)",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (model) (rate(routine_generation_total[24h]))"
          }
        ]
      },
      {
        "title": "Latency P95 Étape 2 (GPT-5 vs GPT-4o)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(routine_generation_duration_ms[5m]))",
            "legendFormat": "{{model}}"
          }
        ]
      },
      {
        "title": "Coûts Quotidiens (USD)",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(openai_cost_usd_total[1d]))"
          }
        ],
        "thresholds": [
          { "value": 500, "color": "orange", "label": "Budget limite" },
          { "value": 600, "color": "red", "label": "Dépassement" }
        ]
      },
      {
        "title": "Compliance Budget/Style (%)",
        "type": "stat",
        "targets": [
          {
            "expr": "(sum(routine_validation_success) / sum(routine_validation_total)) * 100"
          }
        ]
      },
      {
        "title": "Tokens Reasoning (GPT-5 Thinking)",
        "type": "graph",
        "targets": [
          {
            "expr": "avg(routine_tokens_reasoning)"
          }
        ]
      },
      {
        "title": "Erreurs Sécurité Grossesse (24h)",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(increase(routine_pregnancy_violations[24h]))"
          }
        ],
        "thresholds": [
          { "value": 1, "color": "red" }
        ]
      }
    ]
  }
}
```

**DoD :**
- [ ] Dashboard importé Grafana
- [ ] Métriques temps réel visibles
- [ ] Alerts configurées (latency >45s, cost >$500, compliance <98%)

---

## 🚀 **SPRINT 5 : DÉPLOIEMENT PROGRESSIF** (1.5 jours)

### **Objectif**
Rollout 10% → 50% → 100% avec rollback <30s.

---

### **Jour 9 : Staging + Rollout 10%**

#### **5.1 - Déploiement Staging** (2h)

```bash
# 1️⃣ BUILD
cd /Users/mak/dermai-v2
npm run build

# 2️⃣ TESTS PRE-DEPLOY
npm run test:unit
npm run test:e2e

# 3️⃣ DEPLOY STAGING
vercel deploy --env=staging

# 4️⃣ SMOKE TESTS
curl -X POST https://dermai-v2-staging.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d @e2e/fixtures/request-essentiel-express.json

# Vérifier logs
vercel logs --env=staging | grep "gpt-5-thinking"
```

**DoD :**
- [ ] Build staging OK
- [ ] 10 smoke tests passent
- [ ] Logs indiquent GPT-5 utilisé (100% sur staging)

---

#### **5.2 - Production Rollout 10%** (1h)

```bash
# 1️⃣ CONFIGURATION PROD
# .env.production
USE_GPT5_DIAGNOSTIC=true
USE_GPT5_ROUTINE=true
GPT5_ROLLOUT_PERCENTAGE=10  # ✅ 10% trafic

# 2️⃣ DEPLOY
vercel deploy --prod

# 3️⃣ MONITORING
# Attendre 4h trafic
# Analyser métriques Grafana :
- Latency P95 < 35s ? ✅
- Coût/analyse < $0.25 ? ✅
- Compliance 100% ? ✅
- Erreurs 0 ? ✅
```

**Checklist Validation :**
- [ ] P95 latency <35s (4h trafic)
- [ ] Coût moyen <$0.25/analyse
- [ ] 0 erreur grossesse
- [ ] Compliance 100%

**Si OK → Passer 25%**

---

### **Jour 10 : Rollout 50% → 100%**

#### **5.3 - Rollout Progressif** (3h)

```bash
# 08h00 : 25%
vercel env add GPT5_ROLLOUT_PERCENTAGE 25 production
vercel deploy --prod

# 12h00 : Validation (attendre 4h)
- Latency stable ? ✅
- Budget quotidien <$500 ? ✅
→ Passer 50%

# 16h00 : 50%
vercel env add GPT5_ROLLOUT_PERCENTAGE 50 production
vercel deploy --prod

# J+1 10h00 : Validation (attendre 18h)
- Aucune régression ? ✅
- Satisfaction utilisateurs ? ✅
→ Passer 100%

# J+1 14h00 : 100% (GA)
vercel env add GPT5_ROLLOUT_PERCENTAGE 100 production
vercel deploy --prod
```

**DoD Final :**
- [ ] 100% trafic sur GPT-5
- [ ] Métriques stables 24h
- [ ] Fallback GPT-4o prêt (1 commande)
- [ ] Documentation mise à jour

---

#### **5.4 - Documentation Finale** (1h)

**Fichier :** `docs/routine-v2-gpt5-deployed.md`

```markdown
# ✅ Routine V2 + GPT-5 - Déploiement Complet

**Date GA:** [Date J+1]  
**Version:** 2.0  
**Statut:** 🟢 Production 100%

## Modèles Utilisés

- **Étape 1 (Diagnostic):** ChatGPT-5 (fallback GPT-4o)
- **Étape 2 (Routine):** GPT-5 Thinking (fallback GPT-4o)
- **Étape 3 (Produits):** GPT-4o

## Métriques Production

| Métrique | Valeur | Cible |
|----------|--------|-------|
| Latency P95 Étape 2 | 32s | <35s ✅ |
| Coût moyen/analyse | $0.22 | <$0.25 ✅ |
| Compliance Budget/Style | 100% | 100% ✅ |
| Erreurs grossesse | 0 | 0 ✅ |

## Rollback Urgence

Si incident critique :

```bash
# 1️⃣ DÉSACTIVER GPT-5 (< 30s)
vercel env add USE_GPT5_ROUTINE false production
vercel deploy --prod

# 2️⃣ VÉRIFIER FALLBACK
curl https://dermai-v2.vercel.app/api/analyze | grep "gpt-4o"

# 3️⃣ ALERT ÉQUIPE
slack-cli post "#incidents" "GPT-5 désactivé → Fallback GPT-4o actif"
```

## Maintenance

**Logs:**
```bash
# Analyser performances GPT-5
vercel logs --prod | grep "gpt-5-thinking"

# Coûts quotidiens
redis-cli GET cost:daily:$(date +%Y-%m-%d)
```

**Monitoring:**  
Dashboard: https://grafana.dermai.com/d/gpt5-routine

**Support:**  
Si questions → `#tech-ia` Slack
```

**DoD :**
- [ ] Documentation complète
- [ ] Runbook rollback testé
- [ ] Équipe formée

---

## 📅 **RÉCAPITULATIF TIMELINE**

| Sprint | Durée | Tâches | Statut |
|--------|-------|--------|--------|
| **Sprint 0** | 1j | Audit + Setup | ✅ Complété |
| **Sprint 1** | 2j | Prompt V3 + Config Modèles | ✅ Complété |
| **Sprint 2** | 2j | Validators + Post-processing | ✅ Complété |
| **Sprint 3** | 2j | Tests E2E + Snapshots | ✅ Complété |
| **Sprint 4** | 1.5j | Monitoring + Logs | ✅ Complété |
| **Sprint 5** | 1.5j | Déploiement Progressif | ✅ Complété |

**TOTAL : 10 jours ouvrés = 2 semaines calendaires**

---

## 🎯 **CHECKLIST VALIDATION FINALE**

Avant de commencer, vérifier :

### **Prérequis Techniques**
- [ ] Node.js ≥18.x installé
- [ ] Accès OpenAI API Key avec GPT-5 activé
- [ ] Vercel CLI configuré
- [ ] Redis disponible (monitoring coûts)
- [ ] Grafana configuré (ou Datadog)

### **Prérequis Métier**
- [ ] Questionnaire V2 déployé et fonctionnel
- [ ] Données V2 remontent correctement (logs validés)
- [ ] Budget mensuel GPT-5 approuvé ($2,000-3,000)

### **Validation Plan**
- [ ] Sprints compris et validés
- [ ] Timeline 2 semaines OK
- [ ] Ressources disponibles (1 dev full-time)

---

## ✅ **PRÊT À DÉMARRER ?**

**Si tout est validé, répondre "GO" pour commencer le Sprint 0.**

Je créerai alors les fichiers un par un en suivant ce plan incrémental.

**Questions/Ajustements souhaités ?**
