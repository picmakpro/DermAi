import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// GET /api/products/search - Rechercher des produits dans le catalogue interne
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase()
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [] })
    }

    // Charger le catalogue depuis les fichiers JSON
    const catalogPath = path.join(process.cwd(), 'public', 'catalog')
    const catalogFiles = fs.readdirSync(catalogPath).filter(file => file.endsWith('.json'))
    
    let allProducts: any[] = []

    // Charger tous les produits
    for (const file of catalogFiles) {
      try {
        const filePath = path.join(catalogPath, file)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const categoryData = JSON.parse(fileContent)
        
        if (categoryData.products && Array.isArray(categoryData.products)) {
          const categoryName = file.replace('.json', '')
          const productsWithCategory = categoryData.products.map((product: any) => ({
            ...product,
            category: categoryName,
            type: 'internal'
          }))
          allProducts.push(...productsWithCategory)
        }
      } catch (error) {
        console.error(`Erreur lecture fichier ${file}:`, error)
      }
    }

    // Filtrer par recherche textuelle
    let filteredProducts = allProducts.filter(product => {
      const searchText = `${product.name} ${product.brand} ${product.category}`.toLowerCase()
      return searchText.includes(query)
    })

    // Filtrer par catégorie si spécifiée
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category === category
      )
    }

    // Trier par pertinence (nom exact > nom contient > marque contient)
    filteredProducts.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aBrand = a.brand.toLowerCase()
      const bBrand = b.brand.toLowerCase()

      // Nom exact
      if (aName === query && bName !== query) return -1
      if (bName === query && aName !== query) return 1

      // Nom commence par
      if (aName.startsWith(query) && !bName.startsWith(query)) return -1
      if (bName.startsWith(query) && !aName.startsWith(query)) return 1

      // Marque commence par
      if (aBrand.startsWith(query) && !bBrand.startsWith(query)) return -1
      if (bBrand.startsWith(query) && !aBrand.startsWith(query)) return 1

      // Alphabétique par défaut
      return aName.localeCompare(bName)
    })

    // Limiter les résultats
    const limitedProducts = filteredProducts.slice(0, limit)

    // Enrichir avec des données supplémentaires
    const enrichedProducts = limitedProducts.map(product => ({
      id: product.catalogId || `${product.category}-${product.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      affiliate_link: product.affiliate_link,
      image_url: product.image_url,
      description: product.description,
      phase: inferPhaseFromCategory(product.category),
      type: 'internal'
    }))

    return NextResponse.json({ 
      products: enrichedProducts,
      total: filteredProducts.length,
      query 
    })

  } catch (error) {
    console.error('Erreur API products search:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function inferPhaseFromCategory(category: string): 'morning' | 'evening' | 'both' {
  const morningCategories = ['sunscreen', 'vitamin-c', 'antioxidant']
  const eveningCategories = ['retinol', 'aha', 'bha', 'exfoliant']
  
  if (morningCategories.includes(category)) return 'morning'
  if (eveningCategories.includes(category)) return 'evening'
  return 'both'
}


