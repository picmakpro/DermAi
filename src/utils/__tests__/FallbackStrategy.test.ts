/**
 * TESTS FALLBACK STRATEGY - SPRINT 2 ROBUSTESSE DERMAI V2
 * Tests de génération de fallback statistique basé profil utilisateur
 */

import { FallbackStrategy } from '../FallbackStrategy'
import type { AnalyzeRequest } from '@/types/api'

describe('FallbackStrategy - Sprint 2 Robustesse', () => {
  
  // Données de test standardisées
  const mockRequest: AnalyzeRequest = {
    photos: [
      { 
        file: 'data:image/jpeg;base64,test',
        type: 'selfie'
      }
    ],
    userProfile: {
      age: 28,
      gender: 'Femme',
      skinType: 'Mixte'
    },
    skinConcerns: {
      primary: ['Imperfections', 'Pores dilatés']
    },
    currentRoutine: {
      morningProducts: [],
      eveningProducts: [],
      monthlyBudget: '50-100€',
      routinePreference: 'Simple'
    },
    allergies: {
      ingredients: [],
      pastReactions: ''
    }
  }
  
  describe('📊 Tests Génération Fallback Diagnostic', () => {
    
    test('Génération fallback pour profil jeune avec peau mixte', () => {
      const result = FallbackStrategy.generateDiagnosticFallback(
        mockRequest,
        'Network timeout error'
      )
      
      expect(result.success).toBe(undefined) // Pas de champ success dans FallbackResult
      expect(result.source).toBe('fallback')
      expect(result.degraded).toBe(true)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(0.5) // Max 50% pour fallback
      expect(result.primaryError).toBe('Network timeout error')
      
      // Vérifier structure du diagnostic
      expect(result.data.scores).toBeDefined()
      expect(result.data.beautyAssessment).toBeDefined()
      expect(result.data.recommendations).toBeDefined()
      
      // Vérifier scores dans fourchette réaliste
      expect(result.data.scores.overall).toBeGreaterThan(20)
      expect(result.data.scores.overall).toBeLessThan(95)
    })
    
    test('Adaptation scores selon âge utilisateur', () => {
      // Profil jeune (20 ans)
      const youngRequest = {
        ...mockRequest,
        userProfile: { ...mockRequest.userProfile, age: 20 }
      }
      
      const youngResult = FallbackStrategy.generateDiagnosticFallback(
        youngRequest,
        'API error'
      )
      
      // Profil senior (65 ans)
      const seniorRequest = {
        ...mockRequest,
        userProfile: { ...mockRequest.userProfile, age: 65 }
      }
      
      const seniorResult = FallbackStrategy.generateDiagnosticFallback(
        seniorRequest,
        'API error'
      )
      
      // Les scores jeunes devraient être généralement plus élevés
      expect(youngResult.data.scores.overall).toBeGreaterThan(seniorResult.data.scores.overall - 10)
      expect(youngResult.data.scores.wrinkles.value).toBeGreaterThan(seniorResult.data.scores.wrinkles.value - 15)
    })
    
    test('Adaptation selon type de peau', () => {
      // Peau sèche
      const dryRequest = {
        ...mockRequest,
        userProfile: { ...mockRequest.userProfile, skinType: 'Sèche' }
      }
      
      const dryResult = FallbackStrategy.generateDiagnosticFallback(
        dryRequest,
        'Timeout error'
      )
      
      // Peau grasse
      const oilyRequest = {
        ...mockRequest,
        userProfile: { ...mockRequest.userProfile, skinType: 'Grasse' }
      }
      
      const oilyResult = FallbackStrategy.generateDiagnosticFallback(
        oilyRequest,
        'Timeout error'
      )
      
      // Vérifier adaptation selon type de peau
      expect(dryResult.data.beautyAssessment.skinType).toContain('sèche')
      expect(oilyResult.data.beautyAssessment.skinType).toContain('grasse')
    })
    
    test('Adaptation selon préoccupations déclarées', () => {
      const acneRequest = {
        ...mockRequest,
        skinConcerns: {
          primary: ['Imperfections', 'Taches', 'Pores dilatés']
        }
      }
      
      const result = FallbackStrategy.generateDiagnosticFallback(
        acneRequest,
        'Rate limit exceeded'
      )
      
      // Vérifier que les préoccupations sont reflétées
      expect(result.data.beautyAssessment.mainConcern).toContain('Imperfections')
      expect(result.data.beautyAssessment.intensity).toBe('intense') // 3 préoccupations = intense
      expect(result.data.beautyAssessment.specificities).toHaveLength(3)
    })
  })
  
  describe('🎯 Tests Profil Statistique', () => {
    
    test('Catégorisation âge correcte', () => {
      const testCases = [
        { age: 22, expected: 'young' },
        { age: 35, expected: 'adult' },
        { age: 50, expected: 'mature' },
        { age: 70, expected: 'senior' }
      ]
      
      testCases.forEach(({ age, expected }) => {
        const request = {
          ...mockRequest,
          userProfile: { ...mockRequest.userProfile, age }
        }
        
        const result = FallbackStrategy.generateDiagnosticFallback(request, 'test')
        
        // Vérifier indirectement via les scores (les jeunes ont de meilleurs scores)
        if (expected === 'young') {
          expect(result.data.scores.overall).toBeGreaterThan(70)
        } else if (expected === 'senior') {
          expect(result.data.scores.overall).toBeLessThan(80)
        }
      })
    })
    
    test('Catégorisation préoccupations correcte', () => {
      const testCases = [
        { concerns: ['Hydratation'], expected: 'basic' },
        { concerns: ['Imperfections', 'Pores'], expected: 'moderate' },
        { concerns: ['Rides', 'Taches', 'Fermeté'], expected: 'advanced' }
      ]
      
      testCases.forEach(({ concerns, expected }) => {
        const request = {
          ...mockRequest,
          skinConcerns: { primary: concerns }
        }
        
        const result = FallbackStrategy.generateDiagnosticFallback(request, 'test')
        
        // Vérifier adaptation selon complexité
        if (expected === 'basic') {
          expect(result.data.beautyAssessment.intensity).toBe('légère')
        } else if (expected === 'advanced') {
          expect(result.data.beautyAssessment.intensity).toBe('intense')
        }
      })
    })
  })
  
  describe('⏱️ Tests Estimation Temps d\'Amélioration', () => {
    
    test('Estimation réaliste selon profil', () => {
      // Profil simple (jeune + préoccupations basiques)
      const simpleRequest = {
        ...mockRequest,
        userProfile: { ...mockRequest.userProfile, age: 22 },
        skinConcerns: { primary: ['Hydratation'] }
      }
      
      const simpleResult = FallbackStrategy.generateDiagnosticFallback(simpleRequest, 'test')
      
      // Profil complexe (mature + préoccupations multiples)
      const complexRequest = {
        ...mockRequest,
        userProfile: { ...mockRequest.userProfile, age: 55 },
        skinConcerns: { primary: ['Rides', 'Taches', 'Fermeté'] }
      }
      
      const complexResult = FallbackStrategy.generateDiagnosticFallback(complexRequest, 'test')
      
      // Vérifier que l'estimation est plus longue pour profil complexe
      const simpleTime = simpleResult.data.beautyAssessment.improvementTimeEstimate
      const complexTime = complexResult.data.beautyAssessment.improvementTimeEstimate
      
      expect(['4-6 semaines', '2-3 mois']).toContain(simpleTime)
      expect(['4-6 mois', '6-8 mois']).toContain(complexTime)
    })
  })
  
  describe('🛡️ Tests Recommandations de Base', () => {
    
    test('Recommandations contiennent produits valides', () => {
      const result = FallbackStrategy.generateDiagnosticFallback(mockRequest, 'API unavailable')
      
      const recommendations = result.data.recommendations
      
      // Vérifier structure recommandations
      expect(recommendations.immediate).toBeDefined()
      expect(recommendations.routine).toBeDefined()
      expect(recommendations.routine.immediate).toHaveLength(1) // Au moins nettoyage
      
      // Vérifier catalogId valides
      recommendations.routine.immediate.forEach(step => {
        expect(step.catalogId).toMatch(/^[A-Z0-9]{8,12}$/)
      })
    })
    
    test('Restrictions appropriées selon profil', () => {
      const sensitiveRequest = {
        ...mockRequest,
        userProfile: { ...mockRequest.userProfile, skinType: 'Sensible' }
      }
      
      const result = FallbackStrategy.generateDiagnosticFallback(sensitiveRequest, 'Service error')
      
      expect(result.data.recommendations.restrictions).toContain('progressivement')
    })
  })
  
  describe('📈 Tests Métriques Fallback', () => {
    
    test('Calcul métriques fallback correctes', () => {
      const results = [
        { source: 'primary' as const, confidence: 0.9, fallbackReason: '' },
        { source: 'fallback' as const, confidence: 0.3, fallbackReason: 'Network timeout' },
        { source: 'fallback' as const, confidence: 0.4, fallbackReason: 'API error' },
        { source: 'primary' as const, confidence: 0.8, fallbackReason: '' }
      ]
      
      const metrics = FallbackStrategy.getFallbackMetrics(results)
      
      expect(metrics.totalOperations).toBe(4)
      expect(metrics.fallbackOperations).toBe(2)
      expect(metrics.fallbackRate).toBe(0.5) // 50%
      expect(metrics.avgConfidence).toBeCloseTo(0.6, 1) // (0.9+0.3+0.4+0.8)/4
      expect(metrics.reasonCounts['Network timeout']).toBe(1)
      expect(metrics.reasonCounts['API error']).toBe(1)
    })
  })
  
  describe('🚨 Tests Scénarios d\'Erreur Spécifiques', () => {
    
    test('Fallback pour timeout avec raison appropriée', () => {
      const result = FallbackStrategy.generateDiagnosticFallback(
        mockRequest,
        'Request timeout after 30s'
      )
      
      expect(result.fallbackReason).toContain('timeout')
      expect(result.fallbackReason).toContain('Fallback basé sur profil')
    })
    
    test('Fallback pour erreur réseau avec raison appropriée', () => {
      const result = FallbackStrategy.generateDiagnosticFallback(
        mockRequest,
        'Network connection failed'
      )
      
      expect(result.fallbackReason).toContain('connexion')
      expect(result.fallbackReason).toContain('Estimation statistique')
    })
    
    test('Fallback pour rate limit avec raison appropriée', () => {
      const result = FallbackStrategy.generateDiagnosticFallback(
        mockRequest,
        'Rate limit exceeded - too many requests'
      )
      
      expect(result.fallbackReason).toContain('Limite API')
      expect(result.fallbackReason).toContain('Analyse différée')
    })
    
    test('Fallback générique pour erreur inconnue', () => {
      const result = FallbackStrategy.generateDiagnosticFallback(
        mockRequest,
        'Unknown internal error'
      )
      
      expect(result.fallbackReason).toContain('Erreur technique')
      expect(result.fallbackReason).toContain('Analyse de base selon profil')
    })
  })
  
  describe('🎲 Tests Cohérence et Réalisme', () => {
    
    test('Scores cohérents entre eux', () => {
      const result = FallbackStrategy.generateDiagnosticFallback(mockRequest, 'test')
      
      const scores = result.data.scores
      
      // Vérifier que tous les scores sont dans la fourchette valide
      Object.values(scores).forEach(score => {
        if (typeof score === 'object' && score.value !== undefined) {
          expect(score.value).toBeGreaterThanOrEqual(0)
          expect(score.value).toBeLessThanOrEqual(100)
          expect(score.confidence).toBe(0.3) // Confiance fallback
          expect(score.basedOn).toBeDefined()
        }
      })
      
      // Score global cohérent avec les sous-scores
      expect(scores.overall).toBeGreaterThanOrEqual(0)
      expect(scores.overall).toBeLessThanOrEqual(100)
    })
    
    test('Reproductibilité du fallback pour même profil', () => {
      const result1 = FallbackStrategy.generateDiagnosticFallback(mockRequest, 'test error')
      const result2 = FallbackStrategy.generateDiagnosticFallback(mockRequest, 'test error')
      
      // Les résultats devraient être similaires (±10 points) pour même profil
      const diff = Math.abs(result1.data.scores.overall - result2.data.scores.overall)
      expect(diff).toBeLessThanOrEqual(15) // Tolérance pour randomisation
      
      // Même assessment principal
      expect(result1.data.beautyAssessment.intensity).toBe(result2.data.beautyAssessment.intensity)
      expect(result1.data.beautyAssessment.improvementTimeEstimate).toBe(result2.data.beautyAssessment.improvementTimeEstimate)
    })
  })
})
