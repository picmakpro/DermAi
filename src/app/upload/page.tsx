'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, CheckCircle2, Shield, Zap } from 'lucide-react'
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
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            </div>

            {/* Step indicator */}
            <div className="text-right">
              <div className="text-sm text-gray-500">Étape 1 sur 4</div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full w-1/4 transition-all"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden"
        >
          {/* Hero section */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 p-8 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Camera className="w-10 h-10" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold mb-4"
              >
                Capturez votre peau
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl opacity-90 leading-relaxed"
              >
                Prenez quelques photos de votre visage pour que DermAI puisse analyser 
                votre peau avec une <strong>précision dermatologique</strong>
              </motion.p>
            </div>
          </div>

          <div className="p-8">
            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid md:grid-cols-3 gap-6 mb-8"
            >
              {[
                {
                  icon: <Shield className="w-6 h-6 text-green-500" />,
                  title: "Photos sécurisées",
                  description: "Vos données restent privées et ne sont jamais partagées"
                },
                {
                  icon: <Zap className="w-6 h-6 text-yellow-500" />,
                  title: "Analyse rapide",
                  description: "Résultats en moins de 2 minutes après l'upload"
                },
                {
                  icon: <CheckCircle2 className="w-6 h-6 text-blue-500" />,
                  title: "Qualité optimale",
                  description: "Guides intégrés pour prendre les meilleures photos"
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-gray-50 rounded-full">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </motion.div>

            {/* Tips Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6 mb-8"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-lg mr-2">💡</span>
                Conseils pour de meilleures photos
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Éclairage naturel de face (près d'une fenêtre)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Visage propre, sans maquillage si possible</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Plusieurs angles : face, profils, zones spécifiques</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Photos nettes, évitez les images floues</span>
                </div>
              </div>
            </motion.div>

            {/* Composant d'upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <PhotoUploadZone onPhotosChange={handlePhotosChange} />
            </motion.div>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200"
            >
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </button>
              
              <button
                onClick={handleContinue}
                disabled={photos.length === 0 || isUploading}
                className="flex items-center space-x-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Préparation...</span>
                  </>
                ) : (
                  <>
                    <span>Continuer vers le questionnaire</span>
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs">→</span>
                    </div>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="max-w-2xl mx-auto mt-8 text-center"
        >
          <div className="bg-white/60 backdrop-blur-sm border border-purple-200 rounded-2xl p-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-500" />
              <span>
                <strong>Confidentialité garantie :</strong> Vos photos sont sécurisées et ne sont utilisées que pour votre diagnostic
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}