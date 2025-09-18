'use client'

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Check, Clock, Sun, Moon, TrendingUp } from 'lucide-react'
import { DashboardCard } from '@/components/dashboard/common/DashboardCard'
import 'react-calendar/dist/Calendar.css'

interface RoutineCompletion {
  completion_date: string
  phase: 'morning' | 'evening'
  completed: boolean
  products_used?: string[]
  notes?: string
}

interface RoutineCalendarProps {
  className?: string
}

interface DayDetailModalProps {
  date: Date
  completions: {
    morning?: RoutineCompletion
    evening?: RoutineCompletion
  }
  onClose: () => void
  onToggleCompletion: (phase: 'morning' | 'evening', completed: boolean) => void
}

export function RoutineCalendar({ className }: RoutineCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [completions, setCompletions] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [showDayDetail, setShowDayDetail] = useState(false)
  const [stats, setStats] = useState({
    currentStreak: 0,
    completionRate30Days: 0,
    totalCompletions: 0
  })

  useEffect(() => {
    fetchCompletions()
    fetchStats()
  }, [selectedDate])

  const fetchCompletions = async () => {
    try {
      const start = startOfMonth(selectedDate)
      const end = endOfMonth(selectedDate)
      
      const response = await fetch(
        `/api/routine/completions?start_date=${format(start, 'yyyy-MM-dd')}&end_date=${format(end, 'yyyy-MM-dd')}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setCompletions(data.completions)
      }
    } catch (error) {
      console.error('Erreur chargement completions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/routine/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          currentStreak: data.currentStreak,
          completionRate30Days: data.completionRate30Days,
          totalCompletions: data.totalCompletions
        })
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const handleToggleCompletion = async (phase: 'morning' | 'evening', completed: boolean) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    
    try {
      const response = await fetch('/api/routine/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completion_date: dateStr,
          phase,
          completed
        })
      })

      if (response.ok) {
        // Mettre à jour l'état local
        setCompletions(prev => ({
          ...prev,
          [dateStr]: {
            ...prev[dateStr],
            [phase]: { ...prev[dateStr]?.[phase], completed }
          }
        }))
        
        // Rafraîchir les stats
        fetchStats()
      }
    } catch (error) {
      console.error('Erreur toggle completion:', error)
    }
  }

  const getTileContent = ({ date }: { date: Date }) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayCompletions = completions[dateStr]
    
    if (!dayCompletions) return null

    const morningDone = dayCompletions.morning?.completed
    const eveningDone = dayCompletions.evening?.completed
    
    return (
      <div className="flex justify-center items-center mt-1">
        <div className="flex gap-1">
          {/* Indicateur matin */}
          <div className={`w-2 h-2 rounded-full ${
            morningDone ? 'bg-orange-400' : 'bg-gray-200'
          }`} />
          {/* Indicateur soir */}
          <div className={`w-2 h-2 rounded-full ${
            eveningDone ? 'bg-indigo-400' : 'bg-gray-200'
          }`} />
        </div>
      </div>
    )
  }

  const getTileClassName = ({ date }: { date: Date }) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayCompletions = completions[dateStr]
    const today = new Date()
    
    let className = 'routine-calendar-tile'
    
    if (isSameDay(date, today)) {
      className += ' today'
    }
    
    if (dayCompletions) {
      const morningDone = dayCompletions.morning?.completed
      const eveningDone = dayCompletions.evening?.completed
      
      if (morningDone && eveningDone) {
        className += ' complete'
      } else if (morningDone || eveningDone) {
        className += ' partial'
      }
    }
    
    return className
  }

  const selectedDayCompletions = completions[format(selectedDate, 'yyyy-MM-dd')] || {}

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats en en-tête */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
              <p className="text-sm text-gray-600">Jours consécutifs</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Check className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate30Days}%</p>
              <p className="text-sm text-gray-600">Taux 30 jours</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCompletions}</p>
              <p className="text-sm text-gray-600">Total routines</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <DashboardCard title="Calendrier de Routine">
        <div className="routine-calendar-wrapper">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={getTileContent}
            tileClassName={getTileClassName}
            locale="fr-FR"
            onClickDay={(date) => {
              setSelectedDate(date)
              setShowDayDetail(true)
            }}
          />
          
          {/* Légende */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
              <span>Routine complète</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <div className="w-2 h-2 rounded-full bg-gray-200" />
              </div>
              <span>Matin seulement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-200" />
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
              <span>Soir seulement</span>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Modal détail jour */}
      {showDayDetail && (
        <DayDetailModal
          date={selectedDate}
          completions={selectedDayCompletions}
          onClose={() => setShowDayDetail(false)}
          onToggleCompletion={handleToggleCompletion}
        />
      )}

      <style jsx global>{`
        .routine-calendar-wrapper .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        
        .routine-calendar-wrapper .react-calendar__tile {
          position: relative;
          padding: 0.75rem 0.5rem;
          background: none;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }
        
        .routine-calendar-wrapper .react-calendar__tile:hover {
          background-color: #f3f4f6;
        }
        
        .routine-calendar-wrapper .react-calendar__tile.today {
          background-color: #ede9fe;
          border-color: #8b5cf6;
        }
        
        .routine-calendar-wrapper .react-calendar__tile.complete {
          background-color: #dcfce7;
          border-color: #16a34a;
        }
        
        .routine-calendar-wrapper .react-calendar__tile.partial {
          background-color: #fef3c7;
          border-color: #d97706;
        }
        
        .routine-calendar-wrapper .react-calendar__tile--active {
          background-color: #8b5cf6 !important;
          color: white;
        }
        
        .routine-calendar-wrapper .react-calendar__navigation button {
          color: #374151;
          font-size: 1rem;
          font-weight: 500;
        }
        
        .routine-calendar-wrapper .react-calendar__navigation button:hover {
          background-color: #f3f4f6;
        }
      `}</style>
    </div>
  )
}

function DayDetailModal({ date, completions, onClose, onToggleCompletion }: DayDetailModalProps) {
  const dateStr = format(date, 'dd MMMM yyyy', { locale: fr })
  const isToday = isSameDay(date, new Date())
  const isFuture = date > new Date()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Routine du {dateStr}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {isFuture ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Cette date est dans le futur</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Phase Matin */}
              <RoutinePhase
                phase="morning"
                icon={Sun}
                title="Routine Matin"
                completion={completions.morning}
                onToggle={(completed) => onToggleCompletion('morning', completed)}
                disabled={!isToday}
              />

              {/* Phase Soir */}
              <RoutinePhase
                phase="evening"
                icon={Moon}
                title="Routine Soir"
                completion={completions.evening}
                onToggle={(completed) => onToggleCompletion('evening', completed)}
                disabled={!isToday}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface RoutinePhaseProps {
  phase: 'morning' | 'evening'
  icon: any
  title: string
  completion?: RoutineCompletion
  onToggle: (completed: boolean) => void
  disabled: boolean
}

function RoutinePhase({ phase, icon: Icon, title, completion, onToggle, disabled }: RoutinePhaseProps) {
  const isCompleted = completion?.completed || false
  const iconColor = phase === 'morning' ? 'text-orange-500' : 'text-indigo-500'
  
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <span className="font-medium">{title}</span>
        </div>
        
        {!disabled && (
          <button
            onClick={() => onToggle(!isCompleted)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
              isCompleted
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isCompleted ? (
              <>
                <Check className="h-4 w-4" />
                Complétée
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                À faire
              </>
            )}
          </button>
        )}
      </div>
      
      {completion?.notes && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
          {completion.notes}
        </div>
      )}
      
      {isCompleted && completion?.created_at && (
        <div className="mt-2 text-xs text-gray-500">
          Complétée le {format(new Date(completion.created_at), 'dd/MM à HH:mm')}
        </div>
      )}
    </div>
  )
}
