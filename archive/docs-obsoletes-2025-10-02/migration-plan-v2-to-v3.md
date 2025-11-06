# Plan de Migration V2 → V3 - Routine UI

> **Objectif** : Identifier et supprimer/refactorer les composants de l'ancienne routine V2 pour faire place à la refonte V3.

## 📋 Composants Identifiés à Traiter

### 🔴 **À SUPPRIMER COMPLÈTEMENT**

1. **`src/components/results/UnifiedRoutineSection.tsx`** - Ancien affichage routine linéaire
2. **`src/components/results/PhaseBasedRoutineView.tsx`** - Vue par phase V2
3. **`src/components/results/DynamicRoutineRenderer.tsx`** - Rendu dynamique V2
4. **`src/components/routine/AdvancedRoutineDisplay.tsx`** - Affichage avancé V2

### 🟡 **À REFACTORER/ADAPTER**

1. **`src/utils/RoutineDisplayHelpers.ts`** - Garder les utilitaires, supprimer badges "Continu"
2. **`src/services/RoutineTransformer.ts`** - Adapter pour nouveaux types V3
3. **`src/types/routine.ts`** - Conserver pour compatibilité, ajouter imports V3

### 🟢 **À CONSERVER**

1. **`src/services/ai/core/prompts/routinePersonnalisee.ts`** - Prompts IA (ajustements mineurs)
2. **`src/schemas/v2/routine.ts`** - Schémas Zod (étendre pour V3)
3. **`src/components/dashboard/routine/`** - Dashboard routine (adapter plus tard)

## 🎯 Actions Immédiates Sprint 1

### Étape 1 : Sauvegarde & Archive
- Déplacer composants V2 vers `archive/components-v2/`
- Garder historique pour référence

### Étape 2 : Suppression Badges "Continu"
- Modifier `UnifiedRoutineSection.tsx` pour supprimer badges "Continu"
- Nettoyer `RoutineDisplayHelpers.ts` (fonction `isContinuousTreatment`)

### Étape 3 : Création Composant Temporaire
- Créer `src/components/routine/RoutineV3Placeholder.tsx`
- Message temporaire en attendant intégration Preview

## 🚨 Précautions

- **Pas de breaking changes** sur les APIs existantes
- **Conserver tests** pour validation régression
- **Migration progressive** - V2 et V3 coexistent temporairement

---

**Status** : 📋 **PLAN DÉFINI**
**Exécution** : Sprint 1 - Tâche 1.4
