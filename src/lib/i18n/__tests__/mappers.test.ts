import { describe, it, expect } from 'vitest'
import {
  normalizeIntensity,
  normalizeZone,
  normalizeSkinType,
  normalizeGender,
  normalizeRoutinePreference,
  normalizeBudget,
  normalizeConcern,
  normalizeAssessmentFRtoEN,
  getSkinTypeLabel,
  getFrequencyLabel,
  getTimingLabel
} from '../mappers'

describe('Mappers FR -> EN', () => {
  describe('normalizeIntensity', () => {
    it('should map French intensity to English', () => {
      expect(normalizeIntensity('légère')).toBe('mild')
      expect(normalizeIntensity('modérée')).toBe('moderate')
      expect(normalizeIntensity('intense')).toBe('severe')
    })

    it('should handle accents variations', () => {
      expect(normalizeIntensity('legere')).toBe('mild')
      expect(normalizeIntensity('moderee')).toBe('moderate')
    })

    it('should pass through English values', () => {
      expect(normalizeIntensity('mild')).toBe('mild')
      expect(normalizeIntensity('moderate')).toBe('moderate')
      expect(normalizeIntensity('severe')).toBe('severe')
    })

    it('should handle edge cases', () => {
      expect(normalizeIntensity(undefined)).toBeUndefined()
      expect(normalizeIntensity('')).toBeUndefined()
      expect(normalizeIntensity('unknown')).toBeUndefined()
    })
  })

  describe('normalizeZone', () => {
    it('should map French zones to English', () => {
      expect(normalizeZone('menton')).toBe('chin')
      expect(normalizeZone('joues')).toBe('cheeks')
      expect(normalizeZone('front')).toBe('forehead')
      expect(normalizeZone('nez')).toBe('nose')
      expect(normalizeZone('cou')).toBe('neck')
      expect(normalizeZone('contour des yeux')).toBe('eye-contour')
    })

    it('should pass through English values', () => {
      expect(normalizeZone('chin')).toBe('chin')
      expect(normalizeZone('cheeks')).toBe('cheeks')
      expect(normalizeZone('forehead')).toBe('forehead')
    })
  })

  describe('normalizeSkinType', () => {
    it('should map French skin types to English', () => {
      expect(normalizeSkinType('sèche')).toBe('dry')
      expect(normalizeSkinType('normale')).toBe('normal')
      expect(normalizeSkinType('mixte')).toBe('combination')
      expect(normalizeSkinType('grasse')).toBe('oily')
      expect(normalizeSkinType('sensible')).toBe('sensitive')
      expect(normalizeSkinType('je ne sais pas')).toBe('unknown')
    })

    it('should handle accents variations', () => {
      expect(normalizeSkinType('seche')).toBe('dry')
    })
  })

  describe('normalizeGender', () => {
    it('should map French genders to English', () => {
      expect(normalizeGender('homme')).toBe('male')
      expect(normalizeGender('femme')).toBe('female')
      expect(normalizeGender('autre')).toBe('other')
      expect(normalizeGender('ne souhaite pas préciser')).toBe('prefer-not-to-say')
    })
  })

  describe('normalizeRoutinePreference', () => {
    it('should map French preferences to English', () => {
      expect(normalizeRoutinePreference('minimaliste')).toBe('minimalist')
      expect(normalizeRoutinePreference('simple')).toBe('simple')
      expect(normalizeRoutinePreference('équilibrée')).toBe('balanced')
      expect(normalizeRoutinePreference('complète')).toBe('complete')
    })
  })

  describe('normalizeBudget', () => {
    it('should map French budgets to English', () => {
      expect(normalizeBudget('< 50€')).toBe('under-50')
      expect(normalizeBudget('50-100€')).toBe('50-100')
      expect(normalizeBudget('100-200€')).toBe('100-200')
      expect(normalizeBudget('> 200€')).toBe('over-200')
      expect(normalizeBudget('pas de limite')).toBe('no-limit')
    })
  })

  describe('normalizeConcern', () => {
    it('should map French questionnaire concerns to English', () => {
      expect(normalizeConcern('Acné/Boutons')).toBe('blemishes')
      expect(normalizeConcern('Poils incarnés')).toBe('ingrowns')
      expect(normalizeConcern('Rides/Vieillissement')).toBe('wrinkles')
      expect(normalizeConcern('Taches pigmentaires')).toBe('pigmentation')
      expect(normalizeConcern('Rougeurs/Irritations')).toBe('redness')
      expect(normalizeConcern('Peau sèche')).toBe('dehydration')
      expect(normalizeConcern('Points noirs')).toBe('blackheads')
      expect(normalizeConcern('Cicatrices')).toBe('scars')
      expect(normalizeConcern('Sensibilité')).toBe('sensitivity')
      expect(normalizeConcern('Je ne sais pas')).toBe('unknown')
      expect(normalizeConcern('Autres')).toBe('other')
    })

    it('should map legacy French concerns to English', () => {
      expect(normalizeConcern('rougeurs')).toBe('redness')
      expect(normalizeConcern('imperfections')).toBe('blemishes')
      expect(normalizeConcern('taches')).toBe('pigmentation')
      expect(normalizeConcern('pores dilatés')).toBe('enlarged-pores')
      expect(normalizeConcern('déshydratation')).toBe('dehydration')
      expect(normalizeConcern('rides')).toBe('wrinkles')
    })

    it('should handle accents variations', () => {
      expect(normalizeConcern('deshydratation')).toBe('dehydration')
    })

    it('should be case insensitive', () => {
      expect(normalizeConcern('ACNÉ/BOUTONS')).toBe('blemishes')
      expect(normalizeConcern('poils incarnés')).toBe('ingrowns')
    })

    it('should pass through unknown values', () => {
      expect(normalizeConcern('unknown-concern')).toBe('unknown-concern')
    })
  })

  describe('normalizeAssessmentFRtoEN', () => {
    it('should normalize a complete BeautyAssessment', () => {
      const frenchAssessment = {
        intensity: 'légère',
        skinType: 'mixte',
        mainConcern: 'rougeurs',
        concernedZones: ['menton', 'joues'],
        specificities: [
          {
            name: 'poils incarnés',
            intensity: 'modérée',
            zones: ['menton', 'cou']
          }
        ],
        zoneSpecific: [
          {
            zone: 'joues',
            problems: [
              {
                name: 'rougeurs',
                intensity: 'intense'
              }
            ]
          }
        ]
      }

      const normalized = normalizeAssessmentFRtoEN(frenchAssessment)

      expect(normalized.intensity).toBe('mild')
      expect(normalized.skinType).toBe('combination')
      expect(normalized.mainConcern).toBe('redness')
      expect(normalized.concernedZones).toEqual(['chin', 'cheeks'])
      expect(normalized.specificities[0].name).toBe('ingrowns')
      expect(normalized.specificities[0].intensity).toBe('moderate')
      expect(normalized.specificities[0].zones).toEqual(['chin', 'neck'])
      expect(normalized.zoneSpecific[0].zone).toBe('cheeks')
      expect(normalized.zoneSpecific[0].problems[0].name).toBe('redness')
      expect(normalized.zoneSpecific[0].problems[0].intensity).toBe('severe')
    })

    it('should handle null/undefined input', () => {
      expect(normalizeAssessmentFRtoEN(null)).toBeNull()
      expect(normalizeAssessmentFRtoEN(undefined)).toBeUndefined()
    })

    it('should preserve EN values that are already correct', () => {
      const englishAssessment = {
        intensity: 'moderate',
        skinType: 'combination',
        mainConcern: 'pigmentation'
      }

      const normalized = normalizeAssessmentFRtoEN(englishAssessment)

      expect(normalized.intensity).toBe('moderate')
      expect(normalized.skinType).toBe('combination')
      expect(normalized.mainConcern).toBe('pigmentation')
    })
  })

  describe('Display Mappers EN → FR', () => {
    describe('getSkinTypeLabel', () => {
      it('should map skin types to English labels', () => {
        expect(getSkinTypeLabel('dry')).toBe('Dry')
        expect(getSkinTypeLabel('normal')).toBe('Normal')
        expect(getSkinTypeLabel('combination')).toBe('Combination')
        expect(getSkinTypeLabel('oily')).toBe('Oily')
        expect(getSkinTypeLabel('sensitive')).toBe('Sensitive')
        expect(getSkinTypeLabel('unknown')).toBe('To be set by AI')
      })

      it('should handle undefined/unknown values', () => {
        expect(getSkinTypeLabel(undefined)).toBe('To be set by AI')
        expect(getSkinTypeLabel('random')).toBe('To be set by AI')
      })
    })

    describe('getFrequencyLabel', () => {
      it('should map frequency values to English labels', () => {
        expect(getFrequencyLabel('daily')).toBe('Daily')
        expect(getFrequencyLabel('weekly')).toBe('Weekly')
        expect(getFrequencyLabel('as_needed')).toBe('As needed')
        // Test backward compatibility with FR values
        expect(getFrequencyLabel('quotidien')).toBe('Daily')
        expect(getFrequencyLabel('hebdomadaire')).toBe('Weekly')
        expect(getFrequencyLabel('ponctuel')).toBe('As needed')
      })
    })

    describe('getTimingLabel', () => {
      it('should map timing values to English labels', () => {
        expect(getTimingLabel('morning')).toBe('Morning')
        expect(getTimingLabel('evening')).toBe('Evening')
        expect(getTimingLabel('morning_and_evening')).toBe('Morning and evening')
        // Test backward compatibility with FR values
        expect(getTimingLabel('matin')).toBe('Morning')
        expect(getTimingLabel('soir')).toBe('Evening')
        expect(getTimingLabel('matin_et_soir')).toBe('Morning and evening')
      })
    })
  })
})
