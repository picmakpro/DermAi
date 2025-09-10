// Service for future affiliate API integrations

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
 * Affiliate API integration service
 * TODO: Integrate with real APIs (Sephora, Douglas, etc.)
 */
export class ProductService {
  /**
   * Search products via Sephora API
   * TODO: Replace with real API integration
   */
  static async searchSephoraProducts(criteria: ProductSearchCriteria): Promise<AffiliateProduct[]> {
    // Future: Sephora API integration
    console.log('Sephora search for:', criteria)
    return []
  }

  /**
   * Search products via Douglas API
   * TODO: Replace with real API integration
   */
  static async searchDouglasProducts(criteria: ProductSearchCriteria): Promise<AffiliateProduct[]> {
    // Future: Douglas API integration
    console.log('Douglas search for:', criteria)
    return []
  }

  /**
   * Search products via Amazon API
   * TODO: Replace with real API integration
   */
  static async searchAmazonProducts(criteria: ProductSearchCriteria): Promise<AffiliateProduct[]> {
    // Future: Amazon API integration
    console.log('Amazon search for:', criteria)
    return []
  }

  /**
   * Aggregated search across all sources
   */
  static async findRecommendedProducts(criteria: ProductSearchCriteria): Promise<AffiliateProduct[]> {
    const [sephoraProducts, douglasProducts, amazonProducts] = await Promise.all([
      this.searchSephoraProducts(criteria),
      this.searchDouglasProducts(criteria),
      this.searchAmazonProducts(criteria),
    ])

    // Merge and sort by relevance/commission
    const allProducts = [...sephoraProducts, ...douglasProducts, ...amazonProducts]

    return allProducts
      .sort((a, b) => b.commission - a.commission) // Sort by commission
      .slice(0, 6) // Limit results
  }

  /**
   * Convert DermAI analysis into search criteria
   */
  static analysisToSearchCriteria(analysis: any): ProductSearchCriteria {
    // value used in logic; keep as-is if upstream emits French tokens
    const skinType = analysis.diagnostic?.primaryCondition || 'normale' // logic-bound default
    const concerns = analysis.diagnostic?.affectedAreas || []
    const budget = this.extractBudgetFromAnalysis(analysis)

    return {
      skinType,
      concerns,
      budgetRange: budget,
      excludeIngredients: analysis.allergies?.ingredients || [],
    }
  }

  private static extractBudgetFromAnalysis(analysis: any): [number, number] {
    // Logic to extract budget from the questionnaire
    // TODO: Access original questionnaire data
    return [20, 100] // Default value
  }
}

/**
 * Affiliate API configuration
 */
export const AFFILIATE_CONFIG = {
  sephora: {
    apiKey: process.env.SEPHORA_API_KEY,
    baseUrl: 'https://api.sephora.com/v1',
    commissionRate: 0.08, // 8%
  },
  douglas: {
    apiKey: process.env.DOUGLAS_API_KEY,
    baseUrl: 'https://api.douglas.de/v1',
    commissionRate: 0.06, // 6%
  },
  amazon: {
    accessKey: process.env.AMAZON_ACCESS_KEY,
    secretKey: process.env.AMAZON_SECRET_KEY,
    associateTag: process.env.AMAZON_ASSOCIATE_TAG,
    commissionRate: 0.04, // 4%
  },
}
