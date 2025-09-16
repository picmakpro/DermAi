'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Zap, Brain, Star } from 'lucide-react'

interface AIIndicatorProps {
  variant?: 'badge' | 'inline' | 'floating' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  showIcon?: boolean
  animated?: boolean
  className?: string
}

export function AIIndicator({
  variant = 'badge',
  size = 'md',
  text = 'Personnalisé par IA',
  showIcon = true,
  animated = true,
  className = ''
}: AIIndicatorProps) {
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  const baseClasses = `
    inline-flex items-center space-x-1.5 font-medium rounded-full
    bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 
    text-white shadow-sm
    ${sizeClasses[size]}
    ${className}
  `
  
  const variantClasses = {
    badge: `${baseClasses} shadow-md`,
    inline: `${baseClasses} bg-opacity-90`,
    floating: `${baseClasses} shadow-lg hover:shadow-xl transition-shadow`,
    subtle: `
      inline-flex items-center space-x-1 text-xs font-medium
      text-dermai-ai-600 bg-dermai-ai-50 border border-dermai-ai-200
      px-2 py-1 rounded-md ${className}
    `
  }
  
  const MotionWrapper = animated ? motion.div : 'div'
  const motionProps = animated ? {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" }
  } : {}
  
  return (
    <MotionWrapper
      className={variantClasses[variant]}
      {...motionProps}
    >
      {showIcon && (
        <motion.div
          animate={animated ? { rotate: [0, 5, -5, 0] } : {}}
          transition={animated ? { duration: 2, repeat: Infinity, repeatDelay: 3 } : {}}
        >
          <Sparkles className={iconSizes[size]} />
        </motion.div>
      )}
      <span>{text}</span>
    </MotionWrapper>
  )
}

/**
 * Indicateur IA spécialisé pour les scores
 */
export function AIScoreIndicator({ 
  score, 
  animated = true,
  className = '' 
}: { 
  score?: number
  animated?: boolean
  className?: string 
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-600'
  }
  
  return (
    <motion.div
      initial={animated ? { opacity: 0, y: -10 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={animated ? { duration: 0.4, ease: "easeOut" } : {}}
      className={`
        inline-flex items-center space-x-1.5 text-xs font-semibold
        bg-gradient-to-r ${score ? getScoreColor(score) : 'from-dermai-ai-500 to-dermai-ai-600'}
        text-white px-2 py-1 rounded-full shadow-sm
        ${className}
      `}
    >
      <Brain className="w-3 h-3" />
      <span>IA</span>
    </motion.div>
  )
}

/**
 * Indicateur IA pour les produits recommandés
 */
export function AIProductIndicator({ 
  animated = true,
  className = '' 
}: { 
  animated?: boolean
  className?: string 
}) {
  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.8 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      transition={animated ? { duration: 0.3, delay: 0.1 } : {}}
      className={`
        inline-flex items-center space-x-1 text-xs font-medium
        text-dermai-ai-700 bg-dermai-ai-100 border border-dermai-ai-200
        px-2 py-1 rounded-md ${className}
      `}
    >
      <Zap className="w-3 h-3" />
      <span>Sélectionné par IA</span>
    </motion.div>
  )
}

/**
 * Indicateur IA pour les routines personnalisées
 */
export function AIRoutineIndicator({ 
  animated = true,
  className = '' 
}: { 
  animated?: boolean
  className?: string 
}) {
  return (
    <motion.div
      initial={animated ? { opacity: 0, x: -20 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={animated ? { duration: 0.4, ease: "easeOut" } : {}}
      className={`
        inline-flex items-center space-x-1.5 text-sm font-medium
        text-white bg-gradient-to-r from-purple-500 to-indigo-600
        px-3 py-1.5 rounded-full shadow-md
        ${className}
      `}
    >
      <Star className="w-4 h-4" />
      <span>Routine IA</span>
    </motion.div>
  )
}

export default AIIndicator


