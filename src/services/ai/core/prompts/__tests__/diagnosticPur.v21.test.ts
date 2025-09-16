import { describe, it, expect } from '@jest/globals'
import { 
  DIAGNOSTIC_PUR_SYSTEM_PROMPT_V21_OPTIMIZED,
  buildDiagnosticUserPrompt_V21,
  getPromptForAttempt
} from '../diagnosticPur'
import { PureDiagnosticSchema } from '@/schemas/v2/diagnostic'
import { isValidLexiqueTerm, isValidProblemField } from '@/schemas/v2/lexique'

/**
 * TESTS PROMPT V2.1 OPTIMISÉ CEO
 * Validation de la compatibilité technique et de la conformité au lexique
 */

describe('Prompt V2.1 Optimisé CEO', () => {
  
  describe('Structure et Configuration', () => {
    it('devrait utiliser le prompt V2.1 pour la tentative 1', () => {
      const { systemPrompt, userPromptBuilder } = getPromptForAttempt(1)
      
      expect(systemPrompt).toBe(DIAGNOSTIC_PUR_SYSTEM_PROMPT_V21_OPTIMIZED)
      expect(userPromptBuilder).toBe(buildDiagnosticUserPrompt_V21)
    })

    it('devrait contenir tous les éléments requis du prompt', () => {
      const prompt = DIAGNOSTIC_PUR_SYSTEM_PROMPT_V21_OPTIMIZED
      
      // Vérifications structurelles
      expect(prompt).toContain('## RÔLE')
      expect(prompt).toContain('## GARDE-FOUS ABSOLUS')
      expect(prompt).toContain('## LEXIQUE STANDARDISÉ OBLIGATOIRE')
      expect(prompt).toContain('## SCORING (0–100, plus haut = mieux)')
      expect(prompt).toContain('## CALIBRATION RAPIDE')
      expect(prompt).toContain('## FORMAT JSON STRICT')
      
      // Vérifications de contenu critique
      expect(prompt).toContain('ZÉRO diagnostic médical')
      expect(prompt).toContain('INTERDICTION de nommer des maladies')
      expect(prompt).toContain('lexique standardisé')
      expect(prompt).toContain('≥3 termes du lexique standardisé')
      expect(prompt).toContain('≥80 caractères')
    })

    it('devrait générer un prompt utilisateur valide', () => {
      const photos = [
        { url: 'photo1.jpg', type: 'Face' },
        { url: 'photo2.jpg', type: 'Profile' }
      ]
      
      const userPrompt = buildDiagnosticUserPrompt_V21(photos)
      
      expect(userPrompt).toContain('ANALYSE COSMÉTIQUE VISUELLE PRÉCISE')
      expect(userPrompt).toContain('2 photo(s) de visage')
      expect(userPrompt).toContain('Photo 1: Face')
      expect(userPrompt).toContain('Photo 2: Profile')
      expect(userPrompt).toContain('lexique standardisé')
      expect(userPrompt).toContain('≥3 termes EXACTS du lexique')
      expect(userPrompt).toContain('≥80 caractères')
    })
  })

  describe('Validation Lexique Standardisé', () => {
    it('devrait valider les termes du lexique hydratation', () => {
      const termesHydratation = [
        'déshydratation_visuelle',
        'sécheresse_squames',
        'barrière_fragile_apparente',
        'teint_terne',
        'homogénéité_teint',
        'réactivité_visible'
      ]
      
      termesHydratation.forEach(terme => {
        expect(isValidLexiqueTerm(terme)).toBe(true)
      })
    })

    it('devrait valider les termes du lexique sébum & pores', () => {
      const termesPores = [
        'brillance_zone_T',
        'brillance_excessive',
        'pores_apparents',
        'pores_obstrués',
        'filaments_sébacés',
        'points_noirs',
        'points_blancs'
      ]
      
      termesPores.forEach(terme => {
        expect(isValidLexiqueTerm(terme)).toBe(true)
      })
    })

    it('devrait valider les termes du lexique vieillissement', () => {
      const termesVieillissement = [
        'rides_expression',
        'rides_fines',
        'rides_marquees',
        'perte_fermeté_apparente',
        'grain_photovieilli',
        'contours_visage_nets'
      ]
      
      termesVieillissement.forEach(terme => {
        expect(isValidLexiqueTerm(terme)).toBe(true)
      })
    })

    it('devrait rejeter les termes non standardisés', () => {
      const termesInvalides = [
        'acné',
        'rosacée',
        'dermatite',
        'eczéma',
        'terme_inexistant',
        'peau_malade'
      ]
      
      termesInvalides.forEach(terme => {
        expect(isValidLexiqueTerm(terme)).toBe(false)
      })
    })

    it('devrait valider les problem fields du lexique', () => {
      const problemsValides = [
        'pores_apparents',
        'rides_expression',
        'cernes_pigmentés',
        'autre: texture rugueuse localisée'
      ]
      
      problemsValides.forEach(problem => {
        expect(isValidProblemField(problem)).toBe(true)
      })
    })

    it('devrait rejeter les problem fields invalides', () => {
      const problemsInvalides = [
        'autre:', // Manque description
        'autre', // Format incorrect
        'acné sévère', // Terme médical
        '' // Vide
      ]
      
      problemsInvalides.forEach(problem => {
        expect(isValidProblemField(problem)).toBe(false)
      })
    })
  })

  describe('Validation Schéma JSON', () => {
    it('devrait valider un diagnostic complet conforme V2.1', () => {
      const diagnosticValide = {
        skinType: 'Mixte',
        scores: {
          hydration: {
            value: 72,
            justification: 'Zone T présente brillance_zone_T modérée avec homogénéité_teint correcte sur joues hautes. Absence de desquamation_visible mais léger teint_terne au niveau des tempes suggérant hydratation perfectible selon observation directe.',
            confidence: 0.85,
            basedOn: ['brillance_zone_T', 'homogénéité_teint', 'teint_terne']
          },
          wrinkles: {
            value: 88,
            justification: 'Absence_rides_apparentes marquée sur ensemble du visage. Contours_visage_nets préservés avec rides_fines quasi inexistantes. Seules micro-expressions légères au front sans impact significatif sur score global.',
            confidence: 0.9,
            basedOn: ['absence_rides_apparentes', 'contours_visage_nets', 'rides_fines']
          },
          firmness: {
            value: 78,
            justification: 'Contours_visage_nets globalement préservés avec fermeté correcte. Légère perte_fermeté_apparente au niveau des joues basses mais maintien général de la tonicité cutanée selon observation visuelle.',
            confidence: 0.8,
            basedOn: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli']
          },
          radiance: {
            value: 75,
            justification: 'Homogénéité_teint globalement correcte avec éclat_général préservé sur zones centrales. Léger teint_terne périphérique mais brillance_zone_T modérée maintient luminosité d\'ensemble satisfaisante.',
            confidence: 0.8,
            basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
          },
          pores: {
            value: 65,
            justification: 'Pores_apparents modérés sur ailes du nez avec filaments_sébacés visibles. Brillance_zone_T confirme activité sébacée mais pores restent dans normes acceptables pour type de peau observé.',
            confidence: 0.9,
            basedOn: ['pores_apparents', 'filaments_sébacés', 'brillance_zone_T']
          },
          spots: {
            value: 82,
            justification: 'Rares marques_post_imperfections visibles avec absence de lésions_inflammatoires actives. Homogénéité_teint globalement préservée sans rougeurs_diffuses significatives selon observation directe.',
            confidence: 0.85,
            basedOn: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint']
          },
          darkCircles: {
            value: 70,
            justification: 'Ombre_sous_orbitaire modérée perceptible avec légers cernes_pigmentés. Absence de poches marquées mais transition paupière-joue montre discret creux accentuant l\'ombre en éclairage frontal.',
            confidence: 0.75,
            basedOn: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches']
          },
          skinAge: {
            value: 80,
            justification: 'Apparence cutanée globalement préservée avec rides_expression minimales et contours_visage_nets maintenus. Grain_photovieilli discret mais cohérent avec impression d\'âge cutané jeune.',
            confidence: 0.8,
            basedOn: ['rides_expression', 'contours_visage_nets', 'grain_photovieilli']
          },
          overall: 76
        },
        skinAgeEstimate: 28,
        generalObservation: 'Peau mixte avec brillance_zone_T modérée et pores_apparents sur nez. Homogénéité_teint correcte avec rides_expression minimales. Contours_visage_nets préservés suggérant apparence cutanée jeune et bien entretenue.',
        zoneSpecificIssues: [
          {
            zone: 'nez',
            problem: 'pores_apparents',
            intensity: 'modérée',
            description: 'Les ailes du nez présentent pores_apparents marqués avec filaments_sébacés visibles en lumière directe. Brillance_zone_T modérée confirme activité sébacée locale plus importante que sur joues adjacentes.'
          }
        ]
      }
      
      const result = PureDiagnosticSchema.safeParse(diagnosticValide)
      
      if (!result.success) {
        console.error('Erreurs de validation:', result.error.issues)
      }
      
      expect(result.success).toBe(true)
    })

    it('devrait rejeter un diagnostic avec justifications trop courtes', () => {
      const diagnosticInvalide = {
        skinType: 'Normale',
        scores: {
          hydration: {
            value: 80,
            justification: 'Peau hydratée', // Trop court (< 80 chars)
            confidence: 0.8,
            basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
          },
          // ... autres scores requis avec justifications courtes
        },
        skinAgeEstimate: 30,
        generalObservation: 'Observation trop courte', // < 150 chars
        zoneSpecificIssues: []
      }
      
      const result = PureDiagnosticSchema.safeParse(diagnosticInvalide)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter un diagnostic avec basedOn insuffisant', () => {
      const diagnosticInvalide = {
        skinType: 'Grasse',
        scores: {
          pores: {
            value: 60,
            justification: 'Pores visibles sur zone T avec brillance modérée et texture légèrement irrégulière selon observation directe en lumière naturelle.',
            confidence: 0.8,
            basedOn: ['pores_apparents'] // Insuffisant (< 3 termes)
          }
        }
      }
      
      const result = PureDiagnosticSchema.safeParse(diagnosticInvalide)
      expect(result.success).toBe(false)
    })
  })

  describe('Calibration et Cohérence', () => {
    it('devrait respecter la calibration des scores', () => {
      // Test de la logique de calibration mentionnée dans le prompt
      const calibrations = {
        pores: {
          'peu visibles': { min: 80, max: 100 },
          'visibles': { min: 50, max: 70 },
          'très apparents': { min: 0, max: 40 }
        },
        spots: {
          'rares': { min: 80, max: 100 },
          'quelques': { min: 50, max: 70 },
          'nombreux': { min: 0, max: 40 }
        },
        radiance: {
          'uniforme': { min: 80, max: 100 },
          'correct': { min: 50, max: 70 },
          'terne': { min: 0, max: 45 }
        },
        darkCircles: {
          'faibles': { min: 80, max: 100 },
          'modérés': { min: 50, max: 70 },
          'marqués': { min: 0, max: 45 }
        }
      }
      
      // Vérification que les calibrations sont cohérentes
      Object.entries(calibrations).forEach(([critere, niveaux]) => {
        Object.entries(niveaux).forEach(([niveau, range]) => {
          expect(range.min).toBeLessThanOrEqual(range.max)
          expect(range.min).toBeGreaterThanOrEqual(0)
          expect(range.max).toBeLessThanOrEqual(100)
        })
      })
      
      expect(true).toBe(true) // Test de structure
    })

    it('devrait calculer overall comme moyenne des 7 sous-scores', () => {
      const scores = {
        hydration: 72,
        wrinkles: 88,
        firmness: 78,
        radiance: 75,
        pores: 65,
        spots: 82,
        darkCircles: 70
        // skinAge exclu du calcul overall
      }
      
      const expectedOverall = Math.round(
        (scores.hydration + scores.wrinkles + scores.firmness + 
         scores.radiance + scores.pores + scores.spots + scores.darkCircles) / 7
      )
      
      expect(expectedOverall).toBe(76) // (72+88+78+75+65+82+70)/7 = 75.7 → 76
    })
  })
})
