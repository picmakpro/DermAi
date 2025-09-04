# 📋 DETAILED PLANNING – DermAI V2
## Free Web App Version with Registration

> **Objective:** Complete DermAI V2 as a full web version with authentication, user dashboard, and affiliate monetization

---

## 🎯 **CURRENT PROJECT STATUS**

### ✅ **Implemented Features**
- Next.js 15 + TypeScript + Tailwind CSS architecture
- Photo upload interface with drag & drop
- Interactive 7-step questionnaire with 3 full-screen displays
- GPT-4o Vision integration for dermatological analysis
- Results page with detailed scores (8 parameters)
- Viral sharing system with image export (html2canvas)
- Local storage: IndexedDB (photos) + SessionStorage (metadata)
- Basic affiliate catalog (static JSON)
- Partial analytics (Google Analytics events)
- Complete DermAI brand/visual guidelines

### ⚠️ **Installed But Not Configured Dependencies**
- `next-auth`: ^4.24.11 (authentication)
- `@supabase/supabase-js`: ^2.55.0 (database)
- `lz-string`: ^1.5.0 (compression for sharing)
- `html2canvas`: ^1.4.1 (image export)

### ❌ **Critical Missing Features**
- User authentication and session management
- User dashboard with analysis history
- Cloud backup of diagnostics and photos
- Skin evolution tracking system
- Affiliate monetization with real APIs
- Complete analytics and conversion tracking
- Automated testing and monitoring

---

## 🏗️ **TARGET TECHNICAL ARCHITECTURE**

### **Final Technology Stack**
```typescript
// Frontend
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + Framer Motion (animations)
- React Hook Form + Zod (forms/validation)

// Authentication & Database
- NextAuth.js (multi-provider authentication)
- Supabase (PostgreSQL + Storage + RLS)

// AI & APIs
- OpenAI GPT-4o Vision (dermatological analysis)
- Affiliate APIs (Sephora, Amazon, Douglas)

// Analytics & Monitoring
- Google Analytics 4 + Enhanced Ecommerce
- Sentry (error tracking)
- Vercel Analytics (performance)

// Deployment
- Vercel (hosting)
- Redis Cloud (cache)
- Global CDN (assets)
```

### **Supabase Database Structure**
```sql
-- Users table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyses table
CREATE TABLE user_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  photos_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shared_publicly BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE
);

-- Evolution table
CREATE TABLE skin_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES user_analyses(id) ON DELETE CASCADE,
  comparison_data JSONB,
  progress_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate tracking table
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  analysis_id UUID REFERENCES user_analyses(id),
  product_id TEXT NOT NULL,
  affiliate_partner TEXT NOT NULL,
  click_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversion_confirmed BOOLEAN DEFAULT FALSE,
  commission_amount DECIMAL(10,2)
);
```

---

## 📅 **DETAILED PHASED PLAN**

## **PHASE 1: AUTHENTICATION & CLOUD STORAGE**
### *Duration: 1–2 weeks*

### **Sprint 1.1: Supabase Setup (2–3 days)**
- [ ] **Day 1:** Supabase project setup + environment variables
  - Create Supabase project
  - Configure `.env.local` with API keys
  - Test database connection
- [ ] **Day 2:** Create tables and RLS policies
  - Run SQL scripts to create tables
  - Configure Row Level Security (RLS)
  - Test access permissions
- [ ] **Day 3:** Supabase Storage configuration
  - Create buckets for user photos
  - Configure secure upload policies
  - Test image upload/download

### **Sprint 1.2: NextAuth.js Implementation (2–3 days)**
- [ ] **Day 1:** Basic NextAuth.js configuration
  ```typescript
  // Files to create/modify:
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/auth.ts (configuration)
  - src/middleware.ts (route protection)
  ```
- [ ] **Day 2:** Authentication providers
  - Email/Password with Supabase
  - Google OAuth
  - Apple OAuth (optional)
- [ ] **Day 3:** Authentication pages
  ```typescript
  // Pages to create:
  - src/app/auth/signin/page.tsx
  - src/app/auth/signup/page.tsx
  - src/app/auth/error/page.tsx
  ```

### **Sprint 1.3: Storage Migration (1–2 days)**
- [ ] **Migration service:** `src/services/storage/migration.ts`
  - Migrate from IndexedDB to Supabase Storage
  - Keep local fallback for offline mode
  - Smart image compression
- [ ] **Update hooks:** Modify `useAnalysis` for cloud persistence

---

## **PHASE 2: USER DASHBOARD**
### *Duration: 2–3 weeks*

### **Sprint 2.1: Dashboard Architecture (2–3 days)**
- [ ] **Route structure:**
  ```typescript
  src/app/dashboard/
  ├── layout.tsx (sidebar + navigation)
  ├── page.tsx (overview)
  ├── analyses/
  │   ├── page.tsx (paginated list)
  │   └── [id]/page.tsx (detail)
  ├── progress/
  │   └── page.tsx (evolution)
  └── settings/
      └── page.tsx (preferences)
  ```
- [ ] **Base components:**
  ```typescript
  - src/components/dashboard/Sidebar.tsx
  - src/components/dashboard/DashboardStats.tsx
  - src/components/dashboard/AnalysisCard.tsx
  - src/components/dashboard/QuickActions.tsx
  ```

### **Sprint 2.2: Analysis History (3–4 days)**
- [ ] **API Routes for CRUD:**
  ```typescript
  - src/app/api/analyses/route.ts (GET, POST)
  - src/app/api/analyses/[id]/route.ts (GET, PUT, DELETE)
  - src/app/api/analyses/[id]/share/route.ts (secure sharing)
  ```
- [ ] **User interface:**
  - List with pagination and filters
  - Text search across analyses
  - Bulk actions (delete, export)
  - Rich detail with comparisons

### **Sprint 2.3: Progress Tracking (3–4 days)**
- [ ] **Comparison algorithm:**
  ```typescript
  // File: src/services/analysis/comparison.service.ts
  - Compare scores across analyses
  - Compute improvement trends
  - Generate recommendations
  ```
- [ ] **Visualizations:**
  - Progress charts (Chart.js or Recharts)
  - Before/after photo comparison
  - Diagnosis timeline

### **Sprint 2.4: User Settings (2 days)**
- [ ] **Profile management:**
  - Edit personal information
  - Upload profile photo
  - Notification preferences
- [ ] **Advanced settings:**
  - Data export/deletion (GDPR)
  - Affiliate preferences
  - Privacy options

---

## **PHASE 3: INTERNAL PRODUCT CATALOG & MONETIZATION**
### *Duration: 2–3 weeks*

### **Sprint 3.1: Internal Product Database (1 week)**
- [ ] **Product catalog architecture:**
  ```sql
  -- Product table with advanced categorization
  CREATE TABLE products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL, -- 'cleanser', 'moisturizer', 'treatment', etc.
    subcategory TEXT, -- 'gel_cleanser', 'cream_moisturizer', 'retinol_serum'
    price DECIMAL(8,2) NOT NULL,
    affiliate_link TEXT NOT NULL,
    commission_rate DECIMAL(5,4), -- e.g., 0.0800 for 8%
    
    -- AI selection criteria
    skin_types TEXT[], -- ['dry', 'oily', 'combination', 'sensitive']
    target_concerns TEXT[], -- ['dehydration', 'acne', 'wrinkles', 'pigmentation']
    intensity_level TEXT, -- 'mild', 'moderate', 'intensive'
    routine_position TEXT[], -- ['morning', 'evening', 'both']
    
    -- Quality metadata
    efficacy_rating DECIMAL(3,2), -- Internal efficacy rating (1–5)
    user_rating DECIMAL(3,2), -- Avg. user rating
    reviews_count INTEGER,
    clinical_proven BOOLEAN DEFAULT FALSE,
    dermatologist_recommended BOOLEAN DEFAULT FALSE,
    
    -- Stock & availability
    in_stock BOOLEAN DEFAULT TRUE,
    priority_score INTEGER DEFAULT 100, -- Prioritization score (100 = max)
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] **Admin management interface:**
  ```typescript
  src/app/admin/products/
  ├── page.tsx (list with filters)
  ├── [id]/page.tsx (product edit)
  ├── add/page.tsx (add product)
  └── components/
      ├── ProductForm.tsx
      ├── CategoryManager.tsx
      └── BulkImport.tsx
  ```
- [ ] **Initial import:** Migrate JSON catalog to structured DB

### **Sprint 3.2: Intelligent AI Selection Engine (4–5 days)**
- [ ] **Intelligent selection algorithm:**
  ```typescript
  // File: src/services/recommendations/intelligentEngine.ts
  class IntelligentProductSelector {
    // 1. Analyze needs detected by AI
    analyzeDetectedConcerns(analysis: SkinAnalysis): ProductNeed[]
    
    // 2. Calculate category budgets
    calculateBudgetDistribution(totalBudget: number, needs: ProductNeed[]): BudgetAllocation
    
    // 3. Select per category within constraints
    selectByCategory(category: string, budget: number, concerns: string[]): Product[]
    
    // 4. Global routine optimization
    optimizeRoutineBudget(products: Product[], maxBudget: number): OptimizedRoutine
    
    // 5. Smart fallback logic (never empty!)
    handleEdgeCases(needs: ProductNeed[], budget: number): FallbackStrategy
  }
  ```
- [ ] **Prioritization logic:**
  - **Primary criteria:** Detected issue → product category mapping
  - **Budget criteria:** Smart distribution by need importance
  - **Dynamic alternatives:** If budget insufficient → balms/economical options
  - **Quality escalation:** If budget high → targeted premium products

### **Sprint 3.3: Admin Interface & Tracking (2–3 days)**
- [ ] **Full admin dashboard:**
  ```typescript
  src/app/admin/
  ├── dashboard/page.tsx (global metrics)
  ├── products/ (catalog management)
  ├── analytics/ (product performance)
  └── recommendations/ (logs & optimization)
  ```
- [ ] **Product analytics:**
  - Track recommendations by category
  - Conversion rate by product type
  - Budget performance (AOV vs declared budget)
  - Identify catalog gaps
- [ ] **Curation tools:**
  - Catalog import/export
  - A/B tests on recommendations
  - Low-stock notifications

---

## **PHASE 4: ANALYTICS & OPTIMIZATION**
### *Duration: 1–2 weeks*

### **Sprint 4.1: Complete Analytics (1 week)**
- [ ] **Advanced GA4 setup:**
  ```typescript
  // Files to create:
  - src/lib/analytics/gtag.ts
  - src/lib/analytics/events.ts
  - src/hooks/useAnalytics.ts
  ```
- [ ] **Event tracking:**
  - Full user journey
  - Acquisition and conversion funnels
  - Heatmaps (Hotjar/Microsoft Clarity)
- [ ] **Admin dashboard:**
  - Real-time metrics
  - Cohort analysis
  - Retention reports

### **Sprint 4.2: Performance & PWA (3–4 days)**
- [ ] **Frontend optimization:**
  - Full Lighthouse audit
  - Advanced code splitting
  - Smart preloading
  - Service Worker for PWA
- [ ] **Backend optimization:**
  - Redis cache for frequent queries
  - Asset compression
  - API monitoring

---

## **PHASE 5: SECURITY & TESTING**
### *Duration: 1 week*

### **Sprint 5.1: Enhanced Security (4 days)**
- [ ] **Data protection:**
  - Full security audit
  - Security headers (CSP, HSTS)
  - Strict validation (Zod schemas)
  - Encryption for sensitive data
- [ ] **Robust authentication:**
  - Optional 2FA
  - Brute-force protection
  - Secure session management
  - Security logs

### **Sprint 5.2: Automated Tests (3 days)**
- [ ] **Test suite:**
  ```typescript
  - __tests__/ (Jest + React Testing Library)
  - e2e/ (Playwright for end-to-end tests)
  - cypress/ (integration tests)
  ```
- [ ] **CI/CD pipeline:**
  - GitHub Actions for automated tests
  - Vercel preview deployments
  - Monitoring with Sentry

---

## **PHASE 6: LAUNCH & GO-LIVE**
### *Duration: 1 week*

### **Sprint 6.1: Launch Preparation (3 days)**
- [ ] **SEO & Content:**
  - Optimized meta tags
  - Dynamic sitemap
  - Legal pages (ToS, privacy)
  - Schema.org markup
- [ ] **User onboarding:**
  - Guided tour for new users
  - Welcome emails
  - In-app tutorials
  - Dynamic FAQ

### **Sprint 6.2: Production Deployment (2 days)**
- [ ] **Production configuration:**
  - Vercel Pro with custom domain
  - Secure environment variables
  - Global CDN configuration
  - Automatic DB backups
- [ ] **Go-live & monitoring:**
  - Deployment with rollback plan
  - Production smoke tests
  - 24/7 support during first week
  - Collect user feedback

### **Sprint 6.3: Post-Launch Optimization (2 days)**
- [ ] **Analyze & iterate:**
  - Adoption metrics
  - Conversion rate optimization
  - Fix critical bugs
  - Plan future features

---

## 🎯 **HIGH-VALUE ADDITIONAL FEATURES**

### **Personal AI Coach** *(Priority 1 – 1 week)*
```typescript
// Files to create:
src/services/ai/coach.service.ts
src/components/chat/AICoach.tsx
src/hooks/useAICoach.ts
```
- Integrated conversational chatbot
- Advice based on progress
- Smart reminders
- Contextual answers

### **Gamification** *(Priority 2 – 3–4 days)*
```typescript
// Points and badges system
src/services/gamification/
├── points.service.ts
├── badges.service.ts
└── leaderboard.service.ts
```
- Loyalty points for regular analyses
- Progress badges
- Rewards and discounts

### **Advanced PDF Export** *(Priority 3 – 1 week)*
```typescript
src/services/pdf/
├── report-generator.service.ts
├── templates/
└── assets/
```
- Reports with charts
- Professional branding
- Evolution history
- Medical sharing

---

## 📊 **SUCCESS METRICS TO TRACK**

### **Acquisition**
- Daily/monthly signups
- Visitor → signup conversion rate: **> 15%**
- CAC (Customer Acquisition Cost): **< €10**
- First-diagnosis completion: **> 80%**

### **Engagement**
- D1/D7/D30 retention: **70% / 40% / 25%**
- Average analyses per user: **> 3**
- Dashboard session time: **> 5 min**
- Recommendation usage: **> 60%**

### **Monetization**
- Monthly affiliate revenue: **> €1,000** (3-month goal)
- Conversion on recommended products: **> 8%**
- Average order value: **> €30**
- User LTV: **> €50**

### **Quality**
- NPS (Net Promoter Score): **> 50**
- AI analysis accuracy: **> 90%**
- Page load time: **< 2s**
- Critical bug rate: **< 1%**

---

## ⚡ **RESOURCES & ESTIMATED BUDGET**

### **Cloud Services** *(~ €100/month)*
- Supabase Pro: €25/month (100GB storage)
- Vercel Pro: €20/month (unlimited bandwidth)
- OpenAI API: €50–€200/month (usage-dependent)
- Redis Cloud: €10/month (1GB cache)
- Sentry Pro: €26/month (error tracking)

### **Third-Party APIs** *(free then commission)*
- Affiliate programs (€0 setup)
- Google Analytics 4 (free)
- Hotjar/Clarity (free up to 10k sessions)

### **Dev Tools** *(optional)*
- Figma Pro: €12/month
- Linear/Notion: €8/month
- GitHub Copilot: €10/month

---

## 🚀 **PRIORITIZATION STRATEGIES**

### **Viable MVP (6 weeks) – Beta**
1. ✅ Phase 1: Authentication + Storage
2. ✅ Phase 2: Basic dashboard + history
3. ✅ Phase 3: Basic affiliation
4. ✅ Phase 6: Soft launch (invited users)

### **Complete Version (10 weeks) – Public**
MVP + Phase 4 (Analytics) + Phase 5 (Security) + High-value features

### **Premium Version (15 weeks) – Scale**
Complete version + Marketplace + Advanced AI + Public APIs

---

## 📋 **PHASE VALIDATION CHECKLIST**

### **Phase 1 – Ready ✓**
- [ ] User can create an account and sign in
- [ ] Photos are securely saved to cloud
- [ ] Analyses are persisted in the database
- [ ] Guest mode remains functional in parallel
- [ ] Auth unit tests pass

### **Phase 2 – Ready ✓**
- [ ] Dashboard shows full analysis history
- [ ] Cross-analysis comparisons work
- [ ] PDF export for a single analysis
- [ ] User settings editable
- [ ] Responsive dashboard navigation
- [ ] **BONUS:** Unified routine without separate “areas to monitor” section

### **Phase 3 – Ready ✓**
- [ ] At least 2 affiliate APIs connected
- [ ] Personalized recommendations working
- [ ] Affiliate click tracking
- [ ] Product cache operational
- [ ] Fallback to static catalog

### **Phase 4 – Ready ✓**
- [ ] GA4 configured with custom events
- [ ] Admin analytics dashboard functional
- [ ] PWA installable on mobile
- [ ] Lighthouse score > 90
- [ ] Load time < 2s

### **Phase 5 – Ready ✓**
- [ ] Security audit validated (headers, CSP, etc.)
- [ ] E2E tests pass on critical journeys
- [ ] Error monitoring configured
- [ ] Rollback plan tested
- [ ] Technical documentation complete

### **Phase 6 – Ready ✓**
- [ ] Production domain configured with SSL
- [ ] Production environment variables
- [ ] Real-time monitoring operational
- [ ] User support prepared
- [ ] Success metrics tracking

---

## 🎯 **IMMEDIATE NEXT STEPS**

### **Week 1: Kickoff**
1. **Days 1–2:** Supabase + NextAuth.js configuration
2. **Days 3–4:** Storage migration IndexedDB → Cloud
3. **Day 5:** Tests and Phase 1 validation

### **Week 2: Dashboard**
1. **Days 1–3:** Dashboard architecture & components
2. **Days 4–5:** Analysis history + APIs

### **🚀 PRIORITY IMPROVEMENT: Unified Routine**
**Duration:** 1 week (can be done in parallel)
- **Day 1:** Update AI service + prompts
- **Days 2–3:** New `UnifiedRoutineSection` component
- **Day 4:** Integrate on results page + CSS
- **Day 5:** Tests + UX validation

> **Impact:** Dramatically improved UX, more logical structure, optimized visual scan

This plan is designed to be iterative and adaptive. Each sprint can be adjusted based on user feedback and technical constraints. The main objective is to have a functional beta in 6 weeks, then quickly optimize toward the public version.
