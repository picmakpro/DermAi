import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Test 1: Connexion Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur connexion Supabase',
        details: connectionError.message
      }, { status: 500 })
    }

    // Test 2: Test service role
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)

    if (adminError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur service role Supabase',
        details: adminError.message
      }, { status: 500 })
    }

    // Test 3: Vérifier les variables d'environnement
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      googleClientId: !!process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration Supabase validée ✅',
      tests: {
        connection: '✅ Connexion Supabase OK',
        serviceRole: '✅ Service Role OK',
        environment: envCheck
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur test Supabase',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
