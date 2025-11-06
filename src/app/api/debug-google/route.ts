import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Vérifier les variables d'environnement Google
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
    const nextAuthUrl = process.env.NEXTAUTH_URL
    const nextAuthSecret = process.env.NEXTAUTH_SECRET

    // Masquer les secrets pour la sécurité
    const maskedClientSecret = googleClientSecret 
      ? `${googleClientSecret.substring(0, 8)}...${googleClientSecret.substring(googleClientSecret.length - 4)}`
      : 'NON DÉFINI'

    const maskedNextAuthSecret = nextAuthSecret 
      ? `${nextAuthSecret.substring(0, 8)}...${nextAuthSecret.substring(nextAuthSecret.length - 4)}`
      : 'NON DÉFINI'

    // Test de validation basique du Client ID Google
    const isValidClientId = googleClientId && googleClientId.includes('.apps.googleusercontent.com')
    const isValidClientSecret = googleClientSecret && googleClientSecret.length > 20

    return NextResponse.json({
      success: true,
      message: 'Debug Google OAuth Configuration',
      configuration: {
        googleClientId: googleClientId || 'NON DÉFINI',
        googleClientSecret: maskedClientSecret,
        nextAuthUrl: nextAuthUrl || 'NON DÉFINI',
        nextAuthSecret: maskedNextAuthSecret,
      },
      validation: {
        clientIdValid: isValidClientId,
        clientSecretValid: isValidClientSecret,
        nextAuthUrlValid: !!nextAuthUrl,
        nextAuthSecretValid: !!nextAuthSecret,
      },
      recommendations: {
        clientId: isValidClientId ? '✅ Client ID semble valide' : '❌ Client ID invalide ou manquant',
        clientSecret: isValidClientSecret ? '✅ Client Secret semble valide' : '❌ Client Secret invalide ou manquant',
        redirectUri: `Vérifiez que cette URI est configurée dans Google Cloud Console: ${nextAuthUrl}/api/auth/callback/google`,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur debug Google OAuth',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
