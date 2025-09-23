'use client'

import React from 'react'
// import { PhaseBasedRoutineView } from '@/components/results/PhaseBasedRoutineView' // Archivé en V3
import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'

/**
 * Page de test simple pour la nouvelle interface V2
 */
export default function TestV2Page() {
  // Routine de test minimale
  const testRoutine: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      phase: 'immediate',
      title: 'Nettoyage doux',
      category: 'cleansing',
      applicationAdvice: 'Masser délicatement sur peau humide',
      timeOfDay: 'both',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: [],
      // Champs V2
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'En continu',
      displayTitle: 'Nettoyage quotidien',
      targetBenefit: 'Purifier sans assécher'
    },
    {
      stepNumber: 2,
      phase: 'immediate',
      title: 'Traitement ciblé',
      category: 'treatment',
      applicationAdvice: 'Appliquer localement',
      timeOfDay: 'evening',
      frequency: 'daily',
      targetArea: 'specific',
      zones: ['Zone T'],
      recommendedProducts: [],
      // Champs V2
      isTemporary: true,
      introduceFromWeek: 0,
      applicationDuration: '4-6 semaines',
      displayTitle: 'Traitement anti-imperfections',
      targetBenefit: 'Réduire imperfections'
    }
  ]

  const testAssessment: BeautyAssessment = {
    scores: {
      hydration: 70,
      wrinkles: 40,
      acne: 60,
      texture: 65,
      pigmentation: 50,
      pores: 55,
      elasticity: 70,
      brightness: 65
    },
    skinType: 'combination',
    concerns: ['acne'],
    age: 30,
    sensitivity: 'normal'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Interface V2
        </h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <PhaseBasedRoutineView
            routine={testRoutine}
            beautyAssessment={testAssessment}
            isAIGenerated={true}
          />
        </div>
      </div>
    </div>
  )
}

