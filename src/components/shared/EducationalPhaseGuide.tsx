'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, 
  Clock, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  Calendar,
  Zap,
  Shield,
  Heart,
  Sparkles
} from 'lucide-react'

interface PhaseInfo {
  id: string
  name: string
  duration: string
  objective: string
  description: string
  keyPoints: string[]
  timeline: Array<{
    week: string
    milestone: string
    expectation: string
  }>
  tips: string[]
  warnings?: string[]
}

const phasesData: PhaseInfo[] = [
  {
    id: 'immediate',
    name: 'Phase Immédiate',
    duration: '1-3 semaines',
    objective: 'Stabiliser et traiter l\'urgent',
    description: 'Cette première phase se concentre sur la stabilisation de votre peau et le traitement des problèmes les plus urgents. L\'objectif est de créer une base saine avant d\'introduire des actifs plus puissants.',
    keyPoints: [
      'Respect de la barrière cutanée',
      'Traitement des irritations existantes',
      'Établissement d\'une routine de base',
      'Nettoyage et hydratation adaptés'
    ],
    timeline: [
      {
        week: 'Semaine 1',
        milestone: 'Adaptation de la peau',
        expectation: 'Réduction des irritations, confort retrouvé'
      },
      {
        week: 'Semaine 2-3',
        milestone: 'Stabilisation',
        expectation: 'Peau plus calme, routine bien tolérée'
      }
    ],
    tips: [
      'Commencez doucement, une seule nouveauté à la fois',
      'Observez les réactions de votre peau quotidiennement',
      'Privilégiez les textures douces et non-comédogènes',
      'Hydratez généreusement pour renforcer la barrière cutanée'
    ],
    warnings: [
      'Évitez les actifs puissants (rétinol, AHA/BHA) pendant cette phase',
      'Ne changez pas toute votre routine d\'un coup'
    ]
  },
  {
    id: 'adaptation',
    name: 'Phase d\'Adaptation',
    duration: '3-8 semaines',
    objective: 'Introduction progressive des actifs puissants',
    description: 'Une fois votre peau stabilisée, nous introduisons progressivement les actifs ciblés pour traiter vos préoccupations spécifiques. Cette phase respecte le cycle de renouvellement cellulaire de 28 jours.',
    keyPoints: [
      'Introduction graduelle des actifs',
      'Respect du cycle cellulaire (28 jours)',
      'Monitoring des réactions cutanées',
      'Ajustements selon la tolérance'
    ],
    timeline: [
      {
        week: 'Semaine 3-4',
        milestone: 'Premier actif introduit',
        expectation: 'Adaptation progressive, premiers effets visibles'
      },
      {
        week: 'Semaine 5-6',
        milestone: 'Routine complète établie',
        expectation: 'Amélioration notable des problèmes ciblés'
      },
      {
        week: 'Semaine 7-8',
        milestone: 'Optimisation',
        expectation: 'Résultats visibles, peau transformée'
      }
    ],
    tips: [
      'Introduisez un nouvel actif toutes les 2 semaines maximum',
      'Commencez par 2-3 applications par semaine',
      'Augmentez progressivement la fréquence selon la tolérance',
      'Maintenez une protection solaire rigoureuse'
    ],
    warnings: [
      'Attention aux signes de sur-exfoliation (rougeurs, tiraillements)',
      'Ne mélangez pas certains actifs (rétinol + AHA le même soir)'
    ]
  },
  {
    id: 'maintenance',
    name: 'Phase de Maintenance',
    duration: 'En continu',
    objective: 'Maintenir les acquis et prévenir les rechutes',
    description: 'Cette phase vise à maintenir les améliorations obtenues et à prévenir la réapparition des problèmes. C\'est votre routine de croisière, adaptée selon l\'évolution de votre peau.',
    keyPoints: [
      'Maintien des résultats obtenus',
      'Prévention des rechutes',
      'Adaptation saisonnière',
      'Surveillance continue'
    ],
    timeline: [
      {
        week: 'Mois 3+',
        milestone: 'Routine établie',
        expectation: 'Peau stable, résultats maintenus'
      },
      {
        week: 'Évaluation trimestrielle',
        milestone: 'Ajustements saisonniers',
        expectation: 'Adaptation aux besoins évolutifs'
      }
    ],
    tips: [
      'Évaluez votre peau tous les 3 mois',
      'Adaptez votre routine selon les saisons',
      'Maintenez les bonnes habitudes acquises',
      'Restez à l\'écoute des besoins de votre peau'
    ]
  }
]

interface EducationalPhaseGuideProps {
  currentPhase?: string
  className?: string
}

export function EducationalPhaseGuide({ 
  currentPhase = 'immediate', 
  className = '' 
}: EducationalPhaseGuideProps) {
  const [activePhase, setActivePhase] = useState(currentPhase)
  const [expandedSection, setExpandedSection] = useState<string | null>('timeline')
  
  const activePhaseData = phasesData.find(p => p.id === activePhase) || phasesData[0]
  
  const phaseIcons = {
    immediate: <Zap className="w-5 h-5" />,
    adaptation: <TrendingUp className="w-5 h-5" />,
    maintenance: <Shield className="w-5 h-5" />
  }
  
  const phaseColors = {
    immediate: 'from-green-500 to-emerald-600',
    adaptation: 'from-blue-500 to-indigo-600',
    maintenance: 'from-purple-500 to-violet-600'
  }
  
  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* Header avec sélection de phase */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 rounded-lg text-white">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Guide des Phases Dermatologiques</h3>
            <p className="text-sm text-gray-600">Comprendre votre routine personnalisée</p>
          </div>
        </div>
        
        {/* Sélecteur de phases */}
        <div className="flex space-x-2">
          {phasesData.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
                ${activePhase === phase.id
                  ? `bg-gradient-to-r ${phaseColors[phase.id as keyof typeof phaseColors]} text-white shadow-md`
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              {phaseIcons[phase.id as keyof typeof phaseIcons]}
              <span className="text-sm">{phase.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Contenu de la phase active */}
      <div className="p-6">
        <motion.div
          key={activePhase}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* En-tête de phase */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xl font-bold text-gray-900">{activePhaseData.name}</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{activePhaseData.duration}</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-dermai-ai-50 to-dermai-nude-50 rounded-lg p-4 border border-dermai-ai-200">
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-dermai-ai-600 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-dermai-ai-800 mb-1">Objectif Principal</h5>
                  <p className="text-dermai-ai-700 text-sm">{activePhaseData.objective}</p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mt-4 leading-relaxed">{activePhaseData.description}</p>
          </div>
          
          {/* Sections expandables */}
          <div className="space-y-4">
            {/* Points clés */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'keyPoints' ? null : 'keyPoints')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Points Clés</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedSection === 'keyPoints' ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {expandedSection === 'keyPoints' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-white">
                      <ul className="space-y-2">
                        {activePhaseData.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Timeline */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'timeline' ? null : 'timeline')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Timeline & Attentes</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedSection === 'timeline' ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {expandedSection === 'timeline' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-white">
                      <div className="space-y-4">
                        {activePhaseData.timeline.map((item, index) => (
                          <div key={index} className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h6 className="font-semibold text-gray-900 text-sm">{item.week}</h6>
                              <p className="text-blue-600 font-medium text-sm">{item.milestone}</p>
                              <p className="text-gray-600 text-sm mt-1">{item.expectation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Conseils */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'tips' ? null : 'tips')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-pink-600" />
                  <span className="font-medium text-gray-900">Conseils d'Application</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedSection === 'tips' ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {expandedSection === 'tips' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-white">
                      <ul className="space-y-3">
                        {activePhaseData.tips.map((tip, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <Sparkles className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {activePhaseData.warnings && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h6 className="font-medium text-yellow-800 text-sm mb-1">Points d'Attention</h6>
                              <ul className="space-y-1">
                                {activePhaseData.warnings.map((warning, index) => (
                                  <li key={index} className="text-yellow-700 text-sm">• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default EducationalPhaseGuide


