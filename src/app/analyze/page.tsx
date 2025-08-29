'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAnalysis } from '@/hooks/useAnalysis'
import type { PhotoUpload } from '@/types'

// Type temporaire pour la requête d'analyse
interface AnalyzeRequest {
  photos: any[]
  userProfile?: any
  skinConcerns?: any
  currentRoutine?: any
  allergies?: any
}
import { getPhotoDataUrl } from '@/utils/storage/photoStore'
import { saveAnalysis } from '@/utils/storage/analysisStore'
import { AlertCircle, Brain, Camera, CheckCircle2, Loader2 } from 'lucide-react'

interface SessionData {
  photos: any[]
  questionnaire: {
    userProfile?: { skinType?: string }
    skinConcerns?: { primary?: string[] }
    currentRoutine?: any
    allergies?: any
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
        const rebuiltPhotos: any[] = await Promise.all(
          photosData.map(async (p: any) => ({
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

  // Définir startAnalysis en premier
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
      <div className="min-h-screen bg-dermai-pure flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-dermai-ai-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dermai-pure">
      {/* Header */}
      <div className="bg-dermai-pure/80 backdrop-blur-sm border-b border-dermai-nude-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="cursor-pointer transition-opacity hover:opacity-80">
                <img 
                  src="/DERMAI-logo.svg" 
                  alt="DermAI" 
                  className="h-8 md:h-10 w-auto"
                />
              </a>
            </div>

            {/* Progress dots */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-dermai-ai-500 rounded-full shadow-glow"></div>
              <div className="w-3 h-3 bg-dermai-ai-500 rounded-full shadow-glow"></div>
              <div className="w-3 h-3 bg-dermai-ai-500 rounded-full animate-pulse shadow-glow"></div>
              <div className="w-3 h-3 bg-dermai-neutral-300 rounded-full"></div>
            </div>

            <div className="text-right">
              <div className="text-sm text-dermai-neutral-500">Étape 3 sur 4</div>
              <div className="text-sm text-dermai-ai-600 font-medium font-display">Analyse en cours...</div>
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
              <div className="w-24 h-24 bg-gradient-to-r from-dermai-ai-500 via-dermai-ai-400 to-dermai-ai-600 rounded-full flex items-center justify-center shadow-glow">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-dermai-ai-500 via-dermai-ai-400 to-dermai-ai-600 rounded-full animate-ping opacity-20"></div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold font-display text-dermai-neutral-900 mb-4"
            >
              DermAI analyse votre peau
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-dermai-neutral-600 leading-relaxed"
            >
              DermAI examine vos photos avec une 
              <strong className="text-dermai-ai-600 font-display"> précision dermatologique</strong>
            </motion.p>
          </div>

          {/* Contenu principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card bg-dermai-pure rounded-3xl shadow-premium border border-dermai-nude-200 p-8"
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
                <h2 className="text-xl font-semibold font-display text-dermai-neutral-900 mb-2">
                  Erreur d&apos;analyse
                </h2>
                <p className="text-dermai-neutral-600 mb-6">
                  {error}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleRetry}
                    className="btn-primary px-6 py-3 rounded-2xl font-medium transition-all transform hover:scale-105"
                  >
                    Réessayer
                  </button>
                  <button
                    onClick={handleGoBack}
                    className="btn-outline px-6 py-3 rounded-2xl font-medium transition-colors"
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
                    <span className="text-sm font-medium font-display text-dermai-neutral-700">
                      Progression
                    </span>
                    <span className="text-sm text-dermai-neutral-500">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-dermai-neutral-200 rounded-full h-4">
                    <motion.div
                      className="bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 h-4 rounded-full shadow-glow"
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
                            ? 'border-dermai-ai-300 bg-dermai-ai-50 shadow-premium'
                            : isCompleted
                            ? 'border-dermai-ai-400 bg-dermai-ai-100 shadow-premium'
                            : 'border-dermai-nude-200 bg-dermai-nude-50'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mr-4 shadow-glow ${
                          isActive
                            ? 'bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white'
                            : isCompleted
                            ? 'bg-dermai-ai-600 text-white'
                            : 'bg-dermai-neutral-300 text-dermai-neutral-600'
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
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <span className="text-lg mr-2">🔍</span>
                      Analyse DermAI
                    </h3>
                    <span className="text-xs text-gray-500">Ne quittez pas la page</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Photos analysées :</span>
                      <span className="font-medium ml-2">{sessionData.photos.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Modèle IA :</span>
                      <span className="font-medium ml-2">DermAI Vision 3.0</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Étape :</span>
                      <span className="font-medium ml-2">{`${currentStep + 1}/${analysisSteps.length} — ${analysisSteps[currentStep]?.label}`}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Durée estimée :</span>
                      <span className="font-medium ml-2">≈ 30–90 s</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type de peau :</span>
                      <span className="font-medium ml-2">
                        {sessionData.questionnaire.userProfile?.skinType === 'Je ne sais pas' 
                          ? 'À déterminer par l’IA' 
                          : sessionData.questionnaire.userProfile?.skinType}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Préoccupations :</span>
                      <span className="font-medium ml-2">
                        {sessionData.questionnaire.skinConcerns?.primary?.includes('Je ne sais pas') ||
                        (sessionData.questionnaire.skinConcerns?.primary?.length || 0) === 0
                          ? 'À déterminer par l’IA'
                          : (sessionData.questionnaire.skinConcerns?.primary?.length || 0)}
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
