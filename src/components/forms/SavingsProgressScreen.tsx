'use client'

import Image from 'next/image'

interface SavingsProgressScreenProps {
  onContinue: () => void
  onBack: () => void
  currentProgress: number // Pourcentage de progression (ex: 95)
}

/**
 * Écran d'économies et progression - affiché avant la dernière question
 * Montre les économies potentielles et le progrès dans le questionnaire
 */
export default function SavingsProgressScreen({ 
  onContinue, 
  onBack, 
  currentProgress = 95 
}: SavingsProgressScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dermai-nude-50 via-dermai-pure to-purple-50 flex flex-col">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between p-4 lg:p-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-dermai-nude-100 rounded-full transition-colors"
          aria-label="Retour"
        >
          <svg className="w-6 h-6 text-dermai-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Indicateur de progression visuel */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="h-1.5 bg-dermai-nude-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 rounded-full transition-all duration-500"
              style={{ width: '85%' }}
            />
          </div>
        </div>
        <div className="w-8" /> {/* Spacer pour équilibrer */}
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8 pb-20">
        <div className="w-full max-w-md lg:max-w-lg text-center space-y-8">
          


          {/* Visuel des économies */}
          <div className="relative">
            <div className="aspect-[4/3] relative bg-dermai-nude-100 rounded-3xl overflow-hidden shadow-premium border border-dermai-nude-200 p-6 flex flex-col items-center justify-center">
              {/* Simulation de l'image des pièces */}
              <div className="flex items-end justify-center space-x-8 mb-6">
                {/* Stack de pièces "Sans DermAI" */}
                <div className="text-center">
                  <div className="relative mb-4">
                    {/* Simulation de piles de pièces */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-12 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full border border-yellow-600 shadow-sm"
                        style={{ 
                          transform: `translateY(${-i * 2}px)`,
                          zIndex: 8 - i 
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-dermai-neutral-600">
                    Sans<br />DermAI
                  </p>
                </div>

                {/* Flèche et pourcentage */}
                <div className="flex flex-col items-center justify-center pb-8">
                  <div className="text-2xl font-bold text-dermai-neutral-800 mb-2">
                    -56%
                  </div>
                  <p className="text-xs text-dermai-neutral-500 text-center">
                    d'économies sur<br />les cosmétiques
                  </p>
                  <svg className="w-8 h-8 text-dermai-neutral-400 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>

                {/* Stack de pièces "Avec DermAI" */}
                <div className="text-center">
                  <div className="relative mb-4">
                    {/* Moins de pièces */}
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-12 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full border border-yellow-600 shadow-sm"
                        style={{ 
                          transform: `translateY(${-i * 2}px)`,
                          zIndex: 4 - i 
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-dermai-neutral-600">
                    Avec<br />DermAI
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Titre et message */}
          <div className="space-y-4">
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-dermai-neutral-900 leading-tight">
              Optimisez vos dépenses cosmétiques grâce à une personnalisation précise
            </h1>
            
            <p className="text-dermai-neutral-600 text-lg leading-relaxed">
              Notre IA sélectionne uniquement les produits dont votre peau a réellement besoin, 
              évitant les achats inutiles et les routines inadaptées.
            </p>
          </div>

          {/* Points d'avantages */}
          <div className="bg-dermai-pure/60 backdrop-blur-sm border border-dermai-nude-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-dermai-neutral-700 font-medium">Sélection précise et personnalisée</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-dermai-neutral-700 font-medium">Économies moyennes de 56%</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-dermai-neutral-700 font-medium">Résultats optimisés garantis</span>
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
            Suivant
          </button>
        </div>
      </div>
    </div>
  )
}
