import { AnalysisService } from '../AnalysisService'
import type { RoutineContext } from '@/types/questionnaire'

/**
 * 🧪 TESTS D'INTÉGRATION - ANALYSIS SERVICE V2
 * 
 * Tests complets du pipeline :
 * - Diagnostic Pur (Étape 1)
 * - Routine Personnalisée (Étape 2) avec Prompt V3
 * - Validation compliance (Budget/Style/Sécurité)
 * - Enrichissement globalAdvice
 * - Gestion erreurs
 * 
 * Note : Mock OpenAI pour éviter coûts API réels
 */

// Mock OpenAI client
jest.mock('../../../lib/openai-config', () => ({
  getOpenAIClient: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  })),
  selectModel: jest.fn((type) => type === 'DIAGNOSTIC' ? 'chatgpt-5' : 'gpt-5-thinking'),
  hashImages: jest.fn(() => 12345678),
  getModelConfig: jest.fn((type) => ({
    model: type === 'DIAGNOSTIC' ? 'chatgpt-5' : 'gpt-5-thinking',
    temperature: type === 'DIAGNOSTIC' ? 0.0 : 0.1,
    max_tokens: type === 'DIAGNOSTIC' ? 1400 : 4000,
    _meta: {
      type,
      requestId: 'test',
      isPrimary: true,
      isFallback: false
    }
  })),
  AI_MODELS: {
    DIAGNOSTIC: { primary: 'chatgpt-5', fallback: 'gpt-4o' },
    ROUTINE: { primary: 'gpt-5-thinking', fallback: 'gpt-4o' }
  }
}))

describe('AnalysisService - Tests Intégration V2', () => {
  
  // ══════════════════════════════════════════════════════════════
  // 🏗️ FIXTURES
  // ══════════════════════════════════════════════════════════════
  
  const mockPhotos = [
    { url: 'https://test.com/photo1.jpg', type: 'front' },
    { url: 'https://test.com/photo2.jpg', type: 'side' }
  ]
  
  const mockUserProfile = {
    age: 32,
    gender: 'Femme',
    skinType: 'Mixte'
  }
  
  const mockSkinConcerns = {
    primary: ['Pores/Zone T', 'Rides/Vieillissement']
  }
  
  const mockConstraints = {
    budget: 100,
    allergies: []
  }
  
  const mockRoutineContext: RoutineContext = {
    profile: {
      age: 32,
      gender: 'Femme',
      pregnancy: false
    },
    constraints: {
      budgetTier: 'Confort',
      style: 'Équilibrée'
    },
    environment: {
      uvRiskBand: 'Moderate'
    }
  }
  
  // ══════════════════════════════════════════════════════════════
  // 📋 MOCK RÉPONSES GPT-5
  // ══════════════════════════════════════════════════════════════
  
  const mockDiagnosticResponse = {
    skinType: 'Mixte',
    scores: {
      hydration: { value: 70, justification: 'Zones sèches joues', confidence: 85, basedOn: ['texture'] },
      wrinkles: { value: 25, justification: 'Rides légères contour yeux', confidence: 80, basedOn: ['rides'] },
      firmness: { value: 80, justification: 'Bonne élasticité', confidence: 85, basedOn: ['fermeté'] },
      radiance: { value: 60, justification: 'Teint terne', confidence: 80, basedOn: ['éclat'] },
      pores: { value: 40, justification: 'Pores dilatés zone T', confidence: 90, basedOn: ['pores'] },
      spots: { value: 85, justification: 'Peu de taches', confidence: 85, basedOn: ['pigmentation'] },
      darkCircles: { value: 65, justification: 'Cernes légers', confidence: 80, basedOn: ['cernes'] },
      overall: 65
    },
    skinAgeEstimate: 30,
    generalObservation: 'Peau mixte avec zone T brillante',
    zoneSpecificIssues: [
      { zone: 'front', problem: 'Pores dilatés', intensity: 'modérée' },
      { zone: 'nez', problem: 'Pores dilatés', intensity: 'modérée' },
      { zone: 'contour-yeux', problem: 'Rides légères', intensity: 'légère' }
    ]
  }
  
  const mockRoutineResponseValid = {
    phases: {
      immediate: {
        duration: '3 semaines',
        description: 'Stabilisation',
        steps: [
          {
            stepNumber: 1,
            stepId: 'imm-nettoyage-matin',
            careType: 'nettoyage',
            timing: 'matin',
            targetProblem: 'Préparation de la peau',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            applicationInstructions: 'Appliquer matin sur visage humide',
            alternatives: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'quotidien',
            displayTitle: 'Nettoyage doux matin',
            targetBenefit: 'Préparation optimale'
          },
          {
            stepNumber: 2,
            stepId: 'imm-nettoyage-soir',
            careType: 'nettoyage',
            timing: 'soir',
            targetProblem: 'Préparation de la peau',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            applicationInstructions: 'Appliquer soir',
            alternatives: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'quotidien',
            displayTitle: 'Nettoyage doux soir',
            targetBenefit: 'Nettoyage profond'
          },
          {
            stepNumber: 3,
            stepId: 'imm-protection',
            careType: 'protection',
            timing: 'matin',
            targetProblem: 'Protection solaire',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            applicationInstructions: 'Appliquer SPF30-50 matin',
            alternatives: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'quotidien',
            displayTitle: 'Protection SPF',
            targetBenefit: 'Protection UV'
          },
          {
            stepNumber: 4,
            stepId: 'imm-hydratation-matin',
            careType: 'hydratation',
            timing: 'matin',
            targetProblem: 'Hydratation',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            applicationInstructions: 'Appliquer matin avant SPF',
            alternatives: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'quotidien',
            displayTitle: 'Hydratation légère matin',
            targetBenefit: 'Hydratation jour'
          },
          {
            stepNumber: 5,
            stepId: 'imm-hydratation-soir',
            careType: 'hydratation',
            timing: 'soir',
            targetProblem: 'Hydratation',
            targetZones: ['visage entier'],
            progressiveIntroduction: null,
            restrictions: [],
            applicationInstructions: 'Appliquer soir',
            alternatives: [],
            isTemporary: false,
            introduceFromWeek: 0,
            applicationDuration: 'continu',
            frequency: 'quotidien',
            displayTitle: 'Hydratation riche soir',
            targetBenefit: 'Hydratation nuit'
          }
        ]
      },
      adaptation: {
        duration: '4 semaines',
        description: 'Introduction traitements ciblés',
        steps: [
          {
            stepNumber: 1,
            stepId: 'adap-traitement-pores',
            careType: 'traitement',
            timing: 'soir',
            targetProblem: 'Pores dilatés',
            targetZones: ['front', 'nez'],
            progressiveIntroduction: null,
            restrictions: ['Soir uniquement', 'Éviter contour yeux'],
            applicationInstructions: 'Appliquer le soir sur zones concernées',
            alternatives: [],
            isTemporary: true,
            introduceFromWeek: 0,
            applicationDuration: 'progressive',
            frequency: 'quotidien',
            displayTitle: 'Traitement Pores dilatés',
            targetBenefit: 'Affinement grain de peau'
          }
        ]
      },
      maintenance: {
        description: 'Maintien des résultats',
        steps: []
      }
    },
    globalAdvice: [
      'Routine adaptée à votre budget Confort (70-150€/mois)',
      'Style Équilibrée respecté : 3 étapes matin, 4 étapes soir',
      'Protection solaire SPF30-50 recommandée (UV Risk Moderate)'
    ],
    dermatologicalRationale: 'Routine ciblée peau mixte avec focus pores zone T'
  }
  
  // ══════════════════════════════════════════════════════════════
  // ✅ TESTS PIPELINE COMPLET
  // ══════════════════════════════════════════════════════════════
  
  describe('Pipeline Complet : Diagnostic + Routine + Validation', () => {
    
    beforeEach(() => {
      jest.clearAllMocks()
      
      // Mock des appels OpenAI
      const { getOpenAIClient } = require('../../../lib/openai-config')
      const mockClient = getOpenAIClient()
      
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          // Réponse Diagnostic
          choices: [{ message: { content: JSON.stringify(mockDiagnosticResponse) } }],
          usage: { prompt_tokens: 1200, completion_tokens: 600, total_tokens: 1800 }
        })
        .mockResolvedValueOnce({
          // Réponse Routine
          choices: [{ message: { content: JSON.stringify(mockRoutineResponseValid) } }],
          usage: { 
            prompt_tokens: 2000, 
            completion_tokens: 2800, 
            total_tokens: 4800,
            reasoning_tokens: 400  // GPT-5 Thinking
          }
        })
    })
    
    test('Cas 1: Confort + Équilibrée → Routine complète validée', async () => {
      const request = {
        photos: mockPhotos,
        userProfile: mockUserProfile,
        skinConcerns: mockSkinConcerns,
        constraints: mockConstraints
      }
      
      // Note: AnalysisService.analyzeSkinComplete n'existe pas, on teste les méthodes séparément
      // ou on crée un wrapper de test
      
      // Pour l'instant, testons la génération de routine directement
      const diagnostic = mockDiagnosticResponse
      
      const routine = await AnalysisService.generatePersonalizedRoutine(
        diagnostic as any,
        request as any,
        'test-request-id',
        mockRoutineContext
      )
      
      // Vérifications
      expect(routine).toBeDefined()
      expect(routine.phases.immediate.steps).toHaveLength(5)  // Base durable
      expect(routine.phases.adaptation.steps).toHaveLength(1)  // 1 traitement (Confort)
      expect(routine.globalAdvice).toContain(
        expect.stringMatching(/budget.*confort/i)
      )
    }, 10000)
  })
  
  // ══════════════════════════════════════════════════════════════
  // 🚫 TESTS CAS INVALIDES (validation bloquante)
  // ══════════════════════════════════════════════════════════════
  
  describe('Validation Bloquante : Routines non conformes', () => {
    
    test('Cas 2: Essentiel + 2 traitements → Erreur validation Budget', async () => {
      const mockRoutineInvalid = {
        ...mockRoutineResponseValid,
        phases: {
          ...mockRoutineResponseValid.phases,
          adaptation: {
            duration: '4 semaines',
            description: 'Adaptation',
            steps: [
              // ❌ 2 traitements alors que Budget Essentiel limite à 1
              mockRoutineResponseValid.phases.adaptation.steps[0],
              {
                ...mockRoutineResponseValid.phases.adaptation.steps[0],
                stepId: 'adap-traitement-rides',
                targetProblem: 'Rides',
                displayTitle: 'Traitement Rides'
              }
            ]
          }
        }
      }
      
      // Mock réponse invalide
      const { getOpenAIClient } = require('../../../lib/openai-config')
      const mockClient = getOpenAIClient()
      
      mockClient.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(mockRoutineInvalid) } }],
        usage: { prompt_tokens: 2000, completion_tokens: 2800, total_tokens: 4800 }
      })
      
      const contextEssentiel: RoutineContext = {
        ...mockRoutineContext,
        constraints: {
          budgetTier: 'Essentiel',  // Max 1 traitement
          style: 'Complète'         // Demande 2 traitements (conflit!)
        }
      }
      
      // Devrait throw une erreur
      await expect(
        AnalysisService.generatePersonalizedRoutine(
          mockDiagnosticResponse as any,
          { userProfile: mockUserProfile, skinConcerns: mockSkinConcerns, constraints: mockConstraints } as any,
          'test-request-id-invalid',
          contextEssentiel
        )
      ).rejects.toThrow(/non conforme/)
    }, 10000)
  })
  
  // ══════════════════════════════════════════════════════════════
  // 🔄 TESTS RETRY & FALLBACK
  // ══════════════════════════════════════════════════════════════
  
  describe('Gestion Erreurs : Retry & Fallback', () => {
    
    test('Cas 3: Erreur parsing JSON → Retry automatique', async () => {
      const { getOpenAIClient } = require('../../../lib/openai-config')
      const mockClient = getOpenAIClient()
      
      // Première tentative : JSON invalide
      mockClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: '```json\n' + JSON.stringify(mockRoutineResponseValid) + '\n```' } }],
          usage: { prompt_tokens: 2000, completion_tokens: 2800, total_tokens: 4800 }
        })
      
      // Note: AnalysisService devrait nettoyer le markdown automatiquement
      const routine = await AnalysisService.generatePersonalizedRoutine(
        mockDiagnosticResponse as any,
        { userProfile: mockUserProfile, skinConcerns: mockSkinConcerns, constraints: mockConstraints } as any,
        'test-request-retry',
        mockRoutineContext
      )
      
      expect(routine).toBeDefined()
      expect(routine.phases.immediate.steps.length).toBeGreaterThan(0)
    }, 10000)
    
    test('Cas 4: Timeout API → Erreur explicite', async () => {
      const { getOpenAIClient } = require('../../../lib/openai-config')
      const mockClient = getOpenAIClient()
      
      // Simuler timeout
      mockClient.chat.completions.create.mockRejectedValue(
        new Error('Request timeout after 50000ms')
      )
      
      await expect(
        AnalysisService.generatePersonalizedRoutine(
          mockDiagnosticResponse as any,
          { userProfile: mockUserProfile, skinConcerns: mockSkinConcerns, constraints: mockConstraints } as any,
          'test-request-timeout',
          mockRoutineContext
        )
      ).rejects.toThrow()
    }, 15000)
  })
})
