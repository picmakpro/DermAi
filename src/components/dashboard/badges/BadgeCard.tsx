'use client'

import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

interface Badge {
  id: string
  badge_type: string
  badge_level: string
  earned_at?: string
  is_new?: boolean
}

interface BadgeCardProps {
  badge?: Badge
  type: string
  level: string
  gradientColor: string
}

const BADGE_CONFIGS = {
  routine_streak: {
    bronze: { icon: '🥉', days: 7, title: 'Première Semaine' },
    silver: { icon: '🥈', days: 30, title: 'Un Mois Régulier' },
    gold: { icon: '🥇', days: 90, title: 'Trois Mois Assidus' },
    platinum: { icon: '💎', days: 365, title: 'Une Année Parfaite' }
  },
  analysis_count: {
    bronze: { icon: '🔍', count: 3, title: 'Explorateur Curieux' },
    silver: { icon: '📊', count: 10, title: 'Analyste Régulier' },
    gold: { icon: '🎯', count: 25, title: 'Expert en Suivi' },
    platinum: { icon: '🏆', count: 50, title: 'Maître du Diagnostic' }
  },
  improvement: {
    bronze: { icon: '📈', percent: 10, title: 'Premiers Progrès' },
    silver: { icon: '⭐', percent: 25, title: 'Belle Évolution' },
    gold: { icon: '✨', percent: 50, title: 'Transformation Visible' },
    platinum: { icon: '🌟', percent: 75, title: 'Métamorphose Complète' }
  },
  discovery: {
    bronze: { icon: '🧴', products: 5, title: 'Curieux des Produits' },
    silver: { icon: '🛍️', products: 15, title: 'Collectionneur Averti' },
    gold: { icon: '💄', products: 30, title: 'Expert Produits' },
    platinum: { icon: '👑', products: 50, title: 'Connaisseur Ultime' }
  }
}

export function BadgeCard({ badge, type, level, gradientColor }: BadgeCardProps) {
  const config = BADGE_CONFIGS[type as keyof typeof BADGE_CONFIGS]?.[level as keyof typeof BADGE_CONFIGS['routine_streak']]
  const isUnlocked = !!badge
  
  if (!config) {
    return null
  }
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative ${isUnlocked ? 'cursor-pointer' : ''}`}
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
    >
      <div className={`
        relative p-6 rounded-xl text-center transition-all duration-300
        ${isUnlocked 
          ? `bg-gradient-to-br ${gradientColor} text-white shadow-lg hover:shadow-xl` 
          : 'bg-gray-100 text-gray-400'
        }
      `}>
        {/* Icône badge */}
        <div className="text-5xl mb-3">
          {isUnlocked ? (
            <span className="filter drop-shadow-lg">{config.icon}</span>
          ) : (
            <Lock className="h-12 w-12 mx-auto opacity-50" />
          )}
        </div>
        
        {/* Titre */}
        <h4 className={`font-semibold mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
          {config.title}
        </h4>
        
        {/* Critère */}
        <p className={`text-sm ${isUnlocked ? 'text-white/80' : 'text-gray-400'}`}>
          {type === 'routine_streak' && `${config.days} jours`}
          {type === 'analysis_count' && `${config.count} analyses`}
          {type === 'improvement' && `+${config.percent}%`}
          {type === 'discovery' && `${config.products} produits`}
        </p>
        
        {/* Date obtention */}
        {isUnlocked && badge?.earned_at && (
          <p className="text-xs text-white/60 mt-2">
            Obtenu le {new Date(badge.earned_at).toLocaleDateString('fr-FR')}
          </p>
        )}
        
        {/* Badge "nouveau" */}
        {isUnlocked && badge?.is_new && (
          <motion.div 
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            Nouveau !
          </motion.div>
        )}
        
        {/* Effet de brillance pour badges débloqués */}
        {isUnlocked && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3,
              ease: 'linear'
            }}
          />
        )}
      </div>
    </motion.div>
  )
}






