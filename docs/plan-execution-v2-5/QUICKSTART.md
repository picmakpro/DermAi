# ⚡ QUICKSTART V2.5

> **Démarrage immédiat** - Guide ultra-rapide pour commencer

---

## 🎯 **OBJECTIF EN 1 PHRASE**

**Finaliser la page Résultats (0 "produit non spécifié", alternatives visibles, UI propre) avant toute autre feature.**

---

## 📍 **PAR OÙ COMMENCER ?**

### **Étape 1 : Lire l'index (5 min)**
```bash
cat docs/plan-execution-v2-5/00-INDEX-GENERAL.md
```

### **Étape 2 : Lancer Phase 0 (2h)**
```bash
# Ouvrir et suivre :
docs/plan-execution-v2-5/01-NETTOYAGE-PIPELINE.md
```

### **Étape 3 : Continuer les phases dans l'ordre**
```
Phase 0 ✅ → Phase 1 → Phase 2 → Phase 3 → Phase 4 ✅
```

---

## 📊 **ROADMAP VISUELLE**

```
┌─────────────────────────────────────────────────────────────┐
│                     PLAN V2.5                               │
│                                                             │
│  JOUR 1  ┌──────────┐  ┌─────────────────────────┐        │
│          │  Phase 0 │→│      Phase 1 début       │        │
│          │ Nettoyage│  │   Step 3 correction      │        │
│          └──────────┘  └─────────────────────────┘        │
│           (2h)                    (6h)                     │
│                                                             │
│  JOUR 2  ┌─────────────────────┐  ┌──────────────┐        │
│          │   Phase 1 fin       │→│   Phase 2     │        │
│          │   Step 3 tests      │  │  UI badges    │        │
│          └─────────────────────┘  └──────────────┘        │
│                 (4h)                     (4h)              │
│                                                             │
│  JOUR 3  ┌──────────────┐  ┌─────────────────────┐        │
│          │  Phase 2 fin │→│     Phase 3          │        │
│          │ Alternatives │  │  Récap utilisateur   │        │
│          └──────────────┘  └─────────────────────┘        │
│                (4h)                  (4h)                  │
│                                                             │
│  JOUR 4  ┌─────────────────────────────────────────┐      │
│          │          Phase 4                        │      │
│          │    Tests + Validation                   │      │
│          │    RAPPORT FINAL ✅                     │      │
│          └─────────────────────────────────────────┘      │
│                         (4h)                               │
│                                                             │
│  ══════════════════════════════════════════════════════   │
│          V2.5 VALIDÉ ✅ → Décision Dashboard              │
│  ══════════════════════════════════════════════════════   │
│                                                             │
│  SEM 2-3  ┌────────────────────────────────────────┐      │
│ (optionnel)│        Phase 5 Dashboard              │      │
│           │   Backend + UI + Tracker              │      │
│           └────────────────────────────────────────┘      │
│                      (1-2 semaines)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **COMMANDES RAPIDES**

### **Démarrer Phase 0 (Nettoyage)**
```bash
# 1. Créer branche
git checkout -b cleanup/v2.5-pipeline

# 2. Archiver schémas obsolètes
mkdir -p archive/schemas-cleanup/obsolete-schemas
mv src/schemas/index.ts archive/schemas-cleanup/obsolete-schemas/
mv src/schemas/refonte.ts archive/schemas-cleanup/obsolete-schemas/
mv src/schemas/routineFormats.ts archive/schemas-cleanup/obsolete-schemas/

# 3. Vérifier build
npm run build

# 4. Commit
git commit -m "chore: archive obsolete schemas (index, refonte, routineFormats)"
```

### **Démarrer Phase 1 (Step 3)**
```bash
# Suivre instructions détaillées :
cat docs/plan-execution-v2-5/02-CORRECTION-STEP3-PRODUITS.md

# Créer schéma V3
# Modifier prompts
# Tester
```

### **Tester rapidement**
```bash
# Dev
npm run dev

# Upload 2-3 photos
# Remplir questionnaire
# Lancer analyse
# Vérifier page résultats
```

---

## 📋 **CHECKLIST EXPRESS**

### **Phase 0 : Nettoyage (2h)**
- [ ] Schémas archivés (3 fichiers)
- [ ] Tests archivés (4 fichiers)
- [ ] Build OK
- [ ] 0 import obsolète

### **Phase 1 : Step 3 (1 jour)**
- [ ] Schéma V3 créé
- [ ] Prompt score ajouté
- [ ] Catalogue validé
- [ ] Test : alternatives OK

### **Phase 2 : UI (1.5 jours)**
- [ ] Badges réduits
- [ ] Score matching visible
- [ ] Modal alternatives
- [ ] Alternance indicator

### **Phase 3 : Récap (0.5 jour)**
- [ ] Section "Vos entrées"
- [ ] Photos cliquables
- [ ] Ancre #recap

### **Phase 4 : Tests (0.5 jour)**
- [ ] 20 cas testés
- [ ] Performance OK
- [ ] **Rapport VALIDÉ** ✅

---

## 🎯 **CRITÈRES DE SUCCÈS**

### **V2.5 est VALIDÉE si :**

✅ 0 "produit non spécifié"  
✅ 100% produits ont alternatives (3-5)  
✅ Score matching visible partout  
✅ Badges pertinents (pas surchargés)  
✅ Section récap complète  
✅ Performance Step 3 < 15s  
✅ 20 cas tests validés

---

## ⚠️ **RÈGLES CRITIQUES**

### **❌ INTERDICTIONS**

1. **NE PAS** modifier l'architecture IA pendant les phases
2. **NE PAS** sauter une phase
3. **NE PAS** commencer Dashboard avant validation Phase 4
4. **NE PAS** ignorer les DoD (Definition of Done)

### **✅ OBLIGATIONS**

1. **TOUJOURS** suivre l'ordre Phase 0→1→2→3→4
2. **TOUJOURS** cocher tous les DoD avant de continuer
3. **TOUJOURS** commit après chaque sprint
4. **TOUJOURS** tester sur 5 cas minimum après modif

---

## 🆘 **EN CAS DE PROBLÈME**

### **Build échoue**
```bash
# Vérifier imports
grep -r "schemas/index" src/
grep -r "schemas/refonte" src/

# Rollback si nécessaire
git checkout HEAD~1 src/schemas/
```

### **Tests échouent**
```bash
# Activer logs debug
# Dans AnalysisService.ts
console.log('[DEBUG]', ...)

# Tester isolément
npx ts-node scripts/test-step3.ts
```

### **Produits non spécifiés**
```bash
# Vérifier :
1. Schéma V3 utilisé ?
2. Prompt génère matchingScore ?
3. Catalogue chargé ?
4. Enrichissement 100% ?

# Solution : 02-CORRECTION-STEP3-PRODUITS.md
```

---

## 📞 **RESSOURCES**

### **Fichiers Principaux**
- `00-INDEX-GENERAL.md` - Vue d'ensemble
- `README.md` - Mode d'emploi complet
- `01-` à `06-` - Phases détaillées

### **Documentation Existante**
- `docs/spec.md` - Spécifications app
- `docs/PROJET-COMPLET-ROUTINE-V2-GPT5.md` - Architecture IA
- `docs/fiche-technique-phase2-dashboard.md` - Dashboard

---

## ✅ **VALIDATION FINALE**

### **Avant de dire "V2.5 terminée" :**

```bash
# 1. Vérifier rapport final
cat docs/plan-execution-v2-5/RAPPORT-VALIDATION-FINALE.md

# 2. Vérifier statut
grep "VALIDÉ" docs/plan-execution-v2-5/RAPPORT-VALIDATION-FINALE.md

# 3. Si VALIDÉ ✅
git tag v2.5-validated
git push origin v2.5-validated

# 4. Décision Dashboard
# OUI → Lancer Phase 5
# NON → Autre priorité
```

---

## 🎉 **RÉSULTAT ATTENDU**

**Fin V2.5 (Phases 0-4) :**

✅ Page Résultats parfaite  
✅ 0 "produit non spécifié"  
✅ Alternatives visibles  
✅ Score matching clair  
✅ UI propre et performante  
✅ 20 cas validés  
✅ Utilisateur satisfait

**Dashboard (Phase 5) = Bonus optionnel**

---

**⏱️ TEMPS TOTAL CORE :** 3-4 jours  
**📅 DÉMARRAGE :** Maintenant !  
**🎯 PREMIER FICHIER :** `00-INDEX-GENERAL.md`

---

**GO ! 🚀**


