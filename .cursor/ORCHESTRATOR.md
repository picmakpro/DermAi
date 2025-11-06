# 🎭 ORCHESTRATOR.md - Coordination Agents DermAI V2

**Version** : 1.0  
**Date** : 6 Novembre 2025  
**Rôle** : Orchestration et coordination des agents parallèles

---

## 🎯 OBJECTIF

Ce document définit comment **orchestrer et coordonner** les agents Cursor pour un développement parallélisé efficace.

---

## 📋 AGENTS DISPONIBLES

### **Agent 1 : Backend** 🔧
**Spécialité** : Services, API routes, logique métier  
**Contexte** : `.cursor/BACKEND.md`  
**Fichiers** : `/src/services`, `/src/app/api`, `/src/lib`

### **Agent 2 : Frontend** 🎨
**Spécialité** : Composants React, UI, pages  
**Contexte** : `.cursor/FRONTEND.md`  
**Fichiers** : `/src/components`, `/src/app/(routes)`

### **Agent 3 : Tests** ✅
**Spécialité** : Tests unitaires, E2E, validation  
**Contexte** : `.cursor/RULES.md`  
**Fichiers** : `/tests/unit`, `/tests/e2e`

### **Agent 4 : Database** 💾
**Spécialité** : Migrations Supabase, schema  
**Contexte** : `.cursor/BACKEND.md`  
**Fichiers** : `/supabase/migrations`, schema SQL

### **Agent 5 : Performance** ⚡
**Spécialité** : Optimisations, cache, bundle  
**Contexte** : `.cursor/RULES.md`  
**Fichiers** : Configuration Vercel, cache

### **Agent 6 : Security** 🔒
**Spécialité** : Audit sécurité, validation  
**Contexte** : `.cursor/RULES.md`  
**Fichiers** : Middleware, validation

### **Agent 7 : DevOps** 🚀
**Spécialité** : CI/CD, déploiement  
**Contexte** : `.cursor/CURSOR.md`  
**Fichiers** : `.github/workflows`, `vercel.json`

---

## 🔄 MODES D'ORCHESTRATION

### **Mode 1 : Séquentiel** (Local)
**Quand** : Tâches simples, 1 fichier à modifier  
**Durée** : Standard  
**Agents** : 1 à la fois

```
Agent Backend → Termine → Agent Frontend → Termine → Agent Tests
```

### **Mode 2 : Parallèle** (Worktree) ✅ **RECOMMANDÉ**
**Quand** : Sprint complet, fichiers indépendants  
**Durée** : -50% à -70%  
**Agents** : 2-3 simultanés

```
Agent Backend ┐
              ├→ Travaillent ensemble → Agent Tests
Agent Frontend┘
```

### **Mode 3 : Cloud** (Cursor Pro)
**Quand** : Refactoring massif, deadline serrée  
**Durée** : -80%  
**Agents** : 5+ simultanés

```
Backend + Frontend + Tests + Database + Performance → Tous ensemble
```

---

## 📊 ORCHESTRATION PAR SPRINT

### **SPRINT 1 : Step 3 Hybride** (5 jours → 2-3 jours en Worktree)

#### **Phase 1 : Parallèle** (Jour 1-2)
```
┌─────────────────────────────────────────────────┐
│ AGENT BACKEND (Chat 1)                          │
│ Tâche : HybridProductSelector                   │
│ Fichiers :                                       │
│ - src/services/products/HybridProductSelector.ts│
│ - src/services/products/ProductMatcherV2.ts     │
│ - src/services/products/scoring/ingredientScoring.ts│
│ Durée : 2 jours                                  │
└─────────────────────────────────────────────────┘
                    ║
                    ║ EN PARALLÈLE
                    ║
┌─────────────────────────────────────────────────┐
│ AGENT FRONTEND (Chat 2)                         │
│ Tâche : Affichage scores + alternatives         │
│ Fichiers :                                       │
│ - src/components/features/routine/ProductCard.tsx│
│ - src/components/features/routine/AlternativesModal.tsx│
│ - src/components/features/routine/ScoreBadge.tsx│
│ Durée : 2 jours                                  │
└─────────────────────────────────────────────────┘
```

#### **Phase 2 : Séquentiel** (Jour 3)
```
┌─────────────────────────────────────────────────┐
│ AGENT TESTS (Chat 3)                            │
│ Tâche : Tests Step 3                            │
│ Fichiers :                                       │
│ - tests/unit/services/products/HybridProductSelector.test.ts│
│ - tests/unit/services/products/ProductMatcherV2.test.ts│
│ - tests/e2e/step3-hybrid.spec.ts                │
│ Durée : 1 jour                                   │
│ Dépend de : Backend + Frontend terminés         │
└─────────────────────────────────────────────────┘
```

#### **Phase 3 : Validation** (Jour 4-5)
```bash
npm run type-check && npm run lint && npm run test && npm run build
```

---

## 🎯 RÈGLES D'ORCHESTRATION

### **Règle 1 : Dépendances**
```
✅ BON : Backend + Frontend en parallèle (fichiers indépendants)
❌ MAUVAIS : Tests avant Backend (dépendance)
```

### **Règle 2 : Conflits**
```
✅ BON : Chaque agent modifie des fichiers différents
❌ MAUVAIS : 2 agents modifient le même fichier
```

### **Règle 3 : Communication**
```
✅ BON : Backend termine → Frontend utilise les types
❌ MAUVAIS : Frontend commence avant types Backend créés
```

### **Règle 4 : Validation**
```
✅ BON : Tests après Backend + Frontend
❌ MAUVAIS : Tests pendant développement
```

---

## 🔧 COMMANDES D'ORCHESTRATION

### **Lancer Mode Worktree**

#### **Étape 1 : Activer Worktree**
```
Cliquer menu déroulant (Local)
→ Sélectionner "Worktree - Run in parallel"
```

#### **Étape 2 : Ouvrir Chats**
```bash
# Chat 1 : Agent Backend
Cmd+Shift+L (Mac) ou Ctrl+Shift+L (Windows)

# Chat 2 : Agent Frontend
Cmd+Shift+L (Mac) ou Ctrl+Shift+L (Windows)

# Chat 3 : Agent Tests (plus tard)
Cmd+Shift+L (Mac) ou Ctrl+Shift+L (Windows)
```

#### **Étape 3 : Lancer Agents**

**Chat 1 (Backend)** :
```
@agent backend

Implémenter HybridProductSelector selon docs/SPRINT_1_EXECUTION.md

Créer :
- src/services/products/HybridProductSelector.ts
- src/services/products/ProductMatcherV2.ts (modifier)
- src/services/products/scoring/ingredientScoring.ts

Référence : Section "1. HybridProductSelector" dans docs/SPRINT_1_EXECUTION.md
Code complet fourni dans le document.
```

**Chat 2 (Frontend)** - IMMÉDIATEMENT APRÈS :
```
@agent frontend

Afficher scores + alternatives dans ResultsPage selon docs/SPRINT_1_EXECUTION.md

Créer :
- src/components/features/routine/AlternativesModal.tsx
- src/components/features/routine/ScoreBadge.tsx

Modifier :
- src/components/features/routine/ProductCard.tsx

Référence : Section "Agent 2 : Frontend" dans docs/SPRINT_1_EXECUTION.md
```

#### **Étape 4 : Attendre Fin**
```
Backend : ✅ Terminé (2 jours)
Frontend : ✅ Terminé (2 jours)
→ Vérifier : npm run type-check
```

#### **Étape 5 : Lancer Tests**

**Chat 3 (Tests)** :
```
@agent tests

Créer tests Step 3 selon docs/SPRINT_1_EXECUTION.md

Créer :
- tests/unit/services/products/HybridProductSelector.test.ts
- tests/unit/services/products/ProductMatcherV2.test.ts
- tests/e2e/step3-hybrid.spec.ts

Référence : Section "Agent 3 : Tests" dans docs/SPRINT_1_EXECUTION.md
```

---

## 📊 MATRICE DE COMPATIBILITÉ

### **Agents Parallélisables**

| Agent 1 | Agent 2 | Compatible ? | Raison |
|---------|---------|--------------|--------|
| Backend | Frontend | ✅ OUI | Fichiers différents |
| Backend | Database | ✅ OUI | Fichiers différents |
| Frontend | Tests | ❌ NON | Tests dépendent de Frontend |
| Backend | Tests | ❌ NON | Tests dépendent de Backend |
| Performance | Security | ✅ OUI | Fichiers différents |
| DevOps | Database | ✅ OUI | Fichiers différents |

### **Combinaisons Optimales**

#### **Combo 1 : Développement Feature**
```
Backend + Frontend (parallèle) → Tests (séquentiel)
Gain : -50% temps
```

#### **Combo 2 : Infrastructure**
```
Database + DevOps (parallèle)
Gain : -50% temps
```

#### **Combo 3 : Optimisation**
```
Performance + Security (parallèle)
Gain : -50% temps
```

---

## 🚨 GESTION DES CONFLITS

### **Conflit Git (Worktree)**

Si 2 agents modifient le même fichier :

```bash
# 1. Vérifier branches worktree
git branch

# 2. Identifier conflit
git status

# 3. Résoudre manuellement
# Ouvrir fichier en conflit
# Choisir version correcte
# Commit résolution

git add .
git commit -m "fix: resolve worktree conflict"
```

### **Prévention Conflits**

```
✅ BON : Planifier fichiers par agent AVANT de lancer
✅ BON : Vérifier dans docs/SPRINT_X_EXECUTION.md
✅ BON : 1 agent = 1 dossier/module distinct

❌ MAUVAIS : 2 agents sur même composant
❌ MAUVAIS : Lancer sans planification
```

---

## 📈 MÉTRIQUES D'ORCHESTRATION

### **Temps Économisé**

| Sprint | Mode Local | Mode Worktree | Gain |
|--------|------------|---------------|------|
| Sprint 1 | 5 jours | 2-3 jours | -50% |
| Sprint 2 | 3 jours | 1.5 jours | -50% |
| Sprint 3 | 5 jours | 3 jours | -40% |
| Sprint 4 | 7 jours | 4 jours | -43% |
| **Total** | **20 jours** | **11 jours** | **-45%** |

### **Efficacité par Combo**

| Combinaison | Efficacité | Recommandé |
|-------------|------------|------------|
| Backend + Frontend | 95% | ✅ OUI |
| Backend + Tests | 30% | ❌ NON (dépendance) |
| Frontend + Tests | 30% | ❌ NON (dépendance) |
| Database + DevOps | 90% | ✅ OUI |
| Performance + Security | 85% | ✅ OUI |

---

## 🎓 BEST PRACTICES

### **1. Planifier AVANT de Lancer**
```
✅ Lire docs/SPRINT_X_EXECUTION.md
✅ Identifier fichiers par agent
✅ Vérifier dépendances
✅ Lancer agents dans le bon ordre
```

### **2. Communiquer entre Agents**
```
✅ Backend termine → Notifier Frontend
✅ Frontend utilise types Backend
✅ Tests attendent Backend + Frontend
```

### **3. Valider Progressivement**
```
✅ Backend terminé → npm run type-check
✅ Frontend terminé → npm run lint
✅ Tests terminés → npm run test
✅ Tout terminé → npm run build
```

### **4. Documenter Changements**
```
✅ Chaque agent commit séparément
✅ Messages clairs : "feat(backend): add HybridProductSelector"
✅ Référencer sprint : "ref: SPRINT_1_EXECUTION.md"
```

---

## 🔄 WORKFLOW COMPLET

### **Avant de Commencer**
```bash
# 1. Lire sprint
cat docs/SPRINT_1_EXECUTION.md

# 2. Identifier agents nécessaires
# Backend + Frontend + Tests

# 3. Vérifier dépendances
# Tests dépendent de Backend + Frontend

# 4. Planifier ordre
# Phase 1 : Backend + Frontend (parallèle)
# Phase 2 : Tests (séquentiel)
```

### **Pendant Développement**
```bash
# 1. Activer Worktree
# Menu → Worktree

# 2. Lancer Agent Backend (Chat 1)
@agent backend [instructions]

# 3. Lancer Agent Frontend (Chat 2) IMMÉDIATEMENT
@agent frontend [instructions]

# 4. Surveiller progression
# Chat 1 : Backend en cours...
# Chat 2 : Frontend en cours...

# 5. Attendre fin des 2
# Backend : ✅ Terminé
# Frontend : ✅ Terminé
```

### **Après Agents**
```bash
# 1. Vérifier branches worktree
git branch

# 2. Tester intégration
npm run type-check
npm run lint

# 3. Si OK, lancer Tests
@agent tests [instructions]

# 4. Validation finale
npm run test
npm run test:e2e
npm run build

# 5. Merger branches (Cursor le fait souvent auto)
git merge worktree/agent-backend-1
git merge worktree/agent-frontend-2
git merge worktree/agent-tests-3
```

---

## 📞 TROUBLESHOOTING

### **Problème 1 : Agent Bloqué**
```bash
# Solution : Annuler et relancer
Cmd+C (Mac) ou Ctrl+C (Windows)
→ Relancer agent avec instructions plus claires
```

### **Problème 2 : Conflit Git**
```bash
# Solution : Résoudre manuellement
git status
# Ouvrir fichiers en conflit
# Résoudre
git add .
git commit -m "fix: resolve conflict"
```

### **Problème 3 : Agent Lent**
```bash
# Solution : Vérifier contexte
"Quels fichiers as-tu en contexte ?"
→ Si trop de fichiers, réduire contexte
```

### **Problème 4 : Types Manquants**
```bash
# Solution : Backend doit finir avant Frontend
# Attendre Backend terminé
# Puis lancer Frontend
```

---

## 🎯 CHECKLIST ORCHESTRATION

### **Avant Lancement**
- [ ] Sprint lu et compris
- [ ] Fichiers identifiés par agent
- [ ] Dépendances vérifiées
- [ ] Mode Worktree activé
- [ ] Chats ouverts (2-3)

### **Pendant Exécution**
- [ ] Agents lancés dans le bon ordre
- [ ] Progression surveillée
- [ ] Conflits détectés rapidement
- [ ] Validation intermédiaire (type-check)

### **Après Agents**
- [ ] Tous agents terminés
- [ ] Type-check passé
- [ ] Lint passé
- [ ] Tests passés
- [ ] Build OK
- [ ] Branches mergées

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Prochain review** : Fin Sprint 2

