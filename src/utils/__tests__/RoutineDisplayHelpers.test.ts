/**
 * Tests unitaires pour RoutineDisplayHelpers - SPRINT 1
 * Validation des améliorations de l'homogénéisation des titres
 */

import { validateAndCleanTitle } from '../RoutineDisplayHelpers'

describe('validateAndCleanTitle - Sprint 1 Améliorations', () => {
  
  describe('Nettoyage artefacts IA', () => {
    test('should clean basic IA artifacts', () => {
      expect(validateAndCleanTitle('Nettoyage optimisé', 'cleansing'))
        .toBe('Nettoyage')
    })
    
    test('should clean multiple artifacts', () => {
      expect(validateAndCleanTitle('Hydratation renforcée → évolutif', 'hydration'))
        .toBe('Hydratation')
    })
    
    test('should clean undefined and null', () => {
      expect(validateAndCleanTitle('Traitement undefined null', 'treatment'))
        .toBe('Traitement')
    })
    
    test('should clean "je ne sais pas"', () => {
      expect(validateAndCleanTitle('je ne sais pas Nettoyage doux', 'cleansing'))
        .toBe('Nettoyage doux')
    })
  })

  describe('Standardisation par catégorie', () => {
    test('should standardize cleansing with product context', () => {
      const product = { name: 'CeraVe Gel', skinType: 'mixte' }
      expect(validateAndCleanTitle('CeraVe Gel Nettoyant', 'cleansing', product))
        .toBe('Nettoyage mixte')
    })
    
    test('should standardize treatment with target problem', () => {
      const product = { name: 'Niacinamide', targetProblem: 'acné' }
      expect(validateAndCleanTitle('Niacinamide 10% + Zinc', 'treatment', product))
        .toBe('Traitement acné')
    })
    
    test('should standardize hydration with skin type', () => {
      const product = { name: 'Moisturizer', skinType: 'sèche' }
      expect(validateAndCleanTitle('Daily Moisturizer', 'hydration', product))
        .toBe('Hydratation sèche')
    })
    
    test('should not standardize if product name not in title', () => {
      const product = { name: 'Other Product', skinType: 'mixte' }
      expect(validateAndCleanTitle('Nettoyage doux', 'cleansing', product))
        .toBe('Nettoyage doux')
    })
  })

  describe('Validation longueur', () => {
    test('should fallback for titles too short', () => {
      expect(validateAndCleanTitle('Net', 'cleansing'))
        .toBe('Nettoyage doux quotidien')
    })
    
    test('should fallback for titles too long', () => {
      const longTitle = 'A'.repeat(65)
      expect(validateAndCleanTitle(longTitle, 'cleansing'))
        .toBe('Nettoyage doux quotidien')
    })
    
    test('should accept titles with valid length', () => {
      expect(validateAndCleanTitle('Nettoyage doux quotidien', 'cleansing'))
        .toBe('Nettoyage doux quotidien')
    })
  })

  describe('Fallbacks intelligents', () => {
    test('should fallback for empty title', () => {
      expect(validateAndCleanTitle('', 'cleansing'))
        .toBe('Nettoyage doux quotidien')
    })
    
    test('should fallback for null title', () => {
      expect(validateAndCleanTitle(null as any, 'treatment'))
        .toBe('Soin ciblé')
    })
    
    test('should fallback for undefined title', () => {
      expect(validateAndCleanTitle(undefined as any, 'hydration'))
        .toBe('Hydratation adaptée')
    })
    
    test('should use enriched fallbacks for new categories', () => {
      expect(validateAndCleanTitle('', 'toning'))
        .toBe('Tonification équilibrante')
      
      expect(validateAndCleanTitle('', 'serum'))
        .toBe('Sérum concentré')
      
      expect(validateAndCleanTitle('', 'mask'))
        .toBe('Masque intensif')
    })
    
    test('should fallback to generic for unknown category', () => {
      expect(validateAndCleanTitle('', 'unknown-category'))
        .toBe('Soin personnalisé')
    })
  })

  describe('Cas limites', () => {
    test('should handle mixed case product names', () => {
      const product = { name: 'CeraVe GEL', skinType: 'mixte' }
      expect(validateAndCleanTitle('cerave gel nettoyant', 'cleansing', product))
        .toBe('Nettoyage mixte')
    })
    
    test('should handle product without context properties', () => {
      const product = { name: 'Some Product' }
      expect(validateAndCleanTitle('Some Product Cleanser', 'cleansing', product))
        .toBe('Nettoyage adapté')
    })
    
    test('should handle multiple spaces and formatting', () => {
      expect(validateAndCleanTitle('  Nettoyage    doux   ', 'cleansing'))
        .toBe('Nettoyage doux')
    })
    
    test('should preserve valid titles without product context', () => {
      expect(validateAndCleanTitle('Nettoyage personnalisé', 'cleansing'))
        .toBe('Nettoyage personnalisé')
    })
  })

  describe('Cohérence finale', () => {
    test('should clean undefined and preserve remaining text', () => {
      expect(validateAndCleanTitle('Title with undefined word', 'treatment'))
        .toBe('Title with word')
    })
    
    test('should clean null and preserve remaining text', () => {
      expect(validateAndCleanTitle('Title with null word', 'treatment'))
        .toBe('Title with word')
    })
    
    test('should fallback for titles that become too short after cleaning', () => {
      expect(validateAndCleanTitle('undefined null', 'treatment'))
        .toBe('Soin ciblé')
    })
    
    test('should preserve clean, valid titles', () => {
      expect(validateAndCleanTitle('Sérum vitamine C', 'serum'))
        .toBe('Sérum vitamine C')
    })
  })
})

describe('Integration avec catégories existantes', () => {
  test('should work with all existing categories', () => {
    const categories = [
      'cleansing', 'hydration', 'moisturizing', 'protection', 
      'treatment', 'exfoliation', 'spot-treatment', 'healing', 'repair'
    ]
    
    categories.forEach(category => {
      const result = validateAndCleanTitle('', category)
      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(5)
    })
  })
  
  test('should work with new categories', () => {
    const newCategories = [
      'toning', 'serum', 'mask', 'essence', 'oil', 'mist', 'balm'
    ]
    
    newCategories.forEach(category => {
      const result = validateAndCleanTitle('', category)
      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(5)
    })
  })
})
