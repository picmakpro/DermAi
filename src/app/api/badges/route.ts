import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// GET /api/badges - Récupérer les badges de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: badges, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', session.user.id)
      .order('earned_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération badges:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json(badges || [])

  } catch (error) {
    console.error('Erreur API badges GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/badges - Créer un nouveau badge (usage interne)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { badge_type, badge_level, badge_criteria } = body

    // Validation des données
    const validTypes = ['routine_streak', 'analysis_count', 'improvement', 'discovery']
    const validLevels = ['bronze', 'silver', 'gold', 'platinum']

    if (!validTypes.includes(badge_type)) {
      return NextResponse.json({ 
        error: 'Type de badge invalide' 
      }, { status: 400 })
    }

    if (!validLevels.includes(badge_level)) {
      return NextResponse.json({ 
        error: 'Niveau de badge invalide' 
      }, { status: 400 })
    }

    // Vérifier si le badge n'existe pas déjà
    const { data: existingBadge } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('badge_type', badge_type)
      .eq('badge_level', badge_level)
      .single()

    if (existingBadge) {
      return NextResponse.json({ 
        error: 'Badge déjà obtenu' 
      }, { status: 409 })
    }

    // Créer le nouveau badge
    const { data: newBadge, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: session.user.id,
        badge_type,
        badge_level,
        badge_criteria: badge_criteria || {},
        earned_at: new Date().toISOString(),
        is_new: true
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création badge:', error)
      return NextResponse.json({ error: 'Erreur création badge' }, { status: 500 })
    }

    return NextResponse.json(newBadge, { status: 201 })

  } catch (error) {
    console.error('Erreur API badges POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
