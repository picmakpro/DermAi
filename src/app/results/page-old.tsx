'use client'

import { useEffect, useMemo, useState } from 'react'
import { getAnalysis } from '@/utils/storage/analysisStore'
import ChatWidget from './ChatWidget'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
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
import type { SkinAnalysis, SkinScores, ScoreDetail, RecommendedProductCard } from '@/types'

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

export default function ResultsPageOld() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null)
  const [userAge, setUserAge] = useState<number | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    // Charger via ID en sessionStorage + payload en IndexedDB
    const load = async () => {
      const analysisId = sessionStorage.getItem('dermai_analysis_id')
      const questionnaireData = sessionStorage.getItem('dermai_questionnaire')
      if (!analysisId) {
        router.push('/upload')
        return
      }
      try {
        const stored = await getAnalysis(analysisId)
        if (!stored) {
          router.push('/upload')
          return
        }
        setAnalysis(stored)
        if (questionnaireData) {
          const q = JSON.parse(questionnaireData)
          if (q?.userProfile?.age) setUserAge(q.userProfile.age)
        }
      } catch (e) {
        console.error('Erreur chargement results:', e)
        router.push('/upload')
      }
    }
    load()
  }, [router])

  const skinAgeYears = useMemo(() => {
    if (!analysis || userAge == null) return null
    const score = (analysis.scores as any)?.skinAge as ScoreDetail | undefined
    if (!score || typeof score.value !== 'number') return null
    
    // Logique corrigée: score élevé = peau plus jeune, score bas = peau plus âgée
    // Formule: âge de peau = âge réel + (75 - score) / 10
    // - Score 100 : âge peau = âge réel - 2.5 ans (peau plus jeune)  
    // - Score 75 : âge peau = âge réel (neutre)
    // - Score 50 : âge peau = âge réel + 2.5 ans (peau plus âgée)
    // - Score 25 : âge peau = âge réel + 5 ans (peau beaucoup plus âgée)
    const ageDelta = (75 - score.value) / 10
    const computed = Math.round(userAge + ageDelta)
    return Math.max(15, Math.min(80, computed))
  }, [analysis, userAge])

  const handleNewAnalysis = () => {
    // Nettoyer le sessionStorage
    sessionStorage.removeItem('dermai_photos')
    sessionStorage.removeItem('dermai_questionnaire')
    sessionStorage.removeItem('dermai_analysis')
    router.push('/upload')
  }

  const renderScoreCard = (key: keyof SkinScores, scoreDetail: ScoreDetail | undefined) => {
    if (key === 'overall' || !scoreDetail || typeof scoreDetail.value !== 'number') return null

    const IconComponent = scoreIcons[key as keyof typeof scoreIcons]
    const score = Math.round(scoreDetail.value)
    const confidence = Math.round((scoreDetail.confidence ?? 0) * 100)

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

        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm text-gray-600">{getScoreLabel(score)}</span>
          <span className="text-sm font-semibold text-gray-900">{score}/100</span>
        </div>

        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{scoreDetail.justification}</p>

        {scoreDetail.basedOn && scoreDetail.basedOn.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Basé sur :</p>
            <div className="flex flex-wrap gap-1">
              {scoreDetail.basedOn.slice(0, 3).map((item, index) => (
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

          {/* En-tête + score global */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Résultats de votre peau</h1>
              <p className="text-gray-600 mb-6">
                Analyse réalisée le {new Date(analysis.createdAt).toLocaleDateString('fr-FR')}
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
                {skinAgeYears && (
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="font-medium text-gray-900">Âge de la peau: {skinAgeYears} ans</div>
                    {userAge != null && (
                      <div className="text-sm text-gray-600">Comparé à votre âge: {userAge} ans</div>
                    )}
                  </div>
                )}
                <div className="text-center">
                  <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="font-medium text-gray-900">
                    {(() => {
                      const entries = scoreOrder
                        .map((k) => (analysis.scores as any)[k] as ScoreDetail | undefined)
                        .filter((s): s is ScoreDetail => !!s && typeof s.confidence === 'number')
                      if (entries.length === 0) return 0
                      const avg = entries.reduce((acc, v) => acc + (v.confidence ?? 0), 0) / entries.length
                      return Math.round(avg * 100)
                    })()}%
                  </div>
                  <div className="text-sm text-gray-600">Confiance</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contenu monobloc */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-10">
            {/* Scores détaillés compacts */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Votre peau en un coup d'œil</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {scoreOrder
                  .filter((k) => {
                    const s: any = (analysis.scores as any)[k]
                    return s && typeof s.value === 'number'
                  })
                  .map((k) => renderScoreCard(k as keyof SkinScores, (analysis.scores as any)[k]))}
              </div>
            </section>

            {/* Diagnostic principal */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Diagnostic principal</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Condition :</span>
                    <span className="ml-2 font-semibold text-gray-900">{analysis.diagnostic.primaryCondition}</span>
                  </div>
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
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Observations clés</h3>
                <ul className="grid md:grid-cols-2 gap-2">
                  {analysis.diagnostic.observations.slice(0,6).map((observation, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{observation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Recommandations */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recommandations</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="font-semibold text-red-900 mb-3">Actions immédiates</h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.immediate.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-red-800">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="font-semibold text-green-900 mb-3">Routine personnalisée</h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.routine.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-green-800">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 overflow-hidden">
                  <h3 className="font-semibold text-blue-900 mb-3">Produits recommandés</h3>
                  <div className="relative">
                    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
                      {(analysis.recommendations as any).productsDetailed?.length
                        ? (analysis.recommendations as any).productsDetailed.map((p: RecommendedProductCard, i: number) => (
                            <a
                              key={i}
                              href={p.affiliateLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-w-[260px] snap-start bg-white rounded-xl shadow border border-blue-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                              <div className="w-full h-40 bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="p-4 space-y-2">
                                <div className="text-xs text-gray-500">{p.brand}</div>
                                <div className="font-semibold text-gray-900">{p.name}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-900 font-bold">{p.price.toFixed(2)} €</span>
                                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">-10% exclusif</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{p.frequency}</span>
                                  {p.benefits.slice(0,2).map((b, j) => (
                                    <span key={j} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{b}</span>
                                  ))}
                                </div>
                                <button className="w-full mt-1 bg-indigo-600 text-white py-2 rounded-md text-sm hover:bg-indigo-700">Acheter</button>
                              </div>
                            </a>
                          ))
                        : analysis.recommendations.products.map((product, index) => (
                            <div key={index} className="min-w-[260px] snap-start flex items-center bg-white border border-blue-100 rounded-lg p-3 shadow">
                              <Star className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
                              <span className="text-blue-900">{product}</span>
                              <span className="ml-auto text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">-10%</span>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
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

          {/* Assistant discret */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 bg-indigo-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-indigo-700"
          >
            Besoin d'aide ?
          </button>

          {isChatOpen && (
            <ChatWidget analysis={analysis} onClose={() => setIsChatOpen(false)} />
          )}
        </div>
      </div>
    </div>
  )
}
