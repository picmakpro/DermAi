'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'

interface Badge {
  id: string
  badge_type: string
  badge_level: string
  badge_criteria: any
  earned_at: string
}

interface BadgeNotificationProps {
  badge: Badge
  onClose: () => void
}

const BADGE_CONFIGS = {
  routine_streak: {
    bronze: { icon: '🥉', title: 'Première Semaine', color: 'from-amber-400 to-orange-500' },
    silver: { icon: '🥈', title: 'Un Mois Régulier', color: 'from-gray-400 to-gray-600' },
    gold: { icon: '🥇', title: 'Trois Mois Assidus', color: 'from-yellow-400 to-yellow-600' },
    platinum: { icon: '💎', title: 'Une Année Parfaite', color: 'from-purple-400 to-purple-600' }
  },
  analysis_count: {
    bronze: { icon: '🔍', title: 'Explorateur Curieux', color: 'from-blue-400 to-blue-600' },
    silver: { icon: '📊', title: 'Analyste Régulier', color: 'from-indigo-400 to-indigo-600' },
    gold: { icon: '🎯', title: 'Expert en Suivi', color: 'from-green-400 to-green-600' },
    platinum: { icon: '🏆', title: 'Maître du Diagnostic', color: 'from-emerald-400 to-emerald-600' }
  },
  improvement: {
    bronze: { icon: '📈', title: 'Premiers Progrès', color: 'from-green-400 to-emerald-500' },
    silver: { icon: '⭐', title: 'Belle Évolution', color: 'from-yellow-400 to-orange-500' },
    gold: { icon: '✨', title: 'Transformation Visible', color: 'from-purple-400 to-pink-500' },
    platinum: { icon: '🌟', title: 'Métamorphose Complète', color: 'from-pink-400 to-rose-500' }
  },
  discovery: {
    bronze: { icon: '🧴', title: 'Curieux des Produits', color: 'from-teal-400 to-cyan-500' },
    silver: { icon: '🛍️', title: 'Collectionneur Averti', color: 'from-blue-400 to-indigo-500' },
    gold: { icon: '💄', title: 'Expert Produits', color: 'from-purple-400 to-violet-500' },
    platinum: { icon: '👑', title: 'Connaisseur Ultime', color: 'from-yellow-400 to-amber-500' }
  }
}

export function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
  const config = BADGE_CONFIGS[badge.badge_type as keyof typeof BADGE_CONFIGS]?.[badge.badge_level as keyof typeof BADGE_CONFIGS['routine_streak']]
  
  if (!config) {
    return null
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: -50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: -50 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 20 
        }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div className={`
          relative overflow-hidden rounded-xl shadow-2xl border border-white/20
          bg-gradient-to-br ${config.color}
        `}>
          {/* Effet de particules */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                initial={{ 
                  x: Math.random() * 300, 
                  y: Math.random() * 200,
                  opacity: 0 
                }}
                animate={{ 
                  y: [null, -20, -40],
                  opacity: [0, 1, 0] 
                }}
                transition={{ 
                  duration: 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3
                }}
              />
            ))}
          </div>
          
          {/* Contenu principal */}
          <div className="relative p-6 text-white">
            {/* Header avec bouton fermer */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white/80" />
                <span className="text-sm font-medium text-white/80">
                  Nouveau Badge !
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Fermer la notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Badge principal */}
            <div className="text-center">
              <motion.div
                className="text-6xl mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 200, 
                  delay: 0.3 
                }}
              >
                {config.icon}
              </motion.div>
              
              <motion.h3
                className="text-xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {config.title}
              </motion.h3>
              
              <motion.p
                className="text-white/80 text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Félicitations pour cet accomplissement !
              </motion.p>
            </div>
            
            {/* Barre de progression animée */}
            <motion.div
              className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.9, duration: 1 }}
            >
              <motion.div
                className="h-full bg-white/60 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 1.2, duration: 0.8 }}
              />
            </motion.div>
          </div>
          
          {/* Effet de brillance */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              duration: 1.5, 
              delay: 2,
              ease: 'easeInOut'
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

