import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/routine/stats - Récupérer les statistiques de routine
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // supabase est déjà importé
    const userId = session.user.id

    // Récupérer toutes les complétions pour calculs
    const { data: completions, error } = await supabase
      .from('routine_completions')
      .select('completion_date, phase, completed')
      .eq('user_id', userId)
      .order('completion_date', { ascending: true })

    if (error) {
      console.error('Erreur récupération stats:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Calculer les statistiques
    const stats = calculateRoutineStats(completions)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Erreur API routine stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function calculateRoutineStats(completions: any[]) {
  const today = new Date().toISOString().split('T')[0]
  
  // Organiser par date
  const completionsByDate = completions.reduce((acc, completion) => {
    const date = completion.completion_date
    if (!acc[date]) {
      acc[date] = { morning: false, evening: false }
    }
    if (completion.completed) {
      acc[date][completion.phase] = true
    }
    return acc
  }, {})

  // Calculer streak actuel
  const currentStreak = calculateCurrentStreak(completionsByDate, today)
  
  // Calculer meilleur streak
  const bestStreak = calculateBestStreak(completionsByDate)
  
  // Taux de complétion sur 30 derniers jours
  const completionRate30Days = calculateCompletionRate(completionsByDate, 30)
  
  // Taux de complétion sur 7 derniers jours
  const completionRate7Days = calculateCompletionRate(completionsByDate, 7)
  
  // Statistiques par jour de la semaine
  const weekdayStats = calculateWeekdayStats(completionsByDate)
  
  // Progression mensuelle (6 derniers mois)
  const monthlyProgress = calculateMonthlyProgress(completionsByDate)

  return {
    currentStreak,
    bestStreak,
    completionRate30Days,
    completionRate7Days,
    weekdayStats,
    monthlyProgress,
    totalCompletions: completions.filter(c => c.completed).length,
    totalDaysTracked: Object.keys(completionsByDate).length
  }
}

function calculateCurrentStreak(completionsByDate: any, today: string): number {
  let streak = 0
  let currentDate = new Date(today)
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayCompletion = completionsByDate[dateStr]
    
    // Considérer le jour comme complet si au moins une phase est faite
    if (dayCompletion && (dayCompletion.morning || dayCompletion.evening)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

function calculateBestStreak(completionsByDate: any): number {
  const dates = Object.keys(completionsByDate).sort()
  let bestStreak = 0
  let currentStreak = 0
  
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    const dayCompletion = completionsByDate[date]
    
    if (dayCompletion && (dayCompletion.morning || dayCompletion.evening)) {
      currentStreak++
      bestStreak = Math.max(bestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }
  
  return bestStreak
}

function calculateCompletionRate(completionsByDate: any, days: number): number {
  const today = new Date()
  let completedDays = 0
  let totalDays = 0
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    totalDays++
    const dayCompletion = completionsByDate[dateStr]
    if (dayCompletion && (dayCompletion.morning || dayCompletion.evening)) {
      completedDays++
    }
  }
  
  return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
}

function calculateWeekdayStats(completionsByDate: any) {
  const weekdays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const stats = weekdays.map(day => ({ day, completed: 0, total: 0 }))
  
  Object.keys(completionsByDate).forEach(dateStr => {
    const date = new Date(dateStr)
    const weekday = date.getDay()
    const dayCompletion = completionsByDate[dateStr]
    
    stats[weekday].total++
    if (dayCompletion && (dayCompletion.morning || dayCompletion.evening)) {
      stats[weekday].completed++
    }
  })
  
  return stats.map(stat => ({
    ...stat,
    rate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
  }))
}

function calculateMonthlyProgress(completionsByDate: any) {
  const months = []
  const today = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthStr = date.toISOString().slice(0, 7) // YYYY-MM
    const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    
    // Compter les jours du mois avec complétion
    const monthCompletions = Object.keys(completionsByDate)
      .filter(dateStr => dateStr.startsWith(monthStr))
      .filter(dateStr => {
        const dayCompletion = completionsByDate[dateStr]
        return dayCompletion && (dayCompletion.morning || dayCompletion.evening)
      })
    
    // Nombre total de jours dans le mois (jusqu'à aujourd'hui si mois actuel)
    const isCurrentMonth = i === 0
    const daysInMonth = isCurrentMonth 
      ? today.getDate()
      : new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    
    months.push({
      month: monthName,
      completed: monthCompletions.length,
      total: daysInMonth,
      rate: daysInMonth > 0 ? Math.round((monthCompletions.length / daysInMonth) * 100) : 0
    })
  }
  
  return months
}
