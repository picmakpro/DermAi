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
  beautyAssessment?: BeautyAssessment // Nécessaire pour calcul durées personnalisées
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
  adaptation: 'Phase d\'adaptation',
  maintenance: 'Phase de Maintenance'
}

// Removed unused categoryIcons

export function UnifiedRoutineSection({ routine, beautyAssessment }: UnifiedRoutineSectionProps) {
  const [activePhase, setActivePhase] = useState<'immediate' | 'adaptation' | 'maintenance'>('immediate')
  const [viewMode, setViewMode] = useState<'phases' | 'schedule'>('phases')
  const [isMobile, setIsMobile] = useState(false)
  const [phaseTimings, setPhaseTimings] = useState<Record<string, PhaseTiming>>({})

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calcul des durées personnalisées
  useEffect(() => {
    if (beautyAssessment && routine.length > 0) {
      const timings = PhaseTimingCalculator.calculateCompleteTiming(beautyAssessment, routine)
      setPhaseTimings(timings)
    }
  }, [beautyAssessment, routine])

  if (!routine || routine.length === 0) {
    return null
  }

  // Organiser par phases
  const organizeByPhases = () => {
    return {
      immediate: routine.filter(step => step.phase === 'immediate'),
      adaptation: routine.filter(step => step.phase === 'adaptation'),
      maintenance: routine.filter(step => step.phase === 'maintenance')
    }
  }

  // Organiser par moment de la journée avec déduplication intelligente
  const organizeBySchedule = () => {
    const deduplicateByProduct = (steps: UnifiedRoutineStep[]) => {
      const productGroups = new Map<string, UnifiedRoutineStep[]>()
      
      // Regrouper par catégorie ET fonction, pas par produit exact
      steps.forEach(step => {
        let productKey = step.recommendedProducts[0]?.name || step.title
        
        // Regroupement intelligent pour produits similaires
        if (step.category === 'protection' || step.title.includes('Protection solaire')) {
          productKey = 'Protection solaire' // Unifier toutes les protections solaires
        } else if (step.category === 'cleansing' || step.title.includes('Nettoyage')) {
          productKey = 'Nettoyage doux' // Unifier tous les nettoyants
        } else if (step.category === 'hydration' || step.title.includes('Hydratation')) {
          productKey = 'Hydratation globale' // Unifier toutes les hydratations
        }
        
        if (!productGroups.has(productKey)) {
          productGroups.set(productKey, [])
        }
        productGroups.get(productKey)!.push(step)
      })
      
      // Créer des étapes fusionnées pour chaque produit unique
      const deduplicatedSteps: UnifiedRoutineStep[] = []
      
      productGroups.forEach((stepsGroup, productKey) => {
        if (stepsGroup.length === 1) {
          // Pas de duplication, garder l'étape tel quel
          deduplicatedSteps.push(stepsGroup[0])
        } else {
          // Fusionner les étapes multiples en une seule évolutive
          const baseStep = stepsGroup[0]
          const allPhases = stepsGroup.map(s => s.phase).filter((p, i, arr) => arr.indexOf(p) === i)
          const phaseNames = allPhases.map(p => phaseLabels[p as keyof typeof phaseLabels])
          
          // Créer un titre nettoyé sans mentions évolutives
          const cleanTitle = baseStep.title.replace(/(optimisée?|renforcée?|→\s*(évolutif|optimisé))/gi, '').trim()
          
          // Fusionner les conseils d'application
          const uniqueAdvices = stepsGroup
            .map(s => s.applicationAdvice)
            .filter((advice, i, arr) => arr.indexOf(advice) === i)
          
          const finalAdvice = uniqueAdvices.length > 1
            ? uniqueAdvices[0] // Prendre le premier conseil, le plus simple
            : uniqueAdvices[0]
          
          // Créer la durée : garder temporaire si c'est un traitement, sinon "En continu"
          const isBaseCareProduct = baseStep.category === 'cleansing' || baseStep.category === 'hydration' || baseStep.category === 'protection'
          const finalDuration = allPhases.length > 1 && isBaseCareProduct
            ? "En continu"
            : baseStep.applicationDuration
          
          const evolvedStep: UnifiedRoutineStep = {
            ...baseStep,
            title: productKey, // Utiliser la clé unifiée comme titre
            applicationAdvice: finalAdvice,
            applicationDuration: finalDuration,
            stepNumber: Math.min(...stepsGroup.map(s => s.stepNumber)),
            phase: 'immediate' as const, // Phase de base pour l'affichage
          }
          
          deduplicatedSteps.push(evolvedStep)
        }
      })
      
      return deduplicatedSteps.sort((a, b) => a.stepNumber - b.stepNumber)
    }
    
    // Filtrage intelligent : éviter les doublons entre sections
    const morningSteps = routine.filter(step => 
      (step.timeOfDay === 'morning' || step.timeOfDay === 'both') && 
      step.frequency === 'daily' // Seulement les étapes quotidiennes
    )
    const eveningSteps = routine.filter(step => 
      (step.timeOfDay === 'evening' || step.timeOfDay === 'both') && 
      step.frequency === 'daily' // Seulement les étapes quotidiennes
    )
    
    return {
      morning: deduplicateByProduct(morningSteps),
      evening: deduplicateByProduct(eveningSteps),
      weekly: routine.filter(step => step.frequency === 'weekly'),
      monthly: routine.filter(step => step.frequency === 'monthly'),
      asNeeded: routine.filter(step => step.frequency === 'as-needed')
    }
  }

  const phaseData = organizeByPhases()
  const scheduleData = organizeBySchedule()

  const renderStep = (step: UnifiedRoutineStep, index: number, resetNumbering: boolean = false) => {
    // Détection des étapes temporaires pour le badge uniquement
    const isTemporary = step.applicationDuration && !step.applicationDuration.includes('continu')
    
    // Style uniforme pour toutes les étapes
    const className = "bg-white rounded-xl p-3 md:p-4 border border-gray-100 hover:shadow-md transition-all"
    
    // Numérotation reset pour chaque section horaire
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
            {/* Titre sur une ligne, badges en dessous sur mobile */}
            <div className="mb-2">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-gray-900 text-sm md:text-base leading-tight pr-2">{step.title}</h4>
                {/* Badge timing - mieux adapté mobile */}
                <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                  {timeIcons[step.timeOfDay as keyof typeof timeIcons]}
                  <span className="hidden sm:inline">{frequencyLabels[step.frequency as keyof typeof frequencyLabels]}</span>
                  <span className="sm:hidden">
                    {step.frequency === 'daily' && 'Jour'}
                    {step.frequency === 'weekly' && 'Sem'}
                    {step.frequency === 'monthly' && 'Mois'}
                    {step.frequency === 'as-needed' && 'Besoin'}
                    {step.frequency === 'progressive' && 'Prog'}
                  </span>
                </div>
              </div>
              
              {/* Badge temporaire en dessous du titre sur mobile */}
              {isTemporary && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-xs font-medium w-fit">
                  <Clock className="w-3 h-3" />
                  <span>Temporaire</span>
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
                <span>À introduire dans {step.startAfterDays} jours minimum</span>
              </div>
            )}

            {/* Zones ciblées - version mobile optimisée */}
            {step.targetArea === 'specific' && step.zones && step.zones.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium w-fit mb-2">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Zones : </span>
                  {step.zones.join(', ')}
                </span>
              </div>
            )}
            
            {/* Produits recommandés - optimisé mobile */}
            <div className="bg-dermai-ai-50 rounded-lg p-2 md:p-3 mb-2 md:mb-3 border border-dermai-ai-200">
              <div className="flex items-center space-x-1 text-xs text-dermai-ai-700 mb-1 md:mb-2">
                <ShoppingBag className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">Produit recommandé</span>
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
                      <span>Voir le produit</span>
                      <span className="ml-1">→</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
            
            {/* Conseils d'application - optimisé mobile */}
            <div className="space-y-1 mb-2 md:mb-3">
              <div className="flex items-center space-x-1 text-xs text-green-700">
                <Lightbulb className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">Conseils d'application</span>
              </div>
              <div className="text-xs text-gray-600 leading-relaxed">
                {step.applicationAdvice}
              </div>
            </div>

            {/* Durée d'application simplifiée */}
            {(() => {
              const criteria = PhaseTimingCalculator.getVisualCriteria(step)
              if (criteria) {
                // Format simplifié pour les traitements avec critères visuels - mobile optimisé
                return (
                  <div className="space-y-1 mb-2 md:mb-3">
                    <div className="flex items-center space-x-1 text-xs text-blue-700">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">Durée d'application</span>
                    </div>
                    <div className="text-xs text-blue-600 leading-relaxed font-medium">
                      {criteria.observation} ({criteria.estimatedDays})
                    </div>
                  </div>
                )
              } else if (step.applicationDuration) {
                // Format classique - mobile optimisé
                return (
                  <div className="space-y-1 mb-2 md:mb-3">
                    <div className="flex items-center space-x-1 text-xs text-blue-700">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">Durée d'application</span>
                    </div>
                    <div className="text-xs text-blue-600 leading-relaxed font-medium">
                      {step.applicationDuration}
                    </div>
                  </div>
                )
              }
              return null
            })()}

            {/* Timing détaillé - mobile optimisé */}
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

            {/* Restrictions - mobile optimisé */}
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
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">Routines Personnalisées</h2>
            <p className="text-xs md:text-sm text-dermai-neutral-600">Propulsé par DermAI</p>
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
            Horaires
          </button>
        </div>
      </div>

      {viewMode === 'phases' ? (
        <>
          {/* Navigation des phases - mobile optimisé */}
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
                      {phase === 'immediate' && 'Immédiate'}
                      {phase === 'adaptation' && 'Adaptation'}
                      {phase === 'maintenance' && 'Maintenance'}
                    </span>
                  </span>
                  <span className="ml-1 text-xs opacity-70">
                    ({stepCount})
                  </span>
                </button>
              )
            })}
          </div>

          {/* Contenu de la phase active */}
          <div className={`bg-gradient-to-br ${phaseColors[activePhase]} rounded-2xl p-4 md:p-6 border`}>
            {/* Header avec objectif éducatif et info-bulle */}
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
              
              {/* Info-bulle éducative */}
              {phaseTimings[activePhase] && (
                <div className="flex-shrink-0">
                  <div className="mt-1">
                    {isMobile ? (
                      <MobileEducationalTooltip
                        content={phaseTimings[activePhase].objective.tooltip}
                        title="Pourquoi cette phase ?"
                      />
                    ) : (
                      <EducationalTooltip
                        content={phaseTimings[activePhase].objective.tooltip}
                        title="Pourquoi cette phase ?"
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

            {/* Conseils éducatifs spécifiques à la phase */}
            {phaseTimings[activePhase]?.educationalTips && (
              <div className="mt-4 p-3 bg-white/30 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Conseils pour cette phase</span>
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
                  <span className="font-medium">À commencer dès maintenant</span>
                </div>
              </div>
            )}

            {/* Navigation entre phases - responsive */}
            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-xs md:text-sm text-gray-700 text-center sm:text-left">
                  <span className="font-medium">Phase actuelle :</span>
                  <span className="ml-1">{phaseLabels[activePhase]}</span>
                  {phaseTimings[activePhase] && (
                    <span className="ml-1 text-gray-600">({phaseTimings[activePhase].duration})</span>
                  )}
                </div>
                
                <div className="flex items-center justify-center sm:justify-end space-x-2">
                  {/* Bouton phase précédente */}
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
                      <span className="hidden sm:inline">Précédente</span>
                    </button>
                  )}
                  
                  {/* Bouton phase suivante */}
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
                          {activePhase === 'immediate' && 'Phase d\'adaptation'}
                          {activePhase === 'adaptation' && 'Phase de maintenance'}
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
                  
                  {/* Message final pour la dernière phase */}
                  {activePhase === 'maintenance' && (
                    <div className="flex items-center space-x-1 px-2.5 md:px-3 py-1.5 md:py-2 bg-green-100 text-green-700 rounded-lg text-xs md:text-sm font-medium">
                      <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Routine complète</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-3 md:gap-6">
          {/* Routine Matin - mobile optimisé */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-orange-100">
            <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Sun className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Routine Matin</h3>
            </div>
            <div className="space-y-2 md:space-y-3">
              {scheduleData.morning.map((step, index) => renderStep(step, index, true))}
            </div>
          </div>

          {/* Routine Soir - mobile optimisé */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-indigo-100">
            <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Moon className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Routine Soir</h3>
            </div>
            <div className="space-y-2 md:space-y-3">
              {scheduleData.evening.map((step, index) => renderStep(step, index, true))}
            </div>
          </div>

          {/* Routine Hebdomadaire */}
          {scheduleData.weekly.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 md:p-6 border border-green-100 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Routine Hebdomadaire</h3>
              </div>
              <div className="space-y-3">
                {scheduleData.weekly.map((step, index) => renderStep(step, index, true))}
              </div>
            </div>
          )}

          {/* Routine Mensuelle */}
          {scheduleData.monthly.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 md:p-6 border border-amber-100 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Routine Mensuelle</h3>
              </div>
              <div className="space-y-3">
                {scheduleData.monthly.map((step, index) => renderStep(step, index, true))}
              </div>
            </div>
          )}

          {/* Au besoin */}
          {scheduleData.asNeeded.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-4 md:p-6 border border-gray-100 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Au Besoin</h3>
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
