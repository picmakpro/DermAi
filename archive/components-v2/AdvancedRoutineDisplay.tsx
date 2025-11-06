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
  adaptation: 'Phase d’adaptation',
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

  // Helper pour obtenir le nom du produit depuis le catalogId
  const getProductNameFromCatalogId = (catalogId: string): string => {
    // Mapping cohérent avec la page de résultats
    if (catalogId === 'B01MSSDEPK') {
      return 'CeraVe Nettoyant Hydratant'
    }
    if (catalogId === 'B00BNUY3HE') {
      return 'La Roche-Posay Cicaplast Baume B5'
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
      return 'CeraVe Gel Nettoyant Hydratant'
    }
    if (catalogId.includes('AVENE') || catalogId.includes('CICALFATE')) {
      return 'Avène Cicalfate+ Crème Réparatrice'
    }
    if (catalogId.includes('ORDINARY') || catalogId.includes('NIACINAMIDE')) {
      return 'The Ordinary Sérum Niacinamide 10%'
    }
    if (catalogId.includes('LRP') || catalogId.includes('ANTHELIOS') || catalogId.includes('SPF')) {
      return 'La Roche-Posay Anthelios SPF 50+'
    }
    if (catalogId.includes('PAULA') || catalogId.includes('CHOICE') || catalogId.includes('BHA')) {
      return 'Paula\'s Choice BHA 2% Exfoliant'
    }
    if (catalogId.includes('EFFACLAR')) {
      return 'La Roche-Posay Effaclar Gel Nettoyant'
    }
    
    // Fallback générique basé sur l'ID
    const parts = catalogId.split('_')
    if (parts.length >= 2) {
      const brand = parts[0].replace(/([A-Z])/g, ' $1').trim()
      const product = parts.slice(1, -1).join(' ').replace(/([A-Z])/g, ' $1').trim()
      return `${brand} ${product}`.replace(/\s+/g, ' ')
    }
    
    return 'Produit Recommandé'
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

  const renderStep = (step: any, index: number) => {
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
              <span>À introduire dans {normalizedStep.startAfterDays} jours</span>
            </div>
          )}
          
          {/* Nouvelle structure avec catalogId */}
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
              <p className="text-xs text-gray-600 mt-1">Commencer: {(step.startDate || '').replace(/_/g,' ').replace('apres','après')}</p>
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
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Routines Personnalisées</h2>
            <p className="text-sm text-dermai-neutral-600">Propulsé par DermAI</p>
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
            Par phases
          </button>
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-4 py-2 text-sm rounded-md transition-all font-medium ${
              viewMode === 'schedule' 
                ? 'bg-white text-dermai-ai-400 shadow-sm' 
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
