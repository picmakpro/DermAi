// Interface pour le catalogue
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

// État global du catalogue
let catalogCache: AffiliateCatalog | null = null

// Charger le catalogue depuis le fichier JSON
export const loadCatalog = async (): Promise<AffiliateCatalog> => {
  if (catalogCache) {
    return catalogCache
  }
  
  try {
    console.log('📦 Chargement du catalogue affilié...')
    const response = await fetch('/affiliateCatalog.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    catalogCache = await response.json()
    console.log('✅ Catalogue chargé:', catalogCache!.products.length, 'produits')
    return catalogCache!
  } catch (error) {
    console.error('❌ Erreur chargement catalogue:', error)
    return { products: [] }
  }
}

// Rechercher un produit par ID Amazon
const findProductByAmazonId = (catalog: AffiliateCatalog, amazonId: string): CatalogProduct | null => {
  return catalog.products.find(product => product.id === amazonId) || null
}

// Rechercher un produit par patterns dans le catalogId
const findProductByPattern = (catalog: AffiliateCatalog, catalogId: string): CatalogProduct | null => {
  const patterns = [
    { pattern: /CERAVE.*CLEANSER/i, category: 'cleanser', brand: 'CeraVe' },
    { pattern: /AVENE.*CICALFATE/i, brand: 'Avène' },
    { pattern: /ORDINARY.*NIACINAMIDE/i, brand: 'The Ordinary', ingredients: ['Niacinamide'] },
    { pattern: /LRP|ROCHE.*SPF/i, brand: 'La Roche-Posay', category: 'sunscreen' },
    { pattern: /PAULA.*CHOICE.*BHA/i, brand: 'Paula\'s Choice', ingredients: ['Acide Salicylique'] }
  ]
  
  for (const { pattern, category, brand, ingredients } of patterns) {
    if (pattern.test(catalogId)) {
      console.log(`🔍 Pattern trouvé pour ${catalogId}:`, { category, brand, ingredients })
      
      // Chercher le produit correspondant dans le catalogue
      const product = catalog.products.find(p => {
        const matchBrand = brand ? p.brand.toLowerCase().includes(brand.toLowerCase()) : true
        const matchCategory = category ? p.category === category : true
        const matchIngredients = ingredients ? 
          ingredients.some(ing => p.activeIngredients.some(active => 
            active.toLowerCase().includes(ing.toLowerCase())
          )) : true
        
        return matchBrand && matchCategory && matchIngredients
      })
      
      if (product) {
        console.log('✅ Produit trouvé dans le catalogue:', product.name)
        return product
      }
    }
  }
  
  return null
}

// Convertir un produit du catalogue en RecommendedProductCard
const convertToRecommendedCard = (product: CatalogProduct): RecommendedProductCard => {
  const originalPrice = Math.round(product.price * 1.2 * 100) / 100 // +20% pour prix original
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100)
  
  return {
    name: product.name,
    brand: product.brand,
    price: product.price,
    originalPrice,
    imageUrl: product.imageUrl,
    discount,
    frequency: "Selon routine",
    benefits: product.benefits.slice(0, 3), // Max 3 benefits
    instructions: "Suivre les instructions de la routine personnalisée",
    whyThisProduct: "Sélectionné par l'IA pour votre diagnostic",
    affiliateLink: product.affiliateLink
  }
}

// Fonction principale pour obtenir les infos produit
export const getProductInfoByCatalogId = async (catalogId: string): Promise<RecommendedProductCard> => {
  console.log('🔍 Recherche produit pour catalogId:', catalogId)
  
  // Charger le catalogue
  const catalog = await loadCatalog()
  
  // D'abord essayer de trouver par ID Amazon exact (si c'est dans le catalogId)
  const amazonIdMatch = catalogId.match(/([A-Z0-9]{10})/)?.[1]
  if (amazonIdMatch) {
    console.log('🔍 ID Amazon trouvé:', amazonIdMatch)
    const productById = findProductByAmazonId(catalog, amazonIdMatch)
    if (productById) {
      console.log('✅ Produit trouvé par ID Amazon:', productById.name)
      return convertToRecommendedCard(productById)
    }
  }
  
  // Ensuite essayer par patterns
  const productByPattern = findProductByPattern(catalog, catalogId)
  if (productByPattern) {
    return convertToRecommendedCard(productByPattern)
  }
  
  console.log('⚠️ Aucun produit trouvé, fallback générique pour:', catalogId)
  
  // Produit générique si rien trouvé
  return {
    name: "Produit Soin Ciblé",
    brand: "Sélection DermAI",
    price: 15.99,
    originalPrice: 19.99,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop&auto=format",
    discount: 20,
    frequency: "Selon routine",
    benefits: ["Soin personnalisé", "Adapté à votre peau", "Recommandé par l'IA"],
    instructions: "Suivre les conseils de la routine personnalisée",
    whyThisProduct: `Produit sélectionné pour votre routine (${catalogId})`,
    affiliateLink: "#"
  }
}

export type { CatalogProduct, AffiliateCatalog, RecommendedProductCard }
