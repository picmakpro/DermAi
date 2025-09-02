'use client'

import React, { forwardRef } from 'react'
import { Award, TrendingUp, Target, Clock, Sparkles } from 'lucide-react'
import type { SkinAnalysis, SkinSpecificity } from '@/types'

interface ShareableCardProps {
  analysis: SkinAnalysis
  skinAgeYears?: number | null
  className?: string
}

/**
 * Composant ShareableCard - Format optimisé pour le partage sur réseaux sociaux
 * Design épuré, mobile-first, avec branding DermAI discret
 */
const ShareableCard = forwardRef<HTMLDivElement, ShareableCardProps>(
  ({ analysis, skinAgeYears, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="shareable-card"
        className={`bg-gradient-to-br from-dermai-ai-500 via-dermai-ai-400 to-dermai-ai-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden max-w-lg mx-auto ${className}`}
        style={{ 
          aspectRatio: '1/1',
          width: '512px',
          height: '512px',
          minWidth: '512px',
          minHeight: '512px'
        }} // Format fixe pour export cohérent
      >
        {/* Éléments décoratifs subtils */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
        
        <div className="relative z-10 h-full flex flex-col">
          {/* En-tête avec logo - toujours visible */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display">Mon Diagnostic</h2>
                <p className="text-dermai-ai-100 text-xs">DermAI</p>
              </div>
            </div>
            {/* Logo DermAI blanc pour export */}
            <div className="flex-shrink-0">
              <img 
                src="/DERMAI-logo-white.svg" 
                alt="DermAI" 
                className="h-8 w-auto opacity-100"
              />
            </div>
          </div>

          {/* Contenu principal - grille 2x2 compacte */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            
            {/* Type de peau */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium text-xs">Type de Peau</span>
              </div>
              <div className="text-sm font-bold font-display">
                {analysis.beautyAssessment.skinType || 
                 (analysis.beautyAssessment.mainConcern.length > 20 ? 
                  analysis.beautyAssessment.mainConcern.substring(0, 20) + '...' : 
                  analysis.beautyAssessment.mainConcern)}
              </div>
            </div>

            {/* Âge de peau */}
            {skinAgeYears && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium text-xs">Âge de peau</span>
                </div>
                <div className="text-2xl font-bold font-display text-dermai-ai-200">{skinAgeYears} ans</div>
              </div>
            )}

            {/* Score global */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-xs opacity-90 mb-1">Score Global</div>
              <div className="text-2xl font-bold font-display">{analysis.scores.overall}/100</div>
            </div>

            {/* Amélioration */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium text-xs">Estimation d'amélioration</span>
              </div>
              <div className="text-sm font-bold">
                {analysis.beautyAssessment.improvementTimeEstimate || "3-4 mois"} pour atteindre 90/100
              </div>
            </div>
          </div>

          {/* Spécificités en bas - largeur améliorée */}
          {analysis.beautyAssessment.specificities && analysis.beautyAssessment.specificities.length > 0 && (
            <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-4 h-4" />
                <span className="font-medium text-sm">Spécificités détectées</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {analysis.beautyAssessment.specificities.slice(0, 4).map((spec: SkinSpecificity, idx: number) => (
                  <div key={idx} className="bg-white/20 rounded-xl px-3 py-2">
                    <div className="text-xs font-medium leading-tight">{spec.name}</div>
                    <div className="text-xs opacity-75 capitalize mt-1">{spec.intensity}</div>
                  </div>
                ))}
                {analysis.beautyAssessment.specificities.length > 4 && (
                  <div className="bg-white/20 rounded-xl px-3 py-2 text-xs opacity-75 flex items-center justify-center">
                    +{analysis.beautyAssessment.specificities.length - 4} autres
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer avec branding subtil - toujours visible */}
          <div className="mt-3 text-center">
            <div className="text-xs opacity-75">Analyse dermatologique propulsée par IA • derm-ai.co</div>
          </div>
        </div>
      </div>
    )
  }
)

ShareableCard.displayName = 'ShareableCard'

export default ShareableCard
