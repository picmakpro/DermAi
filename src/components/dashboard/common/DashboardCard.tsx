'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}

export function DashboardCard({ title, children, action, className }: DashboardCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border p-6",
      className
    )}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          {action && action}
        </div>
      )}
      {children}
    </div>
  )
}













