// affiliateCatalog expects FR values for mapping from questionnaire responses; keep catalog skinTypes in French to avoid breaking mappings.

// Catalog interfaces
interface CatalogProduct {
  id: string
  name: string
  brand: string
  category: string
  price: number
  currency: string
  imageUrl: string
  affiliateLink: string
  activeIngredients: string[]
  skinTypes: string[]
  benefits: string[]
}

interface AffiliateCatalog {
  products: CatalogProduct[]
}

interface RecommendedProductCard {
  name: string
  brand: string
  price: number
  originalPrice: number
  imageUrl: string
  discount: number
  frequency: string
  benefits: string[]
  instructions: string
  whyThisProduct: string
  affiliateLink: string
}

// Global catalog state
let catalogCache: AffiliateCatalog | null = null

// Load catalog from JSON file
export const loadCatalog = async (): Promise<AffiliateCatalog> => {
  if (catalogCache) {
    return catalogCache
  }

  try {
    console.log('📦 Loading affiliate catalog...')
    const response = await fetch('/affiliateCatalog.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    catalogCache = await response.json()
    console.log('✅ Catalog loaded:', catalogCache!.products.length, 'products')
    return catalogCache!
  } catch (error) {
    console.error('❌ Catalog load error:', error)
    return { products: [] }
  }
}

// Find a product in the catalog by name (robust heuristic)
const findProductByName = (catalog: AffiliateCatalog, name: string, brand?: string): CatalogProduct | null => {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const targetName = norm(name)
  const targetBrand = brand ? norm(brand) : undefined

  // 1) Exact name match
  let found = catalog.products.find(p => norm(p.name) === targetName)
  if (found) return found

  // 2) Inclusive brand+name match
  if (targetBrand) {
    found = catalog.products.find(p => norm(p.brand) === targetBrand && norm(p.name).includes(targetName))
    if (found) return found
  }

  // 3) Partial name match
  found = catalog.products.find(p => norm(p.name).includes(targetName))
  return found || null
}

// Look up an alternative within the same category as the current product
export const findAlternativeProduct = async (
  current: { name: string; brand?: string; price?: number },
  excludeIds: string[] = []
): Promise<RecommendedProductCard | null> => {
  const catalog = await loadCatalog()
  const currentProduct = findProductByName(catalog, current.name, current.brand)
  if (!currentProduct) {
    console.warn('Current product not found in catalog for alternative lookup:', current)
    return null
  }

  const sameCategory = catalog.products.filter(p => p.category === currentProduct.category)
  if (sameCategory.length === 0) return null

  // Exclude current product and any explicitly excluded
  const candidates = sameCategory.filter(p => p.id !== currentProduct.id && !excludeIds.includes(p.id))
  if (candidates.length === 0) return null

  // Simple heuristic: if a price is provided, try a slightly cheaper option; otherwise pick the first other brand
  let choice: CatalogProduct | undefined
  if (typeof current.price === 'number') {
    const cheaper = candidates
      .filter(p => p.price < (current.price as number))
      .sort((a, b) => a.price - b.price)[0]
    choice = cheaper || candidates.sort((a, b) => a.price - b.price)[0]
  } else {
    choice = candidates[0]
  }

  if (!choice) return null
  return convertToRecommendedCard(choice)
}

// Find a product by Amazon ID
const findProductByAmazonId = (catalog: AffiliateCatalog, amazonId: string): CatalogProduct | null => {
  return catalog.products.find(product => product.id === amazonId) || null
}

// Find a product by patterns in the catalogId
const findProductByPattern = (catalog: AffiliateCatalog, catalogId: string): CatalogProduct | null => {
  const patterns = [
    { pattern: /CERAVE.*CLEANSER/i, category: 'cleanser', brand: 'CeraVe' },
    { pattern: /AVENE.*CICALFATE/i, brand: 'Avène' },
    { pattern: /ORDINARY.*NIACINAMIDE/i, brand: 'The Ordinary', ingredients: ['Niacinamide'] },
    { pattern: /LRP|ROCHE.*SPF/i, brand: 'La Roche-Posay', category: 'sunscreen' },
    { pattern: /PAULA.*CHOICE.*BHA/i, brand: "Paula's Choice", ingredients: ['Acide Salicylique'] } // keep FR ingredient to match catalog
  ]

  for (const { pattern, category, brand, ingredients } of patterns) {
    if (pattern.test(catalogId)) {
      console.log(`🔍 Pattern matched for ${catalogId}:`, { category, brand, ingredients })

      // Try to locate the corresponding product in the catalog
      const product = catalog.products.find(p => {
        const matchBrand = brand ? p.brand.toLowerCase().includes(brand.toLowerCase()) : true
        const matchCategory = category ? p.category === category : true
        const matchIngredients = ingredients
          ? ingredients.some(ing =>
              p.activeIngredients.some(active => active.toLowerCase().includes(ing.toLowerCase()))
            )
          : true

        return matchBrand && matchCategory && matchIngredients
      })

      if (product) {
        console.log('✅ Product found in catalog:', product.name)
        return product
      }
    }
  }

  return null
}

// Convert a catalog product to RecommendedProductCard
const convertToRecommendedCard = (product: CatalogProduct): RecommendedProductCard => {
  const originalPrice = Math.round(product.price * 1.2 * 100) / 100 // +20% as an "original price"
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100)

  return {
    name: product.name,
    brand: product.brand,
    price: product.price,
    originalPrice,
    imageUrl: product.imageUrl,
    discount,
    frequency: 'Per routine',
    benefits: product.benefits.slice(0, 3), // Max 3 benefits
    instructions: 'Follow your personalized routine instructions',
    whyThisProduct: 'Selected by AI for your diagnosis',
    affiliateLink: product.affiliateLink
  }
}

// Main function to retrieve product info by catalogId
export const getProductInfoByCatalogId = async (catalogId: string): Promise<RecommendedProductCard> => {
  console.log('🔍 Looking up product for catalogId:', catalogId)

  // Load catalog
  const catalog = await loadCatalog()

  // Try to match an exact Amazon-style ID if present in the catalogId
  const amazonIdMatch = catalogId.match(/([A-Z0-9]{10})/)?.[1]
  if (amazonIdMatch) {
    console.log('🔍 Amazon-like ID detected:', amazonIdMatch)
    const productById = findProductByAmazonId(catalog, amazonIdMatch)
    if (productById) {
      console.log('✅ Product found by Amazon ID:', productById.name)
      return convertToRecommendedCard(productById)
    }
  }

  // Then try with patterns
  const productByPattern = findProductByPattern(catalog, catalogId)
  if (productByPattern) {
    return convertToRecommendedCard(productByPattern)
  }

  console.log('⚠️ No product found, returning generic fallback for:', catalogId)

  // Generic fallback
  return {
    name: 'Targeted Care Product',
    brand: 'DermAI Selection',
    price: 15.99,
    originalPrice: 19.99,
    imageUrl:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop&auto=format',
    discount: 20,
    frequency: 'Per routine',
    benefits: ['Personalized care', 'Adapted to your skin', 'AI-recommended'],
    instructions: 'Follow the guidance in your personalized routine',
    whyThisProduct: `Product selected for your routine (${catalogId})`,
    affiliateLink: '#'
  }
}

export type { CatalogProduct, AffiliateCatalog, RecommendedProductCard }
