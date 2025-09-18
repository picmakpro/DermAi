'use client'

import { useEffect, useState } from 'react'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'

interface TourStep {
  target: string
  title: string
  content: string
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

const tourSteps: TourStep[] = [
  {
    target: '.dashboard-overview',
    title: 'Bienvenue dans votre tableau de bord !',
    content: 'Ici vous retrouvez vos statistiques principales et un aperçu de votre progression.',
    placement: 'center'
  },
  {
    target: '.last-analysis-widget',
    title: 'Votre dernière analyse',
    content: 'Votre dernière analyse est toujours accessible ici. Vous pouvez la comparer avec les précédentes.',
    placement: 'bottom'
  },
  {
    target: '.routine-today-widget',
    title: 'Routine quotidienne',
    content: 'Suivez votre routine quotidienne et marquez chaque phase comme complétée pour maintenir votre série.',
    placement: 'top'
  },
  {
    target: '.sidebar-nav',
    title: 'Navigation',
    content: 'Naviguez facilement entre les différentes sections de votre dashboard.',
    placement: 'right'
  }
]

export function DashboardTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  
  useEffect(() => {
    // Vérifier si première visite
    const hasSeenTour = localStorage.getItem('dashboard_tour_completed')
    if (!hasSeenTour) {
      setTimeout(() => setIsActive(true), 1000)
    }
  }, [])
  
  useEffect(() => {
    if (isActive && tourSteps[currentStep]) {
      const element = document.querySelector(tourSteps[currentStep].target) as HTMLElement
      setTargetElement(element)
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [isActive, currentStep])
  
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleComplete = () => {
    localStorage.setItem('dashboard_tour_completed', 'true')
    setIsActive(false)
    setCurrentStep(0)
  }
  
  const handleSkip = () => {
    handleComplete()
  }
  
  if (!isActive || !tourSteps[currentStep]) {
    return null
  }
  
  const step = tourSteps[currentStep]
  const isLastStep = currentStep === tourSteps.length - 1
  
  // Calculer la position du tooltip
  const getTooltipPosition = () => {
    if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    
    const rect = targetElement.getBoundingClientRect()
    const tooltipWidth = 320
    const tooltipHeight = 200
    
    switch (step.placement) {
      case 'top':
        return {
          top: rect.top - tooltipHeight - 10,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        }
      case 'bottom':
        return {
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        }
      case 'left':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - 10,
        }
      case 'right':
        return {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + 10,
        }
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
    }
  }
  
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
        {/* Spotlight sur l'élément cible */}
        {targetElement && step.placement !== 'center' && (
          <div
            className="absolute border-4 border-violet-400 rounded-lg shadow-lg"
            style={{
              top: targetElement.getBoundingClientRect().top - 4,
              left: targetElement.getBoundingClientRect().left - 4,
              width: targetElement.getBoundingClientRect().width + 8,
              height: targetElement.getBoundingClientRect().height + 8,
            }}
          />
        )}
        
        {/* Tooltip */}
        <div
          className="absolute bg-white rounded-lg shadow-xl p-6 max-w-sm"
          style={getTooltipPosition()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-violet-600">
                {currentStep + 1} / {tourSteps.length}
              </span>
              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-6 rounded-full ${
                      index <= currentStep ? 'bg-violet-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {step.content}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Passer le tour
            </button>
            
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium"
              >
                {isLastStep ? 'Terminer' : 'Suivant'}
                {!isLastStep && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
