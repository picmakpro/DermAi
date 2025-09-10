#!/usr/bin/env node

/**
 * Test script for OpenAI Provider
 * Tests the OpenAI provider with real API calls (if API key is available)
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test configuration
const TEST_CONFIG = {
  // Use OpenAI provider
  provider: 'openai',
  // Test with a simple base64 image
  testImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
  // Test payload
  testPayload: {
    photos: [
      {
        id: "test-photo-1",
        file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
        preview: "test",
        type: "face-frontal",
        quality: "good"
      }
    ],
    userProfile: {
      age: 29,
      gender: "female",
      skinType: "combination"
    },
    skinConcerns: {
      primary: ["acne", "pores"]
    },
    currentRoutine: {
      morningProducts: [],
      eveningProducts: [],
      monthlyBudget: "50-100"
    }
  }
}

async function testOpenAIProvider() {
  console.log('🧪 Testing OpenAI Provider...')
  
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY not found in environment')
    console.log('💡 To test with real OpenAI API:')
    console.log('   1. Set OPENAI_API_KEY=your_key_here')
    console.log('   2. Set DERMAI_AI_PROVIDER=openai')
    console.log('   3. Run this script again')
    return
  }
  
  console.log('✅ OPENAI_API_KEY found')
  console.log('🔧 Provider:', process.env.DERMAI_AI_PROVIDER || 'mock')
  console.log('🤖 Vision Model:', process.env.OPENAI_VISION_MODEL || 'gpt-4o')
  console.log('📝 Text Model:', process.env.OPENAI_TEXT_MODEL || 'gpt-4o')
  
  try {
    // Test the API endpoint
    console.log('\n📡 Testing API endpoint...')
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_CONFIG.testPayload)
    })
    
    const status = response.status
    const responseText = await response.text()
    
    console.log(`📊 Status: ${status}`)
    
    if (status === 200) {
      const data = JSON.parse(responseText)
      console.log('✅ API call successful!')
      console.log('📈 Analysis ID:', data.data?.id)
      console.log('🤖 AI Model Used:', data.data?.metadata?.ai_model_used)
      console.log('⏱️ Processing Time:', data.data?.metadata?.processing_time_ms, 'ms')
      console.log('📊 Pipeline Version:', data.data?.metadata?.pipeline_version)
      
      // Check if it's using OpenAI or mock
      if (data.data?.metadata?.ai_model_used === 'mock') {
        console.log('⚠️ Warning: Using mock provider instead of OpenAI')
        console.log('💡 Check that DERMAI_AI_PROVIDER=openai is set')
      } else {
        console.log('🎉 Successfully using OpenAI provider!')
      }
      
      // Save response for inspection
      const outputPath = path.join(__dirname, '..', 'test', 'openai-test-response.json')
      await fs.mkdir(path.dirname(outputPath), { recursive: true })
      await fs.writeFile(outputPath, JSON.stringify(data, null, 2))
      console.log('💾 Response saved to:', outputPath)
      
    } else {
      console.log('❌ API call failed')
      console.log('Response:', responseText)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testOpenAIProvider().catch(console.error)

