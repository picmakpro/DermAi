# 📋 PLAN D'EXÉCUTION V2.5 - INDEX GÉNÉRAL

> **Objectif Global :** Stabiliser et finaliser la page Résultats avant toute autre feature (Dashboard, etc.)

---

## 🎯 **PRINCIPE DIRECTEUR**

**"Finir la page Résultats à 100% avant d'avancer"**

- ✅ Pipeline IA propre et ficelée
- ✅ Sélection produits fonctionnelle avec alternatives
- ✅ UI badges et alternance impeccables
- ✅ Aucun "produit non spécifié"
- ✅ Score de matching visible partout

---

## 📁 **STRUCTURE DU PLAN**

### **Phase 0 : Nettoyage Pipeline** ⚡ **CRITIQUE - À FAIRE EN PREMIER**
📄 `01-NETTOYAGE-PIPELINE.md`
- Supprimer schémas obsolètes
- Nettoyer double pipeline
- Archiver fichiers morts
- **Durée :** 2h
- **Priorité :** P0 (bloquant)

### **Phase 1 : Correction Step 3 Produits** 🔧 **URGENT**
📄 `02-CORRECTION-STEP3-PRODUITS.md`
- Aligner schéma ↔ prompt
- Ajouter score de matching
- Sécuriser catalogue
- Valider enrichissement
- **Durée :** 1 jour
- **Priorité :** P0 (bloquant)

### **Phase 2 : Amélioration UI/UX Résultats** 🎨
📄 `03-AMELIORATION-UI-RESULTATS.md`
- Badges sélectifs (pas tous)
- Alternance visuelle
- Score matching sur produits
- Alternatives visibles
- **Durée :** 1.5 jours
- **Priorité :** P1 (haute)

### **Phase 3 : Récap Utilisateur** 📸
📄 `04-RECAP-UTILISATEUR.md`
- Section "Vos entrées" fin de page
- Mini-galerie photos
- Profil + questionnaire résumé
- Ancre #recap
- **Durée :** 0.5 jour
- **Priorité :** P1 (moyenne)

### **Phase 4 : Tests & Validation** ✅
📄 `05-TESTS-VALIDATION.md`
- Tests 20 cas variés
- Vérification produits
- Performance Step 3
- Validation finale
- **Durée :** 0.5 jour
- **Priorité :** P0 (critique)

### **Phase 5 : Dashboard (APRÈS)** 📊
📄 `06-DASHBOARD-PHASE2.md`
- Architecture DB
- Bouton "Suivre routine"
- Routine active
- **Durée :** 1-2 semaines
- **Priorité :** P2 (après résultats)

---

## ⏱️ **TIMELINE GLOBALE**

```
SEMAINE 1 : Nettoyage + Step 3 + UI (3-4 jours)
├─ J1 : Nettoyage pipeline (2h) + Step 3 début (6h)
├─ J2 : Step 3 fin + tests (8h)
├─ J3 : UI badges + alternance (8h)
└─ J4 : Récap user + polish (4h) + Tests finaux (4h)

VALIDATION : Page Résultats 100% opérationnelle

SEMAINE 2-3 : Dashboard Phase 2 (optionnel après validation)
```

---

## 🚦 **ORDRE D'EXÉCUTION STRICT**

### **Étape 1 : NETTOYAGE** (obligatoire)
→ Lire `01-NETTOYAGE-PIPELINE.md`
→ Exécuter tous les sprints de nettoyage
→ Vérifier : Build passe, 0 erreur

### **Étape 2 : CORRECTION STEP 3** (bloquant)
→ Lire `02-CORRECTION-STEP3-PRODUITS.md`
→ Exécuter sprints Fix-1A, Fix-1B, Fix-1C
→ Vérifier : Alternatives présentes, 0 "produit non spécifié"

### **Étape 3 : AMÉLIORATION UI**
→ Lire `03-AMELIORATION-UI-RESULTATS.md`
→ Exécuter sprints UI-2A, UI-2B
→ Vérifier : Badges non surchargés, score visible

### **Étape 4 : RÉCAP UTILISATEUR**
→ Lire `04-RECAP-UTILISATEUR.md`
→ Exécuter sprint Recap-3A
→ Vérifier : Section complète en fin de page

### **Étape 5 : TESTS FINAUX**
→ Lire `05-TESTS-VALIDATION.md`
→ Exécuter tous les tests
→ Vérifier : 20/20 cas passent

### **Étape 6 : DASHBOARD** (uniquement si étapes 1-5 OK)
→ Lire `06-DASHBOARD-PHASE2.md`
→ Planifier selon résultats précédents

---

## 📊 **MÉTRIQUES DE SUCCÈS**

### **Critères de Validation (avant Dashboard)**

✅ **Pipeline IA :**
- [ ] 0 schéma obsolète dans le code
- [ ] 1 seul système de transformation (V3)
- [ ] Catalogue validé avant Step 3
- [ ] Logs complets Step 1-4

✅ **Step 3 Produits :**
- [ ] Alternatives sur 100% des produits
- [ ] Score matching 50-95% affiché
- [ ] 0 "produit non spécifié"
- [ ] Budget respecté 100%

✅ **UI Résultats :**
- [ ] Badges : timing + alternance seulement
- [ ] SPF/contours dans restrictions
- [ ] AlternanceIndicator si 2 traitements
- [ ] Modal alternatives fonctionnel

✅ **Récap Utilisateur :**
- [ ] Photos miniatures cliquables
- [ ] Profil + questionnaire visible
- [ ] UV/Budget/Style affichés
- [ ] Ancre #recap fonctionnelle

✅ **Performance :**
- [ ] Step 3 < 15s
- [ ] 20 cas tests validés
- [ ] 0 erreur console critique
- [ ] Build production OK

---

## 🚨 **RÈGLES STRICTES**

### **❌ INTERDICTIONS**

1. **NE PAS** commencer le Dashboard avant validation complète page Résultats
2. **NE PAS** ajouter de nouvelles features pendant le nettoyage
3. **NE PAS** modifier l'architecture IA pendant les sprints UI
4. **NE PAS** ignorer les tests de validation finale

### **✅ OBLIGATIONS**

1. **TOUJOURS** suivre l'ordre des phases (0→1→2→3→4→5)
2. **TOUJOURS** valider les DoD (Definition of Done) avant de passer au sprint suivant
3. **TOUJOURS** commit après chaque sprint terminé
4. **TOUJOURS** tester sur 5 cas minimum après chaque modification

---

## 📞 **CONTACT & SUPPORT**

### **En cas de blocage :**

1. **Consulter le fichier de debug** du sprint concerné
2. **Vérifier les logs** détaillés dans la console
3. **Rollback** au commit précédent si nécessaire
4. **Documenter** le problème dans `ISSUES.md`

### **Validation finale :**

Avant de considérer V2.5 terminé :
- [ ] Tous les fichiers de ce plan marqués ✅
- [ ] Tests 20 cas réussis à 100%
- [ ] Page Résultats testée par utilisateur réel
- [ ] Performance validée en production

---

## 📚 **DOCUMENTATION ASSOCIÉE**

- `docs/spec.md` - Spécifications générales
- `docs/PROJET-COMPLET-ROUTINE-V2-GPT5.md` - Architecture IA actuelle
- `archive/schemas-cleanup/` - Fichiers obsolètes archivés
- `docs/planning-execution-refonte-routine-ui-v3.md` - Refonte UI V3 (déjà fait)

---

**🎯 OBJECTIF FINAL :** Page Résultats irréprochable, prête pour le Dashboard Phase 2

**📅 DATE DÉBUT :** {DATE_ACTUELLE}  
**⏰ DURÉE ESTIMÉE :** 3-5 jours (hors Dashboard)  
**✅ VALIDATION :** Tests 20 cas + utilisateur réel

---

**Prochain fichier à consulter :** `01-NETTOYAGE-PIPELINE.md`


