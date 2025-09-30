'use client'

import { useEffect, useState } from 'react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import Link from 'next/link'

interface Badge {
  id: string
  badge_type: string
  badge_level: string
  earned_at: string
  is_new: boolean
}

const BADGE_CONFIG = {
  routine_streak: {
    bronze: { title: "Première Semaine", icon: "🥉" },
    silver: { title: "Un Mois Régulier", icon: "🥈" },
    gold: { title: "Trois Mois Assidus", icon: "🥇" },
    platinum: { title: "Une Année Parfaite", icon: "💎" }
  },
  analysis_count: {
    bronze: { title: "Explorateur Curieux", icon: "🔍" },
    silver: { title: "Analyste Régulier", icon: "📊" },
    gold: { title: "Expert en Suivi", icon: "🎯" },
    platinum: { title: "Maître du Diagnostic", icon: "🏆" }
  },
  improvement: {
    bronze: { title: "Premiers Progrès", icon: "📈" },
    silver: { title: "Belle Évolution", icon: "⭐" },
    gold: { title: "Transformation Visible", icon: "✨" },
    platinum: { title: "Métamorphose Complète", icon: "🌟" }
  },
  discovery: {
    bronze: { title: "Curieux des Produits", icon: "🧴" },
    silver: { title: "Collectionneur Averti", icon: "🛍️" },
    gold: { title: "Expert Produits", icon: "💄" },
    platinum: { title: "Connaisseur Ultime", icon: "👑" }
  }
}

export function RecentBadges() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchRecentBadges()
  }, [])
  
  const fetchRecentBadges = async () => {
    try {
      // TODO: Remplacer par vraie API
      // const response = await fetch('/api/badges?limit=3')
      // const data = await response.json()
      // setBadges(data.badges)
      
      // Données mockées pour le développement
      const mockBadges = [
        {
          id: '1',
          badge_type: 'routine_streak',
          badge_level: 'bronze',
          earned_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          is_new: true
        },
        {
          id: '2',
          badge_type: 'analysis_count',
          badge_level: 'bronze',
          earned_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          is_new: false
        }
      ]
      
      setBadges(mockBadges)
    } catch (error) {
      console.error('Erreur chargement badges:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getBadgeInfo = (badge: Badge) => {
    const typeConfig = BADGE_CONFIG[badge.badge_type as keyof typeof BADGE_CONFIG]
    const levelConfig = typeConfig?.[badge.badge_level as keyof typeof typeConfig]
    return levelConfig || { title: 'Badge', icon: '🏅' }
  }
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'silver': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'gold': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'platinum': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }
  
  if (loading) {
    return (
      <DashboardCard title="Badges Récents">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    )
  }
  
  if (badges.length === 0) {
    return (
      <DashboardCard title="Badges Récents">
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🏅</div>
          <p className="text-gray-600 text-sm">
            Continuez vos analyses pour débloquer des badges !
          </p>
        </div>
      </DashboardCard>
    )
  }
  
  return (
    <DashboardCard 
      title="Badges Récents"
      action={
        <Link 
          href="/dashboard/progress"
          className="text-sm text-violet-600 hover:text-violet-700"
        >
          Voir tous →
        </Link>
      }
    >
      <div className="space-y-3">
        {badges.map((badge) => {
          const badgeInfo = getBadgeInfo(badge)
          const isRecent = new Date(badge.earned_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          
          return (
            <div 
              key={badge.id}
              className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                getLevelColor(badge.badge_level)
              } ${badge.is_new ? 'ring-2 ring-violet-200' : ''}`}
            >
              <div className="text-2xl">
                {badgeInfo.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">
                    {badgeInfo.title}
                  </p>
                  {badge.is_new && (
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                      Nouveau !
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {isRecent ? 'Récemment obtenu' : 'Obtenu'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </DashboardCard>
  )
}





