import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST /api/badges/check - Vérifier et attribuer de nouveaux badges
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const newBadges = []
    
    // Vérifier chaque type de badge
    const routineBadges = await checkRoutineBadges(session.user.id)
    const analysisBadges = await checkAnalysisBadges(session.user.id)
    const improvementBadges = await checkImprovementBadges(session.user.id)
    const discoveryBadges = await checkDiscoveryBadges(session.user.id)
    
    newBadges.push(...routineBadges, ...analysisBadges, ...improvementBadges, ...discoveryBadges)
    
    // Sauvegarder les nouveaux badges
    if (newBadges.length > 0) {
      const { error } = await supabase
        .from('user_badges')
        .insert(newBadges.map(badge => ({
          ...badge,
          user_id: session.user.id,
          earned_at: new Date().toISOString(),
          is_new: true
        })))
      
      if (error) {
        console.error('Erreur sauvegarde nouveaux badges:', error)
      }
    }
    
    return NextResponse.json(newBadges)

  } catch (error) {
    console.error('Erreur API badges check:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Vérifier badges de routine
async function checkRoutineBadges(userId: string) {
  const newBadges = []
  
  try {
    // Calculer le streak actuel (simulation - à adapter selon votre logique)
    const currentStreak = await getCurrentRoutineStreak(userId)
    
    const routineBadgeThresholds = [
      { level: 'bronze', days: 7 },
      { level: 'silver', days: 30 },
      { level: 'gold', days: 90 },
      { level: 'platinum', days: 365 }
    ]
    
    for (const threshold of routineBadgeThresholds) {
      if (currentStreak >= threshold.days) {
        // Vérifier si le badge n'existe pas déjà
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_type', 'routine_streak')
          .eq('badge_level', threshold.level)
          .single()
        
        if (!existingBadge) {
          newBadges.push({
            badge_type: 'routine_streak',
            badge_level: threshold.level,
            badge_criteria: { days: threshold.days, achieved_streak: currentStreak }
          })
        }
      }
    }
  } catch (error) {
    console.error('Erreur vérification badges routine:', error)
  }
  
  return newBadges
}

// Vérifier badges d'analyses
async function checkAnalysisBadges(userId: string) {
  const newBadges = []
  
  try {
    // Compter le nombre d'analyses
    const { count } = await supabase
      .from('user_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    const analysisCount = count || 0
    
    const analysisBadgeThresholds = [
      { level: 'bronze', count: 3 },
      { level: 'silver', count: 10 },
      { level: 'gold', count: 25 },
      { level: 'platinum', count: 50 }
    ]
    
    for (const threshold of analysisBadgeThresholds) {
      if (analysisCount >= threshold.count) {
        // Vérifier si le badge n'existe pas déjà
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_type', 'analysis_count')
          .eq('badge_level', threshold.level)
          .single()
        
        if (!existingBadge) {
          newBadges.push({
            badge_type: 'analysis_count',
            badge_level: threshold.level,
            badge_criteria: { count: threshold.count, achieved_count: analysisCount }
          })
        }
      }
    }
  } catch (error) {
    console.error('Erreur vérification badges analyses:', error)
  }
  
  return newBadges
}

// Vérifier badges d'amélioration
async function checkImprovementBadges(userId: string) {
  const newBadges = []
  
  try {
    // Calculer l'amélioration (simulation - à adapter selon votre logique)
    const improvement = await calculateImprovement(userId)
    
    const improvementBadgeThresholds = [
      { level: 'bronze', percent: 10 },
      { level: 'silver', percent: 25 },
      { level: 'gold', percent: 50 },
      { level: 'platinum', percent: 75 }
    ]
    
    for (const threshold of improvementBadgeThresholds) {
      if (improvement >= threshold.percent) {
        // Vérifier si le badge n'existe pas déjà
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_type', 'improvement')
          .eq('badge_level', threshold.level)
          .single()
        
        if (!existingBadge) {
          newBadges.push({
            badge_type: 'improvement',
            badge_level: threshold.level,
            badge_criteria: { percent: threshold.percent, achieved_improvement: improvement }
          })
        }
      }
    }
  } catch (error) {
    console.error('Erreur vérification badges amélioration:', error)
  }
  
  return newBadges
}

// Vérifier badges de découverte
async function checkDiscoveryBadges(userId: string) {
  const newBadges = []
  
  try {
    // Compter les produits découverts (simulation - à adapter selon votre logique)
    const productsDiscovered = await countDiscoveredProducts(userId)
    
    const discoveryBadgeThresholds = [
      { level: 'bronze', products: 5 },
      { level: 'silver', products: 15 },
      { level: 'gold', products: 30 },
      { level: 'platinum', products: 50 }
    ]
    
    for (const threshold of discoveryBadgeThresholds) {
      if (productsDiscovered >= threshold.products) {
        // Vérifier si le badge n'existe pas déjà
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('badge_type', 'discovery')
          .eq('badge_level', threshold.level)
          .single()
        
        if (!existingBadge) {
          newBadges.push({
            badge_type: 'discovery',
            badge_level: threshold.level,
            badge_criteria: { products: threshold.products, achieved_count: productsDiscovered }
          })
        }
      }
    }
  } catch (error) {
    console.error('Erreur vérification badges découverte:', error)
  }
  
  return newBadges
}

// Helpers (à adapter selon votre logique métier)
async function getCurrentRoutineStreak(userId: string): Promise<number> {
  // Simulation - remplacer par votre logique de calcul de streak
  return Math.floor(Math.random() * 30) + 1
}

async function calculateImprovement(userId: string): Promise<number> {
  try {
    // Récupérer les 2 dernières analyses pour calculer l'amélioration
    const { data: analyses } = await supabase
      .from('user_analyses')
      .select('analysis_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2)
    
    if (!analyses || analyses.length < 2) {
      return 0
    }
    
    const [latest, previous] = analyses
    const latestScore = latest.analysis_data?.globalScore || 0
    const previousScore = previous.analysis_data?.globalScore || 0
    
    if (previousScore === 0) return 0
    
    const improvement = ((latestScore - previousScore) / previousScore) * 100
    return Math.max(0, improvement)
  } catch (error) {
    console.error('Erreur calcul amélioration:', error)
    return 0
  }
}

async function countDiscoveredProducts(userId: string): Promise<number> {
  try {
    // Compter les produits uniques dans les étagères utilisateur
    const { data: shelves } = await supabase
      .from('user_product_shelves')
      .select('products')
      .eq('user_id', userId)
    
    if (!shelves) return 0
    
    const allProducts = shelves.flatMap(shelf => shelf.products || [])
    const uniqueProducts = new Set(allProducts.map(p => p.id))
    
    return uniqueProducts.size
  } catch (error) {
    console.error('Erreur comptage produits découverts:', error)
    return 0
  }
}
