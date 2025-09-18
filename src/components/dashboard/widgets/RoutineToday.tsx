'use client'

import { useEffect, useState } from 'react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { Check, Clock, Sun, Moon } from 'lucide-react'
import Link from 'next/link'

interface Product {
  name: string
  brand?: string
}

interface RoutineData {
  morning: { products: Product[]; completed: boolean }
  evening: { products: Product[]; completed: boolean }
  currentStreak: number
}

export function RoutineToday() {
  const [routine, setRoutine] = useState<RoutineData>({
    morning: { products: [], completed: false },
    evening: { products: [], completed: false },
    currentStreak: 0
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchTodayRoutine()
  }, [])
  
  const fetchTodayRoutine = async () => {
    try {
      // TODO: Remplacer par vraie API
      // const response = await fetch('/api/routine/today')
      // const data = await response.json()
      // setRoutine(data)
      
      // Données mockées pour le développement
      const mockRoutine = {
        morning: {
          products: [
            { name: 'Nettoyant doux', brand: 'CeraVe' },
            { name: 'Sérum Vitamine C', brand: 'The Ordinary' },
            { name: 'Crème hydratante', brand: 'Neutrogena' },
            { name: 'Crème solaire SPF50', brand: 'La Roche-Posay' }
          ],
          completed: true
        },
        evening: {
          products: [
            { name: 'Démaquillant', brand: 'Bioderma' },
            { name: 'Nettoyant doux', brand: 'CeraVe' },
            { name: 'Sérum Rétinol', brand: 'The Ordinary' },
            { name: 'Crème de nuit', brand: 'Olay' }
          ],
          completed: false
        },
        currentStreak: 7
      }
      
      setRoutine(mockRoutine)
    } catch (error) {
      console.error('Erreur chargement routine:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleTogglePhase = async (phase: 'morning' | 'evening') => {
    try {
      // TODO: Remplacer par vraie API
      // await fetch('/api/routine/completions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     completion_date: new Date().toISOString().split('T')[0],
      //     phase,
      //     completed: !routine[phase].completed
      //   })
      // })
      
      // Mise à jour locale
      setRoutine(prev => ({
        ...prev,
        [phase]: {
          ...prev[phase],
          completed: !prev[phase].completed
        }
      }))
    } catch (error) {
      console.error('Erreur mise à jour routine:', error)
    }
  }
  
  if (loading) {
    return (
      <DashboardCard title="Routine du Jour">
        <div className="space-y-4">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>
                <div className="space-y-1 ml-7">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardCard>
    )
  }
  
  return (
    <DashboardCard
      title="Routine du Jour"
      action={
        <Link 
          href="/dashboard/routine"
          className="text-sm text-violet-600 hover:text-violet-700"
        >
          Voir calendrier →
        </Link>
      }
    >
      {/* Streak actuel */}
      {routine.currentStreak > 0 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            🔥 Série actuelle : {routine.currentStreak} jours
          </p>
        </div>
      )}
      
      {/* Phases matin/soir */}
      <div className="space-y-4">
        {/* Phase Matin */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Routine Matin</span>
            </div>
            <button
              onClick={() => handleTogglePhase('morning')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                routine.morning.completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {routine.morning.completed ? (
                <>
                  <Check className="h-4 w-4" />
                  Complétée
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  À faire
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-1 ml-7">
            {routine.morning.products.map((product, index) => (
              <div key={index} className="text-sm text-gray-600">
                {index + 1}. {product.name}
                {product.brand && (
                  <span className="text-gray-400 ml-1">({product.brand})</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Phase Soir */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-indigo-500" />
              <span className="font-medium">Routine Soir</span>
            </div>
            <button
              onClick={() => handleTogglePhase('evening')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                routine.evening.completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {routine.evening.completed ? (
                <>
                  <Check className="h-4 w-4" />
                  Complétée
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  À faire
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-1 ml-7">
            {routine.evening.products.map((product, index) => (
              <div key={index} className="text-sm text-gray-600">
                {index + 1}. {product.name}
                {product.brand && (
                  <span className="text-gray-400 ml-1">({product.brand})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
