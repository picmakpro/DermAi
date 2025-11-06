'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  LineChart,
  Calendar,
  Trophy,
  Settings
} from 'lucide-react'

const mobileNavigation = [
  { name: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analyses', href: '/dashboard/analyses', icon: LineChart },
  { name: 'Routine', href: '/dashboard/routine', icon: Calendar },
  { name: 'Progrès', href: '/dashboard/progress', icon: Trophy },
  { name: 'Réglages', href: '/dashboard/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-5 py-2">
        {mobileNavigation.map((item) => {
          const isActive = pathname === item.href || 
                          (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors",
                isActive 
                  ? "text-violet-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 mb-1",
                isActive ? "text-violet-600" : "text-gray-400"
              )} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

