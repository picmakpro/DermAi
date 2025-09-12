/**
 * Configuration Jest pour tests Sprint 1 - DermAI V2
 */

// Mock des variables d'environnement
process.env.OPENAI_API_KEY = 'sk-test-key-for-jest-mocking'
process.env.NODE_ENV = 'test'

// Mock de fetch global pour les tests
global.fetch = jest.fn()

// Mock de console pour réduire le bruit dans les tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  // Réinitialiser les mocks avant chaque test
  jest.clearAllMocks()
  
  // Mock console.error sauf pour les erreurs importantes
  console.error = jest.fn((message) => {
    if (typeof message === 'string' && (
      message.includes('Warning:') ||
      message.includes('React') ||
      message.includes('act()')
    )) {
      return // Ignorer les warnings React dans les tests
    }
    originalConsoleError(message)
  })
  
  // Mock console.warn
  console.warn = jest.fn()
})

afterEach(() => {
  // Restaurer console après chaque test
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Mock de l'API OpenAI pour tous les tests
jest.mock('@/lib/openai', () => ({
  createOpenAIClient: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  })),
  ANALYSIS_MODEL: 'gpt-4o'
}))

// Mock des composants Next.js pour les tests unitaires
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams()
}))

// Mock de l'image Next.js
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    const { createElement } = require('react')
    return createElement('img', props)
  }
}))

// Utilitaires de test pour Sprint 1
global.testUtils = {
  // Créer une requête d'analyse de test
  createMockAnalyzeRequest: () => ({
    photos: [
      { 
        file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        type: 'selfie'
      }
    ],
    userProfile: {
      age: 25,
      gender: 'Homme',
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
  }),
  
  // Créer une réponse diagnostique de test valide
  createMockDiagnosticResponse: () => ({
    scores: {
      hydration: { value: 75, justification: "Peau bien hydratée", confidence: 0.8, basedOn: ["absence de desquamation"] },
      wrinkles: { value: 85, justification: "Peu de rides visibles", confidence: 0.9, basedOn: ["peau jeune"] },
      firmness: { value: 80, justification: "Bonne tonicité", confidence: 0.8, basedOn: ["contours nets"] },
      radiance: { value: 70, justification: "Éclat modéré", confidence: 0.7, basedOn: ["teint uniforme"] },
      pores: { value: 60, justification: "Pores visibles zone T", confidence: 0.8, basedOn: ["texture irrégulière"] },
      spots: { value: 65, justification: "Quelques imperfections", confidence: 0.8, basedOn: ["lésions localisées"] },
      darkCircles: { value: 90, justification: "Pas de cernes", confidence: 0.9, basedOn: ["contour œil net"] },
      skinAge: { value: 85, justification: "Âge cutané jeune", confidence: 0.8, basedOn: ["élasticité"] }
    },
    beautyAssessment: {
      skinType: "Peau mixte à tendance grasse",
      mainConcern: "Imperfections et pores dilatés zone T",
      intensity: "modérée",
      concernedZones: ["front", "nez", "menton"],
      specificities: [
        { name: "Imperfections", intensity: "modérée", zones: ["front", "menton"] }
      ],
      visualFindings: [
        "Pores dilatés sur la zone T",
        "Quelques imperfections actives",
        "Texture légèrement irrégulière"
      ],
      overview: [
        "Peau jeune avec problèmes localisés",
        "Bonne hydratation globale"
      ],
      zoneSpecific: [
        {
          zone: "front",
          problems: [{ name: "Imperfections", intensity: "modérée" }],
          description: "Zone avec imperfections actives"
        }
      ],
      expectedImprovement: "Amélioration visible en 4-6 semaines",
      improvementTimeEstimate: "2-3 mois"
    }
  }),
  
  // Attendre que les promesses se résolvent
  waitForPromises: () => new Promise(resolve => setImmediate(resolve))
}
