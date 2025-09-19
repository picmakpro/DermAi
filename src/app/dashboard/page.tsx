import { Suspense } from 'react'
import { OverviewStats } from '@/components/dashboard/widgets/OverviewStats'
import { LastAnalysis } from '@/components/dashboard/widgets/LastAnalysis'
import { RoutineToday } from '@/components/dashboard/widgets/RoutineToday'
import { ProgressChart } from '@/components/dashboard/widgets/ProgressChart'
import { RecentBadges } from '@/components/dashboard/widgets/RecentBadges'
import { DashboardSkeleton } from '@/components/dashboard/common/LoadingSkeleton'
import { DashboardTour } from '@/components/dashboard/DashboardTour'

export default async function DashboardPage() {
  return (
    <>
      <DashboardTour />
      <div className="space-y-6 dashboard-overview">
        {/* Header avec actions rapides */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tableau de Bord
            </h1>
            <p className="text-gray-600">
              Bienvenue ! Voici votre suivi personnalisé.
            </p>
          </div>
          
          {/* Actions rapides */}
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <a
              href="/upload"
              className="inline-flex items-center justify-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle Analyse
            </a>
            <a
              href="/dashboard/routine"
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-violet-600 text-sm font-medium rounded-lg border border-violet-200 hover:bg-violet-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Ma Routine
            </a>
          </div>
        </div>
      
      {/* Widgets Grid */}
      <Suspense fallback={<DashboardSkeleton />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="last-analysis-widget">
              <LastAnalysis />
            </div>
            <div className="routine-today-widget">
              <RoutineToday />
            </div>
          </div>
          
          {/* Colonne latérale (1/3) */}
          <div className="space-y-6">
            <OverviewStats />
            <ProgressChart />
            <RecentBadges />
          </div>
        </div>
      </Suspense>
      </div>
    </>
  )
}