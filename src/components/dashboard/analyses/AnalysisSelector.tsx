'use client'

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Check } from 'lucide-react'

interface AnalysisSelectorProps {
  analyses: Array<{
    id: string
    created_at: string
    analysis_data: {
      globalScore: number
    }
    photos_metadata?: Array<{ url: string }>
  }>
  selectedIds: string[]
  onSelect: (id: string) => void
  maxSelections: number
}

export function AnalysisSelector({ 
  analyses, 
  selectedIds, 
  onSelect, 
  maxSelections 
}: AnalysisSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Sélectionner les analyses à comparer
        </h3>
        <span className="text-sm text-gray-600">
          {selectedIds.length}/{maxSelections} sélectionnées
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {analyses.map((analysis) => {
          const isSelected = selectedIds.includes(analysis.id)
          const canSelect = !isSelected && selectedIds.length < maxSelections
          
          return (
            <button
              key={analysis.id}
              onClick={() => onSelect(analysis.id)}
              disabled={!isSelected && !canSelect}
              className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-violet-500 bg-violet-50'
                  : canSelect
                  ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
              }`}
            >
              {/* Photo miniature */}
              <div className="relative mb-3">
                <img
                  src={analysis.photos_metadata?.[0]?.url || '/images/face-model.png'}
                  alt="Miniature analyse"
                  className="w-full aspect-square rounded object-cover"
                />
                
                {/* Checkbox de sélection */}
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? 'bg-violet-600 border-violet-600'
                    : 'bg-white border-gray-300'
                }`}>
                  {isSelected && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
              
              {/* Informations */}
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {formatDistanceToNow(new Date(analysis.created_at), {
                    addSuffix: true,
                    locale: fr
                  })}
                </p>
                <p className="font-semibold text-gray-900">
                  Score: {analysis.analysis_data.globalScore}/100
                </p>
              </div>
              
              {/* Badge ordre de sélection */}
              {isSelected && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-violet-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {selectedIds.indexOf(analysis.id) + 1}
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {selectedIds.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Cliquez sur les analyses que vous souhaitez comparer
        </div>
      )}
      
      {selectedIds.length === maxSelections && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Limite atteinte. Désélectionnez une analyse pour en choisir une autre.
          </p>
        </div>
      )}
    </div>
  )
}
