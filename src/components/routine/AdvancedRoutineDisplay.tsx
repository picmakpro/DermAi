'use client'

import React, { useState } from 'react'
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
  Lightbulb
} from 'lucide-react'

// Legacy interface for compatibility
interface RoutineStep {
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

// New interface with catalogId
interface NewRoutineStep {
  // value used in logic; keep as-is (French)
  name: string
  frequency: 'quotidien' | 'hebdomadaire' | 'ponctuel' // FR input values
  timing: 'matin' | 'soir' | 'matin_et_soir'          // FR input values
  catalogId: string
  application: string
  startDate: string
}

interface AdvancedRoutineProps {
  routine: {
    immediate: any[]
    adaptation: any[]
    maintenance: any[]
  }
}

const timeIcons = {
  morning: <Sun className="w-4 h-4" />,
  evening: <Moon className="w-4 h-4" />,
  both: <Clock className="w-4 h-4" />
}

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly', 
  monthly: 'Monthly',
  'as-needed': 'As needed',
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

export default function AdvancedRoutineDisplay({ routine }: AdvancedRoutineProps) {
  const [activePhase, setActivePhase] = useState<'immediate' | 'adaptation' | 'maintenance'>('immediate')
  const [viewMode, setViewMode] = useState<'phases' | 'schedule'>('phases')

  // Helper to detect the new structure
  const isNewStructure = (step: any): step is NewRoutineStep => {
    return 'catalogId' in step && 'timing' in step
  }

  // Helper: map catalogId to display product name
  const getProductNameFromCatalogId = (catalogId: string): string => {
    // Keep consistent with the results page; use English names
    if (catalogId === 'B01MSSDEPK') {
      return 'CeraVe Hydrating Cleanser'
    }
    if (catalogId === 'B00BNUY3HE') {
      return 'La Roche-Posay Cicaplast Balm B5'
    }
    if (catalogId === 'B01MDTVZTZ') {
      return 'The Ordinary Niacinamide 10% + Zinc 1%'
    }
    if (catalogId === 'B00949CTQQ') {
      return "Paula's Choice SKIN PERFECTING 2% BHA"
    }
    if (catalogId === 'B004W55086') {
      return 'La Roche-Posay Anthelios Fluid SPF 50'
    }

    if (catalogId.includes('CERAVE') || catalogId.includes('HYDRATING') || catalogId.includes('CLEANSER')) {
      return 'CeraVe Hydrating Cleanser Gel'
    }
    if (catalogId.includes('AVENE') || catalogId.includes('CICALFATE')) {
      return 'Avène Cicalfate+ Restorative Cream'
    }
    if (catalogId.includes('ORDINARY') || catalogId.includes('NIACINAMIDE')) {
      return 'The Ordinary Niacinamide 10% Serum'
    }
    if (catalogId.includes('LRP') || catalogId.includes('ANTHELIOS') || catalogId.includes('SPF')) {
      return 'La Roche-Posay Anthelios SPF 50+'
    }
    if (catalogId.includes('PAULA') || catalogId.includes('CHOICE') || catalogId.includes('BHA')) {
      return "Paula's Choice 2% BHA Exfoliant"
    }
    if (catalogId.includes('EFFACLAR')) {
      return 'La Roche-Posay Effaclar Purifying Gel'
    }
    
    // Generic fallback based on ID
    const parts = catalogId.split('_')
    if (parts.length >= 2) {
      const brand = parts[0].replace(/([A-Z])/g, ' $1').trim()
      const product = parts.slice(1, -1).join(' ').replace(/([A-Z])/g, ' $1').trim()
      return `${brand} ${product}`.replace(/\s+/g, ' ')
    }
    
    return 'Recommended Product'
  }

  // Normalize a step before filtering
  const normalizeStep = (step: RoutineStep | NewRoutineStep) => {
    if (isNewStructure(step)) {
      return {
        ...step,
        // value used in logic; FR -> EN mapping for UI only
        timeOfDay: step.timing === 'matin' ? 'morning' as const :
                  step.timing === 'soir' ? 'evening' as const : 'both' as const,
        frequency: step.frequency === 'quotidien' ? 'daily' as const : 
                  step.frequency === 'hebdomadaire' ? 'weekly' as const : 'as-needed' as const,
      }
    }
    return step
  }

  // Organize by schedule/time of day
  const organizeBySchedule = () => {
    const allSteps = [
      ...routine.immediate,
      ...routine.adaptation,
      ...routine.maintenance
    ].map(normalizeStep)

    return {
      morning: allSteps.filter(step => step.timeOfDay === 'morning' || step.timeOfDay === 'both'),
      evening: allSteps.filter(step => step.timeOfDay === 'evening' || step.timeOfDay === 'both'),
      weekly: allSteps.filter(step => step.frequency === 'weekly'),
      asNeeded: allSteps.filter(step => step.frequency === 'as-needed')
    }
  }

  const scheduleData = organizeBySchedule()

  const renderStep = (step: any, index: number) => {
    // Normalize structure for display
    const normalizedStep = isNewStructure(step) ? {
      title: step.name,
      description: '',
      frequency: step.frequency === 'quotidien' ? 'daily' as const : 
                 step.frequency === 'hebdomadaire' ? 'weekly' as const : 'as-needed' as const,
      timeOfDay: step.timing === 'matin' ? 'morning' as const :
                step.timing === 'soir' ? 'evening' as const : 'both' as const,
      phase: 'immediate' as const,
      category: 'treatment' as const,
      productSuggestion: `Product ${step.catalogId}`,
      catalogId: step.catalogId,
      applicationTips: [step.application],
      startDate: step.startDate,
      frequencyDetails: undefined,
      startAfterDays: undefined
    } : step

    return (
    <motion.div
      key={`${normalizedStep.title}-${index}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
            {categoryIcons[normalizedStep.category as keyof typeof categoryIcons] || '🎯'}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900">{normalizedStep.title}</h4>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {timeIcons[normalizedStep.timeOfDay as keyof typeof timeIcons]}
              <span>{frequencyLabels[normalizedStep.frequency as keyof typeof frequencyLabels]}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{normalizedStep.description}</p>
          
          {normalizedStep.frequencyDetails && (
            <div className="flex items-center space-x-1 text-xs text-blue-600 mb-2">
              <Repeat className="w-3 h-3" />
              <span>{normalizedStep.frequencyDetails}</span>
            </div>
          )}
          
          {normalizedStep.startAfterDays && (
            <div className="flex items-center space-x-1 text-xs text-orange-600 mb-2">
              <Calendar className="w-3 h-3" />
              <span>Introduce after {normalizedStep.startAfterDays} days</span>
            </div>
          )}
          
          {/* New structure with catalogId */}
          {isNewStructure(step) && (
            <div className="bg-dermai-ai-50 rounded-lg p-2 mb-2 border border-dermai-ai-200">
              <div className="flex items-center space-x-1 text-xs text-dermai-ai-700 mb-1">
                <span className="w-2 h-2 bg-dermai-ai-500 rounded-full"></span>
                <span className="font-medium">{getProductNameFromCatalogId(step.catalogId)}</span>
              </div>
              <a
                href={typeof (step as any).affiliateLink === 'string' ? (step as any).affiliateLink : '#'}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-dermai-ai-800 font-medium hover:underline"
              >
                {getProductNameFromCatalogId(step.catalogId)}
              </a>
              <p className="text-xs text-gray-600 mt-1">
                Start: {(step.startDate || '')
                  .replace(/_/g,' ')
                  .replace(/apres|après/ig,'after')}
              </p>
            </div>
          )}
          
          {/* Legacy structure with productSuggestion */}
          {!isNewStructure(step) && normalizedStep.productSuggestion && (
            <div className="bg-gray-50 rounded-lg p-2 mb-2">
              <div className="flex items-center space-x-1 text-xs text-gray-700 mb-1">
                <Target className="w-3 h-3" />
                <span className="font-medium">Recommended product</span>
              </div>
              <p className="text-xs text-gray-600">{normalizedStep.productSuggestion}</p>
            </div>
          )}
          
          {normalizedStep.applicationTips.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-xs text-green-700">
                <Lightbulb className="w-3 h-3" />
                <span className="font-medium">Application tips</span>
              </div>
              {normalizedStep.applicationTips?.map((tip: string, tipIndex: number) => (
                  <div key={tipIndex} className="flex items-start space-x-2 text-xs text-gray-600">
                    <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
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
              viewMode === 'phases' 
                ? 'bg-white text-dermai-ai-400 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Phases
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-4 py-2 text-sm rounded-md transition-all font-medium ${
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
          {/* Phase navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.keys(routine).map((phase) => (
              <button
                key={phase}
                onClick={() => setActivePhase(phase as any)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                  activePhase === phase
                    ? 'bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="whitespace-nowrap">
                  {phaseLabels[phase as keyof typeof phaseLabels]}
                </span>
                <span className="ml-1 text-xs opacity-70">
                  ({routine[phase as keyof typeof routine].length})
                </span>
              </button>
            ))}
          </div>

          {/* Active phase content */}
          <div className={`bg-gradient-to-br ${phaseColors[activePhase]} rounded-2xl p-6 border`}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                {activePhase === 'immediate' && <CheckCircle className="w-4 h-4" />}
                {activePhase === 'adaptation' && <AlertCircle className="w-4 h-4" />}
                {activePhase === 'maintenance' && <Target className="w-4 h-4" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {phaseLabels[activePhase]}
              </h3>
            </div>

            <div className="space-y-3">
              {routine[activePhase].map((step, index) => renderStep(step, index))}
            </div>

            {activePhase === 'immediate' && (
              <div className="mt-4 p-3 bg-white/30 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">Start right away</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Morning routine */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Sun className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Morning Routine</h3>
            </div>
            <div className="space-y-3">
              {scheduleData.morning.map((step, index) => renderStep(step, index))}
            </div>
          </div>

          {/* Evening routine */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Moon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Evening Routine</h3>
            </div>
            <div className="space-y-3">
              {scheduleData.evening.map((step, index) => renderStep(step, index))}
            </div>
          </div>

          {/* Weekly routine */}
          {scheduleData.weekly.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Weekly Routine</h3>
              </div>
              <div className="space-y-3">
                {scheduleData.weekly.map((step, index) => renderStep(step, index))}
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
                {scheduleData.asNeeded.map((step, index) => renderStep(step, index))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
