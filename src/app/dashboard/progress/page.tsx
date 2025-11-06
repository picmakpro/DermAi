import { Suspense } from 'react'
import { BadgeSystem } from '@/components/dashboard/badges/BadgeSystem'
import { ProgressChart } from '@/components/dashboard/widgets/ProgressChart'

export default function ProgressPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Votre Progression
        </h1>
        <p className="text-gray-600">
          Suivez votre évolution et vos accomplissements
        </p>
      </div>
      
      {/* Graphiques évolution */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Évolution de vos Scores</h2>
        <Suspense fallback={
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
          </div>
        }>
          <ProgressChart />
        </Suspense>
      </div>
      
      {/* Section badges */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <Suspense fallback={
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse" />
            </div>
            
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        }>
          <BadgeSystem />
        </Suspense>
      </div>
    </div>
  )
}