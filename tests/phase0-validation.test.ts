/**
 * PHASE 0 : Tests de validation restrictedZones
 * 
 * Vérifie que l'enrichissement des 110 produits s'est bien passé :
 * - 0 anomalie : aucun produit avec actif irritant sans restrictedZones
 * - 0 faux positif : aucun produit yeux/lèvres avec restrictedZones
 * - Complétude : tous produits ont le champ restrictedZones
 */

import { describe, it, expect } from '@jest/globals'
import catalogData from '@/data/enrichedCatalogV2.json'

// Types
interface Product {
  catalogId: string
  name: string
  brand: string
  category: string
  activeIngredients?: string[]
  concentration?: string
  restrictedZones: string[]
}

const products = catalogData as Product[]

// Ingrédients irritants
const IRRITANT_KEYWORDS = [
  'retinol',
  'retinoid',
  'glycolic',
  'lactic',
  'salicylic',
  'bha',
  'aha',
  'azelaic',
  'benzoyl'
]

// Catégories spécifiques zones sensibles
const EYE_LIP_CATEGORIES = ['eye-care', 'lip-care']

describe('PHASE 0 : Validation restrictedZones', () => {
  
  describe('Complétude du catalogue', () => {
    it('devrait avoir 110 produits', () => {
      expect(products.length).toBe(110)
    })

    it('tous les produits doivent avoir le champ restrictedZones', () => {
      products.forEach(product => {
        expect(product).toHaveProperty('restrictedZones')
        expect(Array.isArray(product.restrictedZones)).toBe(true)
      })
    })
  })

  describe('Détection actifs irritants', () => {
    it('produits avec actifs irritants doivent avoir restrictedZones', () => {
      const productsWithIrritants = products.filter(product => {
        const activeIngredients = (product.activeIngredients || []).join(' ').toLowerCase()
        const hasIrritant = IRRITANT_KEYWORDS.some(keyword => activeIngredients.includes(keyword))
        return hasIrritant
      })

      // Tous ces produits doivent avoir restrictedZones (sauf eye-care/lip-care)
      const anomalies: string[] = []
      
      productsWithIrritants.forEach(product => {
        const isEyeLip = EYE_LIP_CATEGORIES.includes(product.category)
        
        if (!isEyeLip && product.restrictedZones.length === 0) {
          anomalies.push(`${product.brand} - ${product.name} (${product.activeIngredients?.join(', ')})`)
        }
      })

      if (anomalies.length > 0) {
        console.error('\n❌ ANOMALIES DÉTECTÉES :')
        anomalies.forEach(a => console.error('  -', a))
      }

      expect(anomalies.length).toBe(0)
    })

    it('produits eye-care/lip-care ne doivent PAS avoir de restrictedZones', () => {
      const eyeLipProducts = products.filter(p => 
        EYE_LIP_CATEGORIES.includes(p.category)
      )

      const falsePositives: string[] = []

      eyeLipProducts.forEach(product => {
        if (product.restrictedZones.length > 0) {
          falsePositives.push(`${product.brand} - ${product.name} (${product.category})`)
        }
      })

      if (falsePositives.length > 0) {
        console.error('\n❌ FAUX POSITIFS DÉTECTÉS :')
        falsePositives.forEach(fp => console.error('  -', fp))
      }

      expect(falsePositives.length).toBe(0)
    })
  })

  describe('Statistiques enrichissement', () => {
    it('devrait avoir 13-17% de produits avec restrictions', () => {
      const restricted = products.filter(p => p.restrictedZones.length > 0)
      const percentage = (restricted.length / products.length) * 100

      console.log(`\n📊 Produits avec restrictions : ${restricted.length} (${percentage.toFixed(1)}%)`)
      
      // Attendu : 15 produits (14%)
      expect(percentage).toBeGreaterThanOrEqual(13)
      expect(percentage).toBeLessThanOrEqual(17)
    })

    it('devrait avoir 9-13% de produits eye-care/lip-care', () => {
      const eyeLip = products.filter(p => EYE_LIP_CATEGORIES.includes(p.category))
      const percentage = (eyeLip.length / products.length) * 100

      console.log(`📊 Produits yeux/lèvres : ${eyeLip.length} (${percentage.toFixed(1)}%)`)
      
      // Attendu : 11 produits (10%)
      expect(percentage).toBeGreaterThanOrEqual(9)
      expect(percentage).toBeLessThanOrEqual(13)
    })
  })

  describe('Cas limites', () => {
    it('Niacinamide >5% doit avoir restrictedZones', () => {
      const niacinamideProducts = products.filter(p => {
        const ingredients = (p.activeIngredients || []).join(' ')
        const concentration = p.concentration || ''
        const combined = ingredients + ' ' + concentration
        
        // Chercher Niacinamide avec concentration
        const match = combined.match(/niacinamide\s*(\d+)\s*%/i)
        return match && parseInt(match[1]) > 5
      })

      niacinamideProducts.forEach(product => {
        expect(product.restrictedZones.length).toBeGreaterThan(0)
      })
    })

    it('AHA/BHA doivent avoir restrictedZones', () => {
      const ahabhaProducts = products.filter(p => {
        const ingredients = (p.activeIngredients || []).join(' ').toLowerCase()
        return ingredients.includes('aha') || ingredients.includes('bha')
      })

      // Au moins un produit AHA/BHA détecté
      expect(ahabhaProducts.length).toBeGreaterThan(0)

      // Tous doivent avoir restrictions (sauf eye-care/lip-care)
      ahabhaProducts.forEach(product => {
        if (!EYE_LIP_CATEGORIES.includes(product.category)) {
          expect(product.restrictedZones.length).toBeGreaterThan(0)
        }
      })
    })
  })
})

