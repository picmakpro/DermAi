# Spécifications Fonctionnelles et Techniques de DermAI V2

## 1. Vue d'ensemble

DermAI V2 est une application web de diagnostic dermatologique basée sur l'intelligence artificielle. Elle a pour but de fournir aux utilisateurs une analyse personnalisée de leur skincare (vsiage), des recommandations de produits et une routine de soins sur mesure. L'application se distingue par son approche en 4 étapes pour le diagnostic, sa forte personnalisation et son potentiel de monétisation via l'affiliation et abonnement.

## 2. Architecture Technique

### 2.1. Stack Technologique

**Frontend**
- **Framework:** Next.js 15 (avec App Router), React 19, TypeScript
- **Styling:** Tailwind CSS avec un thème personnalisé
- **Animations:** Framer Motion
- **Validation de données:** Zod
- **Gestion de formulaires:** React Hook Form

**Backend & Authentification**
- **Authentification:** NextAuth.js (email/password + OAuth Google/Apple)
- **Base de données:** Supabase (PostgreSQL avec Row Level Security)
- **Stockage fichiers:** Supabase Storage (photos utilisateurs)
- **Cache:** Redis Cloud (cache des recherches produits)

**IA & APIs Externes**
- **IA:** OpenAI GPT-4o Vision API
- **Affiliation:** Amazon Product Advertising API (2000+ produits)
- **Analytics:** Google Analytics 4 + Enhanced Ecommerce
- **Monitoring:** Sentry (error tracking), Vercel Analytics

**Stockage & Données**
- **Stockage cloud:** Supabase (analyses, profils utilisateurs, catalogue produits scalable)
- **Stockage local:** IndexedDB (cache offline), SessionStorage (session)
- **Compression:** LZ-String (partage de résultats)

### 2.2. Architecture Catalogue Produits (Scaling V2)

**⚠️ IMPORTANT** : Voir documentation détaillée → **`/docs/architecture/README-SCALING-V2.md`**

**Pipeline Import Produits** :
```
Amazon Product Advertising API (2000+ produits)
  ↓
GPT-4o-mini Enrichment ($0.33 total)
  ↓
Supabase PostgreSQL (stockage scalable)
  ↓
ProductDatabaseLoaderV2 (cache 1h par careType)
  ↓
ProductMatcherV2 (scoring 5 critères dont 35% ingrédients)
  ↓
Sélection optimale (8-10 alternatives par step)
```

**Taxonomie careType V2** : 10 types spécialisés
- Base : `nettoyage`, `tonification`, `hydratation`, `protection`, `exfoliation`, `masque`
- Traitements : `anti-age`, `eclat`, `traitement-cible`, `apaisement`

**Scoring Produits V2** : 5 critères pondérés
- 35% Compatibilité ingrédients × type de peau (🆕 NOUVEAU)
- 30% Alignement problématique (vs 40% avant)
- 20% Qualité dermatologique (vs 30% avant)
- 10% Prix (vs 20% avant)
- 5% Popularité (vs 10% avant)

**Métriques Cibles** :
- Catalogue : 110 → **2000+ produits** (+1718%)
- Couverture profils : 75% → **95%** (+27%)
- Matching scores : 60-70 → **70-85** (+15%)
- Alternatives par step : 3 → **8-10** (+233%)
- Anomalies zones : 2-3% → **0%** (-100%)

**Conformité Légale** : ✅ Programme Partenaires Amazon
- Divulgation partenaire obligatoire affichée
- Liens d'affiliation avec tag correct
- Mise à jour prix quotidienne (<24h)
- Cache produits <7 jours (conformité API)
- Voir détails → **`/docs/architecture/AMAZON-LEGAL-COMPLIANCE.md`**

### 2.2. Structure du Projet

```
/src
|-- /app
|   |-- /api
|   |   |-- /auth/[...nextauth]/route.ts
|   |   |-- /analyze/route.ts
|   |   |-- /analyses/route.ts (CRUD utilisateur)
|   |   |-- /affiliate/route.ts (tracking)
|   |-- /auth (signin/signup)
|   |-- /dashboard
|   |   |-- layout.tsx (sidebar navigation)
|   |   |-- page.tsx (vue d'ensemble)
|   |   |-- /analyses (historique)
|   |   |-- /progress (évolution)
|   |   |-- /settings (paramètres)
|   |-- /admin (analytics, métriques)
|   |-- /analyze
|   |-- /questionnaire
|   |-- /results
|   |-- /upload
|   |-- layout.tsx
|   |-- page.tsx
|-- /components
|   |-- /ui (composants de base)
|   |-- /shared (composants réutilisables)
|   |-- /dashboard (composants dashboard)
|   |-- /auth (formulaires authentification)
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




## 3. Spécifications Fonctionnelles

### 3.1. Parcours Utilisateur

1.  **Landing Page (`/`)**: Présentation de l'application, de ses avantages et un appel à l'action pour commencer le diagnostic.
2.  **Upload de Photos (`/upload`)**: Interface pour téléverser plusieurs photos du visage sous différents angles.
3.  **Questionnaire (`/questionnaire`)**: Parcours interactif en 7 étapes incluant 3 écrans plein écran :
    - **Écran d'introduction avant/après** : Présentation des bénéfices avec visuel de comparaison 30 jours
    - **Profil personnel** : Âge, genre, type de peau
    - **Préoccupations cutanées** : Sélection des problèmes principaux (max 3)
    - **Écran de preuve sociale** : Rassurance avec statistiques d'utilisateurs similaires
    - **Routine actuelle** : Produits utilisés matin/soir (optionnel)
    - **Allergies et sensibilités** : Ingrédients à éviter (optionnel)
    - **Écran d'économies** : Visualisation des économies potentielles avec progression
    - **Finalisation** : Type de routine souhaitée et budget
4.  **Analyse (`/analyze`)**: Page de chargement pendant que l'IA analyse les données.
5.  **Résultats (`/results`)**: Affichage détaillé du diagnostic, des scores, de la routine de soins et des produits recommandés.

### 3.2. Fonctionnalités Détaillées

- **Diagnostic en 4 étapes optimisé**: 
    1.  Analyse visuelle par GPT-4o pour un diagnostic objectif et détaillé.
    2.  Sélection intelligente de produits via moteur interne (zéro fallback générique).
- **Parcours utilisateur optimisé** :
    - **Écrans plein écran immersifs** : 3 écrans dédiés pour l'engagement et la réassurance
    - **Preuve sociale intégrée** : Statistiques d'utilisateurs similaires pour rassurer
    - **Visualisation des économies** : Comparaison avant/après des dépenses cosmétiques
    - **Progression claire** : Indicateur visuel et numérique du progrès
- **Scores Détaillés**: Notation sur 100 pour 8 critères de santé de la peau (hydratation, rides, etc.).
- **🔬 Routine 3 Phases Dermatologique V3** (REFONTE COMPLÈTE):
    - **Architecture Onglets Phase → Slots** : Chaque phase contient Matin/Soir/Hebdomadaire
    - **Phase Immédiate (1–3 semaines)** : Stabiliser + traiter urgent, dictée par traitements temporaires
    - **Phase Adaptation (4–6 semaines)** : Introduction progressive actifs selon tolérance
    - **Phase Maintenance (continu)** : Maintenir acquis + prévention rechutes
    - **Affichage par horaire** : Organisation claire Matin/Soir/Hebdo dans chaque phase
    - **Produits continus** : Pas de badge "Continu", titres simples ("Nettoyage", "Hydratation matin")
    - **Traitements temporaires** : Métadonnées obligatoires (intro semaine X, durée, fréquence)
    - **Hebdomadaire étendu** : Tous les items ≥ hebdo (pas seulement exfoliants/masques)
- **🎓 Interface Éducative V3** (ENRICHIE):
    - **Éducation par phase** : Objectifs et progressivité explicites
    - **Badges éducatifs** : Observe/Duration/Objective pour traitements
    - **Sections pédagogiques** : Instructions, restrictions, zones ciblées par item
    - **Variantes design** : Clinical/Glow/Editorial (A/B/C) avec tokens DermAI
    - **Mobile-first** : Slots sticky, navigation tactile optimisée
- **Catalogue Interne Curatifé**: Base de données produits soigneusement sélectionnés par qualité et efficacité
- **Moteur de Recommandations Avancé**: 
    - Algorithme intelligent sans recommandations "vides"
    - Filtrage automatique produits génériques/fallback
    - Regroupement intelligent par catalogId
- **Assistant IA**: Un chatbot pour répondre aux questions de l'utilisateur sur son diagnostic.
- **Analytics intégrées** : Suivi des interactions utilisateur et performance des recommandations.

## 4. IA et Machine Learning

### 4.1. Architecture IA Hybride (Refonte V2.5 - Octobre 2025)

- **Modèle**: GPT-4o Vision avec configuration déterministe (température 0.0)
- **Logique 4 Étapes Optimisée**:
  - **ÉTAPE 1**: Diagnostic visuel pur (IA OpenAI) avec validation Zod stricte
  - **ÉTAPE 2**: Routine personnalisée (IA OpenAI) basée sur diagnostic + profil
  - **ÉTAPE 3**: 🔄 **HYBRIDE IA + ALGO** - Architecture refondée pour fiabilité 100%
    - **Micro-IA** : Mapping conceptuel léger (500 tokens, 2s par step)
    - **Database** : Catalogue enrichi avec métadonnées dermatologiques
    - **Algorithme** : Sélection déterministe TypeScript (scoring multi-critères)
    - **Garanties** : 1 produit + 3 alternatives par step, 0% "non spécifié"
  - **ÉTAPE 4**: Assemblage et validation (algorithmique) pour cohérence finale
- **Prompts**: Prompts spécialisés par étape avec chaînage des outputs
- **Personnalisation**: 95% de routines différentes pour diagnostics différents
- **Performance**: Step 3 < 5s (vs 15-20s avant), -88% coûts tokens

### 4.2. Fiabilité et Déterminisme V2

- **Reproductibilité**: Seed basé sur hash des images pour résultats identiques
- **Validation Multi-Étapes**: Schémas Zod spécialisés pour chaque étape IA
- **Gestion d'erreurs**: Retry intelligent par étape avec fallback progressif
- **Cohérence Garantie**: Validation croisée diagnostic → routine → produits
- **Cache Intelligent**: Multi-niveaux pour optimiser coûts et performance
- **Monitoring Avancé**: Métriques de personnalisation et cohérence temps réel

## 5. Gestion des Données

### 5.1. Architecture de Stockage Hybride

**Stockage Cloud (Utilisateurs Connectés)**
- **Photos utilisateurs**: Supabase Storage avec compression et chiffrement
- **Analyses et diagnostics**: Base de données Supabase avec Row Level Security
- **Profils utilisateurs**: Métadonnées et préférences en base sécurisée
- **Historique et évolution**: Tracking des progrès avec comparaisons temporelles

**Stockage Local (Mode Invité + Cache)**
- **Cache offline**: IndexedDB pour fonctionnement hors ligne
- **Session temporaire**: SessionStorage pour utilisateurs non connectés
- **Optimisation performance**: Cache local des résultats d'API

### 5.2. Sécurité et Confidentialité

**Protection des Données Sensibles**
- Row Level Security (RLS) Supabase pour isolation des données utilisateur
- Chiffrement des photos avant stockage cloud
- Tokens JWT sécurisés pour l'authentification
- Audit trail des accès aux données personnelles

**Conformité RGPD**
- Consentement explicite pour stockage cloud
- Droit à l'effacement (suppression complète des données)
- Export des données personnelles en format portable
- Anonymisation des analytics et métriques

### 5.3. Partage et Interopérabilité

- **Partage sécurisé**: URLs temporaires avec tokens d'accès limités
- **Export PDF**: Rapports complets avec branding professionnel
- **Compression intelligente**: LZ-String pour optimiser les partages
- **APIs futures**: Endpoints pour intégration avec systèmes tiers

## 6. UI/UX

- **Design**: Esthétique de laboratoire propre et moderne avec des animations subtiles.
- **Palette de couleurs**: Dominance de blanc et de beige avec des accents de bleu/violet pour l'IA.
- **Responsive**: L'application est conçue pour être entièrement fonctionnelle et esthétique sur mobile et sur ordinateur.

## 7. Amélioration Continue et Optimisations

### 7.1 Refonte Routine UI V3 (En cours) 🔥 **REFONTE MAJEURE**

**Objectif** : Reconstruction complète de la section "Routine personnalisée" avec architecture onglets Phase → Slots et intégration de la Preview finale.

**Transformation UX** :
- **Avant** : Liste linéaire par phase avec badges "Continu"
- **Après** : Onglets Phase → Slots (Matin/Soir/Hebdomadaire) avec métadonnées riches

**Documentation associée** :
- `docs/planning-execution-refonte-routine-ui-v3.md` - **Plan d'exécution complet**
- `docs/preview-routine-perso-section` - Preview finale de référence (fait foi)

**Règles d'affichage strictes** :
- **Produits continus** : Titres simples, jamais de badge "Continu"
- **Traitements temporaires** : Métadonnées obligatoires (intro/durée/fréquence)
- **Hebdomadaire étendu** : Tous les items ≥ hebdo (pas seulement exfoliants)
- **Mobile-first** : Slots sticky, navigation tactile, 3 variantes design

**Architecture technique** :
- **Types stricts** : `AiRoutineOutput` avec validation Zod
- **Mapper pur** : Zéro inférence métier, logs champs manquants
- **Prompts ajustés** : Garantir champs requis sans changer logique clinique

### 7.8. Plan Amélioration V2.5 - Page Résultats (Octobre 2025)

**🎯 Objectif Global** : Finaliser la page Résultats à 100% avant toute autre feature (Dashboard, etc.)

**Documentation complète** :
- 📁 `docs/plan-execution-v2-5/` - **Dossier complet avec 12 fichiers détaillés**
  - `00-INDEX-GENERAL.md` - Vue d'ensemble et timeline
  - `01-NETTOYAGE-PIPELINE.md` - Phase 0 : Nettoyage (2h)
  - `02-CORRECTION-STEP3-PRODUITS.md` - Phase 1 : Step 3 (1 jour)
  - `03-AMELIORATION-UI-RESULTATS.md` - Phase 2 : UI/UX (1.5 jours)
  - `04-RECAP-UTILISATEUR.md` - Phase 3 : Récap utilisateur (0.5 jour)
  - `05-TESTS-VALIDATION.md` - Phase 4 : Tests & validation (0.5 jour)
  - `06-DASHBOARD-PHASE2.md` - Phase 5 : Dashboard (1-2 semaines, optionnel)
  - `PIPELINE-VALIDEE.md` - Architecture pipeline validée
  - `RAPPORT-NETTOYAGE.md` - Rapport Phase 0 (terminée)
  - 🔥 `REFONTE-STEP3-HYBRIDE.md` - **Architecture hybride IA + Algo (EN COURS)**
  - `README.md` + `QUICKSTART.md` - Guides d'utilisation

**Problèmes Identifiés** :
- ❌ **Step 3 instable** : "produits non spécifiés", pas d'alternatives, pas de score matching
- ❌ **JSON incomplet** : 5 produits générés au lieu de 15-20 (routines complexes non couvertes)
- ❌ **Limite architecture monolithique** : Token limit OpenAI atteint, latence élevée (15-20s)
- ❌ **Incohérence schéma ↔ prompt** : 4 versions schémas concurrentes, double pipeline transformation
- ❌ **Badges UI surchargés** : Tous badges affichés (timing, SPF, contours) → surcharge visuelle

**Solutions Implémentées** :
- ✅ **Phase 0 : Nettoyage pipeline** (2h) - Archivage schémas obsolètes, pipeline unique V3, build stable
- ✅ **Phase 1 : Debug Step 3** (3h) - Identification problème JSON (markdown wrapping), nettoyage robuste
- ✅ **Diagnostic architectural** - Approche monolithique IA pure = limite atteinte
- 🚧 **Refonte hybride Step 3** (EN COURS) - Architecture IA + Algo pour fiabilité 100%

**Architecture Hybride Step 3 (Refonte actuelle)** :
- **Principe** : "IA pour comprendre, Algo pour exécuter"
- **Micro-IA** : Mapping conceptuel léger (500 tokens vs 4000+ avant)
- **Database** : Catalogue enrichi avec métadonnées (careType, concerns, ingredients)
- **Algorithme TypeScript** : Scoring multi-critères déterministe (<100ms par produit)
- **Garanties** : 100% complétude, 1 produit + 3 alternatives par step, 0% "non spécifié"
- **Performance** : <5s total (vs 15-20s avant), -88% coûts tokens, 99% fiabilité

**Métriques de Succès V2.5** :
- 🎯 100% complétude (tous steps couverts, 0 "produit non spécifié")
- 🎯 3 alternatives minimum par produit
- 🎯 Performance Step 3 < 5s (pour routine 20 steps)
- 🎯 Coût < 1000 tokens Step 3 (-88%)
- 🎯 0% erreur JSON parsing (algo déterministe)
- 🎯 Respect budget ±10%

**Timeline** :
- ✅ **Phase 0** : Nettoyage pipeline (2h) - TERMINÉE
- ✅ **Phase 1A-C** : Debug Step 3 JSON (3h) - TERMINÉE
- 🚧 **Phase 1D** : Refonte hybride (5h) - EN COURS
- 📋 **Phases 2-4** : UI + Récap + Tests (2.5 jours) - PLANIFIÉ
- 📋 **Phase 5** : Dashboard (1-2 semaines, optionnel) - APRÈS VALIDATION

**Statut** : 🚧 EN COURS - Phase 1D (Refonte hybride Step 3)  
**Branche** : `refonte-step3-hybride-ia-algo`  
**Sauvegarde** : `sauvegarde-app-complete-2025-09-30` (commit `7aa0d98`)

## 8. Roadmap et Planning Détaillé

### 8.1. État Actuel (Janvier 2025)
- ✅ Architecture Next.js 15 + TypeScript + Tailwind CSS
- ✅ Interface d'upload professionnel avec validation
- ✅ Questionnaire interactif en 7 étapes (3 écrans plein écran)
- ✅ Intégration GPT-4o Vision pour diagnostic IA
- ✅ Page de résultats avec scores détaillés (8 paramètres)
- ✅ **Routine 3 Phases Dermatologique** : Logique complète respectant cycle cellulaire
- ✅ **Interface Éducative** : Durées personnalisées + info-bulles + badges temporels
- ✅ **Filtrage Intelligent** : Suppression automatique produits génériques
- ✅ **Numérotation Cohérente** : 1,2,3 par phase au lieu de 100,200
- ✅ **Transition Produits** : Base durable vs traitements temporaires
- ✅ **Critères Visuels** : "Jusqu'à cicatrisation" remplace timing arbitraire
- ✅ Système de partage viral avec export d'images
- ✅ Stockage local : IndexedDB + SessionStorage
- ✅ Catalogue d'affiliation basique (JSON statique)
- ⚠️ NextAuth.js et Supabase installés mais non configurés

### 7.2. Planning de Développement (6-10 semaines)

**REFONTE ROUTINE UI V3 - EN COURS** ⚡
- 📋 **Planning détaillé** : `docs/planning-execution-refonte-routine-ui-v3.md`
- 🎯 **Objectif** : Architecture onglets Phase → Slots (Matin/Soir/Hebdo)
- 🎨 **Preview finale** : Intégration variantes A/B/C (Clinical/Glow/Editorial)
- 🔧 **Mapping pur** : Front ne fait que mapper, zéro inférence métier
- 📅 **Durée** : 9-11 jours (4 sprints)

**PHASE 1 : Authentification & Cloud Storage (1-2 semaines)** ⚡ **EN COURS**
- ✅ Configuration Supabase avec tables utilisateurs et analyses
- ✅ Services CloudStorage et Migration implémentés
- ✅ API routes de test fonctionnelles
- 🔄 Implémentation NextAuth.js (email/password + OAuth Google)
- 🔄 Migration du stockage local vers cloud sécurisé
- 🔄 Protection des routes et gestion des sessions

**PHASE 2 : Dashboard Utilisateur (3-4 semaines)** 📋 **PLANIFIÉ**
- ✅ Architecture dashboard définie avec sidebar responsive et widgets temps réel
- ✅ Historique analyses avec comparaison slider avant/après
- ✅ Routine tracker avec calendrier mensuel et calcul de streaks
- ✅ Étagères produits drag & drop (internes + personnalisés)
- ✅ Coach IA contextuel avec GPT-4o et suggestions produits
- ✅ Système de badges symboliques motivants (4 catégories)
- ✅ Paramètres complets avec conformité RGPD

**PHASE 3 : Catalogue Produits Interne & Monétisation (2-3 semaines)**
- Base de données produits interne soigneusement curatée
- Moteur de sélection IA intelligent avec zéro fallback générique
- Logique d'optimisation budgétaire et alternatives économiques
- Interface admin de gestion et analytics de performance produits

**PHASE 4 : Analytics & Optimisation (1-2 semaines)**
- Configuration Google Analytics 4 complète
- Dashboard admin avec métriques de conversion
- Optimisation PWA et performances (Lighthouse >90)
- Heatmaps et analyse de parcours utilisateur

**PHASE 5 : Sécurité & Tests (1 semaine)**
- Audit sécurité et headers de protection
- Suite de tests automatisés (Jest + Playwright)
- Pipeline CI/CD avec GitHub Actions
- Monitoring erreurs avec Sentry

**PHASE 6 : Lancement Production (1 semaine)**
- Optimisation SEO et pages légales
- Déploiement Vercel Pro avec domaine personnalisé
- Onboarding utilisateur et support
- Monitoring intensif post-lancement

### 7.3. Fonctionnalités Futures Prioritaires

**Coach IA Personnel (post-lancement)**
- Chatbot conversationnel intégré au dashboard
- Conseils personnalisés basés sur l'évolution
- Rappels intelligents et notifications

**Système de Gamification**
- Points de fidélité et badges de progression
- Récompenses sous forme de réductions
- Classements communautaires (optionnels)

**Export PDF Avancé**
- Rapports détaillés avec graphiques d'évolution
- Branding professionnel pour partage médical
- Historique complet sur 6-12 mois

**Marketplace Intégrée**
- Vente directe avec marges élevées
- Partenariats exclusifs avec marques
- Programme de fidélité avancé




## 8. Améliorations de Sécurité, Robustesse et Cohérence

### 8.1. Sécurité

- **Protection des clés API**: Assurer que la clé OpenAI API n'est jamais exposée côté client. Utiliser des fonctions serverless (Next.js API Routes) pour toutes les interactions avec l'API OpenAI.
- **Gestion des données sensibles**: Bien que les photos soient stockées localement, envisager des options de chiffrement si des données sensibles devaient être stockées sur des serveurs à l'avenir (par exemple, pour l'historique des diagnostics).
- **Validation des entrées**: Renforcer la validation côté serveur pour toutes les entrées utilisateur (questionnaire, upload de photos) afin de prévenir les injections ou les données malformées.
- **Authentification sécurisée**: Pour les fonctionnalités futures nécessitant une authentification, utiliser des protocoles OAuth2/OpenID Connect avec des fournisseurs d'identité reconnus (ex: Auth0, NextAuth.js) et des tokens JWT sécurisés.

### 8.2. Robustesse et Fiabilité Opérationnelle

#### **8.2.1. Gestion d'Erreurs Avancée**
- **Retry Strategy**: Backoff exponentiel avec jitter pour OpenAI API (3 tentatives max)
- **Circuit Breaker**: Protection contre les cascades d'erreurs avec fallback automatique
- **Timeout Management**: Alignement client/serveur (30s client, 35s serveur)
- **Error Classification**: Retry intelligent selon type d'erreur (réseau vs validation)

#### **8.2.2. Monitoring et Observabilité**
- **Métriques Temps Réel**: Taux d'erreur, latence P95, cohérence diagnostic
- **Alerting Intelligent**: Seuils adaptatifs avec escalade automatique
- **Logging Structuré**: Corrélation des requêtes avec métadonnées contextuelles
- **Dashboard Opérationnel**: Visibilité complète sur santé système

#### **8.2.3. Tests et Validation**
- **Tests Unitaires**: Couverture >90% sur services critiques avec mocks déterministes
- **Tests d'Intégration**: Validation E2E avec données réelles anonymisées
- **Tests de Charge**: Simulation 100 analyses simultanées
- **Tests de Chaos**: Injection d'erreurs pour valider résilience

#### **8.2.4. Scalabilité et Performance**
- **Optimisation Mémoire**: Monitoring usage Vercel avec compression adaptative
- **Cache Intelligent**: Redis pour catalogue produits et résultats fréquents
- **CDN Assets**: Optimisation images et bundles JS
- **Database Optimization**: Index optimisés et requêtes préparées

### 8.3. Cohérence et Qualité des Données

#### **8.3.1. Validation et Schémas**
- **Schémas Zod**: Validation runtime stricte pour tous les inputs/outputs IA
- **Contrats API**: Interfaces TypeScript avec validation côté serveur
- **Cohérence Inter-Étapes**: Validation croisée diagnostic ↔ produits ↔ routine
- **Catalogue Validé**: Vérification temps réel de la disponibilité des produits

#### **8.3.2. Amélioration Continue**
- **Feedback Loop**: Collecte anonyme de satisfaction pour améliorer prompts
- **A/B Testing**: Tests de variantes de prompts avec métriques de qualité
- **Analyse de Cohérence**: Détection automatique d'incohérences dans les résultats
- **Optimisation Budgétaire**: Respect strict des contraintes financières utilisateur

#### **8.3.3. Accessibilité et Internationalisation**
- **WCAG 2.1 AA**: Conformité complète pour accessibilité
- **i18n Ready**: Architecture préparée pour multi-langues
- **Responsive Design**: Optimisation mobile-first avec PWA
- **Performance Web**: Core Web Vitals optimisés (LCP < 2.5s, FID < 100ms)

## 9. Documentation Technique de Référence

### 9.1. Plan V2.5 - Page Résultats (Octobre 2025) 🔥 **EN COURS**

**📁 [docs/plan-execution-v2-5/](./plan-execution-v2-5/)** - **Dossier complet (12 fichiers)** :
- `00-INDEX-GENERAL.md` - Vue d'ensemble plan V2.5
- `01-NETTOYAGE-PIPELINE.md` - Phase 0 : Nettoyage (✅ terminée)
- `02-CORRECTION-STEP3-PRODUITS.md` - Phase 1 : Step 3
- `03-AMELIORATION-UI-RESULTATS.md` - Phase 2 : UI/UX
- `04-RECAP-UTILISATEUR.md` - Phase 3 : Récap utilisateur
- `05-TESTS-VALIDATION.md` - Phase 4 : Tests & validation
- `06-DASHBOARD-PHASE2.md` - Phase 5 : Dashboard (optionnel)
- `PIPELINE-VALIDEE.md` - Architecture pipeline validée
- `RAPPORT-NETTOYAGE.md` - Rapport Phase 0 (✅ terminée)
- 🔥 **`REFONTE-STEP3-HYBRIDE.md`** - Architecture hybride IA + Algo (🚧 en cours)
- `README.md` + `QUICKSTART.md` - Guides utilisation

**Focus actuel** : Refonte Step 3 avec architecture hybride (IA + Algo) pour fiabilité 100%

### 9.2. Architecture et Logique Métier

**[architecture/fiabilite.md](./architecture/fiabilite.md)** - Architecture de fiabilité :
- Retry intelligent avec backoff exponentiel
- Fallback maîtrisé et mode dégradé
- Monitoring métriques temps réel
- Cache multi-niveaux et optimisation

**[domain/dermatological-logic.md](./domain/dermatological-logic.md)** - Logique dermatologique :
- Routine 3 phases (Immédiate, Adaptation, Maintenance)
- Cycle cellulaire et progressivité
- Traitements temporaires vs base durable
- Alternances et introductions progressives

**[ai/diagnostic-improvement-strategy.md](./ai/diagnostic-improvement-strategy.md)** - Stratégie amélioration IA :
- Optimisation prompts par étape
- Métriques de personnalisation
- A/B testing et itération continue

### 9.3. Business et Monétisation

**[business/monetization-strategy.md](./business/monetization-strategy.md)** - Stratégie monétisation :
- Affiliation produits (Amazon, Sephora, Douglas)
- Abonnement Premium avec coach IA
- Métriques revenus et conversion

### 9.4. UX et Interface

**[ux/educational-interface.md](./ux/educational-interface.md)** - Interface éducative :
- Badges pédagogiques (durée, observation, objectif)
- Tooltips explicatifs
- Progressive disclosure et guidage utilisateur

**[planning-execution-refonte-routine-ui-v3.md](./planning-execution-refonte-routine-ui-v3.md)** - 🔥 **Refonte UI V3** :
- Architecture onglets Phase → Slots (Matin/Soir/Hebdo)
- 3 variantes design (Clinical/Glow/Editorial)
- Mobile-first et accessibilité
- **Durée** : 9-11 jours (4 sprints)

### 9.5. Déploiement et Opérations

**[deployment/guide-deploiement-production.md](./deployment/guide-deploiement-production.md)** - Guide déploiement :
- Configuration environnements (staging/production)
- Variables d'environnement requises
- Checklist pré-déploiement

**[deployment/rollback-procedure.md](./deployment/rollback-procedure.md)** - Procédure rollback :
- Rollback rapide en cas d'incident
- Sauvegarde et restauration
- Tests post-rollback

**[operations/deployment-guide.md](./operations/deployment-guide.md)** - Guide opérationnel :
- Monitoring production (Sentry, Vercel Analytics)
- Alerting et incidents
- Maintenance préventive

**[operations/runbooks-incidents.md](./operations/runbooks-incidents.md)** - Runbooks incidents :
- Procédures d'intervention par type d'incident
- Escalade et contacts
- Post-mortem et amélioration continue

**[monitoring-guide.md](./monitoring-guide.md)** - Guide monitoring :
- Métriques clés (latence, erreurs, coûts IA)
- Dashboards et alertes
- SLO et SLI

### 9.6. Configuration

**[CONFIGURATION-FINALE-GPT4O.md](./CONFIGURATION-FINALE-GPT4O.md)** - Configuration OpenAI production :
- Température, seed, max_tokens par étape
- Retry et fallback
- Coûts et optimisation

**[configuration-gpt5-staging.md](./configuration-gpt5-staging.md)** - Configuration staging GPT-5 :
- Tests futurs GPT-5 (référence)
- Comparaison performances vs GPT-4o
- Hebdomadaire = tous ≥ hebdo (jamais badge "Continu")
- Temporaires : métadonnées obligatoires (intro/durée/fréquence)
- Performance Lighthouse > 90, Accessibilité WCAG AA
- Analytics instrumenté (6 events minimum)

### 9.7. Amélioration Section Routines V2 (HISTORIQUE - Septembre 2025) ✅ **TERMINÉ**

**Note** : Cette version V2 est remplacée par la refonte complète V3 ci-dessus.

**Réalisations V2** :
- ✅ Homogénéisation titres (Sprint 1) - 26 tests unitaires
- ✅ Déduplication intelligente (Sprint 2) - 18 tests unitaires  
- ✅ Phases explicites (Sprint 3) - 29 tests unitaires
- ✅ Rythme hebdomadaire (Sprint 4) - 31 tests unitaires
- **Total** : 104 tests unitaires, réduction 85% duplications UI

### 9.8. Règle de Développement
> **IMPORTANT** : La fiche technique évolutive est la référence officielle du projet. 
> Toute modification du code doit s'appuyer sur cette documentation.
> Mise à jour obligatoire après chaque sprint.
> 
> **REFONTE V3 EN COURS** : Suivre `docs/planning-execution-refonte-routine-ui-v3.md` pour tous développements routine.

## 10. Références

[1] Skincare AI Business Plan. (2025). Document fourni par l'utilisateur.
[2] Skincare AI Planning Secondaire. (2025). Document fourni par l'utilisateur.
[3] Résumé Très Détaillé de DermAI V2. (2025). Document fourni par l'utilisateur.
[4] Dépôt GitHub DermAI. (2025). [https://github.com/picmakpro/DermAi/tree/logique-2etapes-2025-08-24-03h18](https://github.com/picmakpro/DermAi/tree/logique-2etapes-2025-08-24-03h18)




### 6.1. Brand Guide DermAI

La brand guide de DermAI V2 définit une identité visuelle et un ton éditorial précis, visant à rendre les diagnostics skincare accessibles, fiables et élégants grâce à l’IA, en se positionnant à la croisée de la science dermatologique et de la beauté premium.

**6.1.1. Palette de Couleurs**

| Usage | Couleur | HEX |
|---|---|---|
| Fond principal | Blanc pur | `#FFFFFF` |
| Fond secondaire | Beige clair / nude | `#FDF9F7` |
| Texte principal | Noir doux | `#1A1A1A` |
| Texte secondaire | Gris neutre | `#6E6E6E` |
| Accent Beauté | Nude rosé | `#EAD9D1` |
| Accent IA | Violet futuriste | `#8F7BFF` |
| Accent Glow | Bleu électrique | `#5A4AE3` |
| Validation / Success | Vert doux | `#4ADE80` |
| Alert / Error | Rouge clair | `#EF4444` |

**Logique :**
- Base blanche + beige pour l’élégance clinique.
- Violet/bleu électrique pour le côté IA.
- Touches rosées pour rappeler la peau.

**6.1.2. Typographie**

-   **Titres / Branding :** `Neue Haas Grotesk` ou `Suisse Intl` (moderne, premium).
-   **Sous-titres / UI :** `Inter` (lisible et épuré).
-   **Accent IA / code / data :** `IBM Plex Mono` (facultatif pour chiffres, scores, résultats).

**6.1.3. Logo**

-   Minimaliste, lettre D stylisée avec un halo / glow violet.
-   Deux versions :
    -   Clair (sur fond blanc/beige).
    -   Inversé (blanc sur fond violet).

**6.1.4. Iconographie & Visuels**

-   **Icônes :** Outline fin, arrondis, cohérents. Style minimal et moderne, couleur violet en priorité.
-   **Illustrations :** Schémas épurés, silhouettes, visages abstraits.
-   **Photos :** Peaux naturelles, diversifiées, lumière douce. Style proche de Typology / Glossier (brut mais élégant).

**6.1.5. UI/UX**

-   **Layout :** Beaucoup de white space. Sections aérées avec hiérarchie claire.
-   **Cartes :** Flottantes, arrondies (radius 24-32px).
-   **Boutons :** Pills avec dégradés violet/bleu.
-   **CTA principal :** Dégradé violet → bleu électrique, texte blanc en bold (Exemple : Commencer l’analyse →).
-   **Animations :** Hover glow violet. Transitions douces (fade, slide-up). Effet de scan holographique sur photos.

**6.1.6. Ton Éditorial**

-   **Voix :** Experte mais bienveillante. Confiante, jamais anxiogène. Moderne et inclusive (pas genré, pas stigmatisant).
-   **Exemples :**
    -   ❌ "Votre peau est abîmée."
    -   ✅ "Votre peau montre des zones à optimiser pour plus d’éclat."
-   **Slogans possibles :**
    -   "Votre partenaire IA Beauté."
    -   "La science au service de votre éclat."
    -   "Un diagnostic, une routine, une peau transformée."

## 10. Déploiement et Production

### 10.1. Configuration Vercel

**Variables d'environnement requises :**
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

**Configuration vercel.json optimisée :**
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

### 10.2. Optimisations Appliquées

**Compression des images :**
- Compression agressive selon nombre de photos
- 1 photo : 1600x1600, 80% qualité
- 3+ photos : 800x800, 50% qualité
- Réduction payload de 85% pour éviter erreurs Vercel

**Configuration Serverless :**
- Timeout étendu à 30s pour l'analyse IA
- Mémoire augmentée à 1024MB
- Région US East pour latence optimale
- Gestion gracieuse des erreurs de payload

### 10.3. Monitoring et Tests

**Endpoint de test :**
`/api/test` - Validation configuration OpenAI et variables d'environnement

**Métriques surveillées :**
- Temps de réponse API analyse (<30s)
- Taux d'erreur payload (<1%)
- Performance compression images
- Utilisation mémoire serverless

### 10.4. Étapes de Déploiement

```bash
# 1. Build local pour vérifier
npm run build

# 2. Test avec Vercel CLI
vercel dev

# 3. Déploiement preview
vercel

# 4. Déploiement production  
vercel --prod

# 5. Test immédiat
curl https://votre-app.vercel.app/api/test
```

## 11. Documentation Architecture Détaillée

### 11.1. Scaling Catalogue & Architecture Ingrédients (V2)

**⚠️ DOCUMENTS CENTRAUX** : Tous situés dans `/docs/architecture/`

#### **Guide Démarrage** : `README-SCALING-V2.md`
📚 Guide complet de navigation et démarrage rapide
- Vue d'ensemble des 5 documents
- Checklist complète (10 semaines)
- Troubleshooting commun
- Ordre de lecture recommandé

#### **Plan Principal** : `MASTER-PLAN-SCALING-V2.md`
🎯 Vue d'ensemble stratégique complète
- Planning 10 semaines (5 phases)
- Architecture cible (Amazon → GPT-4 → Supabase → Matching)
- Métriques succès & ROI
- Risques & mitigation
- Budget total ($300/an)

#### **Taxonomie** : `CARETYPE-TAXONOMY-V2.md`
🏷️ Spécification complète 10 careTypes
- Évolution 6 → 10 types spécialisés
- Détail chaque type (ingrédients clés, concerns, safety)
- Script migration automatique
- Implémentation Zod + Prompts IA

#### **Scoring Ingrédients** : `INGREDIENT-SCORING-ARCHITECTURE.md`
🧬 Architecture scoring V2 (35% ingrédients)
- Formule détaillée 5 critères pondérés
- Database 200-300 ingrédients avec compatibilité × skinType
- Calculs compatibilité, safety, concentration, interactions
- Impact attendu (+15% précision)

#### **Database Scalable** : `SUPABASE-SCHEMA.md`
💾 Schema PostgreSQL optimisé
- Schema complet table `products` (2000+ produits)
- Index optimisés (GIN, composite)
- Queries optimisées (<100ms)
- Monitoring & sécurité RLS
- Sizing & performance

#### **Conformité Légale** : `AMAZON-LEGAL-COMPLIANCE.md`
⚖️ Analyse conformité Programme Partenaires Amazon
- ✅ Verdict : CONFORME (avec ajustements mineurs)
- Analyse détaillée conditions Amazon
- Obligations légales (divulgation, liens, cache 7j)
- Checklist conformité complète
- Risques & mitigation

---

### 11.2. Architecture Technique Actuelle

**Documents complémentaires** (déjà existants) :
- `docs/architecture/product-matching-analysis.md` - Analyse matching actuel (Phase D3)
- `docs/plan-execution-v2-5/REFONTE-STEP3-HYBRIDE.md` - Refonte hybride IA+Algo
- `docs/plan-execution-v2-5/SPRINT-D-REFONTE-HYBRIDE-EXECUTION.md` - Sprint D détaillé
- `docs/diagnostic-technique-refonte-ia-complete.md` - **RÉFÉRENCE OFFICIELLE** (obsolète après V2)

---

### 11.3. Timeline Implémentation Scaling V2

**Phase 0** (Sem 1) : ✅ **TERMINÉE** - Corrections actuelles (restrictedZones 110 produits)
**Phase 1** (Sem 2) : ✅ **TERMINÉE** - Migration taxonomie careType V2 (6 → 10 types)
**Phase 2** (Sem 3-4) : ✅ **TERMINÉE** - Migration Supabase (database scalable)
**Phase 3** (Sem 5-6) : 📋 **PROCHAINE** - Scoring ingrédients (35% du score)
**Phase 4** (Sem 7-9) : Import Amazon 2000 produits
**Phase 5** (Sem 10) : Production + monitoring

**Total** : **10 semaines** (2.5 mois)

#### Phase 0 : Rapport Détaillé (3 Oct 2025) ✅

**Durée** : 1 heure | **Coût** : $0 | **Statut** : TERMINÉ

- ✅ 110 produits enrichis avec `restrictedZones`
- ✅ 15 produits avec restrictions (13.6%) : AHA, BHA, Retinol, Niacinamide >5%
- ✅ 0 anomalie détectée (produits inadaptés zones lèvres/yeux)
- ✅ 8/8 tests de validation réussis
- ✅ Rapport complet : `docs/architecture/PHASE-0-RAPPORT.md`

#### Phase 1 : Rapport Détaillé (3 Oct 2025) ✅

**Durée** : 1 heure | **Coût** : $0 | **Statut** : TERMINÉ

- ✅ 110 produits migrés vers 10 careTypes spécialisés
- ✅ Distribution cohérente : hydratation (22), protection (16), tonification (12)
- ✅ Nouveaux types : anti-age (11), eclat (6), traitement-cible (6), apaisement (11)
- ✅ 18/18 tests de validation réussis
- ✅ Rapport complet : `docs/architecture/PHASE-1-RAPPORT.md`

#### Phase 2 : Rapport Détaillé (3 Oct 2025) ✅

**Durée** : 2 heures | **Coût** : $0 | **Statut** : TERMINÉ

- ✅ 110 produits migrés vers Supabase PostgreSQL (100% succès)
- ✅ Table `products` créée : 45 colonnes, 12 index optimisés, 2 triggers, RLS activé
- ✅ ProductDatabaseLoaderV2 avec cache 1h (latency cache <1ms)
- ✅ Feature flag `USE_SUPABASE_CATALOG` avec fallback automatique V2 → V1
- ✅ Architecture scalable prête pour 2000+ produits
- ✅ Performance : Cold start 929ms (acceptable Free Tier), cache <1ms
- ✅ Rapport complet : `docs/architecture/PHASE-2-RAPPORT.md`

---

## 12. Conclusion et Prochaines Étapes

DermAI V2 représente une évolution majeure du diagnostic dermatologique IA. L'approche en deux étapes (questionnaire + photos), la routine en 3 phases et la monétisation via affiliation créent un produit différenciant sur le marché. Les choix techniques (Next.js 15, Supabase, GPT-4o Vision) assurent performance et scalabilité.

**Prochaine Phase Critique** : Scaling du catalogue de 110 → 2000+ produits avec scoring ingrédients dermatologiques (voir section 11.1). Cette évolution permettra de passer de 75% → 95% de couverture des profils utilisateurs (+27%), avec une amélioration de +15% de la précision du matching grâce à la compatibilité ingrédients × type de peau.

La roadmap ambitieuse mais réaliste permet un développement itératif avec validation utilisateur à chaque étape, tout en respectant les contraintes légales du Programme Partenaires Amazon.

