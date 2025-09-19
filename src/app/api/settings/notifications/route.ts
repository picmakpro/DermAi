import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/settings/notifications - Récupérer les préférences de notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('notification_settings, routine_reminder_time')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Erreur récupération notifications:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Valeurs par défaut si pas encore configurées
    const defaultSettings = {
      routine_reminders: true,
      analysis_reminders: true,
      badge_notifications: true,
      coach_suggestions: true,
      email_frequency: 'weekly',
      reminder_time: '09:00'
    }

    const settings = {
      ...defaultSettings,
      ...profile.notification_settings,
      reminder_time: profile.routine_reminder_time || defaultSettings.reminder_time
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error('Erreur API settings notifications GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/settings/notifications - Mettre à jour les préférences de notifications
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      routine_reminders, 
      analysis_reminders, 
      badge_notifications, 
      coach_suggestions, 
      email_frequency, 
      reminder_time 
    } = body

    // Validation des données
    if (email_frequency && !['never', 'daily', 'weekly', 'monthly'].includes(email_frequency)) {
      return NextResponse.json({ 
        error: 'Fréquence email invalide' 
      }, { status: 400 })
    }

    if (reminder_time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminder_time)) {
      return NextResponse.json({ 
        error: 'Heure de rappel invalide' 
      }, { status: 400 })
    }

    const notificationSettings = {
      routine_reminders: routine_reminders ?? true,
      analysis_reminders: analysis_reminders ?? true,
      badge_notifications: badge_notifications ?? true,
      coach_suggestions: coach_suggestions ?? true,
      email_frequency: email_frequency || 'weekly'
    }

    // Mise à jour des préférences
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_settings: notificationSettings,
        routine_reminder_time: reminder_time || '09:00',
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)

    if (error) {
      console.error('Erreur mise à jour notifications:', error)
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ 
      ...notificationSettings,
      reminder_time: reminder_time || '09:00'
    })

  } catch (error) {
    console.error('Erreur API settings notifications PUT:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

