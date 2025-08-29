# Spécifications Fonctionnelles et Techniques de DermAI V2

## 1. Vue d'ensemble

DermAI V2 est une application web de diagnostic dermatologique basée sur l'intelligence artificielle. Elle a pour but de fournir aux utilisateurs une analyse personnalisée de leur peau, des recommandations de produits et une routine de soins sur mesure. L'application se distingue par son approche en deux étapes pour le diagnostic, sa forte personnalisation et son potentiel de monétisation via l'affiliation.

## 2. Architecture Technique

### 2.1. Stack Technologique

- **Frontend:** Next.js 15 (avec App Router), React 19, TypeScript
- **Styling:** Tailwind CSS avec un thème personnalisé
- **Animations:** Framer Motion
- **IA:** OpenAI GPT-4o Vision API
- **Stockage local:** IndexedDB pour les données volumineuses (photos, résultats d'analyse), SessionStorage pour les métadonnées de session.
- **Validation de données:** Zod
- **Gestion de formulaires:** React Hook Form

### 2.2. Structure du Projet

```
/src
|-- /app
|   |-- /api
|   |-- /analyze
|   |-- /questionnaire
|   |-- /results
|   |-- /upload
|   |-- layout.tsx
|   |-- page.tsx
|-- /components
|   |-- /ui
|   |-- /shared
|-- /constants
|-- /data
|-- /hooks
|-- /lib
|-- /services
|   |-- ai.ts
|   |-- catalog.ts
|-- /types
|-- /utils
```




## 3. Spécifications Fonctionnelles

### 3.1. Parcours Utilisateur

1.  **Landing Page (`/`)**: Présentation de l'application, de ses avantages et un appel à l'action pour commencer le diagnostic.
2.  **Upload de Photos (`/upload`)**: Interface pour téléverser plusieurs photos du visage sous différents angles.
3.  **Questionnaire (`/questionnaire`)**: Série de questions pour affiner le profil de l'utilisateur (type de peau, préoccupations, routine actuelle, budget).
4.  **Analyse (`/analyze`)**: Page de chargement pendant que l'IA analyse les données.
5.  **Résultats (`/results`)**: Affichage détaillé du diagnostic, des scores, de la routine de soins et des produits recommandés.

### 3.2. Fonctionnalités Détaillées

- **Diagnostic en 2 étapes**: 
    1.  Analyse visuelle par GPT-4o pour un diagnostic objectif.
    2.  Sélection de produits et création de routine basées sur le diagnostic et le catalogue de produits.
- **Scores Détaillés**: Notation sur 100 pour 8 critères de santé de la peau (hydratation, rides, etc.).
- **Routine Personnalisée**: Routine de soins évolutive en 3 phases (immédiate, adaptation, maintenance).
- **Catalogue de Produits**: Intégration d'un catalogue de produits d'affiliation avec des liens d'achat.
- **Assistant IA**: Un chatbot pour répondre aux questions de l'utilisateur sur son diagnostic.

## 4. IA et Machine Learning

- **Modèle**: GPT-4o Vision pour l'analyse d'images.
- **Prompts**: Des prompts systèmes sophistiqués et distincts pour le diagnostic et la sélection de produits.
- **Algorithme de score**: Un algorithme propriétaire pour calculer l'âge de la peau et un score global de santé cutanée.

## 5. Gestion des Données

- **Stockage des photos**: Les photos sont stockées localement dans IndexedDB pour garantir la confidentialité et éviter les limitations de quota.
- **Métadonnées**: Les réponses au questionnaire et autres métadonnées de session sont stockées dans SessionStorage.
- **Partage de résultats**: Les résultats peuvent être partagés via une URL unique grâce à la compression des données avec LZ-String.

## 6. UI/UX

- **Design**: Esthétique de laboratoire propre et moderne avec des animations subtiles.
- **Palette de couleurs**: Dominance de blanc et de beige avec des accents de bleu/violet pour l'IA.
- **Responsive**: L'application est conçue pour être entièrement fonctionnelle et esthétique sur mobile et sur ordinateur.

## 7. Roadmap et Évolutions Futures

- **Suivi de l'évolution**: Permettre aux utilisateurs de suivre les progrès de leur peau en comparant les photos au fil du temps.
- **Authentification**: Créer des comptes utilisateurs pour sauvegarder l'historique des diagnostics.
- **Marketplace**: Développer une marketplace intégrée avec des partenariats de marques.
- **Export PDF**: Permettre aux utilisateurs d'exporter leur diagnostic complet au format PDF.




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

