'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ScoreComparisonProps {
  analyses: Array<{
    id: string
    created_at: string
    analysis_data: {
      globalScore: number
      scores: Record<string, number>
    }
  }>
}

const CRITERIA_LABELS = {
  hydration: 'Hydratation',
  texture: 'Texture',
  radiance: 'Éclat',
  wrinkles: 'Rides',
  elasticity: 'Élasticité',
  sebum: 'Sébum',
  sensitivity: 'Sensibilité',
  darkSpots: 'Taches'
}

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6']

export function ScoreComparison({ analyses }: ScoreComparisonProps) {
  const [viewMode, setViewMode] = useState<'line' | 'radar'>('line')
  
  // Préparer les données pour le graphique linéaire
  const lineChartData = Object.keys(CRITERIA_LABELS).map(criterion => {
    const dataPoint: any = {
      criterion: CRITERIA_LABELS[criterion as keyof typeof CRITERIA_LABELS]
    }
    
    analyses.forEach((analysis, index) => {
      dataPoint[`analyse_${index + 1}`] = analysis.analysis_data.scores[criterion] || 0
    })
    
    return dataPoint
  })
  
  // Préparer les données pour le radar chart
  const radarData = Object.keys(CRITERIA_LABELS).map(criterion => ({
    criterion: CRITERIA_LABELS[criterion as keyof typeof CRITERIA_LABELS],
    ...analyses.reduce((acc, analysis, index) => {
      acc[`A${index + 1}`] = analysis.analysis_data.scores[criterion] || 0
      return acc
    }, {} as Record<string, number>)
  }))
  
  // Calculer les améliorations entre analyses
  const getImprovement = (criterion: string, fromIndex: number, toIndex: number) => {
    const fromScore = analyses[fromIndex]?.analysis_data.scores[criterion] || 0
    const toScore = analyses[toIndex]?.analysis_data.scores[criterion] || 0
    return toScore - fromScore
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Comparaison scores globaux */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Évolution des Scores Globaux
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyses.map((analysis, index) => (
            <div key={analysis.id} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {analysis.analysis_data.globalScore}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {formatDate(analysis.created_at)}
              </div>
              
              {index > 0 && (
                <div className="flex items-center justify-center gap-1">
                  {(() => {
                    const improvement = analysis.analysis_data.globalScore - analyses[index - 1].analysis_data.globalScore
                    if (improvement > 0) {
                      return (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">+{improvement}</span>
                        </>
                      )
                    } else if (improvement < 0) {
                      return (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">{improvement}</span>
                        </>
                      )
                    } else {
                      return (
                        <>
                          <Minus className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">0</span>
                        </>
                      )
                    }
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Graphiques détaillés */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Comparaison Détaillée par Critère
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('line')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'line'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Linéaire
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'radar'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Radar
            </button>
          </div>
        </div>
        
        <div className="h-96">
          {viewMode === 'line' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="criterion" 
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {analyses.map((analysis, index) => (
                  <Line
                    key={analysis.id}
                    type="monotone"
                    dataKey={`analyse_${index + 1}`}
                    stroke={COLORS[index]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[index], r: 4 }}
                    name={`Analyse ${index + 1} (${formatDate(analysis.created_at)})`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis 
                  dataKey="criterion" 
                  tick={{ fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                {analyses.map((analysis, index) => (
                  <Radar
                    key={analysis.id}
                    name={`A${index + 1} (${formatDate(analysis.created_at)})`}
                    dataKey={`A${index + 1}`}
                    stroke={COLORS[index]}
                    fill={COLORS[index]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      {/* Tableau des améliorations */}
      {analyses.length === 2 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Détail des Améliorations
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Critère</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Avant</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Après</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Évolution</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(CRITERIA_LABELS).map(([key, label]) => {
                  const beforeScore = analyses[0].analysis_data.scores[key] || 0
                  const afterScore = analyses[1].analysis_data.scores[key] || 0
                  const improvement = afterScore - beforeScore
                  
                  return (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{label}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{beforeScore}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{afterScore}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {improvement > 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 font-medium">+{improvement}</span>
                            </>
                          ) : improvement < 0 ? (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-red-600 font-medium">{improvement}</span>
                            </>
                          ) : (
                            <>
                              <Minus className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-400">0</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}






