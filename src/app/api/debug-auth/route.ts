import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Vérifier les variables d'environnement
    const envCheck = {
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      googleClientId: !!process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    return NextResponse.json({
      success: true,
      message: 'Debug NextAuth',
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      environment: envCheck,
      timestamp: new Date().toISOString(),
      requestUrl: request.url,
      headers: {
        host: request.headers.get('host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur debug NextAuth',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
