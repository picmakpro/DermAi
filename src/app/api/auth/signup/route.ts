import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName } = body

    // Validation des données
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Créer l'utilisateur avec Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (authError) {
      console.error('Erreur création utilisateur Supabase:', authError)
      
      // Messages d'erreur spécifiques
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà utilisée' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

    // Créer le profil utilisateur
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: fullName,
        subscription_status: 'free',
        analyses_count: 0,
      })

    if (profileError) {
      console.error('Erreur création profil:', profileError)
      // Ne pas faire échouer la création si le profil existe déjà
      if (!profileError.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du profil' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: fullName,
      }
    })

  } catch (error) {
    console.error('Erreur API signup:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
