import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/badges - Récupérer les badges de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = (session.user as any).id
    console.log('🏆 [BADGES] Récupération badges pour userId:', userId)

    // Import dynamique côté serveur uniquement
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')

    const { data: badges, error } = await supabaseAdmin
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) {
      console.error('❌ [BADGES] Erreur récupération badges:', error)
      throw error
    }

    console.log('✅ [BADGES] Badges récupérés:', badges?.length || 0)

    return NextResponse.json({
      success: true,
      data: badges || []
    })

  } catch (error) {
    console.error('❌ [BADGES] Erreur récupération badges:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// POST /api/badges - Créer un nouveau badge (usage interne)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    
    console.log('🏆 [BADGES] Création badge pour userId:', userId, body)

    // Import dynamique côté serveur uniquement
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin')

    const { data: badge, error } = await supabaseAdmin
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_type: body.badge_type,
        badge_level: body.badge_level,
        badge_criteria: body.badge_criteria || {}
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [BADGES] Erreur création badge:', error)
      throw error
    }

    console.log('✅ [BADGES] Badge créé:', badge.id)

    return NextResponse.json({
      success: true,
      data: badge
    })

  } catch (error) {
    console.error('❌ [BADGES] Erreur création badge:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}