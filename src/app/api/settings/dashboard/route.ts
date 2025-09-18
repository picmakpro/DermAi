import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/settings/dashboard - Récupérer les préférences du dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('dashboard_preferences')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Erreur récupération dashboard preferences:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Valeurs par défaut si pas encore configurées
    const defaultPreferences = {
      widgets_order: ['last_analysis', 'routine_today', 'progress_chart', 'badges'],
      default_comparison_period: '30_days',
      routine_view: 'calendar',
      theme: 'light',
      compact_mode: false,
      show_tips: true
    }

    const preferences = {
      ...defaultPreferences,
      ...profile.dashboard_preferences
    }

    return NextResponse.json(preferences)

  } catch (error) {
    console.error('Erreur API settings dashboard GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/settings/dashboard - Mettre à jour les préférences du dashboard
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      widgets_order, 
      default_comparison_period, 
      routine_view, 
      theme,
      compact_mode,
      show_tips
    } = body

    // Validation des données
    if (default_comparison_period && !['7_days', '30_days', '90_days', '6_months'].includes(default_comparison_period)) {
      return NextResponse.json({ 
        error: 'Période de comparaison invalide' 
      }, { status: 400 })
    }

    if (routine_view && !['calendar', 'list'].includes(routine_view)) {
      return NextResponse.json({ 
        error: 'Vue de routine invalide' 
      }, { status: 400 })
    }

    if (theme && !['light', 'dark', 'auto'].includes(theme)) {
      return NextResponse.json({ 
        error: 'Thème invalide' 
      }, { status: 400 })
    }

    const dashboardPreferences = {
      widgets_order: widgets_order || ['last_analysis', 'routine_today', 'progress_chart', 'badges'],
      default_comparison_period: default_comparison_period || '30_days',
      routine_view: routine_view || 'calendar',
      theme: theme || 'light',
      compact_mode: compact_mode ?? false,
      show_tips: show_tips ?? true
    }

    // Mise à jour des préférences
    const { error } = await supabase
      .from('profiles')
      .update({
        dashboard_preferences: dashboardPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)

    if (error) {
      console.error('Erreur mise à jour dashboard preferences:', error)
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
    }

    return NextResponse.json(dashboardPreferences)

  } catch (error) {
    console.error('Erreur API settings dashboard PUT:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
