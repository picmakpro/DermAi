'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  LineChart,
  Calendar,
  Package,
  Settings,
  MessageCircle,
  Trophy,
  Plus
} from 'lucide-react'

const navigation = [
  { name: 'Vue d\'ensemble', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mes Analyses', href: '/dashboard/analyses', icon: LineChart },
  { name: 'Ma Routine', href: '/dashboard/routine', icon: Calendar },
  { name: 'Étagères Produits', href: '/dashboard/routine/shelves', icon: Package },
  { name: 'Progression', href: '/dashboard/progress', icon: Trophy },
  { name: 'Coach IA', href: '/dashboard/routine/coach', icon: MessageCircle },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  user: any
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  
  return (
    <div className="flex h-full w-72 flex-col bg-white shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500" />
          <span className="text-xl font-semibold">DermAI</span>
        </Link>
      </div>
      
      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          {user?.image ? (
            <img 
              src={user.image} 
              alt={user.name || 'Utilisateur'}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.subscription_status === 'premium' ? 'Premium' : 'Gratuit'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 sidebar-nav">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      {/* CTA Nouvelle Analyse */}
      <div className="p-4 border-t">
        <Link
          href="/upload"
          className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Analyse
        </Link>
      </div>
    </div>
  )
}
