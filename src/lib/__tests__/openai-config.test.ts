/**
 * 🧪 TESTS UNITAIRES - openai-config.ts
 * 
 * Tests:
 * - Sélection modèle avec feature flags
 * - Rollout progressif déterministe
 * - Hash images reproductible
 * - Fallback automatique
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'

// ✅ MOCK OpenAI avant imports (évite erreur dangerouslyAllowBrowser)
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  }
})

import {
  selectModel,
  hashImages,
  getModelConfig,
  __testing
} from '../openai-config'

// ══════════════════════════════════════════════════════════════
// 🔧 TEST SETUP
// ══════════════════════════════════════════════════════════════

// Sauvegarder env vars originales
const originalEnv = { ...process.env }

describe('openai-config', () => {
  
  beforeEach(() => {
    // Reset env vars avant chaque test
    process.env = { ...originalEnv }
  })
  
  afterAll(() => {
    // Restaurer env vars originales
    process.env = originalEnv
  })
  
  // ════════════════════════════════════════════════════════════
  // 🎯 SÉLECTION MODÈLE - FEATURE FLAGS
  // ════════════════════════════════════════════════════════════
  
  describe('selectModel() - Feature Flags', () => {
    
    test('DIAGNOSTIC: GPT-5 activé → retourne chatgpt-5', () => {
      process.env.USE_GPT5_DIAGNOSTIC = 'true'
      
      const model = selectModel('DIAGNOSTIC', 'req_test123')
      
      expect(model).toBe('chatgpt-5')
    })
    
    test('DIAGNOSTIC: GPT-5 désactivé → fallback gpt-4o', () => {
      process.env.USE_GPT5_DIAGNOSTIC = 'false'
      
      const model = selectModel('DIAGNOSTIC', 'req_test123')
      
      expect(model).toBe('gpt-4o')
    })
    
    test('ROUTINE: GPT-5 activé + rollout 100% → retourne gpt-5-thinking', () => {
      process.env.USE_GPT5_ROUTINE = 'true'
      process.env.GPT5_ROLLOUT_PERCENTAGE = '100'
      
      const model = selectModel('ROUTINE', 'req_test123')
      
      expect(model).toBe('gpt-5-thinking')
    })
    
    test('ROUTINE: GPT-5 désactivé → fallback gpt-4o', () => {
      process.env.USE_GPT5_ROUTINE = 'false'
      
      const model = selectModel('ROUTINE', 'req_test123')
      
      expect(model).toBe('gpt-4o')
    })
    
    test('PRODUCTS: toujours gpt-4o (pas de GPT-5)', () => {
      const model = selectModel('PRODUCTS', 'req_test123')
      
      expect(model).toBe('gpt-4o')
    })
  })
  
  // ════════════════════════════════════════════════════════════
  // 📊 ROLLOUT PROGRESSIF - DÉTERMINISME
  // ════════════════════════════════════════════════════════════
  
  describe('selectModel() - Rollout Progressif', () => {
    
    beforeEach(() => {
      process.env.USE_GPT5_ROUTINE = 'true'
    })
    
    test('Rollout 10%: ~10% GPT-5, ~90% fallback sur 100 requêtes', () => {
      process.env.GPT5_ROLLOUT_PERCENTAGE = '10'
      
      let gpt5Count = 0
      let fallbackCount = 0
      
      // Simuler 100 requêtes avec IDs différents
      for (let i = 0; i < 100; i++) {
        const requestId = `req_test_${i}`
        const model = selectModel('ROUTINE', requestId)
        
        if (model === 'gpt-5-thinking') {
          gpt5Count++
        } else if (model === 'gpt-4o') {
          fallbackCount++
        }
      }
      
      // Tolérance ±5% autour de 10%
      expect(gpt5Count).toBeGreaterThanOrEqual(5)
      expect(gpt5Count).toBeLessThanOrEqual(15)
      expect(fallbackCount).toBeGreaterThanOrEqual(85)
      expect(fallbackCount).toBeLessThanOrEqual(95)
      expect(gpt5Count + fallbackCount).toBe(100)
    })
    
    test('Rollout 50%: ~50% GPT-5, ~50% fallback', () => {
      process.env.GPT5_ROLLOUT_PERCENTAGE = '50'
      
      let gpt5Count = 0
      
      for (let i = 0; i < 100; i++) {
        const model = selectModel('ROUTINE', `req_test_${i}`)
        if (model === 'gpt-5-thinking') gpt5Count++
      }
      
      // Tolérance ±10% autour de 50%
      expect(gpt5Count).toBeGreaterThanOrEqual(40)
      expect(gpt5Count).toBeLessThanOrEqual(60)
    })
    
    test('Rollout 100%: toujours GPT-5', () => {
      process.env.GPT5_ROLLOUT_PERCENTAGE = '100'
      
      for (let i = 0; i < 10; i++) {
        const model = selectModel('ROUTINE', `req_test_${i}`)
        expect(model).toBe('gpt-5-thinking')
      }
    })
    
    test('Rollout 0%: toujours fallback', () => {
      process.env.GPT5_ROLLOUT_PERCENTAGE = '0'
      
      for (let i = 0; i < 10; i++) {
        const model = selectModel('ROUTINE', `req_test_${i}`)
        expect(model).toBe('gpt-4o')
      }
    })
    
    test('Même requestId → Même modèle (déterminisme)', () => {
      process.env.GPT5_ROLLOUT_PERCENTAGE = '50'
      
      const requestId = 'req_deterministic_test'
      
      const model1 = selectModel('ROUTINE', requestId)
      const model2 = selectModel('ROUTINE', requestId)
      const model3 = selectModel('ROUTINE', requestId)
      
      // Même modèle 3x (pas de flip-flop)
      expect(model1).toBe(model2)
      expect(model2).toBe(model3)
    })
  })
  
  // ════════════════════════════════════════════════════════════
  // 🔢 HASH IMAGES - REPRODUCTIBILITÉ
  // ════════════════════════════════════════════════════════════
  
  describe('hashImages()', () => {
    
    test('Même images → Même seed', () => {
      const images = [
        { url: 'https://example.com/front.jpg' },
        { url: 'https://example.com/side.jpg' }
      ]
      
      const seed1 = hashImages(images)
      const seed2 = hashImages(images)
      
      expect(seed1).toBe(seed2)
    })
    
    test('Images ordre différent → Même seed (tri automatique)', () => {
      const images1 = [
        { url: 'https://example.com/front.jpg' },
        { url: 'https://example.com/side.jpg' }
      ]
      
      const images2 = [
        { url: 'https://example.com/side.jpg' },
        { url: 'https://example.com/front.jpg' }
      ]
      
      const seed1 = hashImages(images1)
      const seed2 = hashImages(images2)
      
      expect(seed1).toBe(seed2)
    })
    
    test('Images différentes → Seed différent', () => {
      const images1 = [
        { url: 'https://example.com/photo1.jpg' }
      ]
      
      const images2 = [
        { url: 'https://example.com/photo2.jpg' }
      ]
      
      const seed1 = hashImages(images1)
      const seed2 = hashImages(images2)
      
      expect(seed1).not.toBe(seed2)
    })
    
    test('Seed est un nombre positif 32-bit', () => {
      const images = [
        { url: 'https://example.com/test.jpg' }
      ]
      
      const seed = hashImages(images)
      
      expect(typeof seed).toBe('number')
      expect(seed).toBeGreaterThan(0)
      expect(seed).toBeLessThan(2**32) // 32-bit max
    })
    
    test('Aucune image → Seed cohérent', () => {
      const seed1 = hashImages([])
      const seed2 = hashImages([])
      
      expect(seed1).toBe(seed2)
      expect(typeof seed1).toBe('number')
    })
  })
  
  // ════════════════════════════════════════════════════════════
  // ⚙️ GET MODEL CONFIG
  // ════════════════════════════════════════════════════════════
  
  describe('getModelConfig()', () => {
    
    test('Retourne config complète avec métadonnées', () => {
      process.env.USE_GPT5_ROUTINE = 'true'
      process.env.GPT5_ROLLOUT_PERCENTAGE = '100'
      
      const config = getModelConfig('ROUTINE', 'req_test123')
      
      expect(config.model).toBe('gpt-5-thinking')
      expect(config.temperature).toBe(0.1)
      expect(config.max_tokens).toBe(4000)
      expect(config.response_format).toEqual({ type: 'json_object' })
      
      // Métadonnées
      expect(config._meta).toBeDefined()
      expect(config._meta.type).toBe('ROUTINE')
      expect(config._meta.requestId).toBe('req_test123')
      expect(config._meta.isPrimary).toBe(true)
      expect(config._meta.isFallback).toBe(false)
      expect(config._meta.rolloutPercentage).toBe(100)
    })
    
    test('Métadonnées indiquent fallback si utilisé', () => {
      process.env.USE_GPT5_ROUTINE = 'false'
      
      const config = getModelConfig('ROUTINE', 'req_test123')
      
      expect(config.model).toBe('gpt-4o')
      expect(config._meta.isPrimary).toBe(false)
      expect(config._meta.isFallback).toBe(true)
    })
    
    test('DIAGNOSTIC: temperature 0.0 (déterminisme)', () => {
      process.env.USE_GPT5_DIAGNOSTIC = 'true'
      
      const config = getModelConfig('DIAGNOSTIC', 'req_test123')
      
      expect(config.temperature).toBe(0.0)
      expect(config.max_tokens).toBe(1400)
    })
    
    test('PRODUCTS: pas de rollout percentage (null)', () => {
      const config = getModelConfig('PRODUCTS', 'req_test123')
      
      expect(config._meta.rolloutPercentage).toBeNull()
    })
  })
  
  // ════════════════════════════════════════════════════════════
  // 🧮 HASH STRING TO PERCENTAGE (INTERNAL)
  // ════════════════════════════════════════════════════════════
  
  describe('__testing.hashStringToPercentage()', () => {
    
    test('Retourne nombre entre 0-99', () => {
      for (let i = 0; i < 100; i++) {
        const hash = __testing.hashStringToPercentage(`test_${i}`)
        expect(hash).toBeGreaterThanOrEqual(0)
        expect(hash).toBeLessThan(100)
      }
    })
    
    test('Même string → Même hash (déterminisme)', () => {
      const str = 'test_deterministic'
      
      const hash1 = __testing.hashStringToPercentage(str)
      const hash2 = __testing.hashStringToPercentage(str)
      const hash3 = __testing.hashStringToPercentage(str)
      
      expect(hash1).toBe(hash2)
      expect(hash2).toBe(hash3)
    })
    
    test('Strings différents → Hash différent (probabilité haute)', () => {
      const hash1 = __testing.hashStringToPercentage('test_a')
      const hash2 = __testing.hashStringToPercentage('test_b')
      
      // Collision possible mais très improbable
      expect(hash1).not.toBe(hash2)
    })
    
    test('Distribution uniforme sur 1000 échantillons', () => {
      const buckets = new Array(10).fill(0) // 10 buckets de 10%
      
      for (let i = 0; i < 1000; i++) {
        const hash = __testing.hashStringToPercentage(`sample_${i}`)
        const bucket = Math.floor(hash / 10)
        buckets[bucket]++
      }
      
      // Chaque bucket devrait avoir ~100 items (±30 tolérance)
      buckets.forEach(count => {
        expect(count).toBeGreaterThan(70)
        expect(count).toBeLessThan(130)
      })
    })
  })
  
  // ════════════════════════════════════════════════════════════
  // 🔒 EDGE CASES
  // ════════════════════════════════════════════════════════════
  
  describe('Edge Cases', () => {
    
    test('GPT5_ROLLOUT_PERCENTAGE invalide → default 10', () => {
      process.env.USE_GPT5_ROUTINE = 'true'
      process.env.GPT5_ROLLOUT_PERCENTAGE = 'invalid'
      
      const config = getModelConfig('ROUTINE', 'req_test')
      
      // NaN → default 10
      expect(config._meta.rolloutPercentage).toBe(10)
    })
    
    test('GPT5_ROLLOUT_PERCENTAGE négatif → traité comme 0', () => {
      process.env.USE_GPT5_ROUTINE = 'true'
      process.env.GPT5_ROLLOUT_PERCENTAGE = '-10'
      
      // Tous devraient être fallback
      for (let i = 0; i < 10; i++) {
        const model = selectModel('ROUTINE', `req_test_${i}`)
        expect(model).toBe('gpt-4o')
      }
    })
    
    test('GPT5_ROLLOUT_PERCENTAGE >100 → traité comme 100', () => {
      process.env.USE_GPT5_ROUTINE = 'true'
      process.env.GPT5_ROLLOUT_PERCENTAGE = '150'
      
      // Tous devraient être GPT-5
      for (let i = 0; i < 10; i++) {
        const model = selectModel('ROUTINE', `req_test_${i}`)
        expect(model).toBe('gpt-5-thinking')
      }
    })
    
    test('RequestId vide → hash cohérent', () => {
      process.env.USE_GPT5_ROUTINE = 'true'
      process.env.GPT5_ROLLOUT_PERCENTAGE = '50'
      
      const model1 = selectModel('ROUTINE', '')
      const model2 = selectModel('ROUTINE', '')
      
      // Même comportement avec requestId vide
      expect(model1).toBe(model2)
    })
  })
})
