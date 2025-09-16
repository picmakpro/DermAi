import { describe, it, expect } from '@jest/globals'
import { cleanAIResponse, validateCleanedResponse } from '../response-cleaner'

/**
 * TESTS NETTOYEUR DE RÉPONSES IA
 * Validation des corrections automatiques pour les erreurs communes
 */

describe('Response Cleaner', () => {
  
  describe('Correction intensités invalides', () => {
    it('devrait corriger "marquée" en "modérée"', () => {
      const rawResponse = JSON.stringify({
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
            intensity: 'marquée', // ❌ Problème ici
            description: 'Les ailes du nez présentent pores_apparents marqués avec filaments_sébacés visibles en lumière directe selon observation.'
          }
        ]
      })
      
      const { cleanedResponse, corrections, isValid } = cleanAIResponse(rawResponse)
      
      expect(corrections).toContain('Intensité "marquée" → "modérée" (zone nez)')
      expect(isValid).toBe(true)
      
      const parsed = JSON.parse(cleanedResponse)
      expect(parsed.zoneSpecificIssues[0].intensity).toBe('modérée')
    })

    it('devrait corriger plusieurs intensités invalides', () => {
      const rawResponse = JSON.stringify({
        skinType: 'Grasse',
        scores: {
          hydration: {
            value: 70,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['brillance_zone_T', 'homogénéité_teint', 'teint_terne']
          },
          wrinkles: {
            value: 85,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.9,
            basedOn: ['absence_rides_apparentes', 'contours_visage_nets', 'rides_fines']
          },
          firmness: {
            value: 75,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli']
          },
          radiance: {
            value: 72,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
          },
          pores: {
            value: 60,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.9,
            basedOn: ['pores_apparents', 'filaments_sébacés', 'brillance_zone_T']
          },
          spots: {
            value: 78,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.85,
            basedOn: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint']
          },
          darkCircles: {
            value: 68,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.75,
            basedOn: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches']
          },
          skinAge: {
            value: 77,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['rides_expression', 'contours_visage_nets', 'grain_photovieilli']
          },
          overall: 72
        },
        skinAgeEstimate: 30,
        generalObservation: 'Peau grasse avec brillance_zone_T marquée et pores_apparents sur ensemble du visage. Homogénéité_teint correcte avec rides_expression quasi absentes suggérant apparence cutanée jeune.',
        zoneSpecificIssues: [
          {
            zone: 'front',
            problem: 'brillance_excessive',
            intensity: 'forte', // ❌ Problème
            description: 'Test description suffisamment longue pour respecter la limite de 80 caractères minimum requis.'
          },
          {
            zone: 'joues',
            problem: 'pores_apparents',
            intensity: 'sévère', // ❌ Problème
            description: 'Test description suffisamment longue pour respecter la limite de 80 caractères minimum requis.'
          }
        ]
      })
      
      const { cleanedResponse, corrections, isValid } = cleanAIResponse(rawResponse)
      
      expect(corrections).toContain('Intensité "forte" → "intense" (zone front)')
      expect(corrections).toContain('Intensité "sévère" → "intense" (zone joues)')
      expect(isValid).toBe(true)
      
      const parsed = JSON.parse(cleanedResponse)
      expect(parsed.zoneSpecificIssues[0].intensity).toBe('intense')
      expect(parsed.zoneSpecificIssues[1].intensity).toBe('intense')
    })
  })

  describe('Correction skinType invalide', () => {
    it('devrait corriger "mixte" en "Mixte"', () => {
      const rawResponse = JSON.stringify({
        skinType: 'mixte', // ❌ Problème
        scores: {
          hydration: {
            value: 75,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.85,
            basedOn: ['brillance_zone_T', 'homogénéité_teint', 'teint_terne']
          },
          wrinkles: {
            value: 88,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.9,
            basedOn: ['absence_rides_apparentes', 'contours_visage_nets', 'rides_fines']
          },
          firmness: {
            value: 78,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli']
          },
          radiance: {
            value: 75,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
          },
          pores: {
            value: 65,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.9,
            basedOn: ['pores_apparents', 'filaments_sébacés', 'brillance_zone_T']
          },
          spots: {
            value: 82,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.85,
            basedOn: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint']
          },
          darkCircles: {
            value: 70,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.75,
            basedOn: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches']
          },
          skinAge: {
            value: 80,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['rides_expression', 'contours_visage_nets', 'grain_photovieilli']
          },
          overall: 76
        },
        skinAgeEstimate: 28,
        generalObservation: 'Peau mixte avec brillance_zone_T modérée et pores_apparents sur ailes du nez. Homogénéité_teint correcte avec rides_expression minimales suggérant apparence cutanée jeune.',
        zoneSpecificIssues: []
      })
      
      const { cleanedResponse, corrections, isValid } = cleanAIResponse(rawResponse)
      
      expect(corrections).toContain('SkinType "mixte" → "Mixte"')
      expect(isValid).toBe(true)
      
      const parsed = JSON.parse(cleanedResponse)
      expect(parsed.skinType).toBe('Mixte')
    })
  })

  describe('Extension justifications courtes', () => {
    it('devrait étendre les justifications trop courtes', () => {
      const rawResponse = JSON.stringify({
        skinType: 'Normale',
        scores: {
          hydration: {
            value: 80,
            justification: 'Peau hydratée', // ❌ Trop court (13 chars < 80)
            confidence: 0.8,
            basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
          },
          wrinkles: {
            value: 85,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.9,
            basedOn: ['absence_rides_apparentes', 'contours_visage_nets', 'rides_fines']
          },
          firmness: {
            value: 75,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli']
          },
          radiance: {
            value: 72,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
          },
          pores: {
            value: 70,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.9,
            basedOn: ['pores_apparents', 'filaments_sébacés', 'brillance_zone_T']
          },
          spots: {
            value: 88,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.85,
            basedOn: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint']
          },
          darkCircles: {
            value: 75,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.75,
            basedOn: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches']
          },
          skinAge: {
            value: 82,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['rides_expression', 'contours_visage_nets', 'grain_photovieilli']
          },
          overall: 78
        },
        skinAgeEstimate: 25,
        generalObservation: 'Peau normale avec homogénéité_teint excellente et absence_rides_apparentes marquée. Éclat_général préservé suggérant apparence cutanée très jeune et bien entretenue.',
        zoneSpecificIssues: []
      })
      
      const { cleanedResponse, corrections, isValid } = cleanAIResponse(rawResponse)
      
      expect(corrections.some(c => c.includes('Justification hydration étendue'))).toBe(true)
      expect(isValid).toBe(true)
      
      const parsed = JSON.parse(cleanedResponse)
      expect(parsed.scores.hydration.justification.length).toBeGreaterThanOrEqual(80)
    })
  })

  describe('Validation complète', () => {
    it('devrait valider une réponse nettoyée', () => {
      const validResponse = JSON.stringify({
        skinType: 'Mixte',
        scores: {
          hydration: {
            value: 75,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.85,
            basedOn: ['brillance_zone_T', 'homogénéité_teint', 'teint_terne']
          },
          wrinkles: {
            value: 88,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.9,
            basedOn: ['absence_rides_apparentes', 'contours_visage_nets', 'rides_fines']
          },
          firmness: {
            value: 78,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['contours_visage_nets', 'perte_fermeté_apparente', 'grain_photovieilli']
          },
          radiance: {
            value: 75,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.8,
            basedOn: ['homogénéité_teint', 'éclat_général', 'teint_terne']
          },
          pores: {
            value: 65,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.9,
            basedOn: ['pores_apparents', 'filaments_sébacés', 'brillance_zone_T']
          },
          spots: {
            value: 82,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.85,
            basedOn: ['marques_post_imperfections', 'lésions_inflammatoires', 'homogénéité_teint']
          },
          darkCircles: {
            value: 70,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
            confidence: 0.75,
            basedOn: ['ombre_sous_orbitaire', 'cernes_pigmentés', 'poches']
          },
          skinAge: {
            value: 80,
            justification: 'Test justification suffisamment longue pour respecter la limite de 80 caractères minimum.',
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
            description: 'Test description suffisamment longue pour respecter la limite de 80 caractères minimum requis.'
          }
        ]
      })
      
      const { isValid, errors } = validateCleanedResponse(validResponse)
      
      expect(isValid).toBe(true)
      expect(errors).toHaveLength(0)
    })
  })
})

