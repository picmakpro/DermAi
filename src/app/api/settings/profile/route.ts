import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/settings/profile - Récupérer les paramètres de profil
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Erreur récupération profil:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Erreur API settings profile GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/settings/profile - Mettre à jour le profil
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, skin_type, birth_year, concerns } = body

    // Validation des données
    if (birth_year && (isNaN(birth_year) || birth_year < 1920 || birth_year > new Date().getFullYear())) {
      return NextResponse.json({ 
        error: 'Année de naissance invalide' 
      }, { status: 400 })
    }

    if (skin_type && !['dry', 'oily', 'combination', 'sensitive', 'normal'].includes(skin_type)) {
      return NextResponse.json({ 
        error: 'Type de peau invalide' 
      }, { status: 400 })
    }

    // Mise à jour du profil
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        skin_type,
        birth_year: birth_year ? parseInt(birth_year) : null,
        concerns: concerns || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour profil:', error)
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
    }

    // Retourner les données mises à jour pour la session
    return NextResponse.json({
      id: updatedProfile.id,
      name: updatedProfile.full_name,
      email: updatedProfile.email,
      image: updatedProfile.avatar_url,
      skin_type: updatedProfile.skin_type,
      birth_year: updatedProfile.birth_year,
      concerns: updatedProfile.concerns
    })

  } catch (error) {
    console.error('Erreur API settings profile PUT:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}









