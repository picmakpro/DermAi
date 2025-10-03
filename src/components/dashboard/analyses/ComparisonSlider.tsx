'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ComparisonSliderProps {
  beforePhotos: Array<{ url: string; angle: string }>
  afterPhotos: Array<{ url: string; angle: string }>
  beforeDate: string
  afterDate: string
}

export function ComparisonSlider({ 
  beforePhotos, 
  afterPhotos, 
  beforeDate, 
  afterDate 
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
  
  // Utiliser la première photo si pas de correspondance d'angle
  const beforePhoto = beforePhotos[selectedPhotoIndex] || beforePhotos[0]
  const afterPhoto = afterPhotos[selectedPhotoIndex] || afterPhotos[0]
  
  return (
    <div className="space-y-4">
      {/* Slider principal */}
      <div 
        className="relative overflow-hidden rounded-lg cursor-col-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        style={{ paddingBottom: '75%' }} // Ratio 4:3
      >
        {/* Photo après (base) */}
        <img
          src={afterPhoto?.url || '/images/face-model.png'}
          alt="Après"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Photo avant (overlay avec clip) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforePhoto?.url || '/images/face-model.png'}
            alt="Avant"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </div>
        
        {/* Ligne de séparation */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-col-resize">
            <ChevronLeft className="h-3 w-3 text-gray-600 -mr-0.5" />
            <ChevronRight className="h-3 w-3 text-gray-600 -ml-0.5" />
          </div>
        </div>
        
        {/* Labels avec dates */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
          Avant - {formatDate(beforeDate)}
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
          Après - {formatDate(afterDate)}
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-xs rounded-full">
          Glissez pour comparer
        </div>
      </div>
      
      {/* Sélection photo si multiple angles */}
      {beforePhotos.length > 1 && (
        <div className="flex justify-center space-x-4">
          {beforePhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedPhotoIndex(index)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                index === selectedPhotoIndex
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {photo.angle === 'front' ? 'Face' : 
               photo.angle === 'left' ? 'Profil G' : 
               photo.angle === 'right' ? 'Profil D' : 
               `Angle ${index + 1}`}
            </button>
          ))}
        </div>
      )}
      
      {/* Indicateur position */}
      <div className="text-center text-sm text-gray-600">
        Position: {Math.round(sliderPosition)}% 
        {sliderPosition < 25 ? ' (Plus d\'avant)' : 
         sliderPosition > 75 ? ' (Plus d\'après)' : 
         ' (Équilibré)'}
      </div>
    </div>
  )
}






