'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Share2, 
  Trash2,
  MoreHorizontal 
} from 'lucide-react'
import { useState } from 'react'

interface AnalysisCardProps {
  analysis: {
    id: string
    created_at: string
    analysis_data: {
      globalScore: number
      scores: Record<string, number>
    }
    photos_metadata?: Array<{
      url: string
      angle: string
    }>
    improvement_vs_previous?: number
  }
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  
  const getImprovementIcon = (improvement?: number) => {
    if (!improvement) return <Minus className="h-4 w-4 text-gray-400" />
    if (improvement > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (improvement < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }
  
  const getImprovementText = (improvement?: number) => {
    if (!improvement) return "Première analyse"
    if (improvement > 0) return `+${improvement}% d'amélioration`
    if (improvement < 0) return `${improvement}% de régression`
    return "Stable"
  }
  
  const getImprovementColor = (improvement?: number) => {
    if (!improvement) return "text-gray-600"
    if (improvement > 0) return "text-green-600"
    if (improvement < 0) return "text-red-600"
    return "text-gray-600"
  }
  
  // Calculer les 3 meilleurs scores
  const topScores = Object.entries(analysis.analysis_data.scores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
  
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex gap-6">
          {/* Photo principale */}
          <div className="flex-shrink-0">
            {analysis.photos_metadata?.[0] ? (
              <img
                src={analysis.photos_metadata[0].url}
                alt="Photo d'analyse"
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Pas de photo</span>
              </div>
            )}
          </div>
          
          {/* Contenu principal */}
          <div className="flex-1 space-y-3">
            {/* Header avec date et actions */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">
                  {formatDistanceToNow(new Date(analysis.created_at), {
                    addSuffix: true,
                    locale: fr
                  })}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {analysis.analysis_data.globalScore}/100
                  </span>
                  {getImprovementIcon(analysis.improvement_vs_previous)}
                  <span className={`text-sm ${getImprovementColor(analysis.improvement_vs_previous)}`}>
                    {getImprovementText(analysis.improvement_vs_previous)}
                  </span>
                </div>
              </div>
              
              {/* Menu actions */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                    <Link
                      href={`/dashboard/analyses/compare?ids=${analysis.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Comparer
                    </Link>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 w-full text-left">
                      <Share2 className="h-4 w-4" />
                      Partager
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-red-600 w-full text-left">
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Scores principaux */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Points forts
              </p>
              <div className="flex gap-4">
                {topScores.map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {value}
                    </div>
                    <div className="text-xs text-gray-600 capitalize">
                      {key}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions principales */}
        <div className="flex gap-3 mt-4 pt-4 border-t">
          <Link
            href={`/dashboard/analyses/${analysis.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm"
          >
            <Eye className="h-4 w-4" />
            Voir détails
          </Link>
          <Link
            href={`/dashboard/analyses/compare?ids=${analysis.id}`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            <TrendingUp className="h-4 w-4" />
            Comparer
          </Link>
        </div>
      </div>
    </div>
  )
}










