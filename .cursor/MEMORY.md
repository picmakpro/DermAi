# 🧠 MEMORY.md - Mémoire de Contexte Agents DermAI V2

**Version** : 1.0  
**Date** : 6 Novembre 2025  
**Objectif** : Maintenir la mémoire et le contexte entre sessions agents

---

## 🎯 OBJECTIF

Ce document sert de **mémoire persistante** pour les agents Cursor, permettant de :
- ✅ Conserver le contexte entre sessions
- ✅ Éviter de répéter les mêmes explications
- ✅ Tracker l'état d'avancement du projet
- ✅ Documenter les décisions importantes

---

## 📊 ÉTAT GLOBAL DU PROJET

### **Statut Actuel**
**Date** : 6 Novembre 2025  
**Phase** : Migration Cursor 2.0 terminée, Sprint 1 prêt à exécuter  
**Progression** : ~75% du projet terminé

### **Sprints Complétés**
- ✅ Architecture Next.js 15 + TypeScript
- ✅ Interface upload + questionnaire
- ✅ Intégration GPT-4o Vision (Steps 1-2)
- ✅ Page résultats avec scores
- ✅ Routine 3 phases dermatologique
- ✅ Catalogue 110 produits (Supabase)
- ✅ ProductMatcherV2 avec scoring ingrédients

### **Sprint en Cours**
**Sprint 1** : Step 3 Hybride (IA + Algo)  
**Durée** : 5 jours (2-3 jours en Worktree)  
**Statut** : 🟡 Prêt à démarrer

### **Prochains Sprints**
- Sprint 2 : UI Résultats (3 jours)
- Sprint 3 : Auth & Cloud Storage (5 jours)
- Sprint 4-5 : Dashboard (12 jours)
- Sprint 6 : Scaling Catalogue 2000+ (10 jours)
- Sprint 7-8 : Analytics & Lancement (12 jours)

---

## 🗂️ ARCHITECTURE PROJET

### **Stack Technique**
```
Frontend : Next.js 15, React 19, TypeScript 5.3, Tailwind CSS
Backend  : Next.js API Routes, Supabase PostgreSQL
IA       : OpenAI GPT-4o Vision
Hosting  : Vercel + Supabase Cloud
```

### **Structure Clés**
```
/src
├── app/                   # Next.js App Router
│   ├── api/              # API Routes serverless
│   └── (routes)/         # Pages
├── components/           # Composants React
│   ├── ui/              # shadcn/ui primitives
│   ├── shared/          # Réutilisables
│   └── features/        # Métier
├── services/            # Logique métier
│   ├── ai/             # Services IA
│   └── products/       # Matching produits
├── lib/                # Utilitaires
├── types/              # Types TypeScript
└── hooks/              # Custom hooks

/docs                    # Documentation
/.cursor                 # Configuration Cursor 2.0
/tests                   # Tests unitaires + E2E
```

---

## 🔄 PIPELINE IA (4 ÉTAPES)

### **Step 1 : Diagnostic Visuel**
**Status** : ✅ Opérationnel  
**Service** : `src/services/ai/analysis.service.ts`  
**Input** : Photos + profil utilisateur  
**Output** : SkinType, concerns, scores (8 paramètres)  
**Model** : GPT-4o Vision, température 0.0

### **Step 2 : Routine Personnalisée**
**Status** : ✅ Opérationnel  
**Service** : `src/services/ai/routine.service.ts`  
**Input** : Diagnostic + profil  
**Output** : 3 phases × slots (Matin/Soir/Hebdo)  
**Model** : GPT-4o, température 0.0

### **Step 3 : Sélection Produits**
**Status** : 🟡 En refonte (Sprint 1)  
**Service** : `src/services/products/HybridProductSelector.ts` (à créer)  
**Architecture** : **HYBRIDE IA + ALGO**
- Micro-IA : Mapping conceptuel (500 tokens)
- Database : Catalogue Supabase (110 → 2000+ produits)
- Algorithme : Scoring 5 critères (TypeScript)
- Garantie : 1 produit + 3 alternatives par step

**Problème actuel** :
- ❌ "Produits non spécifiés"
- ❌ Pas d'alternatives
- ❌ Latence élevée (15-20s)

**Solution Sprint 1** :
- ✅ Architecture hybride
- ✅ Performance < 5s
- ✅ 100% complétude
- ✅ Coût -88% tokens

### **Step 4 : Assemblage & Validation**
**Status** : ✅ Opérationnel  
**Service** : Algorithmique (validation cohérence)  
**Input** : Routine + produits  
**Output** : Résultat final validé

---

## 📦 CATALOGUE PRODUITS

### **État Actuel**
- **Nombre** : 110 produits
- **Source** : JSON statique → Supabase PostgreSQL
- **Enrichissement** : GPT-4o-mini (métadonnées)
- **Scoring** : ProductMatcherV2 (5 critères)

### **Métadonnées Produits**
```typescript
{
  catalogId: string
  name: string
  brand: string
  careType: string  // 10 types spécialisés
  targetSkinTypes: string[]
  targetConcerns: string[]
  ingredients: string[]  // INCI complet
  restrictedZones: string[]  // Zones interdites
  price: number
  dermatologistRating: number
  comedogenic: boolean
  irritant: boolean
  photosensitizing: boolean
  pregnancySafe: boolean
}
```

### **Taxonomie careType (V2)**
```
10 types spécialisés :
- Base : nettoyage, tonification, hydratation, protection
- Traitements : anti-age, eclat, traitement-cible, apaisement
- Soins : exfoliation, masque
```

### **Scoring V2 (5 critères)**
```
35% Compatibilité ingrédients × skinType
30% Alignement problématique
20% Qualité dermatologique
10% Prix
5% Popularité
```

### **Roadmap Catalogue**
- ✅ Phase 0-3 : 110 produits enrichis (terminé)
- 🟡 Phase 4 : Import 2000+ produits Amazon (Sprint 6)
- 📋 Phase 5 : Production + monitoring

---

## 🎯 DÉCISIONS IMPORTANTES

### **Décision 1 : Architecture Hybride Step 3**
**Date** : Octobre 2025  
**Raison** : Approche monolithique IA pure atteint ses limites
- Token limit OpenAI
- Latence élevée (15-20s)
- JSON incomplet (5/20 produits)
- Coût élevé ($0.80 par analyse)

**Solution** : Architecture hybride IA + Algo
- Micro-IA : Mapping conceptuel léger
- Database : Catalogue enrichi Supabase
- Algorithme : Scoring déterministe TypeScript
- Résultat : Performance × 3, coût -88%, fiabilité 100%

### **Décision 2 : Migration Cursor 2.0**
**Date** : 6 Novembre 2025  
**Raison** : Besoin de parallélisation et structure claire

**Actions** :
- ✅ Création `.cursor/` (4 fichiers)
- ✅ Documentation complète (11 fichiers)
- ✅ Roadmap 8 sprints
- ✅ Sprint 1 prêt à exécution

**Bénéfices attendus** :
- -20% temps développement
- +200% parallélisation (3 agents simultanés)
- +100% couverture tests
- Qualité standardisée

### **Décision 3 : Taxonomie careType V2**
**Date** : Octobre 2025  
**Raison** : 6 types insuffisants pour 2000+ produits

**Évolution** : 6 → 10 types spécialisés
- Ajout : anti-age, eclat, traitement-cible, apaisement
- Meilleure granularité
- Couverture profils 75% → 95%

### **Décision 4 : Scoring Ingrédients (35%)**
**Date** : Octobre 2025  
**Raison** : Améliorer précision matching

**Implémentation** :
- Database 26 ingrédients clés
- Compatibilité × 7 types de peau
- Métadonnées sécurité (comedogenic, irritant, etc.)
- Score ingrédients : 82/100 (excellent)

**Résultat** : +49% amélioration scores matching

---

## 🚧 PROBLÈMES CONNUS

### **Problème 1 : Step 3 Instable**
**Status** : 🟡 En cours (Sprint 1)  
**Symptômes** :
- "Produits non spécifiés" (30% des cas)
- Pas d'alternatives (0-1 au lieu de 3+)
- JSON incomplet (5/20 produits)

**Cause** : Architecture monolithique IA pure
**Solution** : Architecture hybride (Sprint 1)

### **Problème 2 : UI Résultats Surchargée**
**Status** : 📋 Planifié (Sprint 2)  
**Symptômes** :
- Tous badges affichés (timing, SPF, contours)
- Surcharge visuelle
- Pas de modal alternatives

**Solution** : Badges sélectifs + modal alternatives

### **Problème 3 : Auth Non Configuré**
**Status** : 📋 Planifié (Sprint 3)  
**Symptômes** :
- NextAuth.js installé mais non configuré
- Pas de login/signup
- Stockage local uniquement

**Solution** : Configuration NextAuth + migration cloud

---

## 📚 DOCUMENTATION CLÉS

### **Configuration Cursor**
- `.cursor/CURSOR.md` - Configuration globale
- `.cursor/FRONTEND.md` - Patterns React/Next.js
- `.cursor/BACKEND.md` - Patterns API/Services
- `.cursor/RULES.md` - Règles de code
- `.cursor/ORCHESTRATOR.md` - Coordination agents
- `.cursor/AGENT_ROLES.md` - Rôles agents
- `.cursor/MEMORY.md` - Ce fichier
- `.cursor/CHECKLISTS.md` - Checklists validation

### **Planification**
- `docs/IMPLEMENTATION_PLAN.md` - Roadmap 8 sprints
- `docs/ARCHITECTURE.md` - Architecture technique
- `docs/SPRINT_1_EXECUTION.md` - Sprint 1 détaillé
- `docs/spec.md` - Spécifications complètes (946 lignes)

### **Guides Rapides**
- `QUICKSTART.md` - Démarrage 3 minutes
- `MIGRATION_COMPLETE.md` - Guide complet migration

---

## 🔧 COMMANDES ESSENTIELLES

### **Développement**
```bash
npm run dev              # Serveur dev (localhost:3000)
npm run type-check       # TypeScript strict
npm run lint             # ESLint
```

### **Tests**
```bash
npm run test             # Tests unitaires (Jest)
npm run test:watch       # Watch mode
npm run test:e2e         # Tests E2E (Playwright)
npm run test:coverage    # Coverage (cible > 80%)
```

### **Build**
```bash
npm run build            # Build production
npm run start            # Serveur production
```

### **Database**
```bash
npx supabase link        # Lier projet Supabase
npx supabase db push     # Appliquer migrations
npx supabase gen types   # Générer types TypeScript
```

---

## 🎯 CONTEXTE SPRINT 1

### **Objectif**
Finaliser Step 3 avec architecture hybride pour **100% fiabilité**

### **3 Agents Parallèles**

#### **Agent Backend** (Jour 1-2)
**Fichiers à créer** :
- `src/services/products/HybridProductSelector.ts`
- `src/services/products/ProductMatcherV2.ts` (modifier)
- `src/services/products/scoring/ingredientScoring.ts`

**Tâches** :
- Classe HybridProductSelector avec selectForStep()
- Micro-IA (GPT-4o-mini) pour mapping conceptuel
- Intégration ProductMatcherV2 (scoring 5 critères)
- Cache 1h par careType
- Logs détaillés

#### **Agent Frontend** (Jour 1-2, parallèle)
**Fichiers à créer** :
- `src/components/features/routine/AlternativesModal.tsx`
- `src/components/features/routine/ScoreBadge.tsx`
- `src/components/features/routine/ProductCard.tsx` (modifier)

**Tâches** :
- Affichage score matching (50-95%)
- Modal alternatives (3+ produits)
- Badge score avec couleurs
- Bouton "Voir alternatives"

#### **Agent Tests** (Jour 3)
**Fichiers à créer** :
- `tests/unit/services/products/HybridProductSelector.test.ts`
- `tests/unit/services/products/ProductMatcherV2.test.ts`
- `tests/e2e/step3-hybrid.spec.ts`

**Tâches** :
- 10+ tests unitaires HybridProductSelector
- 10+ tests unitaires ProductMatcherV2
- 20 tests E2E cas variés
- Validation 100% complétude

### **Definition of Done**
- [ ] Tests 20 cas variés passent à 100%
- [ ] 0 erreur JSON parsing
- [ ] Alternatives affichées (3+)
- [ ] Score matching visible (50-95%)
- [ ] Performance < 5s
- [ ] Build production OK

---

## 🧠 MÉMOIRE AGENTS

### **Ce que les Agents DOIVENT savoir**

#### **Agent Backend**
- ✅ Architecture hybride Step 3 (IA + Algo)
- ✅ Scoring 5 critères (35% ingrédients)
- ✅ Cache 1h par careType
- ✅ Validation Zod stricte
- ✅ Error handling OpenAI API
- ✅ Logs structurés avec [ServiceName]

#### **Agent Frontend**
- ✅ Composants React fonctionnels uniquement
- ✅ Props typées (interfaces)
- ✅ Tailwind CSS pour styling
- ✅ Framer Motion pour animations
- ✅ React Query pour data fetching
- ✅ Loading states obligatoires

#### **Agent Tests**
- ✅ Coverage > 80% obligatoire
- ✅ Tests isolés et rapides
- ✅ Mocks pour services externes
- ✅ Tests E2E pour parcours complets
- ✅ Cas limites et erreurs testés

---

## 📊 MÉTRIQUES PROJET

### **Performance**
- Lighthouse Score : 85 (cible > 90)
- First Contentful Paint : 1.8s (cible < 1.5s)
- Time to Interactive : 3.5s (cible < 3s)
- Bundle Size : 450KB (cible < 500KB)

### **Qualité Code**
- TypeScript strict : ✅ Activé
- ESLint errors : 0
- Test coverage : 40% (cible > 80%)
- Console.log production : 0

### **IA Performance**
- Step 1 (Diagnostic) : ~8s
- Step 2 (Routine) : ~6s
- Step 3 (Produits) : 15-20s (cible < 5s avec hybride)
- Step 4 (Assemblage) : <1s

### **Catalogue**
- Produits actifs : 110
- Couverture profils : 75% (cible 95%)
- Score matching moyen : 71/100
- Alternatives par step : 0-1 (cible 3+)

---

## 🔄 CHANGELOG

### **6 Novembre 2025**
- ✅ Migration Cursor 2.0 terminée
- ✅ Création `.cursor/` (8 fichiers)
- ✅ Documentation complète (11 fichiers)
- ✅ Roadmap 8 sprints définie
- ✅ Sprint 1 prêt à exécution

### **Octobre 2025**
- ✅ Phase 3 terminée (scoring ingrédients)
- ✅ 110 produits enrichis
- ✅ ProductMatcherV2 opérationnel
- ✅ Amélioration scores +49%

### **Septembre 2025**
- ✅ Phase 2 terminée (migration Supabase)
- ✅ Architecture scalable 2000+ produits
- ✅ Cache 1h par careType

---

## 🎯 PROCHAINES ACTIONS

### **Immédiat** (Aujourd'hui)
1. ✅ Lire `QUICKSTART.md`
2. ✅ Lire `.cursor/ORCHESTRATOR.md`
3. ✅ Lire `docs/SPRINT_1_EXECUTION.md`
4. ✅ Activer mode Worktree
5. ✅ Lancer Agent Backend + Frontend

### **Cette Semaine** (Sprint 1)
- Jour 1-2 : Backend + Frontend (parallèle)
- Jour 3 : Tests
- Jour 4-5 : Validation et merge

### **Prochaines Semaines**
- Semaine 2 : Sprint 2 (UI Résultats)
- Semaine 3 : Sprint 3 (Auth)
- Semaine 4-5 : Sprint 4-5 (Dashboard)

---

## 💡 NOTES IMPORTANTES

### **Pour les Agents**
- ✅ **TOUJOURS** lire ce fichier MEMORY.md avant de commencer
- ✅ **TOUJOURS** consulter `.cursor/AGENT_ROLES.md` pour votre rôle
- ✅ **TOUJOURS** suivre les patterns dans `.cursor/FRONTEND.md` ou `.cursor/BACKEND.md`
- ✅ **TOUJOURS** respecter les règles dans `.cursor/RULES.md`
- ✅ **TOUJOURS** valider avec les checklists dans `.cursor/CHECKLISTS.md`

### **Contexte Persistant**
Ce fichier est mis à jour après chaque sprint pour maintenir le contexte. Les agents doivent le lire au début de chaque session pour comprendre l'état actuel du projet.

### **Éviter Répétitions**
Si une explication est déjà dans ce fichier, les agents peuvent la référencer au lieu de la répéter.

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Prochain update** : Fin Sprint 1

