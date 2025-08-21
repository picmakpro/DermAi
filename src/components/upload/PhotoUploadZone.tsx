'use client'

import { useState, useCallback } from 'react'
import { PHOTO_TYPES, MAX_PHOTOS, MAX_FILE_SIZE } from '@/constants'
import { validateImage } from '@/utils/validation'
import { ensureCompatibleImage } from '@/utils/images/ensureCompatibleImage'
import type { PhotoUpload, PhotoType } from '@/types'

interface PhotoUploadZoneProps {
  onPhotosChange: (photos: PhotoUpload[]) => void
  maxPhotos?: number
}

export default function PhotoUploadZone({ 
  onPhotosChange, 
  maxPhotos = MAX_PHOTOS 
}: PhotoUploadZoneProps) {
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newErrors: string[] = []
    const validPhotos: PhotoUpload[] = []

    // Vérifier le nombre total
    if (photos.length + fileArray.length > maxPhotos) {
      newErrors.push(`Maximum ${maxPhotos} photos autorisées`)
      setErrors(newErrors)
      return
    }

    // Convertir si nécessaire puis valider chaque fichier
    for (let i = 0; i < fileArray.length; i++) {
      const original = fileArray[i]
      const { file } = await ensureCompatibleImage(original)
      const validation = await validateImage(file)
      
      if (validation.valid) {
        const photoUpload: PhotoUpload = {
          id: `photo_${Date.now()}_${i}`,
          file,
          preview: URL.createObjectURL(file),
          type: 'face-frontal', // Default type
          quality: 'good'
        }
        validPhotos.push(photoUpload)
      } else {
        newErrors.push(`${file.name}: ${validation.error}`)
      }
    }

    // Mettre à jour l'état
    const updatedPhotos = [...photos, ...validPhotos]
    setPhotos(updatedPhotos)
    onPhotosChange(updatedPhotos)
    setErrors(newErrors)
  }, [photos, maxPhotos, onPhotosChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removePhoto = (id: string) => {
    const updatedPhotos = photos.filter(photo => {
      if (photo.id === id) {
        URL.revokeObjectURL(photo.preview) // Nettoyer la mémoire
        return false
      }
      return true
    })
    setPhotos(updatedPhotos)
    onPhotosChange(updatedPhotos)
  }

  const updatePhotoType = (id: string, newType: PhotoType) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, type: newType } : photo
    )
    setPhotos(updatedPhotos)
    onPhotosChange(updatedPhotos)
  }

  return (
    <div className="space-y-6">
      {/* Zone de drop */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => {
          if (photos.length < maxPhotos) {
            document.getElementById('photo-input')?.click()
          }
        }}
      >
        <input
          id="photo-input"
          type="file"
          multiple
          accept="image/heic,image/heif,image/avif,image/jpeg,image/jpg,image/png,image/webp,image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
          disabled={photos.length >= maxPhotos}
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {photos.length >= maxPhotos ? 'Limite atteinte' : 'Ajoutez vos photos'}
            </h3>
            <p className="text-gray-600 mt-2">
              {photos.length >= maxPhotos 
                ? `Maximum ${maxPhotos} photos atteint`
                : `Glissez-déposez ou cliquez pour sélectionner (${photos.length}/${maxPhotos})`
              }
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Formats acceptés: JPG, PNG, WebP, HEIC/HEIF, AVIF. Les photos non supportées sont converties automatiquement en JPEG. • Max {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB par photo
            </p>
          </div>
        </div>
      </div>

      {/* Erreurs */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-700 mb-2">Erreurs détectées :</h4>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-600">• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Aperçu des photos */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Photos sélectionnées :</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  {/* Miniature */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img 
                      src={photo.preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        Photo {photos.indexOf(photo) + 1}
                      </span>
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Sélecteur de type */}
                    <select
                      value={photo.type}
                      onChange={(e) => updatePhotoType(photo.id, e.target.value as PhotoType)}
                      className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.entries(PHOTO_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {(photo.file.size / (1024 * 1024)).toFixed(1)}MB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guide des types de photos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📸 Guide des photos recommandées :</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
          <div>• <strong>Face frontale :</strong> Vue d'ensemble du visage</div>
          <div>• <strong>Close-up zone :</strong> Zoom sur la zone problématique</div>
          <div>• <strong>Profils :</strong> Vues latérales gauche/droite</div>
          <div>• <strong>Texture macro :</strong> Très gros plan sur la texture</div>
        </div>
      </div>
    </div>
  )
}
