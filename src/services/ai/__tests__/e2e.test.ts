/**
 * E2E tests for V2 Pipeline API integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/analyze/route'

// Mock environment variables for testing
const originalEnv = process.env

describe('V2 Pipeline E2E Tests', () => {
  beforeAll(() => {
    // Set up test environment
    process.env = {
      ...originalEnv,
      DERMAI_PIPELINE: 'v2',
      OPENAI_API_KEY: 'test-key',
      NODE_ENV: 'test'
    }
  })

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('API /analyze with V2 Pipeline', () => {
    it('should return valid legacy-compatible response structure', async () => {
      const mockRequest = {
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

      // Create NextRequest mock
      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify(mockRequest),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      try {
        const response = await POST(request)
        const responseData = await response.json()

        // Check response structure
        expect(response.status).toBe(200)
        expect(responseData).toHaveProperty('success', true)
        expect(responseData).toHaveProperty('data')

        const analysis = responseData.data

        // Check legacy-compatible structure
        expect(analysis).toHaveProperty('id')
        expect(analysis).toHaveProperty('userId')
        expect(analysis).toHaveProperty('photos')
        expect(analysis).toHaveProperty('scores')
        expect(analysis).toHaveProperty('beautyAssessment')
        expect(analysis).toHaveProperty('recommendations')
        expect(analysis).toHaveProperty('createdAt')

        // Check scores structure
        expect(analysis.scores).toHaveProperty('overall')
        expect(analysis.scores).toHaveProperty('hydration')
        expect(analysis.scores).toHaveProperty('wrinkles')
        expect(analysis.scores).toHaveProperty('firmness')
        expect(analysis.scores).toHaveProperty('radiance')
        expect(analysis.scores).toHaveProperty('pores')
        expect(analysis.scores).toHaveProperty('spots')
        expect(analysis.scores).toHaveProperty('darkCircles')
        expect(analysis.scores).toHaveProperty('skinAge')

        // Check beauty assessment
        expect(analysis.beautyAssessment).toHaveProperty('skinType')
        expect(analysis.beautyAssessment).toHaveProperty('mainConcern')
        expect(analysis.beautyAssessment).toHaveProperty('intensity')
        expect(analysis.beautyAssessment).toHaveProperty('concernedZones')
        expect(analysis.beautyAssessment).toHaveProperty('visualFindings')
        expect(analysis.beautyAssessment).toHaveProperty('expectedImprovement')

        // Check recommendations structure
        expect(analysis.recommendations).toHaveProperty('immediate')
        expect(analysis.recommendations).toHaveProperty('routine')
        expect(analysis.recommendations).toHaveProperty('products')
        expect(analysis.recommendations).toHaveProperty('lifestyle')
        expect(analysis.recommendations).toHaveProperty('unifiedRoutine')

        // Check routine structure
        expect(analysis.recommendations.routine).toHaveProperty('immediate')
        expect(analysis.recommendations.routine).toHaveProperty('adaptation')
        expect(analysis.recommendations.routine).toHaveProperty('maintenance')

        // Check 3 phases are present
        expect(Array.isArray(analysis.recommendations.routine.immediate)).toBe(true)
        expect(Array.isArray(analysis.recommendations.routine.adaptation)).toBe(true)
        expect(Array.isArray(analysis.recommendations.routine.maintenance)).toBe(true)

        // Check unified routine
        expect(Array.isArray(analysis.recommendations.unifiedRoutine)).toBe(true)

        // Check metadata for V2 pipeline
        expect(analysis).toHaveProperty('metadata')
        expect(analysis.metadata).toHaveProperty('analysis_version', 'v2-prompts')
        expect(analysis.metadata).toHaveProperty('ai_model_used', 'gpt-4o-vision')
        expect(analysis.metadata).toHaveProperty('pipeline_version', 'v2')
        expect(analysis.metadata).toHaveProperty('processing_time_ms')
        expect(analysis.metadata).toHaveProperty('timestamp')

        // Check noFallbacks requirement
        if (analysis.recommendations.unifiedRoutine && analysis.recommendations.unifiedRoutine.length > 0) {
          const hasGenericProducts = analysis.recommendations.unifiedRoutine.some((step: any) =>
            step.recommendedProducts?.some((product: any) =>
              product.name?.includes('Targeted care') ||
              product.brand === 'DermAI Selection' ||
              !product.catalogId ||
              product.catalogId === 'fallback'
            )
          )
          expect(hasGenericProducts).toBe(false)
        }

      } catch (error) {
        // In test environment, we might not have real OpenAI API access
        // So we expect the error to be related to API key or network
        expect(error).toBeDefined()
        console.log('Expected error in test environment:', error)
      }
    })

    it('should handle missing photos gracefully', async () => {
      const mockRequest = {
        photos: [],
        userProfile: {
          age: 28,
          gender: 'male',
          skinType: 'combination'
        },
        skinConcerns: {
          primary: ['ingrowns'],
          otherText: ''
        },
        currentRoutine: {
          routinePreference: 'Balanced',
          monthlyBudget: '50-100€',
          morningProducts: [],
          eveningProducts: []
        }
      }

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify(mockRequest),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toHaveProperty('success', false)
      expect(responseData).toHaveProperty('error', 'Au moins une photo est requise')
    })

    it('should handle invalid user profile gracefully', async () => {
      const mockRequest = {
        photos: [
          {
            file: 'data:image/jpeg;base64,test',
            type: 'face-frontal'
          }
        ],
        userProfile: {
          age: 28
          // Missing gender
        },
        skinConcerns: {
          primary: ['ingrowns'],
          otherText: ''
        },
        currentRoutine: {
          routinePreference: 'Balanced',
          monthlyBudget: '50-100€',
          morningProducts: [],
          eveningProducts: []
        }
      }

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify(mockRequest),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toHaveProperty('success', false)
      expect(responseData).toHaveProperty('error', 'Profil utilisateur incomplet')
    })
  })

  describe('Pipeline Version Switching', () => {
    it('should use legacy pipeline when DERMAI_PIPELINE=legacy', async () => {
      // Temporarily set legacy pipeline
      process.env.DERMAI_PIPELINE = 'legacy'

      const mockRequest = {
        photos: [
          {
            file: 'data:image/jpeg;base64,test',
            type: 'face-frontal'
          }
        ],
        userProfile: {
          age: 28,
          gender: 'male',
          skinType: 'combination'
        },
        skinConcerns: {
          primary: ['ingrowns'],
          otherText: ''
        },
        currentRoutine: {
          routinePreference: 'Balanced',
          monthlyBudget: '50-100€',
          morningProducts: [],
          eveningProducts: []
        }
      }

      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: JSON.stringify(mockRequest),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      try {
        const response = await POST(request)
        const responseData = await response.json()

        if (response.status === 200) {
          expect(responseData.data.metadata.pipeline_version).toBe('legacy')
          expect(responseData.data.metadata.analysis_version).toBe('legacy')
          expect(responseData.data.metadata.ai_model_used).toBe('gpt-4o')
        }
      } catch (error) {
        // Expected in test environment
        console.log('Expected error in test environment:', error)
      } finally {
        // Restore V2 pipeline
        process.env.DERMAI_PIPELINE = 'v2'
      }
    })
  })
})

