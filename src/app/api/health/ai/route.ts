/**
 * AI Health Endpoint
 * Provides safe configuration inspection and health checks
 */

import { NextResponse } from 'next/server'
import { getSafeProviderConfig } from '@/services/ai/provider'

export async function GET() {
  try {
    const cfg = getSafeProviderConfig()
    
    return NextResponse.json({
      ok: true,
      pipeline: process.env.DERMAI_PIPELINE || 'legacy',
      provider: cfg.provider,
      stepProviders: cfg.stepProviders,
      hasOpenAIKey: cfg.hasOpenAIKey,
      warnOpenAiNoKey: cfg.warnOpenAiNoKey,
      timestamp: new Date().toISOString()
    }, { status: 200 })
    
  } catch (error) {
    console.error('❌ AI Health endpoint error:', error)
    
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

