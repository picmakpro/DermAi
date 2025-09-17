import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Récupérer toutes les variables d'environnement Google
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
    const nextAuthUrl = process.env.NEXTAUTH_URL
    const nextAuthSecret = process.env.NEXTAUTH_SECRET

    // Validation détaillée
    const validation = {
      googleClientId: {
        exists: !!googleClientId,
        format: googleClientId?.includes('.apps.googleusercontent.com') || false,
        length: googleClientId?.length || 0,
        preview: googleClientId ? `${googleClientId.substring(0, 20)}...` : 'NON DÉFINI'
      },
      googleClientSecret: {
        exists: !!googleClientSecret,
        length: googleClientSecret?.length || 0,
        preview: googleClientSecret ? `${googleClientSecret.substring(0, 8)}...` : 'NON DÉFINI'
      },
      nextAuthUrl: {
        exists: !!nextAuthUrl,
        value: nextAuthUrl || 'NON DÉFINI',
        isLocalhost: nextAuthUrl?.includes('localhost') || false,
        port: nextAuthUrl?.includes(':3000') ? '3000' : nextAuthUrl?.includes(':3001') ? '3001' : 'AUTRE'
      },
      nextAuthSecret: {
        exists: !!nextAuthSecret,
        length: nextAuthSecret?.length || 0,
        preview: nextAuthSecret ? `${nextAuthSecret.substring(0, 8)}...` : 'NON DÉFINI'
      }
    }

    // URLs de callback attendues
    const expectedCallbackUrl = `${nextAuthUrl}/api/auth/callback/google`
    
    // Recommandations
    const recommendations = []
    
    if (!validation.googleClientId.format) {
      recommendations.push("❌ Client ID doit finir par '.apps.googleusercontent.com'")
    }
    
    if (validation.googleClientSecret.length < 20) {
      recommendations.push("❌ Client Secret semble trop court (doit être ~72 caractères)")
    }
    
    if (!validation.nextAuthUrl.isLocalhost) {
      recommendations.push("⚠️ NEXTAUTH_URL doit être http://localhost:3000 en développement")
    }
    
    if (validation.nextAuthUrl.port !== '3000') {
      recommendations.push("⚠️ Port doit être 3000 pour correspondre à Google Cloud Console")
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ Configuration semble correcte")
    }

    return NextResponse.json({
      success: true,
      message: 'Debug Google OAuth Détaillé',
      validation,
      expectedCallbackUrl,
      recommendations,
      googleCloudConsoleConfig: {
        originesJavaScript: [nextAuthUrl],
        urisRedirection: [expectedCallbackUrl]
      },
      troubleshooting: {
        commonIssues: [
          "Client ID/Secret copiés incorrectement",
          "URIs de redirection avec espaces ou caractères supplémentaires",
          "Projet Google Cloud Console différent",
          "Cache navigateur (essayer navigation privée)"
        ],
        nextSteps: [
          "1. Vérifier Google Cloud Console > Credentials",
          "2. Copier/coller à nouveau Client ID et Secret",
          "3. Vérifier URIs exactement comme indiqué ci-dessus",
          "4. Attendre 1-2 minutes après modification Google",
          "5. Tester en navigation privée"
        ]
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur debug Google OAuth',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
