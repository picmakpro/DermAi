/**
 * SPRINT 4 - TESTS UNITAIRES TimeSection
 * Tests pour le composant TimeSection du Sprint 3
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TimeSection } from '../TimeSection'
import type { UnifiedRoutineStep } from '@/types'

// Mock des dépendances
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

jest.mock('lucide-react', () => ({
  Sun: () => <span data-testid="sun-icon">☀️</span>,
  Moon: () => <span data-testid="moon-icon">🌙</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>
}))

jest.mock('../StepCard', () => ({
  StepCard: ({ step, index, phase, isWeekly }: any) => (
    <div data-testid={`step-card-${index}`}>
      <span>{step.title}</span>
      <span data-testid="phase">{phase}</span>
      {isWeekly && <span data-testid="weekly-badge">Hebdomadaire</span>}
    </div>
  )
}))

describe('TimeSection - Sprint 4', () => {
  const mockSteps: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      phase: 'immediate',
      title: 'Nettoyage doux',
      category: 'cleansing',
      applicationAdvice: 'Masser délicatement',
      timeOfDay: 'morning',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: []
    },
    {
      stepNumber: 2,
      phase: 'immediate',
      title: 'Hydratation légère',
      category: 'hydration',
      applicationAdvice: 'Appliquer sur peau humide',
      timeOfDay: 'morning',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: []
    }
  ]

  describe('Rendu de base', () => {
    it('devrait rendre le composant avec titre et icône', () => {
      render(
        <TimeSection
          title="Routine du matin"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={mockSteps}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      expect(screen.getByText('Routine du matin')).toBeInTheDocument()
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    })

    it('devrait afficher le nombre d\'étapes correct', () => {
      render(
        <TimeSection
          title="Routine du matin"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={mockSteps}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      expect(screen.getByText('2 étapes')).toBeInTheDocument()
    })

    it('devrait afficher "1 étape" au singulier pour une seule étape', () => {
      render(
        <TimeSection
          title="Routine du matin"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={[mockSteps[0]]}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      expect(screen.getByText('1 étape')).toBeInTheDocument()
    })

    it('devrait rendre toutes les étapes avec StepCard', () => {
      render(
        <TimeSection
          title="Routine du matin"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={mockSteps}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      expect(screen.getByTestId('step-card-0')).toBeInTheDocument()
      expect(screen.getByTestId('step-card-1')).toBeInTheDocument()
      expect(screen.getByText('Nettoyage doux')).toBeInTheDocument()
      expect(screen.getByText('Hydratation légère')).toBeInTheDocument()
    })
  })

  describe('Gestion des phases', () => {
    it('devrait appliquer le bon gradient pour la phase immediate', () => {
      const { container } = render(
        <TimeSection
          title="Routine du matin"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={mockSteps}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      const header = container.querySelector('.from-emerald-50')
      expect(header).toBeInTheDocument()
    })

    it('devrait appliquer le bon gradient pour la phase adaptation', () => {
      const { container } = render(
        <TimeSection
          title="Routine du soir"
          icon={<span data-testid="moon-icon">🌙</span>}
          steps={mockSteps}
          phase="adaptation"
          timeOfDay="evening"
        />
      )

      const header = container.querySelector('.from-blue-50')
      expect(header).toBeInTheDocument()
    })

    it('devrait appliquer le bon gradient pour la phase maintenance', () => {
      const { container } = render(
        <TimeSection
          title="Routine du soir"
          icon={<span data-testid="moon-icon">🌙</span>}
          steps={mockSteps}
          phase="maintenance"
          timeOfDay="evening"
        />
      )

      const header = container.querySelector('.from-purple-50')
      expect(header).toBeInTheDocument()
    })
  })

  describe('Mode hebdomadaire', () => {
    it('devrait afficher l\'indication hebdomadaire', () => {
      render(
        <TimeSection
          title="Soins hebdomadaires"
          icon={<span data-testid="calendar-icon">📅</span>}
          steps={mockSteps}
          phase="immediate"
          isWeekly={true}
        />
      )

      expect(screen.getByText('2 étapes - À planifier dans la semaine')).toBeInTheDocument()
    })

    it('devrait passer le flag isWeekly aux StepCards', () => {
      render(
        <TimeSection
          title="Soins hebdomadaires"
          icon={<span data-testid="calendar-icon">📅</span>}
          steps={mockSteps}
          phase="immediate"
          isWeekly={true}
        />
      )

      expect(screen.getAllByTestId('weekly-badge')).toHaveLength(2)
    })
  })

  describe('Badge optimisé', () => {
    it('devrait afficher le badge "Optimisé" si des étapes sont évolutives', () => {
      const evolutiveSteps = [
        {
          ...mockSteps[0],
          isEvolutive: true
        }
      ]

      render(
        <TimeSection
          title="Routine du matin"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={evolutiveSteps}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      expect(screen.getByText('Optimisé')).toBeInTheDocument()
    })

    it('ne devrait pas afficher le badge si aucune étape n\'est évolutive', () => {
      render(
        <TimeSection
          title="Routine du matin"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={mockSteps}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      expect(screen.queryByText('Optimisé')).not.toBeInTheDocument()
    })
  })

  describe('Cas limites', () => {
    it('ne devrait pas rendre si aucune étape', () => {
      const { container } = render(
        <TimeSection
          title="Routine vide"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={[]}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('devrait gérer les étapes sans titre', () => {
      const stepsWithoutTitle = [{
        ...mockSteps[0],
        title: ''
      }]

      render(
        <TimeSection
          title="Routine du matin"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={stepsWithoutTitle}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      expect(screen.getByTestId('step-card-0')).toBeInTheDocument()
    })
  })

  describe('Accessibilité', () => {
    it('devrait avoir une structure sémantique correcte', () => {
      render(
        <TimeSection
          title="Routine du matin"
          icon={<span data-testid="sun-icon">☀️</span>}
          steps={mockSteps}
          phase="immediate"
          timeOfDay="morning"
        />
      )

      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toHaveTextContent('Routine du matin')
    })
  })
})

