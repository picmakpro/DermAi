'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAnalysis } from '@/hooks/useAnalysis'
import type { AnalyzeRequest, PhotoUpload } from '@/types'
import { getPhotoDataUrl } from '@/utils/storage/photoStore'
import { saveAnalysis } from '@/utils/storage/analysisStore'
import { AlertCircle, Brain, Camera, CheckCircle2, Loader2 } from 'lucide-react'

interface SessionData {
  photos: PhotoUpload[]
  questionnaire: {
    userProfile?: { skinType?: string }
    skinConcerns?: { primary?: string[] }
  }
}

export default function AnalyzePage() {
  const router = useRouter()
  const { isAnalyzing, analysis, error, progress, analyze, reset } = useAnalysis()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const analysisSteps = [
    { id: 'load', label: 'Chargement des données', icon: Loader2 },
    { id: 'prepare', label: 'Préparation des images', icon: Camera },
    { id: 'analyze', label: 'Analyse par DermAI', icon: Brain },
    { id: 'complete', label: 'Diagnostic prêt', icon: CheckCircle2 }
  ]

  useEffect(() => {
    const load = async () => {
      // Récupérer les données du sessionStorage
      const photos = sessionStorage.getItem('dermai_photos')
      const questionnaire = sessionStorage.getItem('dermai_questionnaire')

      if (!photos || !questionnaire) {
        router.push('/upload')
        return
      }

      try {
        const photosData = JSON.parse(photos) as Array<{ id: string; preview: string; type: PhotoUpload['type']; quality: PhotoUpload['quality'] }>
        const questionnaireData = JSON.parse(questionnaire)

        // Reconstituer les photos avec dataURL depuis IndexedDB (pas de quota)
        const rebuiltPhotos: PhotoUpload[] = await Promise.all(
          photosData.map(async (p) => ({
            id: p.id,
            file: (await getPhotoDataUrl(p.id)) || '',
            preview: p.preview,
            type: p.type,
            quality: p.quality,
          }))
        )

        setSessionData({
          photos: rebuiltPhotos,
          questionnaire: questionnaireData
        })
      } catch (error) {
        console.error('Erreur parsing sessionStorage:', error)
        router.push('/upload')
      }
    }

    load()
  }, [router])

  useEffect(() => {
    if (sessionData && !isAnalyzing && !analysis && !error) {
      startAnalysis()
    }
  }, [sessionData, isAnalyzing, analysis, error, startAnalysis])

  useEffect(() => {
    // Rediriger vers les résultats quand l'analyse est terminée
    if (analysis) {
      const id = analysis.id || `analysis_${Date.now()}`
      // Stocker payload lourd en IndexedDB et garder ID léger en sessionStorage
      saveAnalysis(id, analysis).then(() => {
        sessionStorage.setItem('dermai_analysis_id', id)
        router.push('/results')
      }).catch((e) => {
        console.error('Erreur sauvegarde analysis:', e)
        // fallback minimal (tronqué) si nécessaire
        try {
          sessionStorage.setItem('dermai_analysis_id', id)
        } catch {}
        router.push('/results')
      })
    }
  }, [analysis, router])

  useEffect(() => {
    // Gérer le progrès des étapes visuelles
    if (isAnalyzing) {
      if (progress < 25) setCurrentStep(0)
      else if (progress < 50) setCurrentStep(1)
      else if (progress < 90) setCurrentStep(2)
      else setCurrentStep(3)
    }
  }, [progress, isAnalyzing])

  const startAnalysis = useCallback(async () => {
    if (!sessionData) return

    const { photos, questionnaire } = sessionData

    // Construire la requête d'analyse (les données sont déjà dans la bonne structure)
    const analyzeRequest: AnalyzeRequest = {
      photos,
      userProfile: questionnaire.userProfile,
      skinConcerns: questionnaire.skinConcerns,
      currentRoutine: questionnaire.currentRoutine,
      allergies: questionnaire.allergies
    }

    console.log('Démarrage analyse avec:', analyzeRequest)
    console.log('UserProfile détaillé:', analyzeRequest.userProfile)
    console.log('Photos détaillées:', analyzeRequest.photos.map(p => ({ id: p.id, type: p.type, hasFile: !!p.file })))
    
    await analyze(analyzeRequest)
  }, [sessionData, analyze])

  const handleRetry = () => {
    reset()
    if (sessionData) {
      startAnalysis()
    }
  }

  const handleGoBack = () => {
    reset()
    router.push('/questionnaire')
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  DermAI
                </h1>
                <p className="text-sm text-gray-600">Diagnostic personnalisé par IA</p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Étape 3 sur 4</div>
              <div className="text-sm text-purple-600 font-medium">Analyse en cours...</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="relative w-24 h-24 mx-auto mb-6"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-full animate-ping opacity-20"></div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              DermAI analyse votre peau
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 leading-relaxed"
            >
              DermAI examine vos photos avec une 
              <strong className="text-purple-600"> précision dermatologique</strong>
            </motion.p>
          </div>

          {/* Contenu principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8"
          >
            {error ? (
              // État d'erreur
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Erreur d&apos;analyse
                </h2>
                <p className="text-gray-600 mb-6">
                  {error}
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleRetry}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-medium transition-all transform hover:scale-105"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={handleGoBack}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Retour
                  </button>
                </div>
              </motion.div>
            ) : (
              // État de chargement
              <div className="space-y-8">
                {/* Barre de progression */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progression
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <motion.div
                      className="bg-gradient-to-r from-pink-500 to-purple-600 h-4 rounded-full shadow-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Étapes de l'analyse */}
                <div className="space-y-4">
                  {analysisSteps.map((step, index) => {
                    const isActive = index === currentStep
                    const isCompleted = index < currentStep
                    const IconComponent = step.icon

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center p-6 rounded-2xl border-2 transition-all ${
                          isActive
                            ? 'border-purple-300 bg-purple-50 shadow-lg'
                            : isCompleted
                            ? 'border-green-300 bg-green-50 shadow-md'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mr-4 shadow-sm ${
                          isActive
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                            : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isActive ? (
                            <IconComponent className="w-6 h-6 animate-pulse" />
                          ) : (
                            <IconComponent className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-medium ${
                            isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </h3>
                          {isActive && (
                            <p className="text-sm text-gray-600">
                              En cours...
                            </p>
                          )}
                          {isCompleted && (
                            <p className="text-sm text-green-600">
                              Terminé
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Informations sur l'analyse */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-lg mr-2">🔍</span>
                    Analyse en cours
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Photos analysées :</span>
                      <span className="font-medium ml-2">
                        {sessionData.photos.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Technologie :</span>
                      <span className="font-medium ml-2">DermAI Vision</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type de peau :</span>
                      <span className="font-medium ml-2">
                        {sessionData.questionnaire.userProfile?.skinType}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Préoccupations :</span>
                      <span className="font-medium ml-2">
                        {sessionData.questionnaire.skinConcerns?.primary?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note de sécurité */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Avertissement médical</h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Cette analyse est réalisée par intelligence artificielle et ne remplace pas un diagnostic médical professionnel. 
                        En cas de problème dermatologique persistant ou sévère, consultez un dermatologue qualifié.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
