'use client'

import React, { useEffect, useRef, useCallback } from 'react'

interface AnalyticsEvent {
  event: string
  section: string
  action: string
  value?: number
  metadata?: Record<string, any>
  timestamp: number
}

interface AnalyticsTrackerProps {
  sectionName: string
  trackViews?: boolean
  trackClicks?: boolean
  trackScrollDepth?: boolean
  trackTimeSpent?: boolean
  children: React.ReactNode
  className?: string
}

// Store global pour les événements analytics
class AnalyticsStore {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private startTime: number
  
  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  track(event: Omit<AnalyticsEvent, 'timestamp'>) {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now()
    }
    
    this.events.push(fullEvent)
    
    // Log pour développement
    console.log('📊 Analytics Event:', fullEvent)
    
    // Envoyer à Google Analytics si disponible
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.section,
        event_label: event.event,
        value: event.value,
        custom_parameter_section: event.section,
        custom_parameter_metadata: JSON.stringify(event.metadata)
      })
    }
    
    // Limiter le nombre d'événements stockés
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500)
    }
  }
  
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }
  
  getSessionSummary() {
    const now = Date.now()
    const sessionDuration = now - this.startTime
    
    const eventsBySection = this.events.reduce((acc, event) => {
      if (!acc[event.section]) {
        acc[event.section] = []
      }
      acc[event.section].push(event)
      return acc
    }, {} as Record<string, AnalyticsEvent[]>)
    
    return {
      sessionId: this.sessionId,
      duration: sessionDuration,
      totalEvents: this.events.length,
      eventsBySection,
      sectionsViewed: Object.keys(eventsBySection),
      mostViewedSection: Object.entries(eventsBySection)
        .sort(([,a], [,b]) => b.length - a.length)[0]?.[0]
    }
  }
  
  exportData() {
    return {
      session: this.getSessionSummary(),
      events: this.events
    }
  }
}

// Instance globale
const analyticsStore = new AnalyticsStore()

export function AnalyticsTracker({
  sectionName,
  trackViews = true,
  trackClicks = true,
  trackScrollDepth = false,
  trackTimeSpent = true,
  children,
  className = ''
}: AnalyticsTrackerProps) {
  
  const sectionRef = useRef<HTMLDivElement>(null)
  const viewStartTime = useRef<number>(0)
  const hasBeenViewed = useRef(false)
  const scrollDepthTracked = useRef<Set<number>>(new Set())
  
  // Track section view
  useEffect(() => {
    if (!trackViews) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenViewed.current) {
            hasBeenViewed.current = true
            viewStartTime.current = Date.now()
            
            analyticsStore.track({
              event: 'section_view',
              section: sectionName,
              action: 'view',
              metadata: {
                intersectionRatio: entry.intersectionRatio,
                boundingRect: {
                  width: entry.boundingClientRect.width,
                  height: entry.boundingClientRect.height
                }
              }
            })
          }
        })
      },
      { threshold: 0.1 }
    )
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }
    
    return () => observer.disconnect()
  }, [sectionName, trackViews])
  
  // Track time spent
  useEffect(() => {
    if (!trackTimeSpent) return
    
    const handleVisibilityChange = () => {
      if (document.hidden && viewStartTime.current > 0) {
        const timeSpent = Date.now() - viewStartTime.current
        
        analyticsStore.track({
          event: 'time_spent',
          section: sectionName,
          action: 'time_tracking',
          value: timeSpent,
          metadata: {
            timeSpentSeconds: Math.round(timeSpent / 1000)
          }
        })
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Track time on unmount
      if (viewStartTime.current > 0) {
        const timeSpent = Date.now() - viewStartTime.current
        analyticsStore.track({
          event: 'section_exit',
          section: sectionName,
          action: 'time_tracking',
          value: timeSpent,
          metadata: {
            timeSpentSeconds: Math.round(timeSpent / 1000)
          }
        })
      }
    }
  }, [sectionName, trackTimeSpent])
  
  // Track scroll depth
  useEffect(() => {
    if (!trackScrollDepth) return
    
    const handleScroll = () => {
      if (!sectionRef.current) return
      
      const rect = sectionRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const sectionHeight = rect.height
      
      // Calculer le pourcentage de scroll dans la section
      const scrollTop = Math.max(0, -rect.top)
      const visibleHeight = Math.min(windowHeight, rect.bottom) - Math.max(0, rect.top)
      const scrollPercent = Math.round((scrollTop / sectionHeight) * 100)
      
      // Tracker les jalons de 25%
      const milestones = [25, 50, 75, 100]
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !scrollDepthTracked.current.has(milestone)) {
          scrollDepthTracked.current.add(milestone)
          
          analyticsStore.track({
            event: 'scroll_depth',
            section: sectionName,
            action: 'scroll',
            value: milestone,
            metadata: {
              scrollPercent,
              visibleHeight,
              sectionHeight
            }
          })
        }
      })
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sectionName, trackScrollDepth])
  
  // Track clicks
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!trackClicks) return
    
    const target = event.target as HTMLElement
    const elementType = target.tagName.toLowerCase()
    const elementClass = target.className
    const elementText = target.textContent?.slice(0, 50) || ''
    
    analyticsStore.track({
      event: 'click',
      section: sectionName,
      action: 'click',
      metadata: {
        elementType,
        elementClass,
        elementText,
        coordinates: {
          x: event.clientX,
          y: event.clientY
        }
      }
    })
  }, [sectionName, trackClicks])
  
  return (
    <div
      ref={sectionRef}
      onClick={handleClick}
      className={className}
      data-analytics-section={sectionName}
    >
      {children}
    </div>
  )
}

/**
 * Hook pour accéder aux données analytics
 */
export function useAnalytics() {
  const trackEvent = useCallback((event: Omit<AnalyticsEvent, 'timestamp'>) => {
    analyticsStore.track(event)
  }, [])
  
  const getSessionSummary = useCallback(() => {
    return analyticsStore.getSessionSummary()
  }, [])
  
  const exportAnalytics = useCallback(() => {
    return analyticsStore.exportData()
  }, [])
  
  return {
    trackEvent,
    getSessionSummary,
    exportAnalytics
  }
}

/**
 * Composant pour afficher les analytics en temps réel (dev only)
 */
export function AnalyticsDashboard() {
  const [summary, setSummary] = React.useState<any>(null)
  const { getSessionSummary } = useAnalytics()
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getSessionSummary())
    }, 2000)
    
    return () => clearInterval(interval)
  }, [getSessionSummary])
  
  if (process.env.NODE_ENV !== 'development' || !summary) {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">📊 Analytics Live</h4>
      <div className="space-y-1">
        <div>Session: {Math.round(summary.duration / 1000)}s</div>
        <div>Événements: {summary.totalEvents}</div>
        <div>Sections vues: {summary.sectionsViewed.length}</div>
        <div>Plus vue: {summary.mostViewedSection}</div>
      </div>
    </div>
  )
}

export { analyticsStore }
export default AnalyticsTracker


