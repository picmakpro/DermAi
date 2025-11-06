'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/layout/Sidebar'
import { DashboardHeader } from '@/components/dashboard/layout/DashboardHeader'
import { MobileNav } from '@/components/dashboard/layout/MobileNav'
import { DashboardLoadingSkeleton } from '@/components/dashboard/common/LoadingSkeleton'
import { AICoachModal } from '@/components/dashboard/coach/AICoachModal'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])
  
  if (status === 'loading') {
    return <DashboardLoadingSkeleton />
  }
  
  if (!session) {
    return null
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar user={session.user} />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <DashboardHeader user={session.user} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
      
      {/* Coach IA Modal */}
      <AICoachModal />
    </div>
  )
}
