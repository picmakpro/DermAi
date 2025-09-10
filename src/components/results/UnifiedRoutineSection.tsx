'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Sun,
  Moon,
  Info,
  CheckCircle,
  AlertCircle,
  Repeat,
  Target,
  Lightbulb,
  ShoppingBag,
  MapPin,
  BookOpen,
  Shield,
  TrendingUp,
  Heart
} from 'lucide-react'
import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'
import { PhaseTimingCalculator, type PhaseTiming } from '@/services/educational/phaseTimingCalculator'
import { EducationalTooltip, MobileEducationalTooltip } from '@/components/shared/EducationalTooltip'

interface UnifiedRoutineSectionProps {
  routine: UnifiedRoutineStep[]
  beautyAssessment?: BeautyAssessment // Needed for personalized durations
}

const timeIcons = {
  morning: <Sun className="w-4 h-4" />,
  evening: <Moon className="w-4 h-4" />,
  both: <Clock className="w-4 h-4" />
}

// Canonical EN only
const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  'as_needed': 'As needed'
} as const

const phaseColors = {
  immediate: 'from-green-50 to-green-100 border-green-200',
  adaptation: 'from-blue-50 to-blue-100 border-blue-200',
  maintenance: 'from-purple-50 to-purple-100 border-purple-200'
}

const phaseLabels = {
  immediate: 'Immediate Phase',
  adaptation: 'Adaptation Phase',
  maintenance: 'Maintenance Phase'
}

export function UnifiedRoutineSection({ routine, beautyAssessment }: UnifiedRoutineSectionProps) {
  const [activePhase, setActivePhase] = useState<'immediate' | 'adaptation' | 'maintenance'>('immediate')
  const [viewMode, setViewMode] = useState<'phases' | 'schedule'>('phases')
  const [isMobile, setIsMobile] = useState(false)
  const [phaseTimings, setPhaseTimings] = useState<Record<string, PhaseTiming>>({})

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Compute personalized durations
  useEffect(() => {
    if (beautyAssessment && routine.length > 0) {
      const timings = PhaseTimingCalculator.calculateCompleteTiming(beautyAssessment, routine)
      setPhaseTimings(timings)
    }
  }, [beautyAssessment, routine])

  if (!routine || routine.length === 0) {
    return null
  }

  // Organize by phases (canonical EN)
  const organizeByPhases = () => {
    return {
      immediate: routine.filter(step => step.phase === 'immediate'),
      adaptation: routine.filter(step => step.phase === 'adaptation'),
      maintenance: routine.filter(step => step.phase === 'maintenance')
    }
  }

  // Organize by time of day with smart de-duplication
  const organizeBySchedule = () => {
    const deduplicateByProduct = (steps: UnifiedRoutineStep[]) => {
      const productGroups = new Map<string, UnifiedRoutineStep[]>()

      steps.forEach(step => {
        let groupKey = step.recommendedProducts[0]?.name || step.title
        let displayTitle = groupKey

        // Smart grouping for similar products (canonical EN-only logic)
        if (
          step.category === 'protection' ||
          /sun\s*protection|sunscreen|spf/i.test(step.title)
        ) {
          groupKey = 'Sun protection'
          displayTitle = 'Sun protection'
        } else if (
          step.category === 'cleansing' ||
          /cleansing|cleanser|face\s*wash/i.test(step.title)
        ) {
          groupKey = 'Gentle cleansing'
          displayTitle = 'Gentle cleansing'
        } else if (
          step.category === 'hydration' ||
          /hydration|moisturiz(e|a)r|hydrating/i.test(step.title)
        ) {
          groupKey = 'Overall hydration'
          displayTitle = 'Overall hydration'
        }

        if (!productGroups.has(groupKey)) {
          productGroups.set(groupKey, [])
        }
        productGroups.get(groupKey)!.push({ ...step, title: displayTitle })
      })

      const deduplicatedSteps: UnifiedRoutineStep[] = []

      productGroups.forEach((stepsGroup) => {
        if (stepsGroup.length === 1) {
          deduplicatedSteps.push(stepsGroup[0])
        } else {
          const baseStep = stepsGroup[0]
          const allPhases = stepsGroup.map(s => s.phase).filter((p, i, arr) => arr.indexOf(p) === i)

          // Clean title from evolution hints (EN only)
          const cleanTitle = baseStep.title.replace(
            /(optimized?|strengthened?|→\s*(evolved|optimized))/gi,
            ''
          ).trim()

          // Merge application advices (favor the simplest/first)
          const uniqueAdvices = stepsGroup
            .map(s => s.applicationAdvice)
            .filter((advice, i, arr) => arr.indexOf(advice) === i)

          const finalAdvice = uniqueAdvices[0]

          // Duration: keep "Continuous" for base-care products across phases, else original duration
          const isBaseCareProduct =
            baseStep.category === 'cleansing' ||
            baseStep.category === 'hydration' ||
            baseStep.category === 'protection'

          const finalDuration =
            allPhases.length > 1 && isBaseCareProduct
              ? 'Continuous'
              : baseStep.applicationDuration

          const evolvedStep: UnifiedRoutineStep = {
            ...baseStep,
            title: cleanTitle || baseStep.title,
            applicationAdvice: finalAdvice,
            applicationDuration: finalDuration,
            stepNumber: Math.min(...stepsGroup.map(s => s.stepNumber)),
            phase: 'immediate' // base phase for display
          }

          deduplicatedSteps.push(evolvedStep)
        }
      })

      return deduplicatedSteps.sort((a, b) => a.stepNumber - b.stepNumber)
    }

    // Smart filtering: avoid duplicates across sections (canonical EN only)
    const morningSteps = routine.filter(step =>
      (step.timeOfDay === 'morning' || step.timeOfDay === 'morning_and_evening') &&
      step.frequency === 'daily' // daily steps only
    )
    const eveningSteps = routine.filter(step =>
      (step.timeOfDay === 'evening' || step.timeOfDay === 'morning_and_evening') &&
      step.frequency === 'daily' // daily steps only
    )

    return {
      morning: deduplicateByProduct(morningSteps),
      evening: deduplicateByProduct(eveningSteps),
      weekly: routine.filter(step => step.frequency === 'weekly'),
      asNeeded: routine.filter(step => step.frequency === 'as_needed')
    }
  }

  const phaseData = organizeByPhases()
  const scheduleData = organizeBySchedule()

  const renderStep = (step: UnifiedRoutineStep, index: number, resetNumbering: boolean = false) => {
    // Temporary steps detection for badge only (EN only)
    const isTemporary =
      !!step.applicationDuration && !/(continuous|ongoing)/i.test(step.applicationDuration)

    const className = 'bg-white rounded-xl p-3 md:p-4 border border-gray-100 hover:shadow-md transition-all'
    const displayNumber = resetNumbering ? index + 1 : step.stepNumber

    return (
      <motion.div
        key={`${step.title}-${index}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={className}
      >
        <div className="flex items-start space-x-2 md:space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {displayNumber}
            </div>
          </div>

          <div className="flex-1">
            {/* Title on one line, badges below on mobile */}
            <div className="mb-2">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-gray-900 text-sm md:text-base leading-tight pr-2">{step.title}</h4>
                {/* Timing badge – better mobile fit */}
                <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                  {timeIcons[step.timeOfDay as keyof typeof timeIcons]}
                  <span className="hidden sm:inline">{frequencyLabels[step.frequency as keyof typeof frequencyLabels]}</span>
                  <span className="sm:hidden">
                    {step.frequency === 'daily' && 'Daily'}
                    {step.frequency === 'weekly' && 'Weekly'}
                    {step.frequency === 'as_needed' && 'Need'}
                    {(step.frequencyDetails?.toLowerCase().includes('progressive') || step.applicationDuration?.toLowerCase().includes('progressive')) && 'Prog'}
                  </span>
                </div>
              </div>

              {/* Temporary badge under title on mobile */}
              {isTemporary && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-xs font-medium w-fit">
                  <Clock className="w-3 h-3" />
                  <span>Temporary</span>
                </div>
              )}
            </div>

            {step.frequencyDetails && (
              <div className="flex items-center space-x-1 text-xs text-blue-600 mb-2">
                <Repeat className="w-3 h-3" />
                <span>{step.frequencyDetails}</span>
              </div>
            )}

            {step.startAfterDays && (
              <div className="flex items-center space-x-1 text-xs text-orange-600 mb-2">
                <Calendar className="w-3 h-3" />
                <span>Introduce after at least {step.startAfterDays} days</span>
              </div>
            )}

            {/* Target areas – mobile-optimized */}
            {step.targetArea === 'specific' && step.zones && step.zones.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium w-fit mb-2">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Areas: </span>
                  {step.zones.join(', ')}
                </span>
              </div>
            )}

            {/* Recommended products – mobile-optimized */}
            <div className="bg-dermai-ai-50 rounded-lg p-2 md:p-3 mb-2 md:mb-3 border border-dermai-ai-200">
              <div className="flex items-center space-x-1 text-xs text-dermai-ai-700 mb-1 md:mb-2">
                <ShoppingBag className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">Recommended product</span>
              </div>
              {step.recommendedProducts.map((product, productIndex) => (
                <div key={productIndex} className="mb-1 md:mb-2 last:mb-0">
                  <div className="font-medium text-sm text-dermai-ai-800 leading-tight">
                    {product.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {product.brand} • {product.category}
                  </div>
                  {product.affiliateLink && (
                    <a
                      href={product.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-dermai-ai-600 hover:underline font-medium"
                    >
                      <span>View product</span>
                      <span className="ml-1">→</span>
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Application tips – mobile-optimized */}
            <div className="space-y-1 mb-2 md:mb-3">
              <div className="flex items-center space-x-1 text-xs text-green-700">
                <Lightbulb className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">Application tips</span>
              </div>
              <div className="text-xs text-gray-600 leading-relaxed">
                {step.applicationAdvice}
              </div>
            </div>

            {/* Application duration */}
            {(() => {
              const criteria = PhaseTimingCalculator.getVisualCriteria(step)
              if (criteria) {
                return (
                  <div className="space-y-1 mb-2 md:mb-3">
                    <div className="flex items-center space-x-1 text-xs text-blue-700">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">Application duration</span>
                    </div>
                    <div className="text-xs text-blue-600 leading-relaxed font-medium">
                      {criteria.observation} ({criteria.estimatedDays})
                    </div>
                  </div>
                )
              } else if (step.applicationDuration) {
                return (
                  <div className="space-y-1 mb-2 md:mb-3">
                    <div className="flex items-center space-x-1 text-xs text-blue-700">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">Application duration</span>
                    </div>
                    <div className="text-xs text-blue-600 leading-relaxed font-medium">
                      {step.applicationDuration}
                    </div>
                  </div>
                )
              }
              return null
            })()}

            {/* Detailed timing – mobile-optimized */}
            {step.timingDetails && (
              <div className="space-y-1 mb-2 md:mb-3">
                <div className="flex items-center space-x-1 text-xs text-purple-700">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="font-medium">Timing</span>
                </div>
                <div className="text-xs text-purple-600 leading-relaxed">
                  {step.timingDetails}
                </div>
              </div>
            )}

            {/* Restrictions – mobile-optimized */}
            {step.restrictions && step.restrictions.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-xs text-orange-700">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="font-medium">Restrictions</span>
                </div>
                <ul className="text-xs text-orange-600 space-y-1">
                  {step.restrictions.map((restriction, idx) => (
                    <li key={idx} className="flex items-start space-x-1">
                      <span className="flex-shrink-0">•</span>
                      <span className="leading-relaxed">{restriction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-3 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-0">
          <div className="p-1.5 md:p-2 bg-gradient-to-br from-dermai-ai-100 to-dermai-ai-200 rounded-lg md:rounded-xl">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-dermai-ai-600" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">Personalized Routines</h2>
            <p className="text-xs md:text-sm text-dermai-neutral-600">Powered by DermAI</p>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setViewMode('phases')}
            className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-md transition-all font-medium ${
              viewMode === 'phases'
                ? 'bg-white text-dermai-ai-400 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Phases
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-md transition-all font-medium ${
              viewMode === 'schedule'
                ? 'bg-white text-dermai-ai-400 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Schedule
          </button>
        </div>
      </div>

      {viewMode === 'phases' ? (
        <>
          {/* Phase navigation – mobile-optimized */}
          <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-6">
            {Object.keys(phaseData).map((phase) => {
              const stepCount = phaseData[phase as keyof typeof phaseData].length

              return (
                <button
                  key={phase}
                  onClick={() => setActivePhase(phase as 'immediate' | 'adaptation' | 'maintenance')}
                  className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-shrink-0 ${
                    activePhase === phase
                      ? 'bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="whitespace-nowrap">
                    <span className="hidden sm:inline">{phaseLabels[phase as keyof typeof phaseLabels]}</span>
                    <span className="sm:hidden">
                      {phase === 'immediate' && 'Immediate'}
                      {phase === 'adaptation' && 'Adaptation'}
                      {phase === 'maintenance' && 'Maintenance'}
                    </span>
                  </span>
                  <span className="ml-1 text-xs opacity-70">({stepCount})</span>
                </button>
              )
            })}
          </div>

          {/* Active phase content */}
          <div className={`bg-gradient-to-br ${phaseColors[activePhase]} rounded-2xl p-4 md:p-6 border`}>
            {/* Header with educational objective and tooltip */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  {activePhase === 'immediate' && <Shield className="w-4 h-4" />}
                  {activePhase === 'adaptation' && <TrendingUp className="w-4 h-4" />}
                  {activePhase === 'maintenance' && <Heart className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-baseline space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {phaseLabels[activePhase]}
                    </h3>
                    {phaseTimings[activePhase] && (
                      <span className="text-sm text-gray-600 font-medium">
                        ({phaseTimings[activePhase].duration})
                      </span>
                    )}
                  </div>
                  {phaseTimings[activePhase] && (
                    <p className="text-sm text-gray-700 mt-1">
                      {phaseTimings[activePhase].objective.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Educational tooltip */}
              {phaseTimings[activePhase] && (
                <div className="flex-shrink-0">
                  <div className="mt-1">
                    {isMobile ? (
                      <MobileEducationalTooltip
                        content={phaseTimings[activePhase].objective.tooltip}
                        title="Why this phase?"
                      />
                    ) : (
                      <EducationalTooltip
                        content={phaseTimings[activePhase].objective.tooltip}
                        title="Why this phase?"
                        trigger="hover"
                        position="auto"
                        maxWidth="450px"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {phaseData[activePhase].map((step, index) => renderStep(step, index))}
            </div>

            {/* Educational tips for the phase */}
            {phaseTimings[activePhase]?.educationalTips && (
              <div className="mt-4 p-3 bg-white/30 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Tips for this phase</span>
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  {phaseTimings[activePhase].educationalTips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-xs mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activePhase === 'immediate' && !phaseTimings[activePhase] && (
              <div className="mt-4 p-3 bg-white/30 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">Start right away</span>
                </div>
              </div>
            )}

            {/* Phase navigation – responsive */}
            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-xs md:text-sm text-gray-700 text-center sm:text-left">
                  <span className="font-medium">Current phase:</span>
                  <span className="ml-1">{phaseLabels[activePhase]}</span>
                  {phaseTimings[activePhase] && (
                    <span className="ml-1 text-gray-600">({phaseTimings[activePhase].duration})</span>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-end space-x-2">
                  {/* Previous phase button */}
                  {activePhase !== 'immediate' && (
                    <button
                      onClick={() => {
                        const phases = ['immediate', 'adaptation', 'maintenance'] as const
                        const currentIndex = phases.indexOf(activePhase)
                        if (currentIndex > 0) {
                          setActivePhase(phases[currentIndex - 1])
                        }
                      }}
                      className="flex items-center space-x-1 px-2.5 md:px-3 py-1.5 md:py-2 bg-white/50 hover:bg-white/70 text-gray-700 rounded-lg text-xs md:text-sm font-medium transition-all"
                    >
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                  )}

                  {/* Next phase button */}
                  {activePhase !== 'maintenance' && (
                    <button
                      onClick={() => {
                        const phases = ['immediate', 'adaptation', 'maintenance'] as const
                        const currentIndex = phases.indexOf(activePhase)
                        if (currentIndex < phases.length - 1) {
                          setActivePhase(phases[currentIndex + 1])
                        }
                      }}
                      className="flex items-center space-x-1 px-2.5 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-500 hover:from-dermai-ai-500 hover:to-dermai-ai-600 text-white rounded-lg text-xs md:text-sm font-medium transition-all shadow-md"
                    >
                      <span className="whitespace-nowrap">
                        <span className="hidden sm:inline">
                          {activePhase === 'immediate' && 'Adaptation Phase'}
                          {activePhase === 'adaptation' && 'Maintenance Phase'}
                        </span>
                        <span className="sm:hidden">
                          {activePhase === 'immediate' && 'Adaptation'}
                          {activePhase === 'adaptation' && 'Maintenance'}
                        </span>
                      </span>
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Final message for last phase */}
                  {activePhase === 'maintenance' && (
                    <div className="flex items-center space-x-1 px-2.5 md:px-3 py-1.5 md:py-2 bg-green-100 text-green-700 rounded-lg text-xs md:text-sm font-medium">
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Routine complete</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-3 md:gap-6">
          {/* Morning routine – mobile-optimized */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-orange-100">
            <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Sun className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Morning routine</h3>
            </div>
            <div className="space-y-2 md:space-y-3">
              {scheduleData.morning.map((step, index) => renderStep(step, index, true))}
            </div>
          </div>

          {/* Evening routine – mobile-optimized */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-indigo-100">
            <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Moon className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Evening routine</h3>
            </div>
            <div className="space-y-2 md:space-y-3">
              {scheduleData.evening.map((step, index) => renderStep(step, index, true))}
            </div>
          </div>

          {/* Weekly routine */}
          {scheduleData.weekly.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 md:p-6 border border-green-100 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Weekly routine</h3>
              </div>
              <div className="space-y-3">
                {scheduleData.weekly.map((step, index) => renderStep(step, index, true))}
              </div>
            </div>
          )}


          {/* As needed */}
          {scheduleData.asNeeded.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-4 md:p-6 border border-gray-100 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">As needed</h3>
              </div>
              <div className="space-y-3">
                {scheduleData.asNeeded.map((step, index) => renderStep(step, index, true))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UnifiedRoutineSection
