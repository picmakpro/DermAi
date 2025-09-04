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
 * ShareableCard component – Social-friendly share format
 * Clean, mobile-first design with subtle DermAI branding
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
        }} // Fixed format for consistent exports
      >
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-6 translate-x-6"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Header with logo – always visible */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display">My Diagnosis</h2>
                <p className="text-dermai-ai-100 text-xs">DermAI</p>
              </div>
            </div>
            {/* White DermAI logo for export */}
            <div className="flex-shrink-0">
              <img 
                src="/DERMAI-logo-white.svg" 
                alt="DermAI" 
                className="h-8 w-auto opacity-100"
              />
            </div>
          </div>

          {/* Main content – compact 2x2 grid */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            
            {/* Skin Type */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium text-xs">Skin Type</span>
              </div>
              <div className="text-sm font-bold font-display">
                {analysis.beautyAssessment.skinType || 
                 (analysis.beautyAssessment.mainConcern.length > 20 ? 
                  analysis.beautyAssessment.mainConcern.substring(0, 20) + '...' : 
                  analysis.beautyAssessment.mainConcern)}
              </div>
            </div>

            {/* Skin Age */}
            {skinAgeYears && (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium text-xs">Skin Age</span>
                </div>
                <div className="text-2xl font-bold font-display text-dermai-ai-200">{skinAgeYears} yrs</div>
              </div>
            )}

            {/* Overall Score */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="text-xs opacity-90 mb-1">Overall Score</div>
              <div className="text-2xl font-bold font-display">{analysis.scores.overall}/100</div>
            </div>

            {/* Improvement */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium text-xs">Improvement Estimate</span>
              </div>
              <div className="text-sm font-bold">
                {analysis.beautyAssessment.improvementTimeEstimate || '3–4 months'} to reach 90/100
              </div>
            </div>
          </div>

          {/* Specificities – bottom section */}
          {analysis.beautyAssessment.specificities && analysis.beautyAssessment.specificities.length > 0 && (
            <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-4 h-4" />
                <span className="font-medium text-sm">Detected Specificities</span>
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
                    +{analysis.beautyAssessment.specificities.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer – subtle branding */}
          <div className="mt-3 text-center">
            <div className="text-xs opacity-75">AI-powered dermatology analysis • derm-ai.co</div>
          </div>
        </div>
      </div>
    )
  }
)

ShareableCard.displayName = 'ShareableCard'

export default ShareableCard
