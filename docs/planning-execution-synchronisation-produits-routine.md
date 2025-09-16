# 🚀 PLANNING D'EXÉCUTION - Synchronisation Produits ↔ Routine

> **Version :** 1.0  
> **Date :** 16 septembre 2025  
> **Durée totale :** 3 semaines (15 jours ouvrés)  
> **Complexité :** Moyenne-Élevée

## 📋 **VUE D'ENSEMBLE DU PLANNING**

### **Approche Méthodologique**
- **Architecture-First** : Définir les interfaces avant l'implémentation
- **Test-Driven** : Tests unitaires parallèles au développement
- **Itératif** : Validation à chaque étape avec feedback immédiat
- **Sécurisé** : Fallbacks robustes pour éviter les régressions

### **Répartition par Sprint**
```
🏗️  SPRINT 1 (5 jours) : Architecture & Services Core
🎨  SPRINT 2 (5 jours) : Interface Utilisateur & Alternatives
🔧  SPRINT 3 (5 jours) : Intégration, Tests & Optimisation
```

---

## 🏗️ **SPRINT 1 : ARCHITECTURE & SERVICES CORE**
### *Durée : 5 jours ouvrés*

### **🎯 Objectifs Sprint 1**
- ✅ Créer les services de synchronisation bidirectionnelle
- ✅ Implémenter l'enrichissement des produits depuis le catalogue JSON
- ✅ Développer la logique d'alternatives intelligentes
- ✅ Établir les interfaces TypeScript robustes
- ✅ Créer les hooks React pour la gestion d'état

---

### **📅 JOUR 1 : Architecture & Interfaces TypeScript**

#### **🔧 TÂCHE 1.1 : Création des Types & Interfaces**
**Durée :** 2h  
**Fichiers :** `src/types/productSync.ts`, `src/types/alternatives.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Créer les interfaces TypeScript pour la synchronisation produits-routine

// 1. Interface pour produit enrichi
interface EnrichedProduct extends RecommendedProduct {
  // Données catalogue JSON
  imageUrl: string
  description: string
  keywordBenefits: string[]
  problemCategory: ProductProblemCategory
  
  // Instructions enrichies depuis routine
  usageInstructions: {
    application: string
    frequency: string
    timing: string
    routineStep?: string
  }
  
  // Justification IA personnalisée
  aiJustification: {
    whySelected: string
    skinBenefits: string[]
    routineIntegration: string
  }
  
  // Métadonnées alternatives
  alternatives?: AlternativeProduct[]
  isAlternative?: boolean
  originalProductId?: string
  replacementHistory?: ProductReplacement[]
}

// 2. Interface pour alternatives intelligentes
interface AlternativeProduct extends EnrichedProduct {
  comparisonTags: string[]
  differenceHighlights: string[]
  priceComparison: string
  potencyComparison: string
  switchingImpact: {
    routineChanges: string[]
    expectedResults: string
    precautions?: string[]
    compatibilityWarnings?: string[]
  }
}

// 3. Interface pour synchronisation
interface SyncResult {
  success: boolean
  updatedRoutine: UnifiedRoutineStep[]
  updatedProducts: EnrichedProduct[]
  warnings?: string[]
  errors?: string[]
}
```

**PROMPT DE VÉRIFICATION :**
```bash
# Vérifier que les types sont correctement exportés
npm run type-check
# Vérifier l'intégration avec les types existants
grep -r "EnrichedProduct" src/types/ --include="*.ts"
```

#### **🔧 TÂCHE 1.2 : Service de Synchronisation Core**
**Durée :** 3h  
**Fichier :** `src/services/products/ProductRoutineSyncService.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Créer le service principal de synchronisation routine ↔ produits

import { UnifiedRoutineStep, RecommendedProduct } from '@/types'
import { EnrichedProduct, SyncResult } from '@/types/productSync'
import { loadCatalog } from '@/services/catalog/catalogService'

export class ProductRoutineSyncService {
  
  /**
   * FONCTION PRINCIPALE : Extraire les produits depuis la routine unifiée
   * Source de vérité unique : routine → produits
   */
  static extractProductsFromRoutine(routine: UnifiedRoutineStep[]): RecommendedProduct[] {
    console.log('🔄 Extraction produits depuis routine unifiée')
    
    const extractedProducts: RecommendedProduct[] = []
    
    routine.forEach((step, stepIndex) => {
      if (step.recommendedProducts && step.recommendedProducts.length > 0) {
        step.recommendedProducts.forEach(product => {
          // Enrichir avec contexte de la routine
          const enrichedProduct: RecommendedProduct = {
            ...product,
            routineContext: {
              stepTitle: step.title,
              stepNumber: stepIndex + 1,
              phase: step.phase,
              category: step.category,
              targetZones: step.zones
            }
          }
          extractedProducts.push(enrichedProduct)
        })
      }
    })
    
    console.log(`✅ ${extractedProducts.length} produits extraits de la routine`)
    return extractedProducts
  }
  
  /**
   * ENRICHISSEMENT : Ajouter les données du catalogue JSON
   */
  static async enrichProductsWithCatalogData(
    products: RecommendedProduct[]
  ): Promise<EnrichedProduct[]> {
    console.log('🔄 Enrichissement produits avec catalogue JSON')
    
    const catalog = await loadCatalog()
    const enrichedProducts: EnrichedProduct[] = []
    
    for (const product of products) {
      try {
        // Rechercher dans le catalogue JSON
        const catalogProduct = this.findProductInCatalog(catalog, product)
        
        if (catalogProduct) {
          const enriched: EnrichedProduct = {
            ...product,
            // Données catalogue
            imageUrl: catalogProduct.imageUrl || '/placeholder-product.jpg',
            description: this.generateDescription(catalogProduct),
            keywordBenefits: catalogProduct.benefits || [],
            problemCategory: this.categorizeBySkinProblem(catalogProduct.category),
            
            // Instructions enrichies
            usageInstructions: {
              application: this.generateApplicationInstructions(catalogProduct),
              frequency: product.routineContext?.frequency || 'Selon routine',
              timing: product.routineContext?.timing || 'Matin/Soir',
              routineStep: product.routineContext?.stepTitle
            },
            
            // Justification IA
            aiJustification: {
              whySelected: this.generateAIJustification(product, catalogProduct),
              skinBenefits: catalogProduct.benefits || [],
              routineIntegration: this.generateRoutineIntegration(product)
            }
          }
          
          enrichedProducts.push(enriched)
        } else {
          // Fallback si produit non trouvé dans catalogue
          console.warn(`⚠️ Produit non trouvé dans catalogue: ${product.name}`)
          enrichedProducts.push(this.createFallbackEnrichedProduct(product))
        }
      } catch (error) {
        console.error(`❌ Erreur enrichissement produit ${product.name}:`, error)
        enrichedProducts.push(this.createFallbackEnrichedProduct(product))
      }
    }
    
    console.log(`✅ ${enrichedProducts.length} produits enrichis`)
    return enrichedProducts
  }
  
  /**
   * SYNCHRONISATION BIDIRECTIONNELLE : Remplacement de produit
   */
  static async syncProductReplacement(
    oldProduct: EnrichedProduct,
    newProduct: EnrichedProduct,
    routine: UnifiedRoutineStep[]
  ): Promise<SyncResult> {
    console.log('🔄 Synchronisation remplacement produit')
    
    try {
      // 1. Mettre à jour la routine
      const updatedRoutine = this.updateProductInRoutine(routine, oldProduct, newProduct)
      
      // 2. Mettre à jour la liste des produits
      const updatedProducts = await this.updateProductsList(oldProduct, newProduct)
      
      // 3. Valider la cohérence
      const validationResult = this.validateSyncCoherence(updatedRoutine, updatedProducts)
      
      return {
        success: true,
        updatedRoutine,
        updatedProducts,
        warnings: validationResult.warnings
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
      return {
        success: false,
        updatedRoutine: routine,
        updatedProducts: [],
        errors: [error.message]
      }
    }
  }
  
  // Méthodes utilitaires privées
  private static findProductInCatalog(catalog: any, product: RecommendedProduct) {
    // Logique de recherche dans le catalogue JSON
  }
  
  private static generateDescription(catalogProduct: any): string {
    // Génération description à partir des données catalogue
  }
  
  private static categorizeBySkinProblem(category: string): ProductProblemCategory {
    // Mapping catégorie → problème de peau
  }
  
  // ... autres méthodes utilitaires
}
```

**PROMPT DE VÉRIFICATION :**
```typescript
// Test unitaire basique
import { ProductRoutineSyncService } from './ProductRoutineSyncService'

describe('ProductRoutineSyncService', () => {
  test('should extract products from routine', () => {
    const mockRoutine = [/* routine de test */]
    const products = ProductRoutineSyncService.extractProductsFromRoutine(mockRoutine)
    expect(products).toHaveLength(/* nombre attendu */)
  })
  
  test('should enrich products with catalog data', async () => {
    const mockProducts = [/* produits de test */]
    const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(mockProducts)
    expect(enriched[0]).toHaveProperty('imageUrl')
    expect(enriched[0]).toHaveProperty('aiJustification')
  })
})
```

---

### **📅 JOUR 2 : Service d'Alternatives Intelligentes**

#### **🔧 TÂCHE 2.1 : Service Alternatives Core**
**Durée :** 4h  
**Fichier :** `src/services/products/AlternativeProductService.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Créer le service d'alternatives intelligentes basé sur le catalogue JSON

import { EnrichedProduct, AlternativeProduct, AlternativeCriteria } from '@/types/alternatives'
import { loadCatalog } from '@/services/catalog/catalogService'

export class AlternativeProductService {
  
  /**
   * FONCTION PRINCIPALE : Rechercher alternatives intelligentes
   */
  static async findAlternatives(
    currentProduct: EnrichedProduct,
    criteria: AlternativeCriteria = {}
  ): Promise<AlternativeProduct[]> {
    console.log(`🔍 Recherche alternatives pour: ${currentProduct.name}`)
    
    try {
      // 1. Charger le catalogue JSON
      const catalog = await loadCatalog()
      
      // 2. Filtrer par catégorie identique
      const sameCategoryProducts = this.findSameCategoryProducts(catalog, currentProduct)
      
      // 3. Appliquer les critères de comparaison
      const filteredAlternatives = this.applyComparisonCriteria(
        sameCategoryProducts, 
        currentProduct, 
        criteria
      )
      
      // 4. Enrichir avec données de comparaison
      const enrichedAlternatives = await this.enrichWithComparisonData(
        filteredAlternatives,
        currentProduct
      )
      
      // 5. Limiter à 3 meilleures alternatives
      const topAlternatives = enrichedAlternatives.slice(0, 3)
      
      console.log(`✅ ${topAlternatives.length} alternatives trouvées`)
      return topAlternatives
      
    } catch (error) {
      console.error('❌ Erreur recherche alternatives:', error)
      return []
    }
  }
  
  /**
   * FILTRAGE PAR CATÉGORIE : Même catégorie que le produit actuel
   */
  private static findSameCategoryProducts(catalog: any, currentProduct: EnrichedProduct) {
    return catalog.products.filter((p: any) => 
      p.category === currentProduct.category && 
      p.id !== currentProduct.id &&
      p.price > 0 && // Produits avec prix valide
      p.affiliateLink && // Liens d'affiliation disponibles
      p.imageUrl // Images disponibles
    )
  }
  
  /**
   * APPLICATION CRITÈRES : Prix, naturalité, puissance
   */
  private static applyComparisonCriteria(
    candidates: any[],
    currentProduct: EnrichedProduct,
    criteria: AlternativeCriteria
  ) {
    let filtered = [...candidates]
    
    // Critère PRIX
    if (criteria.priceRange) {
      filtered = this.filterByPrice(filtered, currentProduct.price, criteria.priceRange)
    }
    
    // Critère NATURALITÉ
    if (criteria.naturalness) {
      filtered = this.filterByNaturalness(filtered, criteria.naturalness)
    }
    
    // Critère PUISSANCE
    if (criteria.potency) {
      filtered = this.filterByPotency(filtered, currentProduct, criteria.potency)
    }
    
    // Tri par pertinence (prix, avis, disponibilité)
    return filtered.sort((a, b) => this.calculateRelevanceScore(b) - this.calculateRelevanceScore(a))
  }
  
  /**
   * FILTRAGE PAR PRIX
   */
  private static filterByPrice(products: any[], currentPrice: number, priceRange: string) {
    switch (priceRange) {
      case 'cheaper':
        return products.filter(p => p.price < currentPrice * 0.8) // 20% moins cher
      case 'similar':
        return products.filter(p => 
          p.price >= currentPrice * 0.8 && 
          p.price <= currentPrice * 1.2
        ) // ±20%
      case 'premium':
        return products.filter(p => p.price > currentPrice * 1.2) // 20% plus cher
      default:
        return products
    }
  }
  
  /**
   * FILTRAGE PAR NATURALITÉ
   */
  private static filterByNaturalness(products: any[], naturalness: string) {
    const naturalKeywords = ['bio', 'organic', 'natural', 'naturel', 'végétal']
    const conventionalKeywords = ['clinical', 'laboratory', 'scientifique', 'dermatologique']
    
    switch (naturalness) {
      case 'more_natural':
        return products.filter(p => 
          naturalKeywords.some(keyword => 
            p.name.toLowerCase().includes(keyword) ||
            p.brand.toLowerCase().includes(keyword) ||
            (p.benefits && p.benefits.some((b: string) => b.toLowerCase().includes(keyword)))
          )
        )
      case 'conventional':
        return products.filter(p => 
          conventionalKeywords.some(keyword => 
            p.name.toLowerCase().includes(keyword) ||
            p.brand.toLowerCase().includes(keyword)
          )
        )
      default:
        return products
    }
  }
  
  /**
   * ENRICHISSEMENT AVEC DONNÉES DE COMPARAISON
   */
  private static async enrichWithComparisonData(
    alternatives: any[],
    currentProduct: EnrichedProduct
  ): Promise<AlternativeProduct[]> {
    
    return alternatives.map(alt => ({
      // Hériter de EnrichedProduct
      ...currentProduct,
      id: alt.id,
      name: alt.name,
      brand: alt.brand,
      price: alt.price,
      imageUrl: alt.imageUrl,
      affiliateLink: alt.affiliateLink,
      
      // Données de comparaison spécifiques
      comparisonTags: this.generateComparisonTags(alt, currentProduct),
      differenceHighlights: this.generateDifferenceHighlights(alt, currentProduct),
      priceComparison: this.generatePriceComparison(alt.price, currentProduct.price),
      potencyComparison: this.generatePotencyComparison(alt, currentProduct),
      
      // Impact du changement
      switchingImpact: {
        routineChanges: this.calculateRoutineChanges(alt, currentProduct),
        expectedResults: this.generateExpectedResults(alt, currentProduct),
        precautions: this.generatePrecautions(alt, currentProduct),
        compatibilityWarnings: this.checkCompatibilityWarnings(alt, currentProduct)
      },
      
      // Marquage comme alternative
      isAlternative: true,
      originalProductId: currentProduct.id
    }))
  }
  
  /**
   * GÉNÉRATION DES TAGS DE COMPARAISON
   */
  private static generateComparisonTags(alternative: any, current: EnrichedProduct): string[] {
    const tags: string[] = []
    
    // Tag prix
    if (alternative.price < current.price * 0.8) {
      tags.push('Plus économique')
    } else if (alternative.price > current.price * 1.2) {
      tags.push('Premium')
    } else {
      tags.push('Prix similaire')
    }
    
    // Tag naturalité
    const naturalKeywords = ['bio', 'organic', 'natural', 'naturel']
    if (naturalKeywords.some(k => alternative.name.toLowerCase().includes(k))) {
      tags.push('Plus naturel')
    }
    
    // Tag spécificité peau
    if (alternative.skinTypes?.includes('sensible')) {
      tags.push('Peau sensible')
    }
    
    // Tag efficacité
    if (alternative.benefits?.includes('cliniquement prouvé')) {
      tags.push('Cliniquement prouvé')
    }
    
    return tags
  }
  
  // ... autres méthodes utilitaires
}
```

**PROMPT DE VÉRIFICATION :**
```typescript
// Test du service d'alternatives
describe('AlternativeProductService', () => {
  test('should find alternatives in same category', async () => {
    const mockProduct = {
      id: 'test-serum',
      category: 'serum',
      price: 25.99,
      name: 'Test Vitamin C Serum'
    }
    
    const alternatives = await AlternativeProductService.findAlternatives(mockProduct)
    
    expect(alternatives).toHaveLength(3) // Max 3 alternatives
    expect(alternatives[0]).toHaveProperty('comparisonTags')
    expect(alternatives[0]).toHaveProperty('switchingImpact')
  })
})
```

---

### **📅 JOUR 3 : Hooks React & Gestion d'État**

#### **🔧 TÂCHE 3.1 : Hook de Synchronisation**
**Durée :** 2h  
**Fichier :** `src/hooks/useProductSync.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Hook React pour la synchronisation produits-routine

import { useState, useEffect, useCallback } from 'react'
import { UnifiedRoutineStep } from '@/types'
import { EnrichedProduct, SyncResult } from '@/types/productSync'
import { ProductRoutineSyncService } from '@/services/products/ProductRoutineSyncService'

interface UseProductSyncReturn {
  // État
  enrichedProducts: EnrichedProduct[]
  isLoading: boolean
  error: string | null
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  
  // Actions
  syncFromRoutine: (routine: UnifiedRoutineStep[]) => Promise<void>
  replaceProduct: (oldProduct: EnrichedProduct, newProduct: EnrichedProduct) => Promise<SyncResult>
  refreshProducts: () => Promise<void>
  clearError: () => void
}

export const useProductSync = (initialRoutine?: UnifiedRoutineStep[]): UseProductSyncReturn => {
  // État local
  const [enrichedProducts, setEnrichedProducts] = useState<EnrichedProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [currentRoutine, setCurrentRoutine] = useState<UnifiedRoutineStep[]>(initialRoutine || [])
  
  /**
   * SYNCHRONISATION DEPUIS ROUTINE
   */
  const syncFromRoutine = useCallback(async (routine: UnifiedRoutineStep[]) => {
    console.log('🔄 Hook: Synchronisation depuis routine')
    setIsLoading(true)
    setSyncStatus('syncing')
    setError(null)
    
    try {
      // 1. Extraire produits de la routine
      const extractedProducts = ProductRoutineSyncService.extractProductsFromRoutine(routine)
      
      // 2. Enrichir avec données catalogue
      const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(extractedProducts)
      
      // 3. Mettre à jour l'état
      setEnrichedProducts(enriched)
      setCurrentRoutine(routine)
      setSyncStatus('success')
      
      console.log(`✅ Hook: ${enriched.length} produits synchronisés`)
      
    } catch (err) {
      console.error('❌ Hook: Erreur synchronisation:', err)
      setError(err instanceof Error ? err.message : 'Erreur de synchronisation')
      setSyncStatus('error')
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  /**
   * REMPLACEMENT DE PRODUIT
   */
  const replaceProduct = useCallback(async (
    oldProduct: EnrichedProduct, 
    newProduct: EnrichedProduct
  ): Promise<SyncResult> => {
    console.log(`🔄 Hook: Remplacement ${oldProduct.name} → ${newProduct.name}`)
    setIsLoading(true)
    setError(null)
    
    try {
      // 1. Synchroniser le remplacement
      const syncResult = await ProductRoutineSyncService.syncProductReplacement(
        oldProduct,
        newProduct,
        currentRoutine
      )
      
      if (syncResult.success) {
        // 2. Mettre à jour l'état local
        setEnrichedProducts(syncResult.updatedProducts)
        setCurrentRoutine(syncResult.updatedRoutine)
        
        console.log('✅ Hook: Remplacement réussi')
      } else {
        throw new Error(syncResult.errors?.join(', ') || 'Erreur de remplacement')
      }
      
      return syncResult
      
    } catch (err) {
      console.error('❌ Hook: Erreur remplacement:', err)
      setError(err instanceof Error ? err.message : 'Erreur de remplacement')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [currentRoutine])
  
  /**
   * RAFRAÎCHISSEMENT DES PRODUITS
   */
  const refreshProducts = useCallback(async () => {
    if (currentRoutine.length > 0) {
      await syncFromRoutine(currentRoutine)
    }
  }, [currentRoutine, syncFromRoutine])
  
  /**
   * NETTOYAGE ERREUR
   */
  const clearError = useCallback(() => {
    setError(null)
    setSyncStatus('idle')
  }, [])
  
  // Synchronisation initiale
  useEffect(() => {
    if (initialRoutine && initialRoutine.length > 0) {
      syncFromRoutine(initialRoutine)
    }
  }, [initialRoutine, syncFromRoutine])
  
  return {
    // État
    enrichedProducts,
    isLoading,
    error,
    syncStatus,
    
    // Actions
    syncFromRoutine,
    replaceProduct,
    refreshProducts,
    clearError
  }
}
```

#### **🔧 TÂCHE 3.2 : Hook d'Alternatives**
**Durée :** 2h  
**Fichier :** `src/hooks/useAlternatives.ts`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Hook React pour la gestion des alternatives de produits

import { useState, useCallback } from 'react'
import { EnrichedProduct, AlternativeProduct, AlternativeCriteria } from '@/types/alternatives'
import { AlternativeProductService } from '@/services/products/AlternativeProductService'

interface UseAlternativesReturn {
  // État
  alternatives: AlternativeProduct[]
  isLoadingAlternatives: boolean
  alternativesError: string | null
  selectedAlternative: AlternativeProduct | null
  
  // Actions
  loadAlternatives: (product: EnrichedProduct, criteria?: AlternativeCriteria) => Promise<void>
  selectAlternative: (alternative: AlternativeProduct) => void
  clearAlternatives: () => void
  clearAlternativesError: () => void
}

export const useAlternatives = (): UseAlternativesReturn => {
  // État local
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([])
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false)
  const [alternativesError, setAlternativesError] = useState<string | null>(null)
  const [selectedAlternative, setSelectedAlternative] = useState<AlternativeProduct | null>(null)
  
  /**
   * CHARGEMENT DES ALTERNATIVES
   */
  const loadAlternatives = useCallback(async (
    product: EnrichedProduct,
    criteria: AlternativeCriteria = {}
  ) => {
    console.log(`🔍 Hook: Chargement alternatives pour ${product.name}`)
    setIsLoadingAlternatives(true)
    setAlternativesError(null)
    
    try {
      const foundAlternatives = await AlternativeProductService.findAlternatives(product, criteria)
      setAlternatives(foundAlternatives)
      
      console.log(`✅ Hook: ${foundAlternatives.length} alternatives chargées`)
      
    } catch (err) {
      console.error('❌ Hook: Erreur chargement alternatives:', err)
      setAlternativesError(err instanceof Error ? err.message : 'Erreur de chargement des alternatives')
      setAlternatives([])
    } finally {
      setIsLoadingAlternatives(false)
    }
  }, [])
  
  /**
   * SÉLECTION D'UNE ALTERNATIVE
   */
  const selectAlternative = useCallback((alternative: AlternativeProduct) => {
    console.log(`✅ Hook: Alternative sélectionnée: ${alternative.name}`)
    setSelectedAlternative(alternative)
  }, [])
  
  /**
   * NETTOYAGE DES ALTERNATIVES
   */
  const clearAlternatives = useCallback(() => {
    setAlternatives([])
    setSelectedAlternative(null)
    setAlternativesError(null)
  }, [])
  
  /**
   * NETTOYAGE ERREUR ALTERNATIVES
   */
  const clearAlternativesError = useCallback(() => {
    setAlternativesError(null)
  }, [])
  
  return {
    // État
    alternatives,
    isLoadingAlternatives,
    alternativesError,
    selectedAlternative,
    
    // Actions
    loadAlternatives,
    selectAlternative,
    clearAlternatives,
    clearAlternativesError
  }
}
```

**PROMPT DE VÉRIFICATION :**
```typescript
// Test des hooks avec React Testing Library
import { renderHook, act } from '@testing-library/react'
import { useProductSync } from './useProductSync'

describe('useProductSync', () => {
  test('should sync products from routine', async () => {
    const { result } = renderHook(() => useProductSync())
    
    const mockRoutine = [/* routine de test */]
    
    await act(async () => {
      await result.current.syncFromRoutine(mockRoutine)
    })
    
    expect(result.current.enrichedProducts).toHaveLength(/* nombre attendu */)
    expect(result.current.syncStatus).toBe('success')
  })
})
```

---

### **📅 JOUR 4-5 : Tests Unitaires & Validation**

#### **🔧 TÂCHE 4.1 : Tests Services Core**
**Durée :** 1 jour  
**Fichiers :** `src/services/products/__tests__/`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Tests unitaires complets pour les services

// Test ProductRoutineSyncService
describe('ProductRoutineSyncService', () => {
  const mockCatalog = {
    products: [
      {
        id: 'test-cleanser',
        name: 'Test Cleanser',
        brand: 'Test Brand',
        category: 'cleanser',
        price: 15.99,
        imageUrl: 'test-image.jpg',
        benefits: ['nettoie', 'purifie']
      }
    ]
  }
  
  beforeEach(() => {
    // Mock du catalogue
    jest.mock('@/services/catalog/catalogService', () => ({
      loadCatalog: jest.fn().mockResolvedValue(mockCatalog)
    }))
  })
  
  test('should extract products from routine correctly', () => {
    const mockRoutine: UnifiedRoutineStep[] = [
      {
        stepNumber: 1,
        title: 'Nettoyage quotidien',
        category: 'cleansing',
        recommendedProducts: [
          {
            id: 'test-cleanser',
            name: 'Test Cleanser',
            brand: 'Test Brand',
            category: 'cleanser'
          }
        ]
      }
    ]
    
    const extracted = ProductRoutineSyncService.extractProductsFromRoutine(mockRoutine)
    
    expect(extracted).toHaveLength(1)
    expect(extracted[0]).toHaveProperty('routineContext')
    expect(extracted[0].routineContext.stepTitle).toBe('Nettoyage quotidien')
  })
  
  test('should enrich products with catalog data', async () => {
    const mockProducts: RecommendedProduct[] = [
      {
        id: 'test-cleanser',
        name: 'Test Cleanser',
        brand: 'Test Brand',
        category: 'cleanser'
      }
    ]
    
    const enriched = await ProductRoutineSyncService.enrichProductsWithCatalogData(mockProducts)
    
    expect(enriched).toHaveLength(1)
    expect(enriched[0]).toHaveProperty('imageUrl')
    expect(enriched[0]).toHaveProperty('aiJustification')
    expect(enriched[0]).toHaveProperty('usageInstructions')
  })
  
  test('should handle sync product replacement', async () => {
    const oldProduct: EnrichedProduct = { /* produit ancien */ }
    const newProduct: EnrichedProduct = { /* nouveau produit */ }
    const routine: UnifiedRoutineStep[] = [ /* routine */ ]
    
    const result = await ProductRoutineSyncService.syncProductReplacement(
      oldProduct, 
      newProduct, 
      routine
    )
    
    expect(result.success).toBe(true)
    expect(result.updatedRoutine).toBeDefined()
    expect(result.updatedProducts).toBeDefined()
  })
})

// Test AlternativeProductService
describe('AlternativeProductService', () => {
  test('should find alternatives in same category', async () => {
    const mockProduct: EnrichedProduct = {
      id: 'current-serum',
      name: 'Current Serum',
      category: 'serum',
      price: 25.99
    }
    
    const alternatives = await AlternativeProductService.findAlternatives(mockProduct)
    
    expect(alternatives).toHaveLength(3) // Max 3
    alternatives.forEach(alt => {
      expect(alt.category).toBe('serum')
      expect(alt.id).not.toBe(mockProduct.id)
      expect(alt).toHaveProperty('comparisonTags')
      expect(alt).toHaveProperty('switchingImpact')
    })
  })
  
  test('should apply price criteria correctly', async () => {
    const mockProduct: EnrichedProduct = {
      id: 'expensive-serum',
      category: 'serum',
      price: 50.00
    }
    
    const cheaperAlternatives = await AlternativeProductService.findAlternatives(
      mockProduct, 
      { priceRange: 'cheaper' }
    )
    
    cheaperAlternatives.forEach(alt => {
      expect(alt.price).toBeLessThan(mockProduct.price * 0.8)
    })
  })
})
```

**PROMPT DE VÉRIFICATION :**
```bash
# Exécuter les tests
npm test -- --testPathPattern=services/products
# Vérifier la couverture
npm run test:coverage -- --testPathPattern=services/products
# La couverture doit être > 80%
```

---

## 🎨 **SPRINT 2 : INTERFACE UTILISATEUR & ALTERNATIVES**
### *Durée : 5 jours ouvrés*

### **🎯 Objectifs Sprint 2**
- ✅ Créer la section produits enrichie
- ✅ Implémenter les cartes produits avec bulles d'infos
- ✅ Développer le modal d'alternatives avec comparaison
- ✅ Créer le système de prévention utilisateur
- ✅ Intégrer avec les hooks développés au Sprint 1

---

### **📅 JOUR 6 : Section Produits Enrichie**

#### **🔧 TÂCHE 6.1 : Composant Section Principale**
**Durée :** 3h  
**Fichier :** `src/components/results/EnhancedProductsSection.tsx`

**PROMPT D'IMPLÉMENTATION :**
```typescript
// Composant principal pour la section produits enrichie

'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Sparkles, AlertCircle, RefreshCw } from 'lucide-react'
import { UnifiedRoutineStep } from '@/types'
import { EnrichedProduct } from '@/types/productSync'
import { useProductSync } from '@/hooks/useProductSync'
import { useAlternatives } from '@/hooks/useAlternatives'
import { EnrichedProductCard } from './EnrichedProductCard'
import { AlternativeModal } from './AlternativeModal'
import { ProductReplacementWarning } from './ProductReplacementWarning'
import { AIProductIndicator } from '@/components/shared/AIIndicator'

interface EnhancedProductsSectionProps {
  routine: UnifiedRoutineStep[]
  onProductReplace?: (oldProduct: EnrichedProduct, newProduct: EnrichedProduct) => void
}

export const EnhancedProductsSection: React.FC<EnhancedProductsSectionProps> = ({
  routine,
  onProductReplace
}) => {
  // Hooks de gestion d'état
  const {
    enrichedProducts,
    isLoading,
    error,
    syncStatus,
    syncFromRoutine,
    replaceProduct,
    clearError
  } = useProductSync(routine)
  
  const {
    alternatives,
    isLoadingAlternatives,
    alternativesError,
    selectedAlternative,
    loadAlternatives,
    selectAlternative,
    clearAlternatives
  } = useAlternatives()
  
  // État local pour les modals
  const [showAlternativeModal, setShowAlternativeModal] = useState(false)
  const [showReplacementWarning, setShowReplacementWarning] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<EnrichedProduct | null>(null)
  const [pendingReplacement, setPendingReplacement] = useState<{
    old: EnrichedProduct
    new: EnrichedProduct
  } | null>(null)
  
  // Synchronisation initiale
  useEffect(() => {
    if (routine && routine.length > 0) {
      syncFromRoutine(routine)
    }
  }, [routine, syncFromRoutine])
  
  /**
   * GESTION OUVERTURE ALTERNATIVES
   */
  const handleAlternativeClick = async (product: EnrichedProduct) => {
    console.log(`🔍 Ouverture alternatives pour: ${product.name}`)
    setCurrentProduct(product)
    setShowAlternativeModal(true)
    
    // Charger les alternatives
    await loadAlternatives(product)
  }
  
  /**
   * GESTION SÉLECTION ALTERNATIVE
   */
  const handleAlternativeSelect = (alternative: EnrichedProduct) => {
    if (!currentProduct) return
    
    console.log(`✅ Alternative sélectionnée: ${alternative.name}`)
    
    // Préparer le remplacement
    setPendingReplacement({
      old: currentProduct,
      new: alternative
    })
    
    // Fermer modal alternatives et ouvrir prévention
    setShowAlternativeModal(false)
    setShowReplacementWarning(true)
  }
  
  /**
   * GESTION CONFIRMATION REMPLACEMENT
   */
  const handleReplacementConfirm = async () => {
    if (!pendingReplacement) return
    
    try {
      console.log('🔄 Confirmation remplacement produit')
      
      // Effectuer le remplacement
      await replaceProduct(pendingReplacement.old, pendingReplacement.new)
      
      // Callback externe si fourni
      if (onProductReplace) {
        onProductReplace(pendingReplacement.old, pendingReplacement.new)
      }
      
      // Nettoyage
      setShowReplacementWarning(false)
      setPendingReplacement(null)
      setCurrentProduct(null)
      
      console.log('✅ Remplacement effectué avec succès')
      
    } catch (error) {
      console.error('❌ Erreur lors du remplacement:', error)
      // L'erreur sera affichée via le hook useProductSync
    }
  }
  
  /**
   * GESTION ANNULATION
   */
  const handleCancel = () => {
    setShowAlternativeModal(false)
    setShowReplacementWarning(false)
    setPendingReplacement(null)
    setCurrentProduct(null)
    clearAlternatives()
  }
  
  /**
   * CATÉGORISATION PAR PROBLÈME
   */
  const categorizeProductsByProblem = (products: EnrichedProduct[]) => {
    const categories = new Map<string, EnrichedProduct[]>()
    
    products.forEach(product => {
      const category = product.problemCategory || 'Autres'
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(product)
    })
    
    return categories
  }
  
  // Rendu conditionnel pour les états de chargement/erreur
  if (isLoading && enrichedProducts.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-dermai-ai-100">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-dermai-ai-500 animate-spin" />
            <span className="text-lg text-gray-600">Synchronisation des produits...</span>
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-red-700">Erreur de synchronisation</h2>
          </div>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Réessayer
          </button>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }
  
  // Catégorisation des produits
  const categorizedProducts = categorizeProductsByProblem(enrichedProducts)
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl shadow-xl p-8 border border-dermai-ai-100"
      >
        {/* En-tête de section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-dermai-ai-100 to-dermai-ai-200 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-dermai-ai-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Produits recommandés
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Synchronisés avec votre routine personnalisée
              </p>
            </div>
            <AIProductIndicator animated={true} />
          </div>
          
          {/* Indicateur de synchronisation */}
          {syncStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Synchronisé</span>
            </div>
          )}
        </div>
        
        {/* Produits par catégorie */}
        <div className="space-y-8">
          {Array.from(categorizedProducts.entries()).map(([category, products]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-dermai-ai-500" />
                {category}
                <span className="ml-2 text-sm text-gray-500">({products.length})</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <EnrichedProductCard
                      product={product}
                      onAlternativeClick={() => handleAlternativeClick(product)}
                      isLoading={isLoading}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Message si pas de produits */}
        {enrichedProducts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Aucun produit synchronisé
            </h3>
            <p className="text-gray-500">
              Les produits apparaîtront ici une fois la routine analysée
            </p>
          </div>
        )}
      </motion.div>
      
      {/* Modal d'alternatives */}
      <AlternativeModal
        isOpen={showAlternativeModal}
        currentProduct={currentProduct}
        alternatives={alternatives}
        isLoading={isLoadingAlternatives}
        error={alternativesError}
        onSelect={handleAlternativeSelect}
        onClose={handleCancel}
      />
      
      {/* Modal de prévention remplacement */}
      <ProductReplacementWarning
        isOpen={showReplacementWarning}
        oldProduct={pendingReplacement?.old}
        newProduct={pendingReplacement?.new}
        onConfirm={handleReplacementConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
```

**PROMPT DE VÉRIFICATION :**
```typescript
// Test du composant principal
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedProductsSection } from './EnhancedProductsSection'

describe('EnhancedProductsSection', () => {
  const mockRoutine = [/* routine de test */]
  
  test('should render products section with loading state', () => {
    render(<EnhancedProductsSection routine={mockRoutine} />)
    
    expect(screen.getByText('Synchronisation des produits...')).toBeInTheDocument()
  })
  
  test('should display products after sync', async () => {
    render(<EnhancedProductsSection routine={mockRoutine} />)
    
    await waitFor(() => {
      expect(screen.getByText('Produits recommandés')).toBeInTheDocument()
    })
  })
  
  test('should open alternatives modal on button click', async () => {
    render(<EnhancedProductsSection routine={mockRoutine} />)
    
    const alternativeButton = screen.getByText('Voir une alternative')
    fireEvent.click(alternativeButton)
    
    await waitFor(() => {
      expect(screen.getByText('Alternatives disponibles')).toBeInTheDocument()
    })
  })
})
```

---

Je continue avec le planning détaillé. Voulez-vous que je poursuive avec les jours suivants du Sprint 2 (cartes produits, modal d'alternatives, etc.) ou préférez-vous que je passe directement au Sprint 3 ?
