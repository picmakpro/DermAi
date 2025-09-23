# Planning d'Exécution - Refonte Routine UI V3

> **Objectif** : Reconstruire from scratch la section "Routine personnalisée" avec architecture onglets Phase → Slots (Matin/Soir/Hebdo), basée sur la Preview finale à 99%.

## 📋 Vue d'Ensemble

### Transformation UX Cible
- **Avant** : Liste linéaire par phase avec badges "Continu"
- **Après** : Onglets Phase → Slots (Matin/Soir/Hebdo) avec métadonnées riches
- **Principe** : Le front ne fait que mapper, zéro inférence métier

### Règles d'Affichage Strictes
1. **Produits continus** : Titres simples ("Nettoyage", "Hydratation matin"), pas de badge "Continu"
2. **Traitements temporaires** : Métadonnées obligatoires (intro/durée/fréquence) + badges éducatifs
3. **Hebdomadaire** : Tous les items ≥ hebdo (pas seulement exfoliants/masques)
4. **Mobile-first** : Slots sticky, navigation tactile optimisée

---

## 🎯 Sprint 1 : Fondations & Types (2-3 jours)

### Objectifs
- ✅ Créer les types TypeScript pour la nouvelle structure
- ✅ Mettre à jour `spec.md` avec la nouvelle architecture
- ✅ Créer le mapper strict sans inférence
- ✅ Supprimer l'ancienne section routine

### Tâches Détaillées

#### 1.1 Création des Types (`src/types/aiRoutine.ts`)

**Prompt d'implémentation :**
```
Créer src/types/aiRoutine.ts avec cette structure exacte :

export type PhaseId = "immediate" | "adaptation" | "maintenance";
export type Slot = "morning" | "evening" | "weekly";

export interface AiAlternative {
  id: string;
  name: string;
}

export interface AiRoutineItem {
  id: string;
  phase: PhaseId;
  routine_slot: Slot;
  title: string;
  product: string;
  category: "cleanser" | "moisturizer" | "spf" | "treatment";
  is_continuous?: boolean;
  is_temporary?: boolean;
  introduce_from_week?: number;
  application_duration?: string;
  frequency?: string;
  application_instructions?: string;
  restrictions?: string[];
  target_zones?: string[];
  notes?: string;
  alternatives?: AiAlternative[];
  image_url?: string;
}

export interface AiRoutinePhase {
  id: PhaseId;
  label?: string;
  durationLabel: string;
  education?: { title: string; text: string };
  slots: Record<Slot, AiRoutineItem[]>;
}

export interface AiRoutineOutput {
  phases: AiRoutinePhase[];
}
```

#### 1.2 Création du Mapper (`src/services/mappers/aiRoutine.mapper.ts`)

**Prompt d'implémentation :**
```
Créer src/services/mappers/aiRoutine.mapper.ts avec :

1. Fonction toAiRoutineOutput(raw: unknown): AiRoutineOutput
2. Mapping strict des champs existants vers nouveaux types
3. Normalisation CATEGORY_MAP et SLOT_MAP (sans inférence métier)
4. Logs console.warn('[routine:missing-field]', field, item.id) pour champs manquants
5. Groupement automatique par slots dans chaque phase
6. Validation que tous les temporaires ont intro/durée/fréquence

const CATEGORY_MAP = {
  nettoyage: 'cleanser',
  hydratation: 'moisturizer', 
  protection: 'spf',
  traitement: 'treatment',
  exfoliation: 'treatment',
  masque: 'treatment'
} as const;

const SLOT_MAP = { 
  matin: 'morning', 
  soir: 'evening', 
  hebdomadaire: 'weekly' 
} as const;
```

#### 1.3 Mise à Jour `docs/spec.md`

**Prompt d'implémentation :**
```
Mettre à jour docs/spec.md section "3.2. Fonctionnalités Détaillées" :

Remplacer la section routine par :
- Architecture onglets Phase → Slots
- Règles d'affichage (continus sans badge, temporaires avec méta)
- Pédagogie par phase + item
- Mobile-first, alternatives, CTA
- Référence vers planning-execution-refonte-routine-ui-v3.md
```

#### 1.4 Suppression Ancienne Section

**Prompt d'implémentation :**
```
Identifier et supprimer :
1. Anciens composants routine avec badges "Continu"
2. Logique d'affichage linéaire par phase
3. Références aux anciens types routine
4. Conserver uniquement les services IA (diagnosticPur, routinePersonnalisee, selectionProduits)
```

### Prompts de Vérification Sprint 1

```
Vérifier que :
1. Types AiRoutineOutput compilent sans erreur
2. Mapper gère tous les cas de figure (champs manquants, normalisation)
3. spec.md reflète la nouvelle architecture
4. Aucun résidu de l'ancienne implémentation
5. Services IA restent intacts
```

### Prompts de Debug Sprint 1

```
Si erreur de compilation :
- Vérifier imports/exports des nouveaux types
- Contrôler cohérence CATEGORY_MAP/SLOT_MAP
- Valider structure Record<Slot, AiRoutineItem[]>

Si mapper échoue :
- Logger l'input raw pour debug
- Vérifier normalisation des champs timing/careType
- Contrôler groupement par slots
```

---

## 🎨 Sprint 2 : Intégration Preview UI (3-4 jours)

### Objectifs
- ✅ Intégrer la Preview finale (variantes A/B/C)
- ✅ Adapter imports Next.js/React/TS
- ✅ Connecter avec le mapper aiRoutine
- ✅ Implémenter alternatives modal

### Tâches Détaillées

#### 2.1 Intégration Preview Base

**Prompt d'implémentation :**
```
Créer src/components/routine/RoutineRefonteV3.tsx :

1. Copier intégralement la Preview finale fournie
2. Adapter imports :
   - React, useState, useEffect, useMemo depuis "react"
   - motion, AnimatePresence depuis "framer-motion" 
   - Icônes depuis "lucide-react"
3. Remplacer routineData mock par props { routine: AiRoutineOutput }
4. Conserver les 3 variantes A/B/C (Clinical/Glow/Editorial)
5. Garder ThemeToggle, SlotSwitch, tous les composants UI
```

#### 2.2 Connexion avec Mapper

**Prompt d'implémentation :**
```
Dans RoutineRefonteV3.tsx :

1. Importer { toAiRoutineOutput } from '@/services/mappers/aiRoutine.mapper'
2. Remplacer routineData par props.routine mappé
3. Adapter les boucles phases.map() avec les nouveaux types
4. Conserver la logique overrides/alternatives
5. Maintenir le state management (theme, activePhase, slot)
```

#### 2.3 Composants UI Spécialisés

**Prompt d'implémentation :**
```
Créer src/components/routine/ui/ avec :

1. StepBadge.tsx - Badge numéroté avec gradient
2. ProductThumb.tsx - Vignette produit (image ou fallback gradient)
3. EducationalBadge.tsx - Badges observe/duration/objective
4. MetaChip.tsx - Chips pour zones/fréquence/durée
5. InfoSection.tsx - Sections pédagogiques (advice/warn/meta)
6. AlternativesModal.tsx - Modal sélection alternatives

Tous avec support variantes A/B/C et dark mode.
```

#### 2.4 Slots & Navigation

**Prompt d'implémentation :**
```
Implémenter navigation slots sticky :

1. SlotSwitch reste en position sticky top-4
2. Transitions fluides entre Matin/Soir/Hebdo
3. Animations Framer Motion pour cards
4. Responsive mobile-first
5. Navigation clavier (Tab, Enter, Escape)
```

### Prompts de Vérification Sprint 2

```
Vérifier que :
1. Preview s'affiche identique à 99% (3 variantes)
2. Navigation slots fonctionne
3. Alternatives modal s'ouvre/ferme
4. Responsive mobile parfait
5. Dark mode opérationnel
6. Aucune erreur console
```

### Prompts de Debug Sprint 2

```
Si affichage incorrect :
- Comparer avec Preview originale
- Vérifier imports Tailwind classes
- Contrôler structure JSX

Si navigation buggy :
- Logger state changes (activePhase, slot)
- Vérifier event handlers
- Tester sur mobile réel
```

---

## 🔧 Sprint 3 : Ajustements Prompts IA (2 jours)

### Objectifs
- ✅ Garantir présence champs requis dans prompts IA
- ✅ Ajustements minimaux sans changer logique clinique
- ✅ Tester cohérence diagnostic → routine → produits

### Tâches Détaillées

#### 3.1 Ajustement `routinePersonnalisee.ts`

**Prompt d'implémentation :**
```
Dans src/services/ai/core/prompts/routinePersonnalisee.ts :

1. INTERDIRE timing: "both" - forcer steps distincts matin ET soir
2. Ajouter champs obligatoires par step :
   - applicationInstructions: string
   - restrictions: string[] 
   - targetZones: string[]
   - alternatives: AiAlternative[] (vide par défaut)
   - imageUrl?: string (optionnel)

3. Clarifier règle hebdomadaire :
   "Tout item dont frequency n'est PAS 'daily' doit avoir timing='hebdomadaire'"

4. Enrichir FORMAT JSON avec ces nouveaux champs
```

#### 3.2 Ajustement `selectionProduits.ts`

**Prompt d'implémentation :**
```
Dans src/services/ai/core/prompts/selectionProduits.ts :

1. Ajouter routineStepUid: string pour lien stable
2. Enrichir structure alternatives[] :
   { catalogId, name, brand, price, imageUrl }
3. Garantir imageUrl dans selectedProducts
4. Aligner timing avec Étape 2 (matin/soir/hebdomadaire)
```

#### 3.3 Tests Cohérence End-to-End

**Prompt d'implémentation :**
```
Créer tests/integration/routine-e2e.test.ts :

1. Mock diagnostic complet
2. Appel Étape 2 (routine) avec diagnostic
3. Validation présence tous champs requis
4. Appel Étape 3 (produits) avec routine
5. Mapper vers AiRoutineOutput
6. Vérifier cohérence zones/timing/phases
```

### Prompts de Vérification Sprint 3

```
Vérifier que :
1. Aucun timing: "both" généré
2. Tous temporaires ont intro/durée/fréquence
3. applicationInstructions présent partout
4. alternatives[] structure correcte
5. Cohérence diagnostic → routine → produits
```

### Prompts de Debug Sprint 3

```
Si champs manquants :
- Logger output brut Étape 2/3
- Identifier patterns prompts incomplets
- Ajuster exemples JSON dans prompts

Si incohérence phases :
- Tracer zones diagnostic → routine → produits
- Vérifier mapping temporaires vs continus
- Contrôler durées phases vs traitements
```

---

## 🚀 Sprint 4 : QA & Finitions (2 jours)

### Objectifs
- ✅ Tests accessibilité (WCAG 2.1 AA)
- ✅ Instrumentation analytics
- ✅ Tests performance mobile
- ✅ Documentation utilisateur

### Tâches Détaillées

#### 4.1 Accessibilité

**Prompt d'implémentation :**
```
Audit accessibilité complet :

1. Navigation clavier (Tab, Enter, Escape, flèches)
2. Contrastes WCAG AA (4.5:1 minimum)
3. ARIA labels sur tous boutons/modals
4. Screen reader compatibility
5. Focus management (modal, onglets)
6. Responsive 320px → 1920px
```

#### 4.2 Instrumentation Analytics

**Prompt d'implémentation :**
```
Ajouter tracking events :

- routine:phase_change (immediate/adaptation/maintenance)
- routine:slot_change (morning/evening/weekly) 
- routine:alt_open (item.id)
- routine:alt_select (old_product, new_product)
- routine:buy_click (product_name, retailer)
- routine:theme_toggle (light/dark)

Utiliser Google Analytics 4 ou service existant.
```

#### 4.3 Tests Performance

**Prompt d'implémentation :**
```
Tests Lighthouse mobile :

1. Performance > 90
2. Accessibility > 95
3. Best Practices > 90
4. SEO > 85

Optimisations :
- Lazy loading images produits
- Code splitting par phase
- Compression animations Framer Motion
```

#### 4.4 Documentation

**Prompt d'implémentation :**
```
Créer docs/user-guide-routine-v3.md :

1. Guide utilisateur navigation onglets
2. Explication badges éducatifs
3. Utilisation alternatives
4. FAQ troubleshooting
5. Screenshots mobile/desktop
```

### Prompts de Vérification Sprint 4

```
Vérifier que :
1. Score Lighthouse > seuils définis
2. Navigation clavier 100% fonctionnelle
3. Analytics events déclenchés
4. Aucune régression UX vs Preview
5. Documentation à jour
```

### Prompts de Debug Sprint 4

```
Si performance dégradée :
- Profiler bundle size
- Optimiser imports Framer Motion
- Lazy load composants lourds

Si accessibilité échoue :
- Tester avec screen reader
- Vérifier contrastes couleurs
- Corriger focus trap modal
```

---

## 📊 Métriques de Succès

### Critères d'Acceptation (DoD)

- [ ] **Parité Preview ≥ 99%** (variantes A/B/C, mobile-first)
- [ ] **Hebdomadaire = ≥ hebdo** (tous non quotidiens), jamais badge "Continu"
- [ ] **Temporaires : méta toujours visible** (intro/durée/fréquence) + badges éducatifs
- [ ] **Pédagogie complète** : education par phase + sections item
- [ ] **Mapping déterministe** + logs champs manquants
- [ ] **Accessibilité WCAG AA** + navigation clavier
- [ ] **Performance Lighthouse > 90** mobile
- [ ] **Analytics instrumenté** (6 events minimum)

### Métriques Quantifiables

- **Temps de chargement** : < 2s First Contentful Paint
- **Bundle size** : < 200KB routine section
- **Couverture tests** : > 80% composants UI
- **Erreurs console** : 0 en production
- **Compatibilité** : Chrome 90+, Safari 14+, Firefox 88+

---

## 🔄 Processus de Validation

### Après Chaque Sprint

1. **Demo** avec Preview originale side-by-side
2. **Tests manuels** sur 3 devices (mobile/tablet/desktop)
3. **Review code** avec focus architecture/performance
4. **Validation UX** avec utilisateurs test si possible

### Critères de Passage Sprint

- ✅ Tous prompts d'implémentation exécutés
- ✅ Prompts de vérification validés
- ✅ Aucun prompt de debug nécessaire
- ✅ Demo fonctionnelle sans régression

---

## 📝 Notes d'Implémentation

### Contraintes Techniques Respectées

- **Pas de breaking changes** API existante
- **Rétrocompatibilité** schémas Zod
- **Pas de refonte** logique IA (diagnostic/routine/produits)
- **Migration douce** composants existants

### Risques Identifiés

- **Complexité mapping** raw IA → types structurés
- **Performance** animations Framer Motion mobile
- **Cohérence** alternatives entre phases
- **Maintenance** 3 variantes UI simultanées

### Mitigation

- Tests unitaires mapper robustes
- Profiling performance continu  
- Validation E2E cohérence IA
- Composants UI mutualisés variants

---

**Status** : 📋 **PRÊT POUR EXÉCUTION**
**Prochaine étape** : Sprint 1 - Fondations & Types
**Durée estimée** : 9-11 jours total
