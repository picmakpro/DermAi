'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getPhotoDataUrl } from '@/utils/storage/photoStore'

interface SummaryProps {
  photosCount: number
  selectedAgeRange: string
  data: {
    userProfile: {
      gender: string
      age: number
      skinType: string
    }
    skinConcerns: {
      primary: string[]
      otherText: string
    }
    currentRoutine: {
      morningProducts: string[]
      eveningProducts: string[]
      monthlyBudget: string
      routinePreference?: string
    }
    allergies: {
      ingredients: string[]
      pastReactions: string
    }
  }
  getConcernsDisplay: () => string
  hasRoutineProducts: () => boolean
  getRoutineDisplay: () => string
  isFormComplete: () => boolean
  handleSubmit: () => void
}

export default function ImprovedSummary({
  photosCount,
  selectedAgeRange,
  data,
  getConcernsDisplay,
  hasRoutineProducts,
  getRoutineDisplay,
  isFormComplete,
  handleSubmit
}: SummaryProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true)

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        // Récupérer les métadonnées depuis sessionStorage
        const photosData = sessionStorage.getItem('dermai_photos')
        if (photosData) {
          const photoMetas = JSON.parse(photosData)
          console.log('Métadonnées photos:', photoMetas)
          
          if (Array.isArray(photoMetas)) {
            // Récupérer les vraies photos depuis IndexedDB
            const photoPromises = photoMetas.map(async (meta) => {
              try {
                const dataUrl = await getPhotoDataUrl(meta.id)
                return dataUrl
              } catch (error) {
                console.warn(`Impossible de charger la photo ${meta.id}:`, error)
                return null
              }
            })
            
            const loadedPhotos = await Promise.all(photoPromises)
            const validPhotos = loadedPhotos.filter((photo): photo is string => 
              photo !== null && 
              typeof photo === 'string' && 
              photo.trim() !== '' && 
              photo.startsWith('data:image/')
            )
            
            setPhotos(validPhotos)
            console.log(`Photos chargées depuis IndexedDB: ${validPhotos.length}/${photoMetas.length}`)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des photos:', error)
      } finally {
        setIsLoadingPhotos(false)
      }
    }
    
    loadPhotos()
  }, [])

  return (
    <div className="card bg-dermai-pure border border-dermai-nude-200 rounded-2xl p-6 shadow-premium">
      <h3 className="font-semibold font-display text-dermai-neutral-800 mb-6 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 rounded-full flex items-center justify-center mr-3 shadow-glow">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zM8 8a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 3a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
        </div>
        Votre profil
      </h3>
      
      <div className="space-y-4">
        {/* Photos avec miniatures */}
        <div className="bg-dermai-nude-50 rounded-xl p-4">
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 bg-dermai-ai-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium text-dermai-neutral-800">Photos ({photosCount})</span>
          </div>
          
          {/* Affichage des miniatures */}
          {isLoadingPhotos ? (
            <div className="ml-9 flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-dermai-ai-500 border-t-transparent rounded-full"></div>
              <p className="text-sm text-dermai-neutral-500">Chargement des photos...</p>
            </div>
          ) : photos.length > 0 ? (
            <div className="ml-9 grid grid-cols-3 gap-2 max-w-48">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square bg-dermai-nude-100 rounded-lg overflow-hidden border border-dermai-nude-200">
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50px, 60px"
                    onError={(e) => {
                      console.warn(`Erreur de chargement pour la photo ${index + 1}`)
                    }}
                  />
                  <div className="absolute bottom-0 right-0 bg-dermai-ai-500 text-white text-xs px-1 py-0.5 rounded-tl-md">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dermai-neutral-600 ml-9">
              {photosCount} photo{photosCount > 1 ? 's' : ''} de votre visage uploadée{photosCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Profil personnel */}
        {selectedAgeRange && (
          <div className="bg-dermai-nude-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-dermai-ai-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium text-dermai-neutral-800">Profil personnel</span>
            </div>
            <div className="text-sm text-dermai-neutral-600 ml-9 space-y-1">
              <p><span className="font-medium text-dermai-neutral-700">Âge :</span> {selectedAgeRange}</p>
              {data.userProfile.gender !== 'Ne souhaite pas préciser' && (
                <p><span className="font-medium text-dermai-neutral-700">Genre :</span> {data.userProfile.gender}</p>
              )}
              <p><span className="font-medium text-dermai-neutral-700">Type de peau :</span> {data.userProfile.skinType === 'Je ne sais pas' ? 'L\'IA déterminera automatiquement' : data.userProfile.skinType}</p>
            </div>
          </div>
        )}

        {/* Préoccupations */}
        {data.skinConcerns.primary.length > 0 && (
          <div className="bg-dermai-nude-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-dermai-ai-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium text-dermai-neutral-800">Préoccupations cutanées</span>
            </div>
            <div className="text-sm text-dermai-neutral-600 ml-9">
              <p><span className="font-medium text-dermai-neutral-700">Principales préoccupations :</span></p>
              <p className="mt-1">
                {data.skinConcerns.primary.includes('Je ne sais pas') ? 
                  'L\'IA analysera automatiquement vos photos pour déterminer vos préoccupations' : 
                  getConcernsDisplay()
                }
              </p>
            </div>
          </div>
        )}

        {/* Routine actuelle */}
        {hasRoutineProducts() && (
          <div className="bg-dermai-nude-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-dermai-ai-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium text-dermai-neutral-800">Routine de soins actuelle</span>
            </div>
            <div className="text-sm text-dermai-neutral-600 ml-9">
              <p><span className="font-medium text-dermai-neutral-700">Produits utilisés :</span></p>
              <p className="mt-1">{getRoutineDisplay()}</p>
            </div>
          </div>
        )}

        {/* Préférences finales */}
        {(data.currentRoutine.routinePreference || data.currentRoutine.monthlyBudget) && (
          <div className="bg-dermai-nude-50 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-dermai-ai-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium text-dermai-neutral-800">Préférences personnalisées</span>
            </div>
            <div className="text-sm text-dermai-neutral-600 ml-9 space-y-1">
              {data.currentRoutine.routinePreference && (
                <p><span className="font-medium text-dermai-neutral-700">Type de routine souhaitée :</span> {data.currentRoutine.routinePreference}</p>
              )}
              <p><span className="font-medium text-dermai-neutral-700">Budget mensuel :</span> {data.currentRoutine.monthlyBudget}</p>
            </div>
          </div>
        )}

        {/* Allergies */}
        {data.allergies.ingredients.length > 0 && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium text-red-800">Allergies et sensibilités</span>
            </div>
            <div className="text-sm text-red-700 ml-9">
              <p><span className="font-medium text-red-800">Ingrédients à éviter :</span></p>
              <p className="mt-1">
                {data.allergies.ingredients.includes('Aucune allergie connue') 
                  ? 'Aucune allergie déclarée'
                  : data.allergies.ingredients.filter(i => i !== 'Aucune allergie connue').join(', ')
                }
              </p>
            </div>
          </div>
        )}

        {/* Réactions passées */}
        {data.allergies.pastReactions.trim() && (
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium text-yellow-800">Historique des réactions</span>
            </div>
            <div className="text-sm text-yellow-700 ml-9">
              <p><span className="font-medium text-yellow-800">Réactions passées :</span></p>
              <p className="mt-1 italic">{data.allergies.pastReactions}</p>
            </div>
          </div>
        )}
      </div>

      {/* Statut de complétion amélioré */}
      <div className="mt-6 pt-4 border-t border-dermai-nude-200">
        {isFormComplete() ? (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center text-sm text-green-700">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">Profil complet - Prêt pour l'analyse !</span>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center text-sm text-orange-700">
              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">Quelques informations manquantes</span>
            </div>
          </div>
        )}
      </div>

      {/* Bouton d'analyse - Desktop */}
      {isFormComplete() && (
        <div className="mt-4 hidden md:block">
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white font-semibold py-4 px-6 rounded-2xl shadow-premium hover:shadow-glow transition-all duration-300 hover-lift"
          >
            🚀 Lancer l'analyse DermAI
          </button>
        </div>
      )}

      {/* Bouton d'analyse - Mobile */}
      {isFormComplete() && (
        <div className="mt-4 md:hidden">
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white font-semibold py-4 px-6 rounded-2xl shadow-premium hover:shadow-glow transition-all duration-300 hover-lift"
          >
            🚀 Lancer l'analyse DermAI
          </button>
        </div>
      )}
    </div>
  )
}
