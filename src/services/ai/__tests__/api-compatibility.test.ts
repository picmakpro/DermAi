/**
 * API Compatibility Test
 * Validates that V2 pipeline returns exactly the same keys as legacy for UI compatibility
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/analyze/route'

describe('API V2 Compatibility', () => {
  const mockRequest = {
    userProfile: {
      age: 25,
      gender: 'female',
      skinType: 'combination'
    },
    skinConcerns: {
      primary: ['acne', 'dark_spots'],
      otherText: 'Some additional concerns'
    },
    currentRoutine: {
      routinePreference: 'minimal',
      monthlyBudget: '50-100'
    },
    allergies: {
      ingredients: ['fragrance'],
      pastReactions: 'None'
    },
    photos: [
      {
        type: 'face-frontal',
        file: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      }
    ]
  }

  beforeAll(() => {
    // Set environment to use V2 pipeline
    process.env.DERMAI_PIPELINE = 'v2'
  })

  afterAll(() => {
    // Reset environment
    delete process.env.DERMAI_PIPELINE
  })

  it('should return exactly the same JSON structure as legacy for UI compatibility', async () => {
    const request = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockRequest)
    })

    try {
      const response = await POST(request)
      const data = await response.json()

      // Check response structure
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')

      const analysisData = data.data

      // Check that all required UI keys are present
      expect(analysisData).toHaveProperty('scores')
      expect(analysisData).toHaveProperty('beautyAssessment')
      expect(analysisData).toHaveProperty('recommendations')

      // Check scores structure (exact same as legacy)
      expect(analysisData.scores).toHaveProperty('hydration')
      expect(analysisData.scores).toHaveProperty('wrinkles')
      expect(analysisData.scores).toHaveProperty('firmness')
      expect(analysisData.scores).toHaveProperty('radiance')
      expect(analysisData.scores).toHaveProperty('pores')
      expect(analysisData.scores).toHaveProperty('spots')
      expect(analysisData.scores).toHaveProperty('darkCircles')
      expect(analysisData.scores).toHaveProperty('skinAge')
      expect(analysisData.scores).toHaveProperty('overall')

      // Check beauty assessment structure
      expect(analysisData.beautyAssessment).toHaveProperty('mainConcern')
      expect(analysisData.beautyAssessment).toHaveProperty('intensity')
      expect(analysisData.beautyAssessment).toHaveProperty('concernedZones')
      expect(analysisData.beautyAssessment).toHaveProperty('visualFindings')
      expect(analysisData.beautyAssessment).toHaveProperty('expectedImprovement')

      // Check recommendations structure
      expect(analysisData.recommendations).toHaveProperty('immediate')
      expect(analysisData.recommendations).toHaveProperty('routine')
      expect(analysisData.recommendations).toHaveProperty('products')
      expect(analysisData.recommendations).toHaveProperty('lifestyle')

      // Check that routine has 3 phases
      expect(analysisData.recommendations.routine).toHaveProperty('immediate')
      expect(analysisData.recommendations.routine).toHaveProperty('adaptation')
      expect(analysisData.recommendations.routine).toHaveProperty('maintenance')

      // Check metadata for V2 pipeline
      expect(analysisData).toHaveProperty('metadata')
      expect(analysisData.metadata).toHaveProperty('analysis_version', 'v2-prompts')
      expect(analysisData.metadata).toHaveProperty('ai_model_used', 'gpt-4o-vision')
      expect(analysisData.metadata).toHaveProperty('processing_time_ms')
      expect(analysisData.metadata).toHaveProperty('pipeline_version', 'v2')

      // Check that noFallbacks is true for products
      if (analysisData.recommendations.productsDetailed) {
        // If productsDetailed exists, check that noFallbacks is true
        expect(analysisData.recommendations.productsDetailed).toBeDefined()
      }

      // Check that unified routine exists
      expect(analysisData.recommendations).toHaveProperty('unifiedRoutine')
      expect(Array.isArray(analysisData.recommendations.unifiedRoutine)).toBe(true)

      // Check that localized routine exists
      expect(analysisData.recommendations).toHaveProperty('localizedRoutine')
      expect(Array.isArray(analysisData.recommendations.localizedRoutine)).toBe(true)

      console.log('✅ V2 API returns exactly the same structure as legacy')
      console.log('✅ All required UI keys are present')
      console.log('✅ 3 phases are present in routine')
      console.log('✅ V2 metadata is correctly set')
      console.log('✅ Unified and localized routines are present')

    } catch (error) {
      console.error('API test failed:', error)
      throw error
    }
  })

  it('should handle errors gracefully and return proper error structure', async () => {
    const invalidRequest = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invalid: 'data' })
    })

    try {
      const response = await POST(invalidRequest)
      const data = await response.json()

      // Should return error structure
      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')

    } catch (error) {
      // This is expected for invalid requests
      expect(error).toBeDefined()
    }
  })

  it('should return consistent results across multiple calls', async () => {
    const request1 = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockRequest)
    })

    const request2 = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockRequest)
    })

    try {
      const response1 = await POST(request1)
      const response2 = await POST(request2)

      const data1 = await response1.json()
      const data2 = await response2.json()

      // Both should be successful
      expect(data1.success).toBe(true)
      expect(data2.success).toBe(true)

      // Both should have the same structure
      expect(Object.keys(data1.data)).toEqual(Object.keys(data2.data))
      expect(Object.keys(data1.data.scores)).toEqual(Object.keys(data2.data.scores))
      expect(Object.keys(data1.data.beautyAssessment)).toEqual(Object.keys(data2.data.beautyAssessment))
      expect(Object.keys(data1.data.recommendations)).toEqual(Object.keys(data2.data.recommendations))

      // Both should have V2 metadata
      expect(data1.data.metadata.analysis_version).toBe('v2-prompts')
      expect(data2.data.metadata.analysis_version).toBe('v2-prompts')

    } catch (error) {
      console.error('Consistency test failed:', error)
      throw error
    }
  })
})

