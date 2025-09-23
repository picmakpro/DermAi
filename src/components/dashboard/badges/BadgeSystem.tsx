'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BadgeCard } from './BadgeCard'
import { BadgeNotification } from './BadgeNotification'
import { Award } from 'lucide-react'
import { toast } from 'sonner'

interface Badge {
  id: string
  badge_type: string
  badge_level: string
  badge_criteria: any
  earned_at: string
  is_new?: boolean
}

const BADGE_CATEGORIES = {
  routine_streak: {
    title: 'Régularité Routine',
    description: 'Récompenses pour votre assiduité',
    color: 'from-orange-400 to-red-500'
  },
  analysis_count: {
    title: 'Analyses Complétées',
    description: 'Suivi régulier de votre peau',
    color: 'from-blue-400 to-indigo-500'
  },
  improvement: {
    title: 'Améliorations',
    description: 'Progrès visibles sur vos scores',
    color: 'from-green-400 to-emerald-500'
  },
  discovery: {
    title: 'Découvertes Produits',
    description: 'Explorer de nouveaux soins',
    color: 'from-purple-400 to-pink-500'
  }
}

export function BadgeSystem() {
  const [badges, setBadges] = useState<Record<string, Badge[]>>({})
  const [newBadge, setNewBadge] = useState<Badge | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUserBadges()
    checkNewBadges()
  }, [])
  
  const fetchUserBadges = async () => {
    try {
      const response = await fetch('/api/badges')
      if (response.ok) {
        const data = await response.json()
        
        // Grouper par catégorie
        const grouped = data.reduce((acc: Record<string, Badge[]>, badge: Badge) => {
          if (!acc[badge.badge_type]) {
            acc[badge.badge_type] = []
          }
          acc[badge.badge_type].push(badge)
          return acc
        }, {})
        
        setBadges(grouped)
      }
    } catch (error) {
      console.error('Erreur chargement badges:', error)
      toast.error('Erreur lors du chargement des badges')
    } finally {
      setLoading(false)
    }
  }
  
  const checkNewBadges = async () => {
    try {
      const response = await fetch('/api/badges/check', {
        method: 'POST'
      })
      
      if (response.ok) {
        const newBadges = await response.json()
        
        if (newBadges.length > 0) {
          // Afficher notification pour chaque nouveau badge
          newBadges.forEach((badge: Badge, index: number) => {
            setTimeout(() => {
              setNewBadge(badge)
              setTimeout(() => setNewBadge(null), 5000)
            }, index * 1000)
          })
          
          // Recharger la liste
          fetchUserBadges()
        }
      }
    } catch (error) {
      console.error('Erreur vérification badges:', error)
    }
  }
  
  const totalBadges = Object.values(badges).flat().length
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse" />
        </div>
        
        {Object.keys(BADGE_CATEGORIES).map((type) => (
          <div key={type} className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header avec total */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
          Vos Accomplissements
        </h2>
        <p className="text-gray-600">
          {totalBadges} badge{totalBadges > 1 ? 's' : ''} obtenu{totalBadges > 1 ? 's' : ''}
        </p>
      </motion.div>
      
      {totalBadges === 0 ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">
            Aucun badge pour le moment
          </h3>
          <p className="text-gray-400">
            Continuez votre routine et vos analyses pour débloquer des badges !
          </p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {Object.entries(BADGE_CATEGORIES).map(([type, category], categoryIndex) => {
            const categoryBadges = badges[type] || []
            
            return (
              <motion.div 
                key={type} 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              >
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['bronze', 'silver', 'gold', 'platinum'].map((level, levelIndex) => {
                    const badge = categoryBadges.find(b => b.badge_level === level)
                    
                    return (
                      <motion.div
                        key={level}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: categoryIndex * 0.1 + levelIndex * 0.05 
                        }}
                      >
                        <BadgeCard
                          badge={badge}
                          type={type}
                          level={level}
                          gradientColor={category.color}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      
      {/* Notification nouveau badge */}
      <AnimatePresence>
        {newBadge && (
          <BadgeNotification
            badge={newBadge}
            onClose={() => setNewBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}


