# 🏗️ ARCHITECTURE TECHNIQUE DERMAI V2

**Version** : 1.0  
**Date** : 6 Novembre 2025  
**Statut** : Production-Ready (75% complété)

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Globale](#architecture-globale)
3. [Stack Technique](#stack-technique)
4. [Architecture IA](#architecture-ia)
5. [Architecture Données](#architecture-données)
6. [Architecture Frontend](#architecture-frontend)
7. [Architecture Backend](#architecture-backend)
8. [Sécurité](#sécurité)
9. [Performance](#performance)
10. [Déploiement](#déploiement)

---

## 🎯 VUE D'ENSEMBLE

DermAI V2 est une application web de diagnostic dermatologique basée sur l'IA qui analyse des photos de visage pour fournir :
- Un diagnostic personnalisé (8 scores de santé de peau)
- Une routine de soins en 3 phases (Immédiate, Adaptation, Maintenance)
- Des recommandations de produits (2000+ catalogue)
- Un suivi d'évolution dans le temps

**Principes Architecturaux** :
- ✅ **Serverless-First** : Next.js API Routes + Vercel
- ✅ **Type-Safe** : TypeScript strict + Zod validation
- ✅ **AI-Driven** : GPT-4o Vision pour diagnostic
- ✅ **Hybrid Matching** : IA + Algorithme pour sélection produits
- ✅ **Cloud-Native** : Supabase PostgreSQL + Storage

---

## 🏗️ ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                              │
│                    (Browser - React 19)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 APP ROUTER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Pages      │  │  Components  │  │  API Routes  │         │
│  │  (Routes)    │  │   (React)    │  │ (Serverless) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   OPENAI     │  │   SUPABASE   │  │   AMAZON     │
│  GPT-4o      │  │  PostgreSQL  │  │  Product API │
│  Vision API  │  │  + Storage   │  │  (Phase 4)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Flux de Données Principal

```
1. UPLOAD PHOTOS
   User → Next.js → Compression → Supabase Storage

2. QUESTIONNAIRE
   User → React Hook Form → Validation Zod → State

3. ANALYSE IA (4 ÉTAPES)
   ┌─────────────────────────────────────────────────────┐
   │ STEP 1 : Diagnostic Visuel (GPT-4o Vision)         │
   │   Input  : Photos + Profil                          │
   │   Output : SkinType, Concerns, Scores (8)           │
   ├─────────────────────────────────────────────────────┤
   │ STEP 2 : Routine Personnalisée (GPT-4o)            │
   │   Input  : Diagnostic + Profil                      │
   │   Output : 3 Phases × Slots (Matin/Soir/Hebdo)     │
   ├─────────────────────────────────────────────────────┤
   │ STEP 3 : Sélection Produits (HYBRIDE IA+ALGO)      │
   │   Micro-IA  : Mapping conceptuel (500 tokens)      │
   │   Database  : Catalogue 2000+ produits             │
   │   Algo      : Scoring multi-critères (TypeScript)  │
   │   Output    : 1 produit + 3 alternatives par step  │
   ├─────────────────────────────────────────────────────┤
   │ STEP 4 : Assemblage & Validation (Algorithmique)   │
   │   Input  : Routine + Produits                      │
   │   Output : Résultat final cohérent                 │
   └─────────────────────────────────────────────────────┘

4. AFFICHAGE RÉSULTATS
   API → React Query → ResultsPage → Composants UI
```

---

## 🛠️ STACK TECHNIQUE

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Next.js** | 15.0 | Framework React avec App Router |
| **React** | 19.0 | Library UI |
| **TypeScript** | 5.3+ | Type safety |
| **Tailwind CSS** | 3.4 | Styling utilitaire |
| **shadcn/ui** | Latest | Composants UI |
| **Framer Motion** | 10.16 | Animations |
| **React Hook Form** | 7.48 | Gestion formulaires |
| **Zod** | 3.22 | Validation schémas |
| **React Query** | 5.8 | State management serveur |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Node.js** | 20+ | Runtime |
| **Next.js API Routes** | 15.0 | API serverless |
| **Supabase** | 2.38 | PostgreSQL + Storage + Auth |
| **OpenAI SDK** | 4.20 | Client GPT-4o |
| **Zod** | 3.22 | Validation runtime |

### Infrastructure
| Service | Usage |
|---------|-------|
| **Vercel** | Hosting frontend + API Routes |
| **Supabase Cloud** | Database + Storage + Auth |
| **Redis Cloud** | Cache (optionnel) |
| **Sentry** | Error tracking |
| **Google Analytics 4** | Analytics |

---

## 🤖 ARCHITECTURE IA

### Pipeline 4 Étapes

#### **STEP 1 : Diagnostic Visuel**

```typescript
// services/ai/analysis.service.ts
interface Step1Input {
  photos: string[]      // Base64 ou URLs
  profile: {
    age: number
    skinType?: string
  }
}

interface Step1Output {
  skinType: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal'
  concerns: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    description: string
    zones: string[]
  }>
  scores: {
    hydration: number      // 0-100
    texture: number
    wrinkles: number
    pigmentation: number
    redness: number
    pores: number
    acne: number
    overall: number
  }
  recommendations: string[]
}
```

**Configuration OpenAI** :
- Model : `gpt-4o`
- Temperature : `0.0` (déterminisme)
- Max tokens : `2000`
- Response format : `json_object`
- Timeout : `30s`

**Validation** : Schéma Zod strict

---

#### **STEP 2 : Routine Personnalisée**

```typescript
// services/ai/routine.service.ts
interface Step2Input {
  diagnostic: Step1Output
  profile: {
    age: number
    skinType: string
    concerns: string[]
    budget: number
    routineComplexity: 'simple' | 'moderate' | 'complete'
  }
}

interface Step2Output {
  phases: Array<{
    name: 'immediate' | 'adaptation' | 'maintenance'
    duration: string
    objective: string
    slots: {
      morning: RoutineStep[]
      evening: RoutineStep[]
      weekly: RoutineStep[]
    }
  }>
}

interface RoutineStep {
  stepNumber: number
  careType: string
  targetProblem: string
  timing: 'morning' | 'evening' | 'both'
  targetZones: string[]
  isTemporary: boolean
  metadata?: {
    introductionWeek?: number
    duration?: string
    frequency?: string
  }
}
```

**Configuration OpenAI** :
- Model : `gpt-4o`
- Temperature : `0.0`
- Max tokens : `3000`
- Response format : `json_object`

---

#### **STEP 3 : Sélection Produits (HYBRIDE)**

**Architecture Hybride IA + Algorithme** :

```
┌─────────────────────────────────────────────────────────┐
│                   STEP 3 HYBRIDE                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. MICRO-IA (GPT-4o-mini)                             │
│     Input  : RoutineStep                                │
│     Output : Mapping conceptuel (careType, concerns)    │
│     Coût   : ~500 tokens (vs 4000+ avant)              │
│     Durée  : ~2s                                        │
│                                                          │
│  2. DATABASE LOADER                                     │
│     Source : Supabase PostgreSQL                        │
│     Cache  : 1h par careType                            │
│     Query  : Filtrage careType + status=active          │
│                                                          │
│  3. ALGORITHME SCORING (TypeScript)                     │
│     Formule : 5 critères pondérés                       │
│     - 35% Compatibilité ingrédients × skinType          │
│     - 30% Alignement problématique                      │
│     - 20% Qualité dermatologique                        │
│     - 10% Prix                                          │
│     - 5% Popularité                                     │
│     Durée  : <100ms par produit                         │
│                                                          │
│  4. SÉLECTION                                           │
│     Output : 1 produit principal + 3 alternatives       │
│     Garantie : 100% complétude, 0 fallback générique    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Avantages** :
- ✅ **Fiabilité 100%** : Algorithme déterministe
- ✅ **Performance** : <5s total (vs 15-20s avant)
- ✅ **Coût** : -88% tokens ($0.10 vs $0.80)
- ✅ **Complétude** : 0% "produit non spécifié"

---

#### **STEP 4 : Assemblage & Validation**

```typescript
// services/ai/assembly.service.ts
interface Step4Input {
  routine: Step2Output
  products: Map<number, ProductMatch>  // stepNumber → produit
}

interface Step4Output {
  phases: Array<{
    name: string
    duration: string
    objective: string
    slots: {
      morning: Array<{
        step: RoutineStep
        product: EnrichedProduct
        alternatives: EnrichedProduct[]
        score: number
        reasoning: string
      }>
      evening: Array<...>
      weekly: Array<...>
    }
  }>
  totalPrice: number
  estimatedDuration: string
  warnings: string[]
}
```

**Validations** :
- ✅ Cohérence budget (totalPrice ≤ maxBudget)
- ✅ Cohérence zones (pas de produit sur zone restreinte)
- ✅ Cohérence timing (SPF seulement matin)
- ✅ Cohérence interactions (pas d'actifs incompatibles)

---

## 💾 ARCHITECTURE DONNÉES

### Schéma Supabase

#### **Table `products`**

```sql
CREATE TABLE products (
  -- Identité
  catalog_id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  
  -- Métadonnées dermatologiques
  care_type VARCHAR(50) NOT NULL,
  target_skin_types TEXT[] NOT NULL DEFAULT '{}',
  target_concerns TEXT[] NOT NULL DEFAULT '{}',
  active_ingredients TEXT[] NOT NULL DEFAULT '{}',
  allergens TEXT[] NOT NULL DEFAULT '{}',
  ingredients TEXT[] DEFAULT '{}',
  
  -- Zones & Sécurité
  target_zones TEXT[] NOT NULL DEFAULT '{visage entier}',
  restricted_zones TEXT[] NOT NULL DEFAULT '{}',
  suitable_sensitive_areas BOOLEAN DEFAULT false,
  warnings TEXT,
  
  -- Métadonnées sécurité
  comedogenic BOOLEAN DEFAULT false,
  irritant BOOLEAN DEFAULT false,
  photosensitizing BOOLEAN DEFAULT false,
  pregnancy_safe BOOLEAN DEFAULT true,
  
  -- Scoring
  price DECIMAL(10, 2) NOT NULL,
  popularity INTEGER DEFAULT 50,
  dermatologist_rating INTEGER DEFAULT 70,
  
  -- Timing & Retail
  application_timing VARCHAR(20) NOT NULL,
  image_url TEXT,
  retailers JSONB DEFAULT '[]',
  
  -- Gestion
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Analytics
  selection_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0.0,
  
  -- Extensions
  metadata JSONB DEFAULT '{}'
);

-- Index optimisés
CREATE INDEX idx_products_care_type ON products(care_type);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_care_type_status ON products(care_type, status);
CREATE INDEX idx_products_target_skin_types ON products USING GIN(target_skin_types);
CREATE INDEX idx_products_target_concerns ON products USING GIN(target_concerns);
CREATE INDEX idx_products_restricted_zones ON products USING GIN(restricted_zones);
CREATE INDEX idx_products_ingredients ON products USING GIN(ingredients);
```

#### **Table `analyses`** (à venir Sprint 3)

```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Input
  photos JSONB NOT NULL,  -- URLs Supabase Storage
  profile JSONB NOT NULL,
  
  -- Output Step 1
  diagnostic JSONB NOT NULL,
  
  -- Output Step 2
  routine JSONB NOT NULL,
  
  -- Output Step 3-4
  products JSONB NOT NULL,
  
  -- Métadonnées
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
```

---

## 🎨 ARCHITECTURE FRONTEND

### Structure Composants

```
/src/components
├── ui/                    # Primitives shadcn/ui
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── ...
│
├── shared/               # Composants réutilisables
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   ├── ImageUploader.tsx
│   └── ProgressBar.tsx
│
├── features/             # Composants métier
│   ├── analysis/
│   │   ├── AnalysisCard.tsx
│   │   ├── ScoreDisplay.tsx
│   │   └── DiagnosticPanel.tsx
│   │
│   ├── routine/
│   │   ├── RoutinePhaseCard.tsx
│   │   ├── ProductCard.tsx
│   │   ├── AlternativesModal.tsx
│   │   └── SlotTimeline.tsx
│   │
│   ├── questionnaire/
│   │   ├── QuestionStep.tsx
│   │   ├── FullScreenIntro.tsx
│   │   └── SocialProof.tsx
│   │
│   └── dashboard/
│       ├── HistoryCard.tsx
│       ├── RoutineTracker.tsx
│       └── StatsWidget.tsx
│
└── layouts/
    ├── DashboardLayout.tsx
    └── AuthLayout.tsx
```

### State Management

**React Query** : Données serveur (analyses, produits)
```typescript
// hooks/useAnalysis.ts
export function useAnalysis(id: string) {
  return useQuery({
    queryKey: ['analysis', id],
    queryFn: () => fetch(`/api/analyses/${id}`).then(res => res.json())
  })
}
```

**Context API** : État global léger (photos, questionnaire)
```typescript
// contexts/AnalysisContext.tsx
export const AnalysisProvider = ({ children }) => {
  const [photos, setPhotos] = useState<File[]>([])
  // ...
}
```

---

## ⚙️ ARCHITECTURE BACKEND

### API Routes Structure

```
/src/app/api
├── analyze/
│   └── route.ts          # POST /api/analyze (4 étapes IA)
│
├── analyses/
│   ├── route.ts          # GET /api/analyses (liste)
│   └── [id]/
│       └── route.ts      # GET /api/analyses/:id
│
├── products/
│   ├── route.ts          # GET /api/products
│   └── [id]/
│       └── route.ts      # GET /api/products/:id
│
├── auth/
│   └── [...nextauth]/
│       └── route.ts      # NextAuth.js routes
│
└── affiliate/
    └── route.ts          # POST /api/affiliate/track
```

### Services Layer

```
/src/services
├── ai/
│   ├── analysis.service.ts       # Step 1 : Diagnostic
│   ├── routine.service.ts        # Step 2 : Routine
│   └── prompts/
│       ├── step1-diagnostic.ts
│       └── step2-routine.ts
│
├── products/
│   ├── ProductMatcher.ts         # Matching V1 (actuel)
│   ├── ProductMatcherV2.ts       # Matching V2 (scoring ingrédients)
│   ├── ProductDatabaseLoader.ts  # Loader catalogue
│   ├── HybridProductSelector.ts  # Sélecteur hybride IA+Algo
│   └── scoring/
│       ├── ingredientScoring.ts
│       └── concernScoring.ts
│
├── storage/
│   ├── cloudStorage.service.ts   # Supabase Storage
│   └── migration.service.ts      # Migration local → cloud
│
└── analytics/
    ├── tracking.service.ts       # GA4 + événements
    └── conversion.service.ts     # Tracking affiliation
```

---

## 🔒 SÉCURITÉ

### Authentification (Sprint 3)

- **NextAuth.js** : Email/password + OAuth Google
- **Session** : JWT sécurisé
- **Protection routes** : Middleware Next.js
- **RLS Supabase** : Row Level Security

### Validation

- **Runtime** : Zod pour tous inputs externes
- **TypeScript** : Strict mode activé
- **Sanitization** : DOMPurify pour HTML user-generated

### Headers Sécurité

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return response
}
```

---

## ⚡ PERFORMANCE

### Optimisations

1. **Code Splitting** : Dynamic imports pour modals/composants lourds
2. **Image Optimization** : Next.js Image avec lazy loading
3. **Cache** :
   - Produits : Cache 1h par careType
   - Analyses : React Query staleTime 5min
   - Assets : CDN Vercel
4. **Bundle Size** : <500KB initial
5. **SSR** : Server Components par défaut

### Métriques Cibles

| Métrique | Cible | Actuel |
|----------|-------|--------|
| **Lighthouse Performance** | >90 | 85 |
| **First Contentful Paint** | <1.5s | 1.8s |
| **Time to Interactive** | <3s | 3.5s |
| **Bundle Size** | <500KB | 450KB |

---

## 🚀 DÉPLOIEMENT

### Environnements

- **Development** : `localhost:3000`
- **Staging** : `staging.dermai.vercel.app`
- **Production** : `dermai.com` (à venir)

### Pipeline CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Monitoring

- **Vercel Analytics** : Performance temps réel
- **Sentry** : Error tracking
- **Google Analytics 4** : Comportement utilisateur
- **Supabase Dashboard** : Database monitoring

---

## 📚 RÉFÉRENCES

### Documentation Interne
- `docs/spec.md` - Spécifications complètes
- `docs/IMPLEMENTATION_PLAN.md` - Plan de développement
- `.cursor/` - Configuration Cursor 2.0

### Documentation Externe
- [Next.js 15](https://nextjs.org/docs)
- [React 19](https://react.dev)
- [Supabase](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Prochain review** : Fin Sprint 2

