'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUploadZone from '@/components/upload/PhotoUploadZone'
import type { PhotoUpload } from '@/types'

export default function UploadPage() {
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const handlePhotosChange = (newPhotos: PhotoUpload[]) => {
    setPhotos(newPhotos)
  }

  const handleContinue = () => {
    if (photos.length === 0) {
      alert('Veuillez sélectionner au moins une photo')
      return
    }

    // Stocker les photos dans sessionStorage pour la suite
    const photosData = photos.map(photo => ({
      id: photo.id,
      preview: photo.preview,
      type: photo.type,
      quality: photo.quality,
      fileName: photo.file.name,
      size: photo.file.size
    }))
    
    sessionStorage.setItem('dermAI_photos', JSON.stringify(photosData))
    sessionStorage.setItem('dermAI_files', JSON.stringify(photos.map(p => p.file)))
    
    // Rediriger vers le formulaire
    router.push('/questionnaire')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upload de photos</h1>
              <p className="text-gray-600 mt-1">Étape 1 sur 3 • Analyse DermAI</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progression</div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-blue-500 h-2 rounded-full w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          
          {/* Introduction */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Téléchargez vos photos de peau
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Pour une analyse précise, notre IA a besoin de photos de qualité de votre peau. 
              Plus vous fournissez d'angles différents, plus l'analyse sera détaillée.
            </p>
          </div>

          {/* Composant d'upload */}
          <PhotoUploadZone onPhotosChange={handlePhotosChange} />

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              ← Retour
            </button>
            
            <button
              onClick={handleContinue}
              disabled={photos.length === 0 || isUploading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}