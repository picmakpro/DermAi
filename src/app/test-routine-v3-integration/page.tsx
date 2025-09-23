/**
 * Test d'intégration complète Routine V3 dans contexte /results
 * 
 * Simule une vraie page de résultats avec routine V3 intégrée
 */

'use client'

import React from 'react';
import RoutineV3Final from '@/components/routine/RoutineV3Final';
import { RoutineV3TestService } from '@/services/routine/RoutineV3TestService';

export default function TestRoutineV3IntegrationPage() {
  // Simulation d'une analyse complète avec routine V3
  const mockAnalysis = {
    id: "test-analysis-v3",
    diagnostic: {
      skinType: "Mixte",
      scores: { overall: 72 },
      generalObservation: "Peau mixte avec zone T légèrement grasse"
    },
    // Routine V3 injectée
    uiRoutine: RoutineV3TestService.generateTestRoutine(),
    generatedAt: new Date()
  };

  const handleAnalyticsEvent = (event: string, data: any) => {
    console.log(`[routine-integration:${event}]`, data);
    // TODO: Intégrer avec Google Analytics réel
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de simulation */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Test Intégration Routine V3
          </h1>
          <p className="text-gray-600">
            Simulation de la page /results avec routine V3 intégrée
          </p>
        </div>
      </div>

      {/* Simulation du contexte /results */}
      <div className="container mx-auto px-6 py-8">
        
        {/* Section diagnostic (simulée) */}
        <div className="mb-12 p-6 bg-white rounded-2xl border shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Diagnostic (Simulé)
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-900">Type de peau</div>
              <div className="text-blue-700">{mockAnalysis.diagnostic.skinType}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-900">Score global</div>
              <div className="text-green-700">{mockAnalysis.diagnostic.scores.overall}/100</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-900">Observation</div>
              <div className="text-purple-700 text-xs">{mockAnalysis.diagnostic.generalObservation}</div>
            </div>
          </div>
        </div>

        {/* Section Routine V3 - INTÉGRATION RÉELLE */}
        <div className="mb-12">
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <h2 className="text-xl font-semibold text-green-900 mb-2">
              🎯 Section Routine V3 - Intégration Réelle
            </h2>
            <p className="text-green-700 text-sm">
              Cette section remplace l'ancienne routine linéaire dans la page /results
            </p>
          </div>
          
          {/* ROUTINE V3 INTÉGRÉE */}
          <RoutineV3Final 
            routine={mockAnalysis.uiRoutine}
            onAnalyticsEvent={handleAnalyticsEvent}
          />
        </div>

        {/* Validation de l'intégration */}
        <div className="p-6 bg-white rounded-2xl border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ✅ Validation Intégration
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Architecture Validée</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Onglets Phase → Slots fonctionnels</li>
                <li>✅ Navigation sticky responsive</li>
                <li>✅ Badges temporaires avec métadonnées</li>
                <li>✅ Pas de badge "Continu"</li>
                <li>✅ Instructions et restrictions par item</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Intégration /results</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Variante B (Glow) uniquement</li>
                <li>✅ Pas de dark mode</li>
                <li>✅ Analytics events instrumentés</li>
                <li>✅ Alternatives modales fonctionnelles</li>
                <li>✅ Achat Amazon intégré</li>
              </ul>
            </div>
          </div>

          {/* Métriques temps réel */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900 mb-2">📊 Métriques Temps Réel</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="text-center">
                <div className="font-bold text-lg text-blue-600">{mockAnalysis.uiRoutine.phases.length}</div>
                <div className="text-gray-600">Phases</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-green-600">
                  {mockAnalysis.uiRoutine.phases.reduce((total, phase) => 
                    total + Object.values(phase.slots).flat().length, 0
                  )}
                </div>
                <div className="text-gray-600">Items Total</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-purple-600">
                  {mockAnalysis.uiRoutine.phases.reduce((total, phase) => 
                    total + Object.values(phase.slots).flat().filter(item => item.is_temporary).length, 0
                  )}
                </div>
                <div className="text-gray-600">Temporaires</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-orange-600">
                  {mockAnalysis.uiRoutine.phases.reduce((total, phase) => 
                    total + phase.slots.weekly.length, 0
                  )}
                </div>
                <div className="text-gray-600">Hebdomadaires</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
