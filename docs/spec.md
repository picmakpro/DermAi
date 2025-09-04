# Functional and Technical Specifications for DermAI V2

## 1. Overview

DermAI V2 is an AI-based dermatological diagnosis web application. It aims to provide users with personalized skin analysis, product recommendations and custom skincare routines. The application stands out through its two-step diagnostic approach, strong personalization and monetization potential via affiliate marketing.

## 2. Technical Architecture

### 2.1. Technology Stack

**Frontend**
- **Framework:** Next.js 15 (avec App Router), React 19, TypeScript
- **Styling:** Tailwind CSS avec un thème personnalisé
- **Animations:** Framer Motion
- **Validation de données:** Zod
- **Gestion de formulaires:** React Hook Form

**Backend & Authentication**
- **Authentication:** NextAuth.js (email/password + OAuth Google/Apple)
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
- **Compression:** LZ-String (results sharing)

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

- **Diagnostic en 2 étapes optimisé**: 
    1.  Analyse visuelle par GPT-4o pour un diagnostic objectif et détaillé.
    2.  Sélection intelligente de produits via moteur interne (zéro fallback générique).
- **Parcours utilisateur optimisé** :
    - **Écrans plein écran immersifs** : 3 écrans dédiés pour l'engagement et la réassurance
    - **Preuve sociale intégrée** : Statistiques d'utilisateurs similaires pour rassurer
    - **Visualisation des économies** : Comparaison avant/après des dépenses cosmétiques
    - **Progression claire** : Indicateur visuel et numérique du progrès
- **Scores Détaillés**: Notation sur 100 pour 8 critères de santé de la peau (hydratation, rides, etc.).
- **🔬 Routine 3 Phases Dermatologique** (NOUVEAU):
    - **Phase Immédiate (1-3 sem)** : Stabiliser + traiter urgent, respecter barrière cutanée
    - **Phase Adaptation (3-8 sem)** : Introduction progressive actifs puissants
    - **Phase Maintenance (continu)** : Maintenir acquis + prévention rechutes
    - **Transition intelligente** : Base durable vs traitements temporaires
    - **Durées personnalisées** : Calcul selon âge, type peau, gravité problèmes
    - **Critères visuels** : "Jusqu'à cicatrisation" remplace timing arbitraire
- **🎓 Interface Éducative Intégrée** (NOUVEAU):
    - **Objectifs par phase** : Explication "pourquoi" chaque étape
    - **Info-bulles dermatologiques** : Cycle cellulaire 28 jours vulgarisé
    - **Badges temporels enrichis** : Observation + durée + objectif
    - **Autonomisation utilisateur** : Compréhension logique progression
- **Catalogue Interne Curatifé**: Base de données produits soigneusement sélectionnés par qualité et efficacité
- **Moteur de Recommandations Avancé**: 
    - Algorithme intelligent sans recommandations "vides"
    - Filtrage automatique produits génériques/fallback
    - Regroupement intelligent par catalogId
- **Assistant IA**: Un chatbot pour répondre aux questions de l'utilisateur sur son diagnostic.
- **Analytics intégrées** : Suivi des interactions utilisateur et performance des recommandations.

## 4. IA et Machine Learning

- **Modèle**: GPT-4o Vision pour l'analyse d'images.
- **Prompts**: Des prompts systèmes sophistiqués et distincts pour le diagnostic et la sélection de produits.
- **Algorithme de score**: Un algorithme propriétaire pour calculer l'âge de la peau et un score global de santé cutanée.

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

## 7. Roadmap et Planning Détaillé

### 7.1. État Actuel (Janvier 2025)
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

**PHASE 1 : Authentification & Cloud Storage (1-2 semaines)**
- Configuration Supabase avec tables utilisateurs et analyses
- Implémentation NextAuth.js (email/password + OAuth Google)
- Migration du stockage local vers cloud sécurisé
- Protection des routes et gestion des sessions

**PHASE 2 : Dashboard Utilisateur (2-3 semaines)**
- Architecture dashboard avec sidebar responsive
- Historique des analyses avec pagination et filtres
- Système de comparaison et suivi d'évolution
- Paramètres utilisateur et gestion du profil

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

### 8.2. Robustesse

- **Gestion des erreurs API**: Implémenter des mécanismes de retry avec backoff exponentiel pour les appels aux APIs externes (OpenAI, Perfect Corp si utilisée, APIs d'affiliation) afin de gérer les erreurs temporaires et les limites de débit.
- **Monitoring et Alerting**: Mettre en place un système de monitoring pour suivre les performances de l'application, les erreurs d'API, et les temps de réponse. Des alertes automatiques devraient être configurées pour les incidents critiques.
- **Tests automatisés**: Développer une suite complète de tests unitaires, d'intégration et de bout en bout pour garantir la stabilité et la non-régression des fonctionnalités existantes et futures.
- **Scalabilité**: Anticiper la croissance du nombre d'utilisateurs. Pour les APIs, cela signifie potentiellement la mise en place de caching ou l'utilisation de services managés qui scalent automatiquement. Pour le frontend, l'optimisation continue des bundles et des temps de chargement.

### 8.3. Cohérence et Fonctionnalité

- **Standardisation des données**: Définir des schémas de données clairs et cohérents pour le catalogue de produits, les diagnostics IA et les profils utilisateurs. Utiliser TypeScript pour renforcer cette cohérence à la compilation.
- **Amélioration de la logique de sélection des produits**: Affiner l'algorithme de sélection des produits pour prendre en compte non seulement le diagnostic mais aussi les préférences de l'utilisateur (budget, allergies, type de routine) de manière plus pondérée.
- **Feedback utilisateur sur le diagnostic**: Permettre aux utilisateurs de fournir un feedback sur la précision du diagnostic IA. Cela pourrait servir à améliorer le prompt engineering ou à identifier des cas limites.
- **Internationalisation (i18n)**: Dès que possible, concevoir l'application pour supporter plusieurs langues et formats régionaux, en prévision d'une expansion internationale.
- **Accessibilité (A11y)**: S'assurer que l'application est utilisable par des personnes ayant des handicaps, en suivant les directives WCAG (Web Content Accessibility Guidelines).

## 9. Références

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

## 11. Conclusion et Prochaines Étapes

DermAI V2 représente une évolution majeure du diagnostic dermatologique IA. L'approche en deux étapes (questionnaire + photos), la routine en 3 phases et la monétisation via affiliation créent un produit différenciant sur le marché. Les choix techniques (Next.js 15, Supabase, GPT-4o Vision) assurent performance et scalabilité. La roadmap ambitieuse mais réaliste permet un développement itératif avec validation utilisateur à chaque étape.

