'use client'

import React, { useState } from 'react'
import { UnifiedRoutineSection } from '@/components/results/UnifiedRoutineSection'
// import { PhaseBasedRoutineView } from '@/components/results/PhaseBasedRoutineView' // Archivé en V3
import type { UnifiedRoutineStep, BeautyAssessment } from '@/types'

/**
 * Page de démo pour tester la nouvelle interface routines V2
 * Accessible via : /demo-routine-v2?feature_new_routine_display=true
 */
export default function DemoRoutineV2Page() {
  const [useNewDisplay, setUseNewDisplay] = useState(false)

  // Données de démo enrichies avec les nouveaux champs V2
  const demoRoutine: UnifiedRoutineStep[] = [
    // Phase Immédiate
    {
      stepNumber: 1,
      phase: 'immediate',
      title: 'Nettoyage doux adapté',
      category: 'cleansing',
      applicationAdvice: 'Masser délicatement sur peau humide pendant 30 secondes, rincer à l\'eau tiède',
      timeOfDay: 'both',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: [{
        catalogId: 'cerave-gel-moussant',
        name: 'Gel Moussant Hydratant',
        brand: 'CeraVe',
        price: 12.90,
        size: '236ml',
        affiliateLink: '#',
        justification: 'Formule douce sans savon, enrichie en céramides'
      }],
      // Nouveaux champs V2
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'En continu',
      displayTitle: 'Nettoyage quotidien',
      targetBenefit: 'Purifier sans assécher'
    },
    {
      stepNumber: 2,
      phase: 'immediate',
      title: 'Traitement anti-imperfections',
      category: 'treatment',
      applicationAdvice: 'Appliquer localement sur les zones concernées, éviter le contour des yeux',
      timeOfDay: 'evening',
      frequency: 'daily',
      targetArea: 'specific',
      zones: ['Zone T', 'Menton'],
      recommendedProducts: [{
        catalogId: 'la-roche-posay-effaclar',
        name: 'Effaclar Duo+',
        brand: 'La Roche-Posay',
        price: 16.50,
        size: '40ml',
        affiliateLink: '#',
        justification: 'Action ciblée anti-imperfections avec niacinamide'
      }],
      // Nouveaux champs V2
      isTemporary: true,
      introduceFromWeek: 0,
      applicationDuration: '4-6 semaines',
      displayTitle: 'Traitement ciblé',
      targetBenefit: 'Réduire imperfections'
    },
    {
      stepNumber: 3,
      phase: 'immediate',
      title: 'Hydratation légère',
      category: 'hydration',
      applicationAdvice: 'Appliquer sur l\'ensemble du visage en mouvements ascendants',
      timeOfDay: 'both',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: [{
        catalogId: 'neutrogena-hydro-boost',
        name: 'Hydro Boost Aqua-Gel',
        brand: 'Neutrogena',
        price: 14.90,
        size: '50ml',
        affiliateLink: '#',
        justification: 'Texture légère, hydratation intense sans fini gras'
      }],
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'En continu',
      displayTitle: 'Hydratation quotidienne',
      targetBenefit: 'Hydrater en profondeur'
    },
    {
      stepNumber: 4,
      phase: 'immediate',
      title: 'Protection solaire',
      category: 'protection',
      applicationAdvice: 'Appliquer généreusement 15 minutes avant l\'exposition',
      timeOfDay: 'morning',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: [{
        catalogId: 'anthelios-airlicium',
        name: 'Anthelios Airlicium SPF 50+',
        brand: 'La Roche-Posay',
        price: 19.90,
        size: '50ml',
        affiliateLink: '#',
        justification: 'Protection haute, fini mat idéal pour peaux mixtes'
      }],
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'En continu',
      displayTitle: 'Protection solaire',
      targetBenefit: 'Protéger des UV'
    },
    {
      stepNumber: 5,
      phase: 'immediate',
      title: 'Peeling doux AHA',
      category: 'exfoliation',
      applicationAdvice: 'Appliquer le soir sur peau propre et sèche, éviter le contour des yeux',
      timeOfDay: 'evening',
      frequency: 'weekly',
      targetArea: 'global',
      recommendedProducts: [{
        catalogId: 'the-ordinary-glycolic',
        name: 'Glycolic Acid 7% Toning Solution',
        brand: 'The Ordinary',
        price: 8.90,
        size: '240ml',
        affiliateLink: '#',
        justification: 'Exfoliation chimique douce pour un teint lumineux'
      }],
      isTemporary: false,
      introduceFromWeek: 0,
      applicationDuration: 'En continu',
      frequencyDetails: 'Dimanche soir recommandé',
      displayTitle: 'Exfoliation hebdomadaire',
      targetBenefit: 'Affiner le grain'
    },
    
    // Phase Adaptation
    {
      stepNumber: 6,
      phase: 'adaptation',
      title: 'Sérum rétinol débutant',
      category: 'treatment',
      applicationAdvice: 'Commencer 2 fois par semaine, augmenter progressivement selon tolérance',
      timeOfDay: 'evening',
      frequency: 'progressive',
      targetArea: 'global',
      recommendedProducts: [{
        catalogId: 'cerave-retinol-serum',
        name: 'Sérum Rétinol Rénovateur',
        brand: 'CeraVe',
        price: 24.90,
        size: '30ml',
        affiliateLink: '#',
        justification: 'Rétinol encapsulé pour une libération progressive'
      }],
      isTemporary: true,
      introduceFromWeek: 2,
      applicationDuration: '12 semaines',
      frequencyDetails: '2x/semaine puis augmenter',
      displayTitle: 'Introduction rétinol',
      targetBenefit: 'Anti-âge global'
    },
    
    // Phase Maintenance
    {
      stepNumber: 7,
      phase: 'maintenance',
      title: 'Sérum vitamine C',
      category: 'treatment',
      applicationAdvice: 'Appliquer le matin avant la crème hydratante',
      timeOfDay: 'morning',
      frequency: 'daily',
      targetArea: 'global',
      recommendedProducts: [{
        catalogId: 'skinceuticals-ce-ferulic',
        name: 'C E Ferulic',
        brand: 'SkinCeuticals',
        price: 145.00,
        size: '30ml',
        affiliateLink: '#',
        justification: 'Protection antioxydante maximale, éclat garanti'
      }],
      isTemporary: false,
      introduceFromWeek: 8,
      applicationDuration: 'En continu',
      displayTitle: 'Antioxydant quotidien',
      targetBenefit: 'Éclat et protection'
    }
  ]

  const demoBeautyAssessment: BeautyAssessment = {
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
    concerns: ['acne', 'pigmentation', 'texture'],
    age: 32,
    sensitivity: 'normal'
  }

  const personalizedContent = {
    phaseDescriptions: {
      immediate: 'Stabiliser votre peau et traiter les imperfections actives',
      adaptation: 'Introduire progressivement des actifs anti-âge puissants',
      maintenance: 'Maintenir les résultats et prévenir le vieillissement'
    },
    globalAdvice: [
      'Soyez patient(e), les résultats apparaissent progressivement',
      'N\'oubliez jamais la protection solaire, même par temps nuageux',
      'Écoutez votre peau et adaptez la fréquence si nécessaire'
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header avec toggle */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Démo Refonte Routines V2
          </h1>
          <p className="text-gray-600 mb-6">
            Testez la nouvelle interface de routines avec organisation par phase et déduplication intelligente.
          </p>
          
          {/* Toggle pour activer/désactiver */}
          <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              Interface classique
            </span>
            <button
              onClick={() => setUseNewDisplay(!useNewDisplay)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useNewDisplay ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useNewDisplay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Nouvelle interface V2
            </span>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Astuce :</strong> Vous pouvez aussi ajouter{' '}
              <code className="px-2 py-1 bg-blue-100 rounded text-xs">
                ?feature_new_routine_display=true
              </code>{' '}
              à l'URL pour activer automatiquement la nouvelle interface.
            </p>
          </div>
        </div>

        {/* Section routine avec feature flag manuel */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {useNewDisplay ? (
            // Nouvelle interface V2 directement
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Nouvelle Interface V2 - Vue Unifiée par Phases
              </h2>
              <PhaseBasedRoutineView
                routine={demoRoutine}
                beautyAssessment={demoBeautyAssessment}
                isAIGenerated={true}
                personalizedContent={personalizedContent}
              />
            </div>
          ) : (
            // Interface classique (UnifiedRoutineSection sans feature flag)
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Interface Classique - Vue par Phases et Horaires
              </h2>
              <UnifiedRoutineSection
                routine={demoRoutine}
                beautyAssessment={demoBeautyAssessment}
                isAIGenerated={true}
                personalizedContent={personalizedContent}
              />
            </div>
          )}
        </div>

        {/* Métriques de comparaison */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Interface Classique
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Double affichage phases + horaires</li>
              <li>• Duplication des produits matin/soir</li>
              <li>• Navigation horizontale</li>
              <li>• ~15-20 blocs affichés</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nouvelle Interface V2
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✨ Vue unifiée phase → horaire</li>
              <li>✨ Déduplication intelligente</li>
              <li>✨ Navigation par onglets</li>
              <li>✨ ~7-10 blocs (60% de réduction)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
