'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, CheckCircle2, Shield, Zap, Info } from 'lucide-react'
import PhotoUploadZone from '@/components/upload/PhotoUploadZone'
import type { PhotoUpload } from '@/types'
import { savePhotoDataUrl } from '@/utils/storage/photoStore'

export default function UploadPage() {
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()



  const handlePhotosChange = (newPhotos: PhotoUpload[]) => {
    setPhotos(newPhotos)
  }

  const handleContinue = async () => {
    if (photos.length === 0) {
      alert('Veuillez sélectionner au moins une photo')
      return
    }

    setIsUploading(true)

    try {
      // Stocker les dataURL en IndexedDB pour éviter le quota sessionStorage
      const meta = [] as Array<{ id: string; type: PhotoUpload['type']; quality: PhotoUpload['quality']; preview: string }>
      for (const photo of photos) {
        const dataUrl = await convertFileToBase64(photo.file)
        await savePhotoDataUrl(photo.id, dataUrl)
        meta.push({ id: photo.id, type: photo.type, quality: photo.quality, preview: photo.preview })
      }
      // Ne mettre que les métadonnées légères dans sessionStorage
      sessionStorage.setItem('dermai_photos', JSON.stringify(meta))
      
      // Rediriger vers le formulaire
      router.push('/questionnaire')
    } catch (error) {
      console.error('Erreur lors de la conversion des photos:', error)
      alert('Erreur lors du traitement des photos')
    } finally {
      setIsUploading(false)
    }
  }

  // Helper function pour convertir File en base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
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
              <div className="w-3 h-3 bg-dermai-neutral-300 rounded-full"></div>
              <div className="w-3 h-3 bg-dermai-neutral-300 rounded-full"></div>
              <div className="w-3 h-3 bg-dermai-neutral-300 rounded-full"></div>
            </div>

            {/* Step indicator */}
            <div className="text-right">
              <div className="text-sm text-dermai-neutral-500">Étape 1 sur 4</div>
              <div className="w-32 bg-dermai-neutral-200 rounded-full h-2 mt-1">
                <div className="bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 h-2 rounded-full w-1/4 transition-all shadow-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section avec espacements harmonisés */}
      <div className="h-[75vh] md:h-[80vh] bg-gradient-to-br from-dermai-nude-200 via-dermai-nude-100 to-dermai-ai-100 relative overflow-hidden">
        {/* Formes organiques flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-gradient-to-br from-dermai-ai-200/30 to-dermai-nude-300/20 animate-float"
              style={{
                left: `${5 + i * 12}%`,
                top: `${10 + (i % 4) * 25}%`,
                width: `${15 + (i % 3) * 10}px`,
                height: `${15 + (i % 3) * 10}px`,
                borderRadius: `${40 + (i % 2) * 20}% ${60 + (i % 3) * 15}% ${45 + (i % 2) * 10}% ${55 + (i % 3) * 20}%`,
                opacity: 0.2 + (i % 3) * 0.1,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${5 + (i % 2) * 3}s`
              }}
            />
          ))}
        </div>

        {/* Stack vertical héros : Camera → Titre → Paragraphe → Icônes */}
        <div className="h-full flex flex-col justify-center items-center px-4 py-8 md:py-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 md:space-y-6"
          >
            {/* Icône caméra principale */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-white/40 backdrop-blur-sm flex items-center justify-center mx-auto shadow-lg"
              style={{ borderRadius: '48% 52% 44% 56%' }}
            >
              <Camera className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-dermai-ai-600" />
            </motion.div>
            
            {/* Titre */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold font-display text-dermai-neutral-800"
            >
              Capturez votre peau
            </motion.h1>
            
            {/* Paragraphe */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base md:text-lg lg:text-xl opacity-80 leading-relaxed text-dermai-neutral-700 max-w-2xl mx-auto"
            >
              Prenez quelques photos de votre visage pour que DermAI puisse analyser 
              votre peau avec une <strong className="font-display text-dermai-ai-700">précision dermatologique</strong>
            </motion.p>
          </motion.div>

          {/* Rangée d'icônes avec espacement harmonisé */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-row justify-center gap-4 md:gap-8 lg:gap-12 w-full max-w-4xl"
            style={{ 
              marginTop: 'var(--hero-gap-target)',
              marginBottom: 'var(--hero-gap-target)'
            }}
          >
            {[
              {
                icon: <Shield className="w-6 h-6 md:w-7 md:h-7 text-dermai-ai-600" />,
                title: "Photos sécurisées",
                description: "Vos données restent privées et ne sont jamais partagées",
                bgColor: "bg-white/60"
              },
              {
                icon: <Zap className="w-6 h-6 md:w-7 md:h-7 text-dermai-ai-600" />,
                title: "Analyse rapide",
                description: "Résultats en moins de 2 minutes après l'upload",
                bgColor: "bg-white/60"
              },
              {
                icon: <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7 text-dermai-ai-600" />,
                title: "Qualité optimale",
                description: "Guides intégrés pour prendre les meilleures photos",
                bgColor: "bg-white/60"
              }
            ].map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-center hover-lift transition-all duration-300 flex-1 max-w-xs"
              >
                <div className="flex justify-center mb-3 md:mb-4">
                  <div className={`p-3 md:p-4 ${item.bgColor} backdrop-blur-sm rounded-2xl hover-glow transition-all duration-300 shadow-lg`}>
                    {item.icon}
                  </div>
                </div>
                <h3 className="font-semibold font-display text-dermai-neutral-800 text-sm md:text-base lg:text-lg mb-2">{item.title}</h3>
                {/* Texte descriptif visible uniquement sur desktop */}
                <p className="hidden lg:block text-sm text-dermai-neutral-600 opacity-80">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Contenu principal - Sections Upload et Conseils avec chevauchement contrôlé */}
      <div 
        className="max-w-5xl mx-auto px-4 relative z-20"
        style={{ 
          transform: 'translateY(calc(var(--hero-overlap) * -1))'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-8 md:space-y-12"
        >
          {/* Section Upload avec bouton d'action clair - Effet de superposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="card bg-dermai-pure rounded-3xl shadow-premium border border-dermai-nude-200 overflow-hidden shadow-2xl backdrop-blur-sm bg-dermai-pure/95"
          >
            <div className="p-6 md:p-8 lg:p-10">
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold font-display text-dermai-neutral-900 mb-3">
                  Ajoutez vos photos
                </h2>
                <p className="text-dermai-neutral-600 text-sm md:text-base">
                  Glissez-déposez vos photos ou utilisez le bouton ci-dessous
                </p>
              </div>
              
              <PhotoUploadZone onPhotosChange={handlePhotosChange} />
              
              {/* Bouton d'action clair et proéminent */}
              <div className="text-center mt-6 md:mt-8">
                <button
                  onClick={() => document.getElementById('photo-input')?.click()}
                  className="btn-primary inline-flex items-center space-x-3 font-semibold py-4 px-8 rounded-2xl transition-all transform hover:scale-105 text-base md:text-lg"
                >
                  <Camera className="w-5 h-5 md:w-6 md:h-6" />
                  <span>Ajouter vos photos</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tips Section repositionnée après upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="card-glass bg-gradient-to-r from-dermai-nude-50 to-dermai-ai-50 border border-dermai-nude-200 rounded-2xl p-6 md:p-8"
          >
            <h3 className="font-semibold font-display text-dermai-neutral-900 mb-4 md:mb-6 flex items-center text-lg md:text-xl">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-dermai-ai-100 rounded-full flex items-center justify-center mr-3">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-dermai-ai-600" />
              </div>
              Conseils pour prendre vos photos
            </h3>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-dermai-ai-500 mt-0.5 flex-shrink-0" />
                <span className="text-dermai-neutral-700">Éclairage naturel de face</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-dermai-ai-500 mt-0.5 flex-shrink-0" />
                <span className="text-dermai-neutral-700">Visage propre, sans maquillage</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-dermai-ai-500 mt-0.5 flex-shrink-0" />
                <span className="text-dermai-neutral-700">Plusieurs angles différents</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-dermai-ai-500 mt-0.5 flex-shrink-0" />
                <span className="text-dermai-neutral-700">Photos nettes et claires</span>
              </div>
            </div>
          </motion.div>

          {/* Navigation - Optimisée pour mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-col sm:flex-row justify-between items-center mt-8 md:mt-12 pt-6 md:pt-8 border-t border-dermai-nude-200 gap-4 md:gap-6"
          >
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-dermai-neutral-600 hover:text-dermai-neutral-900 transition-colors focus-dermai order-2 sm:order-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm md:text-base">Retour à l'accueil</span>
            </button>
            
            <button
              onClick={handleContinue}
              disabled={photos.length === 0 || isUploading}
              className="btn-primary flex items-center justify-center space-x-2 md:space-x-3 font-semibold py-3 px-4 md:px-6 lg:px-8 rounded-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto order-1 sm:order-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                  <span className="text-sm md:text-base">Préparation...</span>
                </>
              ) : (
                <>
                  {/* Mobile : mot seul, Desktop : phrase complète */}
                  <span className="sm:hidden text-sm">Continuer</span>
                  <span className="hidden sm:inline text-sm md:text-base">Continuer vers le questionnaire</span>
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">→</span>
                  </div>
                </>
              )}
            </button>
          </motion.div>
        </motion.div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="max-w-2xl mx-auto mt-8 text-center"
        >
          <div className="card-glass bg-dermai-pure/60 backdrop-blur-sm border border-dermai-nude-200 rounded-2xl p-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-dermai-neutral-600">
              <Shield className="w-4 h-4 text-dermai-ai-500" />
              <span>
                <strong className="text-dermai-neutral-900">Confidentialité garantie :</strong> Vos photos sont sécurisées et ne sont utilisées que pour votre diagnostic
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}