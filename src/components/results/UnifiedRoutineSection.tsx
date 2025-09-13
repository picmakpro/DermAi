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
  Heart,
  Globe,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'
import { PhaseTimingCalculator, type PhaseTiming } from '@/services/educational/phaseTimingCalculator'
import { EducationalTooltip, MobileEducationalTooltip } from '@/components/shared/EducationalTooltip'
import { AIRoutineIndicator } from '@/components/shared/AIIndicator'
import { 
  isTemporaryTreatment, 
  isContinuousTreatment, 
  validateAndCleanTitle, 
  getDetailedTiming, 
  renderZoneBadge 
} from '@/utils/RoutineDisplayHelpers'
import { 
  ensureProductMapping, 
  applyFullCoherence 
} from '@/utils/ProductMappingHelpers'

interface UnifiedRoutineSectionProps {
  routine: UnifiedRoutineStep[]
  beautyAssessment?: BeautyAssessment // Nécessaire pour calcul durées personnalisées
  // 🔥 SPRINT 3: Support contenu IA dynamique
  isAIGenerated?: boolean // Indique si le contenu vient de l'IA
  personalizedContent?: {
    phaseDescriptions?: Record<string, string>
    globalAdvice?: string[]
    personalizationSummary?: string
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
  adaptation: 'Phase d\'adaptation',
  maintenance: 'Phase de Maintenance'
}

// Removed unused categoryIcons

export function UnifiedRoutineSection({ 
  routine, 
  beautyAssessment, 
  isAIGenerated = false,
  personalizedContent 
}: UnifiedRoutineSectionProps) {
  const [activePhase, setActivePhase] = useState<'immediate' | 'adaptation' | 'maintenance'>('immediate')
  const [viewMode, setViewMode] = useState<'phases' | 'schedule'>('phases')
  const [isMobile, setIsMobile] = useState(false)
  const [phaseTimings, setPhaseTimings] = useState<Record<string, PhaseTiming>>({})
  const [coherentRoutine, setCoherentRoutine] = useState<UnifiedRoutineStep[]>(routine)

  // 🔥 SPRINT 3: Détection du contenu dynamique IA
  const isDynamicContent = isAIGenerated && routine.some(step => 
    step.title.length > 50 || // Titre long personnalisé
    step.applicationAdvice.includes('votre') || // Personnalisation
    step.applicationAdvice.includes('selon') || // Adaptation
    /[éàùç🧴💧]/.test(step.applicationAdvice) // Caractères spéciaux ou émojis
  )

  // Helper pour tronquer le texte long de manière intelligente
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    
    // Chercher la dernière phrase complète avant la limite
    const truncated = text.substring(0, maxLength)
    const lastSentence = truncated.lastIndexOf('.')
    const lastSpace = truncated.lastIndexOf(' ')
    
    const cutPoint = lastSentence > maxLength * 0.7 ? lastSentence + 1 : lastSpace
    return text.substring(0, cutPoint) + '...'
  }

  // Helper pour détecter si le contenu nécessite un affichage spécial
  const needsSpecialRendering = (step: UnifiedRoutineStep) => {
    return step.title.length > 80 || 
           step.applicationAdvice.length > 300 ||
           /[🧴💧✨🌟💆‍♀️]/.test(step.applicationAdvice) // Émojis cosmétiques
  }

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 🔥 SPRINT 2: Application cohérence produits
  useEffect(() => {
    if (routine.length > 0) {
      try {
        console.log('🔄 Application cohérence produits à la routine')
        const enhancedRoutine = applyFullCoherence(routine)
        setCoherentRoutine(enhancedRoutine)
        console.log(`✅ Cohérence appliquée: ${enhancedRoutine.length} étapes`)
      } catch (error) {
        console.warn('❌ Erreur application cohérence:', error)
        setCoherentRoutine(routine) // Fallback vers routine originale
      }
    }
  }, [routine])

  // Calcul des durées personnalisées
  useEffect(() => {
    if (beautyAssessment && coherentRoutine.length > 0) {
      const timings = PhaseTimingCalculator.calculateCompleteTiming(beautyAssessment, coherentRoutine)
      setPhaseTimings(timings)
    }
  }, [beautyAssessment, coherentRoutine])

  if (!routine || routine.length === 0) {
    return null
  }

  // Organiser par phases
  const organizeByPhases = () => {
    return {
      immediate: coherentRoutine.filter(step => step.phase === 'immediate'),
      adaptation: coherentRoutine.filter(step => step.phase === 'adaptation'),
      maintenance: coherentRoutine.filter(step => step.phase === 'maintenance')
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
    const morningSteps = coherentRoutine.filter(step => 
      (step.timeOfDay === 'morning' || step.timeOfDay === 'both') && 
      step.frequency === 'daily' // Seulement les étapes quotidiennes
    )
    const eveningSteps = coherentRoutine.filter(step => 
      (step.timeOfDay === 'evening' || step.timeOfDay === 'both') && 
      step.frequency === 'daily' // Seulement les étapes quotidiennes
    )
    
    return {
      morning: deduplicateByProduct(morningSteps),
      evening: deduplicateByProduct(eveningSteps),
      weekly: coherentRoutine.filter(step => step.frequency === 'weekly'),
      monthly: coherentRoutine.filter(step => step.frequency === 'monthly'),
      asNeeded: coherentRoutine.filter(step => step.frequency === 'as-needed')
    }
  }

  const phaseData = organizeByPhases()
  const scheduleData = organizeBySchedule()

  const renderStep = (step: UnifiedRoutineStep, index: number, resetNumbering: boolean = false) => {
    // 🔥 SPRINT 2: Badges et timing intelligents
    const isTemporary = step.applicationDuration?.includes("Progressif") || 
                       step.applicationDuration?.includes("jusqu'à") ||
                       isTemporaryTreatment(step)
    const isContinuous = step.applicationDuration === "En continu" || 
                        isContinuousTreatment(step)
    
    // 🔥 SPRINT 2: Couleurs de phase basées sur category
    const getCategoryColor = (category: string) => {
      switch (category?.toLowerCase()) {
        case 'nettoyage':
        case 'cleansing':
          return 'from-green-400 to-green-500' // Vert pour nettoyage
        case 'traitement':
        case 'treatment':
          return 'from-red-400 to-red-500' // Rouge pour traitement
        case 'hydratation':
        case 'moisturizing':
          return 'from-blue-400 to-blue-500' // Bleu pour hydratation
        case 'protection':
          return 'from-amber-400 to-amber-500' // Ambre pour protection
        default:
          return 'from-dermai-ai-400 to-dermai-ai-500' // Couleur par défaut
      }
    }
    
    // CORRECTION 2: Titres cohérents nettoyés
    const cleanTitle = validateAndCleanTitle(step.title, step.category)
    
    // CORRECTION 3: Timing précis et détaillé
    const detailedTiming = getDetailedTiming(step)
    
    // CORRECTION 4: Badge zones différencié
    const zoneBadge = renderZoneBadge(step)
    
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
            <div className={`w-8 h-8 bg-gradient-to-r ${getCategoryColor(step.category)} text-white rounded-full flex items-center justify-center text-sm font-semibold`}>
              {displayNumber}
            </div>
          </div>
          
          <div className="flex-1">
            {/* Titre sur une ligne, badges en dessous sur mobile */}
            <div className="mb-2">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-gray-900 text-sm md:text-base leading-tight pr-2">{cleanTitle}</h4>
                {/* Badge timing précis - CORRECTION FINALE */}
                <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                  {timeIcons[step.timeOfDay as keyof typeof timeIcons]}
                  <span className="hidden sm:inline">
                    {step.timeOfDay === 'morning' && 'Matin'}
                    {step.timeOfDay === 'evening' && 'Soir'}
                    {step.timeOfDay === 'both' && 'Matin et soir'}
                  </span>
                  <span className="sm:hidden">
                    {step.timeOfDay === 'morning' && '☀️'}
                    {step.timeOfDay === 'evening' && '🌙'}
                    {step.timeOfDay === 'both' && '🕐'}
                  </span>
                </div>
              </div>
              
              {/* 🔥 SPRINT 2: Badges intelligents temporaire/continu */}
              <div className="flex items-center gap-2 flex-wrap">
                {isTemporary && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    <span>Temporaire</span>
                  </div>
                )}
                {isContinuous && !isTemporary && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                    <Repeat className="w-3 h-3" />
                    <span>Continu</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Supprimer badge frequencyDetails redondant - déjà affiché en haut à droite */}
            
            {step.startAfterDays && (
              <div className="flex items-center space-x-1 text-xs text-orange-600 mb-2">
                <Calendar className="w-3 h-3" />
                <span>À introduire dans {step.startAfterDays} jours minimum</span>
              </div>
            )}

            {/* 🔥 SPRINT 2: Zones spécifiques avec badges colorés */}
            {step.targetArea === 'specific' && step.zones && step.zones.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap mb-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border border-purple-300 rounded-full text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  <span>Zones ciblées :</span>
                </div>
                {step.zones.map((zone, zoneIndex) => (
                  <div key={zoneIndex} className="px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 border border-purple-200 rounded-full text-xs font-medium">
                    {zone}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-dermai-ai-100 to-dermai-ai-200 text-dermai-ai-700 border border-dermai-ai-300 rounded-full text-xs font-medium mb-2 w-fit">
                <Globe className="w-3 h-3" />
                <span>Visage entier</span>
              </div>
            )}
            
            {/* 🔥 SPRINT 2: Produits recommandés avec justifications et liens d'affiliation */}
            <div className="bg-dermai-ai-50 rounded-lg p-2 md:p-3 mb-2 md:mb-3 border border-dermai-ai-200">
              <div className="flex items-center space-x-1 text-xs text-dermai-ai-700 mb-1 md:mb-2">
                <ShoppingBag className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">Produit recommandé</span>
              </div>
              {step.recommendedProducts && step.recommendedProducts.length > 0 ? (
                step.recommendedProducts.map((product, productIndex) => (
                  <div key={productIndex} className="mb-2 md:mb-3 last:mb-0 p-2 bg-white rounded-lg border border-dermai-ai-100">
                    <div className="font-medium text-sm text-dermai-ai-800 leading-tight mb-1">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {product.brand} • {product.category}
                      {product.price && (
                        <span className="ml-2 font-medium text-dermai-ai-600">
                          {typeof product.price === 'number' ? `${product.price.toFixed(2)}€` : product.price}
                        </span>
                      )}
                    </div>
                    
                    {/* 🔥 SPRINT 2: Afficher justification du produit */}
                    {product.justification && (
                      <div className="mb-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border-l-2 border-green-300">
                        <div className="flex items-start space-x-1 text-xs text-green-700">
                          <Target className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">Pourquoi ce produit :</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1 leading-relaxed">
                          {product.justification}
                        </div>
                      </div>
                    )}
                    
                    {/* 🔥 SPRINT 2: Liens d'affiliation améliorés */}
                    <div className="flex items-center justify-between">
                      {product.affiliateLink ? (
                        <a
                          href={product.affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-t from-dermai-ai-500 via-dermai-ai-400 to-dermai-ai-600 text-white rounded-full text-xs font-medium hover:from-dermai-ai-600 hover:via-dermai-ai-500 hover:to-dermai-ai-700 transition-all"
                        >
                          <ShoppingBag className="w-3 h-3 mr-1" />
                          <span>Voir le produit</span>
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          <Info className="w-3 h-3 mr-1" />
                          <span>Lien bientôt disponible</span>
                        </div>
                      )}
                      
                      {product.category && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          product.category === 'nettoyage' ? 'bg-green-100 text-green-700 border-green-200' :
                          product.category === 'traitement' ? 'bg-red-100 text-red-700 border-red-200' :
                          product.category === 'hydratation' ? 'bg-dermai-ai-100 text-dermai-ai-700 border-dermai-ai-200' :
                          product.category === 'protection' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {product.category}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-amber-800">Produit en cours de sélection...</div>
                    <div className="text-xs text-amber-600 mt-1">Notre IA analyse le meilleur produit pour vos besoins</div>
                  </div>
                </div>
              )}
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

            {/* Durée d'application - CORRECTION FINALE */}
            {(() => {
              let duration = step.applicationDuration
              
              // Logique cohérente pour la durée
              if (isTemporary) {
                // Pour les traitements temporaires, utiliser critères visuels ou durée spécifique
                const criteria = PhaseTimingCalculator.getVisualCriteria(step)
                if (criteria) {
                  duration = `${criteria.observation} (${criteria.estimatedDays})`
                } else if (!duration) {
                  duration = "Jusqu'à amélioration"
                }
              } else {
                // Pour les produits continus, toujours "En continu"
                duration = "En continu"
              }
              
              if (duration) {
                return (
                  <div className="space-y-1 mb-2 md:mb-3">
                    <div className="flex items-center space-x-1 text-xs text-blue-700">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="font-medium">Durée d'application</span>
                    </div>
                    <div className="text-xs text-blue-600 leading-relaxed font-medium">
                      {duration}
                    </div>
                  </div>
                )
              }
              return null
            })()}

            {/* Supprimer timing détaillé - redondant avec badge en haut à droite */}

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
            <div className="flex items-center space-x-2 md:space-x-3 mb-1">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Routines Personnalisées</h2>
            </div>
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center space-x-1 text-xs font-medium text-dermai-ai-700 bg-dermai-ai-100 border border-dermai-ai-200 px-2 py-1 rounded-md">
                <Sparkles className="w-3 h-3" />
                <span>Routine IA</span>
              </div>
            </div>
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
                      className="flex items-center space-x-1 px-2.5 md:px-3 py-1.5 md:py-2 bg-gradient-to-br from-dermai-ai-400 via-dermai-ai-300 to-dermai-ai-500 hover:from-dermai-ai-500 hover:via-dermai-ai-400 hover:to-dermai-ai-600 text-white rounded-lg text-xs md:text-sm font-medium transition-all shadow-md"
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
