import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CloudStorageService } from '@/services/storage/cloudStorage'

// POST /api/badges/check - Vérifier et attribuer de nouveaux badges
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = (session.user as any).id
    console.log('🔍 [BADGES-CHECK] Vérification nouveaux badges pour userId:', userId)

    // Import dynamique côté serveur uniquement
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')

    // Récupérer les badges existants
    const { data: existingBadges, error: badgesError } = await supabaseAdmin
      .from('user_badges')
      .select('badge_type, badge_level')
      .eq('user_id', userId)

    if (badgesError) {
      console.error('❌ [BADGES-CHECK] Erreur récupération badges existants:', badgesError)
      throw badgesError
    }

    const existingBadgeKeys = new Set(
      (existingBadges || []).map(b => `${b.badge_type}_${b.badge_level}`)
    )

    // Calculer les nouveaux badges à attribuer
    const newBadges = await calculateNewBadges(userId, existingBadgeKeys)

    // Sauvegarder les nouveaux badges
    if (newBadges.length > 0) {
      console.log('🏆 [BADGES-CHECK] Nouveaux badges à créer:', newBadges.length)
      
      try {
        const { data: savedBadges, error: saveError } = await supabaseAdmin
          .from('user_badges')
          .insert(newBadges.map(badge => ({
            user_id: userId,
            ...badge
          })))
          .select()

        if (saveError) {
          console.error('❌ [BADGES-CHECK] Erreur sauvegarde nouveaux badges:', saveError)
          throw saveError
        }

        console.log('✅ [BADGES-CHECK] Nouveaux badges sauvegardés:', savedBadges?.length || 0)
        
        return NextResponse.json({
          success: true,
          data: savedBadges || []
        })
      } catch (saveError) {
        console.error('❌ [BADGES-CHECK] Erreur sauvegarde nouveaux badges:', saveError)
        // Continuer même si la sauvegarde échoue
      }
    }

    console.log('ℹ️ [BADGES-CHECK] Aucun nouveau badge à attribuer')
    return NextResponse.json({
      success: true,
      data: []
    })

  } catch (error) {
    console.error('❌ [BADGES-CHECK] Erreur vérification badges:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// Fonction pour calculer les nouveaux badges à attribuer
async function calculateNewBadges(userId: string, existingBadgeKeys: Set<string>) {
  const newBadges: any[] = []

  try {
    // Récupérer les statistiques utilisateur
    const analyses = await CloudStorageService.getUserAnalyses(userId, { limit: 100 })
    const analysisCount = analyses.length

    // Badges basés sur le nombre d'analyses
    const analysisBadges = [
      { level: 'bronze', required: 1, title: 'Première Analyse' },
      { level: 'silver', required: 3, title: 'Explorateur Curieux' },
      { level: 'gold', required: 5, title: 'Analyste Régulier' },
      { level: 'platinum', required: 10, title: 'Expert en Diagnostic' }
    ]

    for (const badge of analysisBadges) {
      const badgeKey = `analysis_count_${badge.level}`
      if (analysisCount >= badge.required && !existingBadgeKeys.has(badgeKey)) {
        newBadges.push({
          badge_type: 'analysis_count',
          badge_level: badge.level,
          badge_criteria: {
            required: badge.required,
            current: analysisCount,
            title: badge.title
          }
        })
      }
    }

    // Badges basés sur la routine (simulé pour l'instant)
    const routineStreak = Math.min(analysisCount, 7) // Simulé
    const routineBadges = [
      { level: 'bronze', required: 3, title: 'Première Routine' },
      { level: 'silver', required: 7, title: 'Une Semaine Régulière' }
    ]

    for (const badge of routineBadges) {
      const badgeKey = `routine_streak_${badge.level}`
      if (routineStreak >= badge.required && !existingBadgeKeys.has(badgeKey)) {
        newBadges.push({
          badge_type: 'routine_streak',
          badge_level: badge.level,
          badge_criteria: {
            required: badge.required,
            current: routineStreak,
            title: badge.title
          }
        })
      }
    }

    console.log('📊 [BADGES-CHECK] Statistiques calculées:', {
      analysisCount,
      routineStreak,
      newBadgesCount: newBadges.length
    })

  } catch (error) {
    console.error('❌ [BADGES-CHECK] Erreur calcul badges:', error)
  }

  return newBadges
}