'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, CheckCircle } from 'lucide-react'

interface ProgressiveRevealProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  showSparkles?: boolean
  className?: string
}

export function ProgressiveReveal({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  showSparkles = false,
  className = ''
}: ProgressiveRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
      // Délai supplémentaire pour l'effet de révélation
      setTimeout(() => setShowContent(true), duration * 500)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay, duration])
  
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 30 }
      case 'down': return { opacity: 0, y: -30 }
      case 'left': return { opacity: 0, x: 30 }
      case 'right': return { opacity: 0, x: -30 }
      case 'fade': return { opacity: 0, scale: 0.95 }
      default: return { opacity: 0, y: 30 }
    }
  }
  
  const getAnimatePosition = () => {
    switch (direction) {
      case 'up': return { opacity: 1, y: 0 }
      case 'down': return { opacity: 1, y: 0 }
      case 'left': return { opacity: 1, x: 0 }
      case 'right': return { opacity: 1, x: 0 }
      case 'fade': return { opacity: 1, scale: 1 }
      default: return { opacity: 1, y: 0 }
    }
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Effet de sparkles si activé */}
      {showSparkles && isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
              scale: [1, 1.1, 0.9, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Sparkles className="w-5 h-5 text-dermai-ai-500" />
          </motion.div>
        </motion.div>
      )}
      
      {/* Contenu principal */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={getInitialPosition()}
            animate={getAnimatePosition()}
            exit={getInitialPosition()}
            transition={{
              duration,
              ease: "easeOut",
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Indicateur de contenu IA si révélé */}
      {showContent && showSparkles && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-2 right-2 z-10"
        >
          <div className="flex items-center space-x-1 bg-dermai-ai-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
            <Zap className="w-3 h-3" />
            <span>IA</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Animation de révélation en cascade pour listes
 */
interface CascadeRevealProps {
  children: React.ReactNode[]
  delay?: number
  stagger?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

export function CascadeReveal({
  children,
  delay = 0,
  stagger = 0.1,
  direction = 'up',
  className = ''
}: CascadeRevealProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <ProgressiveReveal
          key={index}
          delay={delay + (index * stagger * 1000)}
          direction={direction}
          duration={0.4}
        >
          {child}
        </ProgressiveReveal>
      ))}
    </div>
  )
}

/**
 * Animation de "typing" pour texte généré par IA
 */
interface AITypingEffectProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  onComplete?: () => void
}

export function AITypingEffect({
  text,
  speed = 30,
  delay = 0,
  className = '',
  onComplete
}: AITypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsTyping(true)
      let currentIndex = 0
      
      const typeTimer = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(typeTimer)
          setIsTyping(false)
          onComplete?.()
        }
      }, speed)
      
      return () => clearInterval(typeTimer)
    }, delay)
    
    return () => clearTimeout(startTimer)
  }, [text, speed, delay, onComplete])
  
  return (
    <div className={`relative ${className}`}>
      <span>{displayedText}</span>
      {isTyping && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-1 text-dermai-ai-500"
        >
          |
        </motion.span>
      )}
    </div>
  )
}

/**
 * Animation de compteur pour scores
 */
interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  delay?: number
  suffix?: string
  className?: string
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 1.5,
  delay = 0,
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const [count, setCount] = useState(from)
  
  useEffect(() => {
    const startTimer = setTimeout(() => {
      const startTime = Date.now()
      const startValue = from
      const endValue = to
      const totalDuration = duration * 1000
      
      const updateCount = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / totalDuration, 1)
        
        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress)
        
        setCount(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(updateCount)
        }
      }
      
      requestAnimationFrame(updateCount)
    }, delay)
    
    return () => clearTimeout(startTimer)
  }, [from, to, duration, delay])
  
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: delay / 1000, duration: 0.3 }}
      className={className}
    >
      {count}{suffix}
    </motion.span>
  )
}

export default ProgressiveReveal


