/**
 * 🧪 TESTS CORRECTIONS SPRINT 1 - UnifiedRoutineSection
 * Tests pour valider badges, titres, timing, zones
 */

import { describe, it, expect } from '@jest/globals'
import { 
  isTemporaryTreatment, 
  isContinuousTreatment, 
  validateAndCleanTitle, 
  getDetailedTiming, 
  renderZoneBadge 
} from '../../src/utils/RoutineDisplayHelpers'
import type { UnifiedRoutineStep } from '../../src/types'

// Mock d'une étape de routine pour les tests
const createMockStep = (overrides: Partial<UnifiedRoutineStep> = {}): UnifiedRoutineStep => ({
  stepNumber: 1,
  title: 'Test Step',
  targetArea: 'global',
  recommendedProducts: [],
  applicationAdvice: 'Test advice',
  treatmentType: 'cleansing',
  priority: 1,
  phase: 'immediate',
  frequency: 'daily',
  timeOfDay: 'both',
  category: 'cleansing',
  ...overrides
})

describe('RoutineDisplayHelpers - Sprint 1 Corrections', () => {
  
  describe('CORRECTION 1: Badges temporaires précis', () => {
    
    it('devrait marquer les traitements spécifiques comme temporaires', () => {
      const temporaryStep = createMockStep({
        category: 'treatment',
        isTemporaryTreatment: true,
        applicationDuration: 'Jusqu\'à cicatrisation'
      })
      
      expect(isTemporaryTreatment(temporaryStep)).toBe(true)
    })
    
    it('devrait marquer les produits de base comme continus', () => {
      const cleansingStep = createMockStep({
        category: 'cleansing',
        frequency: 'daily'
      })
      
      expect(isContinuousTreatment(cleansingStep)).toBe(true)
      expect(isTemporaryTreatment(cleansingStep)).toBe(false)
    })
    
    it('devrait identifier les catégories temporaires par nature', () => {
      const healingStep = createMockStep({
        category: 'healing' as any,
        applicationDuration: 'Jusqu\'à amélioration'
      })
      
      expect(isTemporaryTreatment(healingStep)).toBe(true)
    })
    
    it('devrait identifier les critères visuels comme temporaires', () => {
      const visualStep = createMockStep({
        category: 'treatment',
        applicationDuration: 'Jusqu\'à disparition des rougeurs'
      })
      
      expect(isTemporaryTreatment(visualStep)).toBe(true)
    })
  })
  
  describe('CORRECTION 2: Titres cohérents', () => {
    
    it('devrait nettoyer les artefacts "je ne sais pas"', () => {
      const dirtyTitle = 'Hydratation je ne sais pas optimisée'
      const cleaned = validateAndCleanTitle(dirtyTitle, 'hydration')
      
      expect(cleaned).toBe('Hydratation')
      expect(cleaned).not.toContain('je ne sais pas')
    })
    
    it('devrait nettoyer les artefacts "undefined"', () => {
      const dirtyTitle = 'Soin undefined pour la peau'
      const cleaned = validateAndCleanTitle(dirtyTitle, 'treatment')
      
      expect(cleaned).toBe('Soin pour la peau')
      expect(cleaned).not.toContain('undefined')
    })
    
    it('devrait utiliser un fallback pour les titres trop courts', () => {
      const shortTitle = 'X'
      const cleaned = validateAndCleanTitle(shortTitle, 'cleansing')
      
      expect(cleaned).toBe('Nettoyage doux quotidien')
    })
    
    it('devrait utiliser un fallback pour les titres vides', () => {
      const emptyTitle = ''
      const cleaned = validateAndCleanTitle(emptyTitle, 'protection')
      
      expect(cleaned).toBe('Protection solaire')
    })
    
    it('devrait conserver les titres valides', () => {
      const validTitle = 'Nettoyage doux anti-imperfections zone T'
      const cleaned = validateAndCleanTitle(validTitle, 'cleansing')
      
      expect(cleaned).toBe(validTitle)
    })
  })
  
  describe('CORRECTION 3: Timing précis', () => {
    
    it('devrait afficher "Matin et soir" pour both + daily', () => {
      const step = createMockStep({
        timeOfDay: 'both',
        frequency: 'daily'
      })
      
      const timing = getDetailedTiming(step)
      expect(timing).toBe('Matin et soir')
    })
    
    it('devrait afficher "Chaque matin" pour morning + daily', () => {
      const step = createMockStep({
        timeOfDay: 'morning',
        frequency: 'daily'
      })
      
      const timing = getDetailedTiming(step)
      expect(timing).toBe('Chaque matin')
    })
    
    it('devrait afficher "2-3x/semaine soir" pour evening + weekly', () => {
      const step = createMockStep({
        timeOfDay: 'evening',
        frequency: 'weekly'
      })
      
      const timing = getDetailedTiming(step)
      expect(timing).toBe('2-3x/semaine soir')
    })
    
    it('devrait prioriser frequencyDetails si disponible', () => {
      const step = createMockStep({
        timeOfDay: 'evening',
        frequency: 'daily',
        frequencyDetails: '1x/semaine, soir sans rétinol'
      })
      
      const timing = getDetailedTiming(step)
      expect(timing).toBe('1x/semaine, soir sans rétinol')
    })
  })
  
  describe('CORRECTION 4: Badges zones différenciés', () => {
    
    it('devrait créer badge "Visage entier" pour zones globales', () => {
      const globalStep = createMockStep({
        targetArea: 'global',
        zones: undefined
      })
      
      const badge = renderZoneBadge(globalStep)
      
      expect(badge).toBeTruthy()
      expect(badge!.type).toBe('global')
      expect(badge!.text).toBe('Visage entier')
      expect(badge!.className).toContain('bg-blue-100')
    })
    
    it('devrait créer badge zones spécifiques pour zones ciblées', () => {
      const specificStep = createMockStep({
        targetArea: 'specific',
        zones: ['menton', 'joues']
      })
      
      const badge = renderZoneBadge(specificStep)
      
      expect(badge).toBeTruthy()
      expect(badge!.type).toBe('specific')
      expect(badge!.text).toBe('Zones : menton, joues')
      expect(badge!.className).toContain('bg-purple-100')
    })
    
    it('devrait tronquer les zones nombreuses', () => {
      const manyZonesStep = createMockStep({
        targetArea: 'specific',
        zones: ['menton', 'joues', 'front', 'nez', 'cou']
      })
      
      const badge = renderZoneBadge(manyZonesStep)
      
      expect(badge).toBeTruthy()
      expect(badge!.text).toBe('Zones : menton, joues +3')
    })
    
    it('devrait traiter les zones vides comme "Visage entier"', () => {
      const noZoneStep = createMockStep({
        targetArea: 'specific',
        zones: []
      })
      
      const badge = renderZoneBadge(noZoneStep)
      expect(badge).toBeTruthy()
      expect(badge!.type).toBe('global')
      expect(badge!.text).toBe('Visage entier')
    })
  })
})

describe('Intégration - Corrections complètes', () => {
  
  it('devrait appliquer toutes les corrections sur une étape complète', () => {
    const problematicStep = createMockStep({
      title: 'Hydratation je ne sais pas optimisée',
      category: 'cleansing',
      timeOfDay: 'both',
      frequency: 'daily',
      targetArea: 'global',
      applicationDuration: 'En continu'
    })
    
    // Test toutes les corrections
    const isTemp = isTemporaryTreatment(problematicStep)
    const isCont = isContinuousTreatment(problematicStep)
    const cleanTitle = validateAndCleanTitle(problematicStep.title, problematicStep.category)
    const timing = getDetailedTiming(problematicStep)
    const badge = renderZoneBadge(problematicStep)
    
    // Vérifications
    expect(isTemp).toBe(false) // Nettoyage = pas temporaire
    expect(isCont).toBe(true) // Nettoyage = continu
    expect(cleanTitle).toBe('Hydratation') // Titre nettoyé
    expect(timing).toBe('Matin et soir') // Timing précis
    expect(badge!.type).toBe('global') // Badge global
    expect(badge!.text).toBe('Visage entier')
  })
  
  it('devrait gérer un traitement temporaire spécifique', () => {
    const treatmentStep = createMockStep({
      title: 'Traitement cicatrisation undefined zone T',
      category: 'treatment',
      isTemporaryTreatment: true,
      timeOfDay: 'evening',
      frequency: 'daily',
      targetArea: 'specific',
      zones: ['menton', 'joues'],
      applicationDuration: 'Jusqu\'à cicatrisation'
    })
    
    // Test corrections
    const isTemp = isTemporaryTreatment(treatmentStep)
    const cleanTitle = validateAndCleanTitle(treatmentStep.title, treatmentStep.category)
    const timing = getDetailedTiming(treatmentStep)
    const badge = renderZoneBadge(treatmentStep)
    
    // Vérifications
    expect(isTemp).toBe(true) // Traitement temporaire
    expect(cleanTitle).toBe('Traitement cicatrisation zone T') // Titre nettoyé
    expect(timing).toBe('Chaque soir') // Timing précis
    expect(badge!.type).toBe('specific') // Badge spécifique
    expect(badge!.text).toBe('Zones : menton, joues')
  })
})
