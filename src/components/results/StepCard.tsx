'use client'

import React, { useState, memo } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Clock, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Repeat,
  Target,
  ShoppingBag,
  MapPin,
  TrendingUp
} from 'lucide-react'
import clsx from 'clsx'
import type { UnifiedRoutineStep } from '@/types'
import { 
  validateAndCleanTitle,
  formatApplicationDuration,
  renderZoneBadge,
  isTemporaryTreatment
} from '@/utils/RoutineDisplayHelpers'
import { WeeklyScheduleDisplay } from './WeeklyScheduleDisplay'
import { EducationalTooltip } from '@/components/shared/EducationalTooltip'

interface StepCardProps {
  step: UnifiedRoutineStep
  index: number
  phase: 'immediate' | 'adaptation' | 'maintenance'
  isWeekly?: boolean
}

const categoryIcons = {
  cleansing: '🧼',
  treatment: '💧',
  hydration: '💦',
  protection: '🛡️',
  exfoliation: '✨'
}

const categoryColors = {
  cleansing: 'bg-blue-50 border-blue-200',
  treatment: 'bg-purple-50 border-purple-200',
  hydration: 'bg-cyan-50 border-cyan-200',
  protection: 'bg-yellow-50 border-yellow-200',
  exfoliation: 'bg-pink-50 border-pink-200'
}


/**
 * SPRINT 3 - REFONTE ROUTINES V2
 * SPRINT 4 - OPTIMISATION PERFORMANCE
 * Composant StepCard pour afficher une étape de routine
 * avec support complet des métadonnées V2 et déduplication
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 */
export const StepCard = memo(function StepCard({
  step,
  index,
  phase,
  isWeekly = false
}: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Déterminer si c'est un traitement temporaire
  const isTemporary = isTemporaryTreatment(step) || (step as any).isTemporary

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  }

  // Priorité aux displayTitle de l'IA, sinon titre nettoyé
  const enrichedStep = step as any
  const cleanTitle = enrichedStep.displayTitle || 
    validateAndCleanTitle(step.title, step.category)

  // Formatage de la durée d'application
  const formattedDuration = formatApplicationDuration(step)

  return (
    <motion.div
      variants={itemVariants}
      className={clsx(
        'rounded-lg border-2 overflow-hidden transition-all duration-200',
        categoryColors[step.category] || 'bg-gray-50 border-gray-200',
        isExpanded && 'shadow-md'
      )}
    >
      {/* En-tête de la carte */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Numéro et titre */}
          <div className="flex items-start space-x-3 flex-1">
            <span className={clsx(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              'bg-white border-2',
              isTemporary ? 'border-orange-300 text-orange-700' : 'border-gray-300 text-gray-700'
            )}>
              {index + 1}
            </span>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <span className="text-lg">{categoryIcons[step.category]}</span>
                <span>{cleanTitle}</span>
                {step.isEvolutive && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Fusionné
                  </span>
                )}
              </h4>
              
              {/* Métadonnées principales */}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                {/* Zones ciblées */}
                {(() => {
                  const zoneBadge = renderZoneBadge(step)
                  if (!zoneBadge) return null
                  
                  const IconComponent = zoneBadge.icon
                  return (
                    <span className={zoneBadge.className}>
                      <IconComponent className="w-3 h-3" />
                      <span>{zoneBadge.text}</span>
                    </span>
                  )
                })()}
                
                {/* Durée d'application */}
                {isTemporary && formattedDuration !== 'En continu' && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                    <Clock className="w-3 h-3" />
                    <span>{formattedDuration}</span>
                  </span>
                )}
                
                {/* Introduction progressive */}
                {step.startAfterDays && step.startAfterDays > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    <Calendar className="w-3 h-3" />
                    <span>À partir du jour {step.startAfterDays + 1}</span>
                  </span>
                )}
                
                {/* Fréquence */}
                {step.frequency !== 'daily' && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                    <Repeat className="w-3 h-3" />
                    <span>{mapFrequencyToFrench(step.frequency)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Bouton d'expansion */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-3 p-2 hover:bg-white/50 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Réduire' : 'Voir plus'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Métadonnées temporaires étendues (toujours visibles pour les traitements) */}
        {isTemporary && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="text-amber-800 font-medium">Traitement temporaire</p>
                {(step as any).introduceFromWeek > 0 && (
                  <p className="text-amber-700">
                    À introduire à partir de la semaine {(step as any).introduceFromWeek + 1}
                  </p>
                )}
                <p className="text-amber-700">
                  Durée : {formattedDuration}
                </p>
                {(step as any).frequency && (
                  <p className="text-amber-700">
                    Fréquence : {mapFrequencyToFrench((step as any).frequency)}
                  </p>
                )}
                {(step as any).targetBenefit && (
                  <p className="text-amber-700 italic">
                    Objectif : {(step as any).targetBenefit}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Planning hebdomadaire */}
        {isWeekly && <WeeklyScheduleDisplay step={step} />}
      </div>

      {/* Contenu étendu */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-gray-200"
        >
          <div className="p-4 space-y-4 bg-white/50">
            {/* Produit recommandé */}
            {step.recommendedProducts && step.recommendedProducts.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Produit recommandé</span>
                </h5>
                <ProductRecommendationCard product={step.recommendedProducts[0]} />
              </div>
            )}

            {/* Conseils d'application */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>Conseils d'application</span>
              </h5>
              <p className="text-sm text-gray-600">
                {step.applicationAdvice}
              </p>
            </div>

            {/* Restrictions */}
            {step.restrictions && step.restrictions.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Précautions</span>
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {step.restrictions.map((restriction, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{restriction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Détails de progression (si applicable) */}
            {step.frequencyDetails && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Progression</span>
                </h5>
                <p className="text-sm text-gray-600">
                  {step.frequencyDetails}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
})

// Fonction utilitaire pour mapper la fréquence en français
function mapFrequencyToFrench(frequency: string): string {
  const mappings: Record<string, string> = {
    'daily': 'Quotidien',
    '2x/week': '2 fois par semaine',
    'weekly': 'Hebdomadaire',
    '1x/week': '1 fois par semaine',
    'progressive': 'Introduction progressive',
    'as-needed': 'Au besoin',
    'monthly': 'Mensuel'
  }
  
  // Gérer les fréquences composées comme "2x/week puis daily"
  if (frequency.includes('puis')) {
    const parts = frequency.split(' puis ')
    return parts.map(part => mappings[part.trim()] || part).join(' puis ')
  }
  
  return mappings[frequency] || frequency
}

// Composant pour la recommandation de produit (simplifié)
function ProductRecommendationCard({ product }: { product: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-start justify-between">
        <div>
          <h6 className="font-medium text-gray-900">
            {product.name}
          </h6>
          <p className="text-sm text-gray-600">
            {product.brand}
          </p>
          {product.price && (
            <p className="text-sm font-medium text-purple-600 mt-1">
              {product.price}€
            </p>
          )}
        </div>
        {product.catalogId && (
          <span 
            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded"
            title="Produit sélectionné par notre IA pour votre type de peau"
          >
            IA
          </span>
        )}
      </div>
      {product.justification && (
        <p className="mt-2 text-sm text-gray-600 italic">
          {product.justification}
        </p>
      )}
    </div>
  )
}
