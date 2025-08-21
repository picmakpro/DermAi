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

// Ancienne interface pour compatibilité
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

// Nouvelle interface avec catalogId
interface NewRoutineStep {
  name: string
  frequency: 'quotidien' | 'hebdomadaire' | 'ponctuel'
  timing: 'matin' | 'soir' | 'matin_et_soir'
  catalogId: string
  application: string
  startDate: string
}

interface AdvancedRoutineProps {
  routine: {
    immediate: RoutineStep[] | NewRoutineStep[]
    adaptation: RoutineStep[] | NewRoutineStep[]
    maintenance: RoutineStep[] | NewRoutineStep[]
  }
}

const timeIcons = {
  morning: <Sun className="w-4 h-4" />,
  evening: <Moon className="w-4 h-4" />,
  both: <Clock className="w-4 h-4" />
}

const frequencyLabels = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire', 
  monthly: 'Mensuel',
  'as-needed': 'Au besoin',
  progressive: 'Progressif'
}

const phaseColors = {
  immediate: 'from-green-50 to-green-100 border-green-200',
  adaptation: 'from-blue-50 to-blue-100 border-blue-200', 
  maintenance: 'from-purple-50 to-purple-100 border-purple-200'
}

const phaseLabels = {
  immediate: 'Phase Immédiate',
  adaptation: 'Phase d&apos;Adaptation',
  maintenance: 'Phase de Maintenance'
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

  // Helper pour déterminer si c'est la nouvelle structure
  const isNewStructure = (step: any): step is NewRoutineStep => {
    return 'catalogId' in step && 'timing' in step
  }

  // Helper pour normaliser une étape avant filtrage
  const normalizeStep = (step: RoutineStep | NewRoutineStep) => {
    if (isNewStructure(step)) {
      return {
        ...step,
        timeOfDay: step.timing === 'matin' ? 'morning' as const :
                  step.timing === 'soir' ? 'evening' as const : 'both' as const,
        frequency: step.frequency === 'quotidien' ? 'daily' as const : 
                  step.frequency === 'hebdomadaire' ? 'weekly' as const : 'as-needed' as const,
      }
    }
    return step
  }

  // Organiser par moment de la journée
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

  const renderStep = (step: RoutineStep | NewRoutineStep, index: number) => {
    // Normaliser la structure pour l'affichage
    const normalizedStep = isNewStructure(step) ? {
      title: step.name,
      description: '',
      frequency: step.frequency === 'quotidien' ? 'daily' as const : 
                 step.frequency === 'hebdomadaire' ? 'weekly' as const : 'as-needed' as const,
      timeOfDay: step.timing === 'matin' ? 'morning' as const :
                step.timing === 'soir' ? 'evening' as const : 'both' as const,
      phase: 'immediate' as const,
      category: 'treatment' as const,
      productSuggestion: `Produit ${step.catalogId}`,
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
            {categoryIcons[normalizedStep.category]}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900">{normalizedStep.title}</h4>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              {timeIcons[normalizedStep.timeOfDay]}
              <span>{frequencyLabels[normalizedStep.frequency]}</span>
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
              <span>À introduire dans {normalizedStep.startAfterDays} jours</span>
            </div>
          )}
          
          {/* Nouvelle structure avec catalogId */}
          {isNewStructure(step) && (
            <div className="bg-blue-50 rounded-lg p-2 mb-2 border border-blue-200">
              <div className="flex items-center space-x-1 text-xs text-blue-700 mb-1">
                <Target className="w-3 h-3" />
                <span className="font-medium">Produit catalogue</span>
              </div>
              <p className="text-xs text-blue-600 font-mono">{step.catalogId}</p>
              <p className="text-xs text-gray-600 mt-1">Commencer: {step.startDate}</p>
            </div>
          )}
          
          {/* Ancienne structure avec productSuggestion */}
          {!isNewStructure(step) && normalizedStep.productSuggestion && (
            <div className="bg-gray-50 rounded-lg p-2 mb-2">
              <div className="flex items-center space-x-1 text-xs text-gray-700 mb-1">
                <Target className="w-3 h-3" />
                <span className="font-medium">Produit recommandé</span>
              </div>
              <p className="text-xs text-gray-600">{normalizedStep.productSuggestion}</p>
            </div>
          )}
          
          {normalizedStep.applicationTips.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center space-x-1 text-xs text-green-700">
                <Lightbulb className="w-3 h-3" />
                <span className="font-medium">Conseils d&apos;application</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-0.5">
                {normalizedStep.applicationTips.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-start space-x-1">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{tip}</span>
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
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-900">Routine Dermatologique Personnalisée</h2>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('phases')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              viewMode === 'phases' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Par phases
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              viewMode === 'schedule' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Par horaires
          </button>
        </div>
      </div>

      {viewMode === 'phases' ? (
        <>
          {/* Navigation des phases */}
          <div className="flex space-x-2 mb-6">
            {Object.keys(routine).map((phase) => (
              <button
                key={phase}
                onClick={() => setActivePhase(phase as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activePhase === phase
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {phaseLabels[phase as keyof typeof phaseLabels]}
                <span className="ml-1 text-xs opacity-70">
                  ({routine[phase as keyof typeof routine].length})
                </span>
              </button>
            ))}
          </div>

          {/* Contenu de la phase active */}
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
                  <span className="font-medium">À commencer dès maintenant</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Routine Matin */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Sun className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Routine Matin</h3>
            </div>
            <div className="space-y-3">
              {scheduleData.morning.map((step, index) => renderStep(step, index))}
            </div>
          </div>

          {/* Routine Soir */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Moon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Routine Soir</h3>
            </div>
            <div className="space-y-3">
              {scheduleData.evening.map((step, index) => renderStep(step, index))}
            </div>
          </div>

          {/* Routine Hebdomadaire */}
          {scheduleData.weekly.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Routine Hebdomadaire</h3>
              </div>
              <div className="space-y-3">
                {scheduleData.weekly.map((step, index) => renderStep(step, index))}
              </div>
            </div>
          )}

          {/* Au besoin */}
          {scheduleData.asNeeded.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Au Besoin</h3>
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
