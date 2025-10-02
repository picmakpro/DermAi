# 📚 PLAN D'EXÉCUTION V2.5 - MODE D'EMPLOI

> **Objectif Global :** Finaliser la page Résultats à 100% avant toute autre feature

---

## 🚀 **DÉMARRAGE RAPIDE**

### **1. Lire l'index général**
📄 `00-INDEX-GENERAL.md` - Vue d'ensemble complète

### **2. Suivre l'ordre strict**
```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → (Phase 5)
```

### **3. Valider chaque phase**
Cocher tous les DoD (Definition of Done) avant de passer à la suivante

---

## 📁 **STRUCTURE DES FICHIERS**

### **Index & Navigation**
- `00-INDEX-GENERAL.md` - **Commencer ici** : Vue d'ensemble, timeline, règles

### **Phases d'Exécution (dans l'ordre)**

1. **`01-NETTOYAGE-PIPELINE.md`** ⚡ P0 (2h)
   - Archiver schémas obsolètes
   - Nettoyer double pipeline
   - Valider build

2. **`02-CORRECTION-STEP3-PRODUITS.md`** 🔧 P0 (1 jour)
   - Aligner schéma ↔ prompt
   - Ajouter score matching
   - Sécuriser catalogue
   - Valider enrichissement

3. **`03-AMELIORATION-UI-RESULTATS.md`** 🎨 P1 (1.5 jours)
   - Badges sélectifs
   - Score matching visible
   - Alternatives modal
   - Indicateur alternance

4. **`04-RECAP-UTILISATEUR.md`** 📸 P1 (0.5 jour)
   - Section "Vos entrées"
   - Mini-galerie photos
   - Profil + questionnaire
   - Ancre #recap

5. **`05-TESTS-VALIDATION.md`** ✅ P0 (0.5 jour)
   - Tests 20 cas variés
   - Performance Step 3
   - Validation utilisateur
   - **Rapport final VALIDÉ**

6. **`06-DASHBOARD-PHASE2.md`** 📊 P2 (1-2 semaines)
   - ⚠️ **Uniquement après validation Phase 4**
   - Backend "Suivre routine"
   - UI activation
   - Dashboard tracker

---

## ⏱️ **TIMELINE ESTIMÉE**

### **Core V2.5 (Phases 0-4) - PRIORITAIRE**
```
Jour 1 : Nettoyage (2h) + Step 3 début (6h)
Jour 2 : Step 3 fin (4h) + UI début (4h)
Jour 3 : UI fin (4h) + Récap (4h)
Jour 4 : Tests + Validation (4h) → RAPPORT FINAL
```
**Total : 3-4 jours**

### **Dashboard (Phase 5) - OPTIONNEL**
```
Semaine 2 : Backend + UI activation
Semaine 3 : Dashboard tracker + polish
```
**Total : +1-2 semaines**

---

## 🎯 **UTILISATION PAR RÔLE**

### **👨‍💻 Développeur**

**1. Choisir un sprint**
```bash
# Exemple : Sprint Fix-1A (Step 3 schéma)
# Lire : 02-CORRECTION-STEP3-PRODUITS.md → Sprint Fix-1A
```

**2. Lire les tâches**
```markdown
#### 1A.1 Créer nouveau schéma produit
[Instructions détaillées]
```

**3. Implémenter**
```bash
# Créer/modifier fichiers selon instructions
# Tester selon DoD
```

**4. Valider DoD**
```markdown
### DoD Sprint Fix-1A
- [ ] SelectedProductSchemaV3 créé ✅
- [ ] Types exportés ✅
- [ ] Build passe ✅
```

**5. Commit**
```bash
git commit -m "feat: add ProductSelectionSchemaV3 with alternatives and matching score"
```

**6. Passer au sprint suivant**

---

### **🧪 Testeur**

**1. Consulter matrice tests**
```
05-TESTS-VALIDATION.md → MATRICE-TESTS-V2-5.md
```

**2. Exécuter cas tests**
```markdown
Cas #1 : Mixte, 25 ans, Acné, Budget Essentiel
- [ ] Upload 2 photos
- [ ] Remplir questionnaire
- [ ] Lancer analyse
- [ ] Vérifier résultats
```

**3. Documenter issues**
```markdown
ISSUES-TESTS-V2-5.md

### Issue #X
- Cas : #5
- Symptôme : produit non spécifié
- Statut : ❌ Bloquant
```

---

### **📊 Chef de Projet**

**1. Suivre progression**
```bash
# Vérifier fichiers de rapports
cat docs/plan-execution-v2-5/RAPPORT-NETTOYAGE.md
cat docs/plan-execution-v2-5/RAPPORT-STEP3-V3.md
cat docs/plan-execution-v2-5/RAPPORT-VALIDATION-FINALE.md
```

**2. Valider phases**
```markdown
# Checklist finale chaque phase
✅ Phase 0 : Nettoyage complet
✅ Phase 1 : Step 3 corrigé
⏳ Phase 2 : UI en cours...
```

**3. Décision go/no-go Dashboard**
```markdown
# Lire rapport validation finale
SI VALIDÉ ✅ → Go Phase 5 Dashboard
SI BLOQUÉ ❌ → Résoudre issues
```

---

## 🔧 **OUTILS & RESSOURCES**

### **Scripts Utiles**

```bash
# Tests unitaires
npm test -- products.v3.test.ts

# Benchmark performance
npx ts-node scripts/benchmark-step3.ts

# Tests E2E
npm run dev
# Puis parcours manuel
```

### **Fichiers Générés**

**Pendant l'exécution, créer :**
- `MATRICE-TESTS-V2-5.md` (Phase 4)
- `ISSUES-TESTS-V2-5.md` (Phase 4)
- `RAPPORT-NETTOYAGE.md` (Phase 0)
- `RAPPORT-STEP3-V3.md` (Phase 1)
- `RAPPORT-PERFORMANCE.md` (Phase 4)
- `RAPPORT-VALIDATION-FINALE.md` (Phase 4) ⭐

---

## 🚨 **TROUBLESHOOTING**

### **Problème : Build échoue après Phase 0**
```bash
# Solution : DEBUG-1 dans 01-NETTOYAGE-PIPELINE.md
grep -r "schemas/index" src/
# Remplacer imports obsolètes
```

### **Problème : Step 3 génère produits vides**
```bash
# Solution : DEBUG dans 02-CORRECTION-STEP3-PRODUITS.md
# Vérifier schéma V3 utilisé
# Vérifier prompt génère matchingScore
```

### **Problème : Tests échouent**
```bash
# Solution : DEBUG dans 05-TESTS-VALIDATION.md
# Reproduire cas isolément
# Activer logs debug
```

---

## 📊 **MÉTRIQUES DE SUCCÈS**

### **Critères Validation V2.5**

✅ **Pipeline propre**
- 0 schéma obsolète
- 1 système transformation (V3)
- Build OK

✅ **Step 3 fonctionnel**
- 0 "produit non spécifié"
- 100% alternatives
- Score matching visible

✅ **UI propre**
- Badges pertinents
- Modal alternatives
- Récap complet

✅ **Performance**
- Step 3 < 15s
- Total < 60s

✅ **Tests**
- 20/20 cas validés
- Rapport final ✅

---

## 🎯 **CHECKPOINTS OBLIGATOIRES**

### **Checkpoint 1 : Fin Phase 0**
❓ Build passe sans erreur ?  
❓ 0 import vers schémas obsolètes ?  
→ **Si NON :** DEBUG-1 dans 01-NETTOYAGE-PIPELINE.md

### **Checkpoint 2 : Fin Phase 1**
❓ 0 "produit non spécifié" sur test ?  
❓ Alternatives présentes ?  
→ **Si NON :** Revoir Sprint Fix-1A/1B

### **Checkpoint 3 : Fin Phase 4**
❓ 20/20 cas testés et validés ?  
❓ Rapport final statut VALIDÉ ?  
→ **Si NON :** NE PAS passer Phase 5

---

## 📞 **SUPPORT**

### **En cas de blocage**

1. **Consulter section DEBUG** du fichier concerné
2. **Vérifier logs** console navigateur + serveur
3. **Rollback** si nécessaire :
   ```bash
   git checkout HEAD~1 [fichier]
   ```
4. **Documenter issue** dans ISSUES-TESTS-V2-5.md

### **Ressources Externes**

- 📄 `docs/spec.md` - Spécifications générales
- 📄 `docs/PROJET-COMPLET-ROUTINE-V2-GPT5.md` - Architecture IA
- 📄 `docs/fiche-technique-phase2-dashboard.md` - Dashboard (Phase 5)

---

## ✅ **VALIDATION FINALE**

### **Avant de clôturer V2.5**

**Vérifier :**
- [ ] Tous fichiers plan-execution-v2-5/ marqués ✅
- [ ] RAPPORT-VALIDATION-FINALE.md créé
- [ ] Statut = VALIDÉ ✅
- [ ] 20 cas tests documentés
- [ ] Performance validée
- [ ] Utilisateur réel testé

**Si tout ✅ :**
```bash
git tag v2.5-validated
git push origin v2.5-validated
```

**Puis décider :**
- → Dashboard Phase 5 maintenant
- → Dashboard Phase 5 plus tard
- → Autre priorité

---

## 🎉 **CONCLUSION**

**V2.5 est considérée TERMINÉE quand :**

✅ Phases 0-4 complètes  
✅ Rapport validation finale VALIDÉ  
✅ Page Résultats 100% opérationnelle  
✅ 0 "produit non spécifié"  
✅ Alternatives visibles partout  
✅ UI propre et performante

**Dashboard (Phase 5) est bonus, pas obligatoire pour V2.5**

---

**📅 DATE CRÉATION :** {DATE_ACTUELLE}  
**📝 VERSION :** 1.0  
**✅ STATUT :** Prêt à exécuter

---

**Prochain fichier à lire :** `00-INDEX-GENERAL.md`

