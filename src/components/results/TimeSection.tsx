'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { UnifiedRoutineStep } from '@/types'
import { StepCard } from './StepCard'

interface TimeSectionProps {
  title: string
  icon: React.ReactNode
  steps: UnifiedRoutineStep[]
  phase: 'immediate' | 'adaptation' | 'maintenance'
  timeOfDay?: 'morning' | 'evening'
  isWeekly?: boolean
}

const phaseGradients = {
  immediate: 'from-emerald-50 to-emerald-100',
  adaptation: 'from-blue-50 to-blue-100',
  maintenance: 'from-purple-50 to-purple-100'
}

/**
 * SPRINT 3 - REFONTE ROUTINES V2
 * SPRINT 4 - OPTIMISATION PERFORMANCE
 * Composant TimeSection pour afficher les étapes d'un moment de la journée
 * avec support des métadonnées enrichies et déduplication
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 */
export const TimeSection = memo(function TimeSection({
  title,
  icon,
  steps,
  phase,
  timeOfDay,
  isWeekly = false
}: TimeSectionProps) {
  if (steps.length === 0) return null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* En-tête de section */}
      <div className={clsx(
        'px-6 py-4 bg-gradient-to-r',
        phaseGradients[phase],
        'border-b border-gray-100'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/80 rounded-lg shadow-sm">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <p className="text-sm text-gray-600">
                {steps.length} {steps.length > 1 ? 'étapes' : 'étape'}
                {isWeekly && ' - À planifier dans la semaine'}
              </p>
            </div>
          </div>

          {/* Badge pour étapes fusionnées */}
          {steps.some(s => s.isEvolutive) && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Optimisé
            </span>
          )}
        </div>
      </div>

      {/* Liste des étapes */}
      <motion.div
        className="p-6 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step, index) => (
          <StepCard
            key={`${step.stepNumber}-${index}`}
            step={step}
            index={index}
            phase={phase}
            isWeekly={isWeekly}
          />
        ))}
      </motion.div>

      {/* Footer avec conseils de timing (si applicable) */}
      {timeOfDay && steps.length > 3 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-600 italic">
            💡 Conseil : Prévoyez {timeOfDay === 'morning' ? '5-10' : '10-15'} minutes 
            pour votre routine du {timeOfDay === 'morning' ? 'matin' : 'soir'}
          </p>
        </div>
      )}

      {/* Footer spécial pour soins hebdomadaires */}
      {isWeekly && (
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-sm text-amber-700 italic">
            ⚡ Astuce : Choisissez un jour fixe pour vos soins hebdomadaires
            (ex: dimanche soir) pour créer une habitude
          </p>
        </div>
      )}
    </div>
  )
})

// Fonction utilitaire pour calculer le temps total estimé
export function calculateEstimatedTime(steps: UnifiedRoutineStep[]): string {
  let totalMinutes = 0

  steps.forEach(step => {
    // Estimation basée sur le type de soin
    switch (step.category) {
      case 'cleansing':
        totalMinutes += 2
        break
      case 'treatment':
        totalMinutes += 3
        break
      case 'hydration':
        totalMinutes += 2
        break
      case 'protection':
        totalMinutes += 1
        break
      case 'exfoliation':
        totalMinutes += 5
        break
      default:
        totalMinutes += 2
    }
  })

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  } else {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? `${hours}h${minutes}` : `${hours}h`
  }
}
