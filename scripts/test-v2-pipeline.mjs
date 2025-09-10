#!/usr/bin/env node

/**
 * Quick test script for V2 Pipeline
 * Tests the complete pipeline without requiring the full Next.js app
 */

import { createOpenAIClient } from '../src/lib/openai.js'
import { V2PipelineOrchestrator } from '../src/services/ai/orchestrator.js'

// Mock environment for testing
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key'
process.env.DERMAI_PIPELINE = 'v2'

async function testV2Pipeline() {
  console.log('🧪 Testing V2 Pipeline...\n')

  try {
    // Create test request
    const testRequest = {
      photos: [
        {
          file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          type: 'face-frontal'
        }
      ],
      userProfile: {
        age: 28,
        gender: 'male',
        skinType: 'combination'
      },
      skinConcerns: {
        primary: ['ingrowns', 'redness'],
        otherText: ''
      },
      currentRoutine: {
        routinePreference: 'Balanced',
        monthlyBudget: '50-100€',
        morningProducts: [],
        eveningProducts: []
      },
      allergies: {
        ingredients: [],
        pastReactions: 'None'
      }
    }

    console.log('📋 Test Request:')
    console.log(`- Photos: ${testRequest.photos.length}`)
    console.log(`- User: ${testRequest.userProfile.gender}, ${testRequest.userProfile.age} years`)
    console.log(`- Concerns: ${testRequest.skinConcerns.primary.join(', ')}`)
    console.log(`- Budget: ${testRequest.currentRoutine.monthlyBudget}\n`)

    // Test orchestrator
    const orchestrator = new V2PipelineOrchestrator()
    const result = await orchestrator.runPipeline(testRequest)

    console.log('✅ V2 Pipeline Test Results:')
    console.log(`- Analysis ID: ${result.id}`)
    console.log(`- Overall Score: ${result.scores.overall}/100`)
    console.log(`- Main Concern: ${result.beautyAssessment.mainConcern}`)
    console.log(`- Intensity: ${result.beautyAssessment.intensity}`)
    console.log(`- Concerned Zones: ${result.beautyAssessment.concernedZones.join(', ')}`)
    console.log(`- Immediate Steps: ${result.recommendations.routine.immediate.length}`)
    console.log(`- Adaptation Steps: ${result.recommendations.routine.adaptation.length}`)
    console.log(`- Maintenance Steps: ${result.recommendations.routine.maintenance.length}`)
    console.log(`- Unified Routine Steps: ${result.recommendations.unifiedRoutine.length}`)
    console.log(`- Products: ${result.recommendations.products.length}`)

    // Validate structure
    console.log('\n🔍 Structure Validation:')
    
    // Check scores
    const requiredScores = ['hydration', 'wrinkles', 'firmness', 'radiance', 'pores', 'spots', 'darkCircles', 'skinAge', 'overall']
    const hasAllScores = requiredScores.every(score => result.scores[score] !== undefined)
    console.log(`- All scores present: ${hasAllScores ? '✅' : '❌'}`)

    // Check beauty assessment
    const hasBeautyAssessment = result.beautyAssessment && 
      result.beautyAssessment.mainConcern && 
      result.beautyAssessment.intensity && 
      result.beautyAssessment.concernedZones
    console.log(`- Beauty assessment complete: ${hasBeautyAssessment ? '✅' : '❌'}`)

    // Check 3 phases
    const hasThreePhases = result.recommendations.routine.immediate.length > 0 &&
      result.recommendations.routine.adaptation.length > 0 &&
      result.recommendations.routine.maintenance.length > 0
    console.log(`- 3 phases present: ${hasThreePhases ? '✅' : '❌'}`)

    // Check no fallbacks
    const hasNoFallbacks = !result.recommendations.unifiedRoutine.some(step =>
      step.recommendedProducts?.some(product =>
        product.name?.includes('Targeted care') ||
        product.brand === 'DermAI Selection' ||
        !product.catalogId ||
        product.catalogId === 'fallback'
      )
    )
    console.log(`- No fallback products: ${hasNoFallbacks ? '✅' : '❌'}`)

    // Check unified routine
    const hasUnifiedRoutine = result.recommendations.unifiedRoutine && 
      result.recommendations.unifiedRoutine.length > 0
    console.log(`- Unified routine present: ${hasUnifiedRoutine ? '✅' : '❌'}`)

    console.log('\n🎉 V2 Pipeline test completed successfully!')
    return true

  } catch (error) {
    console.error('❌ V2 Pipeline test failed:', error.message)
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Set OPENAI_API_KEY environment variable to test with real API')
    }
    
    return false
  }
}

// Run test
testV2Pipeline().then(success => {
  process.exit(success ? 0 : 1)
})

