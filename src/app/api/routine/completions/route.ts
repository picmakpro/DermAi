import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/routine/completions - Récupérer l'historique des complétions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '30')

    // supabase est déjà importé
    
    let query = supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('completion_date', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('completion_date', startDate)
    }
    if (endDate) {
      query = query.lte('completion_date', endDate)
    }

    const { data: completions, error } = await query

    if (error) {
      console.error('Erreur récupération completions:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Organiser par date pour faciliter l'usage côté client
    const completionsByDate = completions.reduce((acc, completion) => {
      const date = completion.completion_date
      if (!acc[date]) {
        acc[date] = { morning: null, evening: null }
      }
      acc[date][completion.phase] = completion
      return acc
    }, {})

    return NextResponse.json({
      completions: completionsByDate,
      total: completions.length
    })

  } catch (error) {
    console.error('Erreur API routine completions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/routine/completions - Marquer une routine comme complétée
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { completion_date, phase, completed, products_used, notes } = body

    // Validation
    if (!completion_date || !phase || !['morning', 'evening'].includes(phase)) {
      return NextResponse.json({ 
        error: 'Données invalides' 
      }, { status: 400 })
    }

    // supabase est déjà importé

    // Upsert (insert ou update)
    const { data, error } = await supabase
      .from('routine_completions')
      .upsert({
        user_id: session.user.id,
        completion_date,
        phase,
        completed: completed ?? true,
        products_used: products_used || [],
        notes: notes || null
      }, {
        onConflict: 'user_id,completion_date,phase'
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur sauvegarde completion:', error)
      return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 })
    }

    return NextResponse.json({ completion: data })

  } catch (error) {
    console.error('Erreur API routine completion POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/routine/completions - Modifier une complétion existante
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, completed, products_used, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    // supabase est déjà importé

    const { data, error } = await supabase
      .from('routine_completions')
      .update({
        completed,
        products_used,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', session.user.id) // Sécurité
      .select()
      .single()

    if (error) {
      console.error('Erreur modification completion:', error)
      return NextResponse.json({ error: 'Erreur modification' }, { status: 500 })
    }

    return NextResponse.json({ completion: data })

  } catch (error) {
    console.error('Erreur API routine completion PUT:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
