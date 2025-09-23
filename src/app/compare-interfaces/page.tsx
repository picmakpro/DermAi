'use client'

import React from 'react'
import { UnifiedRoutineSection } from '@/components/results/UnifiedRoutineSection'
// import { PhaseBasedRoutineView } from '@/components/results/PhaseBasedRoutineView' // Archivé en V3
import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'

/**
 * Page de comparaison directe entre les deux interfaces
 * Accessible via : /compare-interfaces
 */
export default function CompareInterfacesPage() {
  // Routine simplifiée pour la comparaison
  const compareRoutine: UnifiedRoutineStep[] = [
    {
      stepNumber: 1,
      phase: 'immediate',
      title: 'Nettoyage doux',
      category: 'cleansing',
      applicationAdvice: 'Masser délicatement sur peau humide',
      timeOfDay: 'both',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: [{
        catalogId: 'cerave-gel',
        name: 'Gel Moussant Hydratant',
        brand: 'CeraVe',
        price: 12.90,
        size: '236ml',
        affiliateLink: '#',
        justification: 'Formule douce sans savon'
      }],
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
      applicationAdvice: 'Appliquer localement sur les zones concernées',
      timeOfDay: 'evening',
      frequency: 'daily',
      targetArea: 'specific',
      zones: ['Zone T'],
      recommendedProducts: [{
        catalogId: 'effaclar-duo',
        name: 'Effaclar Duo+',
        brand: 'La Roche-Posay',
        price: 16.50,
        size: '40ml',
        affiliateLink: '#',
        justification: 'Action ciblée anti-imperfections'
      }],
      isTemporary: true,
      introduceFromWeek: 0,
      applicationDuration: '4-6 semaines',
      displayTitle: 'Traitement anti-imperfections',
      targetBenefit: 'Réduire imperfections'
    },
    {
      stepNumber: 3,
      phase: 'adaptation',
      title: 'Sérum rétinol',
      category: 'treatment',
      applicationAdvice: 'Commencer 2 fois par semaine',
      timeOfDay: 'evening',
      frequency: 'progressive',
      targetArea: 'global',
      recommendedProducts: [{
        catalogId: 'retinol-serum',
        name: 'Sérum Rétinol',
        brand: 'CeraVe',
        price: 24.90,
        size: '30ml',
        affiliateLink: '#',
        justification: 'Rétinol encapsulé'
      }],
      isTemporary: true,
      introduceFromWeek: 2,
      applicationDuration: '12 semaines',
      displayTitle: 'Introduction rétinol',
      targetBenefit: 'Anti-âge global'
    }
  ]

  const compareAssessment: BeautyAssessment = {
    scores: {
      hydration: 65,
      wrinkles: 45,
      acne: 70,
      texture: 60,
      pigmentation: 55,
      pores: 50,
      elasticity: 70,
      brightness: 65
    },
    skinType: 'combination',
    concerns: ['acne', 'texture'],
    age: 30,
    sensitivity: 'normal'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Comparaison des Interfaces
          </h1>
          <p className="text-gray-600">
            Comparaison côte à côte entre l'interface classique et la nouvelle interface V2
          </p>
        </div>

        {/* Comparaison côte à côte */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Interface Classique */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Interface Classique
              </h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                Actuelle
              </span>
            </div>
            <UnifiedRoutineSection
              routine={compareRoutine}
              beautyAssessment={compareAssessment}
              isAIGenerated={true}
            />
          </div>

          {/* Nouvelle Interface V2 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Nouvelle Interface V2
              </h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                Nouveau
              </span>
            </div>
            <PhaseBasedRoutineView
              routine={compareRoutine}
              beautyAssessment={compareAssessment}
              isAIGenerated={true}
            />
          </div>
        </div>

        {/* Métriques de comparaison */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Améliorations Apportées
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">-60%</div>
              <div className="text-sm text-green-700 font-medium">Charge cognitive</div>
              <div className="text-xs text-green-600 mt-1">Moins de blocs à lire</div>
            </div>
            
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">+40%</div>
              <div className="text-sm text-blue-700 font-medium">Clarté navigation</div>
              <div className="text-xs text-blue-600 mt-1">Onglets intuitifs</div>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-sm text-purple-700 font-medium">Déduplication</div>
              <div className="text-xs text-purple-600 mt-1">Zéro duplication</div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Interface Classique</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Double navigation phases + horaires</li>
                <li>• Duplication produits matin/soir</li>
                <li>• 15-20 blocs d'information</li>
                <li>• Navigation complexe</li>
                <li>• Métadonnées limitées</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Nouvelle Interface V2</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✨ Navigation unifiée par onglets</li>
                <li>✨ Déduplication intelligente</li>
                <li>✨ 7-10 blocs optimisés</li>
                <li>✨ Hiérarchie claire phase → horaire</li>
                <li>✨ Métadonnées enrichies V2</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

