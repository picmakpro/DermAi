# 📅 PLANNING D'EXÉCUTION - CORRECTION MAPPING V2 → FRONTEND

> **PROMPTS OPÉRATIONNELS POUR IMPLÉMENTATION**  
> *Version : 1.0 - 13 septembre 2025*  
> *Référence : diagnostic-technique-mapping-v2-frontend.md*

---

## 🎯 **STRUCTURE DU PLANNING**

Chaque sprint contient :
- **🚀 Prompt Principal** : Initialisation du sprint
- **✅ Prompt de Vérification** : Validation des résultats
- **🔧 Prompt de Debug** : Résolution des problèmes

---

## 🚀 **SPRINT 1 : CORRECTION MAPPING CRITIQUE**

### **🚀 PROMPT PRINCIPAL - SPRINT 1**

```
CONTEXTE : Le backend DermAI V2 fonctionne parfaitement (pipeline 4 étapes IA-First) mais les données ne s'affichent pas dans l'interface utilisateur. Le problème est dans le mapping V2→V1.

TÂCHE : Corriger les fonctions de mapping dans src/app/results/page.tsx

ACTIONS REQUISES :

1. CORRIGER convertV2RoutineToUnified() :
   - Ajouter champ "description" : step.targetProblem || `Soin ${step.careType}`
   - Ajouter champ "applicationDuration" : step.progressiveIntroduction ? "Progressif" : "En continu"  
   - Ajouter champ "category" : step.careType
   - Corriger "frequency" : step.timing === 'hebdomadaire' ? 'weekly' : 'daily'
   - Intégrer produits dans recommendedProducts avec catalogId, name, brand, category

2. ENRICHIR adaptV2ToV1Format() :
   - Ajouter beautyAssessment.specificities depuis diagnostic.zoneSpecificIssues
   - Créer beautyAssessment.overview avec [generalObservation, score global, type peau]
   - Ajouter beautyAssessment.improvementTimeEstimate = "3-4 mois"

3. DONNÉES DE TEST :
   Utiliser les vraies données des logs fournis pour tester le mapping.

CONTRAINTES :
- Respecter l'interface existante (pas de refonte)
- Maintenir compatibilité V1
- Ajouter fallbacks pour champs manquants

LIVRABLES :
- Fonctions de mapping corrigées
- Test avec données logs réelles
- Console.log détaillé du mapping
```

### **✅ PROMPT DE VÉRIFICATION - SPRINT 1**

```
VÉRIFICATION SPRINT 1 : Valider la correction du mapping V2→V1

TESTS À EFFECTUER :

1. VÉRIFIER convertV2RoutineToUnified() :
   - Chaque step a bien : description, applicationDuration, category, frequency
   - Les produits sont intégrés dans recommendedProducts avec tous les champs
   - Le mapping phase → timeOfDay est correct
   - Console.log de la routine unifiée générée

2. VÉRIFIER adaptV2ToV1Format() :
   - beautyAssessment.specificities est peuplé depuis zoneSpecificIssues
   - beautyAssessment.overview contient 3 éléments minimum
   - beautyAssessment.improvementTimeEstimate est défini
   - Console.log du beautyAssessment généré

3. VÉRIFIER AFFICHAGE :
   - Page /results affiche la routine 3 phases
   - Scores sont visibles avec justifications
   - Produits apparaissent dans chaque étape
   - Aucune erreur console

CRITÈRES DE SUCCÈS :
✅ Routine 3 phases affichée complètement
✅ Produits intégrés dans les étapes
✅ Scores et diagnostic visibles
✅ Aucune erreur de mapping

Si un critère échoue, utiliser le prompt de debug.
```

### **🔧 PROMPT DE DEBUG - SPRINT 1**

```
DEBUG SPRINT 1 : Résoudre les problèmes de mapping

PROBLÈMES FRÉQUENTS ET SOLUTIONS :

1. ROUTINE VIDE OU INCOMPLÈTE :
   - Vérifier que routineV2?.phases existe
   - Ajouter console.log dans convertV2RoutineToUnified pour tracer les données
   - Vérifier le mapping productsByStep.get(step.stepNumber)

2. PRODUITS NON INTÉGRÉS :
   - Vérifier que productsV2?.selectedProducts existe
   - S'assurer que product.routineStepId correspond à step.stepNumber
   - Ajouter fallback si product est undefined

3. BEAUTYASSESSMENT INCOMPLET :
   - Vérifier que analysisData?.diagnostic existe
   - Mapper correctement zoneSpecificIssues vers specificities
   - Ajouter valeurs par défaut pour champs manquants

4. ERREURS DE STRUCTURE :
   - Vérifier les types TypeScript
   - Ajouter vérifications d'existence avant mapping
   - Utiliser optional chaining (?.) partout

COMMANDES DEBUG :
- Console.log de analysisData complet au début d'adaptV2ToV1Format
- Console.log de chaque étape dans convertV2RoutineToUnified
- Console.log du résultat final avant return

SOLUTION FALLBACK :
Si le mapping échoue complètement, créer des données minimales valides pour éviter l'écran blanc.
```

---

## ⚡ **SPRINT 2 : OPTIMISATION AFFICHAGE**

### **🚀 PROMPT PRINCIPAL - SPRINT 2**

```
CONTEXTE : Le mapping de base fonctionne (Sprint 1 terminé). Maintenant optimiser l'affichage des données mappées.

TÂCHE : Optimiser l'affichage dans UnifiedRoutineSection et les composants associés

ACTIONS REQUISES :

1. BADGES ET TIMING INTELLIGENTS :
   - Modifier renderStep() dans UnifiedRoutineSection.tsx
   - Badge "Temporaire" si applicationDuration contient "Progressif" ou "jusqu'à"
   - Badge "Continu" si applicationDuration = "En continu"
   - Couleurs de phase basées sur step.category (nettoyage=vert, traitement=rouge, etc.)

2. INTÉGRATION PRODUITS AVANCÉE :
   - Afficher product.justification dans l'étape
   - Ajouter liens d'affiliation si disponibles
   - Fallback "Produit en cours de sélection..." si recommendedProducts vide

3. GESTION ZONES SPÉCIFIQUES :
   - Afficher targetZones avec badges colorés
   - Différencier "Visage entier" vs zones spécifiques
   - Mapper zoneSpecificIssues vers observations localisées

CONTRAINTES :
- Utiliser les composants existants
- Respecter le design system
- Mobile-first responsive

LIVRABLES :
- Affichage badges optimisé
- Produits intégrés avec justifications
- Zones spécifiques bien affichées
```

### **✅ PROMPT DE VÉRIFICATION - SPRINT 2**

```
VÉRIFICATION SPRINT 2 : Valider l'optimisation de l'affichage

TESTS À EFFECTUER :

1. VÉRIFIER BADGES :
   - Badge "Temporaire" apparaît pour traitements progressifs
   - Badge "Continu" pour soins de base
   - Couleurs de phase cohérentes avec category

2. VÉRIFIER PRODUITS :
   - Justifications affichées sous chaque produit
   - Liens "Voir le produit" fonctionnels
   - Fallback affiché si pas de produit

3. VÉRIFIER ZONES :
   - Badges zones colorés et lisibles
   - Distinction claire visage entier vs zones spécifiques
   - Observations localisées bien mappées

4. VÉRIFIER RESPONSIVE :
   - Affichage mobile correct
   - Badges non tronqués
   - Navigation phases fluide

CRITÈRES DE SUCCÈS :
✅ Badges intelligents et colorés
✅ Produits avec justifications visibles
✅ Zones spécifiques bien différenciées
✅ Responsive parfait mobile/desktop

Si un critère échoue, utiliser le prompt de debug.
```

### **🔧 PROMPT DE DEBUG - SPRINT 2**

```
DEBUG SPRINT 2 : Résoudre les problèmes d'affichage

PROBLÈMES FRÉQUENTS ET SOLUTIONS :

1. BADGES NON AFFICHÉS :
   - Vérifier que applicationDuration est bien mappé
   - Ajouter console.log des conditions de badge
   - Vérifier les classes CSS Tailwind

2. PRODUITS SANS JUSTIFICATION :
   - Vérifier que product.justification existe
   - Ajouter fallback "Sélectionné pour votre peau"
   - Vérifier la structure recommendedProducts

3. ZONES MAL AFFICHÉES :
   - Vérifier que step.zones est un array
   - Ajouter vérification step.targetArea
   - Mapper correctement targetZones

4. PROBLÈMES RESPONSIVE :
   - Vérifier les classes md: et sm:
   - Tester sur différentes tailles d'écran
   - Ajuster les breakpoints si nécessaire

COMMANDES DEBUG :
- Console.log des conditions de badge
- Inspect des éléments DOM pour CSS
- Test responsive avec DevTools

SOLUTION FALLBACK :
Affichage minimal sans badges si les conditions échouent.
```

---

## 🔍 **SPRINT 3 : VALIDATION ET ROBUSTESSE**

### **🚀 PROMPT PRINCIPAL - SPRINT 3**

```
CONTEXTE : L'affichage de base fonctionne (Sprints 1-2 terminés). Maintenant assurer la robustesse et compatibilité.

TÂCHE : Ajouter gestion d'erreurs robuste et tests de compatibilité

ACTIONS REQUISES :

1. TESTS DE COMPATIBILITÉ :
   - Tester avec anciennes analyses V1 (format beautyAssessment existant)
   - Tester avec données V2 incomplètes (champs manquants)
   - Ajouter détection de format dans adaptV2ToV1Format

2. GESTION D'ERREURS AVANCÉE :
   - Try-catch autour de chaque transformation
   - Fallbacks intelligents par section (routine, produits, scores)
   - Messages d'erreur utilisateur-friendly
   - Logging détaillé pour debug production

3. OPTIMISATIONS PERFORMANCE :
   - Mémorisation des transformations coûteuses
   - Éviter re-renders inutiles
   - Optimiser les mappings répétitifs

CONTRAINTES :
- Maintenir 100% compatibilité V1
- Aucune régression performance
- Expérience utilisateur fluide même en cas d'erreur

LIVRABLES :
- Gestion d'erreurs complète
- Tests compatibilité V1/V2
- Performance optimisée
```

### **✅ PROMPT DE VÉRIFICATION - SPRINT 3**

```
VÉRIFICATION SPRINT 3 : Valider la robustesse et compatibilité

TESTS À EFFECTUER :

1. TESTS COMPATIBILITÉ :
   - Charger une ancienne analyse V1 → doit fonctionner
   - Simuler données V2 incomplètes → fallbacks activés
   - Vérifier détection automatique de format

2. TESTS GESTION D'ERREURS :
   - Simuler erreur de mapping → message utilisateur
   - Vérifier try-catch dans toutes les transformations
   - Logs d'erreur détaillés en console

3. TESTS PERFORMANCE :
   - Mesurer temps de transformation mapping
   - Vérifier absence de re-renders excessifs
   - Tester avec données volumineuses

4. TESTS UTILISATEUR :
   - Expérience fluide même avec erreurs
   - Messages d'erreur compréhensibles
   - Fallbacks invisibles pour l'utilisateur

CRITÈRES DE SUCCÈS :
✅ 100% compatibilité V1 maintenue
✅ Fallbacks robustes pour V2 incomplètes
✅ Gestion d'erreurs transparente
✅ Performance maintenue ou améliorée

Si un critère échoue, utiliser le prompt de debug.
```

### **🔧 PROMPT DE DEBUG - SPRINT 3**

```
DEBUG SPRINT 3 : Résoudre les problèmes de robustesse

PROBLÈMES FRÉQUENTS ET SOLUTIONS :

1. RÉGRESSION COMPATIBILITÉ V1 :
   - Vérifier que la détection de format fonctionne
   - S'assurer que les analyses V1 passent directement
   - Ajouter tests avec vraies données V1

2. FALLBACKS DÉFAILLANTS :
   - Vérifier que chaque transformation a un fallback
   - Tester avec données null/undefined
   - Ajouter valeurs par défaut cohérentes

3. ERREURS NON GÉRÉES :
   - Entourer chaque mapping de try-catch
   - Logger les erreurs avec contexte
   - Afficher messages utilisateur appropriés

4. PROBLÈMES PERFORMANCE :
   - Identifier les transformations coûteuses
   - Ajouter mémorisation avec useMemo
   - Optimiser les boucles de mapping

COMMANDES DEBUG :
- Console.time pour mesurer performance
- Console.error pour tracer les erreurs
- React DevTools pour analyser re-renders

SOLUTION FALLBACK :
Mode dégradé avec données minimales si tout échoue.
```

---

## 📈 **SPRINT 4 : AMÉLIORATIONS UX**

### **🚀 PROMPT PRINCIPAL - SPRINT 4**

```
CONTEXTE : Le système est robuste et fonctionnel (Sprints 1-3 terminés). Maintenant améliorer l'expérience utilisateur.

TÂCHE : Ajouter améliorations UX et fonctionnalités avancées

ACTIONS REQUISES :

1. AFFICHAGE ENRICHI :
   - Animations d'apparition pour nouvelles données
   - Tooltips explicatifs sur badges et scores
   - Indicateurs "Personnalisé par IA" pour contenu V2

2. FONCTIONNALITÉS AVANCÉES :
   - Export PDF avec nouvelles données V2
   - Partage optimisé avec données complètes
   - Analytics d'affichage (quelles sections vues)

3. INTERFACE ÉDUCATIVE :
   - Explications des phases de routine
   - Conseils d'application détaillés
   - Progression visuelle du traitement

CONTRAINTES :
- Améliorations non-intrusives
- Performance maintenue
- Accessibilité respectée

LIVRABLES :
- Interface enrichie et éducative
- Fonctionnalités avancées
- Analytics intégrées
```

### **✅ PROMPT DE VÉRIFICATION - SPRINT 4**

```
VÉRIFICATION SPRINT 4 : Valider les améliorations UX

TESTS À EFFECTUER :

1. VÉRIFIER AFFICHAGE ENRICHI :
   - Animations fluides et non-intrusives
   - Tooltips informatifs et bien positionnés
   - Indicateurs IA visibles et élégants

2. VÉRIFIER FONCTIONNALITÉS :
   - Export PDF avec données V2 complètes
   - Partage avec nouvelles informations
   - Analytics trackant les interactions

3. VÉRIFIER INTERFACE ÉDUCATIVE :
   - Explications claires et accessibles
   - Conseils pratiques et utiles
   - Progression visuelle compréhensible

4. TESTS ACCESSIBILITÉ :
   - Navigation clavier fonctionnelle
   - Contrastes suffisants
   - Screen readers compatibles

CRITÈRES DE SUCCÈS :
✅ UX enrichie et intuitive
✅ Fonctionnalités avancées opérationnelles
✅ Interface éducative claire
✅ Accessibilité maintenue

Si un critère échoue, utiliser le prompt de debug.
```

### **🔧 PROMPT DE DEBUG - SPRINT 4**

```
DEBUG SPRINT 4 : Résoudre les problèmes UX

PROBLÈMES FRÉQUENTS ET SOLUTIONS :

1. ANIMATIONS SACCADÉES :
   - Vérifier les transitions CSS
   - Optimiser les animations Framer Motion
   - Réduire la complexité si nécessaire

2. TOOLTIPS MAL POSITIONNÉS :
   - Ajuster les positions avec Floating UI
   - Vérifier les z-index
   - Tester sur différentes tailles d'écran

3. EXPORT PDF DÉFAILLANT :
   - Vérifier que toutes les données V2 sont incluses
   - Tester la génération avec html2canvas
   - Optimiser la mise en page PDF

4. ANALYTICS NON FONCTIONNELLES :
   - Vérifier l'intégration Google Analytics
   - Tester les événements custom
   - Valider le tracking des interactions

COMMANDES DEBUG :
- DevTools pour animations CSS
- Console pour événements analytics
- Test PDF sur différents navigateurs

SOLUTION FALLBACK :
Désactiver les améliorations problématiques en gardant le fonctionnel de base.
```

---

## 📊 **TABLEAU DE BORD PROGRESSION**

### **STATUT SPRINTS**

| Sprint | Durée | Statut | Prompt Principal | Vérification | Debug |
|--------|-------|--------|------------------|--------------|-------|
| **Sprint 1** | 2-3h | ✅ Terminé | ✅ Prêt | ✅ Prêt | ✅ Prêt |
| **Sprint 2** | 1-2h | ⏳ En attente | ✅ Prêt | ✅ Prêt | ✅ Prêt |
| **Sprint 3** | 1-2h | ⏳ En attente | ✅ Prêt | ✅ Prêt | ✅ Prêt |
| **Sprint 4** | 2-3h | ⏳ En attente | ✅ Prêt | ✅ Prêt | ✅ Prêt |

### **MÉTRIQUES CIBLES**

| Métrique | Objectif | Sprint |
|----------|----------|--------|
| **Affichage routine** | 100% données V2 | Sprint 1 |
| **Produits intégrés** | Dans chaque étape | Sprint 1 |
| **Badges intelligents** | Basés sur données | Sprint 2 |
| **Compatibilité V1** | 100% maintenue | Sprint 3 |
| **Performance** | <100ms mapping | Sprint 3 |
| **UX enrichie** | Animations + tooltips | Sprint 4 |

---

## 🚀 **INSTRUCTIONS D'UTILISATION**

### **POUR CHAQUE SPRINT :**

1. **📋 PRÉPARATION**
   - Lire le diagnostic technique correspondant
   - Vérifier l'état du code actuel
   - Préparer les données de test

2. **🚀 EXÉCUTION**
   - Copier-coller le prompt principal
   - Suivre les actions requises
   - Respecter les contraintes

3. **✅ VALIDATION**
   - Utiliser le prompt de vérification
   - Tester tous les critères de succès
   - Documenter les résultats

4. **🔧 DEBUG SI NÉCESSAIRE**
   - Utiliser le prompt de debug
   - Appliquer les solutions proposées
   - Retester jusqu'à validation

5. **📝 DOCUMENTATION**
   - Mettre à jour le statut du sprint
   - Noter les problèmes rencontrés
   - Préparer le sprint suivant

---

*Planning d'Exécution Mapping V2 → Frontend - DermAI V2*  
*Version 1.0 - Prompts Opérationnels*  
*13 septembre 2025*
