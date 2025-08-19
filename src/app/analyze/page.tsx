'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAnalysis } from '@/hooks/useAnalysis'
import type { AnalyzeRequest, PhotoUpload } from '@/types'
import { AlertCircle, Brain, Camera, CheckCircle2, Loader2 } from 'lucide-react'

interface SessionData {
  photos: PhotoUpload[]
  questionnaire: any
}

export default function AnalyzePage() {
  const router = useRouter()
  const { isAnalyzing, analysis, error, progress, analyze, reset } = useAnalysis()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const analysisSteps = [
    { id: 'load', label: 'Chargement des données', icon: Loader2 },
    { id: 'prepare', label: 'Préparation des images', icon: Camera },
    { id: 'analyze', label: 'Analyse IA GPT-4o Vision', icon: Brain },
    { id: 'complete', label: 'Analyse terminée', icon: CheckCircle2 }
  ]

  useEffect(() => {
    // Récupérer les données du sessionStorage
    const photos = sessionStorage.getItem('dermai_photos')
    const questionnaire = sessionStorage.getItem('dermai_questionnaire')

    if (!photos || !questionnaire) {
      router.push('/upload')
      return
    }

    try {
      const photosData = JSON.parse(photos)
      const questionnaireData = JSON.parse(questionnaire)

      setSessionData({
        photos: photosData,
        questionnaire: questionnaireData
      })
    } catch (error) {
      console.error('Erreur parsing sessionStorage:', error)
      router.push('/upload')
    }
  }, [router])

  useEffect(() => {
    if (sessionData && !isAnalyzing && !analysis && !error) {
      startAnalysis()
    }
  }, [sessionData])

  useEffect(() => {
    // Rediriger vers les résultats quand l'analyse est terminée
    if (analysis) {
      // Sauvegarder les résultats en sessionStorage
      sessionStorage.setItem('dermai_analysis', JSON.stringify(analysis))
      router.push('/results')
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

  const startAnalysis = async () => {
    if (!sessionData) return

    const { photos, questionnaire } = sessionData

    // Construire la requête d'analyse (les données sont déjà dans la bonne structure)
    const analyzeRequest: AnalyzeRequest = {
      photos,
      userProfile: questionnaire.userProfile,
      skinConcerns: questionnaire.skinConcerns,
      currentRoutine: questionnaire.currentRoutine
    }

    console.log('Démarrage analyse avec:', analyzeRequest)
    console.log('UserProfile détaillé:', analyzeRequest.userProfile)
    console.log('Photos détaillées:', analyzeRequest.photos.map(p => ({ id: p.id, type: p.type, hasFile: !!p.file })))
    
    await analyze(analyzeRequest)
  }

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analyse en cours
            </h1>
            <p className="text-gray-600">
              Notre IA analyse vos photos avec la technologie GPT-4o Vision
            </p>
          </div>

          {/* Contenu principal */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
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
                  Erreur d'analyse
                </h2>
                <p className="text-gray-600 mb-6">
                  {error}
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleRetry}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={handleGoBack}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className="bg-indigo-600 h-3 rounded-full"
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
                        className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                          isActive
                            ? 'border-indigo-300 bg-indigo-50'
                            : isCompleted
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                          isActive
                            ? 'bg-indigo-600 text-white'
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
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Analyse en cours :
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Photos analysées :</span>
                      <span className="font-medium ml-2">
                        {sessionData.photos.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Modèle IA :</span>
                      <span className="font-medium ml-2">GPT-4o Vision</span>
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note :</strong> Cette analyse est réalisée par IA et ne remplace pas un avis médical professionnel. 
                    En cas de problème dermatologique sévère, consultez un dermatologue.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
