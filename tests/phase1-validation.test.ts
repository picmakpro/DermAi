/**
 * PHASE 1 : Tests de validation taxonomie careType V2
 * 
 * Vérifie que la migration taxonomique s'est bien passée :
 * - 110 produits ont un careType valide
 * - Distribution cohérente (aucun type < 5 produits)
 * - Mapping category → careType logique
 * - Sérums anti-âge bien détectés
 * - Produits éclat bien classifiés
 */

import { describe, it, expect } from '@jest/globals'
import catalogData from '@/data/enrichedCatalogV3.json'

// Types
const VALID_CARETYPES = [
  'nettoyage',
  'tonification',
  'hydratation',
  'protection',
  'exfoliation',
  'masque',
  'anti-age',
  'eclat',
  'traitement-cible',
  'apaisement'
] as const

type CareType = typeof VALID_CARETYPES[number]

interface Product {
  catalogId: string
  name: string
  brand: string
  category: string
  careType: CareType
  activeIngredients?: string[]
  targetConcerns?: string[]
}

const products = catalogData as unknown as Product[]

describe('PHASE 1 : Validation taxonomie careType V2', () => {
  
  describe('Complétude du catalogue', () => {
    it('devrait avoir 110 produits', () => {
      expect(products.length).toBe(110)
    })

    it('tous les produits doivent avoir un careType valide', () => {
      products.forEach(product => {
        expect(product).toHaveProperty('careType')
        expect(VALID_CARETYPES).toContain(product.careType)
      })
    })

    it('aucun produit ne doit avoir careType "traitement" (obsolète)', () => {
      const obsoleteProducts = products.filter(p => (p.careType as any) === 'traitement')
      expect(obsoleteProducts.length).toBe(0)
    })
  })

  describe('Distribution careTypes', () => {
    const distribution = products.reduce((acc, p) => {
      acc[p.careType] = (acc[p.careType] || 0) + 1
      return acc
    }, {} as Record<CareType, number>)

    it('tous les 10 careTypes doivent être représentés', () => {
      VALID_CARETYPES.forEach(careType => {
        expect(distribution[careType]).toBeGreaterThan(0)
      })
    })

    it('aucun careType ne doit avoir moins de 5 produits', () => {
      Object.entries(distribution).forEach(([careType, count]) => {
        expect(count).toBeGreaterThanOrEqual(5)
      })
    })

    it('hydratation devrait être le plus représenté (~20%)', () => {
      const percentage = (distribution.hydratation / products.length) * 100
      expect(percentage).toBeGreaterThanOrEqual(18)
      expect(percentage).toBeLessThanOrEqual(25)
    })

    it('afficher distribution complète', () => {
      console.log('\n📊 Distribution careTypes :')
      Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          const pct = Math.round(count / products.length * 100)
          console.log(`   - ${type}: ${count} (${pct}%)`)
        })
    })
  })

  describe('Mapping logique category → careType', () => {
    it('tous les cleansers doivent être "nettoyage"', () => {
      const cleansers = products.filter(p => p.category === 'cleanser')
      expect(cleansers.length).toBeGreaterThan(0)
      cleansers.forEach(p => {
        expect(p.careType).toBe('nettoyage')
      })
    })

    it('tous les sunscreens doivent être "protection"', () => {
      const sunscreens = products.filter(p => p.category === 'sunscreen')
      expect(sunscreens.length).toBeGreaterThan(0)
      sunscreens.forEach(p => {
        expect(p.careType).toBe('protection')
      })
    })

    it('tous les masks doivent être "masque"', () => {
      const masks = products.filter(p => p.category === 'mask')
      expect(masks.length).toBeGreaterThan(0)
      masks.forEach(p => {
        expect(p.careType).toBe('masque')
      })
    })

    it('tous les exfoliants doivent être "exfoliation"', () => {
      const exfoliants = products.filter(p => p.category === 'exfoliant')
      expect(exfoliants.length).toBeGreaterThan(0)
      exfoliants.forEach(p => {
        expect(p.careType).toBe('exfoliation')
      })
    })
  })

  describe('Classification intelligente sérums/traitements', () => {
    it('au moins 8 produits "anti-age" (retinol, peptides)', () => {
      const antiAgeProducts = products.filter(p => p.careType === 'anti-age')
      expect(antiAgeProducts.length).toBeGreaterThanOrEqual(8)
      
      console.log(`\n✅ ${antiAgeProducts.length} produits anti-âge détectés`)
    })

    it('au moins 5 produits "eclat" (Vitamin C, kojic)', () => {
      const eclatProducts = products.filter(p => p.careType === 'eclat')
      expect(eclatProducts.length).toBeGreaterThanOrEqual(5)
      
      console.log(`✅ ${eclatProducts.length} produits éclat détectés`)
    })

    it('au moins 5 produits "traitement-cible" (niacinamide, acides)', () => {
      const traitementCibleProducts = products.filter(p => p.careType === 'traitement-cible')
      expect(traitementCibleProducts.length).toBeGreaterThanOrEqual(5)
      
      console.log(`✅ ${traitementCibleProducts.length} produits traitement ciblé détectés`)
    })

    it('au moins 8 produits "apaisement" (baumes, cica)', () => {
      const apaisementProducts = products.filter(p => p.careType === 'apaisement')
      expect(apaisementProducts.length).toBeGreaterThanOrEqual(8)
      
      console.log(`✅ ${apaisementProducts.length} produits apaisement détectés`)
    })

    it('serum/treatment category doivent être classifiés intelligemment', () => {
      const serumsAndTreatments = products.filter(p => 
        ['serum', 'treatment'].includes(p.category)
      )
      
      expect(serumsAndTreatments.length).toBeGreaterThan(0)
      
      // Compter les différents types
      const distribution = serumsAndTreatments.reduce((acc, p) => {
        acc[p.careType] = (acc[p.careType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Au moins 3 types différents pour serum/treatment
      expect(Object.keys(distribution).length).toBeGreaterThanOrEqual(3)
      
      console.log(`\n✅ Sérums/Traitements classifiés dans ${Object.keys(distribution).length} types:`)
      Object.entries(distribution).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`)
      })
    })
  })

  describe('Cohérence métadonnées', () => {
    it('tous les produits doivent avoir catalogId', () => {
      products.forEach(product => {
        expect(product.catalogId).toBeTruthy()
        expect(product.catalogId.length).toBeGreaterThan(0)
      })
    })

    it('tous les produits doivent avoir restrictedZones (Phase 0)', () => {
      products.forEach(product => {
        expect(product).toHaveProperty('restrictedZones')
        expect(Array.isArray((product as any).restrictedZones)).toBe(true)
      })
    })
  })
})

