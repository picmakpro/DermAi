# 📋 PLAN INCRÉMENTAL DÉTAILLÉ - QUESTIONNAIRE V2

> **Version** : 1.0  
> **Date** : 29 septembre 2025  
> **Objectif** : Enrichissement questionnaire utilisateur pour personnalisation IA maximale  
> **Durée estimée** : 3h30 (4 sprints)

---

## 🎯 **CONTEXTE & OBJECTIFS**

### **Flux Actuel Analysé**
```
SkinQuestionnaire.tsx → sessionStorage → /analyze page → /api/analyze → AnalysisService
                                                                            ↓
                                                                       Étape 1-4 IA
```

### **Objectifs Refonte**
1. ✅ **Grossesse** : Toggle si genre=Femme (restrictions rétinol, acides forts, HE)
2. ✅ **Localisation** : City/Country (requis) + Lat/Lon (opt.) → UV risk band
3. ✅ **Budget 3 paliers** : Essentiel (30-70€) / Confort (70-150€) / Expert (150-300€)
4. ✅ **Style routine** : Rapide (3-5 étapes) / Équilibrée (6-8) / Complète (9-12)
5. ✅ **Concerns max 3** : Déjà implémenté, garder tel quel
6. ✅ **Allergies** : Ne pas toucher (existant préservé)

### **Principe Directeur**
- ❌ **Ne pas casser** le code existant
- ✅ **Rétrocompatibilité** totale (anciennes analyses fonctionnent)
- ✅ **Validation Zod stricte** (conformité Sprint 1 fiabilité)
- ✅ **Privacy-first** : Pas de géoloc auto, opt-in manuel uniquement

---

## 🏗️ **ARCHITECTURE DES SPRINTS**

### **SPRINT 0 : Fondations (30min)** ⚙️
> Création schémas, types, constantes - Pas de modification UI

**Fichiers à créer :**
```
src/schemas/questionnaire.ts          [NOUVEAU]
src/constants/questionnaire.ts        [NOUVEAU]  
src/utils/uvRiskCalculator.ts         [NOUVEAU]
src/types/questionnaire.ts            [NOUVEAU]
```

**Tâches détaillées :**

| # | Tâche | Fichier | Détails |
|---|-------|---------|---------|
| 0.1 | Schémas Zod questionnaire V2 | `schemas/questionnaire.ts` | `zBudgetTier`, `zRoutineStyle`, `zGender`, `zPregnancy`, `zLocation`, `zStep2Questionnaire` |
| 0.2 | Constantes budget & routine | `constants/questionnaire.ts` | `BUDGET_MAP`, `STYLE_POLICY`, `BUDGET_TIERS`, `ROUTINE_STYLES` |
| 0.3 | Fonction calcul UV | `utils/uvRiskCalculator.ts` | `uvRiskFromLatMonth()`, `fallbackLatFromCountry()` |
| 0.4 | Types TypeScript | `types/questionnaire.ts` | `BudgetTier`, `RoutineStyle`, `LocationData`, `PregnancyData` |

**Contenu Schémas Zod (`schemas/questionnaire.ts`) :**
```typescript
import { z } from "zod";

export const zBudgetTier = z.enum(["Essentiel", "Confort", "Expert"]);
export const zRoutineStyle = z.enum(["Rapide", "Équilibrée", "Complète"]);
export const zGender = z.enum(["Femme", "Homme", "Autre", "Ne souhaite pas préciser"]);

export const zPregnancy = z.object({
  isPregnant: z.boolean(),
}).optional();

export const zLocation = z.object({
  city: z.string().min(1, "Ville requise"),
  country: z.string().min(1, "Pays requis"),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
});

export const zStep2Questionnaire = z.object({
  userProfile: z.object({
    age: z.number().int().min(12).max(100),
    gender: zGender,
    skinType: z.string().optional(),
  }),
  
  pregnancy: zPregnancy,
  location: zLocation,
  
  constraints: z.object({
    budget: z.object({ tier: zBudgetTier }),
    routineStyle: zRoutineStyle,
    // Préserver champs existants
    allergies: z.array(z.string()).optional(),
    preferences: z.record(z.any()).optional(),
  }),
  
  skinConcerns: z.object({
    primary: z.array(z.string()).max(3, "Maximum 3 préoccupations").default([]),
  }),
})
.refine(
  (d) => d.userProfile.gender !== "Femme" || d.pregnancy !== undefined,
  { message: "Statut grossesse requis pour les femmes", path: ["pregnancy"] }
);

export type QuestionnaireV2 = z.infer<typeof zStep2Questionnaire>;
```

**Contenu Constantes Budget (`constants/questionnaire.ts`) :**
```typescript
export type BudgetTier = "Essentiel" | "Confort" | "Expert";
export type RoutineStyle = "Rapide" | "Équilibrée" | "Complète";

// Mapping budget → SKU count, prix/SKU, etc.
export const BUDGET_MAP = {
  Essentiel: { 
    min: 30, 
    max: 70, 
    plannedSkuCount: [3, 4], 
    perSkuTarget: [10, 18], 
    perSkuHardCap: 25 
  },
  Confort: { 
    min: 70, 
    max: 150, 
    plannedSkuCount: [4, 5], 
    perSkuTarget: [15, 30], 
    perSkuHardCap: 40 
  },
  Expert: { 
    min: 150, 
    max: 300, 
    plannedSkuCount: [5, 7], 
    perSkuTarget: [25, 45], 
    perSkuHardCap: 60 
  },
} as const;

// Politique complexité routine selon style
export const STYLE_POLICY = {
  Rapide: { 
    treatmentsMaxAdaptation: 1, 
    weeklyMax: 0, 
    morningMax: 3, 
    eveningMax: 3 
  },
  Équilibrée: { 
    treatmentsMaxAdaptation: 2, 
    weeklyMax: 1, 
    morningMax: 3, 
    eveningMax: 4 
  },
  Complète: { 
    treatmentsMaxAdaptation: 2, 
    weeklyMax: 2, 
    morningMax: 4, 
    eveningMax: 4 
  },
} as const;

// UI Labels pour les selects
export const BUDGET_TIERS_UI = [
  { value: "Essentiel", label: "Essentiel — Base efficace (30-70€/mois)" },
  { value: "Confort", label: "Confort — Latitude ciblée (70-150€/mois)" },
  { value: "Expert", label: "Expert — Budget généreux (150-300€/mois)" },
] as const;

export const ROUTINE_STYLES_UI = [
  { value: "Rapide", label: "Rapide — Épurée : 3 matin, 2-3 soir" },
  { value: "Équilibrée", label: "Équilibrée — Standard : 3 matin, 3-4 soir" },
  { value: "Complète", label: "Complète — Détaillée : 3 matin, 3-4 soir + hebdo" },
] as const;
```

**Contenu Calculateur UV (`utils/uvRiskCalculator.ts`) :**
```typescript
export type UvBand = "Low" | "Moderate" | "High" | "VeryHigh";

/**
 * Calcule le risque UV selon latitude et mois
 * @param lat Latitude (-90 à 90)
 * @param month Mois (1-12)
 * @returns Bande de risque UV
 */
export function uvRiskFromLatMonth(lat: number, month: number): UvBand {
  const abs = Math.abs(lat);
  
  // Latitudes élevées (>50°) : rayonnement faible sauf été
  if (abs >= 50) {
    if ([6, 7, 8].includes(month)) return "High";
    if ([5, 9].includes(month)) return "Moderate";
    return "Low";
  }
  
  // Latitudes moyennes (30-50°) : rayonnement modéré à élevé
  if (abs >= 30) {
    if ([6, 7, 8].includes(month)) return "VeryHigh";
    if ([4, 5, 9, 10].includes(month)) return "High";
    return "Moderate";
  }
  
  // Latitudes basses (<30°) : rayonnement fort toute l'année
  return "VeryHigh";
}

/**
 * Fallback latitude par pays si coords non fournies
 * @param country Code pays ou nom
 * @returns Latitude approximative
 */
export function fallbackLatFromCountry(country: string): number {
  const countryLats: Record<string, number> = {
    'France': 46.0,
    'FR': 46.0,
    'Belgique': 50.5,
    'BE': 50.5,
    'Suisse': 47.0,
    'CH': 47.0,
    'Canada': 56.0,
    'CA': 56.0,
    'Maroc': 32.0,
    'MA': 32.0,
    'Tunisie': 34.0,
    'TN': 34.0,
    'Algérie': 28.0,
    'DZ': 28.0,
    // ... autres pays
  };
  
  return countryLats[country] || 45.0; // Défaut: latitude moyenne Europe
}

/**
 * Politique SPF dérivée du risque UV (pour micro-copy UI)
 */
export function uvPolicyMessage(uvBand: UvBand): string {
  const messages = {
    Low: "Renouveler si exposition prolongée",
    Moderate: "Renouveler toutes les 2-3h en extérieur",
    High: "Renouveler toutes les 2h + protection recommandée",
    VeryHigh: "Renouveler toutes les 2h + chapeau/lunettes conseillés"
  };
  return messages[uvBand];
}
```

**Contenu Types (`types/questionnaire.ts`) :**
```typescript
export type BudgetTier = "Essentiel" | "Confort" | "Expert";
export type RoutineStyle = "Rapide" | "Équilibrée" | "Complète";
export type UvBand = "Low" | "Moderate" | "High" | "VeryHigh";

export interface PregnancyData {
  isPregnant: boolean;
}

export interface LocationData {
  city: string;
  country: string;
  lat?: number;
  lon?: number;
}

export interface BudgetConfig {
  tier: BudgetTier;
}

export interface RoutineContext {
  profile: {
    age: number;
    gender: string;
    pregnancy: boolean;
  };
  constraints: {
    budgetTier: BudgetTier;
    style: RoutineStyle;
  };
  environment: {
    uvRiskBand: UvBand;
  };
}
```

**Tests d'acceptation Sprint 0 :**
- [ ] Schémas Zod validables sans erreur
- [ ] Constantes exportables depuis `@/constants/questionnaire`
- [ ] Fonction UV retourne "Low"|"Moderate"|"High"|"VeryHigh"
- [ ] Test: `uvRiskFromLatMonth(48.8, 6)` → "VeryHigh" (Paris, juin)
- [ ] Test: `uvRiskFromLatMonth(60, 1)` → "Low" (Stockholm, janvier)
- [ ] Pas de breaking changes sur code existant

---

### **SPRINT 1 : Extension Types & API (45min)** 🔌
> Modification types API + adaptation backend - Pas de modification UI

**Fichiers à modifier :**
```
src/types/api.ts                      [MODIFIER]
src/app/api/analyze/route.ts          [MODIFIER]
```

**Tâches détaillées :**

| # | Tâche | Fichier | Détails |
|---|-------|---------|---------|
| 1.1 | Étendre `UserProfile` | `types/api.ts` | Ajouter champs optionnels `pregnancy?: PregnancyData` |
| 1.2 | Créer `LocationData` interface | `types/api.ts` | Exporter depuis `types/questionnaire.ts` |
| 1.3 | Remplacer `CurrentRoutine` | `types/api.ts` | Budget → `budgetTier?`, ajouter `routineStyle?`, `location?` |
| 1.4 | Adapter `AnalyzeRequest` | `types/api.ts` | Intégrer nouveaux champs en **optionnels** (rétrocompat) |
| 1.5 | Logs backend enrichis | `api/analyze/route.ts` | Logger nouveaux champs avec tag `[questionnaire_v2]` |
| 1.6 | Calculer `uvRiskBand` | `api/analyze/route.ts` | Appeler `uvRiskFromLatMonth()` dans adaptateur |
| 1.7 | Adaptateur service | `api/analyze/route.ts` | Mapper nouveaux champs vers format `ServiceAnalyzeRequest` |

**Modification `types/api.ts` (delta uniquement) :**
```typescript
import type { PregnancyData, LocationData, BudgetTier, RoutineStyle } from './questionnaire'

export interface UserProfile {
  age: number
  gender: 'Homme' | 'Femme' | 'Autre' | 'Ne souhaite pas préciser'
  skinType: 'Sèche' | 'Normale' | 'Mixte' | 'Grasse' | 'Sensible' | 'Je ne sais pas'
  
  // ✅ NOUVEAUX CHAMPS V2 (optionnels pour rétrocompat)
  pregnancy?: PregnancyData
}

export interface CurrentRoutine {
  morningProducts: string[]
  eveningProducts: string[]
  
  // ANCIEN FORMAT (deprecated mais supporté)
  routinePreference?: 'Minimaliste' | 'Simple' | 'Équilibrée' | 'Complète'
  monthlyBudget?: '< 50€' | '50-100€' | '100-200€' | '> 200€' | 'Pas de limite'
  
  // ✅ NOUVEAU FORMAT V2
  budgetTier?: BudgetTier
  routineStyle?: RoutineStyle
}

export interface AnalyzeRequest {
  photos: PhotoUpload[]
  userProfile: UserProfile
  skinConcerns: SkinConcerns
  currentRoutine: CurrentRoutine
  allergies?: {
    ingredients: string[]
    pastReactions: string
  }
  
  // ✅ NOUVEAUX CHAMPS V2
  location?: LocationData
}
```

**Modification `api/analyze/route.ts` (logs + adaptateur) :**
```typescript
import { uvRiskFromLatMonth, fallbackLatFromCountry } from '@/utils/uvRiskCalculator'
import type { RoutineContext } from '@/types/questionnaire'

export async function POST(request: NextRequest) {
  const requestId = Logger.generateRequestId()
  // ... code existant ...
  
  try {
    const body: ApiAnalyzeRequest = await request.json()
    apiBody = body
    
    // ✅ LOGS QUESTIONNAIRE V2
    console.info("[questionnaire_v2] payload", {
      gender: body.userProfile.gender,
      isPregnant: body.userProfile.pregnancy?.isPregnant ?? null,
      city: body.location?.city ?? null,
      country: body.location?.country ?? null,
      lat: body.location?.lat ?? null,
      lon: body.location?.lon ?? null,
      budgetTier: body.currentRoutine.budgetTier ?? "legacy",
      routineStyle: body.currentRoutine.routineStyle ?? "legacy",
      concernsPrimary: body.skinConcerns.primary,
    });
    
    // ✅ CALCUL UV RISK
    let uvRiskBand: UvBand = "Moderate"; // Défaut
    if (body.location) {
      const now = new Date();
      const month = now.getUTCMonth() + 1;
      const lat = body.location.lat ?? fallbackLatFromCountry(body.location.country);
      uvRiskBand = uvRiskFromLatMonth(lat, month);
      
      logger.info(`UV Risk calculé: ${uvRiskBand}`, { 
        lat, 
        month, 
        country: body.location.country 
      });
    }
    
    // ✅ CONTEXTE ROUTINE ENRICHI (pour Étape 2 IA)
    const routineContext: RoutineContext = {
      profile: {
        age: body.userProfile.age,
        gender: body.userProfile.gender,
        pregnancy: body.userProfile.gender === "Femme" 
          ? (body.userProfile.pregnancy?.isPregnant ?? false) 
          : false,
      },
      constraints: {
        budgetTier: body.currentRoutine.budgetTier ?? "Confort", // Fallback
        style: body.currentRoutine.routineStyle ?? "Équilibrée",
      },
      environment: {
        uvRiskBand,
      }
    };
    
    // Passer routineContext au service AnalysisService
    // (Modification dans Sprint 4)
    
    // ... reste du code existant ...
  }
}
```

**Tests d'acceptation Sprint 1 :**
- [ ] API accepte ancien format (sans nouveaux champs) → pas d'erreur
- [ ] API accepte nouveau format complet → validation OK
- [ ] Logs backend affichent `[questionnaire_v2] payload` avec tous les champs
- [ ] `uvRiskBand` calculé correctement :
  - Paris (lat=48.8, juin) → "VeryHigh"
  - Stockholm (lat=60, janvier) → "Low"
- [ ] Anciennes analyses (sans location) → `uvRiskBand="Moderate"` (défaut)
- [ ] Aucune régression sur tests E2E existants

---

### **SPRINT 2 : UI Questionnaire - Phase 1 (1h)** 🎨
> Ajout champs : Genre, Grossesse, Localisation

**Fichiers à modifier :**
```
src/components/forms/SkinQuestionnaire.tsx  [MODIFIER]
```

**Tâches détaillées :**

| # | Tâche | Section UI | Détails |
|---|-------|-----------|---------|
| 2.1 | Modifier type `QuestionnaireData` | Interface locale | Ajouter `pregnancy?`, `location?` |
| 2.2 | Initialiser nouveaux champs | State initial | `pregnancy: undefined`, `location: { city: '', country: '' }` |
| 2.3 | Champ Genre (Step 1) | Profil utilisateur | Radio horizontal `Femme/Homme/Autre` (remplacer select) |
| 2.4 | Toggle Grossesse conditionnel | Profil utilisateur | Visible uniquement si `gender === "Femme"` |
| 2.5 | Validation grossesse | Fonction `isFormComplete()` | `pregnancy` requis si `Femme`, erreur si undefined |
| 2.6 | Nouveau Step: Localisation | Nouveau step (après profil) | Input `city` (requis), `country` (requis) |
| 2.7 | Inputs lat/lon optionnels | Step localisation | Type number, step 0.000001, placeholder |
| 2.8 | Hint localisation | Step localisation | "Ces infos servent uniquement à adapter la protection solaire" |
| 2.9 | Incrémenter `totalSteps` | Constante | Passer de 8 à 9 steps |
| 2.10 | Gestion navigation | Fonctions `handleNext` | Valider localisation avant passage au step suivant |

**Modification `QuestionnaireData` interface :**
```typescript
interface QuestionnaireData {
  userProfile: UserProfile & {
    pregnancy?: PregnancyData  // ✅ NOUVEAU
  }
  location?: LocationData      // ✅ NOUVEAU
  skinConcerns: SkinConcerns & {
    otherText: string
  }
  currentRoutine: CurrentRoutine
  allergies: {
    ingredients: string[]
    pastReactions: string
  }
}
```

**UI Step 1 - Genre + Grossesse (modification existant) :**
```tsx
{/* STEP 1: Profil utilisateur - MODIFIER */}
case 1:
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl lg:text-3xl font-bold">Votre profil</h2>
      </div>

      {/* Age (existant, garder tel quel) */}
      
      {/* ✅ NOUVEAU: Genre en radio horizontal */}
      <div>
        <label className="block text-sm font-medium mb-2">Genre *</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Femme', 'Homme', 'Autre', 'Ne souhaite pas préciser'].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => {
                updateData('userProfile', { gender: g })
                // Reset pregnancy si pas Femme
                if (g !== 'Femme') {
                  updateData('userProfile', { pregnancy: undefined })
                }
              }}
              className={`p-3 rounded-xl border-2 transition-all ${
                data.userProfile.gender === g
                  ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700'
                  : 'border-dermai-nude-200 bg-white hover:border-dermai-ai-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ NOUVEAU: Toggle Grossesse conditionnel */}
      {data.userProfile.gender === 'Femme' && (
        <div className="p-4 bg-dermai-ai-50 rounded-xl border border-dermai-ai-200">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-dermai-neutral-900">
              Grossesse en cours *
            </span>
            <input
              type="checkbox"
              checked={data.userProfile.pregnancy?.isPregnant ?? false}
              onChange={(e) => {
                updateData('userProfile', { 
                  pregnancy: { isPregnant: e.target.checked } 
                })
              }}
              className="w-5 h-5 text-dermai-ai-600 rounded focus:ring-dermai-ai-500"
            />
          </label>
          <p className="text-xs text-dermai-neutral-600 mt-2">
            Nous adapterons votre routine (exclusion rétinol, acides forts, etc.)
          </p>
        </div>
      )}

      {/* Type de peau (existant, garder tel quel) */}
    </div>
  )
```

**UI Nouveau Step - Localisation :**
```tsx
{/* ✅ NOUVEAU STEP 1.5: Localisation */}
case 1.5: // Insérer entre profil (1) et concerns (2)
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl lg:text-3xl font-bold">🌍 Localisation</h2>
        <p className="text-dermai-neutral-600 mt-2">
          Ces infos servent uniquement à adapter la protection solaire à votre climat.
        </p>
      </div>

      <div className="space-y-4">
        {/* Ville (requis) */}
        <div>
          <label className="block text-sm font-medium mb-2">Ville *</label>
          <input
            type="text"
            placeholder="Ex: Paris"
            value={data.location?.city ?? ''}
            onChange={(e) => updateData('location', { 
              ...data.location, 
              city: e.target.value 
            })}
            className="w-full px-4 py-3 border-2 border-dermai-nude-200 rounded-xl focus:border-dermai-ai-500 focus:outline-none"
            required
          />
        </div>

        {/* Pays (requis) */}
        <div>
          <label className="block text-sm font-medium mb-2">Pays *</label>
          <input
            type="text"
            placeholder="Ex: France"
            value={data.location?.country ?? ''}
            onChange={(e) => updateData('location', { 
              ...data.location, 
              country: e.target.value 
            })}
            className="w-full px-4 py-3 border-2 border-dermai-nude-200 rounded-xl focus:border-dermai-ai-500 focus:outline-none"
            required
          />
        </div>

        {/* Latitude/Longitude (optionnels) */}
        <details className="p-4 bg-dermai-nude-50 rounded-xl">
          <summary className="cursor-pointer text-sm font-medium text-dermai-neutral-700">
            Coordonnées GPS (optionnel, pour précision UV maximale)
          </summary>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs text-dermai-neutral-600 mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                placeholder="48.8566"
                value={data.location?.lat ?? ''}
                onChange={(e) => updateData('location', { 
                  ...data.location, 
                  lat: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 text-sm border border-dermai-nude-300 rounded-lg focus:border-dermai-ai-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-dermai-neutral-600 mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                placeholder="2.3522"
                value={data.location?.lon ?? ''}
                onChange={(e) => updateData('location', { 
                  ...data.location, 
                  lon: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 text-sm border border-dermai-nude-300 rounded-lg focus:border-dermai-ai-500 focus:outline-none"
              />
            </div>
          </div>
        </details>
      </div>
    </div>
  )
```

**Validation `isFormComplete()` enrichie :**
```typescript
const isFormComplete = () => {
  // Profil de base
  if (!data.userProfile.age || !data.userProfile.gender || !data.userProfile.skinType) {
    return false
  }
  
  // ✅ NOUVEAU: Validation grossesse si Femme
  if (data.userProfile.gender === 'Femme' && data.userProfile.pregnancy === undefined) {
    return false
  }
  
  // ✅ NOUVEAU: Validation localisation
  if (!data.location?.city || !data.location?.country) {
    return false
  }
  
  // Reste de la validation existante...
  if (data.skinConcerns.primary.length === 0) {
    return false
  }
  
  // ... etc.
  
  return true
}
```

**Tests d'acceptation Sprint 2 :**
- [ ] Genre affiché en radio (4 options visibles horizontalement)
- [ ] Toggle grossesse visible **uniquement** si `gender === "Femme"`
- [ ] Toggle grossesse **invisible** si Homme/Autre/Non précisé
- [ ] Si Femme sélectionnée puis changement vers Homme → toggle disparaît + pregnancy reset
- [ ] Validation bloque soumission si Femme + pregnancy undefined
- [ ] Message erreur explicite : "Veuillez indiquer votre statut grossesse"
- [ ] Step localisation affiche 4 champs (ville, pays requis | lat, lon optionnels)
- [ ] Impossible de passer au step suivant si city ou country vides
- [ ] Lat/lon acceptent décimales à 6 chiffres
- [ ] Données stockées dans sessionStorage au `handleSubmit()`
- [ ] Navigation précédent/suivant fonctionne correctement

---

### **SPRINT 3 : UI Questionnaire - Phase 2 (1h)** 💎
> Ajout champs : Budget 3 paliers, Style routine

**Fichiers à modifier :**
```
src/components/forms/SkinQuestionnaire.tsx  [MODIFIER]
src/components/forms/ImprovedSummary.tsx    [MODIFIER]
src/constants/index.ts                      [MODIFIER - déprécier ancien BUDGET_RANGES]
```

**Tâches détaillées :**

| # | Tâche | Section UI | Détails |
|---|-------|-----------|---------|
| 3.1 | Importer constantes V2 | Import section | `import { BUDGET_TIERS_UI, ROUTINE_STYLES_UI } from '@/constants/questionnaire'` |
| 3.2 | Ajouter champs V2 à state | Interface `QuestionnaireData` | `budgetTier?: BudgetTier`, `routineStyle?: RoutineStyle` |
| 3.3 | Remplacer Step Budget | Step 5 (existant) | Select 3 options avec micro-copy longue |
| 3.4 | Nouveau champ Style | Après budget (même step) | Select 3 options avec micro-copy |
| 3.5 | Validation budget/style | `isFormComplete()` | Vérifier `budgetTier` et `routineStyle` remplis |
| 3.6 | Summary enrichi | `ImprovedSummary.tsx` | Afficher budget tier + style + localisation |
| 3.7 | Dépréciation ancien budget | `constants/index.ts` | Ajouter commentaire `@deprecated` sur `BUDGET_RANGES` |

**Modification Step Budget/Style (remplacer step existant 5) :**
```tsx
{/* STEP 5: Budget et Style de Routine - REMPLACER */}
case 5:
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl lg:text-3xl font-bold">Budget et Routine</h2>
        <p className="text-dermai-neutral-600 mt-2">
          Aidez-nous à personnaliser vos recommandations
        </p>
      </div>

      {/* ✅ NOUVEAU: Budget 3 paliers */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Budget mensuel produits skincare *
        </label>
        <div className="space-y-3">
          {BUDGET_TIERS_UI.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateData('currentRoutine', { budgetTier: value })}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                data.currentRoutine.budgetTier === value
                  ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                  : 'border-dermai-nude-200 bg-white hover:border-dermai-ai-300'
              }`}
            >
              <div className="font-medium">{label.split('—')[0].trim()}</div>
              <div className="text-sm text-dermai-neutral-600 mt-1">
                {label.split('—')[1]?.trim()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ✅ NOUVEAU: Style de routine */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Style de routine souhaité *
        </label>
        <div className="space-y-3">
          {ROUTINE_STYLES_UI.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateData('currentRoutine', { routineStyle: value })}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                data.currentRoutine.routineStyle === value
                  ? 'border-dermai-ai-500 bg-dermai-ai-50 text-dermai-ai-700 shadow-glow'
                  : 'border-dermai-nude-200 bg-white hover:border-dermai-ai-300'
              }`}
            >
              <div className="font-medium">{label.split('—')[0].trim()}</div>
              <div className="text-sm text-dermai-neutral-600 mt-1">
                {label.split('—')[1]?.trim()}
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-dermai-neutral-500 text-center">
        Ces préférences optimiseront vos recommandations produits et timing
      </p>
    </div>
  )
```

**Validation enrichie :**
```typescript
const isFormComplete = () => {
  // ... validations existantes ...
  
  // ✅ NOUVEAU: Budget et Style requis
  if (!data.currentRoutine.budgetTier || !data.currentRoutine.routineStyle) {
    return false
  }
  
  return true
}
```

**Modification `ImprovedSummary.tsx` (affichage résumé) :**
```tsx
{/* Section Budget et Routine */}
<div className="bg-white rounded-xl p-5 shadow-sm border border-dermai-nude-200">
  <h3 className="font-semibold text-dermai-neutral-900 mb-3 flex items-center gap-2">
    <span className="text-xl">💰</span>
    Budget et Routine
  </h3>
  
  {data.currentRoutine.budgetTier && (
    <p className="text-sm">
      <span className="font-medium text-dermai-neutral-700">Budget :</span>{' '}
      {BUDGET_TIERS_UI.find(b => b.value === data.currentRoutine.budgetTier)?.label.split('—')[0]}
    </p>
  )}
  
  {data.currentRoutine.routineStyle && (
    <p className="text-sm mt-1">
      <span className="font-medium text-dermai-neutral-700">Style :</span>{' '}
      {ROUTINE_STYLES_UI.find(s => s.value === data.currentRoutine.routineStyle)?.label.split('—')[0]}
    </p>
  )}
</div>

{/* ✅ NOUVEAU: Localisation */}
{data.location && (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-dermai-nude-200">
    <h3 className="font-semibold text-dermai-neutral-900 mb-3 flex items-center gap-2">
      <span className="text-xl">🌍</span>
      Localisation
    </h3>
    <p className="text-sm">
      <span className="font-medium text-dermai-neutral-700">Ville :</span> {data.location.city}
    </p>
    <p className="text-sm mt-1">
      <span className="font-medium text-dermai-neutral-700">Pays :</span> {data.location.country}
    </p>
    {data.location.lat && data.location.lon && (
      <p className="text-xs text-dermai-neutral-500 mt-2">
        Coordonnées GPS fournies pour précision UV maximale ✓
      </p>
    )}
  </div>
)}
```

**Tests d'acceptation Sprint 3 :**
- [ ] Step Budget affiche 3 boutons (Essentiel, Confort, Expert)
- [ ] Micro-copy visible sur 2 lignes par bouton
- [ ] Sélection budget → bouton highlight avec border AI-500
- [ ] Step Style affiche 3 boutons (Rapide, Équilibrée, Complète)
- [ ] Micro-copy affiche nombre d'étapes approximatif
- [ ] Validation bloque si budget ou style non sélectionnés
- [ ] Message erreur : "Veuillez choisir votre budget et style de routine"
- [ ] Summary final affiche :
  - Budget tier (nom uniquement, pas montant)
  - Style routine (nom + description courte)
  - Localisation (ville, pays, mention GPS si fourni)
- [ ] Anciennes analyses (avec ancien `monthlyBudget`) ne cassent pas
- [ ] Rétrocompatibilité: API accepte toujours ancien format

---

### **SPRINT 4 : Intégration Prompts IA (30min)** 🤖
> Transmission données enrichies → Prompt Étape 2 IA

**Fichiers à modifier :**
```
src/app/api/analyze/route.ts                              [MODIFIER]
src/services/ai/core/prompts/routinePersonnalisee.ts     [MODIFIER]
src/services/ai/core/AnalysisServiceV3Adapter.ts         [MODIFIER - si existant]
```

**Tâches détaillées :**

| # | Tâche | Fichier | Détails |
|---|-------|---------|---------|
| 4.1 | Passer `routineContext` au service | `api/analyze/route.ts` | Enrichir appel `AnalysisService.analyzeSkinComplete()` |
| 4.2 | Accepter contexte dans service | `AnalysisService.ts` | Ajouter param optionnel `routineContext?` |
| 4.3 | Enrichir prompt Étape 2 | `prompts/routinePersonnalisee.ts` | Injecter pregnancy, uvRiskBand, budgetTier, routineStyle |
| 4.4 | Adapter contraintes grossesse | Prompt Étape 2 | Exclusions: rétinol, acides >2%, HE si `pregnancy=true` |
| 4.5 | Adapter SPF selon UV | Prompt Étape 2 | SPF30 min si `uvRiskBand=High/VeryHigh` |
| 4.6 | Adapter complexité selon style | Prompt Étape 2 | Limites steps selon `STYLE_POLICY[routineStyle]` |
| 4.7 | Logs enrichis Étape 2 | Service IA | Logger contexte utilisé pour génération routine |

**Modification Prompt Routine Personnalisée (`prompts/routinePersonnalisee.ts`) :**
```typescript
import type { RoutineContext } from '@/types/questionnaire'
import { BUDGET_MAP, STYLE_POLICY } from '@/constants/questionnaire'

export function buildRoutinePrompt(
  diagnostic: any, 
  routineContext?: RoutineContext
): string {
  
  const budgetConstraints = routineContext?.constraints.budgetTier 
    ? BUDGET_MAP[routineContext.constraints.budgetTier]
    : null;
  
  const stylePolicy = routineContext?.constraints.style
    ? STYLE_POLICY[routineContext.constraints.style]
    : null;
  
  return `Tu es un expert dermatologue avec 15 ans d'expérience en dermatologie cosmétique.

# CONTEXTE PATIENT

## Diagnostic Visuel
${JSON.stringify(diagnostic, null, 2)}

## Profil Utilisateur
- Âge : ${routineContext?.profile.age ?? 'non précisé'} ans
- Genre : ${routineContext?.profile.gender ?? 'non précisé'}
${routineContext?.profile.pregnancy ? `
⚠️ **GROSSESSE EN COURS** - RESTRICTIONS STRICTES :
- ❌ EXCLURE : Rétinol, rétinaldéhyde, acides >2%, huiles essentielles, benzopéroxyde >2.5%
- ✅ PRIVILÉGIER : Acide azélaïque ≤10%, niacinamide, peptides, céramides
` : ''}

## Contraintes Environnementales
${routineContext?.environment.uvRiskBand ? `
- **Risque UV** : ${routineContext.environment.uvRiskBand}
${routineContext.environment.uvRiskBand === 'VeryHigh' || routineContext.environment.uvRiskBand === 'High' 
  ? '  → SPF 50+ OBLIGATOIRE (renouveler toutes les 2h en extérieur)'
  : '  → SPF 30+ recommandé'
}
` : ''}

## Contraintes Budget & Routine
${budgetConstraints ? `
- **Budget mensuel** : ${routineContext!.constraints.budgetTier} (${budgetConstraints.min}-${budgetConstraints.max}€)
- **Produits planifiés** : ${budgetConstraints.plannedSkuCount[0]}-${budgetConstraints.plannedSkuCount[1]} SKUs
- **Prix/produit cible** : ${budgetConstraints.perSkuTarget[0]}-${budgetConstraints.perSkuTarget[1]}€
- **Prix/produit max** : ${budgetConstraints.perSkuHardCap}€
` : ''}

${stylePolicy ? `
- **Style de routine** : ${routineContext!.constraints.style}
- **Limites étapes** :
  - Matin : max ${stylePolicy.morningMax} étapes
  - Soir : max ${stylePolicy.eveningMax} étapes
  - Traitements en adaptation : max ${stylePolicy.treatmentsMaxAdaptation}
  - Hebdomadaires : max ${stylePolicy.weeklyMax}
` : ''}

# CONSIGNES GÉNÉRATION ROUTINE

1. **Personnalisation Maximale** : Adapter CHAQUE étape au diagnostic ET au profil
2. **Respect Contraintes** : Ne JAMAIS dépasser les limites budget/style
3. **Sécurité Grossesse** : Si pregnancy=true, double-check chaque ingrédient
4. **Protection Solaire** : Adapter SPF selon uvRiskBand

... [reste du prompt existant] ...
`;
}
```

**Modification Service Analysis (`api/analyze/route.ts`) :**
```typescript
export async function POST(request: NextRequest) {
  // ... code existant validation + logs questionnaire_v2 ...
  
  // Construire routineContext (déjà fait dans Sprint 1)
  const routineContext: RoutineContext = { /* ... */ };
  
  // ✅ Passer routineContext au service
  const analysis = await AnalysisService.analyzeSkinComplete(
    body,
    routineContext // Nouveau param optionnel
  )
  
  // ... reste du code ...
}
```

**Modification AnalysisService (signature) :**
```typescript
// src/services/ai/AnalysisService.ts
import type { RoutineContext } from '@/types/questionnaire'

export class AnalysisService {
  static async analyzeSkinComplete(
    request: AnalyzeRequest,
    routineContext?: RoutineContext // ✅ Nouveau param optionnel
  ): Promise<SkinAnalysis> {
    
    logger.info('🔥 Analyse V2 Pure démarrée', {
      hasRoutineContext: !!routineContext,
      budgetTier: routineContext?.constraints.budgetTier,
      routineStyle: routineContext?.constraints.style,
      uvRiskBand: routineContext?.environment.uvRiskBand,
      pregnancy: routineContext?.profile.pregnancy
    });
    
    // ... Étape 1: Diagnostic ...
    
    // ✅ Étape 2: Routine Personnalisée avec contexte enrichi
    const routine = await this.generatePersonalizedRoutine(
      diagnostic, 
      request,
      routineContext // Passer le contexte
    );
    
    // ... reste du service ...
  }
  
  private static async generatePersonalizedRoutine(
    diagnostic: any,
    request: AnalyzeRequest,
    routineContext?: RoutineContext
  ) {
    const prompt = buildRoutinePrompt(diagnostic, routineContext);
    
    logger.info('📝 Prompt Étape 2 construit', {
      promptLength: prompt.length,
      hasPregnancyRestrictions: routineContext?.profile.pregnancy,
      uvBand: routineContext?.environment.uvRiskBand
    });
    
    // ... appel OpenAI avec prompt enrichi ...
  }
}
```

**Tests d'acceptation Sprint 4 :**
- [ ] Prompt Étape 2 inclut section "GROSSESSE EN COURS" si `pregnancy=true`
- [ ] Prompt Étape 2 inclut "Risque UV: VeryHigh" si calculé
- [ ] Prompt Étape 2 inclut limites budget (min/max, prix/SKU)
- [ ] Prompt Étape 2 inclut limites style (max steps matin/soir)
- [ ] Logs service affichent `hasRoutineContext: true` quand fourni
- [ ] Routine générée respecte limites style :
  - Style "Rapide" → max 3 étapes matin
  - Style "Complète" → peut aller à 4 étapes matin
- [ ] Routine générée exclut rétinol si `pregnancy=true`
- [ ] Routine générée recommande SPF50+ si `uvRiskBand=VeryHigh`
- [ ] Anciennes analyses (sans routineContext) fonctionnent toujours

---

## ✅ **TESTS FINAUX & VALIDATION**

### **Tests d'Intégration E2E**

```typescript
// tests/e2e/questionnaire-v2.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Questionnaire V2 - Nouveaux Champs', () => {
  
  test('Grossesse conditionnelle - Femme', async ({ page }) => {
    await page.goto('/questionnaire')
    
    // Sélectionner genre Femme
    await page.click('button:has-text("Femme")')
    
    // Toggle grossesse doit être visible
    await expect(page.locator('text=Grossesse en cours')).toBeVisible()
    
    // Cocher grossesse
    await page.check('input[type="checkbox"]:near(:text("Grossesse en cours"))')
    
    // Validation OK
    await page.click('button:has-text("Suivant")')
    await expect(page).not.toHaveURL('/questionnaire') // Progression
  })
  
  test('Grossesse cachée - Homme', async ({ page }) => {
    await page.goto('/questionnaire')
    
    // Sélectionner genre Homme
    await page.click('button:has-text("Homme")')
    
    // Toggle grossesse doit être invisible
    await expect(page.locator('text=Grossesse en cours')).not.toBeVisible()
  })
  
  test('Localisation requise', async ({ page }) => {
    // ... navigation jusqu'au step localisation ...
    
    // Tentative suivant sans ville
    await page.click('button:has-text("Suivant")')
    await expect(page).toHaveURL(/questionnaire/) // Bloqué
    
    // Remplir ville et pays
    await page.fill('input[placeholder*="Paris"]', 'Lyon')
    await page.fill('input[placeholder*="France"]', 'France')
    
    // Maintenant validation OK
    await page.click('button:has-text("Suivant")')
    await expect(page).not.toHaveURL(/questionnaire/)
  })
  
  test('Budget et Style 3 paliers', async ({ page }) => {
    // ... navigation jusqu'au step budget ...
    
    // 3 options budget visibles
    await expect(page.locator('button:has-text("Essentiel")')).toBeVisible()
    await expect(page.locator('button:has-text("Confort")')).toBeVisible()
    await expect(page.locator('button:has-text("Expert")')).toBeVisible()
    
    // Sélection
    await page.click('button:has-text("Confort")')
    await page.click('button:has-text("Équilibrée")')
    
    // Validation OK
    await page.click('button:has-text("Suivant")')
  })
  
  test('Analyse complète avec nouveaux champs', async ({ page }) => {
    // Flux complet
    await page.goto('/upload')
    // ... upload photos ...
    
    await page.goto('/questionnaire')
    // ... remplir tout le formulaire avec nouveaux champs ...
    
    await page.click('button:has-text("Lancer l\'analyse")')
    
    // Attendre résultats
    await page.waitForURL('/results', { timeout: 60000 })
    
    // Vérifier routine adaptée
    await expect(page.locator('text=SPF')).toBeVisible()
  })
})
```

### **Tests Unitaires Backend**

```typescript
// src/utils/__tests__/uvRiskCalculator.test.ts
import { uvRiskFromLatMonth, fallbackLatFromCountry } from '../uvRiskCalculator'

describe('uvRiskCalculator', () => {
  test('Paris juin → VeryHigh', () => {
    expect(uvRiskFromLatMonth(48.8, 6)).toBe('VeryHigh')
  })
  
  test('Stockholm janvier → Low', () => {
    expect(uvRiskFromLatMonth(60, 1)).toBe('Low')
  })
  
  test('Maroc juillet → VeryHigh', () => {
    expect(uvRiskFromLatMonth(32, 7)).toBe('VeryHigh')
  })
  
  test('Fallback France → 46.0', () => {
    expect(fallbackLatFromCountry('France')).toBe(46.0)
  })
})
```

---

## 📊 **MÉTRIQUES DE SUCCÈS**

| Métrique | Cible | Mesure |
|----------|-------|--------|
| **Rétrocompatibilité** | 100% analyses anciennes OK | Tests E2E sur DB prod |
| **Validation Zod** | 0% erreurs en prod | Sentry errors count |
| **Adoption nouveaux champs** | >80% remplissent location | Analytics questionnaire |
| **Grossesse détectée** | >90% femmes répondent | Logs `[questionnaire_v2]` |
| **UV risk calculé** | 100% analyses avec location | Backend metrics |
| **Prompts enrichis** | 100% Étape 2 avec contexte | Service logs |
| **Performance** | <200ms overhead | P95 latency API |

---

## 🚀 **DÉPLOIEMENT**

### **Étapes de Déploiement**

1. **Sprint 0-1** : Déployer fondations (backend uniquement)
   - Validation : Logs `[questionnaire_v2]` présents (tous champs null)
   - Rollback : Aucun changement UI → sans risque

2. **Sprint 2-3** : Déployer UI (feature flag possible)
   - Validation : Nouveaux champs visibles mais optionnels
   - Rollback : Flag OFF → ancien questionnaire

3. **Sprint 4** : Activer prompts enrichis
   - Validation : Routines mieux personnalisées (A/B test)
   - Rollback : Retour prompts classiques

### **Rollback Plan**

```typescript
// Feature flag simple
const USE_QUESTIONNAIRE_V2 = process.env.NEXT_PUBLIC_QUESTIONNAIRE_V2 === 'true'

// Dans SkinQuestionnaire.tsx
if (!USE_QUESTIONNAIRE_V2) {
  return <SkinQuestionnaireV1 /> // Ancien composant
}
```

---

## 📝 **DOCUMENTATION À JOUR**

### **Fichiers à Mettre à Jour**

- [ ] `docs/spec.md` - Ajouter section "Questionnaire V2"
- [ ] `docs/architecture/fiabilite.md` - Mention UV risk calculator
- [ ] `docs/domain/dermatological-logic.md` - Restrictions grossesse
- [ ] `README.md` - Mention nouveaux champs questionnaire

### **Exemple Section `spec.md`**

```markdown
## 📋 Questionnaire V2 - Personnalisation Maximale

### Nouveaux Champs (Sept 2025)

1. **Grossesse** (conditionnel si Femme)
   - Exclusions automatiques : rétinol, acides forts, HE
   - Impact : Prompt Étape 2 IA

2. **Localisation** (Ville, Pays, Lat/Lon opt.)
   - Calcul UV risk band (Low/Moderate/High/VeryHigh)
   - Adaptation SPF selon climat

3. **Budget 3 Paliers**
   - Essentiel (30-70€) / Confort (70-150€) / Expert (150-300€)
   - Impact : Étape 3 sélection produits

4. **Style Routine**
   - Rapide (3-5 étapes) / Équilibrée (6-8) / Complète (9-12)
   - Impact : Complexité routine générée

### Schéma Validation

Voir `src/schemas/questionnaire.ts` - Validation Zod stricte.

### Documentation Technique

- Calcul UV : `src/utils/uvRiskCalculator.ts`
- Prompts enrichis : `src/services/ai/core/prompts/routinePersonnalisee.ts`
- Plan implémentation : `docs/planning-questionnaire-v2-implementation.md`
```

---

## ✅ **CHECKLIST FINALE**

### **Avant Production**

- [ ] Tous les tests Sprint 0-4 passent
- [ ] Tests E2E passent (ancien + nouveau format)
- [ ] Logs `[questionnaire_v2]` présents en staging
- [ ] UV risk calculé correctement (5 cas test)
- [ ] Prompts Étape 2 enrichis validés manuellement
- [ ] Routine grossesse exclut bien rétinol (test manuel)
- [ ] Rétrocompatibilité validée (100 analyses anciennes)
- [ ] Documentation à jour (spec.md + README)
- [ ] Feature flag configuré (rollback rapide possible)
- [ ] Monitoring configuré (alerts sur erreurs Zod)

---

**FIN DU PLAN - PRÊT POUR VALIDATION** ✅

**Estimation totale** : 3h30 (4 sprints × 30-60min)  
**Risque** : Faible (rétrocompat totale, feature flag)  
**Impact** : Élevé (personnalisation IA +30% attendue)
