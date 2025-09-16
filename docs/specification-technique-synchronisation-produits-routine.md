# 🔄 SPÉCIFICATION TECHNIQUE - Synchronisation Produits ↔ Routine

> **Version :** 1.0  
> **Date :** 16 septembre 2025  
> **Statut :** En développement  
> **Priorité :** Critique - Amélioration UX majeure

## 🎯 **OBJECTIF PRINCIPAL**

Créer une synchronisation bidirectionnelle parfaite entre la routine personnalisée et la section "Produits recommandés", avec un système d'alternatives intelligentes permettant le remplacement cohérent des produits.

## 📋 **CAHIER DES CHARGES FONCTIONNEL**

### **Exigences CEO Confirmées**
1. ✅ **Synchronisation exacte** : Section "Produits recommandés" = produits de la routine
2. ✅ **Alternatives intelligentes** : Mix catégorie + critères de comparaison pertinents  
3. ✅ **Organisation par problème** : Catégorisation selon les préoccupations cutanées
4. ✅ **Cohérence totale** : Remplacement dans routine + marquage alternatif + prévention utilisateur
5. ✅ **Architecture respectée** : Intégration fluide avec le système IA existant

### **Fonctionnalités Détaillées**

#### **1. Section "Produits Recommandés" Enrichie**
- **Image du produit** : Récupérée depuis le catalogue enrichi
- **Titre + Marque** : Données officielles du catalogue
- **Catégorie par problème** : "Anti-acné", "Hydratation", "Anti-rides", etc.
- **Description mots-clés** : Bénéfices principaux du produit
- **2 Bulles d'infos** :
  - 🕐 **Mode d'emploi** : Instructions d'application + fréquence
  - 🎯 **Pourquoi ce produit ?** : Justification IA personnalisée
- **Prix** : Prix réel avec réductions éventuelles
- **Bouton Acheter** : Lien d'affiliation direct
- **Bouton "Voir une alternative"** : Ouvre pop-up avec 2-3 alternatives

#### **2. Système d'Alternatives Intelligentes**
- **Pop-up de comparaison** : Présentation claire des alternatives
- **Critères de comparaison** :
  - 💰 **Prix** : "Plus économique", "Premium", "Même gamme"
  - 🌿 **Naturalité** : "Plus naturel", "Bio", "Conventionnel"
  - 🧪 **Efficacité** : "Même efficacité", "Plus puissant", "Plus doux"
  - ⏰ **Rapidité d'action** : "Résultats rapides", "Action progressive"
- **Remplacement cohérent** : Mise à jour automatique routine + section produits
- **Marquage alternatif** : Badge "Produit alternatif choisi" dans la routine
- **Prévention utilisateur** : Modal d'information sur l'impact du changement

#### **3. Catégorisation par Problème**
```typescript
enum ProductProblemCategory {
  ACNE = "Anti-acné",
  HYDRATION = "Hydratation",
  ANTI_AGING = "Anti-rides", 
  PIGMENTATION = "Taches & Éclat",
  SENSITIVITY = "Peaux sensibles",
  CLEANSING = "Nettoyage",
  PROTECTION = "Protection solaire",
  EXFOLIATION = "Exfoliation"
}
```

## 🏗️ **ARCHITECTURE TECHNIQUE**

### **1. Sources de Données pour Alternatives**

#### **Source Principale : Catalogue Interne JSON**
**Fichier :** `public/affiliateCatalog.json`
- **120+ produits** répartis en **14 catégories**
- **Données structurées** : nom, marque, prix, ingrédients actifs, types de peau, bénéfices
- **Liens d'affiliation** : Amazon + autres partenaires
- **Images produits** : URLs directes haute qualité

**Catégories disponibles :**
```
✅ cleanser (10)      ✅ serum (15)        ✅ sunscreen (11)
✅ moisturizer (10)   ✅ treatment (8)     ✅ exfoliant (8)
✅ mask (8)           ✅ toner (7)         ✅ balm (6)
✅ eye-care (6)       ✅ face-oil (6)      ✅ primer (5)
✅ lip-care (5)       ✅ mist (5)
```

#### **Évolution Future : Base Supabase Enrichie**
Migration prévue vers base de données relationnelle avec :
- Scoring de compatibilité avancé
- Métadonnées de comparaison enrichies
- Analytics de performance produits
- Gestion dynamique du stock

### **2. Architecture du Système de Synchronisation**

```typescript
// Service principal de synchronisation
class ProductRoutineSyncService {
  // Source de vérité unique : routine → produits
  static extractProductsFromRoutine(routine: UnifiedRoutineStep[]): EnrichedProduct[]
  
  // Enrichissement avec données catalogue JSON
  static enrichProductsWithCatalogData(products: RecommendedProduct[]): EnrichedProduct[]
  
  // Synchronisation bidirectionnelle
  static syncProductReplacement(
    oldProduct: EnrichedProduct, 
    newProduct: EnrichedProduct, 
    routine: UnifiedRoutineStep[]
  ): SyncResult
}

// Interface pour produit enrichi
interface EnrichedProduct extends RecommendedProduct {
  // Données catalogue
  imageUrl: string
  description: string
  keywordBenefits: string[]
  problemCategory: ProductProblemCategory
  
  // Instructions enrichies
  usageInstructions: {
    application: string
    frequency: string
    timing: string
  }
  
  // Justification IA
  aiJustification: {
    whySelected: string
    skinBenefits: string[]
    routineIntegration: string
  }
  
  // Données alternatives
  alternatives?: AlternativeProduct[]
  isAlternative?: boolean
  originalProductId?: string
}
```

### **3. Architecture du Système d'Alternatives**

```typescript
class AlternativeProductService {
  // 🎯 ÉTAPE 1: Filtrage par catégorie identique depuis catalogue JSON
  static findSameCategoryProducts(currentProduct: EnrichedProduct): Product[] {
    return catalogJSON.products.filter(p => 
      p.category === currentProduct.category && 
      p.id !== currentProduct.id
    )
  }
  
  // 🧠 ÉTAPE 2: Application des critères de comparaison intelligents
  static applyComparisonCriteria(
    candidates: Product[], 
    criteria: AlternativeCriteria
  ): AlternativeProduct[] {
    
    // Prix : Plus économique / Même gamme / Premium
    const priceFiltered = this.filterByPrice(candidates, criteria.priceRange)
    
    // Naturalité : Plus naturel / Bio / Conventionnel  
    const naturalFiltered = this.filterByNaturalness(priceFiltered, criteria.naturalness)
    
    // Puissance : Plus doux / Similaire / Plus fort
    const potencyFiltered = this.filterByPotency(naturalFiltered, criteria.potency)
    
    return potencyFiltered.slice(0, 3) // Max 3 alternatives
  }
  
  // Génération des critères de comparaison
  static generateComparisonCriteria(
    original: EnrichedProduct,
    alternatives: AlternativeProduct[]
  ): ComparisonMatrix
}

interface AlternativeCriteria {
  priceRange: 'cheaper' | 'similar' | 'premium'
  naturalness: 'more_natural' | 'similar' | 'conventional'
  potency: 'gentler' | 'similar' | 'stronger'
  speed: 'faster' | 'similar' | 'gradual'
}

interface AlternativeProduct extends EnrichedProduct {
  comparisonTags: string[]
  differenceHighlights: string[]
  switchingImpact: {
    routineChanges: string[]
    expectedResults: string
    precautions?: string[]
  }
}
```

### **4. Exemple Concret d'Alternatives Intelligentes**

```typescript
// Exemple : Alternatives pour un sérum vitamine C
const currentProduct = {
  name: "The Ordinary Vitamin C Suspension 23%",
  category: "serum", 
  price: 8.90,
  potency: "strong"
}

// Alternatives générées depuis catalogue JSON :
const alternatives = [
  {
    name: "Mad Hippie Vitamin C Serum",     // ➜ Plus naturel, même efficacité
    comparisonTag: "Plus naturel",
    priceComparison: "Similaire (12€)",
    potencyComparison: "Plus doux",
    differenceHighlights: ["Formule naturelle", "Sans parfum", "Antioxydants ajoutés"]
  },
  {
    name: "Vichy LiftActiv Vitamin C",       // ➜ Plus cher, cliniquement prouvé
    comparisonTag: "Cliniquement prouvé", 
    priceComparison: "Premium (28€)",
    potencyComparison: "Efficacité prouvée",
    differenceHighlights: ["Tests cliniques", "Marque dermatologique", "Stabilité optimisée"]
  },
  {
    name: "CeraVe Vitamin C Serum",          // ➜ Plus doux, peau sensible
    comparisonTag: "Peau sensible",
    priceComparison: "Économique (15€)", 
    potencyComparison: "Plus doux",
    differenceHighlights: ["Formule douce", "Céramides ajoutées", "Hypoallergénique"]
  }
]
```

### **5. Architecture des Composants UI**

```typescript
// Composant principal section produits
<EnhancedProductsSection 
  routine={routine}
  onProductReplace={handleProductReplace}
/>

// Composant carte produit enrichie
<EnrichedProductCard 
  product={enrichedProduct}
  onAlternativeClick={openAlternativeModal}
  onPurchaseClick={trackAffiliateClick}
/>

// Modal d'alternatives
<AlternativeModal
  currentProduct={product}
  alternatives={alternatives}
  onSelect={handleAlternativeSelect}
  onCancel={closeModal}
/>

// Composant de prévention utilisateur
<ProductReplacementWarning
  impact={switchingImpact}
  onConfirm={confirmReplacement}
  onCancel={cancelReplacement}
/>
```

## 📁 **FICHIERS IMPACTÉS**

### **Nouveaux Fichiers à Créer**
```
src/services/products/
├── ProductRoutineSyncService.ts        # Service principal synchronisation
├── AlternativeProductService.ts        # Service alternatives intelligentes
├── ProductEnrichmentService.ts         # Enrichissement données catalogue
└── ProductCategoryService.ts           # Gestion catégories par problème

src/components/results/
├── EnhancedProductsSection.tsx         # Section produits enrichie
├── EnrichedProductCard.tsx             # Carte produit complète
├── AlternativeModal.tsx                # Modal alternatives
├── ProductReplacementWarning.tsx      # Prévention utilisateur
└── ProductComparisonMatrix.tsx         # Matrice de comparaison

src/hooks/
├── useProductSync.ts                   # Hook synchronisation
├── useAlternatives.ts                  # Hook alternatives
└── useProductReplacement.ts            # Hook remplacement

src/types/
├── productSync.ts                      # Types synchronisation
└── alternatives.ts                     # Types alternatives

src/utils/
├── productCategorization.ts            # Utilitaires catégorisation
└── comparisonLogic.ts                  # Logique de comparaison
```

### **Fichiers à Modifier**
```
src/app/results/page.tsx                # Intégration nouvelle section
src/components/results/UnifiedRoutineSection.tsx  # Marquage produits alternatifs
src/services/catalog/catalogService.ts  # Extension pour enrichissement
src/types/index.ts                      # Extension interfaces existantes
```

## 🔄 **LOGIQUE FRONT/BACK**

### **Frontend (Client)**
1. **Affichage synchronisé** : Récupération produits depuis routine unifiée
2. **Enrichissement UI** : Appel service enrichissement pour données complètes
3. **Gestion alternatives** : Interface interactive pour sélection alternatives
4. **Mise à jour temps réel** : Synchronisation immédiate routine ↔ produits
5. **Prévention utilisateur** : Modals d'information et confirmation

### **Backend (API Routes)**
```typescript
// API d'enrichissement produits
POST /api/products/enrich
{
  productIds: string[]
  routineContext: UnifiedRoutineStep[]
}

// API de recherche alternatives
GET /api/products/alternatives/:productId
?criteria=price,naturalness,potency

// API de remplacement produit
POST /api/products/replace
{
  routineId: string
  oldProductId: string
  newProductId: string
  userConfirmation: boolean
}
```

### **Intégration IA**
- **Justifications personnalisées** : Utilisation des prompts IA existants pour expliquer sélection
- **Alternatives intelligentes** : Analyse IA des compatibilités et bénéfices
- **Impact prédictif** : Évaluation IA de l'impact du changement sur la routine

## 🎨 **SPÉCIFICATIONS UX/UI**

### **Design System**
- **Cohérence visuelle** : Respect de la charte graphique DermAI existante
- **Animations fluides** : Transitions douces pour les remplacements
- **Responsive design** : Adaptation mobile/desktop optimisée
- **Accessibilité** : Conformité WCAG 2.1 AA

### **Interactions Utilisateur**
1. **Scroll section produits** → Affichage progressif des cartes enrichies
2. **Hover carte produit** → Révélation des bulles d'infos
3. **Clic "Voir alternative"** → Ouverture modal avec animation slide-up
4. **Sélection alternative** → Modal de prévention + confirmation
5. **Confirmation remplacement** → Animation de remplacement + mise à jour routine

### **États et Feedback**
- **Loading states** : Skeletons pendant enrichissement
- **Success states** : Confirmation visuelle du remplacement
- **Error states** : Gestion gracieuse des erreurs d'enrichissement
- **Empty states** : Fallback si pas de produits disponibles

## 🔐 **SÉCURITÉ ET PERFORMANCE**

### **Sécurité**
- **Validation côté serveur** : Vérification des IDs produits et routine
- **Rate limiting** : Protection contre les appels API abusifs
- **Sanitization** : Nettoyage des données utilisateur
- **Audit trail** : Logging des remplacements de produits

### **Performance**
- **Cache intelligent** : Mise en cache des données d'enrichissement
- **Lazy loading** : Chargement progressif des images produits
- **Debouncing** : Optimisation des appels API alternatives
- **Bundle splitting** : Séparation du code alternatives (optionnel)

## 📊 **MÉTRIQUES ET ANALYTICS**

### **Métriques Techniques**
- Temps de synchronisation routine → produits
- Taux de succès d'enrichissement des produits
- Performance des appels API alternatives
- Temps de réponse modal alternatives

### **Métriques Business**
- Taux d'utilisation du système d'alternatives
- Conversion produits recommandés vs alternatives
- Impact sur le panier moyen
- Satisfaction utilisateur (feedback modal)

### **Événements Analytics**
```typescript
// Événements à tracker
'product_section_viewed'
'product_alternative_opened'
'product_replaced'
'alternative_converted'
'replacement_cancelled'
```

## ⚠️ **POINTS DE VIGILANCE**

### **Risques Techniques**
1. **Cohérence données** : Désynchronisation routine ↔ produits
2. **Performance** : Latence enrichissement produits
3. **Disponibilité catalogue** : Produits indisponibles ou supprimés
4. **Complexité UI** : Surcharge cognitive utilisateur

### **Mitigation**
1. **Tests unitaires** : Validation synchronisation bidirectionnelle
2. **Cache stratégique** : Réduction latence enrichissement
3. **Fallbacks robustes** : Produits génériques si catalogue indisponible
4. **Design progressif** : Révélation progressive des fonctionnalités

## 🎯 **CRITÈRES DE SUCCÈS**

### **Fonctionnels**
- ✅ Synchronisation parfaite routine ↔ produits (100%)
- ✅ Système d'alternatives fonctionnel avec 3+ options par produit
- ✅ Remplacement cohérent avec prévention utilisateur
- ✅ Catégorisation par problème claire et pertinente

### **Techniques**
- ✅ Temps de synchronisation < 500ms
- ✅ Taux d'enrichissement > 95%
- ✅ Zéro erreur de désynchronisation
- ✅ Performance mobile optimisée

### **Business**
- ✅ Augmentation conversion produits +15%
- ✅ Taux d'utilisation alternatives > 20%
- ✅ Satisfaction utilisateur > 4.5/5
- ✅ Réduction taux de rebond section produits -10%

---

**Document de référence pour l'implémentation de la synchronisation Produits ↔ Routine dans DermAI V2**

*Prochaine étape : Planning d'exécution détaillé avec prompts opérationnels*
