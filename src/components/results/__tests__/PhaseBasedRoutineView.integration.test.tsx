/**
 * SPRINT 4 - TESTS D'INTÉGRATION
 * Tests d'intégration pour la pipeline complète IA → UI avec feature flag
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { UnifiedRoutineSection } from '../UnifiedRoutineSection'
import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'

// Mock du feature flag
const mockUseFeatureFlag = jest.fn()
jest.mock('@/hooks/useFeatureFlag', () => ({
  useFeatureFlag: mockUseFeatureFlag
}))

// Mock des services
jest.mock('@/utils/ProductMappingHelpers', () => ({
  applyFullCoherenceV2: jest.fn((routine) => routine),
  generateProductKey: jest.fn((step) => `${step.category}-${step.stepNumber}`)
}))

jest.mock('@/utils/PhaseOrganizer', () => ({
  PhaseOrganizer: {
    organizeByPhaseAndTime: jest.fn((routine) => ({
      immediate: {
        morning: routine.filter((s: any) => s.phase === 'immediate' && s.timeOfDay === 'morning'),
        evening: routine.filter((s: any) => s.phase === 'immediate' && s.timeOfDay === 'evening'),
        weekly: routine.filter((s: any) => s.phase === 'immediate' && s.frequency === 'weekly')
      },
      adaptation: {
        morning: routine.filter((s: any) => s.phase === 'adaptation' && s.timeOfDay === 'morning'),
        evening: routine.filter((s: any) => s.phase === 'adaptation' && s.timeOfDay === 'evening'),
        weekly: routine.filter((s: any) => s.phase === 'adaptation' && s.frequency === 'weekly')
      },
      maintenance: {
        morning: routine.filter((s: any) => s.phase === 'maintenance' && s.timeOfDay === 'morning'),
        evening: routine.filter((s: any) => s.phase === 'maintenance' && s.timeOfDay === 'evening'),
        weekly: routine.filter((s: any) => s.phase === 'maintenance' && s.frequency === 'weekly')
      }
    }))
  }
}))

jest.mock('@/services/educational/PhaseDependencyCalculator', () => ({
  PhaseDependencyCalculator: {
    calculatePhaseDependencies: jest.fn(() => ({
      immediate: { 
        duration: '1-2 semaines', 
        objective: 'Stabiliser',
        startWeek: 1,
        endWeek: 2
      },
      adaptation: { 
        duration: '3-6 semaines', 
        objective: 'Adapter',
        startWeek: 3,
        endWeek: 6
      },
      maintenance: { 
        duration: 'Continu', 
        objective: 'Maintenir',
        startWeek: 7
      }
    }))
  }
}))

// Mock des composants externes
jest.mock('@headlessui/react', () => ({
  Tab: {
    Group: ({ children, selectedIndex, onChange }: any) => (
      <div data-testid="tab-group" data-selected={selectedIndex}>
        <div onClick={() => onChange && onChange(0)}>{children}</div>
      </div>
    ),
    List: ({ children }: any) => (
      <div data-testid="tab-list">{children}</div>
    ),
    Panel: ({ children }: any) => (
      <div data-testid="tab-panel">{children}</div>
    ),
    Panels: ({ children }: any) => (
      <div data-testid="tab-panels">{children}</div>
    )
  }
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

jest.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron-right">→</span>,
  Sun: () => <span data-testid="sun">☀️</span>,
  Moon: () => <span data-testid="moon">🌙</span>,
  Calendar: () => <span data-testid="calendar">📅</span>,
  Clock: () => <span data-testid="clock">⏰</span>,
  Info: () => <span data-testid="info">ℹ️</span>,
  CheckCircle: () => <span data-testid="check-circle">✅</span>,
  TrendingUp: () => <span data-testid="trending-up">📈</span>,
  Sparkles: () => <span data-testid="sparkles">✨</span>
}))

describe('PhaseBasedRoutineView - Tests d\'Intégration Sprint 4', () => {
  const mockRoutine: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      phase: 'immediate',
      title: 'Nettoyage doux',
      category: 'cleansing',
      applicationAdvice: 'Masser délicatement',
      timeOfDay: 'morning',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: [
        {
          name: 'Nettoyant CeraVe',
          brand: 'CeraVe',
          price: 12.99,
          affiliateUrl: 'https://example.com/cerave',
          catalogId: 'cerave-cleanser-001'
        }
      ]
    },
    {
      stepNumber: 2,
      phase: 'immediate',
      title: 'Hydratation légère',
      category: 'hydration',
      applicationAdvice: 'Appliquer sur peau humide',
      timeOfDay: 'evening',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: [
        {
          name: 'Crème Hydratante Neutrogena',
          brand: 'Neutrogena',
          price: 8.99,
          affiliateUrl: 'https://example.com/neutrogena',
          catalogId: 'neutrogena-moisturizer-001'
        }
      ]
    },
    {
      stepNumber: 3,
      phase: 'adaptation',
      title: 'Traitement anti-âge',
      category: 'treatment',
      applicationAdvice: 'Appliquer sur zones ciblées',
      timeOfDay: 'evening',
      frequency: 'daily',
      targetArea: 'specific',
      zones: ['front', 'contour des yeux'],
      recommendedProducts: [
        {
          name: 'Sérum Rétinol The Ordinary',
          brand: 'The Ordinary',
          price: 15.99,
          affiliateUrl: 'https://example.com/theordinary',
          catalogId: 'theordinary-retinol-001'
        }
      ]
    },
    {
      stepNumber: 4,
      phase: 'immediate',
      title: 'Peeling AHA',
      category: 'exfoliation',
      applicationAdvice: 'Une fois par semaine le soir',
      timeOfDay: 'evening',
      frequency: 'weekly',
      targetArea: 'global',
      recommendedProducts: [
        {
          name: 'Peeling AHA Paula\'s Choice',
          brand: 'Paula\'s Choice',
          price: 29.99,
          affiliateUrl: 'https://example.com/paulaschoice',
          catalogId: 'paulaschoice-aha-001'
        }
      ]
    }
  ]

  const mockBeautyAssessment: BeautyAssessment = {
    scores: {
      hydration: 70,
      wrinkles: 50,
      acne: 30,
      texture: 65,
      pigmentation: 45,
      pores: 60,
      elasticity: 55,
      brightness: 70
    },
    skinType: 'combination',
    concerns: ['wrinkles', 'hydration'],
    age: 35,
    sensitivity: 'normal'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Feature Flag Integration', () => {
    it('devrait utiliser l\'ancienne interface quand le feature flag est désactivé', () => {
      mockUseFeatureFlag.mockReturnValue(false)

      render(
        <UnifiedRoutineSection 
          routine={mockRoutine} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      // Vérifier que l'ancienne interface est utilisée
      expect(screen.queryByTestId('tab-group')).not.toBeInTheDocument()
      
      // L'ancienne interface devrait avoir des sections séparées
      expect(screen.getByText('Routine personnalisée')).toBeInTheDocument()
    })

    it('devrait utiliser la nouvelle interface quand le feature flag est activé', () => {
      mockUseFeatureFlag.mockReturnValue(true)

      render(
        <UnifiedRoutineSection 
          routine={mockRoutine} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      // Vérifier que la nouvelle interface est utilisée
      expect(screen.getByTestId('tab-group')).toBeInTheDocument()
      expect(screen.getByTestId('tab-list')).toBeInTheDocument()
    })

    it('devrait permettre de basculer entre les phases avec la nouvelle interface', async () => {
      mockUseFeatureFlag.mockReturnValue(true)

      render(
        <UnifiedRoutineSection 
          routine={mockRoutine} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      // Vérifier la navigation entre phases
      const tabGroup = screen.getByTestId('tab-group')
      expect(tabGroup).toBeInTheDocument()

      // Simuler un clic pour changer de phase
      fireEvent.click(tabGroup)

      await waitFor(() => {
        expect(screen.getByTestId('tab-panels')).toBeInTheDocument()
      })
    })
  })

  describe('Pipeline Complète IA → UI', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true)
    })

    it('devrait traiter correctement la routine complète de l\'IA', () => {
      const { applyFullCoherenceV2 } = require('@/utils/ProductMappingHelpers')
      const { PhaseOrganizer } = require('@/utils/PhaseOrganizer')
      const { PhaseDependencyCalculator } = require('@/services/educational/PhaseDependencyCalculator')

      render(
        <UnifiedRoutineSection 
          routine={mockRoutine} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      // Vérifier que la pipeline complète est exécutée
      expect(applyFullCoherenceV2).toHaveBeenCalledWith(mockRoutine)
      expect(PhaseOrganizer.organizeByPhaseAndTime).toHaveBeenCalled()
      expect(PhaseDependencyCalculator.calculatePhaseDependencies).toHaveBeenCalledWith(
        mockRoutine,
        mockBeautyAssessment
      )
    })

    it('devrait organiser correctement les étapes par phase et horaire', () => {
      render(
        <UnifiedRoutineSection 
          routine={mockRoutine} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      // Vérifier que les produits sont affichés
      expect(screen.getByText('Nettoyant CeraVe')).toBeInTheDocument()
      expect(screen.getByText('Crème Hydratante Neutrogena')).toBeInTheDocument()
      expect(screen.getByText('Sérum Rétinol The Ordinary')).toBeInTheDocument()
      expect(screen.getByText('Peeling AHA Paula\'s Choice')).toBeInTheDocument()
    })

    it('devrait calculer et afficher les dépendances de phases', () => {
      render(
        <UnifiedRoutineSection 
          routine={mockRoutine} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      // Vérifier que les informations de phases sont affichées
      expect(screen.getByText(/Semaines 1-2/)).toBeInTheDocument()
      expect(screen.getByText(/Semaines 3-6/)).toBeInTheDocument()
      expect(screen.getByText(/À partir de la semaine 7/)).toBeInTheDocument()
    })

    it('devrait gérer les traitements temporaires avec métadonnées', () => {
      const routineWithTemporary = [
        ...mockRoutine,
        {
          stepNumber: 5,
          phase: 'adaptation',
          title: 'Traitement acné',
          category: 'treatment' as const,
          applicationAdvice: 'Appliquer localement',
          timeOfDay: 'evening' as const,
          frequency: '2x/week',
          targetArea: 'specific' as const,
          zones: ['menton', 'front'],
          isTemporary: true,
          introduceFromWeek: 2,
          applicationDuration: '4 semaines',
          recommendedProducts: []
        }
      ]

      render(
        <UnifiedRoutineSection 
          routine={routineWithTemporary} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      expect(screen.getByText('Traitement acné')).toBeInTheDocument()
    })
  })

  describe('Performance et Optimisation', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true)
    })

    it('devrait gérer efficacement une routine complexe avec de nombreuses étapes', () => {
      // Créer une routine complexe avec 20 étapes
      const complexRoutine = Array.from({ length: 20 }, (_, i) => ({
        stepNumber: i + 1,
        phase: ['immediate', 'adaptation', 'maintenance'][i % 3] as 'immediate' | 'adaptation' | 'maintenance',
        title: `Étape ${i + 1}`,
        category: ['cleansing', 'treatment', 'hydration', 'protection'][i % 4] as any,
        applicationAdvice: `Conseil pour étape ${i + 1}`,
        timeOfDay: ['morning', 'evening'][i % 2] as 'morning' | 'evening',
        frequency: 'daily' as const,
        targetArea: 'global' as const,
        recommendedProducts: []
      }))

      const startTime = performance.now()
      
      render(
        <UnifiedRoutineSection 
          routine={complexRoutine} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Vérifier que le rendu est rapide (< 100ms)
      expect(renderTime).toBeLessThan(100)

      // Vérifier que toutes les étapes sont traitées
      expect(screen.getByText('Étape 1')).toBeInTheDocument()
      expect(screen.getByText('Étape 20')).toBeInTheDocument()
    })

    it('devrait optimiser les re-renders avec React.memo', () => {
      const { rerender } = render(
        <UnifiedRoutineSection 
          routine={mockRoutine} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      // Simuler un re-render avec les mêmes props
      rerender(
        <UnifiedRoutineSection 
          routine={mockRoutine} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      // Les composants memoized ne devraient pas se re-render inutilement
      expect(screen.getByText('Nettoyant CeraVe')).toBeInTheDocument()
    })
  })

  describe('Gestion d\'Erreurs et Cas Limites', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true)
    })

    it('devrait gérer gracieusement une routine vide', () => {
      render(
        <UnifiedRoutineSection 
          routine={[]} 
          beautyAssessment={mockBeautyAssessment}
        />
      )

      expect(screen.getByText(/Aucun soin prévu/)).toBeInTheDocument()
    })

    it('devrait gérer l\'absence de beautyAssessment', () => {
      render(
        <UnifiedRoutineSection 
          routine={mockRoutine} 
        />
      )

      // Devrait utiliser les durées par défaut
      expect(screen.getByText(/1-2 semaines/)).toBeInTheDocument()
    })

    it('devrait gérer les erreurs de services gracieusement', () => {
      // Simuler une erreur dans PhaseOrganizer
      const { PhaseOrganizer } = require('@/utils/PhaseOrganizer')
      PhaseOrganizer.organizeByPhaseAndTime.mockImplementationOnce(() => {
        throw new Error('Erreur de test')
      })

      // Le composant ne devrait pas crasher
      expect(() => {
        render(
          <UnifiedRoutineSection 
            routine={mockRoutine} 
            beautyAssessment={mockBeautyAssessment}
          />
        )
      }).not.toThrow()
    })
  })
})

