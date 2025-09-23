/**
 * 📅 WEEKLY SCHEDULE DISPLAY - SPRINT 4
 * 
 * Composant d'affichage du planning hebdomadaire avec jours suggérés,
 * conseils d'espacement et avertissements contextuels.
 * 
 * @version 1.0 - Sprint 4 Amélioration Routines
 */

import React from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { WeeklyScheduleCalculator, type WeeklySchedule } from '@/utils/WeeklyScheduleCalculator'
import type { UnifiedRoutineStep } from '@/types'

interface WeeklyScheduleDisplayProps {
  step: UnifiedRoutineStep
  className?: string
}

export const WeeklyScheduleDisplay: React.FC<WeeklyScheduleDisplayProps> = ({ 
  step, 
  className = '' 
}) => {
  const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(step)
  
  // Ne pas afficher si ce n'est pas un produit hebdomadaire
  if (!isWeeklyProduct(step)) {
    return null
  }
  
  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 mb-2 ${className}`}>
      {/* Header avec fréquence */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-800">Planning hebdomadaire</span>
        </div>
        <span className="text-sm text-green-600 font-medium">
          {schedule.frequency}
        </span>
      </div>
      
      {/* Jours suggérés */}
      <div className="mb-2">
        <span className="text-sm font-medium text-green-700">Jours suggérés : </span>
        <div className="flex gap-1 mt-1 flex-wrap">
          {schedule.suggestedDays.map(day => (
            <DayBadge key={day} day={day} timeOfDay={schedule.timeOfDay} />
          ))}
        </div>
      </div>
      
      {/* Conseils d'espacement */}
      <div className="text-xs text-green-600 mb-2 flex items-start space-x-1">
        <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>{schedule.spacingAdvice}</span>
      </div>
      
      {/* Avertissements */}
      {schedule.warnings && schedule.warnings.length > 0 && (
        <div className="text-xs text-orange-600 flex items-start space-x-1">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{schedule.warnings.join(' • ')}</span>
        </div>
      )}
      
      {/* Indicateur de réussite */}
      <div className="mt-2 pt-2 border-t border-green-200">
        <div className="flex items-center space-x-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          <span>Suivre ce planning pour des résultats optimaux</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Badge pour afficher un jour avec indication du moment
 */
const DayBadge: React.FC<{ 
  day: string
  timeOfDay: 'morning' | 'evening' | 'both'
}> = ({ day, timeOfDay }) => {
  const getTimeIcon = () => {
    if (timeOfDay === 'morning') return '🌅'
    if (timeOfDay === 'evening') return '🌙'
    return '🌅🌙'
  }
  
  const getTimeText = () => {
    if (timeOfDay === 'morning') return 'matin'
    if (timeOfDay === 'evening') return 'soir'
    return 'matin/soir'
  }
  
  return (
    <div className="group relative">
      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium cursor-help">
        <span className="mr-1">{getTimeIcon()}</span>
        {day}
      </span>
      
      {/* Tooltip au survol */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {day} {getTimeText()}
      </div>
    </div>
  )
}

/**
 * Composant d'affichage compact pour les petits espaces
 */
export const WeeklyScheduleCompact: React.FC<WeeklyScheduleDisplayProps> = ({ 
  step, 
  className = '' 
}) => {
  const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(step)
  
  if (!isWeeklyProduct(step)) {
    return null
  }
  
  return (
    <div className={`inline-flex items-center space-x-2 text-xs text-green-600 ${className}`}>
      <Calendar className="w-3 h-3" />
      <span className="font-medium">{schedule.frequency}</span>
      <span className="text-green-500">•</span>
      <span>{schedule.suggestedDays.slice(0, 2).join(', ')}</span>
      {schedule.suggestedDays.length > 2 && (
        <span className="text-green-500">+{schedule.suggestedDays.length - 2}</span>
      )}
    </div>
  )
}

/**
 * Composant d'affichage détaillé avec conseils étendus
 */
export const WeeklyScheduleDetailed: React.FC<WeeklyScheduleDisplayProps & {
  showTips?: boolean
}> = ({ step, className = '', showTips = true }) => {
  const schedule = WeeklyScheduleCalculator.calculateWeeklySchedule(step)
  
  if (!isWeeklyProduct(step)) {
    return null
  }
  
  return (
    <div className={`bg-white border border-green-200 rounded-lg p-4 ${className}`}>
      <WeeklyScheduleDisplay step={step} />
      
      {showTips && (
        <div className="mt-3 pt-3 border-t border-green-100">
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            💡 Conseils d'optimisation
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            <OptimizationTips step={step} schedule={schedule} />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Conseils d'optimisation contextuels
 */
const OptimizationTips: React.FC<{
  step: UnifiedRoutineStep
  schedule: WeeklySchedule
}> = ({ step, schedule }) => {
  const tips: string[] = []
  
  // Conseils par catégorie
  if (step.category === 'exfoliation') {
    tips.push('Toujours hydrater après l\'exfoliation')
    tips.push('Éviter l\'exposition solaire le lendemain')
  }
  
  if (step.category === 'treatment') {
    tips.push('Commencer par de petites zones pour tester la tolérance')
    tips.push('Augmenter progressivement la fréquence')
  }
  
  if (step.category === 'mask') {
    tips.push('Nettoyer le visage avant application')
    tips.push('Respecter le temps de pose indiqué')
  }
  
  // Conseils par fréquence
  if (schedule.frequency.includes('2x')) {
    tips.push('Espacer les applications pour éviter l\'irritation')
  }
  
  // Conseils par timing
  if (schedule.timeOfDay === 'evening') {
    tips.push('Appliquer le soir pour une meilleure absorption')
  }
  
  return (
    <>
      {tips.map((tip, index) => (
        <div key={index} className="flex items-start space-x-1">
          <span className="text-green-500 mt-0.5">•</span>
          <span>{tip}</span>
        </div>
      ))}
    </>
  )
}

/**
 * Détermine si un produit nécessite un planning hebdomadaire
 */
function isWeeklyProduct(step: UnifiedRoutineStep): boolean {
  // Produits avec fréquence explicitement hebdomadaire
  if (step.frequency === 'weekly') return true
  
  // Catégories typiquement hebdomadaires
  const weeklyCategories = ['exfoliation', 'mask']
  if (weeklyCategories.includes(step.category)) return true
  
  // Traitements avec fréquence limitée
  if (step.category === 'treatment' && step.frequency === 'progressive') return true
  
  // Produits avec application "x fois par semaine"
  if (step.applicationDuration?.includes('semaine')) return true
  
  return false
}

export default WeeklyScheduleDisplay

