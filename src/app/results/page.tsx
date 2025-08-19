'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  TrendingUp, 
  Clock,
  Heart,
  Shield,
  Droplets,
  Sun,
  Eye,
  RotateCcw,
  Download,
  Share2
} from 'lucide-react'
import type { SkinAnalysis, SkinScores, ScoreDetail } from '@/types'

const scoreIcons = {
  hydration: Droplets,
  wrinkles: Clock,
  firmness: Shield,
  radiance: Sun,
  pores: Eye,
  spots: AlertTriangle,
  darkCircles: Heart,
  skinAge: Star,
}

const scoreLabels: Record<keyof Omit<SkinScores, 'overall'>, string> = {
  hydration: 'Hydratation',
  wrinkles: 'Rides',
  firmness: 'Fermeté',
  radiance: 'Éclat',
  pores: 'Pores',
  spots: 'Taches',
  darkCircles: 'Cernes',
  skinAge: 'Âge de la peau',
}

const scoreOrder: Array<keyof Omit<SkinScores, 'overall'>> = [
  'hydration',
  'wrinkles',
  'firmness',
  'radiance',
  'pores',
  'spots',
  'darkCircles',
  'skinAge',
]

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-100'
  if (score >= 60) return 'text-yellow-600 bg-yellow-100'
  if (score >= 40) return 'text-orange-600 bg-orange-100'
  return 'text-red-600 bg-red-100'
}

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Bon'
  if (score >= 40) return 'Modéré'
  return 'À améliorer'
}

export default function ResultsPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState<'scores' | 'diagnostic' | 'recommendations'>('scores')

  useEffect(() => {
    // Récupérer les résultats du sessionStorage
    const analysisData = sessionStorage.getItem('dermai_analysis')
    
    if (!analysisData) {
      router.push('/upload')
      return
    }

    try {
      const parsedAnalysis = JSON.parse(analysisData)
      setAnalysis(parsedAnalysis)
    } catch (error) {
      console.error('Erreur parsing analysis:', error)
      router.push('/upload')
    }
  }, [router])

  const handleNewAnalysis = () => {
    // Nettoyer le sessionStorage
    sessionStorage.removeItem('dermai_photos')
    sessionStorage.removeItem('dermai_questionnaire')
    sessionStorage.removeItem('dermai_analysis')
    router.push('/upload')
  }

  const renderScoreCard = (key: keyof SkinScores, scoreDetail: ScoreDetail) => {
    if (key === 'overall') return null

    const IconComponent = scoreIcons[key as keyof typeof scoreIcons]
    const score = scoreDetail.value
    const confidence = Math.round(scoreDetail.confidence * 100)

    return (
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${getScoreColor(score)} mr-3`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 capitalize">
                {scoreLabels[key as keyof typeof scoreLabels] || key}
              </h3>
              <p className="text-sm text-gray-500">
                Confiance: {confidence}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{score}</div>
            <div className={`text-sm font-medium ${getScoreColor(score).split(' ')[0]}`}>
              {getScoreLabel(score)}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Score</span>
            <span className="text-sm font-medium">{score}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getScoreColor(score).replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[1].replace('100', '600')}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-3">
          {scoreDetail.justification}
        </p>

        {scoreDetail.basedOn && scoreDetail.basedOn.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Basé sur :</p>
            <div className="flex flex-wrap gap-1">
              {scoreDetail.basedOn.map((item, index) => (
                <span 
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </button>
            
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow">
                <Share2 className="w-4 h-4" />
                Partager
              </button>
              <button className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow">
                <Download className="w-4 h-4" />
                Télécharger
              </button>
              <button
                onClick={handleNewAnalysis}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Nouvelle analyse
              </button>
            </div>
          </div>

          {/* Score global */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Votre Analyse Dermatologique
              </h1>
              <p className="text-gray-600 mb-6">
                Analyse réalisée avec GPT-4o Vision le {new Date(analysis.createdAt).toLocaleDateString('fr-FR')}
              </p>
              
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <div className="text-4xl font-bold text-white">
                      {analysis.scores.overall}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 shadow">
                      Score global
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Camera className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">
                    {analysis.photos.length} Photos
                  </div>
                  <div className="text-sm text-gray-600">Analysées</div>
                </div>
                <div className="text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">
                    {analysis.diagnostic.severity}
                  </div>
                  <div className="text-sm text-gray-600">Sévérité</div>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">
                    {(() => {
                      const entries = Object.entries(analysis.scores).filter(([k, v]) => k !== 'overall' && typeof v === 'object') as [string, ScoreDetail][]
                      const avg = entries.reduce((acc, [, v]) => acc + v.confidence, 0) / entries.length
                      return Math.round(avg * 100)
                    })()}%
                  </div>
                  <div className="text-sm text-gray-600">Confiance</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation par onglets */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: 'scores', label: 'Scores détaillés', icon: TrendingUp },
                  { id: 'diagnostic', label: 'Diagnostic', icon: AlertTriangle },
                  { id: 'recommendations', label: 'Recommandations', icon: Heart }
                ].map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-8">
              {/* Onglet Scores */}
              {activeTab === 'scores' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {scoreOrder.map((k) => renderScoreCard(k, analysis.scores[k]))}
                </div>
              )}

              {/* Onglet Diagnostic */}
              {activeTab === 'diagnostic' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {analysis.diagnostic.primaryCondition}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Sévérité :</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${
                          analysis.diagnostic.severity === 'Légère' ? 'bg-green-100 text-green-800' :
                          analysis.diagnostic.severity === 'Modérée' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {analysis.diagnostic.severity}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Zones affectées :</span>
                        <span className="ml-2 font-medium">
                          {analysis.diagnostic.affectedAreas.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Observations cliniques :</h4>
                    <ul className="space-y-2">
                      {analysis.diagnostic.observations.map((observation, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{observation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Pronostic :</h4>
                    <p className="text-blue-800">{analysis.diagnostic.prognosis}</p>
                  </div>
                </motion.div>
              )}

              {/* Onglet Recommandations */}
              {activeTab === 'recommendations' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Actions immédiates */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Actions immédiates</h3>
                    <div className="grid gap-3">
                      {analysis.recommendations.immediate.map((action, index) => (
                        <div key={index} className="flex items-center bg-red-50 border border-red-200 rounded-lg p-4">
                          <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                          <span className="text-red-800">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Routine quotidienne */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Routine quotidienne</h3>
                    <div className="grid gap-3">
                      {analysis.recommendations.routine.map((step, index) => (
                        <div key={index} className="flex items-center bg-green-50 border border-green-200 rounded-lg p-4">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                          <span className="text-green-800">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Produits recommandés */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Produits recommandés</h3>
                    <div className="grid gap-3">
                      {analysis.recommendations.products.map((product, index) => (
                        <div key={index} className="flex items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <Star className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                          <span className="text-blue-800">{product}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conseils de mode de vie */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Conseils de mode de vie</h3>
                    <div className="grid gap-3">
                      {analysis.recommendations.lifestyle.map((advice, index) => (
                        <div key={index} className="flex items-center bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <Heart className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
                          <span className="text-purple-800">{advice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Note légale */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-2">Avertissement médical</h4>
                <p className="text-yellow-800 text-sm">
                  Cette analyse est réalisée par intelligence artificielle et ne remplace pas un diagnostic médical professionnel. 
                  En cas de problème dermatologique persistant ou sévère, consultez un dermatologue qualifié. 
                  Les recommandations de produits sont à des fins informatives et ne garantissent pas de résultats spécifiques.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
