import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AnalysisList } from '@/components/dashboard/analyses/AnalysisList'
import { AnalysisFilters } from '@/components/dashboard/analyses/AnalysisFilters'
import { AnalysisListSkeleton } from '@/components/dashboard/common/LoadingSkeleton'

export default async function AnalysesPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; filter?: string; search?: string; improvement?: string }>
}) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Mes Analyses
          </h1>
          <p className="text-gray-600">
            Historique complet de vos diagnostics
          </p>
        </div>
        
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Analyse
        </Link>
      </div>
      
      {/* Filtres */}
      <AnalysisFilters 
        defaultFilters={{
          dateRange: params.filter || 'all',
          search: params.search || ''
        }}
      />
      
      {/* Liste analyses */}
      <Suspense fallback={<AnalysisListSkeleton />}>
        <AnalysisList 
          page={currentPage}
          filters={params}
        />
      </Suspense>
    </div>
  )
}
