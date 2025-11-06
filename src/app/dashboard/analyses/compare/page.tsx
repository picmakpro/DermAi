import { Suspense } from 'react'
import { ComparisonInterface } from '@/components/dashboard/analyses/ComparisonInterface'

export default async function ComparePage({
  searchParams
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const params = await searchParams
  const analysisIds = params.ids?.split(',') || []
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Comparer vos Analyses
        </h1>
        <p className="text-gray-600">
          Visualisez votre évolution dans le temps
        </p>
      </div>
      
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparisonInterface 
          preselectedIds={analysisIds}
        />
      </Suspense>
    </div>
  )
}

function ComparisonLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Sélecteur analyses skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      
      {/* Comparaison skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 bg-white rounded-lg shadow-sm border animate-pulse" />
        <div className="h-96 bg-white rounded-lg shadow-sm border animate-pulse" />
      </div>
    </div>
  )
}
