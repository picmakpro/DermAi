/**
 * Page de test pour la Routine V3
 * 
 * Test simple de l'intégration sans dépendances complexes
 */

'use client'

import React from 'react';
import RoutineV3Demo from '@/components/routine/RoutineV3Demo';

export default function TestRoutineV3Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Test Routine V3 - Demo
          </h1>
          <p className="text-gray-600">
            Validation de l'intégration Preview → Composant React
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Variante A - Clinical */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Variante A - Clinical</h2>
            <div className="border rounded-lg overflow-hidden">
              <RoutineV3Demo variant="A" />
            </div>
          </div>
          
          {/* Variante B - Glow */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Variante B - Glow</h2>
            <div className="border rounded-lg overflow-hidden">
              <RoutineV3Demo variant="B" />
            </div>
          </div>
          
          {/* Variante C - Editorial */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Variante C - Editorial</h2>
            <div className="border rounded-lg overflow-hidden">
              <RoutineV3Demo variant="C" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
