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
import { AlertCircle, Eye, Sparkles, CheckCircle2, ShoppingBag, Scan, Shield, Microscope } from 'lucide-react'

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
    { id: 'skin-condition', label: 'Analyse de la condition de la peau', icon: Eye },
    { id: 'focus-zones', label: 'Focus sur les zones à surveiller', icon: Sparkles },
    { id: 'routine-generation', label: 'Génération de la routine personnalisée', icon: CheckCircle2 },
    { id: 'product-selection', label: 'Sélection des produits adaptés', icon: ShoppingBag }
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
    // Gérer le progrès des étapes visuelles - s'assurer que toutes les étapes sont visibles
    if (isAnalyzing) {
      if (progress < 20) setCurrentStep(0)
      else if (progress < 40) setCurrentStep(1)
      else if (progress < 70) setCurrentStep(2)
      else if (progress < 95) setCurrentStep(3) // S'assurer que l'étape 4 est visible
      else setCurrentStep(3) // Rester sur la dernière étape jusqu'à la fin
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
    <div className="min-h-screen bg-dermai-pure relative overflow-hidden">
      {/* Particules qui flottent en continu sans changement d'état */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-dermai-ai-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3, // Opacité fixe
          }}
          animate={{
            x: Math.random() * 50 - 25,
            y: Math.random() * 50 - 25,
          }}
          transition={{
            duration: 20 + Math.random() * 30, // 20-50s
            repeat: Infinity,
            repeatType: "reverse",
            delay: Math.random() * 10,
            ease: "linear"
          }}
        />
      ))}
      
      {/* Particules moyennes flottantes */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={`medium-particle-${i}`}
          className="absolute w-1.5 h-1.5 bg-dermai-ai-300 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.25, // Opacité fixe
          }}
          animate={{
            x: Math.random() * 80 - 40,
            y: Math.random() * 80 - 40,
          }}
          transition={{
            duration: 25 + Math.random() * 35, // 25-60s
            repeat: Infinity,
            repeatType: "reverse",
            delay: Math.random() * 15,
            ease: "linear"
          }}
        />
      ))}
      
      {/* Particules grandes qui dérivent */}
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={`large-particle-${i}`}
          className="absolute w-2 h-2 bg-dermai-ai-500 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.15, // Opacité fixe
          }}
          animate={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            rotate: 360,
          }}
          transition={{
            x: { duration: 30 + Math.random() * 40, repeat: Infinity, repeatType: "reverse", ease: "linear" },
            y: { duration: 35 + Math.random() * 45, repeat: Infinity, repeatType: "reverse", ease: "linear" },
            rotate: { duration: 60, repeat: Infinity, ease: "linear" },
            delay: Math.random() * 20,
          }}
        />
      ))}

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
            {/* Animation simple d'analyse IA */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="relative w-32 h-32 mx-auto mb-6"
            >
              {/* Cercles de scan concentriques */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dermai-ai-300/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-2 rounded-full border-2 border-dermai-ai-400/40"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              />
              <motion.div
                className="absolute inset-4 rounded-full border-2 border-dermai-ai-500/50"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              />
              
              {/* Icône de scan dermatologique au centre */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-dermai-ai-500 to-dermai-ai-600 rounded-full flex items-center justify-center shadow-glow"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(90, 74, 227, 0.4)",
                      "0 0 40px rgba(90, 74, 227, 0.8)",
                      "0 0 20px rgba(90, 74, 227, 0.4)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Scan className="w-8 h-8 text-white" />
                  </motion.div>
                </motion.div>
              </motion.div>
              

            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold font-display text-dermai-neutral-900 mb-4"
            >
              DermAI analyse votre peau
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-dermai-neutral-600 leading-relaxed max-w-lg mx-auto"
            >
              Notre intelligence artificielle examine vos photos avec une 
              <strong className="text-dermai-ai-600 font-display"> précision dermatologique</strong> pour vous offrir une analyse personnalisée
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
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-premium"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 15px rgba(239, 68, 68, 0.2)",
                      "0 0 25px rgba(239, 68, 68, 0.4)",
                      "0 0 15px rgba(239, 68, 68, 0.2)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </motion.div>
                <h2 className="text-2xl font-bold font-display text-dermai-neutral-900 mb-3">
                  Erreur d&apos;analyse
                </h2>
                <p className="text-dermai-neutral-600 mb-8 max-w-md mx-auto leading-relaxed">
                  {error}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    onClick={handleRetry}
                    className="bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white px-8 py-4 rounded-3xl font-display font-semibold shadow-premium transition-all transform hover:scale-105 hover:shadow-glow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Réessayer l'analyse
                  </motion.button>
                  <motion.button
                    onClick={handleGoBack}
                    className="border-2 border-dermai-neutral-300 text-dermai-neutral-700 px-8 py-4 rounded-3xl font-display font-semibold transition-all hover:border-dermai-neutral-400 hover:bg-dermai-nude-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Retour au questionnaire
                  </motion.button>
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
                        animate={{ 
                          opacity: isActive || isCompleted ? 1 : 0.6, 
                          x: 0,
                          scale: isActive ? 1.02 : 1
                        }}
                        transition={{ 
                          delay: index * 0.15,
                          duration: 0.5,
                          ease: "easeOut"
                        }}
                        className={`relative flex items-center p-6 rounded-3xl border transition-all duration-500 ${
                          isActive
                            ? 'border-dermai-ai-400 bg-gradient-to-r from-dermai-ai-50 to-dermai-ai-100/50 shadow-premium'
                            : isCompleted
                            ? 'border-dermai-ai-300 bg-dermai-ai-50/70 shadow-premium'
                            : 'border-dermai-nude-200 bg-dermai-nude-50/30'
                        }`}
                      >
                        {/* Icône avec animation */}
                        <motion.div 
                          className={`relative w-14 h-14 rounded-full flex items-center justify-center mr-6 transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-br from-dermai-ai-500 to-dermai-ai-600 text-white shadow-glow'
                              : isCompleted
                              ? 'bg-gradient-to-br from-dermai-ai-600 to-dermai-ai-700 text-white shadow-glow'
                              : 'bg-dermai-neutral-200 text-dermai-neutral-500'
                          }`}
                          animate={isActive ? {
                            scale: [1, 1.1, 1],
                            boxShadow: [
                              "0 0 20px rgba(90, 74, 227, 0.3)",
                              "0 0 30px rgba(90, 74, 227, 0.6)",
                              "0 0 20px rgba(90, 74, 227, 0.3)"
                            ]
                          } : {}}
                          transition={{
                            duration: 2,
                            repeat: isActive ? Infinity : 0,
                            ease: "easeInOut"
                          }}
                        >
                          {isCompleted ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", delay: 0.2 }}
                            >
                              <CheckCircle2 className="w-6 h-6" />
                            </motion.div>
                          ) : (
                            <IconComponent className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                          )}
                        </motion.div>

                        {/* Contenu texte */}
                        <div className="flex-1">
                          <motion.h3 
                            className={`font-display font-semibold text-lg mb-1 transition-colors ${
                              isActive || isCompleted ? 'text-dermai-neutral-900' : 'text-dermai-neutral-500'
                            }`}
                            animate={isActive ? { 
                              color: ["#1A1A1A", "#5A4AE3", "#1A1A1A"] 
                            } : {}}
                            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                          >
                            {step.label}
                          </motion.h3>
                          
                          {/* Status text avec animation */}
                          <motion.div className="text-sm">
                            {isActive && (
                              <motion.p 
                                className="text-dermai-ai-600 font-medium"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                              >
                                <motion.span
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  En cours d'analyse...
                                </motion.span>
                              </motion.p>
                            )}
                            {isCompleted && (
                              <motion.p 
                                className="text-dermai-ai-700 font-medium flex items-center"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, type: "spring" }}
                              >
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3, type: "spring" }}
                                  className="w-2 h-2 bg-dermai-ai-600 rounded-full mr-2"
                                />
                                Terminé avec succès
                              </motion.p>
                            )}
                            {!isActive && !isCompleted && (
                              <p className="text-dermai-neutral-400">En attente...</p>
                            )}
                          </motion.div>
                        </div>

                        {/* Indicateur de progression */}
                        {isActive && (
                          <motion.div
                            className="absolute right-4 w-6 h-6"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <div className="w-6 h-6 border-2 border-dermai-ai-300 border-t-dermai-ai-600 rounded-full"></div>
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Informations sur l'analyse */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-gradient-to-br from-dermai-pure to-dermai-nude-50 border border-dermai-nude-200 rounded-3xl p-6 shadow-premium"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-dermai-neutral-900 flex items-center text-lg">
                      <motion.div 
                        className="w-8 h-8 bg-gradient-to-br from-dermai-ai-500 to-dermai-ai-600 rounded-full flex items-center justify-center mr-3 shadow-glow"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          boxShadow: [
                            "0 0 10px rgba(90, 74, 227, 0.3)",
                            "0 0 20px rgba(90, 74, 227, 0.5)",
                            "0 0 10px rgba(90, 74, 227, 0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Microscope className="w-4 h-4 text-white" />
                      </motion.div>
                      Détails de l'analyse
                    </h3>
                    <motion.span 
                      className="text-xs text-dermai-ai-600 font-medium bg-dermai-ai-50 px-3 py-1 rounded-full"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Ne quittez pas la page
                    </motion.span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center p-3 bg-dermai-pure rounded-2xl border border-dermai-nude-200">
                      <span className="text-dermai-neutral-600">Photos analysées :</span>
                      <span className="font-display font-semibold text-dermai-neutral-900">{sessionData.photos.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-dermai-pure rounded-2xl border border-dermai-nude-200">
                      <span className="text-dermai-neutral-600">Modèle IA :</span>
                      <span className="font-display font-semibold text-dermai-ai-600">DermAI Vision 4.0</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-dermai-pure rounded-2xl border border-dermai-nude-200">
                      <span className="text-dermai-neutral-600">Étape actuelle :</span>
                      <span className="font-display font-semibold text-dermai-neutral-900">{`${currentStep + 1}/${analysisSteps.length}`}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-dermai-pure rounded-2xl border border-dermai-nude-200">
                      <span className="text-dermai-neutral-600">Durée estimée :</span>
                      <span className="font-display font-semibold text-dermai-neutral-900">≈ 45–90 s</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-dermai-pure rounded-2xl border border-dermai-nude-200 md:col-span-2">
                      <span className="text-dermai-neutral-600">Type de peau détecté :</span>
                      <span className="font-display font-semibold text-dermai-ai-600">
                        {sessionData.questionnaire.userProfile?.skinType === 'Je ne sais pas' 
                          ? 'Analyse en cours par l\'IA...' 
                          : sessionData.questionnaire.userProfile?.skinType}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Note de sécurité */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="bg-gradient-to-br from-dermai-ai-50 to-dermai-ai-100/50 border border-dermai-ai-200 rounded-3xl p-6"
                >
                  <div className="flex items-start space-x-4">
                    <motion.div 
                      className="w-8 h-8 bg-gradient-to-br from-dermai-ai-500 to-dermai-ai-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-glow"
                      animate={{ 
                        boxShadow: [
                          "0 0 10px rgba(90, 74, 227, 0.3)",
                          "0 0 20px rgba(90, 74, 227, 0.5)",
                          "0 0 10px rgba(90, 74, 227, 0.3)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Shield className="w-4 h-4 text-white" />
                    </motion.div>
                    <div>
                      <h4 className="font-display font-semibold text-dermai-ai-900 mb-2 text-lg">Avertissement médical</h4>
                      <p className="text-sm text-dermai-ai-800 leading-relaxed">
                        Cette analyse est réalisée par intelligence artificielle et constitue un outil d'aide à la décision. 
                        Elle ne remplace pas un diagnostic médical professionnel. En cas de problème dermatologique 
                        persistant ou sévère, consultez un dermatologue qualifié.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
