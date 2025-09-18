'use client'

export function DashboardLoadingSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex h-full w-72 flex-col bg-white shadow-sm">
          {/* Logo skeleton */}
          <div className="flex h-16 items-center px-6 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          
          {/* User info skeleton */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Navigation skeleton */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </nav>
          
          {/* CTA skeleton */}
          <div className="p-4 border-t">
            <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Header skeleton */}
        <div className="bg-white shadow-sm border-b h-16">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="hidden lg:flex lg:flex-1 lg:max-w-md">
              <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              {/* Title skeleton */}
              <div>
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
              </div>
              
              {/* Cards skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-64 bg-white rounded-lg shadow-sm border animate-pulse" />
                  <div className="h-48 bg-white rounded-lg shadow-sm border animate-pulse" />
                </div>
                <div className="space-y-6">
                  <div className="h-32 bg-white rounded-lg shadow-sm border animate-pulse" />
                  <div className="h-48 bg-white rounded-lg shadow-sm border animate-pulse" />
                  <div className="h-32 bg-white rounded-lg shadow-sm border animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>
      
      {/* Widgets grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-white rounded-lg shadow-sm border animate-pulse" />
          <div className="h-48 bg-white rounded-lg shadow-sm border animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-white rounded-lg shadow-sm border animate-pulse" />
          <div className="h-48 bg-white rounded-lg shadow-sm border animate-pulse" />
          <div className="h-32 bg-white rounded-lg shadow-sm border animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function AnalysisListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filtres skeleton */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      
      {/* Liste analyses skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex gap-6">
              {/* Photo skeleton */}
              <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
              
              {/* Contenu skeleton */}
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
                
                <div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="flex gap-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="text-center">
                        <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mb-1" />
                        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions skeleton */}
            <div className="flex gap-3 mt-4 pt-4 border-t">
              <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-center space-x-2">
        <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
        ))}
        <div className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
