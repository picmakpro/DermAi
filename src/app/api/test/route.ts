import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test environment variables
    const openaiKey = process.env.OPENAI_API_KEY
    const nodeEnv = process.env.NODE_ENV
    
    // Test OpenAI import
    let openaiImportOk = false
    try {
      const OpenAI = (await import('openai')).default
      openaiImportOk = !!OpenAI
    } catch (err) {
      console.error('OpenAI import error:', err)
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

    console.log('🔍 Vercel Diagnostics:', diagnostics)

    return NextResponse.json({
      success: true,
      diagnostics
    })

  } catch (error) {
    console.error('Test API error:', error)
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
