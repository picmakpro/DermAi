'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Brain } from 'lucide-react'

interface SimilarConcernsProofScreenProps {
  onContinue: () => void
  onBack: () => void
  userConcerns: string[]
}

/**
 * Social proof screen - displayed after main concerns selection
 * Reassures user by showing they're not alone with their skin problems
 */
export default function SimilarConcernsProofScreen({ 
  onContinue, 
  onBack, 
  userConcerns 
}: SimilarConcernsProofScreenProps) {
  const [userCount, setUserCount] = useState(23428)

  useEffect(() => {
    // Simulate dynamic counter retrieval
    // In production, this would come from an API
    const fetchUserCount = () => {
      // Static fallback if no dynamic data
      setUserCount(23428)
    }
    
    fetchUserCount()
  }, [])

  // Format user count
  const formatUserCount = (count: number) => {
    return count.toLocaleString('fr-FR')
  }

  // Determine personalized message based on concerns
  const getPersonalizedMessage = () => {
    if (userConcerns.includes('Je ne sais pas')) {
      return 'des préoccupations similaires'
    }
    
    const mainConcern = userConcerns[0]
    switch (mainConcern) {
      case 'Acné/Boutons':
        return 'acne problems'
      case 'Rides/Vieillissement':
        return 'anti-aging concerns'
      case 'Taches pigmentaires':
        return 'pigmentation problems'
      case 'Rougeurs/Irritations':
        return 'sensitivity problems'
      case 'Peau sèche':
        return 'dryness problems'
      case 'Poils incarnés':
        return 'ingrown hair problems'
      default:
        return 'similar concerns'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dermai-nude-50 via-dermai-pure to-purple-50 flex flex-col">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 lg:p-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-dermai-nude-100 rounded-full transition-colors"
          aria-label="Back"
        >
          <svg className="w-6 h-6 text-dermai-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Visual progress indicator */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="h-1.5 bg-dermai-nude-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 rounded-full transition-all duration-500"
              style={{ width: '35%' }}
            />
          </div>
        </div>
        <div className="w-8" /> {/* Spacer pour équilibrer */}
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8 pb-20">
        <div className="w-full max-w-md lg:max-w-lg text-center space-y-8">
          
          {/* Message de réconfort */}
          <div className="space-y-4">
            <h1 className="text-xl lg:text-2xl font-semibold font-display text-dermai-neutral-700 leading-relaxed">
              Vous êtes entre de bonnes mains
            </h1>
          </div>

          {/* Visuel carte du monde */}
          <div className="relative">
            <div className="aspect-[4/3] relative bg-dermai-nude-100 rounded-3xl overflow-hidden shadow-premium border border-dermai-nude-200">
              <Image
                src="/illustrations/world-proof@2x.png"
                alt="Carte du monde montrant les utilisateurs DermAI"
                fill
                className="object-cover"
                priority
              />
              
              {/* Points lumineux animés pour simuler l'activité */}
              <div className="absolute inset-0">
                {[
                  { top: '30%', left: '25%' }, // Europe
                  { top: '40%', left: '15%' }, // Amérique Nord
                  { top: '55%', left: '20%' }, // Amérique Sud
                  { top: '45%', left: '75%' }, // Asie
                  { top: '65%', left: '80%' }, // Océanie
                  { top: '50%', left: '50%' }, // Afrique
                ].map((position, index) => (
                  <div
                    key={index}
                    className="absolute w-2 h-2 bg-dermai-ai-400 rounded-full animate-pulse shadow-glow"
                    style={{ 
                      top: position.top, 
                      left: position.left,
                      animationDelay: `${index * 0.5}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Statistique principale */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold font-display text-dermai-neutral-900 mb-2 leading-tight">
                Vous n'êtes pas seul(e) !
              </h2>
              <p className="text-lg lg:text-xl text-dermai-neutral-700 leading-relaxed">
                DermAI a aidé{' '}
                <span className="font-bold text-dermai-ai-600">
                  {formatUserCount(userCount)}
                </span>
                {' '}personnes avec {getPersonalizedMessage()}
              </p>
            </div>

            {/* Sous-titre informatif */}
            <p className="text-sm text-dermai-neutral-500 italic">
              Données agrégées d'utilisateurs similaires
            </p>
          </div>

          {/* Points de réassurance supplémentaires */}
          <div className="bg-dermai-pure/60 backdrop-blur-sm border border-dermai-nude-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-dermai-neutral-700 font-medium">Analyse confidentielle et sécurisée</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-600" strokeWidth={2} />
              </div>
              <span className="text-dermai-neutral-700 font-medium">Recommandations basées sur l'IA</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-dermai-neutral-700 font-medium">Communauté bienveillante</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA fixe en bas */}
      <div className="sticky bottom-0 bg-dermai-pure/95 backdrop-blur-lg border-t border-dermai-nude-200 p-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white font-semibold py-4 px-6 rounded-2xl shadow-premium hover:shadow-glow transition-all duration-300 hover-lift text-lg"
            style={{ minHeight: '44px' }}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  )
}
