'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  queryParams?: Record<string, string>
}

export function Pagination({ currentPage, totalPages, baseUrl, queryParams = {} }: PaginationProps) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams(queryParams)
    params.set('page', page.toString())
    return `${baseUrl}?${params.toString()}`
  }
  
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i)
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }
    
    rangeWithDots.push(...range)
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }
    
    return rangeWithDots
  }
  
  if (totalPages <= 1) return null
  
  return (
    <nav className="flex items-center justify-center space-x-2">
      {/* Bouton précédent */}
      <Link
        href={buildUrl(Math.max(1, currentPage - 1))}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors",
          currentPage === 1
            ? "text-gray-400 cursor-not-allowed border-gray-200"
            : "text-gray-700 hover:bg-gray-50 border-gray-300"
        )}
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </Link>
      
      {/* Numéros de page */}
      <div className="flex items-center space-x-1">
        {getVisiblePages().map((page, index) => (
          <span key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <Link
                href={buildUrl(page as number)}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg transition-colors",
                  page === currentPage
                    ? "bg-violet-600 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {page}
              </Link>
            )}
          </span>
        ))}
      </div>
      
      {/* Bouton suivant */}
      <Link
        href={buildUrl(Math.min(totalPages, currentPage + 1))}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors",
          currentPage === totalPages
            ? "text-gray-400 cursor-not-allowed border-gray-200"
            : "text-gray-700 hover:bg-gray-50 border-gray-300"
        )}
        aria-disabled={currentPage === totalPages}
      >
        Suivant
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  )
}





