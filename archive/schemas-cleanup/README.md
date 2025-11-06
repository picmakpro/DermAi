# Schémas Archivés - Cleanup V2.5

## Raison de l'archivage

Ces fichiers ont été archivés le **1er octobre 2025** car :
- Non utilisés en production
- Remplacés par `src/schemas/v2/*`
- Causaient confusion et conflits dans la pipeline IA

## Fichiers Archivés

### Schémas
- `index.ts` - Schéma mort jamais importé (DiagnosticBrutSchema, RoutinePersonnaliseeSchema obsolètes)
- `refonte.ts` - Remplacé par v2/routine.ts et v2/products.ts  
- `routineFormats.ts` - Inutilisé (ValidationPipeline non-prod, formats pour A/B testing jamais utilisés)

### Tests
- `AIProductSelector.test.ts` - Utilisait ProductSelectionCompleteSchema de refonte.ts
- `AIRoutineGenerator.test.ts` - Utilisait RoutinePersonnaliseeCompleteSchema de refonte.ts
- `refonte-validation.test.ts` - Utilisait RoutinePersonnaliseeCompleteSchema de refonte.ts
- `validation.test.ts` - Utilisait routineFormats.ts

## Restauration (si nécessaire)

```bash
# Restaurer un fichier
cp archive/schemas-cleanup/obsolete-schemas/refonte.ts src/schemas/

# Rollback complet
git checkout HEAD~1 src/schemas/
```

## Schémas Valides (Production)

✅ `src/schemas/v2/diagnostic.ts` → PureDiagnosticSchema  
✅ `src/schemas/v2/routine.ts` → PersonalizedRoutineSchema  
✅ `src/schemas/v2/products.ts` → ProductSelectionSchema  
✅ `src/schemas/v2/complete.ts` → CompleteAnalysisV2Schema

## Pipeline Validée Post-Cleanup

**Architecture unique :**
```
AnalysisService (Steps 1-4)
│
├─ Step 1: Diagnostic Pur
│  └─ Schema: PureDiagnosticSchema (v2/diagnostic.ts)
│
├─ Step 2: Routine Personnalisée  
│  └─ Schema: PersonalizedRoutineSchema (v2/routine.ts)
│
├─ Step 3: Sélection Produits
│  └─ Schema: ProductSelectionSchema (v2/products.ts)
│
└─ Step 4: Assemblage
   └─ AssemblyAndValidationService
        ↓
   AnalysisServiceV3Adapter.transformForUIV3()
        ↓
   aiRoutine.mapper.ts
        ↓
   AiRoutineOutput → RoutineV3Final (UI)
```

## Corrections Appliquées

1. **types/index.ts** : Imports corrigés pour utiliser v2/routine.ts et v2/products.ts
2. **UserConstraints** : Redéfini localement dans types/index.ts (utilisé par prompts IA)
3. **Build** : Validé après archivage (erreur préexistante dans /compare-interfaces non liée)

## Prochaine Étape

→ `docs/plan-execution-v2-5/02-CORRECTION-STEP3-PRODUITS.md`

