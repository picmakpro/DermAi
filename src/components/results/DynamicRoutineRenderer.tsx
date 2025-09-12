'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Sparkles, 
  Clock, 
  Sun, 
  Moon,
  Info,
  Target,
  Heart
} from 'lucide-react'
import type { UnifiedRoutineStep } from '@/types'

/**
 * 🔥 COMPOSANT RENDU DYNAMIQUE - SPRINT 3 OPTIMISATION
 * Rendu adaptatif pour contenu IA personnalisé variable
 */

interface DynamicRoutineRendererProps {
  steps: UnifiedRoutineStep[]
  personalizedContent?: {
    phaseDescriptions?: Record<string, string>
    globalAdvice?: string[]
    personalizationSummary?: string
  }
  isAIGenerated?: boolean
}

const timeIcons = {
  morning: <Sun className="w-4 h-4" />,
  evening: <Moon className="w-4 h-4" />,
  both: <Clock className="w-4 h-4" />
}

export function DynamicRoutineRenderer({ 
  steps, 
  personalizedContent, 
  isAIGenerated = false 
}: DynamicRoutineRendererProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set())
  
  // Détection du contenu dynamique IA
  const isDynamicContent = isAIGenerated && steps.some(step => 
    step.title.length > 50 || 
    step.description.includes('votre') || 
    step.description.includes('selon') ||
    /[éàùç🧴💧✨🌟]/.test(step.description)
  )

  // Helper pour tronquer intelligemment
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    
    const truncated = text.substring(0, maxLength)
    const lastSentence = truncated.lastIndexOf('.')
    const lastSpace = truncated.lastIndexOf(' ')
    
    const cutPoint = lastSentence > maxLength * 0.7 ? lastSentence + 1 : lastSpace
    return text.substring(0, cutPoint) + '...'
  }

  // Détecter si une étape nécessite un rendu spécial
  const needsSpecialRendering = (step: UnifiedRoutineStep) => {
    return step.title.length > 80 || 
           step.description.length > 200 ||
           /[🧴💧✨🌟💆‍♀️🌸]/.test(step.description)
  }

  // Toggle expansion d'une étape
  const toggleExpansion = (stepIndex: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepIndex)) {
      newExpanded.delete(stepIndex)
    } else {
      newExpanded.add(stepIndex)
    }
    setExpandedSteps(newExpanded)
  }

  // Rendu d'une étape avec adaptation dynamique
  const renderStep = (step: UnifiedRoutineStep, index: number) => {
    const isExpanded = expandedSteps.has(index)
    const needsExpansion = needsSpecialRendering(step)
    const isLongDescription = step.description.length > 200

    return (
      <motion.div
        key={`${step.stepNumber}-${index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`
          relative rounded-xl border-2 p-6 transition-all duration-300
          ${isDynamicContent 
            ? 'bg-gradient-to-br from-white to-violet-50/30 border-violet-200 hover:border-violet-300' 
            : 'bg-white border-gray-200 hover:border-gray-300'
          }
          ${needsExpansion ? 'shadow-lg hover:shadow-xl' : 'shadow-md hover:shadow-lg'}
        `}
        data-testid="routine-step"
      >
        {/* Badge IA si contenu dynamique */}
        {isDynamicContent && (
          <div className="absolute -top-2 -right-2">
            <div className="bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>IA</span>
            </div>
          </div>
        )}

        {/* En-tête de l'étape */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${isDynamicContent 
                ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white' 
                : 'bg-blue-100 text-blue-600'
              }
            `}>
              {step.stepNumber}
            </div>
            <div className="flex items-center gap-2">
              {timeIcons[step.timing as keyof typeof timeIcons]}
              <span className="text-sm text-gray-500 capitalize">
                {step.timing === 'both' ? 'Matin & Soir' : step.timing === 'morning' ? 'Matin' : 'Soir'}
              </span>
            </div>
          </div>
          
          {/* Bouton d'expansion si nécessaire */}
          {needsExpansion && (
            <button
              onClick={() => toggleExpansion(index)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={isExpanded ? 'Réduire' : 'Développer'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Titre adaptatif */}
        <h3 
          className={`font-semibold mb-3 leading-tight ${
            step.title.length > 80 ? 'text-lg' : 'text-xl'
          }`}
          data-testid="step-title"
        >
          {step.title.length > 100 && !isExpanded 
            ? truncateText(step.title, 100)
            : step.title
          }
        </h3>

        {/* Description adaptative */}
        <div className="space-y-3">
          <p 
            className="text-gray-700 leading-relaxed"
            data-testid="step-description"
          >
            {isLongDescription && !isExpanded
              ? truncateText(step.description, 200)
              : step.description
            }
          </p>

          {/* Contenu étendu si développé */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-3 border-t border-gray-100"
              >
                {/* Fréquence détaillée */}
                {step.frequency && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{step.frequency}</span>
                  </div>
                )}

                {/* Conseils d'application si disponibles */}
                {step.applicationAdvice && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 text-sm mb-1">
                          Conseil d'application
                        </h4>
                        <p className="text-blue-700 text-sm">
                          {step.applicationAdvice}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Zones ciblées si spécifiées */}
                {step.targetZones && step.targetZones.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="w-4 h-4" />
                    <span>Zones : {step.targetZones.join(', ')}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phase et durée */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${step.phase === 'immediate' ? 'bg-green-100 text-green-700' :
                step.phase === 'adaptation' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'}
            `}>
              {step.phase === 'immediate' ? 'Immédiate' :
               step.phase === 'adaptation' ? 'Adaptation' : 'Maintenance'}
            </div>
          </div>
          
          {step.duration && (
            <div className="text-sm text-gray-500">
              {step.duration}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résumé de personnalisation si disponible */}
      {isDynamicContent && personalizedContent?.personalizationSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-violet-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-violet-900 mb-2">
                Routine Personnalisée par IA
              </h3>
              <p className="text-violet-700 text-sm leading-relaxed">
                {personalizedContent.personalizationSummary}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Conseils globaux si disponibles */}
      {personalizedContent?.globalAdvice && personalizedContent.globalAdvice.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-3">
                Conseils Personnalisés
              </h3>
              <ul className="space-y-2">
                {personalizedContent.globalAdvice.map((advice, index) => (
                  <li key={index} className="text-amber-700 text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{advice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Étapes de routine */}
      <div className="grid gap-6">
        {steps.map((step, index) => renderStep(step, index))}
      </div>

      {/* Indicateur de contenu IA */}
      {isDynamicContent && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-blue-100 rounded-full text-sm text-violet-700">
            <Sparkles className="w-4 h-4" />
            <span>Routine générée par intelligence artificielle</span>
          </div>
        </div>
      )}
    </div>
  )
}
