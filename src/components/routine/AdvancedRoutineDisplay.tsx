'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FrequencyCanonical, TimeOfDayCanonical } from '@/constants/canonicals'
import { normalizeRoutineLike } from '@/lib/i18n/normalization'
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
  Lightbulb
} from 'lucide-react'

/**
 * LEGACY step (already EN)
 */
interface LegacyRoutineStep {
  title: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'as-needed' | 'progressive'
  timeOfDay: 'morning' | 'evening' | 'both'
  frequencyDetails?: string
  phase: 'immediate' | 'adaptation' | 'maintenance'
  startAfterDays?: number
  category: 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation'
  productSuggestion?: string
  applicationTips: string[]
}

/**
 * NEW step (EN canonical)
 */
interface NewRoutineStepEN {
  name: string
  frequency: FrequencyCanonical
  timing: TimeOfDayCanonical
  catalogId: string
  application: string
  startDate?: string
  affiliateLink?: string
}

/**
 * BACKWARD-COMPAT FR step (accepted at runtime and normalized to EN)
 */
interface NewRoutineStepFR {
  name: string
  frequency: FrequencyCanonical
  timing: TimeOfDayCanonical
  catalogId: string
  application: string
  startDate?: string
  affiliateLink?: string
}

interface AdvancedRoutineProps {
  routine: {
    immediate: any[]
    adaptation: any[]
    maintenance: any[]
  }
}

/* ----------------------------- UI helpers ------------------------------ */

const timeIcons = {
  morning: <Sun className="w-4 h-4" />,
  evening: <Moon className="w-4 h-4" />,
  morning_and_evening: <Clock className="w-4 h-4" />,
  both: <Clock className="w-4 h-4" /> // backward compatibility
}

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  'as-needed': 'As needed',
  'as_needed': 'As needed',
  progressive: 'Progressive'
}

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

const categoryIcons = {
  cleansing: '🧼',
  treatment: '🎯',
  hydration: '💧',
  protection: '☀️',
  exfoliation: '✨'
}

/* ---------------------- Type guards + normalizers ---------------------- */

const isLegacy = (s: any): s is LegacyRoutineStep =>
  s && typeof s === 'object' && 'title' in s && 'timeOfDay' in s

const isNewEN = (s: any): s is NewRoutineStepEN =>
  s && typeof s === 'object' && 'catalogId' in s && 'timing' in s && ['morning', 'evening', 'morning_and_evening'].includes(String(s.timing))

const isNewFR = (s: any): s is NewRoutineStepFR =>
  s && typeof s === 'object' && 'catalogId' in s && 'timing' in s && ['matin', 'soir', 'matin_et_soir', 'morning', 'evening', 'morning_and_evening'].includes(String(s.timing))

/** FR → EN for new-structure steps (runtime compatibility) */
const normalizeFRStepToEN = (step: NewRoutineStepFR): NewRoutineStepEN => {
  const freqMap: Record<string, FrequencyCanonical> = {
    quotidien: 'daily',
    hebdomadaire: 'weekly',
    ponctuel: 'as_needed',
    daily: 'daily',
    weekly: 'weekly',
    as_needed: 'as_needed',
    'as-needed': 'as_needed'
  }
  const timingMap: Record<string, TimeOfDayCanonical> = {
    matin: 'morning',
    soir: 'evening',
    matin_et_soir: 'morning_and_evening',
    morning: 'morning',
    evening: 'evening',
    both: 'morning_and_evening',
    morning_and_evening: 'morning_and_evening'
  }
  return {
    name: step.name,
    frequency: freqMap[step.frequency] ?? 'daily',
    timing: timingMap[step.timing] ?? 'morning_and_evening',
    catalogId: step.catalogId,
    application: step.application,
    startDate: step.startDate,
    affiliateLink: step.affiliateLink
  }
}

/** Unify any step shape into a single display-friendly object */
type NormalizedDisplayStep = {
  title: string
  description?: string
  frequency: FrequencyCanonical | 'monthly' | 'progressive' | 'as-needed' // allow legacy values for display compatibility
  timeOfDay: TimeOfDayCanonical | 'both' // allow legacy values for display compatibility
  phase?: 'immediate' | 'adaptation' | 'maintenance'
  category?: 'cleansing' | 'treatment' | 'hydration' | 'protection' | 'exfoliation'
  productSuggestion?: string
  applicationTips: string[]
  frequencyDetails?: string
  startAfterDays?: number
  catalogId?: string
  startDate?: string
  affiliateLink?: string
}

const toDisplayStep = (raw: any): NormalizedDisplayStep => {
  if (isLegacy(raw)) {
    return {
      title: raw.title,
      description: raw.description,
      frequency: raw.frequency,
      timeOfDay: raw.timeOfDay,
      phase: raw.phase,
      category: raw.category,
      productSuggestion: raw.productSuggestion,
      applicationTips: raw.applicationTips ?? [],
      frequencyDetails: raw.frequencyDetails,
      startAfterDays: raw.startAfterDays
    }
  }

  const en = isNewEN(raw) ? raw : isNewFR(raw) ? normalizeFRStepToEN(raw) : undefined

  if (en) {
    return {
      title: en.name,
      description: '',
      frequency: en.frequency,
      timeOfDay: en.timing,
      phase: 'immediate',
      category: 'treatment',
      applicationTips: en.application ? [en.application] : [],
      catalogId: en.catalogId,
      startDate: en.startDate,
      affiliateLink: en.affiliateLink
    }
  }

  // Unknown shape → safe fallback
  return {
    title: raw?.title ?? raw?.name ?? 'Care step',
    description: raw?.description ?? '',
    frequency: (raw?.frequency as any) ?? 'daily',
    timeOfDay: (raw?.timeOfDay as any) ?? 'both',
    phase: (raw?.phase as any) ?? 'immediate',
    category: (raw?.category as any) ?? 'treatment',
    applicationTips: Array.isArray(raw?.applicationTips) ? raw.applicationTips : raw?.application ? [raw.application] : []
  }
}

/* --------------------- Catalog helpers (display only) ------------------- */

const getProductNameFromCatalogId = (catalogId: string): string => {
  if (catalogId === 'B01MSSDEPK') return 'CeraVe Hydrating Cleanser'
  if (catalogId === 'B00BNUY3HE') return 'La Roche-Posay Cicaplast Balm B5'
  if (catalogId === 'B01MDTVZTZ') return 'The Ordinary Niacinamide 10% + Zinc 1%'
  if (catalogId === 'B00949CTQQ') return "Paula's Choice SKIN PERFECTING 2% BHA"
  if (catalogId === 'B004W55086') return 'La Roche-Posay Anthelios Fluid SPF 50'

  // Patterns (older IDs)
  if (catalogId.includes('CERAVE') || catalogId.includes('HYDRATING') || catalogId.includes('CLEANSER'))
    return 'CeraVe Hydrating Cleanser Gel'
  if (catalogId.includes('AVENE') || catalogId.includes('CICALFATE')) return 'Avène Cicalfate+ Restorative Cream'
  if (catalogId.includes('ORDINARY') || catalogId.includes('NIACINAMIDE')) return 'The Ordinary Niacinamide 10% Serum'
  if (catalogId.includes('LRP') || catalogId.includes('ANTHELIOS') || catalogId.includes('SPF'))
    return 'La Roche-Posay Anthelios SPF 50+'
  if (catalogId.includes('PAULA') || catalogId.includes('CHOICE') || catalogId.includes('BHA'))
    return "Paula's Choice 2% BHA Exfoliant"
  if (catalogId.includes('EFFACLAR')) return 'La Roche-Posay Effaclar Purifying Gel'

  // Generic fallback by splitting ID-ish strings
  const parts = catalogId.split('_')
  if (parts.length >= 2) {
    const brand = parts[0].replace(/([A-Z])/g, ' $1').trim()
    const product = parts.slice(1, -1).join(' ').replace(/([A-Z])/g, ' $1').trim()
    return `${brand} ${product}`.replace(/\s+/g, ' ').trim() || 'Recommended Product'
  }
  return 'Recommended Product'
}

/* --------------------------------- UI ---------------------------------- */

export default function AdvancedRoutineDisplay({ routine }: AdvancedRoutineProps) {
  const [activePhase, setActivePhase] = useState<'immediate' | 'adaptation' | 'maintenance'>('immediate')
  const [viewMode, setViewMode] = useState<'phases' | 'schedule'>('phases')

  // Collect + normalize all steps for schedule view
  const allSteps = [
    ...routine.immediate.map(toDisplayStep),
    ...routine.adaptation.map(toDisplayStep),
    ...routine.maintenance.map(toDisplayStep)
  ]

  const scheduleData = {
    morning: allSteps.filter((s) => s.timeOfDay === 'morning' || s.timeOfDay === 'both' || s.timeOfDay === 'morning_and_evening'),
    evening: allSteps.filter((s) => s.timeOfDay === 'evening' || s.timeOfDay === 'both' || s.timeOfDay === 'morning_and_evening'),
    weekly: allSteps.filter((s) => s.frequency === 'weekly'),
    asNeeded: allSteps.filter((s) => s.frequency === 'as-needed' || s.frequency === 'as_needed')
  }

  const renderStep = (raw: any, index: number) => {
    const step = toDisplayStep(raw)

    return (
      <motion.div
        key={`${step.title}-${index}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
              {categoryIcons[(step.category || 'treatment') as keyof typeof categoryIcons] || '🎯'}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900">{step.title}</h4>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                {timeIcons[step.timeOfDay]}
                <span>{frequencyLabels[step.frequency] || 'Daily'}</span>
              </div>
            </div>

            {step.description && <p className="text-sm text-gray-600 mb-2">{step.description}</p>}

            {step.frequencyDetails && (
              <div className="flex items-center space-x-1 text-xs text-blue-600 mb-2">
                <Repeat className="w-3 h-3" />
                <span>{step.frequencyDetails}</span>
              </div>
            )}

            {typeof step.startAfterDays === 'number' && (
              <div className="flex items-center space-x-1 text-xs text-orange-600 mb-2">
                <Calendar className="w-3 h-3" />
                <span>Introduce after {step.startAfterDays} days</span>
              </div>
            )}

            {/* New-structure product block */}
            {step.catalogId && (
              <div className="bg-dermai-ai-50 rounded-lg p-2 mb-2 border border-dermai-ai-200">
                <div className="flex items-center space-x-1 text-xs text-dermai-ai-700 mb-1">
                  <span className="w-2 h-2 bg-dermai-ai-500 rounded-full"></span>
                  <span className="font-medium">{getProductNameFromCatalogId(step.catalogId)}</span>
                </div>
                <a
                  href={typeof step.affiliateLink === 'string' ? step.affiliateLink : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-dermai-ai-800 font-medium hover:underline"
                >
                  {getProductNameFromCatalogId(step.catalogId)}
                </a>
                {step.startDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    Start: {String(step.startDate).replace(/_/g, ' ').replace(/apres|après/gi, 'after')}
                  </p>
                )}
              </div>
            )}

            {/* Legacy product suggestion */}
            {!step.catalogId && step.productSuggestion && (
              <div className="bg-gray-50 rounded-lg p-2 mb-2">
                <div className="flex items-center space-x-1 text-xs text-gray-700 mb-1">
                  <Target className="w-3 h-3" />
                  <span className="font-medium">Recommended product</span>
                </div>
                <p className="text-xs text-gray-600">{step.productSuggestion}</p>
              </div>
            )}

            {step.applicationTips?.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-xs text-green-700">
                  <Lightbulb className="w-3 h-3" />
                  <span className="font-medium">Application tips</span>
                </div>
                {step.applicationTips.map((tip, i) => (
                  <div key={i} className="flex items-start space-x-2 text-xs text-gray-600">
                    <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <div className="p-2 bg-gradient-to-br from-dermai-ai-100 to-dermai-ai-200 rounded-xl">
            <Calendar className="w-5 h-5 text-dermai-ai-600" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Personalized Routines</h2>
            <p className="text-sm text-dermai-neutral-600">Powered by DermAI</p>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setViewMode('phases')}
            className={`px-4 py-2 text-sm rounded-md transition-all font-medium ${
              viewMode === 'phases' ? 'bg-white text-dermai-ai-400 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Phases
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-4 py-2 text-sm rounded-md transition-all font-medium ${
              viewMode === 'schedule' ? 'bg-white text-dermai-ai-400 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Schedule
          </button>
        </div>
      </div>

      {viewMode === 'phases' ? (
        <>
          {/* Phase tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['immediate', 'adaptation', 'maintenance'] as const).map((phase) => (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                  activePhase === phase
                    ? 'bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="whitespace-nowrap">{phaseLabels[phase]}</span>
                <span className="ml-1 text-xs opacity-70">
                  ({(routine as any)[phase]?.length ?? 0})
                </span>
              </button>
            ))}
          </div>

          {/* Active phase */}
          <div className={`bg-gradient-to-br ${phaseColors[activePhase]} rounded-2xl p-6 border`}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                {activePhase === 'immediate' && <CheckCircle className="w-4 h-4" />}
                {activePhase === 'adaptation' && <AlertCircle className="w-4 h-4" />}
                {activePhase === 'maintenance' && <Target className="w-4 h-4" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{phaseLabels[activePhase]}</h3>
            </div>

            <div className="space-y-3">
              {(routine as any)[activePhase]?.map((step: any, i: number) => renderStep(step, i))}
            </div>

            {activePhase === 'immediate' && (
              <div className="mt-4 p-3 bg-white/30 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">Start these steps right away.</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Morning */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Sun className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Morning Routine</h3>
            </div>
            <div className="space-y-3">
              {scheduleData.morning.map((s, i) => renderStep(s, i))}
            </div>
          </div>

          {/* Evening */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Moon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Evening Routine</h3>
            </div>
            <div className="space-y-3">
              {scheduleData.evening.map((s, i) => renderStep(s, i))}
            </div>
          </div>

          {/* Weekly */}
          {scheduleData.weekly.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Weekly Routine</h3>
              </div>
              <div className="space-y-3">
                {scheduleData.weekly.map((s, i) => renderStep(s, i))}
              </div>
            </div>
          )}

          {/* As needed */}
          {scheduleData.asNeeded.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">As Needed</h3>
              </div>
              <div className="space-y-3">
                {scheduleData.asNeeded.map((s, i) => renderStep(s, i))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
