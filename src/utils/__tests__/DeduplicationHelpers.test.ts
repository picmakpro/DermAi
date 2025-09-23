/**
 * Tests unitaires pour les helpers de déduplication - SPRINT 2
 * Validation de la logique de déduplication intelligente
 */

import type { UnifiedRoutineStep } from '@/types'

describe('Déduplication Helpers - Sprint 2', () => {
  
  const createMockStep = (overrides: Partial<UnifiedRoutineStep> = {}): UnifiedRoutineStep => ({
    stepNumber: 1,
    title: 'Test Step',
    category: 'cleansing',
    timeOfDay: 'morning',
    frequency: 'daily',
    phase: 'immediate',
    applicationAdvice: 'Test advice',
    applicationDuration: 'En continu',
    recommendedProducts: [{ name: 'Test Product', price: 10 }],
    targetArea: 'global',
    zones: [],
    ...overrides
  })

  // Fonctions utilitaires simulées (normalement dans UnifiedRoutineSection)
  const generateProductKey = (step: UnifiedRoutineStep): string => {
    const category = step.category as string
    
    if (category === 'cleansing') return 'Nettoyage quotidien'
    if (category === 'protection') return 'Protection solaire'
    if (category === 'hydration' || category === 'moisturizing') return 'Hydratation de base'
    
    if (category === 'treatment') {
      const problem = step.targetArea || step.zones?.[0] || 'général'
      return `Traitement ${problem}`
    }
    
    if (category === 'exfoliation') {
      return `${step.title}_${step.stepNumber}`
    }
    
    if (category === 'spot-treatment' || category === 'healing') {
      const zone = step.zones?.[0] || step.targetArea || 'localisé'
      return `${category}_${zone}`
    }
    
    return step.title
  }

  const getMergedTiming = (timings: string[]): string => {
    const uniqueTimings = [...new Set(timings)]
    
    if (uniqueTimings.includes('both')) return 'both'
    if (uniqueTimings.includes('morning') && uniqueTimings.includes('evening')) return 'both'
    if (uniqueTimings.length === 1) return uniqueTimings[0]
    
    return 'both'
  }

  describe('generateProductKey', () => {
    test('should generate consistent keys for cleansing products', () => {
      const step1 = createMockStep({ category: 'cleansing', title: 'CeraVe Gel' })
      const step2 = createMockStep({ category: 'cleansing', title: 'Effaclar Gel' })
      
      expect(generateProductKey(step1)).toBe('Nettoyage quotidien')
      expect(generateProductKey(step2)).toBe('Nettoyage quotidien')
      expect(generateProductKey(step1)).toBe(generateProductKey(step2))
    })

    test('should generate consistent keys for protection products', () => {
      const step1 = createMockStep({ category: 'protection', title: 'La Roche Posay SPF50' })
      const step2 = createMockStep({ category: 'protection', title: 'Avène SPF30' })
      
      expect(generateProductKey(step1)).toBe('Protection solaire')
      expect(generateProductKey(step2)).toBe('Protection solaire')
    })

    test('should generate consistent keys for hydration products', () => {
      const step1 = createMockStep({ category: 'hydration', title: 'Hydratant A' })
      const step2 = createMockStep({ category: 'moisturizing', title: 'Hydratant B' })
      
      expect(generateProductKey(step1)).toBe('Hydratation de base')
      expect(generateProductKey(step2)).toBe('Hydratation de base')
    })

    test('should differentiate treatments by target area', () => {
      const step1 = createMockStep({ 
        category: 'treatment', 
        targetArea: 'nez',
        zones: ['nez']
      })
      const step2 = createMockStep({ 
        category: 'treatment', 
        targetArea: 'joues',
        zones: ['joues']
      })
      
      expect(generateProductKey(step1)).toBe('Traitement nez')
      expect(generateProductKey(step2)).toBe('Traitement joues')
      expect(generateProductKey(step1)).not.toBe(generateProductKey(step2))
    })

    test('should keep exfoliants separate', () => {
      const step1 = createMockStep({ 
        category: 'exfoliation', 
        title: 'Exfoliant A',
        stepNumber: 1
      })
      const step2 = createMockStep({ 
        category: 'exfoliation', 
        title: 'Exfoliant B',
        stepNumber: 2
      })
      
      expect(generateProductKey(step1)).toBe('Exfoliant A_1')
      expect(generateProductKey(step2)).toBe('Exfoliant B_2')
      expect(generateProductKey(step1)).not.toBe(generateProductKey(step2))
    })

    test('should group spot treatments by zone', () => {
      const step1 = createMockStep({ 
        category: 'spot-treatment',
        zones: ['front']
      })
      const step2 = createMockStep({ 
        category: 'spot-treatment',
        zones: ['front']
      })
      
      expect(generateProductKey(step1)).toBe('spot-treatment_front')
      expect(generateProductKey(step2)).toBe('spot-treatment_front')
      expect(generateProductKey(step1)).toBe(generateProductKey(step2))
    })

    test('should fallback to title for unknown categories', () => {
      const step = createMockStep({ 
        category: 'unknown-category' as any,
        title: 'Custom Product'
      })
      
      expect(generateProductKey(step)).toBe('Custom Product')
    })
  })

  describe('getMergedTiming', () => {
    test('should return "both" when both morning and evening present', () => {
      expect(getMergedTiming(['morning', 'evening'])).toBe('both')
    })

    test('should return "both" when "both" is present', () => {
      expect(getMergedTiming(['both'])).toBe('both')
      expect(getMergedTiming(['morning', 'both'])).toBe('both')
    })

    test('should return single timing when only one present', () => {
      expect(getMergedTiming(['morning'])).toBe('morning')
      expect(getMergedTiming(['evening'])).toBe('evening')
    })

    test('should handle duplicate timings', () => {
      expect(getMergedTiming(['morning', 'morning'])).toBe('morning')
      expect(getMergedTiming(['evening', 'evening', 'evening'])).toBe('evening')
    })

    test('should fallback to "both" for complex cases', () => {
      expect(getMergedTiming(['morning', 'evening', 'both'])).toBe('both')
    })

    test('should handle empty array', () => {
      expect(getMergedTiming([])).toBe('both')
    })
  })

  describe('Logique de regroupement', () => {
    test('should group steps by product key', () => {
      const steps = [
        createMockStep({ category: 'cleansing', timeOfDay: 'morning', title: 'Nettoyant A' }),
        createMockStep({ category: 'cleansing', timeOfDay: 'evening', title: 'Nettoyant B' }),
        createMockStep({ category: 'protection', timeOfDay: 'morning', title: 'SPF A' }),
        createMockStep({ category: 'protection', timeOfDay: 'both', title: 'SPF B' })
      ]

      const groups = new Map<string, UnifiedRoutineStep[]>()
      
      steps.forEach(step => {
        const key = generateProductKey(step)
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(step)
      })

      expect(groups.size).toBe(2) // Nettoyage + Protection
      expect(groups.get('Nettoyage quotidien')).toHaveLength(2)
      expect(groups.get('Protection solaire')).toHaveLength(2)
    })

    test('should not group different treatment zones', () => {
      const steps = [
        createMockStep({ 
          category: 'treatment', 
          zones: ['nez'],
          targetArea: 'nez'
        }),
        createMockStep({ 
          category: 'treatment', 
          zones: ['joues'],
          targetArea: 'joues'
        })
      ]

      const groups = new Map<string, UnifiedRoutineStep[]>()
      
      steps.forEach(step => {
        const key = generateProductKey(step)
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(step)
      })

      expect(groups.size).toBe(2) // Traitement nez + Traitement joues
      expect(groups.get('Traitement nez')).toHaveLength(1)
      expect(groups.get('Traitement joues')).toHaveLength(1)
    })
  })

  describe('Cas limites', () => {
    test('should handle steps without zones', () => {
      const step = createMockStep({ 
        category: 'treatment',
        zones: [],
        targetArea: undefined
      })
      
      expect(generateProductKey(step)).toBe('Traitement général')
    })

    test('should handle steps without recommended products', () => {
      const step = createMockStep({ 
        recommendedProducts: [],
        title: 'Step without products'
      })
      
      expect(generateProductKey(step)).toBe('Nettoyage quotidien') // Basé sur category
    })

    test('should handle undefined targetArea', () => {
      const step = createMockStep({ 
        category: 'spot-treatment',
        targetArea: undefined,
        zones: []
      })
      
      expect(generateProductKey(step)).toBe('spot-treatment_localisé')
    })
  })
})
