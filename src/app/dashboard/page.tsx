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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de Bord
          </h1>
          <p className="text-gray-600">
            Bienvenue ! Voici votre suivi personnalisé.
          </p>
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