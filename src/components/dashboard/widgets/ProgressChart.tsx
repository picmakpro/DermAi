'use client'

import { useEffect, useState } from 'react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'

const CRITERIA_OPTIONS = [
  { value: 'hydration', label: 'Hydratation', color: '#3B82F6' },
  { value: 'wrinkles', label: 'Rides', color: '#8B5CF6' },
  { value: 'texture', label: 'Texture', color: '#10B981' },
  { value: 'radiance', label: 'Éclat', color: '#F59E0B' },
  { value: 'elasticity', label: 'Élasticité', color: '#EF4444' },
  { value: 'sebum', label: 'Sébum', color: '#6366F1' },
  { value: 'sensitivity', label: 'Sensibilité', color: '#EC4899' },
  { value: 'darkSpots', label: 'Taches', color: '#14B8A6' }
]

interface ProgressData {
  date: string
  value: number
}

export function ProgressChart() {
  const [selectedCriteria, setSelectedCriteria] = useState('hydration')
  const [data, setData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchProgressData()
  }, [selectedCriteria])
  
  const fetchProgressData = async () => {
    try {
      // TODO: Remplacer par vraie API
      // const response = await fetch(
      //   `/api/analyses/progress?criteria=${selectedCriteria}&period=6months`
      // )
      // const progressData = await response.json()
      
      // Données mockées pour le développement
      const mockData = [
        { date: '2024-09-01', value: 65 },
        { date: '2024-10-01', value: 70 },
        { date: '2024-11-01', value: 75 },
        { date: '2024-12-01', value: 72 },
        { date: '2025-01-01', value: 78 },
        { date: '2025-02-01', value: 82 }
      ]
      
      setData(mockData)
    } catch (error) {
      console.error('Erreur chargement progression:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const selectedConfig = CRITERIA_OPTIONS.find(c => c.value === selectedCriteria)
  const maxValue = Math.max(...data.map(d => d.value), 100)
  const minValue = Math.min(...data.map(d => d.value), 0)
  
  return (
    <DashboardCard title="Évolution">
      {/* Sélecteur de critère */}
      <div className="mb-4">
        <select
          value={selectedCriteria}
          onChange={(e) => setSelectedCriteria(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          {CRITERIA_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Graphique simplifié */}
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      ) : data.length > 0 ? (
        <div className="h-48 flex items-end justify-between gap-2 p-4 bg-gray-50 rounded-lg">
          {data.map((point, index) => {
            const height = ((point.value - minValue) / (maxValue - minValue)) * 100
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                  style={{ 
                    height: `${Math.max(height, 5)}%`,
                    backgroundColor: selectedConfig?.color || '#8B5CF6'
                  }}
                />
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {new Date(point.date).toLocaleDateString('fr-FR', { 
                    month: 'short' 
                  })}
                </div>
                <div className="text-xs font-medium text-gray-700">
                  {point.value}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          Pas assez de données pour afficher l'évolution
        </div>
      )}
      
      {/* Légende */}
      {data.length > 0 && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">
            Évolution sur 6 mois - {selectedConfig?.label}
          </span>
        </div>
      )}
    </DashboardCard>
  )
}













