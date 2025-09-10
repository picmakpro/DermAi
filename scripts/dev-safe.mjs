#!/usr/bin/env node

/**
 * Dev Safe Mode Script
 * Checks AI provider configuration and warns about potential issues
 */

// Using native fetch (Node.js 18+)

async function main() {
  const url = 'http://localhost:3000/api/health/ai'
  
  console.log('🔍 Checking AI Provider Configuration...')
  console.log('📡 Endpoint:', url)
  
  try {
    const res = await fetch(url)
    
    if (!res.ok) {
      console.error(`❌ Health endpoint returned ${res.status}: ${res.statusText}`)
      process.exit(1)
    }
    
    const j = await res.json()
    
    console.log('\n# AI Health Report')
    console.log('=' .repeat(50))
    console.log(JSON.stringify(j, null, 2))
    console.log('=' .repeat(50))
    
    // Check for warnings
    if (j.warnOpenAiNoKey) {
      console.error('\n❌ CONFIGURATION ERROR:')
      console.error('   OpenAI provider selected but OPENAI_API_KEY is missing!')
      console.error('\n💡 Solutions:')
      console.error('   1. Set OPENAI_API_KEY=your_key_here')
      console.error('   2. Or switch to mock: DERMAI_AI_PROVIDER=mock')
      console.error('   3. Or use step-specific overrides: DERMAI_STEP2_PROVIDER=mock')
      process.exit(1)
    }
    
    if (!j.hasOpenAIKey && j.provider === 'openai') {
      console.warn('\n⚠️  WARNING:')
      console.warn('   Global provider set to OpenAI but no API key found')
      console.warn('   This will cause runtime errors!')
    }
    
    // Success message
    console.log('\n✅ Safe to proceed!')
    console.log(`📊 Pipeline: ${j.pipeline}`)
    console.log(`🤖 Global Provider: ${j.provider}`)
    console.log(`🔧 Step Providers: ${JSON.stringify(j.stepProviders)}`)
    
    if (j.hasOpenAIKey) {
      console.log('🔑 OpenAI API Key: Present')
    } else {
      console.log('🔑 OpenAI API Key: Not set (using mock)')
    }
    
  } catch (e) {
    console.error('\n⚠️  Could not reach health endpoint!')
    console.error('   Make sure the dev server is running:')
    console.error('   npm run dev')
    console.error('\n   Then run this script again.')
    process.exit(1)
  }
}

// Run the health check
main().catch(console.error)
