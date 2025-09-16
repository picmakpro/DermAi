# Spécifications Fonctionnelles et Techniques de DermAI V2

## 1. Vue d'ensemble

DermAI V2 est une application web de diagnostic dermatologique basée sur l'intelligence artificielle. Elle a pour but de fournir aux utilisateurs une analyse personnalisée de leur peau, des recommandations de produits et une routine de soins sur mesure. L'application se distingue par son approche en deux étapes pour le diagnostic, sa forte personnalisation et son potentiel de monétisation via l'affiliation.

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
- **Affiliation:** APIs Sephora, Amazon Associates, Douglas
- **Analytics:** Google Analytics 4 + Enhanced Ecommerce
- **Monitoring:** Sentry (error tracking), Vercel Analytics

**Stockage & Données**
- **Stockage cloud:** Supabase (analyses, profils utilisateurs)
- **Stockage local:** IndexedDB (cache offline), SessionStorage (session)
- **Compression:** LZ-String (partage de résultats)

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

### 4.1. Architecture IA-First Pure (Refonte V2)

- **Modèle**: GPT-4o Vision avec configuration déterministe (température 0.0)
- **Logique 4 Étapes IA Pures**:
  - **ÉTAPE 1**: Diagnostic visuel pur (IA OpenAI) avec validation Zod stricte
  - **ÉTAPE 2**: Routine personnalisée (IA OpenAI) basée sur diagnostic + profil
  - **ÉTAPE 3**: Sélection produits (IA OpenAI) basée sur routine + catalogue
  - **ÉTAPE 4**: Assemblage et validation (algorithmique) pour cohérence finale
- **Prompts**: Prompts spécialisés par étape avec chaînage des outputs
- **Personnalisation**: 95% de routines différentes pour diagnostics différents

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

### 9.1. Fiche Technique Évolutive

**[diagnostic-technique-refonte-ia-complete.md](./diagnostic-technique-refonte-ia-complete.md)** - 🔥 **REFONTE MAJEURE V2** :
- Architecture IA-First Pure (4 étapes 100% IA)
- Schémas de validation Zod spécialisés
- Prompts opérationnels pour chaque étape IA
- Planning d'implémentation détaillé (3 semaines)
- Métriques de personnalisation et cohérence

**[diagnostic-technique-complet.md](./diagnostic-technique-complet.md)** - Document de référence historique :
- Diagnostic complet des problèmes identifiés (architecture hybride)
- Solutions techniques détaillées avec implémentation
- Roadmap priorisée sur 8 semaines (4 sprints)
- ⚠️ **OBSOLÈTE** - Remplacé par refonte IA complète

**[diagnostic-technique-affichage-routines.md](./diagnostic-technique-affichage-routines.md)** - Corrections affichage routines :
- Audit complet problèmes affichage identifiés par l'utilisateur
- Solutions techniques pour badges, titres, timing, zones
- Plan d'action en 3 sprints avec prompts opérationnels
- Tests de validation et critères de succès

**[planning-execution-refonte-routines.md](./planning-execution-refonte-routines.md)** - Planning opérationnel refonte :
- Tableau de bord progression sprints avec statuts temps réel
- Prompts opérationnels prêts à l'emploi pour chaque sprint
- Prompts de vérification et debug pour validation qualité
- Métriques cibles et comparaison avant/après refonte
- ✅ **REFONTE TERMINÉE** : 3 sprints complétés avec succès

**[formats-json-ia.md](./formats-json-ia.md)** - Formats JSON IA stables :
- Schémas Zod complets pour validation runtime stricte
- Architecture A/B testing pour optimisation prompts
- Pipeline validation avec retry automatique et fallback
- Documentation technique complète formats stables

### 9.2. Architecture et Logique Métier
**[architecture-fiabilite.md](./architecture-fiabilite.md)** - Spécifications techniques de l'architecture de fiabilité
**[dermatological-logic.md](./dermatological-logic.md)** - Logique dermatologique et routine 3 phases

### 9.3. Correction Mapping Frontend
**[diagnostic-technique-mapping-v2-frontend.md](./diagnostic-technique-mapping-v2-frontend.md)** - 🔥 **CORRECTION CRITIQUE** - Diagnostic technique pour corriger le mapping V2→Frontend
**[planning-execution-mapping-v2-frontend.md](./planning-execution-mapping-v2-frontend.md)** - Planning d'exécution avec prompts opérationnels pour l'implémentation

### 9.4. Prompt V2.1 Optimisé CEO
**[prompt-v21-implementation.md](./prompt-v21-implementation.md)** - 🚀 **NOUVELLE IMPLÉMENTATION** - Prompt V2.1 optimisé par le CEO avec lexique standardisé et validation stricte
**[correction-validation-v21.md](./correction-validation-v21.md)** - 🔧 **CORRECTION CRITIQUE** - Résolution problème validation "marquée" et renforcement prompts
**[resolution-probleme-validation.md](./resolution-probleme-validation.md)** - ✅ **RÉSOLUTION COMPLÈTE** - Rapport final avec nettoyeur automatique et monitoring

### 9.5. Règle de Développement
> **IMPORTANT** : La fiche technique évolutive est la référence officielle du projet. 
> Toute modification du code doit s'appuyer sur cette documentation.
> Mise à jour obligatoire après chaque sprint.

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

## 11. Conclusion et Prochaines Étapes

DermAI V2 représente une évolution majeure du diagnostic dermatologique IA. L'approche en deux étapes (questionnaire + photos), la routine en 3 phases et la monétisation via affiliation créent un produit différenciant sur le marché. Les choix techniques (Next.js 15, Supabase, GPT-4o Vision) assurent performance et scalabilité. La roadmap ambitieuse mais réaliste permet un développement itératif avec validation utilisateur à chaque étape.

