'use client'

import { useState, useEffect } from 'react'
import { ComparisonSlider } from './ComparisonSlider'
import { ScoreComparison } from './ScoreComparison'
import { AnalysisSelector } from './AnalysisSelector'

interface ComparisonInterfaceProps {
  preselectedIds: string[]
}

// Données mockées pour le développement
const mockAnalyses = [
  {
    id: '1',
    created_at: '2025-09-15T10:30:00Z',
    analysis_data: {
      globalScore: 78,
      scores: {
        hydration: 85,
        texture: 72,
        radiance: 80,
        wrinkles: 65,
        elasticity: 75,
        sebum: 70,
        sensitivity: 88,
        darkSpots: 60
      }
    },
    photos_metadata: [
      { url: '/images/face-model.png', angle: 'front' },
      { url: '/images/face-model.png', angle: 'left' },
      { url: '/images/face-model.png', angle: 'right' }
    ]
  },
  {
    id: '2',
    created_at: '2025-09-01T14:20:00Z',
    analysis_data: {
      globalScore: 66,
      scores: {
        hydration: 70,
        texture: 65,
        radiance: 68,
        wrinkles: 60,
        elasticity: 70,
        sebum: 75,
        sensitivity: 80,
        darkSpots: 55
      }
    },
    photos_metadata: [
      { url: '/images/face-model.png', angle: 'front' },
      { url: '/images/face-model.png', angle: 'left' },
      { url: '/images/face-model.png', angle: 'right' }
    ]
  }
]

export function ComparisonInterface({ preselectedIds }: ComparisonInterfaceProps) {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([])
  const [analyses, setAnalyses] = useState(mockAnalyses)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (preselectedIds.length > 0) {
      setSelectedAnalyses(preselectedIds.slice(0, 4)) // Max 4 analyses
    }
  }, [preselectedIds])
  
  const handleAnalysisSelect = (analysisId: string) => {
    setSelectedAnalyses(prev => {
      if (prev.includes(analysisId)) {
        return prev.filter(id => id !== analysisId)
      } else if (prev.length < 4) {
        return [...prev, analysisId]
      }
      return prev
    })
  }
  
  const selectedAnalysisData = analyses.filter(a => selectedAnalyses.includes(a.id))
  
  const canCompare = selectedAnalysisData.length >= 2
  
  return (
    <div className="space-y-8">
      {/* Sélecteur d'analyses */}
      <AnalysisSelector
        analyses={analyses}
        selectedIds={selectedAnalyses}
        onSelect={handleAnalysisSelect}
        maxSelections={4}
      />
      
      {canCompare ? (
        <>
          {/* Comparaison photos */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Comparaison Photos
            </h3>
            
            {selectedAnalysisData.length === 2 ? (
              <ComparisonSlider
                beforePhotos={selectedAnalysisData[1].photos_metadata || []}
                afterPhotos={selectedAnalysisData[0].photos_metadata || []}
                beforeDate={selectedAnalysisData[1].created_at}
                afterDate={selectedAnalysisData[0].created_at}
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedAnalysisData.map((analysis, index) => (
                  <div key={analysis.id} className="text-center">
                    <div className="relative">
                      <img
                        src={analysis.photos_metadata?.[0]?.url || '/images/face-model.png'}
                        alt={`Analyse ${index + 1}`}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                        {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Score: {analysis.analysis_data.globalScore}/100
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Comparaison scores */}
          <ScoreComparison analyses={selectedAnalysisData} />
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sélectionnez au moins 2 analyses
          </h3>
          <p className="text-gray-600">
            Choisissez 2 à 4 analyses pour voir votre évolution
          </p>
        </div>
      )}
    </div>
  )
}

