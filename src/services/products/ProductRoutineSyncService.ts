/**
 * 🔄 SERVICE PRINCIPAL DE SYNCHRONISATION ROUTINE ↔ PRODUITS
 * 
 * Service responsable de la synchronisation bidirectionnelle entre
 * la routine personnalisée et la section produits recommandés
 * 
 * Version: 1.0
 * Date: 16 septembre 2025
 */

import { UnifiedRoutineStep, RecommendedProduct, CatalogProduct } from '@/types'
import { 
  EnrichedProduct, 
  SyncResult, 
  ProductProblemCategory,
  ProductRoutineContext 
} from '@/types/productSync'
import { loadCatalog } from '@/services/catalog/catalogService'

export class ProductRoutineSyncService {
  
  /**
   * 🎯 FONCTION PRINCIPALE : Extraire les produits depuis la routine unifiée
   * Source de vérité unique : routine → produits
   */
  static extractProductsFromRoutine(routine: UnifiedRoutineStep[]): RecommendedProduct[] {
    console.log('🔄 Extraction produits depuis routine unifiée')
    
    const extractedProducts: RecommendedProduct[] = []
    
    // Vérifier que la routine est valide
    if (!routine || !Array.isArray(routine)) {
      console.warn('⚠️ Routine invalide ou vide')
      return extractedProducts
    }
    
    routine.forEach((step, stepIndex) => {
      if (step.recommendedProducts && step.recommendedProducts.length > 0) {
        step.recommendedProducts.forEach(product => {
          // Enrichir avec contexte de la routine
          const enrichedProduct: RecommendedProduct = {
            ...product,
            // Ajouter le contexte de routine comme métadonnée
            routineContext: {
              stepTitle: step.title,
              stepNumber: stepIndex + 1,
              phase: step.phase,
              category: step.category,
              targetZones: step.zones,
              frequency: step.frequency,
              timing: step.timeOfDay
            } as ProductRoutineContext
          }
          extractedProducts.push(enrichedProduct)
        })
      }
    })
    
    console.log(`✅ ${extractedProducts.length} produits extraits de la routine`)
    return extractedProducts
  }
  
  /**
   * 🔍 ENRICHISSEMENT : Ajouter les données du catalogue JSON
   */
  static async enrichProductsWithCatalogData(
    products: RecommendedProduct[]
  ): Promise<EnrichedProduct[]> {
    console.log('🔄 Enrichissement produits avec catalogue JSON')
    
    // Vérifier que les produits sont valides
    if (!products || !Array.isArray(products)) {
      console.warn('⚠️ Liste de produits invalide ou vide')
      return []
    }
    
    try {
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
                frequency: (product as any).routineContext?.frequency || 'Selon routine',
                timing: (product as any).routineContext?.timing || 'Matin/Soir',
                routineStep: (product as any).routineContext?.stepTitle
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
      
    } catch (error) {
      console.error('❌ Erreur chargement catalogue:', error)
      // Fallback : retourner produits avec enrichissement minimal
      return products.map(product => this.createFallbackEnrichedProduct(product))
    }
  }
  
  /**
   * 🔄 SYNCHRONISATION BIDIRECTIONNELLE : Remplacement de produit
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
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }
  
  /**
   * 🔍 RECHERCHE PRODUIT DANS CATALOGUE
   */
  private static findProductInCatalog(catalog: any, product: RecommendedProduct): CatalogProduct | null {
    if (!catalog?.products) return null
    
    // Recherche par ID exact si disponible
    if (product.catalogId) {
      const found = catalog.products.find((p: CatalogProduct) => p.id === product.catalogId)
      if (found) return found
    }
    
    // Recherche par nom et marque
    const found = catalog.products.find((p: CatalogProduct) => 
      p.name.toLowerCase().includes(product.name.toLowerCase()) &&
      p.brand.toLowerCase().includes(product.brand.toLowerCase())
    )
    
    if (found) return found
    
    // Recherche par nom seul (moins précise)
    return catalog.products.find((p: CatalogProduct) => 
      p.name.toLowerCase().includes(product.name.toLowerCase()) ||
      product.name.toLowerCase().includes(p.name.toLowerCase())
    ) || null
  }
  
  /**
   * 📝 GÉNÉRATION DESCRIPTION PRODUIT
   */
  private static generateDescription(catalogProduct: CatalogProduct): string {
    const benefits = catalogProduct.benefits?.slice(0, 3).join(', ') || 'Soin spécialisé'
    const activeIngredients = catalogProduct.activeIngredients?.slice(0, 2).join(', ') || ''
    
    let description = `${benefits}.`
    if (activeIngredients) {
      description += ` Formulé avec ${activeIngredients}.`
    }
    
    return description
  }
  
  /**
   * 🏷️ CATÉGORISATION PAR PROBLÈME DE PEAU
   */
  private static categorizeBySkinProblem(category: string): ProductProblemCategory {
    const categoryLower = category.toLowerCase()
    
    // Mapping catégorie → problème de peau
    const categoryMap: Record<string, ProductProblemCategory> = {
      'cleanser': ProductProblemCategory.CLEANSING,
      'serum': ProductProblemCategory.ANTI_AGING,
      'moisturizer': ProductProblemCategory.HYDRATION,
      'sunscreen': ProductProblemCategory.PROTECTION,
      'treatment': ProductProblemCategory.ACNE,
      'exfoliant': ProductProblemCategory.EXFOLIATION,
      'mask': ProductProblemCategory.HYDRATION,
      'toner': ProductProblemCategory.CLEANSING,
      'eye-care': ProductProblemCategory.ANTI_AGING,
      'face-oil': ProductProblemCategory.HYDRATION
    }
    
    return categoryMap[categoryLower] || ProductProblemCategory.AUTRES
  }
  
  /**
   * 📋 GÉNÉRATION INSTRUCTIONS D'APPLICATION
   */
  private static generateApplicationInstructions(catalogProduct: CatalogProduct): string {
    const category = catalogProduct.category.toLowerCase()
    
    const instructionsMap: Record<string, string> = {
      'cleanser': 'Appliquer sur peau humide, masser délicatement, rincer à l\'eau tiède',
      'serum': 'Appliquer 2-3 gouttes sur peau propre, tapoter délicatement',
      'moisturizer': 'Appliquer généreusement sur visage et cou, masser jusqu\'à absorption',
      'sunscreen': 'Appliquer généreusement 15 minutes avant exposition, renouveler toutes les 2h',
      'treatment': 'Appliquer localement sur les zones concernées',
      'exfoliant': 'Appliquer sur peau sèche, masser en mouvements circulaires, rincer',
      'mask': 'Appliquer en couche épaisse, laisser poser selon indications, rincer',
      'toner': 'Appliquer avec un coton ou tapoter directement avec les mains'
    }
    
    return instructionsMap[category] || 'Suivre les instructions du fabricant'
  }
  
  /**
   * 🤖 GÉNÉRATION JUSTIFICATION IA
   */
  private static generateAIJustification(product: RecommendedProduct, catalogProduct: CatalogProduct): string {
    const routineContext = (product as any).routineContext as ProductRoutineContext
    
    let justification = `Sélectionné pour votre ${catalogProduct.category}`
    
    if (routineContext?.phase) {
      justification += ` en phase ${routineContext.phase}`
    }
    
    if (catalogProduct.benefits && catalogProduct.benefits.length > 0) {
      justification += `. Bénéfices : ${catalogProduct.benefits.slice(0, 2).join(', ')}`
    }
    
    return justification + '.'
  }
  
  /**
   * 🔗 GÉNÉRATION INTÉGRATION ROUTINE
   */
  private static generateRoutineIntegration(product: RecommendedProduct): string {
    const routineContext = (product as any).routineContext as ProductRoutineContext
    
    if (!routineContext) {
      return 'Intégré dans votre routine personnalisée'
    }
    
    let integration = `Étape ${routineContext.stepNumber}: ${routineContext.stepTitle}`
    
    if (routineContext.frequency && routineContext.timing) {
      integration += ` - ${routineContext.frequency}, ${routineContext.timing}`
    }
    
    return integration
  }
  
  /**
   * 🆘 CRÉATION PRODUIT ENRICHI FALLBACK
   */
  private static createFallbackEnrichedProduct(product: RecommendedProduct): EnrichedProduct {
    const routineContext = (product as any).routineContext as ProductRoutineContext
    
    return {
      ...product,
      imageUrl: '/placeholder-product.jpg',
      description: `Produit recommandé pour votre routine ${product.category}`,
      keywordBenefits: ['Soin spécialisé'],
      problemCategory: this.categorizeBySkinProblem(product.category),
      usageInstructions: {
        application: 'Suivre les instructions du fabricant',
        frequency: routineContext?.frequency || 'Selon routine',
        timing: routineContext?.timing || 'Matin/Soir',
        routineStep: routineContext?.stepTitle
      },
      aiJustification: {
        whySelected: `Recommandé pour votre type de peau et vos préoccupations`,
        skinBenefits: ['Soin adapté'],
        routineIntegration: this.generateRoutineIntegration(product)
      }
    }
  }
  
  /**
   * 🔄 MISE À JOUR PRODUIT DANS ROUTINE
   */
  private static updateProductInRoutine(
    routine: UnifiedRoutineStep[],
    oldProduct: EnrichedProduct,
    newProduct: EnrichedProduct
  ): UnifiedRoutineStep[] {
    return routine.map(step => {
      const updatedProducts = step.recommendedProducts.map(product => 
        product.id === oldProduct.id ? {
          ...newProduct,
          // Marquer comme produit alternatif
          isAlternative: true,
          originalProductId: oldProduct.id
        } : product
      )
      
      return {
        ...step,
        recommendedProducts: updatedProducts
      }
    })
  }
  
  /**
   * 📋 MISE À JOUR LISTE DES PRODUITS
   */
  private static async updateProductsList(
    oldProduct: EnrichedProduct,
    newProduct: EnrichedProduct
  ): Promise<EnrichedProduct[]> {
    // Cette méthode sera étendue pour gérer une liste globale de produits
    // Pour l'instant, retourne le nouveau produit enrichi
    const enrichedNew = await this.enrichProductsWithCatalogData([newProduct])
    return enrichedNew.map(product => ({
      ...product,
      isAlternative: true,
      originalProductId: oldProduct.id
    }))
  }
  
  /**
   * ✅ VALIDATION COHÉRENCE SYNCHRONISATION
   */
  private static validateSyncCoherence(
    routine: UnifiedRoutineStep[],
    products: EnrichedProduct[]
  ): { warnings: string[] } {
    const warnings: string[] = []
    
    // Vérifier que tous les produits de la routine sont présents
    const routineProductIds = new Set<string>()
    routine.forEach(step => {
      step.recommendedProducts.forEach(product => {
        routineProductIds.add(product.id)
      })
    })
    
    const productIds = new Set(products.map(p => p.id))
    
    routineProductIds.forEach(id => {
      if (!productIds.has(id)) {
        warnings.push(`Produit ${id} présent dans la routine mais absent de la liste des produits`)
      }
    })
    
    // Vérifier les doublons
    const duplicates = products.filter((product, index, array) => 
      array.findIndex(p => p.id === product.id) !== index
    )
    
    if (duplicates.length > 0) {
      warnings.push(`Produits dupliqués détectés: ${duplicates.map(p => p.name).join(', ')}`)
    }
    
    return { warnings }
  }
}
