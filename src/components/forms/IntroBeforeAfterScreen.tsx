'use client'

import Image from 'next/image'
import { Target, Sparkles, Brain, Award, TrendingUp } from 'lucide-react'

interface IntroBeforeAfterScreenProps {
  onContinue: () => void
  currentStep?: number
  totalSteps?: number
}

/**
 * Écran d'introduction avant/après - affiché avant le formulaire
 * Présente les bénéfices de l'analyse avec un visuel de comparaison
 */
export default function IntroBeforeAfterScreen({ 
  onContinue, 
  currentStep = 0, 
  totalSteps = 7 
}: IntroBeforeAfterScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dermai-nude-50 via-dermai-pure to-purple-50 flex flex-col">
      {/* Header avec barre de progression */}
      <div className="bg-dermai-pure/80 backdrop-blur-sm border-b border-dermai-nude-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="cursor-pointer transition-opacity hover:opacity-80">
                <img 
                  src="/DERMAI-logo.svg" 
                  alt="DermAI" 
                  className="h-8 md:h-10 w-auto"
                />
              </a>
            </div>

            {/* Progress dots - ajusté pour 7 étapes */}
            <div className="hidden md:flex items-center space-x-2">
              {[...Array(totalSteps)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i <= currentStep 
                      ? 'bg-dermai-ai-500 shadow-glow' 
                      : 'bg-dermai-neutral-300'
                  }`}
                />
              ))}
            </div>

            <div className="text-right">
              <div className="text-sm text-dermai-neutral-500">Question {Math.max(1, currentStep + 1)}/{totalSteps}</div>
              <div className="w-32 bg-dermai-neutral-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 h-2 rounded-full transition-all duration-300 shadow-glow"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8 pb-20">
        <div className="w-full max-w-md lg:max-w-lg text-center space-y-8">
          
          {/* Visuel Before/After */}
          <div className="relative">
            <div className="aspect-[4/3] relative bg-dermai-nude-100 rounded-3xl overflow-hidden shadow-premium border border-dermai-nude-200">
              {/* Image de comparaison avant/après */}
              <Image
                src="/illustrations/before-after@2x.png"
                alt="Comparaison avant/après de l'analyse de peau DermAI"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
              {/* Labels Day 0 / Day 30 */}
              <div className="absolute bottom-4 left-4 bg-dermai-pure/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-dermai-nude-200">
                <span className="text-sm font-semibold text-dermai-neutral-800">Jour 0</span>
              </div>
              <div className="absolute bottom-4 right-4 bg-dermai-pure/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-dermai-nude-200">
                <span className="text-sm font-semibold text-dermai-neutral-600">Jour 30</span>
              </div>
            </div>
          </div>

          {/* Titre principal - Version simplifiée */}
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-dermai-neutral-900 leading-tight" tabIndex={0}>
              Découvrez le potentiel de transformation de votre peau grâce à notre analyse avancée
            </h1>
          </div>

          {/* Liste des bénéfices avec icônes Lucide et sous-titres */}
          <div className="space-y-4 text-left">
            {[
              {
                icon: Target,
                title: 'Recommandations produits personnalisées',
                description: 'Sélection précise adaptée à vos besoins'
              },
              {
                icon: Sparkles,
                title: 'Techniques de soin avancées',
                description: 'Méthodes éprouvées pour optimiser votre routine'
              },
              {
                icon: Brain,
                title: 'Analyse IA de votre peau',
                description: 'Diagnostic précis basé sur la vision artificielle'
              },
              {
                icon: Award,
                title: 'Conseils validés par des dermatologues',
                description: 'Recommandations basées sur la science'
              },
              {
                icon: TrendingUp,
                title: 'Amélioration visible de votre peau',
                description: 'Résultats mesurables en quelques semaines'
              }
            ].map((benefit, index) => {
              const IconComponent = benefit.icon
              return (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-dermai-pure/60 backdrop-blur-sm border border-dermai-nude-100">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-dermai-ai-500 to-dermai-ai-400 rounded-full flex items-center justify-center shadow-glow">
                    <IconComponent className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dermai-neutral-800 text-sm leading-snug">
                      {benefit.title}
                    </h3>
                    <p className="text-dermai-neutral-600 text-xs mt-0.5 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA fixe en bas */}
      <div className="sticky bottom-0 bg-dermai-pure/95 backdrop-blur-lg border-t border-dermai-nude-200 p-6">
        <div className="max-w-md lg:max-w-lg mx-auto">
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white font-semibold py-4 px-6 rounded-2xl shadow-premium hover:shadow-glow transition-all duration-300 hover-lift text-lg focus:outline-none focus:ring-2 focus:ring-dermai-ai-500 focus:ring-offset-2"
            style={{ minHeight: '44px' }}
            aria-label="Continuer vers le questionnaire"
          >
            Ok, j'ai compris
          </button>
        </div>
      </div>
    </div>
  )
}
