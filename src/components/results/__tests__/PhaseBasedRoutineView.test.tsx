import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PhaseBasedRoutineView } from '../PhaseBasedRoutineView'
import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'

// Mock des composants externes problématiques
jest.mock('@headlessui/react', () => ({
  Tab: {
    Group: ({ children, selectedIndex, onChange }: any) => {
      return React.createElement('div', { 
        'data-testid': 'tab-group', 
        'data-selected': selectedIndex,
        onClick: () => onChange && onChange(0)
      }, children)
    },
    List: ({ children }: any) => {
      return React.createElement('div', { 'data-testid': 'tab-list' }, children)
    },
    Panel: ({ children }: any) => {
      return React.createElement('div', { 'data-testid': 'tab-panel' }, children)
    },
    Panels: ({ children }: any) => {
      return React.createElement('div', { 'data-testid': 'tab-panels' }, children)
    }
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

jest.mock('../TimeSection', () => ({
  TimeSection: ({ title, children }: any) => (
    <div data-testid="time-section">
      <h3>{title}</h3>
      {children}
    </div>
  )
}))

jest.mock('@/components/shared/EducationalTooltip', () => ({
  EducationalTooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>
}))

jest.mock('@/components/shared/AIIndicator', () => ({
  AIRoutineIndicator: () => <div data-testid="ai-indicator">IA Générée</div>
}))

// Mock des hooks et services
jest.mock('@/utils/ProductMappingHelpers', () => ({
  applyFullCoherenceV2: jest.fn((routine) => routine)
}))

jest.mock('@/utils/PhaseOrganizer', () => ({
  PhaseOrganizer: {
    organizeByPhaseAndTime: jest.fn((routine) => ({
      immediate: {
        morning: routine.filter((s: any) => s.phase === 'immediate' && s.timeOfDay === 'morning'),
        evening: routine.filter((s: any) => s.phase === 'immediate' && s.timeOfDay === 'evening'),
        weekly: []
      },
      adaptation: {
        morning: routine.filter((s: any) => s.phase === 'adaptation' && s.timeOfDay === 'morning'),
        evening: routine.filter((s: any) => s.phase === 'adaptation' && s.timeOfDay === 'evening'),
        weekly: []
      },
      maintenance: {
        morning: routine.filter((s: any) => s.phase === 'maintenance' && s.timeOfDay === 'morning'),
        evening: [],
        weekly: []
      }
    }))
  }
}))

describe('PhaseBasedRoutineView - Sprint 3', () => {
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
      recommendedProducts: []
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
      recommendedProducts: []
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
      recommendedProducts: []
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

  it('devrait afficher la navigation par onglets phases', () => {
    render(
      <PhaseBasedRoutineView 
        routine={mockRoutine} 
        beautyAssessment={mockBeautyAssessment}
      />
    )

    // Vérifier que les 3 onglets sont présents
    expect(screen.getByText('Phase Immédiate')).toBeInTheDocument()
    expect(screen.getByText('Phase Adaptation')).toBeInTheDocument()
    expect(screen.getByText('Phase Maintenance')).toBeInTheDocument()
  })

  it('devrait afficher le contenu de la phase sélectionnée', () => {
    render(
      <PhaseBasedRoutineView 
        routine={mockRoutine} 
        beautyAssessment={mockBeautyAssessment}
      />
    )

    // Phase immédiate sélectionnée par défaut
    expect(screen.getByText('Nettoyage doux')).toBeInTheDocument()
    expect(screen.getByText('Hydratation légère')).toBeInTheDocument()
    expect(screen.queryByText('Traitement anti-âge')).not.toBeInTheDocument()
  })

  it('devrait permettre de naviguer entre les phases', () => {
    render(
      <PhaseBasedRoutineView 
        routine={mockRoutine} 
        beautyAssessment={mockBeautyAssessment}
      />
    )

    // Cliquer sur l'onglet Adaptation
    const adaptationTab = screen.getByText('Phase Adaptation')
    fireEvent.click(adaptationTab)

    // Vérifier que le contenu change
    expect(screen.queryByText('Nettoyage doux')).not.toBeInTheDocument()
    expect(screen.getByText('Traitement anti-âge')).toBeInTheDocument()
  })

  it('devrait afficher les sections horaires correctement', () => {
    render(
      <PhaseBasedRoutineView 
        routine={mockRoutine} 
        beautyAssessment={mockBeautyAssessment}
      />
    )

    // Vérifier les sections horaires
    expect(screen.getByText('Routine du matin')).toBeInTheDocument()
    expect(screen.getByText('Routine du soir')).toBeInTheDocument()
  })

  it('devrait afficher les conseils personnalisés si fournis', () => {
    const personalizedContent = {
      globalAdvice: [
        'Hydrater régulièrement votre peau',
        'Protéger du soleil quotidiennement'
      ]
    }

    render(
      <PhaseBasedRoutineView 
        routine={mockRoutine} 
        beautyAssessment={mockBeautyAssessment}
        personalizedContent={personalizedContent}
      />
    )

    expect(screen.getByText('Conseils personnalisés')).toBeInTheDocument()
    expect(screen.getByText('Hydrater régulièrement votre peau')).toBeInTheDocument()
    expect(screen.getByText('Protéger du soleil quotidiennement')).toBeInTheDocument()
  })

  it('devrait afficher l\'indicateur IA si activé', () => {
    render(
      <PhaseBasedRoutineView 
        routine={mockRoutine} 
        beautyAssessment={mockBeautyAssessment}
        isAIGenerated={true}
      />
    )

    // Vérifier la présence de l'indicateur IA (en supposant qu'il contient "IA")
    const aiIndicator = screen.getByText(/IA|Intelligence/i)
    expect(aiIndicator).toBeInTheDocument()
  })

  it('devrait gérer une routine vide correctement', () => {
    render(
      <PhaseBasedRoutineView 
        routine={[]} 
        beautyAssessment={mockBeautyAssessment}
      />
    )

    // Vérifier qu'un message approprié est affiché
    expect(screen.getByText(/Aucun soin prévu/i)).toBeInTheDocument()
  })

  it('devrait afficher les timelines des phases', () => {
    render(
      <PhaseBasedRoutineView 
        routine={mockRoutine} 
        beautyAssessment={mockBeautyAssessment}
      />
    )

    // Vérifier que les durées sont affichées
    expect(screen.getByText(/1-2 semaines/i)).toBeInTheDocument()
    expect(screen.getByText(/3-6 semaines/i)).toBeInTheDocument()
  })
})
