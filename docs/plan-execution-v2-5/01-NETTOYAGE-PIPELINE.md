# 🧹 PHASE 0 : NETTOYAGE PIPELINE IA

> **Objectif :** Nettoyer et sécuriser la pipeline IA avant toute amélioration

**Durée totale :** 2h  
**Priorité :** P0 (BLOQUANT - à faire en premier)  
**Risque :** 🟢 Faible (opérations sécurisées avec archivage)

---

## 📋 **VUE D'ENSEMBLE**

### **Problèmes Identifiés**

❌ **4 versions de schémas concurrentes** (v2, refonte, routineFormats, index)  
❌ **2 systèmes de transformation parallèles** (V3 Adapter vs RoutineTransformer)  
❌ **Tests obsolètes** utilisant schémas non-production  
❌ **Fichiers morts** jamais importés

### **Résultat Attendu**

✅ **1 seul système de schémas** (v2/*)  
✅ **1 seule pipeline transformation** (V3 Adapter + aiRoutine.mapper)  
✅ **Tests alignés** avec schémas production  
✅ **Code propre** sans fichiers obsolètes

---

## 🎯 **SPRINT CLEANUP-1 : Archiver Schémas Obsolètes** (30 min)

### **Objectif**
Déplacer les schémas non utilisés en production vers `/archive/schemas-cleanup/`

### **Tâches**

#### **1.1 Créer dossier d'archivage**

```bash
mkdir -p archive/schemas-cleanup/obsolete-schemas
mkdir -p archive/schemas-cleanup/obsolete-tests
mkdir -p archive/schemas-cleanup/old-transformers
```

#### **1.2 Archiver schémas obsolètes**

**Fichiers à archiver :**
- `src/schemas/index.ts` (mort, jamais importé)
- `src/schemas/refonte.ts` (remplacé par v2/*)
- `src/schemas/routineFormats.ts` (inutilisé en prod)

**Commandes :**
```bash
mv src/schemas/index.ts archive/schemas-cleanup/obsolete-schemas/
mv src/schemas/refonte.ts archive/schemas-cleanup/obsolete-schemas/
mv src/schemas/routineFormats.ts archive/schemas-cleanup/obsolete-schemas/
```

#### **1.3 Créer README d'archivage**

**Créer :** `archive/schemas-cleanup/README.md`

```markdown
# Schémas Archivés - Cleanup V2.5

## Raison de l'archivage

Ces fichiers ont été archivés le {DATE} car :
- Non utilisés en production
- Remplacés par `src/schemas/v2/*`
- Causaient confusion et conflits

## Fichiers Archivés

### Schémas
- `index.ts` - Schéma mort jamais importé
- `refonte.ts` - Remplacé par v2/routine.ts et v2/products.ts
- `routineFormats.ts` - Inutilisé (ValidationPipeline non-prod)

### Tests
- Tests utilisant ces schémas obsolètes

## Restauration (si nécessaire)

```bash
# Restaurer un fichier
cp archive/schemas-cleanup/obsolete-schemas/refonte.ts src/schemas/

# Rollback complet
git checkout {COMMIT_HASH} src/schemas/
```

## Schémas Valides (Production)

✅ `src/schemas/v2/diagnostic.ts` → PureDiagnosticSchema  
✅ `src/schemas/v2/routine.ts` → PersonalizedRoutineSchema  
✅ `src/schemas/v2/products.ts` → ProductSelectionSchema  
✅ `src/schemas/v2/complete.ts` → CompleteAnalysisV2Schema
```

### **DoD (Definition of Done)**

- [ ] 3 fichiers schémas archivés
- [ ] README.md créé dans archive/
- [ ] Build passe : `npm run build`
- [ ] Aucune erreur TypeScript
- [ ] Commit : "chore: archive obsolete schemas"

---

## 🎯 **SPRINT CLEANUP-2 : Archiver Tests Obsolètes** (20 min)

### **Objectif**
Déplacer tests utilisant schémas obsolètes

### **Tâches**

#### **2.1 Identifier tests obsolètes**

**Tests à archiver :**
- `src/services/ai/__tests__/AIProductSelector.test.ts` (utilise refonte.ts)
- `src/services/ai/__tests__/AIRoutineGenerator.test.ts` (utilise refonte.ts)
- `src/services/ai/__tests__/refonte-validation.test.ts` (utilise refonte.ts)
- `src/services/ai/__tests__/validation.test.ts` (utilise routineFormats.ts)

**Commandes :**
```bash
mv src/services/ai/__tests__/AIProductSelector.test.ts archive/schemas-cleanup/obsolete-tests/
mv src/services/ai/__tests__/AIRoutineGenerator.test.ts archive/schemas-cleanup/obsolete-tests/
mv src/services/ai/__tests__/refonte-validation.test.ts archive/schemas-cleanup/obsolete-tests/
mv src/services/ai/__tests__/validation.test.ts archive/schemas-cleanup/obsolete-tests/
```

#### **2.2 Vérifier tests restants**

**Tests à GARDER (utilisent v2/*) :**
- `src/services/ai/__tests__/routineSnapshots.test.ts` ✅
- `src/services/ai/validators/__tests__/routineValidator.test.ts` ✅
- `src/services/ai/core/__tests__/AnalysisServiceV2.test.ts` ✅
- `src/schemas/v2/__tests__/routine.test.ts` ✅

**Vérification :**
```bash
# Lancer tests restants
npm test -- --testPathPattern="__tests__"
```

### **DoD**

- [ ] 4 tests obsolètes archivés
- [ ] Tests restants passent à 100%
- [ ] Aucun import vers schémas obsolètes
- [ ] Commit : "chore: archive obsolete tests"

---

## 🎯 **SPRINT CLEANUP-3 : Nettoyer Double Pipeline** (30 min)

### **Objectif**
Déprécier RoutineTransformer, garder uniquement V3 Adapter

### **Tâches**

#### **3.1 Vérifier utilisation RoutineTransformer**

**Commande :**
```bash
grep -r "RoutineTransformer" src/app src/components --exclude-dir=__tests__ -l
```

**Fichiers potentiels :**
- `src/app/results/page.tsx` (utilise `convertV2RoutineToUnified`)
- Autres composants ?

#### **3.2 Marquer RoutineTransformer deprecated**

**Modifier :** `src/services/RoutineTransformer.ts`

```typescript
/**
 * @deprecated OBSOLÈTE - Utiliser AnalysisServiceV3Adapter à la place
 * 
 * Ce service sera supprimé dans la prochaine version.
 * La nouvelle pipeline V3 utilise :
 * - AnalysisServiceV3Adapter.transformForUIV3()
 * - aiRoutine.mapper.ts
 * 
 * Migration :
 * Ancien: RoutineTransformer.transformToUnified(routine, products)
 * Nouveau: AnalysisServiceV3Adapter.transformForUIV3(diagnostic, routine, products)
 * 
 * @see src/services/ai/core/AnalysisServiceV3Adapter.ts
 * @see src/services/mappers/aiRoutine.mapper.ts
 */
export class RoutineTransformer {
  // ... code existant inchangé
}
```

#### **3.3 Documenter pipeline unique**

**Créer :** `docs/plan-execution-v2-5/PIPELINE-VALIDEE.md`

```markdown
# Pipeline IA Validée (Post-Cleanup)

## Architecture Unique

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

## Schémas Production

✅ `src/schemas/v2/diagnostic.ts`  
✅ `src/schemas/v2/routine.ts`  
✅ `src/schemas/v2/products.ts`  
✅ `src/schemas/v2/complete.ts`

## Transformation UI

✅ `src/services/ai/core/AnalysisServiceV3Adapter.ts`  
✅ `src/services/mappers/aiRoutine.mapper.ts`  
✅ `src/types/aiRoutine.ts`

## ⚠️ Deprecated

❌ `src/services/RoutineTransformer.ts` (à migrer)  
❌ `src/utils/ValidationPipeline.ts` (inutilisé)
```

### **DoD**

- [ ] Utilisation RoutineTransformer identifiée
- [ ] Marqué @deprecated avec docs migration
- [ ] PIPELINE-VALIDEE.md créé
- [ ] Commit : "docs: mark RoutineTransformer deprecated, document V3 pipeline"

---

## 🎯 **SPRINT CLEANUP-4 : Validation Finale** (20 min)

### **Objectif**
Vérifier que tout fonctionne après le nettoyage

### **Tâches**

#### **4.1 Tests de non-régression**

```bash
# 1. Build production
npm run build

# 2. Tests unitaires
npm test

# 3. Vérifier imports
grep -r "from.*schemas/index" src/ || echo "✅ Aucun import obsolète"
grep -r "from.*schemas/refonte" src/ || echo "✅ Aucun import obsolète"
grep -r "from.*schemas/routineFormats" src/ || echo "✅ Aucun import obsolète"

# 4. Linter
npm run lint
```

#### **4.2 Test fonctionnel**

**Lancer l'app et tester :**
```bash
npm run dev
```

**Parcours de test :**
1. Upload 2-3 photos
2. Remplir questionnaire
3. Lancer analyse
4. Vérifier page résultats s'affiche
5. Vérifier routine V3 visible
6. Vérifier console : 0 erreur critique

#### **4.3 Créer rapport de nettoyage**

**Créer :** `docs/plan-execution-v2-5/RAPPORT-NETTOYAGE.md`

```markdown
# Rapport Nettoyage Pipeline - {DATE}

## Fichiers Archivés

### Schémas Obsolètes (3)
- ✅ schemas/index.ts
- ✅ schemas/refonte.ts
- ✅ schemas/routineFormats.ts

### Tests Obsolètes (4)
- ✅ AIProductSelector.test.ts
- ✅ AIRoutineGenerator.test.ts
- ✅ refonte-validation.test.ts
- ✅ validation.test.ts

## Pipeline Validée

✅ Schémas production : 4 fichiers v2/*
✅ Transformation unique : V3 Adapter + aiRoutine.mapper
✅ Tests alignés : 4 tests v2/*
✅ RoutineTransformer : deprecated

## Métriques

- **Build :** ✅ OK
- **Tests :** {X}/  {X} passés
- **Linter :** 0 erreur
- **Imports obsolètes :** 0
- **Taille bundle :** {AVANT} → {APRÈS} ({GAIN}%)

## Tests Fonctionnels

- [x] Upload photos
- [x] Questionnaire
- [x] Analyse complète
- [x] Routine V3 affichée
- [x] 0 erreur console

## Prochaine Étape

→ `02-CORRECTION-STEP3-PRODUITS.md`
```

### **DoD**

- [ ] Build production ✅
- [ ] Tests unitaires passent
- [ ] 0 import vers schémas obsolètes
- [ ] Test fonctionnel validé
- [ ] RAPPORT-NETTOYAGE.md créé
- [ ] Commit : "chore: complete pipeline cleanup - validation report"

---

## 🚨 **SPRINTS DE DEBUG**

### **DEBUG-1 : Erreur Build après Archivage**

**Symptôme :** `npm run build` échoue

**Diagnostic :**
```bash
# Vérifier imports manquants
grep -r "schemas/index" src/
grep -r "schemas/refonte" src/
grep -r "schemas/routineFormats" src/
```

**Solution :**
1. Identifier fichiers avec imports obsolètes
2. Remplacer par imports v2/* appropriés
3. Re-build

**Rollback si nécessaire :**
```bash
git checkout HEAD~1 src/schemas/
```

### **DEBUG-2 : Tests Échouent**

**Symptôme :** Tests unitaires en erreur

**Diagnostic :**
```bash
npm test -- --verbose
```

**Solution :**
1. Vérifier que tests archivés ne sont pas lancés
2. Vérifier imports dans tests restants
3. Mettre à jour mocks si nécessaire

### **DEBUG-3 : App Crash en Dev**

**Symptôme :** Erreur runtime après nettoyage

**Diagnostic :**
1. Ouvrir console navigateur
2. Chercher erreurs import
3. Vérifier stack trace

**Solution :**
1. Identifier composant en erreur
2. Vérifier imports schémas
3. Corriger vers v2/*

**Rollback complet :**
```bash
git reset --hard HEAD~4  # Annuler 4 derniers commits
```

---

## ✅ **CHECKLIST FINALE PHASE 0**

Avant de passer à Phase 1 (Correction Step 3) :

### **Validation Technique**
- [ ] 3 schémas obsolètes archivés
- [ ] 4 tests obsolètes archivés
- [ ] RoutineTransformer marqué @deprecated
- [ ] PIPELINE-VALIDEE.md créé
- [ ] Build production OK
- [ ] Tests unitaires passent
- [ ] 0 import vers schémas obsolètes
- [ ] 0 erreur linter

### **Validation Fonctionnelle**
- [ ] App démarre en dev
- [ ] Parcours complet fonctionne
- [ ] Routine V3 s'affiche
- [ ] 0 erreur console critique

### **Documentation**
- [ ] README.md dans archive/
- [ ] RAPPORT-NETTOYAGE.md créé
- [ ] 4 commits clean avec messages clairs

### **Commits Recommandés**
```bash
git add archive/schemas-cleanup/
git commit -m "chore: archive obsolete schemas (index, refonte, routineFormats)"

git add archive/schemas-cleanup/obsolete-tests/
git commit -m "chore: archive obsolete tests using deprecated schemas"

git add src/services/RoutineTransformer.ts docs/plan-execution-v2-5/PIPELINE-VALIDEE.md
git commit -m "docs: mark RoutineTransformer deprecated, document V3 pipeline"

git add docs/plan-execution-v2-5/RAPPORT-NETTOYAGE.md
git commit -m "chore: complete pipeline cleanup - validation report"
```

---

## 🎯 **RÉSULTAT ATTENDU**

À la fin de cette phase :

✅ **Pipeline propre :** 1 seul système (v2/* + V3 Adapter)  
✅ **Code net :** 0 fichier mort, 0 import obsolète  
✅ **Tests alignés :** Seulement tests production  
✅ **Documentation :** Pipeline validée documentée  
✅ **Fonctionnel :** App fonctionne parfaitement

---

**📍 PROCHAINE ÉTAPE :** `02-CORRECTION-STEP3-PRODUITS.md`

**⏱️ DURÉE TOTALE PHASE 0 :** ~2h  
**🎯 VALIDATION :** Tous DoD cochés ✅

