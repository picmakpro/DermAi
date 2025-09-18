import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    console.log('🔍 Tentative inscription:', email)

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        full_name: fullName || email.split('@')[0],
      }
    })

    if (authError) {
      console.error('Erreur création user Supabase Auth:', authError)
      
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cet email' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }

    console.log('✅ User Supabase Auth créé:', authUser.user.id)

    // 2. Créer le profil dans la table profiles avec service role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: authUser.user.email!,
        full_name: fullName || email.split('@')[0],
        analyses_count: 0,
      })

    if (profileError) {
      console.error('Erreur création profil:', profileError)
      
      // Si c'est un problème RLS, essayer avec une requête directe
      if (profileError.code === '42501') {
        try {
          // Utiliser une requête SQL directe pour contourner RLS
          const { error: directError } = await supabaseAdmin.rpc('create_user_profile', {
            user_id: authUser.user.id,
            user_email: authUser.user.email!,
            user_full_name: fullName || email.split('@')[0]
          })
          
          if (directError) {
            throw directError
          }
          
          console.log('✅ Profil créé avec RPC pour:', authUser.user.id)
        } catch (rpcError) {
          console.error('Erreur RPC création profil:', rpcError)
          
          // Nettoyer l'utilisateur Auth si le profil échoue
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          
          return NextResponse.json(
            { error: 'Erreur lors de la création du profil utilisateur' },
            { status: 500 }
          )
        }
      } else {
        // Nettoyer l'utilisateur Auth si le profil échoue
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        
        return NextResponse.json(
          { error: 'Erreur lors de la création du profil' },
          { status: 500 }
        )
      }
    } else {
      console.log('✅ Profil créé avec succès pour:', authUser.user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        name: fullName || email.split('@')[0],
      }
    })

  } catch (error) {
    console.error('Erreur inscription:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'inscription' },
      { status: 500 }
    )
  }
}