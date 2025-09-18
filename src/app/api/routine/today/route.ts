import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/routine/today - Récupérer la routine du jour
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    // supabase est déjà importé

    // Récupérer les complétions du jour
    const { data: completions, error: completionsError } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('completion_date', today)

    if (completionsError) {
      console.error('Erreur récupération completions today:', completionsError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Récupérer la dernière analyse pour les produits recommandés
    const { data: lastAnalysis, error: analysisError } = await supabase
      .from('user_analyses')
      .select('analysis_data')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Organiser les complétions par phase
    const morningCompletion = completions.find(c => c.phase === 'morning')
    const eveningCompletion = completions.find(c => c.phase === 'evening')

    // Extraire les produits de la routine (depuis la dernière analyse)
    let morningProducts = []
    let eveningProducts = []

    if (lastAnalysis?.analysis_data?.routine) {
      const routine = lastAnalysis.analysis_data.routine
      
      // Extraire produits matin
      if (routine.phases) {
        routine.phases.forEach((phase: any) => {
          if (phase.products) {
            phase.products.forEach((product: any) => {
              if (product.usage?.includes('matin') || product.usage?.includes('morning')) {
                morningProducts.push({
                  id: product.id || product.catalogId,
                  name: product.name,
                  brand: product.brand,
                  type: product.type || product.category,
                  step: product.step || morningProducts.length + 1
                })
              }
              if (product.usage?.includes('soir') || product.usage?.includes('evening')) {
                eveningProducts.push({
                  id: product.id || product.catalogId,
                  name: product.name,
                  brand: product.brand,
                  type: product.type || product.category,
                  step: product.step || eveningProducts.length + 1
                })
              }
            })
          }
        })
      }
    }

    // Calculer le streak actuel
    const { data: recentCompletions } = await supabase
      .from('routine_completions')
      .select('completion_date, phase, completed')
      .eq('user_id', session.user.id)
      .gte('completion_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('completion_date', { ascending: false })

    const currentStreak = calculateCurrentStreak(recentCompletions || [])

    const routineToday = {
      morning: {
        products: morningProducts,
        completed: morningCompletion?.completed || false,
        notes: morningCompletion?.notes || null,
        completedAt: morningCompletion?.created_at || null
      },
      evening: {
        products: eveningProducts,
        completed: eveningCompletion?.completed || false,
        notes: eveningCompletion?.notes || null,
        completedAt: eveningCompletion?.created_at || null
      },
      currentStreak,
      date: today
    }

    return NextResponse.json(routineToday)

  } catch (error) {
    console.error('Erreur API routine today:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function calculateCurrentStreak(completions: any[]): number {
  if (!completions.length) return 0

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

  let streak = 0
  const today = new Date()
  
  // Compter les jours consécutifs depuis aujourd'hui
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayCompletion = completionsByDate[dateStr]
    if (dayCompletion && (dayCompletion.morning || dayCompletion.evening)) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}
