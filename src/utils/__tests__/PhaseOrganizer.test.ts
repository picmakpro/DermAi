import { describe, it, expect } from '@jest/globals'
import { PhaseOrganizer, organizeRoutineByPhaseAndTime, PhaseOrganization } from '../PhaseOrganizer'
import { UnifiedRoutineStep } from '@/types'

describe('PhaseOrganizer - Sprint 2', () => {
  
  // Fixtures de test
  const mockRoutineSteps: UnifiedRoutineStep[] = [
    // Phase immédiate - Nettoyage matin
    {
      stepNumber: 1,
      title: 'Nettoyage doux',
      description: 'Nettoyage quotidien',
      targetArea: 'global',
      zones: [],
      recommendedProducts: [{
        id: 'cerave_gel',
        catalogId: 'cerave_gel_moussant',
        name: 'Gel Moussant',
        brand: 'CeraVe',
        category: 'cleanser',
        price: 12.99
      }],
      applicationAdvice: 'Masser délicatement',
      restrictions: [],
      treatmentType: 'cleansing',
      priority: 1,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'morning',
      category: 'cleansing',
      applicationDuration: 'continu'
    },
    // Phase immédiate - Même nettoyage soir (à fusionner)
    {
      stepNumber: 2,
      title: 'Nettoyage doux',
      description: 'Nettoyage quotidien',
      targetArea: 'global',
      zones: [],
      recommendedProducts: [{
        id: 'cerave_gel',
        catalogId: 'cerave_gel_moussant',
        name: 'Gel Moussant',
        brand: 'CeraVe',
        category: 'cleanser',
        price: 12.99
      }],
      applicationAdvice: 'Masser délicatement',
      restrictions: [],
      treatmentType: 'cleansing',
      priority: 1,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'evening',
      category: 'cleansing',
      applicationDuration: 'continu',
      isTemporary: false
    },
    // Phase immédiate - Traitement temporaire soir
    {
      stepNumber: 3,
      title: 'Traitement pores',
      description: 'Resserrer les pores',
      targetArea: 'specific',
      zones: ['nez', 'front'],
      recommendedProducts: [{
        id: 'ordinary_niacinamide',
        catalogId: 'ordinary_niacinamide_10',
        name: 'Niacinamide 10%',
        brand: 'The Ordinary',
        category: 'serum',
        price: 7.20
      }],
      applicationAdvice: 'Appliquer le soir',
      restrictions: ['Éviter contour des yeux'],
      treatmentType: 'treatment',
      priority: 1,
      phase: 'immediate',
      frequency: 'daily',
      timeOfDay: 'evening',
      category: 'treatment',
      applicationDuration: '3-4 semaines',
      isTemporary: true
    },
    // Phase immédiate - Exfoliation hebdomadaire
    {
      stepNumber: 4,
      title: 'Peeling AHA',
      description: 'Exfoliation douce',
      targetArea: 'global',
      zones: [],
      recommendedProducts: [{
        id: 'paula_choice_aha',
        catalogId: 'paula_choice_aha_8',
        name: 'AHA 8%',
        brand: "Paula's Choice",
        category: 'exfoliant',
        price: 35.00
      }],
      applicationAdvice: 'Une fois par semaine le soir',
      restrictions: ['Éviter exposition solaire 48h'],
      treatmentType: 'treatment',
      priority: 1,
      phase: 'immediate',
      frequency: 'weekly',
      timeOfDay: 'evening',
      category: 'exfoliation',
      applicationDuration: '2-3 semaines'
    },
    // Phase adaptation - Nettoyage (même produit, doit être fusionné avec phase immédiate)
    {
      stepNumber: 5,
      title: 'Nettoyage doux',
      description: 'Maintien nettoyage',
      targetArea: 'global',
      zones: [],
      recommendedProducts: [{
        id: 'cerave_gel',
        catalogId: 'cerave_gel_moussant',
        name: 'Gel Moussant',
        brand: 'CeraVe',
        category: 'cleanser',
        price: 12.99
      }],
      applicationAdvice: 'Continuer routine',
      restrictions: [],
      treatmentType: 'cleansing',
      priority: 2,
      phase: 'adaptation',
      frequency: 'daily',
      timeOfDay: 'both',
      category: 'cleansing',
      applicationDuration: 'continu',
      isTemporary: false
    },
    // Phase maintenance - Protection solaire
    {
      stepNumber: 6,
      title: 'Protection SPF 50',
      description: 'Protection UV quotidienne',
      targetArea: 'global',
      zones: [],
      recommendedProducts: [{
        id: 'lrp_anthelios',
        catalogId: 'lrp_anthelios_fluid',
        name: 'Anthelios Fluid',
        brand: 'La Roche-Posay',
        category: 'sunscreen',
        price: 18.50
      }],
      applicationAdvice: 'Appliquer généreusement le matin',
      restrictions: [],
      treatmentType: 'protection',
      priority: 3,
      phase: 'maintenance',
      frequency: 'daily',
      timeOfDay: 'morning',
      category: 'protection',
      applicationDuration: 'continu',
      isTemporary: false
    }
  ]

  describe('organizeByPhaseAndTime', () => {
    it('devrait organiser correctement les étapes par phase et horaire', () => {
      const result = PhaseOrganizer.organizeByPhaseAndTime(mockRoutineSteps)
      
      // Vérifier la structure de base
      expect(result).toHaveProperty('immediate')
      expect(result).toHaveProperty('adaptation')
      expect(result).toHaveProperty('maintenance')
      
      // Chaque phase devrait avoir morning, evening, weekly
      Object.values(result).forEach(phase => {
        expect(phase).toHaveProperty('morning')
        expect(phase).toHaveProperty('evening')
        expect(phase).toHaveProperty('weekly')
        expect(Array.isArray(phase.morning)).toBe(true)
        expect(Array.isArray(phase.evening)).toBe(true)
        expect(Array.isArray(phase.weekly)).toBe(true)
      })
    })

    it('devrait séparer correctement les soins hebdomadaires', () => {
      const result = PhaseOrganizer.organizeByPhaseAndTime(mockRoutineSteps)
      
      // L'exfoliation devrait être dans weekly
      expect(result.immediate.weekly.length).toBe(1)
      expect(result.immediate.weekly[0].category).toBe('exfoliation')
      expect(result.immediate.weekly[0].frequency).toBe('weekly')
    })

    it('devrait appliquer la déduplication intelligente', () => {
      const result = PhaseOrganizer.organizeByPhaseAndTime(mockRoutineSteps)
      
      // Le nettoyage matin + soir devrait être fusionné en une seule étape 'both'
      const immediateCleansingSteps = result.immediate.morning
        .concat(result.immediate.evening)
        .filter(s => s.category === 'cleansing')
      
      // Devrait y avoir une seule étape de nettoyage fusionnée
      const fusedCleansing = immediateCleansingSteps.find(s => s.timeOfDay === 'both')
      expect(fusedCleansing).toBeDefined()
      expect(fusedCleansing?.isEvolutive).toBe(true)
      expect(fusedCleansing?.title).toContain('matin et soir')
    })

    it('devrait préserver les traitements temporaires sans les fusionner', () => {
      const result = PhaseOrganizer.organizeByPhaseAndTime(mockRoutineSteps)
      
      // Le traitement temporaire devrait rester séparé
      const treatmentSteps = result.immediate.evening.filter(s => s.category === 'treatment')
      expect(treatmentSteps.length).toBeGreaterThan(0)
      
      const temporaryTreatment = treatmentSteps.find(s => (s as any).isTemporary)
      expect(temporaryTreatment).toBeDefined()
      expect(temporaryTreatment?.timeOfDay).toBe('evening') // Pas fusionné
    })

    it('devrait trier les étapes par ordre d\'application', () => {
      const result = PhaseOrganizer.organizeByPhaseAndTime(mockRoutineSteps)
      
      // Vérifier l'ordre dans morning : cleansing → treatment → hydration → protection
      const morningSteps = result.immediate.morning
      if (morningSteps.length > 1) {
        for (let i = 0; i < morningSteps.length - 1; i++) {
          const currentOrder = getApplicationOrder(morningSteps[i])
          const nextOrder = getApplicationOrder(morningSteps[i + 1])
          expect(currentOrder).toBeLessThanOrEqual(nextOrder)
        }
      }
    })
  })

  describe('Utilitaires de validation', () => {
    it('countTotalSteps devrait compter correctement toutes les étapes', () => {
      const organization = PhaseOrganizer.organizeByPhaseAndTime(mockRoutineSteps)
      const totalSteps = PhaseOrganizer.countTotalSteps(organization)
      
      expect(totalSteps).toBeGreaterThan(0)
      expect(typeof totalSteps).toBe('number')
    })

    it('extractCatalogIds devrait extraire tous les catalogIds uniques', () => {
      const organization = PhaseOrganizer.organizeByPhaseAndTime(mockRoutineSteps)
      const catalogIds = PhaseOrganizer.extractCatalogIds(organization)
      
      expect(Array.isArray(catalogIds)).toBe(true)
      expect(catalogIds.length).toBeGreaterThan(0)
      
      // Vérifier qu'il n'y a pas de doublons
      const uniqueIds = new Set(catalogIds)
      expect(catalogIds.length).toBe(uniqueIds.size)
      
      // Vérifier que les IDs sont bien des strings non vides
      catalogIds.forEach(id => {
        expect(typeof id).toBe('string')
        expect(id.length).toBeGreaterThan(0)
      })
    })

    it('validateOrganization devrait détecter les problèmes de cohérence', () => {
      const organization = PhaseOrganizer.organizeByPhaseAndTime(mockRoutineSteps)
      const validation = PhaseOrganizer.validateOrganization(organization)
      
      expect(validation).toHaveProperty('isValid')
      expect(validation).toHaveProperty('issues')
      expect(typeof validation.isValid).toBe('boolean')
      expect(Array.isArray(validation.issues)).toBe(true)
    })
  })

  describe('Cas limites et gestion d\'erreurs', () => {
    it('devrait gérer une routine vide', () => {
      const result = PhaseOrganizer.organizeByPhaseAndTime([])
      
      expect(result.immediate.morning).toEqual([])
      expect(result.immediate.evening).toEqual([])
      expect(result.immediate.weekly).toEqual([])
      expect(result.adaptation.morning).toEqual([])
      expect(result.adaptation.evening).toEqual([])
      expect(result.adaptation.weekly).toEqual([])
      expect(result.maintenance.morning).toEqual([])
      expect(result.maintenance.evening).toEqual([])
      expect(result.maintenance.weekly).toEqual([])
    })

    it('devrait gérer des étapes sans produits recommandés', () => {
      const stepsWithoutProducts: UnifiedRoutineStep[] = [
        {
          stepNumber: 1,
          title: 'Étape sans produit',
          description: 'Test',
          targetArea: 'global',
          zones: [],
          recommendedProducts: [], // Vide
          applicationAdvice: 'Test',
          restrictions: [],
          treatmentType: 'cleansing',
          priority: 1,
          phase: 'immediate',
          frequency: 'daily',
          timeOfDay: 'morning',
          category: 'cleansing'
        }
      ]
      
      expect(() => {
        PhaseOrganizer.organizeByPhaseAndTime(stepsWithoutProducts)
      }).not.toThrow()
      
      const result = PhaseOrganizer.organizeByPhaseAndTime(stepsWithoutProducts)
      expect(result.immediate.morning.length).toBe(1)
    })

    it('devrait gérer des phases manquantes', () => {
      const stepsOnlyImmediate = mockRoutineSteps.filter(s => s.phase === 'immediate')
      
      const result = PhaseOrganizer.organizeByPhaseAndTime(stepsOnlyImmediate)
      
      // Les phases vides devraient avoir des arrays vides
      expect(result.adaptation.morning).toEqual([])
      expect(result.adaptation.evening).toEqual([])
      expect(result.adaptation.weekly).toEqual([])
      expect(result.maintenance.morning).toEqual([])
      expect(result.maintenance.evening).toEqual([])
      expect(result.maintenance.weekly).toEqual([])
      
      // La phase immediate devrait avoir du contenu
      const immediateTotal = result.immediate.morning.length + 
                           result.immediate.evening.length + 
                           result.immediate.weekly.length
      expect(immediateTotal).toBeGreaterThan(0)
    })

    it('devrait gérer des timings non standard', () => {
      const stepsWithCustomTiming: UnifiedRoutineStep[] = [
        {
          ...mockRoutineSteps[0],
          timeOfDay: 'both', // Déjà fusionné
          timing: 'matin et soir personnalisé'
        }
      ]
      
      expect(() => {
        PhaseOrganizer.organizeByPhaseAndTime(stepsWithCustomTiming)
      }).not.toThrow()
      
      const result = PhaseOrganizer.organizeByPhaseAndTime(stepsWithCustomTiming)
      
      // L'étape 'both' devrait apparaître dans matin ET soir
      expect(result.immediate.morning.length).toBeGreaterThan(0)
      expect(result.immediate.evening.length).toBeGreaterThan(0)
    })
  })

  describe('Fonction utilitaire organizeRoutineByPhaseAndTime', () => {
    it('devrait être un wrapper fonctionnel de PhaseOrganizer.organizeByPhaseAndTime', () => {
      const result1 = organizeRoutineByPhaseAndTime(mockRoutineSteps)
      const result2 = PhaseOrganizer.organizeByPhaseAndTime(mockRoutineSteps)
      
      expect(result1).toEqual(result2)
    })
  })

  describe('Performance et robustesse', () => {
    it('devrait gérer une routine complexe avec de nombreuses étapes', () => {
      // Créer une routine avec 20+ étapes
      const complexSteps: UnifiedRoutineStep[] = []
      
      for (let i = 1; i <= 25; i++) {
        complexSteps.push({
          stepNumber: i,
          title: `Étape ${i}`,
          description: `Description ${i}`,
          targetArea: 'global',
          zones: [],
          recommendedProducts: [{
            id: `product_${i}`,
            catalogId: `catalog_${i}`,
            name: `Produit ${i}`,
            brand: 'Test Brand',
            category: 'test',
            price: 10.00
          }],
          applicationAdvice: `Conseil ${i}`,
          restrictions: [],
          treatmentType: 'treatment',
          priority: (i % 3) + 1,
          phase: ['immediate', 'adaptation', 'maintenance'][i % 3] as any,
          frequency: i % 7 === 0 ? 'weekly' : 'daily',
          timeOfDay: ['morning', 'evening', 'both'][i % 3] as any,
          category: ['cleansing', 'treatment', 'hydration', 'protection'][i % 4] as any
        })
      }
      
      const start = performance.now()
      const result = PhaseOrganizer.organizeByPhaseAndTime(complexSteps)
      const end = performance.now()
      
      // Vérifier que l'organisation s'est bien passée
      const totalOrganized = PhaseOrganizer.countTotalSteps(result)
      expect(totalOrganized).toBeGreaterThan(0)
      
      // Vérifier la performance (< 100ms pour 25 étapes)
      expect(end - start).toBeLessThan(100)
    })
  })
})

// Fonction utilitaire pour les tests
function getApplicationOrder(step: UnifiedRoutineStep): number {
  const orderMap = {
    'cleansing': 1,
    'treatment': 2,
    'hydration': 3,
    'protection': 4,
    'exfoliation': 2.5
  }
  return orderMap[step.category] || 3
}

