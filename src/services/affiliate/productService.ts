// Service pour l'intégration future des APIs d'affiliation

export interface AffiliateProduct {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  imageUrl: string
  description: string
  affiliateLink: string
  commission: number
  availability: 'in-stock' | 'out-of-stock' | 'limited'
  rating?: number
  reviewsCount?: number
  ingredients?: string[]
  skinTypes: string[]
  benefits: string[]
  category: 'cleanser' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment'
}

export interface ProductSearchCriteria {
  skinType: string
  concerns: string[]
  budgetRange: [number, number]
  excludeIngredients?: string[]
  category?: string
}

/**
 * Service d'intégration avec les APIs d'affiliation
 * TODO: Intégrer avec les vraies APIs (Sephora, Douglas, etc.)
 */
export class ProductService {
  
  /**
   * Recherche de produits via API Sephora
   * TODO: Remplacer par vraie intégration API
   */
  static async searchSephoraProducts(criteria: ProductSearchCriteria): Promise<AffiliateProduct[]> {
    // Future: Intégration API Sephora
    console.log('Recherche Sephora pour:', criteria)
    return []
  }

  /**
   * Recherche de produits via API Douglas
   * TODO: Remplacer par vraie intégration API
   */
  static async searchDouglasProducts(criteria: ProductSearchCriteria): Promise<AffiliateProduct[]> {
    // Future: Intégration API Douglas
    console.log('Recherche Douglas pour:', criteria)
    return []
  }

  /**
   * Recherche de produits via API Amazon
   * TODO: Remplacer par vraie intégration API
   */
  static async searchAmazonProducts(criteria: ProductSearchCriteria): Promise<AffiliateProduct[]> {
    // Future: Intégration API Amazon
    console.log('Recherche Amazon pour:', criteria)
    return []
  }

  /**
   * Recherche agrégée dans toutes les sources
   */
  static async findRecommendedProducts(criteria: ProductSearchCriteria): Promise<AffiliateProduct[]> {
    const [sephoraProducts, douglasProducts, amazonProducts] = await Promise.all([
      this.searchSephoraProducts(criteria),
      this.searchDouglasProducts(criteria),
      this.searchAmazonProducts(criteria)
    ])

    // Fusionner et trier par pertinence/commission
    const allProducts = [...sephoraProducts, ...douglasProducts, ...amazonProducts]
    
    return allProducts
      .sort((a, b) => b.commission - a.commission) // Trier par commission
      .slice(0, 6) // Limiter les résultats
  }

  /**
   * Conversion des critères basés sur l'analyse DermAI
   */
  static analysisToSearchCriteria(analysis: any): ProductSearchCriteria {
    const skinType = analysis.diagnostic?.primaryCondition || 'normale'
    const concerns = analysis.diagnostic?.affectedAreas || []
    const budget = this.extractBudgetFromAnalysis(analysis)

    return {
      skinType,
      concerns,
      budgetRange: budget,
      excludeIngredients: analysis.allergies?.ingredients || []
    }
  }

  private static extractBudgetFromAnalysis(analysis: any): [number, number] {
    // Logique pour extraire le budget depuis le questionnaire
    // TODO: Accéder aux données du questionnaire original
    return [20, 100] // Valeur par défaut
  }
}

/**
 * Configuration des APIs d'affiliation
 */
export const AFFILIATE_CONFIG = {
  sephora: {
    apiKey: process.env.SEPHORA_API_KEY,
    baseUrl: 'https://api.sephora.com/v1',
    commissionRate: 0.08 // 8%
  },
  douglas: {
    apiKey: process.env.DOUGLAS_API_KEY,
    baseUrl: 'https://api.douglas.de/v1',
    commissionRate: 0.06 // 6%
  },
  amazon: {
    accessKey: process.env.AMAZON_ACCESS_KEY,
    secretKey: process.env.AMAZON_SECRET_KEY,
    associateTag: process.env.AMAZON_ASSOCIATE_TAG,
    commissionRate: 0.04 // 4%
  }
}
