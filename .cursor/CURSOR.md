# 🎯 CURSOR.md - Configuration Globale DermAI V2

**Version** : 1.0  
**Date** : 6 Novembre 2025  
**Projet** : DermAI V2 - Diagnostic Dermatologique IA

---

## 📚 STACK TECHNIQUE

### Frontend
- **Framework** : Next.js 15 (App Router)
- **React** : 19.x
- **TypeScript** : 5.3+
- **Styling** : Tailwind CSS 3.4 + shadcn/ui
- **Animations** : Framer Motion
- **Forms** : React Hook Form + Zod
- **State** : React Query (TanStack Query)

### Backend
- **Runtime** : Node.js 20+
- **API** : Next.js API Routes (App Router)
- **Database** : Supabase PostgreSQL
- **Storage** : Supabase Storage
- **Auth** : NextAuth.js (en cours)
- **Cache** : Redis Cloud (optionnel)

### IA & APIs
- **IA** : OpenAI GPT-4o Vision API
- **Affiliation** : Amazon Product Advertising API
- **Analytics** : Google Analytics 4

### DevOps
- **Hosting** : Vercel (frontend + serverless)
- **Database** : Supabase Cloud
- **CI/CD** : GitHub Actions
- **Monitoring** : Sentry + Vercel Analytics

---

## 📁 STRUCTURE DU PROJET

```
/dermai-v2
├── .cursor/                    # Configuration Cursor 2.0
│   ├── CURSOR.md              # Ce fichier (config globale)
│   ├── FRONTEND.md            # Patterns React/Next.js
│   ├── BACKEND.md             # Patterns API/Services
│   └── RULES.md               # Règles de code
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API Routes
│   │   ├── (routes)/         # Pages publiques
│   │   └── dashboard/        # Pages authentifiées
│   │
│   ├── components/           # Composants React
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── shared/          # Composants réutilisables
│   │   └── features/        # Composants métier
│   │
│   ├── services/            # Logique métier
│   │   ├── ai/             # Services IA (OpenAI)
│   │   ├── products/       # Matching produits
│   │   ├── storage/        # Supabase Storage
│   │   └── analytics/      # Tracking
│   │
│   ├── lib/                # Utilitaires & config
│   │   ├── supabase.ts    # Client Supabase
│   │   ├── openai.ts      # Client OpenAI
│   │   └── utils.ts       # Helpers
│   │
│   ├── types/              # Types TypeScript
│   ├── hooks/              # Custom React Hooks
│   ├── data/               # Données statiques (catalogue)
│   └── constants/          # Constantes
│
├── docs/                    # Documentation
│   ├── spec.md             # Spécifications complètes
│   ├── IMPLEMENTATION_PLAN.md  # Plan de développement
│   ├── ARCHITECTURE.md     # Architecture technique
│   └── architecture/       # Docs architecture détaillée
│
├── tests/                   # Tests
│   ├── unit/               # Tests unitaires
│   ├── integration/        # Tests d'intégration
│   └── e2e/                # Tests end-to-end
│
├── scripts/                 # Scripts utilitaires
├── public/                  # Assets statiques
└── supabase/               # Migrations Supabase
```

---

## 🎯 CONVENTIONS DE NOMMAGE

### Fichiers
- **Composants React** : PascalCase (`UserProfile.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useAnalysis.ts`)
- **Services** : camelCase avec suffixe `.service` (`analysis.service.ts`)
- **Types** : PascalCase avec suffixe `.types` (`analysis.types.ts`)
- **Utils** : camelCase (`formatDate.ts`)
- **Constants** : UPPER_SNAKE_CASE dans fichier camelCase (`skinTypes.ts`)

### Code
- **Variables** : camelCase (`userName`, `isLoading`)
- **Constantes** : UPPER_SNAKE_CASE (`MAX_PHOTOS`, `API_TIMEOUT`)
- **Types/Interfaces** : PascalCase (`UserProfile`, `AnalysisResult`)
- **Enums** : PascalCase pour le type, UPPER_SNAKE_CASE pour les valeurs
- **Fonctions** : camelCase (`getUserProfile`, `calculateScore`)
- **Composants** : PascalCase (`UserCard`, `AnalysisPanel`)

---

## 🔧 RÈGLES GÉNÉRALES

### TypeScript
- ✅ **Mode strict activé** (`strict: true`)
- ✅ **Pas de `any`** : Utiliser `unknown` ou types précis
- ✅ **Validation runtime** : Zod pour tous les inputs/outputs IA
- ✅ **Types exportés** : Depuis `/src/types`
- ✅ **Interfaces préférées** aux types pour objets

### React
- ✅ **Composants fonctionnels** uniquement (hooks)
- ✅ **Props typées** : Interface `ComponentNameProps`
- ✅ **Hooks customs** : Préfixe `use`, dans `/src/hooks`
- ✅ **Pas de prop drilling** : Context ou React Query
- ✅ **Memoization** : `useMemo`/`useCallback` si nécessaire

### Next.js
- ✅ **App Router** : Pas de Pages Router
- ✅ **Server Components** par défaut
- ✅ **'use client'** explicite si nécessaire
- ✅ **API Routes** : `/app/api/[route]/route.ts`
- ✅ **Metadata** : Fonction `generateMetadata` pour SEO

### Styling
- ✅ **Tailwind** : Classes utilitaires prioritaires
- ✅ **shadcn/ui** : Composants de base
- ✅ **CSS Modules** : Si logique complexe (rare)
- ✅ **Responsive** : Mobile-first (`sm:`, `md:`, `lg:`)
- ✅ **Dark mode** : Préparé mais pas prioritaire

---

## 📦 DÉPENDANCES CRITIQUES

### Production
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5.3.0",
  "@supabase/supabase-js": "^2.38.0",
  "openai": "^4.20.0",
  "zod": "^3.22.0",
  "react-hook-form": "^7.48.0",
  "@tanstack/react-query": "^5.8.0",
  "framer-motion": "^10.16.0",
  "tailwindcss": "^3.4.0"
}
```

### Dev
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.2.0",
  "eslint": "^8.54.0",
  "prettier": "^3.1.0",
  "jest": "^29.7.0",
  "@testing-library/react": "^14.1.0",
  "playwright": "^1.40.0"
}
```

---

## 🚀 COMMANDES ESSENTIELLES

### Développement
```bash
npm run dev              # Serveur dev (localhost:3000)
npm run build            # Build production
npm run start            # Serveur production
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

### Tests
```bash
npm run test             # Tests unitaires (Jest)
npm run test:watch       # Tests en mode watch
npm run test:e2e         # Tests E2E (Playwright)
npm run test:coverage    # Couverture de code
```

### Database
```bash
npx supabase link        # Lier projet Supabase
npx supabase db push     # Appliquer migrations
npx supabase db pull     # Récupérer schema
npx supabase gen types   # Générer types TypeScript
```

### Scripts Custom
```bash
npx tsx scripts/migrate-to-supabase.ts     # Migration catalogue
npx tsx scripts/enrich-products.ts         # Enrichissement IA
npx tsx scripts/test-amazon-api.ts         # Test API Amazon
```

---

## 🎨 DESIGN SYSTEM

### Palette de Couleurs
```css
/* Fond */
--background: #FFFFFF
--background-secondary: #FDF9F7

/* Texte */
--foreground: #1A1A1A
--foreground-secondary: #6E6E6E

/* Accent */
--accent-beauty: #EAD9D1
--accent-ai: #8F7BFF
--accent-glow: #5A4AE3

/* Status */
--success: #4ADE80
--error: #EF4444
--warning: #F59E0B
```

### Typographie
- **Titres** : Neue Haas Grotesk / Suisse Intl (fallback: Inter)
- **Corps** : Inter
- **Code/Data** : IBM Plex Mono

### Spacing
- Base : 4px (Tailwind default)
- Échelle : 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64

---

## 🔐 VARIABLES D'ENVIRONNEMENT

### Fichiers
- `.env.local` : Dev local (non commité)
- `.env.production` : Production Vercel (via dashboard)

### Variables Requises
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# NextAuth (à venir)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxx

# Amazon (Phase 4)
AMAZON_ACCESS_KEY_ID=xxx
AMAZON_SECRET_ACCESS_KEY=xxx
AMAZON_PARTNER_TAG=dermai-21

# Analytics (optionnel)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-xxx
SENTRY_DSN=https://xxx
```

---

## 📊 MÉTRIQUES DE QUALITÉ

### Performance
- ✅ Lighthouse Score > 90
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Bundle size < 500KB (initial)

### Code Quality
- ✅ TypeScript strict mode
- ✅ ESLint 0 errors
- ✅ Test coverage > 80% (services critiques)
- ✅ 0 console.log en production

### Accessibilité
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader compatible
- ✅ Color contrast > 4.5:1

---

## 🐛 DEBUGGING

### Logs
```typescript
// Development
console.log('[ComponentName]', data)

// Production (via service)
logger.info('Event', { metadata })
logger.error('Error', { error, context })
```

### Outils
- **React DevTools** : Inspection composants
- **Network Tab** : Requêtes API
- **Supabase Dashboard** : Queries SQL
- **Vercel Logs** : Logs serverless
- **Sentry** : Error tracking production

---

## 📚 DOCUMENTATION DE RÉFÉRENCE

### Interne
- `docs/spec.md` : Spécifications complètes (946 lignes)
- `docs/IMPLEMENTATION_PLAN.md` : Plan de développement
- `docs/ARCHITECTURE.md` : Architecture technique
- `docs/architecture/` : Documentation détaillée par phase

### Externe
- Next.js : https://nextjs.org/docs
- React : https://react.dev
- Supabase : https://supabase.com/docs
- OpenAI : https://platform.openai.com/docs
- shadcn/ui : https://ui.shadcn.com

---

## 🚨 RÈGLES CRITIQUES

### ❌ INTERDICTIONS
1. **Jamais de `any`** : Utiliser types stricts
2. **Pas de commit de secrets** : `.env.local` dans `.gitignore`
3. **Pas de code mort** : Supprimer code inutilisé
4. **Pas de duplication** : DRY (Don't Repeat Yourself)
5. **Pas de console.log en prod** : Utiliser logger

### ✅ OBLIGATIONS
1. **Types Zod** : Validation runtime pour tous inputs IA
2. **Error handling** : Try/catch + fallback gracieux
3. **Loading states** : Feedback utilisateur systématique
4. **Tests critiques** : Services IA + matching produits
5. **Documentation** : JSDoc pour fonctions complexes

---

## 🔄 WORKFLOW GIT

### Branches
- `main` : Production stable
- `develop` : Développement actif
- `feature/*` : Nouvelles features
- `fix/*` : Corrections bugs
- `refactor/*` : Refactoring

### Commits
Format : `type(scope): message`

Types : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

Exemples :
```
feat(step3): implement hybrid product selector
fix(ui): correct badge display in routine section
refactor(matcher): optimize scoring algorithm
docs(api): add Amazon API integration guide
```

---

## 📞 CONTACTS & SUPPORT

### Équipe
- **Product Owner** : Mak
- **Tech Lead** : Mak
- **IA Specialist** : Cursor Agents

### Ressources
- **Repo** : GitHub (privé)
- **Supabase** : Dashboard projet DermAI
- **Vercel** : Dashboard déploiement
- **Sentry** : Monitoring erreurs

---

**Dernière mise à jour** : 6 Novembre 2025  
**Version** : 1.0  
**Prochain review** : Fin Sprint 2

