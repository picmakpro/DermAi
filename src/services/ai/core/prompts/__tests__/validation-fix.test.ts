import { describe, it, expect } from '@jest/globals'
import { PureDiagnosticSchema } from '@/schemas/v2/diagnostic'

/**
 * TESTS CORRECTION VALIDATION - PROBLÈME "MARQUÉE"
 * Validation que les corrections empêchent les erreurs de validation Zod
 */

describe('Correction Validation Zod', () => {
  
  describe('Problème "marquée" résolu', () => {
    it('devrait accepter les intensités valides', () => {
      const intensitesValides = ['légère', 'modérée', 'intense']
      
      intensitesValides.forEach(intensity => {
        const diagnostic = {
          skinType: 'Mixte',
          scores: {
            hydration: {
              value: 75,
              justification: 'Zone T présente brillance_zone_T modérée avec homogénéité_teint correcte sur joues hautes selon observation directe.',
              confidence: 0.85,
              basedOn: ['brillance_zone_T', 'homogénéité_teint', 'teint_terne']
            },
            wrinkles: {
              value: 88,
              justification: 'Absence_rides_apparentes marquée sur ensemble du visage avec contours_visage_nets préservés selon observation.',
              confidence: 0.9,
              basedOn: ['absence_rides_apparentes', 'contours_visage_nets', 'rides_fines']
            },
            firmness: {
              value: 78,
              justification: 'Contours_visage_nets globalement préservés avec fermeté correcte selon observation visuelle directe.',
              confidence: 0.8,
              basedOn: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli']
            },
            radiance: {
              value: 75,
              justification: 'Homogénéité_teint globalement correcte avec éclat_général préservé sur zones centrales du visage.',
              confidence: 0.8,
              basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
            },
            pores: {
              value: 65,
              justification: 'Pores_apparents modérés sur ailes du nez avec filaments_sébacés visibles en lumière directe.',
              confidence: 0.9,
              basedOn: ['pores_apparents', 'filaments_sébacés', 'brillance_zone_T']
            },
            spots: {
              value: 82,
              justification: 'Rares marques_post_imperfections visibles avec absence de lésions_inflammatoires actives.',
              confidence: 0.85,
              basedOn: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint']
            },
            darkCircles: {
              value: 70,
              justification: 'Ombre_sous_orbitaire modérée perceptible avec légers cernes_pigmentés selon observation.',
              confidence: 0.75,
              basedOn: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches']
            },
            skinAge: {
              value: 80,
              justification: 'Apparence cutanée globalement préservée avec rides_expression minimales selon observation.',
              confidence: 0.8,
              basedOn: ['rides_expression', 'contours_visage_nets', 'grain_photovieilli']
            },
            overall: 76
          },
          skinAgeEstimate: 28,
          generalObservation: 'Peau mixte avec brillance_zone_T modérée et pores_apparents sur ailes du nez. Homogénéité_teint correcte avec rides_expression minimales suggérant apparence cutanée jeune.',
          zoneSpecificIssues: [
            {
              zone: 'nez',
              problem: 'pores_apparents',
              intensity: intensity, // Test avec chaque intensité valide
              description: 'Les ailes du nez présentent pores_apparents marqués avec filaments_sébacés visibles en lumière directe selon observation.'
            }
          ]
        }
        
        const result = PureDiagnosticSchema.safeParse(diagnostic)
        
        if (!result.success) {
          console.error(`Erreur avec intensité "${intensity}":`, result.error.issues)
        }
        
        expect(result.success).toBe(true)
      })
    })

    it('devrait rejeter "marquée" et autres intensités invalides', () => {
      const intensitesInvalides = ['marquée', 'forte', 'sévère', 'importante', 'visible']
      
      intensitesInvalides.forEach(intensity => {
        const diagnostic = {
          skinType: 'Mixte',
          scores: {
            hydration: {
              value: 75,
              justification: 'Zone T présente brillance_zone_T modérée avec homogénéité_teint correcte sur joues hautes selon observation directe.',
              confidence: 0.85,
              basedOn: ['brillance_zone_T', 'homogénéité_teint', 'teint_terne']
            },
            wrinkles: {
              value: 88,
              justification: 'Absence_rides_apparentes marquée sur ensemble du visage avec contours_visage_nets préservés selon observation.',
              confidence: 0.9,
              basedOn: ['absence_rides_apparentes', 'contours_visage_nets', 'rides_fines']
            },
            firmness: {
              value: 78,
              justification: 'Contours_visage_nets globalement préservés avec fermeté correcte selon observation visuelle directe.',
              confidence: 0.8,
              basedOn: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli']
            },
            radiance: {
              value: 75,
              justification: 'Homogénéité_teint globalement correcte avec éclat_général préservé sur zones centrales du visage.',
              confidence: 0.8,
              basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
            },
            pores: {
              value: 65,
              justification: 'Pores_apparents modérés sur ailes du nez avec filaments_sébacés visibles en lumière directe.',
              confidence: 0.9,
              basedOn: ['pores_apparents', 'filaments_sébacés', 'brillance_zone_T']
            },
            spots: {
              value: 82,
              justification: 'Rares marques_post_imperfections visibles avec absence de lésions_inflammatoires actives.',
              confidence: 0.85,
              basedOn: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint']
            },
            darkCircles: {
              value: 70,
              justification: 'Ombre_sous_orbitaire modérée perceptible avec légers cernes_pigmentés selon observation.',
              confidence: 0.75,
              basedOn: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches']
            },
            skinAge: {
              value: 80,
              justification: 'Apparence cutanée globalement préservée avec rides_expression minimales selon observation.',
              confidence: 0.8,
              basedOn: ['rides_expression', 'contours_visage_nets', 'grain_photovieilli']
            },
            overall: 76
          },
          skinAgeEstimate: 28,
          generalObservation: 'Peau mixte avec brillance_zone_T modérée et pores_apparents sur ailes du nez. Homogénéité_teint correcte avec rides_expression minimales suggérant apparence cutanée jeune.',
          zoneSpecificIssues: [
            {
              zone: 'nez',
              problem: 'pores_apparents',
              intensity: intensity, // Test avec intensité invalide
              description: 'Les ailes du nez présentent pores_apparents marqués avec filaments_sébacés visibles en lumière directe selon observation.'
            }
          ]
        }
        
        const result = PureDiagnosticSchema.safeParse(diagnostic)
        expect(result.success).toBe(false)
        
        // Vérifier que l'erreur concerne bien l'intensité
        const intensityError = result.error?.issues.find(issue => 
          issue.path.includes('intensity')
        )
        expect(intensityError).toBeDefined()
      })
    })
  })

  describe('Validation skinType stricte', () => {
    it('devrait accepter les skinTypes valides', () => {
      const skinTypesValides = ['Sèche', 'Normale', 'Mixte', 'Grasse', 'Sensible', 'Indéterminé']
      
      skinTypesValides.forEach(skinType => {
        const diagnostic = {
          skinType: skinType,
          scores: {
            hydration: {
              value: 75,
              justification: 'Zone T présente brillance_zone_T modérée avec homogénéité_teint correcte sur joues hautes selon observation directe.',
              confidence: 0.85,
              basedOn: ['brillance_zone_T', 'homogénéité_teint', 'teint_terne']
            },
            wrinkles: {
              value: 88,
              justification: 'Absence_rides_apparentes marquée sur ensemble du visage avec contours_visage_nets préservés selon observation.',
              confidence: 0.9,
              basedOn: ['absence_rides_apparentes', 'contours_visage_nets', 'rides_fines']
            },
            firmness: {
              value: 78,
              justification: 'Contours_visage_nets globalement préservés avec fermeté correcte selon observation visuelle directe.',
              confidence: 0.8,
              basedOn: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli']
            },
            radiance: {
              value: 75,
              justification: 'Homogénéité_teint globalement correcte avec éclat_général préservé sur zones centrales du visage.',
              confidence: 0.8,
              basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
            },
            pores: {
              value: 65,
              justification: 'Pores_apparents modérés sur ailes du nez avec filaments_sébacés visibles en lumière directe.',
              confidence: 0.9,
              basedOn: ['pores_apparents', 'filaments_sébacés', 'brillance_zone_T']
            },
            spots: {
              value: 82,
              justification: 'Rares marques_post_imperfections visibles avec absence de lésions_inflammatoires actives.',
              confidence: 0.85,
              basedOn: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint']
            },
            darkCircles: {
              value: 70,
              justification: 'Ombre_sous_orbitaire modérée perceptible avec légers cernes_pigmentés selon observation.',
              confidence: 0.75,
              basedOn: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches']
            },
            skinAge: {
              value: 80,
              justification: 'Apparence cutanée globalement préservée avec rides_expression minimales selon observation.',
              confidence: 0.8,
              basedOn: ['rides_expression', 'contours_visage_nets', 'grain_photovieilli']
            },
            overall: 76
          },
          skinAgeEstimate: 28,
          generalObservation: 'Peau mixte avec brillance_zone_T modérée et pores_apparents sur ailes du nez. Homogénéité_teint correcte avec rides_expression minimales suggérant apparence cutanée jeune.',
          zoneSpecificIssues: [
            {
              zone: 'nez',
              problem: 'pores_apparents',
              intensity: 'modérée',
              description: 'Les ailes du nez présentent pores_apparents marqués avec filaments_sébacés visibles en lumière directe selon observation.'
            }
          ]
        }
        
        const result = PureDiagnosticSchema.safeParse(diagnostic)
        
        if (!result.success) {
          console.error(`Erreur avec skinType "${skinType}":`, result.error.issues)
        }
        
        expect(result.success).toBe(true)
      })
    })

    it('devrait rejeter les skinTypes invalides', () => {
      const skinTypesInvalides = ['mixte', 'grasse', 'sèche', 'Peau mixte', 'Peau grasse', 'Normal']
      
      skinTypesInvalides.forEach(skinType => {
        const diagnostic = {
          skinType: skinType,
          // ... même structure que ci-dessus
          scores: {
            hydration: {
              value: 75,
              justification: 'Zone T présente brillance_zone_T modérée avec homogénéité_teint correcte sur joues hautes selon observation directe.',
              confidence: 0.85,
              basedOn: ['brillance_zone_T', 'homogénéité_teint', 'teint_terne']
            },
            wrinkles: {
              value: 88,
              justification: 'Absence_rides_apparentes marquée sur ensemble du visage avec contours_visage_nets préservés selon observation.',
              confidence: 0.9,
              basedOn: ['absence_rides_apparentes', 'contours_visage_nets', 'rides_fines']
            },
            firmness: {
              value: 78,
              justification: 'Contours_visage_nets globalement préservés avec fermeté correcte selon observation visuelle directe.',
              confidence: 0.8,
              basedOn: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli']
            },
            radiance: {
              value: 75,
              justification: 'Homogénéité_teint globalement correcte avec éclat_général préservé sur zones centrales du visage.',
              confidence: 0.8,
              basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
            },
            pores: {
              value: 65,
              justification: 'Pores_apparents modérés sur ailes du nez avec filaments_sébacés visibles en lumière directe.',
              confidence: 0.9,
              basedOn: ['pores_apparents', 'filaments_sébacés', 'brillance_zone_T']
            },
            spots: {
              value: 82,
              justification: 'Rares marques_post_imperfections visibles avec absence de lésions_inflammatoires actives.',
              confidence: 0.85,
              basedOn: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint']
            },
            darkCircles: {
              value: 70,
              justification: 'Ombre_sous_orbitaire modérée perceptible avec légers cernes_pigmentés selon observation.',
              confidence: 0.75,
              basedOn: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches']
            },
            skinAge: {
              value: 80,
              justification: 'Apparence cutanée globalement préservée avec rides_expression minimales selon observation.',
              confidence: 0.8,
              basedOn: ['rides_expression', 'contours_visage_nets', 'grain_photovieilli']
            },
            overall: 76
          },
          skinAgeEstimate: 28,
          generalObservation: 'Peau mixte avec brillance_zone_T modérée et pores_apparents sur ailes du nez. Homogénéité_teint correcte avec rides_expression minimales suggérant apparence cutanée jeune.',
          zoneSpecificIssues: []
        }
        
        const result = PureDiagnosticSchema.safeParse(diagnostic)
        expect(result.success).toBe(false)
        
        // Vérifier que l'erreur concerne bien le skinType
        const skinTypeError = result.error?.issues.find(issue => 
          issue.path.includes('skinType')
        )
        expect(skinTypeError).toBeDefined()
      })
    })
  })
})
