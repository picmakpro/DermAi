# 📋 PLANNING DÉTAILLÉ - DermAI V2
## Version Web App Gratuite avec Inscription

> **Objectif :** Finaliser DermAI V2 en version web complète avec authentification, dashboard utilisateur et monétisation par affiliation

---

## 🎯 **ÉTAT ACTUEL DU PROJET**

### ✅ **Fonctionnalités Implémentées**
- Architecture Next.js 15 + TypeScript + Tailwind CSS
- Interface d'upload de photos avec drag & drop
- Questionnaire interactif en 7 étapes avec 3 écrans plein écran
- Intégration GPT-4o Vision pour l'analyse dermatologique
- Page de résultats avec scores détaillés (8 paramètres)
- Système de partage viral avec export d'images (html2canvas)
- Stockage local : IndexedDB (photos) + SessionStorage (métadonnées)
- Catalogue d'affiliation de base (JSON statique)
- Analytics partielles (Google Analytics events)
- Charte graphique DermAI complète

### ⚠️ **Dépendances Installées Mais Non Configurées**
- `next-auth`: ^4.24.11 (authentification)
- `@supabase/supabase-js`: ^2.55.0 (base de données)
- `lz-string`: ^1.5.0 (compression pour partage)
- `html2canvas`: ^1.4.1 (export d'images)

### ❌ **Fonctionnalités Manquantes Critiques**
- Authentification utilisateur et gestion des sessions
- Dashboard utilisateur avec historique des analyses
- Sauvegarde cloud des diagnostics et photos
- Système de suivi de l'évolution cutanée
- Monétisation d'affiliation avec vraies APIs
- Analytics complètes et tracking des conversions
- Tests automatisés et monitoring

---

## 🏗️ **ARCHITECTURE TECHNIQUE CIBLE**

### **Stack Technologique Finale**
```typescript
// Frontend
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + Framer Motion (animations)
- React Hook Form + Zod (formulaires/validation)

// Authentification & Base de Données
- NextAuth.js (authentification multi-provider)
- Supabase (PostgreSQL + Storage + RLS)

// IA & APIs
- OpenAI GPT-4o Vision (analyse dermatologique)
- APIs d'affiliation (Sephora, Amazon, Douglas)

// Analytics & Monitoring
- Google Analytics 4 + Enhanced Ecommerce
- Sentry (error tracking)
- Vercel Analytics (performance)

// Déploiement
- Vercel (hosting)
- Redis Cloud (cache)
- CDN global (assets)
```

### **Structure de Base de Données Supabase**
```sql
-- Table utilisateurs
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table analyses
CREATE TABLE user_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  photos_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shared_publicly BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE
);

-- Table évolution
CREATE TABLE skin_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES user_analyses(id) ON DELETE CASCADE,
  comparison_data JSONB,
  progress_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table tracking affiliation
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

## 📅 **PLANNING DÉTAILLÉ PAR PHASES**

## **PHASE 1 : AUTHENTIFICATION & STOCKAGE CLOUD**
### *Durée : 1-2 semaines*

### **Sprint 1.1 : Configuration Supabase (2-3 jours)**
- [ ] **Jour 1 :** Configuration projet Supabase + variables d'environnement
  - Créer projet Supabase
  - Configurer `.env.local` avec clés API
  - Tester connexion base de données
- [ ] **Jour 2 :** Création des tables et politiques RLS
  - Exécuter scripts SQL de création des tables
  - Configurer Row Level Security (RLS)
  - Tester les permissions d'accès
- [ ] **Jour 3 :** Configuration Supabase Storage
  - Créer buckets pour photos utilisateurs
  - Configurer politiques d'upload sécurisées
  - Tester upload/download d'images

### **Sprint 1.2 : NextAuth.js Implementation (2-3 jours)**
- [ ] **Jour 1 :** Configuration NextAuth.js de base
  ```typescript
  // Fichiers à créer/modifier :
  - src/app/api/auth/[...nextauth]/route.ts
  - src/lib/auth.ts (configuration)
  - src/middleware.ts (protection routes)
  ```
- [ ] **Jour 2 :** Providers d'authentification
  - Email/Password avec Supabase
  - Google OAuth
  - Apple OAuth (optionnel)
- [ ] **Jour 3 :** Pages d'authentification
  ```typescript
  // Pages à créer :
  - src/app/auth/signin/page.tsx
  - src/app/auth/signup/page.tsx
  - src/app/auth/error/page.tsx
  ```

### **Sprint 1.3 : Migration du stockage (1-2 jours)**
- [ ] **Service de migration :** `src/services/storage/migration.ts`
  - Migrer de IndexedDB vers Supabase Storage
  - Conserver fallback local pour mode hors ligne
  - Compression intelligente des images
- [ ] **Mise à jour hooks :** Modifier `useAnalysis` pour la sauvegarde cloud

---

## **PHASE 2 : DASHBOARD UTILISATEUR** ✅ **ARCHITECTURE COMPLÈTE**
### *Durée : 3-4 semaines*
### **Statut : Prêt à implémenter**

**Documentation Phase 2 disponible :**
- 📋 **Fiche technique** : `docs/fiche-technique-phase2-dashboard.md`
- 🗓️ **Planning détaillé** : `docs/planning-execution-phase2-dashboard.md`

### **Sprint 2.1 : Architecture Dashboard (3-4 jours)** ✅ DÉFINI
- [ ] **Structure des routes :**
  ```typescript
  src/app/dashboard/
  ├── layout.tsx (sidebar + navigation)
  ├── page.tsx (vue d'ensemble)
  ├── analyses/
  │   ├── page.tsx (liste paginée)
  │   └── [id]/page.tsx (détail)
  ├── progress/
  │   └── page.tsx (évolution)
  └── settings/
      └── page.tsx (paramètres)
  ```
- [ ] **Composants de base :**
  ```typescript
  - src/components/dashboard/Sidebar.tsx
  - src/components/dashboard/DashboardStats.tsx
  - src/components/dashboard/AnalysisCard.tsx
  - src/components/dashboard/QuickActions.tsx
  ```

### **Sprint 2.2 : Historique des Analyses (4-5 jours)** ✅ DÉFINI
- [ ] **Liste paginée avec filtres** : Recherche, période, amélioration
- [ ] **Page détail analyse** : Tabs avec scores, routine, photos
- [ ] **Comparaison interactive** : Slider avant/après pour photos
- [ ] **Graphiques scores** : Radar chart et bar chart (Recharts)
- [ ] **Export PDF** : Rapport détaillé avec graphiques

### **Sprint 2.3 : Routine Tracker & Étagères (5-6 jours)** ✅ DÉFINI
- [ ] **Calendrier mensuel** : React-Calendar avec indicateurs visuels
- [ ] **Tracking par phase** : Matin/soir avec complétion simple
- [ ] **Calcul de streaks** : Automatique avec badges de progression
- [ ] **Étagères produits** : Drag & drop avec React Beautiful DnD
- [ ] **Produits personnalisés** : Ajout de produits hors catalogue
- [ ] **Synchronisation analyses** : Suggestion mise à jour étagères

### **Sprint 2.4 : Paramètres Utilisateur (2-3 jours)** ✅ DÉFINI
- [ ] **Profil complet** : Avatar, infos perso, type peau, préoccupations
- [ ] **Notifications** : In-app, email, fréquence, horaires rappels
- [ ] **Préférences dashboard** : Ordre widgets, vue par défaut
- [ ] **Confidentialité RGPD** : Export données JSON, suppression compte

### **Sprint 2.5 : Coach IA & Badges (3-4 jours)** ✅ DÉFINI
- [ ] **Coach IA contextuel** : Chat modal avec GPT-4o
- [ ] **Contexte intelligent** : Profil + routine + analyses + produits
- [ ] **Suggestions produits** : Intégrées dans les réponses
- [ ] **Cache réponses** : Optimisation coûts API
- [ ] **Badges symboliques** : 4 catégories, 4 niveaux chacune
- [ ] **Notifications badges** : Animation Framer Motion

---

## **PHASE 3 : CATALOGUE PRODUITS INTERNE & MONÉTISATION**
### *Durée : 2-3 semaines*

### **Sprint 3.1 : Base de Données Produits Interne (1 semaine)**
- [ ] **Architecture catalogue produits :**
  ```sql
  -- Table produits avec catégorisation avancée
  CREATE TABLE products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL, -- 'cleanser', 'moisturizer', 'treatment', etc.
    subcategory TEXT, -- 'gel_cleanser', 'cream_moisturizer', 'retinol_serum'
    price DECIMAL(8,2) NOT NULL,
    affiliate_link TEXT NOT NULL,
    commission_rate DECIMAL(5,4), -- ex: 0.0800 pour 8%
    
    -- Critères de sélection IA
    skin_types TEXT[], -- ['dry', 'oily', 'combination', 'sensitive']
    target_concerns TEXT[], -- ['dehydration', 'acne', 'wrinkles', 'pigmentation']
    intensity_level TEXT, -- 'mild', 'moderate', 'intensive'
    routine_position TEXT[], -- ['morning', 'evening', 'both']
    
    -- Métadonnées qualité
    efficacy_rating DECIMAL(3,2), -- Note d'efficacité interne (1-5)
    user_rating DECIMAL(3,2), -- Note utilisateurs moyens
    reviews_count INTEGER,
    clinical_proven BOOLEAN DEFAULT FALSE,
    dermatologist_recommended BOOLEAN DEFAULT FALSE,
    
    -- Gestion stock et disponibilité
    in_stock BOOLEAN DEFAULT TRUE,
    priority_score INTEGER DEFAULT 100, -- Score de priorisation (100 = max)
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] **Interface admin de gestion :**
  ```typescript
  src/app/admin/products/
  ├── page.tsx (liste avec filtres)
  ├── [id]/page.tsx (édition produit)
  ├── add/page.tsx (ajout produit)
  └── components/
      ├── ProductForm.tsx
      ├── CategoryManager.tsx
      └── BulkImport.tsx
  ```
- [ ] **Import initial :** Migration du catalogue JSON vers base structurée

### **Sprint 3.2 : Moteur de Sélection IA Intelligent (4-5 jours)**
- [ ] **Algorithme de sélection intelligent :**
  ```typescript
  // Fichier : src/services/recommendations/intelligentEngine.ts
  class IntelligentProductSelector {
    // 1. Analyse des besoins détectés par l'IA
    analyzeDetectedConcerns(analysis: SkinAnalysis): ProductNeed[]
    
    // 2. Calcul du budget par catégorie
    calculateBudgetDistribution(totalBudget: number, needs: ProductNeed[]): BudgetAllocation
    
    // 3. Sélection par catégorie avec contraintes
    selectByCategory(category: string, budget: number, concerns: string[]): Product[]
    
    // 4. Optimisation globale de la routine
    optimizeRoutineBudget(products: Product[], maxBudget: number): OptimizedRoutine
    
    // 5. Logique de fallback intelligent (pas de vide !)
    handleEdgeCases(needs: ProductNeed[], budget: number): FallbackStrategy
  }
  ```
- [ ] **Logique de priorisation :**
  - **Critères primaires :** Correspondance problème détecté → catégorie produit
  - **Critères budgétaires :** Répartition intelligente selon importance du besoin
  - **Alternatives dynamiques :** Si budget insuffisant → baumes/alternatives économiques
  - **Escalade qualité :** Si budget élevé → produits premium ciblés

### **Sprint 3.3 : Interface Admin & Tracking (2-3 jours)**
- [ ] **Dashboard admin complet :**
  ```typescript
  src/app/admin/
  ├── dashboard/page.tsx (métriques globales)
  ├── products/ (gestion catalogue)
  ├── analytics/ (performance produits)
  └── recommendations/ (logs et optimisation)
  ```
- [ ] **Analytics produits :**
  - Tracking des recommandations par catégorie
  - Taux de conversion par type de produit
  - Performance budgétaire (panier moyen vs budget déclaré)
  - Identification des gaps dans le catalogue
- [ ] **Outils de curation :**
  - Import/export catalogue
  - Tests A/B sur les recommandations
  - Notifications de stocks faibles

---

## **PHASE 4 : ANALYTICS & OPTIMISATION**
### *Durée : 1-2 semaines*

### **Sprint 4.1 : Analytics Complètes (1 semaine)**
- [ ] **Configuration GA4 avancée :**
  ```typescript
  // Fichiers à créer :
  - src/lib/analytics/gtag.ts
  - src/lib/analytics/events.ts
  - src/hooks/useAnalytics.ts
  ```
- [ ] **Events tracking :**
  - Parcours utilisateur complet
  - Funnels d'acquisition et conversion
  - Heatmaps (Hotjar/Microsoft Clarity)
- [ ] **Dashboard admin :**
  - Métriques temps réel
  - Analyse de cohortes
  - Rapports de rétention

### **Sprint 4.2 : Performance & PWA (3-4 jours)**
- [ ] **Optimisation frontend :**
  - Audit Lighthouse complet
  - Code splitting avancé
  - Préchargement intelligent
  - Service Worker pour PWA
- [ ] **Optimisation backend :**
  - Cache Redis pour requêtes fréquentes
  - Compression assets
  - Monitoring APIs

---

## **PHASE 5 : SÉCURITÉ & TESTS**
### *Durée : 1 semaine*

### **Sprint 5.1 : Sécurité Renforcée (4 jours)**
- [ ] **Protection des données :**
  - Audit sécurité complet
  - Headers de sécurité (CSP, HSTS)
  - Validation stricte (Zod schemas)
  - Chiffrement données sensibles
- [ ] **Authentification robuste :**
  - 2FA optionnel
  - Protection brute force
  - Session management sécurisé
  - Logs de sécurité

### **Sprint 5.2 : Tests Automatisés (3 jours)**
- [ ] **Suite de tests :**
  ```typescript
  - __tests__/ (Jest + React Testing Library)
  - e2e/ (Playwright pour tests end-to-end)
  - cypress/ (tests d'intégration)
  ```
- [ ] **CI/CD Pipeline :**
  - GitHub Actions pour tests automatiques
  - Preview deployments Vercel
  - Monitoring avec Sentry

---

## **PHASE 6 : LANCEMENT & GO-LIVE**
### *Durée : 1 semaine*

### **Sprint 6.1 : Préparation Lancement (3 jours)**
- [ ] **SEO & Content :**
  - Meta tags optimisés
  - Sitemap dynamique
  - Pages légales (CGU, confidentialité)
  - Schema.org markup
- [ ] **Onboarding utilisateur :**
  - Tour guidé nouveaux utilisateurs
  - Emails de bienvenue
  - Tutoriels intégrés
  - FAQ dynamique

### **Sprint 6.2 : Déploiement Production (2 jours)**
- [ ] **Configuration production :**
  - Vercel Pro avec domaine personnalisé
  - Variables d'environnement sécurisées
  - CDN global configuration
  - Backup automatique DB
- [ ] **Go-live & monitoring :**
  - Déploiement avec rollback plan
  - Tests smoke production
  - Support 24/7 première semaine
  - Collection feedback utilisateur

### **Sprint 6.3 : Optimisation Post-Lancement (2 jours)**
- [ ] **Analyse & itération :**
  - Métriques d'adoption
  - Optimisation taux conversion
  - Corrections bugs critiques
  - Planification features futures

---

## 🎯 **FONCTIONNALITÉS SUPPLÉMENTAIRES HIGH-VALUE**

### **Coach IA Personnel** *(Priorité 1 - 1 semaine)*
```typescript
// Fichiers à créer :
src/services/ai/coach.service.ts
src/components/chat/AICoach.tsx
src/hooks/useAICoach.ts
```
- Chatbot conversationnel intégré
- Conseils basés sur l'évolution
- Rappels intelligents
- Réponses contextuelles

### **Gamification** *(Priorité 2 - 3-4 jours)*
```typescript
// Système de points et badges
src/services/gamification/
├── points.service.ts
├── badges.service.ts
└── leaderboard.service.ts
```
- Points fidélité analyses régulières
- Badges de progression
- Récompenses et réductions

### **Export PDF Avancé** *(Priorité 3 - 1 semaine)*
```typescript
src/services/pdf/
├── report-generator.service.ts
├── templates/
└── assets/
```
- Rapports avec graphiques
- Branding professionnel
- Historique évolution
- Partage médical

---

## 📊 **MÉTRIQUES DE SUCCÈS À TRACKER**

### **Acquisition**
- Inscriptions quotidiennes/mensuelles
- Taux conversion visiteur → inscription : **>15%**
- CAC (Coût Acquisition Client) : **<10€**
- Complétion premier diagnostic : **>80%**

### **Engagement**
- Rétention D1/D7/D30 : **70%/40%/25%**
- Analyses moyennes par utilisateur : **>3**
- Temps session dashboard : **>5min**
- Utilisation recommandations : **>60%**

### **Monétisation**
- Revenus affiliation mensuels : **>1000€** (objectif 3 mois)
- Conversion produits recommandés : **>8%**
- Panier moyen : **>30€**
- LTV utilisateur : **>50€**

### **Qualité**
- NPS (Net Promoter Score) : **>50**
- Précision analyses IA : **>90%**
- Temps chargement pages : **<2s**
- Taux bugs critiques : **<1%**

---

## ⚡ **RESSOURCES & BUDGET ESTIMÉ**

### **Services Cloud** *(~100€/mois)*
- Supabase Pro : 25€/mois (100GB storage)
- Vercel Pro : 20€/mois (unlimited bandwidth)
- OpenAI API : 50-200€/mois (selon usage)
- Redis Cloud : 10€/mois (1GB cache)
- Sentry Pro : 26€/mois (error tracking)

### **APIs Tierces** *(gratuit puis commission)*
- Programmes d'affiliation (0€ setup)
- Google Analytics 4 (gratuit)
- Hotjar/Clarity (gratuit jusqu'à 10k sessions)

### **Outils Dev** *(optionnel)*
- Figma Pro : 12€/mois
- Linear/Notion : 8€/mois
- GitHub Copilot : 10€/mois

---

## 🚀 **STRATÉGIES DE PRIORISATION**

### **MVP Viable (6 semaines) - Version Bêta**
1. ✅ Phase 1 : Authentification + Storage
2. ✅ Phase 2 : Dashboard basique + Historique
3. ✅ Phase 3 : Affiliation basique
4. ✅ Phase 6 : Lancement soft (utilisateurs invités)

### **Version Complète (10 semaines) - Version Publique**
MVP + Phase 4 (Analytics) + Phase 5 (Sécurité) + Features high-value

### **Version Premium (15 semaines) - Scale**
Version complète + Marketplace + IA avancée + APIs publiques

---

## 📋 **CHECKLIST DE VALIDATION PAR PHASE**

### **Phase 1 - Ready ✓**
- [ ] Utilisateur peut créer un compte et se connecter
- [ ] Photos sont sauvegardées en cloud de manière sécurisée
- [ ] Analyses sont persistées en base de données
- [ ] Mode invité reste fonctionnel en parallèle
- [ ] Tests unitaires authentification passent

### **Phase 2 - Ready ✓**
- [ ] Dashboard affiche l'historique complet des analyses
- [ ] Comparaisons entre analyses fonctionnent
- [ ] Export PDF d'une analyse individuelle
- [ ] Paramètres utilisateur modifiables
- [ ] Navigation dashboard responsive
- [ ] **BONUS :** Routine unifiée sans section "zones à surveiller" séparée

### **Phase 3 - Ready ✓**
- [ ] Au moins 2 APIs d'affiliation connectées
- [ ] Recommandations personnalisées fonctionnelles
- [ ] Tracking des clics d'affiliation
- [ ] Cache des produits opérationnel
- [ ] Fallback sur catalogue statique

### **Phase 4 - Ready ✓**
- [ ] GA4 configuré avec events personnalisés
- [ ] Dashboard analytics admin fonctionnel
- [ ] PWA installable sur mobile
- [ ] Lighthouse score >90
- [ ] Temps de chargement <2s

### **Phase 5 - Ready ✓**
- [ ] Audit sécurité validé (headers, CSP, etc.)
- [ ] Tests E2E passent sur parcours critiques
- [ ] Monitoring erreurs configuré
- [ ] Plan de rollback testé
- [ ] Documentation technique complète

### **Phase 6 - Ready ✓**
- [ ] Domaine production configuré avec SSL
- [ ] Variables d'environnement production
- [ ] Monitoring temps réel opérationnel
- [ ] Support utilisateur préparé
- [ ] Métriques de succès tracking

---

## 🎯 **NEXT STEPS IMMÉDIATS**

### **Semaine 1 : Démarrage**
1. **Jour 1-2 :** Configuration Supabase + NextAuth.js
2. **Jour 3-4 :** Migration stockage IndexedDB → Cloud
3. **Jour 5 :** Tests et validation Phase 1

### **Semaine 2 : Dashboard**
1. **Jour 1-3 :** Architecture et composants dashboard
2. **Jour 4-5 :** Historique analyses + APIs

### **🎯 FONCTIONNALITÉS CLÉS PHASE 2 : DASHBOARD**

**1. Routine Tracker avec Calendrier** ✅
- Vue mensuelle avec indicateurs visuels (complet/partiel/manqué)
- Tracking simple par phase (matin/soir) avec un clic
- Calcul automatique des streaks avec récompenses visuelles
- Statistiques détaillées (taux complétion, meilleur streak)

**2. Étagères Produits Intelligentes** ✅
- Organisation drag & drop intuitive
- Double logique : étagères personnalisées + liées aux analyses
- Ajout de produits personnels hors catalogue
- Suggestions de mise à jour après nouvelle analyse

**3. Comparaison d'Analyses Visuelle** ✅
- Slider interactif avant/après pour les photos
- Graphiques de progression des scores (radar + bar charts)
- Sélection libre parmi toutes les analyses
- Export PDF avec comparaisons

**4. Coach IA Contextuel** ✅
- Chat modal accessible partout dans le dashboard
- Contexte intelligent : profil + routine + analyses + produits
- Suggestions de produits intégrées aux réponses
- Historique des conversations sauvegardé

**5. Gamification par Badges Symboliques** ✅
- 4 catégories : routine, analyses, amélioration, découverte
- 4 niveaux par catégorie (bronze, argent, or, platine)
- Notifications animées lors du déblocage
- Objectifs stricts pour motivation (7, 30, 90, 365 jours)

> **Impact attendu :** Engagement quotidien, rétention >50% à J7, >30% à J30

Ce planning est conçu pour être itératif et adaptatif. Chaque sprint peut être ajusté selon les retours utilisateur et les contraintes techniques. L'objectif principal est d'avoir une version bêta fonctionnelle en 6 semaines, puis d'optimiser rapidement vers la version publique.
