import catalog from '@/data/affiliateCatalog.json'

export type CatalogCategory =
  | 'cleanser' | 'exfoliant' | 'toner' | 'essence' | 'serum' | 'moisturizer'
  | 'face-oil' | 'mask' | 'eye-care' | 'treatment' | 'balm' | 'lip-care'
  | 'mist' | 'primer' | 'sunscreen'

export interface AffiliateCatalogItem {
  id: string
  name: string
  brand: string
  category: CatalogCategory
  price: number
  currency: string
  imageUrl: string
  affiliateLink: string
  activeIngredients: string[]
  skinTypes: string[]
  benefits: string[]
}

export const loadCatalog = (): AffiliateCatalogItem[] => {
  return catalog as unknown as AffiliateCatalogItem[]
}

// Normalisation helpers
const normalizeCategory = (c?: string): CatalogCategory | undefined => {
  if (!c) return undefined
  const s = c.toLowerCase()
  if (['cleanser', 'nettoyant'].includes(s)) return 'cleanser'
  if (['exfoliant', 'gommage', 'peeling'].includes(s)) return 'exfoliant'
  if (['toner', 'tonique'].includes(s)) return 'toner'
  if (['essence'].includes(s)) return 'essence'
  if (['serum', 'sérum'].includes(s)) return 'serum'
  if (['moisturizer', 'creme', 'crème', 'lotion'].includes(s)) return 'moisturizer'
  if (['face-oil', 'huile', 'huile visage'].includes(s)) return 'face-oil'
  if (['mask', 'masque'].includes(s)) return 'mask'
  if (['eye-care', 'contour des yeux', 'eye'].includes(s)) return 'eye-care'
  if (['treatment', 'soin ciblé', 'traitement'].includes(s)) return 'treatment'
  if (['balm', 'baume'].includes(s)) return 'balm'
  if (['lip-care', 'levres', 'lèvres'].includes(s)) return 'lip-care'
  if (['mist', 'spray', 'brume'].includes(s)) return 'mist'
  if (['primer'].includes(s)) return 'primer'
  if (['sunscreen', 'spf', 'solaire', 'protection'].includes(s)) return 'sunscreen'
  return undefined
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const normalizeItem = (it: any): AffiliateCatalogItem | null => {
  const category = normalizeCategory(it.category)
  if (!category) return null
  return {
    id: String(it.id),
    name: String(it.name),
    brand: String(it.brand || ''),
    category,
    price: Number(it.price || 0),
    currency: String(it.currency || 'EUR'),
    imageUrl: String(it.imageUrl || ''),
    affiliateLink: String(it.affiliateLink || ''),
    activeIngredients: Array.isArray(it.activeIngredients) ? it.activeIngredients.map(String) : [],
    skinTypes: Array.isArray(it.skinTypes) ? it.skinTypes.map((x: string) => titleCase(x.replace(/_/g, ' '))) : [],
    benefits: Array.isArray(it.benefits) ? it.benefits.map((x: string) => x.replace(/_/g, ' ')) : []
  }
}

export const loadCatalogAsync = async (): Promise<AffiliateCatalogItem[]> => {
  try {
    const res = await fetch('/affiliateCatalog.json', { cache: 'no-store' })
    if (res.ok) {
      const text = await res.text()
      // Supprimer commentaires // et virgules traînantes simples
      const cleaned = text
        .split('\n')
        .filter(line => !/^\s*\/\//.test(line))
        .join('\n')
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
      const data = JSON.parse(cleaned)
      const normalized: AffiliateCatalogItem[] = Array.isArray(data)
        ? data.map(normalizeItem).filter(Boolean) as AffiliateCatalogItem[]
        : []
      const embedded = loadCatalog()
      const idSet = new Set(normalized.map(i => i.id))
      const merged = [...normalized, ...embedded.filter(e => !idSet.has(e.id))]
      return merged
    }
  } catch {}
  return loadCatalog()
}

export const filterCatalog = (items: AffiliateCatalogItem[], params: {
  category?: CatalogCategory
  budgetMax?: number
  skinType?: string
  excludeIngredients?: string[]
}) => {
  return items.filter(it => {
    if (params.category && it.category !== params.category) return false
    if (typeof params.budgetMax === 'number' && it.price > params.budgetMax) return false
    if (params.skinType && !it.skinTypes?.some(st => st.toLowerCase() === params.skinType?.toLowerCase())) return false
    if (Array.isArray(params.excludeIngredients) && params.excludeIngredients.length > 0) {
      const ex = params.excludeIngredients.map(s => s.toLowerCase())
      if (it.activeIngredients?.some(ai => ex.includes(ai.toLowerCase()))) return false
    }
    return true
  })
}

export interface ProductCardUI {
  name: string
  brand: string
  price: number
  imageUrl: string
  affiliateLink: string
  frequency?: string
  benefits?: string[]
}

export const toProductCard = (it: AffiliateCatalogItem): ProductCardUI => ({
  name: it.name,
  brand: it.brand,
  price: it.price,
  imageUrl: it.imageUrl,
  affiliateLink: it.affiliateLink,
  benefits: it.benefits
})
