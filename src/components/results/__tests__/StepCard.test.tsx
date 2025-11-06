/**
 * SPRINT 4 - TESTS UNITAIRES StepCard
 * Tests pour le composant StepCard du Sprint 3
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StepCard } from '../StepCard'
import type { UnifiedRoutineStep } from '@/types'

// Mock des dépendances
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

jest.mock('lucide-react', () => ({
  Info: () => <span data-testid="info-icon">ℹ️</span>,
  Clock: () => <span data-testid="clock-icon">⏰</span>,
  MapPin: () => <span data-testid="map-pin-icon">📍</span>
}))

jest.mock('../WeeklyScheduleDisplay', () => ({
  WeeklyScheduleDisplay: ({ step }: any) => (
    <div data-testid="weekly-schedule">
      Planning hebdomadaire pour {step.title}
    </div>
  )
}))

jest.mock('@/utils/RoutineDisplayHelpers', () => ({
  validateAndCleanTitle: jest.fn((title) => title || 'Titre par défaut'),
  formatApplicationDuration: jest.fn((duration) => duration || ''),
  getDetailedTiming: jest.fn((step) => step.timing || ''),
  renderZoneBadge: jest.fn((step) => {
    if (step.zones && step.zones.length > 0) {
      return <span data-testid="zone-badge">{step.zones.join(', ')}</span>
    }
    return null
  }),
  mapFrequencyToFrench: jest.fn((frequency) => {
    const mapping: Record<string, string> = {
      'daily': 'Quotidien',
      'weekly': 'Hebdomadaire',
      '2x/week': '2 fois par semaine'
    }
    return mapping[frequency] || frequency
  }),
  isTemporaryTreatment: jest.fn((step) => {
    return step.category === 'treatment' || step.category === 'exfoliation' || step.isTemporary
  })
}))

describe('StepCard - Sprint 4', () => {
  const mockStep: UnifiedRoutineStep = {
    stepNumber: 1,
    phase: 'immediate',
    title: 'Nettoyage doux',
    category: 'cleansing',
    applicationAdvice: 'Masser délicatement sur peau humide',
    timeOfDay: 'morning',
    frequency: 'daily',
    targetArea: 'global',
    recommendedProducts: [
      {
        name: 'Nettoyant Doux CeraVe',
        brand: 'CeraVe',
        price: 12.99,
        affiliateUrl: 'https://example.com/product',
        catalogId: 'cerave-cleanser-001'
      }
    ]
  }

  describe('Rendu de base', () => {
    it('devrait rendre le composant avec les informations de base', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.getByText('1')).toBeInTheDocument() // Numéro d'étape
      expect(screen.getByText('Nettoyage doux')).toBeInTheDocument()
      expect(screen.getByText('Masser délicatement sur peau humide')).toBeInTheDocument()
    })

    it('devrait afficher le produit recommandé', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.getByText('Nettoyant Doux CeraVe')).toBeInTheDocument()
    })

    it('devrait utiliser validateAndCleanTitle pour le titre', () => {
      const { validateAndCleanTitle } = require('@/utils/RoutineDisplayHelpers')
      
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
        />
      )

      expect(validateAndCleanTitle).toHaveBeenCalledWith(mockStep.title, mockStep.category)
    })
  })

  describe('Métadonnées temporaires', () => {
    it('devrait afficher les métadonnées pour un traitement temporaire', () => {
      const temporaryStep = {
        ...mockStep,
        category: 'treatment' as const,
        isTemporary: true,
        introduceFromWeek: 2,
        applicationDuration: '3-4 semaines',
        frequency: '2x/week'
      }

      render(
        <StepCard
          step={temporaryStep}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.getByText('À introduire à partir de la semaine 3')).toBeInTheDocument()
      expect(screen.getByText('Durée : 3-4 semaines')).toBeInTheDocument()
      expect(screen.getByText('Fréquence : 2 fois par semaine')).toBeInTheDocument()
    })

    it('ne devrait pas afficher les métadonnées pour un soin continu', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.queryByText(/À introduire/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Durée :/)).not.toBeInTheDocument()
    })

    it('devrait détecter automatiquement les traitements temporaires par catégorie', () => {
      const treatmentStep = {
        ...mockStep,
        category: 'treatment' as const,
        applicationDuration: '2 semaines'
      }

      render(
        <StepCard
          step={treatmentStep}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.getByText('Durée : 2 semaines')).toBeInTheDocument()
    })
  })

  describe('Zones ciblées', () => {
    it('devrait afficher le badge de zones si présent', () => {
      const stepWithZones = {
        ...mockStep,
        targetArea: 'specific' as const,
        zones: ['front', 'nez']
      }

      render(
        <StepCard
          step={stepWithZones}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.getByTestId('zone-badge')).toBeInTheDocument()
      expect(screen.getByText('front, nez')).toBeInTheDocument()
    })

    it('ne devrait pas afficher le badge pour une zone globale', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.queryByTestId('zone-badge')).not.toBeInTheDocument()
    })
  })

  describe('Mode hebdomadaire', () => {
    it('devrait afficher le planning hebdomadaire si isWeekly=true', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
          isWeekly={true}
        />
      )

      expect(screen.getByTestId('weekly-schedule')).toBeInTheDocument()
      expect(screen.getByText('Planning hebdomadaire pour Nettoyage doux')).toBeInTheDocument()
    })

    it('ne devrait pas afficher le planning hebdomadaire par défaut', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.queryByTestId('weekly-schedule')).not.toBeInTheDocument()
    })
  })

  describe('Restrictions', () => {
    it('devrait afficher les restrictions si présentes', () => {
      const stepWithRestrictions = {
        ...mockStep,
        restrictions: ['Éviter le contour des yeux', 'Ne pas utiliser avec des acides']
      }

      render(
        <StepCard
          step={stepWithRestrictions}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.getByText('Éviter le contour des yeux')).toBeInTheDocument()
      expect(screen.getByText('Ne pas utiliser avec des acides')).toBeInTheDocument()
    })

    it('ne devrait pas afficher de section restrictions si aucune', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.queryByText(/Restrictions/)).not.toBeInTheDocument()
    })
  })

  describe('Gestion des cas limites', () => {
    it('devrait gérer un step sans produits recommandés', () => {
      const stepWithoutProducts = {
        ...mockStep,
        recommendedProducts: []
      }

      render(
        <StepCard
          step={stepWithoutProducts}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.getByText('Nettoyage doux')).toBeInTheDocument()
      expect(screen.queryByText('Nettoyant Doux CeraVe')).not.toBeInTheDocument()
    })

    it('devrait gérer un step sans conseils d\'application', () => {
      const stepWithoutAdvice = {
        ...mockStep,
        applicationAdvice: ''
      }

      render(
        <StepCard
          step={stepWithoutAdvice}
          index={0}
          phase="immediate"
        />
      )

      expect(screen.getByText('Nettoyage doux')).toBeInTheDocument()
    })

    it('devrait gérer un index élevé', () => {
      render(
        <StepCard
          step={mockStep}
          index={99}
          phase="immediate"
        />
      )

      expect(screen.getByText('100')).toBeInTheDocument() // index + 1
    })
  })

  describe('Phases différentes', () => {
    it('devrait accepter différentes phases', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="adaptation"
        />
      )

      expect(screen.getByText('Nettoyage doux')).toBeInTheDocument()
    })

    it('devrait accepter la phase maintenance', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="maintenance"
        />
      )

      expect(screen.getByText('Nettoyage doux')).toBeInTheDocument()
    })
  })

  describe('Accessibilité', () => {
    it('devrait avoir une structure accessible', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
        />
      )

      const title = screen.getByRole('heading', { level: 4 })
      expect(title).toHaveTextContent('Nettoyage doux')
    })

    it('devrait avoir un numéro d\'étape lisible', () => {
      render(
        <StepCard
          step={mockStep}
          index={0}
          phase="immediate"
        />
      )

      const stepNumber = screen.getByText('1')
      expect(stepNumber).toBeInTheDocument()
    })
  })
})
