'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Tab } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, 
  Sun, 
  Moon, 
  Calendar,
  Clock,
  Info,
  CheckCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import clsx from 'clsx'
import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'
import { PhaseOrganizer, type PhaseOrganization } from '@/utils/PhaseOrganizer'
import { 
  PhaseDependencyCalculator, 
  type PhaseDependencies 
} from '@/services/educational/PhaseDependencyCalculator'
import { 
  validateAndCleanTitle,
  formatApplicationDuration,
  getDetailedTiming,
  renderZoneBadge
} from '@/utils/RoutineDisplayHelpers'
import { applyFullCoherenceV2 } from '@/utils/ProductMappingHelpers'
import { TimeSection } from './TimeSection'
import { EducationalTooltip } from '@/components/shared/EducationalTooltip'
import { AIRoutineIndicator } from '@/components/shared/AIIndicator'

interface PhaseBasedRoutineViewProps {
  routine: UnifiedRoutineStep[]
  beautyAssessment?: BeautyAssessment
  isAIGenerated?: boolean
  personalizedContent?: {
    phaseDescriptions?: Record<string, string>
    globalAdvice?: string[]
    personalizationSummary?: string
  }
}

// Labels et descriptions des phases
const phaseInfo = {
  immediate: {
    label: 'Phase Immédiate',
    shortLabel: 'Immédiate',
    description: 'Stabiliser et traiter les problèmes urgents',
    icon: '🎯',
    color: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900'
  },
  adaptation: {
    label: 'Phase Adaptation',
    shortLabel: 'Adaptation',
    description: 'Introduire progressivement des actifs puissants',
    icon: '📈',
    color: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900'
  },
  maintenance: {
    label: 'Phase Maintenance',
    shortLabel: 'Maintenance',
    description: 'Maintenir les acquis et prévenir les rechutes',
    icon: '🛡️',
    color: 'from-purple-50 to-purple-100 border-purple-200 text-purple-900'
  }
}

/**
 * SPRINT 3 - REFONTE ROUTINES V2
 * Nouveau composant principal pour l'affichage phase/horaire
 * avec déduplication intelligente et métadonnées enrichies
 */
export function PhaseBasedRoutineView({
  routine,
  beautyAssessment,
  isAIGenerated = false,
  personalizedContent
}: PhaseBasedRoutineViewProps) {
  const [selectedPhase, setSelectedPhase] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Application de la cohérence V2 et organisation
  const organizedRoutine = useMemo(() => {
    const coherentRoutine = applyFullCoherenceV2(routine)
    return PhaseOrganizer.organizeByPhaseAndTime(coherentRoutine)
  }, [routine])

  // Calcul des dépendances entre phases
  const phaseDependencies = useMemo(() => {
    if (!beautyAssessment) return null
    return PhaseDependencyCalculator.calculatePhaseDependencies(routine, beautyAssessment)
  }, [beautyAssessment, routine])

  // Calcul de la timeline des phases (memoized pour performance)
  const getPhaseTimeline = useCallback((phase: keyof typeof phaseInfo) => {
    if (!phaseDependencies) {
      // Durées par défaut
      const defaultDurations = {
        immediate: '1-2 semaines',
        adaptation: '3-6 semaines',
        maintenance: 'Continu'
      }
      return defaultDurations[phase]
    }

    const phaseData = phaseDependencies[phase]
    if (!phaseData) return 'Non défini'

    if (phase === 'maintenance') {
      return 'À partir de la semaine ' + phaseData.startWeek
    }

    return `Semaines ${phaseData.startWeek}-${phaseData.endWeek}`
  }, [phaseDependencies])

  const phases = ['immediate', 'adaptation', 'maintenance'] as const

  return (
    <div className="space-y-6">
      {/* Header avec indicateur IA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Votre Routine Personnalisée
          </h2>
          <p className="text-gray-600">
            Programme en 3 phases adapté à votre peau et vos objectifs
          </p>
        </div>
        {isAIGenerated && <AIRoutineIndicator />}
      </div>

      {/* Navigation par onglets avec timeline */}
      <Tab.Group selectedIndex={selectedPhase} onChange={setSelectedPhase}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          {phases.map((phase, idx) => (
            <Tab
              key={phase}
              className={({ selected }) =>
                clsx(
                  'w-full rounded-lg py-3 px-4 text-sm font-medium transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500',
                  selected
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">{phaseInfo[phase].icon}</span>
                <div className="text-left">
                  <div className="font-medium">
                    {isMobile ? phaseInfo[phase].shortLabel : phaseInfo[phase].label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {getPhaseTimeline(phase)}
                  </div>
                </div>
                {idx < phases.length - 1 && !isMobile && (
                  <ChevronRight className="w-4 h-4 ml-2 text-gray-400" />
                )}
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          <AnimatePresence mode="wait">
            {phases.map((phase, index) => (
              <Tab.Panel
                key={phase}
                className="focus:outline-none"
                static
              >
                {selectedPhase === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PhaseContent
                      phase={phase}
                      data={organizedRoutine[phase]}
                      dependencies={phaseDependencies?.[phase]}
                      personalizedDescription={personalizedContent?.phaseDescriptions?.[phase]}
                      isMobile={isMobile}
                    />
                  </motion.div>
                )}
              </Tab.Panel>
            ))}
          </AnimatePresence>
        </Tab.Panels>
      </Tab.Group>

      {/* Conseils globaux personnalisés */}
      {personalizedContent?.globalAdvice && personalizedContent.globalAdvice.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl"
        >
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Conseils personnalisés
              </h3>
              <ul className="space-y-2">
                {personalizedContent.globalAdvice.map((advice, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{advice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Sous-composant pour le contenu d'une phase
interface PhaseContentProps {
  phase: 'immediate' | 'adaptation' | 'maintenance'
  data: {
    morning: UnifiedRoutineStep[]
    evening: UnifiedRoutineStep[]
    weekly: UnifiedRoutineStep[]
  }
  dependencies?: PhaseDependencies[keyof PhaseDependencies]
  personalizedDescription?: string
  isMobile: boolean
}

function PhaseContent({
  phase,
  data,
  dependencies,
  personalizedDescription,
  isMobile
}: PhaseContentProps) {
  const info = phaseInfo[phase]
  const hasContent = data.morning.length > 0 || data.evening.length > 0 || data.weekly.length > 0

  if (!hasContent) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-3">{info.icon}</div>
        <p className="text-gray-500">
          Aucun soin prévu pour cette phase
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de phase avec infos de transition */}
      <PhaseHeader
        phase={phase}
        info={info}
        dependencies={dependencies}
        personalizedDescription={personalizedDescription}
        isMobile={isMobile}
      />

      {/* Sections horaires */}
      {data.morning.length > 0 && (
        <TimeSection
          title="Routine du matin"
          icon={<Sun className="w-5 h-5" />}
          steps={data.morning}
          phase={phase}
          timeOfDay="morning"
        />
      )}

      {data.evening.length > 0 && (
        <TimeSection
          title="Routine du soir"
          icon={<Moon className="w-5 h-5" />}
          steps={data.evening}
          phase={phase}
          timeOfDay="evening"
        />
      )}

      {data.weekly.length > 0 && (
        <TimeSection
          title="Soins hebdomadaires"
          icon={<Calendar className="w-5 h-5" />}
          steps={data.weekly}
          phase={phase}
          isWeekly={true}
        />
      )}
    </div>
  )
}

// Sous-composant pour l'en-tête de phase
interface PhaseHeaderProps {
  phase: 'immediate' | 'adaptation' | 'maintenance'
  info: typeof phaseInfo[keyof typeof phaseInfo]
  dependencies?: PhaseDependencies[keyof PhaseDependencies]
  personalizedDescription?: string
  isMobile: boolean
}

function PhaseHeader({
  phase,
  info,
  dependencies,
  personalizedDescription,
  isMobile
}: PhaseHeaderProps) {
  return (
    <div className={clsx(
      'p-4 rounded-xl border-2 bg-gradient-to-br',
      info.color
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <span>{info.icon}</span>
            <span>{info.label}</span>
          </h3>
          <p className="mt-1 text-sm opacity-90">
            {personalizedDescription || info.description}
          </p>
        </div>

        {dependencies && !isMobile && (
          <EducationalTooltip
            content={
              <div className="space-y-2">
                <p className="font-medium">Critères de transition :</p>
                <ul className="space-y-1 text-sm">
                  {dependencies.transitionCriteria.map((criteria, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
                {dependencies.adaptationTips && dependencies.adaptationTips.length > 0 && (
                  <>
                    <p className="font-medium mt-3">Conseils d'adaptation :</p>
                    <ul className="space-y-1 text-sm">
                      {dependencies.adaptationTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            }
          >
            <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <Info className="w-4 h-4" />
            </button>
          </EducationalTooltip>
        )}
      </div>

      {/* Indicateurs de progression */}
      {dependencies && (
        <div className="mt-3 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>Durée : {dependencies.duration}</span>
          </div>
          {phase !== 'maintenance' && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>Progression semaine {dependencies.startWeek}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
