import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AnalysisCard } from './AnalysisCard'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/dashboard/common/EmptyState'

const ITEMS_PER_PAGE = 10

interface AnalysisListProps {
  page: number
  filters: Record<string, string>
}

// Données mockées pour le développement
const mockAnalyses = [
  {
    id: '1',
    created_at: '2025-09-15T10:30:00Z',
    analysis_data: {
      globalScore: 78,
      scores: {
        hydration: 85,
        texture: 72,
        radiance: 80,
        wrinkles: 65,
        elasticity: 75,
        sebum: 70,
        sensitivity: 88,
        darkSpots: 60
      }
    },
    photos_metadata: [
      { url: '/images/face-model.png', angle: 'front' }
    ],
    improvement_vs_previous: 12
  },
  {
    id: '2',
    created_at: '2025-09-01T14:20:00Z',
    analysis_data: {
      globalScore: 66,
      scores: {
        hydration: 70,
        texture: 65,
        radiance: 68,
        wrinkles: 60,
        elasticity: 70,
        sebum: 75,
        sensitivity: 80,
        darkSpots: 55
      }
    },
    photos_metadata: [
      { url: '/images/face-model.png', angle: 'front' }
    ],
    improvement_vs_previous: -5
  },
  {
    id: '3',
    created_at: '2025-08-15T09:15:00Z',
    analysis_data: {
      globalScore: 71,
      scores: {
        hydration: 75,
        texture: 70,
        radiance: 72,
        wrinkles: 65,
        elasticity: 68,
        sebum: 80,
        sensitivity: 85,
        darkSpots: 58
      }
    },
    photos_metadata: [
      { url: '/images/face-model.png', angle: 'front' }
    ]
  }
]

export async function AnalysisList({ page, filters }: AnalysisListProps) {
  // TODO: Remplacer par vraie API call
  const analyses = mockAnalyses
  const total = analyses.length
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  
  // Simulation filtrage
  let filteredAnalyses = analyses
  
  if (filters.search) {
    // Simulation recherche (en vrai, côté serveur)
    filteredAnalyses = analyses.filter(analysis => 
      analysis.id.includes(filters.search) ||
      analysis.created_at.includes(filters.search)
    )
  }
  
  // Pagination
  const offset = (page - 1) * ITEMS_PER_PAGE
  const paginatedAnalyses = filteredAnalyses.slice(offset, offset + ITEMS_PER_PAGE)
  
  if (paginatedAnalyses.length === 0) {
    return (
      <EmptyState
        title="Aucune analyse trouvée"
        description={filters.search 
          ? "Aucun résultat ne correspond à votre recherche."
          : "Commencez par réaliser votre première analyse de peau."
        }
        action={
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Analyse
          </Link>
        }
      />
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Liste des analyses */}
      <div className="space-y-4">
        {paginatedAnalyses.map((analysis) => (
          <AnalysisCard key={analysis.id} analysis={analysis} />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseUrl="/dashboard/analyses"
          queryParams={filters}
        />
      )}
      
      {/* Stats en bas */}
      <div className="text-center text-sm text-gray-600">
        Affichage de {offset + 1} à {Math.min(offset + ITEMS_PER_PAGE, total)} sur {total} analyses
      </div>
    </div>
  )
}


