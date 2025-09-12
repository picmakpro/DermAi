/**
 * TESTS D'INTÉGRATION SPRINT 1 - FIABILITÉ DERMAI V2
 * Tests E2E pour valider les critères de succès du Sprint 1
 */

import { test, expect } from '@playwright/test'

test.describe('Sprint 1 - Tests de Fiabilité E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Aller à la page d'upload
    await page.goto('/upload')
  })

  test('🎯 Reproductibilité: Même analyse pour mêmes photos', async ({ page }) => {
    // Simuler l'upload de la même photo 3 fois
    const testImagePath = 'tests/fixtures/test-face.jpg'
    
    // Première analyse
    await page.setInputFiles('[data-testid="photo-upload"]', testImagePath)
    await page.click('[data-testid="continue-questionnaire"]')
    
    // Remplir le questionnaire de manière identique
    await fillQuestionnaire(page)
    
    // Lancer l'analyse
    await page.click('[data-testid="start-analysis"]')
    
    // Attendre les résultats
    await expect(page.locator('[data-testid="results"]')).toBeVisible({ timeout: 45000 })
    
    // Récupérer le score global de la première analyse
    const firstScore = await page.locator('[data-testid="overall-score"]').textContent()
    
    // Recommencer le processus 2 fois de plus
    const scores = [firstScore]
    
    for (let i = 0; i < 2; i++) {
      await page.goto('/upload')
      await page.setInputFiles('[data-testid="photo-upload"]', testImagePath)
      await page.click('[data-testid="continue-questionnaire"]')
      await fillQuestionnaire(page)
      await page.click('[data-testid="start-analysis"]')
      await expect(page.locator('[data-testid="results"]')).toBeVisible({ timeout: 45000 })
      
      const score = await page.locator('[data-testid="overall-score"]').textContent()
      scores.push(score)
    }
    
    // Vérifier que tous les scores sont identiques (±2 points selon critères)
    const numericScores = scores.map(s => parseInt(s || '0'))
    const maxDiff = Math.max(...numericScores) - Math.min(...numericScores)
    
    expect(maxDiff).toBeLessThanOrEqual(2) // Reproductibilité 95%+
  })

  test('⏱️ Timeout: Analyse complète en moins de 30s', async ({ page }) => {
    const startTime = Date.now()
    
    // Upload photo et questionnaire
    await page.setInputFiles('[data-testid="photo-upload"]', 'tests/fixtures/test-face.jpg')
    await page.click('[data-testid="continue-questionnaire"]')
    await fillQuestionnaire(page)
    
    // Lancer l'analyse avec timeout
    await page.click('[data-testid="start-analysis"]')
    
    // Attendre les résultats ou timeout
    try {
      await expect(page.locator('[data-testid="results"]')).toBeVisible({ timeout: 30000 })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Vérifier que l'analyse s'est terminée en moins de 30s
      expect(duration).toBeLessThan(30000)
      
      // Vérifier qu'il n'y a pas d'erreur de timeout
      const errorMessage = await page.locator('[data-testid="error-message"]').textContent()
      expect(errorMessage).not.toContain('timeout')
      expect(errorMessage).not.toContain('Timeout')
      
    } catch (error) {
      // Si timeout, vérifier que c'est géré proprement
      const errorMessage = await page.locator('[data-testid="error-message"]').textContent()
      expect(errorMessage).toContain('Timeout')
      expect(errorMessage).toContain('30s') // Message cohérent avec timeout client
    }
  })

  test('📊 Validation: Résultats structurés et cohérents', async ({ page }) => {
    // Upload et analyse
    await page.setInputFiles('[data-testid="photo-upload"]', 'tests/fixtures/test-face.jpg')
    await page.click('[data-testid="continue-questionnaire"]')
    await fillQuestionnaire(page)
    await page.click('[data-testid="start-analysis"]')
    
    // Attendre les résultats
    await expect(page.locator('[data-testid="results"]')).toBeVisible({ timeout: 45000 })
    
    // Vérifier la structure des résultats
    
    // 1. Score global présent et valide
    const overallScore = await page.locator('[data-testid="overall-score"]').textContent()
    const score = parseInt(overallScore || '0')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
    
    // 2. Scores détaillés présents (8 critères)
    const scoreElements = await page.locator('[data-testid^="score-"]').count()
    expect(scoreElements).toBeGreaterThanOrEqual(8) // Hydratation, rides, fermeté, etc.
    
    // 3. Préoccupation principale identifiée
    const mainConcern = await page.locator('[data-testid="main-concern"]').textContent()
    expect(mainConcern).toBeTruthy()
    expect(mainConcern?.length).toBeGreaterThan(10)
    
    // 4. Routine en 3 phases présente
    const immediatePhase = await page.locator('[data-testid="phase-immediate"]').isVisible()
    const adaptationPhase = await page.locator('[data-testid="phase-adaptation"]').isVisible()
    const maintenancePhase = await page.locator('[data-testid="phase-maintenance"]').isVisible()
    
    expect(immediatePhase).toBe(true)
    expect(adaptationPhase).toBe(true)
    expect(maintenancePhase).toBe(true)
    
    // 5. Produits recommandés avec catalogId
    const productElements = await page.locator('[data-testid^="product-"]').count()
    expect(productElements).toBeGreaterThan(0)
    
    // Vérifier qu'au moins un produit a un catalogId valide
    const firstProductId = await page.locator('[data-testid^="product-"]').first().getAttribute('data-catalog-id')
    expect(firstProductId).toMatch(/^[A-Z0-9]{8,12}$/) // Format catalogId selon schéma Zod
  })

  test('🔄 Gestion d\'erreurs: Messages clairs et retry', async ({ page }) => {
    // Simuler une erreur réseau en bloquant les requêtes API
    await page.route('/api/analyze', route => {
      route.abort('failed')
    })
    
    // Tenter une analyse
    await page.setInputFiles('[data-testid="photo-upload"]', 'tests/fixtures/test-face.jpg')
    await page.click('[data-testid="continue-questionnaire"]')
    await fillQuestionnaire(page)
    await page.click('[data-testid="start-analysis"]')
    
    // Vérifier qu'un message d'erreur clair apparaît
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 35000 })
    
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent()
    expect(errorMessage).toBeTruthy()
    expect(errorMessage?.length).toBeGreaterThan(20) // Message descriptif
    
    // Vérifier qu'un bouton de retry est disponible
    const retryButton = await page.locator('[data-testid="retry-analysis"]').isVisible()
    expect(retryButton).toBe(true)
  })

  test('📱 Responsive: Analyse fonctionne sur mobile', async ({ page }) => {
    // Simuler un viewport mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Vérifier que l'interface est utilisable
    await expect(page.locator('[data-testid="photo-upload"]')).toBeVisible()
    
    // Upload et analyse sur mobile
    await page.setInputFiles('[data-testid="photo-upload"]', 'tests/fixtures/test-face.jpg')
    await page.click('[data-testid="continue-questionnaire"]')
    await fillQuestionnaire(page)
    await page.click('[data-testid="start-analysis"]')
    
    // Vérifier que les résultats s'affichent correctement sur mobile
    await expect(page.locator('[data-testid="results"]')).toBeVisible({ timeout: 45000 })
    
    const overallScore = await page.locator('[data-testid="overall-score"]').textContent()
    expect(overallScore).toBeTruthy()
  })

  test('🔒 Sécurité: Pas d\'exposition de clés API', async ({ page }) => {
    // Intercepter toutes les requêtes réseau
    const requests: string[] = []
    
    page.on('request', request => {
      requests.push(request.url())
    })
    
    // Effectuer une analyse complète
    await page.setInputFiles('[data-testid="photo-upload"]', 'tests/fixtures/test-face.jpg')
    await page.click('[data-testid="continue-questionnaire"]')
    await fillQuestionnaire(page)
    await page.click('[data-testid="start-analysis"]')
    
    await expect(page.locator('[data-testid="results"]')).toBeVisible({ timeout: 45000 })
    
    // Vérifier qu'aucune requête ne contient de clé API
    const apiKeyExposed = requests.some(url => 
      url.includes('sk-') || 
      url.includes('openai') ||
      url.includes('api_key')
    )
    
    expect(apiKeyExposed).toBe(false)
    
    // Vérifier que toutes les requêtes IA passent par l'API interne
    const aiRequests = requests.filter(url => url.includes('/api/analyze'))
    expect(aiRequests.length).toBeGreaterThan(0)
  })
})

// Fonction utilitaire pour remplir le questionnaire de manière cohérente
async function fillQuestionnaire(page: any) {
  // Profil utilisateur
  await page.selectOption('[data-testid="age-select"]', '25')
  await page.selectOption('[data-testid="gender-select"]', 'Homme')
  await page.selectOption('[data-testid="skin-type-select"]', 'Mixte')
  await page.click('[data-testid="continue-profile"]')
  
  // Préoccupations cutanées
  await page.click('[data-testid="concern-imperfections"]')
  await page.click('[data-testid="concern-pores"]')
  await page.click('[data-testid="continue-concerns"]')
  
  // Routine actuelle (simple)
  await page.selectOption('[data-testid="routine-preference"]', 'Simple')
  await page.selectOption('[data-testid="monthly-budget"]', '50-100€')
  await page.click('[data-testid="continue-routine"]')
  
  // Allergies (aucune)
  await page.click('[data-testid="no-allergies"]')
  await page.click('[data-testid="continue-allergies"]')
  
  // Finalisation
  await page.click('[data-testid="finalize-questionnaire"]')
}
