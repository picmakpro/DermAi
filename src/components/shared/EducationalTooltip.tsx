'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X, AlertTriangle, Zap, CheckCircle } from 'lucide-react'

interface EducationalTooltipProps {
  content: string
  title?: string
  trigger?: 'hover' | 'click'
  position?: 'above' | 'below' | 'left' | 'right' | 'auto'
  maxWidth?: string
  className?: string
  iconClassName?: string
}

export function EducationalTooltip({
  content,
  title = "Le saviez-vous ?",
  trigger = 'hover',
  position = 'auto',
  maxWidth = '320px',
  className = '',
  iconClassName = ''
}: EducationalTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState<'above' | 'below' | 'left' | 'right'>('above')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  // Détection automatique de la position optimale avec contraintes viewport
  useEffect(() => {
    if (isVisible && position === 'auto' && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      }
      
      // Marge de sécurité
      const margin = 20
      
      // Vérifier si tooltip sort à droite/gauche
      const wouldOverflowRight = triggerRect.left + tooltipRect.width + margin > viewport.width
      const wouldOverflowLeft = triggerRect.right - tooltipRect.width - margin < 0
      
      // Logique de positionnement améliorée
      if (triggerRect.top > tooltipRect.height + margin) {
        // Au-dessus si assez de place
        setActualPosition('above')
      } else if (viewport.height - triggerRect.bottom > tooltipRect.height + margin) {
        // En dessous si assez de place
        setActualPosition('below')
      } else if (!wouldOverflowLeft && triggerRect.left > tooltipRect.width + margin) {
        // À gauche si pas de débordement
        setActualPosition('left')
      } else if (!wouldOverflowRight && viewport.width - triggerRect.right > tooltipRect.width + margin) {
        // À droite si pas de débordement
        setActualPosition('right')
      } else {
        // Fallback : en dessous avec scroll si nécessaire
        setActualPosition('below')
      }
    } else if (position !== 'auto') {
      setActualPosition(position)
    }
  }, [isVisible, position])
  
  // Fermeture au clic extérieur
  useEffect(() => {
    if (!isVisible) return
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        tooltipRef.current && !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false)
      }
    }
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible])
  
  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible)
    }
  }
  
  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true)
    }
  }
  
  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false)
    }
  }
  
  // Calcul des classes de positionnement avec contraintes viewport
  const getPositionClasses = () => {
    const base = "fixed z-50" // Changé en fixed pour éviter débordement
    
    switch (actualPosition) {
      case 'above':
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
      case 'below':
        return `${base} top-full left-1/2 transform -translate-x-1/2 mt-2`
      case 'left':
        return `${base} right-full top-1/2 transform -translate-y-1/2 mr-2`
      case 'right':
        return `${base} left-full top-1/2 transform -translate-y-1/2 ml-2`
      default:
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
    }
  }
  
  // Calcul de la position absolue pour éviter débordement
  const getTooltipStyle = () => {
    if (!isVisible || !triggerRef.current) return {}
    
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const tooltipWidth = 450 // Notre largeur max
    const margin = 20
    
    let left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2
    let top = triggerRect.bottom + 8
    
    // Ajuster horizontalement si débordement
    if (left < margin) left = margin
    if (left + tooltipWidth > viewport.width - margin) {
      left = viewport.width - tooltipWidth - margin
    }
    
    // Ajuster verticalement si débordement
    if (actualPosition === 'above') {
      top = triggerRect.top - 8
    }
    
    return { left, top, position: 'fixed' as const }
  }
  
  // Flèche de pointage
  const Arrow = () => {
    const arrowClass = "absolute w-3 h-3 bg-white border border-gray-200 rotate-45"
    
    switch (actualPosition) {
      case 'above':
        return <div className={`${arrowClass} top-full left-1/2 transform -translate-x-1/2 -mt-1.5 border-t-0 border-l-0`} />
      case 'below':
        return <div className={`${arrowClass} bottom-full left-1/2 transform -translate-x-1/2 -mb-1.5 border-b-0 border-r-0`} />
      case 'left':
        return <div className={`${arrowClass} left-full top-1/2 transform -translate-y-1/2 -ml-1.5 border-l-0 border-b-0`} />
      case 'right':
        return <div className={`${arrowClass} right-full top-1/2 transform -translate-y-1/2 -mr-1.5 border-r-0 border-t-0`} />
      default:
        return <div className={`${arrowClass} top-full left-1/2 transform -translate-x-1/2 -mt-1.5 border-t-0 border-l-0`} />
    }
  }
  
  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleTrigger}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          group flex items-center justify-center w-5 h-5 rounded-full 
          bg-dermai-ai-100 hover:bg-dermai-ai-200 
          text-dermai-ai-600 hover:text-dermai-ai-700
          transition-all duration-200 hover:scale-110
          focus:outline-none focus:ring-2 focus:ring-dermai-ai-300 focus:ring-offset-1
          ${iconClassName}
        `}
        aria-label="Informations éducatives"
        type="button"
      >
        <Info className="w-3 h-3" />
      </button>
      
      {/* Tooltip Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95, y: actualPosition === 'above' ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: actualPosition === 'above' ? 5 : -5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-50"
            style={{ ...getTooltipStyle(), maxWidth }}
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 relative max-h-80 overflow-y-auto">
              <Arrow />
              
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-semibold text-dermai-ai-700 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-dermai-ai-500" />
                  {title}
                </h4>
                {trigger === 'click' && (
                  <button
                    onClick={() => setIsVisible(false)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    aria-label="Fermer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {/* Content */}
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {content}
              </div>
              
              {/* Footer Button (pour mobile principalement) */}
              {trigger === 'click' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setIsVisible(false)}
                    className="w-full px-3 py-2 text-sm font-medium text-dermai-ai-600 hover:text-dermai-ai-700 hover:bg-dermai-ai-50 rounded-md transition-colors"
                  >
                    Compris ✓
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Version mobile-optimized pour les écrans tactiles
 */
export function MobileEducationalTooltip({
  content,
  title = "Le saviez-vous ?",
  iconClassName = ''
}: Omit<EducationalTooltipProps, 'trigger' | 'position' | 'className'>) {
  const [isVisible, setIsVisible] = useState(false)
  
  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setIsVisible(true)}
        className={`
          group flex items-center justify-center w-6 h-6 rounded-full 
          bg-dermai-ai-100 hover:bg-dermai-ai-200 
          text-dermai-ai-600 hover:text-dermai-ai-700
          transition-all duration-200 active:scale-95
          ${iconClassName}
        `}
        aria-label="Informations éducatives"
        type="button"
      >
        <Info className="w-4 h-4" />
      </button>
      
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black bg-opacity-30"
              onClick={() => setIsVisible(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                                  <h3 className="text-lg font-semibold text-dermai-ai-700 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-dermai-ai-500" />
                  {title}
                </h3>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="text-base text-gray-700 leading-relaxed whitespace-pre-line mb-6">
                  {content}
                </div>
                
                {/* Footer */}
                <button
                  onClick={() => setIsVisible(false)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-500 text-white font-medium rounded-lg hover:from-dermai-ai-500 hover:to-dermai-ai-600 transition-all"
                >
                  Compris ✓
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default EducationalTooltip
