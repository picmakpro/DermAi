import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CloudStorageService } from '@/services/storage/cloudStorage'

// GET /api/dashboard/stats - Statistiques générales du dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = (session.user as any).id
    console.log('📊 [DASHBOARD-STATS] Calcul statistiques pour userId:', userId)

    // Récupérer toutes les analyses de l'utilisateur
    const allAnalyses = await CloudStorageService.getUserAnalyses(userId, { limit: 100 })
    console.log('📊 [DASHBOARD-STATS] Analyses trouvées:', allAnalyses.length)

    // Calculer les statistiques
    const stats = {
      // Nombre total d'analyses
      totalAnalyses: allAnalyses.length,
      
      // Streak routine (simulé pour l'instant - sera calculé avec vraies données routine)
      routineStreak: calculateRoutineStreak(allAnalyses),
      
      // Amélioration globale (comparaison première vs dernière analyse)
      globalImprovement: calculateGlobalImprovement(allAnalyses),
      
      // Badges obtenus (simulé pour l'instant)
      badgesCount: calculateBadges(allAnalyses.length),
      
      // Dernière analyse
      lastAnalysisDate: allAnalyses[0]?.created_at || null,
      
      // Analyses par mois (pour graphiques)
      monthlyAnalyses: calculateMonthlyAnalyses(allAnalyses),
      
      // Métriques détaillées
      details: {
        analysesThisMonth: getAnalysesThisMonth(allAnalyses),
        analysesThisWeek: getAnalysesThisWeek(allAnalyses),
        averageTimeBetweenAnalyses: calculateAverageTimeBetween(allAnalyses)
      }
    }

    console.log('✅ [DASHBOARD-STATS] Statistiques calculées:', stats)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('❌ [DASHBOARD-STATS] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// Fonctions utilitaires pour calculer les statistiques
function calculateRoutineStreak(analyses: any[]): number {
  // Pour l'instant, simuler un streak basé sur la fréquence d'analyses
  if (analyses.length === 0) return 0
  if (analyses.length === 1) return 1
  
  // Calculer les jours entre analyses récentes
  const recent = analyses.slice(0, 5)
  let streak = 1
  
  for (let i = 0; i < recent.length - 1; i++) {
    const current = new Date(recent[i].created_at)
    const next = new Date(recent[i + 1].created_at)
    const daysDiff = Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= 7) { // Si moins de 7 jours entre analyses
      streak++
    } else {
      break
    }
  }
  
  return Math.min(streak, 30) // Max 30 jours de streak
}

function calculateGlobalImprovement(analyses: any[]): number {
  if (analyses.length < 2) return 0
  
  // Pour les analyses V2 avec routine, simuler une amélioration basée sur la complexité
  const latest = analyses[0]
  const oldest = analyses[analyses.length - 1]
  
  // Compter le nombre d'étapes dans les routines pour simuler l'amélioration
  const latestSteps = countRoutineSteps(latest.analysis_data)
  const oldestSteps = countRoutineSteps(oldest.analysis_data)
  
  if (latestSteps > oldestSteps) {
    return Math.min(((latestSteps - oldestSteps) / oldestSteps) * 100, 50) // Max 50% d'amélioration
  }
  
  return Math.floor(Math.random() * 20) // Amélioration simulée entre 0-20%
}

function countRoutineSteps(analysisData: any): number {
  if (!analysisData?.routine?.phases) return 0
  
  const phases = analysisData.routine.phases
  let totalSteps = 0
  
  if (phases.immediate?.steps) totalSteps += phases.immediate.steps.length
  if (phases.adaptation?.steps) totalSteps += phases.adaptation.steps.length
  if (phases.maintenance?.steps) totalSteps += phases.maintenance.steps.length
  
  return totalSteps
}

function calculateBadges(analysesCount: number): number {
  // Badges basés sur le nombre d'analyses
  let badges = 0
  
  if (analysesCount >= 1) badges++ // Badge "Première analyse"
  if (analysesCount >= 3) badges++ // Badge "Explorateur"
  if (analysesCount >= 5) badges++ // Badge "Régulier"
  if (analysesCount >= 10) badges++ // Badge "Expert"
  
  return badges
}

function calculateMonthlyAnalyses(analyses: any[]): { month: string, count: number }[] {
  const monthlyData: { [key: string]: number } = {}
  
  analyses.forEach(analysis => {
    const date = new Date(analysis.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
  })
  
  // Retourner les 6 derniers mois
  const result = Object.entries(monthlyData)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6)
    .reverse()
  
  return result
}

function getAnalysesThisMonth(analyses: any[]): number {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  
  return analyses.filter(analysis => {
    const date = new Date(analysis.created_at)
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear
  }).length
}

function getAnalysesThisWeek(analyses: any[]): number {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  return analyses.filter(analysis => {
    const date = new Date(analysis.created_at)
    return date >= weekAgo
  }).length
}

function calculateAverageTimeBetween(analyses: any[]): number {
  if (analyses.length < 2) return 0
  
  let totalDays = 0
  let intervals = 0
  
  for (let i = 0; i < analyses.length - 1; i++) {
    const current = new Date(analyses[i].created_at)
    const next = new Date(analyses[i + 1].created_at)
    const daysDiff = Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
    
    totalDays += daysDiff
    intervals++
  }
  
  return Math.round(totalDays / intervals)
}







