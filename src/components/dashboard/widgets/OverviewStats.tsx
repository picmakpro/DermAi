'use client'

import { useEffect, useState } from 'react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Award 
} from 'lucide-react'

interface UserStats {
  totalAnalyses: number
  currentStreak: number
  improvementRate: number
  totalBadges: number
}

export function OverviewStats() {
  const [stats, setStats] = useState<UserStats>({
    totalAnalyses: 0,
    currentStreak: 0,
    improvementRate: 0,
    totalBadges: 0
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUserStats()
  }, [])
  
  const fetchUserStats = async () => {
    try {
      console.log('📊 [OverviewStats] Récupération statistiques depuis API...')
      
      // 🔄 ÉTAPE 2: Utilisation de la vraie API
      const response = await fetch('/api/dashboard/stats')
      
      if (response.status === 401) {
        console.log('ℹ️ [OverviewStats] Utilisateur non connecté, utilisation données par défaut')
        setStats({
          totalAnalyses: 0,
          currentStreak: 0,
          improvementRate: 0,
          totalBadges: 0
        })
        return
      }
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ [OverviewStats] Statistiques reçues:', data.data)
      
      if (data.success && data.data) {
        setStats({
          totalAnalyses: data.data.totalAnalyses,
          currentStreak: data.data.routineStreak,
          improvementRate: Math.round(data.data.globalImprovement),
          totalBadges: data.data.badgesCount
        })
      } else {
        throw new Error('Données invalides reçues de l\'API')
      }
    } catch (error) {
      console.error('❌ [OverviewStats] Erreur chargement stats:', error)
      
      // Fallback vers données par défaut en cas d'erreur
      setStats({
        totalAnalyses: 0,
        currentStreak: 0,
        improvementRate: 0,
        totalBadges: 0
      })
    } finally {
      setLoading(false)
    }
  }
  
  const statItems = [
    {
      label: 'Analyses',
      value: stats.totalAnalyses,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Streak',
      value: `${stats.currentStreak}j`,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Amélioration',
      value: `+${stats.improvementRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Badges',
      value: stats.totalBadges,
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]
  
  if (loading) {
    return (
      <DashboardCard title="Vos Statistiques">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex p-3 rounded-lg bg-gray-100 animate-pulse">
                <div className="h-6 w-6 bg-gray-200 rounded" />
              </div>
              <div className="mt-2 h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="mt-1 h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </DashboardCard>
    )
  }
  
  return (
    <DashboardCard title="Vos Statistiques">
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className={`inline-flex p-3 rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {item.value}
            </p>
            <p className="text-sm text-gray-600">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

