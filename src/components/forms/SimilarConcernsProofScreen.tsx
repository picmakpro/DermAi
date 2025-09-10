'use client'

import Image from 'next/image'
import { Brain } from 'lucide-react'

interface SimilarConcernsProofScreenProps {
  onContinue: () => void
  onBack: () => void
  userConcerns: string[]
}

/**
 * Social proof screen — displayed after main concerns selection.
 * Logic now supports FR/EN inputs and maps them to EN categories.
 */
export default function SimilarConcernsProofScreen({
  onContinue,
  onBack,
  userConcerns = []
}: SimilarConcernsProofScreenProps) {
  // Normalize FR/EN concerns to EN buckets for the message
  const normalizeConcern = (raw: string): 'acne'|'aging'|'pigmentation'|'redness'|'dryness'|'ingrown'|'unknown' => {
    const v = (raw || '').toLowerCase().trim()

    // Unknown
    if (v === 'je ne sais pas' || v === 'unknown') return 'unknown'

    // Acne / blemishes
    if (
      v.includes('acné') || v.includes('bouton') || v.includes('blemish') || v.includes('acne') ||
      v.includes('imperfection')
    ) return 'acne'

    // Aging / wrinkles
    if (
      v.includes('ride') || v.includes('vieillissement') || v.includes('aging') || v.includes('wrinkle')
    ) return 'aging'

    // Pigmentation / dark spots
    if (
      v.includes('tache') || v.includes('taches') || v.includes('pigment') || v.includes('hyperpig') ||
      v.includes('dark spot') || v.includes('spot')
    ) return 'pigmentation'

    // Redness / irritation / sensitivity
    if (
      v.includes('rougeur') || v.includes('irritation') || v.includes('sensibilit') || v.includes('redness') ||
      v.includes('sensitivity')
    ) return 'redness'

    // Dryness
    if (v.includes('peau sèche') || v.includes('sèche') || v.includes('seche') || v.includes('dry')) return 'dryness'

    // Ingrown hairs / shaving issues
    if (v.includes('poils incarn') || v.includes('ingrown')) return 'ingrown'

    return 'unknown'
  }

  const getPersonalizedMessage = () => {
    const first = userConcerns[0]
    const key = normalizeConcern(first || '')
    switch (key) {
      case 'acne':         return 'acne problems'
      case 'aging':        return 'anti-aging concerns'
      case 'pigmentation': return 'pigmentation problems'
      case 'redness':      return 'sensitivity/redness issues'
      case 'dryness':      return 'dryness problems'
      case 'ingrown':      return 'ingrown-hair problems'
      default:             return 'similar concerns'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dermai-nude-50 via-dermai-pure to-purple-50 flex flex-col">
      {/* Header with back + progress */}
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

        <div className="flex-1 max-w-xs mx-4">
          <div className="h-1.5 bg-dermai-nude-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 rounded-full transition-all duration-500"
              style={{ width: '35%' }}
            />
          </div>
        </div>
        <div className="w-8" /> {/* Spacer for balance */}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8 pb-20">
        <div className="w-full max-w-md lg:max-w-lg text-center space-y-8">
          
          {/* Reassurance message */}
          <div className="space-y-4">
            <h1 className="text-xl lg:text-2xl font-semibold font-display text-dermai-neutral-700 leading-relaxed">
              You’re in good hands
            </h1>
          </div>

          {/* World map visual */}
          <div className="relative">
            <div className="aspect-[4/3] relative bg-dermai-nude-50/80 rounded-2xl overflow-hidden shadow-premium border border-dermai-nude-200">
              <Image
                src="/illustrations/world-proof@2x.png"
                alt="World map showing DermAI users"
                fill
                className="object-cover"
                priority
              />
              
              {/* Floating counters */}
              <div className="absolute inset-0">
                {[
                  { top: '40%', left: '15%' }, // North America
                  { top: '35%', left: '55%' }, // Europe
                  { top: '65%', left: '50%' }, // Africa
                  { top: '50%', left: '75%' }, // Asia
                  { top: '75%', left: '85%' }, // Oceania
                  { top: '70%', left: '30%' }  // South America
                ].map((pos, i) => (
                  <div
                    key={i}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ top: pos.top, left: pos.left }}
                  >
                    <div className="bg-dermai-pure/70 backdrop-blur-sm border border-dermai-nude-200 rounded-full px-3 py-1.5 flex items-center space-x-2 shadow-sm">
                      <div className="w-5 h-5 rounded-full bg-dermai-ai-500 flex items-center justify-center">
                        <Brain className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-dermai-neutral-700">
                        +{Math.floor(200 + Math.random() * 800)} users
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main stat */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold font-display text-dermai-neutral-900 mb-2 leading-tight">
                You’re not alone!
              </h2>
              <p className="text-lg lg:text-xl text-dermai-neutral-700 leading-relaxed">
                DermAI has helped{' '}
                <span className="font-bold text-dermai-ai-600">
                  12,000+ people
                </span>{' '}
                with {getPersonalizedMessage()}.
              </p>
            </div>

            {/* Informative subtitle */}
            <p className="text-sm text-dermai-neutral-500 italic">
              Aggregated data from similar users
            </p>
          </div>

          {/* Additional reassurance points */}
          <div className="bg-dermai-pure/60 backdrop-blur-sm border border-dermai-nude-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-dermai-neutral-700 font-medium">Private & secure analysis</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <span className="text-dermai-neutral-700 font-medium">AI-based recommendations</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 004 13h12a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6z" />
                </svg>
              </div>
              <span className="text-dermai-neutral-700 font-medium">Supportive community</span>
            </div>
          </div>

          {/* Continue CTA */}
          <div>
            <button
              onClick={onContinue}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-400 text-white font-semibold shadow-premium hover:shadow-glow-lg transition-all duration-300 transform hover:scale-105"
            >
              Continue
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
