'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  CheckCircle, 
  Clock,
  Star,
  Zap,
  Award,
  ArrowRight,
  BarChart3,
  LineChart
} from 'lucide-react'

interface ProgressionStep {
  week: number
  phase: 'immediate' | 'adaptation' | 'maintenance'
  milestone: string
  expectedImprovement: string
  scoreImprovement: number
  visualChanges: string[]
}

interface ProgressionVisualizerProps {
  currentScores: Record<string, number>
  skinType?: string
  mainConcern?: string
  className?: string
}

const progressionData: ProgressionStep[] = [
  {
    week: 1,
    phase: 'immediate',
    milestone: 'Stabilisation',
    expectedImprovement: 'Réduction des irritations, peau plus confortable',
    scoreImprovement: 5,
    visualChanges: ['Moins de rougeurs', 'Peau moins tendue', 'Confort amélioré']
  },
  {
    week: 2,
    phase: 'immediate',
    milestone: 'Adaptation',
    expectedImprovement: 'Routine bien tolérée, première amélioration visible',
    scoreImprovement: 8,
    visualChanges: ['Texture plus lisse', 'Éclat retrouvé', 'Hydratation visible']
  },
  {
    week: 4,
    phase: 'adaptation',
    milestone: 'Premier cycle complet',
    expectedImprovement: 'Renouvellement cellulaire, améliorations notables',
    scoreImprovement: 15,
    visualChanges: ['Pores affinés', 'Teint unifié', 'Rides atténuées']
  },
  {
    week: 6,
    phase: 'adaptation',
    milestone: 'Optimisation',
    expectedImprovement: 'Routine complète intégrée, résultats visibles',
    scoreImprovement: 22,
    visualChanges: ['Fermeté améliorée', 'Taches estompées', 'Éclat naturel']
  },
  {
    week: 8,
    phase: 'adaptation',
    milestone: 'Transformation',
    expectedImprovement: 'Changements significatifs, objectifs atteints',
    scoreImprovement: 28,
    visualChanges: ['Peau transformée', 'Confiance retrouvée', 'Routine maîtrisée']
  },
  {
    week: 12,
    phase: 'maintenance',
    milestone: 'Stabilisation',
    expectedImprovement: 'Résultats maintenus, prévention active',
    scoreImprovement: 30,
    visualChanges: ['Résultats durables', 'Peau équilibrée', 'Routine optimisée']
  }
]

const phaseColors = {
  immediate: { bg: 'from-green-500 to-emerald-600', light: 'bg-green-100', text: 'text-green-700' },
  adaptation: { bg: 'from-dermai-ai-400 to-dermai-ai-500', light: 'bg-dermai-ai-100', text: 'text-dermai-ai-700' },
  maintenance: { bg: 'from-purple-500 to-violet-600', light: 'bg-purple-100', text: 'text-purple-700' }
}

export function ProgressionVisualizer({ 
  currentScores, 
  skinType = 'Peau mixte',
  mainConcern = 'Hydratation',
  className = '' 
}: ProgressionVisualizerProps) {
  
  const [selectedWeek, setSelectedWeek] = useState(4)
  const [showProjection, setShowProjection] = useState(false)
  
  // Calculer les scores projetés
  const calculateProjectedScores = (week: number) => {
    const step = progressionData.find(s => s.week === week) || progressionData[2]
    const improvement = step.scoreImprovement
    
    return Object.entries(currentScores).reduce((acc, [key, value]) => {
      // Amélioration progressive avec plafond réaliste
      const maxImprovement = Math.min(improvement, 95 - value)
      acc[key] = Math.min(95, value + maxImprovement)
      return acc
    }, {} as Record<string, number>)
  }
  
  const selectedStep = progressionData.find(s => s.week === selectedWeek) || progressionData[2]
  const projectedScores = calculateProjectedScores(selectedWeek)
  const averageImprovement = Object.values(projectedScores).reduce((a, b) => a + b, 0) / Object.values(projectedScores).length
  
  useEffect(() => {
    // Animation d'entrée progressive
    const timer = setTimeout(() => setShowProjection(true), 500)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className={`bg-white rounded-3xl shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-tr from-dermai-ai-500 via-dermai-ai-400 to-dermai-ai-600 text-white p-6 md:p-8 relative overflow-hidden">
        {/* Éléments décoratifs animés */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full animate-bounce"></div>
        
        <div className="flex items-center space-x-3 mb-4 relative z-10">
          <div className="p-2 bg-white/20 rounded-lg">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Progression Visuelle Prédite</h3>
            <p className="text-dermai-ai-100">Évolution de votre peau avec la routine personnalisée</p>
          </div>
        </div>
        
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm relative z-10">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="font-medium">Type de peau</div>
            <div className="text-dermai-ai-100">{skinType}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="font-medium">Préoccupation principale</div>
            <div className="text-dermai-ai-100">{mainConcern}</div>
          </div>
        </div>
      </div>
      
      {/* Timeline interactive */}
      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Timeline de Progression</h4>
          
          {/* Sélecteur de semaines */}
          <div className="flex flex-wrap gap-2 mb-4">
            {progressionData.map((step) => (
              <button
                key={step.week}
                onClick={() => setSelectedWeek(step.week)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all text-sm
                  ${selectedWeek === step.week
                    ? `bg-gradient-to-r ${phaseColors[step.phase].bg} text-white shadow-md`
                    : `${phaseColors[step.phase].light} ${phaseColors[step.phase].text} hover:shadow-sm`
                  }
                `}
              >
                <Calendar className="w-4 h-4" />
                <span>Semaine {step.week}</span>
              </button>
            ))}
          </div>
          
          {/* Barre de progression */}
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(selectedWeek / 12) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Début</span>
              <span>12 semaines</span>
            </div>
          </div>
        </div>
        
        {/* Détails de la semaine sélectionnée */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedWeek}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Milestone */}
            <div className={`${phaseColors[selectedStep.phase].light} rounded-lg p-4 border-l-4 border-${selectedStep.phase === 'immediate' ? 'green' : selectedStep.phase === 'adaptation' ? 'blue' : 'purple'}-500`}>
              <div className="flex items-start space-x-3">
                <Target className={`w-5 h-5 mt-0.5 ${phaseColors[selectedStep.phase].text}`} />
                <div>
                  <h5 className={`font-semibold ${phaseColors[selectedStep.phase].text} mb-1`}>
                    {selectedStep.milestone}
                  </h5>
                  <p className="text-gray-700 text-sm">{selectedStep.expectedImprovement}</p>
                </div>
              </div>
            </div>
            
            {/* Amélioration des scores */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Amélioration des Scores Prédite
              </h5>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(projectedScores).slice(0, 4).map(([key, projectedValue]) => {
                  const currentValue = currentScores[key] || 0
                  const improvement = projectedValue - currentValue
                  
                  return (
                    <div key={key} className="text-center">
                      <div className="text-xs text-gray-600 mb-1 capitalize">{key}</div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">{currentValue}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="text-lg font-bold text-dermai-ai-600">{Math.round(projectedValue)}</span>
                      </div>
                      <div className="text-xs text-green-600 font-medium">+{Math.round(improvement)}</div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Score Global Prédit</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-dermai-ai-600">{Math.round(averageImprovement)}/100</span>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +{Math.round(averageImprovement - Object.values(currentScores).reduce((a, b) => a + b, 0) / Object.values(currentScores).length)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Changements visuels attendus */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h5 className="font-semibold text-green-800 mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Changements Visuels Attendus
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {selectedStep.visualChanges.map((change, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-2 bg-white/60 rounded-lg p-2"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-green-800 text-sm font-medium">{change}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Conseils pour cette période */}
            <div className="bg-dermai-ai-50 rounded-lg p-4 border border-dermai-ai-200">
              <h5 className="font-semibold text-dermai-ai-800 mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Conseils pour la Semaine {selectedStep.week}
              </h5>
              
              <div className="text-dermai-ai-700 text-sm space-y-1">
                {selectedStep.phase === 'immediate' && (
                  <>
                    <p>• Observez attentivement les réactions de votre peau</p>
                    <p>• Hydratez généreusement pour renforcer la barrière cutanée</p>
                    <p>• Patience : les premiers résultats arrivent !</p>
                  </>
                )}
                {selectedStep.phase === 'adaptation' && (
                  <>
                    <p>• Continuez la routine avec régularité</p>
                    <p>• Les actifs commencent à faire effet</p>
                    <p>• Protégez votre peau du soleil</p>
                  </>
                )}
                {selectedStep.phase === 'maintenance' && (
                  <>
                    <p>• Maintenez les bonnes habitudes acquises</p>
                    <p>• Adaptez selon les saisons et besoins</p>
                    <p>• Célébrez vos résultats !</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ProgressionVisualizer
