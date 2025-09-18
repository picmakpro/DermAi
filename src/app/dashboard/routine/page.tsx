import { Suspense } from 'react'
import Link from 'next/link'
import { Calendar, Package, MessageCircle } from 'lucide-react'
import { RoutineCalendar } from '@/components/dashboard/routine/RoutineCalendar'
import { LoadingSkeleton } from '@/components/dashboard/common/LoadingSkeleton'

export default function RoutinePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ma Routine
          </h1>
          <p className="text-gray-600">
            Suivez votre routine quotidienne et maintenez vos habitudes
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/dashboard/routine/shelves"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Package className="h-4 w-4" />
            Mes Étagères
          </Link>
          <Link
            href="/dashboard/routine/coach"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            <MessageCircle className="h-4 w-4" />
            Coach IA
          </Link>
        </div>
      </div>

      {/* Calendrier de routine */}
      <Suspense fallback={<RoutineCalendarSkeleton />}>
        <RoutineCalendar />
      </Suspense>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/upload"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-100 rounded-lg group-hover:bg-violet-200 transition-colors">
              <Calendar className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Nouvelle Analyse</h3>
              <p className="text-sm text-gray-600">Suivez votre évolution</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/routine/shelves"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Organiser Produits</h3>
              <p className="text-sm text-gray-600">Gérez vos étagères</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/progress"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Voir Progression</h3>
              <p className="text-sm text-gray-600">Badges et évolution</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

function RoutineCalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar skeleton */}
      <div className="bg-white rounded-lg p-6 border shadow-sm">
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="w-full h-80 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  )
}