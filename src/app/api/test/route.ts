import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test des variables d'environnement
    const openaiKey = process.env.OPENAI_API_KEY
    const nodeEnv = process.env.NODE_ENV
    
    // Test de l'import OpenAI
    let openaiImportOk = false
    try {
      const OpenAI = (await import('openai')).default
      openaiImportOk = !!OpenAI
    } catch (err) {
      console.error('Erreur import OpenAI:', err)
    }

    const diagnostics = {
      environment: nodeEnv,
      openaiKeyExists: !!openaiKey,
      openaiKeyLength: openaiKey ? openaiKey.length : 0,
      openaiImportOk,
      timestamp: new Date().toISOString(),
      vercelRegion: process.env.VERCEL_REGION || 'unknown',
      runtime: 'nodejs'
    }

    console.log('🔍 Diagnostics Vercel:', diagnostics)

    return NextResponse.json({
      success: true,
      diagnostics
    })

  } catch (error) {
    console.error('Erreur test API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
