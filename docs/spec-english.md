# Functional and Technical Specifications for DermAI V2

## 1. Overview

DermAI V2 is an AI-powered dermatological diagnosis web application. It provides users with personalized skin analysis, product recommendations, and custom skincare routines. The app stands out with its two-step diagnostic approach, strong personalization, and monetization potential via affiliate marketing.

## 2. Technical Architecture

### 2.1. Technology Stack

**Frontend**
- **Framework:** Next.js 15 (with App Router), React 19, TypeScript  
- **Styling:** Tailwind CSS with a custom theme  
- **Animations:** Framer Motion  
- **Data validation:** Zod  
- **Form handling:** React Hook Form

**Backend & Authentication**
- **Authentication:** NextAuth.js (email/password + Google/Apple OAuth)  
- **Database:** Supabase (PostgreSQL with Row Level Security)  
- **File storage:** Supabase Storage (user photos)  
- **Cache:** Redis Cloud (product search cache)

**AI & External APIs**
- **AI:** OpenAI GPT-4o Vision API  
- **Affiliate:** Sephora APIs, Amazon Associates, Douglas  
- **Analytics:** Google Analytics 4 + Enhanced Ecommerce  
- **Monitoring:** Sentry (error tracking), Vercel Analytics

**Storage & Data**
- **Cloud storage:** Supabase (analyses, user profiles)  
- **Local storage:** IndexedDB (offline cache), SessionStorage (session)  
- **Compression:** LZ-String (result sharing)

### 2.2. Project Structure

```
/src
|-- /app
|   |-- /api
|   |   |-- /auth/[...nextauth]/route.ts
|   |   |-- /analyze/route.ts
|   |   |-- /analyses/route.ts (user CRUD)
|   |   |-- /affiliate/route.ts (tracking)
|   |-- /auth (signin/signup)
|   |-- /dashboard
|   |   |-- layout.tsx (sidebar navigation)
|   |   |-- page.tsx (overview)
|   |   |-- /analyses (history)
|   |   |-- /progress (evolution)
|   |   |-- /settings (preferences)
|   |-- /admin (analytics, metrics)
|   |-- /analyze
|   |-- /questionnaire
|   |-- /results
|   |-- /upload
|   |-- layout.tsx
|   |-- page.tsx
|-- /components
|   |-- /ui (base components)
|   |-- /shared (reusable components)
|   |-- /dashboard (dashboard components)
|   |-- /auth (auth forms)
|-- /constants
|-- /data
|-- /hooks
|   |-- useAuth.ts
|   |-- useAnalysis.ts
|   |-- useAnalytics.ts
|-- /lib
|   |-- auth.ts (NextAuth config)
|   |-- supabase.ts (client)
|   |-- analytics.ts (GA4)
|-- /services
|   |-- /ai (analysis.service.ts)
|   |-- /affiliate (product APIs)
|   |-- /storage (cloud storage)
|   |-- /analytics (tracking)
|-- /types
|-- /utils
```

## 3. Functional Specifications

### 3.1. User Journey

1. **Landing Page (`/`)**: Present the app, its benefits, and a call-to-action to start the diagnosis.  
2. **Photo Upload (`/upload`)**: Interface to upload multiple face photos from different angles.  
3. **Questionnaire (`/questionnaire`)**: A 7-step interactive flow including 3 full-screen views:
   - **Before/After intro screen**: Benefits with a 30-day comparison visual  
   - **Personal profile**: Age, gender, skin type  
   - **Skin concerns**: Select main issues (max 3)  
   - **Social proof screen**: Reassurance with stats from similar users  
   - **Current routine**: Products used morning/evening (optional)  
   - **Allergies & sensitivities**: Ingredients to avoid (optional)  
   - **Savings screen**: Visualize potential savings with progress  
   - **Finalization**: Desired routine type and budget  
4. **Analysis (`/analyze`)**: Loading page while the AI analyzes the data.  
5. **Results (`/results`)**: Detailed diagnosis, scores, routine, and recommended products.

### 3.2. Detailed Features

- **Optimized 2-step diagnosis**:
  1. Visual analysis by GPT-4o for an objective, detailed diagnosis.  
  2. Intelligent product selection via internal engine (zero generic fallback).
- **Optimized user flow**:
  - **Immersive full-screen views**: 3 dedicated screens for engagement and reassurance  
  - **Integrated social proof**: Stats from similar users for reassurance  
  - **Savings visualization**: Spend comparison before/after  
  - **Clear progression**: Visual + numeric progress indicator
- **Detailed Scores**: 0–100 scoring for 8 skin-health criteria (hydration, wrinkles, etc.).  
- **🔬 3-Phase Dermatological Routine (NEW):**
  - **Immediate Phase (1–3 wks)**: Stabilize + address urgent issues while respecting the skin barrier  
  - **Adaptation Phase (3–8 wks)**: Progressive introduction of potent actives  
  - **Maintenance Phase (ongoing)**: Maintain gains + prevent relapses  
  - **Smart transitions**: Durable base vs. temporary treatments  
  - **Personalized durations**: Computed by age, skin type, issue severity  
  - **Visual criteria**: “Until healed” replaces arbitrary timing
- **🎓 Integrated Educational UI (NEW):**
  - **Goals per phase**: Explain the “why” behind each step  
  - **Dermatology tooltips**: Simplified 28-day cell cycle  
  - **Enriched time badges**: Observation + duration + objective  
  - **User empowerment**: Understand the logic of progression
- **Curated Internal Catalog**: Product database carefully selected for quality and efficacy.  
- **Advanced Recommendation Engine**:
  - Intelligent algorithm with no “empty” recommendations  
  - Automatic filtering of generic/fallback products  
  - Smart grouping by `catalogId`
- **AI Assistant**: Chatbot to answer user questions about their diagnosis.  
- **Integrated analytics**: Track user interactions and recommendation performance.

## 4. AI and Machine Learning

- **Model**: GPT-4o Vision for image analysis.  
- **Prompts**: Sophisticated, distinct system prompts for diagnosis and product selection.  
- **Scoring algorithm**: Proprietary algorithm to compute skin age and an overall skin-health score.

## 5. Data Management

### 5.1. Hybrid Storage Architecture

**Cloud Storage (Logged-in users)**
- **User photos**: Supabase Storage with compression and encryption  
- **Analyses and diagnoses**: Supabase DB with Row Level Security  
- **User profiles**: Metadata and preferences in a secure DB  
- **History & progress**: Progress tracking with time-based comparisons

**Local Storage (Guest mode + cache)**
- **Offline cache**: IndexedDB for offline operation  
- **Temporary session**: SessionStorage for unauthenticated users  
- **Performance optimization**: Local cache for API results

### 5.2. Security and Privacy

**Protection of sensitive data**
- Supabase Row Level Security (RLS) for user-data isolation  
- Encrypt photos before cloud storage  
- Secure JWT tokens for authentication  
- Audit trail of access to personal data

**GDPR compliance**
- Explicit consent for cloud storage  
- Right to erasure (full data deletion)  
- Export of personal data in a portable format  
- Anonymization of analytics and metrics

### 5.3. Sharing and Interoperability

- **Secure sharing**: Temporary URLs with limited-access tokens  
- **PDF export**: Full reports with professional branding  
- **Smart compression**: LZ-String to optimize shares  
- **Future APIs**: Endpoints for integration with third-party systems

## 6. UI/UX

- **Design**: Clean, lab-like aesthetic with subtle animations.  
- **Color palette**: Predominantly white and beige with blue/purple AI accents.  
- **Responsive**: Fully functional and beautiful on mobile and desktop.

## 7. Roadmap and Detailed Planning

### 7.1. Current Status (January 2025)
- ✅ Next.js 15 + TypeScript + Tailwind CSS architecture  
- ✅ Professional upload interface with validation  
- ✅ 7-step interactive questionnaire (3 full-screen views)  
- ✅ GPT-4o Vision integration for AI diagnosis  
- ✅ Results page with detailed scores (8 parameters)  
- ✅ **3-Phase Dermatological Routine**: Complete logic respecting cell cycle  
- ✅ **Educational Interface**: Personalized durations + tooltips + time badges  
- ✅ **Intelligent Filtering**: Automatic removal of generic products  
- ✅ **Consistent Numbering**: 1, 2, 3 per phase instead of 100, 200  
- ✅ **Product Transitions**: Durable base vs. temporary treatments  
- ✅ **Visual Criteria**: “Until healed” replaces arbitrary timing  
- ✅ Viral sharing system with image export  
- ✅ Local storage: IndexedDB + SessionStorage  
- ✅ Basic affiliate catalog (static JSON)  
- ⚠️ NextAuth.js and Supabase installed but not configured

### 7.2. Development Plan (6–10 weeks)

**PHASE 1: Authentication & Cloud Storage (1–2 weeks)**
- Configure Supabase with user and analysis tables  
- Implement NextAuth.js (email/password + Google OAuth)  
- Migrate local storage to secure cloud  
- Protect routes and manage sessions

**PHASE 2: User Dashboard (2–3 weeks)**
- Dashboard architecture with responsive sidebar  
- Analysis history with pagination and filters  
- Comparison system and progress tracking  
- User settings and profile management

**PHASE 3: Internal Product Catalog & Monetization (2–3 weeks)**
- Carefully curated internal product database  
- Intelligent AI selection engine with zero generic fallback  
- Budget optimization logic and economical alternatives  
- Admin interface for management + product performance analytics

**PHASE 4: Analytics & Optimization (1–2 weeks)**
- Full Google Analytics 4 setup  
- Admin dashboard with conversion metrics  
- PWA and performance optimization (Lighthouse > 90)  
- Heatmaps and user-journey analysis

**PHASE 5: Security & Testing (1 week)**
- Security audit and protective headers  
- Automated test suite (Jest + Playwright)  
- CI/CD pipeline with GitHub Actions  
- Error monitoring with Sentry

**PHASE 6: Production Launch (1 week)**
- SEO optimization and legal pages  
- Vercel Pro deployment with custom domain  
- User onboarding and support  
- Intensive post-launch monitoring

### 7.3. Priority Future Features

**Personal AI Coach (post-launch)**
- Conversational chatbot integrated into the dashboard  
- Personalized advice based on progress  
- Smart reminders and notifications

**Gamification System**
- Loyalty points and progress badges  
- Rewards as discounts  
- Optional community leaderboards

**Advanced PDF Export**
- Detailed reports with progress charts  
- Professional branding for medical sharing  
- Full history over 6–12 months

**Integrated Marketplace**
- Direct sales with high margins  
- Exclusive brand partnerships  
- Advanced loyalty program

## 8. Security, Robustness, and Consistency Improvements

### 8.1. Security

- **API key protection**: Ensure the OpenAI API key is never exposed client-side. Use serverless functions (Next.js API Routes) for all OpenAI interactions.  
- **Sensitive data handling**: Although photos are stored locally, consider encryption options if sensitive data is stored server-side in the future (e.g., diagnosis history).  
- **Input validation**: Strengthen server-side validation for all user inputs (questionnaire, photo upload) to prevent injections or malformed data.  
- **Secure auth**: For future features requiring authentication, use OAuth2/OpenID Connect with reputable identity providers (e.g., Auth0, NextAuth.js) and secure JWTs.

### 8.2. Robustness

- **API error handling**: Implement retry with exponential backoff for external API calls (OpenAI, Perfect Corp if used, affiliate APIs) to handle transient errors and rate limits.  
- **Monitoring & alerting**: Set up monitoring for app performance, API errors, and response times, with automatic alerts for critical incidents.  
- **Automated testing**: Build a comprehensive suite of unit, integration, and end-to-end tests to ensure stability and prevent regressions.  
- **Scalability**: Anticipate user growth. For APIs, consider caching and managed services that auto-scale. For the frontend, continuously optimize bundles and load times.

### 8.3. Consistency and Functionality

- **Data standardization**: Define clear, consistent schemas for the product catalog, AI diagnoses, and user profiles. Use TypeScript to enforce at compile time.  
- **Product selection logic**: Refine the selection algorithm to weigh diagnosis results alongside user preferences (budget, allergies, routine type).  
- **User feedback on diagnosis**: Allow users to rate diagnosis accuracy to improve prompt engineering and flag edge cases.  
- **Internationalization (i18n)**: Plan for multiple languages and regional formats to support international expansion.  
- **Accessibility (A11y)**: Ensure the app is usable by people with disabilities per WCAG guidelines.

## 9. References

[1] Skincare AI Business Plan. (2025). Document provided by the user.  
[2] Skincare AI Secondary Planning. (2025). Document provided by the user.  
[3] Very Detailed Summary of DermAI V2. (2025). Document provided by the user.  
[4] DermAI GitHub Repo. (2025). https://github.com/picmakpro/DermAi/tree/logique-2etapes-2025-08-24-03h18

---

### 6.1. DermAI Brand Guide

The DermAI V2 brand guide defines a precise visual identity and editorial tone, aiming to make skincare diagnostics accessible, reliable, and elegant through AI—positioned at the crossroads of dermatological science and premium beauty.

**6.1.1. Color Palette**

| Usage | Color | HEX |
|---|---|---|
| Primary background | Pure White | `#FFFFFF` |
| Secondary background | Light beige / nude | `#FDF9F7` |
| Primary text | Soft Black | `#1A1A1A` |
| Secondary text | Neutral Gray | `#6E6E6E` |
| Beauty Accent | Rosy Nude | `#EAD9D1` |
| AI Accent | Futuristic Purple | `#8F7BFF` |
| Glow Accent | Electric Blue | `#5A4AE3` |
| Validation / Success | Soft Green | `#4ADE80` |
| Alert / Error | Light Red | `#EF4444` |

**Logic:**
- White + beige base for clinical elegance.  
- Purple/Electric blue for the AI touch.  
- Rosy accents to evoke skin.

**6.1.2. Typography**

- **Headlines / Branding:** `Neue Haas Grotesk` or `Suisse Intl` (modern, premium).  
- **Subheads / UI:** `Inter` (readable and clean).  
- **AI accent / code / data:** `IBM Plex Mono` (optional for numbers, scores, results).

**6.1.3. Logo**

- Minimalist, stylized letter **D** with a purple halo/glow.  
- Two versions:
  - Light (on white/beige background)  
  - Inverted (white on purple background)

**6.1.4. Iconography & Visuals**

- **Icons:** Thin outlines, rounded, consistent. Minimal, modern; purple by default.  
- **Illustrations:** Clean diagrams, silhouettes, abstract faces.  
- **Photos:** Natural skin, diverse, soft lighting. Aesthetic similar to Typology/Glossier (raw yet elegant).

**6.1.5. UI/UX**

- **Layout:** Plenty of white space. Airy sections with clear hierarchy.  
- **Cards:** Floating, rounded (24–32px radius).  
- **Buttons:** Pills with purple/blue gradients.  
- **Primary CTA:** Purple → electric blue gradient, bold white text (e.g., Start Analysis →).  
- **Animations:** Purple glow on hover. Gentle transitions (fade, slide-up). Holographic scan effect on photos.

**6.1.6. Editorial Tone**

- **Voice:** Expert yet warm. Confident, never anxiety-inducing. Modern and inclusive (gender-neutral, non-stigmatizing).  
- **Examples:**
  - ❌ “Your skin is damaged.”  
  - ✅ “Your skin shows areas to optimize for more radiance.”  
- **Possible taglines:**
  - “Your AI Beauty Partner.”  
  - “Science in service of your glow.”  
  - “One diagnosis, one routine, one transformed skin.”

## 10. Deployment and Production

### 10.1. Vercel Configuration

**Required environment variables:**
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Optimized `vercel.json`:**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "functions": {
    "src/app/api/analyze/route.ts": {
      "maxDuration": 30,
      "memory": 1024,
      "regions": ["iad1"]
    },
    "src/app/api/chat/route.ts": {
      "maxDuration": 15,
      "regions": ["iad1"]
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ]
}
```

### 10.2. Applied Optimizations

**Image compression:**
- Aggressive compression based on photo count  
- 1 photo: 1600×1600, 80% quality  
- 3+ photos: 800×800, 50% quality  
- 85% payload reduction to avoid Vercel errors

**Serverless configuration:**
- Timeout extended to 30s for AI analysis  
- Memory increased to 1024MB  
- US-East region for optimal latency  
- Graceful handling of payload errors

### 10.3. Monitoring and Tests

**Test endpoint:**  
`/api/test` – Validate OpenAI configuration and environment variables

**Monitored metrics:**
- Analysis API response time (< 30s)  
- Payload error rate (< 1%)  
- Image compression performance  
- Serverless memory usage

### 10.4. Deployment Steps

```bash
# 1. Local build check
npm run build

# 2. Test with Vercel CLI
vercel dev

# 3. Preview deployment
vercel

# 4. Production deployment
vercel --prod

# 5. Immediate test
curl https://your-app.vercel.app/api/test
```

## 11. Conclusion and Next Steps

DermAI V2 represents a major evolution in AI dermatological diagnosis. The two-step approach (questionnaire + photos), the 3-phase routine, and affiliate-driven monetization create a differentiated product. The technical choices (Next.js 15, Supabase, GPT-4o Vision) ensure performance and scalability. The ambitious yet realistic roadmap enables iterative development with user validation at every stage.
