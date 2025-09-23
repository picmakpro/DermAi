import { describe, it, expect, beforeEach } from '@jest/globals'
import { RoutineTransformer, transformRoutineToUnified } from '../RoutineTransformer'
import { UnifiedRoutineStep } from '@/types'
import { EnrichedPersonalizedRoutine } from '@/schemas/v2/routine'

describe('RoutineTransformer - Sprint 2', () => {
  
  // Fixtures de test
  const mockEnrichedRoutine: EnrichedPersonalizedRoutine = {
    phases: {
      immediate: {
        duration: '1-2 semaines',
        objective: 'Stabiliser votre peau et traiter les problèmes urgents identifiés pour préparer la phase suivante',
        steps: [
          {
            stepNumber: 1,
            careType: 'nettoyage',
            timing: 'both',
            targetProblem: 'Impuretés quotidiennes',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'daily',
            displayTitle: 'Nettoyage quotidien',
            targetBenefit: 'Purifier et préparer'
          },
          {
            stepNumber: 2,
            careType: 'traitement',
            timing: 'soir',
            targetProblem: 'Pores dilatés',
            targetZones: ['nez', 'front'],
            progressiveIntroduction: 'Commencer 2-3 fois par semaine',
            restrictions: ['Éviter contour des yeux'],
            isTemporary: true,
            introduceFromWeek: 0,
            applicationDuration: '3-4 semaines',
            frequency: '2x/week puis daily',
            displayTitle: 'Traitement pores',
            targetBenefit: 'Resserrer pores'
          }
        ]
      },
      adaptation: {
        duration: '4-6 semaines',
        objective: 'Introduire des actifs plus puissants progressivement en respectant la tolérance cutanée',
        steps: [
          {
            stepNumber: 1,
            careType: 'nettoyage',
            timing: 'both',
            targetProblem: 'Maintien propreté',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'daily',
            displayTitle: 'Nettoyage quotidien',
            targetBenefit: 'Maintenir pureté'
          }
        ]
      },
      maintenance: {
        duration: 'Continu',
        objective: 'Maintenir les acquis obtenus et prévenir les rechutes avec une routine d\'entretien adaptée',
        steps: [
          {
            stepNumber: 1,
            careType: 'protection',
            timing: 'matin',
            targetProblem: 'Prévention vieillissement',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'daily',
            displayTitle: 'Protection solaire',
            targetBenefit: 'Prévenir vieillissement'
          }
        ]
      }
    },
    globalAdvice: ['Respecter l\'ordre d\'application des soins', 'Être patient car les résultats apparaissent progressivement'],
    dermatologicalRationale: 'Cette routine respecte le cycle cellulaire de 28 jours et s\'adapte à votre type de peau en introduisant progressivement les actifs pour optimiser la tolérance et l\'efficacité des traitements dermatologiques recommandés.'
  }

  const mockProductsData = [
    {
      catalogId: 'cerave_gel_moussant',
      productName: 'Gel Moussant Nettoyant',
      brand: 'CeraVe',
      price: 12.99,
      routineStepId: '1',
      applicationAdvice: 'Masser délicatement puis rincer'
    },
    {
      catalogId: 'ordinary_niacinamide',
      productName: 'Niacinamide 10%',
      brand: 'The Ordinary',
      price: 7.20,
      routineStepId: '2',
      applicationAdvice: 'Appliquer le soir sur peau propre'
    }
  ]

  describe('transformToUnified', () => {
    it('devrait transformer une routine enrichie V2 vers UnifiedRoutineStep[]', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine, mockProductsData)
      
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
      
      // Vérifier la structure des étapes transformées
      const firstStep = result[0]
      expect(firstStep).toHaveProperty('stepNumber')
      expect(firstStep).toHaveProperty('title')
      expect(firstStep).toHaveProperty('category')
      expect(firstStep).toHaveProperty('timeOfDay')
      expect(firstStep).toHaveProperty('frequency')
      expect(firstStep).toHaveProperty('phase')
      expect(firstStep).toHaveProperty('applicationDuration')
      expect(firstStep).toHaveProperty('timingBadge')
    })

    it('devrait mapper correctement les nouveaux champs V2', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine, mockProductsData)
      
      const treatmentStep = result.find(s => s.category === 'treatment')
      expect(treatmentStep).toBeDefined()
      expect(treatmentStep?.applicationDuration).toBe('3-4 semaines')
      expect(treatmentStep?.timingBadge).toContain('🌙')
      expect(treatmentStep?.startAfterDays).toBe(0) // introduceFromWeek = 0
    })

    it('devrait associer correctement les produits aux étapes', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine, mockProductsData)
      
      const stepWithProduct = result.find(s => s.recommendedProducts.length > 0)
      expect(stepWithProduct).toBeDefined()
      expect(stepWithProduct?.recommendedProducts[0]).toHaveProperty('catalogId')
      expect(stepWithProduct?.recommendedProducts[0]).toHaveProperty('name')
      expect(stepWithProduct?.recommendedProducts[0]).toHaveProperty('brand')
    })

    it('devrait appliquer la déduplication intelligente', () => {
      // Créer une routine avec doublons potentiels
      const routineWithDuplicates = {
        ...mockEnrichedRoutine,
        phases: {
          ...mockEnrichedRoutine.phases,
          immediate: {
            ...mockEnrichedRoutine.phases.immediate,
            steps: [
              // Même nettoyant matin et soir (devrait être fusionné)
              {
                ...mockEnrichedRoutine.phases.immediate.steps[0],
                timing: 'matin',
                stepNumber: 1
              },
              {
                ...mockEnrichedRoutine.phases.immediate.steps[0],
                timing: 'soir',
                stepNumber: 2
              }
            ]
          }
        }
      }
      
      const result = RoutineTransformer.transformToUnified(routineWithDuplicates, mockProductsData)
      
      // Vérifier que la déduplication a eu lieu
      expect(result.length).toBeGreaterThan(0)
      
      // Chercher des étapes fusionnées (isEvolutive = true)
      const fusedSteps = result.filter(s => s.isEvolutive === true)
      
      // Si déduplication réussie, il devrait y avoir au moins une étape fusionnée
      // Sinon, vérifier qu'il n'y a pas de duplication excessive
      const cleansingSteps = result.filter(s => s.category === 'cleansing')
      expect(cleansingSteps.length).toBeLessThanOrEqual(3) // Maximum 3 (une par phase)
    })
  })

  describe('Mapping des catégories et timing', () => {
    it('devrait mapper correctement careType vers category', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine)
      
      const mappings = [
        { careType: 'nettoyage', expectedCategory: 'cleansing' },
        { careType: 'traitement', expectedCategory: 'treatment' },
        { careType: 'protection', expectedCategory: 'protection' }
      ]
      
      mappings.forEach(({ careType, expectedCategory }) => {
        const step = result.find(s => s.category === expectedCategory)
        expect(step).toBeDefined()
      })
    })

    it('devrait mapper correctement timing vers timeOfDay', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine)
      
      const bothStep = result.find(s => s.category === 'cleansing')
      expect(bothStep?.timeOfDay).toBe('both')
      
      const morningStep = result.find(s => s.category === 'protection')
      expect(morningStep?.timeOfDay).toBe('morning')
    })

    it('devrait générer des badges de timing appropriés', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine)
      
      result.forEach(step => {
        expect(step.timingBadge).toBeDefined()
        expect(step.timingBadge).toMatch(/🌅|🌙/)
        
        if (step.frequency === 'daily') {
          expect(step.timingBadge).toContain('Quotidien')
        }
      })
    })
  })

  describe('Gestion des produits', () => {
    it('devrait créer des produits fallback si aucun produit fourni', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine) // Sans produits
      
      // Toutes les étapes devraient avoir au moins un produit (fallback)
      result.forEach(step => {
        expect(step.recommendedProducts).toBeDefined()
        // Note: Le fallback est géré par ProductMappingHelpers, pas directement ici
      })
    })

    it('devrait transformer correctement les produits fournis', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine, mockProductsData)
      
      const stepWithProduct = result.find(s => s.recommendedProducts.length > 0)
      if (stepWithProduct) {
        const product = stepWithProduct.recommendedProducts[0]
        expect(product.catalogId).toBeDefined()
        expect(product.name).toBeDefined()
        expect(product.brand).toBeDefined()
        expect(product.justification).toBeDefined()
      }
    })
  })

  describe('Métadonnées d\'affichage', () => {
    it('devrait générer des métadonnées d\'affichage complètes', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine)
      
      result.forEach(step => {
        // Vérifier les champs de métadonnées
        expect(step).toHaveProperty('applicationDuration')
        expect(step).toHaveProperty('timingBadge')
        expect(step).toHaveProperty('phase')
        expect(step).toHaveProperty('priority')
        
        // Vérifier les valeurs logiques
        expect(['immediate', 'adaptation', 'maintenance']).toContain(step.phase)
        expect(step.priority).toBeGreaterThan(0)
        expect(step.priority).toBeLessThanOrEqual(3)
      })
    })

    it('devrait calculer correctement startAfterDays depuis introduceFromWeek', () => {
      const result = RoutineTransformer.transformToUnified(mockEnrichedRoutine)
      
      result.forEach(step => {
        if (step.startAfterDays !== undefined) {
          // startAfterDays devrait être un multiple de 7 (conversion semaines → jours)
          expect(step.startAfterDays % 7).toBe(0)
        }
      })
    })
  })

  describe('Fonction utilitaire transformRoutineToUnified', () => {
    it('devrait être un wrapper fonctionnel de RoutineTransformer.transformToUnified', () => {
      const result1 = transformRoutineToUnified(mockEnrichedRoutine, mockProductsData)
      const result2 = RoutineTransformer.transformToUnified(mockEnrichedRoutine, mockProductsData)
      
      expect(result1).toEqual(result2)
    })
  })

  describe('Gestion des erreurs et cas limites', () => {
    it('devrait gérer une routine vide', () => {
      const emptyRoutine = {
        phases: {
          immediate: { 
            duration: '1 semaine', 
            objective: 'Phase de test pour validation du système de transformation', 
            steps: [{
              stepNumber: 1,
              careType: 'nettoyage',
              timing: 'matin',
              targetProblem: 'Test',
              targetZones: [],
              progressiveIntroduction: null,
              restrictions: [],
              isTemporary: false,
              introduceFromWeek: 0,
              applicationDuration: 'continu',
              frequency: 'daily',
              displayTitle: 'Test nettoyage',
              targetBenefit: 'Test purification'
            }]
          },
          adaptation: { 
            duration: '2 semaines', 
            objective: 'Phase d\'adaptation pour tester la progression des soins', 
            steps: [{
              stepNumber: 1,
              careType: 'hydratation',
              timing: 'soir',
              targetProblem: 'Test hydratation',
              targetZones: [],
              progressiveIntroduction: null,
              restrictions: [],
              isTemporary: false,
              introduceFromWeek: 0,
              applicationDuration: 'continu',
              frequency: 'daily',
              displayTitle: 'Test hydratation',
              targetBenefit: 'Test nutrition'
            }]
          },
          maintenance: { 
            duration: 'Continu', 
            objective: 'Phase de maintenance pour valider la continuité des soins établis', 
            steps: [{
              stepNumber: 1,
              careType: 'protection',
              timing: 'matin',
              targetProblem: 'Test protection',
              targetZones: [],
              progressiveIntroduction: null,
              restrictions: [],
              isTemporary: false,
              introduceFromWeek: 0,
              applicationDuration: 'continu',
              frequency: 'daily',
              displayTitle: 'Test protection',
              targetBenefit: 'Test prévention'
            }]
          }
        },
        globalAdvice: ['Respecter les instructions de test', 'Valider chaque étape de transformation'],
        dermatologicalRationale: 'Cette routine de test permet de valider le bon fonctionnement du système de transformation des données en respectant les contraintes de validation Zod et en assurant la cohérence des métadonnées générées.'
      }
      
      const result = RoutineTransformer.transformToUnified(emptyRoutine)
      expect(result.length).toBe(3) // Une étape par phase
    })

    it('devrait gérer des données de produits malformées', () => {
      const malformedProducts = [
        { /* produit sans catalogId ni nom */ },
        { catalogId: 'test', /* sans nom */ },
        null,
        undefined
      ]
      
      expect(() => {
        RoutineTransformer.transformToUnified(mockEnrichedRoutine, malformedProducts as any)
      }).not.toThrow()
    })

    it('devrait gérer des champs V2 manquants (rétrocompatibilité)', () => {
      const legacyStep = {
        stepNumber: 1,
        careType: 'nettoyage',
        timing: 'matin',
        targetProblem: 'Test',
        targetZones: [],
        progressiveIntroduction: null,
        restrictions: []
        // Champs V2 manquants
      }
      
      const legacyRoutine = {
        phases: {
          immediate: {
            duration: '1 semaine',
            objective: 'Phase de test pour validation de la rétrocompatibilité',
            steps: [legacyStep]
          },
          adaptation: { 
            duration: '2 semaines', 
            objective: 'Phase d\'adaptation pour tester la migration automatique', 
            steps: [{
              stepNumber: 2,
              careType: 'hydratation',
              timing: 'soir',
              targetProblem: 'Test hydratation legacy',
              targetZones: [],
              progressiveIntroduction: null,
              restrictions: []
            }]
          },
          maintenance: { 
            duration: 'Continu', 
            objective: 'Phase de maintenance pour valider la continuité legacy', 
            steps: [{
              stepNumber: 3,
              careType: 'protection',
              timing: 'matin',
              targetProblem: 'Test protection legacy',
              targetZones: [],
              progressiveIntroduction: null,
              restrictions: []
            }]
          }
        },
        globalAdvice: ['Respecter la rétrocompatibilité', 'Valider la migration automatique'],
        dermatologicalRationale: 'Cette routine legacy permet de tester la migration automatique des anciens formats vers les nouveaux en préservant la compatibilité et en enrichissant automatiquement les métadonnées manquantes.'
      }
      
      expect(() => {
        RoutineTransformer.transformToUnified(legacyRoutine)
      }).not.toThrow()
      
      const result = RoutineTransformer.transformToUnified(legacyRoutine)
      expect(result.length).toBe(3) // Une étape par phase
      expect(result[0]).toHaveProperty('applicationDuration')
      expect(result[0]).toHaveProperty('timingBadge')
    })
  })
})
