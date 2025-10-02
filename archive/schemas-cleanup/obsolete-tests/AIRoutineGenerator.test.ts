import { AIRoutineGenerator } from '../AIRoutineGenerator'
import type { BeautyAssessment, UserProfile, SkinConcerns, UserConstraints } from '@/types'
import { RoutinePersonnaliseeCompleteSchema, validateRoutineCoherence } from '@/schemas/refonte'

// Mock OpenAI
const mockCreate = jest.fn()
jest.mock('@/lib/openai', () => ({
  createOpenAIClient: jest.fn(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }))
}))

// Mock Logger
jest.mock('@/utils/Logger', () => ({
  logger: {
    generateRequestId: () => 'test-request-id',
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    clearContext: jest.fn()
  }
}))

// Mock RetryStrategy pour retourner directement le résultat
jest.mock('@/utils/RetryStrategy', () => ({
  RetryStrategy: {
    executeWithRetry: jest.fn((fn) => fn())
  }
}))

describe('AIRoutineGenerator - Sprint 1 Refonte IA-First', () => {
  
  const mockDiagnostic: BeautyAssessment = {
    mainConcern: 'Acné et imperfections',
    intensity: 'modérée',
    concernedZones: ['front', 'menton', 'joues'],
    skinType: 'Peau mixte',
    visualFindings: ['Boutons inflammatoires', 'Points noirs zone T'],
    expectedImprovement: 'Réduction significative des imperfections',
    zoneSpecific: [
      {
        zone: 'front',
        problems: [{ name: 'Acné', intensity: 'modérée' }]
      },
      {
        zone: 'menton', 
        problems: [{ name: 'Points noirs', intensity: 'légère' }]
      }
    ]
  }

  const mockUserProfile: UserProfile = {
    age: 28,
    gender: 'femme',
    skinType: 'Peau mixte',
    lifestyle: 'Vie active'
  }

  const mockSkinConcerns: SkinConcerns = {
    primary: ['Acné', 'Points noirs'],
    secondary: ['Pores dilatés'],
    intensity: 'modérée'
  }

  const mockConstraints: UserConstraints = {
    budget: '50-100€',
    timeAvailable: '10 min matin, 15 min soir',
    allergies: ['Parfum'],
    currentRoutine: 'Nettoyant doux + crème hydratante'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Génération routine personnalisée', () => {
    
    it('devrait générer une routine personnalisée valide', async () => {
      // Mock réponse OpenAI avec routine personnalisée
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              personalizationSummary: "Routine adaptée à votre peau mixte de 28 ans avec acné modérée zone T",
              immediatePhase: {
                phaseName: "immediate",
                duration: "14-21 jours pour stabiliser votre peau mixte",
                objective: "Stabiliser la barrière cutanée et traiter l'acné active zone T",
                description: "Phase de stabilisation adaptée à votre peau mixte avec traitement ciblé des imperfections",
                steps: [{
                  stepNumber: 1,
                  title: "Nettoyage doux anti-imperfections zone T",
                  description: "Nettoyer délicatement votre zone T grasse tout en préservant vos joues plus sèches",
                  category: "cleansing",
                  timing: "both",
                  frequency: "Quotidien matin et soir",
                  personalizedAdvice: "Insister 30s sur zone T, éviter le contour des yeux sensible"
                }],
                transitionCriteria: ["Réduction inflammation active", "Stabilisation sébum zone T"]
              },
              adaptationPhase: {
                phaseName: "adaptation",
                duration: "4-6 semaines avec introduction progressive d'actifs",
                objective: "Introduire des actifs anti-acné adaptés à votre âge et type de peau",
                description: "Introduction progressive d'actifs purifiants pour votre peau mixte de 28 ans",
                steps: [{
                  stepNumber: 1,
                  title: "Sérum acide salicylique zone T ciblé",
                  description: "Application ciblée sur votre zone T pour traiter l'acné sans assécher les joues",
                  category: "treatment",
                  timing: "evening",
                  frequency: "3x/semaine en alternance",
                  personalizedAdvice: "Commencer 1x/semaine puis augmenter selon tolérance de votre peau"
                }]
              },
              maintenancePhase: {
                phaseName: "maintenance",
                duration: "En continu avec ajustements selon cycles hormonaux",
                objective: "Maintenir l'équilibre de votre peau mixte et prévenir les rechutes",
                description: "Routine de maintenance adaptée à votre profil hormonal de femme de 28 ans",
                steps: [{
                  stepNumber: 1,
                  title: "Routine équilibrante peau mixte personnalisée",
                  description: "Maintenir l'équilibre hydro-lipidique spécifique à votre peau mixte",
                  category: "hydration",
                  timing: "both",
                  frequency: "Quotidien avec ajustements cycliques",
                  personalizedAdvice: "Adapter l'hydratation selon votre cycle hormonal"
                }]
              },
              personalizedTimings: {
                immediateDuration: "14-21 jours selon réactivité de votre peau mixte",
                adaptationDuration: "4-6 semaines avec progression adaptée à vos 28 ans",
                maintenanceDuration: "En continu avec ajustements hormonaux féminins",
                transitionCriteria: ["Cicatrisation boutons actifs", "Tolérance actifs établie", "Équilibre sébum stabilisé"],
                ageFactors: "Récupération rapide à 28 ans, tolérance élevée aux actifs",
                skinTypeFactors: "Peau mixte nécessite approche zonée T/joues"
              },
              globalAdvice: [
                "Adapter l'hydratation selon les zones de votre visage mixte",
                "Surveiller la tolérance lors de l'introduction d'actifs à 28 ans",
                "Maintenir protection solaire quotidienne pour prévenir marques post-acné"
              ],
              personalizationFactors: {
                ageGroup: "25-30 ans",
                skinTypeAdaptation: "Approche zonée pour peau mixte",
                intensityLevel: "Traitement modéré adapté à l'acné modérée",
                lifestyleFactors: ["Vie active", "Routine rapide matin"]
              }
            })
          }
        }],
        usage: { total_tokens: 1500 }
      }

      mockCreate.mockResolvedValue(mockOpenAIResponse)

      // Test génération routine
      const result = await AIRoutineGenerator.generatePersonalizedRoutine(
        mockDiagnostic,
        mockUserProfile, 
        mockSkinConcerns,
        mockConstraints
      )

      // Vérifications
      expect(result).toBeDefined()
      expect(result.immediatePhase.steps).toHaveLength(1)
      expect(result.adaptationPhase.steps).toHaveLength(1)
      expect(result.maintenancePhase.steps).toHaveLength(1)
      
      // Vérifier personnalisation
      expect(result.personalizationSummary).toContain('28 ans')
      expect(result.personalizationSummary).toContain('peau mixte')
      
      // Vérifier validation Zod
      expect(() => RoutinePersonnaliseeCompleteSchema.parse(result)).not.toThrow()
      
      // Vérifier cohérence
      const coherenceCheck = validateRoutineCoherence(result)
      expect(coherenceCheck.isValid).toBe(true)
    })

    it('devrait générer des routines différentes pour des profils différents', async () => {
      // Profil A : Jeune peau grasse
      const profilA: UserProfile = {
        age: 22,
        skinType: 'Peau grasse',
        gender: 'homme'
      }

      const diagnosticA: BeautyAssessment = {
        mainConcern: 'Acné sévère',
        intensity: 'intense',
        concernedZones: ['front', 'joues', 'menton'],
        skinType: 'Peau grasse',
        visualFindings: ['Acné inflammatoire généralisée'],
        expectedImprovement: 'Réduction drastique acné'
      }

      // Profil B : Mature peau sèche  
      const profilB: UserProfile = {
        age: 52,
        skinType: 'Peau sèche',
        gender: 'femme'
      }

      const diagnosticB: BeautyAssessment = {
        mainConcern: 'Rides et déshydratation',
        intensity: 'modérée',
        concernedZones: ['contour yeux', 'joues'],
        skinType: 'Peau sèche',
        visualFindings: ['Rides expression', 'Déshydratation'],
        expectedImprovement: 'Amélioration fermeté et hydratation'
      }

      // Mock réponses différentes
      
      // Première réponse pour profil A
      mockCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({
            personalizationSummary: "Routine intensive pour homme de 22 ans avec acné sévère peau grasse",
            immediatePhase: {
              phaseName: "immediate",
              duration: "10-14 jours pour peau jeune à récupération rapide",
              objective: "Traitement intensif acné sévère avec actifs purifiants",
              description: "Phase intensive adaptée à la peau grasse masculine de 22 ans",
              steps: [{
                stepNumber: 1,
                title: "Nettoyage profond anti-acné peau grasse masculine",
                description: "Nettoyage intensif pour éliminer excès sébum et impuretés",
                category: "cleansing",
                timing: "both", 
                frequency: "Quotidien matin et soir",
                personalizedAdvice: "Nettoyage énergique adapté à votre peau grasse résistante"
              }]
            },
            adaptationPhase: { phaseName: "adaptation", duration: "3-4 semaines progression", objective: "Introduction progressive actifs", description: "Phase adaptation pour peau grasse masculine", steps: [{ stepNumber: 1, title: "Sérum purifiants progressif", description: "Application progressive d'actifs purifiants adaptés", category: "treatment", timing: "evening", frequency: "Progressif 1x puis 3x semaine", personalizedAdvice: "Commencer doucement puis augmenter selon tolérance" }] },
            maintenancePhase: { phaseName: "maintenance", duration: "Continu avec ajustements", objective: "Maintien résultats et prévention rechutes", description: "Routine maintenance pour peau grasse masculine", steps: [{ stepNumber: 1, title: "Routine maintenance peau grasse", description: "Maintien équilibre peau grasse masculine", category: "hydration", timing: "both", frequency: "Quotidien adaptatif", personalizedAdvice: "Ajuster selon évolution peau masculine" }] },
            personalizedTimings: { immediateDuration: "10-14 jours peau jeune", adaptationDuration: "3-4 semaines progression", maintenanceDuration: "Continu masculin", transitionCriteria: ["Amélioration acné", "Tolérance établie"] },
            globalAdvice: ["test", "test"],
            personalizationFactors: { ageGroup: "20-25 ans", skinTypeAdaptation: "test", intensityLevel: "test" }
          }) }}],
          usage: { total_tokens: 1000 }
        })
        // Deuxième réponse pour profil B  
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({
            personalizationSummary: "Routine anti-âge douce pour femme de 52 ans peau sèche mature",
            immediatePhase: {
              phaseName: "immediate",
              duration: "21-28 jours pour peau mature à récupération lente",
              objective: "Hydratation intensive et protection barrière cutanée mature",
              description: "Phase douce adaptée à la peau sèche mature de 52 ans",
              steps: [{
                stepNumber: 1,
                title: "Nettoyage ultra-doux hydratant peau mature",
                description: "Nettoyage délicat préservant le film hydro-lipidique fragile",
                category: "cleansing",
                timing: "both",
                frequency: "Quotidien avec douceur maximale", 
                personalizedAdvice: "Éviter frottements, privilégier gestes délicats pour votre peau mature"
              }]
            },
            adaptationPhase: { phaseName: "adaptation", duration: "6-8 semaines progression douce", objective: "Introduction actifs anti-âge progressifs", description: "Phase adaptation douce pour peau mature de 52 ans", steps: [{ stepNumber: 1, title: "Sérum anti-âge progressif mature", description: "Introduction progressive d'actifs anti-âge pour peau mature", category: "treatment", timing: "evening", frequency: "Progressif 2x puis quotidien", personalizedAdvice: "Progression très douce pour peau mature sensible" }] },
            maintenancePhase: { phaseName: "maintenance", duration: "Continu anti-âge mature", objective: "Maintien hydratation et prévention vieillissement", description: "Routine maintenance anti-âge pour peau mature", steps: [{ stepNumber: 1, title: "Routine anti-âge quotidienne mature", description: "Maintien des acquis anti-âge pour peau mature", category: "hydration", timing: "both", frequency: "Quotidien mature", personalizedAdvice: "Routine constante adaptée à la peau mature" }] },
            personalizedTimings: { immediateDuration: "21-28 jours peau mature", adaptationDuration: "6-8 semaines progression douce", maintenanceDuration: "Continu anti-âge", transitionCriteria: ["Hydratation améliorée", "Tolérance établie"] },
            globalAdvice: ["test", "test"],
            personalizationFactors: { ageGroup: "50-55 ans", skinTypeAdaptation: "test", intensityLevel: "test" }
          }) }}],
          usage: { total_tokens: 1000 }
        })

      // Générer les deux routines
      const routineA = await AIRoutineGenerator.generatePersonalizedRoutine(profilA, profilA, mockSkinConcerns)
      const routineB = await AIRoutineGenerator.generatePersonalizedRoutine(profilB, profilB, mockSkinConcerns)

      // Vérifier que les routines sont différentes
      expect(routineA.personalizationSummary).not.toBe(routineB.personalizationSummary)
      expect(routineA.immediatePhase.duration).not.toBe(routineB.immediatePhase.duration)
      expect(routineA.immediatePhase.steps[0].title).not.toBe(routineB.immediatePhase.steps[0].title)
      expect(routineA.immediatePhase.steps[0].description).not.toBe(routineB.immediatePhase.steps[0].description)
      
      // Vérifier personnalisation spécifique
      expect(routineA.personalizationSummary).toContain('22 ans')
      expect(routineB.personalizationSummary).toContain('52 ans')
      expect(routineA.personalizationSummary).toContain('grasse')
      expect(routineB.personalizationSummary).toContain('sèche')
    })

    it('devrait valider la logique dermatologique', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              personalizationSummary: "Test routine validation logique dermatologique complète avec cycle cellulaire",
              immediatePhase: {
                phaseName: "immediate",
                duration: "14 jours selon cycle cellulaire",
                objective: "Stabilisation barrière cutanée",
                description: "Phase respectant cycle cellulaire 28 jours",
                steps: [{
                  stepNumber: 1,
                  title: "Étape personnalisée phase immédiate",
                  description: "Description détaillée respectant logique dermatologique",
                  category: "cleansing",
                  timing: "both",
                  frequency: "Quotidien",
                  personalizedAdvice: "Conseil personnalisé"
                }]
              },
              adaptationPhase: {
                phaseName: "adaptation", 
                duration: "4 semaines cycle cellulaire complet",
                objective: "Introduction progressive actifs selon cycle",
                description: "Respect temps adaptation cellulaire 28 jours",
                steps: [{
                  stepNumber: 1,
                  title: "Étape personnalisée phase adaptation cellulaire", 
                  description: "Description adaptation progressive respectant cycle cellulaire",
                  category: "treatment",
                  timing: "evening",
                  frequency: "Progressive selon cycle",
                  personalizedAdvice: "Introduction graduelle respectant cycle cellulaire"
                }]
              },
              maintenancePhase: {
                phaseName: "maintenance",
                duration: "Continu avec ajustements saisonniers",
                objective: "Maintien acquis prévention rechutes",
                description: "Phase maintenance long terme pour maintien résultats acquis",
                steps: [{
                  stepNumber: 1,
                  title: "Étape personnalisée maintenance long terme",
                  description: "Routine maintenance personnalisée pour maintien résultats",
                  category: "hydration", 
                  timing: "both",
                  frequency: "Quotidien adaptatif saisonnier",
                  personalizedAdvice: "Ajustements selon besoins et saisons"
                }]
              },
              personalizedTimings: {
                immediateDuration: "14 jours base cycle cellulaire",
                adaptationDuration: "28 jours cycle complet", 
                maintenanceDuration: "Continu adaptatif",
                transitionCriteria: ["Stabilisation barrière", "Tolérance établie", "Résultats visibles"]
              },
              globalAdvice: ["Respecter cycle cellulaire 28 jours", "Progression graduelle selon tolérance"],
              personalizationFactors: {
                ageGroup: "test",
                skinTypeAdaptation: "test", 
                intensityLevel: "test"
              }
            })
          }
        }],
        usage: { total_tokens: 1200 }
      }

      mockCreate.mockResolvedValue(mockResponse)

      const result = await AIRoutineGenerator.generatePersonalizedRoutine(
        mockDiagnostic,
        mockUserProfile,
        mockSkinConcerns
      )

      // Vérifier logique dermatologique
      expect(result.personalizedTimings.immediateDuration).toContain('14')
      expect(result.personalizedTimings.adaptationDuration).toContain('28')
      expect(result.personalizedTimings.transitionCriteria).toHaveLength(3)
      
      // Vérifier phases logiques
      expect(result.immediatePhase.objective).toContain('Stabilisation')
      expect(result.adaptationPhase.objective).toContain('Introduction')
      expect(result.maintenancePhase.objective).toContain('Maintien')
    })

    it('devrait gérer les erreurs de validation Zod', async () => {
      // Mock réponse invalide (titre trop court)
      const mockInvalidResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              personalizationSummary: "Test",
              immediatePhase: {
                phaseName: "immediate",
                duration: "test",
                objective: "test",
                description: "test",
                steps: [{
                  stepNumber: 1,
                  title: "Court", // Trop court (< 10 caractères)
                  description: "Description trop courte", // Trop court (< 20 caractères)
                  category: "cleansing",
                  timing: "both",
                  frequency: "test",
                  personalizedAdvice: "test"
                }]
              },
              adaptationPhase: { phaseName: "adaptation", duration: "test", objective: "test", description: "test", steps: [] }, // Pas d'étapes
              maintenancePhase: { phaseName: "maintenance", duration: "test", objective: "test", description: "test", steps: [] },
              personalizedTimings: { immediateDuration: "test", adaptationDuration: "test", maintenanceDuration: "test", transitionCriteria: [] }, // Pas de critères
              globalAdvice: ["test"], // Pas assez de conseils
              personalizationFactors: { ageGroup: "test", skinTypeAdaptation: "test", intensityLevel: "test" }
            })
          }
        }],
        usage: { total_tokens: 500 }
      }

      mockCreate.mockResolvedValue(mockInvalidResponse)

      // Doit lever une erreur de validation
      await expect(
        AIRoutineGenerator.generatePersonalizedRoutine(
          mockDiagnostic,
          mockUserProfile,
          mockSkinConcerns
        )
      ).rejects.toThrow()
    })
  })
})
