// affiliateCatalog expects FR values for mapping from questionnaire responses; keep catalog skinTypes in French to avoid breaking mappings.

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

// Trouver un produit du catalogue par nom (heuristique robuste)
const findProductByName = (catalog: AffiliateCatalog, name: string, brand?: string): CatalogProduct | null => {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const targetName = norm(name)
  const targetBrand = brand ? norm(brand) : undefined

  // 1) Match exact sur le nom
  let found = catalog.products.find(p => norm(p.name) === targetName)
  if (found) return found

  // 2) Match brand+name inclusif
  if (targetBrand) {
    found = catalog.products.find(p => norm(p.brand) === targetBrand && norm(p.name).includes(targetName)) || null
    if (found) return found
  }

  // 3) Match partiel sur nom
  found = catalog.products.find(p => norm(p.name).includes(targetName)) || null
  return found || null
}

// Rechercher une alternative dans la même catégorie que le produit courant
export const findAlternativeProduct = async (
  current: { name: string; brand?: string; price?: number },
  excludeIds: string[] = []
): Promise<RecommendedProductCard | null> => {
  const catalog = await loadCatalog()
  const currentProduct = findProductByName(catalog, current.name, current.brand)
  if (!currentProduct) {
    console.warn('Produit courant introuvable dans le catalogue pour alternative:', current)
    return null
  }

  const sameCategory = catalog.products.filter(p => p.category === currentProduct.category)
  if (sameCategory.length === 0) return null

  // Exclure le produit courant et ceux explicitement exclus
  const candidates = sameCategory.filter(p => p.id !== currentProduct.id && !excludeIds.includes(p.id))
  if (candidates.length === 0) return null

  // Heuristique simple: si prix fourni, proposer une option un peu moins chère si possible, sinon la première autre marque
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
