/**
 * 🧪 TESTS SPRINT 3 - ROUTINE DISPLAY HELPERS
 * 
 * Tests pour les nouvelles fonctionnalités de formatage des durées
 * avec contexte de phase et fréquences précises.
 */

import { 
  formatApplicationDuration, 
  type PhaseContext 
} from '../RoutineDisplayHelpers'
import type { UnifiedRoutineStep } from '@/types'

describe('RoutineDisplayHelpers - Sprint 3', () => {

  const mockPhaseContext: PhaseContext = {
    phaseWeeks: 4,
    previousPhaseCompleted: false,
    userSkinType: 'normal',
    hasUrgentIssues: false
  }

  describe('formatApplicationDuration', () => {
    
    test('should format progressive frequency with context', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Sérum actif',
        category: 'treatment',
        phase: 'adaptation',
        timeOfDay: 'evening',
        frequency: 'progressive',
        applicationAdvice: 'Commencer doucement',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('Commencer 2x/semaine, puis quotidien après 2 semaines')
    })
    
    test('should format weekly frequency for exfoliation', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Exfoliant doux',
        category: 'exfoliation',
        phase: 'adaptation',
        timeOfDay: 'evening',
        frequency: 'weekly',
        applicationAdvice: 'Éviter le contour des yeux',
        zones: ['front', 'nez'], // 2 zones = intensité modérée
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('1x par semaine')
    })
    
    test('should format weekly frequency for light exfoliation', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Exfoliant très doux',
        category: 'exfoliation',
        phase: 'adaptation',
        timeOfDay: 'evening',
        frequency: 'weekly',
        applicationAdvice: 'Très doux',
        zones: ['front', 'nez', 'joues'], // 3+ zones = intensité légère
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('2x par semaine maximum')
    })
    
    test('should format weekly frequency for treatment with zones', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Traitement ciblé',
        category: 'treatment',
        phase: 'adaptation',
        timeOfDay: 'evening',
        frequency: 'weekly',
        applicationAdvice: 'Application localisée',
        zones: ['nez'],
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('Commencer 2x/semaine, augmenter selon tolérance')
    })
    
    test('should format visual criteria with estimations', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Soin cicatrisant',
        category: 'healing',
        phase: 'immediate',
        timeOfDay: 'both',
        frequency: 'daily',
        applicationAdvice: 'Jusqu\'à cicatrisation complète',
        applicationDuration: 'Jusqu\'à cicatrisation',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('Jusqu\'à cicatrisation (7-14 jours estimés)')
    })
    
    test('should format visual criteria for improvement', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Traitement anti-imperfections',
        category: 'treatment',
        phase: 'adaptation',
        timeOfDay: 'evening',
        frequency: 'daily',
        applicationAdvice: 'Patience requise',
        applicationDuration: 'Jusqu\'à amélioration visible',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('Jusqu\'à amélioration (2-4 semaines estimées)')
    })
    
    test('should format visual criteria for disappearance', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Traitement taches',
        category: 'treatment',
        phase: 'maintenance',
        timeOfDay: 'evening',
        frequency: 'daily',
        applicationAdvice: 'Persévérance nécessaire',
        applicationDuration: 'Jusqu\'à disparition des taches',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('Jusqu\'à disparition (3-6 semaines estimées)')
    })
    
    test('should handle standard duration with formatting', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Hydratant',
        category: 'hydration',
        phase: 'immediate',
        timeOfDay: 'both',
        frequency: 'daily',
        applicationAdvice: 'Matin et soir',
        applicationDuration: '2-3 semaines',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('2-3 semaines')
    })
    
    test('should default to "En continu" when no duration specified', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Nettoyant',
        category: 'cleansing',
        phase: 'immediate',
        timeOfDay: 'both',
        frequency: 'daily',
        applicationAdvice: 'Quotidien',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('En continu')
    })
  })

  describe('progressive duration calculation', () => {
    
    test('should adjust intro weeks based on phase context', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Actif puissant',
        category: 'treatment',
        phase: 'adaptation',
        timeOfDay: 'evening',
        frequency: 'progressive',
        applicationAdvice: 'Introduction progressive',
        recommendedProducts: []
      }
      
      const shortPhaseContext = { ...mockPhaseContext, phaseWeeks: 2 }
      const longPhaseContext = { ...mockPhaseContext, phaseWeeks: 8 }
      
      const shortResult = formatApplicationDuration(step, shortPhaseContext)
      const longResult = formatApplicationDuration(step, longPhaseContext)
      
      expect(shortResult).toBe('Commencer 2x/semaine, puis quotidien après 1 semaines')
      expect(longResult).toBe('Commencer 2x/semaine, puis quotidien après 4 semaines')
    })
    
    test('should handle missing phase context', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Actif',
        category: 'treatment',
        phase: 'adaptation',
        timeOfDay: 'evening',
        frequency: 'progressive',
        applicationAdvice: 'Progressive',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step) // Sans contexte
      expect(result).toBe('Commencer 2x/semaine, puis quotidien après 2 semaines')
    })
  })

  describe('edge cases', () => {
    
    test('should handle unknown frequency gracefully', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Produit mystère',
        category: 'treatment',
        phase: 'immediate',
        timeOfDay: 'evening',
        frequency: 'unknown' as any,
        applicationAdvice: 'Mystérieux',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('En continu')
    })
    
    test('should handle missing zones for exfoliation', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Exfoliant',
        category: 'exfoliation',
        phase: 'adaptation',
        timeOfDay: 'evening',
        frequency: 'weekly',
        applicationAdvice: 'Doux',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('1x par semaine')
    })
    
    test('should handle treatment without zones', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Traitement global',
        category: 'treatment',
        phase: 'adaptation',
        timeOfDay: 'evening',
        frequency: 'weekly',
        applicationAdvice: 'Sur tout le visage',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('1x par semaine, même jour chaque semaine')
    })
    
    test('should handle partial visual criteria match', () => {
      const step: UnifiedRoutineStep = {
        stepNumber: 1,
        title: 'Soin spécial',
        category: 'treatment',
        phase: 'immediate',
        timeOfDay: 'evening',
        frequency: 'daily',
        applicationAdvice: 'Selon besoin',
        applicationDuration: 'Jusqu\'à résultat optimal',
        recommendedProducts: []
      }
      
      const result = formatApplicationDuration(step, mockPhaseContext)
      expect(result).toBe('Jusqu\'à résultat optimal') // Retourne tel quel car contient "jusqu'à"
    })
  })
})
