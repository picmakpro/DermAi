'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar, Filter } from 'lucide-react'
import { useState } from 'react'

interface AnalysisFiltersProps {
  defaultFilters: {
    dateRange: string
    search: string
  }
}

export function AnalysisFilters({ defaultFilters }: AnalysisFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(defaultFilters.search)
  
  const handleFilterChange = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(filterType, value)
    params.set('page', '1') // Reset page on filter change
    router.push(`/dashboard/analyses?${params.toString()}`)
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange('search', searchQuery)
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Recherche */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans vos analyses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </form>
        
        {/* Filtre période */}
        <select
          value={defaultFilters.dateRange}
          onChange={(e) => handleFilterChange('filter', e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">Toutes les analyses</option>
          <option value="last_month">Dernier mois</option>
          <option value="last_3_months">3 derniers mois</option>
          <option value="last_year">Dernière année</option>
        </select>
        
        {/* Filtre amélioration */}
        <select
          onChange={(e) => handleFilterChange('improvement', e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">Toutes</option>
          <option value="improved">Améliorées</option>
          <option value="declined">Dégradées</option>
          <option value="stable">Stables</option>
        </select>
      </div>
    </div>
  )
}

