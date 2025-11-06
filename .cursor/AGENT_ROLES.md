# 🎭 AGENT_ROLES.md - Rôles et Responsabilités Agents

**Version** : 1.0  
**Date** : 6 Novembre 2025  
**Objectif** : Définir clairement le rôle et les responsabilités de chaque agent

---

## 📋 TABLE DES MATIÈRES

1. [Agent Backend](#agent-backend)
2. [Agent Frontend](#agent-frontend)
3. [Agent Tests](#agent-tests)
4. [Agent Database](#agent-database)
5. [Agent Performance](#agent-performance)
6. [Agent Security](#agent-security)
7. [Agent DevOps](#agent-devops)

---

## 🔧 AGENT BACKEND

### **Identité**
- **Nom** : Backend Agent
- **Tag** : `@agent backend`
- **Contexte** : `.cursor/BACKEND.md`
- **Spécialité** : Services, API routes, logique métier

### **Responsabilités**

#### **Services IA**
- ✅ Créer/modifier services OpenAI (analysis, routine)
- ✅ Gérer prompts IA (step1-diagnostic, step2-routine)
- ✅ Implémenter retry logic avec backoff exponentiel
- ✅ Validation Zod des outputs IA
- ✅ Error handling OpenAI API

#### **Services Produits**
- ✅ Créer/modifier ProductMatcher, ProductMatcherV2
- ✅ Implémenter HybridProductSelector
- ✅ Gérer scoring (ingrédients, concerns, qualité)
- ✅ Loader database avec cache
- ✅ Algorithmes de matching

#### **API Routes**
- ✅ Créer/modifier routes Next.js (`/app/api`)
- ✅ Validation Zod des inputs
- ✅ Error handling global
- ✅ Rate limiting
- ✅ Middleware (auth, logging)

#### **Logique Métier**
- ✅ Calculs complexes (scores, budget, optimisation)
- ✅ Transformations de données
- ✅ Validation business rules
- ✅ Intégrations externes (Supabase, OpenAI)

### **Fichiers Typiques**
```
/src/services/
  ├── ai/
  │   ├── analysis.service.ts
  │   ├── routine.service.ts
  │   └── prompts/
  ├── products/
  │   ├── ProductMatcher.ts
  │   ├── ProductMatcherV2.ts
  │   ├── HybridProductSelector.ts
  │   └── scoring/
  ├── storage/
  └── analytics/

/src/app/api/
  ├── analyze/route.ts
  ├── products/route.ts
  └── analyses/route.ts

/src/lib/
  ├── supabase.ts
  ├── openai.ts
  └── errors.ts
```

### **Commandes**
```bash
# Lancer Agent Backend
@agent backend

Implémenter [SERVICE_NAME] selon docs/SPRINT_X_EXECUTION.md

Créer/Modifier :
- src/services/[path]/[file].ts

Référence : Section "[SECTION]" dans docs/SPRINT_X_EXECUTION.md
```

### **Validation**
```bash
# Type check
npm run type-check

# Tests unitaires services
npm run test src/services/

# Vérifier logs
# Logs structurés avec [ServiceName]
```

### **Interdictions**
- ❌ Ne PAS créer de composants React
- ❌ Ne PAS modifier de fichiers UI
- ❌ Ne PAS créer de tests (rôle Agent Tests)
- ❌ Ne PAS modifier de styles

---

## 🎨 AGENT FRONTEND

### **Identité**
- **Nom** : Frontend Agent
- **Tag** : `@agent frontend`
- **Contexte** : `.cursor/FRONTEND.md`
- **Spécialité** : Composants React, UI, pages

### **Responsabilités**

#### **Composants UI**
- ✅ Créer/modifier composants React
- ✅ Gérer props typées (interfaces)
- ✅ Hooks customs (useState, useEffect, useMemo)
- ✅ Styling Tailwind CSS
- ✅ Animations Framer Motion

#### **Pages Next.js**
- ✅ Créer/modifier pages App Router
- ✅ Server Components vs Client Components
- ✅ Loading states (loading.tsx)
- ✅ Error boundaries (error.tsx)
- ✅ Metadata SEO

#### **State Management**
- ✅ React Query (useQuery, useMutation)
- ✅ Context API (providers)
- ✅ Local state (useState)
- ✅ Form state (React Hook Form)

#### **Intégration API**
- ✅ Fetch API routes
- ✅ Error handling frontend
- ✅ Loading states
- ✅ Optimistic updates

### **Fichiers Typiques**
```
/src/components/
  ├── ui/                    # shadcn/ui primitives
  │   ├── button.tsx
  │   ├── card.tsx
  │   └── badge.tsx
  ├── shared/               # Composants réutilisables
  │   ├── LoadingSpinner.tsx
  │   └── ErrorBoundary.tsx
  └── features/             # Composants métier
      ├── analysis/
      ├── routine/
      └── dashboard/

/src/app/
  ├── (routes)/
  │   ├── page.tsx
  │   ├── loading.tsx
  │   └── error.tsx
  └── dashboard/
      ├── layout.tsx
      └── page.tsx

/src/hooks/
  ├── useAnalysis.ts
  └── useDebounce.ts
```

### **Commandes**
```bash
# Lancer Agent Frontend
@agent frontend

Créer composant [COMPONENT_NAME] selon docs/SPRINT_X_EXECUTION.md

Créer/Modifier :
- src/components/features/[path]/[Component].tsx

Référence : Section "[SECTION]" dans docs/SPRINT_X_EXECUTION.md
```

### **Validation**
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Vérifier visuel
npm run dev
# → Ouvrir localhost:3000
```

### **Interdictions**
- ❌ Ne PAS créer de services backend
- ❌ Ne PAS modifier d'API routes
- ❌ Ne PAS créer de tests (rôle Agent Tests)
- ❌ Ne PAS modifier de logique métier complexe

---

## ✅ AGENT TESTS

### **Identité**
- **Nom** : Tests Agent
- **Tag** : `@agent tests`
- **Contexte** : `.cursor/RULES.md`
- **Spécialité** : Tests unitaires, E2E, validation

### **Responsabilités**

#### **Tests Unitaires**
- ✅ Créer tests services (Jest)
- ✅ Créer tests composants (React Testing Library)
- ✅ Mocks et stubs
- ✅ Coverage > 80%
- ✅ Tests isolés et rapides

#### **Tests E2E**
- ✅ Créer tests Playwright
- ✅ Scénarios utilisateur complets
- ✅ Tests multi-navigateurs
- ✅ Screenshots et vidéos
- ✅ Tests de régression

#### **Validation**
- ✅ Vérifier DoD (Definition of Done)
- ✅ Tester cas limites
- ✅ Tester erreurs
- ✅ Tester performance
- ✅ Rapports de tests

### **Fichiers Typiques**
```
/tests/
  ├── unit/
  │   ├── services/
  │   │   ├── products/
  │   │   │   ├── ProductMatcher.test.ts
  │   │   │   └── HybridProductSelector.test.ts
  │   │   └── ai/
  │   │       └── analysis.service.test.ts
  │   └── components/
  │       └── ProductCard.test.tsx
  │
  └── e2e/
      ├── step3-hybrid.spec.ts
      ├── auth-flow.spec.ts
      └── dashboard.spec.ts
```

### **Commandes**
```bash
# Lancer Agent Tests
@agent tests

Créer tests pour [MODULE] selon docs/SPRINT_X_EXECUTION.md

Créer :
- tests/unit/[path]/[Module].test.ts
- tests/e2e/[scenario].spec.ts

Référence : Section "Agent Tests" dans docs/SPRINT_X_EXECUTION.md
```

### **Validation**
```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
# → Vérifier > 80%
```

### **Interdictions**
- ❌ Ne PAS créer de code production
- ❌ Ne PAS modifier de services/composants
- ❌ Ne PAS skip de tests
- ❌ Ne PAS commit tests qui échouent

---

## 💾 AGENT DATABASE

### **Identité**
- **Nom** : Database Agent
- **Tag** : `@agent database`
- **Contexte** : `.cursor/BACKEND.md`
- **Spécialité** : Migrations Supabase, schema SQL

### **Responsabilités**

#### **Migrations**
- ✅ Créer migrations Supabase
- ✅ Modifier schema PostgreSQL
- ✅ Créer tables, index, triggers
- ✅ RLS (Row Level Security)
- ✅ Rollback migrations

#### **Optimisation**
- ✅ Créer index optimisés
- ✅ Optimiser queries
- ✅ Analyser performance
- ✅ Monitoring database
- ✅ Sizing et scaling

#### **Types**
- ✅ Générer types TypeScript depuis schema
- ✅ Synchroniser types avec code
- ✅ Validation types Zod

### **Fichiers Typiques**
```
/supabase/
  ├── migrations/
  │   ├── 20251106_create_products.sql
  │   ├── 20251107_add_analyses.sql
  │   └── 20251108_add_indexes.sql
  └── config.toml

/src/types/
  └── supabase.types.ts
```

### **Commandes**
```bash
# Lancer Agent Database
@agent database

Créer migration [MIGRATION_NAME] selon docs/SPRINT_X_EXECUTION.md

Créer :
- supabase/migrations/[timestamp]_[name].sql

Référence : Section "Database" dans docs/SPRINT_X_EXECUTION.md
```

### **Validation**
```bash
# Appliquer migration
npx supabase db push

# Vérifier schema
npx supabase db pull

# Générer types
npx supabase gen types typescript --local > src/types/supabase.types.ts
```

### **Interdictions**
- ❌ Ne PAS modifier de code application
- ❌ Ne PAS créer de composants
- ❌ Ne PAS supprimer de données production
- ❌ Ne PAS skip de migrations

---

## ⚡ AGENT PERFORMANCE

### **Identité**
- **Nom** : Performance Agent
- **Tag** : `@agent performance`
- **Contexte** : `.cursor/RULES.md`
- **Spécialité** : Optimisations, cache, bundle

### **Responsabilités**

#### **Optimisations Frontend**
- ✅ Code splitting (dynamic imports)
- ✅ Lazy loading images
- ✅ Memoization (useMemo, useCallback)
- ✅ Bundle size optimization
- ✅ Tree shaking

#### **Optimisations Backend**
- ✅ Cache Redis
- ✅ Query optimization
- ✅ Compression responses
- ✅ CDN configuration
- ✅ Edge functions

#### **Monitoring**
- ✅ Lighthouse scores
- ✅ Core Web Vitals
- ✅ Performance budgets
- ✅ Profiling
- ✅ Alerting

### **Fichiers Typiques**
```
/src/lib/cache/
  └── redis.ts

/next.config.js
/vercel.json

/.lighthouserc.json
/performance-budget.json
```

### **Commandes**
```bash
# Lancer Agent Performance
@agent performance

Optimiser [MODULE] selon métriques Lighthouse

Tâches :
- Réduire bundle size
- Ajouter lazy loading
- Optimiser images

Cible : Lighthouse > 90
```

### **Validation**
```bash
# Lighthouse
npm run lighthouse

# Bundle analyzer
npm run analyze

# Performance test
npm run test:performance
```

### **Interdictions**
- ❌ Ne PAS casser de fonctionnalités
- ❌ Ne PAS optimiser prématurément
- ❌ Ne PAS ignorer accessibilité
- ❌ Ne PAS sacrifier lisibilité pour performance

---

## 🔒 AGENT SECURITY

### **Identité**
- **Nom** : Security Agent
- **Tag** : `@agent security`
- **Contexte** : `.cursor/RULES.md`
- **Spécialité** : Audit sécurité, validation

### **Responsabilités**

#### **Validation**
- ✅ Validation Zod stricte
- ✅ Sanitization inputs
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ SQL injection prevention

#### **Authentification**
- ✅ NextAuth.js configuration
- ✅ JWT sécurisés
- ✅ OAuth flows
- ✅ Session management
- ✅ Password hashing

#### **Audit**
- ✅ Security headers
- ✅ Dependencies audit
- ✅ Secrets scanning
- ✅ Penetration testing
- ✅ Compliance (RGPD)

### **Fichiers Typiques**
```
/src/lib/security/
  ├── sanitize.ts
  ├── validation.ts
  └── headers.ts

/middleware.ts

/.env.example
/security-audit.md
```

### **Commandes**
```bash
# Lancer Agent Security
@agent security

Audit sécurité [MODULE] selon OWASP Top 10

Tâches :
- Vérifier validation inputs
- Ajouter sanitization
- Configurer headers sécurité

Référence : OWASP guidelines
```

### **Validation**
```bash
# Audit dependencies
npm audit

# Security scan
npm run security:scan

# Check secrets
git secrets --scan
```

### **Interdictions**
- ❌ Ne PAS commit de secrets
- ❌ Ne PAS désactiver validation
- ❌ Ne PAS ignorer warnings sécurité
- ❌ Ne PAS utiliser dépendances vulnérables

---

## 🚀 AGENT DEVOPS

### **Identité**
- **Nom** : DevOps Agent
- **Tag** : `@agent devops`
- **Contexte** : `.cursor/CURSOR.md`
- **Spécialité** : CI/CD, déploiement

### **Responsabilités**

#### **CI/CD**
- ✅ Créer pipelines GitHub Actions
- ✅ Automatiser tests
- ✅ Automatiser déploiements
- ✅ Quality gates
- ✅ Rollback automatique

#### **Infrastructure**
- ✅ Configuration Vercel
- ✅ Configuration Supabase
- ✅ Environment variables
- ✅ Monitoring setup
- ✅ Alerting

#### **Déploiement**
- ✅ Staging deployment
- ✅ Production deployment
- ✅ Blue-green deployment
- ✅ Canary releases
- ✅ Rollback procedures

### **Fichiers Typiques**
```
/.github/
  └── workflows/
      ├── ci.yml
      ├── deploy-staging.yml
      └── deploy-production.yml

/vercel.json
/Dockerfile (si nécessaire)
/deployment-guide.md
```

### **Commandes**
```bash
# Lancer Agent DevOps
@agent devops

Créer pipeline CI/CD selon docs/SPRINT_X_EXECUTION.md

Créer :
- .github/workflows/ci.yml

Tâches :
- Tests automatiques
- Déploiement staging
- Quality gates

Référence : Section "DevOps" dans docs
```

### **Validation**
```bash
# Tester pipeline localement
act -j test

# Vérifier deployment
vercel --prod --dry-run

# Check monitoring
# → Vérifier Sentry, Vercel Analytics
```

### **Interdictions**
- ❌ Ne PAS déployer sans tests
- ❌ Ne PAS force push sur main
- ❌ Ne PAS skip quality gates
- ❌ Ne PAS déployer secrets

---

## 📊 MATRICE RESPONSABILITÉS

| Tâche | Backend | Frontend | Tests | Database | Performance | Security | DevOps |
|-------|---------|----------|-------|----------|-------------|----------|--------|
| **Services IA** | ✅ | ❌ | ✅ Test | ❌ | ⚠️ Optim | ⚠️ Valid | ❌ |
| **Composants React** | ❌ | ✅ | ✅ Test | ❌ | ⚠️ Optim | ❌ | ❌ |
| **API Routes** | ✅ | ❌ | ✅ Test | ❌ | ⚠️ Optim | ⚠️ Valid | ❌ |
| **Migrations SQL** | ❌ | ❌ | ✅ Test | ✅ | ⚠️ Index | ❌ | ❌ |
| **Tests E2E** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ⚠️ CI |
| **Cache Redis** | ✅ | ❌ | ✅ Test | ❌ | ✅ | ❌ | ❌ |
| **Security Headers** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ Config |
| **CI/CD Pipeline** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Légende** :
- ✅ Responsabilité principale
- ⚠️ Responsabilité secondaire
- ❌ Pas de responsabilité

---

## 🎯 CHECKLIST PAR AGENT

### **Agent Backend**
- [ ] Services créés/modifiés
- [ ] API routes créées/modifiées
- [ ] Validation Zod ajoutée
- [ ] Error handling implémenté
- [ ] Logs structurés ajoutés
- [ ] Type-check passé
- [ ] Tests unitaires écrits (par Agent Tests)

### **Agent Frontend**
- [ ] Composants créés/modifiés
- [ ] Props typées
- [ ] Hooks customs créés
- [ ] Styling Tailwind ajouté
- [ ] Loading states implémentés
- [ ] Error boundaries ajoutés
- [ ] Type-check passé
- [ ] Lint passé
- [ ] Tests composants écrits (par Agent Tests)

### **Agent Tests**
- [ ] Tests unitaires créés (10+ par module)
- [ ] Tests E2E créés (scénarios complets)
- [ ] Coverage > 80%
- [ ] Tous tests passent
- [ ] Cas limites testés
- [ ] Erreurs testées

### **Agent Database**
- [ ] Migration créée
- [ ] Schema validé
- [ ] Index optimisés
- [ ] RLS configuré
- [ ] Types générés
- [ ] Migration appliquée
- [ ] Tests migration (par Agent Tests)

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Prochain review** : Fin Sprint 2

